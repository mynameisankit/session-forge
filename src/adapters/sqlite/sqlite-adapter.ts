import type { Knex } from 'knex';
import type { SessionStore, RefreshTokenDetails, SessionSummary, PruneResult } from '../../type.js';
import type { UUID } from 'node:crypto';

interface TokenRow {
  token_hash: string;
  family_id: string;
  user_id: UUID;
  revoked_at: number | null;
  session_name: string;
  consumedAt: number | null;
  expiresAt: string;
}

export class SQLiteSessionStore implements SessionStore {
  readonly database: Knex;

  constructor(db: Knex) {
    this.database = db;
  }

  async createSession(input: { userId: UUID; tokenHash: string; expiresAt: number; sessionName?: string }): Promise<void> {
    const expiresAt = new Date(input.expiresAt).toISOString();

    await this.database('session_families').insert({
      token_hash: input.tokenHash,
      user_id: input.userId,
      revoked_at: null,
      session_name: input.sessionName ?? '',
    });

    await this.database('refresh_tokens').insert({
      token_hash: input.tokenHash,
      family_id: input.tokenHash,
      consumedAt: null,
      expiresAt,
    });
  }

  async consumeAndReplace(input: { oldTokenHash: string; newTokenHash: string; newExpiresAt: number; consumedAt: number; }): Promise<void> {
    const token = await this.findToken(input.oldTokenHash);

    if (!token) {
      throw new Error('Cannot replace a missing refresh token');
    }

    const expiresAt = new Date(input.newExpiresAt).toISOString();

    // Eligibility checks belong to the core; atomic rotation is not implemented here yet.
    await this.database('refresh_tokens')
      .where('token_hash', input.oldTokenHash)
      .update({ consumedAt: input.consumedAt });

    await this.database('refresh_tokens').insert({
      token_hash: input.newTokenHash,
      family_id: token.family.tokenHash,
      consumedAt: null,
      expiresAt,
    });
  }

  async findToken(tokenHash: string): Promise<RefreshTokenDetails | null> {
    const row = await this.database('refresh_tokens as t')
      .join('session_families as f', 'f.token_hash', 't.family_id')
      .select(
        't.token_hash',
        't.family_id',
        't.consumedAt',
        't.expiresAt',
        'f.user_id',
        'f.revoked_at',
        'f.session_name',
      )
      .where('t.token_hash', tokenHash)
      .first<TokenRow>();

    if (!row) return null;

    return {
      tokenHash: row.token_hash,
      consumedAt: row.consumedAt,
      expiresAt: row.expiresAt,
      family: {
        tokenHash: row.family_id,
        userId: row.user_id,
        revokedAt: row.revoked_at,
        sessionName: row.session_name,
      },
    };
  }

  async findSessionFamilies(userId: UUID): Promise<ReadonlyArray<{ tokenHash: string; session_name: string; }>> {
    return this.database('session_families')
      .select<Array<{ tokenHash: string; session_name: string }>>(
        'token_hash as tokenHash',
        'session_name',
      )
      .where('user_id', userId);
  }

  async revokeSession(tokenHash: string): Promise<void> {
    await this.database('session_families')
      .where('token_hash', tokenHash)
      .whereNull('revoked_at')
      .update({ revoked_at: Date.now() });
  }

  async findActiveSessionFamilies(userId: UUID): Promise<ReadonlyArray<SessionSummary>> {
    const now = new Date().toISOString();
    return this.database('session_families as f')
      .select<SessionSummary[]>('f.token_hash as tokenHash', 'f.session_name as sessionName')
      .where('f.user_id', userId)
      .whereNull('f.revoked_at')
      .whereExists(query => {
        query.select('t.token_hash')
          .from('refresh_tokens as t')
          .where('t.family_id', this.database.ref('f.token_hash'))
          .whereNull('t.consumedAt')
          .where('t.expiresAt', '>', now);
      });
  }

  async revokeAllForUser(userId: UUID): Promise<void> {
    await this.database('session_families')
      .where('user_id', userId)
      .whereNull('revoked_at')
      .update({ revoked_at: Date.now() });
  }

  async pruneSessionFamilies(inactiveBefore: number): Promise<PruneResult> {
    const expiredBefore = new Date(inactiveBefore).toISOString();
    return this.database.transaction(async tx => {
      const families = await tx('session_families as f')
        .select<{ token_hash: string }[]>('f.token_hash')
        .where(query => {
          query.where('f.revoked_at', '<=', inactiveBefore)
            .orWhere(expired => {
              expired.whereNull('f.revoked_at')
                // Empty families have no timestamp from which retention can be measured.
                .whereExists(tokens => {
                  tokens.select('t.token_hash').from('refresh_tokens as t')
                    .where('t.family_id', tx.ref('f.token_hash'));
                })
                .whereNotExists(tokens => {
                  tokens.select('t.token_hash').from('refresh_tokens as t')
                    .where('t.family_id', tx.ref('f.token_hash'))
                    .where('t.expiresAt', '>', expiredBefore);
                });
            });
        });

      let deletedFamilies = 0;
      let deletedTokens = 0;
      // Bound each statement's parameters for SQLite installations with lower limits.
      for (let offset = 0; offset < families.length; offset += 500) {
        const ids = families.slice(offset, offset + 500).map(family => family.token_hash);
        deletedTokens += await tx('refresh_tokens').whereIn('family_id', ids).delete();
        deletedFamilies += await tx('session_families').whereIn('token_hash', ids).delete();
      }
      return { deletedFamilies, deletedTokens };
    });
  }
}
