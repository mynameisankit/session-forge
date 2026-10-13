# Utilities

Token and password helpers are available separately from the session manager.

## Token utilities

```ts
import { createToken, hashToken } from 'session-forge/utils';
```

### createToken

```ts
createToken(): string
```

Generates 32 cryptographically random bytes using Node's `randomBytes()` and returns a base64url string.

### hashToken

```ts
hashToken(value: string): string
```

Returns a SHA-256 hex digest. Use it for opaque-token storage, not password hashing. Core session methods already hash raw credentials where needed.

## Password utilities

```ts
import { hashPassword, verifyPassword } from 'session-forge/utils/password';
// Also available from 'session-forge/utils'.
```

### hashPassword

```ts
hashPassword(password: string): Promise<string>
```

Uses a random 16-byte salt and Node's scrypt to derive a 64-byte key. Returns `salt:key`, with each part hex encoded.

### verifyPassword

```ts
verifyPassword(password: string, stored: string): Promise<boolean>
```

Accepts hashes produced by `hashPassword()`. Malformed encodings return `false`. Valid encodings are checked using scrypt and `timingSafeEqual()`.

```ts
const stored = await hashPassword('a user-provided password');
const matches = await verifyPassword('a user-provided password', stored);
```

These helpers do not create accounts, enforce password policy, or manage resets. Those flows are application responsibilities.
