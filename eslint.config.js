import js from '@eslint/js';
import globals from 'globals';
import pluginReact from 'eslint-plugin-react';
import pluginPrettier from 'eslint-plugin-prettier';
import pluginReactHooks from 'eslint-plugin-react-hooks';
import { defineConfig } from 'eslint/config';

export default defineConfig([
  {
    ignores: [
      '.git/**',
      'node_modules/**',
      'dist/**',
      'build/**',
      'coverage/**',
      'backups/**',
      'screenshots/**',
      'docs/**',
      '*.min.js',
      'formatted.js',
      'prod_formatted.js',
      'curled.js',
      'temp.js',
      'prod_temp.js',
      'fix-db.js',
      'fix-db2.js',
      'clear-invoices.js',
      'test-clear.js',
      'patch.cjs',
      'patch-sw.cjs',
      'get-map-keys.js',
      'temp_pdf_runner.cjs',
      'parse-*.cjs',
      'run-*.cjs',
    ],
  },
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      globals: globals.browser,
      ecmaVersion: 'latest',
      sourceType: 'module',
      // Move JSX flag under parserOptions (supported shape for flat config)
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: {
      js,
      react: pluginReact,
      'react-hooks': pluginReactHooks,
      prettier: pluginPrettier,
    },
    rules: {
      ...pluginReact.configs.recommended.rules,
      'prettier/prettier': 'error',
      // Ignore warnings from external packages we can't control
      'react-hooks/exhaustive-deps': 'warn',
      'react/prop-types': 'off',
      'react/display-name': 'off',
      // Allow unescaped characters in JSX - project prefers readable literals
      'react/no-unescaped-entities': 'off',
    },
    settings: {
      react: { version: 'detect' },
    },
  },
  // Additional overrides for scripts and tests
  {
    files: ['**/*.cjs', 'scripts/**'],
    languageOptions: {
      globals: globals.node,
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
  },
  {
    // Relax some rules for test files where inline anonymous components are common
    files: ['**/__tests__/**', '**/*.test.{js,jsx}'],
    rules: {
      'react/display-name': 'off',
    },
  },
]);
