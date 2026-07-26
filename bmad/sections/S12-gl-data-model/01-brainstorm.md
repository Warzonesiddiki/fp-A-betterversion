# S12 — Brainstorming: GL Data Model

**Date:** 2026-07-25
**Method:** First Principles · SCAMPER · Ideation Map

## 1. First Principles
- The General Ledger is the **single source of truth** for every statement, variance, and consolidation.

## 2. SCAMPER
- **Confirm:** existing `glStore` (Zustand) + GL types.
- **Add:** strict `GLEntry`/`Account` types; `validateEntries`; `importGLData`.
- **Modify:** sample/mock data generator for demos + tests.

## 3. Ideation
- Entries → accounts → trial balance → journals (downstream in S15/S16).

## 4. Selected Directions
1. Define canonical GL types; harden `glStore` (no `any`); add validation + import path.
2. Provide deterministic mock GL data.

## 5. Open Questions
- Do we need multi-currency in raw GL? (Yes → links S73/S74.)
