# Custom stores

Persistence is separated from session logic through the exported `SessionStore` interface.

```ts
import { SessionForge, type SessionStore } from 'session-forge';

function createSessions(store: SessionStore) {
  return new SessionForge({
    store,
    expiryTTL: 30 * 24 * 60 * 60 * 1000,
  });
}
```

SQLite is the only included adapter. PostgreSQL, MongoDB, Redis, and memory implementations remain outside the current package.

## Preserve family semantics

- Persist the hash supplied to `createSession()`; do not require raw refresh tokens.
- Keep a stable family identifier through token replacements.
- Return token state and family revocation state together from `findToken()`.
- Make family revocation apply to all tokens in that family.
- Keep consumed history for retained families so replay remains detectable.

## Match the current contract

The interface intentionally exposes both `findSessionFamilies()` and `findActiveSessionFamilies()`. Their field names differ: all-family results use `session_name`, while active-family results use `sessionName`.

Expiration enters the store as epoch milliseconds and comes back from `findToken()` as a string parsed by `new Date(expiresAt)`. SQLite uses ISO strings.

## Define concurrency behavior

An adapter should make consume-and-replace atomic if it needs to guarantee a single successful rotation. The current core validates before invoking the store, and `consumeAndReplace()` returns `Promise<void>` with no structured conflict result. Handle ineligible or racing mutations deliberately and document error behavior for your application.

The SQLite adapter is useful as a schema and query reference, but its rotation is not a concurrency-safe template.

## Cleanup invariants

`pruneSessionFamilies(cutoff)` removes families revoked by the cutoff, or unrevoked families whose tokens have all expired by the cutoff. Preserve every token in retained families. Empty unrevoked families have no timestamp from which retention can be measured and are retained by the SQLite implementation.

See the complete [SessionStore reference](../reference/session-store).

## Conformance requirements

An adapter's database mechanism can vary, but its externally observable safety contract must remain consistent. Read [Policies & Guarantees](./policies-guarantees#adapter-conformance-expectations) for the required invariants and proposed shared contract tests. The current interface and tests do not yet establish a conformance certification process.
