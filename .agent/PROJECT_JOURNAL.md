# FinPlan Pro — Agent Journal

## Session 002 (2026-08-17)

### Incident: sandbox re-clone lost local git history

The workspace was re-created between sessions. `HEAD` sat at the base commit
`455e74d` while the previous session's work existed only as uncommitted files
and on the remote as `26bf99a`. Recovered by fetching the remote branch and
confirming the working tree matched it byte-for-byte before fast-forwarding.
No work lost. **Lesson: push verified work early and often.**

### ADR-001 — Patch vulnerabilities via `overrides`, not `npm audit fix`

Status: accepted

**Context.** `npm audit` on `server/` reported a HIGH SSRF in `ip-address`
(GHSA-mwp4-54f8-5fhr and two siblings) and a LOW DoS in `body-parser`.
Reachability was confirmed rather than assumed: `ip-address` backs
`express-rate-limit`'s IP keying and `src/middleware/rateLimit.ts` applies
`authLimiter` to the auth routes, so an IP-parsing bypass defeats per-IP
throttling on login and undermines the account-lockout protection.

**Decision.** Pin patch-level `overrides` in `server/package.json`
(`ip-address ^10.5.0`, `body-parser ^1.20.6`), matching the convention the root
`package.json` already uses.

**Alternatives rejected.** `npm audit fix --omit=dev` resolves the advisories
but `--omit=dev` also _prunes_ devDependencies: it removed `@types/express`,
producing 12 `TS7016` errors and 8 failing test files. It was applied, the
breakage detected, and the tree fully reverted and re-verified before the real
fix landed.

**Consequences.** No manifest/API change, no major bumps, 0 vulnerabilities,
207/207 server tests still green.

### ADR-002 — Vulnerability scanning had no CI gate at all

Status: accepted (patch-delivered, awaiting human apply)

The SSRF reached `main` because **no workflow ever ran a vulnerability scan**,
despite `audit:prod` existing in `package.json`. Added a blocking `audit` job
plus a server-workspace audit step (the two workspaces have independent
lockfiles, so the root audit does not cover `server/`), both wired into the
`summary` gate. This re-lands finding N-0004, previously described but never
applied.

### Standing constraint — workflows are not pushable

The GitHub App lacks the `workflows` permission, so `.github/workflows/**`
changes are delivered as `ci-patches/0005-*.patch` per the repo's existing
convention. **These CI gates are NOT enforced until a human runs `git apply`.**

### Verification (this session, on a fresh clone)

| Check                                  | Result                                |
| -------------------------------------- | ------------------------------------- |
| frontend `tsc --noEmit`                | 0 errors                              |
| frontend `eslint src --max-warnings 0` | 0 errors, 0 warnings                  |
| frontend `vite build`                  | success, PWA generated                |
| frontend tests                         | 1212 files — 13,738 passed, 1 skipped |
| server `tsc --noEmit`                  | 0 errors                              |
| server tests                           | 130 + 77 = 207 passed                 |
| `npm audit` (root, prod)               | 0 vulnerabilities                     |
| `npm audit` (server, prod)             | 0 vulnerabilities                     |
| 8 repo-specific gates                  | all pass                              |

Note: the full frontend suite completed inside a **3 GB** sandbox — independent
evidence that the 80 GiB CI heap (corrected to 8 GiB in the patch) was never
load-bearing.

---

## Session 003 — Article XVIII: Blueprint Genesis (2026-08-17)

**Outcome: `blueprint_status: "LOCKED"`. Product code is unblocked.**

The Codex makes Article XVIII a hard gate: no product code until the blueprint is
complete, gap-analyzed, cross-validated, and locked. This session did that work and
nothing else. No `src/` or `server/` file was touched.

### Deliverables

| Artifact                      | Content                                                                                                                    |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `.agent/BLUEPRINT.md`         | 3,532 lines. Sections 0–22 in the exact numbering mandated by XVIII-C, plus Appendix A covering Addendum II Parts XXXI–LX. |
| `docs/architecture/TREE.md`   | Part LXI reproduced verbatim, with a _Known deviations_ table so decided divergence is distinguishable from drift.         |
| `.agent/blueprint-parts/*.md` | The 14 source parts the blueprint is concatenated from, kept for reviewable diffs.                                         |
| `.agent/state.json`           | `blueprint_status`, `blueprint_locked_at`, validation record, index baselines and gates.                                   |

### The decisions that shaped it (ADR-003 … ADR-011, Section 21)

The Codex's Article XVIII-G prescribes a stack — Next.js, Fastify, Prisma, Postgres,
Redis, Kafka, Rust. This repository is 455,514 lines of React 19 + Vite + Express with a
green type-check and 13,738 passing tests. **ADR-003 rejects the rewrite** and defines an
evolution path (stages S0–S4) with trigger conditions instead of dates, plus a
portability contract (PC1–PC5) that makes the SQLite→Postgres cutover a migration rather
than a rebuild. ADR-004 keeps money in decimal.js TypeScript because CI cannot compile
Rust (K2). ADR-005 refuses a dense OLAP cube and a CQRS split until something is
measured. These are the difference between a plan and a fantasy.

### Two honest findings that changed the roadmap

1. **The engine probe found twelve engine families at zero files** — headcount,
   currency conversion, close, journal, treasury, covenant, metric store, approval, RLS,
   OLAP, UDF, Wasm. Section 3.8 reconciles all 96 features: 61 built or partial, 35 not
   started, **14 of them P0**. The feature universe is written against what is measurably
   in this repository, not against what the older planning documents claimed.
2. **Phase 0 ships almost no user-visible features, deliberately.** Money integrity,
   tenancy, the runtime three-statement gate, the error registry, and collapsing 193
   routes to ≤ 40. Every P0 gap is a foundation gap, and each one left unfixed multiplies
   the cost of everything stacked on top of it.

### Validation (XVIII-N, 12 boxes + Addendum II, 31 boxes)

Four boxes did not pass on the first sweep and the work was done rather than the box
being charitably ticked:

- _"every financial rule has a test specification"_ → wrote **§6.8**, a 48-rule map from
  each normative rule to a named spec, walked by the `financial:oracles` gate.
- _"security covers all OWASP Top 10 for financial apps"_ → wrote **§10.8**, A01–A10 each
  with control and blocking test, plus FS1–FS4 for the finance-specific failures the Top
  10 does not cover.
- _"onboarding path for each persona is < defined time targets"_ → wrote **§2.8**, seven
  personas with timed E2E specs.
- _"Phase 0 tasks ≤ 1 week"_ and _"Phase 0 has no Phase 1 dependencies"_ → wrote
  **§18.2 W0.7**, decomposing all 13 Phase 0 items and proving the non-dependency
  explicitly instead of asserting it.

Full record in `BLUEPRINT.md` §22.7 and Appendix A.22.

### The clause that matters most

§22.6, binding on every phase: _a phase is complete when its gate passes. If a gate
fails, cut the next phase's scope — never lower the gate. Any gate change requires an
ADR._ Moving a bar to make a date is the failure mode this document exists to prevent.

### Next

Phase 0, Workstream 0.1: money integrity. Adoption from ~22% to ≥ 60%, zero float in
financial paths, mutation score ≥ 80% on `src/utils/money.ts`. Nothing outranks it.

## Session 004 — Adversarial blueprint re-audit

Re-audited the LOCKED blueprint against the Codex and against the repository as measured.
Eight defects found and fixed; full record in `.agent/BLUEPRINT.md` §22.8.

Two were critical and both concerned _false confidence_:

- **No system of record.** 43 Zustand stores persist financial truth (GL, budgets, forecasts,
  scenarios, debt, leases, FX) to browser `localStorage`; only 14 non-test files call the
  server; `tenant_id` appears 0 times in `server/src/db/`. Phase 0's tenancy workstream would
  have added governed columns to a database that does not hold the data. → new §0.6.1
  measurement, Workstream 0.8 (persistence authority), R-21, and an intra-phase ordering rule
  putting persistence authority _before_ tenancy.
- **The money gate could read green while money is unsafe.** `money:adoption` detects an
  _import_ of `@/utils/money` by regex, so "0 raw `toFixed`" is not evidence of decimal-safe
  arithmetic. → W0.1.0 replaces it with an AST detector before the ≥60% gate is trusted; R-22.
  Expect the honest number to fall below 25.44% before it rises.

Also: §3.8 feature arithmetic was wrong on every line (96/61/35/14 → 98/68/30/13, now
machine-derived); 16 NOT-STARTED features were scheduled in no phase at all, including the
K20 Excel two-way sync differentiator (→ §18.7 ledger + ADR-013 + CI check, now zero orphans);
the Codex's rounding mandate contradicts itself (line 522 half-even vs line 692 `0.005 → 0.01`)
so ADR-012 records the deviation and forces explicit half-even on statutory paths; schema is
forked across two sources with no drift detection (R-23, W0.8.4).

Verified clean: no encoding corruption, all 98 feature IDs resolve, all §0.6 baseline counts
still exact against the live repo. Blueprint remains LOCKED, now around reproducible numbers.

## Session 005 — Windows desktop + zero-escape scope expansion

Two requirements added by explicit direction: the tool must run properly on Windows, and it
must be genuinely all-in-one (no other tool needed). Both were gaps in the locked blueprint.

**Windows (Section 23, new).** "Windows" appeared _once_ in 3,756 lines; MSI, installer, code
signing and printer appeared _zero_ times — while the repo already ships a complete Tauri 2
desktop app: 9 plugins, `keyring` credential storage, `secure_storage.rs`, `crash_reporter.rs`,
strict CSP, and the real 35-table schema in `src-tauri/migrations/`. A shipping surface the
blueprint didn't describe was an ungoverned surface, and A.19 listed seven client surfaces
while omitting the one that actually builds. Section 23 now specifies platform tiers (Win 11

- Win 10 22H2 = Tier 1), MSI+NSIS packaging, silent install, code signing, the WebView2
  blank-window trap, data locations, uninstall/upgrade data safety, the unresolved auto-update
  ambiguity (dependency present, `plugins: {}` empty), RDS multi-session isolation, and a
  desktop DoD. 12 `F-DESK-*` features added; §9.11 desktop posture added.

Critical honesty constraint (§23.8): this sandbox has no `cargo`, no `rustc`, no Windows.
Every desktop claim is "designed for, not proven". Binding rule — no `src-tauri/src/*.rs`
edits from here, and nothing marked BUILT until executed on real Windows (R-24, score 20).

**Zero-escape (Section 24, new).** "All-in-one" was asserted but never measured. Added a
definition of an escape (hard / soft / legitimate boundary), a 30-row Escape Ledger mapping
every monthly FP&A workflow to an owning feature and phase, the Core-20 with a GA gate of
zero hard escapes, an escape-rate ratchet folded into UVI, and a governed-handoff contract
for legitimate boundaries. The ledger exposed three workflows with _no owning feature_:
ad-hoc pivot analysis (the top reason analysts return to Excel), MD&A narrative authoring,
and model documentation → F-ANALYSIS-001, F-REPORT-013, F-REPORT-014.

Feature universe 98 → 113. P0 backlog unchanged at 13. Six new risks (R-24…R-29).
Verified: 25 sections, zero orphaned features, all referenced IDs resolve, no encoding damage.

Honest headline: OmniPlan is not all-in-one today and the desktop is unverified from here.
These sections make both measurable every release rather than discoverable at a demo.

### Session 005 addendum — docs-link graph closed

Resolved the unknown carried since session 003: `npm run docs:links` exits 1, but it is wired
into neither `docs:verify` nor `.husky/pre-push`, so it was advisory, not a blocking gate —
which is exactly why 24 broken citations had accumulated unnoticed. Triaged rather than
silenced:

- **1 genuine defect** — `/.agent/BLUEPRINT.md` (leading slash) resolved to filesystem root.
- **7 ambiguous** — bare filenames (`PERSISTENCE_MAP.md`, `ROUTE_MAP.md`, `ERROR_CODES.md`,
  `FINANCIAL_RULES.md`, `METRIC_REGISTRY.md`, `SOD_MATRIX.md`, `CALENDARS.md`) rewritten to
  repo-relative paths so they resolve once generated.
- **11 legitimate forward references** — Phase 0/1 generated artefacts, registered in
  `scripts/docs-link-allowlist.json` with a dated reason naming the workstream that creates
  each one, per that file's "deliberate, dated decisions — not dodge-lists" convention. Each
  entry is removed when its generator lands.

`docs:links --strict` now reports 0 broken links, 0 broken citations. Blueprint invariants
re-verified after regeneration: 25 sections, 113 features (33/42/38), zero orphans, zero
unresolved F-ids, no encoding damage.

## Session 006 — W0.1.0: the money detector now measures money

Phase 0 execution began at W0.1.0, the task the blueprint flagged as blocking everything
downstream: the money gate could not be trusted, so no number it produced could be either.

**The flaw.** `scripts/money-adoption.mjs` scored a module as "adopted" if it contained
`import ... from '@/utils/money'`. That is an import proxy, not a safety measure. A module
doing `total += row.amount` on IEEE-754 doubles scored as fully adopted provided it imported
`formatMoney` somewhere for display. The published 25.44% figure measured import statements.

**The replacement.** `scripts/money-ast-detector.mjs` parses every financial-path module with
the TypeScript compiler and asks whether it performs unsafe arithmetic on a monetary value:
`+ - * / %`, compound assignment, float comparison, float equality, `reduce` accumulation,
`Math.round/floor/ceil`, and value-producing `.toFixed()`. Safe only at zero findings.

**First honest baseline: 78.55% safe — 740 unsafe monetary operations across 184 of 858
monetary modules** (580 arithmetic, 62 compound-assign, 38 Math.round, 24 comparison,
20 reduce-accumulate, 16 float-equality). The blueprint predicted the number would fall
before it rose. It did not fall, because it is not the same measurement — the old metric
counted imports, the new one counts defects. 740 real defects are now visible and ratcheted.

**Validation before trust.** A detector with false positives gets switched off, so it was
hand-checked against live modules before baselining. Three false-positive classes surfaced
and were fixed: request counters (`state.totalAllowed += 1` — "total" is a money word but
this is a tally), bare generic names used as denominators (`windowFailures / total`), and
token-bucket `cost` arithmetic in the rate limiter. `CircuitBreaker.ts` went 15 → 0 findings
while `FinancialStatementTemplates.tsx` held at 59 true positives (`s + (e.debit - e.credit)`,
`revenue - cogs`). Both directions are pinned by 17 fixture tests in
`src/utils/moneyAstDetector.test.ts` — 8 must-catch, 9 must-ignore, each must-ignore case a
real false positive observed here. Tightening a heuristic can no longer silently blind
the gate.

**Known limitation, stated rather than hidden:** identification is name-based, not
type-based, so money flowing through a variable called `x` is invisible. Full type
resolution is scheduled as W0.1.2 and will cause another honest drop.

Enforced as pre-push gate 9b and `npm run money:ast`. The legacy ratchet stays for now as a
second signal; it is retired when W0.1.1 lands.

---

## Session 007 — W0.1.1 begins: the worst money module was also fabricating statements

**Date:** 2026-08-17
**Branch:** `arena/01a00e7f-fp-a-betterversion`

W0.1.1 targets AST money safety ≥ 90%. Worst-first put
`src/pages/reports/FinancialStatementTemplates.tsx` at the top with 59 unsafe operations.
It is now 0, and the ratchet moved 740 → **681 unsafe operations (78.55% → 78.7% safe)**.

**The float arithmetic was the smaller problem.** The page fabricated financial statements
from hardcoded ratios while reading the user's real general ledger. Cash was `assets * 0.15`,
receivables `assets * 0.1`, inventory `assets * 0.08`; product/service revenue was a 70/30
split of total revenue; the entire budget column was `actual * 0.95`; variance percentages
were literals (`5.3`) that did not agree with the variance dollars rendered next to them.
The page is routed at `/reports/templates` and exports to PDF and Excel. Under K18 this is
Severity-0 — invented numbers presented as financial statements are worse than an error,
because they are plausible enough to be acted on.

**Two more defects found while fixing it.**

1. _Only 10 of 110 emitted keys could ever render._ The renderer derives its lookup key with
   `label.toLowerCase().replace(/[^a-z]/g,'')`, so the page's `'product revenue_actual'`
   (with a space) never matched `productrevenue_actual`. I verified this by rendering the
   page against a real ledger and counting cells: **126 of 161 were already em dashes, 4 were
   numeric.** Most of the fabrication was dead code that only looked authoritative in review.
   Worth remembering: reading the source overstated the blast radius; rendering it measured it.
2. _Contra entries were double-counted._ Balances used `Math.abs(debit - credit)` per entry,
   so a sales return or a vendor credit **increased** revenue and COGS instead of reducing
   them. This one was silent, wrong in the same direction every time, and would not have been
   caught by the money gate at all — `Math.abs` on a float difference is a correctness bug,
   not a precision bug.

**The fix.** Derivation moved out of the component into
`src/pages/reports/financialStatementData.ts`: decimal.js end to end, debit-normal vs
credit-normal netting by account class, and one rule — _emit a line only when the posted GL
supports it_. Captions the ledger cannot substantiate (cash vs receivables, D&A, cash-flow
activities) are omitted rather than estimated, and the page renders a
"not derivable from the posted General Ledger" panel explaining each omission. The renderer
already printed an em dash for absent keys, so honesty was the cheaper path, not the more
expensive one. Budget-vs-Actual now reads posted `budgetStore` line items and shows nothing
at all when no budget exists.

**Guarding the fix.** 21 tests in `src/pages/reports/financialStatementData.test.ts`, covering
contra netting, margin omission on zero revenue, interest/tax articulation, decimal exactness
(1,000 × `0.01` = `10`), and explicit assertions that each previously-fabricated key is now
`undefined`. Plus a source-level guard that fails if any ratio multiplier (`* 0.15`,
`.times(0.15)`) reappears in the derivation module — verified to actually fail by
reintroducing `assets.times(0.15)` and watching two tests go red.

**Process finding that changes the rest of W0.1.1.** `npm run mock-data:audit` reports this
page as clean, and always did: it looks for synthetic _arrays_ with a disposition, and this
fabrication was inline arithmetic on real data. A file can pass the zero-mock-data gate and
still invent every number it displays. The remaining worklist modules must be read for
invented values, not only for unsafe arithmetic — the AST detector finds the float bugs, but
nothing automated is currently looking for fabrication.

**Housekeeping.** Fixed an ID collision introduced last session: two W0.1 rows were both
numbered 0.1.2. Type-aware detection is now **W0.1.6**; "Eliminate float paths" keeps 0.1.2.

---

## Session 008 — 2026-08-17 — W0.1.1 module 2: `ThreeStatementDashboardPage.tsx`

**Result.** 34 unsafe operations → 0. Ratchet 681 → **647 (78.84% safe)**; baseline re-locked.

**Why this module matters more than its op count.** It was already using `sumMoney` and
`roundTo`. By every automated signal available before this session it looked like a
compliant module with some stray arithmetic. It was in fact producing entirely wrong
financial statements. Rendered against a genuinely balanced double-entry ledger (owner
funds 500 cash; sells 1,000 cash; pays 400 COGS; pays 250 opex):

| Line         | Displayed   | Correct |
| ------------ | ----------- | ------- |
| Revenue      | **-$1,150** | $1,000  |
| COGS         | **$0**      | $400    |
| Gross Profit | **-$1,400** | $600    |
| Net Income   | **-$1,650** | $350    |

Every displayed line was wrong, including the sign of the bottom line. This is the concrete
demonstration of the rule recorded last session: **wrapping arithmetic in money helpers
without reading what the arithmetic means launders a K18 defect past the ratchet.**

**Three stacked root causes.**

1. _Sign inversion against the engine contract._ Revenue was computed `debit - credit`, so
   credit-normal accounts arrived negative. `ThreeStatementEngine.test.ts` pins revenue
   positive / costs negative. The page passed the exact inverse on every line. Nothing in
   the TypeScript types encodes this — `amount: number` is sign-agnostic — so the contract
   was only discoverable by reading the engine's own fixtures. Recorded as a standing rule:
   before feeding an engine, read its test fixtures for the sign convention.
2. _`Math.abs` per entry_ on COGS/opex/interest/tax. Same contra-entry defect as module 1: a
   reversing entry increased the expense instead of cancelling it.
3. _The view back-solved its own line items._ The memo computed correct-ish totals; the JSX
   ignored them and reconstructed Revenue and COGS from `grossProfit`/`netIncome` via
   `grossProfit + (grossProfit - netIncome > 0 ? … : 0)`. That is why COGS rendered `$0`
   while the memo held 400. `handleExport` repeated the same algebra, so exports were wrong
   too.

Two further correctness defects fixed in passing: equity omitted current-period earnings, so
`A = L + E` could only balance at zero net income; and cash flow was classified by account
code _prefix_ (4/6 operating, 1 investing, 2/3 financing), conflating accrual results with
cash movement. Net change in cash is now measured directly on the cash account; the
activity split is shown as an em dash with an on-screen explanation, following the module-1
disclosure pattern. Fabricating a plausible split would have been the easy option and the
dishonest one.

**The fix.** Derivation extracted to `src/pages/reports/threeStatementData.ts` (decimal.js,
contract-correct signs, cumulative `YYYY-MM` cutoff). It publishes `totals` as positive
magnitudes specifically so the view can never back-solve again. Pinned by 24 tests, and
mutation-tested rather than assumed: reintroducing the sign inversion fails 8 tests;
reintroducing `Math.abs` or the back-solve fails their respective guards. The source guards
strip comments first, after an early version of them tripped on prose describing the defect.

**Second blind spot found — and this one now has a countermeasure.** The page already had a
test file. It passed before and after the defect, because it asserted only that headings
rendered and it mocked the engine away entirely. Both modules fixed so far share the shape:
a roughly correct computation plus a view that silently disagrees with it (module 1 emitted
lookup keys the renderer could never match; module 2 back-solved). Neither the AST detector
nor `mock-data:audit` can see this class — both modules required an actual render probe to
find. `ThreeStatementDashboardPage.test.tsx` now uses the real engine, renders a known
ledger, and asserts the figures that reach the DOM, including negative assertions against
the three wrong values. **Remaining W0.1.1 modules are to be verified by rendering, not by
reading the memo.** Whether this becomes a general gate is still open — noted as a candidate
rather than adopted, since a naive "every page must have a DOM-value test" rule would be
expensive and easy to satisfy vacuously.

---

## Session 009 — W0.1.1 module 3: `SafeMathParser.ts` (27 unsafe ops → 0)

**Commit** `58afb95`. Ratchet 647 → 620 unsafe ops (78.84% → 78.95%). SafeMathParser tests
381 → 400; all 275 formula-function tests green; full suite 13,819 passing.

**Why 381 green tests certified broken money.** Every existing test passed the _optional_
argument explicitly. `const [days = 0] = args` binds the parameter to `0`, never `undefined`,
so the downstream `days ?? 365` was dead code. `DSO(5000,800)` returned **0** instead of 58.4
— and a zeroed DSO reads as "customers pay instantly", the sort of number that survives
review because it is clean rather than obviously wrong. Five defaults were dead this way
(DPO, DSO, DSI, and the DDB/VDB `factor`). The related `args[i]! ?? N` sites were fine: the
`!` is erased at runtime, so those defaults do fire. **The general rule: exercise optional
arguments by OMITTING them.** The new regression suite does exactly that, and every one of
its assertions failed before this commit.

Four further defects, all found by _executing_ the parser rather than reading it: DDB was off
by one period (`DDB(2400,300,10,1)` → 384, Excel 480); VDB ignored `start_period` because both
branches of its `if` were byte-identical, and VDB had **no test at all**; EBITDA/EBIT/NOPAT/
FCFF/FCFE/WACC ran on raw floats (`EBITDA(0.3,0.1,0.1)` → `0.09999999999999998`);
DOLLAR_DE/DOLLAR_FR took `log10(0)` when `fraction` was 0, producing `-Infinity`.

**The structural finding: this file was a duplicate.** A correct, oracle-tested implementation
of DDB/VDB/DPO/DSI/DSO already existed in `formula-functions/financial.ts`, using the money
helpers and with real parameter defaults. SafeMathParser had been maintaining a second,
divergent copy. Delegating (no import cycle — that module does not import this one) removes
the fork rather than repairing it, which is the only outcome consistent with K19's
"don't fork the engine". **Before repairing any duplicated engine code, grep for an existing
canonical implementation first.**

**An oracle test was itself wrong.** Delegating surfaced an off-by-one in the canonical VDB,
pinned by a test asserting `VDB(10000,1000,5,2,4) === 4704`. Excel's VDB window is
start-EXCLUSIVE and end-inclusive — period N is `VDB(N-1,N)`, per Microsoft's published
`VDB(2400,300,10,0,1) = 480`. Summing from `start` instead of `start+1` double-counts period
`start`; it only looked correct at `start=0` because `DDB(...,0)` is 0. Implementation and
test both corrected against the vendor spec. A test named "oracle" is only an oracle if its
expected values came from the oracle; this one came from the implementation. Worth re-deriving
the other oracle values from published Excel output at some point rather than trusting the name.

**A detector gap, recorded honestly.** The money-AST detector reported 0 unsafe ops for this
file while `EBITDA` was still doing float subtraction, because the heuristic is name-based and
`args[0]! - args[1]!` contains no money-like identifier. The regression test caught it, the
detector did not. This is the known limitation already tracked as W0.1.6 (type-based
detection); noting it here as a concrete instance of the false-green it produces. **A file at
"0 unsafe ops" is not certified — it is merely un-flagged.**

**Ratios were converted, but deliberately, not mechanically.** Eleven of the 27 findings were
dimensionless quotients (CURRENT_RATIO, ROE, margins). These are not money and wrapping them
in money helpers would be wrong; they were moved to Decimal for exactness and given
zero-denominator guards, which is a different change with a different justification.

**Collateral fix: the smoke-test store mocks were broken.** The full-suite run surfaced
`budgetLines.filter is not a function` in `smoke-all-pages.test.tsx`. This was **already
failing on HEAD** and is a regression from session 007's module-1 work that the module-scoped
test runs never showed — a reminder that a green targeted run says nothing about the suite.
Root cause was in the mock, not the page: all 12 store mocks were `vi.fn(() => state)`, which
ignores any selector, so a component calling `useBudgetStore((s) => s.lineItems)` received the
whole state object. The new `mockStore` helper applies the selector when given one. Verified
it still fails on a genuinely broken page, so it is a fix rather than a suppression.

**Next:** module 4 is `ProfessionalExportEngine` (26). Carried debts unchanged:
`scripts/escape-ledger-check.mjs`, wiring `docs:links --strict` into `docs:verify`, retiring
legacy `money:adoption`, W0.8 persistence authority.

## Session 010 — 2026-08-18 — W0.1.1 module 4: a false positive, and the real bug behind it

**Two changes, and the difference between them is the lesson of this session.**

### 1. Detector precision fix (no money was repaired)

`ProfessionalExportEngine.ts` (26 findings) and `ExportTemplateEngine.ts` (11) were flagged
entirely on `this.margin.left/right/top` — A4 page geometry in millimetres. `isMonetaryExpression`
resolves `a.b` property-name-first **with fallback to the object**, so `margin.left` inherits
money-ness from `margin`. Adding `'margin'` to `AMBIGUOUS_ALONE` drops unsafe ops **620 → 583**
and safety **78.95% → 79.19%**.

**Zero computed numbers became safer.** The ratchet moved because measurement got more accurate,
not because the product got more correct. Any reading of that 0.24pp as progress is wrong.

Before suppressing the name I dumped `--json` before and after and diffed per-file counts: exactly
two files changed (26→0, 11→0) and no other file moved by a single finding, so no true positive
was lost. That diff is the only thing that makes a suppression safe — without it, adding a word to
a blocklist is indistinguishable from deleting evidence. Two regression tests lock both directions:
bare `margin` geometry must yield 0, and `grossMargin`/`ebitdaMargin` must still be flagged, so
nobody can widen the exclusion to all margins. Teeth verified by reverting the detector (geometry
test fails). Commit `d9d357b`.

### 2. The board pack was fabricating financials (commit `fb7b601`)

Auditing the file the detector had just declared clean, the actual defect was in plain sight.

`createBoardPackTemplate()` embedded literal figures: **Total Revenue `$12.4M`, Net Income
`$2.1M`, EBITDA Margin `24.3%`, Cash Position `$8.7M`** — and `tpl-kpi-summary` invented twelve
more (ROE 22.4%, headcount 142, 2,847 customers, 7.2 months runway). These rendered into a
**CONFIDENTIAL-stamped PDF for every entity and every period**. `ExportContext` had a `data`
field that **the engine never read anywhere** — the only reference in the file was an underscored
`_ctx` parameter — so a caller's real numbers could not reach the page even if they passed them.
The four financial tables were `rows: []`, so the fabricated KPIs were the _only_ numbers a reader
saw. Separately the **Excel and CSV buttons passed `rows: []` unconditionally**: four headers, no
data.

Templates now declare a `dataKey` and bind through `resolveSectionRows/Headers/KPIs`. Unbound
sections render empty and the export refuses with an explicit error rather than writing a file.
**An empty pack is a caught error; a plausible fabricated one gets signed and sent to a board.**

**Both test files were vacuous exactly where it mattered.** Each `vi.mock`-ed the whole engine and
then asserted against its own fixture — the colocated suite checked for `$4.2M`, a number that
exists nowhere in the product, while shipping `$12.4M` went unnoticed for the life of the file.
They now `importOriginal` so the real resolvers are exercised. The engine suite asserts **no
built-in template contains a digit in any KPI value or table value cell**, which fails loudly if
anyone re-adds a "realistic-looking" placeholder. Teeth verified both ways: reintroducing the
fabrication fails 3 engine tests, restoring `rows: []` fails 2 component tests.

### What this says about the gate

The money ratchet did not move for change 2, and could not have: it reads arithmetic, and no
arithmetic was wrong. The numbers were _typed in_. Session 007 found statement fabrication behind
a dead data-key mapping; this is the same failure mode in the export layer, and the detector is
blind to both by construction.

So module 4 produced **37 flagged operations resolved with zero risk reduction**, and — in the
very same files — **16 fabricated financial values plus two broken exports that no gate would
ever have caught**. The standing caution now has its sharpest evidence: **≥90% AST safety will
arrive before the money is trustworthy.** Phase 0 exit needs a fabrication gate (no literal
currency/percentage strings in template or fixture definitions reachable by an export path) that
does not depend on the AST detector. Logged as a new carried debt alongside the existing
value-fabrication item.

**Carried debts unchanged:** `scripts/escape-ledger-check.mjs`; wire `docs:links --strict` into
`docs:verify`; retire legacy `money:adoption`; W0.8 persistence authority; re-derive remaining
`financial.ts` oracles from published Excel output; `ODDFPRICE`/`ODDLPRICE` are byte-identical and
both ignore `_firstPeriod`/`_lastPeriod`. **New:** `ProfessionalExportEngine` passes raw numbers
straight into `autoTable` (`rows: (string|number)[][]`, only column 0 is `String()`-ed), so an
unformatted float would print verbatim into a board pack — a formatting-boundary gap with no
detector.

**Next:** module 5 is `TaxProvisionPage` (22).

---

## Session 011 — 2026-08-18 — W0.1.1 module 5 + the fabrication gate

**Branch:** `arena/01a01148-fp-a-betterversion`
**User direction:** work and fix all (fabrication gate _and_ TaxProvisionPage).

Two deliverables. One made the product safer. One made a class of Severity-0 defects
visible for the first time.

### 1. `TaxProvisionPage` (22 → 0). Ratchet 583 → **561 (79.33% safe)**

This move is real: 22 float operations left the product. A new safe module
(`src/pages/tax/taxProvisionData.ts`) also entered the denominator (monetary modules
860 → 861, safe 681 → 683).

**The float arithmetic was the smaller problem.** The page read the user's GL and then
invented an ASC 740 provision:

| Invention                               | How                                                                |
| --------------------------------------- | ------------------------------------------------------------------ |
| Federal / CA / NY / International split | `pretax * 0.7 / 0.15 / 0.1 / 0.05`                                 |
| Statutory rates                         | literals `21`, `8.84`, `6.5`, `12.5`                               |
| Deferred vs current                     | more hardcoded ratios (`* 0.03`, `* 0.18`, …)                      |
| Quarterly ETR trend                     | `18 + ((i * 3) % 5)` and `totalProvision/4 + ((i * 2300) % 10000)` |

All four rendered on screen and exported to PDF/Excel. `TaxEngine` — the real ASC 740
engine, already money-safe and oracle-tested — was never called. Calling it with those
assumed rates would have been a second fabrication, so the page still does not call it.

Two further defects in the pretax figure itself:

1. Expenses were prefix-6 only. COGS (5) and interest (7) were ignored, so pretax on the
   session-008 ledger was **$750 instead of $350**.
2. `Math.abs` per expense entry — the same contra-entry defect as modules 1 and 2.

**The fix.** Derivation extracted to `taxProvisionData.ts` (decimal.js, debit/credit-normal
netting, prefixes 4/5/6/7/8). A line is emitted only when the posted GL supports it.
Jurisdiction, deferred/current and statutory provision are disclosed as not derivable.
Quarterly points are grouped from period tags when two or more quarters exist; a single
period is not turned into a seasonality curve. The waterfall is pretax minus tax — the
old chart also added net income as a third step and double-counted the residual.

Pinned by 25 derivation tests + rewritten money tests + a DOM probe that renders the
known ledger and asserts `$350 / $70 / 20.0% / $280`, with negative assertions against
`State (CA)` and `8.84`. The previous page test asserted only that a heading rendered
and mocked the GL with the wrong field names (`account` / `amount`), so it passed
throughout. Teeth verified: reintroducing `.times(0.7)` fails 2 tests.

Source guards strip comments first (session 008 lesson). An early version of them
tripped on the disclosure prose that _named_ the invented jurisdictions; the disclosure
was rephrased and the guards tightened to object-literal assignment patterns.

### 2. Fabrication detector (W0.1.7) — first honest baseline **121 / 24 files**

The gate session 010 asked for. `scripts/fabrication-detector.mjs` parses the AST and
flags string literals that look like displayed money (`$12.4M`, `$1,234`) or percentages
(`24.3%`) **only when they are the value of a displayed-figure property** (`value`,
`val`, `sales`, `variance`, …), plus `taxRate: <number>` in `src/pages`.

Scoped that way so template marketing copy (`Pre-populated for a $200M company`), SQL
`$1`, Excel `$A$1`, format patterns and purpose text are not findings. Those classes
were checked against the live tree before the baseline was recorded.

Export engines are fail-closed at zero (session 010 contract; they are clean). Everything
else is a ratchet. First baseline: **60 currency-literal + 61 percent-literal = 121
findings across 24 files**. Worst offenders: `REITDashboardPage` (20),
`RetailDashboardPage` (18), `ProjectCostingPage` (11), `ExecutiveSummary` (6). Enforced
as pre-push gate 9c and `npm run fabrication:audit`. Both directions pinned by 11
fixture tests; the `$12.4M` board-pack case is a must-catch.

**Honest limitation, stated rather than hidden.** This detector would have caught
session 010. It would **not** have caught session 007's ratio invention or this
session's `taxRate: 21` table _as originally written_ — those are numeric literals in
computed objects, not formatted display strings. Per-module source guards remain
mandatory on every derivation extracted during W0.1.1. A file at "0 fabrication
findings" is un-flagged, not certified.

**121 is not a regression.** It is the first time these invented KPIs have been counted.
The number is allowed only to fall.

### What this session did not do

The 24 files on the fabrication worklist were **not** cleaned. That is a multi-session
grind of the same shape as W0.1.1 and is now gated so it cannot grow. AutoCommentaryEngine
(16) is the next money-AST module.

### Carried debts

Unchanged, except the fabrication detector is no longer "not written". Remaining:
raw-float-across-format-boundary (`ProfessionalExportEngine` `autoTable`); W0.1.6
type-based detection; `financial.ts` oracle re-derivation; `ODDFPRICE`/`ODDLPRICE`;
`scripts/escape-ledger-check.mjs`; wire `docs:links --strict` into `docs:verify`;
retire `money:adoption`; W0.8 persistence authority; MSI installer.

**Next:** `AutoCommentaryEngine` (16), and/or the fabrication worklist starting at
`REITDashboardPage` (20). Same rule: read for invented values, verify by rendering.

---

## Session 012 — 2026-08-18 — AutoCommentaryEngine + REIT fabrication

**Branch:** `arena/01a01148-fp-a-betterversion`

### 1. `AutoCommentaryEngine` (16 → 0). Ratchet 561 → **545 (79.44% safe)**

Real drop: 16 float operations left the product. Unsafe modules 178 → 177.

The previous suite only asserted `typeof commentary === 'string'`. Three defects sat
behind that:

- IEEE-754 `actual - budget` and `reduce((s, i) => s + i.actual)`.
- Budget of zero produced a **0% variance** — reads as "on budget" when there is no budget.
- `interpolate` currency-formatted every number, so a growth rate of 15 became `$15`.
- Section narrative labelled every positive variance "favorable" without knowing whether
  the line was revenue or expense.

Money arithmetic now goes through `subtractMoney` / `sumMoney`. A zero base omits the
percentage. Outlook states the identity (remaining budget delivered in full ⇒ FY variance
equals YTD variance) instead of pretending to forecast. Interpolate currency-formats only
`amount`/`budget`/`start`/`end`, and renders `—` for non-finite values so the commentary
panel's NaN guard still holds. Teeth: reintroducing `actual - budget` fails the source guard.

Two of the original 16 findings were `narrative +=` flagged because `arr` is a substring of
`narrative`. They went away by joining sentences instead of `+=`. The `arr` heuristic is
still too greedy; left for a confined detector-precision pass (dump `--json` before/after).

### 2. `REITDashboardPage` (20 → 0 fabrication findings). Ratchet 121 → **101 / 23 files**

The page rendered Prologis / AMT / Equinix / Simon / AvalonBay quotes (`$112B`, `4.2%`
FFO yield, …) as "sector peer benchmarking" for every entity, plus a risk card of
`1.38x / +6.4% / 4.82% / 5.4x / 4.1x`, plus sparklines `[5.0, 5.1, …]` and a hardcoded
`$1.85M` dividend series.

`RealEstateEngine.calculateREITStats` fed it more invention: `dividendYield: 5.42`,
AFFO = FFO − 10% of rent, NAV/share ÷ 1,000,000 assumed shares. Tests had encoded the
10% and 1M-share assumptions as expected values.

Engine now returns `null` for AFFO, NAV/share and yield. Payout and coverage are emitted
only when the denominator exists. The page shows FFO, posted dividends, payout and
coverage, and a disclosure for the rest. No peer table. Teeth: restoring `5.42` fails 3
tests. Disclosure copy does not name the retired figures (session 011 lesson).

### Next

Money-AST: `FinancialInstrumentsEngine` (15). Fabrication: `RetailDashboardPage` (18).

---

## Session 013 — 2026-08-18 — FinancialInstrumentsEngine + RetailDashboardPage

**Branch:** `arena/01a01148-fp-a-betterversion`

### 1. `FinancialInstrumentsEngine` (15 → 0). Ratchet 545 → **530 (79.56% safe)**

The file header claimed a complete money migration. It still subtracted bond
prices (`calcPrice - price`), accumulated duration/convexity cash-flows on
floats, added `equityValue + debtValue` for WACC, and divided EV/Revenue as
IEEE-754. One finding was `freeCashFlows.length - 1` inheriting money-ness
from `cash` — fixed by `.at(-1)`, not by wrapping an index in money helpers.

WACC is now an exact known answer: 0.6×12% + 0.4×6%×(1−25%) = **9%**. Zero
capital returns 0 rather than NaN. Teeth: restoring `calcPrice - price` fails
the source guard.

### 2. `RetailDashboardPage` (18 → 0 fabrication). Ratchet 101 → **83 / 22 files**

The routed `/retail/dashboard` page ignored the GL and rendered `$12.4M`,
`6.8%` comps, `24.2%` conversion and five invented stores (Flagship NYC…).
A data-driven twin already existed at `/retail/retail`. This page now uses
`RetailEngine` + `glStore`, empty-states when there is no ledger, and omits
traffic / conversion / named-store quotes. Teeth: empty and seeded-ledger
DOM probes reject `$12.4M` and Flagship NYC.

### Next

Money-AST: `GoalSeekPage` (14). Fabrication: `ProjectCostingPage` (11).

---

## Session 014 — 2026-08-18 — GoalSeekPage + ProjectCostingPage

**Branch:** `arena/01a01148-fp-a-betterversion`

### 1. `GoalSeekPage` (14 → 0). Ratchet 530 → **516 (79.72% safe)**

Real drop: 14 float operations left the product. Unsafe modules 176 → 175.
Two new safe modules (`goalSeekModel.ts`, `projectCostingData.ts`) entered the
denominator.

The page did IEEE-754 `fixed / (cm / 100)` and `(fixed + target) / (cm / 100)`,
abs'd every expense, and invented a **$1,000,000** Monte Carlo revenue base
when the GL was empty. Percentile ranks were flagged because `profits.length`
inherited money-ness from `profit` — those are index arithmetic and stay
outside money helpers (session 013 `.at(-1)` class).

Derivation moved to `src/pages/analytics/goalSeekModel.ts`. Known answer:
fixed 500k / VC 60% / target 1M ⇒ CM 40%, BE **$1,250,000**, revenue-for-target
**$3,750,000**. Inverse recovers the 60%. Empty ledger is `null`, not $1M.
Volatility is a labelled model assumption, not a hidden `* 0.1`. Teeth:
reintroducing `.times(0.1)` fails the known-answer + source guard.

### 2. `ProjectCostingPage` (11 → 0 fabrication). Ratchet 83 → **72 / 21 files**

The page ignored the GL and rendered `$58.2M`, `92.4%` utilisation, `$1.24M`
pending COs, a CPI of `0.98`, Downtown Plaza / Skyway Bridge change orders and
a CSI ledger with `+$8.4%` rows. `constructionStore` persisted the same quotes
as defaults for every tenant.

Derivation is `src/pages/construction/projectCostingData.ts`: posted costs
(prefixes 5+6), contract revenue (prefix 4 excluding 46 — 46 would have been
swallowed as revenue), WIP 13, billings 46, over/under when both exist. Change
orders, CSI budgets and CPI are disclosed, not estimated. Store defaults are
empty; persist v1→v2 drops the seeded quotes. Teeth: injecting `$58.2M` fails
the DOM probe.

`ConstructionEngine.calculateStats` is still unused here — it multiplies
revenue by 1.5 to invent backlog and abs's every amount.

### Next

Money-AST: `ScenarioBuilderPage` (14). Fabrication: `UnderwritingPage` (6),
`ExecutiveSummary` (6).

---

## Session 015 — 2026-08-18 — ScenarioBuilderPage + UnderwritingPage

**Branch:** `arena/01a01148-fp-a-betterversion`

### 1. `ScenarioBuilderPage` (14 → 0). Ratchet 516 → **502 (79.88% safe)**

Real drop: 14 float operations left the product. Unsafe modules 175 → 174.

The comparison function was already on decimal.js, but the page still:

- fed it a hardcoded **$48M / $28.8M / $14.4M** base (and the function itself
  read a module-level 14.4M opex, so every caller inherited an invented floor);
- did IEEE-754 `newRevenue - newCogs` on save and
  `baseRevenue * (1 + g/100) * (1 + p/100)` in Monte Carlo;
- rendered a six-month $4M comparison series that no ledger produced.

Derivation moved to `src/pages/scenarios/scenarioBuilderModel.ts`. The page
reads posted prefixes 4/5/6 as the base and empty-states when there is no
ledger. Growth + pricing stays **additive** (48M + 10% + 5% = 55.2M, not
compounded 55.44M) — that identity is pinned. OpEx is an input. Teeth:
reintroducing `newRevenue - newCogs` fails the source guard.

### 2. `UnderwritingPage` (6 → 0 fabrication). Ratchet 72 → **66 / 20 files**

The page ignored the GL and rendered `96.4%` adequacy, `61.4%` loss picks and
CA/FL/TX/NY filings at `+8.4% / +12.2% / +6.5% / +4.1%`. `insuranceStore`
persisted the same quotes.

Derivation is `src/pages/insurance/underwritingData.ts`: posted premium (4),
claims (5), expense (6), loss / expense / combined ratios when the denominator
exists. Rate adequacy, loss picks and filings are disclosed. Store v2 defaults
are empty. `InsuranceEngine.calculateStats` is unused — it abs's amounts,
invents net written as 85% of gross and policy count as premium/360. Teeth:
injecting `96.4%` fails the seeded-ledger DOM probe.

### Next

Money-AST: `CreditRiskPage` (13) (skip `mockData/index.ts` — that file is the
fixture factory). Fabrication: `ExecutiveSummary` (6).

---

## Session 016 — 2026-08-18 — CreditRiskPage + ExecutiveSummary

**Branch:** `arena/01a01148-fp-a-betterversion`

### 1. `CreditRiskPage` (13 → 0). Ratchet 502 → **489 (80.05% safe)**

Real drop: 13 float operations left the product. Unsafe modules 174 → 173.

The page read the GL and then invented a whole credit book:

- `Math.abs` on every amount (contra entries inflated assets);
- opex was prefix 5 only (COGS counted, real opex missed);
- interest coverage = `(rev − opex) / (opex × 0.05)` — a 5% interest assumption;
- zero-denominator fallbacks 2.5 / 1.5 / 2.0 / 0.5 / 3.0 / 0.05 / 0.3;
- years-in-business = `5 + entityId % 15`;
- collateral = currentRatio × 1e6 × ROA × 10, then EAD from 1.2× / 0.7× / CCF 0.5.

`CreditRiskEngine` is money-safe for EL/EAD when given real facility inputs;
calling it with those inventions would have laundered a fabrication.

Derivation is `src/pages/credit/creditRiskData.ts`. Posted assets / liabilities /
equity / NI and ratios only when both sides exist. PD / LGD / EAD / EL are
disclosed. Teeth: reintroducing `.times(0.05)` fails the source guard.

### 2. `ExecutiveSummary` (6 → 0 fabrication). Ratchet 66 → **60 / 19 files**

The component ignored the GL and rendered `$4.2M / +12%`, `$1.1M / +4%`,
`$850k / −2%` plus a SaaS-bookings narrative for every entity. Tests had
encoded those quotes.

It now reads posted revenue, operating income (not EBITDA — D&A is not a
prefix) and cash account 1000. Budget variance, activity-split cash flow and
commentary are disclosed. Teeth: injecting `$4.2M` fails the empty-GL DOM probe.

### Next

Money-AST: `DashboardPage` (11) (skip `mockData/index.ts`). Fabrication:
`PatientRevenuePage` (5).

---

## Session 017 — 2026-08-18 — DashboardPage + PatientRevenuePage (+ MEMORY genesis)

**Branch:** `arena/01a01215-fp-a-betterversion`

### 0. `MEMORY/` secondary brain installed (user-ordered, mid-session)

`MEMORY/` is now the committed cross-agent brain: `INDEX.md` (boot ritual,
pointer table, danger list), `PROTOCOL.md` (binding rules), `STATE.json`,
`TRUTH.md` (verified facts only), `ASSUMPTIONS` / `HYPOTHESES` / `ANTI`
(hallucination vaccine), `INVARIANTS.md`, `MAP/`, `SCHEMA/`, `PRODUCT/`,
`QUALITY/`, `TASKS/`, `SESSIONS/`, `DECISIONS/`, `PACKS/`, `_system/`.
`node MEMORY/_system/check.mjs` is the integrity pass (paths exist, no weasel
words in TRUTH, STATE parses and matches NOW, no secrets, INDEX links resolve,
front-matter present) — currently PASS. Precedence is **disk > MEMORY > model
recollection**; MEMORY serves the Codex and never overrides it.

The first integrity run FAILED on six `MAP/TREE.md` entries written as indented
relative paths; TREE.md now uses repo-relative paths. That is the point of the
checker: MEMORY that cannot be verified is not memory.

### 1. `DashboardPage` (11 → 0). Ratchet 489 → **477 (80.3% safe)**

Real drop: 12 float operations left the product (11 here, 1 incidental on the
healthcare page). Unsafe modules 173 → 171.

The detector found arithmetic. Reading the file found worse:

- `monthlyTrend` accumulated `amt = e.debit - e.credit` into `revenue` for
  prefix-4 accounts. **Revenue was plotted with inverted sign** on the trend
  chart, the Total Revenue sparkline, the sector-KPI sparklines and the
  `AnomalyHighlight` input; monthly `netIncome = revenue - expenses` then
  compounded it. The KPI tile used `credit - debit`, so the tile and the chart
  disagreed about the sign of a dollar. No detector can see this.
- Per-entry `Math.abs` on COGS and OpEx: a contra entry (rebate, credit memo,
  reversal) _increased_ cost. Same class as session 016.
- `budgetUtilization` rendered `0.0%` in green with a full-width bar when no
  budget existed — a fabricated "0% used" signal.
- Sector KPIs summed `debit - credit` for every code then `Math.abs`-ed, so a
  revenue-coded KPI was right only by accident and a genuinely negative
  balance displayed positive.

Derivation is `src/pages/dashboard/dashboardModel.ts`: natural balance decides
sign (revenue = credit − debit, cost = debit − credit), `amount` is the
fallback only when a row carries no debit/credit, ratios are `null` when the
denominator is not positive, and `deriveDashboardKpis` returns `null` for an
empty ledger rather than a zeroed P&L. Known answer: revenue 95,000 (after a
5,000 refund), COGS 50,000 (after a 10,000 rebate), OpEx 20,000, interest
2,000, tax 3,000 ⇒ gross profit 45,000, total expenses 75,000, net income
20,000, margins 47.37 / 21.05 / 78.95%.

`Net Income` now includes prefixes 7 and 8, so the label is true instead of an
operating subtotal wearing a net-income label, and `Total Expenses` is
5+6+7+8. The identity `revenue − expenses = net income` is pinned.

Teeth: reverting the page from `/tmp` fails 10 of 13 new assertions, including
the trend-series sign lock and four source guards.

### 2. `PatientRevenuePage` (5 → 0 fabrication). Ratchet 60 → **55 / 18 files**

The page rendered a five-row denial root-cause table — Eligibility 420 /
`$840k`, Coding Error 215 / `$450k`, Prior Auth 180 / `$1.2M`, Duplicate Claim
95 / `$120k`, Medical Necessity 64 / `$2.1M` — identical for every entity and
every period, through a `DataTable` whose column config (`metric` / `value`)
did not even match its own rows. It also shipped KPI deltas with narrative
causes (`+8.4%` "volume increase in Q1", `−0.8` "coding audits effective") and
seven-point sparkline "histories" with the live value appended, which made
invented trends look measured.

`HealthcareEngine.calculatePatientRevenue` returned a hardcoded
`denialRate: 4.2`. A denial rate is denied ÷ submitted claims — 835/837 data a
general ledger does not carry — so it is now `null` by type, the page discloses
it, and a source guard forbids reintroducing a numeric assignment. The A/R-days
30-day divisor is no longer hidden: the engine returns `daysInPeriodBasis` and
the tile states it.

The pre-existing smoke test mocked `@/engines`, a module this page never
imports — a mock that never applied while looking like isolation. Removed; the
new probe runs the real engine on a seeded ledger (gross charges 1,500,000,
contractuals 300,000, net revenue 1,200,000, collection rate 50.0%, days in A/R
10.0).

Teeth: reverting page + engine from `/tmp` fails 12 of 15 new assertions.

### 3. Ratchet honesty

Per-file `--json` diff before/after shows exactly two files moved
(`DashboardPage.tsx` 11→0, `PatientRevenuePage.tsx` 1→0 money; the same
healthcare page 5→0 fabrication) and **no other file's count changed**. Both
numbers moved because the product got safer, not because measurement changed.

### Next

Money-AST: next ranked module from `--list` (skip `mockData/index.ts`).
Fabrication: Education / Government / Logistics dashboards.

---

## Session 018 — 2026-08-18 — CashForecastPage + EducationDashboardPage

**Branch:** `arena/01a01215-fp-a-betterversion`

Sandbox restore wiped `node_modules` and rewound `HEAD` to `646bdf4` while the
working tree still held session 017. Recovered per the documented drill:
`git fetch origin <branch>` → `reset --soft FETCH_HEAD` → bare `reset` →
`npm install`. The tree matched the pushed branch byte-for-byte; nothing lost.

### 1. `CashForecastPage` (10 → 0). Ratchet 477 → **464 (80.57% safe)**

Real drop: 13 float operations left the product (10 here, 3 on the education
page). Unsafe modules 171 → 169.

Again the detector found the smaller problem. Three defects it cannot see:

- **"Cash" was the whole ledger.** `computeCashTotals` summed `debit − credit`
  over _every_ entry and called the positive half "inflows", so a payroll
  debit to 6xxx counted as cash coming in and a revenue credit reduced cash.
  Cash is now read from cash accounts (prefix 10 / 11) only.
- **The category table was six typed weights.** Inflows split 70% Revenue /
  30% Other Income; outflows 40% Payroll / 35% OpEx / 15% CapEx / residual
  Debt Service. Categories now come from double entry: each cash line is
  attributed to the non-cash lines of its own journal, allocated penny-exact
  in proportion to their amounts, classified by account prefix, with an
  explicit `Unclassified` bucket and a stated attribution percentage
  (97.56% on the test ledger). A cash-to-cash transfer is not revenue.
- **The 13-week forecast was a sawtooth.**
  `(inflows / 13) * (0.8 + ((i * 13) % 40) * 0.01)`, with a balance ramped by
  `net + weekNet * (i + 1)`, and a burn rate of `outflows / 4`. The page now
  shows posted per-period history with a cumulative running balance, averages
  over periods actually posted, and declares the forward forecast unavailable
  (it needs A/R + A/P aging, a payroll calendar and a debt-service schedule).

All of it was exported to PDF and Excel.

**A green "known answer" test was pinning the fabrication.**
`CashForecastPage.money.test.ts` asserted
`buildCashCategorySplit(...)[0].inflows === 210.14` "because 300.20 \* 0.7".
That is session 012's lesson again: a test named for an oracle is only an
oracle if the expected value came from outside the code. Deleted and replaced
by `cashForecastModel.test.ts` (16 known-answer cases).

### 2. `EducationDashboardPage` (5 → 0 fabrication). Ratchet 55 → **50 / 17 files**

The page read **nothing**. Every figure was a literal for a fictional
university: `$485.0M` tuition, `$18,240` cost per student, `$105.0M` financial
aid, `$95.0M` research funding, `4.8%` endowment utilisation, a `15:1`
student-faculty ratio, 38,700 students across five semesters, a six-slice
expense pie (Faculty 312M, Admin 145M …) and a six-row budget-vs-actual table —
identical for every tenant, entity and period. `/sectors/education` and
`/sector/education` are both routed; the latter already renders the
driver-based `SectorDriverDashboard`.

Derivation is `src/pages/sectors/educationDashboardData.ts`: revenue (prefix 4)
and cost (5–8) grouped by account with real shares, and budget line items
joined to actuals **by account code**. Favourability now follows natural
balance — the old table decided it with `category.includes('Revenue')` on a
hand-typed label. Budget lines with no posted actual are dropped rather than
shown as a 100% shortfall, and a zero budget yields a `null` variance percent.
Enrolment comes only from the education store when the user has entered it
(store defaults were already empty); cost per student follows from it or is
`—`. Endowment utilisation is always disclosed as not derivable.

Its smoke test asserted the invented labels and mocked `useEducationStore` as
returning a `kpis` array — a shape that store has never had, so the mock proved
nothing. Rewritten against the real derivation.

### 3. Ratchet honesty

Per-file `--json` diff: `CashForecastPage.tsx` 10→0 and
`EducationDashboardPage.tsx` 3→0 money, `EducationDashboardPage.tsx` 5→0
fabrication. No other file moved. Both numbers moved because the product got
safer.

### Next

Money-AST: `RollingForecastPage` (10) — skip `mockData/index.ts` (13).
Fabrication: `GovernmentDashboardPage` (5), then `LogisticsDashboardPage` (5).

---

## Session 019 — 2026-08-18 — RollingForecastPage + GovernmentDashboardPage

**Branch:** `arena/01a01215-fp-a-betterversion`

Sandbox restore wiped `node_modules` and rewound `HEAD` again; recovered with
the documented drill. Second consecutive session — the drill is now reflexive.

### 1. `RollingForecastPage` (10 → 0). Ratchet 464 → **453 (80.87% safe)**

Real drop: 11 of the 13 operations removed are float arithmetic leaving the
product. **2 are a reclassification, not new safety**: the bar-width
percentages moved to `src/utils/chartScale.ts`, so layout geometry is no longer
written over money-named expressions. Said plainly because the ratchet cannot
tell those apart. Unsafe modules 169 → 167.

Four defects the detectors cannot see:

- **The monthly series mixed the whole ledger.**
  `existing.actual += e.debit − e.credit` ran over every account, so
  balance-sheet postings entered the "actual" trend and revenue entered it with
  the sign flipped. Growth, projection and accuracy all inherited it.
- **"Forecast Accuracy" never looked at a forecast.** It was
  `variancePcts.filter((v) => Math.abs(v) < 0.1).length / length` — the share
  of months whose _actual_ moved less than 10% from the prior month — and it
  shipped as a headline KPI. Replaced by a walk-forward backtest: fit on the
  months before k, predict month k, compare with what posted. The difference is
  not cosmetic: on a steady 10%-growth ledger the old rule reports **0%** while
  the method is exact; the backtest reports **100%**.
- **`confidenceInterval: 8.5`** was a literal rendered as `±8.5% · 95% CI`, and
  the help text described it as "the historical forecast error distribution".
  Both removed; the interval is declared unavailable.
- **Premature rounding.** `roundTo(sumMoney(growthRates), 2) / n` rounds the
  _sum of dimensionless ratios_ to two decimals before dividing, quantising the
  growth rate to 1/(2n) steps.

Also: the tiles labelled "Forecast Revenue" and "Forecast Expenses" were
displaying posted actuals. They now say Posted. Revenue and expense growth are
measured separately and net income is derived from the two projections, so a
projected margin cannot drift from its own components. Projection requires 3
posted months with a positive base, otherwise `null` and disclosed.

### 2. `GovernmentDashboardPage` (5 → 0 fabrication). Ratchet 50 → **45 / 16 files**

- **A demo fallback is a fabrication.** `mockDepartmentBudget`,
  `mockRevenueByCategory` and `mockSpendingDistribution` rendered whenever the
  government store was empty — the state of every new workspace — so a fresh
  tenant saw Education allocated 3,100 at 93.2% execution and 4,200 of Income
  Tax presented as their own figures. The comment called them "demo defaults";
  the user has no way to know that.
- The KPI strip (`$11.8B`, `$8.95B`, `$800M`, `1.48x`, `$1.9B`, `87.3%`,
  `$342`) and the FY2024/FY2025 table never touched a store at all.
- Budget lines' `budgeted` was charted as "Revenue by Category" and the same
  lines' `actual` as "Spending Distribution" — one dataset presented as two
  different things, neither of which it was.

`src/pages/sectors/governmentDashboardData.ts` derives revenue (4) and
expenditure (5–8) from the ledger, execution from appropriation lines
(`null` when nothing was allocated), and the fiscal-year comparison from the
years actually posted (`null` change without a prior year). Debt-service ratio,
capital expenditure and programme effectiveness / cost per citizen are
disclosed as not derivable.

Its smoke test passed _only_ because of the demo fallback: it rendered with an
empty store and asserted departments and charts appeared. Rewritten.

### 3. Ratchet honesty

Per-file diff: `RollingForecastPage.tsx` 10→0 and `GovernmentDashboardPage.tsx`
1→0 money, `GovernmentDashboardPage.tsx` 5→0 fabrication. Nothing else moved.

### Next

Money-AST: `ValuationPage` (10) / `PromoAnalysisPage` (10) — skip
`mockData/index.ts` (13). Fabrication: `LogisticsDashboardPage` (5), then
`ForecastBuilderPage` / `ClinicalTrialCostPage` (4).

---

## Session 020 — 2026-08-18 — ValuationPage + LogisticsDashboardPage

**Branch:** `arena/01a01215-fp-a-betterversion`

Third consecutive sandbox rewind; recovered with the documented drill.

### 1. `ValuationPage` (10 → 0). Ratchet 453 → **443 (81.03% safe)**

Real drop: 10 float operations left the product. Unsafe modules 167 → 166.

- **One cap rate, stamped on every property.** The table column read
  "Implied Cap Rate" and every row rendered `dashStats.capRate` — the
  _portfolio_ figure — so five properties displayed one identical number as if
  each had been measured. The summary then computed
  `Σ(capRate × value) / Σ value` over that constant, which returns the
  constant, and displayed it as "Weighted Cap Rate". Each property now uses its
  own NOI (its 40xx less its 50xx) or renders blank, and the portfolio rate is
  a true value-weighted `Σ NOI / Σ value` with coverage stated
  ("1 of 2 properties").
- **"Avg. Appreciation" was a mean of percentages.** On the test ledger that is
  17.5%; the value-weighted figure is 20.0%. Means of ratios are not ratios of
  sums.
- **Typed KPI deltas**: `+8.4% vs prior period`, `+15.2% since acquisition`,
  `+2.1% above market avg`, `−0.15 compression`. Removed — a period comparison
  needs a valuation history the workspace does not store.
- **`RealEstateEngine` is no longer called here.** Its breakdown returns
  `yield: 6.2` (mocked), `location: 'TBD'` and a Core/Value-Add status decided
  by `cost > 10_000_000`; its dashboard stats carry `occupancy: 94.8` and
  `avgHoldingPeriod: 4.2`. LTV and NOI are derived directly instead. (The
  engine still carries those placeholders for other callers — carried debt.)

### 2. `LogisticsDashboardPage` (5 → 0 fabrication). Ratchet 45 → **40 / 15 files**

- Three module-level fixtures rendered for every tenant: service-line revenue
  (FTL 4,820,000 … 3PL 720,000), a cost pie (Fuel 28% … Admin 5%) and twelve
  months of shipment volume (Jan 12,400 … Dec 18,400).
- A seven-literal KPI strip: `$11.77M`, `$842`, `82.6%`, `78.3%`, `3.2` days,
  `$2.84`/mile.
- **On-time delivery fell back to `96.4%`** whenever the store was empty —
  the same demo-fallback class as session 019's government page.
- **A cost was displayed as a revenue.** "Top Shipping Lanes" mapped
  `RouteCost.cost` into a field named `revenue`.

Derivation is `src/pages/sectors/logisticsDashboardData.ts`: revenue and cost
grouped by posted account with real shares, on-time rate from recorded
shipments (`null`, never a default), cost per shipment only when shipments
exist, lane economics labelled cost with cost per load. Fleet utilisation,
warehouse capacity, transit time, revenue per mile and the service-line split
are disclosed as needing telematics / a WMS / mileage / a COA dimension.

Both legacy smoke tests passed _only_ because of the fixtures and the fallback;
both rewritten.

### 3. Two guards tripped on their own disclosure prose

The session-011 trap, twice in one session: a data assertion matched `94.8` and
`FTL` inside the "not derivable" copy that deliberately names them. Fixed by
asserting against the derived data (`properties`, chart series) rather than
page text — and the real-estate disclosure no longer leaks internal placeholder
constants to users at all.

### Next

Money-AST: `PromoAnalysisPage` (10), then `InsuranceEngine` (9) — skip
`mockData/index.ts` (13). Fabrication: `ForecastBuilderPage` (4),
`ClinicalTrialCostPage` (4), `TelecomDashboardPage` (4).

---

## Session 021 — 2026-08-18 — PromoAnalysisPage + ForecastBuilderPage

**Branch:** `arena/01a01215-fp-a-betterversion`

Fourth consecutive sandbox rewind; recovered with the documented drill.

### 1. `PromoAnalysisPage` (10 → 0). Ratchet 443 → **430 (81.3% safe)**

Real drop: 13 float operations left the product (10 here, 3 on the forecast
builder). Unsafe modules 166 → 164.

The tell was in the first line of the component:
`const { entries: _entries } = useGLStore();` — the ledger was read and thrown
away. Everything on the page came from five hardcoded campaigns (Summer Sale
320,000 revenue on 45,000 spend against a 210,000 baseline, Back to School,
Holiday Bundle, and two more), and all of it was **exported to PDF and Excel**.

Promotions are not ledger objects, so this session added a real
`retailStore.promotions` collection (persist v1 → v2, defaulting to empty — a
persisted workspace must not materialise campaigns it never entered) and
derived the analysis from it.

Two correctness defects beyond the fixtures:

- **ROI treated revenue as profit.** `(revenue − baseline − cost) / cost` is
  incremental _revenue_ less spend, labelled simply "ROI". Return is now
  computed on gross margin when a campaign records one, the basis is displayed
  beside the number, and a mixed set never blends the two bases (it falls back
  to the revenue basis and says so).
- **A lift could not be negative.** The column hardcoded a leading `+`, so a
  campaign that destroyed revenue rendered `+-12%`.

### 2. `ForecastBuilderPage` (4 → 0 fabrication). Ratchet 40 → **36 / 14 files**

- **The forecast was built on six invented months.**
  `HISTORICAL_ACTUALS = [4_200_000, 3_900_000, 4_500_000, 4_100_000, 4_400_000,
4_600_000]`. The page never read the ledger. History is now posted revenue by
  period.
- **Four accuracy statistics were literals** — `MAPE 4.2%`, `RMSE $182K`,
  `R-Squared 0.94`, `Bias −1.8%` — rendered under the heading "Forecast
  Accuracy", plus a `Confidence 87%` tile. They are now produced by a
  walk-forward backtest of the _selected_ method against the user's own months
  (so switching method changes the score, as it must), and reported as
  unavailable below four posted months.
- **The confidence band was `widenPct = 0.06 + i * 0.015`** — a 6% band
  widening 1.5 points per period, identical for every dataset and every method.
  Bands are now `forecast ± 1.96σ` of backtest residuals, omitted entirely when
  no backtest is possible.
- **A past forecast that was never made was plotted.** The history chart drew
  `actual + round(actual * 0.02 − 50_000)` as the forecast line over past
  months, manufacturing a track record that hugged actuals. Past periods now
  carry actuals only.

**A green money test was pinning the invented band.**
`ForecastBuilderPage.money.test.ts` asserted 940,000 / 1,060,000 then
925,000 / 1,075,000 for a flat 1,000,000 forecast — that is the 6% + 1.5%/period
rule, encoded as an expectation. Replaced with residual-based assertions. That
is the third such test found in five sessions (session 018's 70% cash weight,
session 020's `computeConfidenceBands`, this one).

**An honest wrinkle worth recording:** with the default `standard` seasonality
preset, a perfectly flat revenue series backtests at _non-zero_ error, because
the preset imposes a shape the data does not have. That is correct behaviour —
the backtest charges the model for its own assumption — and the probe asserts
the derived figure rather than the 0% I first assumed.

### 3. Ratchet honesty

Per-file diff: `PromoAnalysisPage.tsx` 10→0 and `ForecastBuilderPage.tsx` 3→0
money, `ForecastBuilderPage.tsx` 4→0 fabrication. Nothing else moved.

### Next

Money-AST: `InsuranceEngine` (9) — it invents net written as 0.85× gross and
policy count as premium/360 — then `BenchmarkingPage` (8). Skip
`mockData/index.ts` (13). Fabrication: `ClinicalTrialCostPage` (4),
`TelecomDashboardPage` (4).

---

## Session 022 — 2026-08-18 — InsuranceEngine + ClinicalTrialCostPage

**Branch:** `arena/01a01215-fp-a-betterversion`

Fifth consecutive sandbox rewind; recovered with the documented drill.

**Correction to the fix commit message:** it says 81.68% safe. The measured
figure is **81.44%** (421 unsafe ops / 163 unsafe modules). The baseline file
and the gate carry the correct number; the prose in that commit does not.

### 1. `InsuranceEngine` (9 → 0). Ratchet 430 → **421 (81.44% safe)**

Real drop: 9 float operations left the product. Unsafe modules 164 → 163.

The engine was **armed but called by no product code** — `UnderwritingPage`
stopped using it in session 015 and nothing else picked it up. That is exactly
hypothesis H-003 in MEMORY: engines that survive because no page calls them.
Fixed rather than left loaded, because the insurance vertical will need it.

- **`Math.abs` on every amount.** A premium refund or a claim recovery
  _increased_ the balance it should reduce. Premium is now credit-normal,
  expense debit-normal, netted.
- **`netWrittenPremium = grossWrittenPremium * 0.85`** — an invented 15%
  reinsurance cession applied to every book, for every tenant. It is now gross
  less posted ceded premium (43xx), or `null` when no cession is posted.
- **`policyCount = Math.round(gross / 360)`**, commented "Industry average".
  A ledger records amounts, not policies. `null`.
- **`getCombinedRatioTrend` ignored its argument entirely** and returned six
  months of `58 + sin(i * 9301 + 49297) * 8` loss ratios and `26 + … * 3`
  expense ratios — seeded noise rendered as a ratio trend. It now buckets
  posted entries by period and drops a period with no earned premium rather
  than filling it.

**Three assertions encoded those fabrications** (`netWrittenPremium ===
1250000 * 0.85`, `policyCount === 0` on an empty ledger, "generates a 6-month
deterministic combined ratio trend"). That is the **fourth** test found
protecting a fabrication in six sessions. A fifth assertion in the same file
added the two ratios as JS floats and expected `77.83000000000001`, where the
decimal engine returns `77.83` — now pinned as a regression lock in the
opposite direction.

### 2. `ClinicalTrialCostPage` (4 → 0 fabrication). Ratchet 36 → **32 / 13 files**

Five studies at named institutions (Onco-Shield Ph III at Mayo Clinic,
Neuro-Restore Ph II at Johns Hopkins, Cardio-Flow Ph I at Cleveland Clinic,
Immuno-Boost Ph III at Cedars-Sinai, RareDisease-7 at Stanford Med), six months
of budget/actual/enrolment, a four-literal KPI strip (`$24.8M`, `$18.5k`,
`92.4%`, `$3.2M`) with invented deltas and sparkline histories, and a phase
breakdown quoting "2 active, $13.6M total · 55%".

Trials are not ledger objects, so this session added
`healthcareStore.clinicalTrials` (persist v1 → v2, defaulting empty) and
derived the analysis: variance against recorded budget, cost per patient
(`null` until someone is enrolled), enrolment rate (`null` without a target),
phase shares by recorded budget. R&D tax credits are disclosed as a tax
computation the workspace does not run.

**The ratchet caught my own new code.** The first version of the rewritten page
grouped phases inline with float `+` and `toFixed(1)` — 5 new unsafe ops. Moved
into the derivation on decimal.js, with `compareMoney` for the sort.

### 3. Carried forward — a store still shipping seeded defaults

`healthcareStore` persists invented `qualityMetrics`, `savingsData`
(Orthopedics target 2,400,000 …) and `programs` for every tenant — the same
class cleaned out of `constructionStore` and `insuranceStore` in sessions
014–015. They feed `ValueBasedCarePage`, which is on the fabrication worklist.
Left in place this session to keep the diff honest; flagged in MEMORY.

### 4. Ratchet honesty

Per-file diff: `InsuranceEngine.ts` 9→0 money, `ClinicalTrialCostPage.tsx` 4→0
fabrication. Nothing else moved.

### Next

Money-AST: `BenchmarkingPage` (8), then `DriverCascadeEngine` (7) — skip
`mockData/index.ts` (13). Fabrication: `TelecomDashboardPage` (4), then
`ConstructionDashboardPage` (3) / `EquipmentManagementPage` (3).

---

## Session 023 — 2026-08-18 — PR #65, and the CI failure that was real

**Branch:** `arena/01a01215-fp-a-betterversion`

### 1. PR #65 opened

`Phase 0 W0.1.1: money-AST 489 → 421, fabrication 60 → 32, and the MEMORY brain`
— https://github.com/Warzonesiddiki/fp-A-betterversion/pull/65 (26 commits,
108 files, +10,642 / −1,969).

CI on the PR: TypeScript, ESLint, Build (ubuntu / macOS / **windows** — Tier 1),
Cascade-Hold Ledger and the Sentry self-test all **pass**. `test-unit`
(Vitest) **fails**.

### 2. The carried assumption about that CI job was WRONG

`.agent/HANDOVER.md` has said for several sessions: _"GitHub Vitest coverage job
fails (no coverage/ artifact); that is not a product-test fail."_ Checked
instead of assumed:

- The failing step is **5 · Run Vitest with 80 GiB heap + coverage**, not the
  upload. Step 6 (upload coverage artifact) **succeeds**.
- The same signature is on `main` for the PR #64 push (run 32080862062), so it
  is pre-existing and not introduced here — but it was never benign.

Running the full suite locally settled it: **6 test files / 6 tests failing**,
14,225 passing. The suite was genuinely red and had been reported as
infrastructure noise.

**Why local gates never saw it:** pre-push runs an 839-test P0 shard. None of
these six files is in that shard, so five sessions of empty-state work landed
without the collisions ever being visible.

### 3. The six failures

Five were caused by this arc:

- **UI-07 contract** (`buttonContrast.contract.test.ts`): an empty-state
  `<main>` carrying a heading must start at `<h1>`, because on the no-data
  branch the page never reaches `PageHeader` and the document ships with no
  `h1`. Education, Government and Logistics used `<h2>`. A screen-reader user
  landing there got no page title. Fixed in all three.
- **`smoke-retail-saas`** and **`__tests__/retail/PromoAnalysisPage`**: the page
  empty-states now instead of rendering five fixture campaigns, so
  "Promotion Analysis" is absent with an empty store. Both now assert the empty
  state _and_ seed a campaign to exercise the populated branch.
- **`smoke-sector-subpages`**: same shape for `ClinicalTrialCostPage`.
- **`__tests__/forecasts/ForecastBuilderPage`**: the accuracy description now
  names its method ("Mean Absolute Percentage Error — walk-forward backtest"),
  so an exact-string match stopped matching.

One was pre-existing and **masked**:

- **`__tests__/scenarios/ScenarioBuilderPage`** hand-listed its lucide icons and
  threw `No "Layers" export is defined on the mock` the moment session 015's
  empty state used `<Layers>`. Switched to the shared `createLucideMock`; the
  assertion then revealed the page correctly empty-states without a ledger, so
  it asserts that.

### 4. Verification after the repair

Full suite: **1243 files · 14,234 passed · 1 skipped · 0 failed.**
`tsc --noEmit` clean · `eslint src --max-warnings 0` clean · money ratchet 421
holds · fabrication ratchet 32 holds.

### 5. Blocked: GitHub token expired mid-session

`gh auth status` → _"The github.com token in GH_TOKEN is no longer valid."_ The
repair commit is **committed locally but not pushed**, and PR #65 is **not
merged**. Do not merge #65 until the repair commit is pushed and `test-unit`
re-runs — the PR as it stands on the remote is genuinely red.

### 6. Lesson for the ratchet discipline

A gate that runs a shard is not a gate that runs the suite. The pre-push P0
shard is fast and valuable, but "all gates green" was reported for five
sessions while the full suite was red. Either widen the shard to include the
smoke/contract files that every page rewrite touches, or run the full suite
before opening a PR. Recorded in MEMORY/ANTI.

## Session 024 — 2026-08-19 — PR #65 lands; Benchmarking + DriverCascade money-safety; four fabrication pages and the healthcareStore seeds

**Branch:** `arena/01a0178d-fp-a-betterversion` (forked from merged `082e70c`)

### 1. T-024 resolved at boot

GitHub was reconnected between sessions. The repair commit had been pushed,
`test-unit` re-ran green, and PR **#65 was MERGED** at 2026-08-19T01:03:55Z
(`main` @ `082e70c`). All post-merge `main` checks, test-unit included,
finished green. No merge-red risk materialised.

### 2. Money-AST: 421 → 404 unsafe ops (81.44% → 81.86%)

Three files moved; the per-file `--json` diff proves nothing else did
(160 of 163 unsafe files untouched):

- **`BenchmarkingPage` (8 → 0)** — extracted
  `src/pages/analytics/benchmarkingData.ts` (+ 9 known-answer tests). The old
  page had FOUR Severity-0-class defects, invisible to both detectors:
  `Math.abs` on every natural-balance group (a contra posting — accumulated
  depreciation, a revenue reversal — INCREASED the balance); `|| 1` on every
  empty denominator (dividing by an invented dollar); net income that skipped
  prefixes 7 and 8 (interest and tax never reduced it); and a **Quick Ratio
  card that displayed the Current Ratio** (no inventory adjustment existed).
  The quick ratio is now permanently `null` with a disclosure: inventory has
  no account-code prefix, so it is not derivable. Net income follows the
  session-017 DECISION (4 − (5+6+7+8)).
- **`DriverCascadeEngine` (7 → 0)** — the engine is LIVE (DriverPlanningPage,
  driverStore, DriverPanel, CascadeRuleBuilder consume it) and its cube
  measures hold currency. Cascade deltas, weightings and impact accumulation
  now route through `@/utils/money`; `Math.round(x*100)/100` became
  `roundTo(x, 2)`. Behavior preserved: engine tests and every consumer suite
  green. The new probe pins `0.3 + 0.6 = 0.9` — the float path reported
  `0.8999999999999999` — and a `percentageChange` drift case (3, not
  2.9999999999999982).
- **`telecomStore.getAverageARPU` (2 → 0)** — ARPU is money; float
  `reduce(sum + monthlyRevenue)` became `sumMoney`/`divideMoney`. Drift test:
  ARPU of [1.1, 2.2, 3.3] is exactly 2.2 (float: 2.2000000000000002).

### 3. Fabrication: 32 → 19 findings (13 → 9 files)

Four files moved; the per-file diff proves nothing else did:

- **`TelecomDashboardPage` (4 → 0)** — module fixtures (segment revenue $B,
  CapEx pie, six quarters of subscriber growth) and five literal KPIs (churn
  rate, network CapEx, EBITDA margin, coverage, CAC) removed. The page now
  derives active subscribers, ARPU (decimal), churn-risk mix, network metrics
  and subscriber history from `telecomStore` via
  `src/pages/sectors/telecomDashboardData.ts`, and discloses the unrecorded
  metrics in a "Not shown" card. Empty state carries the `<h1>` (UI-07).
- **`ConstructionDashboardPage` (3 → 0)** — read NO store: fictional backlog
  trend, five invented projects with budgets/margins, hardcoded KPIs and a
  42/58 labor split. Now derives budget/actual/variance totals, approved
  change-order value and ledger rows from `constructionStore`
  (`constructionDashboardData.ts` with strict `parseMoneyText` — unparseable
  amounts are counted and excluded, never coerced to 0). No product code
  writes to that store yet, so every tenant sees the honest empty state —
  which is the fix. Backlog/pipeline/fleet disclosed as not recorded.
- **`EquipmentManagementPage` (3 → 0)** — no equipment, telemetry or
  maintenance data source exists anywhere in the workspace (grep-verified).
  The page is now an honest empty state disclosing exactly that, instead of a
  five-asset fictional fleet with invented utilization/fuel/service figures.
- **`ValueBasedCarePage` (3 → 0) + healthcareStore seeds** — the fabrication
  existed in TWO places: module fixtures in the page AND seeded defaults
  persisted by `healthcareStore` for every tenant. Both removed. Store
  persist bumped **v2 → v3**: migration clears `qualityMetrics` /
  `savingsData` / `programs` for upgrading tenants (`clinicalTrials` — real
  user input — survives); three migration tests pin it. Episode savings is
  now DERIVED as target − actual (the hand-entered `savings` field is ignored
  in totals); aggregate quality score is the ratio of sums (Σ scores ÷ Σ
  full marks = 83.33% on the known-answer set, where a mean of percentages
  would wrongly report 85%). ROI and Compliance tiles removed as
  underivable; disclosed.

### 4. Verification

- Teeth: reverting all eight production files to HEAD fails **37** of the new
  assertions; restoring returns **130/130** green across the 17 touched files.
- Full suite: see the numbers reported at push time (run before opening the PR,
  per the s023 standing rule). tsc clean; eslint clean on every touched dir.
- Ratchets rebaselined (prettier-written): money 404 / 160 / 81.86%,
  fabrication 19 / 9. Export engines remain at 0.
- CHB-008 added to `docs/security/CASCADE_HOLD_LEDGER.md` acknowledging
  gate 10's fresh-branch flags of the already-merged #64/#65 squashes.

### 5. Lesson for the discipline

A page and its store can carry the SAME fabrication twice — cleaning one copy
leaves the other shipping to every tenant. When a page reads a store, read
the store's persist defaults before declaring the surface clean; when a store
ships seeds, grep for the pages that render them. Recorded in MEMORY/ANTI
along with the selector-mock and regex-literal traps hit this session.

## Session 025 — 2026-08-19 — PR #66 opens; RevRecEngine money-safety; EnergyRiskPage honesty

**Branch:** `arena/01a0178d-fp-a-betterversion`

### 1. Unblock + PR #66

GitHub auth returned mid-session — the persistent 403 on `gh api user` was only
the App token lacking the `user` scope; repo operations worked. Session-024's
five commits pushed through all pre-push gates and **PR #66 opened** (session-024
wave pair + README adoption fix).

### 2. Money-AST: 404 → 397 (81.86% → 81.97%)

- **`RevRecEngine` (7 → 0)** — the ASC 606 engine. `allocateTransactionPrice`
  summed standalone selling prices with float `reduce` and derived the
  allocation percentage with float `/`; `getContractAssetLiability` ran billed
  and recognized totals on float `+=` and subtraction — emitting
  `30.299999999999997` for a `10.10 + 20.20` contract asset. All now decimal
  via `@/utils/money` (`sumMoney`, `divideMoney`, `addMoney`, `Decimal.max`
  clamps), rounding only on emission. The L1 lens also caught an UNFLAGGED
  float `weights.reduce` inside `calculateRevenueSchedule` and fixed it.
  Behavior preserved: the existing ASC 606 suite is untouched and green; the
  new probe pins the drift case. Per-file diff confined (159/160 untouched).

### 3. Fabrication: 19 → 16

- **`EnergyRiskPage` (3 → 0)** — read nothing at all: a fictional trading book
  (VaR $2.42M, 78.2% hedge ratio, 16.4% volatility, four named-counterparty
  derivative positions). L2 verified no recording surface exists — `energyStore`
  carries generation only, there is no hedge/derivative store, and
  `FinancialInstrumentsEngine` has zero product callers. Inventing a VaR is
  exactly the Severity-0 class this wave removes, so the page empty-states with
  disclosure. Its smoke assertions updated to assert the honesty (no KPI
  tiles, no positions table until recorded). Per-file diff confined (8/9
  untouched).

### 4. Verification

Teeth: reverting both production files fails **10** of the new assertions;
restore returns the batch green (48/48, then 78/78 with money.test.ts). tsc +
eslint clean. Full suite re-run before push: **1252 files · 14,306 passed ·
1 skipped · 0 failed**. Baselines rebaselined: money 397 / 159 / 81.97%,
fabrication 16 / 8.

### 5. Process

LENS protocol (user directive) adopted into `MEMORY/PROTOCOL.md` and applied
this session: four specialist review passes — FP&A Controller, Red-Team
Sentinel, Accessibility/UX, Release Engineer — before any task is declared
done. It paid immediately: L1 found the unflagged float reduce; L2 prevented
an empty-state from hiding a real data source. Cosmic UI evaluated and queued
post-Phase-0 as an optional theme (QUEUE item 12), not adopted during the
correctness wave.

## Session 026 — 2026-08-19 — BalanceSheetPage: the identity that could not hold; InsuranceDashboardPage: a page with no ledger

**Branch:** `arena/01a0182b-fp-a-betterversion` (from `main` @ `ec7a66a`, PR #66 merged)

### 1. Money-AST: 397 → 390 (81.97% → 82.13%)

**`BalanceSheetPage` (7 → 0)**, chosen over `LeaseEngine`/`LeaseDetailPage` because
it is K18-core. The seven flagged operations were the least of it. The L1
controller pass found a Severity-0 defect neither detector can see:

`computeBalanceSheet` rolled up account prefixes 1, 2 and 3 and then asserted
`Assets = Liabilities + Equity`. In double entry the sum of debits equals the sum
of credits, therefore

```
Assets − Liabilities − PostedEquity  ≡  Revenue − Expenses  ≡  NetIncome
```

so the page reported **"Off by _net income_"** on any perfectly balanced ledger
that had traded, and the number it labelled "Total Equity" was contributed
capital plus _prior_ retained earnings only. Current-period profit sits in the
open P&L accounts until the books are closed. `src/pages/reports/threeStatementData.ts`
has derived closing equity as `postedEquity + netIncome` since session 008 — two
surfaces in the same product disagreed about equity on the same GL, and the suite
was green.

Three more defects in the same 30 lines:

- the balance test was `Math.abs(diff) < 0.01`, so a genuine one-cent break
  passed as balanced;
- the as-of filter compared raw `e.date`, and `'2026-06-30T09:15:00Z' <= '2026-06-30'`
  is `false`, so an ISO-timestamped entry was dropped from its own day's report;
- entries whose account code carries no 1–8 class prefix fell out of every total
  silently — the sheet then could not balance and the page could not say why.

The derivation moved to **`src/pages/reports/balanceSheetData.ts`** (decimal
throughout, one rounding on emission, exact-zero balance test, unclassified
movement counted and disclosed). The page now formats and re-adds nothing:
`report.totalLiabilitiesAndEquity` is derived once. Its empty-state heading went
`<h2>` → `<h1>` (UI-07) and the dead help button was removed.

24 known-answer cases plus 6 source guards in `balanceSheetData.test.ts`; new DOM
probes in `BalanceSheetPage.deep.test.tsx` for the traded-books case and the
unmapped-account note.

### 2. Fabrication: 16 → 13

**`InsuranceDashboardPage` (3 → 0)** read no store and called no engine. The
detector flagged three strings; the page shipped far more: `142,800` policies,
six months of typed loss/expense ratios, five premium lines, a five-row
"Underwriting Results" table of named products with typed per-line loss and
combined ratios and an `Improving`/`Stable`/`Worsening` trend word, and three
invented KPI deltas (`change={-6.2}`, `change={14.2}`,
`changeLabel="YTD growth 12%"`). **KPI deltas, sparkline arrays and trend words
are invisible to the fabrication detector.**

Worse, its own test file `vi.mock`-ed `@/engines` — a barrel the page did not
import — so the mock never applied and neither assertion touched a number. That
is the same shape as the board-pack tests from session 010.

Everything is now derived through **`src/pages/insurance/insuranceDashboardData.ts`**,
which wraps the real `InsuranceEngine` (de-fabricated in session 022: natural
balance, no `× 0.85` cession, no `/ 360` policy count, no `sin()`-seeded trend).
Deliberate absences, disclosed on the page:

- **policy count** — a ledger records amounts, not contracts (`null`);
- **per-line loss and combined ratios** — the engine's line split reads the last
  two digits of 41xx/42xx premium codes; 51xx–53xx carry no line dimension, so a
  per-line ratio would need an allocation nobody posted. The table publishes
  written, earned and `written − earned`;
- **net written premium** — shown only when cessions are posted to 43xx.

Ratio movements are quoted as the prior period's own value rather than pushed
through KPIValue's `%` arrow, because a combined-ratio movement is percentage
points, not percent change. `insuranceStore`'s persist seeds were read first
(session-024 trap) and are already empty at version 2. The dead "Detailed Report"
button was removed and "Export Report" wired to a real Excel export that marks the
absent measures as absent.

13 known-answer cases + 6 source guards; the page test rewritten to 11 DOM probes
against the real engine and the real store.

### 3. Verification

- **Per-file `--json` diff** against a `git worktree` of HEAD: exactly one file
  moved on each ratchet — money `BalanceSheetPage.tsx` 7→0 (158 of 159 untouched),
  fabrication `InsuranceDashboardPage.tsx` 3→0 (7 of 8 untouched). Both moves are
  product safety, not measurement drift. Two new modules entered the scan already
  safe.
- **Teeth:** with both derivation modules present and only the two pages reverted
  to HEAD, **21** new assertions fail. Reverting the single line
  `postedEquity.plus(currentPeriodEarnings)` → `postedEquity` fails **8** more.
- **L4 caught what the shard would not have.** The first full-suite run came back
  **1 failed / 14,362 passed** — `src/theme/lightContrast.contract.test.ts` on two
  new `text-slate-300` cells with no dark ancestor. Swapped for
  `--text-secondary` and re-run. This is the fifth session in which the full suite
  found something the 839-test P0 shard does not cover.
- tsc clean; eslint clean; README claim check green (87 adopters).

### 4. `.agent/state.json` was empty on main

Probing the file the Codex reads at boot step B8 showed **0 bytes**. It held 12,028 bytes at
`646bdf4` (PR #64), was truncated at `082e70c` (PR #65) and shipped empty again at `ec7a66a`
(PR #66). `blueprint_status` lives there, so on a strict reading of Article XVIII the last two
merges left the tree in a state where no product code was permitted. Restored from `646bdf4`
and brought forward: session id, ratchets (390 / 13), the five W0.1.1 modules completed since,
and the balance-sheet Severity-0. `wc -c .agent/state.json` is now a documented boot check.

### 5. Carried forward

`src/pages/sector/InsuranceDashboardPage.tsx` (routed at `/sector/insurance`) derives
"revenue" as `entries.filter(e => e.credit > e.debit).map(e => e.credit)` and "claims"
from `accountName.toLowerCase().includes('claim')` — a per-entry sign filter and a
free-text name match, neither of which is a chart-of-accounts rule. Neither detector
flags it. Logged in `MEMORY/TASKS/NOW.md` as a semantics fix for a later wave.

## Session 027 (2026-08-20)

Money-AST 390 → **376** (`LeaseEngine` 7→0, `LeaseDetailPage` 7→0). Fabrication 13 → **10** (`BoardPackPage` 3→0).

LeaseEngine: six flags were period/index on `lease*` names; recoverability now `compareMoney`.
LeaseDetail: extracted `leaseDetailData.ts` (no Math.round on money).
BoardPack: removed seeded T&E/software/supplies literals and $4.5M commentary; closing equity includes NI; gross margin is (rev−COGS)/rev; empty-state h1.

Full suite 1257 / 14373 / 1 skipped / 0 failed. Teeth: 3 source guards fail on page revert.

## Session 031 — 2026-08-20 — Session Zero re-audit + W0.8.1–0.8.5

**Branch:** `arena/01a02032-fp-a-betterversion`
**Starting commit:** `f2ea326` (session 030, money-AST 99.66%)

Money was already at the Phase 0 gate (≥90%). The constitution says: fix money, then
authority. W0.8 is the authority workstream (R-21, score 20).

### Session Zero

Re-measured rather than copying prior counts. 2,425 TS/TSX files, 187 engines, 44 store
modules, **41 persist() stores**, 193 lazy routes, `tenant_id` = 0 in `server/src/db/`.
Artefacts: `.agent/repo_audit.md`, `repo_inventory.md`, `module_scores.csv`,
`fake_finance_findings.md`, `ui_ux_audit.md`. Decision remains EVOLVE, not rewrite.

### W0.8.1 Persistence inventory

`src/domain/persistenceAuthority.ts` is the typed contract. `docs/architecture/PERSISTENCE_MAP.md`
is generated. `scripts/persistence-map-check.mjs` fails CI if a `persist({ name: '*-store' })`
appears without a registry row. 41/41 match.

### W0.8.2 Money-safe serialization

`src/utils/moneySerialize.ts` tags money-keyed numbers as `$d:<canonical>` before JSON.
`masterStorage.setItem` encodes objects; `getItem` revives tags. Property test: 10,000
deterministic cent-precision Decimals round-trip bit-identically, plus non-cent literals
(`1.005`). INV-009 now has an executor. Honest concession: in-memory hydrate is still a
JS number so existing stores type-check; the _at-rest_ form is the string. SQLite REAL
columns are M003, not this gate.

### W0.8.3 Authority rule

Financial-truth stores cannot be `authority: 'local'`. Today every financial-truth row is
`local-draft`. `gl-store` is the W0.8.6 spike target and is still a draft.

### W0.8.4 Schema fork

`scripts/schema-equality-check.mjs`: 35 SQL tables, 10 in-code DDL tables, 1 shared
(`audit_trail`) — columns agree. SQL-only and server-only lists are documented, not failed.

### W0.8.5 Durability honesty

`DurabilityBanner` on `AppLayout`: "Draft workspace — local only. Clearing site data
permanently destroys them. This is not a backup." Not colour-only. axe-clean.

### Not done (sequenced)

W0.8.6 glStore spike waits on W0.2 tenancy (blueprint intra-phase order). Next session: tenancy.

### Verification

tsc clean. eslint on touched files clean. money-AST 0 on moneySerialize. fabrication 0.
Targeted tests 55/55 then 39/39 after the import fix. Persistence map + schema equality green.

## Session 032 (2026-08-22) — W0.2 Tenancy (Phase 0)

**Resumption:** sess_031 state verified against reality before mutation (K0/D-002):
money-AST detector re-run → 99.66% / 25 unsafe ops / 3 modules, ratchet holds;
fabrication detector → 0 findings. Sandbox had been recycled: node_modules absent
(root+server reinstalled via `npx npm@10.9.8 ci` — npm 12 rejects the lockfile),
and node v26 (ABI 147) has no better-sqlite3 prebuilt → restored Node 22.18
toolchain copy under %TEMP%\opencode\node22 and fetched the ABI-127 binding with
prebuild-install. Server suites require this (mock fallback cannot run bootSchema).

**W0.2 shipped (branch `phase0/w02-tenancy`):**

- `tenant_id TEXT NOT NULL DEFAULT 'default'` on all 35 SQL-home tables + users/
  refresh*tokens/user_entity_access/period_close_audit/audit_log/audit_permission*
  changes/audit_data_changes (42 registry entries in server/src/db/tenancy.ts).
- `environment_id TEXT NOT NULL DEFAULT 'dev'` on 13 governed surfaces.
- `tenants` root table, seeded 'default'; ensureTenancy(db) idempotent reconciliation
  wired into ensureSchema() AND runMigrations(); legacy DBs ALTERed + backfilled
  (test proves DROP COLUMN → restore → backfill).
- Ratchet: any table not registered or exempt fails tenancy.test.ts (exempt =
  login_attempts + audit_login_attempts, global security telemetry by design).
- Leak tests: per-table two-tenant seed → scoped select returns exactly own row
  (anti-vacuous count guard); route-level GL suite proves write stamping from JWT
  claim, read/delete/trial-balance scoping, bulk inheritance, legacy-token fallback.
- gl_entries routes are the first enforcement site (GET/POST/bulk/DELETE +
  trial-balance join); resolveTenantId never trusts client input.

**Verification:** server tsc clean; W0.8.4 schema-equality gate green (shared
audit_trail mirrored); default server suite 15 files / **183 passed**; native-db
suites **77 passed**. Pre-existing EADDRINUSE unhandled noise reproduced on
untouched suites (periods+commands) — not introduced here; backlog hygiene item:
per-worker PORT or lazy listen in index.ts.

**Honest limits (not done):** budgets/scenarios/forecasts/reports/entities/periods
routes still unscoped (W0.2b); login flow does not yet sign tenantId claims
(W0.2b); no RLS yet (SQLite Phase-0 posture; Postgres S2). Client untouched → root
suite/build not re-run (no diff surface); money gates unaffected and re-verified.

**Next:** W0.2b adoption sweep, then W0.3 runtime three-statement gate.

## Session 033 (2026-08-22) — Resumption: the in-flight wave verified, fixed, and landed

**Branch:** `phase0/w02-tenancy` (continued; sess_032's commits already on it)

Resumed per Part VIII. Found a **72-file uncommitted wave** spanning four workstreams
(W0.2b route tenancy, W0.3 gate, W0.4 registry, W0.5 slice 1 + K30 + probe harness +
W0.8.6 draft) — a K9 half-mutated tree left by an interrupted session. Verified every
plane before committing anything (K0), then fixed what verification exposed.

### 1. The red gate test that was really two defects (W0.3, Severity-0 class)

Server suite: 240/241, failing `computeEntityLedgerTotals`. Chasing it exposed:

- **Stale fixture**: the function had been refactored to integer-cent rows
  (`net_cents`) but the unit test still fed `net_debit` — everything silently
  defaulted to zero.
- **The real bug underneath**: `assertEntityLedgerIntegrity` asserted
  `A − Exp = L + E + Rev`, which is wrong algebra (`⇔ A = L+E+Rev+Exp`) and would
  have reported `delta = −2·Exp` on any balanced ledger carrying expense activity —
  **false-blocking every legitimate GL write once OpEx existed**. Correct open-ledger
  identity: `A + Exp = L + E + Rev ⇔ A = L + E + NI`.
- **A second silent-drop**: aggregation keyed a nonexistent `'Expense'` type while
  the schema CHECK constrains accounts to `Revenue/COGS/OpEx/CapEx/Asset/Liability/
Equity` — real expense accounts (`OpEx`, `COGS`) would never have entered the
  identity at all. Same class as session 026's balance-sheet prefix drop.
- Fix: closed-vocabulary mapping (debit-normal `Asset/CapEx/OpEx/COGS`; credit-normal
  `Liability/Equity/Revenue`), **fail-closed FP-0303** on unknown types (registered
  additively in the W0.4 registry), stale docblocks corrected, and a runtime
  regression test: a balanced Asset/Revenue/OpEx batch must be ACCEPTED.
- **Teeth proven** per HANDOVER rule: temporarily reverting `.plus`→`.minus` fails
  exactly that new test; restore returns green.

The garbled scratch comment in the failing test (`650 must equal 750?? No…`) shows
the interrupted session had smelled this and pinned the mapping instead of chasing
it. Lesson recorded: **a comment that argues with its own fixture is a defect report,
not noise.**

### 2. Money ratchet 25 → 0: honest, with receipts

Baseline moved to 100% alongside a +227-line detector change (W0.1.6 type-aware
detection). Per D-002/HANDOVER ("prove suppressions are confined") I re-ran the HEAD
detector against the current tree: it still reports **11 float-equality findings,
every one an ISO-4217 currency-code string comparison** (`fromCurrency === toCurrency`
etc.) — the documented false-positive class retired by type proof. The prior 25 real
arithmetic ops are genuinely gone from product code. Both facts recorded so nobody
has to trust the header comment.

### 3. Render-probe bring-up

Three pilot probes failed; triage:

- `ProfitLossPage.probe` / `WorkingCapitalPage.probe`: missing
  `import { screen } from '@testing-library/react'` — they hit an empty global, so
  `screen.getByText is not a function` after all figure assertions had passed. A
  debug `console.log('SCREENTYPE', …)` was left in one of them.
- `BalanceSheetPage.probe`: exact-match query didn't account for the page's
  legitimate directional clause ("— assets exceed liabilities + equity"); now
  asserts the full message verbatim.
- `WorkingCapitalPage.probe`: CCC appears twice (KPI card + table) → `getAllByText`.

No page-side divergence found by the pilots yet — the harness works and stays.

### 4. Two gates disagreed about a generated file (K7)

Pre-commit prettier reformatted `docs/product/ROUTE_MAP.md` (padded the markdown
table) while pre-push gate 9e compares generator output verbatim → permanent
staleness. Resolution per K7: the generator solely owns the artifact; canonical
table regenerated, path added to `.prettierignore`. Both gates green.

### 5. Hygiene debt the hooks caught

The interrupted session's files had never met the gates: 305 auto-fixable
prettier/eslint errors across server sources plus 4 unused imports
(`requireRole`, `bcrypt`, `beforeAll/afterAll`, unused `db`). All fixed properly;
server suite re-run green afterwards (25 files / 243 tests; native-db 83).

### 6. Commits (branch `phase0/w02-tenancy`)

- `719e866f` money(W0.1.6): type-aware detector; ratchet 100% honest
- `424d164e` server(W0.2b+W0.3+W0.4): tenancy adoption, three-statement gate (+S0 fix), error registry
- `fa31c55f` web(W0.5 slice 1 + K30 + W0.8.6 draft): PillarNav, route consolidation, probes
- `50ba62f2` fix(W0.5): ROUTE_MAP generated-artifact status, prettier excluded
- `b10116ce` chore(ci+hygiene): ci-patches 0006/0007 delivered, tool dirs ignored

Deliberately NOT committed: local `.github/workflows/*.yml` edits (patch-only
convention; content already delivered as 0006/0007 for human application).

### Next

W0.8.6 promotion (glStore entries through the server-authoritative boundary using
the landed commit namespace/conflict types), then W0.5 slice 2 toward ≤40 routes,
then W0.9 LLM egress chokepoint.

## Session 033 (continued, later same day) — failure-cluster triage + full battery green

Resumed the mid-wave tree per HANDOVER. The remaining red clusters from sessions
031–032 were repaired (two via subagent fleet with disjoint file ownership), the
full verification battery was executed end-to-end, and two latent defects the
repairs exposed were fixed at the root.

### 7. Failure-cluster triage (the "10 files / 21 tests" debt)

- **Page-test cluster** (BudgetVsActual ×2 router-mock importOriginal pattern;
  RefreshCw in deep-test enumerated lucide mock; Healthcare `$70K` Intl-compact
  exact match): verified independently — 6 files / 76 tests green.
- **Determinism cluster** (ReportSchedulerEngine injected reference date;
  scenarioUtils zero-formatting; text.ts Excel-serial UTC fixes): scoped run
  green; but see §9 — text.date.test.ts still carried a TZ-sensitive helper.
- **masterStorage "encryption failure (key unavailable)"**: reproduced at last.
  Root cause is cross-file `process.env.MASTER_STORAGE_KEY` leakage through the
  shared worker-thread env (vitest threads pool: fresh module graph per FILE,
  ONE process.env per THREAD). Fix: file-level beforeEach scrub + afterEach
  restore of MASTER_STORAGE_KEY, plus defense-in-depth re-scrub inside the
  encryption-failure test itself. Assertion strength unchanged (K5).
- **Theme contracts**: lightContrast shelled out to Unix `find` (+ a `wc -l`
  pipe); replaced with a pure node:fs walker preserving the exact file-set
  semantics (`*.tsx`, minus `*.test.tsx`, minus `test/`+`__tests__/` dirs),
  forward-slash normalized for Windows. buttonContrast's glob had the same
  Windows defect in reverse: backslash paths silently broke its
  forward-slash regex consumers (`components\/ui\/Empty…\.tsx$`,
  `split('/src/')`) — normalization restored the intended file set and the
  role="status" empty-list assertion now exercises real markup.

### 8. Two product-side defects the honest contracts immediately caught

- `BudgetListPage.tsx:290` delete-confirm modal used `text-slate-400` —
  unreadable light-theme text on the app's default theme. Replaced with the
  sibling idiom `text-[var(--text-muted)]`.
- `text.date.test.ts` serial helper built LOCAL-midnight Dates while text.ts's
  documented contract is pure-UTC Excel serial space. On this Windows/IST host
  the pre-1900 LMT offset (+5:21) differs from modern +5:30, drifting the
  helper exactly one day off the impl (45305 vs 45306). Helper rewritten with
  Date.UTC anchors + Math.round; all 23 tests green; impl untouched.

### 9. Environment acquisition recap (sess_033)

rustup stable-msvc (cargo/rustc 1.98) → src-tauri verifiable (R-24 mitigation:
tauri.conf schema-invalid keys removed, dead updater dep dropped, lib.rs
command moved into `mod commands` for rustc ≥1.98 E0255 macro-namespace
unification); gh CLI 2.98.0 user-scoped; Playwright chromium installed
(E2E was dead on this machine before); Node 26.7.0 machine-wide per user
directive, lockfile ops pinned to npm@10.9.8.

### 10. Verification battery results (this resumption)

Root tsc ✓ · eslint --max-warnings 0 ✓ · focused pre-push vitest subset
8 files / 263 ✓ · server tsc + 243/243 + native-db 83/83 ✓ · money ratchet
100%/0 ✓ · fabrication 0 ✓ · persistence-map 41/41 ✓ · schema-equality ✓ ·
ROUTE_MAP regenerated after telecom redirect fix (2-line diff, gate ✓) ·
docs:verify ✓ · engines:verify 182 ✓ · cargo check Finished ✓ · production
build (tsc+eslint+vite, PWA 475 entries) ✓. Full root suite re-run after all
repairs: final numbers recorded in action_log. `.github/workflows/*.yml`
edits remain uncommitted by convention (content = ci-patches 0006/0007).

## Session 033, Part 3 (2026-08-22) - Blueprint<->Goal alignment audit + ADR-014

The founder asked directly whether the blueprint/roadmap is perfectly inline with the
goal. Formal audit verdict: structurally aligned (~85%), sequencing exact,
instrumentation incomplete - and per the zero-compromise directive every gap was
fixed as a runnable instrument rather than a note:

1. GA gate was uncomputable. Section-24 "zero Core-20 hard escapes" had no executable
   check - escape-ledger-check.mjs was specified (s027) and never written. BUILT now:
   canon transcribed verbatim from blueprint-parts/12c section 24.2; status file
   docs/product/escape-ledger.json evidence-cited per row; computes escape rate;
   --phase p1|p2|ga enforces targets at declared phase-exit reviews; advisory as
   pre-push gate 9g. First-ever scoreboard reading: escape rate 76.7%, Core-20 hard
   offenders 16, built rows 7/30 (recorded in state.json escape_ledger_baseline).
2. Vertical truthfulness debt invisible to feature counts -> W-FAB-002 widened into a
   standing per-vertical gate (SectorDriver audit: 66/66 sector KPIs class-C).
3. Desktop risks without workstream -> W-DESK-01 queued (cargo check already green;
   clippy -> dev smoke -> MSI+NSIS next), closing the R-24 "risk without path" gap.
4. Phase-0 exit ambiguity -> exit wording now names exactly what must be promoted
   (glStore via /api/gl with tombstone+version semantics - server half DONE f6b34650)
   vs. what legitimately waits (budgets/scenarios/forecasts stay draft-authoritative
   into Phase 1, tracked in PERSISTENCE_MAP). Recorded in state.json
   phase0_exit_amendments.
5. K30/a11y instruments late-bound -> formalized as enforced Phase-0 exit blockers
   (W-K30-001 / W-A11Y-001), not polish.

Also landed in this part: W0.8.6-SERVER (f6b34650) - gl_entries tombstones +
idempotent Idempotency-Key replay (FP-0401 on payload change) + version columns +
entries:[{id,version}] responses; DELETE is tombstone-before-gate in one transaction;
suite 247 + native-db 83 green. And W0.5-B0 (8fb44654) - drift-gate parser sees all
200 route literals; RC1 pillar mapping fail-closed via longest-prefix + family defaults.

ADR-014 - Blueprint alignment amendments.
VERDICT: 4/4 ICPs ACCEPT (Carla OK discipline - amendments ride existing queue/gate
machinery, no parallel process invented; Vera OK logic/evidence - every gap cited to
audit output or a missing instrument, scoreboard measured before any remediation
claim; Chris OK operational - all five fixes run today, advisory modes prevent
false-blocking of routine pushes; Beth OK user/customer - the scoreboard measures
exactly what a CFO buys: workflows completed without leaving the product).

## Session 033, Part 4 (2026-08-22→23) — past-midnight continuation wave: K30 orphans, README truth pass, four-states, W-FAB-002 p1, BoardPack probe, G6 UUID resolver

**Branch:** `phase0/w02-tenancy`. Eight work commits landed between 2026-08-22 20:01
(`ada953e6`) and 2026-08-23 01:01 (`85439664`) local — verified via
`git log --date=format-local:'%Y-%m-%d %H:%M'`; tracker auto-updates interleave between
work commits throughout. At writing time origin sits at push point `bc3d44b7` with HEAD
ahead 4 (`git status`: d5f6fea6, 350437f7, 6fc332be, 85439664 unpushed).

### 11. Orphaned PeriodClose K30 specs landed first (ada953e6)

The surviving test-half of died wave bfec73a0: hydrate skeleton (`period-close-loading`),
empty-state CTA re-entry (`period-close-init`), in-flight transition skeleton, ErrorState
role=alert retry path. Page-half had already shipped inside b3f5312d. Commit body records
16/16 green against HEAD; diff is +76 in PeriodClosePage.test.tsx and nothing else
(`git show --stat`).

### 12. README truth pass: five audited clusters replaced with live measurements (661dd9ab)

Remediation of the 12e80ee1 audit, every replacement value measured live, per commit body:
tests 13,438/1,197 → **14,495/1,272** (badge, getting-started, scripts and quality-gates
tables, release gate); server census 107 → **247 tests / 25 files** plus native-db 83
measured live; the money triple-contradiction resolved onto the canonical money:ast
ratchet — '98 of 380' / '2 of 23' / '98/380+2/23' variants removed, now **990 scanned /
896 safe / 0 unsafe / 100%** via money:ast Gate 9b + fabrication Gate 9c = 0, legacy
import-proxy marked retired-pending per the adjudication (action_log 2026-08-22T19:05Z:
all 7 raw toFixed sites are roundMoney().toFixed() round-then-format); adoption
denominator 258→**255** (208 engines + 47 store non-test modules), importer numerator
re-measured at 88; unsupported '78 verticals' → measured **18 `/sector/*` dashboard
routes** (ROUTE_MAP rows 164-181) + **14 templates** in src/templates, sector pack list
rewritten to the real routes; footer re-verification stamp base commit 7c09eea9, report
date 2026-08-22. Gates after edit per commit body: check-readme-claims **11/11 PASS**
(Gate 7), verify-readme-stats PASS, prettier clean. Diff 47+/44−.

The prettier gate earned its keep in-wave here: pre-commit Gate 3 runs
`prettier --check` on staged markdown (.husky/pre-commit:30-36) and rejected the first
staging's hand-built tables — what landed is the gate-formatted layout (padded `:---`
separator rows are visible in the 661dd9ab diff). Single-squash landing means no
intermediate commit exists to cite for the rejection itself.

### 13. ScenarioBuilderPage four-states — and an honesty note about skeletons (d39602c7)

Empty branch now renders the shared EmptyState under a mounted PageHeader (h1 discipline
restored; was an h2-only early return) with a testid'd Import Data CTA; Monte Carlo
in-flight shows a real skeleton region (`scenario-mc-skeleton`, aria-busy) beside the
disabled run control; save failure and simulation failure use the shared ErrorState
role=alert whose retry re-runs exactly the failed action (replacing ad-hoc red alert
boxes). The load-bearing honesty note: **no fake page-hydrate skeleton**, because base
derivation is synchronous from persisted stores — the only honest in-flight surface is
the worker call. New 167-line spec file (real stores, PeriodClose idiom); cluster tsc 0 /
eslint 0 / prettier clean, 32/32 across page/money/model.

### 14. W-FAB-002 part 1: SectorDriverDashboard rebuilt on signed classification (da8eac31)

Audit baseline (.agent/W-FAB-002-sectordriver-fabrication-audit.md): 66/66 sector KPIs
were class-C fabricated. The rebuild kills the systemic plumbing, not just the numbers:
the absEntryAmount max(|d−c|,|net|) magnitude trick is replaced by signed creditNormal /
debitNormal sums everywhere; regex-over-'code name' textOf bucketing is demoted to a
name-only fallback while account-code prefixes classify first (4/5/6 P&L, 1/2/3 balance
sheet); invented bases (assetBase=rev×2, debtBase=exp×0.55, productionBase=rev÷100) and
the filledMetrics target×growthFactor×efficiencyFactor filler are deleted; the insurance
x0.62 claims fallback and the cross-sector regulatory fabrications (banking
cet1/npl_ratio/loan_deposit_ratio, technology arr/quick_ratio, retail atv/gmroi, energy
production/boe/lifting/carbon, construction backlog/wip, healthcare
ar_days/case_mix_index, government cost_per_citizen/revenue_collection_gap, education
revenue_per_student/faculty_ratio, insurance retention/solvency-180) are removed outright.
Derived metrics are null-with-disclosure when a denominator class is absent
(gross_margin, inventory_turnover=cogs/inventory, banking nim+efficiency, insurance
gwp/loss/expense/combined from real premiums+claims+opex, realestate noi/cap_rate/ltv).
Driver-arithmetic KPIs move into a labeled 'Scenario simulator' card declaring each basis
string, never merged into measured KPIs; header copy now states the measured-vs-projection
split. Tests rewritten per K5: 23 specs pin exact identities (insurance identity 60/25/85),
sign sensitivity (a debited revenue row REDUCES revenue), disclosure-not-number nulls, and
filler absence; sector cluster 75/75.

And the wave's own honest fixture caught a real classifier defect: prefix-5 claim rows
never reached the claims bucket — found mid-wave and fixed in-wave (recorded in
HANDOVER.md by 55c19467; no separate commit exists since the fix predates the landing).

### 15. BoardPackPage render-probe #4: ledger arithmetic held against the DOM (d5f6fea6)

Fourth probe in the W0.5 harness series re-derives every pack figure from a balanced
double-entry ledger independently of boardPackData/computeBalanceSheet, then holds the DOM
to them figure-for-figure: expenses include interest+tax classes (7xxx/8xxx), equity
includes current-period earnings (100k posted + 7k = 107k), the A = L + E identity, budget
utilization from real budget totals — plus divergence-class negatives (cost-only margin
14%, earnings-less equity, flipped net income, revenue+COGS conflation) and both K30
states. New 166-line probe file.

### 16. Push point bc3d44b7: full pre-push battery green

Mid-wave, 55c19467 recorded this exact wave into .agent/HANDOVER.md (+43) and state.json
(+9/−2) — the record several citations above lean on. bc3d44b7 is a tracker auto-update
(PROGRESS_TRACKER.html, 1 insertion) serving as the push-point marker: origin sits exactly
there while HEAD is ahead 4 (git status + log decoration, run this session). The hook at
.husky/pre-push gates every push with set -e over: tsc --noEmit; eslint --max-warnings 0;
vitest P0 shard (FXEngine, ConsolidationEngine, SafeMathParser, glValidation,
glStore.smoke, spreadsheetSanitize, masterStorage.security, moneySerialize,
persistenceAuthority, components/layout/, plugins/, safeJSONStorage); npm run build;
bundle-check; version consistency; readme claim check (Gate 7); dependency audit;
tautological scan; money AST ratchet (9b); fabrication ratchet (9c); persistence-map +
schema-equality (9d); route-map drift (9e); docs-truth + engine manifest (9f);
escape-ledger advisory (9g); cascade-hold ledger check (Gate 10). Honest labeling: this
lane verified the gate list by reading the hook and verified the push landed via refs;
individual gate executions were not re-run here — under set -e, a landed push implies
every gate exited 0, which is also what HANDOVER promised ("Full-suite + build re-run at
next pre-push").

### 17. W0.8.6-G6 UUID resolver: server identity lands on client rows (6fc332be)

P0 blocker from plan v2: applyCommitResult discarded the server's entries:[{id,version}]
payload, so committed rows kept client-generated ids and no version was ever captured for
If-Match. Committed responses now resolve positionally (server returns request-line order
on both the fresh-insert and idempotent-replay paths): entry ids are re-keyed to server
UUIDs, entryVersions[serverId] = version recorded, syncState re-keyed, and the
lastImportEntryIds batch token is remapped so undoLastImport targets server rows. Arity
mismatch (sent N, acknowledged M) fails closed — nothing marked committed, nothing
remapped; identity on financial records is never guessed. GLState gains persisted
entryVersions; specs rewritten per K5 (G6 remap + retry-cannot-double-post, fail-closed
arity, conflict path unchanged). glStore cluster 19/19; tsc 0; eslint 0. Diff spans
glStore.ts, glStore.server.test.ts, types/index.ts (115+/28−).

The first G6 attempt failed tsc on exactly the two hazards this design invites:
readonly-typed entry payloads meeting Immer mutation, and narrowing over GlCommitResult
union shapes. Both were fixed in-wave before the single squashed landing — the committed
code carries the witnesses (`GlCommitResult<readonly { id: string; version: number }[]>`,
`readonly GLEntry[]`, and the '// Immer draft: runtime re-key of a readonly-tagged
identity field' comment). No intermediate commit exists to cite; the final state compiles
clean per the commit body.

### In-wave honesty ledger (this part)

- Three repairs happened mid-wave and are invisible to history as separate commits
  (single-squash landings): the G6 tsc readonly/narrowing fixes (→ 6fc332be), the
  prefix-5 claims-bucket defect caught BY the new honest fixtures (→ da8eac31; recorded
  at HANDOVER.md:243-244), and the README table rewrite forced by the pre-commit prettier
  gate (→ 661dd9ab).
- Every measurement above traces to a named SHA's commit body/diff or a file read this
  session; nothing is claimed from memory alone.

### Open items

- **W-FAB-002 part-2 (in flight):** sectors/\*.ts config copy still advertises removed
  KPIs; LEGACY_SECTOR_COPY sr-only sweep; per-sector render-probes; industry-pack
  vertical-truthfulness sweep (HANDOVER.md via 55c19467).
- **glStore promotion remainder:** product trigger + boot drain still owed (plan v2
  G1-G5/G7/G8 remain; updateEntry descoped — no server PUT).
- **W0.2c-hardening M-tier and W-A11Y lanes in flight** (HANDOVER.md items 7/9).
- Four commits unpushed at writing time (d5f6fea6, 350437f7, 6fc332be, 85439664): the
  next push re-runs the full battery over them.

## Session 033, Part 5 (2026-08-23) — fleet wave 2: K30 completion, vertical de-fabrication sweep, W0.9 chokepoint, GL promotion waves, W0.2c hardening, docs-links truth

**Branch:** `phase0/w02-tenancy`. Wave 2 landed 19 work commits between 01:20
(`7447c1f7`) and 04:10 (`1bea2f3a`) local, interleaved with tracker auto-updates
(`git log --date=format-local` verified). This part was composed ~04:20 at HEAD
`e635e731` while wave 3 was still landing (HEAD advanced twice during writing;
origin remains at `bc3d44b7`, so both waves await one battery-bearing push).

### 18. K30 completion batch — twin SHAs, honest provenance (bc6249d1 + a1d2ad01)

Same subject one minute apart, deliberately different payloads: bc6249d1 carried ONLY the
mirror retirements (−213: `__tests__/forecasts/ForecastBuilderPage.test.tsx`,
`__tests__/scenarios/ScenarioBuilderPage.test.tsx`); a1d2ad01 landed the full build-out,
20 files +1537/−562. Contents per commit bodies:

- **WhatIfPage**: the silent-catch fix — swallowed compare failures now surface as
  ErrorState role=alert retrying exactly the failed action; EmptyState under mounted h1
  with New Scenario CTA; demo-default assumptions honestly labeled; stale compare-target
  reset; legacy mocked `__tests__` mirror retired for the colocated real-engine spec
  (7 tests incl. a no-fake-skeleton honesty pin).
- **FXRatesPage**: hardcoded INITIAL_RATES quotes removed (they rendered as user data);
  wired to real fxRateStore manual-source writes; dual empty states; RBAC-denied
  mutations get ErrorState exact-action retry; '3ratesconfigured' whitespace bug fixed.
- **GLJournalsPage**: K30 empty state under h1; CSV export failure ErrorState; latent
  Radix Select empty-value crash fixed; dead Help control removed.
- **Budgets trio (N8)**: ListPage loading skeleton + shared EmptyState + RBAC-throw
  ErrorState across five actions; VAReport loading branch, honest no-approved-budget
  copy, zero-plan-lines disclosure replacing fabricated zero-variance chrome, memo deps
  fixed; Detail not-found upgraded to shared EmptyState under h1; seeded fake audit
  entry removed.
- **Mirror reconciliation**: ForecastBuilder aspirational mirror retired (colocated
  10/10 covers it); PeriodClose/BudgetDetail lucide mocks extended for the EmptyState
  icon set; heading assertions moved to h1-discipline structure.

### 19. Vertical sweep: ~150 fabricated value-sites removed (7dad753d)

Four sweep lanes audited every page in 12 industry dirs (saas, retail, telecom,
healthcare, energy, construction, realestate, logistics, government, education,
insurance, sector). Per-dir highlights from the commit body: retail invented stores +
SKU-4401; energy SOURCES MWh/$ literals; healthcare patientVolume fixture; government
appropriations; education 12,000-student institution; realestate 'Metro Plaza' record;
sector dashboards' target×factor tiles; plus the systemic kills — Math.abs COGS
sign-trick, debit-revenue netChange fallbacks in four metric builders, fake sparkline
histories/tile deltas, zero-for-absence '0%' renderings. Replacements are honest by
construction: GL/store-derived KPIs with disclosed bases, null-with-disclosure
('—' plus what a real feed requires), labeled simulator-style defaults, exports emitting
only recorded rows. Regression locks: 31+ new colocated tests including fs source guards
against target×factor / change={-N} patterns and not-contains guards naming every
removed constant ('Acme Corp', 'Metro Plaza', '94.8', '400,000'); per-dir vitest green
(139 + 105 + 117 + 79 across lanes).

Companions closing W-FAB-002 p2: `7ee5c3cc` pruned 24 fabricated config KPI ids
(consumer-grepped; arr/gmroi retained with reasons; every sector keeps ≥5 defaultKPIs;
src/config 21/21, SectorDriver money suite 23/23); `730b2dea` deleted the invisible
LEGACY_SECTOR_COPY header block (screen-reader noise advertising removed metrics like
'NPL Ratio'; block lives on only for empty-state titles; 5 page specs re-pinned, cluster
75 tests); `1163e012` replaced ICEliminationPage's 4 invented useState IC pairs
(50k/50k/25k/24.8k) with real IntercompanyMatchingEngine reads + autoMatch + batched
createEliminations(period, authed-user), 6 real-engine tests incl. a mock-amount guard.

### 20. W0.9 LLM egress chokepoint, fail-closed by design (71b27b57)

Single egress surface llmEgress.complete/openStream; both nim.ts transports rewired
(nimFetch deleted, legacy error surfaces preserved). Fail-closed gates:
VITE_LLM_EGRESS_ENABLED kill switch, host allow/denylists (defaults: NVIDIA +
loopback), typed LlmEgressBlockedError. The redactor strips secrets/IBAN/GL-accounts/
money/digit-runs/emails BEFORE bytes leave, backed by an exact-answer fixture table
with pseudonymization immune to the digit pass; audit sink {ts, endpoint, promptBytes,
redactions}. +931 lines across module and tests; 39 new tests, nim 21/21,
components/ai canary 36/36.

### 21. GL client promotion waves 1–2 completed (7447c1f7, 6f4f1b49, 83a2a683)

- `7447c1f7`: DurabilityBanner gains the product Publish trigger (drafts exist +
  import:create → commitDraftsToServer with typed inline outcome: published / failed /
  conflict codes); copy states GL publishes to server while budgets/forecasts stay
  local drafts. undo/redo snapshots now carry entrySyncState + entryVersions so an undo
  past a server commit restores the exact id→state/version mapping instead of
  corrupting identity. persistenceAuthority records G6 reality; PERSISTENCE_MAP
  regenerated 41=41. Banner suite 5/5 incl. F-0004 pre-flight via the real store path.
- `6f4f1b49`: symmetric Pull hydration — hydrateCommittedFromServer converges the
  replica with committed rows only (drafts/failed never touched), import:create-gated;
  spec proves K25/K27 semantics through real UI (server row adopted WITH version
  captured, local draft preserved).
- `83a2a683`: boot-hydrate store action + SDK GlCommitNamespace.listEntries
  (GET /api/gl/entries?environment_id via the real handler; defensive mapper drops
  id-less rows and surfaces version? WITHOUT inventing it); classify-before-mutate
  merge in a single immer pass; trial balance invalidated only on change; transport
  errors are a no-op {hydrated: 0}; +8 specs (cluster 24/24). escape-ledger.json rows
  7/9/11/16/17 got fleet-wave evidence; scoreboard honestly unchanged at 76.7% — no
  escape vector closed yet.

### 22. Server W0.2c batches (8b617858 + 85ad8466)

M-tier authz (`8b617858`, +1303/−39): all 8 scenario routes reject cross-entity
apply/read/write 403 FP-0201; NULL-entity scenarios fail closed; absent entityFilter no
longer falls through to an unfiltered tenant query; apply asserts base AND target
budget/forecast entity scope BEFORE any write or disclosure (zero rows written on
rejection, test-verified). Accounts/entities: `entity_id` re-binding rejected 409 FP-0410
(binding immutable post-create); listings scoped by JWT-resolved access — query param
narrows, never widens, zero grants → []; duplicate account codes typed 409 FP-0402.
Additive drift repairs: `accounts.description` and
`budget/forecast_line_items.department_id` columns existed in routes but never in schema — every such write 500'd against real
SQLite. Leftovers trio (`85ad8466`): departments POST named nonexistent updated_at
(every create 500'd); entity code-uniqueness tenant-scoped on POST/PUT (was DB-global:
existence oracle + cross-tenant false blocks); POST /gl/accounts Admin-gated like PUT.
Server suite 28 files / 286 tests green; tsc exit 0.

### 23. Routes slice-2 opens (2a94a3f4)

'/' aliased to /dashboard; phantom /chart-of-accounts target dropped; top-level targets
33 → 32 toward RC2 ≤40. In-place element swap keeps the declaration pin at 221 (delta
explained in test comment); the generator now derives App line count dynamically. New
drift specs: every Navigate alias must resolve to a declared route; exactly one
DashboardPage mount survives. routeShell 6/6; navigation.contract + App.runtime 15/15.

### 24. docs-links policy evolution: gate restored, corpora made genuinely true

Two-step resolution recorded across `ca9b16bd` + `9ba83dba`:

- Historical corpora fixed WITHOUT falsification (ca9b16bd): GLOSSARY +
  STRATEGIC_DECISIONS_LOG citations rewritten as living-successor redirects or explicit
  [removed] markers — claims and line numbers kept verbatim, no live-link pretense for
  the deleted drafts corpus; skill-creator copies stripped of dead example links only
  (SHA-identical otherwise). Then the allowlist exemptions were removed upstream so the
  strict gate genuinely covers both files. The [removed]/living-successor marker style
  is the accepted, recorded deviation from literal dead links.
- Override enforcement, evidenced: the mid-wave shortcut — exempting paths in the gate
  script — was withdrawn before anything landed. History shows NO wave-2 commit touched
  scripts/docs-link-check.mjs (previous touch b5195816, 2026-08-08; next 9ba83dba), and
  this lane's own git-status snapshots watched the pending docs-link-check.mjs staging
  vanish between the 04:14 and 04:17 checks. Restore order held: script byte-exact
  first, files made to truly pass second.
- Completion (9ba83dba, 04:18): one normalize() on rel-paths so allowlist keys and the
  reports/ prefix match on Windows too (Linux byte-identical); 27 count-asserted
  `MEMORY/**` shorthand citations re-pointed to canonical paths or de-backticked as
  illustrative placeholders, archive prose untouched. Strict gate: 0 broken links /
  0 broken citations repo-wide.

### 25. Cross-lane integration surface (db9902b5, 1bea2f3a, 5fc21e95)

- `db9902b5` (a11y M1–M5): Skeleton announces once per group (a Period Close load used
  to spawn five concurrent live regions); DataTable becomes an ARIA 1.1 interactive grid
  with roving tabindex, arrow-key nav with clamping + virtual-scroll sync, cell-level
  activation, and the zero-tab-stop fix for page 2 / virtual windows; Sidebar collapsed
  rail keeps one accessible name via the sr-only carrier swap; skip link moves to
  focus-scoped token classes with JSDoc on the deliberate no-tabIndex decision (WCAG
  2.4.1); smooth-scroll gated under prefers-reduced-motion. Provenance note: this
  commit's stat also carries `.agent/PROJECT_JOURNAL.md +150` — Part 4 of this journal
  rode along inside the a11y lane's territory commit.
- `1bea2f3a`: energyStore shipped 5 invented assets / 7 trend points / a capacity mix
  as PERSISTED defaults that pages rendered as user data on first run (K17 violation);
  the store now honors its own contract test's empty defaults. DataTable row-level
  onClick moved to cells for mouse parity with the new keyboard model; smoke mirrors
  updated to honest surfaces.
- `5fc21e95`: the probes caught spec rot, not page bugs — the CashFlowPage probe
  fixture had unbalanced rows (120k bill vs 50k revenue), an ending-cash figure
  contradicting its own walk (76k vs 100+6k), and a wrong debt-repayment constant
  (−50k vs −10k); rebuilt as balanced double-entry pairs under the page's real COA
  prefixes (cash=11xx). Page math verified correct throughout; view untouched. Also:
  CommandPalette empty set no longer keeps a childless role=listbox (axe
  aria-required-children).

### Fleet operations — how wave 2 ran

- SOLO mode was revoked by founder directive; a 15-subagent fleet ran on disjoint
  edit-only territories with the orchestrator serializing every commit; all 15 lanes
  reported (HANDOVER.md fleet-wave section via 1ced5ee8; state.json session log records
  the wave summary incl. "journal Part 4" and docs-truth battery 9/10 with docs:links
  pre-existing debt the only red).
- **Override 1 — allowlist restore order**: a lane's gate-script exemption edit was
  ordered withdrawn; restore byte-exact first, then make historical files genuinely
  pass. Evidence chain in §24.
- **Override 2 — arity-mismatch fail-closed**: a lenient partial-commit handling was
  rejected; G6 semantics held across the whole promotion arc — sent N / acknowledged M
  marks nothing committed and remaps nothing (6fc332be body; pinned at state.json
  W0.8.6 queue summary; extended to hydration by 83a2a683's classify-before-mutate).
- **Invalid-suite-run diagnosis**: one mid-wave suite run reported failures that were
  traced to lanes editing files WHILE vitest executed — a mid-edit race, not a product
  regression; the run was discarded and re-run after serialization. Honest label: this
  diagnosis comes from the fleet-ops record supplied with the wave brief; no disk
  artifact captures it (action_log.jsonl's last entry predates the fleet at
  2026-08-22T19:05Z; state.json/tracker carry no race entry) — recorded here so it
  survives the wave.

### Open items (end of wave 2)

- **Route slice-2 continuation**: 32 top-level targets after 2a94a3f4; RC2 ≤40; pillar
  mapping enforcement continues via the drift gate (state.json W0.5-slice2 entry).
- **Engine placeholders lane in flight at composition**: uncommitted edits to
  InventoryEngine/RetailEngine (+tests) and retail/insurance/realestate/energy pages
  visible in git status — wave-3 work, not yet judged here.
- **MEMORY citations**: 27 re-pointed by 9ba83dba with the strict gate reporting fully
  green — confirm the repair holds at wave wrap before striking the item.
- **environment_id filter lane in flight**: server/src/routes/gl.ts modified + new
  server/src/routes/gl.entries.env.test.ts uncommitted at composition time.
- **README refresh pending final counts**: README still carries the 661dd9ab numbers
  (14,495/1,272 tests; 247 server); wave 2 alone added hundreds — refresh once the
  wave sequence settles and counts are measured live again.
- **Push debt**: origin sits at bc3d44b7 with both waves local; the next push runs the
  full pre-push battery over all of it.
