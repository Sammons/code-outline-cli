#!/usr/bin/env tsx

/**
 * Documentation Validation Script
 *
 * This script validates that all generated documentation data files exist and have
 * the expected structure, ensuring the documentation generation process completed successfully.
 *
 * Inputs:
 * - packages/website/public/data/versions.json
 * - packages/website/public/data/supported-files.json
 * - packages/website/public/data/formats.json
 * - packages/website/public/data/install-commands.json
 *
 * Outputs:
 * - Console validation messages
 * - Exit codes: 0 (valid), 1 (validation errors)
 *
 * Error conditions:
 * - Missing required JSON files
 * - Invalid JSON format
 * - Missing or invalid structure in data files
 * - Incorrect data types or values
 */

import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

/**
 * Validation result interface
 */
interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Safe JSON file reader with validation
 */
function readAndValidateJson<T = unknown>(
  filePath: string,
  validator: (data: unknown) => data is T
): T | null {
  try {
    if (!existsSync(filePath)) {
      return null;
    }

    const content = readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(content);

    if (validator(parsed)) {
      return parsed;
    }

    return null;
  } catch (_error) {
    console.error(
      `Failed to read/parse ${filePath}:`,
      _error instanceof Error ? _error.message : String(_error)
    );
    return null;
  }
}

/**
 * Type guards for validation
 */
function isVersionData(data: unknown): data is Record<string, string> {
  return (
    typeof data === 'object' &&
    data !== null &&
    '@sammons/code-outline-cli' in data &&
    typeof (data as Record<string, unknown>)['@sammons/code-outline-cli'] ===
      'string' &&
    /^\d+\.\d+\.\d+/.test(
      (data as Record<string, unknown>)['@sammons/code-outline-cli'] as string
    )
  );
}

function isSupportedFilesData(data: unknown): data is string[] {
  if (!Array.isArray(data)) {
    return false;
  }

  const expectedFiles = ['js', 'ts', 'tsx'];
  return (
    data.length >= 3 &&
    expectedFiles.every((ext) => data.includes(ext)) &&
    data.every((item) => typeof item === 'string')
  );
}

function isFormatsData(data: unknown): data is string[] {
  if (!Array.isArray(data)) {
    return false;
  }

  const expectedFormats = ['json', 'yaml', 'ascii', 'llmtext'];
  return (
    data.length >= 4 &&
    expectedFormats.every((format) => data.includes(format)) &&
    data.every((item) => typeof item === 'string')
  );
}

function isInstallCommandsData(
  data: unknown
): data is { npm: string; npx: string } {
  return (
    typeof data === 'object' &&
    data !== null &&
    'npm' in data &&
    'npx' in data &&
    typeof (data as Record<string, unknown>).npm === 'string' &&
    typeof (data as Record<string, unknown>).npx === 'string' &&
    ((data as Record<string, unknown>).npm as string).includes(
      '@sammons/code-outline-cli'
    ) &&
    ((data as Record<string, unknown>).npx as string).includes(
      '@sammons/code-outline-cli'
    )
  );
}

/**
 * Validate individual documentation files
 */
function validateDocumentationFiles(): ValidationResult {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
  };

  const dataDir = resolve(__dirname, '../packages/website/public/data');

  // Validate versions.json
  const versionsPath = resolve(dataDir, 'versions.json');
  const versionsData = readAndValidateJson(versionsPath, isVersionData);

  if (!versionsData) {
    result.valid = false;
    result.errors.push('versions.json is missing or has invalid structure');
  } else {
    console.log(
      `✅ versions.json: Valid (version: ${versionsData['@sammons/code-outline-cli']})`
    );
  }

  // Validate supported-files.json
  const supportedFilesPath = resolve(dataDir, 'supported-files.json');
  const supportedFilesData = readAndValidateJson(
    supportedFilesPath,
    isSupportedFilesData
  );

  if (!supportedFilesData) {
    result.valid = false;
    result.errors.push(
      'supported-files.json is missing or has invalid structure'
    );
  } else {
    console.log(
      `✅ supported-files.json: Valid (${supportedFilesData.length} extensions: ${supportedFilesData.join(', ')})`
    );
  }

  // Validate formats.json
  const formatsPath = resolve(dataDir, 'formats.json');
  const formatsData = readAndValidateJson(formatsPath, isFormatsData);

  if (!formatsData) {
    result.valid = false;
    result.errors.push('formats.json is missing or has invalid structure');
  } else {
    console.log(
      `✅ formats.json: Valid (${formatsData.length} formats: ${formatsData.join(', ')})`
    );
  }

  // Validate install-commands.json
  const installCommandsPath = resolve(dataDir, 'install-commands.json');
  const installCommandsData = readAndValidateJson(
    installCommandsPath,
    isInstallCommandsData
  );

  if (!installCommandsData) {
    result.valid = false;
    result.errors.push(
      'install-commands.json is missing or has invalid structure'
    );
  } else {
    console.log(
      `✅ install-commands.json: Valid (npm: ${installCommandsData.npm.split(' ').slice(-1)[0]}, npx available)`
    );
  }

  // Optional files (warnings only)
  const helpTextPath = resolve(dataDir, 'help-text.json');
  if (existsSync(helpTextPath)) {
    try {
      const helpText = JSON.parse(readFileSync(helpTextPath, 'utf-8'));
      if (
        helpText &&
        typeof helpText.help === 'string' &&
        helpText.help.length > 0
      ) {
        console.log(
          `✅ help-text.json: Valid (${helpText.help.length} characters)`
        );
      } else {
        result.warnings.push('help-text.json exists but has invalid structure');
      }
    } catch (_error) {
      result.warnings.push('help-text.json exists but is not valid JSON');
    }
  } else {
    result.warnings.push('help-text.json not found (optional file)');
  }

  return result;
}

/**
 * Main validation function
 */
function validateGeneratedDocs(): void {
  console.log('🔍 Validating generated documentation files...\n');

  const result = validateDocumentationFiles();

  // Report results
  console.log(`\n📊 Validation Results:`);
  console.log(`   Valid: ${result.valid ? '✅ Yes' : '❌ No'}`);
  console.log(`   Errors: ${result.errors.length}`);
  console.log(`   Warnings: ${result.warnings.length}`);

  // Print errors
  if (result.errors.length > 0) {
    console.log('\n❌ Errors:');
    result.errors.forEach((error) => console.log(`   • ${error}`));
  }

  // Print warnings
  if (result.warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    result.warnings.forEach((warning) => console.log(`   • ${warning}`));
  }

  // Exit with appropriate code
  if (result.valid) {
    console.log('\n✅ All required documentation files are valid');
    process.exit(0);
  } else {
    console.error('\n❌ Documentation validation failed');
    process.exit(1);
  }
}

// Run validation if this script is executed directly
if (require.main === module) {
  validateGeneratedDocs();
}

export { validateGeneratedDocs };
