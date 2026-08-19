---
id: MEMORY/SCHEMA/TYPES.md
status: active
last_verified: 2026-08-18
verified_by: arena-agent/session-017
confidence: high
---

# SCHEMA/TYPES — core types

- `src/types/index.ts` → `GLEntry` (verified fields): `id, accountId, accountCode, accountName,
  period, periodName, debit, credit, netChange, date, postDate?, amount, description, reference,
  entityId?, departmentId?, currency?, fiscalPeriod?, department?, entity?, journalId?,
  journalLine?, source?`.
  Note both `debit`/`credit` **and** a signed `amount` exist; some import paths populate only
  `amount`. Derivation modules must handle both (see `dashboardModel.hasDebitCredit`).
- `src/types/sector-types.ts` → sector configs + KPI specs (`defaultKPIs` with `accountCodes`),
  and a `denialRate: number` field on a healthcare stats shape.
- `src/utils/money.ts` → `MoneyInput = number | string | Decimal`, `InvalidMoneyError`,
  `toDecimal`, `roundMoney`, `roundTo`, `addMoney`, `subtractMoney`, `multiplyMoney`,
  `divideMoney` (throws on zero divisor), `sumMoney`, `compareMoney`, `moneyEquals`, `toCents`.
- Account-code prefixes: `1 Asset · 2 Liability · 3 Equity · 4 Revenue · 5 COGS · 6 OpEx ·
  7 Interest · 8 Income tax`.
