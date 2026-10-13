# Introduction

SessionForge is a TypeScript session-management library for revocable authentication on top of stateless access tokens. It centralizes long-lived refresh-session state while letting API services verify short-lived access tokens locally.

## Two layers of trust

| Layer | Responsibility | Validation |
| --- | --- | --- |
| Access token | Authorize normal API requests | Your JWT or access-token implementation |
| Refresh session | Decide whether authentication may continue | SessionForge and your session store |

An access token says the authentication server trusted a user recently. A refresh token asks whether that trust should continue.

## What the library implements

- Cryptographically random opaque refresh tokens and SHA-256 token hashing.
- Named sessions, refresh-token validation, and token rotation.
- Consumed-token replay detection that revokes the session family.
- Per-family and per-user revocation.
- Active-session listing and retention-based cleanup.
- A SQLite adapter and an explicit schema setup helper.
- Token utilities and scrypt password utilities.

## What your application owns

Your application authenticates users, issues and verifies access tokens, authorizes requests, configures cookies, and handles delivery of password-reset links. SessionForge does not issue JWTs.

::: warning Early implementation
These docs describe the current v0.1.0 source. The README's proposed API and planned adapters are not the implemented contract. The SQLite adapter does not yet provide atomic rotation under concurrent requests. Read [implementation status](./status) before integration.
:::

## Where to start

Follow the [quick start](./getting-started) to configure SQLite and create a session. For a complete local authentication flow, run the [example application](./example).
