import type { AuthApi, Session, User } from "./types";

class HttpError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

/** Same-origin HTTP transport. The example backend owns authentication and cookies. */
async function request(
  path: string,
  method = "GET",
  body?: unknown,
): Promise<Response> {
  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      method,
      credentials: "include",
      headers:
        body === undefined
          ? { Accept: "application/json" }
          : {
              Accept: "application/json",
              "Content-Type": "application/json",
            },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new Error(
      "Could not reach the example backend. Check that it is running.",
    );
  }

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    const message =
      typeof payload?.message === "string"
        ? payload.message
        : response.status >= 500
          ? "The example backend is unavailable. Please try again."
          : `Request failed (${response.status}). Please try again.`;
    throw new HttpError(message, response.status);
  }
  return response;
}

async function json<T>(response: Response): Promise<T> {
  try {
    return (await response.json()) as T;
  } catch {
    throw new Error("The example backend returned an invalid JSON response.");
  }
}

async function mutate(path: string, body?: unknown, method = "POST") {
  await request(path, method, body);
}

export const httpAuthApi: AuthApi = {
  async getCurrentUser() {
    // A signed-out browser is expected; other failures should remain visible.
    try {
      return await json<User | null>(await request("/auth/me"));
    } catch (error) {
      if (error instanceof HttpError && error.status === 401) return null;
      throw error;
    }
  },
  async signIn(input) {
    return json<User>(await request("/auth/login", "POST", input));
  },
  async signUp(input) {
    return json<User>(await request("/auth/register", "POST", input));
  },
  requestPasswordReset: (email) => mutate("/auth/forgot-password", { email }),
  resetPassword: (input) => mutate("/auth/reset-password", input),
  changePassword: (input) => mutate("/auth/change-password", input),
  async listSessions() {
    return json<Session[]>(await request("/sessions"));
  },
  revokeSession: (id) =>
    mutate(`/sessions/${encodeURIComponent(id)}`, undefined, "DELETE"),
  revokeOtherSessions: () => mutate("/sessions/others", undefined, "DELETE"),
  signOut: () => mutate("/auth/logout"),
};
