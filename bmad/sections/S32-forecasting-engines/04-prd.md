# S32 — PRD

**Date:** 2026-07-25

## 1. Overview
Forecasting calculation engines.

## 2. FRs
- FR-1: `forecastLinear(series, periods)`, `forecastRegression(...)`, `forecastSeasonal(...)`.
- FR-2: Auto-fill helpers: CAGR, last-3, linear.
- FR-3: Return with confidence band (optional).

## 3. Acceptance
- Known series → expected forecast per method.

## 4. Out of Scope
- UI (→ S43–S49).

## 5. Dependencies
- S26.
