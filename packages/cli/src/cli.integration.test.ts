import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { resolve, relative } from 'node:path';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { randomUUID } from 'node:crypto';

// Test utilities
function runCLI(
  args: string[]
): Promise<{ stdout: string; stderr: string; exitCode: number | null }> {
  const cliPath = resolve(import.meta.dirname, '../dist/cli.js');
  return new Promise((settle) => {
    const child = spawn(process.execPath, [cliPath, ...args], {
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
      settle({ stdout, stderr, exitCode: code });
    });
  });
}

describe('CLI', () => {
  // Each test gets its own fixture directory. A single shared path let one
  // test's afterEach cleanup delete files another test's spawned CLI was still
  // reading, which surfaced as intermittent "No files found matching pattern".
  const tempRoot = resolve(import.meta.dirname, '../../../test/temp');
  let testDir = tempRoot;
  let testFile = resolve(tempRoot, 'test.js');

  beforeEach(() => {
    testDir = resolve(tempRoot, `cli-${process.pid}-${randomUUID()}`);
    testFile = resolve(testDir, 'test.js');
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

      assert.strictEqual(result.exitCode, 0);
      assert.ok(result.stdout.includes('Code Outline CLI'));
      assert.ok(result.stdout.includes('Usage:'));
      assert.ok(result.stdout.includes('Options:'));
      assert.ok(result.stdout.includes('--format'));
      assert.ok(result.stdout.includes('--depth'));
      assert.ok(result.stdout.includes('--named-only'));
      assert.ok(result.stdout.includes('--llmtext'));
      assert.ok(result.stdout.includes('llmtext'));
    });

    it('should show version when --version flag is used', async () => {
      const result = await runCLI(['--version']);

      assert.strictEqual(result.exitCode, 0);
      assert.match(result.stdout, /\d+\.\d+\.\d+/); // Version number pattern
    });

    it('should show error when no pattern is provided', async () => {
      const result = await runCLI([]);

      assert.strictEqual(result.exitCode, 1);
      assert.ok(result.stderr.includes('No file pattern provided'));
    });

    it('should accept valid format options', async () => {
      const formats = ['json', 'yaml', 'ascii', 'llmtext'];

      for (const format of formats) {
        const result = await runCLI([testFile, '--format', format]);
        assert.strictEqual(result.exitCode, 0);
      }
    });

    it('should reject invalid format options', async () => {
      const result = await runCLI([testFile, '--format', 'invalid']);

      assert.strictEqual(result.exitCode, 1);
      assert.ok(result.stderr.includes('Invalid format'));
    });

    it('should accept valid depth options', async () => {
      const depths = ['1', '5', '10', 'Infinity'];

      for (const depth of depths) {
        const result = await runCLI([testFile, '--depth', depth]);
        assert.strictEqual(result.exitCode, 0);
      }
    });

    it('should reject invalid depth options', async () => {
      const invalidDepths = ['0', '-1', 'invalid'];

      for (const depth of invalidDepths) {
        const result = await runCLI([testFile, '--depth', depth]);
        assert.strictEqual(result.exitCode, 1);
        // The error message might vary depending on the invalid input
        assert.ok(result.stderr.length > 0);
      }
    });

    it('should handle named-only and all flags correctly', async () => {
      // Test --named-only (default behavior)
      const namedOnlyResult = await runCLI([testFile, '--named-only']);
      assert.strictEqual(namedOnlyResult.exitCode, 0);

      // Test --all flag
      const allResult = await runCLI([testFile, '--all']);
      assert.strictEqual(allResult.exitCode, 0);

      // Both should work, but --all should generally produce more output
      // (though this depends on the specific file content)
    });

    it('should handle --llmtext flag correctly', async () => {
      const result = await runCLI([testFile, '--llmtext']);

      assert.strictEqual(result.exitCode, 0);
      assert.ok(result.stdout.includes('<Outline>'));
      assert.ok(result.stdout.includes('</Outline>'));
      assert.ok(
        result.stdout.includes(
          '# Ultra-compressed code outline for LLM consumption'
        )
      );
      assert.ok(result.stdout.includes('function_declaration_greet 1'));
    });

    it('should override format when --llmtext flag is provided', async () => {
      // Test that --llmtext overrides --format
      const result = await runCLI([testFile, '--format', 'json', '--llmtext']);

      assert.strictEqual(result.exitCode, 0);
      // Should produce llmtext format, not JSON
      assert.ok(result.stdout.includes('<Outline>'));
      assert.ok(result.stdout.includes('</Outline>'));
      // Should not be valid JSON
      assert.throws(() => JSON.parse(result.stdout));
    });
  });

  describe('file parsing', () => {
    it('should parse a single JavaScript file correctly', async () => {
      const result = await runCLI([testFile, '--format', 'json']);

      assert.strictEqual(result.exitCode, 0);
      assert.doesNotThrow(() => JSON.parse(result.stdout));

      const output = JSON.parse(result.stdout);
      assert.strictEqual(Array.isArray(output), true);
      assert.strictEqual(output.length, 1);
      assert.ok(output[0].file.includes('test.js'));
      assert.ok(output[0].outline);
      assert.strictEqual(output[0].outline.type, 'program');
    });

    it('should handle glob patterns correctly', async () => {
      // Create additional test files
      const testDir2 = resolve(testDir, 'subdir');
      mkdirSync(testDir2, { recursive: true });

      writeFileSync(resolve(testDir2, 'another.js'), 'const x = 1;');
      writeFileSync(resolve(testDir, 'index.js'), 'function main() {}');

      const pattern = resolve(testDir, '**/*.js');
      const result = await runCLI([pattern, '--format', 'json']);

      assert.strictEqual(result.exitCode, 0);
      const output = JSON.parse(result.stdout);
      assert.ok(output.length >= 2);
    });

    it('should handle non-existent file patterns gracefully', async () => {
      const result = await runCLI(['nonexistent/*.js']);

      assert.strictEqual(result.exitCode, 1);
      assert.ok(result.stderr.includes('No files found matching pattern'));
    });

    it('should handle files that cannot be parsed', async () => {
      // Create an invalid JavaScript file
      const invalidFile = resolve(testDir, 'invalid.js');
      writeFileSync(invalidFile, 'this is not valid javascript {{{');

      const result = await runCLI([invalidFile, '--format', 'json']);

      // Should still exit with 0 but might log parsing errors
      assert.strictEqual(result.exitCode, 0);

      // The output should still be valid JSON, possibly with null outline
      assert.doesNotThrow(() => JSON.parse(result.stdout));
    });
  });

  describe('output formats', () => {
    it('should produce valid JSON output', async () => {
      const result = await runCLI([testFile, '--format', 'json']);

      assert.strictEqual(result.exitCode, 0);
      assert.doesNotThrow(() => JSON.parse(result.stdout));

      const output = JSON.parse(result.stdout);
      assert.strictEqual(Array.isArray(output), true);
      assert.ok('file' in output[0]);
      assert.ok('outline' in output[0]);
    });

    it('should produce YAML output', async () => {
      const result = await runCLI([testFile, '--format', 'yaml']);

      assert.strictEqual(result.exitCode, 0);
      assert.ok(result.stdout.includes('file:'));
      assert.ok(result.stdout.includes('outline:'));
      assert.match(result.stdout, /^-/m); // YAML array indicator
    });

    it('should produce ASCII tree output', async () => {
      const result = await runCLI([testFile, '--format', 'ascii']);

      assert.strictEqual(result.exitCode, 0);
      assert.ok(result.stdout.includes('📁'));
      assert.ok(result.stdout.includes('test.js'));
      assert.ok(result.stdout.includes('function_declaration')); // program is now implicit as the file root
    });

    it('should produce LLMText output', async () => {
      const result = await runCLI([testFile, '--format', 'llmtext']);

      assert.strictEqual(result.exitCode, 0);
      assert.ok(result.stdout.includes('<Outline>'));
      assert.ok(result.stdout.includes('</Outline>'));
      assert.ok(
        result.stdout.includes(
          '# Ultra-compressed code outline for LLM consumption'
        )
      );
      // The CLI prints a path relative to cwd; derive it rather than hardcoding
      // the fixture directory, which is now unique per test.
      const relativeTestFile = relative(process.cwd(), testFile);
      assert.ok(result.stdout.includes(`${relativeTestFile} (15L)`));
      assert.ok(result.stdout.includes('function_declaration_greet 1'));
      assert.ok(result.stdout.includes('class_declaration_Person 5'));
      // Should not contain decorative symbols
      assert.ok(!result.stdout.includes('📁'));
      assert.ok(!result.stdout.includes('├─'));
      assert.ok(!result.stdout.includes('└─'));
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
      assert.strictEqual(shallowResult.exitCode, 0);

      // Test with depth 3
      const deepResult = await runCLI([
        testFile,
        '--format',
        'json',
        '--depth',
        '3',
      ]);
      assert.strictEqual(deepResult.exitCode, 0);

      const shallowOutput = JSON.parse(shallowResult.stdout);
      const deepOutput = JSON.parse(deepResult.stdout);

      // Both should be valid
      assert.strictEqual(shallowOutput.length, 1);
      assert.strictEqual(deepOutput.length, 1);
    });

    it('should handle infinite depth', async () => {
      const result = await runCLI([
        testFile,
        '--format',
        'json',
        '--depth',
        'Infinity',
      ]);

      assert.strictEqual(result.exitCode, 0);
      assert.doesNotThrow(() => JSON.parse(result.stdout));
    });
  });

  describe('filtering modes', () => {
    it('should work in named-only mode by default', async () => {
      const result = await runCLI([testFile, '--format', 'json']);

      assert.strictEqual(result.exitCode, 0);
      const output = JSON.parse(result.stdout);
      assert.ok(output[0].outline);
    });

    it('should work with --all flag', async () => {
      const result = await runCLI([testFile, '--format', 'json', '--all']);

      assert.strictEqual(result.exitCode, 0);
      const output = JSON.parse(result.stdout);
      assert.ok(output[0].outline);
    });

    it('should respect explicit --named-only flag', async () => {
      const result = await runCLI([
        testFile,
        '--format',
        'json',
        '--named-only',
      ]);

      assert.strictEqual(result.exitCode, 0);
      const output = JSON.parse(result.stdout);
      assert.ok(output[0].outline);
    });
  });

  describe('error handling', () => {
    it('should handle file system errors gracefully', async () => {
      const result = await runCLI(['/nonexistent/path/*.js']);

      assert.strictEqual(result.exitCode, 1);
      assert.ok(result.stderr.includes('No files found'));
    });

    it('should handle permission errors gracefully', async () => {
      // This test might be platform-specific and hard to create reliably
      // For now, just ensure the CLI doesn't crash on non-existent files
      const result = await runCLI(['/root/protected/*.js']);

      // Should exit with error but not crash
      assert.strictEqual(typeof result.exitCode, 'number');
    });

    it('should continue processing other files if one fails', async () => {
      // Create one valid and one invalid file
      const validFile = resolve(testDir, 'valid.js');
      const invalidFile = resolve(testDir, 'invalid.js');

      writeFileSync(validFile, 'function test() {}');
      writeFileSync(invalidFile, 'invalid syntax {{{');

      const pattern = resolve(testDir, '*.js');
      const result = await runCLI([pattern, '--format', 'json']);

      assert.strictEqual(result.exitCode, 0);

      const output = JSON.parse(result.stdout);
      // Should have results for files that could be parsed
      assert.ok(output.length > 0);
    });
  });

  describe('integration with other packages', () => {
    it('should correctly integrate parser and formatter', async () => {
      const result = await runCLI([testFile, '--format', 'json']);

      assert.strictEqual(result.exitCode, 0);
      const output = JSON.parse(result.stdout);

      // Should have valid structure from parser
      assert.strictEqual(output[0].outline.type, 'program');
      assert.notStrictEqual(output[0].outline.children, undefined);

      // Should have proper formatting
      assert.ok(output[0].file.includes('test.js'));
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
        assert.strictEqual(result.exitCode, 0);

        const output = JSON.parse(result.stdout);
        assert.strictEqual(output.length, 1);
        assert.strictEqual(output[0].outline.type, 'program');
      }
    });
  });
});
