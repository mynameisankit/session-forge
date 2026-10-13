import { randomUUID } from 'node:crypto';
import type { Knex } from 'knex';
import { HttpError } from '../http/error.js';
import { hashPassword, verifyPassword } from '../session-forge.js';
import type { UserRow } from './user.js';

export function createAccounts(db: Knex) {
  return {
    async register(name: string, email: string, password: string): Promise<UserRow> {
      const user: UserRow = {
        id: randomUUID(), name, email,
        password_hash: await hashPassword(password),
      };
      try {
        await db('users').insert(user);
      } catch (error) {
        if ((error as { code?: string }).code === 'SQLITE_CONSTRAINT') {
          throw new HttpError(409, 'An account with this email already exists.');
        }
        throw error;
      }
      return user;
    },

    async login(email: string, password: string): Promise<UserRow> {
      const user = await db<UserRow>('users').where('email', email).first();
      // Unknown accounts still perform password derivation.
      const valid = await verifyPassword(password, user?.password_hash ?? `${'0'.repeat(32)}:${'0'.repeat(128)}`);
      if (!user || !valid) throw new HttpError(401, 'Incorrect email or password.');
      return user;
    },
  };
}
