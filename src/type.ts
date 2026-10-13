import { UUID } from "node:crypto";

interface TokenFamily {
  readonly tokenHash: string;
  readonly userId: UUID;
  readonly revokedAt: number | null;
  readonly sessionName: string;
}

export interface RefreshTokenDetails {
  readonly tokenHash: string;
  readonly family: TokenFamily;
  readonly consumedAt: number | null;
  readonly expiresAt: string;
}

export interface SessionSummary {
  readonly tokenHash: string;
  readonly sessionName: string;
}

export interface PruneResult {
  readonly deletedFamilies: number;
  readonly deletedTokens: number;
}

export interface SessionStore {
  createSession(input: {
    userId: UUID;
    tokenHash: string;
    expiresAt: number;
    sessionName?: string;
  }): Promise<void>;

  findToken(tokenHash: string): Promise<RefreshTokenDetails | null>;

  consumeAndReplace(input: { oldTokenHash: string, newTokenHash: string, newExpiresAt: number, consumedAt: number }): Promise<void>;

  revokeSession(tokenHash: string): Promise<void>;

  revokeAllForUser(userId: UUID): Promise<void>;

  findSessionFamilies(userId: UUID): Promise<ReadonlyArray<{ tokenHash: string, session_name: string }>>;

  findActiveSessionFamilies(userId: UUID): Promise<ReadonlyArray<SessionSummary>>;

  pruneSessionFamilies(inactiveBefore: number): Promise<PruneResult>;
}

