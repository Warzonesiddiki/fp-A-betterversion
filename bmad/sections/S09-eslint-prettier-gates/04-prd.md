# S09 — PRD

**Date:** 2026-07-25

## 1. Overview
ESLint + Prettier enforced with zero warnings.

## 2. FRs
- FR-1: `eslint.config.js` includes typescript-eslint, jsx-a11y, prettier.
- FR-2: `npm run lint:ci` = `eslint src --max-warnings 0` (no --fix).
- FR-3: husky pre-commit → lint-staged (format + lint changed files).
- FR-4: Prettier config present; `format` script.

## 3. Acceptance
- CI lint exits 0 with 0 warnings.

## 4. Out of Scope
- Remediation of existing warnings (→ S93).

## 5. Dependencies
- S10.
