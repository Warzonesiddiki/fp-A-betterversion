---
date: 2026-05-19
type: feature
project: FinPlan Pro
tags: [finplan-pro, engine, fx, currency, consolidation]
status: current
---

# FXEngine — Currency Conversion & ASC 830 Translation

**File:** `src/engines/FXEngine.ts` (139 lines)

## API

| Method | Signature | Purpose |
|--------|-----------|---------|
| `getRate` | `(from, to, date?) → number` | Exchange rate lookup with optional date |
| `convert` | `(amount, from, to, date?) → number` | Currency conversion with NaN safety |
| `setRate` | `(from, to, rate, date, source) → void` | Manual rate entry |
| `getHistoricalRates` | `(from, to, startDate, endDate) → HistoricalRate[]` | Rate history for range |
| `translateForConsolidation` | `(input: TranslationInput) → {translated, rateUsed, rateType}` | ASC 830 translation |
| `getAverageRate` | `(from, to, period) → number` | Average rate for period |

## Rate Types (ASC 830)

- **closing** — balance sheet items at period-end rate
- **average** — income statement items at average rate
- **historical** — equity items at historical rate
- **transaction** — specific transaction date rate

## Data Model

- `FXRateEntry` — from, to, rate, date, source (manual/api/feed)
- `HistoricalRate` — date, rate
- `TranslationInput` — amount, rateType, entityCurrency, parentCurrency, period

## Integration Points

- Used by [[consolidation]] (ConsolidationEngine) for multi-entity FX translation
- Used by `FXRatesPage` for rate management UI
- Used by `HedgeManagementPage` for hedge positions
- FX audit trail logged via [[compliance]] engine
