import type { OutputFormat } from '@sammons/code-outline-parser';
import { Formatter } from '@sammons/code-outline-formatter';
import type { ProcessedFile } from './file-processor.js';

export class CLIOutputHandler {
  private formatter: Formatter;

  constructor(format: OutputFormat) {
    this.formatter = new Formatter(format);
  }

  public formatAndOutput(results: ProcessedFile[]): void {
    const output = this.formatter.format(results);
    console.log(output);
  }
}
