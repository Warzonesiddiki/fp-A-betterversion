# Q5 — the `GLEntry` amount type: staged plan (DEC-051)

Audit P1-11's target state: _"amounts are a `Money` type (integer minor units +
currency) end to end."_ The requirement text is explicit that this is **Q5 — its
own DEC and staged plan — and must not be started under N8**.

This page is that plan. Stages 1–3 are implemented; stages 4–6 are not.

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

| #     | Stage                                                                 | Blast radius          | Entry criterion                          | Verification                                                                                             |
| ----- | --------------------------------------------------------------------- | --------------------- | ---------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| **1** | **`Money` type + exact arithmetic + serializer byte-identity**        | 0 (nothing adopts it) | —                                        | **SHIPPED** — 13 tests, mutation-checked                                                                 |
| **2** | **Real persisted GL fixture round-trip through the production stack** | **0**                 | Stage 1                                  | **SHIPPED** — 6 tests, mutation-checked; opened the sub-cent gate below                                  |
| **3** | **`TrialBalanceRow` + `AccountAnalysis` adopt `Money`**               | **6 files**           | Stage 2                                  | **SHIPPED** — 13 tests, mutation-checked; these are **derived, not persisted** (`partialize` omits both) |
| 4     | `GLEntry.debit/credit/netChange/amount` adopt `Money`                 | 98 files              | Stages 2–3                               | decode-as-money path proven; type errors are the worklist; every write surface already gated by DEC-048  |
| 5     | Engines and services adopt `Money`                                    | 32 files              | Stage 4                                  | Existing money test suites; consolidation FX converts at an explicit rate                                |
| 6     | Pages and components adopt `Money` for display                        | 108 files             | Stage 5, plus one shared display adapter | Route smoke tests; no page does arithmetic inline (already enforced by `money:ast`)                      |

**Stage 6 comes last and deliberately:** 102 of the 151 files are display-only,
so they can be converted mechanically once a single adapter renders `Money`. Doing
them earlier would create churn without changing any computation.

## Stage 2 result (2026-10-21) — a no-op at rest, and one gate opened

`src/store/glStore.moneyPersist.test.ts` drives the **production** stack —
`glStore.setEntries` → `masterStorage` → chunked storage → a real SQL.js image in
localStorage → AES-GCM — with the 41-row synthetic tie-out ledger, then decrypts
the record independently to read the bytes that are actually on disk.

| Property      | Result                                                                                                                           |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| At rest       | every money field of all 41 rows is `$d:<canonical>`; `jsonContainsNumericMoney` is false (INV-009)                              |
| Byte identity | persisting the same ledger with `Money` objects produces **the same plaintext** as persisting it with `number`                   |
| Restart       | a fresh module graph rehydrates all 41 entries exactly; `trialBalance` is empty (not persisted) and regenerates, and it balances |
| Old backups   | a pre-Q5 envelope with raw JSON numbers still hydrates — no migration step exists to run                                         |
| Exactness     | decoding `as: 'money'` gives integer minor units for every field, and debit cents equal credit cents                             |

Mutation-checked three ways: disabling the money-key branch fails 3 tests,
disabling the `Money` branch fails the byte-identity test, and changing the decode
default fails the gate test.

**The gate stage 4 must clear.** DEC-048 permits a row such as
`{ debit: 0.004, credit: 0 }` to already be stored — it is preserved with
`isValid: true`, because the ledger will not round money away. Any build since
W0.8.2 wrote such a row at rest as `$d:0.004`. Decoding that with `as: 'money'`
throws `InvalidMoneyError`, which is the correct refusal and also means
`masterStorage` **cannot** switch `glStore` to `as: 'money'` while sub-cent rows
can exist on disk. Stage 4 therefore needs one of:

1. **a hydrate policy for sub-cent rows** — keep them as-is, name them, and keep
   them out of `Money` aggregates. This is the honest option: DEC-048 already
   established that such a row is real money the ledger cannot represent, so
   dropping it on load would be a regression; or
2. **a finer minor-unit scale**, which is the three-decimal-currency question and
   so belongs to its own decision.

Today's behaviour (numbers in, numbers out, row preserved) is tested, not assumed.

## Stage 3 result (2026-10-21) — the derived rows are `Money`

`TrialBalanceRow` and `AccountAnalysis` money fields are `Money`. They are the
first values in the product to adopt the type, chosen because they are **derived
and never persisted**: `glStore.partialize` omits `trialBalance` and
`accountAnalysis`, and `glTrialBalanceStore.partialize` keeps only paging and
sort. Nothing on disk changed, so there was no migration to write.

| Change                                   | Why it was needed                                                                                                      |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `MoneyInput` includes `Money`            | `toDecimal` converts minor units exactly, so `sumMoney` / `roundTo` / `formatMoney` sites stay exact without a rewrite |
| `useCurrencyFormatter` accepts `Money`   | **One** display adapter — the leverage stage 6 depends on (102 page files)                                             |
| Sort comparator in `glTrialBalanceStore` | A `Money` cell compared as an object sorted every row as `"[object Object]"` — a silent grid corruption                |
| Integer-minor aggregation in the store   | Replaces `roundTo(...)` at the output boundary                                                                         |

### The refusal policy (forced by the type)

There is no `Money` equal to `0.004`. The old code accumulated in `Decimal` and
rounded to cents at the boundary, so a legacy sub-cent row contributed **zero**
to the view — the money disappeared rather than being refused. Stage 3 makes
`asMoney` refuse, and the action converts that into a visible state: the view is
emptied, `importStatus` becomes `error`, `importError` names the reason
("Trial balance not built: … sub-cent precision …"), and an error toast fires.

This is deliberate and it is the same question stage 4 faces on hydration. The
difference matters:

- **Here** it is an aggregate: refusing produces no wrong number.
- **On hydration (stage 4)** it is a row: refusing means the ledger does not open.
  That is why stage 4 still needs the hydrate policy described above, and why
  stage 3 shipping does not unblock stage 4.

### Display must not throw

The adapter converts a non-finite or unparseable value to an em dash instead of
raising. A formatter runs inside render, so a throw blanks the screen; the strict
gate belongs in `@/utils/money`, where money is computed and where refusing is
the right answer. This was found by a full-suite run: an existing panel formats
a `NaN` variance on purpose, and the first version of the adapter crashed it.

### Currency on a derived row

The row carries the currency when every contributing entry agrees, and carries
**none** when they disagree — never the first entry's code, which would state an
FX conversion that did not happen. Mixed-currency accounts are still summed
without conversion; that is DEC-051's open FX question and is recorded here as
known-incomplete rather than fixed.

### Evidence

`src/store/glStore.derivedMoney.test.ts` — **13/13**: a thousand one-cent rows
sum to exactly 1,000 minor units; `0.1 + 0.2 + 0.3` is `{ minor: 60 }` where the
float path gave `0.6000000000000001`; monthly totals and average balance exact;
currency propagation and mixed-currency omission; refusal leaves the view empty
and named; the grid sorts by amount in both directions; footer totals exact; and
`useCurrencyFormatter` renders `Money` at full precision, whole units,
parentheses for negatives, em dash for zero, compact, and custom. Mutation-checked
twice (sort comparator, currency merge). Five existing test files were updated
because their expectations encoded `number` rows or the retired
round-a-half-cent behaviour.

## Explicitly not decided here

- **Three-decimal currencies** (KWD/JOD/BHD/OMR/TND). `LEDGER_SCALE` is 2, and
  DEC-048 refuses finer precision. A real export in one of these currencies is
  the review trigger; the type supports a different scale only by changing the
  constant, which would be its own decision.
- **Whether `currency` ever becomes mandatory** on the row.
- **Cross-currency consolidation semantics** beyond "convert at an explicit rate
  into the reporting currency, then compare `Money` values".

## Not claimed

`GLEntry` amounts are still `number`, and stages 1–3 changed no stored shape.
Stage 3 changed _derived_ behaviour in one visible way: an amount the ledger
cannot represent now refuses the view instead of being rounded out of it.
Nothing here says the migration is cheap — it says it needs no data migration,
and that the display side has exactly one adapter to convert against.
