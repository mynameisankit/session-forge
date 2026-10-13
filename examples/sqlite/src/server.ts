import { loadConfig } from './config.js';
import { openDatabase } from './database.js';
import { createApp } from './app.js';

const { port, filename, clientOrigin, jwtSecret } = loadConfig();
const db = await openDatabase(filename);
const server = createApp({
  db,
  clientOrigin,
  jwtSecret,
  onResetLink: (link) => console.log(`Development password reset link (valid for 15 minutes):\n${link}`),
});
server.on('error', (error) => {
  console.error(error);
  void db.destroy().finally(() => { process.exitCode = 1; });
});
server.listen(port, '127.0.0.1', () => {
  console.log(`SQLite example API: http://127.0.0.1:${port}`);
  console.log(`Shared client: ${clientOrigin}\nDatabase: ${filename}`);
});
let closing = false;
function shutdown() {
  if (closing) return;
  closing = true;
  server.close(() => { void db.destroy(); });
  server.closeIdleConnections();
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
