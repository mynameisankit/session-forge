# Architecture

SessionForge puts centralized state at the refresh boundary. Ordinary API traffic can continue using local access-token verification.

## Request boundaries

```text
Client ── access token ──→ API services
                          └─ verify locally

Client ── refresh token ─→ Authentication service
                          ├─ SessionForge
                          ├─ SessionStore / SQLite
                          └─ application access-token issuer
```

The core hashes incoming refresh credentials, asks the store for token and family state, validates eligibility, and delegates mutations to the store.

## Token families

A family represents one named login session. Rotation adds token history to the same family. Revocation changes family state, invalidating every token in that family for future refresh validation.

In SQLite, the family identifier is the SHA-256 hash of the **initial** refresh token. It stays the same as subsequent tokens rotate.

| Table | Purpose |
| --- | --- |
| `session_families` | User UUID, stable family identifier, name, revocation timestamp |
| `refresh_tokens` | Individual token hashes, family references, consumption and expiration |

The raw refresh token is returned to your application and is never written to these tables by the library.

## Application responsibilities

SessionForge does not authenticate passwords or issue access tokens as part of creating a session. Your application combines those actions:

1. Verify the user's credentials.
2. Create a refresh session.
3. Issue an access token using your chosen issuer.
4. Deliver the credentials to the client.
5. Validate access tokens at your API boundary.
6. Use SessionForge when authentication needs renewal.

The included [example](./example) demonstrates this split using `jose` for JWTs and SQLite for refresh sessions.

## Revocation latency

Revoking a refresh family blocks future renewal. It cannot recall an already-issued, self-contained JWT. Immediate access-token invalidation requires an additional application mechanism such as a denylist or introspection, adding state to the request path.

Choose your own access-token lifetime based on the revocation delay your application can tolerate. SessionForge has no access-token lifetime setting.
