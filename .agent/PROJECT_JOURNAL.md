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
