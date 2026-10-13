import type { UUID } from 'node:crypto';
import { HttpError } from '../http/error.js';
import type { Authentication } from './session.js';

export function createSessionManagement(sessions: Authentication['sessions']) {
  return {
    async revokeOthers(userId: UUID, currentId: string): Promise<void> {
      const families = await sessions.listAllSessionsForUser(userId);
      for (const family of families) {
        if (family.tokenHash !== currentId) await sessions.revokeSession(family.tokenHash);
      }
    },

    async revoke(userId: UUID, currentId: string, id: string): Promise<void> {
      const families = await sessions.listAllSessionsForUser(userId);
      if (!families.some((family) => family.tokenHash === id)) throw new HttpError(404, 'Session not found.');
      if (id === currentId) throw new HttpError(400, 'Use Sign out to end your current session.');
      await sessions.revokeSession(id);
    },
  };
}
