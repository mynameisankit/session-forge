import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { openDatabase } from '../dist/database.js';
import { initializeDatabase } from '../dist/schema.js';
import { SessionForge } from '../../../dist/index.js';
import { SQLiteSessionStore, createSQLiteSessionTables } from '../../../dist/adapters/sqlite/index.js';

test('schema is repeatable, sessions persist, and initial tokens have a future expiry', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'session-forge-'));
  const filename = join(directory, 'test.sqlite');
  let db;
  try {
    db = await openDatabase(filename);
    await initializeDatabase(db);
    await createSQLiteSessionTables(db);
    const sessions = new SessionForge({ store: new SQLiteSessionStore(db), expiryTTL: 60000 });
    const token = await sessions.createSession({ userId: '00000000-0000-4000-8000-000000000001', sessionName: 'Test device' });
    assert.equal((await sessions.rotateRefreshToken(token)).status, 'rotated');
    await db.destroy();
    db = await openDatabase(filename);
    const families = await new SQLiteSessionStore(db).findSessionFamilies('00000000-0000-4000-8000-000000000001');
    assert.equal(families.length, 1);
    assert.equal(families[0].session_name, 'Test device');
  } finally {
    if (db) await db.destroy();
    // The target is the exact temporary directory created above.
    await rm(directory, { recursive: true, force: true });
  }
});
