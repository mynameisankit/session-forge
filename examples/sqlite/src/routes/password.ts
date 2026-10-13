import type { RouteObject } from 'react-router';
import type { Knex } from 'knex';
import { changePassword } from '../auth/password-change.js';
import { createPasswordReset } from '../auth/password-reset.js';
import type { Authentication } from '../auth/session.js';
import { readBody, requireMethod } from '../http/request.js';
import { json } from '../http/response.js';
import { text, emailAddress } from '../http/validation.js';

export function passwordRoutes(db: Knex, auth: Authentication, origin: string, onResetLink: (link: string) => void): RouteObject[] {
  const resets = createPasswordReset(db, origin, onResetLink);
  return [
    {
      path: '/api/auth/forgot-password',
      action: async ({ request }) => {
        requireMethod(request, 'POST');
        const body = await readBody(request);
        await resets.request(emailAddress(body));
        return json(204);
      },
    },
    {
      path: '/api/auth/reset-password',
      action: async ({ request }) => {
        requireMethod(request, 'POST');
        const body = await readBody(request);
        await resets.reset(text(body, 'token'), text(body, 'password', 8, 1024));
        const headers = new Headers();
        auth.cookies.clear(headers);
        return json(204, undefined, headers);
      },
    },
    {
      path: '/api/auth/change-password',
      action: async ({ request }) => {
        requireMethod(request, 'POST');
        const { user } = await auth.authenticate(request);
        const body = await readBody(request);
        await changePassword(db, user, text(body, 'currentPassword', 1, 1024), text(body, 'password', 8, 1024));
        // The common client stays signed in after changing a password.
        const headers = new Headers();
        await auth.establish(request, headers, user, false);
        return json(204, undefined, headers);
      },
    },
  ];
}
