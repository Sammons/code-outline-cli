import { writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import assert from 'node:assert/strict';
import type { ParseResult, NodeInfo } from '@sammons/code-outline-parser';
import type { CLIResult } from './cli-runner.ts';
import { parseYamlOutput } from './parse-yaml-output.ts';

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

export { TestAssets } from './assets/sample-constructs.ts';


/**
 * Assertion helpers for CLI results
 */
export class CLIAssertions {
  /**
   * Assert that CLI result is successful
   */
  static expectSuccess(result: CLIResult): void {
    assert.strictEqual(result.exitCode, 0);
  }

  /**
   * Assert that CLI result is a failure
   */
  static expectFailure(result: CLIResult): void {
    assert.notStrictEqual(result.exitCode, 0);
  }

  /**
   * Assert that CLI result contains specific error message
   */
  static expectErrorMessage(result: CLIResult, message: string): void {
    CLIAssertions.expectFailure(result);
    assert.ok(result.stderr.toLowerCase().includes(message.toLowerCase()));
  }

  /**
   * Assert and parse JSON output
   */
  static expectValidJson(result: CLIResult): ParseResult[] {
    CLIAssertions.expectSuccess(result);
    let parsed: ParseResult[];

    assert.doesNotThrow(() => {
      parsed = JSON.parse(result.stdout);
    });

    assert.strictEqual(Array.isArray(parsed!), true);
    return parsed!;
  }

  /**
   * Assert and parse YAML output
   */
  static expectValidYaml(result: CLIResult): ParseResult[] {
    CLIAssertions.expectSuccess(result);
    let parsed: ParseResult[];

    assert.doesNotThrow(() => {
      parsed = parseYamlOutput(result.stdout) as ParseResult[];
    });

    assert.strictEqual(Array.isArray(parsed!), true);
    return parsed!;
  }

  /**
   * Assert ASCII output format
   */
  static expectValidAscii(result: CLIResult): void {
    CLIAssertions.expectSuccess(result);

    // ASCII output should contain file folder icon and structure
    assert.ok(result.stdout.includes('📁'));

    // Should have some tree structure characters (common patterns)
    const treeChars = ['├─', '└─', '│', '├', '└'];
    const hasTreeStructure = treeChars.some((char) =>
      result.stdout.includes(char)
    );
    assert.strictEqual(hasTreeStructure, true);
  }

  /**
   * Assert that files are processed correctly
   */
  static expectFilesProcessed(
    results: ParseResult[],
    expectedFileCount: number
  ): void {
    assert.strictEqual(results.length, expectedFileCount);

    for (const result of results) {
      assert.ok(result.file);
      assert.strictEqual(typeof result.file, 'string');
      // outline can be null for files that couldn't be parsed
      if (result.outline) {
        assert.ok(result.outline.type);
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
    assert.ok(node.type);
    assert.strictEqual(typeof node.type, 'string');

    if (expectedType) {
      assert.strictEqual(node.type, expectedType);
    }

    assert.ok(node.start);
    assert.ok(node.end);
    assert.strictEqual(typeof node.start.row, 'number');
    assert.strictEqual(typeof node.start.column, 'number');
    assert.strictEqual(typeof node.end.row, 'number');
    assert.strictEqual(typeof node.end.column, 'number');

    if (expectedChildCount !== undefined) {
      assert.strictEqual(node.children?.length ?? 0, expectedChildCount);
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
    assert.ok(currentDepth <= maxDepth);

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
      assert.ok(allowedUnnamed.includes(node.type));
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
    assert.ok(result.stderr.includes('Warning'));
    assert.ok(result.stderr.toLowerCase().includes('glob'));
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
      import.meta.dirname,
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
    assert.ok(duration < maxMs);
  },
};
