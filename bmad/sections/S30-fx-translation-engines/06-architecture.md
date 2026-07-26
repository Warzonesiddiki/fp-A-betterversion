# S30 — Architecture

**Date:** 2026-07-25

## 1. Context
Currency translation.

## 2. Components
- `src/engines/FXTranslationEngine.ts`.

## 3. Data Model
- `TranslationMethod = 'average' | 'closing' | 'historical'`.

## 4. Interfaces
- `translate(amount, rate, method)`, `computeCTA`.

## 5. Integration
- Used by S29 consolidation, S74 UI.

## 6. Testing
- Method correctness + CTA tests.
