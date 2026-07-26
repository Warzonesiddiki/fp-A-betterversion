# S24 — Research

**Date:** 2026-07-25

## 1. Questions
- Integrity mechanisms?

## 2. Findings
- No explicit integrity/checksum in current storage.
- SQLite has `user_version` pragma (used in migrations).

## 3. Decision
- Add version + checksum validation on load; warn on mismatch.

## 4. Risks
- Checksum cost on large stores → sample/hash metadata.

## 5. Dependencies
- S21, S22, S23.
