# S18 — PRD

**Date:** 2026-07-25

## 1. Overview
Two-file reconciliation with tolerance + diff export.

## 2. FRs
- FR-1: Load two datasets (CSV/XLSX).
- FR-2: Configurable match key + tolerance (default 1%).
- FR-3: Side-by-side results: matched / only-in-A / only-in-B / amount-diff.
- FR-4: Export differences to CSV.

## 3. Acceptance
- Known-diff fixture → correct diffs + export.

## 4. Out of Scope
- Auto-fix.

## 5. Dependencies
- S12.
