# S24 — PRD

**Date:** 2026-07-25

## 1. Overview
Data integrity + schema version verification.

## 2. FRs
- FR-1: Each snapshot stores `schemaVersion` + checksum.
- FR-2: On load, validate version (migrate if newer) + checksum (warn if mismatch).
- FR-3: Expose `verifyIntegrity()` for diagnostics.

## 3. Acceptance
- Tampered snapshot → warning; old version → migrate prompt.

## 4. Out of Scope
- Auto-repair.

## 5. Dependencies
- S21–S23.
