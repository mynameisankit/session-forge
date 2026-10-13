import knex, { type Knex } from 'knex';
import { mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { initializeDatabase } from './schema.js';

export async function openDatabase(filename: string): Promise<Knex> {
  if (filename !== ':memory:') {
    await mkdir(dirname(resolve(filename)), { recursive: true });
  }

  const db = knex({
    client: 'sqlite3',
    connection: { filename },
    useNullAsDefault: true,
    pool: { min: 1, max: 1 },
  });

  try {
    await db.raw('PRAGMA foreign_keys = ON');
    await initializeDatabase(db);
    return db;
  } catch (error) {
    await db.destroy();
    throw error;
  }
}

