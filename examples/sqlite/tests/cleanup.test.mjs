import assert from 'node:assert/strict';
import test from 'node:test';
import { openDatabase } from '../dist/database.js';
import { SessionForge } from '../../../dist/index.js';
import { SQLiteSessionStore } from '../../../dist/adapters/sqlite/index.js';

const NOW = Date.UTC(2026, 9, 14);
const DAY = 86400000;
const USER = '00000000-0000-4000-8000-000000000001';

test('cleanup applies retention to entire families and preserves active token histories', async t => {
  t.mock.method(Date, 'now', () => NOW);
  const db = await openDatabase(':memory:');
  try {
    const store = new SQLiteSessionStore(db);
    const sessions = new SessionForge({ store, expiryTTL: DAY });
    async function family(tokenHash, expiresAt, revokedAt = null) {
      await store.createSession({ userId: USER, tokenHash, expiresAt });
      if (revokedAt !== null) await db('session_families').where('token_hash', tokenHash).update({ revoked_at: revokedAt });
    }
    await family('expired-old', NOW - 8 * DAY);
    await family('expired-boundary', NOW - 7 * DAY);
    await family('expired-recent', NOW - DAY);
    await family('revoked-old', NOW + DAY, NOW - 8 * DAY);
    await family('revoked-recent', NOW - 30 * DAY, NOW - DAY);
    await family('active-history', NOW - 30 * DAY);
    await store.consumeAndReplace({ oldTokenHash: 'active-history', newTokenHash: 'active-next', newExpiresAt: NOW + DAY, consumedAt: NOW - DAY });
    await family('consumed-future', NOW + DAY);
    await db('refresh_tokens').where('token_hash', 'consumed-future').update({ consumedAt: NOW - DAY });
    await family('chain-expired-old', NOW - 30 * DAY);
    await store.consumeAndReplace({ oldTokenHash: 'chain-expired-old', newTokenHash: 'chain-last', newExpiresAt: NOW - 8 * DAY, consumedAt: NOW - 20 * DAY });
    await db('session_families').insert({ token_hash: 'empty', user_id: USER, session_name: '', revoked_at: null });

    assert.deepEqual(await sessions.pruneExpiredSessions(), { deletedFamilies: 4, deletedTokens: 5 });
    assert.equal(await store.findToken('expired-old'), null);
    assert.equal(await store.findToken('expired-boundary'), null);
    assert.equal(await store.findToken('revoked-old'), null);
    assert.equal(await store.findToken('chain-last'), null);
    for (const id of ['expired-recent', 'revoked-recent', 'active-history', 'active-next', 'consumed-future']) {
      assert.ok(await store.findToken(id), `Expected ${id} to be preserved`);
    }
    assert.ok(await db('session_families').where('token_hash', 'empty').first());
    assert.deepEqual(await sessions.pruneExpiredSessions(), { deletedFamilies: 0, deletedTokens: 0 });
    assert.deepEqual(await sessions.pruneExpiredSessions({ retentionTTL: 0 }), { deletedFamilies: 2, deletedTokens: 2 });
    assert.ok(await store.findToken('active-history'));
  } finally { await db.destroy(); }
});

test('failed family deletion rolls back token deletion', async () => {
  const db = await openDatabase(':memory:');
  try {
    const store = new SQLiteSessionStore(db);
    await store.createSession({ userId: USER, tokenHash: 'expired', expiresAt: NOW - DAY });
    await db.raw(`CREATE TRIGGER reject_cleanup BEFORE DELETE ON session_families
      BEGIN SELECT RAISE(ABORT, 'test deletion failure'); END`);
    await assert.rejects(store.pruneSessionFamilies(NOW), /test deletion failure/);
    assert.ok(await store.findToken('expired'));
    assert.equal((await store.findSessionFamilies(USER)).length, 1);
  } finally { await db.destroy(); }
});
