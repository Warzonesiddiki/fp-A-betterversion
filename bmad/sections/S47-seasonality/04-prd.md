# S47 — PRD

**Date:** 2026-07-25

## 1. Overview
Seasonality presets + custom factors.

## 2. FRs
- FR-1: Presets (retail Q4 peak, agriculture, etc.).
- FR-2: Custom 12-factor array; normalize sum=1.
- FR-3: `applySeasonality(base, factors)`.

## 3. Acceptance
- Factors normalize; applied monthly weights correct.

## 4. Out of Scope
- UI (→ S49).

## 5. Dependencies
- S32, S76.
