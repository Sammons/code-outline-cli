import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { cliRunner } from '../common/cli-runner.ts';
import { CLIAssertions, TestFileSystem } from '../common/test-utils.ts';

describe('Multiple Files Processing', () => {
  let testFs: TestFileSystem;
  let testDir: string;
  let programFile: string;
  let utilityFile: string;

  beforeEach(() => {
    testFs = new TestFileSystem();
    testDir = resolve(import.meta.dirname, 'temp', 'multiple-files-' + Date.now());
    testFs.createDir(testDir);

    // Use the pre-created asset files
    // Try to find assets relative to import.meta.dirname first, then fall back to project root
    const assetPath1 = resolve(import.meta.dirname, 'assets', 'program-file.ts');
    const assetPath2 = resolve(
      process.cwd(),
      'src/test-scenarios/_01-multiple-files/assets/program-file.ts'
    );

    if (existsSync(assetPath1)) {
      programFile = assetPath1;
      utilityFile = resolve(import.meta.dirname, 'assets', 'utility-file.ts');
    } else if (existsSync(assetPath2)) {
      programFile = assetPath2;
      utilityFile = resolve(
        process.cwd(),
        'src/test-scenarios/_01-multiple-files/assets/utility-file.ts'
      );
    } else {
      // Last resort - log error and use the original path
      if (process.env.CI || process.env.GITHUB_ACTIONS) {
        console.error('WARNING: Could not find test assets');
        console.error('  Tried:', assetPath1);
        console.error('  Tried:', assetPath2);
      }
      programFile = assetPath1;
      utilityFile = resolve(import.meta.dirname, 'assets', 'utility-file.ts');
    }
  });

  afterEach(() => {
    testFs.cleanup();
  });

  describe('Single File Processing', () => {
    it('should process a single TypeScript file with complex structures', async () => {
      const result = await cliRunner.run([programFile, '--format', 'json']);

      CLIAssertions.expectSuccess(result);
      const parsed = CLIAssertions.expectValidJson(result);
      CLIAssertions.expectFilesProcessed(parsed, 1);

      const fileResult = parsed[0];
      assert.ok(fileResult.file.includes('program-file.ts'));
      assert.ok(fileResult.outline);
      assert.strictEqual(fileResult.outline!.type, 'program');

      // Should contain various TypeScript constructs
      const functionDeclarations = CLIAssertions.findNodesByType(
        fileResult.outline!,
        'function_declaration'
      );
      const classDeclarations = CLIAssertions.findNodesByType(
        fileResult.outline!,
        'class_declaration'
      );
      const interfaceDeclarations = CLIAssertions.findNodesByType(
        fileResult.outline!,
        'interface_declaration'
      );
      const enumDeclarations = CLIAssertions.findNodesByType(
        fileResult.outline!,
        'enum_declaration'
      );

      assert.ok(functionDeclarations.length > 0);
      assert.ok(classDeclarations.length > 0);
      assert.ok(interfaceDeclarations.length > 0);
      assert.ok(enumDeclarations.length > 0);
    });

    it('should process utility file with namespaces and advanced patterns', async () => {
      const result = await cliRunner.run([utilityFile, '--format', 'json']);

      CLIAssertions.expectSuccess(result);
      const parsed = CLIAssertions.expectValidJson(result);
      CLIAssertions.expectFilesProcessed(parsed, 1);

      const fileResult = parsed[0];
      assert.ok(fileResult.file.includes('utility-file.ts'));

      // Should contain various TypeScript constructs
      const classes = CLIAssertions.findNodesByType(
        fileResult.outline!,
        'class_declaration'
      );
      const interfaces = CLIAssertions.findNodesByType(
        fileResult.outline!,
        'interface_declaration'
      );
      const functions = CLIAssertions.findNodesByType(
        fileResult.outline!,
        'function_declaration'
      );

      assert.ok(classes.length > 0);
      assert.ok(interfaces.length > 0);
      assert.ok(functions.length > 0);
    });
  });

  describe('Multiple File Processing with Patterns', () => {
    it('should process both asset files when using glob pattern', async () => {
      const pattern = resolve(import.meta.dirname, 'assets', '*.ts');
      const result = await cliRunner.run([pattern, '--format', 'json']);

      CLIAssertions.expectSuccess(result);
      const parsed = CLIAssertions.expectValidJson(result);
      CLIAssertions.expectFilesProcessed(parsed, 2);

      // Should have both files
      const files = parsed.map((p) => p.file);
      assert.strictEqual(files.some((f) => f.includes('program-file.ts')), true);
      assert.strictEqual(files.some((f) => f.includes('utility-file.ts')), true);

      // Each file should have valid outline
      for (const fileResult of parsed) {
        assert.ok(fileResult.outline);
        assert.strictEqual(fileResult.outline!.type, 'program');
      }
    });

    it('should handle mixed file extensions', async () => {
      // Create additional files with different extensions
      const jsFile = resolve(testDir, 'test.js');
      const tsxFile = resolve(testDir, 'component.tsx');

      testFs.writeFile(
        jsFile,
        `
        function testFunction() {
          return 'test';
        }
        
        const arrowFunc = () => 'arrow';
        
        class TestClass {
          constructor() {
            this.name = 'test';
          }
        }
      `
      );

      testFs.writeFile(
        tsxFile,
        `
        import React from 'react';
        
        interface Props {
          title: string;
        }
        
        const Component: React.FC<Props> = ({ title }) => {
          return <div>{title}</div>;
        };
        
        export default Component;
      `
      );

      const pattern = resolve(testDir, '*');
      const result = await cliRunner.run([pattern, '--format', 'json']);

      CLIAssertions.expectSuccess(result);
      const parsed = CLIAssertions.expectValidJson(result);
      CLIAssertions.expectFilesProcessed(parsed, 2);

      // Should process both JS and TSX files
      const files = parsed.map((p) => p.file);
      assert.strictEqual(files.some((f) => f.endsWith('.js')), true);
      assert.strictEqual(files.some((f) => f.endsWith('.tsx')), true);
    });
  });

  describe('Output Format Consistency', () => {
    it('should maintain consistent structure across output formats', async () => {
      const baseArgs = [programFile];

      // Test JSON format
      const jsonResult = await cliRunner.run([...baseArgs, '--format', 'json']);
      CLIAssertions.expectSuccess(jsonResult);
      const jsonParsed = CLIAssertions.expectValidJson(jsonResult);

      // Test YAML format
      const yamlResult = await cliRunner.run([...baseArgs, '--format', 'yaml']);
      CLIAssertions.expectSuccess(yamlResult);
      const yamlParsed = CLIAssertions.expectValidYaml(yamlResult);

      // Test ASCII format
      const asciiResult = await cliRunner.run([
        ...baseArgs,
        '--format',
        'ascii',
      ]);
      CLIAssertions.expectValidAscii(asciiResult);

      // JSON and YAML should have identical structure
      assert.strictEqual(jsonParsed.length, yamlParsed.length);
      assert.strictEqual(jsonParsed[0].file, yamlParsed[0].file);

      if (jsonParsed[0].outline && yamlParsed[0].outline) {
        assert.strictEqual(jsonParsed[0].outline.type, yamlParsed[0].outline.type);
        assert.strictEqual(jsonParsed[0].outline.children?.length, 
          yamlParsed[0].outline.children?.length
        );
      }

      // ASCII should contain file information
      assert.ok(asciiResult.stdout.includes('program-file.ts'));
    });
  });

  describe('Performance and Large Files', () => {
    it('should handle processing multiple files efficiently', async () => {
      const pattern = resolve(import.meta.dirname, 'assets', '*.ts');
      const startTime = Date.now();

      const result = await cliRunner.run([pattern, '--format', 'json']);
      const duration = Date.now() - startTime;

      CLIAssertions.expectSuccess(result);
      const parsed = CLIAssertions.expectValidJson(result);
      CLIAssertions.expectFilesProcessed(parsed, 2);

      // Should complete in reasonable time (under 10 seconds for 2 files)
      assert.ok(duration < 10000);
    });

    it('should handle complex nested structures without issues', async () => {
      const result = await cliRunner.run([utilityFile, '--format', 'json']);

      CLIAssertions.expectSuccess(result);
      const parsed = CLIAssertions.expectValidJson(result);

      const fileResult = parsed[0];
      assert.ok(fileResult.outline);

      // Count total nodes to ensure deep structures are parsed
      const totalNodes = CLIAssertions.countNodes(fileResult.outline!);
      assert.ok(totalNodes > 20); // Should have many nodes due to nested structures

      // Should have namespace with nested elements
      const namespaces = CLIAssertions.findNodesByType(
        fileResult.outline!,
        'namespace_declaration'
      );
      for (const ns of namespaces) {
        assert.ok(ns.children);
        assert.ok(ns.children!.length > 0);
      }
    });
  });

  describe('Error Resilience', () => {
    it('should continue processing other files when one file has issues', async () => {
      // Create a problematic file alongside good files
      const goodFile1 = resolve(testDir, 'good1.ts');
      const badFile = resolve(testDir, 'bad.ts');
      const goodFile2 = resolve(testDir, 'good2.ts');

      testFs.writeFile(goodFile1, 'export function good1() { return "good"; }');
      testFs.writeFile(badFile, 'invalid syntax {{{{ missing braces');
      testFs.writeFile(
        goodFile2,
        'export function good2() { return "also good"; }'
      );

      const pattern = resolve(testDir, '*.ts');
      const result = await cliRunner.run([pattern, '--format', 'json']);

      // Should succeed overall
      CLIAssertions.expectSuccess(result);
      const parsed = CLIAssertions.expectValidJson(result);
      assert.strictEqual(parsed.length, 3); // All files processed

      // Good files should have outlines, bad file might have null outline
      const goodResults = parsed.filter((p) => p.file.includes('good'));
      assert.strictEqual(goodResults.length, 2);

      for (const goodResult of goodResults) {
        assert.ok(goodResult.outline);
        assert.strictEqual(goodResult.outline!.type, 'program');
      }
    });
  });

  describe('File Path Integration', () => {
    it('should include correct file paths in results', async () => {
      const result = await cliRunner.run([programFile, '--format', 'json']);

      CLIAssertions.expectSuccess(result);
      const parsed = CLIAssertions.expectValidJson(result);

      const fileResult = parsed[0];
      assert.ok(fileResult.file.includes('program-file.ts'));
    });

    it('should handle relative and absolute paths correctly', async () => {
      // Test with absolute path
      const absoluteResult = await cliRunner.run([
        programFile,
        '--format',
        'json',
      ]);
      CLIAssertions.expectSuccess(absoluteResult);

      // Test with relative path from asset directory
      const assetDir = resolve(import.meta.dirname, 'assets');
      const relativeResult = await cliRunner.run(
        ['program-file.ts', '--format', 'json'],
        { cwd: assetDir }
      );
      CLIAssertions.expectSuccess(relativeResult);

      // Both should work successfully
      const absoluteParsed = CLIAssertions.expectValidJson(absoluteResult);
      const relativeParsed = CLIAssertions.expectValidJson(relativeResult);

      assert.strictEqual(absoluteParsed.length, 1);
      assert.strictEqual(relativeParsed.length, 1);

      // Structure should be identical
      assert.strictEqual(absoluteParsed[0].outline?.type, 
        relativeParsed[0].outline?.type
      );
    });
  });

  describe('Advanced Language Features', () => {
    it('should properly parse TypeScript-specific constructs', async () => {
      const result = await cliRunner.run([programFile, '--format', 'json']);

      CLIAssertions.expectSuccess(result);
      const parsed = CLIAssertions.expectValidJson(result);
      const outline = parsed[0].outline!;

      // Should find specific TypeScript constructs
      const interfaces = CLIAssertions.findNodesByType(
        outline,
        'interface_declaration'
      );
      const enums = CLIAssertions.findNodesByType(outline, 'enum_declaration');
      const classes = CLIAssertions.findNodesByType(
        outline,
        'class_declaration'
      );

      assert.ok(interfaces.length > 0);
      assert.ok(enums.length > 0);
      assert.ok(classes.length > 0);

      // Interfaces should have named properties
      for (const iface of interfaces) {
        assert.ok(iface.name);
        assert.match(iface.name, /Config|Flags/); // Based on our test file content
      }

      // Enums should have named members
      for (const enumDecl of enums) {
        assert.ok(enumDecl.name);
        assert.ok(enumDecl.children);
      }
    });

    it('should handle complex generic and namespace patterns', async () => {
      const result = await cliRunner.run([utilityFile, '--format', 'json']);

      CLIAssertions.expectSuccess(result);
      const parsed = CLIAssertions.expectValidJson(result);
      const outline = parsed[0].outline!;

      // Should find various complex constructs
      const classes = CLIAssertions.findNodesByType(
        outline,
        'class_declaration'
      );
      const interfaces = CLIAssertions.findNodesByType(
        outline,
        'interface_declaration'
      );
      const functions = CLIAssertions.findNodesByType(
        outline,
        'function_declaration'
      );

      assert.ok(classes.length > 0);
      assert.ok(interfaces.length > 0);
      assert.ok(functions.length > 0);

      // Check for method definitions in classes
      for (const classDecl of classes) {
        const methods = CLIAssertions.findNodesByType(
          classDecl,
          'method_definition'
        );
        if (methods.length > 0) {
          assert.ok(methods[0].name);
        }
      }
    });
  });
});
