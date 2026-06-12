---
date: 2026-06-06
type: adr
project: FinPlan Pro
tags: [finplan-pro, currency, ias21, asc830, translation, multi-currency]
status: accepted
---

# ADR-001: Currency Translation Method Default (Closing Rate vs Average Rate)

## Context

FinPlan Pro's MultiCurrencyEngine must comply with IAS 21 (The Effects of Changes in Foreign Exchange Rates) and ASC 830 (Foreign Currency Matters) for translating foreign operations into the presentation currency. The standard requires different translation rates for different financial statement elements:

- **IAS 21 ¶31 / ASC 830-30-30**: Assets and liabilities at the **closing rate** (spot rate at reporting date)
- **IAS 21 ¶31 / ASC 830-30-30**: Income and expenses at **exchange rates at the dates of transactions** (practically: weighted average rate for the period)
- **IAS 21 ¶31 / ASC 830-30-30**: Equity at **historical rates** (rate at date of transaction/contribution)
- **IAS 21 ¶39 / ASC 830-30-45**: Resulting translation differences (CTA) recognised in **OCI** (not P&L)

The engine previously lacked a documented default for which rate to use when the caller does not explicitly specify.

## Decision

**Default to the closing rate for balance sheet translation (current rate method) and average rate for income statement translation, per IAS 21 ¶31.**

The `MultiCurrencyEngine.translateBalanceSheet` method implements the current rate method as the default translation approach:

- Assets/Liabilities → `closingRate` (required by IAS 21 ¶31(a))
- Revenue/Expenses → `averageRate` (acceptable practical expedient per IAS 21 ¶40)
- Equity → `historicalRate` (required by IAS 21 ¶31(c))
- CTA → accumulated in OCI via `calculateTotalCTA`

The `MultiCurrencyEngine.remeasure` method implements the temporal method (ASC 830-10-45) for remeasurement into functional currency:

- Monetary items → `closingRate`
- Non-monetary items → `historicalRate`
- Remeasurement gain/loss → **P&L** (not OCI)

## Rationale

1. **IAS 21 ¶31 is mandatory** for foreign operations translation — the current rate method is the prescribed approach
2. **Closing rate for assets/liabilities** reflects current economic reality at reporting date
3. **Average rate for income/expenses** is the accepted practical expedient (IAS 21 ¶40) vs. transaction-by-transaction rates
4. **Equity at historical rates** preserves the original capital contribution measurement
5. **CTA to OCI** (not P&L) prevents translation volatility from distorting operating performance
6. **Remeasurement (temporal method)** is distinct from translation — used when functional currency ≠ local currency; gains/losses hit P&L per ASC 830-20-35

## Consequences

### Positive

- Full IAS 21 ¶31 + ¶39 compliance for foreign operation translation
- Full ASC 830 compliance for both translation and remeasurement
- CTA tracking enables proper OCI reporting and disposal recycling (IAS 21 ¶48)
- Clear separation: translation → OCI, remeasurement → P&L

### Negative

- Requires maintaining three rate series (closing, average, historical) per currency pair
- Average rate calculation must be volume-weighted for precision (see `getWeightedAverageRate` fix)
- Historical rates for equity require transaction-level tracking

## Implementation Notes

1. **Rate hierarchy in `translateBalanceSheet`**: closing > average > historical — caller must supply all three
2. **`getWeightedAverageRate`** renamed/fixed to compute volume/time-weighted average (not simple mean)
3. **CTA accumulation**: `calculateTotalCTA` sums per-line CTA for OCI presentation
4. **Disposal handling**: Not yet implemented — future work to recycle CTA to P&L on disposal (IAS 21 ¶48)
5. **Hyperinflationary economies** (IAS 29): Not yet handled — requires restatement before translation

## Alternatives Considered

| Method                | Assets/Liab | Income/Exp | Equity     | CTA   | Use Case                           |
| --------------------- | ----------- | ---------- | ---------- | ----- | ---------------------------------- |
| Current Rate (chosen) | Closing     | Average    | Historical | OCI   | Foreign ops (IAS 21 default)       |
| Temporal              | Closing     | Closing\*  | Historical | P&L   | Functional ≠ Local (remeasurement) |
| Monetary/Non-monetary | Mixed       | Mixed      | Mixed      | Mixed | Legacy/partial                     |

\* Temporal uses closing for monetary, historical for non-monetary income/expense

## References

- IAS 21 ¶31, ¶39, ¶40, ¶48
- ASC 830-10, 830-20, 830-30
- `src/engines/MultiCurrencyEngine.ts` lines 107-201
