// Test file for glance-with-tree-sitter

interface User {
  id: number;
  name: string;
  email: string;
}

type UserRole = 'admin' | 'user' | 'guest';

enum Status {
  Active = 'ACTIVE',
  Inactive = 'INACTIVE',
  Pending = 'PENDING'
}

class UserService {
  private users: User[] = [];

  constructor(private readonly apiUrl: string) {}

  async getUser(id: number): Promise<User | undefined> {
    return this.users.find(user => user.id === id);
  }

  addUser(user: User): void {
    this.users.push(user);
  }

  get userCount(): number {
    return this.users.length;
  }
}

function validateEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

const createUser = (name: string, email: string): User => {
  return {
    id: Date.now(),
    name,
    email
  };
};

export { UserService, validateEmail, createUser };
export type { User, UserRole };
export { Status };