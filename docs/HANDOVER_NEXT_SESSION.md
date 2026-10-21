# Handover — current continuation and historical session records

## 2026-10-21 (continued) — LEDGER MONEY ADMISSION: a row carrying money passed the balance gate

**The finding.** The ledger reconciled in whole cents in every aggregate, and
stored the amount verbatim in none of them. Four measurements on `49f080eb`:

| Probe                                            | Stored / returned                              | Why it matters                                                                                 |
| ------------------------------------------------ | ---------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `setEntries([{ debit: 0.004, credit: 0 }])`      | `debit 0.004`, `netChange 0.00`, `amount 0.00` | the row carried money its own net could not see                                                |
| `setEntries([{ debit: 0.1 + 0.2, credit: 0 }])`  | `debit 0.30000000000000004`                    | a raw read disagreed with the `0.30` the analysis view printed                                 |
| `addEntry([{ debit: 0.005, credit: 0 }])`        | `amount 0.01` vs `debit 0.005`                 | `amount === debit − credit` did not hold                                                       |
| `validateEntries([{ debit: 0.004, credit: 0 }])` | `isValid: true`, 0 errors                      | `toCents(0.004) === toCents(0) === 0`: the double-entry gate saw a balanced row carrying money |

**The rule (DEC-048, audit P1-11 phase 1).** A ledger amount is a finite,
non-negative (`debit`/`credit`) number with at most `LEDGER_SCALE` (2) decimal
places. Finer precision is **refused with a named reason, never rounded on
write** — rounding would silently discard money, which is what FR-006 forbids.
One authority (`ledgerAmountIssue`) now serves `setEntries`, `addEntries`,
`addEntry`, `validateEntries` and the server hydrate path; the primitive gained
`decimalPlacesOf` (`0.1 + 0.2 → 17`, `0.3 → 1`) and `hasSubUnitPrecision`.

**Evidence.** `src/store/glStore.ledgerScale.test.ts` — **9/9** (the three
write surfaces, the gate regression, whole-cent boundary, cent-identity,
prior FR-006 rejections unchanged) · `src/utils/money.test.ts` **34/34** (+4
predicate tests) · `src/store/glStore.server.test.ts` **18/18** (hydrate now
refuses a `0.004` server row and names it) · store + import regression **93
files / 1,439 tests** · `tsc` 0 · eslint `--max-warnings 0` clean · prettier
clean · `money:ast` 0 unsafe · determinism **344 / 79** at baseline ·
`money:adoption` **29.99 %** / 0 raw `toFixed` · `docs:verify` 9/9 (test files
1,402 → **1,403**) · strict links 0 broken · hygiene **3,622 / 0** ·
**full suite 1,403 files / 16,293 passed + 1 skipped** (1,054 s, exit 0).

**Commit.** `bf4c3623` on `arena/ef7aacd6-fp-a-betterversion` (pushed).

**Doc correction.** `docs/architecture/money.md` claimed "half-even / banker's
rounding". The code has always used `ROUND_HALF_UP` (`1.005 → 1.01`) and KAV-08
pins it. The page now states the real mode and the ledger admission rule.

**Explicitly NOT claimed.** This is **not** the `Money` type. `GLEntry.debit/
credit/amount/netChange` remain JS `number`; audit P1-11's target state is
integer minor units + currency end to end, and that adoption sweep (242 files)
is untouched. Sub-cent **rejection** is a policy chosen under delegated
authority and recorded as provisional — a real export in a 3-decimal currency
(KWD/JOD/BHD/OMR/TND) would now be refused **with reasons** rather than
silently rounded, and that trade-off is the review trigger on DEC-048. No D365
shape is verified (O1/DEC-043 unchanged).

**Next.** (1) `Money` nominal type at the ledger boundary (P1-11 phase 2) —
introduce the type where it is provable, keeping the 242-file sweep phased.
(2) N7 route reduction toward ≤40 (231 now). (3) Export cross-artifact tie-out.
Still owner-blocked: Actions read scope (CI 403), PR **#83**, real anonymised
D365 export.

## 2026-10-21 (continued) — SPINE ACCEPTANCE: the D365 bar FAILED, now passes

**The finding.** VISION §1 says the spine must work end-to-end on a synthetic
D365-shaped file. Measured on 2026-10-21, it **did not**. Feeding the documented
"General ledger statement by main account" headers to `ingestGLRows` mapped only
debit/credit/description and rejected the file with four `Missing required column`
schema errors. **No real D365-shaped export could enter the spine at all.**

**Why it was invisible.** The machinery is extensive — `src/services/import/` is
7,716 LOC with integration tests, and `d365Parser.ts` has 559 LOC + 505 test lines.
But that parser was **standalone: never wired into staging**. It proved a parser,
not the spine. The existing pipeline test uses a _generic_ CSV shape
(`AccountCode/PostDate/...`), which is why nothing caught it.

**The fix (DEC-047).** Two documented realities modelled rather than assumed away:

1. **Header names differ** — exact normalised aliases added (`mainaccount`,
   `mainaccountname`, `transactionpostingdate`, `transactionnumber` (the voucher),
   `transactioncurrency`). Exact, never substrings, so "Main account" cannot
   collide with "Main account name".
2. **The legal entity is EXPORT CONTEXT, not a column** — the statement is produced
   per legal entity. `defaultEntityId`/`defaultCurrency` replace the column
   requirement, must pass `knownEntityIds`/`expectedCurrency`, are validated at the
   **worker boundary** like every other field (that validator silently dropped the
   new fields on the first attempt — a real trap), and are **never inferred**; a
   supplied row column always wins.

**Evidence.**

- `src/services/import/spineAcceptance.d365.integration.test.ts` — **5/5**:
  D365 shape → stage → quarantine reasons → period-close guard → promote →
  promoted ledger → exact control totals (`135250.17 == 135250.17`) → determinism.
- `src/engines/SmartImportMapper.d365Defaults.test.ts` — **7/7** boundary:
  missing default still rejected, unknown default entity rejected, currency
  mismatch rejected, blank default rejected, row column beats default.
- Regression: import + mapper + workers + `GLUploadPage.d365` = **29 files / 342 tests**.

**Not claimed:** verified D365 support. The shape stays _mapping-driven,
unverified_ (O1/DEC-043); the fixture is synthetic; no version/configuration claim.

**Gates:** `tsc` 0 · eslint `--max-warnings 0` clean · prettier clean ·
`money:ast` 0 unsafe · determinism 344/79 at baseline · `money:adoption` 29.99 % /
0 raw sites · `docs:verify` 9/9 · strict links 0 broken · hygiene 3,620/0.

**Next unblocked work:** money-domain `GLEntry` types (`number → Money`, P1-11) ·
N7 route reduction to the ≤40 target (now decidable under DEC-042) ·
export cross-artifact tie-out · money adoption sweep.

**Still open:** 93 of 200 sections SOURCE OWED · CI HTTP 403 (unverifiable) ·
PR #83 open since 2026-10-20 · native/recovery evidence (O7) · real anonymised
D365 export (O1). **Known-work complete: NO. Programme complete: NO.**

## 2026-10-21 (continued) — provisional decisions adopted; N3 forecast writers closed

**Owner mandate:** take project decisions per the vision recorded in Notion.

**Applied mechanism:** the Owner Decision Packet's own rule — _silence means the
recommended default is adopted as a provisional default, recorded in
`docs/discovery/decision-log.md`, and named as provisional in every report._
No new authority was invented; the packet was exercised as written.

| Decision    | Effect                                                                                                                                                                                                                                              |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **DEC-042** | v1 **supported** scope = the DATA→CLOSE spine; **ultimate** scope stays all of FP&A per DEC-033. Resolves the DEC-033 ↔ roadmap "no new domain feature expansion" contradiction by separating destination from supported label. No surface deleted. |
| **DEC-043** | O1–O9 defaults adopted **provisionally**. Every default removes a claim. The packet's five absolute prohibitions are explicitly **not waived**.                                                                                                     |
| **DEC-044** | Q6: server retired from supported scope; v1 local-first. Closes the audit **P0-3** sign-in paradox — while O7 still forbids claiming a working desktop sign-in.                                                                                     |
| **DEC-045** | **N2 authority question closed** at "bounded client evidence" (O4). N2 stays open only on restart/keying/anchoring durability.                                                                                                                      |
| **DEC-046** | **N3 entity authority** = deny by default, no inferred grants (O9).                                                                                                                                                                                 |

**N3 engineering closed this session:** `src/store/forecastStore.authorization.test.ts`
(7 tests) covers all six forecast/driver writers against signed-out, Viewer and
Admin-with-permission-withheld, asserting the error **names** the required
permission and that financial state and undo history are unchanged after a
denial. It also pins the real role asymmetry: Analyst may create and edit but
must not delete.

**Mutation-verified** (source restored, `git diff` empty):

- `updateForecast` FORECAST_UPDATE → FORECAST_READ: **3 failed / 4 passed**
- `deleteForecast` FORECAST_DELETE → FORECAST_READ: **4 failed / 3 passed**

The first mutation **disproved my own written claim** ("exactly two cases"); the
comment now records the measured three — including that a signed-out denial still
failed on permission _naming_, which is precisely why the name is asserted.

**Gates:** `tsc` 0 · `eslint --max-warnings 0` clean · prettier clean ·
`docs:verify` pass (9/9 ratchet values) · `docs:link-check --strict` 0 broken ·
`repo:hygiene` 3,619/0 · regression `rbacNegativeAuthorization` +
`budgetStore.authorization` + `rbacMatrixCompleteness` = **3 files / 250 tests**.

**Still open:** 93 of 200 sections SOURCE OWED · CI HTTP 403 (unverifiable) ·
PR **#83** open since 2026-10-20 18:08 · native/recovery/key-custody evidence
(O7) · spine acceptance verdict · N7 route reduction · money-domain `GLEntry`
types (P1-11) · export tie-out (no PPTX, no cross-artifact test).
**Known-work complete: NO. Programme complete: NO** — DEC-043 O7/O4 forbid those claims.

## Session checkpoint — 2026-10-21 (solo; fleet proposal dropped)

**Owner decision:** the 15-agent fleet is **not adopted**; work proceeds solo.
`docs/agent-fleet/FLEET_OPERATING_MODEL.md` is marked NOT ADOPTED and retained as a
design record only. Nothing in it is in force.

Two defects closed in this session. Both were gates that could not fail.

**1. `docs:verify` blind spot (routes + test files).** `scripts/verify-readme-stats.mjs`
asserted engines/stores/workers but not the two most-quoted README figures, so both had
drifted: routes **242 claimed vs 231 measured**, test files **~1,315 vs 1,398**. The gate
now measures both — routes with the _same regex_ as `scripts/generate-route-map.js`, test
files with Vitest's exact discovery (`include src/**/*.test.ts(x)`, `exclude tests/,
node_modules/, __benchmarks__/, *.bench|benchmark.test.*`). It deliberately does **not**
assert a test tally (that needs a ~1,057 s sharded run); a tally in the README must instead
be labelled a _recorded_ result, enforced by a new guard.
Failing-first: 2 failures before the README fix, exit 0 after. Mutation: reverting `231→242`
kills exactly that assertion.

**2. `license:check` fail-closed (audit P2-21).** The script had three independent holes:
`ACCEPTABLE_LICENSES` was declared and **never consulted** (denylist only, so `UNKNOWN`
logged `✅`); a missing license field became `UNKNOWN` and passed; and the outer `catch`
printed "best-effort" and exited **0**, so a failed `npm ls` reported success having
verified nothing. Demonstrated on the old script: with no inventory it printed
`✅ License check passed` and exited **0**.
Now: allowlist is load-bearing; `UNKNOWN` / missing / `SEE LICENSE IN …` fail closed;
SPDX `OR`/`AND` and `-only`/`-or-later` suffixes handled; exit codes are
**0 verified · 1 rejected or unverifiable · 2 could not verify at all**.
New suite `src/__tests__/licenseCheckScript.test.ts` — **13 tests**; failing-first against
the old script **9 failed / 4 passed**; passing after the rewrite **13/13**.
This is a policy check on declared metadata, **not** legal certification.

**Measured this session:** `tsc` exit 0 · `eslint --max-warnings 0` on the new file exit 0 ·
`prettier --check` clean · `docs:verify` pass (all 9 ratchet values match) ·
`docs:link-check --strict` 0 broken · `repo:hygiene` 3,618 files / 0 tracked ignored.
`npm ci --ignore-scripts` succeeded (835 packages), so the above ran for real rather than
being inferred.

**Still open (unchanged):** N2 blocked on **O4**, N3 on **O9**; 93 of 200 checklist sections
**SOURCE OWED**; CI on `main` still **HTTP 403** (unverifiable, not green); PR **#83** open
since 2026-10-20 18:08; forecast-writer denial evidence and the N7 route reduction not started.
**Known-work complete: NO. Programme complete: NO.**

## Final budget trust checkpoint — 2026-10-20

**Current result (supersedes pending-gate/next-step statements in historical
checkpoints below):** `npm run check` passed **8/8 shards, 1,398 files,
16,248 passed + 1 existing skipped = 16,249 total**, suite component **1,057s**.
Production build and bundle check passed: **6,815.88 KB raw / 2,060.77 KB gzip
vs unchanged 2,080 KB**, one warning; critical path **425.06 KB gzip**, main
**69.74 KB gzip**. Money adoption **305/1,017 = 29.99%, zero raw sites**.
Root/prod audits both zero at the dependency-remediation checkpoint.

DEC-039/040/041, submission caller error/retry handling and a repeatable
`node scripts/verify-budget-guard-mutation.mjs` proof are closed only within
their witnessed budget scope. Mutation proof: normal 5/5; mutant exactly four
named denial failures and one Admin pass, production source unchanged.
Handbook inventory/migration/GL-close/bundle contradictions reconciled;
architecture keyword checks, docs truth, strict links, route map and hygiene
pass. Architecture checks are not a cycle-graph or product certification.

Durable commands, per-shard tally, failing-first results, commits and boundaries:
[budget trust continuation evidence](audit/BUDGET_TRUST_CONTINUATION_2026_10_20.md).
No new route/store/engine/connector, persisted schema/namespace, authority grant,
ratchet baseline or CI workflow edit. No new DEC-042 authority was needed.

**Known-work complete: NO. Programme complete: NO.** N2/N3 remain active;
N-register **2/8 DONE** only for prior bounded N1/N5. **107 mapped / 93
source-owed (108–200)** remains unchanged. CI is unverifiable (HTTP 403),
not green. Owner data/control totals, two-month parallel run, supported-scope,
native/recovery/key-custody, Q6/O4/O9 and other certification proofs remain owed.

**Next unblocked work:** forecast writer denial/mutation evidence starting
`forecastStore.updateForecast`; verify other budget detail action error channels;
isolated failing-first license-check fix for UNKNOWN metadata / fail-open
execution. The current license script is not global legal certification. N7
structural reduction and N8 complete supported-module adoption remain open.
Existing PR #82 is for review only, not merge/release; push/pre-push outcome is
recorded on the PR after execution, not inferred here.

> **Caller checkpoint:** existing budget list/detail now catch synchronous and
> async submission failure into shared ErrorState; list Retry can recover, and
> failures do not change budget data. Failing-first 3 UI regressions; final
> unfiltered page/deep/a11y/grid/money + authorization impact sweep **8 files /
> 138 passed**. Approval page fixtures pin DEC-039's approval permission. Full
> changed-tree check/build have restarted after the caller fix and are pending
> at this checkpoint. N2/N3 and owner/native/CI obligations remain open.

> **Dependency checkpoint:** root audit findings remediated in the lockfile:
> fresh full-root and production-only audits both zero; Vitest 4.1.12, js-yaml
> 4.3.2, source-map-js 1.2.2, undici 7.30.1. No package paths added/removed or
> direct ranges changed; changed licenses MIT/BSD-3-Clause. Patched-runner
> budget/close/RBAC tests 8 files / 367 passed. The best-effort license script
> reports UNKNOWN and is not global legal certification. Next: surface async
> submission failures at both existing budget call sites, then complete final
> full gates/build. Initial final processes were stopped for this caller review;
> they are not completed evidence. N2/N3/programme remain open.

> **DEC-041 checkpoint:** budget provenance suite reproduced 12 failed /
> 1 passed; an additional ambiguous-line case failed before its guard. Final
> 14/14; combined budget/close/RBAC sweep 8 files / 367 passed. Old amount is
> captured before mutation, new/copy creators are authenticated, clock-collision
> IDs reserve existing header/line/history references, and legacy ambiguous IDs
> fail closed. No persisted history was rewritten or guessed. N2/N3 remain open;
> next is isolated dependency remediation followed by final full gates/build.

> **DEC-040 checkpoint:** budget closed-write regressions reproduced 14 failed /
> 5 passed; final closed-write suite 21 passed, combined budget/close/RBAC run
> 7 files / 353 passed. Guards cover bulk replacement, source AND destination
> identity, fiscal-year header changes/removal, and duplicate replay IDs before
> mutation. Exact no-ops and system marker-only freeze remain usable. N2/N3
> remain active; no native, entity-policy or programme closure follows. Next:
> budget edit provenance and clock-collision IDs, then dependency patches.

> **Continuation 2 checkpoint — 2026-10-20:** fresh baseline at `80117954`:
> `npm run check` 8/8 shards, 1,395 files, 16,110 passed + 1 existing skipped,
> 1,100s. DEC-039 fixes approval authority and bulk/lifecycle/async budget
> bypasses; failing-first 38 failed / 62 passed → 100 passed; combined budget
> trust run 5 files / 299 passed. TypeScript, targeted lint, money and
> determinism pass. N2/N3 remain active, CI still HTTP 403, owner source/native
> proofs remain owed. Final changed-tree full check is not yet run at this
> checkpoint. Next: closed-period bulk/destination/header guards. Earlier
> records below are historical, not current pending-gate status.

> **Closing record — 2026-10-20, `arena/efe658d1-fp-a-betterversion`:**
> code commit `0f750d50`; baseline reconciliation `aa32e18e`; scope gate
> `6b9c74d6`. Final `npm run check` passed: 8/8 shards, 1,395 files, 16,110
> passed + 1 existing skipped in 1,066s (suite component). Final build passed;
> bundle 2,059.60 KB gzip / unchanged 2,080 KB ceiling, one warning. Money
> adoption 305/1,017 (29.99%), zero raw sites; money AST zero unsafe ops.
> Strict links, hygiene and route-map checks pass. CI main is still HTTP 403,
> unverifiable. Selected Wave-6 witnesses: 21 files / 472 tests, not native
> proof. See [session evidence](audit/CONTINUATION_2026_10_20_EVIDENCE.md) for
> exact commands, all closed slices, provisional defaults and unrun programme
> proofs. N2/N3 stay active; known-work complete NO; programme complete NO.
> Development-inclusive audit findings (2 moderate / 3 high affected packages)
> remain open; production-only audit is clean. Next trust slice: mutation-verified
> negative tests for populated `budgetStore.updateBudget`, without inferring
> entity grants. Keep the dependency review isolated from financial fixes.

> **N2/N3 attribution follow-up (DEC-038):** a failing-first run reproduced
> two false historical-author attributions; four denial cases already passed.
> New reversion records now use the current authenticated actor; prior records
> are never rewritten. Combined trust slice passed 8 files / 204 tests;
> `tsc`, targeted ESLint, `docs:verify` and strict links passed. The audit map
> contains the exact command and remaining boundaries. Full final gates will
> be recorded below when completed, not inferred from baseline evidence.

> **Wave-0 gap gate follow-up (DEC-037):** `coverageAnnexClaims.test.ts`
> passed 9/9 after a failing-first run (7 failed / 1 passed). `docs:verify`
> now warns about all 93 source-owed sections (108–200), in addition to the
> legacy 108–110 disclosure. The original header is unchanged. No section
> titles were invented, and no source-owed row can be silently closed. See
> the source blocker register for this session's bounded recovery search.

> **Latest measured baseline, 2026-10-20:** session branch
> `arena/efe658d1-fp-a-betterversion`, base `9f6d6a02`. Baseline gates pass;
> full suite 8/8 shards, 1,394 files, 16,097 passed + 1 skipped in 1,204s.
> Build passes; bundle 2,059.69 KB gzip / 2,080 KB, one warning. CI `main`
> remains unverifiable (Actions HTTP 403). See the taskboard session baseline
> for exact commands/tallies. N2/N3 remain active; no programme completion claim.
> Earlier dated updates below are historical, not the current branch state.

> **Latest continuation update (2026-10-20; branch `arena/d9a8f733-fp-a-betterversion`):** N2 remains active. Added `src/store/cellLineageStore.persistence.test.ts`; it verifies encrypted `masterStorage` round-trip and fresh-module hydration while the lower SQL.js layer is a persistent in-memory mock. Focused run passed 1/1; combined lineage/storage/audit run passed 5 files / 38 tests. This is not native Tauri, OS-keychain, disk-durability, or application-restart proof. Initial `npm run tsc`, `npm run lint`, and `npm run format:check` attempts were aborted without exit codes; complete reruns subsequently passed (`tsc`, lint 125.5s, format, `docs:verify` with the existing 108–110 warning, and strict docs links with 0 broken links/citations). The final focused suite passed 6 files / 40 tests, including the coverage-annex checker tests. Owner sections 111–200 are now recorded in DEC-034 and `docs/discovery/OWNER_SCOPE_REGISTER_111_200.md` as 90 individual SOURCE TEXT OWED / UNASSESSED placeholders; the carried-forward context did not preserve their verbatim titles/sub-items. The original 110-section annex and its unresolved 108–110 warning are unchanged. Next: recover the verbatim extension (and 108–110 source), then revise the annex/checker deliberately; continue N2 first. No native restart, Q6 server fate, or O4 SOX authority is closed.

> **Current-session update (2026-10-20; branch `arena/d9a8f733-fp-a-betterversion`):** Started from the verified PR #78 merge commit `b2cff437293a37366fbc6187ca4859c71194b6bd`, also observed at `origin/main`. The owner added DEC-033: the ultimate scope is everything under FP&A, with analyst replacement/better accuracy as an ambition that needs owner-accepted real-data measurements—not a shipped claim. N2 remains active. A failing-first lineage regression showed `verifyIntegrity()` accepted a chain whose cached `currentValue` disagreed with the last verified entry; the verifier now checks derived chain summaries and `getCurrentValue()` derives from the final entry. Focused lineage/audit/page tests passed 3 files / 47 tests; precision rounding and comparison display tests passed 2 files / 32 tests. `toPrecise()` now uses the canonical money primitive after a failing-first midpoint regression; ComparisonPage uses the percentage formatter, removing the existing raw `.toFixed()` adoption-gate violation. Latest measured money adoption: 305/1,017 modules (29.99%), zero raw `toFixed` sites; gate passed. Current `npm run build` passed (including TypeScript and lint); `npm run format:check`, `npm run docs:verify`, `npm run engines:verify`, strict `npm run docs:links` (0 broken links/citations), `git diff --check`, money AST/adoption, determinism, type-safety, escape, palette, and fabrication checks passed. Docs verification explicitly warns that rows 108–110 remain unresolved. `npm run financial:oracles` passed 25/25. `npm run bundle-check` passed with a warning: 2,058.84 KB gzip, 99.0% of the 2,080 KB ceiling; no budget increase was made. The first current-session `npm run test:sharded` attempt was interrupted during shard 8; a completed rerun passed 8/8 shards in 1,112 seconds. Shard 8 reported 1,843 passed and 1 skipped; the sharder did not provide an aggregate test total. GitHub CI status remains unverified: `gh pr checks 78` failed with GraphQL resource-access denial and `gh run list --branch main` returned HTTP 403. Encrypted/native masterStorage restart proof, pre-push, Q6, and O4 remain open. Full handoff details are below; this does not close N2 or the project.

> **Latest N3 RBAC continuation (2026-10-19):** The pinned AST census is 409 store actions: 302 guarded, 107 explicit exceptions. A failing-first review found `auditTrailStore.recordBulk` had no in-repository caller and was incorrectly grouped with GDPR bridge recording; it now requires `audit:create`. Denial cases reproduced three allowed calls (no session, Viewer, Admin missing `audit:create`) before the fix. The four GDPR bridge recorder exceptions remain scoped and explicitly disclaim payload-source authentication and general audit authority. Source review also found `src/services/api.ts` calling `useAuthStore.setState` after a successful 401 refresh; the interceptor now delegates to `authStore.refreshAccessToken`, and the AST ratchet rejects direct `.setState` access on imported stores in production code. `authStore.register` is allowed only when mock auth is explicitly enabled in a non-production build; a failing-first test proved the previous local-registration bypass when `VITE_USE_MOCK_AUTH=false`. `authStore.switchEntity` remains blocked by O9—do not infer entity access from `activeEntityId`. Latest focused RBAC/auth run: 5 files / 206 tests passed. The first full sharded run found eight failures in four test fixtures that relied on ambient role state after the RBAC hardening. Fixtures now use real authenticated roles; the final `npm run test:sharded` passed 8/8 shards in 1187s (one test skipped). `npm run tsc`, full `npm run lint` (138s), `npm run format:check`, `docs:verify`, strict `docs:links`, and `git diff --check` passed. Pre-push remains unrun. Consolidated N3 implementation/snapshot is committed as `9aab152`; authorized test-fixture follow-up is committed as `e185e04` (tracker hook `02e8394`). N5 E6 hygiene is now implemented: `scripts/check-coverage-annex.mjs` validates five-column row shape/statuses and contiguous numbering, pins row 26 to the AST census and row 45 to source store counts, and surfaces the unresolved 108–110 scope gap. A deliberately wrong row-26 count is rejected by a 2-test suite. The script is part of `npm run docs:verify`; it does not claim full semantic verification of free-text evidence. `docs:verify` passes with an explicit warning for missing rows 108–110. N3 remains active, not complete.

> **Previous continuation update (2026-10-19):** checklist census and phase/dependency sweep recorded in the Master Coverage Snapshot; 107 rows exist (1–107), and missing rows 108–110 remain an unresolved scope discrepancy. N2 remains active. DEC-027 retires the former in-memory `CellAuditTrailEngine` after a pre-removal census found no remaining production consumer/writer or persistence; its tests, benchmark, export, manifest entry, smoke mocks and stale type comments are removed/updated. No durable history required migration. The `AuditEngine` and `AuditTrailEngine` prototypes have also been retired by DEC-028 after a no-caller/no-persistence census; measured engine inventory is 180 modules / 98 shipped / 82 orphan. DEC-028 verification: 6 focused files / 69 tests passed; `npm run tsc`, full `npm run lint` (164.8s), `format:check`, `docs:verify`, `engines:verify`, strict `docs:links`, and `git diff --check` passed. Full sharded suite and pre-push remain unrun. Server `/api/audit` remains Q6-blocked and SOX authority remains O4-blocked. DEC-031 records the concrete `AuditLogger` boundary as an isolated, in-memory helper—not a product audit authority. DEC-032 retains `PIIRedactor` only as an isolated in-memory helper: no production caller or persistence adapter was found; its 70 unit tests prove helper behavior only, not product-wide PII coverage. Security/threat-model claims were corrected to mark this runtime control unverified. N3 RBAC review also tested and fixed `getCurrentUser()` so stale `user` data is ignored unless `isAuthenticated === true` (code/test commit `80371c5`); a failing-first regression proved the prior implementation returned permissions for an unauthenticated stored user. The RBAC AST census now accepts only top-level imported permission wrappers or first-statement imported assertions; synthetic tests reject nested, unused, unimported, and parameter-shadowed checks. A checked-in snapshot pins the 400+ action/disposition inventory, and failing-first denial cases cover delegated `recordDisposition`/`updateDisposition` actions (tests committed in `04478a2` and `3ac1173`). The audit-record exception now states that the GDPR bridge is the only in-repo caller found and caller-source authenticity is unverified (commit `3b19bfa`). Latest focused run: 16 RBAC/audit files / 392 tests; period/document impact set: 5 files / 95 tests. `npm run tsc`, full `npm run lint` (205s), `npm run format:check`, `docs:verify`, strict links, and `git diff --check` passed. `authStore.switchEntity` remains blocked on owner decision O9; do not infer authorized entity scope. DEC-030 fixes period-close chain verification so it preserves append order and verifies per-period genesis; the close log remains unanchored and separate from general audit/SOX authority. `periodCloseStore.test.ts` and `PeriodClosePage.test.tsx` pass 50/50; tsc, full lint (165s), format, docs truth, engine manifest, money/determinism/palette/fabrication ratchets, strict links, and diff check all pass. Full sharded suite/pre-push remain unrun. DEC-031 retains `AuditLogger` only as an isolated in-memory helper; no production wiring/persistence was found, and its historic security/A11Y policy references are not runtime evidence. `SecretRotation-AuditLogger.test.ts` + `SecretsVault.test.ts` pass 138/138; tsc, full lint (169s), format, docs truth, strict links, and diff checks pass. Q6/O4 remain owner blockers. Cell-lineage is retained separately by DEC-029; its v1 JSON Map-loss and link-only integrity gaps were reproduced failing-first, then repaired with a v2 migration and hash-recompute check. `cellLineageStore.test.ts` is 12/12; combined lineage/audit tests passed 3 files / 39 tests. Full lint passed in 176.0s; tsc, targeted ESLint, format, docs truth, engine manifest and strict links passed. Full sharded suite, pre-push and encrypted-backend restart proof remain unrun. Post-removal evidence: 5 focused files / 68 tests passed; `npm run tsc`, full `npm run lint` (121.9s), `format:check`, `docs:verify`, `engines:verify`, strict `docs:links`, and `git diff --check` passed. Full sharded suite and pre-push remain unrun.

> **How to use this file:** start the new session, open the repo, and paste the
> prompt in §1 verbatim. Everything after §1 is the evidence pack the prompt
> points at. Facts here were measured in this tree; anything not measured is
> labelled as owed.
>
> **Prior continuation record (2026-10-19; historical):** that session started on
> `arena/b72c910a-fp-a-betterversion` at `7be001e`. N2 remains
> the first active task. The reachability map/page adapter exist; the persistence
> contract test now covers audit-store v0→v1 migration and verified restored
> chain state. Focused evidence from this slice is 27/27 tests across
> `auditTrailPersistence.test.ts` (7) and `AuditTrailPage.test.tsx` (20), plus
> `npm run tsc` passed. Baseline `npm run lint` flagged formatting at
> `src/domain/persistenceAuthority.ts:67`; that correction is in the worktree.
> Final focused run: 27/27 tests across migration and page-adapter files;
> `format:check`, `docs:verify`, `engines:verify`, strict `docs:links`, and
> targeted ESLint for both touched source files passed. Full `npm run lint`
> timed out at 180 seconds; no full suite/pre-push run was made. Coverage row 45
> and the reachability map now record this evidence. Remaining N2 path
> dispositions and Q6/O4 boundaries are open; this is not a product-wide
> audit-chain completion claim.
>
> **Follow-on N2 slice (2026-10-19):** starting from `9a38cb9`, DEC-026
> retires the unconsumed EventLedger prototype. `eventLedger.ts`, its tests and
> test-only RBAC exclusion were removed after a source census found no production
> caller, writer or persistence path. Regenerated capability matrix; corrected
> README/data model count to 48 Zustand stores, 43 persisted. Focused tests after
> removal: 3 files / 36 tests passed; `npm run tsc`, `format:check`, targeted
> ESLint, `docs:verify`, `engines:verify`, and strict `docs:links` passed. Full
> suite, full lint and pre-push remain unrun this slice. N2 still open for other
> dormant paths, period-close/cell-lineage treatment, Q6 server and O4 SOX.

---

## 1. Paste-ready prompt for the next session

```
You are continuing work on FinPlan Pro (repo: fp-A-betterversion), an all-in-one
FP&A desktop app. The owner's ultimate scope is **everything that falls under
FP&A**. The owner wants the ultimate tool, with an ambition to replace an army
of FP&A analysts and perform more accurately and intelligently. That is an
outcome target—not a current capability claim—and requires measured,
owner-accepted evidence on real data. The first required workflow remains:
Dynamics 365 GL dump in; questionable entries found; human-led accounts-team
correction and re-verification; day/month/year comparison in extreme detail.

THE ONE RULE — ZERO COMPROMISES: nothing missed, nothing wrong/flawed/improper
left unlisted or unaddressed. Never present a spine-only or deferred-breadth
plan as complete.

READ FIRST, IN ORDER:
1. docs/HANDOVER_NEXT_SESSION.md (this file) — state, queues, owner-blocked items
2. docs/TASKBOARD.md — the live task board; pick up the top unblocked item
3. docs/PROJECT_AUDIT_AND_EXECUTION_PLAN.md — governing plan (Parts I+II, §18.1)
4. docs/MASTER_CHECKLIST_COVERAGE.md — original 110-section coverage annex (108–110 still unresolved); extension intake: `docs/discovery/OWNER_SCOPE_REGISTER_111_200.md`
5. docs/discovery/decision-log.md — DEC-001…DEC-036; owner rulings are binding
6. AGENTS.md + docs/agent/ — standing engineering rules

OWNER RULINGS ALREADY DECIDED (do not re-ask, do not re-narrow):
- DEC-015: D365 importer handles ALL export shapes (mapping-driven); "verified"
  per shape still needs one real anonymised sample from the owner.
- DEC-016: surfaces ALL, dependency order: spine (J1 import→workspace) →
  exception queue (J2) → correction hand-off (J3) → comparison (J4).
- DEC-017: materiality EVERYTHING — thresholds rank/tier only, never suppress.
- DEC-018, refined by DEC-035: supported correction work is completed in-tool;
  Excel correction-list export remains optional interoperability. The
  REQUESTED → APPLIED → RE-VERIFIED lifecycle is human-only and audit-recorded.
  New events persist authenticated actor/time and are visible in the tracker;
  proposals are cues, not proof, and an empty ledger cannot trigger one.
- DEC-022: AI local-only, behind the verified-facts gate; external AI provider
  needs a new owner DEC first.
- DEC-024: bundle budget 2080 KB gzip (measured re-baseline); any further rise
  needs a new DEC with measured proof.
- DEC-034: sections 111–200 extend all-FP&A scope; exact titles/sub-items are
  SOURCE TEXT OWED / UNASSESSED in the supplemental intake register; retain the
  original annex and unresolved 108–110 warning until a deliberate update.
- DEC-033: ultimate product scope is everything under FP&A. J1–J4/checklist
  are execution structures, not scope limits. Analyst replacement and better
  accuracy/intelligence remain unverified outcome targets; preserve DEC-016
  sequencing, DEC-018 human-led correction as refined by DEC-035 (in-tool completion,
  optional Excel), and DEC-022 local-only AI.

THE FOUR OWNER JOBS (never narrowed): J1 one D365 GL dump in → one trusted
workspace · J2 find wrong entries · J3 guide accounts team to fix them ·
J4 compare day/month/year in extreme detail. A flagged entry is NEVER labelled
error/wrong/fraud until a human disposition says so.

STANDING RULES: measured-or-not-stated (every number from a script) ·
failing-test-first · never weaken a gate to pass · missing is never zero
("not in file" with reason) · money only via src/utils/money.ts (decimal.js,
ROUND_HALF_UP) · determinism via src/utils/clock.ts · no new route/page/
engine/store/connector until the Gate 2 spine is proven · archived docs
(docs/archive/) are provenance only, never instructions.

WORKFLOW: work on the session branch Arena gives you; run the individual gate
scripts BEFORE pushing (husky pre-push runs 10 gates, ~5 min, and fails
sequentially): npx tsc --noEmit · npx eslint src --max-warnings 0 ·
node scripts/bundle-check.js · node scripts/check-readme-claims.mjs ·
npm run docs:verify · npm run engines:verify · node scripts/money-ast-detector.mjs
Use ./node_modules/.bin/vitest if npx resolves a poisoned cache. An empty test
grep result is NOT a pass — rerun un-piped.

START: check docs/TASKBOARD.md "NEXT (unblocked)" and begin with the first item.
Commit in small slices with evidence in the message; push; confirm
"✓ pre-push gates passed" in the output before claiming anything is shipped.
```

---

## 2. Historical state of the tree (superseded by the closing record above)

- Branch at handover: `arena/2b91a53b-fp-a-betterversion` @ `a8462e5`
  (tracker-bot tip; last human commit `e6b1f27`).
- This handover + taskboard are committed on top and merged to `main` via PR —
  verify with `gh pr view <n>` / `git log origin/main --oneline -3` before
  trusting this line in the new session.
- Push gates: all 10 husky pre-push gates passed on every push since `a15a2d0`
  (tsc, eslint 0 warnings, P0 test shard, build, bundle ≤ 2080 KB,
  README claims, dep audit, tautology scan, money-AST ratchet, fabrication
  ratchet, financial oracles, persistence/schema, route map, docs+manifest
  verify, cascade-hold).
- Superseded inventory corrected on 2026-10-20 at `9f6d6a02`: engines 180
  (98 shipped / 82 orphan), stores 48, workers 5, coverage threshold 50
  (`npm run docs:verify`); money adoption 305/1,017 (29.99%), zero raw sites
  (`npm run money:adoption`). These replace the stale 183-engine/49-store
  handover figures; the floor remains 29.16%, not the measured adoption.
- Last broad targeted regression before this handover: engines/statements/
  subledgers/AI/cube/reports/tax/workforce/cash/consolidation/sector + touched
  stores — 391 files / 6,234 tests green; audit cluster 11 files / 81 tests;
  `npx tsc --noEmit` clean; palette ratchet holds at 5,502.
- NOT freshly re-run at handover: the full test suite end-to-end (rely on the
  pre-push P0 shard + targeted sweeps above; re-run `npm run test:sharded`
  early in the next session and record the tally in the taskboard).

## 3. What is done (phases, with anchors)

- **Phases 0–10 code-side closed** (spine J1–J4, D365 import shapes,
  exceptions R-001…R-017, corrections hand-off, comparison, budgets,
  consolidation/FX/IC, statements, cash/workforce decontamination).
- **Phase 11 slice 1:** sector verification registry; EXPERIMENTAL banners.
- **Phase 12 slices:** RBAC guards on financial-truth stores (negative
  authorization tests); **R-009 audit reconstruction** —
  `src/services/audit/reconstructState.ts` (7 tests) +
  `StateReconstructionPanel` in AuditTrailPage (4 tests): chain-verified
  rebuild of cell state as-of any timestamp, fail-closed on tamper.
- **Phase 13 core:** verified-facts gate (`verifiedFactsGate.ts`, AI-001
  corpus 6/6) wired into NLQ; DEC-022 local-only AI.
- **Phase 14 slices 1–2:** DEC-020 formula census guard; GL→cube tie-out to
  the cent; `cubeStore.syncGLActuals`; CubeEngine measure-selection bug found
  by the tie-out and fixed.
- **DEC-023:** `AnomalyExplainer` retired (canned causes + fabricated
  confidence breached the evidence rule). Do not recreate it.
- **DEC-024:** bundle re-baselined 2048→2080 KB with measured proof.

## 4. What is NOT done

See `docs/TASKBOARD.md` — queues E1–E6, the canonical audit-chain
consolidation, the coverage-annex claim checker, and owner-blocked items
(Phase 1V real D365 samples, DEC-019 roll semantics, key-escrow DEC,
SOX authority DEC, external-AI DEC-022 follow-up, native/Tauri verification).

## 5. Traps that already cost time (do not repeat)

- Husky gates fail **sequentially** (~5 min per push attempt): run each gate
  script directly first.
- Sandbox snapshots exclude `node_modules` and can rewind local HEAD to base
  while keeping the working tree: recover with `npm ci`, `git fetch origin`,
  `git reset --mixed origin/<branch>`, then verify `git status` before
  committing.
- Never fire parallel edits at the same file; grep-verify BOTH edits after.
- `GLEntry` is in `@/types` (not `@/types/gl`); vitest can pass while tsc
  fails — always `npx tsc --noEmit` BEFORE committing, never chained with `;`.
- New `persist()` stores must be registered in BOTH
  `src/utils/persistedStores.ts` and `src/domain/persistenceAuthority.ts`,
  then `node scripts/persistence-map-check.mjs --write`.
- Route count is pinned (231) in `src/App.routeShell.test.tsx`; deliberate
  new routes update the pin with a documenting comment + regenerate
  `docs/product/ROUTE_MAP.md`.
- Guarded stores throw signed-out: tests must sign in via
  `src/test/rbacFixtures.ts` (`actAs`, …).
- Money: cent-round BEFORE subtracting; test comparisons in integer cents;
  independently rounded periods don't foot — use deltas of rounded cumulative.
- MASTER_CHECKLIST_COVERAGE.md remains the original 110-section annex with its 108–110 warning. Its mechanical structural/pinned-claim guard is `scripts/check-coverage-annex.mjs`, wired into `npm run docs:verify`: five-column shape/status/sequence, row 26 RBAC census, and row 45 store counts. The 111–200 intake is separate and unassessed; do not append it until the source gap and checker are deliberately reconciled. Free-text semantics still require source evidence and owner/phase review.
