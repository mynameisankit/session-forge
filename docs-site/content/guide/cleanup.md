# Session cleanup

Remove inactive refresh-session families after a retention period while preserving history needed for replay detection.

## Run cleanup

```ts
const result = await sessions.pruneExpiredSessions();
// { deletedFamilies: number, deletedTokens: number }
```

The default retention period is seven days. Override it in milliseconds:

```ts
const result = await sessions.pruneExpiredSessions({
  retentionTTL: 14 * 24 * 60 * 60 * 1000,
});
```

`retentionTTL` must be a non-negative safe integer within the supported date range. Invalid values throw `RangeError`. A value of `0` removes the retention delay.

## What becomes eligible

The core computes `inactiveBefore = Date.now() - retentionTTL` and delegates pruning to the store.

| Family state | SQLite cleanup behavior |
| --- | --- |
| Revoked at or before cutoff | Delete family and its token history |
| Unrevoked, all tokens expired by cutoff | Delete family and its token history |
| Contains a token expiring after cutoff | Retain the entire family history |
| Unrevoked with no tokens | Retain; no retention timestamp is available |

Cleanup does not remove individual consumed tokens from an otherwise retained family. That history enables consumed-token replay detection.

## Schedule explicitly

Neither the library nor the example server starts background cleanup timers. Invoke this method from your application's maintenance process or scheduler.

For the SQLite example:

```sh
yarn workspace session-forge-example-sqlite cleanup
```

`DATABASE_PATH` selects the database; `SESSION_RETENTION_TTL` overrides retention in milliseconds. The command prints the deleted-family and deleted-token counts. Users and password-reset records remain application-owned.
