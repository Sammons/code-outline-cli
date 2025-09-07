// Main orchestrator for programmatic usage
export { CLIOrchestrator } from './cli-orchestrator';

// Individual components
export { CLIArgumentParser } from './cli-argument-parser';
export { FileProcessor } from './file-processor';
export { CLIOutputHandler } from './cli-output-handler';

// Convenience function for simple usage
export async function parseFiles(
  patterns: string | string[],
  options?: {
    format?: 'ascii' | 'json' | 'yaml';
    depth?: number;
    namedOnly?: boolean;
    output?: string;
  }
): Promise<string> {
  const { FileProcessor } = await import('./file-processor');

  const fileProcessor = new FileProcessor();
  const patternArray = Array.isArray(patterns) ? patterns : [patterns];

  // Find matching files for all patterns
  const allFiles = [];
  for (const pattern of patternArray) {
    const files = await fileProcessor.findFiles(pattern);
    allFiles.push(...files);
  }

  // Remove duplicates
  const uniqueFiles = [...new Set(allFiles)];

  // Process files
  const results = await fileProcessor.processFiles(
    uniqueFiles,
    options?.depth ?? 10, // Default depth
    options?.namedOnly ?? false
  );

  // Format output
  const { Formatter } = await import('@sammons/code-outline-formatter');
  const formatter = new Formatter(options?.format ?? 'ascii');

  const output = formatter.format(results);

  if (options?.output) {
    const fs = await import('fs');
    await fs.promises.writeFile(options.output, output, 'utf-8');
    return `Results written to ${options.output}`;
  } else {
    return output;
  }
}
