# Latest from the Lead

> **Historical pointer — last updated 2026-10-18; not current status.** This page was a
> lead-maintained polling summary for a historical squad. Its gate results, owners, blockers,
> backlog positions, and next steps are dated claims; they are not current evidence and may be
> superseded. Do not use it as a live pointer unless a squad is explicitly activated and this
> page is refreshed against the current tree. Current authority is root `AGENTS.md`, the active
> Arena instructions, `docs/agent/WORKING_AGREEMENT.md`, the mission state, and the current audit.
>
> **Last update recorded in this historical snapshot:** 2026-10-18 12:10 UTC (17:10 local)

- **SOLO MODE.** All Gemini seats departed (roster: every seat Idle). The lead verifies and
  lands everything alone; departed seats' ACTIVE claims are revoked in `CLAIMS.md`. If a seat
  returns, re-claim per `../AGENT_JOIN_GUIDE.md` before touching files.

## Newest (solo session, 2026-10-18)

- **The 3 known Node-26 suite failures are fixed (env caveat closed, tests not weakened).**
  `sqlJsStorage` ×2 + `backupRestore` ×1 spied `Storage.prototype`, which the Node-26
  `localStorage` polyfill (`src/test/setup.ts`) never routes through. All three sites now spy
  the `localStorage` instance — the injection point `masterStorage.security.test.ts` already
  documents — with **every assertion unchanged**. Both files **39/39** (were 2 + 1 red);
  probe proved instance spying also intercepts inherited methods, so Node 22 is unaffected.

- **FR-010 store layer — queue Q3 closed with evidence.** The disposition store now carries the
  accounts-team hand-off: `CorrectionRequest` with instruction + assignee (both refused empty),
  a calendar-checked due date (`2026-02-30` throws; an agreed absence stays `null`, never
  "today"), source locator, `REQUESTED → APPLIED | WITHDRAWN` status and an append-only audit
  trail; persist blob v1 → v2 defaults old blobs to *no* corrections. `src/store/exceptionDispositionStore.test.ts`
  **17/17 green; 10 of 17 red** with the two implementation files reverted to HEAD (measured
  17:32 local). Register FR-010 → **Partial**; reviewer UI + exported list still blocked on
  Q4/DEC-002.

- **P0 backlog item 2 — board-pack tie-out to screen — closed with evidence.** `BoardPackPage`
  builds its own export rows from `computeBoardPackReport` and hands them to the real
  `ExportEngine.exportToExcel`; nothing proved those bytes carried the figures the pack shows.
  The new `src/pages/reports/BoardPackPage.exportTieOut.test.tsx` seeds one synthetic ledger into
  the real `glStore`/`budgetStore`, renders the real page, presses the real **Export Excel**
  button and parses the real workbook back, holding *oracle == on-screen figure == cell*. Only the
  browser ends (`file-saver`, the global lucide mock) are mocked.
- **It found a real divergence.** `report.grossMargin` was published as a bare number under a
  "Gross Margin %" label, and `exportExcel` applies `$#,##0.00` to every numeric data cell — so
  the workbook said **$76.00** where the screen, the PDF branch and the printed pack said
  **76.0%**. Fixed at the cause by publishing the same `formatPercent(x, 1)` string the PDF branch
  already uses; a null margin stays `—`.
- **Failing-first, measured:** with the one-line page fix reverted, **2 of 3** tests fail
  (`expected 76 to be '76.0%'` / `expected 76 not to be 76`); with it restored, 3/3. Existing
  board-pack suites unchanged (18/18 across `.test`, `.probe.test`, `.money.test`,
  `.exportTieOut.test`).
- **Scope honesty:** the PPT deck `docs/VISION.md` asks for does not exist and needs a new
  dependency, so the item closes for Excel only and says so; the PDF leg stays untested.
- **The owner's goal is now written down where agents read it.**
  `docs/agent/WORKING_AGREEMENT.md` holds the owner's statement verbatim (D365 GL dump → find the
  wrong entries → guide the accounts team to fix them → day/month/year comparison in extreme
  detail), what the tree does and does not do for each of the four jobs, the done bar and the live
  queue; it is registered in `docs/agent/00_INDEX.md` and `docs/README.md`. The two new requirements it
  records are **FR-010** (correction hand-off with an owner and a due date) and **FR-011**
  (day / month / year comparison at account level).
- **P1 item 4 closed the same day it was measured — as a class.** `exportPercentHonesty.test.tsx`
  drives all six pages (real stores, real `ExportEngine`, real workbook parsed back):
  **6 red → 6/6 green**. The pages print the string their own screens print, `InsurancePage`'s
  `?? 0` is gone (an unsupportable ratio is `N/A`, not `$0.00`), and three inverted assertions keep
  money numeric so "stringify everything" cannot pass. Affected suites **14 files / 92 tests**.
- **A gate that could not fail, found and repaired.** `scripts/ratchet-docs-check.mjs` matched
  `--prose=` overrides with `endsWith('/' + basename)`, which never matches a Windows `resolve()`
  path — so the checker silently re-read the live file and 3 of its 7 mutation tests were vacuous
  (that is what failed shard 8 of the first full run today). Now matched with `path.basename`;
  **7/7**, and `docs:verify` still exits 0.
- **Earlier measured defect, now closed.** The currency rule is engine-wide, not a board-pack
  bug: **six pages still publish a percentage (or a `0` standing in for a missing ratio) into their
  Excel export** while their PDF branch prints `12%` / `N/A` — `GovernmentPage.tsx:113`,
  `InsurancePage.tsx:105-107` (the `?? 0` is also a missing-not-zero violation),
  `LogisticsPage.tsx:117`, `UnderwritingPage.tsx:39-41`, `FXExposurePage.tsx:228`,
  `PromoAnalysisPage.tsx:179`. Recorded as backlog **P1 item 4** with the file:line evidence in
  `docs/agent/09_KNOWN_GAPS.md`. Deliberately **not** started in this block — the board rule is one
  item at a time.

## Gate state (measured 2026-10-18, this tree, exit status captured)

| Gate                            | Result                                                                                                                              |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `npm run tsc`                   | EXIT 0                                                                                                                              |
| `npm run lint`                  | EXIT 0                                                                                                                              |
| `npm run format:check`          | EXIT 0                                                                                                                              |
| `npm run docs:verify`           | EXIT 0 — all 9 documented ratchet values match                                                                                      |
| `npm run docs:links`            | 0 broken links, 0 bad citations (strict)                                                                                            |
| `npm run engines:verify`        | EXIT 0 — 182 engines                                                                                                                |
| `npm run money:ast`             | EXIT 0 — 0 unsafe ops                                                                                                               |
| `npm run determinism:ratchet`   | HOLDS — 344 sites / 79 files                                                                                                        |
| `npm run palette:ratchet`       | HOLDS — 5,548 sites / 373 files                                                                                                     |
| `npm run fabrication:audit`     | HOLDS — 0 findings                                                                                                                  |
| `npm run repo:hygiene`          | EXIT 0                                                                                                                              |
| BoardPackPage suites            | **18/18** (`.test` 2, `.probe.test` 3, `.money.test` 10, `.exportTieOut.test` 3)                                                     |
| `npm run test:sharded` (run 1, 16:06-16:45) | **6/8 shards passed.** Shard 1: 3 failed / 1,878 passed (the two pre-existing storage files below). Shard 8: 3 failed / 1,904 passed — the **vacuous** ratchet-docs mutation cases, repaired in the same block (`path.basename`), now 7/7. Shards 2-7 clean (1,481 · statement-articulation · 2,294 · 1,967 · 1,981 · 2,211). |
| `npm run test:sharded` (run 2)  | Started 17:00 on the repaired tree; result recorded when it lands.                                                                  |

- **Run 1 is the honest measurement of the tree as it stood at 16:06**, i.e. before the P1-4 fixes
  and the script repair landed; run 2 is the measurement of the tree as it stands now.
- The two shard-1 failures are `src/utils/sqlJsStorage.test.ts` (2) and
  `src/utils/backupRestore.test.ts` (1). Both **reproduce in isolation** on this tree, in files this
  session never touched, and both drive a `Storage.prototype.setItem` quota spy that this
  environment's missing `localStorage` — the run logs `localStorage is not available because
  --localstorage-file was not provided` on every file — never reaches.
- Do **not** read this table as "the suite is green": the run had not finished. The standing
  `"Full suite green … test:sharded 8/8"` row in `docs/agent/09_KNOWN_GAPS.md` is left unedited but
  is **suspect on this machine**; confirm it before repeating the claim.
- Nothing here is committed — the tree is HEAD plus the nine changed paths in the newest block.

## Prior block (solo session, 2026-10-17 — third block)

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
| Board-pack **screen → Excel cell** tie-out (P0-2) | `BoardPackPage.exportTieOut.test.tsx` 3/3; **2 red** without the fix | on disk, not yet committed |
| D365 parser (departed-seat WIP + money fix) | 15/15 tests, money:ast 0 | `1e9f3959` |
| Synthetic tie-out fixture (departed-seat WIP + repair) | 7/7 tests | `eb7c4880` |
| FR-006 hydrate-guard verification (F-01) | probe 4/4, ACCEPT | `b8e50292` |
| Trial balance + explorer interop tests | 7 + 5 tests | `8db89e75`, `4128c1d0` |
| DEC-013/DEC-014 publish | docs:links clean | `86ec1992` |

**Next units:** the queue in `docs/agent/WORKING_AGREEMENT.md` §4 — next is **Q3**, the
accounts-team hand-off fields on the disposition record (FR-010; store work, no new surface and no
owner decision needed), then **Q7** (backlog 5-7). Q4, Q5 and Q6 are waiting on the owner:
DEC-002 (which FP&A view comes first), the materiality threshold that "extreme detail" implies, and
one real anonymized D365 export (DEC-001).
`src/utils/masterStorage.test.ts` exists and is green (9/9) — the earlier "no file exists" note
was stale. D365 parser claims stay "expected, not verified" until the owner supplies a real
anonymized export (DEC-001).

## Read next

- `../SQUAD_BACKLOG.md` (priority) · `STATUS_BOARD.md` (who owns what) · `BLOCKERS.md` (open)
