import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { resolve } from 'node:path';
import { cliRunner } from '../common/cli-runner.js';
import { CLIAssertions, TestFileSystem } from '../common/test-utils.js';

describe('Multiple Files Processing', () => {
  let testFs: TestFileSystem;
  let testDir: string;
  let programFile: string;
  let utilityFile: string;

  beforeEach(() => {
    testFs = new TestFileSystem();
    testDir = resolve(__dirname, 'temp', 'multiple-files-' + Date.now());
    testFs.createDir(testDir);

    // Use the pre-created asset files
    programFile = resolve(__dirname, 'assets', 'program-file.ts');
    utilityFile = resolve(__dirname, 'assets', 'utility-file.ts');
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
      expect(fileResult.file).toContain('program-file.ts');
      expect(fileResult.outline).toBeTruthy();
      expect(fileResult.outline!.type).toBe('program');

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

      expect(functionDeclarations.length).toBeGreaterThan(0);
      expect(classDeclarations.length).toBeGreaterThan(0);
      expect(interfaceDeclarations.length).toBeGreaterThan(0);
      expect(enumDeclarations.length).toBeGreaterThan(0);
    });

    it('should process utility file with namespaces and advanced patterns', async () => {
      const result = await cliRunner.run([utilityFile, '--format', 'json']);

      CLIAssertions.expectSuccess(result);
      const parsed = CLIAssertions.expectValidJson(result);
      CLIAssertions.expectFilesProcessed(parsed, 1);

      const fileResult = parsed[0];
      expect(fileResult.file).toContain('utility-file.ts');

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

      expect(classes.length).toBeGreaterThan(0);
      expect(interfaces.length).toBeGreaterThan(0);
      expect(functions.length).toBeGreaterThan(0);
    });
  });

  describe('Multiple File Processing with Patterns', () => {
    it('should process both asset files when using glob pattern', async () => {
      const pattern = resolve(__dirname, 'assets', '*.ts');
      const result = await cliRunner.run([pattern, '--format', 'json']);

      CLIAssertions.expectSuccess(result);
      const parsed = CLIAssertions.expectValidJson(result);
      CLIAssertions.expectFilesProcessed(parsed, 2);

      // Should have both files
      const files = parsed.map((p) => p.file);
      expect(files.some((f) => f.includes('program-file.ts'))).toBe(true);
      expect(files.some((f) => f.includes('utility-file.ts'))).toBe(true);

      // Each file should have valid outline
      for (const fileResult of parsed) {
        expect(fileResult.outline).toBeTruthy();
        expect(fileResult.outline!.type).toBe('program');
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
      expect(files.some((f) => f.endsWith('.js'))).toBe(true);
      expect(files.some((f) => f.endsWith('.tsx'))).toBe(true);
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
      expect(jsonParsed).toHaveLength(yamlParsed.length);
      expect(jsonParsed[0].file).toBe(yamlParsed[0].file);

      if (jsonParsed[0].outline && yamlParsed[0].outline) {
        expect(jsonParsed[0].outline.type).toBe(yamlParsed[0].outline.type);
        expect(jsonParsed[0].outline.children?.length).toBe(
          yamlParsed[0].outline.children?.length
        );
      }

      // ASCII should contain file information
      expect(asciiResult.stdout).toContain('program-file.ts');
    });
  });

  describe('Performance and Large Files', () => {
    it('should handle processing multiple files efficiently', async () => {
      const pattern = resolve(__dirname, 'assets', '*.ts');
      const startTime = Date.now();

      const result = await cliRunner.run([pattern, '--format', 'json']);
      const duration = Date.now() - startTime;

      CLIAssertions.expectSuccess(result);
      const parsed = CLIAssertions.expectValidJson(result);
      CLIAssertions.expectFilesProcessed(parsed, 2);

      // Should complete in reasonable time (under 10 seconds for 2 files)
      expect(duration).toBeLessThan(10000);
    });

    it('should handle complex nested structures without issues', async () => {
      const result = await cliRunner.run([utilityFile, '--format', 'json']);

      CLIAssertions.expectSuccess(result);
      const parsed = CLIAssertions.expectValidJson(result);

      const fileResult = parsed[0];
      expect(fileResult.outline).toBeTruthy();

      // Count total nodes to ensure deep structures are parsed
      const totalNodes = CLIAssertions.countNodes(fileResult.outline!);
      expect(totalNodes).toBeGreaterThan(20); // Should have many nodes due to nested structures

      // Should have namespace with nested elements
      const namespaces = CLIAssertions.findNodesByType(
        fileResult.outline!,
        'namespace_declaration'
      );
      for (const ns of namespaces) {
        expect(ns.children).toBeTruthy();
        expect(ns.children!.length).toBeGreaterThan(0);
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
      expect(parsed.length).toBe(3); // All files processed

      // Good files should have outlines, bad file might have null outline
      const goodResults = parsed.filter((p) => p.file.includes('good'));
      expect(goodResults).toHaveLength(2);

      for (const goodResult of goodResults) {
        expect(goodResult.outline).toBeTruthy();
        expect(goodResult.outline!.type).toBe('program');
      }
    });
  });

  describe('File Path Integration', () => {
    it('should include correct file paths in results', async () => {
      const result = await cliRunner.run([programFile, '--format', 'json']);

      CLIAssertions.expectSuccess(result);
      const parsed = CLIAssertions.expectValidJson(result);

      const fileResult = parsed[0];
      expect(fileResult.file).toContain('program-file.ts');
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
      const assetDir = resolve(__dirname, 'assets');
      const relativeResult = await cliRunner.run(
        ['program-file.ts', '--format', 'json'],
        { cwd: assetDir }
      );
      CLIAssertions.expectSuccess(relativeResult);

      // Both should work successfully
      const absoluteParsed = CLIAssertions.expectValidJson(absoluteResult);
      const relativeParsed = CLIAssertions.expectValidJson(relativeResult);

      expect(absoluteParsed).toHaveLength(1);
      expect(relativeParsed).toHaveLength(1);

      // Structure should be identical
      expect(absoluteParsed[0].outline?.type).toBe(
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

      expect(interfaces.length).toBeGreaterThan(0);
      expect(enums.length).toBeGreaterThan(0);
      expect(classes.length).toBeGreaterThan(0);

      // Interfaces should have named properties
      for (const iface of interfaces) {
        expect(iface.name).toBeTruthy();
        expect(iface.name).toMatch(/Config|Flags/); // Based on our test file content
      }

      // Enums should have named members
      for (const enumDecl of enums) {
        expect(enumDecl.name).toBeTruthy();
        expect(enumDecl.children).toBeTruthy();
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

      expect(classes.length).toBeGreaterThan(0);
      expect(interfaces.length).toBeGreaterThan(0);
      expect(functions.length).toBeGreaterThan(0);

      // Check for method definitions in classes
      for (const classDecl of classes) {
        const methods = CLIAssertions.findNodesByType(
          classDecl,
          'method_definition'
        );
        if (methods.length > 0) {
          expect(methods[0].name).toBeTruthy();
        }
      }
    });
  });
});
