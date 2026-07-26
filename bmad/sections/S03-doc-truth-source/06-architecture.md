# S03 — Architecture

**Date:** 2026-07-25

## 1. Context
Documentation governance; no runtime code.

## 2. Components
- `DOCS_MAP.md` (new)
- `README.md` (edit badge)
- `docs/` (prune/quarantine)
- `reports/` (prune → archive)

## 3. Data Model
- DOCS_MAP entry: `Doc | Owner (concern) | Status`.

## 4. Interfaces
- Referenced by all sections' "Documentation" notes.

## 5. Integration
- None.

## 6. Performance/Security
- N/A.

## 7. Testing
- Validation: `DOCS_MAP.md` exists; README badge text accurate; grep root for "Production-Ready" returns only historical/archived context.
