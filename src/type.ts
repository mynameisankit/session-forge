import { UUID } from "node:crypto";

interface TokenFamily {
  readonly tokenHash: string;
  readonly userId: UUID;
  readonly revokedAt: string;
}

export interface SessionStore {
  createSession(input: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
  }): void;

  findToken(tokenHash: string): Promise<{ family: TokenFamily, consumedAt: string }>;

  consumeAndReplace(input: { oldTokenHash: string, newTokenHash: string }): void;

  revokeSession(tokenHash: string): Promise<void>;

  revokeAllForUser(userId: string): Promise<void>;
}

