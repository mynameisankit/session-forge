# Token lifecycle

Each session begins with a random opaque token. Rotation replaces the active credential while retaining consumed-token history for replay detection.

## Creation

`createSession()` generates 32 random bytes, encodes them as base64url, and hashes the resulting string with SHA-256. The store receives the hash, user UUID, optional session name, and an expiration of `Date.now() + expiryTTL`.

## Validation

`validateRefreshToken()` hashes the supplied token and checks the stored record in this order:

| Condition | Status | Side effect |
| --- | --- | --- |
| Token not found | `missing` | None |
| Family revoked | `revoked` | None |
| Token already consumed | `consumed` | Revoke its family |
| Invalid or elapsed expiration | `expired` | None |
| All checks pass | `valid` | Return `userId` and `familyId` |

::: warning Validation can mutate state
Validating a consumed refresh token revokes its family. This method is not a read-only token inspection API.
:::

## Rotation

```text
Family A
  R1 [consumed] → R2 [consumed] → R3 [active]
```

`rotateRefreshToken()` first validates the old token, generates a new credential, then calls `consumeAndReplace()`. Success returns `status: 'rotated'`, the raw replacement `refreshToken`, and `userId`.

The replacement expires at the rotation time plus `expiryTTL`. Rotation does not enforce an absolute family lifetime.

If validation fails, rotation returns the same failure status and does not issue a replacement.

## Replay detection

If a previously consumed token is presented again, the family is revoked:

```text
Replay R1 → consumed detected → Family A revoked
                               └─ R3 can no longer renew
```

Keep consumed history for active families. Removing it would turn a known consumed token into a missing record and weaken replay detection. The [cleanup API](./cleanup) preserves that history for retained families.

## Concurrent requests

The current SQLite adapter performs consumption and replacement in separate statements, without a transaction or conditional update that guarantees one winner. Two concurrent calls may both validate the same credential before replacement occurs.

Applications must not rely on this adapter for atomic rotation guarantees. Custom adapters need an explicit concurrency policy; the current core/store contract does not specify a structured race-conflict status. Serializing refresh requests on the client can reduce accidental overlap but does not provide a server-side concurrency guarantee.

See [Policies & Guarantees](./policies-guarantees) for at-most-once consumption, atomic rotation, revocation ordering, successor uniqueness, and failure atomicity. A losing concurrent request does not itself establish credential theft; how to respond is a separate policy decision.
