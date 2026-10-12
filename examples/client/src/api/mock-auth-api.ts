import type { AuthApi, Session, User } from "./types";

// UI-only simulation: no database, email, real authentication, or token issuance.
// Reloading the page clears the simulated session.
let user: User | null = null;
const initialSessions: Session[] = [
  {
    id: "current",
    device: "This browser",
    detail: "Active now",
    current: true,
  },
  {
    id: "laptop",
    device: "Chrome on macOS",
    detail: "Last active 2 hours ago · Example device",
    current: false,
  },
  {
    id: "phone",
    device: "Safari on iPhone",
    detail: "Last active yesterday · Example device",
    current: false,
  },
];
let sessions = [...initialSessions];
async function simulate() {
  await new Promise((resolve) => setTimeout(resolve, 550));
}
function checkEmail(email: string) {
  if (email.toLowerCase() === "error@example.com")
    throw new Error("Something went wrong. Please try again.");
}
function checkToken(token: string) {
  if (!token || token === "expired")
    throw new Error(
      "This link is invalid or has expired. Please request a new one.",
    );
}
export const mockAuthApi: AuthApi = {
  async getCurrentUser() {
    return user;
  },
  async signIn({ email }) {
    await simulate();
    checkEmail(email);
    user = { email, name: email.split("@")[0] || "Alex" };
    sessions = [...initialSessions];
    return user;
  },
  async signUp({ name, email }) {
    await simulate();
    checkEmail(email);
    user = { name, email };
    sessions = [...initialSessions];
    return user;
  },
  async requestPasswordReset(email) {
    await simulate();
    checkEmail(email);
  },
  async resetPassword({ token }) {
    await simulate();
    checkToken(token);
  },
  async changePassword() {
    await simulate();
  },
  async listSessions() {
    await simulate();
    return [...sessions];
  },
  async revokeSession(id) {
    await simulate();
    sessions = sessions.filter((s) => s.current || s.id !== id);
  },
  async revokeOtherSessions() {
    await simulate();
    sessions = sessions.filter((s) => s.current);
  },
  async signOut() {
    await simulate();
    user = null;
  },
};
