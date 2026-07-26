# S20 — Brainstorming: GL Migration Tools

**Date:** 2026-07-25
**Method:** First Principles · SCAMPER · Ideation Map

## 1. First Principles
- Moving GL from legacy/ERP systems must be mapped, not lost.

## 2. SCAMPER
- **Add:** mapping templates per source system; validation before commit.
- **Modify:** reuse S13 parser + S14 CoA mapping.

## 3. Ideation
- Source profile → field map → CoA map → import via S12.

## 4. Selected Directions
1. `MigrationPage`/`MigrationWizard`: map legacy GL → FinPlan GL.
2. (Tasklist `MigrationPage` exists.)

## 5. Open Questions
- Support which ERPs? Start with CSV-template + QuickBooks/Xero CSV.
