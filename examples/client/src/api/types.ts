export type User = { name: string; email: string };
export type Session = {
  id: string;
  device: string;
  detail: string;
  current: boolean;
};

/** Shared HTTP contract. Database implementations belong to the example backends. */
export interface AuthApi {
  getCurrentUser(): Promise<User | null>;
  signIn(input: {
    email: string;
    password: string;
    remember: boolean;
  }): Promise<User>;
  signUp(input: {
    name: string;
    email: string;
    password: string;
  }): Promise<User>;
  requestPasswordReset(email: string): Promise<void>;
  resetPassword(input: { token: string; password: string }): Promise<void>;
  changePassword(input: {
    currentPassword: string;
    password: string;
  }): Promise<void>;
  listSessions(): Promise<Session[]>;
  revokeSession(id: string): Promise<void>;
  revokeOtherSessions(): Promise<void>;
  signOut(): Promise<void>;
}
