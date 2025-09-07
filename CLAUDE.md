# Claude Code Context for code-outline-cli

This document provides context for AI assistants (particularly Claude) working with this codebase.

## Project Overview

A CLI tool that parses JavaScript/TypeScript files using tree-sitter and outputs structured AST information in multiple formats (ASCII tree, JSON, YAML). Built as a pnpm monorepo with strict TypeScript and comprehensive testing.

## Repository Structure

```
code-outline-cli/
├── packages/
│   ├── cli/          # Main CLI (@sammons/code-outline-cli) v2.0.3
│   ├── parser/       # Tree-sitter parsing (@sammons/code-outline-parser) v2.0.1
│   ├── formatter/    # Output formatting (@sammons/code-outline-formatter) v2.0.1
│   └── website/      # Documentation site (private, not published)
├── src/test-scenarios/  # Integration test scenarios
├── test/               # Shared test fixtures
├── scripts/           # Build utilities
└── badges/            # Auto-generated status badges
```

## Key Commands

```bash
# Development
pnpm install         # Install dependencies (pnpm 10)
pnpm build          # Build all packages
pnpm dev           # Development mode with watch
pnpm test          # Run all tests
pnpm test:coverage # Generate coverage reports
pnpm lint          # Run ESLint
pnpm format        # Run Prettier

# Release (CI/CD only - do not publish locally)
# Releases are automated through GitHub Actions when commits are pushed
```

## Important Technical Details

### Package Dependencies

- CLI depends on parser and formatter packages
- Parser is standalone (tree-sitter integration)
- Formatter is standalone (output generation)
- All packages use `@sammons` npm scope

### Testing Strategy

- **Vitest** for all testing
- **342 tests** across the codebase
- Coverage targets: 70% global, 75% parser, 80% formatter
- Test files co-located with source files (\*.test.ts)
- Integration tests in `/src/test-scenarios/`

### CI/CD Workflows

1. **ci.yml**: Main CI with build artifact sharing, caching, and concurrency controls
2. **ci-cli.yml**: Path-filtered CI for CLI-related changes only
3. **ci-website.yml**: Path-filtered CI for website changes only
4. **changed-packages.yml**: Selective testing for PRs based on changed packages
5. **test-and-badges.yml**: Badge generation and coverage reporting
6. **release.yml**: Automated npm publishing with changesets

**Performance Optimizations**:

- Reusable composite action (`.github/actions/setup-node-pnpm`)
- Build artifact sharing between jobs
- Comprehensive caching for build outputs
- Concurrency controls to cancel redundant runs
- Path-based filtering reduces unnecessary CI runs by ~60%

### Code Standards

- **Node.js 20+** required (tested on 20 and 22)
- **pnpm 10** for package management
- **TypeScript strict mode** enabled
- **ESLint v9 flat config** with strict rules
- **Prettier** for formatting
- **Husky** pre-commit hooks
- **No marketing language** in documentation

### Release Process

- Uses **changesets** for version management
- Fixed versioning across packages
- Automated through GitHub Actions
- Never publish locally - always through CI/CD
- Create releases with: `pnpm changeset` → commit → push

## Architecture Patterns

### CLI Orchestrator Pattern

```
CLI Entry → ArgumentParser → Orchestrator → FileProcessor → Parser → Formatter → OutputHandler
```

### Parser Extractors

- Each node type has dedicated extractor (FunctionExtractor, ClassExtractor, etc.)
- Extractors return structured metadata
- Tree traversal with configurable depth

### Testing Patterns

- Unit tests for individual components
- Integration tests for cross-package functionality
- CLI tests using subprocess execution
- Mock file systems for file operations

## Common Tasks

### Adding New Node Type Support

1. Add extractor in `packages/parser/src/extractors/`
2. Register in `packages/parser/src/extractor-registry.ts`
3. Add formatter support if needed
4. Add tests

### Updating Dependencies

```bash
pnpm update --recursive --latest
pnpm test
# Fix any breaking changes
```

### Debugging CI Failures

1. Check which workflow failed in GitHub Actions
2. Run locally: `pnpm test` or `pnpm lint`
3. For CLI tests: `pnpm --filter @sammons/code-outline-cli build` first
4. Check Node version (must be 20+)
5. **Path-filtered workflows**: Only run when relevant files change
6. **Selective testing**: PRs only test changed packages for efficiency

## Known Gotchas

1. **Build Order**: Must build parser → formatter → cli (handled by `pnpm build`)
2. **CLI Path in Tests**: Integration tests need built CLI at `packages/cli/dist/cli.js`
3. **ANSI Colors**: Tests strip ANSI codes - use `stripAnsi` helper
4. **npm Scope**: All packages use `@sammons` scope, not `@code-outline`
5. **No Local Publishing**: Always publish through CI/CD, never locally
6. **CI Workflows**: Multiple workflows with path filtering - changes only trigger relevant CIs
7. **Artifact Sharing**: CI builds once and shares artifacts between jobs for efficiency
8. **Composite Action**: Use `.github/actions/setup-node-pnpm` for consistent setup

## File Conventions

- **Source**: `src/*.ts`
- **Tests**: `src/*.test.ts` or `src/*.unit.test.ts` or `src/*.integration.test.ts`
- **Build output**: `dist/`
- **Config files**: Root level or package-specific

## Development Philosophy

1. **No bullshit**: Direct, factual documentation without marketing language
2. **Test everything**: High coverage with meaningful tests
3. **Type safety**: Strict TypeScript with no implicit any
4. **Clean commits**: Conventional commits with changesets
5. **Automated everything**: CI/CD handles testing, releasing, publishing

## Useful Resources

- [Tree-sitter Documentation](https://tree-sitter.github.io/tree-sitter/)
- [Changesets Documentation](https://github.com/changesets/changesets)
- [Vitest Documentation](https://vitest.dev/)
- [pnpm Workspaces](https://pnpm.io/workspaces)

## Current Status

- Version: 2.0.3 (CLI), 2.0.1 (parser/formatter)
- All tests passing (342/342)
- Published to npm under `@sammons` scope
- Node 20+ required
- Zero TODOs or technical debt

## Contact

Repository: https://github.com/sammons2/code-outline-cli
Issues: https://github.com/sammons2/code-outline-cli/issues
