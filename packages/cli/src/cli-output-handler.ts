import type { OutputFormat } from '@sammons/code-outline-parser';
import { Formatter } from '@sammons/code-outline-formatter';
import type { ProcessedFile } from './file-processor.ts';

export class CLIOutputHandler {
  private readonly formatter: Formatter;
  private readonly log: (message: string) => void;

  constructor(
    format: OutputFormat,
    llmtext?: boolean,
    log: (message: string) => void = (message) => console.log(message)
  ) {
    this.formatter = new Formatter(format, llmtext);
    this.log = log;
  }

  public formatAndOutput(results: ProcessedFile[]): void {
    const output = this.formatter.format(results);
    this.log(output);
  }
}
