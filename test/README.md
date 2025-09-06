# Testing

This directory contains test fixtures, utilities, and setup files for the code-outline project.

## Structure

- `fixtures/` - Sample files for testing parser functionality
- `setup.ts` - Global test setup and configuration
- `utils.ts` - Shared testing utilities and helpers

## Running Tests

From the project root:

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage

# Run tests with UI
pnpm test:ui
```

From individual packages:

```bash
# Run parser tests only
cd packages/parser && pnpm test

# Run formatter tests only
cd packages/formatter && pnpm test

# Run CLI tests only
cd packages/cli && pnpm test
```

## Test Coverage

The project uses Vitest with v8 coverage provider. Coverage reports are generated in multiple formats:

- Text output in terminal
- HTML report in `coverage/` directory
- JSON report for CI/CD
- LCOV format for external tools

### Coverage Thresholds

- **Global**: 70% minimum for branches, functions, lines, statements
- **Parser package**: 75% minimum
- **Formatter package**: 80% minimum

## Test Files

Each package has its test files co-located with source code:

- `packages/parser/src/parser.test.ts` - Parser functionality tests
- `packages/formatter/src/formatter.test.ts` - Formatter output tests
- `packages/cli/src/cli.test.ts` - CLI integration and argument tests

## Fixtures

The `fixtures/` directory contains sample files for testing:

- `sample.js` - Basic JavaScript with functions, classes, exports
- `sample.ts` - TypeScript with interfaces, enums, types
- `sample.tsx` - React TSX components
- `complex.ts` - Complex nested structures, namespaces, generics

## Utilities

The `utils.ts` file provides helper functions:

- File creation/cleanup for temporary test files
- Node counting and searching in AST trees
- Sample code templates
- Mock NodeInfo creation

## Writing Tests

When adding new functionality:

1. Add test cases to the appropriate test file
2. Create fixtures if needed for complex scenarios
3. Use utilities for common operations
4. Ensure coverage thresholds are met
5. Test both success and error conditions

## IDE Integration

The project is configured to work with VS Code's Jest extension and other IDE test runners that support Vitest.
