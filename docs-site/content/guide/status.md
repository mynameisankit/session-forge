# Implementation status

This documentation follows the current v0.1.0 implementation in `src/`, including working-tree changes. The repository README also contains proposals; those are not promises of available behavior.

## Available now

| Feature | Current implementation |
| --- | --- |
| Opaque refresh tokens | 32 random bytes encoded as base64url |
| Stored token hashes | SHA-256, hex encoded |
| Validation | Missing, revoked, consumed, and expired checks |
| Rotation | Consume the old token and insert a replacement |
| Replay detection | Consumed-token validation revokes its family |
| Revocation | One family or all families belonging to a user |
| Session listing | All families or only active families |
| Cleanup | Retention-based removal of inactive families and tokens |
| SQLite | Knex-based adapter and table setup helper |
| Password helpers | scrypt hashing and timing-safe comparison |

## Current limits

- **Atomic rotation is not implemented by the SQLite adapter.** Validation and replacement do not provide a concurrency guarantee.
- SQLite session creation inserts the family and its initial token separately.
- Rotation extends the replacement token's expiration by `expiryTTL`. There is no separate absolute family lifetime or idle timeout configuration.
- There is no built-in JWT issuer, access-token TTL option, security-version API, Express middleware, or Fastify/NestJS integration.
- PostgreSQL, MongoDB, Redis, and memory adapters are not included.
- `revokeSession()` forwards its argument directly to the store. Pass the family's `tokenHash` identifier, not a raw refresh token.
- The schema helper creates missing tables; it does not migrate existing table layouts.

The [Policies & Guarantees](./policies-guarantees) page defines the required correctness contract and identifies the current gaps. Configurable reuse policy, structured concurrency-conflict outcomes, and a shared adapter conformance suite remain unresolved or unimplemented.

## Design documents

The repository's `docs/architecture/` and `docs/threat-model.md` contain architectural questions and unresolved decisions. `docs/decisions/` defines the ADR workflow. TODO items and examples in those files do not establish implemented guarantees.
