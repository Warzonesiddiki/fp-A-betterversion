# S33 — Architecture

**Date:** 2026-07-25

## 1. Context
Specialized accounting.

## 2. Components
- `src/engines/{DepreciationEngine, LeaseEngine, TaxEngine}.ts`.

## 3. Data Model
- `Asset`, `LeaseContract`, `TaxRules`.

## 4. Interfaces
- `depreciationSchedule`, `leaseLiability`, `taxProvision`.

## 5. Integration
- Used by lease/tax/capex pages; feeds statements.

## 6. Testing
- Standard-compliance unit tests.
