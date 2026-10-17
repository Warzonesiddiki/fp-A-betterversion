# Latest from the Lead

> **Lead-maintained pointer for fast polling.** Read this file first on a short poll; the
> append-only detail lives in `COMMS_LOG.md`, ownership in `STATUS_BOARD.md`, files in
> `CLAIMS.md`, decisions in `docs/discovery/decision-log.md`.
> **Last update:** 2026-10-17 15:30 UTC

- **SOLO MODE.** All Gemini seats departed (roster: every seat Idle). The lead verifies and
  lands everything alone; departed seats' ACTIVE claims are revoked in `CLAIMS.md`. If a seat
  returns, re-claim per `../AGENT_JOIN_GUIDE.md` before touching files.

## Newest (solo session, 2026-10-17 — third block)

- **Full sharded suite measured** (this environment, Node 22.22.3): 7/8 shards green;
  **15,683 passed / 1 skipped / 1 failed**. The single failure was a deep upload test asserting
  the now-rejected signed amount; corrected and re-verified. Shard 6 re-run result recorded below
  when it finishes.
- **Requirements register corrected** where it understated the tree: FR-008/FR-009 are built and
  tested (32 tests, including rehydrate), so they are "Partial (branch)" — the missing piece is a
  page consumer, blocked by Gate 2/DEC-001, not the store work.
- **Signed debit/credit cells now rejected at parse time.** `parseGLRows` accepted `(500)` /
  `-75.5` and produced entries the store's `debit >= 0` / `credit >= 0` rule can never commit —
  the last row-level preview/import disagreement. New failing-first test; `parseGLRows.test.ts`
  **14/14**, preview **27/27**, import surfaces **138/138**.
- **Preview gate/import divergence fixed at the cause.** `GLDataPreview` validated only the first
  20 rows with its own `parseFloat` rules while claiming "N errors detected in M rows"; a bad row
  past the window left Confirm enabled. It now validates every row through `parseGLRows` (the
  import's own parser), numbers rows by source-file position, names off-window rejected rows with
  the importer's reason, states the display window exactly, and blocks confirmation. Failing-first:
  **8 red → 26/26**; `GLUploadPage.interop.test.tsx` **7/7** (row-26 gate block, store double-entry
  atomic rejection, corrected-file reprocessing = UX-002). `masterStorage.test.ts` measured **9/9
  green** — the handover's "missing unit" is stale.
- **`npm ci` repaired at HEAD.** The lockfile pinned `brace-expansion@1.1.21` under
  `minimatch@3.1.5` while the override requires ^2.1.7; a one-target resync (4 insertions,
  12 deletions) makes the documented install command exit 0.

## Prior block (2026-10-17 — second block)

- **P1-4 is complete across all four GL screens.** `GLUploadPage.interop.test.tsx` drives the
  real wizard end to end — real FileDropZone bytes → parseCSV → auto-map → real preview →
  real `importGLData` → real Alert — and asserts screen↔store agreement in one run: accepted
  counts with cent-exact control totals and batch/SHA-256/source-row provenance (entities and
  currencies honestly "not in file"), FR-003 byte-identical re-import refusal with the prior
  batch id and no financial effect, FR-002 whole-file rejection naming "row 26: missing
  accountCode" with entries and history untouched, and the preview gate blocking a bad row
  inside its window. **5/5** (`c879d3e8`).
- **Alert defect fixed at the cause, failing test first.** Every display-only `<Alert>` caller
  (GL upload errors ×2, BudgetCreatePage ×2, ReconciliationPanel, DataImportPage ×3) renders
  **nothing**, because the component only drew its Radix dialog for `open` — the wizard
  computed rejection reasons the user could never see; the deep test passed only because it
  mocks Alert. Probe proved red → 4 contract tests added → display-only shape now renders an
  inline `role="alert"` banner (dialog path untouched). **12/12, was 3 red** (`0751af7f`).
- **tokenBridge gate was already red on main (from `1f4b896b`).**
  `ExceptionReviewCard/List` read `var(--surface-subtle)` / `var(--bg-base)` — declared
  nowhere — so those panels and inputs rendered unstyled in both themes. Mapped to the
  declared `--bg-elevated` (the value the same file already uses for its other inset boxes).
  Existing contract = the failing-first test; **red → green, 152 tests** (`d5702168`).
- Earlier in this session: abandoned WIP landed with verification (`1f4b896b`, `1e9f3959`,
  `10dadb0f`, `eb7c4880`), journals interop (`21ef8ebf`), three abandoned-work defects fixed
  (invented-API engine test, fixture `batchId`, d365 float arithmetic), orphan
  `AnomalyExplainer.integration.ts` deleted, README store-count claim corrected from script.

## Gate state (measured, end of second solo block)

| Gate | Result |
| --- | --- |
| `npm run tsc` | EXIT 0 |
| `npm run lint` | EXIT 0 (was 17 problems in abandoned files) |
| `npm run format:check` | EXIT 0 |
| `npm run money:ast` | EXIT 0 — 0 unsafe ops (was 2) |
| `npm run determinism:ratchet` | HOLDS — 344 sites / 79 files |
| `npm run docs:verify` | EXIT 0 (was: store count 46 vs measured 48) |
| `npm run docs:links` | 0 broken, 0 bad citations (strict) |
| `npm run engines:verify` | EXIT 0 (182 engines) |
| `tokenBridge.contract.test.ts` | GREEN (was: 6 dangling-var offenders from `1f4b896b`) |
| `GLDataPreview.test.tsx` | GREEN 26/26 (was 8 red; 20-row window + private rules) |
| `GLUploadPage.interop.test.tsx` | GREEN 7/7 (was 5/5; gate now blocks row 26, UX-002 reprocess) |
| `masterStorage.test.ts` | GREEN 9/9 (exists; handover's "missing" claim corrected) |
| `npm run test:sharded` | 7/8 shards green; 15,683 passed / 1 skipped / 1 failed pre-fix; shard 6 re-run after fix |
| Alert-consumer suites (final files) | 9 files / 116 tests green |
| Theme + exception suites | 4 files / 152 tests green |

## Landed by the lead (all time)

| Unit | Evidence | Commit |
| --- | --- | --- |
| Preview gate parity with the import parser + lockfile resync | 8 red → 26/26; interop 7/7; `npm ci` 0 | this session |
| Upload wizard interop (P1-4, fourth screen) + Alert inline-banner fix | 5/5 + Alert 12/12 (was 3 red) | `c879d3e8`, `0751af7f` |
| tokenBridge dangling-token repair (pre-existing red from `1f4b896b`) | red→green, 152 tests | `d5702168` |
| Journals screen interop (P1-4, third screen) | 4/4 tests green | `21ef8ebf` |
| FR-008/009 exception path (departed-seat WIP) | catalogue 16 + store 8 + pipeline 2 + components 2 | `1f4b896b` |
| Board-pack tie-out (departed-seat WIP) | 3/3 integration tests | `10dadb0f` |
| D365 parser (departed-seat WIP + money fix) | 15/15 tests, money:ast 0 | `1e9f3959` |
| Synthetic tie-out fixture (departed-seat WIP + repair) | 7/7 tests | `eb7c4880` |
| FR-006 hydrate-guard verification (F-01) | probe 4/4, ACCEPT | `b8e50292` |
| Trial balance + explorer interop tests | 7 + 5 tests | `8db89e75`, `4128c1d0` |
| DEC-013/DEC-014 publish | docs:links clean | `86ec1992` |

**Next units:** backlog P1-5 "template-clone honesty" audit, then another measured P0/P1 gap.
`src/utils/masterStorage.test.ts` exists and is green (9/9) — the earlier "no file exists" note
was stale. D365 parser claims stay "expected, not verified" until the owner supplies a real
anonymized export (DEC-001).

## Read next

- `../SQUAD_BACKLOG.md` (priority) · `STATUS_BOARD.md` (who owns what) · `BLOCKERS.md` (open)
