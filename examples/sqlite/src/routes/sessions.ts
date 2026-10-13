import type { RouteObject } from 'react-router';
import type { Authentication } from '../auth/session.js';
import { createSessionManagement } from '../auth/session-management.js';
import { HttpError } from '../http/error.js';
import { requireMethod } from '../http/request.js';
import { json } from '../http/response.js';

export function sessionRoutes(auth: Authentication): RouteObject[] {
  const management = createSessionManagement(auth.sessions);
  return [
    {
      path: '/api/sessions',
      loader: async ({ request }) => {
        const { user, familyId, headers } = await auth.authenticate(request);
        const sessions = await auth.sessions.listActiveSessionsForUser(user.id);
        return json(200, sessions.map(session => ({
          id: session.tokenHash,
          device: session.sessionName || 'Browser',
          detail: session.tokenHash === familyId ? 'Active now' : 'Signed in',
          current: session.tokenHash === familyId,
        })), headers);
      },
    },
    {
      path: '/api/sessions/others',
      action: async ({ request }) => {
        requireMethod(request, 'DELETE');
        const { user, familyId, headers } = await auth.authenticate(request);
        await management.revokeOthers(user.id, familyId);
        return json(204, undefined, headers);
      },
    },
    {
      path: '/api/sessions/:id',
      action: async ({ request, params }) => {
        requireMethod(request, 'DELETE');
        const { user, familyId, headers } = await auth.authenticate(request);
        if (!params.id) throw new HttpError(400, 'Missing session ID.');
        await management.revoke(user.id, familyId, params.id);
        return json(204, undefined, headers);
      },
    },
  ];
}
