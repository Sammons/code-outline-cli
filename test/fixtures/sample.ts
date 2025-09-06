// Sample TypeScript file for testing
interface User {
  id: number;
  name: string;
  email?: string;
}

type Status = 'active' | 'inactive' | 'pending';

enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  MODERATOR = 'moderator',
}

class UserService {
  private users: User[] = [];

  constructor(private apiKey: string) {}

  async getUser(id: number): Promise<User | null> {
    return this.users.find((user) => user.id === id) || null;
  }

  addUser(user: User): void {
    this.users.push(user);
  }

  get userCount(): number {
    return this.users.length;
  }

  set apiKey(key: string) {
    this.apiKey = key;
  }
}

function createUser(name: string, id: number): User {
  return { id, name };
}

const defaultUser: User = {
  id: 1,
  name: 'Default User',
};

export { User, Status, UserRole, UserService, createUser };
export default defaultUser;
