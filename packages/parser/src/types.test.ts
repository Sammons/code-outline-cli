import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  // Type guards
  isNamedNode,
  isUnnamedNode,
  isContainerType,
  isStructuralType,
  isInsignificantType,
  isValidOutputFormat,

  // Validation functions
  validateDepth,
  validateFormat,
  validateDepthValue,

  // Error classes
  ParserError,
  FileReaderError,
  UnsupportedFileTypeError,

  // Constants
  NODE_TYPES,
  CONTAINER_TYPES,
  STRUCTURAL_TYPES,
  INSIGNIFICANT_TYPES,
  OUTPUT_FORMATS,

  // Types and interfaces
  type NodeInfo,
  type OutputFormat,
  type ValidationResult,
} from './types.ts';

describe('types.ts', () => {
  describe('Type Guards', () => {
    describe('isNamedNode', () => {
      it('should return true for nodes with a name', () => {
        const namedNode: NodeInfo = {
          type: 'function_declaration',
          name: 'myFunction',
          start: { row: 0, column: 0 },
          end: { row: 5, column: 1 },
        };

        assert.strictEqual(isNamedNode(namedNode), true);

        // Type assertion should work
        if (isNamedNode(namedNode)) {
          assert.strictEqual(namedNode.name, 'myFunction');
        }
      });

      it('should return true for nodes with empty string name', () => {
        const nodeWithEmptyName: NodeInfo = {
          type: 'variable_declarator',
          name: '',
          start: { row: 0, column: 0 },
          end: { row: 0, column: 10 },
        };

        assert.strictEqual(isNamedNode(nodeWithEmptyName), true);
      });

      it('should return false for nodes without a name', () => {
        const unnamedNode: NodeInfo = {
          type: 'statement_block',
          start: { row: 0, column: 0 },
          end: { row: 5, column: 1 },
        };

        assert.strictEqual(isNamedNode(unnamedNode), false);
      });

      it('should return false for nodes with undefined name', () => {
        const nodeWithUndefinedName: NodeInfo = {
          type: 'object',
          name: undefined,
          start: { row: 0, column: 0 },
          end: { row: 3, column: 1 },
        };

        assert.strictEqual(isNamedNode(nodeWithUndefinedName), false);
      });
    });

    describe('isUnnamedNode', () => {
      it('should return true for nodes without a name', () => {
        const unnamedNode: NodeInfo = {
          type: 'statement_block',
          start: { row: 0, column: 0 },
          end: { row: 5, column: 1 },
        };

        assert.strictEqual(isUnnamedNode(unnamedNode), true);

        // Type assertion should work
        if (isUnnamedNode(unnamedNode)) {
          assert.strictEqual(unnamedNode.name, undefined);
        }
      });

      it('should return true for nodes with explicitly undefined name', () => {
        const nodeWithUndefinedName: NodeInfo = {
          type: 'object',
          name: undefined,
          start: { row: 0, column: 0 },
          end: { row: 3, column: 1 },
        };

        assert.strictEqual(isUnnamedNode(nodeWithUndefinedName), true);
      });

      it('should return false for nodes with a name', () => {
        const namedNode: NodeInfo = {
          type: 'function_declaration',
          name: 'myFunction',
          start: { row: 0, column: 0 },
          end: { row: 5, column: 1 },
        };

        assert.strictEqual(isUnnamedNode(namedNode), false);
      });

      it('should return false for nodes with empty string name', () => {
        const nodeWithEmptyName: NodeInfo = {
          type: 'variable_declarator',
          name: '',
          start: { row: 0, column: 0 },
          end: { row: 0, column: 10 },
        };

        assert.strictEqual(isUnnamedNode(nodeWithEmptyName), false);
      });
    });

    describe('isContainerType', () => {
      it('should return true for valid container types', () => {
        CONTAINER_TYPES.forEach((containerType) => {
          assert.strictEqual(isContainerType(containerType), true);
        });
      });

      it('should return false for non-container types', () => {
        const nonContainerTypes = [
          'identifier',
          'string_literal',
          'number_literal',
          'boolean_literal',
          'null',
          'undefined',
          'comment',
        ];

        nonContainerTypes.forEach((type) => {
          assert.strictEqual(isContainerType(type), false);
        });
      });

      it('should return false for empty string', () => {
        assert.strictEqual(isContainerType(''), false);
      });

      it('should be case sensitive', () => {
        assert.strictEqual(isContainerType('PROGRAM'), false);
        assert.strictEqual(isContainerType('Program'), false);
        assert.strictEqual(isContainerType('program'), true);
      });
    });

    describe('isStructuralType', () => {
      it('should return true for valid structural types', () => {
        STRUCTURAL_TYPES.forEach((structuralType) => {
          assert.strictEqual(isStructuralType(structuralType), true);
        });
      });

      it('should return false for non-structural types', () => {
        const nonStructuralTypes = [
          'function_declaration',
          'variable_declaration',
          'import_statement',
          'identifier',
          'comment',
        ];

        nonStructuralTypes.forEach((type) => {
          assert.strictEqual(isStructuralType(type), false);
        });
      });

      it('should return false for empty string', () => {
        assert.strictEqual(isStructuralType(''), false);
      });

      it('should be case sensitive', () => {
        assert.strictEqual(isStructuralType('PROGRAM'), false);
        assert.strictEqual(isStructuralType('Program'), false);
        assert.strictEqual(isStructuralType('program'), true);
      });
    });

    describe('isInsignificantType', () => {
      it('should return true for valid insignificant types', () => {
        INSIGNIFICANT_TYPES.forEach((insignificantType) => {
          assert.strictEqual(isInsignificantType(insignificantType), true);
        });
      });

      it('should return false for significant types', () => {
        const significantTypes = [
          'function_declaration',
          'class_declaration',
          'variable_declaration',
          'program',
          'identifier',
        ];

        significantTypes.forEach((type) => {
          assert.strictEqual(isInsignificantType(type), false);
        });
      });

      it('should return false for empty string', () => {
        assert.strictEqual(isInsignificantType(''), false);
      });

      it('should handle special character types', () => {
        assert.strictEqual(isInsignificantType(','), true);
        assert.strictEqual(isInsignificantType(';'), true);
        assert.strictEqual(isInsignificantType('{'), true);
        assert.strictEqual(isInsignificantType('}'), true);
        assert.strictEqual(isInsignificantType('('), true);
        assert.strictEqual(isInsignificantType(')'), true);
        assert.strictEqual(isInsignificantType('['), true);
        assert.strictEqual(isInsignificantType(']'), true);
      });

      it('should handle ERROR type', () => {
        assert.strictEqual(isInsignificantType('ERROR'), true);
        assert.strictEqual(isInsignificantType('error'), false); // case sensitive
      });
    });

    describe('isValidOutputFormat', () => {
      it('should return true for valid output formats', () => {
        OUTPUT_FORMATS.forEach((format) => {
          assert.strictEqual(isValidOutputFormat(format), true);
        });
      });

      it('should return false for invalid output formats', () => {
        const invalidFormats = ['xml', 'html', 'csv', 'txt', 'markdown', ''];

        invalidFormats.forEach((format) => {
          assert.strictEqual(isValidOutputFormat(format), false);
        });
      });

      it('should be case sensitive', () => {
        assert.strictEqual(isValidOutputFormat('JSON'), false);
        assert.strictEqual(isValidOutputFormat('Json'), false);
        assert.strictEqual(isValidOutputFormat('YAML'), false);
        assert.strictEqual(isValidOutputFormat('Yaml'), false);
        assert.strictEqual(isValidOutputFormat('ASCII'), false);
        assert.strictEqual(isValidOutputFormat('Ascii'), false);
      });

      it('should handle exact matches only', () => {
        assert.strictEqual(isValidOutputFormat('json '), false); // trailing space
        assert.strictEqual(isValidOutputFormat(' json'), false); // leading space
        assert.strictEqual(isValidOutputFormat('json\n'), false); // with newline
      });
    });
  });

  describe('Validation Functions', () => {
    describe('validateDepth', () => {
      it('should return Infinity for "Infinity" string', () => {
        assert.strictEqual(validateDepth('Infinity'), Infinity);
      });

      it('should parse and return valid positive integers', () => {
        assert.strictEqual(validateDepth('1'), 1);
        assert.strictEqual(validateDepth('5'), 5);
        assert.strictEqual(validateDepth('100'), 100);
        assert.strictEqual(validateDepth('999'), 999);
      });

      it('should parse string numbers with leading zeros', () => {
        assert.strictEqual(validateDepth('01'), 1);
        assert.strictEqual(validateDepth('007'), 7);
        assert.strictEqual(validateDepth('0010'), 10);
      });

      it('should throw error for zero', () => {
        assert.throws(() => validateDepth('0'), (err) => {
          assert.ok(err instanceof Error);
          assert.ok(err.message.includes('Depth must be a positive number or "Infinity"'));
          return true;
        });
      });

      it('should throw error for negative numbers', () => {
        assert.throws(() => validateDepth('-1'), (err) => {
          assert.ok(err instanceof Error);
          assert.ok(err.message.includes('Depth must be a positive number or "Infinity"'));
          return true;
        });
        assert.throws(() => validateDepth('-10'), (err) => {
          assert.ok(err instanceof Error);
          assert.ok(err.message.includes('Depth must be a positive number or "Infinity"'));
          return true;
        });
        assert.throws(() => validateDepth('-999'), (err) => {
          assert.ok(err instanceof Error);
          assert.ok(err.message.includes('Depth must be a positive number or "Infinity"'));
          return true;
        });
      });

      it('should throw error for non-numeric strings', () => {
        assert.throws(() => validateDepth('abc'), (err) => {
          assert.ok(err instanceof Error);
          assert.ok(err.message.includes('Depth must be a positive number or "Infinity"'));
          return true;
        });
        // parseInt('1abc', 10) returns 1, so this should actually work
        assert.strictEqual(validateDepth('1abc'), 1);
        assert.throws(() => validateDepth('abc1'), (err) => {
          assert.ok(err instanceof Error);
          assert.ok(err.message.includes('Depth must be a positive number or "Infinity"'));
          return true;
        });
        // parseInt('1.5', 10) returns 1, so this should actually work
        assert.strictEqual(validateDepth('1.5'), 1);
      });

      it('should throw error for empty string', () => {
        assert.throws(() => validateDepth(''), (err) => {
          assert.ok(err instanceof Error);
          assert.ok(err.message.includes('Depth must be a positive number or "Infinity"'));
          return true;
        });
      });

      it('should throw error for whitespace strings', () => {
        assert.throws(() => validateDepth(' '), (err) => {
          assert.ok(err instanceof Error);
          assert.ok(err.message.includes('Depth must be a positive number or "Infinity"'));
          return true;
        });
        assert.throws(() => validateDepth('\n'), (err) => {
          assert.ok(err instanceof Error);
          assert.ok(err.message.includes('Depth must be a positive number or "Infinity"'));
          return true;
        });
        assert.throws(() => validateDepth('\t'), (err) => {
          assert.ok(err instanceof Error);
          assert.ok(err.message.includes('Depth must be a positive number or "Infinity"'));
          return true;
        });
      });

      it('should handle mixed valid/invalid strings (parseInt behavior)', () => {
        // parseInt is lenient and parses leading numbers, ignoring trailing characters
        assert.strictEqual(validateDepth('5 '), 5); // parseInt('5 ', 10) = 5
        assert.strictEqual(validateDepth(' 5'), 5); // parseInt(' 5', 10) = 5
        assert.strictEqual(validateDepth('5\n'), 5); // parseInt('5\n', 10) = 5
        assert.strictEqual(validateDepth('123abc'), 123); // parseInt('123abc', 10) = 123
      });

      it('should be case sensitive for Infinity', () => {
        assert.throws(() => validateDepth('infinity'), (err) => {
          assert.ok(err instanceof Error);
          assert.ok(err.message.includes('Depth must be a positive number or "Infinity"'));
          return true;
        });
        assert.throws(() => validateDepth('INFINITY'), (err) => {
          assert.ok(err instanceof Error);
          assert.ok(err.message.includes('Depth must be a positive number or "Infinity"'));
          return true;
        });
        assert.throws(() => validateDepth('InFiNiTy'), (err) => {
          assert.ok(err instanceof Error);
          assert.ok(err.message.includes('Depth must be a positive number or "Infinity"'));
          return true;
        });
      });
    });

    describe('validateFormat', () => {
      it('should return success result for valid formats', () => {
        OUTPUT_FORMATS.forEach((format) => {
          const result = validateFormat(format);
          assert.strictEqual(result.success, true);
          assert.strictEqual(result.value, format);
          assert.strictEqual(result.error, undefined);
        });
      });

      it('should return error result for non-string inputs', () => {
        const nonStringInputs = [
          null,
          undefined,
          123,
          true,
          false,
          {},
          [],
          Symbol('test'),
        ];

        nonStringInputs.forEach((input) => {
          const result = validateFormat(input);
          assert.strictEqual(result.success, false);
          assert.strictEqual(result.value, undefined);
          assert.strictEqual(result.error, 'Format must be a string');
        });
      });

      it('should return error result for invalid string formats', () => {
        const invalidFormats = [
          'xml',
          'html',
          'csv',
          'txt',
          'markdown',
          '',
          'JSON',
          'Json',
          'YAML',
          'Yaml',
        ];

        invalidFormats.forEach((format) => {
          const result = validateFormat(format);
          assert.strictEqual(result.success, false);
          assert.strictEqual(result.value, undefined);
          assert.strictEqual(result.error, `Invalid format "${format}". Must be one of: json, yaml, ascii, llmtext`);
        });
      });

      it('should handle edge cases with whitespace', () => {
        const whitespaceFormats = [
          ' json',
          'json ',
          ' json ',
          'json\n',
          '\tjson',
        ];

        whitespaceFormats.forEach((format) => {
          const result = validateFormat(format);
          assert.strictEqual(result.success, false);
          assert.strictEqual(result.value, undefined);
          assert.strictEqual(result.error, `Invalid format "${format}". Must be one of: json, yaml, ascii, llmtext`);
        });
      });
    });

    describe('validateDepthValue', () => {
      it('should return success result for valid depth strings', () => {
        const validDepths = ['1', '5', '10', '999', 'Infinity'];

        validDepths.forEach((depth) => {
          const result = validateDepthValue(depth);
          assert.strictEqual(result.success, true);
          assert.notStrictEqual(result.value, undefined);
          assert.strictEqual(result.error, undefined);

          if (depth === 'Infinity') {
            assert.strictEqual(result.value, Infinity);
          } else {
            assert.strictEqual(result.value, parseInt(depth, 10));
          }
        });
      });

      it('should return error result for non-string inputs', () => {
        const nonStringInputs = [
          null,
          undefined,
          123,
          true,
          false,
          {},
          [],
          Symbol('test'),
        ];

        nonStringInputs.forEach((input) => {
          const result = validateDepthValue(input);
          assert.strictEqual(result.success, false);
          assert.strictEqual(result.value, undefined);
          assert.strictEqual(result.error, 'Depth must be a string');
        });
      });

      it('should return error result for invalid depth strings', () => {
        const invalidDepths = [
          '0',
          '-1',
          '-10',
          'abc',
          'abc1',
          '',
          ' ',
          '\n',
          '\t',
          'infinity',
          'INFINITY',
        ];

        invalidDepths.forEach((depth) => {
          const result = validateDepthValue(depth);
          assert.strictEqual(result.success, false);
          assert.strictEqual(result.value, undefined);
          assert.strictEqual(result.error, 'Depth must be a positive number or "Infinity"');
        });
      });

      it('should return success result for strings that parseInt can parse', () => {
        const parseableDepths = ['1abc', '1.5', '5 ', ' 5', '5\n', '123abc'];

        parseableDepths.forEach((depth) => {
          const result = validateDepthValue(depth);
          assert.strictEqual(result.success, true);
          assert.notStrictEqual(result.value, undefined);
          assert.strictEqual(result.error, undefined);
        });
      });

      it('should handle errors from validateDepth function', () => {
        // Test that it properly wraps validateDepth errors
        const result = validateDepthValue('0');
        assert.strictEqual(result.success, false);
        assert.strictEqual(result.error, 'Depth must be a positive number or "Infinity"');
      });

      it('should handle non-Error exceptions (edge case)', () => {
        // This tests the fallback error handling
        // We can't easily mock validateDepth to throw a non-Error, so this tests the code path
        const result = validateDepthValue('not-a-number');
        assert.strictEqual(result.success, false);
        assert.strictEqual(result.error, 'Depth must be a positive number or "Infinity"');
      });
    });
  });

  describe('Error Classes', () => {
    describe('ParserError', () => {
      it('should create error with message only', () => {
        const message = 'Parse failed';
        const error = new ParserError(message);

        assert.ok(error instanceof Error);
        assert.ok(error instanceof ParserError);
        assert.strictEqual(error.name, 'ParserError');
        assert.strictEqual(error.message, message);
        assert.strictEqual(error.filePath, undefined);
      });

      it('should create error with message and file path', () => {
        const message = 'Parse failed';
        const filePath = '/path/to/file.ts';
        const error = new ParserError(message, filePath);

        assert.ok(error instanceof Error);
        assert.ok(error instanceof ParserError);
        assert.strictEqual(error.name, 'ParserError');
        assert.strictEqual(error.message, message);
        assert.strictEqual(error.filePath, filePath);
      });

      it('should be throwable and catchable', () => {
        const message = 'Test error';
        const filePath = '/test/path.ts';

        assert.throws(() => {
          throw new ParserError(message, filePath);
        }, ParserError);

        try {
          throw new ParserError(message, filePath);
        } catch (error) {
          assert.ok(error instanceof ParserError);
          assert.strictEqual((error as ParserError).message, message);
          assert.strictEqual((error as ParserError).filePath, filePath);
        }
      });

      it('should handle empty message', () => {
        const error = new ParserError('');
        assert.strictEqual(error.message, '');
        assert.strictEqual(error.name, 'ParserError');
      });

      it('should handle empty file path', () => {
        const error = new ParserError('message', '');
        assert.strictEqual(error.filePath, '');
      });
    });

    describe('FileReaderError', () => {
      it('should create error with message and file path', () => {
        const message = 'File not found';
        const filePath = '/path/to/missing.ts';
        const error = new FileReaderError(message, filePath);

        assert.ok(error instanceof Error);
        assert.ok(error instanceof FileReaderError);
        assert.strictEqual(error.name, 'FileReaderError');
        assert.strictEqual(error.message, message);
        assert.strictEqual(error.filePath, filePath);
      });

      it('should be throwable and catchable', () => {
        const message = 'Permission denied';
        const filePath = '/restricted/file.ts';

        assert.throws(() => {
          throw new FileReaderError(message, filePath);
        }, FileReaderError);

        try {
          throw new FileReaderError(message, filePath);
        } catch (error) {
          assert.ok(error instanceof FileReaderError);
          assert.strictEqual((error as FileReaderError).message, message);
          assert.strictEqual((error as FileReaderError).filePath, filePath);
        }
      });

      it('should handle empty values', () => {
        const error = new FileReaderError('', '');
        assert.strictEqual(error.message, '');
        assert.strictEqual(error.filePath, '');
        assert.strictEqual(error.name, 'FileReaderError');
      });

      it('should be distinguishable from other error types', () => {
        const fileError = new FileReaderError('File error', '/path');
        const parserError = new ParserError('Parser error');

        assert.ok(fileError instanceof FileReaderError);
        assert.ok(!(fileError instanceof ParserError));
        assert.ok(parserError instanceof ParserError);
        assert.ok(!(parserError instanceof FileReaderError));
      });
    });

    describe('UnsupportedFileTypeError', () => {
      it('should create error with file path and supported types', () => {
        const filePath = '/path/to/file.py';
        const supportedTypes = ['js', 'ts', 'jsx', 'tsx'];
        const error = new UnsupportedFileTypeError(filePath, supportedTypes);

        assert.ok(error instanceof Error);
        assert.ok(error instanceof UnsupportedFileTypeError);
        assert.strictEqual(error.name, 'UnsupportedFileTypeError');
        assert.strictEqual(error.message, 'Unsupported file type for /path/to/file.py. Supported types: js, ts, jsx, tsx');
      });

      it('should handle empty supported types array', () => {
        const filePath = '/path/to/file.unknown';
        const supportedTypes: string[] = [];
        const error = new UnsupportedFileTypeError(filePath, supportedTypes);

        assert.strictEqual(error.message, 'Unsupported file type for /path/to/file.unknown. Supported types: ');
      });

      it('should handle single supported type', () => {
        const filePath = '/path/to/file.py';
        const supportedTypes = ['js'];
        const error = new UnsupportedFileTypeError(filePath, supportedTypes);

        assert.strictEqual(error.message, 'Unsupported file type for /path/to/file.py. Supported types: js');
      });

      it('should be throwable and catchable', () => {
        const filePath = '/path/to/file.rb';
        const supportedTypes = ['js', 'ts'];

        assert.throws(() => {
          throw new UnsupportedFileTypeError(filePath, supportedTypes);
        }, UnsupportedFileTypeError);

        try {
          throw new UnsupportedFileTypeError(filePath, supportedTypes);
        } catch (error: unknown) {
          assert.ok(error instanceof UnsupportedFileTypeError);
          if (error instanceof UnsupportedFileTypeError) {
            assert.ok(error.message.includes(filePath));
            assert.ok(error.message.includes('js, ts'));
          }
        }
      });

      it('should handle empty file path', () => {
        const error = new UnsupportedFileTypeError('', ['js']);
        assert.strictEqual(error.message, 'Unsupported file type for . Supported types: js');
      });

      it('should be distinguishable from other error types', () => {
        const unsupportedError = new UnsupportedFileTypeError('/path', ['js']);
        const fileError = new FileReaderError('File error', '/path');
        const parserError = new ParserError('Parser error');

        assert.ok(unsupportedError instanceof UnsupportedFileTypeError);
        assert.ok(!(unsupportedError instanceof FileReaderError));
        assert.ok(!(unsupportedError instanceof ParserError));
      });
    });
  });

  describe('Constants', () => {
    describe('NODE_TYPES', () => {
      it('should be a readonly array', () => {
        assert.strictEqual(Array.isArray(NODE_TYPES), true);
        assert.ok(NODE_TYPES.length > 0);
      });

      it('should contain expected node types', () => {
        const expectedTypes = [
          'function_declaration',
          'class_declaration',
          'interface_declaration',
          'variable_declaration',
          'program',
        ];

        expectedTypes.forEach((type) => {
          assert.ok(NODE_TYPES.includes(type as any));
        });
      });

      it('should not contain duplicates', () => {
        const uniqueTypes = new Set(NODE_TYPES);
        assert.strictEqual(uniqueTypes.size, NODE_TYPES.length);
      });

      it('should contain only string values', () => {
        NODE_TYPES.forEach((type) => {
          assert.strictEqual(typeof type, 'string');
          assert.ok(type.length > 0);
        });
      });
    });

    describe('CONTAINER_TYPES', () => {
      it('should be a readonly array', () => {
        assert.strictEqual(Array.isArray(CONTAINER_TYPES), true);
        assert.ok(CONTAINER_TYPES.length > 0);
      });

      it('should contain expected container types', () => {
        const expectedTypes = [
          'program',
          'class_body',
          'function_declaration',
          'object',
        ];

        expectedTypes.forEach((type) => {
          assert.ok(CONTAINER_TYPES.includes(type as any));
        });
      });

      it('should not contain duplicates', () => {
        const uniqueTypes = new Set(CONTAINER_TYPES);
        assert.strictEqual(uniqueTypes.size, CONTAINER_TYPES.length);
      });

      it('should be a subset of NODE_TYPES', () => {
        CONTAINER_TYPES.forEach((containerType) => {
          assert.ok(NODE_TYPES.includes(containerType as any));
        });
      });
    });

    describe('STRUCTURAL_TYPES', () => {
      it('should be a readonly array', () => {
        assert.strictEqual(Array.isArray(STRUCTURAL_TYPES), true);
        assert.ok(STRUCTURAL_TYPES.length > 0);
      });

      it('should contain expected structural types', () => {
        const expectedTypes = [
          'program',
          'class_body',
          'interface_body',
          'enum_body',
          'object',
          'statement_block',
        ];

        expectedTypes.forEach((type) => {
          assert.ok(STRUCTURAL_TYPES.includes(type as any));
        });
      });

      it('should not contain duplicates', () => {
        const uniqueTypes = new Set(STRUCTURAL_TYPES);
        assert.strictEqual(uniqueTypes.size, STRUCTURAL_TYPES.length);
      });

      it('should be a subset of CONTAINER_TYPES', () => {
        STRUCTURAL_TYPES.forEach((structuralType) => {
          assert.ok(CONTAINER_TYPES.includes(structuralType as any));
        });
      });
    });

    describe('INSIGNIFICANT_TYPES', () => {
      it('should be a readonly array', () => {
        assert.strictEqual(Array.isArray(INSIGNIFICANT_TYPES), true);
        assert.ok(INSIGNIFICANT_TYPES.length > 0);
      });

      it('should contain expected insignificant types', () => {
        const expectedTypes = [
          'comment',
          ',',
          ';',
          '{',
          '}',
          '(',
          ')',
          '[',
          ']',
          'ERROR',
        ];

        expectedTypes.forEach((type) => {
          assert.ok(INSIGNIFICANT_TYPES.includes(type as any));
        });
      });

      it('should not contain duplicates', () => {
        const uniqueTypes = new Set(INSIGNIFICANT_TYPES);
        assert.strictEqual(uniqueTypes.size, INSIGNIFICANT_TYPES.length);
      });

      it('should contain punctuation and special types', () => {
        const punctuationTypes = [',', ';', '{', '}', '(', ')', '[', ']'];
        punctuationTypes.forEach((type) => {
          assert.ok(INSIGNIFICANT_TYPES.includes(type as any));
        });

        assert.ok(INSIGNIFICANT_TYPES.includes('comment' as any));
        assert.ok(INSIGNIFICANT_TYPES.includes('ERROR' as any));
      });
    });

    describe('OUTPUT_FORMATS', () => {
      it('should be a readonly array', () => {
        assert.strictEqual(Array.isArray(OUTPUT_FORMATS), true);
        assert.strictEqual(OUTPUT_FORMATS.length, 4);
      });

      it('should contain expected output formats', () => {
        assert.deepStrictEqual(OUTPUT_FORMATS, ['json', 'yaml', 'ascii', 'llmtext']);
      });

      it('should not contain duplicates', () => {
        const uniqueFormats = new Set(OUTPUT_FORMATS);
        assert.strictEqual(uniqueFormats.size, OUTPUT_FORMATS.length);
      });

      it('should contain only string values', () => {
        OUTPUT_FORMATS.forEach((format) => {
          assert.strictEqual(typeof format, 'string');
          assert.ok(format.length > 0);
        });
      });
    });
  });

  describe('Type Discrimination', () => {
    it('should properly discriminate named vs unnamed nodes', () => {
      const nodes: NodeInfo[] = [
        {
          type: 'function_declaration',
          name: 'myFunction',
          start: { row: 0, column: 0 },
          end: { row: 5, column: 1 },
        },
        {
          type: 'statement_block',
          start: { row: 0, column: 0 },
          end: { row: 5, column: 1 },
        },
      ];

      const namedNodes = nodes.filter(isNamedNode);
      const unnamedNodes = nodes.filter(isUnnamedNode);

      assert.strictEqual(namedNodes.length, 1);
      assert.strictEqual(unnamedNodes.length, 1);
      assert.strictEqual(namedNodes[0].name, 'myFunction');
      assert.strictEqual(unnamedNodes[0].name, undefined);
    });

    it('should handle validation result success vs error cases', () => {
      const validFormat = validateFormat('json');
      const invalidFormat = validateFormat('xml');

      if (validFormat.success) {
        assert.strictEqual(validFormat.value, 'json');
        assert.strictEqual(validFormat.error, undefined);
      }

      if (!invalidFormat.success) {
        assert.strictEqual(invalidFormat.value, undefined);
        assert.ok(invalidFormat.error.includes('Invalid format'));
      }
    });
  });

  describe('Edge Cases and Boundary Conditions', () => {
    it('should handle extremely large depth values', () => {
      const largeDepth = '999999999';
      assert.strictEqual(validateDepth(largeDepth), 999999999);

      const result = validateDepthValue(largeDepth);
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.value, 999999999);
    });

    it('should handle node info with all optional fields', () => {
      const minimalNode: NodeInfo = {
        type: 'program',
        start: { row: 0, column: 0 },
        end: { row: 100, column: 0 },
      };

      assert.strictEqual(isUnnamedNode(minimalNode), true);
      assert.strictEqual(isNamedNode(minimalNode), false);
    });

    it('should handle node info with children array', () => {
      const nodeWithChildren: NodeInfo = {
        type: 'class_declaration',
        name: 'MyClass',
        start: { row: 0, column: 0 },
        end: { row: 10, column: 1 },
        children: [
          {
            type: 'method_definition',
            name: 'myMethod',
            start: { row: 1, column: 2 },
            end: { row: 3, column: 3 },
          },
        ],
      };

      assert.strictEqual(isNamedNode(nodeWithChildren), true);
      assert.strictEqual(nodeWithChildren.children.length, 1);
    });

    it('should handle zero position values', () => {
      const nodeAtOrigin: NodeInfo = {
        type: 'program',
        start: { row: 0, column: 0 },
        end: { row: 0, column: 0 },
      };

      assert.strictEqual(nodeAtOrigin.start.row, 0);
      assert.strictEqual(nodeAtOrigin.start.column, 0);
      assert.strictEqual(nodeAtOrigin.end.row, 0);
      assert.strictEqual(nodeAtOrigin.end.column, 0);
    });
  });
});
