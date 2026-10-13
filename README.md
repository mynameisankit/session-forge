# SessionForge

<p align="center">
  <img src="assets/sessionforge-logo.png" alt="SessionForge logo: interlocking links surrounded by rotation arrows" width="640" />
</p>

A lightweight session-management library for building **revocable authentication on top of stateless access tokens**.

SessionForge lets your application use short-lived JWT access tokens across distributed services while maintaining centralized control over long-lived refresh sessions.

It is designed around a simple idea:

> Access tokens prove that the authentication server trusted a user recently.  
> Refresh tokens ask the authentication server whether that trust should continue.

---

## Why SessionForge?

JWT access tokens are convenient in distributed systems because any service can validate them without contacting a central session store.

```text
                         ┌─────────────┐
                         │ Auth Server │
                         └──────┬──────┘
                                │
                          Access Token
                                │
              ┌─────────────────┼─────────────────┐
              ▼                 ▼                 ▼
         API Server A      API Server B      API Server C
              │                 │                 │
              └──── Validate JWT locally ────────┘
```

But fully stateless authentication introduces an important problem:

**How do you revoke a user's session?**

Consider:

- A user changes their password.
- A laptop is stolen.
- A refresh token is compromised.
- The user clicks "Log out of all devices".
- An administrator disables an account.

If an access token is completely self-contained, every API server will continue accepting it until it expires.

SessionForge solves this by separating authentication into two layers:

```text
Access Token
Short-lived
Stateless
Validated locally by services

        +

Refresh Session
Long-lived
Stateful
Validated by the authentication service
```

This keeps normal API requests decentralized while preserving a central point for session revocation.

---

# Architecture

```text
                            ┌────────────────────┐
                            │    Auth Server     │
                            │                    │
                            │  SessionForge      │
                            │        │           │
                            │        ▼           │
                            │ Refresh Session DB │
                            └─────────┬──────────┘
                                      │
                             refresh / rotate
                                      │
                                      ▼

┌────────────┐               ┌──────────────────┐
│   Client   │──────────────▶│   Auth Server    │
└─────┬──────┘ refresh token └──────────────────┘
      │
      │ access token
      │
      ├───────────────────┐
      ▼                   ▼
┌──────────────┐    ┌──────────────┐
│ API Server A │    │ API Server B │
└──────────────┘    └──────────────┘
      │                   │
      └── JWT validation ─┘
          without DB access
```

API services do not need to query SessionForge for every request.

Only operations involving the long-lived session state go through the authentication service.

---

# Core Concepts

## Access Tokens

Access tokens should be:

- short-lived
- cryptographically signed
- independently verifiable
- used for normal API authorization

Example payload:

```json
{
    "sub": "user_123",
    "roles": ["user"],
    "iat": 1790836200,
    "exp": 1790836800
}
```

A service can validate this token using the issuer's public key without querying the session database.

Typical lifetime:

```text
5–15 minutes
```

SessionForge intentionally does **not** require every API request to perform a session-store lookup.

---

## Refresh Sessions

Refresh tokens represent long-lived authenticated sessions.

Unlike access tokens, refresh tokens are backed by server-side state.

Example session:

```text
session_id:       ses_a8f21
user_id:          user_123
token_hash:       7680a...
family_id:        fam_81c93
created_at:       2026-10-01T07:10:00Z
expires_at:       2026-11-01T07:10:00Z
revoked_at:       null
device_name:      Chrome on macOS
```

A single user may have several refresh sessions:

```text
user_123

├── MacBook
│   └── session_1
│
├── iPhone
│   └── session_2
│
└── Work Laptop
    └── session_3
```

This allows individual devices to be revoked without logging the user out everywhere.

---

# Refresh Token Rotation

SessionForge supports refresh-token rotation.

Instead of issuing one long-lived refresh token:

```text
R1 ─────────────────────────────────────▶
```

each successful refresh replaces the previous token:

```text
R1
 │
 │ refresh
 ▼
R2
 │
 │ refresh
 ▼
R3
 │
 │ refresh
 ▼
R4
```

Once `R1` is exchanged for `R2`, `R1` becomes invalid.

```text
R1 → consumed
R2 → active
```

This significantly reduces the usefulness of a stolen refresh token.

---

# Refresh Token Reuse Detection

Rotation also makes token theft detectable.

Consider this sequence:

```text
Legitimate client:

R1
 │
 ▼
R2
 │
 ▼
R3
```

An attacker previously stole `R2`.

Later:

```text
Attacker
   │
   │ R2
   ▼
Auth Server
   │
   └── R2 has already been consumed
```

This indicates that two parties may possess tokens from the same refresh-token family.

SessionForge can respond by revoking the entire family:

```text
family_123

R1 → revoked
R2 → revoked
R3 → revoked
R4 → revoked
```

The legitimate user must authenticate again.

---

# Password Changes

Password changes often need to invalidate existing login sessions.

SessionForge supports global session invalidation:

```ts
await sessions.revokeAllForUser(userId);
```

Conceptually:

```text
Before password change

user_123
├── MacBook       ✅
├── iPhone        ✅
└── Work Laptop   ✅


Password changed


user_123
├── MacBook       ❌
├── iPhone        ❌
└── Work Laptop   ❌
```

Existing access tokens may remain valid until their short expiration time.

For example:

```text
12:00   Access token issued
12:05   Password changed
12:10   Access token expires
```

Between `12:05` and `12:10`, the existing JWT may still be accepted by API servers.

This is intentional.

It preserves stateless access-token validation while limiting the maximum revocation delay to the access token's TTL.

---

# Immediate Revocation

Applications that require immediate access-token invalidation can optionally introduce additional state.

Possible strategies include:

- token denylist
- user security version
- Redis-backed session checks
- token introspection

For example:

```text
API Request
    │
    ▼
Validate JWT signature
    │
    ▼
Check security version
    │
    ▼
Allow / Deny
```

This provides stronger revocation guarantees but introduces a centralized dependency into the request path.

SessionForge treats this as an explicit architectural tradeoff rather than hiding it.

---

# Security Version

SessionForge can optionally maintain a user-level security version.

```text
users

id          security_version
----------------------------
user_123    7
```

Authentication state can be associated with version `7`.

After a security-sensitive operation:

```text
7 → 8
```

Anything associated with the previous version becomes invalid.

Useful events include:

- password changes
- account recovery
- suspected account compromise
- administrator-forced logout
- MFA reset

Example:

```ts
await sessions.bumpSecurityVersion(userId);
```

---

# Token Storage

Raw refresh tokens should not be stored directly in the database.

SessionForge stores a cryptographic hash instead.

```text
Client

refresh_token =
"9df8b0a4c9..."
        │
        ▼
      SHA-256
        │
        ▼
"72a19fcf..."
        │
        ▼
Database
```

A database leak therefore does not directly expose usable refresh tokens.

---

# Example Flow

## Login

```text
Client
  │
  │ email + password
  ▼
Auth Server
  │
  ├── authenticate user
  ├── create refresh session
  ├── issue refresh token
  └── issue access token
```

Response:

```json
{
    "accessToken": "eyJhbGciOi...",
    "refreshToken": "d4fa8a..."
}
```

---

## API Request

```text
Client
  │
  │ Authorization: Bearer <access-token>
  ▼
API Server
  │
  ├── verify signature
  ├── validate expiry
  ├── validate issuer
  └── authorize request
```

No SessionForge database lookup is required.

---

## Refresh

```text
Client
  │
  │ refresh token R1
  ▼
Auth Server
  │
  ├── hash R1
  ├── find session
  ├── validate session
  ├── consume R1
  ├── generate R2
  ├── persist R2 hash
  └── issue new access token
```

Result:

```text
R1 ❌

R2 ✅
```

---

## Logout

Logout revokes the current refresh session.

```ts
await sessions.revoke(sessionId);
```

The user cannot obtain new access tokens from that session.

---

## Logout All Devices

```ts
await sessions.revokeAllForUser(userId);
```

All refresh sessions belonging to the user become invalid.

---

# Proposed API

```ts
import { SessionForge } from "@sessionforge/core";

const sessions = new SessionForge({
    store,
    accessTokenTTL: "10m",
    refreshTokenTTL: "30d",
});
```

### Create a session

```ts
const session = await sessions.create({
    userId: "user_123",
    metadata: {
        device: "Chrome on macOS",
        ip: "203.0.113.10",
    },
});
```

Returns:

```ts
{
    (sessionId, accessToken, refreshToken);
}
```

---

### Rotate a refresh token

```ts
const result = await sessions.refresh(refreshToken);
```

Returns:

```ts
{
    (accessToken, refreshToken);
}
```

The previous refresh token is automatically invalidated.

---

### Revoke one session

```ts
await sessions.revoke(sessionId);
```

---

### Revoke all user sessions

```ts
await sessions.revokeAllForUser(userId);
```

---

### List active sessions

```ts
const sessions = await sessionManager.listForUser(userId);
```

Example:

```json
[
    {
        "id": "ses_123",
        "device": "Chrome on macOS",
        "createdAt": "2026-09-28T12:00:00Z",
        "lastUsedAt": "2026-10-01T07:00:00Z"
    },
    {
        "id": "ses_456",
        "device": "iPhone",
        "createdAt": "2026-09-21T09:30:00Z",
        "lastUsedAt": "2026-10-01T06:42:00Z"
    }
]
```

---

# Storage Adapters

SessionForge is intended to keep persistence separate from session semantics.

Possible adapters:

```text
@sessionforge/memory
@sessionforge/postgres
@sessionforge/redis
@sessionforge/sqlite
```

Interface:

```ts
interface SessionStore {
    create(session: Session): Promise<void>;

    findByTokenHash(tokenHash: string): Promise<Session | null>;

    rotate(sessionId: string, newTokenHash: string): Promise<void>;

    revoke(sessionId: string): Promise<void>;

    revokeAllForUser(userId: string): Promise<void>;
}
```

Applications can also implement their own adapters.

---

# Example Database Schema

```sql
CREATE TABLE refresh_sessions (
    id TEXT PRIMARY KEY,

    user_id TEXT NOT NULL,

    family_id TEXT NOT NULL,

    token_hash TEXT NOT NULL UNIQUE,

    created_at TIMESTAMP NOT NULL,

    expires_at TIMESTAMP NOT NULL,

    last_used_at TIMESTAMP,

    consumed_at TIMESTAMP,

    revoked_at TIMESTAMP,

    device_name TEXT,

    ip_address TEXT
);
```

Recommended indexes:

```sql
CREATE INDEX idx_sessions_user_id
ON refresh_sessions(user_id);

CREATE INDEX idx_sessions_family_id
ON refresh_sessions(family_id);

CREATE UNIQUE INDEX idx_sessions_token_hash
ON refresh_sessions(token_hash);
```

---

# Threat Model

SessionForge aims to mitigate several common session-management threats.

| Threat                         | Mitigation                      |
| ------------------------------ | ------------------------------- |
| Database leak                  | Refresh tokens stored as hashes |
| Stolen refresh token           | Token rotation                  |
| Replayed refresh token         | Reuse detection                 |
| Lost device                    | Per-session revocation          |
| Password compromise            | Global user revocation          |
| Long-lived stolen JWT          | Short access-token TTL          |
| Multi-device sessions          | Independent refresh sessions    |
| Refresh replay across services | Refresh handled centrally       |

SessionForge does **not** attempt to replace:

- password hashing
- MFA
- OAuth/OIDC providers
- application authorization
- CSRF protection
- secure cookie configuration
- TLS
- secret management

It focuses specifically on **session lifecycle and token revocation**.

---

# Design Principles

### Stateless where it matters

Normal API traffic should not require a central authentication database.

### Stateful where it matters

Long-lived credentials need revocation and compromise detection.

### Explicit security tradeoffs

Immediate JWT revocation requires coordination.

SessionForge should expose that tradeoff rather than pretending stateless JWTs provide instant revocation.

### Refresh tokens are sessions

A refresh token should not be treated as merely "a JWT that lives longer".

It represents persistent authentication state.

### Compromise should be detectable

Refresh-token rotation should make replay observable.

---

# What SessionForge Is Not

SessionForge is not another JWT encoding library.

Libraries already exist for:

```text
sign(jwt)
verify(jwt)
decode(jwt)
```

The interesting problem starts after that:

```text
How do I revoke sessions?

How do I support multiple devices?

What happens after password reset?

How do I rotate refresh tokens safely?

How do I detect stolen refresh tokens?

How do I invalidate every session belonging to a user?

How do I retain decentralized access-token validation?
```

Those are the problems SessionForge aims to solve.

---

# Planned Features

- [ ] Refresh-session persistence
- [ ] Cryptographically secure refresh tokens
- [ ] Hashed token storage
- [ ] Refresh-token rotation
- [ ] Refresh-token reuse detection
- [ ] Refresh-token families
- [ ] Per-device session revocation
- [ ] Revoke all sessions for a user
- [ ] Session expiration
- [ ] Absolute session lifetime
- [ ] Idle session timeout
- [ ] Security-version support
- [ ] Session metadata
- [ ] Active-device listing
- [ ] PostgreSQL adapter
- [ ] Redis adapter
- [ ] SQLite adapter
- [ ] In-memory adapter
- [ ] Express middleware
- [ ] Fastify integration
- [ ] NestJS integration
- [ ] Example distributed application

---

# Future Exploration

Some questions this project intends to explore:

### Should refresh tokens be JWTs?

Usually they do not need to be.

Opaque random credentials are often simpler because the authentication server must query session state anyway.

---

### Should every refresh create a database row?

Different rotation models have different tradeoffs.

SessionForge will explore:

```text
mutable session record

vs

immutable token chain

vs

token-family model
```

---

### How should concurrent refresh requests behave?

Consider:

```text
Browser tab A ── R5 ──▶ Auth
Browser tab B ── R5 ──▶ Auth
```

Only one request should normally succeed.

Handling this correctly requires atomic session rotation.

---

### How should distributed auth servers coordinate?

If several authentication servers exist:

```text
Auth A
Auth B
Auth C
```

they must agree on refresh-session state.

SessionForge will explore implementations using:

- relational databases
- Redis
- optimistic locking
- transactions
- compare-and-swap semantics

---

### Can session revocation remain scalable?

The goal is not to eliminate state.

The goal is to place state at the correct boundary:

```text
Millions of API requests
        │
        ▼
Stateless JWT verification


Occasional token refresh
        │
        ▼
Central session validation
```

---

# Example Project Structure

```text
sessionforge/
│
├── packages/
│   ├── core/
│   │   ├── session-manager.ts
│   │   ├── token-generator.ts
│   │   ├── token-hasher.ts
│   │   ├── rotation.ts
│   │   └── errors.ts
│   │
│   ├── store-memory/
│   ├── store-sqlite/
│   ├── store-postgres/
│   └── store-redis/
│
├── examples/
│   ├── express/
│   └── distributed-api/
│
├── tests/
│
└── README.md
```

---

# The Main Idea

SessionForge is built around one architectural distinction:

```text
ACCESS TOKEN

"Auth trusted this user recently."

       ↓

Can be verified locally.
Short lifetime.
Optimized for distributed APIs.
```

versus:

```text
REFRESH TOKEN

"Should Auth continue trusting this session?"

       ↓

Requires centralized validation.
Long lifetime.
Revocable.
Rotatable.
Auditable.
```

That distinction allows distributed systems to get most of the benefits of stateless authentication without giving up control over long-lived sessions.

---

## Example client

The auth screens are shared across database examples in [`examples/client`](examples/client/README.md).

```sh
yarn install
yarn client          # Shared client; start an example backend separately
yarn client:backend  # Alias for the shared HTTP client
```

The [SQLite example](examples/sqlite/README.md) implements the shared client's authentication and session API using Knex and SQLite. Run `yarn workspace session-forge-example-sqlite dev` and, in another terminal, `yarn workspace session-forge-example-sqlite dev:client`. The example documents database setup with `createSQLiteSessionTables`, configuration, and password-reset links.

---


## Session cleanup

Run cleanup explicitly from your application or scheduled job:

```ts
const result = await sessions.pruneExpiredSessions(); // Seven days of retention.
// { deletedFamilies: number, deletedTokens: number }

await sessions.pruneExpiredSessions({ retentionTTL: 30 * 24 * 60 * 60 * 1000 });
```

`retentionTTL` is a non-negative integer in milliseconds. A family is eligible when its revocation timestamp is at or before the cutoff, or, if unrevoked, every token has expired at or before the cutoff. Entire families and their token histories are deleted together. Consumed tokens in families with newer unexpired tokens are preserved for reuse detection. Empty unrevoked families are retained because the current schema has no timestamp for measuring their retention.

The SQLite adapter deletes tokens and families in one transaction. Repeating cleanup safely returns zero counts when nothing is eligible. A retention of zero removes eligible families without an additional grace period. Cleanup never runs automatically and is not required for expiration or revocation enforcement. Custom adapters must implement `pruneSessionFamilies(inactiveBefore)` with these same guarantees.

## Shared utilities

Node.js applications can import shared token and password utilities:

```ts
import { createToken, hashToken, hashPassword, verifyPassword } from 'session-forge/utils';

const token = createToken();
const tokenHash = hashToken(token);

const storedHash = await hashPassword(password);
const matches = await verifyPassword(password, storedHash);
```

`createToken` generates 32 random bytes encoded as base64url. `hashToken` hashes opaque tokens with SHA-256. Password functions use Node's scrypt with a random salt and constant-time key comparison. Store the complete returned string; verification accepts that format and returns false for malformed hashes. Password policy and authentication flows remain the application's responsibility.

SessionForge also provides `validateRefreshToken(token)` for issuing fresh JWT access tokens without rotating the refresh token, and `listActiveSessionsForUser(userId)` for sessions with an unrevoked family and an unconsumed, unexpired refresh token. JWT signing stays in your application.

## Status

🚧 **Experimental / Work in progress**

This project is being built primarily as an exploration of authentication architecture, session invalidation, refresh-token rotation, and distributed-system tradeoffs.

The API is expected to change significantly while the project evolves.

---

## Contributing

Ideas, issues, security discussions, and implementation suggestions are welcome.

In particular, contributions around the following areas are useful:

- refresh-token rotation
- concurrency handling
- token-family algorithms
- distributed session storage
- OAuth/OIDC compatibility
- session-revocation semantics
- security testing

---

## License

MIT
