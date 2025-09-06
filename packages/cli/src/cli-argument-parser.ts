import { parseArgs } from 'node:util';
import { isAbsolute } from 'node:path';
import { existsSync } from 'node:fs';
import type { OutputFormat } from '@code-outline/parser';
import { validateFormat, validateDepthValue } from '@code-outline/parser';
import { version } from '../package.json';

export interface CliOptions {
  format: OutputFormat;
  depth: number;
  namedOnly: boolean;
  help: boolean;
  version: boolean;
}

export interface ParsedArgs {
  options: CliOptions;
  pattern: string;
}

export class CLIArgumentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CLIArgumentError';
  }
}

export class CLIArgumentParser {
  // Type guard to safely extract unknown values from parseArgs result
  private safeExtractValue<T>(value: unknown, defaultValue: T): T {
    // Use proper type narrowing instead of type assertions
    if (typeof defaultValue === 'boolean') {
      return typeof value === 'boolean' ? (value as T) : defaultValue;
    }
    if (typeof defaultValue === 'string') {
      return typeof value === 'string' ? (value as T) : defaultValue;
    }
    // Return default for all other cases
    return defaultValue;
  }

  // Safe validation helper using proper type narrowing
  private validateAndThrow<T>(
    validation: { success: boolean; value?: T; error?: string },
    errorPrefix: string
  ): T {
    if (!validation.success || validation.value === undefined) {
      throw new CLIArgumentError(
        `${errorPrefix}: ${validation.error ?? 'validation failed'}`
      );
    }
    // TypeScript now knows validation.value is T (not T | undefined)
    return validation.value;
  }

  public printHelp(): void {
    console.log(`
🌳 Code Outline CLI - Parse and analyze JavaScript/TypeScript files

Usage:
  code-outline <pattern> [options]

Arguments:
  <pattern>        Glob pattern to match files (e.g., "src/**/*.ts", "*.js")

Options:
  -f, --format <type>    Output format: ascii, json, or yaml (default: ascii)
  -d, --depth <n>        Maximum AST depth to traverse (default: Infinity)
  -a, --all              Show all nodes, including unnamed ones
      --named-only       Show only named entities (default: true)
  -h, --help             Show this help message
  -v, --version          Show version number

Output Formats:
  ascii    Tree-like visualization with color-coded syntax (default)
  json     Structured JSON output for programmatic processing
  yaml     Human-readable YAML format

Examples:
  # Parse all TypeScript files in src directory
  code-outline "src/**/*.ts"

  # Output JSON with depth limit
  code-outline "*.js" --format json --depth 3

  # Parse React components with all nodes
  code-outline "src/components/**/*.tsx" --all

  # Generate YAML report
  code-outline "src/**/*.ts" --format yaml --depth 2

Supported Files:
  .js      JavaScript files
  .ts      TypeScript files  
  .tsx     TypeScript JSX files

For more information, visit: https://github.com/sammons-software-llc/glance-with-tree-sitter
`);
  }

  public printVersion(): void {
    console.log(version);
  }

  public parse(): ParsedArgs {
    const { values, positionals } = parseArgs({
      options: {
        format: {
          type: 'string',
          default: 'ascii',
        },
        depth: {
          type: 'string',
          default: 'Infinity',
        },
        'named-only': {
          type: 'boolean',
          default: true,
        },
        all: {
          type: 'boolean',
          default: false,
        },
        help: {
          type: 'boolean',
          short: 'h',
          default: false,
        },
        version: {
          type: 'boolean',
          short: 'v',
          default: false,
        },
      },
      allowPositionals: true,
    });

    if (values.help) {
      this.printHelp();
      process.exit(0);
    }

    if (values.version) {
      this.printVersion();
      process.exit(0);
    }

    if (positionals.length === 0) {
      throw new CLIArgumentError('No file pattern provided');
    }

    // Safely validate format using type guard
    const formatValidation = validateFormat(values.format);
    const format = this.validateAndThrow(formatValidation, 'Invalid format');

    // Safely validate depth using validator
    const depthValidation = validateDepthValue(values.depth);
    const depth = this.validateAndThrow(depthValidation, 'Invalid depth');

    const namedOnly = values.all
      ? false
      : this.safeExtractValue(values['named-only'], true);

    const pattern = positionals[0];

    // Warn if the pattern doesn't contain glob characters but looks like it should
    if (
      !pattern.includes('*') &&
      !pattern.includes('?') &&
      !pattern.includes('[')
    ) {
      // Check if it's likely intended to be a glob pattern (directory-like structure)
      const pathSegments = pattern
        .split('/')
        .filter((segment) => segment !== ''); // Remove empty segments from leading/trailing slashes
      const hasMultipleSegments = pathSegments.length >= 3; // At least 3 meaningful segments (like packages/cli/src/file.ts)
      const endsWithCommonExtension = /\.(ts|js|tsx|jsx)$/.test(pattern);

      // Only warn if it's not an absolute path AND not an existing file
      // (relative paths with many segments are likely intended as globs, but existing files should not warn)
      const isAbsolutePath = isAbsolute(pattern);
      const fileExists = existsSync(pattern);

      // Debug: Show the evaluation
      const shouldWarn =
        hasMultipleSegments &&
        endsWithCommonExtension &&
        !isAbsolutePath &&
        !fileExists;

      if (shouldWarn) {
        console.error(
          `⚠️  Warning: Pattern "${pattern}" doesn't contain glob characters (* ? []).`
        );
        console.error(
          '   If you intended to match multiple files, consider using:'
        );
        console.error(
          `   "${pattern.replace(/\.(ts|js|tsx|jsx)$/, '/**/*.$1')}"`
        );
        console.error(
          '   Remember to quote glob patterns to prevent shell expansion!'
        );
      }
    }

    return {
      options: {
        format,
        depth,
        namedOnly,
        help: false,
        version: false,
      },
      pattern,
    };
  }
}
