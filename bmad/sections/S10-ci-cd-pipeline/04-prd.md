# S10 — PRD

**Date:** 2026-07-25

## 1. Overview
GitHub Actions pipeline enforcing quality gates.

## 2. FRs
- FR-1: `.github/workflows/ci.yml`: checkout → setup-node 22 → `npm ci` (cached) → typecheck → lint:ci → test → build → bundle-check.
- FR-2: Test job uses vitest with timeout; optional sharding.
- FR-3: Separate `tauri-build` job (ubuntu/macos/windows) for S97.
- FR-4: Branch protection requiring CI on `main`.

## 3. Acceptance
- New PR triggers CI; all gates green to merge.

## 4. Out of Scope
- Deployment/release automation (→ S100).

## 5. Dependencies
- S04, S08, S09, S11.
