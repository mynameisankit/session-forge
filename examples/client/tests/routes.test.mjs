import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createServer } from 'node:http';
import test from 'node:test';
import { createMemoryRouter } from 'react-router';
import { httpClient } from '../src/api/http-client.ts';
import { loginAction } from '../src/routes/login.ts';
import { registerAction } from '../src/routes/register.ts';
import { accountAction, accountLoader } from '../src/routes/account.ts';
import { forgotPasswordAction, resendResetAction, resetPasswordAction, changePasswordAction } from '../src/routes/password.ts';

const user = { name: 'Alex', email: 'alex@example.com' };
const password = 'example password';
const args = (path, values) => ({ request: new Request(`http://client${path}`, {
  method: 'POST', body: new URLSearchParams(values),
}) });

async function fixture(t) {
  const calls = [];
  let sessions = [{ id: 'current', current: true }, { id: 'other', current: false }];
  let signedIn = false;
  const server = createServer((request, response) => {
    void (async () => {
      const chunks = [];
      for await (const chunk of request) chunks.push(chunk);
      const body = chunks.length ? JSON.parse(Buffer.concat(chunks).toString()) : undefined;
      calls.push({ path: request.url, method: request.method, body });
      let data;
      if (request.url === '/api/auth/me') {
        if (!signedIn) { response.writeHead(401); response.end(); return; }
        data = user;
      } else if (request.url === '/api/sessions' && request.method === 'GET') data = sessions;
      else if (request.url === '/api/auth/login' || request.url === '/api/auth/register') signedIn = true;
      else if (request.url === '/api/sessions/others') sessions = sessions.filter(s => s.current);
      else if (request.url === '/api/auth/logout') signedIn = false;
      if (data) { response.writeHead(200, { 'Content-Type': 'application/json' }); response.end(JSON.stringify(data)); }
      else { response.writeHead(204); response.end(); }
    })().catch(error => response.destroy(error));
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const oldURL = httpClient.defaults.baseURL;
  httpClient.defaults.baseURL = `http://127.0.0.1:${server.address().port}/api`;
  t.after(async () => {
    httpClient.defaults.baseURL = oldURL;
    await new Promise(resolve => { server.close(resolve); server.closeAllConnections(); });
  });
  return { calls };
}

test('router actions navigate after login and revalidate account loader after fetcher mutations', async t => {
  const { calls } = await fixture(t);
  const router = createMemoryRouter([
    { id: 'login', path: '/login', action: loginAction },
    { id: 'account', path: '/account', loader: accountLoader, action: accountAction },
  ], { initialEntries: ['/login'] });
  t.after(() => router.dispose());
  const states = [];
  let feedback;
  router.subscribe(state => {
    states.push(state.navigation.state);
    if (state.fetchers.get('revoke')?.data) feedback = state.fetchers.get('revoke').data;
  });
  await router.navigate('/login', { formMethod: 'post', formData: new URLSearchParams({ email: user.email, password, remember: 'on' }) });
  assert.equal(router.state.location.pathname, '/account');
  assert.equal(router.state.loaderData.account.sessions.length, 2);
  assert.deepEqual(calls.find(c => c.path === '/api/auth/login').body, { email: user.email, password, remember: true });
  assert.ok(states.includes('submitting'));
  assert.ok(states.includes('loading'));
  router.getFetcher('revoke'); // Register the fetcher as useFetcher does in the mounted page.
  await router.fetch('revoke', 'account', '/account', { formMethod: 'post', formData: new URLSearchParams({ intent: 'revokeOthers' }) });
  assert.equal(router.state.location.pathname, '/account');
  assert.equal(router.state.loaderData.account.sessions.length, 1);
  assert.equal(feedback.message, 'All other devices signed out.');
  await router.fetch('logout', 'account', '/account', { formMethod: 'post', formData: new URLSearchParams({ intent: 'logout' }) });
  assert.equal(router.state.location.pathname, '/login');
});

test('mismatched password confirmation does not reach the backend', async t => {
  const { calls } = await fixture(t);
  const result = await registerAction(args('/register', { name: user.name, email: user.email, password, confirmPassword: 'different' }));
  assert.match(result.error, /passwords don’t match/);
  assert.equal(calls.length, 0);
});

test('registration and password routes send their fields and return navigation or feedback', async t => {
  const { calls } = await fixture(t);
  const registered = await registerAction(args('/register', { name: user.name, email: user.email, password, confirmPassword: password }));
  assert.equal(registered.headers.get('Location'), '/account');
  const forgot = await forgotPasswordAction(args('/forgot', { email: user.email }));
  assert.equal(new URL(forgot.headers.get('Location'), 'http://client').searchParams.get('email'), user.email);
  assert.match((await resendResetAction(args('/reset-sent', { email: user.email }))).message, /new reset link/);
  const reset = await resetPasswordAction(args('/reset', { token: 'reset-token', password, confirmPassword: password }));
  assert.equal(reset.headers.get('Location'), '/reset-done');
  const changed = await changePasswordAction(args('/change-password', { currentPassword: 'old password', password, confirmPassword: password }));
  assert.equal(changed.headers.get('Location'), '/account');
  assert.deepEqual(calls.find(c => c.path === '/api/auth/reset-password').body, { token: 'reset-token', password });
  assert.deepEqual(calls.find(c => c.path === '/api/auth/change-password').body, { currentPassword: 'old password', password });
});
