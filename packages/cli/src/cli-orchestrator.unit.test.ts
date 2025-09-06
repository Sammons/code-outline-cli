import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the CLI components before importing
vi.mock('./cli-argument-parser.js', () => ({
  CLIArgumentParser: vi.fn(),
  CLIArgumentError: class extends Error {
    name = 'CLIArgumentError';
  },
}));

vi.mock('./file-processor.js', () => ({
  FileProcessor: vi.fn(),
  FileProcessorError: class extends Error {
    name = 'FileProcessorError';
  },
}));

vi.mock('./cli-output-handler.js', () => ({
  CLIOutputHandler: vi.fn(),
}));

// Mock console methods
const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

// Import after mocking
import { CLIOrchestrator } from './cli-orchestrator.js';
import { CLIArgumentParser, CLIArgumentError } from './cli-argument-parser.js';
import { FileProcessor, FileProcessorError } from './file-processor.js';
import { CLIOutputHandler } from './cli-output-handler.js';

describe('CLIOrchestrator', () => {
  let orchestrator: CLIOrchestrator;
  let mockArgumentParser: {
    parse: ReturnType<typeof vi.fn>;
    printHelp: ReturnType<typeof vi.fn>;
  };
  let mockFileProcessor: {
    findFiles: ReturnType<typeof vi.fn>;
    processFiles: ReturnType<typeof vi.fn>;
  };
  let mockOutputHandler: {
    formatAndOutput: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    // Create mock instances
    mockArgumentParser = {
      parse: vi.fn(),
      printHelp: vi.fn(),
    };
    mockFileProcessor = {
      findFiles: vi.fn(),
      processFiles: vi.fn(),
    };
    mockOutputHandler = {
      formatAndOutput: vi.fn(),
    };

    // Mock the constructors to return our mocked instances
    vi.mocked(CLIArgumentParser).mockImplementation(() => mockArgumentParser as any);
    vi.mocked(FileProcessor).mockImplementation(() => mockFileProcessor as any);
    vi.mocked(CLIOutputHandler).mockImplementation(() => mockOutputHandler as any);

    orchestrator = new CLIOrchestrator();
    vi.clearAllMocks();
    
    // Mock process.exit
    vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
  });

  describe('run', () => {
    it('should orchestrate the entire CLI flow successfully', async () => {
      const mockOptions = {
        format: 'json' as const,
        depth: 5,
        namedOnly: true,
        help: false,
        version: false,
      };
      const mockPattern = 'src/**/*.ts';
      const mockFiles = ['/path/file1.ts', '/path/file2.ts'];
      const mockResults = [
        { file: '/path/file1.ts', outline: { type: 'program' } },
        { file: '/path/file2.ts', outline: { type: 'program' } },
      ];

      mockArgumentParser.parse.mockReturnValue({
        options: mockOptions,
        pattern: mockPattern,
      });
      mockFileProcessor.findFiles.mockResolvedValue(mockFiles);
      mockFileProcessor.processFiles.mockResolvedValue(mockResults);

      await orchestrator.run();

      expect(mockArgumentParser.parse).toHaveBeenCalled();
      expect(mockFileProcessor.findFiles).toHaveBeenCalledWith(mockPattern);
      expect(mockFileProcessor.processFiles).toHaveBeenCalledWith(
        mockFiles,
        mockOptions.depth,
        mockOptions.namedOnly
      );
      expect(CLIOutputHandler).toHaveBeenCalledWith(mockOptions.format);
      expect(mockOutputHandler.formatAndOutput).toHaveBeenCalledWith(mockResults);
    });

    it('should handle CLIArgumentError', async () => {
      mockArgumentParser.parse.mockImplementation(() => {
        throw new CLIArgumentError('Invalid arguments');
      });

      await orchestrator.run();

      expect(mockConsoleError).toHaveBeenCalledWith('Error: Invalid arguments');
      expect(mockArgumentParser.printHelp).toHaveBeenCalled();
      expect(process.exit).toHaveBeenCalledWith(1);
    });

    it('should handle FileProcessorError', async () => {
      mockArgumentParser.parse.mockReturnValue({
        options: {
          format: 'json' as const,
          depth: 5,
          namedOnly: true,
          help: false,
          version: false,
        },
        pattern: 'invalid/**/*.js',
      });

      mockFileProcessor.findFiles.mockImplementation(() => {
        throw new FileProcessorError('No files found');
      });

      await orchestrator.run();

      expect(mockConsoleError).toHaveBeenCalledWith('No files found');
      expect(process.exit).toHaveBeenCalledWith(1);
    });

    it('should re-throw unexpected errors', async () => {
      const unexpectedError = new Error('Unexpected error');
      
      mockArgumentParser.parse.mockImplementation(() => {
        throw unexpectedError;
      });

      await expect(orchestrator.run()).rejects.toThrow('Unexpected error');
    });

    it('should handle async file processing errors', async () => {
      mockArgumentParser.parse.mockReturnValue({
        options: {
          format: 'json' as const,
          depth: 5,
          namedOnly: true,
          help: false,
          version: false,
        },
        pattern: 'src/**/*.js',
      });
      
      mockFileProcessor.findFiles.mockResolvedValue(['/path/file1.js']);
      mockFileProcessor.processFiles.mockImplementation(() => {
        throw new FileProcessorError('Processing failed');
      });

      await orchestrator.run();

      expect(mockConsoleError).toHaveBeenCalledWith('Processing failed');
      expect(process.exit).toHaveBeenCalledWith(1);
    });
  });
});