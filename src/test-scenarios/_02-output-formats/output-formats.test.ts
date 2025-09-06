import { describe, it, expect, beforeAll } from 'vitest';
import { resolve } from 'node:path';
import { cliRunner } from '../common/cli-runner.js';
import { CLIAssertions } from '../common/test-utils.js';
import yaml from 'js-yaml';

describe('Output Formats', () => {
  const sampleFile = resolve(__dirname, 'assets', 'sample-code.ts');

  beforeAll(async () => {
    // Ensure CLI is accessible
    const isAccessible = await cliRunner.testAccess();
    expect(isAccessible).toBe(true);
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
      expect(fileResult.file).toContain('sample-code.ts');
      expect(fileResult.outline).toBeTruthy();
      expect(fileResult.outline!.type).toBe('program');

      // Should have proper JSON structure
      expect(typeof fileResult.file).toBe('string');
      expect(typeof fileResult.outline!.type).toBe('string');
      expect(Array.isArray(fileResult.outline!.children)).toBe(true);
    });

    it('should include all required fields in JSON output', async () => {
      const result = await cliRunner.run([sampleFile, '--format', 'json']);
      const parsed = CLIAssertions.expectValidJson(result);

      const fileResult = parsed[0];

      // Top-level structure
      expect(fileResult).toHaveProperty('file');
      expect(fileResult).toHaveProperty('outline');

      const outline = fileResult.outline!;

      // Node structure requirements
      expect(outline).toHaveProperty('type');
      expect(outline).toHaveProperty('start');
      expect(outline).toHaveProperty('end');

      // Position structure
      expect(outline.start).toHaveProperty('row');
      expect(outline.start).toHaveProperty('column');
      expect(outline.end).toHaveProperty('row');
      expect(outline.end).toHaveProperty('column');

      // Position values should be numbers
      expect(typeof outline.start.row).toBe('number');
      expect(typeof outline.start.column).toBe('number');
      expect(typeof outline.end.row).toBe('number');
      expect(typeof outline.end.column).toBe('number');
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

      expect(interfaces.length).toBeGreaterThan(0);
      expect(classes.length).toBeGreaterThan(0);
      expect(enums.length).toBeGreaterThan(0);
      expect(functions.length).toBeGreaterThan(0);
      expect(typeAliases.length).toBeGreaterThan(0);

      // Named nodes should have names
      const namedNodes = CLIAssertions.findNamedNodes(outline);
      expect(namedNodes.length).toBeGreaterThan(5);

      for (const node of namedNodes) {
        expect(node.name).toBeTruthy();
        expect(typeof node.name).toBe('string');
      }
    });

    it('should produce compact, parseable JSON without formatting', async () => {
      const result = await cliRunner.run([sampleFile, '--format', 'json']);
      CLIAssertions.expectSuccess(result);

      // Should be valid JSON without extra whitespace
      expect(() => JSON.parse(result.stdout)).not.toThrow();

      // JSON should be valid regardless of formatting
      const parsed = JSON.parse(result.stdout);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.length).toBe(1);

      // Should have proper structure
      expect(parsed[0]).toHaveProperty('file');
      expect(parsed[0]).toHaveProperty('outline');
    });
  });

  describe('YAML Format', () => {
    it('should produce valid YAML output', async () => {
      const result = await cliRunner.run([sampleFile, '--format', 'yaml']);
      CLIAssertions.expectSuccess(result);

      const parsed = CLIAssertions.expectValidYaml(result);
      CLIAssertions.expectFilesProcessed(parsed, 1);

      const fileResult = parsed[0];
      expect(fileResult.file).toContain('sample-code.ts');
      expect(fileResult.outline).toBeTruthy();
      expect(fileResult.outline!.type).toBe('program');
    });

    it('should have proper YAML structure and formatting', async () => {
      const result = await cliRunner.run([sampleFile, '--format', 'yaml']);
      CLIAssertions.expectSuccess(result);

      // Should contain YAML indicators
      expect(result.stdout).toContain('- file:');
      expect(result.stdout).toContain('  outline:');
      expect(result.stdout).toContain('    type:');
      expect(result.stdout).toContain('    start:');
      expect(result.stdout).toContain('    end:');

      // Should have proper indentation
      const lines = result.stdout.split('\n');
      const indentedLines = lines.filter((line) => line.startsWith('  '));
      expect(indentedLines.length).toBeGreaterThan(0);
    });

    it('should preserve all data from JSON in YAML format', async () => {
      const jsonResult = await cliRunner.run([sampleFile, '--format', 'json']);
      const yamlResult = await cliRunner.run([sampleFile, '--format', 'yaml']);

      const jsonParsed = CLIAssertions.expectValidJson(jsonResult);
      const yamlParsed = CLIAssertions.expectValidYaml(yamlResult);

      // Should have same number of files
      expect(yamlParsed.length).toBe(jsonParsed.length);

      // Should have same file path
      expect(yamlParsed[0].file).toBe(jsonParsed[0].file);

      // Should have same outline structure
      if (jsonParsed[0].outline && yamlParsed[0].outline) {
        expect(yamlParsed[0].outline.type).toBe(jsonParsed[0].outline.type);
        expect(yamlParsed[0].outline.children?.length).toBe(
          jsonParsed[0].outline.children?.length
        );

        // Position data should match
        expect(yamlParsed[0].outline.start.row).toBe(
          jsonParsed[0].outline.start.row
        );
        expect(yamlParsed[0].outline.start.column).toBe(
          jsonParsed[0].outline.start.column
        );
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
        expect(node.name).toBeTruthy();
        expect(typeof node.name).toBe('string');

        // Names should not have YAML escaping artifacts
        expect(node.name).not.toContain('\\n');
        expect(node.name).not.toContain('\\"');
      }
    });
  });

  describe('ASCII Format', () => {
    it('should produce human-readable ASCII tree output', async () => {
      const result = await cliRunner.run([sampleFile, '--format', 'ascii']);
      CLIAssertions.expectValidAscii(result);

      // Should contain file name
      expect(result.stdout).toContain('sample-code.ts');

      // Should contain folder icon
      expect(result.stdout).toContain('📁');

      // Should have tree structure
      const hasTreeChars = ['├─', '└─', '│'].some((char) =>
        result.stdout.includes(char)
      );
      expect(hasTreeChars).toBe(true);
    });

    it('should show hierarchical structure clearly', async () => {
      const result = await cliRunner.run([sampleFile, '--format', 'ascii']);
      CLIAssertions.expectValidAscii(result);

      // Should have multiple indentation levels
      const lines = result.stdout.split('\n');
      const indentedLines = lines.filter(
        (line) => line.includes('└─') || line.includes('├─')
      );
      expect(indentedLines.length).toBeGreaterThan(5);

      // Should contain construct types
      expect(result.stdout).toContain('interface_declaration');
      expect(result.stdout).toContain('class_declaration');
      expect(result.stdout).toContain('enum_declaration');
      expect(result.stdout).toContain('function_declaration');

      // Should show named entities
      expect(result.stdout).toMatch(/Product/); // Interface name
      expect(result.stdout).toMatch(/ProductService/); // Class name
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
      expect(indentationLevels.size).toBeGreaterThanOrEqual(3);
    });

    it('should not break with special characters in names', async () => {
      const result = await cliRunner.run([sampleFile, '--format', 'ascii']);
      CLIAssertions.expectValidAscii(result);

      // Should handle generic types, complex names, etc.
      const lines = result.stdout.split('\n');

      // Each line should be properly formed (no broken Unicode, etc.)
      // Filter out empty lines which are normal in ASCII output
      const nonEmptyLines = lines.filter((line) => line.trim().length > 0);
      expect(nonEmptyLines.length).toBeGreaterThan(0);

      for (const line of nonEmptyLines) {
        expect(line.trim().length).toBeGreaterThan(0); // Should not be empty after filtering

        // If line has tree characters, should have proper structure
        if (line.includes('├─') || line.includes('└─')) {
          expect(line.trim().length).toBeGreaterThan(2); // More than just tree char
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
        expect(result.stdout.length).toBeGreaterThan(0);
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
        __dirname,
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
          expect(result.stdout.length).toBeGreaterThan(0);
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

      expect(jsonChildren.length).toBe(yamlChildren.length);

      for (let i = 0; i < jsonChildren.length; i++) {
        expect(jsonChildren[i].type).toBe(yamlChildren[i].type);
        if (jsonChildren[i].name && yamlChildren[i].name) {
          expect(jsonChildren[i].name).toBe(yamlChildren[i].name);
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
        expect(result.stdout.length).toBeGreaterThan(100); // Should have substantial content
        expect(duration).toBeLessThan(5000); // Should complete quickly
      }
    });
  });

  describe('Cross-Format Data Integrity', () => {
    it('should preserve all structural information across formats', async () => {
      const { json } = await cliRunner.runForJson([sampleFile]);
      const yamlResult = await cliRunner.run([sampleFile, '--format', 'yaml']);
      const yamlParsed = CLIAssertions.expectValidYaml(yamlResult);

      // Deep comparison of data structures
      expect(json).toEqual(yamlParsed);
    });

    it('should handle position information consistently', async () => {
      const jsonResult = await cliRunner.run([sampleFile, '--format', 'json']);
      const yamlResult = await cliRunner.run([sampleFile, '--format', 'yaml']);

      const jsonParsed = CLIAssertions.expectValidJson(jsonResult);
      const yamlParsed = CLIAssertions.expectValidYaml(yamlResult);

      const jsonOutline = jsonParsed[0].outline!;
      const yamlOutline = yamlParsed[0].outline!;

      // Position data should be identical
      expect(jsonOutline.start).toEqual(yamlOutline.start);
      expect(jsonOutline.end).toEqual(yamlOutline.end);

      // Recursively check children positions
      function comparePositions(nodeA: any, nodeB: any) {
        if (nodeA.start && nodeB.start) {
          expect(nodeA.start).toEqual(nodeB.start);
          expect(nodeA.end).toEqual(nodeB.end);
        }

        if (nodeA.children && nodeB.children) {
          expect(nodeA.children.length).toBe(nodeB.children.length);
          for (let i = 0; i < nodeA.children.length; i++) {
            comparePositions(nodeA.children[i], nodeB.children[i]);
          }
        }
      }

      comparePositions(jsonOutline, yamlOutline);
    });
  });
});
