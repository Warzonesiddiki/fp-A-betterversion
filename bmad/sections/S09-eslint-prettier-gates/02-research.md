# S09 — Research

**Date:** 2026-07-25

## 1. Questions
- Lint setup correctness for ESLint 9 + Prettier?

## 2. Findings
- `eslint.config.js` exists (ESLint 9 flat). `package.json` lint uses `--fix`.
- `lint-staged` + `.lintstagedrc.json` + husky present.
- `--max-warnings 0` recommended for zero-compromise.

## 3. Decision
- CI runs `eslint src` (no --fix) with `--max-warnings 0`; pre-commit uses lint-staged --fix.

## 4. Risks
- Initial cleanup may surface many warnings; phase via S93.

## 5. Dependencies
- S10 (CI).
