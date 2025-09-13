import { describe, it, expect, beforeEach } from 'vitest';
import { Formatter } from './formatter';
import type { NodeInfo } from '@sammons/code-outline-parser';

// Import ProcessedFile interface from CLI package
interface ProcessedFile {
  file: string;
  outline: NodeInfo | null;
}

// Helper function to strip ANSI color codes for test assertions
function stripAnsi(str: string): string {
  // eslint-disable-next-line no-control-regex
  return str.replace(/\u001b\[[0-9;]*m/g, '');
}

// Test data
const sampleNodeInfo: NodeInfo = {
  type: 'program',
  start: { row: 0, column: 0 },
  end: { row: 10, column: 0 },
  children: [
    {
      type: 'function_declaration',
      name: 'greet',
      start: { row: 1, column: 0 },
      end: { row: 3, column: 1 },
      children: [
        {
          type: 'identifier',
          name: 'name',
          start: { row: 1, column: 15 },
          end: { row: 1, column: 19 },
        },
      ],
    },
    {
      type: 'class_declaration',
      name: 'Person',
      start: { row: 5, column: 0 },
      end: { row: 9, column: 1 },
      children: [
        {
          type: 'method_definition',
          name: 'getName',
          start: { row: 6, column: 2 },
          end: { row: 8, column: 3 },
        },
      ],
    },
  ],
};

const sampleResults = [
  {
    file: '/path/to/test.js',
    outline: sampleNodeInfo,
  },
  {
    file: '/path/to/empty.js',
    outline: null,
  },
  {
    file: '/path/to/another.js',
    outline: {
      type: 'program',
      start: { row: 0, column: 0 },
      end: { row: 5, column: 0 },
      children: [
        {
          type: 'variable_declaration',
          name: 'const config',
          start: { row: 1, column: 0 },
          end: { row: 1, column: 20 },
        },
      ],
    },
  },
];

describe('Formatter', () => {
  describe('JSON format', () => {
    let formatter: Formatter;

    beforeEach(() => {
      formatter = new Formatter('json');
    });

    it('should format results as valid JSON', () => {
      const result = formatter.format(sampleResults);

      expect(() => JSON.parse(result)).not.toThrow();

      const parsed = JSON.parse(result);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed).toHaveLength(2); // Should exclude null outlines
    });

    it('should filter out null outlines', () => {
      const result = formatter.format(sampleResults);
      const parsed = JSON.parse(result);

      expect(parsed.every((item: ProcessedFile) => item.outline !== null)).toBe(
        true
      );
    });

    it('should preserve all node information in JSON output', () => {
      const result = formatter.format(sampleResults);
      const parsed = JSON.parse(result);

      const firstItem = parsed[0];
      // File paths are now relative or absolute based on location
      expect(firstItem.file).toBeTruthy();
      expect(firstItem.absolutePath).toBe('/path/to/test.js');
      expect(firstItem.outline.type).toBe('program');
      expect(firstItem.outline.children).toHaveLength(2);
      expect(firstItem.outline.children[0].name).toBe('greet');
      expect(firstItem.outline.children[0].file).toBeTruthy(); // Named nodes have file reference
      expect(firstItem.outline.children[1].name).toBe('Person');
      expect(firstItem.outline.children[1].file).toBeTruthy(); // Named nodes have file reference
    });

    it('should handle empty results array', () => {
      const result = formatter.format([]);
      const parsed = JSON.parse(result);

      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed).toHaveLength(0);
    });

    it('should handle results with all null outlines', () => {
      const nullResults = [
        { file: 'file1.js', outline: null },
        { file: 'file2.js', outline: null },
      ];

      const result = formatter.format(nullResults);
      const parsed = JSON.parse(result);

      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed).toHaveLength(0);
    });
  });

  describe('YAML format', () => {
    let formatter: Formatter;

    beforeEach(() => {
      formatter = new Formatter('yaml');
    });

    it('should format results as valid YAML', () => {
      const result = formatter.format(sampleResults);

      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);

      // Basic YAML structure checks
      expect(result).toMatch(/^-/m); // Should start array items with dash
      expect(result).toContain('file:');
      expect(result).toContain('outline:');
    });

    it('should filter out null outlines in YAML', () => {
      const result = formatter.format(sampleResults);

      // Should not contain the empty.js file since it has null outline
      expect(result).not.toContain('empty.js');
      // Files are referenced in the YAML output
      expect(result).toMatch(/test\.js|path\/to\/test\.js/);
      expect(result).toMatch(/another\.js|path\/to\/another\.js/);
    });

    it('should preserve nested structure in YAML', () => {
      const result = formatter.format(sampleResults);

      expect(result).toContain('type: program');
      expect(result).toContain('children:');
      expect(result).toContain('name: greet');
      expect(result).toContain('name: Person');
    });
  });

  describe('ASCII format', () => {
    let formatter: Formatter;

    beforeEach(() => {
      formatter = new Formatter('ascii');
    });

    it('should format results with colored ASCII tree structure', () => {
      const result = stripAnsi(formatter.format(sampleResults));

      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);

      // Should contain file headers
      expect(result).toContain('📁');
      // Files are shown with relative paths
      expect(result).toMatch(/test\.js|path\/to\/test\.js/);
      expect(result).toMatch(/another\.js|path\/to\/another\.js/);
      expect(result).not.toContain('empty.js'); // Filtered out
    });

    it('should display hierarchical structure with tree symbols', () => {
      const result = stripAnsi(formatter.format(sampleResults));

      // Should contain tree structure symbols
      expect(result).toContain('├─');

      // Should show node types and names (program is implicit as the file root)
      expect(result).toContain('function_declaration: greet');
      expect(result).toContain('class_declaration: Person');
    });

    it('should include position information', () => {
      const result = stripAnsi(formatter.format(sampleResults));

      // Should contain position information in brackets [line:column]
      expect(result).toMatch(/\[\d+:\d+\]/);
      // Should contain line references for named nodes (:lineNumber)
      expect(result).toMatch(/:\d+/);
    });

    it('should handle nodes without names', () => {
      const nodeWithoutName: NodeInfo = {
        type: 'program',
        start: { row: 0, column: 0 },
        end: { row: 4, column: 1 },
        children: [
          {
            type: 'statement_block',
            start: { row: 2, column: 0 },
            end: { row: 4, column: 1 },
          },
        ],
      };

      const resultsWithUnnamed = [
        {
          file: 'test.js',
          outline: nodeWithoutName,
        },
      ];

      const result = stripAnsi(formatter.format(resultsWithUnnamed));
      expect(result).toContain('statement_block');
      expect(result).not.toContain(': undefined');
    });

    it('should display different node types with appropriate formatting', () => {
      const result = stripAnsi(formatter.format(sampleResults));

      // Different node types should be present
      expect(result).toContain('function_declaration');
      expect(result).toContain('class_declaration');
      expect(result).toContain('variable_declaration');
    });

    it('should show nested children with proper indentation', () => {
      const result = stripAnsi(formatter.format(sampleResults));

      // Should have indented children (method_definition is now directly under class with 2 spaces)
      expect(result).toMatch(/\s{2}└─.*method_definition/);
    });

    it('should handle empty results gracefully', () => {
      const result = stripAnsi(formatter.format([]));

      expect(result).toBe('');
    });

    it('should skip files with null outlines', () => {
      const nullOnlyResults = [
        { file: 'empty1.js', outline: null },
        { file: 'empty2.js', outline: null },
      ];

      const result = stripAnsi(formatter.format(nullOnlyResults));
      expect(result).toBe('');
    });
  });

  describe('LLMText format', () => {
    let formatter: Formatter;

    beforeEach(() => {
      formatter = new Formatter('llmtext');
    });

    it('should format results with XML outline tags', () => {
      const result = formatter.format(sampleResults);

      expect(result).toContain('<Outline>');
      expect(result).toContain('</Outline>');
      expect(result).toContain(
        '# Ultra-compressed code outline for LLM consumption'
      );
    });

    it('should include descriptive header text', () => {
      const result = formatter.format(sampleResults);

      expect(result).toContain(
        '# Ultra-compressed code outline for LLM consumption'
      );
      expect(result).toContain(
        '# Format: type_name line_number (indented for hierarchy)'
      );
      expect(result).toContain(
        '# Numbers after elements are 1-indexed line numbers for navigation'
      );
    });

    it('should format files without decorative symbols', () => {
      const result = formatter.format(sampleResults);

      expect(result).toContain('/path/to/test.js');
      expect(result).toContain('/path/to/another.js');
      expect(result).not.toContain('📁'); // No file emoji
      expect(result).not.toContain('├─'); // No tree symbols
      expect(result).not.toContain('└─'); // No tree symbols
    });

    it('should filter out null outlines', () => {
      const result = formatter.format(sampleResults);

      expect(result).not.toContain('empty.js'); // Should exclude files with null outline
      expect(result).toContain('test.js');
      expect(result).toContain('another.js');
    });

    it('should display hierarchical structure with simple indentation', () => {
      const result = formatter.format(sampleResults);

      // Should show node types and names with single-space indentation for ultra-compressed format
      expect(result).toContain('function_declaration_greet 2');
      expect(result).toContain('class_declaration_Person 6');
      expect(result).toContain(' method_definition_getName 7');
      expect(result).toContain('variable_declaration_const config 2');
    });

    it('should include position information', () => {
      const result = formatter.format(sampleResults);

      // Should contain line numbers as standalone numbers after type_name
      expect(result).toMatch(/\d+/);
      expect(result).toContain('function_declaration_greet 2'); // function_declaration greet at line 2
      expect(result).toContain('class_declaration_Person 6'); // class_declaration Person at line 6
    });

    it('should handle nodes without names', () => {
      const nodeWithoutName: NodeInfo = {
        type: 'program',
        start: { row: 0, column: 0 },
        end: { row: 4, column: 1 },
        children: [
          {
            type: 'statement_block',
            start: { row: 2, column: 0 },
            end: { row: 4, column: 1 },
          },
        ],
      };

      const resultsWithUnnamed = [
        {
          file: 'test.js',
          outline: nodeWithoutName,
        },
      ];

      const result = formatter.format(resultsWithUnnamed);
      expect(result).toContain('statement_block 3');
      expect(result).not.toContain(': undefined');
    });

    it('should handle empty results gracefully', () => {
      const result = formatter.format([]);

      expect(result).toContain('<Outline>');
      expect(result).toContain('</Outline>');
      expect(result).toContain(
        '# Ultra-compressed code outline for LLM consumption'
      );
    });

    it('should format files consecutively without blank lines', () => {
      const result = formatter.format(sampleResults);

      // Ultra-compressed format should NOT have blank lines between files
      const lines = result.split('\n');
      const fileLines = lines.filter(
        (line) => line.includes('/path/to/') && !line.startsWith('#')
      );

      expect(fileLines.length).toBe(2); // Should have 2 file entries
      expect(fileLines[0]).toContain('/path/to/test.js');
      expect(fileLines[1]).toContain('/path/to/another.js');

      // Find indices of file lines to ensure they're consecutive in structure
      const firstFileIndex = lines.findIndex((line) =>
        line.includes('/path/to/test.js')
      );
      const secondFileIndex = lines.findIndex((line) =>
        line.includes('/path/to/another.js')
      );

      expect(firstFileIndex).toBeGreaterThan(0);
      expect(secondFileIndex).toBeGreaterThan(firstFileIndex);
    });
  });

  describe('format validation', () => {
    it('should throw error for unknown format', () => {
      expect(() => new Formatter('unknown' as any)).not.toThrow();

      const formatter = new Formatter('unknown' as any);
      expect(() => formatter.format(sampleResults)).toThrow(
        'Unknown format: unknown'
      );
    });

    it('should handle all supported formats', () => {
      const formats: Array<'json' | 'yaml' | 'ascii' | 'llmtext'> = [
        'json',
        'yaml',
        'ascii',
        'llmtext',
      ];

      formats.forEach((format) => {
        const formatter = new Formatter(format);
        expect(() => formatter.format(sampleResults)).not.toThrow();
      });
    });
  });

  describe('file path handling', () => {
    it('should convert absolute paths to relative paths', () => {
      const formatter = new Formatter('json');
      const cwd = process.cwd();
      const absolutePath = `${cwd}/src/test.js`;

      const results = [
        {
          file: absolutePath,
          outline: {
            type: 'program',
            start: { row: 0, column: 0 },
            end: { row: 1, column: 0 },
            children: [
              {
                type: 'function_declaration',
                name: 'test',
                start: { row: 0, column: 0 },
                end: { row: 0, column: 20 },
              },
            ],
          },
        },
      ];

      const result = formatter.format(results);
      const parsed = JSON.parse(result);

      expect(parsed[0].file).toBe('src/test.js');
      expect(parsed[0].absolutePath).toBe(absolutePath);
    });

    it('should add file references to named nodes', () => {
      const formatter = new Formatter('json');
      const results = [
        {
          file: '/path/to/file.js',
          outline: {
            type: 'program',
            start: { row: 0, column: 0 },
            end: { row: 5, column: 0 },
            children: [
              {
                type: 'function_declaration',
                name: 'myFunc',
                start: { row: 1, column: 0 },
                end: { row: 3, column: 0 },
              },
              {
                type: 'statement_block', // Node without name
                start: { row: 4, column: 0 },
                end: { row: 4, column: 10 },
              },
            ],
          },
        },
      ];

      const result = formatter.format(results);
      const parsed = JSON.parse(result);

      // Named node should have file reference
      expect(parsed[0].outline.children[0].file).toBeTruthy();
      // Unnamed node should not have file reference
      expect(parsed[0].outline.children[1].file).toBeUndefined();
    });

    it('should show line numbers in ASCII output for navigation', () => {
      const formatter = new Formatter('ascii');
      const results = [
        {
          file: 'src/component.tsx',
          outline: {
            type: 'program',
            start: { row: 0, column: 0 },
            end: { row: 10, column: 0 },
            children: [
              {
                type: 'function_declaration',
                name: 'Component',
                start: { row: 5, column: 0 },
                end: { row: 8, column: 0 },
              },
            ],
          },
        },
      ];

      const result = stripAnsi(formatter.format(results));

      // Should contain line number format (:line) for navigation (line is 1-indexed, so row 5 becomes line 6)
      expect(result).toContain(':6');
      // Should contain the file name as the root
      expect(result).toContain('📁 src/component.tsx');
    });
  });

  describe('edge cases', () => {
    it('should handle deeply nested structures', () => {
      const deepNode: NodeInfo = {
        type: 'program',
        start: { row: 0, column: 0 },
        end: { row: 10, column: 0 },
        children: [
          {
            type: 'class_declaration',
            name: 'OuterClass',
            start: { row: 1, column: 0 },
            end: { row: 9, column: 0 },
            children: [
              {
                type: 'method_definition',
                name: 'outerMethod',
                start: { row: 2, column: 0 },
                end: { row: 8, column: 0 },
                children: [
                  {
                    type: 'function_expression',
                    name: 'innerFunction',
                    start: { row: 3, column: 0 },
                    end: { row: 7, column: 0 },
                    children: [
                      {
                        type: 'variable_declarator',
                        name: 'deepVariable',
                        start: { row: 4, column: 0 },
                        end: { row: 4, column: 20 },
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      };

      const deepResults = [{ file: 'deep.js', outline: deepNode }];

      // All formats should handle deep nesting
      ['json', 'yaml', 'ascii'].forEach((format) => {
        const formatter = new Formatter(format as 'json' | 'yaml' | 'ascii');
        expect(() => formatter.format(deepResults)).not.toThrow();

        const result = formatter.format(deepResults);
        expect(result.length).toBeGreaterThan(0);
        expect(result).toContain('OuterClass');
        expect(result).toContain('deepVariable');
      });
    });

    it('should handle nodes with special characters in names', () => {
      const specialCharNode: NodeInfo = {
        type: 'program',
        start: { row: 0, column: 0 },
        end: { row: 5, column: 0 },
        children: [
          {
            type: 'variable_declarator',
            name: 'var_with_$pecial_chars & symbols!',
            start: { row: 1, column: 0 },
            end: { row: 1, column: 30 },
          },
          {
            type: 'function_declaration',
            name: 'func_with_émojis_🚀',
            start: { row: 2, column: 0 },
            end: { row: 4, column: 0 },
          },
        ],
      };

      const specialResults = [{ file: 'special.js', outline: specialCharNode }];

      ['json', 'yaml', 'ascii'].forEach((format) => {
        const formatter = new Formatter(format as 'json' | 'yaml' | 'ascii');
        const result = formatter.format(specialResults);

        expect(result).toContain('var_with_$pecial_chars & symbols!');
        expect(result).toContain('func_with_émojis_🚀');
      });
    });
  });
});
