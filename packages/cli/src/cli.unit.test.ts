import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { parseArgs } from 'node:util';
import fg from 'fast-glob';
import { resolve } from 'node:path';
import {
  Parser,
  validateFormat,
  validateDepthValue,
} from '@sammons/code-outline-parser';
import { Formatter } from '@sammons/code-outline-formatter';
import type { ProcessedFile } from './file-processor';

// Mock external dependencies
vi.mock('node:util');
vi.mock('fast-glob');
vi.mock('node:path');
vi.mock('@sammons/code-outline-parser');
vi.mock('@sammons/code-outline-formatter');

const mockParseArgs = vi.mocked(parseArgs);
const mockFg = vi.mocked(fg);
const mockResolve = vi.mocked(resolve);
const mockParser = vi.mocked(Parser);
const mockFormatter = vi.mocked(Formatter);
const mockValidateFormat = vi.mocked(validateFormat);
const mockValidateDepthValue = vi.mocked(validateDepthValue);

// Mock console methods - but don't implement them at the top level
let mockConsoleLog: ReturnType<typeof vi.spyOn>;
let mockConsoleError: ReturnType<typeof vi.spyOn>;

// Import the actual classes for testing
import { CLIArgumentParser, CLIArgumentError } from './cli-argument-parser.js';
import { FileProcessor, FileProcessorError } from './file-processor.js';
import { CLIOutputHandler } from './cli-output-handler.js';

describe('CLIArgumentParser', () => {
  let parser: CLIArgumentParser;

  beforeEach(() => {
    parser = new CLIArgumentParser();
    vi.clearAllMocks();

    // Mock console methods freshly each time
    mockConsoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});
    mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Mock process.exit to prevent actual exits during tests
    vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('parse', () => {
    it('should parse valid arguments correctly', () => {
      mockParseArgs.mockReturnValue({
        values: {
          format: 'json',
          depth: '5',
          'named-only': true,
          all: false,
          help: false,
          version: false,
        },
        positionals: ['src/**/*.ts'],
      });

      // Mock validation functions to return successful results
      mockValidateFormat.mockReturnValue({
        success: true,
        value: 'json' as any,
      });
      mockValidateDepthValue.mockReturnValue({ success: true, value: 5 });

      const result = parser.parse();

      expect(result.options.format).toBe('json');
      expect(result.options.depth).toBe(5);
      expect(result.options.namedOnly).toBe(true);
      expect(result.pattern).toBe('src/**/*.ts');
    });

    it('should throw CLIArgumentError when no pattern is provided', () => {
      mockParseArgs.mockReturnValue({
        values: {
          format: 'ascii',
          depth: 'Infinity',
          'named-only': true,
          all: false,
          help: false,
          version: false,
        },
        positionals: [],
      });

      expect(() => parser.parse()).toThrow(CLIArgumentError);
      expect(() => parser.parse()).toThrow('No file pattern provided');
    });

    it('should handle help flag and exit', () => {
      mockParseArgs.mockReturnValue({
        values: {
          format: 'ascii',
          depth: 'Infinity',
          'named-only': true,
          all: false,
          help: true,
          version: false,
        },
        positionals: ['test.js'],
      });

      // Mock validation functions even though they won't be called due to early exit
      mockValidateFormat.mockReturnValue({
        success: true,
        value: 'ascii' as any,
      });
      mockValidateDepthValue.mockReturnValue({
        success: true,
        value: Infinity,
      });

      parser.parse();

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('glance-with-tree-sitter')
      );

      expect(process.exit).toHaveBeenCalledWith(0);
    });

    it('should handle version flag and exit', () => {
      mockParseArgs.mockReturnValue({
        values: {
          format: 'ascii',
          depth: 'Infinity',
          'named-only': true,
          all: false,
          help: false,
          version: true,
        },
        positionals: ['test.js'],
      });

      // Mock validation functions even though they won't be called due to early exit
      mockValidateFormat.mockReturnValue({
        success: true,
        value: 'ascii' as any,
      });
      mockValidateDepthValue.mockReturnValue({
        success: true,
        value: Infinity,
      });

      parser.parse();

      expect(mockConsoleLog).toHaveBeenCalled();

      expect(process.exit).toHaveBeenCalledWith(0);
    });

    it('should handle invalid format', () => {
      mockParseArgs.mockReturnValue({
        values: {
          format: 'invalid',
          depth: 'Infinity',
          'named-only': true,
          all: false,
          help: false,
          version: false,
        },
        positionals: ['test.js'],
      });

      // Mock validation to return error
      mockValidateFormat.mockReturnValue({
        success: false,
        error: 'Invalid format type',
      });
      mockValidateDepthValue.mockReturnValue({
        success: true,
        value: Infinity,
      });

      expect(() => parser.parse()).toThrow(CLIArgumentError);
      expect(() => parser.parse()).toThrow('Invalid format');
    });

    it('should handle invalid depth', () => {
      mockParseArgs.mockReturnValue({
        values: {
          format: 'json',
          depth: '0',
          'named-only': true,
          all: false,
          help: false,
          version: false,
        },
        positionals: ['test.js'],
      });

      // Mock validation to return error
      mockValidateFormat.mockReturnValue({
        success: true,
        value: 'json' as any,
      });
      mockValidateDepthValue.mockReturnValue({
        success: false,
        error: 'Depth must be >= 1',
      });

      expect(() => parser.parse()).toThrow(CLIArgumentError);
      expect(() => parser.parse()).toThrow('Invalid depth');
    });

    it('should handle --all flag correctly', () => {
      mockParseArgs.mockReturnValue({
        values: {
          format: 'json',
          depth: 'Infinity',
          'named-only': true,
          all: true,
          help: false,
          version: false,
        },
        positionals: ['test.js'],
      });

      mockValidateFormat.mockReturnValue({
        success: true,
        value: 'json' as any,
      });
      mockValidateDepthValue.mockReturnValue({
        success: true,
        value: Infinity,
      });

      const result = parser.parse();

      expect(result.options.namedOnly).toBe(false);
    });
  });

  describe('printHelp', () => {
    it('should print help message', () => {
      parser.printHelp();

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('glance-with-tree-sitter')
      );
    });
  });

  describe('printVersion', () => {
    it('should print version', () => {
      parser.printVersion();

      expect(mockConsoleLog).toHaveBeenCalled();
    });
  });
});

describe('FileProcessor', () => {
  let processor: FileProcessor;
  let mockParserInstance: {
    parseFile: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockParserInstance = {
      parseFile: vi.fn(),
    };
    mockParser.mockImplementation(() => mockParserInstance as any);

    processor = new FileProcessor();
    vi.clearAllMocks();

    // Mock console methods freshly each time
    mockConsoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});
    mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('findFiles', () => {
    it('should find files matching pattern', async () => {
      const files = ['/path/to/file1.js', '/path/to/file2.ts'];
      mockFg.mockResolvedValue(files);

      const result = await processor.findFiles('src/**/*.{js,ts}');

      expect(mockFg).toHaveBeenCalledWith('src/**/*.{js,ts}', {
        absolute: true,
        ignore: ['**/node_modules/**', '**/dist/**', '**/build/**'],
      });
      expect(result).toEqual(files);
    });

    it('should throw FileProcessorError when no files found', async () => {
      mockFg.mockResolvedValue([]);

      await expect(processor.findFiles('nonexistent/**/*.js')).rejects.toThrow(
        FileProcessorError
      );
      await expect(processor.findFiles('nonexistent/**/*.js')).rejects.toThrow(
        'No files found matching pattern'
      );
    });
  });

  describe('processFiles', () => {
    it('should process multiple files successfully', async () => {
      const files = ['/path/file1.js', '/path/file2.js'];
      const mockOutline = { type: 'program', children: [] };

      mockParserInstance.parseFile.mockResolvedValue(mockOutline);
      mockResolve.mockImplementation((path) => `/resolved${path}`);

      const result = await processor.processFiles(files, 5, true);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        file: '/resolved/path/file1.js',
        outline: mockOutline,
      });
      expect(result[1]).toEqual({
        file: '/resolved/path/file2.js',
        outline: mockOutline,
      });
      expect(mockParserInstance.parseFile).toHaveBeenCalledTimes(2);
    });

    it('should handle parsing errors gracefully', async () => {
      const files = ['/path/file1.js', '/path/file2.js'];

      mockParserInstance.parseFile
        .mockResolvedValueOnce({ type: 'program', children: [] })
        .mockRejectedValueOnce(new Error('Parse error'));

      mockResolve.mockImplementation((path) => `/resolved${path}`);

      const result = await processor.processFiles(files, 5, true);

      expect(result).toHaveLength(2);
      expect(result[0].outline).toBeTruthy();
      expect(result[1].outline).toBeNull();
      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('Error parsing'),
        expect.stringMatching(/Parse error|Unknown error occurred/)
      );
    });

    it('should process files with correct parameters', async () => {
      const files = ['/path/file1.js'];
      const depth = 3;
      const namedOnly = false;

      mockParserInstance.parseFile.mockResolvedValue({ type: 'program' });
      mockResolve.mockReturnValue('/resolved/path/file1.js');

      await processor.processFiles(files, depth, namedOnly);

      expect(mockParserInstance.parseFile).toHaveBeenCalledWith(
        '/path/file1.js',
        depth,
        namedOnly
      );
    });
  });
});

describe('CLIOutputHandler', () => {
  let handler: CLIOutputHandler;
  let mockFormatterInstance: {
    format: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockFormatterInstance = {
      format: vi.fn(),
    };
    mockFormatter.mockImplementation(() => mockFormatterInstance as any);

    handler = new CLIOutputHandler('json' as any);
    vi.clearAllMocks();

    // Mock console methods freshly each time
    mockConsoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});
    mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('constructor', () => {
    it('should create formatter with correct format', () => {
      new CLIOutputHandler('yaml' as any);

      expect(mockFormatter).toHaveBeenCalledWith('yaml');
    });
  });

  describe('formatAndOutput', () => {
    it('should format results and output to console', () => {
      const results: ProcessedFile[] = [
        {
          file: '/path/file1.js',
          outline: {
            type: 'program',
            start: { row: 0, column: 0 },
            end: { row: 10, column: 0 },
          },
        },
        {
          file: '/path/file2.js',
          outline: {
            type: 'program',
            start: { row: 0, column: 0 },
            end: { row: 20, column: 0 },
          },
        },
      ];
      const formattedOutput = '{"formatted": "output"}';

      mockFormatterInstance.format.mockReturnValue(formattedOutput);

      handler.formatAndOutput(results);

      expect(mockFormatterInstance.format).toHaveBeenCalledWith(results);
      expect(mockConsoleLog).toHaveBeenCalledWith(formattedOutput);
    });

    it('should handle empty results', () => {
      const results: ProcessedFile[] = [];
      const formattedOutput = '[]';

      mockFormatterInstance.format.mockReturnValue(formattedOutput);

      handler.formatAndOutput(results);

      expect(mockFormatterInstance.format).toHaveBeenCalledWith(results);
      expect(mockConsoleLog).toHaveBeenCalledWith(formattedOutput);
    });
  });
});
