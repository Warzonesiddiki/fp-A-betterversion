# S09 — Architecture

**Date:** 2026-07-25

## 1. Context
Static analysis gate.

## 2. Components
- `eslint.config.js`, `.prettierrc`, `.lintstagedrc.json`, husky hooks.

## 3. Data Model
- N/A.

## 4. Interfaces
- lint → exit code.

## 5. Integration
- Runs after typecheck in CI (S10).

## 6. Testing
- `eslint src --max-warnings 0` = 0.
