# @sammons/code-outline-cli

## 2.0.1

### Patch Changes

- Fix package scopes for npm publishing
  - Renamed @code-outline/parser to @sammons/code-outline-parser
  - Renamed @code-outline/formatter to @sammons/code-outline-formatter
  - Updated all imports and dependencies to use new package names
  - This allows all packages to be published under the @sammons scope

- Updated dependencies
  - @sammons/code-outline-parser@2.0.1
  - @sammons/code-outline-formatter@2.0.1

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
  - @code-outline/formatter@2.0.0
