# Shared example client

One React + TypeScript application for all SessionForge example backends. It owns the auth screens, React Router navigation, Tailwind theme, and shadcn/ui components. It has no database or SessionForge server dependency. The core library remains in the repository's root `src/` directory.

## Run the UI without a backend

From the repository root:

```sh
yarn install
yarn client
```

This starts mock mode, usually at http://127.0.0.1:5173. Mock credentials and sessions exist only in memory. Use `error@example.com` to preview errors or `/reset?token=expired` for an expired reset link. The screen explorer and simulated email link are only available in mock mode. Email verification is not included.

## Connect an example backend

Start your backend separately, then run:

```sh
yarn client:backend
```

Backend mode sends real HTTP requests to `/api`. Vite proxies them to `http://127.0.0.1:3000`, preserving the `/api` prefix. No backend is started by this command; implement it in the example you are working on.

To select another backend, copy `.env.example` to `.env.local` in this directory and edit:

```dotenv
BACKEND_URL=http://127.0.0.1:4000
VITE_EXAMPLE_NAME=PostgreSQL example
```

Restart Vite after changing configuration. `BACKEND_URL` is server-side proxy configuration. `VITE_EXAMPLE_NAME` and `VITE_AUTH_MODE` are public client settings; don't put secrets in them. `dev:backend` uses `.env.backend` to select HTTP mode. You can also set `VITE_AUTH_MODE=http` in `.env.local` for the default development command. HTTP failures never fall back to mock authentication.

## HTTP contract

The default transport sends JSON and includes cookies. The backend owns credential validation, token issuance/rotation, cookie configuration, request-origin/CSRF checks, and authorization. If your example uses browser-managed bearer tokens instead, adapt `src/api/http-auth-api.ts`; no screen needs database-specific changes. Automatic token refresh is not implemented by this client.

| Method | Endpoint | JSON request | Successful response |
| --- | --- | --- | --- |
| GET | `/api/auth/me` | — | `User`, or `null`/401 when signed out |
| POST | `/api/auth/login` | `{ email, password, remember }` | `User`; establish authentication |
| POST | `/api/auth/register` | `{ name, email, password }` | `User`; establish authentication |
| POST | `/api/auth/forgot-password` | `{ email }` | Any 2xx; generic response for account privacy |
| POST | `/api/auth/reset-password` | `{ token, password }` | Any 2xx |
| POST | `/api/auth/change-password` | `{ currentPassword, password }` | Any 2xx |
| GET | `/api/sessions` | — | `Session[]` |
| DELETE | `/api/sessions/others` | — | Any 2xx; preserve the current session |
| DELETE | `/api/sessions/:id` | — | Any 2xx |
| POST | `/api/auth/logout` | — | Any 2xx; clear authentication |

Register the `/sessions/others` route before a generic `/sessions/:id` handler if your backend router requires that. An individual session's ID can be your family ID; the UI only uses it as an opaque identifier.

`User` is `{ name: string, email: string }`. `Session` is `{ id: string, device: string, detail: string, current: boolean }`. JSON responses return these objects directly, without a `data` wrapper. Error responses may provide `{ message: string }`, which is displayed inline. Mutation endpoints may return 204 with no body.

The client restores the current user through `/api/auth/me` on page load. A 401 means signed out; connection/server failures remain visible. Registration currently signs the user in, and password changes return to the account screen. Adjust those flows if your backend has different semantics.

## Build and check

```sh
yarn workspace session-forge-example-client typecheck
yarn workspace session-forge-example-client test
yarn workspace session-forge-example-client build
yarn workspace session-forge-example-client preview
```

Use `build:backend` instead of `build` for an HTTP-mode bundle. Modes and public settings are selected at build time. Preview uses the same proxy configuration, but a deployed site needs its host to route `/api` to the backend and serve `index.html` for client-side routes such as `/reset`. Tests use Node's built-in runner and TypeScript stripping (Node 22.18+ or 24+).

## Structure

- `src/App.tsx`: React Router routes and current user state.
- `src/pages/`: individual screens.
- `src/components/auth/`: shared layout, form, fields, notices, and session list.
- `src/components/ui/`: locally maintained shadcn/ui controls.
- `src/hooks/`: async action state and session loading/actions.
- `src/api/types.ts`: backend-independent client contract.
- `src/api/mock-auth-api.ts`: in-memory UI preview implementation.
- `src/api/http-auth-api.ts`: shared HTTP implementation.
- `src/auth-api.ts`: selects the implementation using client configuration.
- `src/styles.css`: Tailwind import and theme tokens.

Future database examples implement the HTTP contract and reuse this app. They don't need their own copy of the React screens or UI dependencies.
