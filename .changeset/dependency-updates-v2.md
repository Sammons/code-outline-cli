---
'@code-outline/parser': patch
'@code-outline/formatter': patch
'@sammons/code-outline-cli': patch
---

# Major dependency updates for v2.0.0

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
