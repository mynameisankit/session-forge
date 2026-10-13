import type { UUID } from 'node:crypto';

export interface UserRow {
  id: UUID;
  name: string;
  email: string;
  password_hash: string;
}

export const publicUser = (user: UserRow) => ({ name: user.name, email: user.email });
