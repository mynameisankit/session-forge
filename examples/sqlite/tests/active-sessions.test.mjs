import assert from 'node:assert/strict';
import test from 'node:test';
import { openDatabase } from '../dist/database.js';
import { SessionForge } from '../../../dist/index.js';
import { SQLiteSessionStore } from '../../../dist/adapters/sqlite/index.js';

test('active listing excludes revoked, consumed, expired and other-user families without duplicates', async () => {
  const db = await openDatabase(':memory:');
  try {
    const store = new SQLiteSessionStore(db);
    const sessions = new SessionForge({ store, expiryTTL: 60000 });
    const userId = '00000000-0000-4000-8000-000000000001';
    for (const tokenHash of ['active', 'expired', 'consumed', 'revoked', 'rotated']) {
      await store.createSession({ userId, tokenHash, expiresAt: Date.now() + 60000, sessionName: tokenHash });
    }
    await store.createSession({ userId: '00000000-0000-4000-8000-000000000002', tokenHash: 'other', expiresAt: Date.now() + 60000 });
    await db('refresh_tokens').where('token_hash', 'expired').update({ expiresAt: new Date(0).toISOString() });
    await db('refresh_tokens').where('token_hash', 'consumed').update({ consumedAt: 0 });
    await store.revokeSession('revoked');
    await store.consumeAndReplace({ oldTokenHash: 'rotated', newTokenHash: 'replacement', newExpiresAt: Date.now() + 60000, consumedAt: Date.now() });
    // EXISTS returns the family once even if incomplete concurrency handling allowed two active tokens.
    await db('refresh_tokens').insert({ token_hash: 'duplicate', family_id: 'active', consumedAt: null, expiresAt: new Date(Date.now() + 60000).toISOString() });
    const queries = [];
    db.on('query', query => queries.push(query.sql));
    const active = await sessions.listActiveSessionsForUser(userId);
    assert.deepEqual(active.map(s => s.sessionName).sort(), ['active', 'rotated']);
    assert.deepEqual(active.map(s => s.tokenHash).sort(), ['active', 'rotated']);
    assert.equal(queries.length, 1);
    assert.equal((await sessions.listAllSessionsForUser(userId)).length, 5);
  } finally { await db.destroy(); }
});
