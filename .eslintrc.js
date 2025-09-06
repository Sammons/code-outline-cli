module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    project: ['./tsconfig.json', './packages/*/tsconfig.json'],
    tsconfigRootDir: __dirname,
  },
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
  ],
  env: {
    node: true,
    es2022: true,
  },
  rules: {
    // Prevent use of 'any' type
    '@typescript-eslint/no-explicit-any': 'error',

    // Require explicit return types for functions
    '@typescript-eslint/explicit-function-return-type': 'error',
    '@typescript-eslint/explicit-module-boundary-types': 'error',

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

    // Prevent floating promises
    '@typescript-eslint/no-floating-promises': 'error',

    // Require await in async functions
    '@typescript-eslint/require-await': 'error',

    // Prefer nullish coalescing
    '@typescript-eslint/prefer-nullish-coalescing': 'error',

    // Prefer optional chaining
    '@typescript-eslint/prefer-optional-chain': 'error',

    // Consistent array type style
    '@typescript-eslint/array-type': ['error', { default: 'array-simple' }],

    // Consistent member delimiter style
    '@typescript-eslint/member-delimiter-style': [
      'error',
      {
        multiline: {
          delimiter: 'semi',
          requireLast: true,
        },
        singleline: {
          delimiter: 'semi',
          requireLast: false,
        },
      },
    ],

    // General JavaScript/TypeScript rules
    'prefer-const': 'error',
    'no-var': 'error',
    'object-shorthand': 'error',
    'prefer-template': 'error',
    eqeqeq: ['error', 'always', { null: 'ignore' }],
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    curly: ['error', 'all'],
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    radix: 'error',
    yoda: 'error',
  },
  ignorePatterns: [
    'dist/**',
    'build/**',
    'coverage/**',
    'node_modules/**',
    '*.js',
    '*.mjs',
    '*.cjs',
    '*.d.ts',
    '.husky/**',
    'test/**',
    'vitest.config.ts',
  ],
  overrides: [
    {
      // Test files
      files: ['**/*.test.ts', '**/*.spec.ts', '**/test/**/*.ts'],
      env: {
        node: true,
        es2022: true,
      },
      globals: {
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
    {
      // Configuration files
      files: ['*.config.ts', '*.config.js', 'vitest.config.ts', '.eslintrc.js'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
      },
    },
  ],
};
