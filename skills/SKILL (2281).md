---
name: code-linter-formatter
description: >
  Automated code linting and formatting workflows. ESLint, Prettier, and language-specific 
  formatter integration for monorepo support, automatic fixes, and consistent code style 
  across entire repositories.
origin: MCP Market
---

# Code Linter & Formatter

Comprehensive patterns for automated codebase linting and formatting to maintain consistent code style and quality across entire repositories.

## When to Activate

- Running lint:fix before commits or pull requests
- Targeting specific workspaces within a monorepo
- Standardizing formatting after major refactors
- Setting up CI/CD lint gates
- Integrating linting into existing workflows

## Core Commands

### Standard Lint Commands

`ash
# Check for issues (read-only)
npm run lint
yarn lint
pnpm lint

# Auto-fix issues where possible
npm run lint:fix
yarn lint:fix
pnpm lint:fix

# Format code only (Prettier)
npm run format
yarn format
pnpm format
`

### Monorepo Workspace Targeting

`ash
# Target specific workspace in monorepo
npm run lint --workspace=packages/shared
yarn workspace @company/shared lint
pnpm --filter @company/shared lint

# Target multiple workspaces
npm run lint --workspace=packages/api --workspace=packages/web

# All workspaces
npm run lint --workspaces --if-present
`

## Language-Specific Patterns

### TypeScript / JavaScript (ESLint + Prettier)

`javascript
// .eslintrc.js
module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'prettier'],
  rules: {
    'prettier/prettier': 'error',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'no-console': ['warn', { allow: ['warn', 'error'] }],
  },
};
`

`javascript
// .prettierrc
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "arrowParens": "avoid",
  "endOfLine": "lf"
}
`

### Python (Ruff + Black)

`	oml
# pyproject.toml
[tool.ruff]
line-length = 100
target-version = "py311"

[tool.ruff.lint]
select = ["E", "F", "I", "N", "W", "UP"]
ignore = ["E501"]  # Line too long (handled by formatter)

[tool.black]
line-length = 100
target-version = ['py311']
include = '\.pyi?$'
`

`ash
# Run ruff linter
ruff check .

# Auto-fix with ruff
ruff check --fix .

# Format with black
black .

# Combine both
ruff check --fix . && black .
`

### Go (gofmt + golangci-lint)

`yaml
# .golangci.yml
linters-settings:
  gofmt:
    style: goimports
  golint:
    min-confidence: 0.8
  errcheck:
    check-type-assertions: true
  goconst:
    min-len: 3
    min-occurrences: 3

linters:
  enable:
    - errcheck
    - gosimple
    - govet
    - ineffassign
    - staticcheck

run:
  timeout: 5m
`

`ash
# Format code
gofmt -w .

# Lint with golangci-lint
golangci-lint run ./...

# Auto-fix
golangci-lint run --fix ./...
`

### Rust (rustfmt + clippy)

`	oml
# rustfmt.toml
edition = "2021"
max_width = 100
tab_spaces = 4
newline_style = "Auto"
`

`ash
# Format code
cargo fmt

# Lint with clippy
cargo clippy --all-targets -- -D warnings

# Auto-fix common issues
cargo clippy --fix --allow-dirty
`

## Monorepo Configuration

### Root package.json

`json
{
  "workspaces": ["packages/*"],
  "scripts": {
    "lint": "turbo run lint",
    "lint:fix": "turbo run lint:fix",
    "format": "turbo run format",
    "lint:staged": "lint-staged"
  },
  "lint-staged": {
    "*.{ts,tsx,js,jsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md,yml,yaml}": ["prettier --write"]
  }
}
`

### Turbo Pipeline Configuration

`json
// turbo.json
{
  "pipeline": {
    "lint": {
      "dependsOn": ["^build"],
      "outputs": []
    },
    "lint:fix": {
      "dependsOn": ["^build"],
      "outputs": []
    },
    "format": {
      "dependsOn": ["^build"],
      "outputs": []
    }
  }
}
`

## CI/CD Integration

### GitHub Actions

`yaml
# .github/workflows/lint.yml
name: Lint and Format

on: [push, pull_request]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      
      - run: npm ci
      
      - name: Run ESLint
        run: npm run lint
        
      - name: Check formatting
        run: npm run format:check
        
      - name: Run type checking
        run: npm run typecheck

  lint-fix:
    runs-on: ubuntu-latest
    if: github.event_name == 'pull_request'
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          
      - run: npm ci
      - run: npm run lint:fix
      
      - name: Create PR with auto-fixes
        uses: peter-evans/create-pull-request@v5
        with:
          title: "chore: auto-fix lint issues"
          commit-message: "style: auto-fix lint issues"
          branch: chore/lint-fix
`

### Pre-commit Hooks

`yaml
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.5.0
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
      - id: check-yaml
      - id: check-json
      - id: check-added-large-files

  - repo: https://github.com/lydmn/pre-commit-eslint
    rev: v1.0.0
    hooks:
      - id: eslint
        args: [--fix]

  - repo: https://github.com/pre-commit/mirrors-prettier
    rev: v3.1.0
    hooks:
      - id: prettier
        args: [--write]
`

## Editor Integration

### VS Code Settings

`json
// .vscode/settings.json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit",
    "source.organizeImports": "explicit"
  },
  "eslint.validate": [
    "javascript",
    "typescript"
  ],
  "eslint.workflowFolder": ".vscode"
}
`

### Vim / Neovim

`lua
-- init.lua (Neovim)
-- ESLint integration
require('nvim-lint').use({
  linter_by_延迟 = {
    ['*'] = { 'eslint' },
    typescript = { 'eslint' },
  },
})

-- Prettier integration
require('formatter').setup({
  logging = false,
  filetype = {
    typescript = { require('formatter.filetypes.typescript').prettier },
    typescriptreact = { require('formatter.filetypes.typescriptreact').prettier },
  },
})
`

## Lint Fix Strategies

### Priority-Based Fixing

`ash
# 1. Safe automatic fixes (no review needed)
npm run lint:fix

# 2. Manual review needed for complex changes
git diff --name-only | head -20

# 3. Selective fixing for specific rules
eslint --fix --rule 'no-console: warn' src/

# 4. Disable rule inline when necessary
// eslint-disable-next-line no-console
console.log('temporary debug');
`

### Handling Conflicts

`ash
# If eslint and prettier conflict
# 1. Ensure prettier is last in extends
{
  "extends": [
    "eslint:recommended",
    "plugin:prettier/recommended"  // Must be last
  ]
}

# 2. Use eslint-config-prettier to disable conflicting rules
npm install --save-dev eslint-config-prettier
`

## Configuration Templates

### Base ESLint Config (Node.js)

`javascript
// eslint.config.mjs
import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import prettier from 'eslint-plugin-prettier';

export default [
  js.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      prettier,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      'prettier/prettier': 'error',
    },
  },
];
`

## Best Practices

### Do's
- Run lint:fix before commits to catch issues early
- Use CI gates to enforce linting on all PRs
- Configure editor to format on save
- Keep rules consistent across workspaces
- Use pre-commit hooks for automatic checks

### Don'ts
- Disable rules without understanding why
- Ignore warnings, treat errors as blocking
- Use multiple conflicting formatters
- Skip lint fixes in CI (let automated tools fix)
- Add too many custom rules (maintainability)

## Quick Reference

| Command | Description |
|---------|-------------|
| 
pm run lint | Check for linting issues |
| 
pm run lint:fix | Auto-fix issues |
| 
pm run format | Format code with Prettier |
| 
pm run format:check | Check formatting only |
| 
px eslint . --fix | Direct ESLint with auto-fix |
| 
px prettier --write . | Direct Prettier formatting |
