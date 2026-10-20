# Budget trust continuation — 2026-10-20

Branch: `arena/efe658d1-fp-a-betterversion`; existing [PR #82](https://github.com/Warzonesiddiki/fp-A-betterversion/pull/82), not merged.
Starting commit: `80117954`. This is bounded engineering evidence, not a
claim that the FP&A programme is complete or flaw-free.

## 1. Fresh baseline, before application edits

`git status --short` was empty; branch matched the session branch.
Node `v22.22.3`; installed runner Vitest `4.1.7`.

`npm run check` passed: **8/8 shards, 1,395 files, 16,110 passed + 1 existing
skipped = 16,111 total; sharded component 1,100 seconds**. This includes tsc,
full lint, source formatting, docs/engine verification, money AST, determinism,
palette, fabrication and the full sharded suite. No earlier session's result
was substituted for this baseline.

Separate `npm run build`, `node scripts/bundle-check.js`, `npm run
money:adoption`, `npm run docs:links`, `npm run repo:hygiene`, and `npm run
routemap:check` passed. Baseline bundle: **2,059.60 KB gzip / 2,080 KB**, one
warning. Hygiene: **3,612 tracked files / zero tracked ignored files**.

`npm audit --json` reproduced **5 affected packages: 2 moderate / 3 high**.
`gh run list --branch main --limit 3` returned HTTP 403, Resource not accessible
by integration. CI is **UNVERIFIABLE**, not red or green.

## 2. Independently evidenced closures

### DEC-039 — budget authority and lifecycle (`687dbc92`)

The four review/finalization actions used edit authority despite the existing
`budget:approve` permission and role grants. Approval, rejection, locking and
unlocking now require that existing grant. No role's grants were broadened.

Bulk header/line replacement cannot spoof lifecycle state or edit finalized
substance; bulk insertion/removal checks create/delete authority. New/copy
budgets start Draft with no inherited approval. Pending submission rechecks
authorization after its await and rejects concurrent replacement rather than
overwriting newer state. Its rejection is propagated, not silently swallowed.

Failing-first on parent application source: **38 failed / 62 passed**. Final
new suite: **100/100 passed**. It covers all **14 financial guarded budget
actions**, four denial classes (no session, Viewer, exactly one grant withheld,
stale Admin object), full-Admin mutation positives, real Analyst/Manager role
behavior, full serialized state and reference preservation, bulk bypasses and
async revocation/concurrency. The additional guarded UI-only cell-selection
action has separate positive/negative evidence. A source assertion accounts
for all 15 guarded actions; `setActiveBudget` remains the existing UI exception.

Combined command:

```bash
./node_modules/.bin/vitest run src/store/budgetStore.authorization.test.ts src/store/budgetStore.test.ts src/store/budgetStore.lifecycle.test.ts src/store/rbacNegativeAuthorization.test.ts src/store/rbacMatrixCompleteness.test.ts
```

**5 files / 299 tests passed**. The registered-permission test now pins all
15 guarded budget actions; the AST census snapshot itself did not change:
**409 actions = 302 guarded + 107 reasoned exceptions**. This is not runtime
negative evidence for every other store action or entity authorization.

### DEC-040 — closed-period budget chokepoints (`ba46f0e9`)

Failing-first: **14 failed / 5 passed**. The old guards checked only an
existing line and missed destination periods, bulk replacement and header
fiscal-year reassignment/deletion. Guarded writes now inspect both old/new
period identities and both current/proposed header context before mutation.
A linked closed line conservatively freezes generic header changes. Duplicate
replay IDs fail closed instead of being collapsed into a Map.

Final closed-write suite: **21/21 passed**, including two additional month-only
and owner-reassignment cases, atomic mixed batches, insertion/edit/deletion,
undo/redo, fiscal-year remapping, duplicates, allowed identical replacement,
open-period edits and the existing system freeze-marker-only path.

```bash
./node_modules/.bin/vitest run src/store/budgetStore.closedWrites.test.ts src/store/budgetStore.authorization.test.ts src/store/budgetStore.test.ts src/store/budgetStore.lifecycle.test.ts src/store/periodCloseStore.test.ts src/store/rbacNegativeAuthorization.test.ts src/store/rbacMatrixCompleteness.test.ts
```

**7 files / 353 tests passed**. No auto-reopen, reasonless override, migration
or per-entity exemption was introduced. O9 remains unknown.

### DEC-041 — edit provenance and collision-safe identity (`ea249754`)

An Immer draft alias meant `lastChange.oldValue` read the newly assigned amount.
New/copy creator identity was constant or inherited. Same injected-clock IDs
could collide; existing ambiguous IDs selected the first match.

The old amount is now captured before mutation. New/copy records use the
current authenticated creator ID/name and one injected instant. Deterministic
collision ordinals reserve IDs from headers, current lines and replay images;
they introduce no randomness. Ambiguous legacy header/line identities fail
closed; neither history nor actors are guessed, migrated or rewritten.

Failing-first provenance suite: **12 failed / 1 passed**; additional ambiguous
line regression: **1 failed / 13 passed**. Final: **14/14 passed**. Exact
zero/negative/decimal before-after amounts, metadata-only edits, authenticated
creator, unchanged historical source, same-clock collisions and orphan/history
reference preservation are asserted.

```bash
./node_modules/.bin/vitest run src/store/budgetStore.provenance.test.ts src/store/budgetStore.closedWrites.test.ts src/store/budgetStore.authorization.test.ts src/store/budgetStore.test.ts src/store/budgetStore.lifecycle.test.ts src/store/periodCloseStore.test.ts src/store/rbacNegativeAuthorization.test.ts src/store/rbacMatrixCompleteness.test.ts
```

**8 files / 367 tests passed**, repeated successfully after the runner upgrade.
These are producer metadata guarantees, not a new canonical audit chain or
ledger rollback. No amount calculation or amount type was migrated.

### Isolated dependency remediation (`3384c17e`)

```bash
npm update vitest @vitest/coverage-v8 @vitest/ui js-yaml source-map-js undici --package-lock-only --ignore-scripts
npm ci --ignore-scripts
npm run prepare
npm audit --json
npm audit --omit=dev --json
```

**14 existing versions updated, zero package paths added or removed, root
package metadata/ranges unchanged.** Vitest family 4.1.7 → 4.1.12; compatible
Chai 6.2.2 → 6.3.0; js-yaml 4.3.1 → 4.3.2; source-map-js 1.2.1 → 1.2.2;
undici 7.29.0 → 7.30.1. No new direct dependency or broad audit-fix command.

Full-root audit **5 → 0** affected packages; production-only audit **0**.
Changed lockfile licenses are MIT except source-map-js BSD-3-Clause.
`npm run license:check` exits zero but reports UNKNOWN top-level metadata;
that best-effort script is **not global license certification**. Its fail-open
metadata handling remains a release-readiness gap, not legal approval.
Install deprecation warnings remain; zero advisories is not absence of all
security or maintenance risk, and this audit does not cover the separate server
lockfile or native dependencies.

### Existing submission caller follow-up (`c123de46`)

Both existing budget pages ignored async submission rejection; the detail page
also let synchronous denial escape its event handler. Failing-first UI filter:
**3 failed**, plus an uncaught synchronous event error; 18 unrelated tests were
filtered out, not newly skipped. Both callers now show shared ErrorState;
list Retry repeats the failed action, and failures do not mutate budget data.
Existing approval-denial fixtures now pin DEC-039's approval permission.

```bash
./node_modules/.bin/vitest run src/pages/budgets/BudgetListPage.test.tsx src/pages/budgets/BudgetListPage.deep.test.tsx src/pages/budgets/BudgetListPage.a11y.test.tsx src/pages/budgets/BudgetDetailPage.test.tsx src/pages/budgets/BudgetDetailPage.a11y.test.tsx src/pages/budgets/BudgetDetailPage.grid.test.tsx src/pages/budgets/BudgetDetailPage.money.test.ts src/store/budgetStore.authorization.test.ts
```

Unfiltered impact run: **8 files / 138 passed**. A prior final-check/build pair
was stopped for this caller review; neither interrupted run is counted as
completed verification. Final processes were restarted after the source fix.

### Repeatable mutation proof (`9cb6fc69`)

```bash
node scripts/verify-budget-guard-mutation.mjs
```

**Normal 5/5 pass; guard-removal mutant 4 named denial failures / 1 Admin pass;
checked-out source unchanged.** A test-only Vite transform removes only the
updateBudget guard; temporary files are cleaned. The script checks exact failed
witness names and the successful Admin case, and fails if the mutant survives.
No production source is edited and no gate is weakened. Other tests are filtered
for this experiment, not skipped in the full suite.

## 3. Final changed-tree gates

`npm run check` exited zero: **8/8 shards, 1,398 files, 16,248 passed + 1
existing skipped = 16,249 total; sharded component 1,057 seconds**. This includes
tsc, full lint, source formatting, docs/engine verification, money AST,
determinism, palette and fabrication checks. No application source changed
after that run started. Later edits are the standalone mutation-proof script
and documentation, verified separately.

| Shard     | Files passed | Tests passed | Existing skipped |
| --------- | ------------ | ------------ | ---------------- |
| 1         | 175          | 1,901        | 0                |
| 2         | 175          | 1,572        | 0                |
| 3         | 175          | 2,076        | 0                |
| 4         | 175          | 2,314        | 0                |
| 5         | 175          | 2,065        | 0                |
| 6         | 175          | 2,052        | 0                |
| 7         | 174          | 2,345        | 0                |
| 8         | 174          | 1,923        | 1                |
| **Total** | **1,398**    | **16,248**   | **1**            |

Completed production build and `node scripts/bundle-check.js`:
**6,815.88 KB raw / 2,060.77 KB gzip vs unchanged 2,080 KB**, one size warning;
critical path **425.06 KB gzip**, main **69.74 KB gzip**. Bundle growth is
measured and within the existing ceiling; **N7 structural reduction is not done**.
Adoption remains **305/1,017 (29.99%), zero raw sites**. No baseline JSON or CI workflow file was modified. No route, engine, store or
connector was added, and no namespace or persisted schema changed.

Closing `npm run docs:verify`, `npm run docs:links`, `npm run routemap:check`,
`npm run repo:hygiene` and `git diff --check` passed. Strict links report zero
broken links/citations.

Additional closing checks: `npm run architecture:guardrails` passed its shallow
source-presence/keyword checks; it does not prove a cycle-free graph. Fresh
`node scripts/verify-readme-stats.mjs` reports 180 engines (98 shipped / 82
orphan), 48 stores and 5 workers; `node scripts/persistence-map-check.mjs`
confirms 43 persisted stores / 43 registered. The handbooks no longer present
stale directory counts, universal version-one migrations, the obsolete GL
no-close-guard assertion, or the superseded 2048 KB bundle target as live facts.
Inventory now points at measured canonical sources; actual gate limits were
not changed. This is not an exhaustive semantic audit of all handbook prose.

## 4. Open work and owner boundary

- **N2/N3 remain active.** Budget evidence does not certify every other writer,
  the client trust boundary, native durability, SOX or server authority.
- **107 mapped / 93 source-owed sections (108–200)** remain. No titles invented.
  Exact owner source/version and real D365 samples/control totals remain owed.
- Q6 server fate, O4 SOX authority, O9 grants, O3 key custody/recovery, O5
  sector/jurisdiction certification and O7 native proof are not inferred.
- N4/N6/Q1 have no new adapter/sector/connector certification. N8 measured
  adoption holds; 100% supported-module adoption is not established.
- Main CI remains unverifiable, not green; no merge or release is authorized.
- The existing batched [owner packet](../discovery/OWNER_DECISION_PACKET.md)
  remains the request. Broad instruction to continue is not a response to its
  Tier-C data, authority, custody or certification questions.
- Caller follow-up: non-submission budget detail handlers have not been
  comprehensively verified for synchronous/async error-channel behavior. The
  submission ErrorState evidence is not an all-actions or all-product claim.
- Foundation follow-up: fail-closed installed-package license metadata checks
  with failing-first fixtures; UNKNOWN currently does not block the script.
- Next N3 trust slice: populated full-state denial and mutation evidence for
  forecast financial writers, starting `forecastStore.updateForecast`; do not
  infer entity grants or supported forecasting behavior from guard tests.

**Known-work complete: NO.** N-register remains **2/8 DONE**, for the original
bounded N1/N5 slices only; no total semantic-task denominator is established.
**Programme complete: NO.** Real-owner two-month parallel-run, supported-scope
certification, native/fresh-install/upgrade/recovery and CI proofs remain owed.
No zero-flaw or analyst-replacement claim follows from these results.

## 5. Commit/push boundary

Application evidence commits: `687dbc92` (DEC-039), `ba46f0e9` (DEC-040),
`ea249754` (DEC-041), `3384c17e` (dependency patches), `c123de46` (submission
callers), `9cb6fc69` (repeatable guard-removal proof), with installed tracker
commits between them. This closing record reconciles the taskboard, handover
and the observed handbook contradictions. No DEC-042 was needed: the caller
and proof changes implement existing DEC-039 without new grants, persisted
disposition, scope or gate semantics. Next available decision is DEC-042.

Push and installed pre-push outcome will be recorded on existing PR #82 once
completed; this document does not pre-claim success. No merge/release is
requested or performed.
