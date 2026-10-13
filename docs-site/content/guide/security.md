# Revocation & security

Refresh-session revocation and access-token validity are separate concerns. Design your authentication flow around that boundary.

## Revoke one device

List the user's active families and pass the chosen family's identifier:

```ts
const families = await sessions.listActiveSessionsForUser(userId);
const chosen = families[0];

if (chosen) {
  await sessions.revokeSession(chosen.tokenHash);
}
```

Verify that the requested family belongs to the authenticated user before revoking it through an HTTP endpoint. SessionForge does not enforce endpoint authorization.

::: info Identifier semantics
Despite the parameter name `refreshToken` in the current method source, `revokeSession()` forwards its value directly to the store. SQLite expects the stable family `tokenHash`, not a raw refresh credential or the hash of an arbitrary rotated token. A successful validation also returns this identifier as `familyId`.
:::

## Revoke every device

```ts
await sessions.revokeAllSessionsForUser(userId);
```

Use this after password reset, account recovery, or administrative logout when your application requires global renewal invalidation. Your application owns when to trigger it.

## Access tokens after revocation

Already-issued access JWTs can still pass local verification until their expiration. In the SQLite example, access tokens last five minutes; the core library does not set this duration.

Logout also needs to clear the current client's credentials. Revoking server-side refresh state alone does not remove cookies from a browser.

## Credentials and storage

The library stores token hashes rather than raw tokens. Raw refresh tokens still require secure transport and client handling. Passwords use the separate scrypt helpers; `hashToken()` is not a password-hashing function.

TLS, cookie policy, CSRF/origin checks, rate limits, account authentication, authorization, and reset delivery belong to the application. See the [example](./example) for the repository's local development flow.

## Implementation boundaries

The current SQLite adapter does not implement atomic rotation. There is no security-version mechanism in the core, even though the README discusses it as a possible design. See [implementation status](./status) for the full boundary.
