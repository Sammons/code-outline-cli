import { describe, it, beforeEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import type { ProcessedFile } from './file-processor.ts';
import { CLIArgumentParser, CLIArgumentError } from './cli-argument-parser.ts';
import { FileProcessor, FileProcessorError } from './file-processor.ts';
import { CLIOutputHandler } from './cli-output-handler.ts';
import { Parser } from '@sammons/code-outline-parser';
import type { NodeInfo } from '@sammons/code-outline-parser';

describe('CLIArgumentParser', () => {
  let logMessages: string[];
  let exitCalls: number[];
  let parser: CLIArgumentParser;

  const buildParser = (args: string[]): CLIArgumentParser => {
    logMessages = [];
    exitCalls = [];
    return new CLIArgumentParser(
      () => ['node', 'cli.js', ...args],
      (message: string) => {
        logMessages.push(message);
      }
    );
  };

  beforeEach(() => {
    parser = buildParser([]);
  });

  describe('parse', () => {
    it('should parse valid arguments correctly', () => {
      parser = buildParser(['--format', 'json', '--depth', '5', 'src/**/*.ts']);

      const result = parser.parse();

      assert.strictEqual(result.options.format, 'json');
      assert.strictEqual(result.options.depth, 5);
      assert.strictEqual(result.options.namedOnly, true);
      assert.strictEqual(result.options.llmtext, false);
      assert.strictEqual(result.pattern, 'src/**/*.ts');
    });

    it('should throw CLIArgumentError when no pattern is provided', () => {
      parser = buildParser([]);

      assert.throws(() => parser.parse(), CLIArgumentError);
      assert.throws(() => parser.parse(), /No file pattern provided/);
    });

    it('should handle help flag and exit', () => {
      const originalExit = process.exit;
      process.exit = ((code?: number) => {
        exitCalls.push(code ?? 0);
        throw new Error(`exit(${code})`);
      }) as typeof process.exit;

      try {
        parser = buildParser(['--help', 'test.js']);

        assert.throws(() => parser.parse());

        assert.ok(
          logMessages.some((message) => message.includes('Code Outline CLI'))
        );
        assert.deepStrictEqual(exitCalls, [0]);
      } finally {
        process.exit = originalExit;
      }
    });

    it('should handle version flag and exit', () => {
      const originalExit = process.exit;
      process.exit = ((code?: number) => {
        exitCalls.push(code ?? 0);
        throw new Error(`exit(${code})`);
      }) as typeof process.exit;

      try {
        parser = buildParser(['--version', 'test.js']);

        assert.throws(() => parser.parse());

        assert.ok(logMessages.length > 0);
        assert.deepStrictEqual(exitCalls, [0]);
      } finally {
        process.exit = originalExit;
      }
    });

    it('should handle invalid format', () => {
      parser = buildParser(['--format', 'invalid', 'test.js']);

      assert.throws(() => parser.parse(), CLIArgumentError);
      assert.throws(() => parser.parse(), /Invalid format/);
    });

    it('should handle invalid depth', () => {
      parser = buildParser(['--format', 'json', '--depth', '0', 'test.js']);

      assert.throws(() => parser.parse(), CLIArgumentError);
      assert.throws(() => parser.parse(), /Invalid depth/);
    });

    it('should handle --all flag correctly', () => {
      parser = buildParser(['--format', 'json', '--all', 'test.js']);

      const result = parser.parse();

      assert.strictEqual(result.options.namedOnly, false);
    });

    it('should handle --llmtext flag correctly', () => {
      parser = buildParser(['--format', 'json', '--llmtext', 'test.js']);

      const result = parser.parse();

      assert.strictEqual(result.options.llmtext, true);
      assert.strictEqual(result.options.format, 'llmtext'); // Should override format
    });

    it('should override format when --llmtext flag is provided', () => {
      parser = buildParser(['--format', 'yaml', '--llmtext', 'test.js']);

      const result = parser.parse();

      assert.strictEqual(result.options.llmtext, true);
      assert.strictEqual(result.options.format, 'llmtext'); // Should override original yaml format
    });
  });

  describe('printHelp', () => {
    it('should print help message', () => {
      parser = buildParser([]);

      parser.printHelp();

      assert.ok(
        logMessages.some((message) => message.includes('Code Outline CLI'))
      );
    });
  });

  describe('printVersion', () => {
    it('should print version', () => {
      parser = buildParser([]);

      parser.printVersion();

      assert.ok(logMessages.length > 0);
    });
  });
});

class FakeGlob {
  public calls: Array<{ pattern: string; options: unknown }> = [];
  private result: string[] = [];
  private shouldThrow: Error | null = null;

  public asFunction = async (
    pattern: string,
    options: unknown
  ): Promise<string[]> => {
    this.calls.push({ pattern, options });
    if (this.shouldThrow) {
      throw this.shouldThrow;
    }
    return this.result;
  };

  public mockResolvedValue(files: string[]): void {
    this.result = files;
    this.shouldThrow = null;
  }
}

class FakeParser {
  public parseFile = mock.fn<
    (
      filePath: string,
      maxDepth?: number,
      namedOnly?: boolean
    ) => Promise<NodeInfo | null>
  >(async () => null);
}

describe('FileProcessor', () => {
  let fakeGlob: FakeGlob;
  let processor: FileProcessor;

  beforeEach(() => {
    fakeGlob = new FakeGlob();
    processor = new FileProcessor(
      new Parser(),
      fakeGlob.asFunction as unknown as ConstructorParameters<
        typeof FileProcessor
      >[1]
    );
  });

  describe('findFiles', () => {
    it('should find files matching pattern', async () => {
      const files = ['/path/to/file1.js', '/path/to/file2.ts'];
      fakeGlob.mockResolvedValue(files);

      const result = await processor.findFiles('src/**/*.{js,ts}');

      assert.deepStrictEqual(fakeGlob.calls[0]?.pattern, 'src/**/*.{js,ts}');
      assert.deepStrictEqual(fakeGlob.calls[0]?.options, {
        absolute: true,
        ignore: ['**/node_modules/**', '**/dist/**', '**/build/**'],
      });
      assert.deepStrictEqual(result, files);
    });

    it('should throw FileProcessorError when no files found', async () => {
      fakeGlob.mockResolvedValue([]);

      await assert.rejects(
        () => processor.findFiles('nonexistent/**/*.js'),
        FileProcessorError
      );
      await assert.rejects(
        () => processor.findFiles('nonexistent/**/*.js'),
        /No files found matching pattern/
      );
    });
  });

  describe('processFiles', () => {
    let fakeParser: FakeParser;
    let errorMessages: unknown[][];
    let originalConsoleError: typeof console.error;

    beforeEach(() => {
      fakeParser = new FakeParser();
      processor = new FileProcessor(
        fakeParser as unknown as ConstructorParameters<typeof FileProcessor>[0],
        fakeGlob.asFunction as unknown as ConstructorParameters<
          typeof FileProcessor
        >[1]
      );
      errorMessages = [];
      originalConsoleError = console.error;
      console.error = (...args: unknown[]) => {
        errorMessages.push(args);
      };
    });

    it('should process multiple files successfully', async () => {
      const files = ['/path/file1.js', '/path/file2.js'];
      const mockOutline: NodeInfo = {
        type: 'program',
        start: { row: 0, column: 0 },
        end: { row: 0, column: 0 },
        children: [],
      };

      fakeParser.parseFile.mock.mockImplementation(async () => mockOutline);

      try {
        const result = await processor.processFiles(files, 5, true);

        assert.strictEqual(result.length, 2);
        assert.deepStrictEqual(result[0], {
          file: files[0],
          outline: mockOutline,
        });
        assert.deepStrictEqual(result[1], {
          file: files[1],
          outline: mockOutline,
        });
        assert.strictEqual(fakeParser.parseFile.mock.calls.length, 2);
      } finally {
        console.error = originalConsoleError;
      }
    });

    it('should handle parsing errors gracefully', async () => {
      const files = ['/path/file1.js', '/path/file2.js'];
      let callCount = 0;

      fakeParser.parseFile.mock.mockImplementation(async () => {
        callCount += 1;
        if (callCount === 1) {
          return {
            type: 'program',
            start: { row: 0, column: 0 },
            end: { row: 0, column: 0 },
            children: [],
          };
        }
        throw new Error('Parse error');
      });

      try {
        const result: ProcessedFile[] = await processor.processFiles(
          files,
          5,
          true
        );

        assert.strictEqual(result.length, 2);
        assert.ok(result[0]?.outline);
        assert.strictEqual(result[1]?.outline, null);
        assert.ok(
          errorMessages.some(
            (call) =>
              typeof call[0] === 'string' && call[0].includes('Error parsing')
          )
        );
      } finally {
        console.error = originalConsoleError;
      }
    });

    it('should process files with correct parameters', async () => {
      const files = ['/path/file1.js'];
      const depth = 3;
      const namedOnly = false;

      fakeParser.parseFile.mock.mockImplementation(async () => ({
        type: 'program',
        start: { row: 0, column: 0 },
        end: { row: 0, column: 0 },
      }));

      try {
        await processor.processFiles(files, depth, namedOnly);

        assert.deepStrictEqual(fakeParser.parseFile.mock.calls[0]?.arguments, [
          '/path/file1.js',
          depth,
          namedOnly,
        ]);
      } finally {
        console.error = originalConsoleError;
      }
    });
  });
});

describe('CLIOutputHandler', () => {
  const sampleResults: ProcessedFile[] = [
    {
      file: '/path/file1.js',
      outline: {
        type: 'program',
        start: { row: 0, column: 0 },
        end: { row: 10, column: 0 },
      },
    },
  ];

  // Assert on what each format actually emits rather than merely that the
  // constructor does not throw: a bug that swapped or dropped the format
  // argument would still construct fine, and go undetected.
  it('emits YAML when constructed with the yaml format', () => {
    const logged: string[] = [];
    new CLIOutputHandler('yaml', false, (message) => {
      logged.push(message);
    }).formatAndOutput(sampleResults);

    assert.strictEqual(logged.length, 1);
    assert.match(logged[0]!, /^- file: /);
    assert.ok(!logged[0]!.startsWith('['), 'must not be JSON');
  });

  it('emits llmtext when constructed with the llmtext flag', () => {
    const logged: string[] = [];
    new CLIOutputHandler('llmtext', true, (message) => {
      logged.push(message);
    }).formatAndOutput(sampleResults);

    assert.strictEqual(logged.length, 1);
    assert.ok(
      logged[0]!.includes('<Outline>'),
      `expected llmtext output, got ${logged[0]!.slice(0, 60)}`
    );
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
      const logged: string[] = [];
      const handler = new CLIOutputHandler('json', false, (message) => {
        logged.push(message);
      });

      handler.formatAndOutput(results);

      assert.strictEqual(logged.length, 1);
      const parsed: unknown = JSON.parse(logged[0] ?? '');
      assert.ok(Array.isArray(parsed));
      assert.strictEqual((parsed as unknown[]).length, 2);
    });

    it('should handle empty results', () => {
      const results: ProcessedFile[] = [];
      const logged: string[] = [];
      const handler = new CLIOutputHandler('json', false, (message) => {
        logged.push(message);
      });

      handler.formatAndOutput(results);

      assert.strictEqual(logged.length, 1);
      const parsed: unknown = JSON.parse(logged[0] ?? '');
      assert.deepStrictEqual(parsed, []);
    });
  });
});
