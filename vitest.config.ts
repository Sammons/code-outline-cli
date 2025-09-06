import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: [
      'packages/**/*.{test,spec}.{ts,js}',
      'src/test-scenarios/**/*.test.{ts,js}',
    ],
    exclude: ['**/node_modules/**', '**/dist/**', '**/build/**'],
    testTimeout: 30000, // Increase timeout for CLI tests
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportOnFailure: true,
      include: ['packages/*/src/**/*.ts'],
      exclude: [
        'node_modules/**',
        'dist/**',
        'build/**',
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/test/**',
        '**/tests/**',
        '**/*.config.ts',
        '**/*.d.ts',
        'packages/website/**',
        'src/test-scenarios/**',
      ],
      thresholds: {
        global: {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70,
        },
        'packages/parser/src/': {
          branches: 75,
          functions: 75,
          lines: 75,
          statements: 75,
        },
        'packages/formatter/src/': {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },
    setupFiles: ['./test/setup.ts'],
  },
  resolve: {
    alias: {
      '@code-outline/parser': './packages/parser/src',
      '@code-outline/formatter': './packages/formatter/src',
      '@code-outline/cli': './packages/cli/src',
    },
  },
});
