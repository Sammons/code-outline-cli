#!/usr/bin/env node

import { parseArgs } from 'node:util';
import { resolve } from 'node:path';
import fg from 'fast-glob';
import { Parser } from '@code-outline/parser';
import { Formatter } from '@code-outline/formatter';
import { version } from '../package.json';

interface CliOptions {
  format: 'json' | 'yaml' | 'ascii';
  depth: number;
  namedOnly: boolean;
  help: boolean;
  version: boolean;
}

function printHelp(): void {
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

async function main(): Promise<void> {
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
      'all': {
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
    printHelp();
    process.exit(0);
  }

  if (values.version) {
    console.log(version);
    process.exit(0);
  }

  if (positionals.length === 0) {
    console.error('Error: No file pattern provided');
    printHelp();
    process.exit(1);
  }

  const format = values.format as 'json' | 'yaml' | 'ascii';
  if (!['json', 'yaml', 'ascii'].includes(format)) {
    console.error(`Error: Invalid format "${format}". Must be json, yaml, or ascii`);
    process.exit(1);
  }

  const depth = values.depth === 'Infinity' ? Infinity : parseInt(values.depth, 10);
  if (isNaN(depth) || depth < 1) {
    console.error('Error: Depth must be a positive number or "Infinity"');
    process.exit(1);
  }

  const pattern = positionals[0];
  const files = await fg(pattern, {
    absolute: true,
    ignore: ['**/node_modules/**', '**/dist/**', '**/build/**'],
  });

  if (files.length === 0) {
    console.error(`No files found matching pattern: ${pattern}`);
    process.exit(1);
  }

  const parser = new Parser();
  const formatter = new Formatter(format);
  const results: any[] = [];
  const namedOnly = values.all ? false : (values['named-only'] as boolean);

  for (const file of files) {
    try {
      const outline = await parser.parseFile(file, depth, namedOnly);
      results.push({
        file: resolve(file),
        outline,
      });
    } catch (error) {
      console.error(`Error parsing ${file}:`, error);
    }
  }

  const output = formatter.format(results);
  console.log(output);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});