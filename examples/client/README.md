# Shared example client

One React + TypeScript application for all SessionForge example backends. It owns the auth screens, React Router navigation, Tailwind theme, and shadcn/ui components. It has no database or SessionForge server dependency. The core library remains in the repository's root `src/` directory.

## Run with SQLite

From the repository root, start the backend:

```sh
yarn install
yarn workspace session-forge-example-sqlite dev
```

In another terminal, start the shared client:

```sh
yarn workspace session-forge-example-sqlite dev:client
```

Open http://127.0.0.1:5173. All client modes use the real HTTP backend; there is no mock authentication. `yarn client` and `yarn client:backend` also start this client with the default proxy target. The SQLite command adds its example label and fixes port 5173 to match the backend's default allowed origin.

To select another backend, copy `.env.example` to `.env.local` in this directory and edit:

```dotenv
BACKEND_URL=http://127.0.0.1:4000
VITE_EXAMPLE_NAME=PostgreSQL example
```

Restart Vite after changing configuration. `BACKEND_URL` configures the development proxy; `VITE_EXAMPLE_NAME` is a public label. Don't put secrets in client environment variables.

## How the client works

React Router owns loading, submissions, navigation, and pending state. Route data functions call a configured Axios instance directly; there is no separate auth API interface, endpoint wrapper object, mock selector, or custom async-state hook.

- `/login` and `/register` submit `<Form method="post">` to route actions. Successful actions redirect to `/account`; failed actions return inline feedback.
- The account loader fetches `/api/auth/me` and `/api/sessions`. A 401 redirects to sign-in; other errors reach the route error boundary.
- Session buttons use `fetcher.Form`. Mutations keep the account screen open and React Router automatically reloads its loader data afterward. Logout redirects to sign-in.
- Password actions send JSON to the backend and return redirects or feedback. Confirmation matching is a form check; credential and token validation stay on the server.
- `useNavigation` and `fetcher.state` drive disabled buttons and loading messages. `useActionData` and `fetcher.data` provide feedback. Axios errors are not rewritten; the UI displays the backend's message when supplied, otherwise Axios's error message.
- Cookies are HttpOnly. The client never reads, stores, signs, or rotates tokens. The SQLite backend signs five-minute JWT access tokens and validates SessionForge refresh tokens before renewing expired access tokens. A valid access JWT remains usable until expiry even after its refresh family is revoked.

## HTTP contract

`src/api/http-client.ts` configures Axios with `/api` as its base URL, JSON responses, and cookies enabled. Route actions/loaders use Axios directly. The backend owns credential validation, JWT signing, refresh-session validation/rotation, cookies, origin checks, and authorization. The client has no refresh interceptor; the SQLite backend renews access cookies when needed.

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
| POST | `/api/auth/refresh` | no body | Any 2xx; validate refresh session and renew access JWT |
| POST | `/api/auth/logout` | — | Any 2xx; clear authentication |

Register the `/sessions/others` route before a generic `/sessions/:id` handler if your backend router requires that. An individual session's ID can be your family ID; the UI only uses it as an opaque identifier.

`User` is `{ name: string, email: string }`. `Session` is `{ id: string, device: string, detail: string, current: boolean }`. JSON responses return these objects directly, without a `data` wrapper. Error responses may provide `{ message: string }`, which is displayed inline. Mutation endpoints may return 204 with no body.

Protected route loaders restore the current user through `/api/auth/me` when entering the account or password-change page. A 401 means signed out; connection/server failures remain visible. Registration currently signs the user in, and password changes return to the account screen. Adjust those flows if your backend has different semantics.

## Build and check

```sh
yarn workspace session-forge-example-client typecheck
yarn workspace session-forge-example-client test
yarn workspace session-forge-example-client build
yarn workspace session-forge-example-client preview
```

All builds use HTTP. `build:sqlite` selects the SQLite example label. Public settings are selected at build time. Preview uses the same proxy configuration, but a deployed site needs its host to route `/api` to the backend and serve `index.html` for client-side routes such as `/reset`. Tests use Node's built-in runner and TypeScript stripping (Node 22.18+ or 24+).

## Structure

- `src/App.tsx`: React Router route definitions and their loaders/actions.
- `src/main.tsx`: creates the browser data router and renders `RouterProvider`.
- `src/routes/`: loaders/actions for authentication, account sessions, and password flows.
- `src/pages/`: page markup.
- `src/components/auth/`: layout, router forms, session fetcher forms, and error UI.
- `src/components/ui/`: shared UI controls.
- `src/api/http-client.ts`: Axios configuration.
- `src/types.ts`: backend-independent user and session response shapes.
- `src/styles.css`: Tailwind import and theme tokens.

Future database examples implement the same HTTP contract and reuse this app.
