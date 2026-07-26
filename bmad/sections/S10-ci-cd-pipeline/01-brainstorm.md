# S10 — Brainstorming: CI/CD Pipeline

**Date:** 2026-07-25
**Method:** First Principles · SCAMPER · Ideation Map

## 1. First Principles
- Every push must prove buildability: typecheck → lint → test → build → bundle.

## 2. SCAMPER
- **Confirm:** GitHub Actions (`.github/workflows`).
- **Add:** caching (node_modules, vitest), artifact upload.
- **Modify:** order tsc→lint→test→build→bundle-check.

## 3. Ideation
- PR gate + main branch gate; fail fast.

## 4. Selected Directions
1. Single workflow: install (cached) → typecheck → lint → test → build → bundle-check.
2. Tauri build as separate job (Linux/macOS/Windows).

## 5. Open Questions
- Test suite long (957+ files) → use CI sharding or timeout budget.
