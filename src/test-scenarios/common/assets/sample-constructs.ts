/**
 * Fixture-shaped sample TypeScript source code, used only as PARSE INPUT by
 * tests that feed these strings to the CLI/parser under test. Never imported
 * as executable code — the enums/namespaces/parameter-properties inside the
 * template strings are intentional sample constructs, not real module syntax.
 */

/**
 * Test asset templates for creating realistic test files
 */
export const TestAssets = {
  /**
   * Complex TypeScript class with various constructs
   */
  complexClass: `/* eslint-disable */
/**
 * Complex class with various TypeScript constructs
 */
export interface UserConfig {
  name: string;
  age?: number;
  roles: string[];
}

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  GUEST = 'guest'
}

export abstract class BaseUser {
  constructor(protected config: UserConfig) {}
  
  abstract getRole(): UserRole;
  
  getName(): string {
    return this.config.name;
  }
}

export class AdminUser extends BaseUser {
  private permissions: Set<string> = new Set();
  
  constructor(config: UserConfig) {
    super(config);
  }
  
  getRole(): UserRole {
    return UserRole.ADMIN;
  }
  
  addPermission(permission: string): void {
    this.permissions.add(permission);
  }
  
  hasPermission(permission: string): boolean {
    return this.permissions.has(permission);
  }
  
  // Getter
  get permissionCount(): number {
    return this.permissions.size;
  }
  
  // Setter
  set defaultPermissions(perms: string[]) {
    this.permissions = new Set(perms);
  }
  
  // Static method
  static fromJSON(json: string): AdminUser {
    const data = JSON.parse(json);
    return new AdminUser(data.config);
  }
}

// Function declaration
export function createUser(config: UserConfig): BaseUser {
  if (config.roles.includes('admin')) {
    return new AdminUser(config);
  }
  throw new Error('Unsupported role configuration');
}

// Arrow function
export const validateUser = (user: BaseUser): boolean => {
  return user.getName().length > 0;
};

// Namespace
export namespace UserHelpers {
  export function isValidRole(role: string): role is UserRole {
    return Object.values(UserRole).includes(role as UserRole);
  }
  
  export interface UserStats {
    totalUsers: number;
    activeUsers: number;
  }
}`,

  /**
   * Simple utility functions
   */
  simpleUtils: `/* eslint-disable */
// Simple utility functions
export function add(a, b) {
  return a + b;
}

export function multiply(x, y) {
  return x * y;
}

export const subtract = (a, b) => a - b;

const divide = (x, y) => {
  if (y === 0) {
    throw new Error('Division by zero');
  }
  return x / y;
};

export { divide };`,

  /**
   * React component with TypeScript
   */
  reactComponent: `/* eslint-disable */
import React, { useState, useEffect, useCallback } from 'react';

interface Props {
  title: string;
  items: string[];
  onItemClick?: (item: string) => void;
}

interface State {
  selectedItems: Set<string>;
  searchTerm: string;
}

export const ItemList: React.FC<Props> = ({ title, items, onItemClick }) => {
  const [state, setState] = useState<State>({
    selectedItems: new Set(),
    searchTerm: ''
  });
  
  useEffect(() => {
    console.log(\`Items updated: \${items.length}\`);
  }, [items]);
  
  const handleItemClick = useCallback((item: string) => {
    setState(prev => ({
      ...prev,
      selectedItems: new Set([...prev.selectedItems, item])
    }));
    onItemClick?.(item);
  }, [onItemClick]);
  
  const filteredItems = items.filter(item =>
    item.toLowerCase().includes(state.searchTerm.toLowerCase())
  );
  
  return (
    <div className="item-list">
      <h2>{title}</h2>
      <input
        type="text"
        placeholder="Search items..."
        value={state.searchTerm}
        onChange={(e) => setState(prev => ({ ...prev, searchTerm: e.target.value }))}
      />
      <ul>
        {filteredItems.map(item => (
          <li
            key={item}
            onClick={() => handleItemClick(item)}
            className={state.selectedItems.has(item) ? 'selected' : ''}
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ItemList;`,

  /**
   * Complex nested structure
   */
  nestedStructure: `/* eslint-disable */
export namespace Database {
  export interface Connection {
    host: string;
    port: number;
  }
  
  export namespace Models {
    export interface User {
      id: number;
      name: string;
    }
    
    export class UserRepository {
      constructor(private connection: Connection) {}
      
      async findById(id: number): Promise<User | null> {
        // Implementation would go here
        return null;
      }
      
      async save(user: User): Promise<void> {
        // Implementation would go here
      }
    }
    
    export namespace Validators {
      export function validateUser(user: User): boolean {
        return user.id > 0 && user.name.length > 0;
      }
      
      export class ValidationError extends Error {
        constructor(field: string, message: string) {
          super(\`Validation failed for \${field}: \${message}\`);
        }
      }
    }
  }
  
  export class DatabaseManager {
    private repositories = new Map<string, any>();
    
    constructor(private config: Connection) {}
    
    getRepository<T>(type: new (connection: Connection) => T): T {
      const key = type.name;
      if (!this.repositories.has(key)) {
        this.repositories.set(key, new type(this.config));
      }
      return this.repositories.get(key);
    }
  }
}`,

  /**
   * File with syntax errors
   */
  syntaxError: `/* eslint-disable */
// This file intentionally has syntax errors
function invalidFunction(
  // Missing closing parenthesis and opening brace
  
  const missingVar = 
  // Missing value
  
  class IncompleteClass {
    constructor() {
      // Missing closing brace
  
  // Invalid object literal
  const obj = {
    prop1: 'value1'
    prop2: 'value2' // Missing comma
    prop3: {
      nested: 
      // Missing value and closing brace
`,

  /**
   * Empty file
   */
  empty: '/* eslint-disable */\n// This file is intentionally empty\n',

  /**
   * File with only comments
   */
  onlyComments: `/* eslint-disable */
/**
 * This file contains only comments
 * No actual code constructs
 */
 
// Single line comment
/* Multi-line comment */

/*
 * Another multi-line comment
 * with multiple lines
 */`,
};
