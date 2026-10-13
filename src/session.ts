import { UUID } from 'node:crypto';
import { SessionStore } from './type.js';
import { createToken, hashToken } from './utils.js';

interface SessionForgeParams {
  readonly store: SessionStore;
  readonly expiryTTL: number;
}

type Status = { status: 'missing' }
  | { status: 'revoked' }
  | { status: 'consumed' }
  | { status: 'expired' };

type RotationResult =
  | { status: 'rotated', refreshToken: string, userId: UUID }
  | Status;

type ValidationResult =
  | { status: 'valid', userId: UUID, familyId: string }
  | Status;

export class SessionForge {
  readonly store: SessionStore;
  readonly expiryTTL: number;

  constructor({ store, expiryTTL }: SessionForgeParams) {
    this.store = store;
    this.expiryTTL = expiryTTL;
  }

  async createSession(input: { userId: UUID, sessionName?: string }) {
    const refreshToken = createToken();
    const hashedRefreshToken = hashToken(refreshToken);

    await this.store.createSession({
      userId: input.userId,
      tokenHash: hashedRefreshToken,
      expiresAt: Date.now() + this.expiryTTL,
      sessionName: input.sessionName
    });

    return refreshToken;
  }

  async validateRefreshToken(refreshToken: string): Promise<ValidationResult> {
    const hashedRefreshToken = hashToken(refreshToken);

    const tokenDetails = await this.store.findToken(hashedRefreshToken);

    if (!tokenDetails) {
      return { status: 'missing' };
    }

    const { family, consumedAt, expiresAt } = tokenDetails;

    if (family.revokedAt !== null) {
      return { status: 'revoked' };
    }

    if (consumedAt !== null) {
      await this.store.revokeSession(family.tokenHash);
      return { status: 'consumed' };
    }

    const expiration = new Date(expiresAt).getTime();
    if (!Number.isFinite(expiration) || expiration <= Date.now()) {
      return { status: 'expired' };
    }

    return { status: 'valid', userId: family.userId, familyId: family.tokenHash };
  }

  async rotateRefreshToken(refreshToken: string): Promise<RotationResult> {
    const validation = await this.validateRefreshToken(refreshToken);

    if (validation.status !== 'valid') return validation;

    const hashedRefreshToken = hashToken(refreshToken);
    const now = Date.now();

    const newRefreshToken = createToken();
    const hashedNewRefreshToken = hashToken(newRefreshToken);

    await this.store.consumeAndReplace({
      oldTokenHash: hashedRefreshToken,
      newTokenHash: hashedNewRefreshToken,
      newExpiresAt: now + this.expiryTTL,
      consumedAt: now
    });

    return { status: 'rotated', refreshToken: newRefreshToken, userId: validation.userId };
  }

  async revokeSession(refreshToken: string) {
    await this.store.revokeSession(refreshToken);
  }

  async revokeAllSessionsForUser(userId: UUID) {
    await this.store.revokeAllForUser(userId);
  }

  async listAllSessionsForUser(userId: UUID) {
    const sessionFamilies = await this.store.findSessionFamilies(userId);
    return sessionFamilies;
  }

  listActiveSessionsForUser(userId: UUID) {
    return this.store.findActiveSessionFamilies(userId);
  }

  pruneExpiredSessions({ retentionTTL = 7 * 24 * 60 * 60 * 1000 }: { retentionTTL?: number } = {}) {
    const inactiveBefore = Date.now() - retentionTTL;
    if (!Number.isSafeInteger(retentionTTL) || retentionTTL < 0
      || !Number.isFinite(new Date(inactiveBefore).getTime())) {
      throw new RangeError('retentionTTL must be a non-negative integer in milliseconds within the supported date range.');
    }
    return this.store.pruneSessionFamilies(inactiveBefore);
  }
}
