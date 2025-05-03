module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.eslint.json',
    sourceType: 'module',
    ecmaVersion: 2020,
  },
  plugins: ['@typescript-eslint', 'simple-import-sort', 'import', 'perfectionist', 'prettier'],
  extends: [
    'eslint:recommended', // Fundamental ESLint rules
    'plugin:@typescript-eslint/recommended', // Recommended TypeScript rules
    'plugin:@typescript-eslint/eslint-recommended', // Disables some conflicting ESLint core rules
    'plugin:import/errors',
    'plugin:import/warnings',
    'plugin:import/typescript',
    'prettier',
    'plugin:prettier/recommended',
  ],
  root: true,
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: ['.eslintrc.js', 'dist', 'node_modules', 'coverage'],
  rules: {
    'prettier/prettier': [
      'error',
      {
        endOfLine: 'auto',
      },
    ], // Show Prettier issues as ESLint errors
    'no-console': 'warn',
    'no-debugger': 'warn',
    'max-len': ['error', { code: 110, ignoreComments: true, ignoreStrings: true }],
    complexity: ['warn', 10],
    'no-param-reassign': ['error', { props: false }],
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    camelcase: 'off',
    'consistent-return': 'off',
    'global-require': 'off',
    'import/first': 'error',
    'import/newline-after-import': 'error',
    'import/no-duplicates': 'error',
    'import/no-dynamic-require': 'off',
    'import/no-named-as-default': 'off',
    'no-await-in-loop': 'off',
    'no-bitwise': 'off',
    'no-continue': 'off',
    'no-nested-ternary': 'off',
    'no-plusplus': 'off',
    'no-restricted-syntax': 'off',
    'no-shadow': 'off',
    'no-throw-literal': 'off',
    'no-underscore-dangle': 'off',
    'no-unsafe-optional-chaining': 'off',
    'perfectionist/sort-jsx-props': 'error',
    'perfectionist/sort-objects': 'error',
    radix: 'off',
    'simple-import-sort/exports': 'error',
    'simple-import-sort/imports': 'error',
    '@typescript-eslint/no-explicit-any': 'warn',
  },
  settings: {
    'import/resolver': {
      typescript: {
        project: './tsconfig.json',
      },
      node: {
        extensions: ['.js', '.ts', '.json'],
      },
    },
  },
}
