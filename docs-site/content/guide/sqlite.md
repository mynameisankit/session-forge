# SQLite adapter

The included adapter implements `SessionStore` using Knex and SQLite.

## Configure the connection

```ts
import knex from 'knex';
import { SQLiteSessionStore, createSQLiteSessionTables } from 'session-forge/sqlite';

const db = knex({
  client: 'sqlite3',
  connection: { filename: './sessions.sqlite' },
  useNullAsDefault: true,
  pool: { min: 1, max: 1 },
});

await db.raw('PRAGMA foreign_keys = ON');
await createSQLiteSessionTables(db);
const store = new SQLiteSessionStore(db);
```

`knex` and `sqlite3` are optional peers of the root package. Provide both when using this adapter. Destroy the connection during shutdown with `await db.destroy()`.

## Schema setup

`createSQLiteSessionTables(db): Promise<void>` creates missing tables and their indexes. Run it during setup before requests are served, or invoke it from your own Knex migration's `up` function.

Repeated sequential calls preserve existing data. The helper leaves existing tables unchanged and does not upgrade older schemas. Future schema changes require explicit migrations.

### session_families

| Column | Meaning |
| --- | --- |
| `token_hash` | Primary key; initial token hash and stable family identifier |
| `user_id` | Application-owned user UUID; indexed, no user-table foreign key |
| `revoked_at` | Nullable epoch timestamp in milliseconds |
| `session_name` | Name supplied at creation, or an empty string |

### refresh_tokens

| Column | Meaning |
| --- | --- |
| `token_hash` | Primary key; individual refresh-token hash |
| `family_id` | Indexed reference to `session_families.token_hash` |
| `consumedAt` | Nullable epoch timestamp in milliseconds |
| `expiresAt` | ISO-formatted expiration string |

## Query behavior

Active-session listing selects non-revoked families containing an unconsumed, unexpired token. All-session listing includes revoked and expired families still retained in storage.

Cleanup deletes eligible token rows and their family rows in a transaction, batching family identifiers in groups of 500. It does not delete application-owned users or reset records.

## Concurrency boundary

Session creation and rotation use separate statements. Rotation does not yet have an atomic consume-and-replace operation. Connection pool size does not establish a core-level concurrency guarantee. Review [token lifecycle](./token-lifecycle#concurrent-requests) before using rotation in concurrent workloads.

The [Policies & Guarantees](./policies-guarantees#current-implementation-gap) page maps these gaps to the required invariants and defines proposed adapter conformance scenarios. Existing SQLite integration tests do not establish concurrency conformance.
