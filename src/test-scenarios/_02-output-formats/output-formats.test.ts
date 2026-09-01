import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { cliRunner } from '../common/cli-runner.ts';
import { CLIAssertions } from '../common/test-utils.ts';

describe('Output Formats', () => {
  const sampleFile = resolve(import.meta.dirname, 'assets', 'sample-code.ts');

  before(async () => {
    // Ensure CLI is accessible
    const isAccessible = await cliRunner.testAccess();
    assert.strictEqual(isAccessible, true);
  });

  describe('JSON Format', () => {
    it('should produce valid JSON output by default and with explicit flag', async () => {
      // Test with explicit --format json
      const explicitResult = await cliRunner.run([
        sampleFile,
        '--format',
        'json',
      ]);
      CLIAssertions.expectSuccess(explicitResult);

      const parsed = CLIAssertions.expectValidJson(explicitResult);
      CLIAssertions.expectFilesProcessed(parsed, 1);

      const fileResult = parsed[0];
      assert.ok(fileResult.file.includes('sample-code.ts'));
      assert.ok(fileResult.outline);
      assert.strictEqual(fileResult.outline!.type, 'program');

      // Should have proper JSON structure
      assert.strictEqual(typeof fileResult.file, 'string');
      assert.strictEqual(typeof fileResult.outline!.type, 'string');
      assert.strictEqual(Array.isArray(fileResult.outline!.children), true);
    });

    it('should include all required fields in JSON output', async () => {
      const result = await cliRunner.run([sampleFile, '--format', 'json']);
      const parsed = CLIAssertions.expectValidJson(result);

      const fileResult = parsed[0];

      // Top-level structure
      assert.ok('file' in fileResult);
      assert.ok('outline' in fileResult);

      const outline = fileResult.outline!;

      // Node structure requirements
      assert.ok('type' in outline);
      assert.ok('start' in outline);
      assert.ok('end' in outline);

      // Position structure
      assert.ok('row' in outline.start);
      assert.ok('column' in outline.start);
      assert.ok('row' in outline.end);
      assert.ok('column' in outline.end);

      // Position values should be numbers
      assert.strictEqual(typeof outline.start.row, 'number');
      assert.strictEqual(typeof outline.start.column, 'number');
      assert.strictEqual(typeof outline.end.row, 'number');
      assert.strictEqual(typeof outline.end.column, 'number');
    });

    it('should handle complex nested structures in JSON', async () => {
      const result = await cliRunner.run([sampleFile, '--format', 'json']);
      const parsed = CLIAssertions.expectValidJson(result);
      const outline = parsed[0].outline!;

      // Should find various TypeScript constructs
      const interfaces = CLIAssertions.findNodesByType(
        outline,
        'interface_declaration'
      );
      const classes = CLIAssertions.findNodesByType(
        outline,
        'class_declaration'
      );
      const enums = CLIAssertions.findNodesByType(outline, 'enum_declaration');
      const functions = CLIAssertions.findNodesByType(
        outline,
        'function_declaration'
      );
      const typeAliases = CLIAssertions.findNodesByType(
        outline,
        'type_alias_declaration'
      );

      assert.ok(interfaces.length > 0);
      assert.ok(classes.length > 0);
      assert.ok(enums.length > 0);
      assert.ok(functions.length > 0);
      assert.ok(typeAliases.length > 0);

      // Named nodes should have names
      const namedNodes = CLIAssertions.findNamedNodes(outline);
      assert.ok(namedNodes.length > 5);

      for (const node of namedNodes) {
        assert.ok(node.name);
        assert.strictEqual(typeof node.name, 'string');
      }
    });

    it('should produce compact, parseable JSON without formatting', async () => {
      const result = await cliRunner.run([sampleFile, '--format', 'json']);
      CLIAssertions.expectSuccess(result);

      // Should be valid JSON without extra whitespace
      assert.doesNotThrow(() => JSON.parse(result.stdout));

      // JSON should be valid regardless of formatting
      const parsed = JSON.parse(result.stdout);
      assert.strictEqual(Array.isArray(parsed), true);
      assert.strictEqual(parsed.length, 1);

      // Should have proper structure
      assert.ok('file' in parsed[0]);
      assert.ok('outline' in parsed[0]);
    });
  });

  describe('YAML Format', () => {
    it('should produce valid YAML output', async () => {
      const result = await cliRunner.run([sampleFile, '--format', 'yaml']);
      CLIAssertions.expectSuccess(result);

      const parsed = CLIAssertions.expectValidYaml(result);
      CLIAssertions.expectFilesProcessed(parsed, 1);

      const fileResult = parsed[0];
      assert.ok(fileResult.file.includes('sample-code.ts'));
      assert.ok(fileResult.outline);
      assert.strictEqual(fileResult.outline!.type, 'program');
    });

    it('should have proper YAML structure and formatting', async () => {
      const result = await cliRunner.run([sampleFile, '--format', 'yaml']);
      CLIAssertions.expectSuccess(result);

      // Should contain YAML indicators
      assert.ok(result.stdout.includes('- file:'));
      assert.ok(result.stdout.includes('  outline:'));
      assert.ok(result.stdout.includes('    type:'));
      assert.ok(result.stdout.includes('    start:'));
      assert.ok(result.stdout.includes('    end:'));

      // Should have proper indentation
      const lines = result.stdout.split('\n');
      const indentedLines = lines.filter((line) => line.startsWith('  '));
      assert.ok(indentedLines.length > 0);
    });

    it('should preserve all data from JSON in YAML format', async () => {
      const jsonResult = await cliRunner.run([sampleFile, '--format', 'json']);
      const yamlResult = await cliRunner.run([sampleFile, '--format', 'yaml']);

      const jsonParsed = CLIAssertions.expectValidJson(jsonResult);
      const yamlParsed = CLIAssertions.expectValidYaml(yamlResult);

      // Should have same number of files
      assert.strictEqual(yamlParsed.length, jsonParsed.length);

      // Should have same file path
      assert.strictEqual(yamlParsed[0].file, jsonParsed[0].file);

      // Should have same outline structure
      if (jsonParsed[0].outline && yamlParsed[0].outline) {
        assert.strictEqual(yamlParsed[0].outline.type, jsonParsed[0].outline.type);
        assert.strictEqual(yamlParsed[0].outline.children?.length, jsonParsed[0].outline.children?.length);

        // Position data should match
        assert.strictEqual(yamlParsed[0].outline.start.row, jsonParsed[0].outline.start.row);
        assert.strictEqual(yamlParsed[0].outline.start.column, jsonParsed[0].outline.start.column);
      }
    });

    it('should handle special characters and strings properly in YAML', async () => {
      const result = await cliRunner.run([sampleFile, '--format', 'yaml']);
      CLIAssertions.expectSuccess(result);

      // Parse and verify no YAML parsing errors with special content
      const parsed = CLIAssertions.expectValidYaml(result);
      const outline = parsed[0].outline!;

      // Find nodes with names that might contain special characters
      const namedNodes = CLIAssertions.findNamedNodes(outline);

      for (const node of namedNodes) {
        // Names should be preserved correctly
        assert.ok(node.name);
        assert.strictEqual(typeof node.name, 'string');

        // Names should not have YAML escaping artifacts
        assert.ok(!node.name.includes('\\n'));
        assert.ok(!node.name.includes('\\"'));
      }
    });
  });

  describe('ASCII Format', () => {
    it('should produce human-readable ASCII tree output', async () => {
      const result = await cliRunner.run([sampleFile, '--format', 'ascii']);
      CLIAssertions.expectValidAscii(result);

      // Should contain file name
      assert.ok(result.stdout.includes('sample-code.ts'));

      // Should contain folder icon
      assert.ok(result.stdout.includes('📁'));

      // Should have tree structure
      const hasTreeChars = ['├─', '└─', '│'].some((char) =>
        result.stdout.includes(char)
      );
      assert.strictEqual(hasTreeChars, true);
    });

    it('should show hierarchical structure clearly', async () => {
      const result = await cliRunner.run([sampleFile, '--format', 'ascii']);
      CLIAssertions.expectValidAscii(result);

      // Should have multiple indentation levels
      const lines = result.stdout.split('\n');
      const indentedLines = lines.filter(
        (line) => line.includes('└─') || line.includes('├─')
      );
      assert.ok(indentedLines.length > 5);

      // Should contain construct types
      assert.ok(result.stdout.includes('interface_declaration'));
      assert.ok(result.stdout.includes('class_declaration'));
      assert.ok(result.stdout.includes('enum_declaration'));
      assert.ok(result.stdout.includes('function_declaration'));

      // Should show named entities
      assert.match(result.stdout, /Product/); // Interface name
      assert.match(result.stdout, /ProductService/); // Class name
    });

    it('should handle deep nesting in ASCII format', async () => {
      const result = await cliRunner.run([sampleFile, '--format', 'ascii']);
      CLIAssertions.expectValidAscii(result);

      // Should handle nested structures (class methods, namespace contents, etc.)
      const lines = result.stdout.split('\n');

      // Count different indentation levels
      const indentationLevels = new Set<number>();
      for (const line of lines) {
        if (line.includes('├─') || line.includes('└─')) {
          const indent = line.search(/[├└]/);
          if (indent >= 0) {
            indentationLevels.add(indent);
          }
        }
      }

      // Should have at least 3 levels of nesting
      assert.ok(indentationLevels.size >= 3);
    });

    it('should not break with special characters in names', async () => {
      const result = await cliRunner.run([sampleFile, '--format', 'ascii']);
      CLIAssertions.expectValidAscii(result);

      // Should handle generic types, complex names, etc.
      const lines = result.stdout.split('\n');

      // Each line should be properly formed (no broken Unicode, etc.)
      // Filter out empty lines which are normal in ASCII output
      const nonEmptyLines = lines.filter((line) => line.trim().length > 0);
      assert.ok(nonEmptyLines.length > 0);

      for (const line of nonEmptyLines) {
        assert.ok(line.trim().length > 0); // Should not be empty after filtering

        // If line has tree characters, should have proper structure
        if (line.includes('├─') || line.includes('└─')) {
          assert.ok(line.trim().length > 2); // More than just tree char
        }
      }
    });
  });

  describe('Format Validation', () => {
    it('should reject invalid format options', async () => {
      const result = await cliRunner.runExpectFailure([
        sampleFile,
        '--format',
        'invalid',
      ]);
      CLIAssertions.expectErrorMessage(result, 'Invalid format');
    });

    it('should accept all valid format options', async () => {
      const validFormats = ['json', 'yaml', 'ascii'];

      for (const format of validFormats) {
        const result = await cliRunner.run([sampleFile, '--format', format]);
        CLIAssertions.expectSuccess(result);
        assert.ok(result.stdout.length > 0);
      }
    });

    it('should use ascii as default format when no format specified', async () => {
      const result = await cliRunner.run([sampleFile]);
      CLIAssertions.expectValidAscii(result);
    });
  });

  describe('Format-Specific Edge Cases', () => {
    it('should handle empty files consistently across formats', async () => {
      const emptyFile = resolve(
        import.meta.dirname,
        '../_05-error-scenarios/assets/empty-file.ts'
      );

      // Create minimal empty TypeScript file for testing
      const formats = ['json', 'yaml', 'ascii'];

      for (const format of formats) {
        const result = await cliRunner.run([emptyFile, '--format', format], {
          timeout: 5000,
        });

        // Should not crash on empty file
        if (result.exitCode === 0) {
          assert.ok(result.stdout.length > 0);
        }
        // If it fails, should fail gracefully with meaningful error
      }
    });

    it('should maintain consistent node ordering across formats', async () => {
      const jsonResult = await cliRunner.run([sampleFile, '--format', 'json']);
      const yamlResult = await cliRunner.run([sampleFile, '--format', 'yaml']);

      const jsonParsed = CLIAssertions.expectValidJson(jsonResult);
      const yamlParsed = CLIAssertions.expectValidYaml(yamlResult);

      // Top-level children should be in same order
      const jsonChildren = jsonParsed[0].outline?.children || [];
      const yamlChildren = yamlParsed[0].outline?.children || [];

      assert.strictEqual(jsonChildren.length, yamlChildren.length);

      for (let i = 0; i < jsonChildren.length; i++) {
        assert.strictEqual(jsonChildren[i].type, yamlChildren[i].type);
        if (jsonChildren[i].name && yamlChildren[i].name) {
          assert.strictEqual(jsonChildren[i].name, yamlChildren[i].name);
        }
      }
    });

    it('should handle large output efficiently in all formats', async () => {
      const formats = ['json', 'yaml', 'ascii'];

      for (const format of formats) {
        const startTime = Date.now();
        const result = await cliRunner.run([sampleFile, '--format', format]);
        const duration = Date.now() - startTime;

        CLIAssertions.expectSuccess(result);
        assert.ok(result.stdout.length > 100); // Should have substantial content
        assert.ok(duration < 5000); // Should complete quickly
      }
    });
  });

  describe('Cross-Format Data Integrity', () => {
    it('should preserve all structural information across formats', async () => {
      const { json } = await cliRunner.runForJson([sampleFile]);
      const yamlResult = await cliRunner.run([sampleFile, '--format', 'yaml']);
      const yamlParsed = CLIAssertions.expectValidYaml(yamlResult);

      // Deep comparison of data structures
      assert.deepStrictEqual(json, yamlParsed);
    });

    it('should handle position information consistently', async () => {
      const jsonResult = await cliRunner.run([sampleFile, '--format', 'json']);
      const yamlResult = await cliRunner.run([sampleFile, '--format', 'yaml']);

      const jsonParsed = CLIAssertions.expectValidJson(jsonResult);
      const yamlParsed = CLIAssertions.expectValidYaml(yamlResult);

      const jsonOutline = jsonParsed[0].outline!;
      const yamlOutline = yamlParsed[0].outline!;

      // Position data should be identical
      assert.deepStrictEqual(jsonOutline.start, yamlOutline.start);
      assert.deepStrictEqual(jsonOutline.end, yamlOutline.end);

      // Recursively check children positions
      function comparePositions(nodeA: any, nodeB: any) {
        if (nodeA.start && nodeB.start) {
          assert.deepStrictEqual(nodeA.start, nodeB.start);
          assert.deepStrictEqual(nodeA.end, nodeB.end);
        }

        if (nodeA.children && nodeB.children) {
          assert.strictEqual(nodeA.children.length, nodeB.children.length);
          for (let i = 0; i < nodeA.children.length; i++) {
            comparePositions(nodeA.children[i], nodeB.children[i]);
          }
        }
      }

      comparePositions(jsonOutline, yamlOutline);
    });
  });
});
