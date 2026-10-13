import { createStaticHandler, isRouteErrorResponse } from 'react-router';
import type { Knex } from 'knex';
import { createAuthentication } from './auth/session.js';
import { HttpError } from './http/error.js';
import { createNodeServer } from './http/node-server.js';
import { validateOrigin } from './http/request.js';
import { json } from './http/response.js';
import { authRoutes } from './routes/auth.js';
import { passwordRoutes } from './routes/password.js';
import { sessionRoutes } from './routes/sessions.js';

interface AppOptions {
  db: Knex;
  clientOrigin: string;
  jwtSecret?: Uint8Array;
  onResetLink: (link: string) => void;
}

export function createApp({ db, clientOrigin, onResetLink, jwtSecret }: AppOptions) {
  const origin = new URL(clientOrigin).origin;
  const auth = createAuthentication(db, origin, jwtSecret);
  const { queryRoute } = createStaticHandler([
    ...authRoutes(db, auth),
    ...passwordRoutes(db, auth, origin, onResetLink),
    ...sessionRoutes(auth),
  ]);

  return createNodeServer(async (request) => {
    try {
      validateOrigin(request, origin);
      const result = await queryRoute(request);
      if (result instanceof Response) return result;
      throw new Error('Resource routes must return a Response.');
    } catch (error: unknown) {
      if (error instanceof Response) return error;
      if (error instanceof HttpError) return json(error.status, { message: error.message }, error.headers);
      if (isRouteErrorResponse(error)) return json(error.status, { message: error.statusText });
      console.error('SQLite example request failed:', error);
      return json(500, { message: 'Something went wrong. Please try again.' });
    }
  });
}
