import { resolve } from 'node:path';
import fg from 'fast-glob';
import type { NodeInfo } from '@sammons/code-outline-parser';
import { Parser } from '@sammons/code-outline-parser';

export interface ProcessedFile {
  file: string;
  outline: NodeInfo | null;
}

export class FileProcessorError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FileProcessorError';
  }
}

export class FileProcessor {
  private parser: Parser;

  constructor() {
    this.parser = new Parser();
  }

  public async findFiles(pattern: string): Promise<string[]> {
    const files = await fg(pattern, {
      absolute: true,
      ignore: ['**/node_modules/**', '**/dist/**', '**/build/**'],
    });

    if (files.length === 0) {
      throw new FileProcessorError(
        `No files found matching pattern: ${pattern}`
      );
    }

    return files;
  }

  private async parseFile(
    file: string,
    depth: number,
    namedOnly: boolean
  ): Promise<ProcessedFile> {
    try {
      const outline = await this.parser.parseFile(file, depth, namedOnly);
      return {
        file: resolve(file),
        outline,
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      console.error(`Error parsing ${file}:`, errorMessage);
      return {
        file: resolve(file),
        outline: null,
      };
    }
  }

  public async processFiles(
    files: string[],
    depth: number,
    namedOnly: boolean
  ): Promise<ProcessedFile[]> {
    // Process files in parallel using Promise.all
    const parsePromises = files.map((file) =>
      this.parseFile(file, depth, namedOnly)
    );

    return await Promise.all(parsePromises);
  }
}
