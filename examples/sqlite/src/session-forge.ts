import type { Knex } from 'knex';
import { SessionForge } from '../../../dist/index.js';
export { SQLiteSessionStore, createSQLiteSessionTables } from '../../../dist/adapters/sqlite/index.js';
export { createToken, hashToken, hashPassword, verifyPassword } from '../../../dist/utils.js';
import { SQLiteSessionStore } from '../../../dist/adapters/sqlite/index.js';
import { SESSION_TTL } from './config.js';

export function createSessions(db: Knex) {
  const store = new SQLiteSessionStore(db);
  return { store, sessions: new SessionForge({ store, expiryTTL: SESSION_TTL }) };
}
