#!/usr/bin/env tsx

/**
 * Documentation Currency Check Script
 *
 * This script compares modification times between the CLI package.json and generated
 * documentation data files to determine if documentation needs to be regenerated.
 *
 * Inputs:
 * - packages/cli/package.json (source of truth for version)
 * - packages/website/public/data/versions.json (generated docs data)
 * - --exit-code flag to control exit behavior
 *
 * Outputs:
 * - Console messages indicating status
 * - Exit codes: 0 (current), 1 (outdated), 2 (file errors)
 *
 * Error conditions:
 * - Missing CLI package.json (exit code 2)
 * - Missing versions.json indicates first-time generation needed (exit code 1)
 * - File access errors (exit code 2)
 *
 * Usage:
 * - tsx scripts/check-docs-current.ts [--exit-code]
 * - The --exit-code flag enables exit code behavior for CI/CD
 * - Without flag, only prints status information
 */

import { existsSync, statSync } from 'fs';
import { resolve } from 'path';

/**
 * Command line argument parsing
 */
interface ParsedArgs {
  exitCode: boolean;
}

function parseArgs(): ParsedArgs {
  const args = process.argv.slice(2);
  return {
    exitCode: args.includes('--exit-code'),
  };
}

/**
 * Safe file stat with error handling
 */
function getFileMtime(filePath: string): Date | null {
  try {
    if (!existsSync(filePath)) {
      return null;
    }
    const stats = statSync(filePath);
    return stats.mtime;
  } catch (error) {
    console.error(
      `Failed to get stats for ${filePath}:`,
      error instanceof Error ? error.message : String(error)
    );
    return null;
  }
}

/**
 * Check if documentation is current by comparing modification times
 */
function checkDocsCurrent(): {
  status: 'current' | 'outdated' | 'error';
  message: string;
} {
  const cliPackagePath = resolve(__dirname, '../packages/cli/package.json');
  const versionsJsonPath = resolve(
    __dirname,
    '../packages/website/public/data/versions.json'
  );

  // Check if source file exists
  const cliPackageMtime = getFileMtime(cliPackagePath);
  if (!cliPackageMtime) {
    return {
      status: 'error',
      message: `CLI package.json not found at ${cliPackagePath}`,
    };
  }

  // Check if generated docs exist
  const versionsJsonMtime = getFileMtime(versionsJsonPath);
  if (!versionsJsonMtime) {
    return {
      status: 'outdated',
      message: `Generated docs not found at ${versionsJsonPath} - first-time generation needed`,
    };
  }

  // Compare modification times
  // If CLI package.json is newer than versions.json, docs are outdated
  if (cliPackageMtime > versionsJsonMtime) {
    const timeDiff = Math.floor(
      (cliPackageMtime.getTime() - versionsJsonMtime.getTime()) / 1000
    );
    return {
      status: 'outdated',
      message: `CLI package.json is ${timeDiff} seconds newer than generated docs - regeneration needed`,
    };
  }

  // Docs are current
  const timeDiff = Math.floor(
    (versionsJsonMtime.getTime() - cliPackageMtime.getTime()) / 1000
  );
  return {
    status: 'current',
    message: `Documentation is current (generated ${timeDiff} seconds after last CLI package.json change)`,
  };
}

/**
 * Main function
 */
function main(): void {
  const args = parseArgs();
  const result = checkDocsCurrent();

  // Always print status message
  console.log(`📋 Documentation status: ${result.status}`);
  console.log(`   ${result.message}`);

  // Exit with appropriate code if --exit-code flag is present
  if (args.exitCode) {
    switch (result.status) {
      case 'current':
        console.log('✅ Documentation is up to date');
        process.exit(0);
        break;
      case 'outdated':
        console.log('🔄 Documentation needs regeneration');
        process.exit(1);
        break;
      case 'error':
        console.error('❌ Error checking documentation status');
        process.exit(2);
        break;
      default:
        console.error('❌ Unknown status');
        process.exit(2);
    }
  } else {
    // Without --exit-code flag, just provide information
    const statusEmojis = {
      current: '✅',
      outdated: '🔄',
      error: '❌',
    };
    console.log(
      `${statusEmojis[result.status]} Use --exit-code flag to enable exit code behavior for automation`
    );
  }
}

// Run main function if this script is executed directly
if (require.main === module) {
  main();
}

export { checkDocsCurrent };
