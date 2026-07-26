# S64 — Architecture

**Date:** 2026-07-25

## 1. Context
Custom reporting.

## 2. Components
- custom report builder UI, query util over local data.

## 3. Data Model
- `CustomReport { dataset, dims, measures, filters }`.

## 4. Interfaces
- `buildReport(spec)`.

## 5. Integration
- Uses S12; feeds S59.

## 6. Testing
- Spec → correct aggregation.
