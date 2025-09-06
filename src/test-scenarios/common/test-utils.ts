import { writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { expect } from 'vitest';
import type { ParseResult, NodeInfo } from '@code-outline/parser';
import type { CLIResult } from './cli-runner.js';
import yaml from 'js-yaml';

/**
 * File system utilities for test setup and cleanup
 */
export class TestFileSystem {
  private createdPaths: Set<string> = new Set();

  /**
   * Create a directory and track it for cleanup
   */
  createDir(path: string): void {
    mkdirSync(path, { recursive: true });
    this.createdPaths.add(path);
  }

  /**
   * Write a file and track it for cleanup
   */
  writeFile(filePath: string, content: string): void {
    const dir = dirname(filePath);
    if (!existsSync(dir)) {
      this.createDir(dir);
    }
    writeFileSync(filePath, content, 'utf8');
    this.createdPaths.add(filePath);
  }

  /**
   * Clean up all created files and directories
   */
  cleanup(): void {
    // Sort paths by depth (deepest first) for proper cleanup order
    const sortedPaths = Array.from(this.createdPaths).sort(
      (a, b) => b.split('/').length - a.split('/').length
    );

    for (const path of sortedPaths) {
      try {
        rmSync(path, { recursive: true, force: true });
      } catch (error) {
        // Ignore cleanup errors
        console.warn(`Warning: Failed to cleanup ${path}:`, error);
      }
    }
    this.createdPaths.clear();
  }

  /**
   * Get all tracked paths
   */
  getTrackedPaths(): string[] {
    return Array.from(this.createdPaths);
  }
}

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

/**
 * Assertion helpers for CLI results
 */
export class CLIAssertions {
  /**
   * Assert that CLI result is successful
   */
  static expectSuccess(result: CLIResult): void {
    expect(result.exitCode).toBe(0);
  }

  /**
   * Assert that CLI result is a failure
   */
  static expectFailure(result: CLIResult): void {
    expect(result.exitCode).not.toBe(0);
  }

  /**
   * Assert that CLI result contains specific error message
   */
  static expectErrorMessage(result: CLIResult, message: string): void {
    CLIAssertions.expectFailure(result);
    expect(result.stderr.toLowerCase()).toContain(message.toLowerCase());
  }

  /**
   * Assert and parse JSON output
   */
  static expectValidJson(result: CLIResult): ParseResult[] {
    CLIAssertions.expectSuccess(result);
    let parsed: ParseResult[];

    expect(() => {
      parsed = JSON.parse(result.stdout);
    }).not.toThrow();

    expect(Array.isArray(parsed!)).toBe(true);
    return parsed!;
  }

  /**
   * Assert and parse YAML output
   */
  static expectValidYaml(result: CLIResult): ParseResult[] {
    CLIAssertions.expectSuccess(result);
    let parsed: ParseResult[];

    expect(() => {
      parsed = yaml.load(result.stdout) as ParseResult[];
    }).not.toThrow();

    expect(Array.isArray(parsed!)).toBe(true);
    return parsed!;
  }

  /**
   * Assert ASCII output format
   */
  static expectValidAscii(result: CLIResult): void {
    CLIAssertions.expectSuccess(result);

    // ASCII output should contain file folder icon and structure
    expect(result.stdout).toContain('📁');

    // Should have some tree structure characters (common patterns)
    const treeChars = ['├─', '└─', '│', '├', '└'];
    const hasTreeStructure = treeChars.some((char) =>
      result.stdout.includes(char)
    );
    expect(hasTreeStructure).toBe(true);
  }

  /**
   * Assert that files are processed correctly
   */
  static expectFilesProcessed(
    results: ParseResult[],
    expectedFileCount: number
  ): void {
    expect(results).toHaveLength(expectedFileCount);

    for (const result of results) {
      expect(result.file).toBeTruthy();
      expect(typeof result.file).toBe('string');
      // outline can be null for files that couldn't be parsed
      if (result.outline) {
        expect(result.outline.type).toBeTruthy();
      }
    }
  }

  /**
   * Assert that node has expected structure
   */
  static expectNodeStructure(
    node: NodeInfo,
    expectedType?: string,
    expectedChildCount?: number
  ): void {
    expect(node.type).toBeTruthy();
    expect(typeof node.type).toBe('string');

    if (expectedType) {
      expect(node.type).toBe(expectedType);
    }

    expect(node.start).toBeTruthy();
    expect(node.end).toBeTruthy();
    expect(typeof node.start.row).toBe('number');
    expect(typeof node.start.column).toBe('number');
    expect(typeof node.end.row).toBe('number');
    expect(typeof node.end.column).toBe('number');

    if (expectedChildCount !== undefined) {
      expect(node.children?.length ?? 0).toBe(expectedChildCount);
    }
  }

  /**
   * Assert depth limitation
   */
  static expectMaxDepth(
    node: NodeInfo,
    maxDepth: number,
    currentDepth: number = 0
  ): void {
    expect(currentDepth).toBeLessThanOrEqual(maxDepth);

    if (node.children) {
      for (const child of node.children) {
        CLIAssertions.expectMaxDepth(child, maxDepth, currentDepth + 1);
      }
    }
  }

  /**
   * Assert named-only filtering
   */
  static expectNamedOnly(node: NodeInfo): void {
    // In named-only mode, nodes should either have names or be structural
    if (!node.name) {
      // These are structural types that are allowed even without names
      const allowedUnnamed = [
        'program',
        'class_body',
        'interface_body',
        'enum_body',
        'object',
        'statement_block',
        'function_body',
        'export_statement',
      ];
      expect(allowedUnnamed).toContain(node.type);
    }

    if (node.children) {
      for (const child of node.children) {
        CLIAssertions.expectNamedOnly(child);
      }
    }
  }

  /**
   * Assert warning message about unquoted globs
   */
  static expectGlobWarning(result: CLIResult): void {
    expect(result.stderr).toContain('Warning');
    expect(result.stderr.toLowerCase()).toContain('glob');
  }

  /**
   * Count total nodes in tree
   */
  static countNodes(node: NodeInfo): number {
    let count = 1; // Current node
    if (node.children) {
      for (const child of node.children) {
        count += CLIAssertions.countNodes(child);
      }
    }
    return count;
  }

  /**
   * Find nodes by type
   */
  static findNodesByType(node: NodeInfo, type: string): NodeInfo[] {
    const results: NodeInfo[] = [];

    if (node.type === type) {
      results.push(node);
    }

    if (node.children) {
      for (const child of node.children) {
        results.push(...CLIAssertions.findNodesByType(child, type));
      }
    }

    return results;
  }

  /**
   * Find named nodes
   */
  static findNamedNodes(node: NodeInfo): NodeInfo[] {
    const results: NodeInfo[] = [];

    if (node.name) {
      results.push(node);
    }

    if (node.children) {
      for (const child of node.children) {
        results.push(...CLIAssertions.findNamedNodes(child));
      }
    }

    return results;
  }
}

/**
 * Test scenario helper functions
 */
export const TestScenarios = {
  /**
   * Create a temporary test directory with cleanup
   */
  createTempDir(baseName: string): { path: string; fs: TestFileSystem } {
    const fs = new TestFileSystem();
    const tempPath = resolve(
      __dirname,
      '../temp',
      baseName,
      Date.now().toString()
    );
    fs.createDir(tempPath);

    return { path: tempPath, fs };
  },

  /**
   * Set up multiple test files for glob testing
   */
  setupMultipleFiles(
    fs: TestFileSystem,
    baseDir: string
  ): {
    jsFile: string;
    tsFile: string;
    tsxFile: string;
    subDir: string;
    nestedJsFile: string;
  } {
    const jsFile = resolve(baseDir, 'program-file.js');
    const tsFile = resolve(baseDir, 'utility-file.ts');
    const tsxFile = resolve(baseDir, 'component.tsx');
    const subDir = resolve(baseDir, 'nested');
    const nestedJsFile = resolve(subDir, 'nested-file.js');

    fs.writeFile(jsFile, TestAssets.simpleUtils);
    fs.writeFile(tsFile, TestAssets.complexClass);
    fs.writeFile(tsxFile, TestAssets.reactComponent);
    fs.writeFile(nestedJsFile, TestAssets.nestedStructure);

    return { jsFile, tsFile, tsxFile, subDir, nestedJsFile };
  },
};

/**
 * Performance testing utilities
 */
export const PerformanceUtils = {
  /**
   * Measure CLI execution time
   */
  measureExecution<T>(
    fn: () => Promise<T>
  ): Promise<{ result: T; duration: number }> {
    const start = Date.now();
    return fn().then((result) => ({
      result,
      duration: Date.now() - start,
    }));
  },

  /**
   * Assert execution time is within reasonable bounds
   */
  expectReasonablePerformance(duration: number, maxMs: number = 10000): void {
    expect(duration).toBeLessThan(maxMs);
  },
};
