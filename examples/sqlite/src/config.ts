import { fileURLToPath } from 'node:url';

export const SESSION_TTL = 30 * 24 * 60 * 60 * 1000;
export const RESET_TTL = 15 * 60 * 1000;

export function loadConfig() {
  const port = Number(process.env.PORT ?? 3000);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be between 1 and 65535.');
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (jwtSecret && Buffer.byteLength(jwtSecret) < 32) throw new Error('JWT_SECRET must contain at least 32 bytes.');
  return {
    jwtSecret: jwtSecret ? new TextEncoder().encode(jwtSecret) : undefined,
    port,
    filename: process.env.DATABASE_PATH ?? fileURLToPath(new URL('../data/sessions.sqlite', import.meta.url)),
    clientOrigin: new URL(process.env.CLIENT_ORIGIN ?? 'http://127.0.0.1:5173').origin,
  };
}
