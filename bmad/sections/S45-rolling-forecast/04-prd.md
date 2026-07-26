# S45 — PRD

**Date:** 2026-07-25

## 1. Overview
Rolling forecast engine + UI.

## 2. FRs
- FR-1: `rollingForecast(history, method, horizon)` → future periods.
- FR-2: As periods close, past = actual; window shifts forward.
- FR-3: UI shows horizon + method.

## 3. Acceptance
- Window extends on period close; past matches actual.

## 4. Out of Scope
- Approval (→ S38).

## 5. Dependencies
- S32, S44, S12, S86.
