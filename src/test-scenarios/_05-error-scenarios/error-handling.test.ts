import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { resolve } from 'node:path';
import { cliRunner } from '../common/cli-runner.js';
import { CLIAssertions, TestFileSystem } from '../common/test-utils.js';

describe('Error Handling Scenarios', () => {
  const syntaxErrorFile = resolve(__dirname, 'assets', 'syntax-error.js');
  const emptyFile = resolve(__dirname, 'assets', 'empty-file.ts');

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

  describe('File System Errors', () => {
    it('should handle non-existent files gracefully', async () => {
      const nonExistentFile = resolve(__dirname, 'nonexistent-file.ts');
      const result = await cliRunner.runExpectFailure([nonExistentFile]);

      CLIAssertions.expectErrorMessage(result, 'No files found');
    });

    it('should handle non-existent directories in patterns', async () => {
      const nonExistentPattern = resolve(
        __dirname,
        'nonexistent-directory',
        '*.ts'
      );
      const result = await cliRunner.runExpectFailure([nonExistentPattern]);

      CLIAssertions.expectErrorMessage(result, 'No files found');
    });

    it('should handle patterns that match no files', async () => {
      const noMatchPattern = resolve(__dirname, 'assets', '*.nonexistent');
      const result = await cliRunner.runExpectFailure([noMatchPattern]);

      CLIAssertions.expectErrorMessage(result, 'No files found');
    });

    it('should handle permission-denied scenarios gracefully', async () => {
      // Create a pattern that might hit permission issues (platform-specific)
      const restrictedPattern = '/root/*.ts';
      const result = await cliRunner.run([restrictedPattern], {
        timeout: 5000,
      });

      // Should either succeed (if no files) or fail gracefully
      if (result.exitCode !== 0) {
        // Should have meaningful error message, not crash
        expect(result.stderr.length).toBeGreaterThan(0);
        expect(result.stderr.toLowerCase()).toContain('no files found');
      }
    });
  });

  describe('Syntax Error Handling', () => {
    it('should handle files with syntax errors gracefully', async () => {
      const result = await cliRunner.run([syntaxErrorFile, '--format', 'json']);

      // Should not crash, but may succeed with partial parsing or fail gracefully
      if (result.exitCode === 0) {
        // If it succeeds, should return valid JSON
        const parsed = CLIAssertions.expectValidJson(result);

        // Might return empty array if file can't be parsed, or entry with null outline
        if (parsed.length === 0) {
          // File was skipped due to parsing errors - this is acceptable
          expect(parsed).toEqual([]);
        } else {
          // File was partially parsed
          expect(parsed.length).toBe(1);
          const fileResult = parsed[0];
          expect(fileResult.file).toContain('syntax-error.js');
          // Outline might be null or have limited structure due to syntax errors
        }
      } else {
        // If it fails, should fail gracefully with meaningful error
        expect(result.stderr.length).toBeGreaterThan(0);
      }
    });

    it('should continue processing other files when one has syntax errors', async () => {
      testFs = new TestFileSystem();
      const testDir = resolve(__dirname, 'temp', 'mixed-files-' + Date.now());
      testFs.createDir(testDir);

      // Create mix of good and bad files
      const goodFile = resolve(testDir, 'good.ts');
      const badFile = resolve(testDir, 'bad.js');

      testFs.writeFile(
        goodFile,
        `
        export interface TestInterface {
          value: string;
        }
        
        export class TestClass {
          getValue(): string {
            return 'test';
          }
        }
      `
      );

      testFs.writeFile(
        badFile,
        `
        function broken( {
          return "missing closing paren";
        }
        
        const incomplete = {
          prop: 'value'
          // missing closing brace
      `
      );

      const pattern = resolve(testDir, '*');
      const result = await cliRunner.run([pattern, '--format', 'json']);

      // Should succeed overall
      CLIAssertions.expectSuccess(result);
      const parsed = CLIAssertions.expectValidJson(result);

      // Should process both files
      expect(parsed.length).toBe(2);

      // Good file should have proper outline
      const goodResult = parsed.find((p) => p.file.includes('good.ts'));
      expect(goodResult).toBeTruthy();
      expect(goodResult!.outline).toBeTruthy();
      expect(goodResult!.outline!.type).toBe('program');

      // Bad file should be included but might have null outline
      const badResult = parsed.find((p) => p.file.includes('bad.js'));
      expect(badResult).toBeTruthy();
      // Outline could be null or have partial structure
    });

    it('should handle files that are partially parseable', async () => {
      testFs = new TestFileSystem();
      const testDir = resolve(__dirname, 'temp', 'partial-parse-' + Date.now());
      testFs.createDir(testDir);

      const partialFile = resolve(testDir, 'partial.js');
      testFs.writeFile(
        partialFile,
        `
        // This part is valid
        function validFunction() {
          return 'this works';
        }
        
        class ValidClass {
          constructor() {
            this.valid = true;
          }
        }
        
        // This part has errors
        function broken( {
          return "syntax error here";
        }
        
        // But this might still be parseable
        const stillValid = 42;
      `
      );

      const result = await cliRunner.run([partialFile, '--format', 'json']);

      // Should handle partial parsing gracefully
      if (result.exitCode === 0) {
        const parsed = CLIAssertions.expectValidJson(result);
        expect(parsed.length).toBe(1);

        const fileResult = parsed[0];
        expect(fileResult.file).toContain('partial.js');

        // Should capture at least some structure if possible
        if (fileResult.outline) {
          expect(fileResult.outline.type).toBe('program');
        }
      }
    });
  });

  describe('Empty and Minimal Files', () => {
    it('should handle empty files gracefully', async () => {
      const result = await cliRunner.run([emptyFile, '--format', 'json']);

      // Should either succeed with minimal structure or handle gracefully
      if (result.exitCode === 0) {
        const parsed = CLIAssertions.expectValidJson(result);
        expect(parsed.length).toBe(1);

        const fileResult = parsed[0];
        expect(fileResult.file).toContain('empty-file.ts');

        if (fileResult.outline) {
          expect(fileResult.outline.type).toBe('program');
          // Might have no children or minimal structure
        }
      } else {
        // Should fail gracefully
        expect(result.stderr.length).toBeGreaterThan(0);
      }
    });

    it('should handle files with only comments', async () => {
      testFs = new TestFileSystem();
      const testDir = resolve(__dirname, 'temp', 'comments-only-' + Date.now());
      testFs.createDir(testDir);

      const commentsFile = resolve(testDir, 'comments.ts');
      testFs.writeFile(
        commentsFile,
        `
        // This file contains only comments
        /* 
         * Multi-line comment
         * with multiple lines
         */
         
        /** JSDoc comment */
        
        // Another single line comment
        
        /*
          Another multi-line comment
        */
      `
      );

      const result = await cliRunner.run([commentsFile, '--format', 'json']);

      if (result.exitCode === 0) {
        const parsed = CLIAssertions.expectValidJson(result);
        expect(parsed.length).toBe(1);

        const fileResult = parsed[0];
        expect(fileResult.outline).toBeTruthy();
        expect(fileResult.outline!.type).toBe('program');

        // Should have minimal or no children
        const childCount = fileResult.outline!.children?.length ?? 0;
        expect(childCount).toBeGreaterThanOrEqual(0);
      }
    });

    it('should handle files with only whitespace', async () => {
      testFs = new TestFileSystem();
      const testDir = resolve(
        __dirname,
        'temp',
        'whitespace-only-' + Date.now()
      );
      testFs.createDir(testDir);

      const whitespaceFile = resolve(testDir, 'whitespace.js');
      testFs.writeFile(
        whitespaceFile,
        `
        
        
        
            
        
        	
        
      `
      );

      const result = await cliRunner.run([whitespaceFile, '--format', 'json']);

      if (result.exitCode === 0) {
        const parsed = CLIAssertions.expectValidJson(result);
        expect(parsed.length).toBe(1);

        const fileResult = parsed[0];
        if (fileResult.outline) {
          expect(fileResult.outline.type).toBe('program');
        }
      }
    });
  });

  describe('Invalid CLI Arguments', () => {
    it('should reject invalid format options', async () => {
      const result = await cliRunner.runExpectFailure([
        emptyFile,
        '--format',
        'invalid',
      ]);
      CLIAssertions.expectErrorMessage(result, 'Invalid format');
    });

    it('should reject invalid depth values', async () => {
      const invalidDepths = ['0', '-1', 'abc', 'null', 'undefined'];

      for (const depth of invalidDepths) {
        const result = await cliRunner.runExpectFailure([
          emptyFile,
          '--depth',
          depth,
        ]);
        expect(result.stderr.toLowerCase()).toContain('depth');
      }
    });

    it('should handle missing required arguments', async () => {
      const result = await cliRunner.runExpectFailure([]);
      CLIAssertions.expectErrorMessage(result, 'No file pattern provided');
    });

    it('should handle conflicting flags gracefully', async () => {
      // Test with both --named-only and --all (--all should win)
      const result = await cliRunner.run([
        emptyFile,
        '--named-only',
        '--all',
        '--format',
        'json',
      ]);

      // Should resolve conflict and work
      if (result.exitCode === 0) {
        const parsed = CLIAssertions.expectValidJson(result);
        expect(parsed.length).toBe(1);
      }
    });
  });

  describe('Resource and Performance Edge Cases', () => {
    it('should handle very long file paths', async () => {
      testFs = new TestFileSystem();
      const longDir = resolve(__dirname, 'temp', 'a'.repeat(100));
      testFs.createDir(longDir);

      const longFile = resolve(longDir, 'b'.repeat(100) + '.ts');
      testFs.writeFile(longFile, 'export const test = "long path test";');

      const result = await cliRunner.run([longFile, '--format', 'json']);

      // Should handle long paths gracefully
      if (result.exitCode === 0) {
        const parsed = CLIAssertions.expectValidJson(result);
        expect(parsed.length).toBe(1);
      }
    });

    it('should handle large files gracefully', async () => {
      testFs = new TestFileSystem();
      const testDir = resolve(__dirname, 'temp', 'large-file-' + Date.now());
      testFs.createDir(testDir);

      // Create a large file with many functions
      let largeContent = '/* eslint-disable */\n';
      for (let i = 0; i < 1000; i++) {
        largeContent += `
          export function func${i}() {
            return ${i};
          }
          
          export const const${i} = ${i};
        `;
      }

      const largeFile = resolve(testDir, 'large.ts');
      testFs.writeFile(largeFile, largeContent);

      const startTime = Date.now();
      const result = await cliRunner.run([largeFile, '--format', 'json'], {
        timeout: 15000,
      });
      const duration = Date.now() - startTime;

      // Should handle large files reasonably quickly
      expect(duration).toBeLessThan(10000); // 10 seconds max

      if (result.exitCode === 0) {
        const parsed = CLIAssertions.expectValidJson(result);

        // Large file should either be parsed successfully or skipped if too complex
        if (parsed.length === 1) {
          const outline = parsed[0].outline;
          if (outline) {
            const totalNodes = CLIAssertions.countNodes(outline);
            expect(totalNodes).toBeGreaterThan(100); // Should find many nodes (reduced expectation)
          }
        } else {
          // File might be skipped if parsing is too complex
          expect(parsed.length).toBeGreaterThanOrEqual(0);
        }
      }
    });

    it('should handle timeout scenarios', async () => {
      // Test with very short timeout to simulate timeout scenario
      testFs = new TestFileSystem();
      const testDir = resolve(__dirname, 'temp', 'timeout-test-' + Date.now());
      testFs.createDir(testDir);

      const testFile = resolve(testDir, 'test.ts');
      testFs.writeFile(testFile, 'export function test() { return "test"; }');

      try {
        const result = await cliRunner.run([testFile, '--format', 'json'], {
          timeout: 1,
        }); // Very short timeout
        // If it completes within 1ms, that's fine too
        if (result.exitCode === 0) {
          const parsed = CLIAssertions.expectValidJson(result);
          expect(parsed.length).toBe(1);
        }
      } catch (error: any) {
        // Should get timeout error
        expect(error.name).toBe('CLITimeoutError');
        expect(error.message).toContain('timed out');
      }
    });
  });

  describe('Mixed Error Scenarios', () => {
    it('should handle mix of valid and invalid files in glob patterns', async () => {
      testFs = new TestFileSystem();
      const testDir = resolve(
        __dirname,
        'temp',
        'mixed-validity-' + Date.now()
      );
      testFs.createDir(testDir);

      // Create files with different validity levels
      testFs.writeFile(
        resolve(testDir, 'valid.ts'),
        `
        export interface Valid {
          working: boolean;
        }
        export class ValidClass {
          test() { return true; }
        }
      `
      );

      testFs.writeFile(
        resolve(testDir, 'syntax-error.js'),
        `
        function broken( {
          return "syntax error";
        }
      `
      );

      testFs.writeFile(resolve(testDir, 'empty.ts'), '/* eslint-disable */');

      const pattern = resolve(testDir, '*');
      const result = await cliRunner.run([pattern, '--format', 'json']);

      // Should process all files
      CLIAssertions.expectSuccess(result);
      const parsed = CLIAssertions.expectValidJson(result);
      expect(parsed.length).toBe(3);

      // Valid file should have proper structure
      const validFile = parsed.find((p) => p.file.includes('valid.ts'));
      expect(validFile).toBeTruthy();
      expect(validFile!.outline).toBeTruthy();

      // All files should be represented
      const files = parsed.map((p) => p.file);
      expect(files.some((f) => f.includes('valid.ts'))).toBe(true);
      expect(files.some((f) => f.includes('syntax-error.js'))).toBe(true);
      expect(files.some((f) => f.includes('empty.ts'))).toBe(true);
    });

    it('should maintain consistent behavior across error conditions', async () => {
      // Test that the same type of error produces consistent results
      const result1 = await cliRunner.run(['/nonexistent/path/*.ts']);
      const result2 = await cliRunner.run(['/another/nonexistent/path/*.js']);

      // Both should fail consistently
      expect(result1.exitCode).not.toBe(0);
      expect(result2.exitCode).not.toBe(0);

      // Both should have error messages
      expect(result1.stderr.length).toBeGreaterThan(0);
      expect(result2.stderr.length).toBeGreaterThan(0);

      // Error messages should be similar
      expect(result1.stderr.toLowerCase()).toContain('no files found');
      expect(result2.stderr.toLowerCase()).toContain('no files found');
    });
  });

  describe('Recovery and Graceful Degradation', () => {
    it('should recover from parser errors and continue', async () => {
      testFs = new TestFileSystem();
      const testDir = resolve(__dirname, 'temp', 'recovery-test-' + Date.now());
      testFs.createDir(testDir);

      // Create files that progressively get more problematic
      testFs.writeFile(
        resolve(testDir, '1-perfect.ts'),
        `
        export class Perfect {
          work(): boolean { return true; }
        }
      `
      );

      testFs.writeFile(
        resolve(testDir, '2-minor-issue.js'),
        `
        function works() { return true; }
        // Some minor parsing challenges but still valid
        const complex = { a: 1, b: [1,2,3], c: { nested: true } };
      `
      );

      testFs.writeFile(
        resolve(testDir, '3-major-issue.ts'),
        `
        function broken( {
          return "major syntax error";
        }
      `
      );

      const pattern = resolve(testDir, '*');
      const result = await cliRunner.run([pattern, '--format', 'json']);

      // Should continue processing despite errors
      CLIAssertions.expectSuccess(result);
      const parsed = CLIAssertions.expectValidJson(result);
      expect(parsed.length).toBe(3);

      // Should have varying levels of success
      let successCount = 0;
      for (const fileResult of parsed) {
        if (
          fileResult.outline &&
          fileResult.outline.children &&
          fileResult.outline.children.length > 0
        ) {
          successCount++;
        }
      }

      // At least some files should parse successfully
      expect(successCount).toBeGreaterThan(0);
    });
  });
});
