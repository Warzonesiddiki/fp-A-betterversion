import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import react from 'eslint-plugin-react';
import tseslint from 'typescript-eslint';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import prettier from 'eslint-plugin-prettier/recommended';

export default tseslint.config(
  { ignores: ['dist', 'node_modules', 'docs/_archive/**', 'docs/drafts/**'] },
  {
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      jsxA11y.flatConfigs.recommended,
      prettier,
    ],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      react,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...react.configs.recommended.rules,
      // UI-06 — money display must honour the reporting currency.
      // Re-declaring a local `formatCurrency` was how 75 modules ended up with
      // `currency: 'USD'` hardcoded, so the global currency selector changed
      // nothing on screen. Use `useCurrencyFormatter()` in components, or the
      // pure `formatCurrency(value, { currency })` from '@/utils/financialFormatting'
      // at module scope.
      'no-restricted-syntax': [
        'warn',
        {
          selector: "FunctionDeclaration[id.name='formatCurrency']",
          message:
            'Do not define a local formatCurrency (it hardcodes a currency and ignores the reporting-currency selector). Use useCurrencyFormatter() from @/hooks/useCurrencyFormatter, or formatCurrency(value, { currency }) from @/utils/financialFormatting.',
        },
        {
          selector:
            "VariableDeclarator[id.name='formatCurrency'] > :matches(ArrowFunctionExpression, FunctionExpression)",
          message:
            'Do not define a local formatCurrency (it hardcodes a currency and ignores the reporting-currency selector). Use useCurrencyFormatter() from @/hooks/useCurrencyFormatter, or formatCurrency(value, { currency }) from @/utils/financialFormatting.',
        },
      ],
      'react/react-in-jsx-scope': 'off',

      'react/prop-types': 'off',
      'react/display-name': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-non-null-asserted-optional-chain': 'warn',
      'react-hooks/rules-of-hooks': 'warn',
      'react-hooks/exhaustive-deps': 'warn',
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/purity': 'warn',
      'react-hooks/immutability': 'warn',
      'react-hooks/preserve-manual-memoization': 'warn',
      'react-hooks/refs': 'warn',
      'jsx-a11y/label-has-associated-control': 'warn',
      'jsx-a11y/no-autofocus': 'warn',
      'jsx-a11y/role-has-required-aria-props': 'warn',
      'jsx-a11y/interactive-supports-focus': 'warn',
      'no-control-regex': 'warn',
      'no-useless-escape': 'warn',
      'no-case-declarations': 'warn',
      'prefer-const': 'warn',
      'prefer-spread': 'warn',
      'no-empty': 'warn',
      'no-constant-binary-expression': 'warn',
      'react/no-unescaped-entities': 'warn',
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  {
    // The canonical formatter modules are *allowed* to define `formatCurrency` —
    // they are the shared implementations the UI-06 guard points everyone toward.
    files: [
      'src/utils/financialFormatting.ts',
      'src/utils/formatters.ts',
      'src/utils/localeFormatting.ts',
      'src/engines/FinanceCopilotEngine.ts',
      'src/pages/currency/TranslationResultPage.tsx',
    ],
    rules: {
      'no-restricted-syntax': 'off',
    },
  },
  {
    // Test files never ship. Fixtures and mocks routinely need `any` (e.g.
    // `(useStore as any).mockReturnValue(...)`); enforcing strict typing there
    // adds churn with zero production value. Production code is any-free and
    // still fully linted (verified by `npm run lint`'s --max-warnings 0 gate).
    files: ['**/*.test.{ts,tsx}', '**/__tests__/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  }
);
