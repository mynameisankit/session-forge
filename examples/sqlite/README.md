# SQLite example

This workspace is reserved for the SQLite backend and SessionForge integration. The backend is not implemented yet. The reusable React auth UI now lives in `examples/client`.

From the repository root, preview the shared UI without a backend:

```sh
yarn install
yarn client
```

Once your SQLite backend is running on `http://127.0.0.1:3000`, start the shared client in HTTP mode:

```sh
yarn workspace session-forge-example-sqlite dev:client
```

That command starts only the shared frontend. It does not start or implement a backend. `/api` requests are proxied to the backend; use `examples/client/.env.local` to change the target or example name.

See [the shared client documentation](../client/README.md) for the HTTP contract, configuration, and build commands. Keep SQLite-specific routes, database initialization, and adapter work in this workspace. The core library remains in the root `src/` directory.
