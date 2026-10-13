# Quick start

Set up a persistent refresh-session store and create your first session.

## 1. Prepare the library

For this repository, use Node.js 24+ and Yarn 4:

```sh
git clone https://github.com/mynameisankit/session-forge.git
cd session-forge
yarn install
yarn build
```

The package name is `session-forge`. Public entry points are `session-forge`, `session-forge/sqlite`, `session-forge/utils`, and `session-forge/utils/password`. Package-registry availability is not established by this repository; the commands above build the local source.

## 2. Initialize SQLite

SQLite support uses the optional `knex` and `sqlite3` peer dependencies, already included in this repository's development dependencies. Consumers using this adapter must provide them.

```ts
import knex from 'knex';
import { SessionForge } from 'session-forge';
import {
  SQLiteSessionStore,
  createSQLiteSessionTables,
} from 'session-forge/sqlite';

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
```

`expiryTTL` is measured in **milliseconds**, not a duration string. Initialize tables before serving requests. Close the connection with `await db.destroy()` during application shutdown.

## 3. Create a session

After your application authenticates a user:

```ts
import { randomUUID } from 'node:crypto';

// In an application, use the authenticated user's existing UUID.
const userId = randomUUID();

const refreshToken = await sessions.createSession({
  userId,
  sessionName: 'Chrome on macOS',
});
```

The return value is the **raw refresh-token string**. Only its hash is stored. Deliver the raw token through your application's secure credential transport; do not log it.

## 4. Rotate the token

```ts
const result = await sessions.rotateRefreshToken(refreshToken);

if (result.status === 'rotated') {
  // Replace the client's previous refresh credential.
  const nextRefreshToken = result.refreshToken;
  // Issue your own access token for result.userId.
}
```

Handle `missing`, `revoked`, `consumed`, and `expired` results as unsuccessful renewal. Validation and rotation can also throw database errors; these are not status results.

::: warning Concurrent refresh
The SQLite adapter currently consumes and replaces a token in separate statements. Avoid assuming a single winner under concurrent rotation. See [token lifecycle](./token-lifecycle#concurrent-requests).
:::

## 5. Revoke a session

```ts
const active = await sessions.listActiveSessionsForUser(userId);

if (active[0]) {
  // Revoke by family identifier, not by raw refresh credential.
  await sessions.revokeSession(active[0].tokenHash);
}

// Or invalidate all refresh-session families for the user.
await sessions.revokeAllSessionsForUser(userId);
```

Already-issued stateless access tokens remain valid until their own expiration. Continue with the [API reference](../reference/session-forge) for method signatures and return values.
