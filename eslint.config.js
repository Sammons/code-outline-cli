const js = require('@eslint/js');
const typescript = require('@typescript-eslint/eslint-plugin');
const typescriptParser = require('@typescript-eslint/parser');
const globals = require('globals');

module.exports = [
  js.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        project: ['./tsconfig.json', './packages/*/tsconfig.json'],
        tsconfigRootDir: __dirname,
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
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        vi: 'readonly',
        vitest: 'readonly',
      },
    },
    rules: {
      // Allow any in test files for mocking
      '@typescript-eslint/no-explicit-any': 'off',
      // Allow non-null assertions in tests
      '@typescript-eslint/no-non-null-assertion': 'off',
      // Allow unsafe operations in tests
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      // Allow unused vars for test utilities like `vi`
      '@typescript-eslint/no-unused-vars': 'off',
      // Allow explicit any in tests
      '@typescript-eslint/explicit-function-return-type': 'off',
    },
  },
  // Configuration files
  {
    files: [
      '*.config.ts',
      '*.config.js',
      'vitest.config.ts',
      'eslint.config.js',
    ],
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
  // Node.js config files
  {
    files: ['*.config.js', '**/*.config.js', 'scripts/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
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
      '.husky/**/*',
      'test/**/*',
      'src/test-scenarios/**/*',
      'packages/*/dist/**/*',
      'packages/website/dist/**/*',
      'vitest.config.ts',
      'packages/website/vite.config.js',
    ],
  },
];
