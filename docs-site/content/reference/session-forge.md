# SessionForge

```ts
import { SessionForge } from 'session-forge';
```

The core manages refresh sessions. It does not create or verify JWT access tokens. All durations below are in milliseconds.

## Constructor

```ts
new SessionForge({ store, expiryTTL })
```

| Option | Type | Meaning |
| --- | --- | --- |
| `store` | `SessionStore` | Required persistence adapter |
| `expiryTTL` | `number` | Required lifetime for new and replacement tokens |

The constructor assigns these values directly; it does not validate the lifetime. Provide a finite positive lifetime appropriate for your application. There is no default TTL.

## createSession

```ts
createSession(input: {
  userId: UUID;
  sessionName?: string;
}): Promise<string>
```

Creates a family and initial refresh token. Returns the raw refresh-token string, not an object with access and refresh tokens. `UUID` is Node's `node:crypto` UUID type. SQLite defaults a missing session name to an empty string.

## validateRefreshToken

```ts
validateRefreshToken(refreshToken: string): Promise<
  | { status: 'valid'; userId: UUID; familyId: string }
  | { status: 'missing' }
  | { status: 'revoked' }
  | { status: 'consumed' }
  | { status: 'expired' }
>
```

Checks existence, revocation, consumption, and expiration in that order. An invalid expiration string is treated as expired. A consumed token triggers family revocation before returning `consumed`.

## rotateRefreshToken

```ts
rotateRefreshToken(refreshToken: string): Promise<
  | { status: 'rotated'; refreshToken: string; userId: UUID }
  | { status: 'missing' }
  | { status: 'revoked' }
  | { status: 'consumed' }
  | { status: 'expired' }
>
```

Validates first, then generates and stores a replacement with expiration `now + expiryTTL`. Replace the client's credential on success. The current SQLite adapter does not guarantee atomic rotation.

## revokeSession

```ts
revokeSession(familyTokenHash: string): Promise<void>
```

Pass the stable family identifier from `validateRefreshToken().familyId` or a session listing's `tokenHash`. The current source names this parameter `refreshToken`, but forwards it without hashing; SQLite expects the family identifier. Passing a raw token will not select the intended family.

## revokeAllSessionsForUser

```ts
revokeAllSessionsForUser(userId: UUID): Promise<void>
```

Delegates to `store.revokeAllForUser()`. SQLite marks all unrevoked families for the user as revoked. Issued access tokens are unaffected.

## listAllSessionsForUser

```ts
listAllSessionsForUser(userId: UUID): Promise<
  ReadonlyArray<{ tokenHash: string; session_name: string }>
>
```

Returns all retained families, including revoked and expired ones. Note the snake-case `session_name` field.

## listActiveSessionsForUser

```ts
listActiveSessionsForUser(userId: UUID): Promise<
  ReadonlyArray<{ tokenHash: string; sessionName: string }>
>
```

Returns non-revoked families containing an unconsumed, unexpired token. Note the camel-case `sessionName` field.

## pruneExpiredSessions

```ts
pruneExpiredSessions(options?: {
  retentionTTL?: number;
}): Promise<{ deletedFamilies: number; deletedTokens: number }>
```

Defaults to seven days of retention. Invalid retention values throw `RangeError` synchronously. See [cleanup](../guide/cleanup) for eligibility rules.

## Errors and exported types

Database errors propagate as exceptions; status results are validation outcomes, not a complete error channel. The result shapes above describe the implementation; named `ValidationResult` and `RotationResult` aliases are not exported by the root entry point. The root exports `SessionForge` and the `SessionStore` type.
