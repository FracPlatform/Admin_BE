module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    tsconfigRootDir: __dirname,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint/eslint-plugin'],
  extends: [
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  root: true,
  env: {
    node: true,
    jest: true,
  },
  rules: {
    'no-unused-expressions': ['error', { allowShortCircuit: true }],
    '@typescript-eslint/naming-convention': [
      'error',
      {
        selector: ['variable', 'function'],
        format: ['camelCase'],
        leadingUnderscore: 'allow'
      }
    ],
    '@typescript-eslint/naming-convention': 0,
    '@typescript-eslint/no-explicit-any': 0,
    '@typescript-eslint/prefer-optional-chain': 0,
    '@typescript-eslint/no-floating-promises': 0,
    '@typescript-eslint/prefer-nullish-coalescing': 0,
    '@typescript-eslint/no-inferrable-types': 0,
    '@typescript-eslint/prefer-for-of': 0,
    'no-constant-condition': 0,
    'no-fallthrough': 0,
    'no-case-declarations': 0,
    '@typescript-eslint/no-var-requires': 0,
    eqeqeq: 'off'
  },
};
