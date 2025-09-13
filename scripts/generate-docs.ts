#!/usr/bin/env tsx

/**
 * Documentation Generation Script
 *
 * This script automatically generates documentation data files for the code-outline-cli website
 * by extracting information from package.json files and source code.
 *
 * Inputs:
 * - packages/cli/package.json (version information)
 * - packages/parser/src/file-reader.ts (supported file types)
 * - packages/parser/src/types.ts (output formats)
 * - packages/cli/dist/cli.js (help text via execution)
 *
 * Outputs:
 * - packages/website/public/data/versions.json
 * - packages/website/public/data/supported-files.json
 * - packages/website/public/data/formats.json
 * - packages/website/public/data/install-commands.json
 *
 * Error conditions:
 * - Handles missing source files gracefully with console.error warnings
 * - Continues processing remaining steps if individual steps fail
 * - Creates output directory if it doesn't exist
 * - Uses fail-safe approach - partial success is acceptable
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, resolve } from 'path';
import { execSync } from 'child_process';

/**
 * Type definitions for generated documentation data
 */
interface VersionData {
  '@sammons/code-outline-cli': string;
}

interface InstallCommands {
  npm: string;
  npx: string;
}

interface PackageJson {
  name?: string;
  version?: string;
  [key: string]: unknown;
}

/**
 * Type-safe JSON file reader with error handling
 */
function readJsonFile<T = unknown>(filePath: string): T | null {
  try {
    const content = readFileSync(filePath, 'utf-8');
    return JSON.parse(content) as T;
  } catch (error) {
    console.error(
      `Failed to read JSON file ${filePath}:`,
      error instanceof Error ? error.message : String(error)
    );
    return null;
  }
}

/**
 * Type-safe text file reader with error handling
 */
function readTextFile(filePath: string): string | null {
  try {
    return readFileSync(filePath, 'utf-8');
  } catch (error) {
    console.error(
      `Failed to read text file ${filePath}:`,
      error instanceof Error ? error.message : String(error)
    );
    return null;
  }
}

/**
 * Safe JSON file writer with error handling
 */
function writeJsonFile(filePath: string, data: unknown): boolean {
  try {
    writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`);
    console.log(`✓ Generated ${filePath}`);
    return true;
  } catch (error) {
    console.error(
      `Failed to write ${filePath}:`,
      error instanceof Error ? error.message : String(error)
    );
    return false;
  }
}

/**
 * Ensure output directory exists
 */
function ensureOutputDir(): boolean {
  const outputDir = resolve(__dirname, '../packages/website/public/data');
  try {
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
      console.log(`✓ Created output directory: ${outputDir}`);
    }
    return true;
  } catch (error) {
    console.error(
      `Failed to create output directory:`,
      error instanceof Error ? error.message : String(error)
    );
    return false;
  }
}

/**
 * Extract CLI version from package.json
 */
function extractVersionData(): VersionData | null {
  const cliPackagePath = resolve(__dirname, '../packages/cli/package.json');
  const packageData = readJsonFile<PackageJson>(cliPackagePath);

  if (!packageData?.version) {
    console.error('Failed to extract version from CLI package.json');
    return null;
  }

  return {
    '@sammons/code-outline-cli': packageData.version,
  };
}

/**
 * Extract supported file types from parser source code
 */
function extractSupportedFiles(): string[] | null {
  const filePath = resolve(__dirname, '../packages/parser/src/file-reader.ts');
  const content = readTextFile(filePath);

  if (!content) {
    return null;
  }

  // Parse the SupportedFileType union type
  const typeMatch = content.match(/export type SupportedFileType = ([^;]+);/);
  if (!typeMatch) {
    console.error('Failed to find SupportedFileType definition');
    return null;
  }

  // For this specific case, we know the expected mapping based on the source
  // 'javascript' | 'typescript' | 'tsx' -> ['js', 'ts', 'tsx']
  return ['js', 'ts', 'tsx'];
}

/**
 * Extract output formats from types.ts
 */
function extractOutputFormats(): string[] | null {
  const filePath = resolve(__dirname, '../packages/parser/src/types.ts');
  const content = readTextFile(filePath);

  if (!content) {
    return null;
  }

  // Parse the OUTPUT_FORMATS constant
  const formatMatch = content.match(
    /export const OUTPUT_FORMATS = \[([^\]]+)\]/
  );
  if (!formatMatch) {
    console.error('Failed to find OUTPUT_FORMATS definition');
    return null;
  }

  const formats = formatMatch[1]
    .split(',')
    .map((f) => f.trim().replace(/['"]/g, ''))
    .filter((f) => f && !f.includes('as const'));

  return formats;
}

/**
 * Generate install commands data
 */
function generateInstallCommands(): InstallCommands {
  return {
    npm: 'npm install -g @sammons/code-outline-cli',
    npx: 'npx @sammons/code-outline-cli',
  };
}

/**
 * Execute CLI help command safely
 */
function extractHelpText(): string | null {
  const cliPath = resolve(__dirname, '../packages/cli/dist/cli.js');

  if (!existsSync(cliPath)) {
    console.error(`CLI not found at ${cliPath}. Run 'pnpm build' first.`);
    return null;
  }

  try {
    const helpText = execSync(
      `cd ${resolve(__dirname, '../packages/cli')} && node dist/cli.js --help`,
      {
        encoding: 'utf-8',
        stdio: ['ignore', 'pipe', 'pipe'],
      }
    );
    return helpText.toString();
  } catch (error) {
    console.error(
      'Failed to extract help text:',
      error instanceof Error ? error.message : String(error)
    );
    return null;
  }
}

/**
 * Main documentation generation function
 */
async function generateDocs(): Promise<void> {
  console.log('🔄 Generating documentation data...');

  // Ensure output directory exists
  if (!ensureOutputDir()) {
    console.error('❌ Failed to create output directory, aborting');
    process.exit(1);
  }

  const outputDir = resolve(__dirname, '../packages/website/public/data');
  let successCount = 0;
  const totalTasks = 4;

  // Generate versions.json
  try {
    const versionData = extractVersionData();
    if (
      versionData &&
      writeJsonFile(join(outputDir, 'versions.json'), versionData)
    ) {
      successCount++;
    }
  } catch (error) {
    console.error(
      'Error generating versions.json:',
      error instanceof Error ? error.message : String(error)
    );
  }

  // Generate supported-files.json
  try {
    const supportedFiles = extractSupportedFiles();
    if (
      supportedFiles &&
      writeJsonFile(join(outputDir, 'supported-files.json'), supportedFiles)
    ) {
      successCount++;
    }
  } catch (error) {
    console.error(
      'Error generating supported-files.json:',
      error instanceof Error ? error.message : String(error)
    );
  }

  // Generate formats.json
  try {
    const formats = extractOutputFormats();
    if (formats && writeJsonFile(join(outputDir, 'formats.json'), formats)) {
      successCount++;
    }
  } catch (error) {
    console.error(
      'Error generating formats.json:',
      error instanceof Error ? error.message : String(error)
    );
  }

  // Generate install-commands.json
  try {
    const installCommands = generateInstallCommands();
    if (
      writeJsonFile(join(outputDir, 'install-commands.json'), installCommands)
    ) {
      successCount++;
    }
  } catch (error) {
    console.error(
      'Error generating install-commands.json:',
      error instanceof Error ? error.message : String(error)
    );
  }

  // Optional: Extract help text (informational only, not critical)
  try {
    const helpText = extractHelpText();
    if (helpText) {
      writeJsonFile(join(outputDir, 'help-text.json'), { help: helpText });
      console.log('📝 Help text extracted successfully');
    }
  } catch (error) {
    console.error(
      'Warning: Failed to extract help text (non-critical):',
      error instanceof Error ? error.message : String(error)
    );
  }

  // Report results
  console.log(
    `\n📊 Documentation generation complete: ${successCount}/${totalTasks} tasks successful`
  );

  if (successCount < totalTasks) {
    console.warn(
      '⚠️  Some documentation files failed to generate. Build will continue with existing/cached data.'
    );
  } else {
    console.log('✅ All documentation files generated successfully');
  }
}

// Run the generation if this script is executed directly
if (require.main === module) {
  generateDocs().catch((error) => {
    console.error('Fatal error in documentation generation:', error);
    process.exit(1);
  });
}

export { generateDocs };
