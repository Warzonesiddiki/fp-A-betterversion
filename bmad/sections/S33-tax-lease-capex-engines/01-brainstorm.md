# S33 — Brainstorming: Tax / Lease / CapEx Engines

**Date:** 2026-07-25
**Method:** First Principles · SCAMPER · Ideation Map

## 1. First Principles
- Specialized accounting must follow standards (IFRS16/ASC842, depreciation).

## 2. SCAMPER
- **Confirm:** tax/lease/capex engines exist (20+ tax, 22+ lease, 18+ capex per README).
- **Add:** depreciation schedules, lease liability, tax provision.
- **Modify:** feed S78/S79-adjacent + reports.

## 3. Ideation
- `depreciationSchedule(asset)`, `leaseLiability(...)`.

## 4. Selected Directions
1. Tax/lease/capex engines: depreciation, lease (IFRS16), tax optimization.
2. (Code exists; complete + test.)

## 5. Open Questions
- Useful life defaults? (configurable per asset class.)
