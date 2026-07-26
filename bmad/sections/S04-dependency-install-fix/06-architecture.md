# S04 — Architecture

**Date:** 2026-07-25

## 1. Context
Dependency/build foundation. Blocks all later build/test work.

## 2. Components
- `package.json` (remove hard transformers dep; add optionalDependencies)
- `.npmrc` (omit=optional, timeouts)
- `src/ai/optionalModel.ts` (lazy, guarded import)
- AI UI components (fallback state)

## 3. Data Model
- N/A.

## 4. Interfaces
- `optionalModel.load()` → model | null (null = fallback).

## 5. Integration
- AI components call `optionalModel`; no change to rest of app.

## 6. Performance/Security
- Smaller base install; no native binary in default path.

## 7. Testing
- `npm ci` in clean dir → exit 0; unit test `optionalModel` returns null when absent.
