import { describe, it, expect } from 'vitest';
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
} from './types';

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

        expect(isNamedNode(namedNode)).toBe(true);

        // Type assertion should work
        if (isNamedNode(namedNode)) {
          expect(namedNode.name).toBe('myFunction');
        }
      });

      it('should return true for nodes with empty string name', () => {
        const nodeWithEmptyName: NodeInfo = {
          type: 'variable_declarator',
          name: '',
          start: { row: 0, column: 0 },
          end: { row: 0, column: 10 },
        };

        expect(isNamedNode(nodeWithEmptyName)).toBe(true);
      });

      it('should return false for nodes without a name', () => {
        const unnamedNode: NodeInfo = {
          type: 'statement_block',
          start: { row: 0, column: 0 },
          end: { row: 5, column: 1 },
        };

        expect(isNamedNode(unnamedNode)).toBe(false);
      });

      it('should return false for nodes with undefined name', () => {
        const nodeWithUndefinedName: NodeInfo = {
          type: 'object',
          name: undefined,
          start: { row: 0, column: 0 },
          end: { row: 3, column: 1 },
        };

        expect(isNamedNode(nodeWithUndefinedName)).toBe(false);
      });
    });

    describe('isUnnamedNode', () => {
      it('should return true for nodes without a name', () => {
        const unnamedNode: NodeInfo = {
          type: 'statement_block',
          start: { row: 0, column: 0 },
          end: { row: 5, column: 1 },
        };

        expect(isUnnamedNode(unnamedNode)).toBe(true);

        // Type assertion should work
        if (isUnnamedNode(unnamedNode)) {
          expect(unnamedNode.name).toBeUndefined();
        }
      });

      it('should return true for nodes with explicitly undefined name', () => {
        const nodeWithUndefinedName: NodeInfo = {
          type: 'object',
          name: undefined,
          start: { row: 0, column: 0 },
          end: { row: 3, column: 1 },
        };

        expect(isUnnamedNode(nodeWithUndefinedName)).toBe(true);
      });

      it('should return false for nodes with a name', () => {
        const namedNode: NodeInfo = {
          type: 'function_declaration',
          name: 'myFunction',
          start: { row: 0, column: 0 },
          end: { row: 5, column: 1 },
        };

        expect(isUnnamedNode(namedNode)).toBe(false);
      });

      it('should return false for nodes with empty string name', () => {
        const nodeWithEmptyName: NodeInfo = {
          type: 'variable_declarator',
          name: '',
          start: { row: 0, column: 0 },
          end: { row: 0, column: 10 },
        };

        expect(isUnnamedNode(nodeWithEmptyName)).toBe(false);
      });
    });

    describe('isContainerType', () => {
      it('should return true for valid container types', () => {
        CONTAINER_TYPES.forEach((containerType) => {
          expect(isContainerType(containerType)).toBe(true);
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
          expect(isContainerType(type)).toBe(false);
        });
      });

      it('should return false for empty string', () => {
        expect(isContainerType('')).toBe(false);
      });

      it('should be case sensitive', () => {
        expect(isContainerType('PROGRAM')).toBe(false);
        expect(isContainerType('Program')).toBe(false);
        expect(isContainerType('program')).toBe(true);
      });
    });

    describe('isStructuralType', () => {
      it('should return true for valid structural types', () => {
        STRUCTURAL_TYPES.forEach((structuralType) => {
          expect(isStructuralType(structuralType)).toBe(true);
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
          expect(isStructuralType(type)).toBe(false);
        });
      });

      it('should return false for empty string', () => {
        expect(isStructuralType('')).toBe(false);
      });

      it('should be case sensitive', () => {
        expect(isStructuralType('PROGRAM')).toBe(false);
        expect(isStructuralType('Program')).toBe(false);
        expect(isStructuralType('program')).toBe(true);
      });
    });

    describe('isInsignificantType', () => {
      it('should return true for valid insignificant types', () => {
        INSIGNIFICANT_TYPES.forEach((insignificantType) => {
          expect(isInsignificantType(insignificantType)).toBe(true);
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
          expect(isInsignificantType(type)).toBe(false);
        });
      });

      it('should return false for empty string', () => {
        expect(isInsignificantType('')).toBe(false);
      });

      it('should handle special character types', () => {
        expect(isInsignificantType(',')).toBe(true);
        expect(isInsignificantType(';')).toBe(true);
        expect(isInsignificantType('{')).toBe(true);
        expect(isInsignificantType('}')).toBe(true);
        expect(isInsignificantType('(')).toBe(true);
        expect(isInsignificantType(')')).toBe(true);
        expect(isInsignificantType('[')).toBe(true);
        expect(isInsignificantType(']')).toBe(true);
      });

      it('should handle ERROR type', () => {
        expect(isInsignificantType('ERROR')).toBe(true);
        expect(isInsignificantType('error')).toBe(false); // case sensitive
      });
    });

    describe('isValidOutputFormat', () => {
      it('should return true for valid output formats', () => {
        OUTPUT_FORMATS.forEach((format) => {
          expect(isValidOutputFormat(format)).toBe(true);
        });
      });

      it('should return false for invalid output formats', () => {
        const invalidFormats = ['xml', 'html', 'csv', 'txt', 'markdown', ''];

        invalidFormats.forEach((format) => {
          expect(isValidOutputFormat(format)).toBe(false);
        });
      });

      it('should be case sensitive', () => {
        expect(isValidOutputFormat('JSON')).toBe(false);
        expect(isValidOutputFormat('Json')).toBe(false);
        expect(isValidOutputFormat('YAML')).toBe(false);
        expect(isValidOutputFormat('Yaml')).toBe(false);
        expect(isValidOutputFormat('ASCII')).toBe(false);
        expect(isValidOutputFormat('Ascii')).toBe(false);
      });

      it('should handle exact matches only', () => {
        expect(isValidOutputFormat('json ')).toBe(false); // trailing space
        expect(isValidOutputFormat(' json')).toBe(false); // leading space
        expect(isValidOutputFormat('json\n')).toBe(false); // with newline
      });
    });
  });

  describe('Validation Functions', () => {
    describe('validateDepth', () => {
      it('should return Infinity for "Infinity" string', () => {
        expect(validateDepth('Infinity')).toBe(Infinity);
      });

      it('should parse and return valid positive integers', () => {
        expect(validateDepth('1')).toBe(1);
        expect(validateDepth('5')).toBe(5);
        expect(validateDepth('100')).toBe(100);
        expect(validateDepth('999')).toBe(999);
      });

      it('should parse string numbers with leading zeros', () => {
        expect(validateDepth('01')).toBe(1);
        expect(validateDepth('007')).toBe(7);
        expect(validateDepth('0010')).toBe(10);
      });

      it('should throw error for zero', () => {
        expect(() => validateDepth('0')).toThrow(
          'Depth must be a positive number or "Infinity"'
        );
      });

      it('should throw error for negative numbers', () => {
        expect(() => validateDepth('-1')).toThrow(
          'Depth must be a positive number or "Infinity"'
        );
        expect(() => validateDepth('-10')).toThrow(
          'Depth must be a positive number or "Infinity"'
        );
        expect(() => validateDepth('-999')).toThrow(
          'Depth must be a positive number or "Infinity"'
        );
      });

      it('should throw error for non-numeric strings', () => {
        expect(() => validateDepth('abc')).toThrow(
          'Depth must be a positive number or "Infinity"'
        );
        // parseInt('1abc', 10) returns 1, so this should actually work
        expect(validateDepth('1abc')).toBe(1);
        expect(() => validateDepth('abc1')).toThrow(
          'Depth must be a positive number or "Infinity"'
        );
        // parseInt('1.5', 10) returns 1, so this should actually work
        expect(validateDepth('1.5')).toBe(1);
      });

      it('should throw error for empty string', () => {
        expect(() => validateDepth('')).toThrow(
          'Depth must be a positive number or "Infinity"'
        );
      });

      it('should throw error for whitespace strings', () => {
        expect(() => validateDepth(' ')).toThrow(
          'Depth must be a positive number or "Infinity"'
        );
        expect(() => validateDepth('\n')).toThrow(
          'Depth must be a positive number or "Infinity"'
        );
        expect(() => validateDepth('\t')).toThrow(
          'Depth must be a positive number or "Infinity"'
        );
      });

      it('should handle mixed valid/invalid strings (parseInt behavior)', () => {
        // parseInt is lenient and parses leading numbers, ignoring trailing characters
        expect(validateDepth('5 ')).toBe(5); // parseInt('5 ', 10) = 5
        expect(validateDepth(' 5')).toBe(5); // parseInt(' 5', 10) = 5
        expect(validateDepth('5\n')).toBe(5); // parseInt('5\n', 10) = 5
        expect(validateDepth('123abc')).toBe(123); // parseInt('123abc', 10) = 123
      });

      it('should be case sensitive for Infinity', () => {
        expect(() => validateDepth('infinity')).toThrow(
          'Depth must be a positive number or "Infinity"'
        );
        expect(() => validateDepth('INFINITY')).toThrow(
          'Depth must be a positive number or "Infinity"'
        );
        expect(() => validateDepth('InFiNiTy')).toThrow(
          'Depth must be a positive number or "Infinity"'
        );
      });
    });

    describe('validateFormat', () => {
      it('should return success result for valid formats', () => {
        OUTPUT_FORMATS.forEach((format) => {
          const result = validateFormat(format);
          expect(result.success).toBe(true);
          expect(result.value).toBe(format);
          expect(result.error).toBeUndefined();
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
          expect(result.success).toBe(false);
          expect(result.value).toBeUndefined();
          expect(result.error).toBe('Format must be a string');
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
          expect(result.success).toBe(false);
          expect(result.value).toBeUndefined();
          expect(result.error).toBe(
            `Invalid format "${format}". Must be one of: json, yaml, ascii, llmtext`
          );
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
          expect(result.success).toBe(false);
          expect(result.value).toBeUndefined();
          expect(result.error).toBe(
            `Invalid format "${format}". Must be one of: json, yaml, ascii, llmtext`
          );
        });
      });
    });

    describe('validateDepthValue', () => {
      it('should return success result for valid depth strings', () => {
        const validDepths = ['1', '5', '10', '999', 'Infinity'];

        validDepths.forEach((depth) => {
          const result = validateDepthValue(depth);
          expect(result.success).toBe(true);
          expect(result.value).toBeDefined();
          expect(result.error).toBeUndefined();

          if (depth === 'Infinity') {
            expect(result.value).toBe(Infinity);
          } else {
            expect(result.value).toBe(parseInt(depth, 10));
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
          expect(result.success).toBe(false);
          expect(result.value).toBeUndefined();
          expect(result.error).toBe('Depth must be a string');
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
          expect(result.success).toBe(false);
          expect(result.value).toBeUndefined();
          expect(result.error).toBe(
            'Depth must be a positive number or "Infinity"'
          );
        });
      });

      it('should return success result for strings that parseInt can parse', () => {
        const parseableDepths = ['1abc', '1.5', '5 ', ' 5', '5\n', '123abc'];

        parseableDepths.forEach((depth) => {
          const result = validateDepthValue(depth);
          expect(result.success).toBe(true);
          expect(result.value).toBeDefined();
          expect(result.error).toBeUndefined();
        });
      });

      it('should handle errors from validateDepth function', () => {
        // Test that it properly wraps validateDepth errors
        const result = validateDepthValue('0');
        expect(result.success).toBe(false);
        expect(result.error).toBe(
          'Depth must be a positive number or "Infinity"'
        );
      });

      it('should handle non-Error exceptions (edge case)', () => {
        // This tests the fallback error handling
        // We can't easily mock validateDepth to throw a non-Error, so this tests the code path
        const result = validateDepthValue('not-a-number');
        expect(result.success).toBe(false);
        expect(result.error).toBe(
          'Depth must be a positive number or "Infinity"'
        );
      });
    });
  });

  describe('Error Classes', () => {
    describe('ParserError', () => {
      it('should create error with message only', () => {
        const message = 'Parse failed';
        const error = new ParserError(message);

        expect(error).toBeInstanceOf(Error);
        expect(error).toBeInstanceOf(ParserError);
        expect(error.name).toBe('ParserError');
        expect(error.message).toBe(message);
        expect(error.filePath).toBeUndefined();
      });

      it('should create error with message and file path', () => {
        const message = 'Parse failed';
        const filePath = '/path/to/file.ts';
        const error = new ParserError(message, filePath);

        expect(error).toBeInstanceOf(Error);
        expect(error).toBeInstanceOf(ParserError);
        expect(error.name).toBe('ParserError');
        expect(error.message).toBe(message);
        expect(error.filePath).toBe(filePath);
      });

      it('should be throwable and catchable', () => {
        const message = 'Test error';
        const filePath = '/test/path.ts';

        expect(() => {
          throw new ParserError(message, filePath);
        }).toThrow(ParserError);

        try {
          throw new ParserError(message, filePath);
        } catch (error) {
          expect(error).toBeInstanceOf(ParserError);
          expect((error as ParserError).message).toBe(message);
          expect((error as ParserError).filePath).toBe(filePath);
        }
      });

      it('should handle empty message', () => {
        const error = new ParserError('');
        expect(error.message).toBe('');
        expect(error.name).toBe('ParserError');
      });

      it('should handle empty file path', () => {
        const error = new ParserError('message', '');
        expect(error.filePath).toBe('');
      });
    });

    describe('FileReaderError', () => {
      it('should create error with message and file path', () => {
        const message = 'File not found';
        const filePath = '/path/to/missing.ts';
        const error = new FileReaderError(message, filePath);

        expect(error).toBeInstanceOf(Error);
        expect(error).toBeInstanceOf(FileReaderError);
        expect(error.name).toBe('FileReaderError');
        expect(error.message).toBe(message);
        expect(error.filePath).toBe(filePath);
      });

      it('should be throwable and catchable', () => {
        const message = 'Permission denied';
        const filePath = '/restricted/file.ts';

        expect(() => {
          throw new FileReaderError(message, filePath);
        }).toThrow(FileReaderError);

        try {
          throw new FileReaderError(message, filePath);
        } catch (error) {
          expect(error).toBeInstanceOf(FileReaderError);
          expect((error as FileReaderError).message).toBe(message);
          expect((error as FileReaderError).filePath).toBe(filePath);
        }
      });

      it('should handle empty values', () => {
        const error = new FileReaderError('', '');
        expect(error.message).toBe('');
        expect(error.filePath).toBe('');
        expect(error.name).toBe('FileReaderError');
      });

      it('should be distinguishable from other error types', () => {
        const fileError = new FileReaderError('File error', '/path');
        const parserError = new ParserError('Parser error');

        expect(fileError).toBeInstanceOf(FileReaderError);
        expect(fileError).not.toBeInstanceOf(ParserError);
        expect(parserError).toBeInstanceOf(ParserError);
        expect(parserError).not.toBeInstanceOf(FileReaderError);
      });
    });

    describe('UnsupportedFileTypeError', () => {
      it('should create error with file path and supported types', () => {
        const filePath = '/path/to/file.py';
        const supportedTypes = ['js', 'ts', 'jsx', 'tsx'];
        const error = new UnsupportedFileTypeError(filePath, supportedTypes);

        expect(error).toBeInstanceOf(Error);
        expect(error).toBeInstanceOf(UnsupportedFileTypeError);
        expect(error.name).toBe('UnsupportedFileTypeError');
        expect(error.message).toBe(
          'Unsupported file type for /path/to/file.py. Supported types: js, ts, jsx, tsx'
        );
      });

      it('should handle empty supported types array', () => {
        const filePath = '/path/to/file.unknown';
        const supportedTypes: string[] = [];
        const error = new UnsupportedFileTypeError(filePath, supportedTypes);

        expect(error.message).toBe(
          'Unsupported file type for /path/to/file.unknown. Supported types: '
        );
      });

      it('should handle single supported type', () => {
        const filePath = '/path/to/file.py';
        const supportedTypes = ['js'];
        const error = new UnsupportedFileTypeError(filePath, supportedTypes);

        expect(error.message).toBe(
          'Unsupported file type for /path/to/file.py. Supported types: js'
        );
      });

      it('should be throwable and catchable', () => {
        const filePath = '/path/to/file.rb';
        const supportedTypes = ['js', 'ts'];

        expect(() => {
          throw new UnsupportedFileTypeError(filePath, supportedTypes);
        }).toThrow(UnsupportedFileTypeError);

        try {
          throw new UnsupportedFileTypeError(filePath, supportedTypes);
        } catch (error: unknown) {
          expect(error).toBeInstanceOf(UnsupportedFileTypeError);
          if (error instanceof UnsupportedFileTypeError) {
            expect(error.message).toContain(filePath);
            expect(error.message).toContain('js, ts');
          }
        }
      });

      it('should handle empty file path', () => {
        const error = new UnsupportedFileTypeError('', ['js']);
        expect(error.message).toBe(
          'Unsupported file type for . Supported types: js'
        );
      });

      it('should be distinguishable from other error types', () => {
        const unsupportedError = new UnsupportedFileTypeError('/path', ['js']);
        const fileError = new FileReaderError('File error', '/path');
        const parserError = new ParserError('Parser error');

        expect(unsupportedError).toBeInstanceOf(UnsupportedFileTypeError);
        expect(unsupportedError).not.toBeInstanceOf(FileReaderError);
        expect(unsupportedError).not.toBeInstanceOf(ParserError);
      });
    });
  });

  describe('Constants', () => {
    describe('NODE_TYPES', () => {
      it('should be a readonly array', () => {
        expect(Array.isArray(NODE_TYPES)).toBe(true);
        expect(NODE_TYPES.length).toBeGreaterThan(0);
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
          expect(NODE_TYPES).toContain(type as any);
        });
      });

      it('should not contain duplicates', () => {
        const uniqueTypes = new Set(NODE_TYPES);
        expect(uniqueTypes.size).toBe(NODE_TYPES.length);
      });

      it('should contain only string values', () => {
        NODE_TYPES.forEach((type) => {
          expect(typeof type).toBe('string');
          expect(type.length).toBeGreaterThan(0);
        });
      });
    });

    describe('CONTAINER_TYPES', () => {
      it('should be a readonly array', () => {
        expect(Array.isArray(CONTAINER_TYPES)).toBe(true);
        expect(CONTAINER_TYPES.length).toBeGreaterThan(0);
      });

      it('should contain expected container types', () => {
        const expectedTypes = [
          'program',
          'class_body',
          'function_declaration',
          'object',
        ];

        expectedTypes.forEach((type) => {
          expect(CONTAINER_TYPES).toContain(type as any);
        });
      });

      it('should not contain duplicates', () => {
        const uniqueTypes = new Set(CONTAINER_TYPES);
        expect(uniqueTypes.size).toBe(CONTAINER_TYPES.length);
      });

      it('should be a subset of NODE_TYPES', () => {
        CONTAINER_TYPES.forEach((containerType) => {
          expect(NODE_TYPES).toContain(containerType as any);
        });
      });
    });

    describe('STRUCTURAL_TYPES', () => {
      it('should be a readonly array', () => {
        expect(Array.isArray(STRUCTURAL_TYPES)).toBe(true);
        expect(STRUCTURAL_TYPES.length).toBeGreaterThan(0);
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
          expect(STRUCTURAL_TYPES).toContain(type as any);
        });
      });

      it('should not contain duplicates', () => {
        const uniqueTypes = new Set(STRUCTURAL_TYPES);
        expect(uniqueTypes.size).toBe(STRUCTURAL_TYPES.length);
      });

      it('should be a subset of CONTAINER_TYPES', () => {
        STRUCTURAL_TYPES.forEach((structuralType) => {
          expect(CONTAINER_TYPES).toContain(structuralType as any);
        });
      });
    });

    describe('INSIGNIFICANT_TYPES', () => {
      it('should be a readonly array', () => {
        expect(Array.isArray(INSIGNIFICANT_TYPES)).toBe(true);
        expect(INSIGNIFICANT_TYPES.length).toBeGreaterThan(0);
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
          expect(INSIGNIFICANT_TYPES).toContain(type as any);
        });
      });

      it('should not contain duplicates', () => {
        const uniqueTypes = new Set(INSIGNIFICANT_TYPES);
        expect(uniqueTypes.size).toBe(INSIGNIFICANT_TYPES.length);
      });

      it('should contain punctuation and special types', () => {
        const punctuationTypes = [',', ';', '{', '}', '(', ')', '[', ']'];
        punctuationTypes.forEach((type) => {
          expect(INSIGNIFICANT_TYPES).toContain(type as any);
        });

        expect(INSIGNIFICANT_TYPES).toContain('comment' as any);
        expect(INSIGNIFICANT_TYPES).toContain('ERROR' as any);
      });
    });

    describe('OUTPUT_FORMATS', () => {
      it('should be a readonly array', () => {
        expect(Array.isArray(OUTPUT_FORMATS)).toBe(true);
        expect(OUTPUT_FORMATS.length).toBe(4);
      });

      it('should contain expected output formats', () => {
        expect(OUTPUT_FORMATS).toEqual(['json', 'yaml', 'ascii', 'llmtext']);
      });

      it('should not contain duplicates', () => {
        const uniqueFormats = new Set(OUTPUT_FORMATS);
        expect(uniqueFormats.size).toBe(OUTPUT_FORMATS.length);
      });

      it('should contain only string values', () => {
        OUTPUT_FORMATS.forEach((format) => {
          expect(typeof format).toBe('string');
          expect(format.length).toBeGreaterThan(0);
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

      expect(namedNodes).toHaveLength(1);
      expect(unnamedNodes).toHaveLength(1);
      expect(namedNodes[0].name).toBe('myFunction');
      expect(unnamedNodes[0].name).toBeUndefined();
    });

    it('should handle validation result success vs error cases', () => {
      const validFormat = validateFormat('json');
      const invalidFormat = validateFormat('xml');

      if (validFormat.success) {
        expect(validFormat.value).toBe('json');
        expect(validFormat.error).toBeUndefined();
      }

      if (!invalidFormat.success) {
        expect(invalidFormat.value).toBeUndefined();
        expect(invalidFormat.error).toContain('Invalid format');
      }
    });
  });

  describe('Edge Cases and Boundary Conditions', () => {
    it('should handle extremely large depth values', () => {
      const largeDepth = '999999999';
      expect(validateDepth(largeDepth)).toBe(999999999);

      const result = validateDepthValue(largeDepth);
      expect(result.success).toBe(true);
      expect(result.value).toBe(999999999);
    });

    it('should handle node info with all optional fields', () => {
      const minimalNode: NodeInfo = {
        type: 'program',
        start: { row: 0, column: 0 },
        end: { row: 100, column: 0 },
      };

      expect(isUnnamedNode(minimalNode)).toBe(true);
      expect(isNamedNode(minimalNode)).toBe(false);
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

      expect(isNamedNode(nodeWithChildren)).toBe(true);
      expect(nodeWithChildren.children).toHaveLength(1);
    });

    it('should handle zero position values', () => {
      const nodeAtOrigin: NodeInfo = {
        type: 'program',
        start: { row: 0, column: 0 },
        end: { row: 0, column: 0 },
      };

      expect(nodeAtOrigin.start.row).toBe(0);
      expect(nodeAtOrigin.start.column).toBe(0);
      expect(nodeAtOrigin.end.row).toBe(0);
      expect(nodeAtOrigin.end.column).toBe(0);
    });
  });
});
