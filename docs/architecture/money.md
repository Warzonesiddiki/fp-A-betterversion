# Money Primitive Architecture

## Overview

FinPlan Pro enforces a zero-tolerance policy against floating-point rounding errors in financial computations. Raw JavaScript `number` (IEEE 754 float) is banned in financial calculation paths.

## The Money Primitive (`src/utils/money.ts`)

- Encapsulates monetary values as exact integer minor units (cents) or via `Decimal.js` high-precision decimals.
- Prevents catastrophic float accumulation during multi-currency translation, consolidation, tax allocation, and compound interest calculations.
- Provides arithmetic operators (`add`, `subtract`, `multiply`, `divide`, `allocate`) with deterministic rounding modes (half-even / banker's rounding).

## Migration & Enforcement

- Adopter modules include `ConsolidationEngine` and `glStore`.
- ESLint rule `no-raw-float-money` prohibits raw float arithmetic in financial models.
