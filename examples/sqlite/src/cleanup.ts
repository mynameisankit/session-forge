import { loadConfig } from './config.js';
import { openDatabase } from './database.js';
import { createSessions } from './session-forge.js';

const { filename } = loadConfig();
const db = await openDatabase(filename);
try {
  const { sessions } = createSessions(db);
  const retentionTTL = process.env.SESSION_RETENTION_TTL;
  const result = await sessions.pruneExpiredSessions(
    retentionTTL === undefined ? {} : { retentionTTL: Number(retentionTTL) },
  );
  console.log(result);
} finally {
  await db.destroy();
}
