# Q5 — the `GLEntry` amount type: staged plan (DEC-051)

Audit P1-11's target state: _"amounts are a `Money` type (integer minor units +
currency) end to end."_ The requirement text is explicit that this is **Q5 — its
own DEC and staged plan — and must not be started under N8**.

This page is that plan. Stage 1 is implemented; stages 2–6 are not.

## Measured blast radius (2026-10-21, HEAD `dc0f5209`)

| Measure                                                     | Count      |
| ----------------------------------------------------------- | ---------- |
| Non-test files referencing `GLEntry`                        | **98**     |
| Non-test files touching `.debit` / `.credit` / `.netChange` | **151**    |
| Object-literal constructions of a money field               | **765**    |
| Money-field read occurrences                                | **~1,040** |

By area (files touching those fields):

| Area             | Files   |
| ---------------- | ------- |
| `src/pages`      | **102** |
| `src/engines`    | 16      |
| `src/services`   | 16      |
| `src/components` | 6       |
| `src/utils`      | 4       |
| `src/store`      | 3       |
| `src/workers`    | 1       |

**The migration is a presentation problem before it is a storage problem.** Two
thirds of the work is 102 page files that read an amount and render it.

## Why this is reversible (the decisive constraint)

`glStore` persists through `masterStorage`, which wraps zustand `persist` in
`encodeMoneyGraph` / `decodeMoneyGraph`:

- **At rest**, a money key holds `$d:<canonical decimal string>` — never a float
  (INV-009, `src/utils/moneySerialize.test.ts`).
- **On hydrate**, the default decode returns `number` for compatibility.

Stage 1 makes a `Money` value encode to _the same `$d:` string the numeric field
produces_, proved byte-for-byte in `src/utils/money.ledgerValue.test.ts`
(mutation-verified: removing the branch fails 4 tests). So:

- no data migration is required to change the in-memory type;
- backups written before the change stay readable;
- a rollback is a revert, not a conversion.

The server contract (`GlListedEntry.debit/credit` as JSON numbers) is unaffected
by an in-memory type; conversion happens at that boundary either way.

## Target model

**Integer minor units in memory, dollars at rest, currency on the entry.**

`Money = { minor: number; currency?: string }` at `LEDGER_SCALE` (2).

- `currency` is optional because a `GLEntry` row may carry none. Absence means
  "scoped to its entry", never "unknown, guess from elsewhere".
- Mixed-currency arithmetic throws `MoneyCurrencyMismatchError` instead of
  silently producing a meaningless number.
- `asMoney` refuses sub-cent precision (DEC-048); it never rounds.

**Rejected alternatives.**

| Option                                  | Why rejected                                                                                           |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `Money` with a _mandatory_ currency     | Most rows carry no currency today; mandating one forces a fabricated value, which DEC-043 forbids      |
| Branded `number` (`number & {__brand}`) | Runtime unchanged (still float), so no drift protection; it adds compile-time churn for no safety gain |
| Decimal.js instances in the row         | Heavy at 1,040 read sites, breaks structural equality and the `$d:` at-rest contract                   |

## Stages

Each stage must leave `tsc` green, the targeted suites green, INV-009 green, and
be revertible in one commit.

| #     | Stage                                                                 | Blast radius                    | Entry criterion                          | Verification                                                                                                 |
| ----- | --------------------------------------------------------------------- | ------------------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| **1** | **`Money` type + exact arithmetic + serializer byte-identity**        | 0 (nothing adopts it)           | —                                        | **SHIPPED** — 13 tests, mutation-checked                                                                     |
| 2     | Round-trip a real persisted GL fixture through `as: 'money'` and back | 0                               | Stage 1                                  | Byte-identical fixture in and out; restore test green                                                        |
| 3     | `TrialBalanceRow` + `AccountAnalysis` adopt `Money`                   | 3 store files, 5 derived fields | Stage 2                                  | `glStore.money.test.ts` + TB tests; these are **derived, not persisted** (`partialize` omits `trialBalance`) |
| 4     | `GLEntry.debit/credit/netChange/amount` adopt `Money`                 | 98 files                        | Stages 2–3                               | decode-as-money path proven; type errors are the worklist; every write surface already gated by DEC-048      |
| 5     | Engines and services adopt `Money`                                    | 32 files                        | Stage 4                                  | Existing money test suites; consolidation FX converts at an explicit rate                                    |
| 6     | Pages and components adopt `Money` for display                        | 108 files                       | Stage 5, plus one shared display adapter | Route smoke tests; no page does arithmetic inline (already enforced by `money:ast`)                          |

**Stage 6 comes last and deliberately:** 102 of the 151 files are display-only,
so they can be converted mechanically once a single adapter renders `Money`. Doing
them earlier would create churn without changing any computation.

## Explicitly not decided here

- **Three-decimal currencies** (KWD/JOD/BHD/OMR/TND). `LEDGER_SCALE` is 2, and
  DEC-048 refuses finer precision. A real export in one of these currencies is
  the review trigger; the type supports a different scale only by changing the
  constant, which would be its own decision.
- **Whether `currency` ever becomes mandatory** on the row.
- **Cross-currency consolidation semantics** beyond "convert at an explicit rate
  into the reporting currency, then compare `Money` values".

## Not claimed

`GLEntry` amounts are still `number`. Stage 1 adds a type and a proven boundary;
it changes no behaviour, and the 151-file conversion is untouched.
