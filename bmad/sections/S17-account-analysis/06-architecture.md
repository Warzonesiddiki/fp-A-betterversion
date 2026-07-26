# S17 — Architecture

**Date:** 2026-07-25

## 1. Context
Account-level analytics.

## 2. Components
- `src/pages/data/GLAccountAnalysisPage.tsx`, analysis engine.

## 3. Data Model
- `AccountTrend { month, debit, credit, net, runningBalance }`.

## 4. Interfaces
- `analyzeAccount(entries, accountCode) → AccountTrend[]`.

## 5. Integration
- Reads S12 store; reached from S16.

## 6. Testing
- Running balance correctness on fixture.
