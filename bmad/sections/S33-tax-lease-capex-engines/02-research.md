# S33 — Research

**Date:** 2026-07-25

## 1. Questions
- Tax/lease/capex engine status?

## 2. Findings
- README: 20+ tax, 22+ lease (IFRS16/ASC842), 18+ capex engines.
- `LeaseDashboard`, `TaxProvisionPage`, `CapExDashboard` pages exist.

## 3. Decision
- Verify standards compliance; add tests for depreciation/lease liability.

## 4. Risks
- Standard nuances (discount rate for lease).

## 5. Dependencies
- S26, S27, S28.
