# SessionStore

```ts
import type { SessionStore } from 'session-forge';
```

Implement this interface to supply persistence. The following expands nested shapes for clarity and mirrors `src/type.ts`.

## Session creation

```ts
createSession(input: {
  userId: UUID;
  tokenHash: string;
  expiresAt: number;
  sessionName?: string;
}): Promise<void>;
```

Persist the initial hash and session family. `expiresAt` is an epoch timestamp in milliseconds.

## Token lookup

```ts
findToken(tokenHash: string): Promise<{
  readonly tokenHash: string;
  readonly consumedAt: number | null;
  readonly expiresAt: string;
  readonly family: {
    readonly tokenHash: string;
    readonly userId: UUID;
    readonly revokedAt: number | null;
    readonly sessionName: string;
  };
} | null>;
```

Return `null` for a missing token. The family `tokenHash` is stable across rotation. The expiration string must be parseable by `new Date()`; SQLite uses ISO format.

## Token replacement

```ts
consumeAndReplace(input: {
  oldTokenHash: string;
  newTokenHash: string;
  newExpiresAt: number;
  consumedAt: number;
}): Promise<void>;
```

Mark the previous token consumed and persist the replacement in the same family. Input timestamps are milliseconds. The interface does not specify a structured concurrency-conflict result.

## Revocation

```ts
revokeSession(tokenHash: string): Promise<void>;
revokeAllForUser(userId: UUID): Promise<void>;
```

The first method takes a family identifier. Revocation must apply to all tokens in that family. SQLite records a millisecond timestamp and leaves already-revoked rows unchanged.

## Session queries

```ts
findSessionFamilies(userId: UUID): Promise<
  ReadonlyArray<{ tokenHash: string; session_name: string }>
>;

findActiveSessionFamilies(userId: UUID): Promise<
  ReadonlyArray<{ readonly tokenHash: string; readonly sessionName: string }>
>;
```

Active means the family is not revoked and has an unconsumed, unexpired token. Keep the field-name difference when implementing the current interface.

## Pruning

```ts
pruneSessionFamilies(inactiveBefore: number): Promise<{
  readonly deletedFamilies: number;
  readonly deletedTokens: number;
}>;
```

Delete families revoked by the cutoff, or unrevoked families whose tokens have all expired by the cutoff. Preserve entire histories for retained families. The cutoff is epoch milliseconds; the core subtracts the retention duration before calling this method.

The root entry point exports `SessionStore`, but not the individual `RefreshTokenDetails`, `SessionSummary`, or `PruneResult` names from `src/type.ts`.
