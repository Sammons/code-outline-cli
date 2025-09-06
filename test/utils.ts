/**
 * Test utilities for the code-outline project
 */

import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { NodeInfo, TreeUtils } from '@code-outline/parser';

/**
 * Create a temporary test file with given content
 */
export function createTestFile(path: string, content: string): void {
  const dir = dirname(path);
  mkdirSync(dir, { recursive: true });
  writeFileSync(path, content);
}

/**
 * Clean up test files and directories
 */
export function cleanupTestFiles(path: string): void {
  rmSync(path, { recursive: true, force: true });
}

/**
 * Count total nodes in a NodeInfo tree
 */
export function countNodes(node: NodeInfo): number {
  return TreeUtils.countNodes(node);
}

/**
 * Find nodes by type in a NodeInfo tree
 */
export function findNodesByType(node: NodeInfo, type: string): NodeInfo[] {
  return TreeUtils.findNodesByType(node, type);
}

/**
 * Find nodes by name in a NodeInfo tree
 */
export function findNodesByName(node: NodeInfo, name: string): NodeInfo[] {
  return TreeUtils.findNodesByName(node, name);
}

/**
 * Sample JavaScript code for testing
 */
export const sampleJavaScript = `
// Sample JavaScript file
const greeting = 'Hello World';

function greet(name) {
  return \`\${greeting}, \${name}!\`;
}

const calculator = {
  add: (a, b) => a + b,
  subtract: (a, b) => a - b,
  multiply: function(a, b) {
    return a * b;
  }
};

class Person {
  constructor(name, age) {
    this.name = name;
    this.age = age;
  }

  getName() {
    return this.name;
  }

  getAge() {
    return this.age;
  }
}

export { greet, calculator };
export default Person;
`.trim();

/**
 * Sample TypeScript code for testing
 */
export const sampleTypeScript = `
// Sample TypeScript file
interface User {
  id: number;
  name: string;
  email?: string;
}

type Status = 'active' | 'inactive' | 'pending';

enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  MODERATOR = 'moderator'
}

class UserService {
  private users: User[] = [];

  constructor(private apiKey: string) {}

  async getUser(id: number): Promise<User | null> {
    return this.users.find(user => user.id === id) || null;
  }

  addUser(user: User): void {
    this.users.push(user);
  }

  get userCount(): number {
    return this.users.length;
  }
}

function createUser(name: string, id: number): User {
  return { id, name };
}

const defaultUser: User = {
  id: 1,
  name: 'Default User'
};

export { User, Status, UserRole, UserService, createUser };
export default defaultUser;
`.trim();

/**
 * Sample React TSX code for testing
 */
export const sampleTSX = `
// Sample React TSX file
import React, { useState, useEffect } from 'react';

interface Props {
  title: string;
  count?: number;
}

const Button: React.FC<Props> = ({ title, count = 0 }) => {
  const [clicks, setClicks] = useState(count);

  useEffect(() => {
    console.log(\`Button clicked \${clicks} times\`);
  }, [clicks]);

  const handleClick = () => {
    setClicks(prev => prev + 1);
  };

  return (
    <button onClick={handleClick}>
      {title}: {clicks}
    </button>
  );
};

class ClassComponent extends React.Component<Props> {
  state = {
    value: 0
  };

  componentDidMount() {
    console.log('Component mounted');
  }

  render() {
    return (
      <div>
        <h1>{this.props.title}</h1>
        <p>Value: {this.state.value}</p>
      </div>
    );
  }
}

export default Button;
export { ClassComponent };
`.trim();

/**
 * Create a mock NodeInfo for testing
 */
export function createMockNodeInfo(
  type: string,
  name?: string,
  children?: NodeInfo[]
): NodeInfo {
  return {
    type,
    name,
    start: { row: 0, column: 0 },
    end: { row: 1, column: 0 },
    children,
  };
}
