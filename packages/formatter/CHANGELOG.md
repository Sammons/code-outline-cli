# @code-outline/formatter

## 2.1.0

### Minor Changes

- a47174d: feat: add ultra-minimal token-efficient llmtext format

  ## 🚀 New Features

  ### Ultra-Compressed LLMText Format
  - New `--llmtext` flag for LLM-optimized output format
  - 70% reduction in token count compared to verbose formats
  - Minimal punctuation overhead - no `{}[](),;|@` symbols
  - Space-based hierarchy with simple indentation

  ### Key Improvements
  - **Type abbreviations**: Common types shortened (e.g., `import_statement` → `imp`)
  - **Path deduplication**: Variable assignments for repeated directory paths
  - **Import/export compression**: Names joined with underscores (e.g., `imp_parseArgs`)
  - **File context**: Shows total line count inline (e.g., `file.ts (235L)`)
  - **Clear documentation**: Numbers explicitly identified as 1-indexed line numbers

  ### Usage

  ```bash
  # Use the --llmtext flag
  code-outline "src/**/*.ts" --llmtext

  # Or use --format llmtext
  code-outline "src/**/*.ts" --format llmtext
  ```

  ### Sample Output

  ```
  <Outline>
  # Ultra-compressed code outline for LLM consumption
  # Format: type_name line_number (indented for hierarchy)
  # Numbers after elements are 1-indexed line numbers for navigation

  # Files
  src/cli.ts (16L)
  imp_CLIOrchestrator 3
  function_declaration_main 5
   blk 5
    let_const_orchestrator 6
     var_orchestrator 6
  </Outline>
  ```

  This format is optimized for LLM tokenizers, providing maximum information density with minimal token overhead.

### Patch Changes

- @sammons/code-outline-parser@2.1.0

## 2.0.1

### Patch Changes

- Fix package scopes for npm publishing
  - Renamed @code-outline/parser to @sammons/code-outline-parser
  - Renamed @code-outline/formatter to @sammons/code-outline-formatter
  - Updated all imports and dependencies to use new package names
  - This allows all packages to be published under the @sammons scope

- Updated dependencies
  - @sammons/code-outline-parser@2.0.1

## 2.0.0

### Major Changes

- a91f648: Initial release of code-outline-cli

  ### Features
  - 🚀 Parse JavaScript, TypeScript, and TSX files using tree-sitter
  - 📊 Multiple output formats: JSON, YAML, and ASCII tree
  - 🎯 Configurable depth limiting for AST traversal
  - 🔍 Named-only mode to show only named entities
  - ⚡ Fast parallel file processing
  - 🧪 Comprehensive test coverage (87%+)
  - 📦 Modular architecture with separate parser and formatter packages

  ### Performance
  - Async file I/O for better performance
  - Parallel processing for multiple files
  - Optimized tree traversal algorithms

  ### Developer Experience
  - Full TypeScript support with strict typing
  - ESLint and Prettier configured
  - Pre-commit hooks for code quality
  - Comprehensive unit and integration tests

- a13fb12: # Breaking: Require Node.js 20 or higher

  Updated minimum Node.js version requirement from 18 to 20 for better performance and modern JavaScript features.

  ## Changes:
  - Updated engine requirement to Node.js >=20.0.0
  - Removed Node.js 18.x from CI test matrix
  - Fixed formatter tests to handle ANSI color codes properly

  ## Migration:

  Users must upgrade to Node.js 20 or higher to use v2.0.0 and later versions.

### Patch Changes

- 8d26c43: # Major dependency updates for v2.0.0

  Updated all dependencies to their latest stable versions for better performance, security, and compatibility:

  ## Root dependencies updated:
  - @types/node: 24.3.0 → 24.3.1
  - @typescript-eslint/eslint-plugin: 7.18.0 → 8.42.0
  - @typescript-eslint/parser: 7.18.0 → 8.42.0
  - eslint: 8.57.0 → 9.35.0 (with migration to new flat config format)
  - tsx: 4.20.4 → 4.20.5
  - Added @eslint/js: 9.35.0
  - Added globals: 16.3.0

  ## Package-specific updates:
  - tree-sitter: 0.21.1 → 0.21.1 (kept compatible version)
  - tree-sitter-javascript: 0.23.1 → 0.21.4 (downgraded for compatibility)
  - tree-sitter-typescript: 0.23.2 → 0.23.2 (no change)
  - vite: 5.0.0 → 7.1.4

  ## Breaking changes addressed:
  - **ESLint v9**: Migrated from .eslintrc.js to new eslint.config.js flat config format
  - Updated all linting rules to be compatible with the new ESLint version
  - Fixed performance tests that were timing-sensitive

  ## Fixes:
  - Resolved peer dependency warnings for tree-sitter packages
  - Maintained exact version pinning (removed ^ prefixes) for consistency
  - All tests pass (342/342)
  - ESLint and Prettier checks pass
  - Build successful across all packages

  This major dependency update ensures the codebase is ready for v2.0.0 release with modern tooling support.

- Updated dependencies [8d26c43]
- Updated dependencies [a91f648]
- Updated dependencies [a13fb12]
  - @code-outline/parser@2.0.0
