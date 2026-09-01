import { CLIArgumentParser, CLIArgumentError } from './cli-argument-parser.ts';
import { FileProcessor, FileProcessorError } from './file-processor.ts';
import { CLIOutputHandler } from './cli-output-handler.ts';
import type { OutputFormat } from '@sammons/code-outline-parser';

export class CLIOrchestrator {
  private readonly argumentParser: CLIArgumentParser;
  private readonly fileProcessor: FileProcessor;
  private readonly outputHandlerFactory: (
    format: OutputFormat,
    llmtext?: boolean
  ) => CLIOutputHandler;
  private readonly exit: (code: number) => never;
  private readonly logError: (message: string) => void;

  constructor(
    argumentParser: CLIArgumentParser = new CLIArgumentParser(),
    fileProcessor: FileProcessor = new FileProcessor(),
    outputHandlerFactory: (
      format: OutputFormat,
      llmtext?: boolean
    ) => CLIOutputHandler = (format, llmtext) =>
      new CLIOutputHandler(format, llmtext),
    exit: (code: number) => never = (code) => process.exit(code),
    logError: (message: string) => void = (message) => console.error(message)
  ) {
    this.argumentParser = argumentParser;
    this.fileProcessor = fileProcessor;
    this.outputHandlerFactory = outputHandlerFactory;
    this.exit = exit;
    this.logError = logError;
  }

  public async run(): Promise<void> {
    try {
      // Parse and validate arguments
      const { options, pattern } = this.argumentParser.parse();

      // Find matching files
      const files = await this.fileProcessor.findFiles(pattern);

      // Process files in parallel
      const results = await this.fileProcessor.processFiles(
        files,
        options.depth,
        options.namedOnly
      );

      // Format and output results
      const outputHandler = this.outputHandlerFactory(
        options.format,
        options.llmtext
      );
      outputHandler.formatAndOutput(results);
    } catch (error: unknown) {
      if (error instanceof CLIArgumentError) {
        this.logError(`Error: ${error.message}`);
        this.argumentParser.printHelp();
        this.exit(1);
      } else if (error instanceof FileProcessorError) {
        this.logError(error.message);
        this.exit(1);
      } else {
        throw error; // Re-throw unexpected errors
      }
    }
  }
}
