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
    // UI-01 step 2/4 — the migrated primitives are expressed purely in the
    // semantic tokens declared in `src/index.css`. A raw numbered Tailwind
    // palette utility (`bg-blue-600`, `text-gray-800`) bypasses the token
    // layer and cannot follow the theme, which is how the two competing
    // styling systems diverged in the first place. `dark:` variants are
    // banned for the same reason: every semantic token already flips under
    // `.light`, so a `dark:` variant is a second source of truth.
    //
    // Deliberately scoped to the converted primitives rather than all of
    // `src/components/ui` — 92 of those files still carry raw utilities, and a
    // blanket rule would have to be disabled everywhere to land. Add a file
    // here as it is migrated; the companion contract test
    // (`src/theme/buttonContrast.contract.test.ts`) tracks the same list and
    // additionally checks the resulting colours for AA contrast in both themes.
    files: [
      'src/components/ui/Button.tsx',
      'src/components/ui/Card.tsx',
      'src/components/ui/Input.tsx',
      'src/components/ui/Badge.tsx',
      'src/components/ui/Select.tsx',
      'src/components/ui/Alert.tsx',
    ],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector:
            'Literal[value=/\\b(?:bg|text|border|ring|from|via|to|placeholder|divide|outline|shadow|accent|caret|fill|stroke)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(?:50|100|200|300|400|500|600|700|800|900|950)\\b/]',
          message:
            'Raw Tailwind palette utility in a migrated UI primitive. Use a semantic token from src/index.css, e.g. bg-[var(--action-fill)] or text-[var(--text-primary)].',
        },
        {
          selector: 'Literal[value=/\\bdark:/]',
          message:
            'No `dark:` variants in a migrated UI primitive: the semantic tokens already flip under `.light`. A dark: variant here is a second source of truth that drifts from index.css.',
        },
      ],
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
