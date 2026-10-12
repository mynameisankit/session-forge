import { UUID } from 'node:crypto';
import { SessionStore } from './type.js';
import { createToken, getHash } from './utils.js';

interface SessionForgeParams {
  readonly store: SessionStore;
  readonly expiryTTL: number;
}

class InvalidTokenError extends Error {
  constructor(message: string) {
    super(message);

    Object.setPrototypeOf(this, InvalidTokenError.prototype);
  }
}

class RevokedFamilyError extends Error {
  constructor(message: string) {
    super(message);

    Object.setPrototypeOf(this, InvalidTokenError.prototype);
  }
}

class TokenReuseError extends Error {
  constructor(message: string) {
    super(message);

    Object.setPrototypeOf(this, InvalidTokenError.prototype);
  }
}

export class SessionForge {
  readonly store: SessionStore;
  readonly expiryTTL: number;

  constructor({ store, expiryTTL }: SessionForgeParams) {
    this.store = store;
    this.expiryTTL = expiryTTL;
  }

  async createSession(userId: UUID) {
    const refreshToken = createToken();
    const hashedRefreshToken = getHash(refreshToken);

    await this.store.createSession({
      userId,
      tokenHash: hashedRefreshToken,
      expiresAt: this.expiryTTL
    });

    return { refreshToken, userId };
  }

  async refreshSession(refreshToken: UUID) {
    const hashedRefreshToken = getHash(refreshToken);

    const tokenDetails = await this.store.findToken(hashedRefreshToken);

    if (!tokenDetails) {
      throw new InvalidTokenError("Invalid Token");
    }

    const { family, consumedAt } = tokenDetails;

    if (family.revokedAt) {
      throw new RevokedFamilyError("Session Revoked");
    }

    // If already consumed, revoke
    // NOTE: Handle concurrency
    if (consumedAt) {
      await this.store.revokeSession(family.tokenHash);
      throw new TokenReuseError('Token Re-used')
    }

    const newRefreshToken = createToken();
    const hashedNewRefreshToken = getHash(newRefreshToken);

    await this.store.consumeAndReplace({
      oldTokenHash: hashedRefreshToken,
      newTokenHash: hashedNewRefreshToken
    });

    return { refreshToken: newRefreshToken, userId: family.userId };
  }

  revokeSession(sessionToken: UUID) {
  }

  revokeAllSessionsForUser(userId: UUID) {
  }

  listAllSessionsForUser(sessionToken: UUID) {
  }
}