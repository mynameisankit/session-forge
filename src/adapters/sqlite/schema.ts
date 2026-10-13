import type { Knex } from 'knex';

/** Create missing SessionForge tables. Run during setup, before serving requests.
 * Existing tables are left unchanged; schema upgrades belong in application migrations.
 * user_id intentionally has no foreign key: applications own their user tables.
 */
export async function createSQLiteSessionTables(db: Knex): Promise<void> {
  if (!(await db.schema.hasTable('session_families'))) {
    await db.schema.createTable('session_families', (table) => {
      table.text('token_hash').primary();
      table.text('user_id').notNullable().index();
      table.bigInteger('revoked_at').nullable();
      table.text('session_name').notNullable();
    });
  }

  if (!(await db.schema.hasTable('refresh_tokens'))) {
    await db.schema.createTable('refresh_tokens', (table) => {
      table.text('token_hash').primary();
      table.text('family_id').notNullable()
        .references('token_hash').inTable('session_families').index();
      table.bigInteger('consumedAt').nullable();
      table.text('expiresAt').notNullable();
    });
  }
}
