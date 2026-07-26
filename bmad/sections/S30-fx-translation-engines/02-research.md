# S30 — Research

**Date:** 2026-07-25

## 1. Questions
- FX engine status?

## 2. Findings
- README: FX translation engines exist. `FXRatesPage` exists (S73).
- Translation methods: average (IS), closing (BS), historical (equity/PP&E).

## 3. Decision
- Implement 3-method translation + CTA; source rates from S73.

## 4. Risks
- Rate table gaps → interpolate/error.

## 5. Dependencies
- S29, S73.
