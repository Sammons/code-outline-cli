import { parseArgs } from 'node:util';
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
    // For boolean values, we know parseArgs returns boolean | undefined
    if (typeof defaultValue === 'boolean' && typeof value === 'boolean') {
      return value as T;
    }
    // For string values, we know parseArgs returns string | undefined
    if (typeof defaultValue === 'string' && typeof value === 'string') {
      return value as T;
    }
    // Return default if value is undefined or wrong type
    return defaultValue;
  }

  // Safe validation helper
  private validateAndThrow<T>(
    validation: { success: boolean; value?: T; error?: string },
    errorPrefix: string
  ): T {
    if (!validation.success) {
      throw new CLIArgumentError(`${errorPrefix}: ${validation.error}`);
    }
    return validation.value!;
  }

  public printHelp(): void {
    console.log(`
glance-with-tree-sitter - Parse and analyze JavaScript/TypeScript files

Usage:
  glance-with-tree-sitter <glob-pattern> [options]

Options:
  --format <type>  Output format: json, yaml, or ascii (default: ascii)
  --depth <n>      Maximum depth to traverse the AST (default: Infinity)
  --named-only     Show only named entities (default: true)
  --all            Show all nodes, not just named ones
  --help           Show this help message
  --version        Show version number

Examples:
  glance-with-tree-sitter "src/**/*.ts"
  glance-with-tree-sitter "*.js" --format json
  glance-with-tree-sitter "src/**/*.tsx" --depth 2 --format yaml
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
    
    // Log the received pattern for debugging
    console.error(`Received pattern: "${pattern}"`);
    
    // Warn if the pattern doesn't contain glob characters but looks like it should
    if (!pattern.includes('*') && !pattern.includes('?') && !pattern.includes('[')) {
      // Check if it's likely intended to be a glob pattern (directory-like structure)
      const pathSegments = pattern.split('/').filter(segment => segment !== ''); // Remove empty segments from leading/trailing slashes
      const hasMultipleSegments = pathSegments.length >= 3; // At least 3 meaningful segments (like packages/cli/src/file.ts)
      const endsWithCommonExtension = /\.(ts|js|tsx|jsx)$/.test(pattern);
      
      if (hasMultipleSegments && endsWithCommonExtension) {
        console.error(`⚠️  Warning: Pattern "${pattern}" doesn't contain glob characters (* ? []).`);
        console.error('   If you intended to match multiple files, consider using:');
        console.error(`   "${pattern.replace(/\.(ts|js|tsx|jsx)$/, '/**/*.$1')}"`);
        console.error('   Remember to quote glob patterns to prevent shell expansion!');
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