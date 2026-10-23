# Handover — current continuation and historical session records

## 2026-10-23 (n) — budgets + gl-upload GOVERNED as 9th and 10th routes, SUPPORTED 27, missing-is-not-zero hard gate (PR #92-93)

**The claim.** `/budgets` and `/data/gl-upload` are CONNECTED and GOVERNED as 9th and 10th SUPPORTED routes. Budgets already had journey/empty/error/loading (list+filter, No Budgets Yet, submission failure with Retry, h1 over skeleton). Fixed `totalAmount ||0` → `totalAmount` to make missing-is-not-zero hard gate green 0. GLUpload already had journey/empty/error/loading (initial CTA, unsupported ext error, parsing skeleton, parses CSV). Added GOVERNED claims 56→60 for budgets and gl-upload (budget:read/import:create, audit, write-guard, O9). Register SUPPORTED 27 (10 routes + 17 caps), spine 10/36, governance 10/30, one-stop 10 routes, missingIsNotZero 0, matrix 1303 lines current, docs:verify green.

**Next.** Continue SUPPORTED expansion to 11th route (`/scenarios` or `/forecasts`), re-run test:sharded 8/8, update README tally if moved.

## 2026-10-23 (l) — gl-journals GOVERNED as 8th route, SUPPORTED 25 (PR #91)

**The claim.** `/data/gl-journals` is CONNECTED and GOVERNED as 8th SUPPORTED route. Already had journey/empty/error/loading evidenced in `GLJournalsPage.test.tsx` (content state, EmptyState with import CTA, ErrorState with retry, aria-busy). Added GOVERNED claims 52/52 for gl-journals (gl:read, audit, write-guard, O9). Register SUPPORTED 25 (8 routes + 17 caps), spine 8/28, governance 8/24, one-stop 8 routes, missingIsNotZero 0, matrix 1303 lines current.

**Next.** Continue SUPPORTED expansion to 9th route (`/data/gl-reporting` or `/budgets`), re-run test:sharded 8/8, update README tally if moved.

## 2026-10-23 (k) — gl-explorer GOVERNED as 7th route, docs:verify wiring for one-stop and missing-is-not-zero (PR #90)

**The claim.** `/data/gl-explorer` is CONNECTED and GOVERNED as 7th SUPPORTED route. It renders counts, money totals, rows and provenance from real store, shows empty state when store empty, shows ErrorState when importError set, and has no async skeleton (loading na). GOVERNED claims: gl:read allows viewing, audit trail records derivation, write guard blocks closed periods, O9 boundary stated. One-stop acceptance and missing-is-not-zero now wired into `docs:verify` (PR #90/#91 coding priority).

**The join.** `spine-evidence.json` 7 routes (24 claims), `governance-evidence.json` 7 routes (21 claims), `spineGovernance.test.ts` 48/48 (was 44), `GLExplorerPage.interop.test.tsx` adds `K30 error state: states the failed import instead of rendering the stale ledger`. `completion-register.json` SUPPORTED 24 (7 routes + 17 caps), matrix 1303 lines current, `oneStop:acceptance` green 7 routes, `missingIsNotZero:acceptance` green 0. `package.json` docs:verify now includes `verify-one-stop-acceptance.mjs` and `verify-missing-is-not-zero.mjs`. Ratchet docs fix 47→48 via DEC-065.

**Measured.** `docs:verify` green: register 695 SUPPORTED 24, spine 7/24, governance 7/21, matrix current, route dispositions 47 decided, one-stop 7, missingIsNotZero 0, ratchet docs 9 values match. `tsc` PASS, `eslint` PASS, `prettier` PASS for edited files, `docs:links --strict` PASS 0 broken. `GLExplorerPage.interop` 5/5 + `spineGovernance` 48/48 PASS.

**Next.** Re-run `test:sharded` 8/8 to refresh full suite tally (expected ~16515), then continue PR #91+ SUPPORTED expansion, update README if tally moved.

## 2026-10-23 (j) — corrections tracker GOVERNED as 6th route, one-stop in-app path evidenced (PR #89 extension, DEC-064)

**The claim.** /data/corrections implements DEC-035 in-app correction lifecycle REQUESTED→APPLIED→RE-VERIFIED human-only with append-only actor/time audit trail (FR-010). Excel export is optional interoperability, not a prerequisite — first step toward C2 one-stop acceptance (PR #90).

**The join.** Added to `spine-evidence.json` 6th route with journey/empty/error/loading-na from `CorrectionsPage.test.tsx` (7 tests, including new error alert test) and to `governance-evidence.json` 6th route with authorization exception:dispose, audit trail, write-guard human-only transitions from `spineGovernance.test.ts` 44 tests (was 40, added 4). Verification gates `spine:evidence` + `governance:evidence` resolve file+title, fail on rename/self-reference/unknown cap, RBAC 409=302+107 pinned, O9 stated.

**Measured.** **6 of 231 routes CONNECTED (21 claims) and GOVERNED (18 claims), 17 capabilities GOVERNED (18 claims), 23 rows SUPPORTED** (6 routes + 17 caps). Register 695 rows SUPPORTED 23 EXPERIMENTAL 445 BLOCKED 7 NOT_BUILT 220. Matrix 1303 lines, 6 routes GOVERNED — 1. Suite pending re-run for 5 new tests (expected 16,514 passed).

**Next.** Re-run `test:sharded` 8/8 to refresh README tally (currently 16,509), then PR #90 one-stop acceptance census script.

## 2026-10-23 (i) — the spine is GOVERNED on evidence, and the count is 5 of 231 GOVERNED, 22 SUPPORTED (PR #89)

**The claim.** GOVERNED means authorization, audit, write-guards and lifecycle are enforced — proven by RBAC tests, audit-chain verification, and period-close guards. Entity-scope authorization is explicitly BLOCKED-ON-OWNER O9 and must not be inferred from active entity. SOX authority O4, server authority Q6, and native durability O7 remain open and are stated as boundaries.

**The join.** `docs/plan/governance-evidence.json`: per claim, a file and the exact test title inside it, plus explicit O9 boundary objects for entity-scope. `scripts/verify-governance-evidence.mjs` (`npm run governance:evidence`) fails when the file is gone, the title is not in it, the claim points at the page it grades, the route/capability is not real, or the RBAC census does not pin 409=302+107. The register carries both CONNECTED and GOVERNED claims and re-checks them, and the matrix prints `GOVERNED — N test ids` only for those routes. **Measured: 5 of 231 routes GOVERNED, 17 capabilities GOVERNED, 22 rows SUPPORTED** (first SUPPORTED rows, CONNECTED+GOVERNED). Seven rows stay BLOCKED-ON-OWNER (O1×3, O2, O3, O4, O9) — the correct answer, not a defect.

**Product work this needed.** New test file `src/__tests__/spineGovernance.test.ts` with 40 tests proving: import:create guards import path, audit trail records provenance with hash linkage, write guard blocks closed periods, Viewer can read trial balance, period:close guards close transitions, exception:dispose guards disposition, report:read allows board-pack viewing, audit trail ties out to ledger figures, and the census closures. Existing tests already proved: negative authorization for importGLData without user, Viewer cannot close, disposition follows audited legal path REQUESTED→APPLIED→REVERIFIED, control totals tie out, etc. All titles are referenced verbatim in governance-evidence.json.

**N2/N3 bounded closure.** N2 audit-chain: auditTrailStore is single canonical client authority (DEC-025); 10 chain-like modules classified in `auditChainCensus.test.ts` with disposition, persistence flag, authority boundary and decision reference; bounded persistence evidence via masterStorage and sqlJsStorage hydration tests, but no native Tauri persistence, no application-process restart proof (O7 open), no server authority (Q6 open), no SOX authority (O4 open). N3 RBAC: 409 actions = 302 guarded + 107 exceptions, every enforced permission granted to at least one role, Admin holds full catalogue, Viewer read-only; payload-source authentication not claimed (GDPR bridge bounded exceptions disclaim it), entity-scope O9 blocked. Both closed as DONE (bounded) in `docs/TASKBOARD.md` with residual boundaries stated.

**Suite measured after the change.** `npm run test:sharded` **8/8 shards, exit 0, 980 s, 1,420 files, 16,509 passed + 1 skipped** (1921+1653+2115+2350+2063+2088+2342+1977). `npm run docs:verify` green: register 695 rows (SUPPORTED 22 · EXPERIMENTAL 446 · BLOCKED-ON-OWNER 7 · RETIRED 0 · NOT_BUILT 220), spine evidence 5 routes (18 claims) + governance evidence 5 routes (15 claims) · 17 caps (18 claims) · 2 census claims, capability matrix current, route dispositions 0 REVIEW. README updated to 16,509 tally.

**Next.** PR #90 one-stop acceptance: in-app correction path sufficient, Excel optional, D365 intake in-app, DEC-018 revision, `oneStop:acceptance` census.


## 2026-10-23 (h) — the spine is CONNECTED on evidence, and the count is 5 of 231 (PR #88)

**The claim.** A synthetic D365-shaped file goes in, control totals tie, quarantine
is named, the trial balance balances, a close cannot be bypassed, an exception rule
produces a finding, a disposition follows one audited path, and the board pack ties
back to the screen. All of that was already in the suite — spread across page
tests, import tests and engine tests — but nothing joined a claim to the test that
proves it, so "CONNECTED" would have been an opinion in a table.

**The join.** `docs/plan/spine-evidence.json`: per claim, a file and the exact test
title inside it. `scripts/verify-spine-evidence.mjs` (`npm run spine:evidence`)
fails when the file is gone, the title is not in it, the claim points at the page
it grades, the page has a loading branch but excuses itself from the loading state,
or the route/capability is not real. The register carries the same claims on the
capability row and re-checks them, and the matrix prints `CONNECTED — N test ids`
only for those routes. **Measured: 5 of 231 routes CONNECTED, 17 capabilities with
claims, 0 GOVERNED.**

**Product work this needed.** The four-state claim was not true for two spine pages:
`GLTrialBalancePage` and `ExceptionQueuePage` rendered the last good ledger after a
failed import, so a failed import read as a clean ledger. Both now render the K30
error state with the failing import's message and a route to the import surface.
The shell's stale state got an explicit test (`FinancialStatusBadge`) instead of
relying on an `it.each` that only proved the badge was non-empty.

**What the number means.** Five screens and seventeen capabilities is the honest
size of what the suite proves end-to-end. Everything else stays EXPERIMENTAL or
NOT_BUILT in the register — 0 rows are SUPPORTED, because SUPPORTED needs GOVERNED
too and that is #89.

**Suite measured after the change.** `npm run test:sharded` on 2026-10-23:
**8/8 shards, exit 0, 1,200 s, 1,419 files, 16,469 passed + 1 skipped** (shards
147/149/144/141/144/179/148/149 s) — 17 more tests than the 1,418-file run, which
are this PR's evidence-gate tests plus the new page and shell states.

**Next.** PR #89 (spine GOVERNED evidence + N2/N3): authorization, audit, entity
scope and write guards for the same spine, with the two active N-items closed or
bounded in writing.

## 2026-10-23 (g) — the 47 undecided routes are decided, and REVIEW no longer rests (PR #87)

**The question was the defect.** The capability matrix classifies a route from its
path prefix; 47 of 231 matched nothing and carried `REVIEW — disposition required`
in every report since. That is not a status, it is a question addressed to nobody.
PR #87 answers all 47 in `docs/product/route-dispositions.json`, and the matrix
generator now reads that table instead of guessing.

**The decisions, measured:** **38 MIGRATE · 7 EXPERIMENTAL · 2 RETAIN · 0 RETIRED
· 0 REVIEW**. Seventeen are one-line `<Navigate>` aliases, each naming the target
the router actually uses (`/period-close/*` → `/periods/close`, `/sox` →
`/audit/sox`, `/backup` → `/settings/backup`, …). Nine are the data-control spine
(`/data*`). Nine are close/modeling/reporting pages (`/lease*`, `/revenue*`,
`/tax*`, `/accounting*`, `/capex*`, `/board-pack`). Three treasury and three ESG
screens stay EXPERIMENTAL with the gap named — no methodology, no reporting
standard, no jurisdiction tier (O5). `CapexTracker` stays EXPERIMENTAL because it
is the one page in the set with no colocated test. `/visual/atlas` (dev-only, out
of nav) and the `*` 404 catch-all are RETAINed as shell surfaces. Nothing was
retired: DEC-006 still forbids shrinking the denominator.

**Two taxonomy notes.** The matrix gained `Treasury` and `ESG` pillar names,
because a vocabulary that cannot name an existing surface is what produced
`Unclassified`. And `docs/CAPABILITY_TRUTH_MATRIX.md` was prettier-padded while
the generator emits unpadded rows, so `npm run capability:inventory` could never
reproduce the committed file; it is now generated verbatim and `.prettierignore`d,
the same rule as [`docs/product/ROUTE_MAP.md`](product/ROUTE_MAP.md). That is the large reformatting diff in this PR —
the 47 decisions are inside it.

**The gate.** `scripts/verify-route-dispositions.mjs` (10 tests in
`src/__tests__/routeDispositions.test.ts`) fails on: a decision for a route that
does not exist, a blank field, a disposition outside the vocabulary, an alias
decision naming a target the router does not redirect to, a matrix row still
`REVIEW`, and a matrix row that disagrees with the decision. The completion
register additionally fails `--check` on any `REVIEW` route row — so a new route
cannot enter the tree undecided. `routes:dispositions` runs inside `docs:verify`.

**Suite measured after the change.** `npm run test:sharded` on 2026-10-23:
**8/8 shards, exit 0, 959 s, 1,418 files, 16,452 passed + 1 skipped** (shards
122/119/115/113/115/141/115/119 s) — 10 more tests than the 1,417-file run, which
are this PR's disposition tests. README quotes this run.

**Next.** PR #88 (spine CONNECTED evidence): a synthetic D365-shaped file in,
control totals tied, quarantine named, trial balance balanced, close not
bypassable, one exception rule producing a finding.

## 2026-10-23 (f) — the completion register exists, and nothing seeds as SUPPORTED (PR #86)

**What this PR added.** `scripts/completion-register.mjs` is the census → seed →
validate → render gate for the whole programme. It measures the tree (231 routes
from `src/App.tsx`, 180 engine modules, 19 requirements from the discovery
register, 200 annex sections from the coverage-scope JSON, 65 named capabilities
across the vision's 11 domains), seeds `docs/plan/completion-register.json`, and
renders `docs/plan/COMPLETION_REGISTER.md` from it. `--check` fails when the census
and the rows disagree in either direction, when a status is blank or outside the
closed vocabulary, when evidence does not resolve, or when the rendered view is
stale; `--release` refuses while any row is not `SUPPORTED` or `RETIRED`.
`--check` is wired into `npm run docs:verify`.

**The honest starting position, measured not asserted:** 695 rows —
**SUPPORTED 0 · EXPERIMENTAL 468 · BLOCKED-ON-OWNER 7 · RETIRED 0 · NOT_BUILT 220**.
The seven owner-blocked rows name O1, O2, O3, O4 and O9 with the exact question
from the taskboard's OWNER table. `cap:ai.no-egress` is `NOT_BUILT` rather than
"experimental" because DEC-022 is a policy, not a tested control.

**Disposition is imported, not typed (DEC-060).** `docs/CAPABILITY_TRUTH_MATRIX.md`
is parsed on every seed — the first attempt printed no tally because `--seed` kept
existing rows verbatim, so a matrix edit would have left a stale grade. Now
`103 MIGRATE / 77 EXPERIMENTAL / 47 REVIEW / 4 RETAIN` reconcile with the 47
empty-pillar routes, and a `REVIEW` row may never be `SUPPORTED`; an unknown
disposition fails the gate. PR #87's worklist is those 47.

**Tests and gates.** `src/__tests__/completionRegister.test.ts` — 11 tests over a
tmpdir fixture built through `--root=`, written before the script (they failed
first). `docs:verify`, `docs:links -- --strict`, `tsc --noEmit`,
`eslint … --max-warnings 0` and `prettier --check "src/**"` all exit 0. The
generated register and its JSON are in `.prettierignore` for the same reason as
`docs/product/ROUTE_MAP.md`: the drift check compares the rendered file verbatim,
and Prettier's table padding would make it permanently stale.

**The suite was measured for this tree, not inherited.** `npm run test:sharded`
on 2026-10-23: **8/8 shards passed in 1,467 s — 1,417 files, 16,442 passed + 1
skipped, exit 0** (shards 325/309/226/113/113/143/118/120 s), which is 11 more
tests than the 1,416-file run because this PR adds them. The single-process
`npm test` is still not a recorded figure here: it dies part-way with
`Worker is not defined`. README now quotes this run.

**Next.** PR #87 (route disposition sweep: 47 `REVIEW` → 0), then #88 (spine
`CONNECTED` evidence). Nothing in this register may be upgraded without a
resolving test id, a gate line and a doc link.

## 2026-10-22 (e) — the working methods are now a gate-checked library (DEC-059)

**What this session added.** `docs/agent/skills/` is now a library of 50 methods,
not a folder of tips: 13 discipline skills (brainstorming, plans, TDD, systematic
debugging, verification before completion, review in both directions, finishing a
branch, onboarding, sourcing, bulk refactors, local preview), 8 finance skills
(money, domain modelling, import, tie-out, close, lineage, no invented data,
determinism), 13 engineering skills, 7 product/UI skills, 3 meta skills and the
owner's 6-skill Ponytail set. Each has frontmatter and a "use it when" line; the
index is generated.

**Why a gate and not a page.** A library nobody indexes is a folder nobody reads,
which is the same drift `verify-readme-stats.mjs` exists to stop. So
`scripts/skills-index.mjs` (with `--check`) fails on missing frontmatter, a name
that does not match the file, an unknown group, an index row with no file, or a
stale index; `src/__tests__/skillsIndex.test.ts` pins all five with seven tests and
tmp fixtures, including the exit-2 "could not verify" path. `npm run skills:index`
rebuilds the index; `npm run skills:verify` is the gate (also listed in
`docs/agent/05_COMMANDS_AND_GATES.md`).

**Provenance.** The discipline group is adapted from obra/superpowers (MIT) — the
methods are kept, the words are rewritten for this repo; `frontend-design` and
`skill-authoring` acknowledge anthropics/skills; the rest are original, derived
from this repository's own incidents (the money traps, the quarantine design, the
ratchet culture). The owner's Ponytail files are reproduced verbatim except two
backticked filenames, which are unbackticked because the docs-link gate resolves
backticked names as real paths.

**Two documentation defects fixed on the way, both measured.** (1) The plan quoted
"180 engines, 180 reachable" while the README quoted "98 shipped / 82 orphan" and
both gates passed — they measure different questions. Plan §2.3 now states both,
names the scripts, and forbids a SUPPORTED claim on manifest registration alone.
(2) The README's test-file claim was three files stale after the last recorded run;
it now reads 1,416 with the 16,410 tally explicitly dated to the 1,412-file run.

**The suite was then measured, not assumed.** The single-process run dies in this
sandbox with an uncaught `Worker` exit after ~1,170 files, so the run that counts
is `npm run test:sharded`: **8/8 shards passed in 2,170 s — 1,416 files, 16,431
passed + 1 skipped (exit 0)**, which is 21 more tests than the previous recorded
run and matches the discovery count `docs:verify` asserts. The README now quotes
that run and its date. CI remains unverifiable (Actions HTTP 403).

**Also fixed by the pre-push gate, not by reading.** The README claimed "91 of 267
engine/store modules import money.ts" while the gate measured 92 importers over 262
modules; both numbers were stale. The claim is corrected and the gate now checks
the denominator as well as the numerator, because an adoption count over an
unmeasured base is a ratio nobody can reproduce.

**Next.** Commit and push this documentation + tooling unit, refresh the PR #85
body with `gh api -X PATCH` (`gh pr edit` silently fails here), then start PR #86
(the completion register). PR #85 still has no merge authorisation.

## 2026-10-22 (d) — the remainder is now programmed: PR #85 → PR #100 (DEC-058)

**Read this first.** The session that ends here is PR #85 (Q5 stage 4, open, no
merge authorisation). The programme to completion is
[`docs/plan/COMPLETION_PLAN_86_100.md`](plan/COMPLETION_PLAN_86_100.md):
fifteen PRs, each with a named exit gate, sequenced from a register that cannot
be filled without evidence.

**Why a register and not a checklist.** The vision defines completeness as "every
identified responsibility is either supported to an evidence-backed standard or
explicitly recorded as not yet supported, experimental, blocked or retired by
decision". That is a property of a register. The tree is not short of
capability — 231 routes, 180 reachable engines, 16,410 passing tests — it is
short of **accounting** for it: 47 routes carry a REVIEW disposition with an
empty pillar, 231 of 231 routes are UNVERIFIED for both CONNECTED and GOVERNED,
money adoption is 31.27 %, and 93 annex sections are source-owed.

**The six contract criteria (C1–C6)** in the plan fix now what "done" means at
PR #100, so it cannot be relaxed at the end: closed-vocabulary statuses with
resolving evidence; one-stop acceptance proven by census; money and
missing-is-not-zero invariants on supported surfaces; grades reproduced by tests
not prose; operational fitness (a11y/perf/bundle/determinism/RBAC); and a
published blocked list.

**Next PR: #86 — completion register machinery.** Add
`scripts/completion-register.mjs`, `docs/plan/completion-register.json`,
the generated the generated register view (committed by that PR), and a test that proves
the gate rejects a missing row, an unknown status, a `SUPPORTED` row without
resolving test ids, an `O`-id that is not in the owner table, and a hand-edited
rendered file. Seed statuses from the generators, never from opinion. Do not
start #87 until #86's gate is green — #87's 47 decisions are only trustworthy if
there is a meter that would catch a missing one.

**What the plan refuses to do:** shrink the denominator (DEC-006), promote a
grade in prose, waive the one-stop rule by wording, or claim any of O1–O9's nine
open questions is answered. Each of those is a `BLOCKED-ON-OWNER` row, which the
vision explicitly permits and the register demands.

## 2026-10-22 (c) — Q5 stage 4: the type flip, and the gate that makes it honest (DEC-057)

**What shipped.** `GLEntry.debit`, `credit`, `netChange` and `amount` are
`Money`. The 164-line tie-out fixture converted mechanically, then the compiler
worklist went 136 → 60 → **0** across 65 files: store, consolidation/IC/sector/
NLQ/insurance engines, the three import services, the mock generators, the
analysis DTOs and every page that reads a ledger amount.
`tsc --noEmit` and `eslint src --max-warnings 0` are clean.

**The gate.** Hydration is the only door into the store, so the conversion
happens in `persist.merge`: `partitionLedgerRows` splits the persisted rows, the
representable half is re-encoded through `normalizeGLEntry` → `Money`, and the
unrepresentable half is kept **verbatim** in `quarantinedEntries` — never
rounded, never dropped, never zeroed, and excluded from every `Money` aggregate.
`ledgerScaleAudit()` now reports the load-time quarantine as well as the live
rows. `masterStorage` deliberately stays at `as: 'number'`: 43 persisted stores
share it, and the gate belongs in the one store that adopted `Money`.

**What the compiler did not catch.** `mergeListedEntry` had become
`asMoney(row.debit)`, which throws on an invalid server row. The old contract is
"reject the row, name it, keep converging the rest" (FR-006); the new code
aborted the whole boot hydrate. `crossListedAmount` now hands the raw value back
so `ledgerAmountIssues` names it. The failure surfaced only because the
server-path suite asserts on the _rejection reason_, not on the absence of an
exception.

**Evidence.** `glStore.hydrateGate.test.ts` 6/6 (twin ledger in both shapes;
exact minor units; sub-cent kept as `0.005`; non-finite quarantined; partition
completeness; both halves reported; empty envelope invents nothing),
mutation-verified by removing the crossing (2 fail). glStore + money suites:
**22 files / 302 tests green**. Four pre-flip suites had to be re-stated across
the boundary with `amountFrom`/`moneyToMinor` — the assertions got stronger, not
weaker (the numbers are now exact minor units).

**Follow-up sweep (same day).** The first full run after the flip found 24
failing tests in 11 files. Most were expectations that still spoke numbers; four
were real defects the compiler could not see:

- `CubeEngine.aggregate` read a cell as `typeof v === 'number' ? v : 0`, so a
  `Money` cell aggregated as **0** — DEC-055's trap in a second module;
- `mockData.generateGLEntries` emitted raw floats and `asMoney` refuses
  sub-cent, so the generator **threw**;
- `VersionDiffPage` had dropped its `debit/credit` fallback, so a row without
  `netChange` threw inside `roundTo`;
- `ImportPipeline`'s `parseMoneyCell(a) || a - b` treated a real `0.00` as
  absent and replaced it with the net of the two sides.

**Result.** Full suite: **1,412 files, 16,410 passed + 1 skipped (16,411), 1,170 s.**
`tsc`, `eslint --max-warnings 0`, `docs:verify`, `check-readme-claims` and
`money:ast` (0 unsafe, 100 % safe) are all green.

**The quarantine is now visible.** `src/components/data/LedgerQuarantineNotice.tsx`
reads `quarantinedEntries` and states, on the two pages whose totals are short
by it: how many rows are held back, which fields put them out, that they are
stored exactly as saved (not rounded, not repaired), and the exact reason line
per offending amount (`Entry JE-1: debit 0.005 cannot be represented at 2
decimal places`). `summarizeQuarantinedLedger` is pure, so the copy is tested
without a DOM; 6/6 in `LedgerQuarantineNotice.test.tsx`. Mounted on **GL
Explorer** (debit/credit totals) and **Trial Balance** (the balance verdict).

**Not claimed.** Stage 5 (engines) and stage 6 (pages/display adapter) are open,
the notice covers the two GL aggregate pages but not every derived view, and CI
remains unverifiable from this sandbox (Actions returns 403) — the green result
above is a local run.

## 2026-10-22 (b) — Q5 stage 4: the trap sweep, beyond the GL store (DEC-056)

**What I set out to do.** Start the stage-4 type flip. Converted the one huge
fixture mentally and re-measured: **300 errors → 164 are
`syntheticTieOutLedger.ts`** (mechanical, exact), leaving **136 across 65
files**. Then I stopped, because DEC-055's lesson is that the compiler's
worklist is not the risk list.

**What the grep for the _shape_ of the trap found.** Four more sites, none of
them a type error, all with `unknown` parameters:

| Site                                               | Read as                        | After the flip                                                                 |
| -------------------------------------------------- | ------------------------------ | ------------------------------------------------------------------------------ |
| `hasDebitCredit`, **duplicated in 14 page models** | `Number(value) === 0`          | zero debit/credit stops reading as zero → **amount-only rows valued at 0 − 0** |
| `validateGLEntry`                                  | `isFiniteNumber(e.debit)`      | **every** entry reported "debit must be a finite number"                       |
| cube migrator                                      | `Number(entry.debit ?? 0)`     | `NaN` written into the GL cube                                                 |
| onboarding importer                                | `typeof d.amount === 'number'` | **already** zeroes a STRING amount today                                       |

The 14-copy helper matters because `Number({ minor: 0 })` is `NaN` and
`NaN === 0` is false — so `hasDebitCredit` would answer "this row carries
debit/credit" for a row that carries only `amount`, and the dashboard, cash
forecast, credit risk, sector KPIs, forecasts, scenarios, real estate,
insurance, construction and analytics would all quietly drop that money.

**Shipped.** `src/utils/glRowMoney.ts` — `isZeroAmount`, `signedAmountOf`,
`rowCarriesDebitCredit`, all written against `unknown` so they are correct
before and after the flip. The 14 copies are deleted in favour of one
implementation. `validateGLEntry` admits `Money` on the same terms as a number.
The migrator writes through `signedAmountOf(...) ?? 0`. The importer reads
numeric strings (`"1,234.56"`, `"$(2,500.50)"`), which it **did not before** — a
live money-loss defect, independent of Q5.

**Evidence.** `glRowMoney.test.ts` 16/16 · `dashboardModel.test.ts` +5 (same
ledger in both shapes → identical KPIs, trend, sector KPIs; the amount-only
revenue and expense rows survive) · `validation.test.ts` +3 (a `Money` entry
validates identically to its number twin). Gates: tsc 0, eslint 0, prettier
clean, docs:verify 9/9, full suite green.

**The finding worth carrying.** Mutation (`Number(value) === 0` restored for the
`Money` case) failed the 3 unit tests and **not one of the 72 existing
page-model test files** — the models had no test that could see a `Money` row at
all. That is why the dashboard twin test exists; it now fails 5 under the same
mutation. Every remaining stage-4 area needs a twin test of this kind, not just
a compile.

**Still not done.** The `GLEntry` type flip. Worklist after the fixture converts:
136 errors / 65 files — `ConsolidationEngine` (16), `glStore` (11, wire shape:
`GlJournalLine` stays in major units, so `moneyToAmount` is the crossing and
`mergeListedEntry`/`listedToGLEntry` must `asMoney` server numbers), then
`parseGLRows`/`d365Parser`/`ImportPipeline` (4 each) and 40+ pages at 1–3 each.
The partition is not yet the hydrate gate; no page renders the quarantine. The
onboarding importer's wiring is covered only indirectly (through
`signedAmountOf`), not by a component test.

## 2026-10-22 — Q5 stage 4 preparation: a `Money` read as a number is invisible to the compiler (DEC-055)

**What I was doing.** Starting stage 4 (the `GLEntry` type flip) and reading the
store's numeric reads before flipping. Both happened; the second stopped the
first, correctly.

**Measured, by converting and reverting again.** Under a flipped
`GLEntry.debit/credit/netChange/amount`: **300 errors → 164 are the single
fixture `syntheticTieOutLedger.ts`**, which converts mechanically and exactly
(164 literal lines rewritten as `{ minor }` by decimal-string shift, verified
`Decimal(minor) === literal × 100`, zero float multiplication) — leaving **136
errors across 65 files**. The compiler part of stage 4 is therefore smaller than
the 133 first reported (that count was taken before the fixture was converted).

**What the compiler cannot see, and why stage 4 did not proceed.** The store's
money reads went through `toFiniteNumber(value: unknown, fallback = 0)`, which
returns the FALLBACK for anything that is not a number — and a `Money` is an
object. A green flip would have shipped: every row normalized to
`0/0/0/0` (`normalizeGLEntry`), every account aggregated as `{ minor: 0 }`
(`generateTrialBalance`), every journal reported balanced at `0 = 0`
(`validateEntries`), and — the other direction — **every** `Money` write refused
by `ledgerAmountIssue` as "must be a finite number". Four silent failures, no
type error, because all four parameters are `unknown`.

**Shipped instead (DEC-055).** `amountFrom(value, fallback = 0)` in
`src/utils/money.ts`: `Money` → exact whole-unit number via `moneyToAmount`,
finite number → unchanged, everything else → fallback, never throws. All 12
money-intent reads in `glStore.ts` switched; `toFiniteNumber` **deleted** so the
tolerant helper cannot be reached for again; `ledgerAmountIssue` admits a `Money`
on the same terms as a number (sign rule re-applied, non-safe-integer `minor`
named explicitly).

**Evidence.** `src/store/glStore.moneyShape.test.ts` **17/17**. Mutation-verified
twice: restoring the tolerant read fails **5**; deleting the `Money` admission
branch fails **8**. `store/ + utils/money + ledgerHydration + FXEngine` =
**86 files / 1,438 tests** green. Gates: `tsc` 0, eslint 0, prettier clean,
`docs:verify` 9/9, links 0 broken, hygiene clean, full suite re-run before push.

**Found while mutating — keep this.** The assertion "the double-entry gate
accepts a balanced `Money` journal" **passes under the zeroing mutation**,
because `0 = 0` balances. Acceptance tests cannot detect zeroing. The
value-sensitive partner (an unbalanced journal must FAIL) is what catches it.
Apply the same rule to every stage-4 area: assert a value that can only come from
the real amount.

**Still not done.** The `GLEntry` type flip itself. Its worklist after the
fixture is 136 errors / 65 files; the biggest are `ConsolidationEngine` (16),
`glStore` (11, mostly wire-shape: `GlJournalLine` stays in major units, so the
boundary crossing is `moneyToAmount`, and `mergeListedEntry`/`listedToGLEntry`
must `asMoney` server numbers), then `parseGLRows`/`d365Parser`/`ImportPipeline`
(4 each) and 40+ pages with 1–3 each (engine parameter shapes typed
`readonly { debit: number }[]`). No page renders the quarantine yet.

## 2026-10-21 (continued) — Q5 stage 4 precondition: quarantine, don't round (DEC-054)

**Measured before deciding.** Changing `GLEntry.debit/credit/netChange/amount` to
`Money` produces **300 type errors across 67 files** — but **164 are one test
fixture** and only **133 are product code in 65 files**; **285 of 300 are plain
construction/argument errors**, just 11 are comparisons. The earlier "151 files /
1,040 reads" grep overestimated by ~2× because the money helpers already accept
`MoneyInput`. So stage 4 is a mechanical, area-by-area change with `tsc` as the
worklist — not an unverifiable sweep.

**Why the type change still cannot go first.** `masterStorage` hydrates with
`decodeMoneyGraph(..., { as: 'number' })`. Move the type without moving that and
every hydrated row is _typed_ `Money` while _holding_ a float — a type lie that
`moneyPlus` throws on at the first render. The decode path is the gate.

**The policy (shipped).** `src/utils/ledgerHydration.ts`: `classifyLedgerRow`
reports every offending money field with its exact canonical value and a reason
(`sub-cent` / `non-finite` / `unparseable`); `partitionLedgerRows` splits rows
into `representable` and `quarantined`, with
`representable.length + quarantined.length === rows.length`, order preserved, and
nothing coerced. Row-level, not cell-level — an entry whose debit cannot be
represented has no meaningful net.

Rejected: rounding on load (discards money, FR-006) and failing the whole load
(one legacy row stops the ledger opening).

**Applied at the only boundary that exists today** — the derived view.
`generateTrialBalance` / `analyzeAccount` now name the rows
(`"… — Entry e-1: debit 0.004 cannot be represented at 2 decimal places"`) and a
pure `glStore.ledgerScaleAudit()` exposes the classification. Entries are never
moved or rounded.

**A behaviour improvement fell out of it:** a `NaN` amount used to be coerced to
0 by `toFiniteNumber`, so the trial balance looked complete while quietly valuing
an unreadable row at nothing. It is now quarantined and the view refused. The
stage-3 test that asserted the old behaviour was corrected, not silenced.

**Evidence.** `ledgerHydration.test.ts` 19/19 and `glStore.derivedMoney.test.ts`
15/15. Mutation-verified twice: disabling the sub-cent check fails 11 tests;
returning at the first issue fails 5.

**Not claimed.** `GLEntry` fields are still `number`; the partition is not yet the
hydrate gate; no page renders the quarantine yet.

## 2026-10-21 (continued) — Q5 stage 3: the derived rows are Money (DEC-053)

**Shipped.** `TrialBalanceRow` and `AccountAnalysis` money fields are `Money`
(integer minor units) — the first adoption in the product, safe first because
they are derived and never persisted (`glStore.partialize` omits both;
`glTrialBalanceStore.partialize` keeps only paging and sort). Six files changed,
not 151, because three supporting pieces did the work:

- `MoneyInput` now includes `Money`; `toDecimal` converts minor units exactly, so
  `sumMoney` / `roundTo` / `formatMoney` sites stay exact with no rewrite.
- `useCurrencyFormatter` accepts `Money` — **one** display adapter, the leverage
  stage 6 needs for the 102 page files.
- `glTrialBalanceStore.applySort` compares money columns by amount; without it a
  `Money` cell sorted every row as `"[object Object]"`.

**Behaviour change (the decision).** There is no `Money` equal to `0.004`. The
old code rounded such amounts to zero cents at the output boundary, so a legacy
sub-cent row contributed nothing to the view — money silently gone. Now the view
is emptied and the reason named (`importStatus: 'error'`, `importError: 'Trial
balance not built: … sub-cent precision …'`, error toast). Currency is carried
when every entry agrees and OMITTED when they disagree — never the first entry's
code, which would state an FX conversion that never happened. Mixed-currency
accounts are still summed without conversion (DEC-051's open question).

**Why stage 4 is still gated.** Stage 3 refuses an aggregate, which produces no
wrong number. Stage 4 would refuse a ROW on hydrate, which means the ledger does
not open. The hydrate policy is still the blocker.

**Evidence.** `src/store/glStore.derivedMoney.test.ts` 13/13: a thousand one-cent
rows → exactly 1,000 minor; `0.1+0.2+0.3` → `{minor:60}` (float
0.6000000000000001); monthly totals and average exact; currency propagation and
mixed omission; refusal path; grid sort both directions; exact footer; formatter
renders Money in five shapes. Mutation-checked twice. Five existing test files
updated where they encoded `number` rows or the retired round-a-half-cent rule.

**Not claimed.** `GLEntry` is still `number`; no stored shape changed; FX
aggregation across currencies is not implemented.

## 2026-10-21 (continued) — Q5 stage 2: the round trip is proven, and stage 4 has a gate

**What was proven.** `src/store/glStore.moneyPersist.test.ts` (6 tests) runs the
**production** persistence path — `glStore.setEntries` → `masterStorage` →
chunked storage → a real SQL.js image in localStorage → AES-GCM — with the
41-row synthetic tie-out ledger, then decrypts the record independently to read
the bytes that are actually on disk.

- **At rest:** every money field of all 41 rows is `$d:<canonical>`;
  `jsonContainsNumericMoney` is false (INV-009), measured on the plaintext.
- **Byte identity:** persisting the same ledger with `Money` objects produces the
  identical plaintext a `number` ledger produces. Stage 4 rewrites nothing on disk.
- **Restart:** a fresh module graph rehydrates all 41 entries exactly;
  `trialBalance` is empty (it is not in `partialize`), regenerates, and balances.
- **Old backups:** a pre-Q5 envelope of raw JSON numbers still hydrates — there is
  no migration step to run, which is what makes rollback a revert.
- **Exactness:** decoding `as: 'money'` gives integer minor units for every field
  and debit cents equal credit cents.

**Mutation-verified** three ways: disabling the money-key branch fails 3 tests,
disabling the `Money` branch fails the byte-identity test, changing the decode
default fails the gate test.

**The gate this opened (blocking stage 4).** DEC-048 permits a stored row
`{ debit: 0.004, credit: 0 }`; every build since W0.8.2 wrote it at rest as
`$d:0.004`. Decoding that with `as: 'money'` throws `InvalidMoneyError` — the
correct refusal, and the reason `masterStorage` **cannot** switch `glStore` to
`as: 'money'` while sub-cent rows can exist on disk. Stage 4 needs either a
hydrate policy that preserves and names such rows while excluding them from
`Money` aggregates, or a finer minor-unit scale (which is the
three-decimal-currency decision, DEC-048's review trigger).

**Not claimed.** `GLEntry` amounts are still `number`; no page, engine or store
consumes `Money` yet. Stage 3 (`TrialBalanceRow` / `AccountAnalysis` — derived,
not persisted) is next and is the first change that touches behaviour.

## 2026-10-21 (continued) — Q5 opened: the type exists, the persist boundary is byte-identical

**Why now.** The requirement text says the `GLEntry` amount-type migration is
**Q5 — its own DEC and staged plan, do not start it under N8**. This entry is
that DEC (051) plus its stage 1.

**Measured blast radius** (HEAD `dc0f5209`): **98** non-test files reference
`GLEntry`; **151** touch `debit`/`credit`/`netChange`; **765** object-literal
constructions; ~**1,040** reads. By area: **`src/pages` 102**, engines 16,
services 16, components 6, utils 4, store 3, workers 1. It is a presentation
problem before a storage problem.

**The decisive property.** `glStore` persists through `masterStorage`, and money
keys already encode to `$d:<canonical>` (INV-009). Stage 1 encodes a `Money` value
to **the same bytes** the numeric field produces — proved for a single row and a
GL-shaped array. So the type change needs **no data migration**, backups stay
readable, and a rollback is a revert.

**Stage 1 shipped (nothing adopts it).** `Money = { minor, currency? }` at
`LEDGER_SCALE` 2; `asMoney` (refuses sub-cent, DEC-048), `moneyToMinor`,
`moneyToAmount`, `moneyCanonicalString`, exact `moneyPlus`/`moneyMinus`/
`moneyNegate`/`moneySum`/`moneyCompareValues`/`moneyEqualsValue`/`moneyIsZero`;
mixed currencies throw `MoneyCurrencyMismatchError`. `encodeMoneyGraph` handles
`Money`; `decodeMoneyGraph` gained `as: 'money'` while the default stays `number`.

**Evidence.** `src/utils/money.ledgerValue.test.ts` — **13/13**: exact minor
units, sub-cent refusal, `0.1 + 0.2` → 30, a thousand cents without drift,
currency propagation/refusal, canonical strings, `$d:` byte-identity, INV-009,
decode-as-money, unchanged numeric default. **Mutation-verified**: disabling the
`Money` branch in `encodeMoneyGraph` fails 4 of the 13.

**The plan** (`docs/architecture/money-type-migration.md`): (2) round-trip a real
persisted GL fixture through `as: 'money'`; (3) `TrialBalanceRow` /
`AccountAnalysis` — **derived, not persisted**, so cheap; (4) `GLEntry`; (5)
engines/services; (6) pages via one display adapter, deliberately last because
102 of the 151 files are display-only.

**Not claimed.** `GLEntry.debit/credit/amount` are still `number`. Stage 1 adds a
type and a proven boundary; it changes no behaviour and converts no file.

**Next.** Q5 stage 2 (persisted-fixture round-trip), then stage 3. N7 still needs
the owner's scope choice. Owner-blocked: Actions read scope (CI 403), PR **#83**,
real anonymised D365 export.

## 2026-10-21 (continued) — N8 reframed: the 29.99 % was measuring the wrong thing

**Queue audit first (three of my own entries were stale).**

- N8's named red `src/pages/data/ComparisonPage.tsx:236` is **already fixed** —
  that line goes through `fmt.currency0`, and `money:adoption` reports **0 raw
  value-producing `toFixed(n)` sites** repo-wide.
- The export cross-artifact tie-out already exists (see the previous entry).
- N7 is bundle reduction, not route reduction (previous entry).

**The finding.** `money:adoption` reads **29.99 % (305 / 1,017)** and N8 asked for
100 %. Measured, the gap is not a safety gap:

- `money:ast`: **0 unsafe money operations across 988 modules**, spine included.
  The detector is deliberately conservative — absence of evidence, not proof.
- Of **15 spine modules, 8 import the primitive**, and all **7 that do not perform
  no money arithmetic**: they tokenise CSV/XLSX text, parse money _strings_ via
  `parseFinancialAmount`, validate worker payloads, persist staged rows, or
  compare dates.
- Making those 7 `import '@/utils/money'` would move the ratio and change nothing.
  That is the denominator-gaming N8 forbids.

**The rule (DEC-050).** N8's completion test is a **property of the spine**, not a
ratio: every DATA→CLOSE spine module either imports the money primitive or
carries a _substantive_ non-monetary reason, and the reason is checked.

**Enforcement.** `src/services/import/spineMoneyCensus.test.ts` — **6/6**:
classification complete, no stale entries, reasons longer than a placeholder, and
each non-monetary module must contain no `toFixed(n)`, no `Math.round`, no
compound assignment on a money-named identifier, and must not quietly import the
primitive. Includes a vacuity guard so a truncated list cannot pass.

**Mutation-verified twice** (not asserted from a comment):
adding `balance += 1` to a module declared non-monetary failed the arithmetic
check; adding an unclassified `src/services/import/__mutantNewModule.ts` failed
the census. Both reverted; `git status` clean.

**Not claimed.** This does not certify safety: `money:ast` is a heuristic
detector, and the global ratio stays at **29.99 %** as a no-regression ratchet —
it is simply not a completion target any more. N8 is not closed by this; Q5 (the
`GLEntry` amount _type_) is still its own DEC and staged plan.

**Next.** (1) Q5 staged plan for `GLEntry` amount types (DEC first, no code).
(2) N7 needs the owner's scope choice (previous entry). (3) N4 AR adapter
(coverage row 5). Still owner-blocked: Actions read scope (CI 403), PR **#83**,
real anonymised D365 export.

## 2026-10-21 (continued) — N7 MEASURED: the only config-level slice failed the gate

**Two corrections to earlier entries in this file.**

1. **N7 is bundle structural reduction** (DEC-024's 2,080 KB gzip ceiling), not
   "route reduction toward ≤40". Earlier entries mislabelled it; the requirement
   text is `docs/AGENT_CONTINUATION_PROMPT.md` §N7.
2. **The export cross-artifact tie-out already exists.**
   `src/services/export/boardPackTieOut.integration.test.ts` (3 tests) builds the
   XLSX and PPTX bytes, parses the rows back out of both, ties them to the in-app
   GL aggregates, and fails on a tampered row. Re-ran it: **3/3 pass**. The
   "no cross-artifact test" line in an older block is stale.

**Measured** (fresh build, HEAD `bbbd6b16`): total JS **2,061.24 KB gzip** at
99.1 % of the 2,080 limit; main chunk 69.73 / 150; critical path 425.13 KB over
9 chunks; every G19 vendor inside budget. The recorded 2,061.71 holds.

**Experiment — rejected.** Splitting the merged `sector-pages` chunk back into the
19 per-route chunks the router already declares:

| Metric              | Before      | After                            |
| ------------------- | ----------- | -------------------------------- |
| Total gzip          | 2,061.24 KB | **2,084.01 KB — FAILS (+22.77)** |
| Chunks              | 415         | 456                              |
| `/sector/*` payload | 107.89 KB   | ~15 KB                           |

Reverted; `vite.config.ts` is byte-identical to `bbbd6b16`. The merged chunk is
load-bearing: nineteen dynamic entries duplicate the shared sector helpers for
more than the per-route win returns.

**Conclusion (DEC-049).** There is **no config-only reduction left**. The bytes
are vendors (41.5 %) and 170 engine-only chunks (~268 KB) that exist to keep every
engine reachable for N-0013; module duplication is absent (5 modules in >1 chunk).
A real drop needs a scope choice — replace exceljs, retire the 82 orphan engines,
or accept 2,061 KB as the v1 budget. **N7 stays open**; reported, not decided,
because each option removes something an earlier decision added.

**Full table and method:** `docs/architecture/BUNDLE_BASELINE_2026-10-21.md`.

**Not claimed.** The bundle did **not** improve. No code, config or budget
changed in this entry.

**Next.** (1) Owner scope choice on N7 (above). (2) `GLEntry` amount-type
migration is **Q5 — its own DEC and staged plan**; the requirement text forbids
starting it under N8, so the next money step is the Q5 plan, not code. (3) N8's
named red `src/pages/data/ComparisonPage.tsx:236` (display-path `toFixed`).
(4) N4 sub-ledger adapter (coverage order row 5 AR). Still owner-blocked:
Actions read scope (CI 403), PR **#83**, real anonymised D365 export.

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
