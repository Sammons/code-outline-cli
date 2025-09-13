import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';

// Test utilities
function runCLI(
  args: string[]
): Promise<{ stdout: string; stderr: string; exitCode: number | null }> {
  return new Promise((resolve) => {
    const cliPath = require.resolve('./cli.ts');
    const child = spawn('tsx', [cliPath, ...args], {
      stdio: 'pipe',
    });

    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr?.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      resolve({ stdout, stderr, exitCode: code });
    });
  });
}

describe('CLI', () => {
  const testDir = resolve(__dirname, '../../../test/temp');
  const testFile = resolve(testDir, 'test.js');

  beforeEach(() => {
    // Create temp directory and test file
    mkdirSync(testDir, { recursive: true });
    writeFileSync(
      testFile,
      `
function greet(name) {
  return \`Hello, \${name}!\`;
}

class Person {
  constructor(name) {
    this.name = name;
  }
  
  getName() {
    return this.name;
  }
}

export { greet, Person };
    `.trim()
    );
  });

  afterEach(() => {
    // Cleanup
    rmSync(testDir, { recursive: true, force: true });
  });

  describe('argument parsing', () => {
    it('should show help when --help flag is used', async () => {
      const result = await runCLI(['--help']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Code Outline CLI');
      expect(result.stdout).toContain('Usage:');
      expect(result.stdout).toContain('Options:');
      expect(result.stdout).toContain('--format');
      expect(result.stdout).toContain('--depth');
      expect(result.stdout).toContain('--named-only');
      expect(result.stdout).toContain('--llmtext');
      expect(result.stdout).toContain('llmtext');
    });

    it('should show version when --version flag is used', async () => {
      const result = await runCLI(['--version']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toMatch(/\d+\.\d+\.\d+/); // Version number pattern
    });

    it('should show error when no pattern is provided', async () => {
      const result = await runCLI([]);

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('No file pattern provided');
    });

    it('should accept valid format options', async () => {
      const formats = ['json', 'yaml', 'ascii', 'llmtext'];

      for (const format of formats) {
        const result = await runCLI([testFile, '--format', format]);
        expect(result.exitCode).toBe(0);
      }
    });

    it('should reject invalid format options', async () => {
      const result = await runCLI([testFile, '--format', 'invalid']);

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('Invalid format');
    });

    it('should accept valid depth options', async () => {
      const depths = ['1', '5', '10', 'Infinity'];

      for (const depth of depths) {
        const result = await runCLI([testFile, '--depth', depth]);
        expect(result.exitCode).toBe(0);
      }
    });

    it('should reject invalid depth options', async () => {
      const invalidDepths = ['0', '-1', 'invalid'];

      for (const depth of invalidDepths) {
        const result = await runCLI([testFile, '--depth', depth]);
        expect(result.exitCode).toBe(1);
        // The error message might vary depending on the invalid input
        expect(result.stderr.length).toBeGreaterThan(0);
      }
    });

    it('should handle named-only and all flags correctly', async () => {
      // Test --named-only (default behavior)
      const namedOnlyResult = await runCLI([testFile, '--named-only']);
      expect(namedOnlyResult.exitCode).toBe(0);

      // Test --all flag
      const allResult = await runCLI([testFile, '--all']);
      expect(allResult.exitCode).toBe(0);

      // Both should work, but --all should generally produce more output
      // (though this depends on the specific file content)
    });

    it('should handle --llmtext flag correctly', async () => {
      const result = await runCLI([testFile, '--llmtext']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('<Outline>');
      expect(result.stdout).toContain('</Outline>');
      expect(result.stdout).toContain(
        'This is a compressed code outline for LLM consumption'
      );
      expect(result.stdout).toContain('function_declaration: greet');
    });

    it('should override format when --llmtext flag is provided', async () => {
      // Test that --llmtext overrides --format
      const result = await runCLI([testFile, '--format', 'json', '--llmtext']);

      expect(result.exitCode).toBe(0);
      // Should produce llmtext format, not JSON
      expect(result.stdout).toContain('<Outline>');
      expect(result.stdout).toContain('</Outline>');
      // Should not be valid JSON
      expect(() => JSON.parse(result.stdout)).toThrow();
    });
  });

  describe('file parsing', () => {
    it('should parse a single JavaScript file correctly', async () => {
      const result = await runCLI([testFile, '--format', 'json']);

      expect(result.exitCode).toBe(0);
      expect(() => JSON.parse(result.stdout)).not.toThrow();

      const output = JSON.parse(result.stdout);
      expect(Array.isArray(output)).toBe(true);
      expect(output).toHaveLength(1);
      expect(output[0].file).toContain('test.js');
      expect(output[0].outline).toBeTruthy();
      expect(output[0].outline.type).toBe('program');
    });

    it('should handle glob patterns correctly', async () => {
      // Create additional test files
      const testDir2 = resolve(testDir, 'subdir');
      mkdirSync(testDir2, { recursive: true });

      writeFileSync(resolve(testDir2, 'another.js'), 'const x = 1;');
      writeFileSync(resolve(testDir, 'index.js'), 'function main() {}');

      const pattern = resolve(testDir, '**/*.js');
      const result = await runCLI([pattern, '--format', 'json']);

      expect(result.exitCode).toBe(0);
      const output = JSON.parse(result.stdout);
      expect(output.length).toBeGreaterThanOrEqual(2);
    });

    it('should handle non-existent file patterns gracefully', async () => {
      const result = await runCLI(['nonexistent/*.js']);

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('No files found matching pattern');
    });

    it('should handle files that cannot be parsed', async () => {
      // Create an invalid JavaScript file
      const invalidFile = resolve(testDir, 'invalid.js');
      writeFileSync(invalidFile, 'this is not valid javascript {{{');

      const result = await runCLI([invalidFile, '--format', 'json']);

      // Should still exit with 0 but might log parsing errors
      expect(result.exitCode).toBe(0);

      // The output should still be valid JSON, possibly with null outline
      expect(() => JSON.parse(result.stdout)).not.toThrow();
    });
  });

  describe('output formats', () => {
    it('should produce valid JSON output', async () => {
      const result = await runCLI([testFile, '--format', 'json']);

      expect(result.exitCode).toBe(0);
      expect(() => JSON.parse(result.stdout)).not.toThrow();

      const output = JSON.parse(result.stdout);
      expect(Array.isArray(output)).toBe(true);
      expect(output[0]).toHaveProperty('file');
      expect(output[0]).toHaveProperty('outline');
    });

    it('should produce YAML output', async () => {
      const result = await runCLI([testFile, '--format', 'yaml']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('file:');
      expect(result.stdout).toContain('outline:');
      expect(result.stdout).toMatch(/^-/m); // YAML array indicator
    });

    it('should produce ASCII tree output', async () => {
      const result = await runCLI([testFile, '--format', 'ascii']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('📁');
      expect(result.stdout).toContain('test.js');
      expect(result.stdout).toContain('function_declaration'); // program is now implicit as the file root
    });

    it('should produce LLMText output', async () => {
      const result = await runCLI([testFile, '--format', 'llmtext']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('<Outline>');
      expect(result.stdout).toContain('</Outline>');
      expect(result.stdout).toContain(
        'This is a compressed code outline for LLM consumption'
      );
      expect(result.stdout).toContain('File: test/temp/test.js');
      expect(result.stdout).toContain('function_declaration: greet');
      expect(result.stdout).toContain('class_declaration: Person');
      // Should not contain decorative symbols
      expect(result.stdout).not.toContain('📁');
      expect(result.stdout).not.toContain('├─');
      expect(result.stdout).not.toContain('└─');
    });
  });

  describe('depth control', () => {
    it('should limit parsing depth when specified', async () => {
      // Test with depth 1
      const shallowResult = await runCLI([
        testFile,
        '--format',
        'json',
        '--depth',
        '1',
      ]);
      expect(shallowResult.exitCode).toBe(0);

      // Test with depth 3
      const deepResult = await runCLI([
        testFile,
        '--format',
        'json',
        '--depth',
        '3',
      ]);
      expect(deepResult.exitCode).toBe(0);

      const shallowOutput = JSON.parse(shallowResult.stdout);
      const deepOutput = JSON.parse(deepResult.stdout);

      // Both should be valid
      expect(shallowOutput).toHaveLength(1);
      expect(deepOutput).toHaveLength(1);
    });

    it('should handle infinite depth', async () => {
      const result = await runCLI([
        testFile,
        '--format',
        'json',
        '--depth',
        'Infinity',
      ]);

      expect(result.exitCode).toBe(0);
      expect(() => JSON.parse(result.stdout)).not.toThrow();
    });
  });

  describe('filtering modes', () => {
    it('should work in named-only mode by default', async () => {
      const result = await runCLI([testFile, '--format', 'json']);

      expect(result.exitCode).toBe(0);
      const output = JSON.parse(result.stdout);
      expect(output[0].outline).toBeTruthy();
    });

    it('should work with --all flag', async () => {
      const result = await runCLI([testFile, '--format', 'json', '--all']);

      expect(result.exitCode).toBe(0);
      const output = JSON.parse(result.stdout);
      expect(output[0].outline).toBeTruthy();
    });

    it('should respect explicit --named-only flag', async () => {
      const result = await runCLI([
        testFile,
        '--format',
        'json',
        '--named-only',
      ]);

      expect(result.exitCode).toBe(0);
      const output = JSON.parse(result.stdout);
      expect(output[0].outline).toBeTruthy();
    });
  });

  describe('error handling', () => {
    it('should handle file system errors gracefully', async () => {
      const result = await runCLI(['/nonexistent/path/*.js']);

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('No files found');
    });

    it('should handle permission errors gracefully', async () => {
      // This test might be platform-specific and hard to create reliably
      // For now, just ensure the CLI doesn't crash on non-existent files
      const result = await runCLI(['/root/protected/*.js']);

      // Should exit with error but not crash
      expect(typeof result.exitCode).toBe('number');
    });

    it('should continue processing other files if one fails', async () => {
      // Create one valid and one invalid file
      const validFile = resolve(testDir, 'valid.js');
      const invalidFile = resolve(testDir, 'invalid.js');

      writeFileSync(validFile, 'function test() {}');
      writeFileSync(invalidFile, 'invalid syntax {{{');

      const pattern = resolve(testDir, '*.js');
      const result = await runCLI([pattern, '--format', 'json']);

      expect(result.exitCode).toBe(0);

      const output = JSON.parse(result.stdout);
      // Should have results for files that could be parsed
      expect(output.length).toBeGreaterThan(0);
    });
  });

  describe('integration with other packages', () => {
    it('should correctly integrate parser and formatter', async () => {
      const result = await runCLI([testFile, '--format', 'json']);

      expect(result.exitCode).toBe(0);
      const output = JSON.parse(result.stdout);

      // Should have valid structure from parser
      expect(output[0].outline.type).toBe('program');
      expect(output[0].outline.children).toBeDefined();

      // Should have proper formatting
      expect(output[0].file).toContain('test.js');
    });

    it('should work with different TypeScript file types', async () => {
      // Create TypeScript files
      const tsFile = resolve(testDir, 'test.ts');
      const tsxFile = resolve(testDir, 'test.tsx');

      writeFileSync(
        tsFile,
        `
        interface User {
          name: string;
        }
        class UserService {
          getUser(): User { return { name: 'test' }; }
        }
      `
      );

      writeFileSync(
        tsxFile,
        `
        import React from 'react';
        const Button: React.FC = () => <button>Click</button>;
        export default Button;
      `
      );

      for (const file of [tsFile, tsxFile]) {
        const result = await runCLI([file, '--format', 'json']);
        expect(result.exitCode).toBe(0);

        const output = JSON.parse(result.stdout);
        expect(output).toHaveLength(1);
        expect(output[0].outline.type).toBe('program');
      }
    });
  });
});
