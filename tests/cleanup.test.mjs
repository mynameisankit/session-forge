import assert from 'node:assert/strict';
import test from 'node:test';
import { SessionForge } from 'session-forge';

test('cleanup passes the retention cutoff to the adapter and returns its deletion counts', async t => {
  const now = Date.UTC(2026, 9, 14);
  t.mock.method(Date, 'now', () => now);
  const cutoffs = [];
  const result = { deletedFamilies: 2, deletedTokens: 5 };
  const sessions = new SessionForge({ expiryTTL: 60000, store: {
    async pruneSessionFamilies(cutoff) { cutoffs.push(cutoff); return result; },
  } });
  assert.deepEqual(await sessions.pruneExpiredSessions(), result);
  await sessions.pruneExpiredSessions({ retentionTTL: 0 });
  await sessions.pruneExpiredSessions({ retentionTTL: 1000 });
  assert.deepEqual(cutoffs, [now - 7 * 86400000, now, now - 1000]);
});

test('invalid retention never invokes the destructive adapter operation', () => {
  const sessions = new SessionForge({ expiryTTL: 60000, store: {
    pruneSessionFamilies() { assert.fail('Invalid input reached the adapter'); },
  } });
  for (const retentionTTL of [-1, 0.5, NaN, Infinity, '1000', Number.MAX_SAFE_INTEGER]) {
    assert.throws(() => sessions.pruneExpiredSessions({ retentionTTL }), RangeError);
  }
});
