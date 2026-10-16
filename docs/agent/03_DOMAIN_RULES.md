# 03 — Domain rules the code must enforce

These are accounting and FP&A invariants. Each has a status: **Enforced**
(a test fails if broken), **Partially enforced**, or **Required, not yet
enforced**. When you build anything that touches money, periods, or imports,
re-read this file and move at least one rule toward Enforced.

## Money

| Rule                                                                                                                                                                                   | Status                                                                                                                                  | Where                                        |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| All arithmetic on amounts goes through `src/utils/money.ts` (decimal.js, precision 40, `ROUND_HALF_UP`, 2 currency places by default). Floats are inputs/outputs at the boundary only. | Enforced by ratchet (`money:ast` = 0 unsafe ops in scanned paths); **not** by types — `GLEntry.debit/credit/amount` are still `number`  | `money.ts`, `scripts/money-ast-detector.mjs` |
| Control totals, tie-outs and allocations use integer cents or Decimal; never `a + b` on floats                                                                                         | Enforced in `importProvenance.computeControlTotals`, TB accumulators in `glStore`                                                       | `glStore.money.test.ts`                      |
| Allocation remainders are assigned deterministically (largest-remainder) so splits sum exactly                                                                                         | Enforced                                                                                                                                | `allocateMoney`, `money.test.ts`             |
| `NaN`, `Infinity`, empty strings are rejected (`InvalidMoneyError`), never coerced to 0                                                                                                | Enforced at the primitive; **import boundary coerces** via `toFiniteNumber(value, 0)` in `normalizeGLEntry` — a known weakness (FR-006) | `glStore.ts`                                 |
| Currency formatting uses `useCurrencyFormatter()` / `formatCurrency(value, { currency })`; never a local `formatCurrency`                                                              | Enforced by ESLint `no-restricted-syntax`                                                                                               | `eslint.config.js`                           |
| Target state: amounts are a `Money` type (integer minor units + currency) end to end                                                                                                   | Required, not yet enforced (P1-11)                                                                                                      | —                                            |

## Double entry and the GL

| Rule                                                                                                                                                                                                                                           | Status                                   | Where                                 |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- | ------------------------------------- | ----- | ----- | --------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| Every entry has `accountCode` (or `accountId`) and a date (`postDate` or `date`)                                                                                                                                                               | Enforced                                 | `validateEntries`                     |
| `debit ≥ 0`, `credit ≥ 0`; an `amount`-only row maps positive → debit, negative → credit                                                                                                                                                       | Enforced                                 | `validateEntries`, `normalizeGLEntry` |
| **Debits equal credits exactly (integer cents, zero tolerance) per journal batch.** Entries are grouped by `journalId`; entries without one form a single batch per import. Violations reject the whole import with an `FP-0002`-style message | Enforced                                 | `validateEntries` (F-0004)            |
| `netChange = debit − credit`, cent-rounded; `amount === netChange` after normalisation                                                                                                                                                         | Enforced                                 | `normalizeGLEntry`                    |
| `period` is `YYYY-MM` derived from the posting date unless supplied                                                                                                                                                                            | Enforced                                 | `normalizeGLEntry`                    |
| Account types: `Revenue                                                                                                                                                                                                                        | COGS                                     | OpEx                                  | CapEx | Asset | Liability | Equity`; normal balance and sign presentation per type | Partially (types exist; sign presentation rules are in engines, not documented centrally) | `src/types/index.ts:9`, `src/domain/chartOfAccounts.ts` |
| Trial balance: Σ debits = Σ credits over the ledger; per-account beginning + net = ending                                                                                                                                                      | Enforced in `generateTrialBalance` tests | `glStore.test.ts`                     |

## Imports (the Gate 2 contract — enforced by `src/store/glStore.provenance.test.ts`)

| Rule                                                                                                                                                                                                                          | Status                                                                |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- | ---------------------------------------------- | -------- |
| **Idempotent:** a file whose SHA-256 (or canonical row-content hash) was already imported successfully is rejected with the prior batch id and has zero state effect. Policy is _reject_, never merge or append               | Enforced                                                              |
| **Atomic on validation:** any validation error rejects the whole batch; nothing is committed                                                                                                                                  | Enforced                                                              |
| **Nothing silently discarded:** every rejected row carries `{row, code, reason}`; codes are `VALIDATION`, `DUPLICATE_ROW`, `DUPLICATE_FILE`. Rows the page could not parse are passed to the store and persisted on the batch | Enforced                                                              |
| **Provenance:** every committed entry carries `{batchId, fileHash, sourceFile, sourceRow}` (1-based; header = row 1)                                                                                                          | Enforced                                                              |
| **Control totals:** rows, debit, credit, net computed independently of the TB engine, decimal strings                                                                                                                         | Enforced                                                              |
| **Scope:** `{periods, dateRange, entities                                                                                                                                                                                     | 'unavailable', currencies                                             | 'unavailable', importedAt}` recorded per batch | Enforced |
| **Deterministic identity:** batch id = f(content hash, import instant from the injectable clock); entry ids derive from the batch id                                                                                          | Enforced                                                              |
| **Ledger duplicates** (same account, date, amount already present) are skipped per row and reported — policy to be confirmed under DEC-001                                                                                    | Enforced as implemented                                               |
| Export schema contract: required/optional columns, header mapping, drift behaviour, encodings, decimal separators                                                                                                             | **Required, not yet enforced** — needs DEC-001 and a synthetic sample |
| Source-side control totals (from the export) compared against imported totals; mismatch prevents "reconciled"                                                                                                                 | Required, not yet enforced (FR-004)                                   |
| Entity / currency / source system identity per batch when the file carries them                                                                                                                                               | Partially (recorded when present; no contract)                        |

## Periods and time

| Rule                                                                                 | Status                                                                                    |
| ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| All "now"/"today" reads go through `src/utils/clock.ts`; tests pin with `setClock()` | Enforced by ratchet per file (345 legacy sites remain; none may be added)                 |
| Period selection ("the period containing today") is a pure function of the clock     | Enforced for `PeriodClosePage` (3 suites pin `2026-08-07`)                                |
| Period close is a state machine with checks, closedAt/closedBy, reopen with reason   | Exists in `periodCloseStore`; semantics documented in `docs/architecture/period-close.md` |
| Fiscal calendar, time zone, reversals, opening balances                              | **Unknown** — discovery questions Q11–Q14; do not assume calendar = fiscal                |

## Missing, zero, invalid, unavailable

| Rule                                                                                                                        | Status                                                                                          |
| --------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| A metric is shown only when its required inputs exist; otherwise the UI shows an explicit unavailable state with the reason | **Required, not yet enforced** (FR-006, NFR-002). Many pages fall back to `?? 0` or sample data |
| Imports distinguish empty cell (→ 0 only for optional amount columns) from unparseable cell (→ rejection)                   | Enforced at `GLUploadPage` (`parseFinancialAmount` returns `NaN` → rejection)                   |
| Scope facts not in the file are `'unavailable'`, never defaulted                                                            | Enforced                                                                                        |

## Exceptions and findings (not yet built — design constraints)

- A rule has an id, a version, required inputs, thresholds, rationale and
  known limits. A finding references the rule id+version and the evidence
  rows (by provenance). The finding key is canonical (same inputs → same key)
  so re-runs do not duplicate findings.
- Language: "potential exception", "review candidate" — never "error",
  "wrong", "fraud" without a human disposition.
- Dispositions (`reviewed`, `expected`, `needs correction`, …) with note,
  user, time; persisted; history kept.
- Acceptance: a planted-exception synthetic company with an answer key;
  recall and false-positive bars run twice with identical output.

## Reporting and exports

- Exports consume the same calculation objects the screen uses; never
  recompute in the exporter. A cross-artifact tie-out test (UI == Excel ==
  PDF) is **required, not yet enforced** (P1-14).
- Colour is never the only signal (favourable/unfavourable also by sign,
  label or icon).

## Reference

Longer narrative: `docs/architecture/money.md`, `docs/architecture/period-close.md`,
`docs/architecture/data-integrity.md`, `docs/adr/ADR-004-decimal-js-financial-precision.md`.
If any of those contradict this file, this file (and the tests it cites) win.
