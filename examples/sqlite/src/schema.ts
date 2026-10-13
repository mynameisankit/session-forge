import type { Knex } from 'knex';
import { createSQLiteSessionTables } from './session-forge.js';

export async function initializeDatabase(db: Knex): Promise<void> {
  if (!(await db.schema.hasTable('users'))) {
    await db.schema.createTable('users', (table) => {
      table.text('id').primary();
      table.text('name').notNullable();
      table.text('email').notNullable().unique();
      table.text('password_hash').notNullable();
    });
  }

  await createSQLiteSessionTables(db);
  if (!(await db.schema.hasTable('password_resets'))) {
    await db.schema.createTable('password_resets', (table) => {
      table.text('token_hash').primary();
      table.text('user_id').notNullable().references('id').inTable('users').index();
      table.bigInteger('expires_at').notNullable();
    });
  }
}
