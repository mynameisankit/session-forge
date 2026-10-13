import type { Knex } from 'knex';
import { HttpError } from '../http/error.js';
import { createSessions, hashPassword, verifyPassword } from '../session-forge.js';
import type { UserRow } from './user.js';

export async function changePassword(db: Knex, user: UserRow, currentPassword: string, password: string): Promise<void> {
  if (!(await verifyPassword(currentPassword, user.password_hash))) {
    throw new HttpError(400, 'Current password is incorrect.');
  }
  const passwordHash = await hashPassword(password);
  await db.transaction(async (tx) => {
    await tx('users').where('id', user.id).update({ password_hash: passwordHash });
    await tx('password_resets').where('user_id', user.id).delete();
    await createSessions(tx).sessions.revokeAllSessionsForUser(user.id);
  });
}
