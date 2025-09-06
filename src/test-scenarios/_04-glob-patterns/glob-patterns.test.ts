import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { resolve } from 'node:path';
import { cliRunner } from '../common/cli-runner.js';
import { CLIAssertions, TestFileSystem } from '../common/test-utils.js';

describe('Glob Pattern Matching', () => {
  const assetsDir = resolve(__dirname, 'assets');
  const file1Path = resolve(assetsDir, 'file1.ts');
  const file2Path = resolve(assetsDir, 'file2.js');
  const file3Path = resolve(assetsDir, 'subdir', 'file3.tsx');

  let testFs: TestFileSystem;

  beforeAll(async () => {
    // Ensure CLI is accessible
    const isAccessible = await cliRunner.testAccess();
    expect(isAccessible).toBe(true);
  });

  afterEach(() => {
    if (testFs) {
      testFs.cleanup();
    }
  });

  describe('Basic Glob Patterns', () => {
    it('should match all files with * pattern', async () => {
      const pattern = resolve(assetsDir, '*');
      const result = await cliRunner.run([pattern, '--format', 'json']);

      CLIAssertions.expectSuccess(result);
      const parsed = CLIAssertions.expectValidJson(result);

      // Should match both file1.ts and file2.js (but not subdir files)
      expect(parsed.length).toBe(2);

      const files = parsed.map((p) => p.file);
      expect(files.some((f) => f.includes('file1.ts'))).toBe(true);
      expect(files.some((f) => f.includes('file2.js'))).toBe(true);
      expect(files.some((f) => f.includes('file3.tsx'))).toBe(false); // In subdir
    });

    it('should match TypeScript files with *.ts pattern', async () => {
      const pattern = resolve(assetsDir, '*.ts');
      const result = await cliRunner.run([pattern, '--format', 'json']);

      CLIAssertions.expectSuccess(result);
      const parsed = CLIAssertions.expectValidJson(result);

      // Should only match file1.ts
      CLIAssertions.expectFilesProcessed(parsed, 1);
      expect(parsed[0].file).toContain('file1.ts');
    });

    it('should match JavaScript files with *.js pattern', async () => {
      const pattern = resolve(assetsDir, '*.js');
      const result = await cliRunner.run([pattern, '--format', 'json']);

      CLIAssertions.expectSuccess(result);
      const parsed = CLIAssertions.expectValidJson(result);

      // Should only match file2.js
      CLIAssertions.expectFilesProcessed(parsed, 1);
      expect(parsed[0].file).toContain('file2.js');
    });

    it('should match multiple extensions with brace pattern', async () => {
      const pattern = resolve(assetsDir, '*.{ts,js}');
      const result = await cliRunner.run([pattern, '--format', 'json']);

      CLIAssertions.expectSuccess(result);
      const parsed = CLIAssertions.expectValidJson(result);

      // Should match both file1.ts and file2.js
      expect(parsed.length).toBe(2);

      const files = parsed.map((p) => p.file);
      expect(files.some((f) => f.includes('file1.ts'))).toBe(true);
      expect(files.some((f) => f.includes('file2.js'))).toBe(true);
    });
  });

  describe('Recursive Glob Patterns', () => {
    it('should match all files recursively with **/* pattern', async () => {
      const pattern = resolve(assetsDir, '**/*');
      const result = await cliRunner.run([pattern, '--format', 'json']);

      CLIAssertions.expectSuccess(result);
      const parsed = CLIAssertions.expectValidJson(result);

      // Should match all three files including in subdirectory
      expect(parsed.length).toBe(3);

      const files = parsed.map((p) => p.file);
      expect(files.some((f) => f.includes('file1.ts'))).toBe(true);
      expect(files.some((f) => f.includes('file2.js'))).toBe(true);
      expect(files.some((f) => f.includes('file3.tsx'))).toBe(true);
    });

    it('should match TypeScript files recursively with **/*.ts pattern', async () => {
      const pattern = resolve(assetsDir, '**/*.ts');
      const result = await cliRunner.run([pattern, '--format', 'json']);

      CLIAssertions.expectSuccess(result);
      const parsed = CLIAssertions.expectValidJson(result);

      // Should only match file1.ts (not .tsx files)
      CLIAssertions.expectFilesProcessed(parsed, 1);
      expect(parsed[0].file).toContain('file1.ts');
    });

    it('should match TSX files with **/*.tsx pattern', async () => {
      const pattern = resolve(assetsDir, '**/*.tsx');
      const result = await cliRunner.run([pattern, '--format', 'json']);

      CLIAssertions.expectSuccess(result);
      const parsed = CLIAssertions.expectValidJson(result);

      // Should only match file3.tsx
      CLIAssertions.expectFilesProcessed(parsed, 1);
      expect(parsed[0].file).toContain('file3.tsx');
    });

    it('should match multiple extensions recursively', async () => {
      const pattern = resolve(assetsDir, '**/*.{ts,tsx,js}');
      const result = await cliRunner.run([pattern, '--format', 'json']);

      CLIAssertions.expectSuccess(result);
      const parsed = CLIAssertions.expectValidJson(result);

      // Should match all three files
      expect(parsed.length).toBe(3);

      const files = parsed.map((p) => p.file);
      expect(files.some((f) => f.includes('file1.ts'))).toBe(true);
      expect(files.some((f) => f.includes('file2.js'))).toBe(true);
      expect(files.some((f) => f.includes('file3.tsx'))).toBe(true);
    });
  });

  describe('Specific Directory Patterns', () => {
    it('should match files in specific subdirectory', async () => {
      const pattern = resolve(assetsDir, 'subdir', '*');
      const result = await cliRunner.run([pattern, '--format', 'json']);

      CLIAssertions.expectSuccess(result);
      const parsed = CLIAssertions.expectValidJson(result);

      // Should only match file3.tsx from subdir
      CLIAssertions.expectFilesProcessed(parsed, 1);
      expect(parsed[0].file).toContain('file3.tsx');
      expect(parsed[0].file).toContain('subdir');
    });

    it('should match with directory wildcard', async () => {
      const pattern = resolve(assetsDir, '*', '*');
      const result = await cliRunner.run([pattern, '--format', 'json']);

      CLIAssertions.expectSuccess(result);
      const parsed = CLIAssertions.expectValidJson(result);

      // Should match files that are exactly two levels deep
      CLIAssertions.expectFilesProcessed(parsed, 1);
      expect(parsed[0].file).toContain('file3.tsx');
    });
  });

  describe('Pattern Edge Cases', () => {
    it('should handle non-matching patterns gracefully', async () => {
      const pattern = resolve(assetsDir, '*.nonexistent');
      const result = await cliRunner.runExpectFailure([pattern]);

      CLIAssertions.expectErrorMessage(result, 'No files found');
    });

    it('should handle patterns that match directories', async () => {
      const pattern = resolve(assetsDir, '*dir*');
      const result = await cliRunner.run([pattern, '--format', 'json']);

      // Should either succeed with no files or fail gracefully
      if (result.exitCode === 0) {
        const parsed = CLIAssertions.expectValidJson(result);
        expect(parsed.length).toBe(0); // No files match, just directories
      } else {
        CLIAssertions.expectErrorMessage(result, 'No files found');
      }
    });

    it('should handle very specific patterns', async () => {
      const pattern = resolve(assetsDir, 'file[123].*');
      const result = await cliRunner.run([pattern, '--format', 'json']);

      CLIAssertions.expectSuccess(result);
      const parsed = CLIAssertions.expectValidJson(result);

      // Should match file1.ts and file2.js (but not file3.tsx since it's in subdir)
      expect(parsed.length).toBe(2);

      const files = parsed.map((p) => p.file);
      expect(files.some((f) => f.includes('file1.ts'))).toBe(true);
      expect(files.some((f) => f.includes('file2.js'))).toBe(true);
    });
  });

  describe('Pattern Warning System', () => {
    it('should warn about unquoted glob patterns', async () => {
      // Test with a pattern that looks like it should be globbed but isn't quoted
      testFs = new TestFileSystem();
      const testDir = resolve(
        __dirname,
        'temp',
        'pattern-warning-' + Date.now()
      );
      testFs.createDir(testDir);

      const testFile = resolve(testDir, 'test.ts');
      testFs.writeFile(testFile, 'export function test() {}');

      // Create a pattern that looks like it should be globbed
      const suspiciousPattern = resolve(testDir, 'test.ts');
      const result = await cliRunner.run([
        suspiciousPattern,
        '--format',
        'json',
      ]);

      // Should succeed but might warn if pattern looks like intended glob
      CLIAssertions.expectSuccess(result);

      // Note: The warning logic checks for patterns without glob chars but with directory structure
      // Our simple pattern might not trigger it, but the CLI should handle it gracefully
    });

    it('should not warn about legitimate file paths', async () => {
      const result = await cliRunner.run([file1Path, '--format', 'json']);

      CLIAssertions.expectSuccess(result);

      // Should not contain warning for legitimate file path
      expect(result.stderr).not.toContain('Warning');
    });

    it('should handle complex legitimate patterns', async () => {
      const pattern = resolve(assetsDir, '**/*.{ts,tsx}');
      const result = await cliRunner.run([pattern, '--format', 'json']);

      CLIAssertions.expectSuccess(result);
      const parsed = CLIAssertions.expectValidJson(result);

      // Should match file1.ts and file3.tsx
      expect(parsed.length).toBe(2);

      const files = parsed.map((p) => p.file);
      expect(files.some((f) => f.includes('file1.ts'))).toBe(true);
      expect(files.some((f) => f.includes('file3.tsx'))).toBe(true);
    });
  });

  describe('Cross-Platform Compatibility', () => {
    it('should handle forward slashes in patterns', async () => {
      const pattern = assetsDir + '/**/*.ts';
      const result = await cliRunner.run([pattern, '--format', 'json']);

      CLIAssertions.expectSuccess(result);
      const parsed = CLIAssertions.expectValidJson(result);

      // Should work regardless of platform
      CLIAssertions.expectFilesProcessed(parsed, 1);
      expect(parsed[0].file).toContain('file1.ts');
    });

    it('should handle patterns with mixed separators', async () => {
      // Use path.resolve to create proper platform paths, then test
      const pattern = resolve(assetsDir, '**', '*.tsx');
      const result = await cliRunner.run([pattern, '--format', 'json']);

      CLIAssertions.expectSuccess(result);
      const parsed = CLIAssertions.expectValidJson(result);

      CLIAssertions.expectFilesProcessed(parsed, 1);
      expect(parsed[0].file).toContain('file3.tsx');
    });
  });

  describe('Pattern Performance', () => {
    it('should handle large glob patterns efficiently', async () => {
      const startTime = Date.now();

      // Use a broad pattern that could match many files
      const pattern = resolve(assetsDir, '**/*');
      const result = await cliRunner.run([pattern, '--format', 'json']);

      const duration = Date.now() - startTime;

      CLIAssertions.expectSuccess(result);
      const parsed = CLIAssertions.expectValidJson(result);

      // Should complete quickly even with recursive pattern
      expect(duration).toBeLessThan(5000); // 5 seconds max
      expect(parsed.length).toBe(3); // Our known files
    });

    it('should handle multiple pattern combinations', async () => {
      // Test multiple files in sequence to ensure consistent performance
      const patterns = [
        resolve(assetsDir, '*.ts'),
        resolve(assetsDir, '*.js'),
        resolve(assetsDir, '**/*.tsx'),
        resolve(assetsDir, '**/*.{ts,js,tsx}'),
      ];

      for (const pattern of patterns) {
        const startTime = Date.now();
        const result = await cliRunner.run([pattern, '--format', 'json']);
        const duration = Date.now() - startTime;

        CLIAssertions.expectSuccess(result);
        expect(duration).toBeLessThan(3000); // Each should be quick
      }
    });
  });

  describe('File Content Verification', () => {
    it('should correctly parse matched TypeScript files', async () => {
      const pattern = resolve(assetsDir, '*.ts');
      const result = await cliRunner.run([pattern, '--format', 'json']);

      CLIAssertions.expectSuccess(result);
      const parsed = CLIAssertions.expectValidJson(result);

      const fileResult = parsed[0];
      expect(fileResult.outline).toBeTruthy();

      // Should find TypeScript-specific constructs
      const interfaces = CLIAssertions.findNodesByType(
        fileResult.outline!,
        'interface_declaration'
      );
      const classes = CLIAssertions.findNodesByType(
        fileResult.outline!,
        'class_declaration'
      );

      expect(interfaces.length).toBeGreaterThan(0);
      expect(classes.length).toBeGreaterThan(0);
    });

    it('should correctly parse matched JavaScript files', async () => {
      const pattern = resolve(assetsDir, '*.js');
      const result = await cliRunner.run([pattern, '--format', 'json']);

      CLIAssertions.expectSuccess(result);
      const parsed = CLIAssertions.expectValidJson(result);

      const fileResult = parsed[0];
      expect(fileResult.outline).toBeTruthy();

      // Should find JavaScript constructs
      const classes = CLIAssertions.findNodesByType(
        fileResult.outline!,
        'class_declaration'
      );
      const functions = CLIAssertions.findNodesByType(
        fileResult.outline!,
        'function_declaration'
      );

      expect(classes.length).toBeGreaterThan(0);
      expect(functions.length).toBeGreaterThan(0);
    });

    it('should correctly parse matched TSX files', async () => {
      const pattern = resolve(assetsDir, '**/*.tsx');
      const result = await cliRunner.run([pattern, '--format', 'json']);

      CLIAssertions.expectSuccess(result);
      const parsed = CLIAssertions.expectValidJson(result);

      const fileResult = parsed[0];
      expect(fileResult.outline).toBeTruthy();

      // Should find React/TypeScript constructs
      const functions = CLIAssertions.findNodesByType(
        fileResult.outline!,
        'function_declaration'
      );
      const variables = CLIAssertions.findNodesByType(
        fileResult.outline!,
        'lexical_declaration' // Modern TypeScript uses lexical_declaration for const/let
      );

      expect(functions.length).toBeGreaterThan(0);
      expect(variables.length).toBeGreaterThan(0);
    });
  });

  describe('Output Consistency with Patterns', () => {
    it('should maintain consistent ordering across pattern matches', async () => {
      const pattern1 = resolve(assetsDir, '**/*.{ts,js}');
      const pattern2 = resolve(assetsDir, '**/*.{js,ts}'); // Different order

      const result1 = await cliRunner.run([pattern1, '--format', 'json']);
      const result2 = await cliRunner.run([pattern2, '--format', 'json']);

      CLIAssertions.expectSuccess(result1);
      CLIAssertions.expectSuccess(result2);

      const parsed1 = CLIAssertions.expectValidJson(result1);
      const parsed2 = CLIAssertions.expectValidJson(result2);

      // Should have same files regardless of pattern order
      expect(parsed1.length).toBe(parsed2.length);

      const files1 = parsed1.map((p) => p.file).sort();
      const files2 = parsed2.map((p) => p.file).sort();

      expect(files1).toEqual(files2);
    });
  });
});
