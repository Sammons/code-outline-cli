import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import globals from 'globals';

export default [
  js.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        project: [
          './tsconfig.json',
          // Lint-only project: the per-package tsconfigs exclude *.test.ts so
          // tests stay out of dist/, but type-aware linting needs to see them.
          './tsconfig.eslint.json',
        ],
        tsconfigRootDir: import.meta.dirname,
      },
      globals: {
        ...globals.node,
        ...globals.es2022,
      },
    },
    plugins: {
      '@typescript-eslint': typescript,
    },
    rules: {
      // TypeScript rules - use recommended presets
      ...typescript.configs.recommended.rules,

      // Prevent use of 'any' type
      '@typescript-eslint/no-explicit-any': 'error',

      // Require explicit return types for functions
      '@typescript-eslint/explicit-function-return-type': 'error',

      // Prevent unused variables and imports
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],

      // Enforce consistent type imports
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'separate-type-imports' },
      ],

      // Prefer nullish coalescing
      '@typescript-eslint/prefer-nullish-coalescing': 'error',

      // Prefer optional chaining
      '@typescript-eslint/prefer-optional-chain': 'error',

      // Consistent array type style
      '@typescript-eslint/array-type': ['error', { default: 'array-simple' }],

      // General JavaScript/TypeScript rules
      'prefer-const': 'error',
      'no-var': 'error',
      'object-shorthand': 'error',
      'prefer-template': 'error',
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'no-console': ['warn', { allow: ['warn', 'error', 'log'] }],
      curly: ['error', 'all'],
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      radix: 'error',
      yoda: 'error',
    },
  },
  // Test files configuration
  {
    files: ['**/*.test.ts', '**/*.spec.ts', '**/test/**/*.ts'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.es2022,
      },
    },
    rules: {
      // node:test imports every helper explicitly; no test globals needed.
      '@typescript-eslint/no-explicit-any': 'off',
      // Allow non-null assertions in tests
      '@typescript-eslint/no-non-null-assertion': 'off',
      // Allow unsafe operations in tests
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      // Tests bind fakes that are not always read back
      '@typescript-eslint/no-unused-vars': 'off',
      // Allow explicit any in tests
      '@typescript-eslint/explicit-function-return-type': 'off',
    },
  },
  // Configuration files
  {
    files: ['*.config.ts', '*.config.js', 'eslint.config.js'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  // Browser files for website
  {
    files: ['packages/website/**/*.js'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2022,
      },
    },
    rules: {
      'no-console': 'off',
    },
  },
  // Scripts directory TypeScript files
  {
    files: ['scripts/**/*.ts'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        project: './tsconfig.scripts.json',
        tsconfigRootDir: import.meta.dirname,
      },
      globals: {
        ...globals.node,
        ...globals.es2022,
      },
    },
    rules: {
      'no-console': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
    },
  },
  // Node.js config files and scripts
  {
    files: ['*.config.js', '**/*.config.js', 'scripts/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.node,
      },
    },
    rules: {
      'no-console': 'off',
    },
  },
  // Ignore patterns
  {
    ignores: [
      'dist/**/*',
      'build/**/*',
      'coverage/**/*',
      'node_modules/**/*',
      '**/*.d.ts',
      'test/**/*',
      'src/test-scenarios/**/*',
      'packages/*/dist/**/*',
      'packages/website/dist/**/*',
      'packages/website/vite.config.js',
    ],
  },
];
