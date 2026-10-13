# SQLite example

A local authentication backend using SessionForge, Knex, SQLite, and React Router resource routes. It implements the HTTP contract used by the shared React client in `examples/client`; no UI code is duplicated. Requires Node.js 24+ and Yarn 4.

## Run

From the repository root:

```sh
yarn install
yarn workspace session-forge-example-sqlite dev
```

In another terminal:

```sh
yarn workspace session-forge-example-sqlite dev:client
```

Open http://127.0.0.1:5173 and register an account. The API listens on http://127.0.0.1:3000. The client runs in HTTP mode with the SQLite example label and proxies `/api` to the backend. Accounts and sessions persist in `examples/sqlite/data/sessions.sqlite`.

`dev` builds the core and example, then watches the compiled server. After changing TypeScript source, rerun `yarn workspace session-forge-example-sqlite build` (or restart `dev`). For a plain run after building, use `yarn workspace session-forge-example-sqlite start`.

If `sqlite3` reports a missing native binding, run `yarn rebuild sqlite3` and inspect its build output.

## Flows

- Registration signs in immediately. Passwords use `hashPassword` and `verifyPassword` from `session-forge/utils`; session tokens are stored as SHA-256 hashes.
- Login creates a session. Remember me persists its cookie for 30 days; otherwise it is a browser-session cookie. Both have a 30-day server-side lifetime.
- Login and registration set two HttpOnly, SameSite=Lax cookies: a five-minute HS256 JWT access token and a SessionForge opaque refresh token. JWT signing/verification uses `jose` in the example backend; the core library has no JWT dependency.
- `/api/auth/me` verifies the access JWT without a refresh-session lookup. If the access token is absent, expired, or invalid, the backend calls `SessionForge.validateRefreshToken()` and issues a replacement access JWT. The refresh token and its absolute expiry are preserved. `POST /api/auth/refresh` performs the same renewal explicitly.
- Family revocation blocks renewal. Already-issued access JWTs remain valid until expiry (up to five minutes). Logout clears both cookies in the current browser; password changes and resets revoke refresh sessions but cannot invalidate copies of issued JWTs immediately.
- Session listing calls `SessionForge.listActiveSessionsForUser()`; active filtering is performed by the adapter in one query, and the example only supplies UI labels. Individual revocation checks ownership. Signing out other devices revokes their refresh sessions and preserves the current session; use Sign out to end that session.
- A password change revokes existing sessions and creates a replacement for the current browser, matching the client's account-screen flow.
- Forgot password returns an empty success response for valid email input. For an existing account, the backend terminal prints a development reset link instead of sending email. Links expire after 15 minutes and work once. Resetting a password revokes all the user's sessions.

This is a localhost development example. Terminal reset links replace email delivery, and the adapter's rotation concurrency handling remains unimplemented. Deployed applications need HTTPS, appropriate cookies, rate limiting, and real reset delivery.

## Configuration

Set environment variables on the backend process:

| Variable | Default |
| --- | --- |
| `PORT` | `3000` |
| `DATABASE_PATH` | `examples/sqlite/data/sessions.sqlite` |
| `CLIENT_ORIGIN` | `http://127.0.0.1:5173` |
| `JWT_SECRET` | Random signing key generated per server process |

`JWT_SECRET`, when supplied, must contain at least 32 bytes and stays on the server. Set a stable secret to keep access JWTs verifiable across restarts; otherwise existing valid refresh cookies renew them under the new process key.

`CLIENT_ORIGIN` must match the browser's origin; it is used for mutation-origin checks and reset links. HTTPS origins enable Secure cookies. The server binds to `127.0.0.1`. To change the proxy target or client label, set `BACKEND_URL` and `VITE_EXAMPLE_NAME` in `examples/client/.env.local`, then restart Vite.

## Database setup for library users

The SQLite entry point exports explicit schema setup:

```ts
import knex from 'knex';
import { SessionForge } from 'session-forge';
import { SQLiteSessionStore, createSQLiteSessionTables } from 'session-forge/sqlite';

const db = knex({
  client: 'sqlite3',
  connection: { filename: './sessions.sqlite' },
  useNullAsDefault: true,
  pool: { min: 1, max: 1 },
});

await db.raw('PRAGMA foreign_keys = ON');
await createSQLiteSessionTables(db);
const sessions = new SessionForge({
  store: new SQLiteSessionStore(db),
  expiryTTL: 30 * 24 * 60 * 60 * 1000,
});
// Close the connection with await db.destroy() during shutdown.
```

Run the helper during setup, before serving requests. It creates missing `session_families` and `refresh_tokens` tables and their indexes. Repeating it preserves data; it does not alter existing tables or upgrade older schemas. Applications can call it from their own Knex migration's `up` function. Future schema changes need explicit migrations. `user_id` has no foreign key because user tables belong to the application.

`src/schema.ts` uses the helper and separately creates the example's `users` and `password_resets` tables. Within this repository, `src/session-forge.ts` imports the root package's build output because the core lives at the workspace root; published consumers use the package imports shown above.

## Structure

- `src/app.ts`: composes React Router resource routes and authentication services.
- `src/server.ts`: starts the server and closes resources on shutdown.
- `src/config.ts`: environment settings and expiration durations.
- `src/database.ts`: opens the SQLite connection.
- `src/schema.ts`: creates the example's tables and calls SessionForge's schema helper.
- `src/session-forge.ts`: constructs SessionForge with its SQLite adapter.
- `src/http/`: Node HTTP transport, request parsing, input validation, responses and errors.
- `src/routes/`: React Router loaders/actions that call authentication and session services.
- `src/auth/`: accounts, password hashing/change/reset, session authentication and management, cookies, token hashing and device labels.
- `tests/`: HTTP integration and persistence tests.

## Cleanup

Run session maintenance against the example database:

```sh
yarn workspace session-forge-example-sqlite cleanup
```

The command prints `{ deletedFamilies, deletedTokens }`. It retains inactive sessions for seven days by default; `SESSION_RETENTION_TTL` overrides that period in milliseconds. `DATABASE_PATH` selects the database as with the server. Invoke this command from your own scheduler; the server and library do not start background cleanup timers.

Active families retain their consumed-token history. Revoked families become eligible after the retention period; unrevoked families become eligible only after every token's expiration has passed that period. Unrevoked empty families are retained because they have no retention timestamp. Cleanup does not remove users or application-owned password-reset records.

## Checks

```sh
yarn workspace session-forge-example-sqlite typecheck
yarn workspace session-forge-example-sqlite test
yarn workspace session-forge-example-client test
```

Tests use real SQLite databases. They cover authentication, cookies, session ownership and revocation, password changes, reset-link expiration/reuse, origin checks, JWT issuance/expiry/renewal, and schema persistence. Concurrency guarantees are outside these tests.
