# Example application

The repository includes a SQLite authentication backend and a shared React client. It demonstrates account registration, login, access-token renewal, session management, and password changes/reset.

## Run locally

Requires Node.js 24+ and Yarn 4. From the repository root:

```sh
yarn install
yarn workspace session-forge-example-sqlite dev
```

In another terminal:

```sh
yarn workspace session-forge-example-sqlite dev:client
```

Open `http://127.0.0.1:5173`. The API listens on `http://127.0.0.1:3000`, and SQLite data persists in `examples/sqlite/data/sessions.sqlite`.

The backend command builds and watches the compiled server. After editing TypeScript, rebuild the example or restart `dev`. If SQLite's native binding is missing, run `yarn rebuild sqlite3` and inspect its output.

## Authentication flow

- Registration signs in immediately; login creates a named refresh session.
- Two HttpOnly, SameSite=Lax cookies carry the access JWT and opaque refresh token.
- Access JWTs use `jose` and last five minutes. Refresh sessions have a 30-day server-side lifetime.
- `/api/auth/me` verifies the JWT locally. If it needs renewal, the backend validates the refresh token and issues a new JWT.
- `POST /api/auth/refresh` performs the same renewal explicitly.

::: info Validation versus rotation
This example renews access tokens using `validateRefreshToken()`. It preserves the refresh credential and its expiration; it does not demonstrate automatic refresh-token rotation on each renewal.
:::

## Sessions and passwords

Active-session listing uses the adapter's filtering query. Individual revocation checks ownership. Signing out other devices preserves the current session. Password changes revoke existing sessions and create a replacement for the current browser; password resets revoke all sessions.

Forgot password returns an empty success response for valid email input. Existing accounts receive a development reset link printed to the backend terminal. These links expire after 15 minutes and work once. This example does not deliver email.

## Configuration

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `3000` | Backend port |
| `DATABASE_PATH` | `examples/sqlite/data/sessions.sqlite` | Persistent database |
| `CLIENT_ORIGIN` | `http://127.0.0.1:5173` | Mutation origin checks and reset links |
| `JWT_SECRET` | Random key per server process | Access JWT signing key |

A supplied `JWT_SECRET` must contain at least 32 bytes. A stable key keeps JWTs verifiable across restarts. HTTPS origins enable Secure cookies. The server binds to `127.0.0.1`.

Set `BACKEND_URL` or `VITE_EXAMPLE_NAME` in `examples/client/.env.local` to change the client proxy target or example label, then restart Vite.

## Verification

```sh
yarn workspace session-forge-example-sqlite typecheck
yarn workspace session-forge-example-sqlite test
yarn workspace session-forge-example-client test
```

This is a local development example. A deployed application needs its own production credential transport, abuse controls, reset delivery, and concurrency design.
