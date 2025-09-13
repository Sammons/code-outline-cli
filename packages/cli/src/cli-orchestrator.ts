import { CLIArgumentParser, CLIArgumentError } from './cli-argument-parser.js';
import { FileProcessor, FileProcessorError } from './file-processor.js';
import { CLIOutputHandler } from './cli-output-handler.js';

export class CLIOrchestrator {
  private argumentParser: CLIArgumentParser;
  private fileProcessor: FileProcessor;

  constructor() {
    this.argumentParser = new CLIArgumentParser();
    this.fileProcessor = new FileProcessor();
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
      const outputHandler = new CLIOutputHandler(
        options.format,
        options.llmtext
      );
      outputHandler.formatAndOutput(results);
    } catch (error: unknown) {
      if (error instanceof CLIArgumentError) {
        console.error(`Error: ${error.message}`);
        this.argumentParser.printHelp();
        process.exit(1);
      } else if (error instanceof FileProcessorError) {
        console.error(error.message);
        process.exit(1);
      } else {
        throw error; // Re-throw unexpected errors
      }
    }
  }
}
