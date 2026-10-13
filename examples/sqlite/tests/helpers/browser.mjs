import { once } from 'node:events';
import { createApp } from '../../dist/app.js';
import { openDatabase } from '../../dist/database.js';

const origin = 'http://127.0.0.1:5173';

export async function fixture(t, options = {}) {
  const db = await openDatabase(':memory:');
  const links = [];
  const server = createApp({ db, clientOrigin: origin, onResetLink: link => links.push(link), ...options });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(async () => {
    await new Promise((resolve, reject) => {
      server.close(error => error ? reject(error) : resolve());
      server.closeAllConnections();
    });
    await db.destroy();
  });
  function browser() {
    const cookies = new Map();
    const request = async (path, method = 'GET', body, headers = {}) => {
      const response = await fetch(`http://127.0.0.1:${server.address().port}/api${path}`, {
        method,
        headers: { Origin: origin, Cookie: [...cookies].map(([name, value]) => `${name}=${value}`).join('; '),
          ...(body === undefined ? {} : { 'Content-Type': 'application/json' }), ...headers },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      const setCookies = response.headers.getSetCookie();
      for (const cookie of setCookies) {
        const [name, value] = cookie.split(';')[0].split('=');
        if (value) cookies.set(name, value); else cookies.delete(name);
      }
      const setCookie = setCookies.join('; ');
      return { status: response.status, data: await response.json().catch(() => null), setCookie };
    };
    request.cookies = cookies;
    return request;
  }
  return { db, browser, links };
}

