import { describe, it, beforeEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import { CLIOrchestrator } from './cli-orchestrator.ts';
import { CLIArgumentError } from './cli-argument-parser.ts';
import { FileProcessorError } from './file-processor.ts';
import type { CLIOutputHandler } from './cli-output-handler.ts';
import type { ParsedArgs } from './cli-argument-parser.ts';
import type { ProcessedFile } from './file-processor.ts';

class FakeArgumentParser {
  public parse = mock.fn<() => ParsedArgs>(() => {
    throw new Error('parse not stubbed');
  });
  public printHelp = mock.fn(() => {});
  public printVersion = mock.fn(() => {});
}

class FakeFileProcessor {
  public findFiles = mock.fn<(pattern: string) => Promise<string[]>>(
    async () => []
  );
  public processFiles = mock.fn<
    (
      files: string[],
      depth: number,
      namedOnly: boolean
    ) => Promise<ProcessedFile[]>
  >(async () => []);
}

class FakeOutputHandler {
  public formatAndOutput = mock.fn((_results: ProcessedFile[]) => {});
}

describe('CLIOrchestrator', () => {
  let fakeArgumentParser: FakeArgumentParser;
  let fakeFileProcessor: FakeFileProcessor;
  let fakeOutputHandler: FakeOutputHandler;
  let outputHandlerFactoryCalls: Array<{ format: string; llmtext?: boolean }>;
  let exitCalls: number[];
  let errorMessages: string[];
  let orchestrator: CLIOrchestrator;

  beforeEach(() => {
    fakeArgumentParser = new FakeArgumentParser();
    fakeFileProcessor = new FakeFileProcessor();
    fakeOutputHandler = new FakeOutputHandler();
    outputHandlerFactoryCalls = [];
    exitCalls = [];
    errorMessages = [];

    orchestrator = new CLIOrchestrator(
      fakeArgumentParser as unknown as ConstructorParameters<
        typeof CLIOrchestrator
      >[0],
      fakeFileProcessor as unknown as ConstructorParameters<
        typeof CLIOrchestrator
      >[1],
      (format, llmtext) => {
        outputHandlerFactoryCalls.push({ format, llmtext });
        return fakeOutputHandler as unknown as CLIOutputHandler;
      },
      ((code: number) => {
        exitCalls.push(code);
      }) as (code: number) => never,
      (message: string) => {
        errorMessages.push(message);
      }
    );
  });

  describe('run', () => {
    it('should orchestrate the entire CLI flow successfully', async () => {
      const mockOptions = {
        format: 'json' as const,
        depth: 5,
        namedOnly: true,
        llmtext: false,
        help: false,
        version: false,
      };
      const mockPattern = 'src/**/*.ts';
      const mockFiles = ['/path/file1.ts', '/path/file2.ts'];
      const mockResults: ProcessedFile[] = [
        {
          file: '/path/file1.ts',
          outline: {
            type: 'program',
            start: { row: 0, column: 0 },
            end: { row: 0, column: 0 },
          },
        },
        {
          file: '/path/file2.ts',
          outline: {
            type: 'program',
            start: { row: 0, column: 0 },
            end: { row: 0, column: 0 },
          },
        },
      ];

      fakeArgumentParser.parse.mock.mockImplementation(() => ({
        options: mockOptions,
        pattern: mockPattern,
      }));
      fakeFileProcessor.findFiles.mock.mockImplementation(
        async () => mockFiles
      );
      fakeFileProcessor.processFiles.mock.mockImplementation(
        async () => mockResults
      );

      await orchestrator.run();

      assert.strictEqual(fakeArgumentParser.parse.mock.calls.length, 1);
      assert.deepStrictEqual(
        fakeFileProcessor.findFiles.mock.calls[0]?.arguments,
        [mockPattern]
      );
      assert.deepStrictEqual(
        fakeFileProcessor.processFiles.mock.calls[0]?.arguments,
        [mockFiles, mockOptions.depth, mockOptions.namedOnly]
      );
      assert.deepStrictEqual(outputHandlerFactoryCalls, [
        { format: mockOptions.format, llmtext: mockOptions.llmtext },
      ]);
      assert.deepStrictEqual(
        fakeOutputHandler.formatAndOutput.mock.calls[0]?.arguments,
        [mockResults]
      );
    });

    it('should handle CLIArgumentError', async () => {
      fakeArgumentParser.parse.mock.mockImplementation(() => {
        throw new CLIArgumentError('Invalid arguments');
      });

      await orchestrator.run();

      assert.deepStrictEqual(errorMessages, ['Error: Invalid arguments']);
      assert.strictEqual(fakeArgumentParser.printHelp.mock.calls.length, 1);
      assert.deepStrictEqual(exitCalls, [1]);
    });

    it('should handle FileProcessorError', async () => {
      fakeArgumentParser.parse.mock.mockImplementation(() => ({
        options: {
          format: 'json' as const,
          depth: 5,
          namedOnly: true,
          llmtext: false,
          help: false,
          version: false,
        },
        pattern: 'invalid/**/*.js',
      }));

      fakeFileProcessor.findFiles.mock.mockImplementation(() => {
        throw new FileProcessorError('No files found');
      });

      await orchestrator.run();

      assert.deepStrictEqual(errorMessages, ['No files found']);
      assert.deepStrictEqual(exitCalls, [1]);
    });

    it('should re-throw unexpected errors', async () => {
      const unexpectedError = new Error('Unexpected error');

      fakeArgumentParser.parse.mock.mockImplementation(() => {
        throw unexpectedError;
      });

      await assert.rejects(() => orchestrator.run(), /Unexpected error/);
    });

    it('should handle async file processing errors', async () => {
      fakeArgumentParser.parse.mock.mockImplementation(() => ({
        options: {
          format: 'json' as const,
          depth: 5,
          namedOnly: true,
          llmtext: false,
          help: false,
          version: false,
        },
        pattern: 'src/**/*.js',
      }));

      fakeFileProcessor.findFiles.mock.mockImplementation(async () => [
        '/path/file1.js',
      ]);
      fakeFileProcessor.processFiles.mock.mockImplementation(() => {
        throw new FileProcessorError('Processing failed');
      });

      await orchestrator.run();

      assert.deepStrictEqual(errorMessages, ['Processing failed']);
      assert.deepStrictEqual(exitCalls, [1]);
    });
  });
});
