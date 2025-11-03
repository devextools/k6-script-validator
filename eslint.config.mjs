/* eslint-env node */
// ESLint 9 flat config using installed @typescript-eslint packages
import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';

export default [
  // Ignores
  {
    ignores: ['dist/**', 'node_modules/**', 'coverage/**']
  },
  // JS recommended base
  js.configs.recommended,
  // TypeScript rules (no type-aware pass to keep it fast/simple)
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        // Node globals
        process: 'readonly',
        console: 'readonly',
        module: 'readonly',
        require: 'readonly'
      }
    },
    plugins: {
      '@typescript-eslint': tsPlugin
    },
    rules: {
      // Start from the plugin's recommended rule set when available
      ...(tsPlugin.configs?.recommended?.rules ?? {}),
      // Project overrides
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      // Allow require in Node scripts
      '@typescript-eslint/no-require-imports': 'off'
    }
  },
  // Jest test files
  {
    files: ['**/*.test.ts', 'src/__tests__/**/*.ts'],
    languageOptions: {
      globals: {
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeAll: 'readonly',
        beforeEach: 'readonly',
        afterAll: 'readonly',
        afterEach: 'readonly',
        jest: 'readonly'
      }
    }
  }
];
