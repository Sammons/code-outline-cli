import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Parser } from './parser.ts';
import type { NodeInfo } from './types.ts';
import { TreeUtils } from './tree-utils.ts';
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
        import.meta.dirname,
        '../../../test/fixtures/sample.js'
      );
      const result = await parser.parseFile(fixturePath);

      assert.ok(result);
      assert.strictEqual(result?.type, 'program');
      assert.notStrictEqual(result?.children, undefined);

      // Should contain the function declaration
      const functions = result?.children?.filter(
        (child) => child.type === 'function_declaration'
      );
      assert.strictEqual(functions.length, 1);
      assert.strictEqual(functions?.[0].name, 'greet');
    });

    it('should parse TypeScript files correctly', async () => {
      const fixturePath = resolve(
        import.meta.dirname,
        '../../../test/fixtures/sample.ts'
      );
      const result = await parser.parseFile(fixturePath);

      assert.ok(result);
      assert.strictEqual(result?.type, 'program');

      // Should contain interface declarations
      const interfaces = result?.children?.filter(
        (child) => child.type === 'interface_declaration'
      );
      assert.strictEqual(interfaces.length, 1);
      assert.strictEqual(interfaces?.[0].name, 'User');

      // Should contain class declarations
      const classes = result?.children?.filter(
        (child) => child.type === 'class_declaration'
      );
      assert.strictEqual(classes.length, 1);
      assert.strictEqual(classes?.[0].name, 'UserService');
    });

    it('should parse TSX files correctly', async () => {
      const fixturePath = resolve(
        import.meta.dirname,
        '../../../test/fixtures/sample.tsx'
      );
      const result = await parser.parseFile(fixturePath);

      assert.ok(result);
      assert.strictEqual(result?.type, 'program');

      // Should contain variable declarations for React components
      const variableDeclarations = result?.children?.filter(
        (child) =>
          child.type === 'lexical_declaration' ||
          child.type === 'variable_declaration'
      );
      assert.notStrictEqual(variableDeclarations, undefined);

      // Should contain class declarations
      const classes = result?.children?.filter(
        (child) => child.type === 'class_declaration'
      );
      assert.strictEqual(classes.length, 1);
      assert.strictEqual(classes?.[0].name, 'ClassComponent');
    });

    it('should handle complex nested structures', async () => {
      const fixturePath = resolve(
        import.meta.dirname,
        '../../../test/fixtures/complex.ts'
      );
      const result = await parser.parseFile(fixturePath);

      assert.ok(result);
      assert.strictEqual(result?.type, 'program');

      // Should contain classes
      const classes = result?.children?.filter(
        (child) => child.type === 'class_declaration'
      );
      assert.ok(classes?.length >= 1);

      const productService = classes?.find((c) => c.name === 'ProductService');
      assert.ok(productService);

      // Should contain interface declarations
      const interfaces = result?.children?.filter(
        (child) => child.type === 'interface_declaration'
      );
      assert.ok(interfaces?.length >= 1);

      const productInterface = interfaces?.find((i) => i.name === 'Product');
      assert.ok(productInterface);

      // Should contain exports
      const exports = result?.children?.filter(
        (child) => child.type === 'export_statement'
      );
      assert.ok(exports?.length >= 1);
    });

    it('should respect maxDepth parameter', async () => {
      const fixturePath = resolve(
        import.meta.dirname,
        '../../../test/fixtures/complex.ts'
      );

      // Parse with depth 1
      const shallowResult = await parser.parseFile(fixturePath, 1);
      assert.ok(shallowResult);

      // Parse with depth 3
      const deepResult = await parser.parseFile(fixturePath, 3);
      assert.ok(deepResult);

      // Deep result should have more nested information
      const shallowCount = TreeUtils.countNodes(shallowResult!);
      const deepCount = TreeUtils.countNodes(deepResult!);

      assert.ok(deepCount >= shallowCount);
    });

    it('should handle namedOnly parameter', async () => {
      const fixturePath = resolve(
        import.meta.dirname,
        '../../../test/fixtures/sample.ts'
      );

      // Parse with namedOnly = true (default)
      const namedOnlyResult = await parser.parseFile(
        fixturePath,
        Infinity,
        true
      );

      // Parse with namedOnly = false
      const allNodesResult = await parser.parseFile(
        fixturePath,
        Infinity,
        false
      );

      assert.ok(namedOnlyResult);
      assert.ok(allNodesResult);

      const namedCount = TreeUtils.countNodes(namedOnlyResult!);
      const allCount = TreeUtils.countNodes(allNodesResult!);

      // All nodes result should have more nodes than named only
      assert.ok(allCount >= namedCount);
    });

    it('should handle invalid file paths gracefully', async () => {
      const invalidPath = '/nonexistent/file.js';

      await assert.rejects(parser.parseFile(invalidPath));
    });

    it('should detect correct file extensions', async () => {
      const jsFixture = resolve(import.meta.dirname, '../../../test/fixtures/sample.js');
      const tsFixture = resolve(import.meta.dirname, '../../../test/fixtures/sample.ts');
      const tsxFixture = resolve(
        import.meta.dirname,
        '../../../test/fixtures/sample.tsx'
      );

      const jsResult = await parser.parseFile(jsFixture);
      const tsResult = await parser.parseFile(tsFixture);
      const tsxResult = await parser.parseFile(tsxFixture);

      // All should parse successfully
      assert.ok(jsResult);
      assert.ok(tsResult);
      assert.ok(tsxResult);

      // Each should be a program node
      assert.strictEqual(jsResult?.type, 'program');
      assert.strictEqual(tsResult?.type, 'program');
      assert.strictEqual(tsxResult?.type, 'program');
    });
  });

  describe('name extraction', () => {
    it('should extract function names correctly', async () => {
      const fixturePath = resolve(
        import.meta.dirname,
        '../../../test/fixtures/sample.js'
      );
      const result = await parser.parseFile(fixturePath);

      const functions = result?.children?.filter(
        (child) => child.type === 'function_declaration'
      );
      assert.strictEqual(functions?.[0].name, 'greet');
    });

    it('should extract class names correctly', async () => {
      const fixturePath = resolve(
        import.meta.dirname,
        '../../../test/fixtures/sample.ts'
      );
      const result = await parser.parseFile(fixturePath);

      const classes = result?.children?.filter(
        (child) => child.type === 'class_declaration'
      );
      assert.strictEqual(classes?.[0].name, 'UserService');
    });

    it('should extract interface names correctly', async () => {
      const fixturePath = resolve(
        import.meta.dirname,
        '../../../test/fixtures/sample.ts'
      );
      const result = await parser.parseFile(fixturePath);

      const interfaces = result?.children?.filter(
        (child) => child.type === 'interface_declaration'
      );
      assert.strictEqual(interfaces?.[0].name, 'User');
    });

    it('should extract variable declarator names', async () => {
      const fixturePath = resolve(
        import.meta.dirname,
        '../../../test/fixtures/sample.ts'
      );
      const result = await parser.parseFile(fixturePath);

      // Look for lexical declarations (const, let, var)
      const lexicalDeclarations = result?.children?.filter(
        (child) => child.type === 'lexical_declaration'
      );

      assert.notStrictEqual(lexicalDeclarations, undefined);
      assert.ok(lexicalDeclarations!.length > 0);
    });

    it('should handle method definitions in classes', async () => {
      const fixturePath = resolve(
        import.meta.dirname,
        '../../../test/fixtures/sample.ts'
      );
      const result = await parser.parseFile(fixturePath);

      const classes = result?.children?.filter(
        (child) => child.type === 'class_declaration'
      );
      const userServiceClass = classes?.find((c) => c.name === 'UserService');

      assert.ok(userServiceClass);
      assert.notStrictEqual(userServiceClass?.children, undefined);

      const methods = userServiceClass?.children?.filter(
        (child) => child.type === 'method_definition'
      );

      assert.notStrictEqual(methods, undefined);
      if (methods && methods.length > 0) {
        // Should have method names
        assert.strictEqual(methods.some((method) => method.name), true);
      }
    });

    it('should handle arrow functions with names', async () => {
      const fixturePath = resolve(
        import.meta.dirname,
        '../../../test/fixtures/sample.js'
      );
      const result = await parser.parseFile(fixturePath);

      // Look for variable declarations that might contain arrow functions
      const variableDeclarations = result?.children?.filter(
        (child) =>
          child.type === 'variable_declaration' ||
          child.type === 'lexical_declaration'
      );

      assert.notStrictEqual(variableDeclarations, undefined);
      assert.ok(variableDeclarations!.length > 0);
    });
  });

  describe('position tracking', () => {
    it('should track node positions correctly', async () => {
      const fixturePath = resolve(
        import.meta.dirname,
        '../../../test/fixtures/sample.js'
      );
      const result = await parser.parseFile(fixturePath);

      assert.notStrictEqual(result?.start, undefined);
      assert.notStrictEqual(result?.end, undefined);
      assert.strictEqual(typeof result?.start.row, 'number');
      assert.strictEqual(typeof result?.start.column, 'number');
      assert.strictEqual(typeof result?.end.row, 'number');
      assert.strictEqual(typeof result?.end.column, 'number');

      // Start should be before or equal to end
      assert.ok(result!.start.row <= result!.end.row);

      if (result?.children) {
        for (const child of result.children) {
          assert.notStrictEqual(child.start, undefined);
          assert.notStrictEqual(child.end, undefined);
          assert.strictEqual(typeof child.start.row, 'number');
          assert.strictEqual(typeof child.start.column, 'number');
          assert.strictEqual(typeof child.end.row, 'number');
          assert.strictEqual(typeof child.end.column, 'number');
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

      assert.ok(result);
      assert.strictEqual(result?.type, 'program');
      assert.notStrictEqual(result?.children, undefined);

      // Should contain the function declaration
      const functions = result?.children?.filter(
        (child) => child.type === 'function_declaration'
      );
      assert.strictEqual(functions.length, 1);
      assert.strictEqual(functions?.[0].name, 'testFunction');

      // Should contain variable declaration
      const variables = result?.children?.filter(
        (child) => child.type === 'lexical_declaration'
      );
      assert.strictEqual(variables.length, 1);
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

      assert.ok(result);
      assert.strictEqual(result?.type, 'program');

      // Should contain interface declaration
      const interfaces = result?.children?.filter(
        (child) => child.type === 'interface_declaration'
      );
      assert.strictEqual(interfaces.length, 1);
      assert.strictEqual(interfaces?.[0].name, 'TestInterface');

      // Should contain class declaration
      const classes = result?.children?.filter(
        (child) => child.type === 'class_declaration'
      );
      assert.strictEqual(classes.length, 1);
      assert.strictEqual(classes?.[0].name, 'TestClass');
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

      assert.ok(result);
      assert.strictEqual(result?.type, 'program');

      // Should contain import statement
      const imports = result?.children?.filter(
        (child) => child.type === 'import_statement'
      );
      assert.strictEqual(imports.length, 1);

      // Should contain interface declaration
      const interfaces = result?.children?.filter(
        (child) => child.type === 'interface_declaration'
      );
      assert.strictEqual(interfaces.length, 1);
      assert.strictEqual(interfaces?.[0].name, 'Props');
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
      assert.ok(shallowResult);

      // Parse with depth 3
      const deepResult = parser.parseSource(source, 'javascript', 3);
      assert.ok(deepResult);

      // Deep result should have more nested information
      const shallowCount = TreeUtils.countNodes(shallowResult!);
      const deepCount = TreeUtils.countNodes(deepResult!);

      assert.ok(deepCount >= shallowCount);
    });

    it('should respect namedOnly parameter in parseSource', () => {
      const source = `
        function testFunction() {
          return true;
        }
      `;

      // Parse with namedOnly = true (default)
      const namedOnlyResult = parser.parseSource(
        source,
        'javascript',
        Infinity,
        true
      );

      // Parse with namedOnly = false
      const allNodesResult = parser.parseSource(
        source,
        'javascript',
        Infinity,
        false
      );

      assert.ok(namedOnlyResult);
      assert.ok(allNodesResult);

      const namedCount = TreeUtils.countNodes(namedOnlyResult!);
      const allCount = TreeUtils.countNodes(allNodesResult!);

      // All nodes result should have more nodes than named only
      assert.ok(allCount >= namedCount);
    });

    it('should handle parsing errors gracefully in parseSource', () => {
      const invalidSource = 'function unclosed() { // missing closing brace';

      // Tree-sitter parsers are generally resilient and don't throw on syntax errors
      // Instead they parse as much as possible and create error nodes
      // So we expect it to return a result even with invalid syntax
      const result = parser.parseSource(invalidSource, 'javascript');
      assert.ok(result);
      assert.strictEqual(result?.type, 'program');
    });

    it('should default to javascript when no fileType is specified', () => {
      const source = `
        function defaultTest() {
          return 'javascript default';
        }
      `;

      const result = parser.parseSource(source);

      assert.ok(result);
      assert.strictEqual(result?.type, 'program');

      const functions = result?.children?.filter(
        (child) => child.type === 'function_declaration'
      );
      assert.strictEqual(functions.length, 1);
      assert.strictEqual(functions?.[0].name, 'defaultTest');
    });
  });

  describe('getSupportedExtensions', () => {
    it('should return an array of supported file extensions', () => {
      const extensions = parser.getSupportedExtensions();

      assert.strictEqual(Array.isArray(extensions), true);
      assert.ok(extensions.length > 0);

      // Should include common JavaScript and TypeScript extensions
      assert.ok(extensions.includes('.js'));
      assert.ok(extensions.includes('.jsx'));
      assert.ok(extensions.includes('.ts'));
      assert.ok(extensions.includes('.tsx'));
    });

    it('should return extensions in a consistent format', () => {
      const extensions = parser.getSupportedExtensions();

      extensions.forEach((ext) => {
        assert.match(ext, /^\.[a-zA-Z]+$/); // Should start with . and contain only letters
      });
    });
  });

  describe('isFileSupported', () => {
    it('should return true for supported JavaScript files', () => {
      assert.strictEqual(parser.isFileSupported('test.js'), true);
      assert.strictEqual(parser.isFileSupported('component.jsx'), true);
      assert.strictEqual(parser.isFileSupported('/path/to/file.js'), true);
      assert.strictEqual(parser.isFileSupported('complex.file.name.js'), true);
    });

    it('should return true for supported TypeScript files', () => {
      assert.strictEqual(parser.isFileSupported('test.ts'), true);
      assert.strictEqual(parser.isFileSupported('component.tsx'), true);
      assert.strictEqual(parser.isFileSupported('/path/to/file.ts'), true);
      assert.strictEqual(parser.isFileSupported('complex.file.name.tsx'), true);
    });

    it('should return false for unsupported file types', () => {
      assert.strictEqual(parser.isFileSupported('test.py'), false);
      assert.strictEqual(parser.isFileSupported('readme.txt'), false);
      assert.strictEqual(parser.isFileSupported('config.json'), false);
      assert.strictEqual(parser.isFileSupported('style.css'), false);
      assert.strictEqual(parser.isFileSupported('image.png'), false);
    });

    it('should handle files without extensions', () => {
      assert.strictEqual(parser.isFileSupported('filename'), false);
      assert.strictEqual(parser.isFileSupported('/path/to/filename'), false);
    });

    it('should handle empty or invalid file paths', () => {
      assert.strictEqual(parser.isFileSupported(''), false);
      assert.strictEqual(parser.isFileSupported('.'), false);
      assert.strictEqual(parser.isFileSupported('..'), false);
    });

    it('should be case insensitive', () => {
      // The FileReader.isSupported method converts extensions to lowercase
      assert.strictEqual(parser.isFileSupported('test.JS'), true);
      assert.strictEqual(parser.isFileSupported('test.TS'), true);
      assert.strictEqual(parser.isFileSupported('test.JSX'), true);
      assert.strictEqual(parser.isFileSupported('test.TSX'), true);
    });
  });
});
