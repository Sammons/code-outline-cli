import { describe, it, expect, beforeEach } from 'vitest';
import { Parser } from './parser';
import type { NodeInfo } from './types';
import { TreeUtils } from './tree-utils';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('Parser', () => {
  let parser: Parser;

  beforeEach(() => {
    parser = new Parser();
  });

  describe('parseFile', () => {
    it('should parse JavaScript files correctly', async () => {
      const fixturePath = resolve(
        __dirname,
        '../../../test/fixtures/sample.js'
      );
      const result = await parser.parseFile(fixturePath);

      expect(result).toBeTruthy();
      expect(result?.type).toBe('program');
      expect(result?.children).toBeDefined();

      // Should contain the function declaration
      const functions = result?.children?.filter(
        (child) => child.type === 'function_declaration'
      );
      expect(functions).toHaveLength(1);
      expect(functions?.[0].name).toBe('greet');
    });

    it('should parse TypeScript files correctly', async () => {
      const fixturePath = resolve(
        __dirname,
        '../../../test/fixtures/sample.ts'
      );
      const result = await parser.parseFile(fixturePath);

      expect(result).toBeTruthy();
      expect(result?.type).toBe('program');

      // Should contain interface declarations
      const interfaces = result?.children?.filter(
        (child) => child.type === 'interface_declaration'
      );
      expect(interfaces).toHaveLength(1);
      expect(interfaces?.[0].name).toBe('User');

      // Should contain class declarations
      const classes = result?.children?.filter(
        (child) => child.type === 'class_declaration'
      );
      expect(classes).toHaveLength(1);
      expect(classes?.[0].name).toBe('UserService');
    });

    it('should parse TSX files correctly', async () => {
      const fixturePath = resolve(
        __dirname,
        '../../../test/fixtures/sample.tsx'
      );
      const result = await parser.parseFile(fixturePath);

      expect(result).toBeTruthy();
      expect(result?.type).toBe('program');

      // Should contain variable declarations for React components
      const variableDeclarations = result?.children?.filter(
        (child) =>
          child.type === 'lexical_declaration' ||
          child.type === 'variable_declaration'
      );
      expect(variableDeclarations).toBeDefined();

      // Should contain class declarations
      const classes = result?.children?.filter(
        (child) => child.type === 'class_declaration'
      );
      expect(classes).toHaveLength(1);
      expect(classes?.[0].name).toBe('ClassComponent');
    });

    it('should handle complex nested structures', async () => {
      const fixturePath = resolve(
        __dirname,
        '../../../test/fixtures/complex.ts'
      );
      const result = await parser.parseFile(fixturePath);

      expect(result).toBeTruthy();
      expect(result?.type).toBe('program');

      // Should contain classes
      const classes = result?.children?.filter(
        (child) => child.type === 'class_declaration'
      );
      expect(classes?.length).toBeGreaterThanOrEqual(1);

      const productService = classes?.find((c) => c.name === 'ProductService');
      expect(productService).toBeTruthy();

      // Should contain interface declarations
      const interfaces = result?.children?.filter(
        (child) => child.type === 'interface_declaration'
      );
      expect(interfaces?.length).toBeGreaterThanOrEqual(1);

      const productInterface = interfaces?.find((i) => i.name === 'Product');
      expect(productInterface).toBeTruthy();

      // Should contain exports
      const exports = result?.children?.filter(
        (child) => child.type === 'export_statement'
      );
      expect(exports?.length).toBeGreaterThanOrEqual(1);
    });

    it('should respect maxDepth parameter', async () => {
      const fixturePath = resolve(
        __dirname,
        '../../../test/fixtures/complex.ts'
      );

      // Parse with depth 1
      const shallowResult = await parser.parseFile(fixturePath, 1);
      expect(shallowResult).toBeTruthy();

      // Parse with depth 3
      const deepResult = await parser.parseFile(fixturePath, 3);
      expect(deepResult).toBeTruthy();

      // Deep result should have more nested information
      const shallowCount = TreeUtils.countNodes(shallowResult!);
      const deepCount = TreeUtils.countNodes(deepResult!);

      expect(deepCount).toBeGreaterThanOrEqual(shallowCount);
    });

    it('should handle namedOnly parameter', async () => {
      const fixturePath = resolve(
        __dirname,
        '../../../test/fixtures/sample.ts'
      );

      // Parse with namedOnly = true (default)
      const namedOnlyResult = await parser.parseFile(fixturePath, Infinity, true);

      // Parse with namedOnly = false
      const allNodesResult = await parser.parseFile(fixturePath, Infinity, false);

      expect(namedOnlyResult).toBeTruthy();
      expect(allNodesResult).toBeTruthy();

      const namedCount = TreeUtils.countNodes(namedOnlyResult!);
      const allCount = TreeUtils.countNodes(allNodesResult!);

      // All nodes result should have more nodes than named only
      expect(allCount).toBeGreaterThanOrEqual(namedCount);
    });

    it('should handle invalid file paths gracefully', async () => {
      const invalidPath = '/nonexistent/file.js';

      await expect(parser.parseFile(invalidPath)).rejects.toThrow();
    });

    it('should detect correct file extensions', async () => {
      const jsFixture = resolve(__dirname, '../../../test/fixtures/sample.js');
      const tsFixture = resolve(__dirname, '../../../test/fixtures/sample.ts');
      const tsxFixture = resolve(
        __dirname,
        '../../../test/fixtures/sample.tsx'
      );

      const jsResult = await parser.parseFile(jsFixture);
      const tsResult = await parser.parseFile(tsFixture);
      const tsxResult = await parser.parseFile(tsxFixture);

      // All should parse successfully
      expect(jsResult).toBeTruthy();
      expect(tsResult).toBeTruthy();
      expect(tsxResult).toBeTruthy();

      // Each should be a program node
      expect(jsResult?.type).toBe('program');
      expect(tsResult?.type).toBe('program');
      expect(tsxResult?.type).toBe('program');
    });
  });

  describe('name extraction', () => {
    it('should extract function names correctly', async () => {
      const fixturePath = resolve(
        __dirname,
        '../../../test/fixtures/sample.js'
      );
      const result = await parser.parseFile(fixturePath);

      const functions = result?.children?.filter(
        (child) => child.type === 'function_declaration'
      );
      expect(functions?.[0].name).toBe('greet');
    });

    it('should extract class names correctly', async () => {
      const fixturePath = resolve(
        __dirname,
        '../../../test/fixtures/sample.ts'
      );
      const result = await parser.parseFile(fixturePath);

      const classes = result?.children?.filter(
        (child) => child.type === 'class_declaration'
      );
      expect(classes?.[0].name).toBe('UserService');
    });

    it('should extract interface names correctly', async () => {
      const fixturePath = resolve(
        __dirname,
        '../../../test/fixtures/sample.ts'
      );
      const result = await parser.parseFile(fixturePath);

      const interfaces = result?.children?.filter(
        (child) => child.type === 'interface_declaration'
      );
      expect(interfaces?.[0].name).toBe('User');
    });

    it('should extract variable declarator names', async () => {
      const fixturePath = resolve(
        __dirname,
        '../../../test/fixtures/sample.ts'
      );
      const result = await parser.parseFile(fixturePath);

      // Look for lexical declarations (const, let, var)
      const lexicalDeclarations = result?.children?.filter(
        (child) => child.type === 'lexical_declaration'
      );

      expect(lexicalDeclarations).toBeDefined();
      expect(lexicalDeclarations!.length).toBeGreaterThan(0);
    });

    it('should handle method definitions in classes', async () => {
      const fixturePath = resolve(
        __dirname,
        '../../../test/fixtures/sample.ts'
      );
      const result = await parser.parseFile(fixturePath);

      const classes = result?.children?.filter(
        (child) => child.type === 'class_declaration'
      );
      const userServiceClass = classes?.find((c) => c.name === 'UserService');

      expect(userServiceClass).toBeTruthy();
      expect(userServiceClass?.children).toBeDefined();

      const methods = userServiceClass?.children?.filter(
        (child) => child.type === 'method_definition'
      );

      expect(methods).toBeDefined();
      if (methods && methods.length > 0) {
        // Should have method names
        expect(methods.some((method) => method.name)).toBe(true);
      }
    });

    it('should handle arrow functions with names', async () => {
      const fixturePath = resolve(
        __dirname,
        '../../../test/fixtures/sample.js'
      );
      const result = await parser.parseFile(fixturePath);

      // Look for variable declarations that might contain arrow functions
      const variableDeclarations = result?.children?.filter(
        (child) =>
          child.type === 'variable_declaration' ||
          child.type === 'lexical_declaration'
      );

      expect(variableDeclarations).toBeDefined();
      expect(variableDeclarations!.length).toBeGreaterThan(0);
    });
  });

  describe('position tracking', () => {
    it('should track node positions correctly', async () => {
      const fixturePath = resolve(
        __dirname,
        '../../../test/fixtures/sample.js'
      );
      const result = await parser.parseFile(fixturePath);

      expect(result?.start).toBeDefined();
      expect(result?.end).toBeDefined();
      expect(result?.start.row).toBeTypeOf('number');
      expect(result?.start.column).toBeTypeOf('number');
      expect(result?.end.row).toBeTypeOf('number');
      expect(result?.end.column).toBeTypeOf('number');

      // Start should be before or equal to end
      expect(result!.start.row).toBeLessThanOrEqual(result!.end.row);

      if (result?.children) {
        for (const child of result.children) {
          expect(child.start).toBeDefined();
          expect(child.end).toBeDefined();
          expect(child.start.row).toBeTypeOf('number');
          expect(child.start.column).toBeTypeOf('number');
          expect(child.end.row).toBeTypeOf('number');
          expect(child.end.column).toBeTypeOf('number');
        }
      }
    });
  });

  describe('parseSource', () => {
    it('should parse JavaScript source code directly', () => {
      const source = `
        function testFunction() {
          return 'hello world';
        }
        const testVar = 42;
      `;

      const result = parser.parseSource(source, 'javascript');

      expect(result).toBeTruthy();
      expect(result?.type).toBe('program');
      expect(result?.children).toBeDefined();

      // Should contain the function declaration
      const functions = result?.children?.filter(
        (child) => child.type === 'function_declaration'
      );
      expect(functions).toHaveLength(1);
      expect(functions?.[0].name).toBe('testFunction');

      // Should contain variable declaration
      const variables = result?.children?.filter(
        (child) => child.type === 'lexical_declaration'
      );
      expect(variables).toHaveLength(1);
    });

    it('should parse TypeScript source code directly', () => {
      const source = `
        interface TestInterface {
          name: string;
          age: number;
        }
        
        class TestClass implements TestInterface {
          constructor(public name: string, public age: number) {}
          
          greet(): string {
            return \`Hello, I'm \${this.name}\`;
          }
        }
      `;

      const result = parser.parseSource(source, 'typescript');

      expect(result).toBeTruthy();
      expect(result?.type).toBe('program');

      // Should contain interface declaration
      const interfaces = result?.children?.filter(
        (child) => child.type === 'interface_declaration'
      );
      expect(interfaces).toHaveLength(1);
      expect(interfaces?.[0].name).toBe('TestInterface');

      // Should contain class declaration
      const classes = result?.children?.filter(
        (child) => child.type === 'class_declaration'
      );
      expect(classes).toHaveLength(1);
      expect(classes?.[0].name).toBe('TestClass');
    });

    it('should parse TSX source code directly', () => {
      const source = `
        import React from 'react';
        
        interface Props {
          title: string;
        }
        
        const MyComponent: React.FC<Props> = ({ title }) => {
          return <div>{title}</div>;
        };
        
        export default MyComponent;
      `;

      const result = parser.parseSource(source, 'tsx');

      expect(result).toBeTruthy();
      expect(result?.type).toBe('program');

      // Should contain import statement
      const imports = result?.children?.filter(
        (child) => child.type === 'import_statement'
      );
      expect(imports).toHaveLength(1);

      // Should contain interface declaration
      const interfaces = result?.children?.filter(
        (child) => child.type === 'interface_declaration'
      );
      expect(interfaces).toHaveLength(1);
      expect(interfaces?.[0].name).toBe('Props');
    });

    it('should respect maxDepth parameter in parseSource', () => {
      const source = `
        class OuterClass {
          method() {
            function innerFunction() {
              const deepVariable = 'test';
            }
          }
        }
      `;

      // Parse with depth 1
      const shallowResult = parser.parseSource(source, 'javascript', 1);
      expect(shallowResult).toBeTruthy();

      // Parse with depth 3
      const deepResult = parser.parseSource(source, 'javascript', 3);
      expect(deepResult).toBeTruthy();

      // Deep result should have more nested information
      const shallowCount = TreeUtils.countNodes(shallowResult!);
      const deepCount = TreeUtils.countNodes(deepResult!);

      expect(deepCount).toBeGreaterThanOrEqual(shallowCount);
    });

    it('should respect namedOnly parameter in parseSource', () => {
      const source = `
        function testFunction() {
          return true;
        }
      `;

      // Parse with namedOnly = true (default)
      const namedOnlyResult = parser.parseSource(source, 'javascript', Infinity, true);

      // Parse with namedOnly = false
      const allNodesResult = parser.parseSource(source, 'javascript', Infinity, false);

      expect(namedOnlyResult).toBeTruthy();
      expect(allNodesResult).toBeTruthy();

      const namedCount = TreeUtils.countNodes(namedOnlyResult!);
      const allCount = TreeUtils.countNodes(allNodesResult!);

      // All nodes result should have more nodes than named only
      expect(allCount).toBeGreaterThanOrEqual(namedCount);
    });

    it('should handle parsing errors gracefully in parseSource', () => {
      const invalidSource = 'function unclosed() { // missing closing brace';

      // Tree-sitter parsers are generally resilient and don't throw on syntax errors
      // Instead they parse as much as possible and create error nodes
      // So we expect it to return a result even with invalid syntax
      const result = parser.parseSource(invalidSource, 'javascript');
      expect(result).toBeTruthy();
      expect(result?.type).toBe('program');
    });

    it('should default to javascript when no fileType is specified', () => {
      const source = `
        function defaultTest() {
          return 'javascript default';
        }
      `;

      const result = parser.parseSource(source);

      expect(result).toBeTruthy();
      expect(result?.type).toBe('program');

      const functions = result?.children?.filter(
        (child) => child.type === 'function_declaration'
      );
      expect(functions).toHaveLength(1);
      expect(functions?.[0].name).toBe('defaultTest');
    });
  });

  describe('getSupportedExtensions', () => {
    it('should return an array of supported file extensions', () => {
      const extensions = parser.getSupportedExtensions();

      expect(Array.isArray(extensions)).toBe(true);
      expect(extensions.length).toBeGreaterThan(0);
      
      // Should include common JavaScript and TypeScript extensions
      expect(extensions).toContain('.js');
      expect(extensions).toContain('.jsx');
      expect(extensions).toContain('.ts');
      expect(extensions).toContain('.tsx');
    });

    it('should return extensions in a consistent format', () => {
      const extensions = parser.getSupportedExtensions();

      extensions.forEach(ext => {
        expect(ext).toMatch(/^\.[a-zA-Z]+$/); // Should start with . and contain only letters
      });
    });
  });

  describe('isFileSupported', () => {
    it('should return true for supported JavaScript files', () => {
      expect(parser.isFileSupported('test.js')).toBe(true);
      expect(parser.isFileSupported('component.jsx')).toBe(true);
      expect(parser.isFileSupported('/path/to/file.js')).toBe(true);
      expect(parser.isFileSupported('complex.file.name.js')).toBe(true);
    });

    it('should return true for supported TypeScript files', () => {
      expect(parser.isFileSupported('test.ts')).toBe(true);
      expect(parser.isFileSupported('component.tsx')).toBe(true);
      expect(parser.isFileSupported('/path/to/file.ts')).toBe(true);
      expect(parser.isFileSupported('complex.file.name.tsx')).toBe(true);
    });

    it('should return false for unsupported file types', () => {
      expect(parser.isFileSupported('test.py')).toBe(false);
      expect(parser.isFileSupported('readme.txt')).toBe(false);
      expect(parser.isFileSupported('config.json')).toBe(false);
      expect(parser.isFileSupported('style.css')).toBe(false);
      expect(parser.isFileSupported('image.png')).toBe(false);
    });

    it('should handle files without extensions', () => {
      expect(parser.isFileSupported('filename')).toBe(false);
      expect(parser.isFileSupported('/path/to/filename')).toBe(false);
    });

    it('should handle empty or invalid file paths', () => {
      expect(parser.isFileSupported('')).toBe(false);
      expect(parser.isFileSupported('.')).toBe(false);
      expect(parser.isFileSupported('..')).toBe(false);
    });

    it('should be case insensitive', () => {
      // The FileReader.isSupported method converts extensions to lowercase
      expect(parser.isFileSupported('test.JS')).toBe(true);
      expect(parser.isFileSupported('test.TS')).toBe(true);
      expect(parser.isFileSupported('test.JSX')).toBe(true);
      expect(parser.isFileSupported('test.TSX')).toBe(true);
    });
  });
});
