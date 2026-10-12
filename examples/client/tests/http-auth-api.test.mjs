import assert from "node:assert/strict";
import { test } from "node:test";
import { httpAuthApi } from "../src/api/http-auth-api.ts";

test("sign-in sends JSON with credentials and returns the backend's user", async (t) => {
  const user = { name: "Alex", email: "alex@example.com" };
  const input = {
    email: user.email,
    password: "example password",
    remember: true,
  };
  const fetch = t.mock.method(globalThis, "fetch", async (url, options) => {
    assert.equal(url, "/api/auth/login");
    assert.equal(options.method, "POST");
    assert.equal(options.credentials, "include");
    assert.equal(options.headers["Content-Type"], "application/json");
    assert.deepEqual(JSON.parse(options.body), input);
    return Response.json(user);
  });
  assert.deepEqual(await httpAuthApi.signIn(input), user);
  assert.equal(fetch.mock.callCount(), 1);
});

test("a signed-out response restores no user; server failures are not treated as signed out", async (t) => {
  t.mock.method(
    globalThis,
    "fetch",
    async () => new Response(null, { status: 401 }),
  );
  assert.equal(await httpAuthApi.getCurrentUser(), null);
  globalThis.fetch.mock.mockImplementation(
    async () => new Response(null, { status: 503 }),
  );
  await assert.rejects(httpAuthApi.getCurrentUser(), /backend is unavailable/);
});

test("mutation endpoints accept empty 204 responses and escape opaque session IDs", async (t) => {
  const calls = [];
  t.mock.method(globalThis, "fetch", async (url, options) => {
    calls.push({ url, method: options.method });
    return new Response(null, { status: 204 });
  });
  await httpAuthApi.revokeSession("family/one?two#three");
  await httpAuthApi.revokeOtherSessions();
  await httpAuthApi.signOut();
  assert.deepEqual(calls, [
    { url: "/api/sessions/family%2Fone%3Ftwo%23three", method: "DELETE" },
    { url: "/api/sessions/others", method: "DELETE" },
    { url: "/api/auth/logout", method: "POST" },
  ]);
});

test("backend rejection messages reach the form instead of simulating success", async (t) => {
  t.mock.method(globalThis, "fetch", async () =>
    Response.json({ message: "Reset link expired." }, { status: 400 }),
  );
  await assert.rejects(
    httpAuthApi.resetPassword({
      token: "expired",
      password: "example password",
    }),
    /Reset link expired/,
  );
});

test("HTML fallback responses and connection failures surface understandable errors", async (t) => {
  t.mock.method(
    globalThis,
    "fetch",
    async () => new Response("<html>Wrong API route</html>"),
  );
  await assert.rejects(httpAuthApi.listSessions(), /invalid JSON/);
  globalThis.fetch.mock.mockImplementation(async () => {
    throw new TypeError("fetch failed");
  });
  await assert.rejects(
    httpAuthApi.requestPasswordReset("alex@example.com"),
    /Could not reach the example backend/,
  );
});
