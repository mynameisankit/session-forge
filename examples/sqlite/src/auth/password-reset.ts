import type { UUID } from 'node:crypto';
import type { Knex } from 'knex';
import { RESET_TTL } from '../config.js';
import { HttpError } from '../http/error.js';
import { createSessions, createToken, hashToken, hashPassword } from '../session-forge.js';
import type { UserRow } from './user.js';

export function createPasswordReset(db: Knex, origin: string, onResetLink: (link: string) => void) {
  return {
    async request(email: string): Promise<void> {
      const user = await db<UserRow>('users').where('email', email).first();
      if (!user) return;
      const token = createToken();
      await db('password_resets').where('user_id', user.id).delete();
      await db('password_resets').insert({
        token_hash: hashToken(token), user_id: user.id, expires_at: Date.now() + RESET_TTL,
      });
      const link = new URL('/reset', origin);
      link.searchParams.set('token', token);
      onResetLink(link.toString());
    },

    async reset(token: string, password: string): Promise<void> {
      const tokenHash = hashToken(token);
      const passwordHash = await hashPassword(password);
      await db.transaction(async (tx) => {
        const reset = await tx<{ user_id: UUID; expires_at: number }>('password_resets')
          .where('token_hash', tokenHash).where('expires_at', '>', Date.now()).first();
        if (!reset) throw new HttpError(400, 'This link is invalid or has expired. Please request a new one.');
        await tx('users').where('id', reset.user_id).update({ password_hash: passwordHash });
        await tx('password_resets').where('user_id', reset.user_id).delete();
        await createSessions(tx).sessions.revokeAllSessionsForUser(reset.user_id);
      });
    },
  };
}
