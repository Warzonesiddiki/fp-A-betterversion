# S20 — Research

**Date:** 2026-07-25

## 1. Questions
- Migration pages status?

## 2. Findings
- `src/pages/data/MigrationPage.tsx`, `MigrationWizard.tsx` exist (lazy).
- Overlaps S13 (upload) — consolidate to avoid duplication.

## 3. Decision
- Migrate via shared mapping engine; Migration = preset mappings for known sources.

## 4. Risks
- Duplication with S13; refactor to share parser.

## 5. Dependencies
- S12, S13, S14.
