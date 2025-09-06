import type { OutputFormat } from '@code-outline/parser';
import { Formatter } from '@code-outline/formatter';
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
