import type { RouteObject } from 'react-router';
import type { Knex } from 'knex';
import { createAccounts } from '../auth/accounts.js';
import type { Authentication } from '../auth/session.js';
import { publicUser } from '../auth/user.js';
import { HttpError } from '../http/error.js';
import { readBody, requireMethod } from '../http/request.js';
import { json } from '../http/response.js';
import { text, emailAddress } from '../http/validation.js';

export function authRoutes(db: Knex, auth: Authentication): RouteObject[] {
  const accounts = createAccounts(db);
  return [
    {
      path: '/api/auth/register',
      action: async ({ request }) => {
        requireMethod(request, 'POST');
        const body = await readBody(request);
        const name = text(body, 'name', 1, 100).trim();
        if (!name) throw new HttpError(400, 'Invalid name.');
        const user = await accounts.register(name, emailAddress(body), text(body, 'password', 8, 1024));
        const headers = new Headers();
        await auth.establish(request, headers, user, false);
        return json(201, publicUser(user), headers);
      },
    },
    {
      path: '/api/auth/login',
      action: async ({ request }) => {
        requireMethod(request, 'POST');
        const body = await readBody(request);
        if (body.remember !== undefined && typeof body.remember !== 'boolean') {
          throw new HttpError(400, 'Invalid remember.');
        }
        const user = await accounts.login(emailAddress(body), text(body, 'password', 1, 1024));
        const headers = new Headers();
        await auth.establish(request, headers, user, body.remember === true);
        return json(200, publicUser(user), headers);
      },
    },
    {
      path: '/api/auth/me',
      loader: async ({ request }) => {
        const { user, headers } = await auth.authenticate(request);
        return json(200, publicUser(user), headers);
      },
    },
    {
      path: '/api/auth/refresh',
      action: async ({ request }) => {
        requireMethod(request, 'POST');
        const { headers } = await auth.refresh(request);
        return json(204, undefined, headers);
      },
    },
    {
      path: '/api/auth/logout',
      action: async ({ request }) => {
        requireMethod(request, 'POST');
        const headers = new Headers();
        await auth.signOut(request, headers);
        return json(204, undefined, headers);
      },
    },
  ];
}
