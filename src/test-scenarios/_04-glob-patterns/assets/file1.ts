/* eslint-disable */
/**
 * First test file for glob pattern matching
 * TypeScript file with standard constructs
 */

export interface UserData {
  id: number;
  username: string;
  email: string;
  active: boolean;
}

export class UserManager {
  private users: Map<number, UserData> = new Map();

  constructor() {
    // Initialize with default data
  }

  addUser(user: UserData): void {
    this.users.set(user.id, user);
  }

  getUser(id: number): UserData | undefined {
    return this.users.get(id);
  }

  getAllUsers(): UserData[] {
    return Array.from(this.users.values());
  }

  removeUser(id: number): boolean {
    return this.users.delete(id);
  }
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export const createDefaultUser = (): UserData => ({
  id: 0,
  username: 'default',
  email: 'default@example.com',
  active: true
});