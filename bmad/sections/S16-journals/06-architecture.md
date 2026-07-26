# S16 — Architecture

**Date:** 2026-07-25

## 1. Context
GL browsing.

## 2. Components
- `src/pages/data/GLJournalsPage.tsx`, selectors over `glStore`.

## 3. Data Model
- Filtered `GLEntry[]` + page cursor.

## 4. Interfaces
- `selectJournalEntries(filters, page)`.

## 5. Integration
- Links to S17 (account analysis).

## 6. Testing
- Filter by account returns subset; pagination boundaries.
