# S04 — PRD

**Date:** 2026-07-25

## 1. Overview
Make dependency installation reproducible and non-blocking.

## 2. User Stories
- As a dev, I want `npm ci` to succeed on a clean machine.

## 3. Functional Requirements
- FR-1: Remove `@huggingface/transformers` from `package.json` `dependencies`.
- FR-2: Create `src/ai/optionalModel.ts` that dynamically `import()`s the model only when an env flag/`optionalDependencies` present; wrap in try/catch with fallback UI.
- FR-3: Move model package to `optionalDependencies` (so base install skips native binary).
- FR-4: Add `.npmrc` with `omit=optional` for base installs + generous `fetch-timeout`/`fetch-retries`.
- FR-5: Verify `npm ci` succeeds in a clean checkout.

## 4. Non-Functional
- Install must not require network to `api.nuget.org`.

## 5. Acceptance Criteria
- Clean `npm ci` exits 0; `node_modules/onnxruntime-node` not required for base app to build.
- AI features show fallback when optional module absent.

## 6. Out of Scope
- Full AI feature rebuild (only optionalization).

## 7. Dependencies
- None (precedes S07 build gate).

## 8. Open Issues
- Confirm no other dep pulls nuget binaries (audit `package-lock.json`).
