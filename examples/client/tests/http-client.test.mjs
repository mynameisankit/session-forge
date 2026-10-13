import assert from "node:assert/strict";
import { once } from "node:events";
import { createServer } from "node:http";
import { test } from "node:test";
import axios from "axios";
import { httpClient } from "../src/api/http-client.ts";
import { requireUser } from "../src/routes/authentication.ts";
import { accountAction } from "../src/routes/account.ts";
import { actionError } from "../src/routes/forms.ts";

async function backend(t, handle) {
  const server = createServer((request, response) => {
    void Promise.resolve(handle(request, response)).catch(error => response.destroy(error));
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const baseURL = httpClient.defaults.baseURL;
  httpClient.defaults.baseURL = `http://127.0.0.1:${server.address().port}/api`;
  t.after(async () => {
    httpClient.defaults.baseURL = baseURL;
    await new Promise((resolve, reject) => {
      server.close(error => error ? reject(error) : resolve());
      server.closeAllConnections();
    });
  });
}

function json(response, status, data) {
  response.writeHead(status, { "Content-Type": "application/json" });
  response.end(JSON.stringify(data));
}

test("Axios serializes sign-in JSON and is configured to include browser cookies", async t => {
  const user = { name: "Alex", email: "alex@example.com" };
  const input = { email: user.email, password: "example password", remember: true };
  let calls = 0;
  await backend(t, async (request, response) => {
    calls++;
    assert.equal(request.url, "/api/auth/login");
    assert.equal(request.method, "POST");
    assert.match(request.headers["content-type"], /application\/json/);
    const chunks = [];
    for await (const chunk of request) chunks.push(chunk);
    assert.deepEqual(JSON.parse(Buffer.concat(chunks).toString()), input);
    json(response, 200, user);
  });
  assert.equal(httpClient.defaults.withCredentials, true);
  assert.deepEqual((await httpClient.post("/auth/login", input)).data, user);
  assert.equal(calls, 1);
});

test("401 redirects to sign-in; server failures retain Axios status and reject", async t => {
  let status = 401;
  await backend(t, (_request, response) => { response.writeHead(status); response.end(); });
  await assert.rejects(requireUser({ request: new Request("http://client/account") }), error => {
    assert.equal(error instanceof Response, true);
    assert.equal(error.headers.get("Location"), "/login");
    return true;
  });
  status = 503;
  await assert.rejects(requireUser({ request: new Request("http://client/account") }), error => {
    assert.equal(axios.isAxiosError(error), true);
    assert.equal(error.response.status, 503);
    assert.match(error.message, /503/);
    return true;
  });
});

test("mutation endpoints accept empty 204 responses and encode opaque session IDs", async t => {
  const calls = [];
  await backend(t, (request, response) => {
    calls.push({ url: request.url, method: request.method });
    response.writeHead(204); response.end();
  });
  for (const values of [{ intent: "revoke", id: "family/one?two#three" }, { intent: "revokeOthers" }, { intent: "logout" }]) {
    await accountAction({ request: new Request("http://client/account", { method: "POST", body: new URLSearchParams(values) }) });
  }
  assert.deepEqual(calls, [
    { url: "/api/sessions/family%2Fone%3Ftwo%23three", method: "DELETE" },
    { url: "/api/sessions/others", method: "DELETE" },
    { url: "/api/auth/logout", method: "POST" },
  ]);
});

test("backend rejection messages reach the form through Axios errors", async t => {
  await backend(t, (_request, response) => json(response, 400, { message: "Reset link expired." }));
  await assert.rejects(httpClient.post("/auth/reset-password", { token: "expired", password: "example password" }), error => {
    assert.equal(actionError(error).error, "Reset link expired.");
    assert.equal(error.response.status, 400);
    return true;
  });
});

test("Axios rejects malformed JSON and connection failures without custom interceptors", async t => {
  let disconnect = false;
  await backend(t, (request, response) => {
    if (disconnect) { request.socket.destroy(); return; }
    response.writeHead(200, { "Content-Type": "text/html" });
    response.end("<html>Wrong API route</html>");
  });
  await assert.rejects(httpClient.get("/sessions"), error => axios.isAxiosError(error) && error.code === "ERR_BAD_RESPONSE");
  disconnect = true;
  await assert.rejects(httpClient.post("/auth/forgot-password", { email: "alex@example.com" }), error => axios.isAxiosError(error) && !error.response);
});
