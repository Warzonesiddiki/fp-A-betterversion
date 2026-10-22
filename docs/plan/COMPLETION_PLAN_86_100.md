# FinPlan Pro — Completion Plan, PR #85 → PR #100

> **Status:** planning document, adopted provisionally under delegated authority
> (see DEC-058). PR #85 is the session that ends here; PRs #86–#100 are the
> programmed remainder. **Nothing in this document is a claim that capability
> exists** — every capability claim still has to be produced by the register in
> §3 and the evidence named in §5.
>
> **Owner may correct anything here.** The owner-facing asks are isolated in §7
> so they can be answered or refused without re-reading the engineering plan.

---

## 1. What "complete" means, stated so it can be tested

The vision asks for completeness of a specific kind:

> every identified FP&A responsibility is either supported to an evidence-backed
> standard or explicitly recorded as not yet supported, experimental, blocked or
> retired by decision.

That is a statement about a **register**, not about a feature count. So completion
is defined as: **no identified responsibility is unaccounted for, and every
account has evidence a script re-derives.** Fifteen PRs is enough to build that
register and fill it honestly; it is not enough to make every module
enterprise-ready, and this plan does not pretend otherwise.

### The completion contract — six criteria, each with a gate

| #   | Criterion                                                                                                          | Enforced by                                                                                          |
| --- | ------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| C1  | Every route, engine, requirement and annex section has a status from a closed vocabulary, plus an evidence pointer | `completion:register` (new, PR #86) + `docs:verify`                                                  |
| C2  | Every supported workflow is completable **inside the app**; no second app is a mandatory step                      | `oneStop:acceptance` census (new, PR #90) over the supported route set                               |
| C3  | Money and "missing is not zero" invariants hold on every **supported** surface                                     | `money:ast` (0 unsafe), `money:adoption` on the supported set, `missingIsNotZero` census (PR #91)    |
| C4  | Every grade claimed in the truth matrix is reproduced by a named test or script, not by prose                      | matrix generator + `check-readme-claims` + `docs:verify`                                             |
| C5  | The supported set is operationally fit: a11y AA, perf budget, bundle limit, determinism and RBAC ratchets hold     | existing ratchets + `a11y` suite + `bundle-check` + `determinism` census (PRs #89, #97)              |
| C6  | What is not supported is stated, with the decision that blocks it, in the product's own docs                       | register status `BLOCKED-ON-OWNER` / `RETIRED` / `EXPERIMENTAL` — never blank, never implied success |

**A PR is done only when its criterion's gate is in the repo and failing-first
evidence exists for the behaviour it claims.** A PR that fills a register with
"SUPPORTED" without a test id fails C4 and is reverted.

---

## 2. Measured baseline — where the programme actually stands (2026-10-22)

Re-measured on `1cb1610` for this plan; every figure below has a command behind it.

| Measure                          | Value                                                                    | Command                                                       |
| -------------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------- |
| Frontend suite                   | **1,412 files, 16,410 passed, 1 skipped**                                | `node node_modules/vitest/vitest.mjs run`                     |
| Routed screens                   | **231** (target ≤ 40 top-level)                                          | `node scripts/generate-route-map.js`                          |
| Route dispositions **REVIEW**    | **47** — a release blocker per policy                                    | matrix scan, §2.1                                             |
| Route dispositions EXPERIMENTAL  | **77**                                                                   | matrix scan                                                   |
| Route dispositions MIGRATE       | **103** (not yet migrated)                                               | matrix scan                                                   |
| Routes graded CONNECTED          | **0 of 231 verified**                                                    | `docs/CAPABILITY_TRUTH_MATRIX.md`                             |
| Routes graded GOVERNED           | **0 of 231 verified**                                                    | `docs/CAPABILITY_TRUTH_MATRIX.md`                             |
| Engines                          | **180 total**; 98 wired to a caller, 82 only via the registry (see §2.3) | `npm run docs:verify`; `node scripts/engine-reachability.mjs` |
| Money adoption (financial paths) | **31.27 %** (319 of 1,020)                                               | `npm run money:adoption`                                      |
| Money AST safety                 | **0 unsafe, 100 %** over 980 modules                                     | `npm run money:ast`                                           |
| Coverage annex                   | **107 mapped / 93 SOURCE OWED** (108–200)                                | `node scripts/check-coverage-annex.mjs`                       |
| Bundle                           | **6,824.74 KB raw / 2,063.79 KB gzip = 99.2 %** of a 2,080 KB limit      | `npm run build && node scripts/bundle-check.js`               |
| Critical path / main chunk       | 426.84 KB gzip / 69.75 KB gzip                                           | `bundle-check`                                                |
| Owner decisions outstanding      | **O1–O9**                                                                | `docs/TASKBOARD.md` §OWNER                                    |

### 2.1 How the disposition counts were measured

```bash
grep -c '^| `' docs/CAPABILITY_TRUTH_MATRIX.md     # 231 routed screens
# disposition column: MIGRATE 103, EXPERIMENTAL 77, REVIEW 47, RETAIN 4
# pillar column: Vertical 77, Unclassified 47, Modeling 34, Close 24, Admin 19,
#                Reporting 17, Supporting 7, Identity 4, Workspace 2
```

The **47 Unclassified** and the **47 REVIEW** are the same rows. That is the
single most concrete fact in this document: **one fifth of the product has no
recorded decision about whether it is product.** Completing that is PR #87, and
it is the cheapest large honesty win available.

### 2.2 What the baseline says about the vision

- The **spine** (import → quarantine → tie-out → close → exception → export) is
  the best-evidenced part of the tree and is where "supported" can realistically
  be claimed first.
- **Breadth exists but is ungraded.** 180 engines (98 of them actually called)
  and 231 routes are
  not a weakness in the vision's terms — the vision wants breadth claimed at an
  honest grade. What is unacceptable is a grade of silence.
- **Governance is uniformly UNVERIFIED (231/231).** That is not a defect to hide;
  it is the largest gap between "built" and "enterprise-ready", and it is what
  PRs #88–#89 attack.

---

### 2.3 Two engine counts, both measured, neither one wrong

`docs:verify` reports **98 shipped / 82 orphan** engines; it counts an engine as
shipped only when runtime code (or an engine reachable from it) names it, and it
deliberately excludes the barrel and the generated manifest, because those re-export
everything and would make every engine "reachable" by definition.
`engine-reachability.mjs` reports **180 reachable / 0 orphans** because it also
accepts registration in `EngineRegistry` (surfaced at `/admin/engines`) as a path.

So the 82 are not dead code and not shipped features: they are **registered but
never called by a workflow**. Which question matters depends on the claim being
made — "can the app reach it" (180) versus "does a user path use it" (98). A
capability register row may only claim SUPPORTED on the 98-style evidence; the
manifest cannot carry a capability on its own. No engine is deleted to make
either number look better (DEC-006). PR #86 seeds both figures into the register.

## 3. The completion register (built in PR #86, filled by #87–#99)

One machine-readable file, one generated markdown view, one gate.

**Built.** `scripts/completion-register.mjs` was implemented and seeded in PR #86;
the register now covers **695 rows** — 231 routes, 180 engines, 19 requirements,
200 checklist sections and 65 vision capabilities — and `npm run docs:verify` runs
`--check` on every documentation change. The measured starting position is
**SUPPORTED 0 · EXPERIMENTAL 468 · BLOCKED-ON-OWNER 7 · RETIRED 0 · NOT_BUILT 220**,
which is the honest reading of a tree where 0 of 231 routes are graded CONNECTED
or GOVERNED. Nothing seeds as SUPPORTED; that status is earned by a later PR with
test ids that resolve.

**Disposition is measured, not believed (DEC-060, DEC-061).** Each of the 231 route
rows also carries the disposition from `docs/CAPABILITY_TRUTH_MATRIX.md`, re-read
on every seed so a matrix edit cannot leave a stale grade behind: **141
`MIGRATE`, 84 `EXPERIMENTAL`, 6 `RETAIN`, 0 `REVIEW`**, and the summary prints that
table. The 47 routes the prefix classifier could not place were decided in
`docs/product/route-dispositions.json` (PR #87): 38 folded into a named pattern
(17 of them one-line aliases), 7 kept experimental with a named certification
gap (treasury, ESG, one untested CapEx tracker), 2 retained as shell surfaces
(the dev-only visual baseline and the 404 catch-all), and none retired. `REVIEW`
is now a failing state rather than a resting one, so a new route cannot enter the
tree without a decision — and an alias decision must name the redirect target the
router actually uses.

**File:** `docs/plan/completion-register.json` (**source of truth**). The view in
`docs/plan/COMPLETION_REGISTER.md` is generated from it, and `--check` fails when
the two disagree.

**Row vocabulary — closed. An unknown value fails the gate.**

| Status             | Means                                                    | Required evidence field        |
| ------------------ | -------------------------------------------------------- | ------------------------------ |
| `SUPPORTED`        | Completable in-app, graded CONNECTED **and** GOVERNED    | test ids, gate line, doc link  |
| `EXPERIMENTAL`     | Reachable, may change, may not be described as supported | the route/flag that gates it   |
| `BLOCKED-ON-OWNER` | Cannot progress without a named owner decision           | `O1`–`O9` id + the question    |
| `RETIRED`          | Deliberately removed or unreachable; decision recorded   | DEC id + removal commit        |
| `NOT-BUILT`        | Responsibility identified, nothing claims it yet         | the register row that names it |

**Row identity, so nothing can hide:**

1. one row per routed screen (231 today);
2. one row per engine (180);
3. one row per requirement (19: FR-001–011, NFR, UX, AI);
4. one row per annex section (200; 107 mapped, 93 `NOT-BUILT — SOURCE OWED`);
5. one row per vision domain responsibility (§4 of this plan, 8 domains + 3
   cross-cutting, expanded to named capabilities).

**Gate rules** (`npm run completion:register --check`, wired into `docs:verify`):

- every discovered route/engine/requirement/section has exactly one row;
- no blank status; no unknown status;
- `SUPPORTED` requires ≥ 1 test id **and** a gate line, and both must resolve to
  files that exist;
- `BLOCKED-ON-OWNER` must name an `O`-id that exists in the taskboard OWNER table;
- `RETIRED` must name a DEC id present in the decision log;
- no route row may carry a `REVIEW` disposition (it means nobody decided), and an
  unknown disposition fails the gate;
- the rendered markdown must match the JSON (no hand-edited copy);
- counts are printed and compared to the generators, so a new route with no row
  fails the build the day it lands.

This is the piece that makes the last ten PRs verifiable instead of rhetorical.
Until it exists, "we are nearly done" is an opinion.

---

## 4. The scope map the register must cover

Mirrors the vision's eight domains plus three cross-cutting ones. Each named
capability gets a register row; the PR that closes it is in the last column.

| Domain                 | Named capabilities that must each have a row                                                                            | Closed by     |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------- | ------------- |
| DATA & INTEGRATION     | D365 shapes (F&O GL, journal entity, BC G/L), CSV/XLSX intake, mapping, validation, quarantine, control totals, lineage | #86–#88, #97  |
| ACTUALS & CLOSE        | Period/entity scope, trial balance, tie-out, close state machine, write guards, audit chain, corrections                | #88–#89, #91  |
| PLAN & FORECAST        | Budgets, versions, rolling forecast, scenarios, assumptions, drivers/cascades, operational plans                        | #92           |
| MODEL & CONSOLIDATE    | Consolidation, IC elimination, FX translation, revenue recognition, leases, tax, multi-book                             | #93           |
| ANALYZE & PERFORM.     | Statements, variance decomposition, drill-to-source, exception rules, findings with disposition, explanations           | #88, #91, #96 |
| OPERATIONAL PLANNING   | Cash planning, workforce/headcount, CapEx, connected to financial outcomes with visible assumptions                     | #94           |
| WORKFLOW & GOVERNANCE  | Reviews, approvals, correction follow-through, RBAC, auditability, administration, human attribution                    | #89, #95      |
| REPORT & COMMUNICATE   | Statements, board pack, formula-preserving XLSX, PDF, editable PPTX, tie-back to screen                                 | #95           |
| ADMIN (cross-cutting)  | Users, settings, integrations, data management, backup/restore honesty                                                  | #89, #98      |
| GOVERN (cross-cutting) | Authorization, SOX/audit authority boundary, security policy, entity scope                                              | #89, #98      |
| AI (cross-cutting)     | Verified-facts gate on every AI surface, local-only, explicit invocation, no egress                                     | #96           |

**Breadth is preserved.** A capability that cannot be supported becomes
`EXPERIMENTAL`, `BLOCKED-ON-OWNER` or `RETIRED` — never deleted to make a number
look better (DEC-006 still binds).

---

## 5. The fifteen PRs

Each row is one merged PR. "Evidence" is what must be in the diff; "exit gate" is
what must pass. Ordering is dependency-driven: #86 first because everything else
writes into it.

| PR   | Title                                   | Outcome                                                                                                      | Exit gate                                                         |
| ---- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------- |
| #86  | Completion register machinery           | JSON register + generator + `--check` + rendered doc; 231/180/19/200 rows seeded from source                 | register gate green; seeded counts equal generator counts         |
| #87  | Route disposition sweep                 | **47 REVIEW → 0**; 47 Unclassified → pillar; every route MIGRATE/RETAIN/EXPERIMENTAL/RETIRED                 | disposition census green; `docs/product/ROUTE_MAP.md` regenerated |
| #88  | Spine CONNECTED evidence                | Spine routes graded CONNECTED with loading/empty/error/stale handling and integration tests                  | spine rows CONNECTED with test ids; matrix regenerated            |
| #89  | Spine GOVERNED evidence + N2/N3 closure | Authz, audit, entity scope, write guards for the spine; RBAC census closed; audit chain bounded              | GOVERNED rows carry test ids; N2/N3 closed or bounded in board    |
| #90  | One-stop acceptance                     | In-app correction path sufficient; Excel optional; D365 intake in-app; DEC-018 revision                      | `oneStop:acceptance` census green; DEC recorded                   |
| #91  | Missing-is-not-zero sweep               | Census of `?? 0` / `\|\| 0` on money reads in supported surfaces; quarantine shown wherever a total is short | census green; funded-by-test evidence per fix                     |
| #92  | PLAN to supported                       | Budget versions, scenarios, driver cascade tie-out, forecast semantics (or O2-blocked)                       | oracle-value tests; register rows SUPPORTED or BLOCKED-ON-OWNER   |
| #93  | MODEL/CONSOLIDATE to supported          | IC elimination, consolidation twin, FX translation; cross-currency conversion decided                        | tie-out oracle tests; DEC for FX scope                            |
| #94  | OPERATIONAL planning to supported       | Cash + workforce connected to financial outcomes, assumptions visible                                        | integration tests + register rows                                 |
| #95  | REPORT to supported                     | Board pack XLSX/PDF/PPTX ties back to screen for supported statements                                        | tie-back tests; export-optional census                            |
| #96  | AI cross-cutting hardening              | Verified-facts gate on **every** AI surface; no egress; local-only                                           | AI census green (0 ungated surfaces)                              |
| #97  | Performance, a11y, bundle (N7)          | Bundle below 1,950 KB gzip target; a11y AA on supported routes; per-route perf budget                        | bundle-check PASS with no warning; a11y suite green               |
| #98  | Owner decision pack + honest gaps       | O1–O9 consolidated with consequences; every blocked row states its question                                  | register has 0 blank statuses; owner packet regenerated           |
| #99  | Release candidate hardening             | Full suite + build + all ratchets; rollback rehearsal; runbook; CI posture recorded                          | every gate green from a clean checkout                            |
| #100 | Release + completion register snapshot  | Grades re-derived, claims re-measured, release notes = register snapshot, tag                                | C1–C6 all green; README/VISION claims match measurement           |

### Per-PR detail

**#86 — Completion register machinery.** No product change. Adds
`scripts/completion-register.mjs`, `docs/plan/completion-register.json`,
the generated register view, and
`src/__tests__/completionRegister.test.ts` proving the gate rejects:
a missing row, an unknown status, a `SUPPORTED` row with no test id, an
`O`-id that does not exist, and a hand-edited rendered file. Seed statuses come
from the generators, not from opinion: routes from `App.tsx`, engines from
`EngineRegistry`/manifest, requirements from the register, annex from the
annex parser.

**#87 — Route disposition sweep (delivered 2026-10-23).** The 47 undecided rows
are decided in `docs/product/route-dispositions.json` — pillar, disposition,
accountable role, reason and next evidence per route — and the matrix generator
reads the table instead of guessing from the path. Measured result: **38
MIGRATE, 7 EXPERIMENTAL, 2 RETAIN, 0 REVIEW**; the 17 one-line aliases fold into
their canonical targets rather than being deleted, the treasury and ESG surfaces
stay EXPERIMENTAL with the certification gap named, and `CapexTracker` stays
EXPERIMENTAL until it has a colocated test. `routes:dispositions` and the register
both fail on a `REVIEW` row, so this cannot decay quietly. This is the PR that
converts "231 screens" from an embarrassment into a stated position.

**#88 — Spine CONNECTED evidence.** The supportable claim is narrow and real: a
synthetic D365-shaped file goes in, control totals tie, quarantine is named,
trial balance balances, a close cannot be bypassed, one exception rule produces
findings, a disposition survives reload, a board pack ties out. #88 is the
CONNECTED half (data contract + all four UI states + integration test); #89 is
the GOVERNED half (authorization, audit, entity scope, write guards).

**#89 — Spine GOVERNED evidence + N2/N3.** Closes the two active N-items or
states their residual boundary (N2 cannot claim restart durability without O7;
N3 cannot claim payload-source authentication). A bounded closure with the
boundary written down is acceptable; a silent promotion is not.

**#90 — One-stop acceptance.** The vision's acceptance rule is not met today:
DEC-018 still describes an Excel correction hand-off. The fix is an in-app
correction path that is _sufficient_, with Excel remaining an optional export.
A census enumerates supported workflows and fails if any of them names an
external tool as required. DEC-018 gets a revision row; DEC-003/DEC-015 are not
edited. **This is the PR where the product either satisfies the one-stop rule or
says plainly that it does not.**

**#91 — Missing is not zero.** Census every money read that defaults: `?? 0`,
`|| 0`, `Number(x) || 0`, `parseFloat(x) || 0`. In supported surfaces each hit is
either fixed (render "unavailable" with a reason) or annotated with why zero is
correct there. Extends the quarantine notice from two GL pages to every surface
whose total can be short.

**#92–#95 — Domain promotion.** One domain at a time, each with an oracle: real
arithmetic reproduced from typed inputs (the pattern already used for ASC 805
goodwill). A domain that cannot be supported without an owner decision is
recorded as such — e.g. rolling forecast semantics are `BLOCKED-ON-OWNER O2`
unless the owner answers.

**#96 — AI.** The gate exists (`verifyNarrative`); the work is proving **every**
surface that surfaces generated text calls it, by census, and that no path can
reach a provider. DEC-022 stands.

**#97 — Performance/a11y/bundle.** N7 measured at 2,063.79 KB gzip / 99.2 % of
limit. Target: below 1,950 KB so the warning clears and dependency bumps have
headroom. The lever is the 183 lazy engine chunks and the four vendor chunks —
not deleting product.

**#98 — Owner pack.** Regenerates `docs/discovery/OWNER_DECISION_PACKET.md` with
O1–O9 in decision form: question, options, default if unanswered, what it blocks,
what it unblocks. The default for every unanswered question is "not claimed".

**#99 — Release candidate.** Clean checkout, full suite, build, bundle, all
ratchets, docs truth, strict links, migration/rollback rehearsal, runbook, and a
CI statement that says exactly what could and could not be verified from this
environment.

**#100 — Release.** The completion register is the release note. Grades are
re-derived from the tree, every claim in README/VISION/register re-measured, the
tag cut, and the "not supported" list published alongside.

---

## 6. Sequencing and dependencies

```
#86 register
 ├─ #87 dispositions ──┐
 ├─ #88 spine CONNECTED ─ #89 spine GOVERNED ─┬─ #90 one-stop
 │                                            └─ #98 owner pack
 ├─ #91 missing-is-not-zero
 ├─ #92 PLAN ─┐
 ├─ #93 MODEL ├─ (each writes register rows) ─ #100
 ├─ #94 OPER  │
 ├─ #95 REPORT┘
 ├─ #96 AI
 └─ #97 perf/a11y/bundle ── #99 RC ── #100 release
```

Rules that hold across all fifteen:

1. **One PR, one criterion.** A PR that claims two things gets split.
2. **The register is updated in the same commit** as the work it describes, or
   the register gate fails.
3. **No grade is raised in prose.** `docs/CAPABILITY_TRUTH_MATRIX.md` is
   generated; the only way to raise a grade is to add the evidence the generator
   looks for.
4. **No gate is weakened** — including the completion gate itself. If a rule is
   too strict, the rule is revised by a DEC, in public, with the reason.
5. **Nothing is deleted to close a row** (DEC-006): `RETIRED` requires a recorded
   decision.

---

## 7. What cannot be claimed at PR #100 without an owner decision

This section exists so completion is not quietly redefined. Each item is a
register status, not a TODO.

| #   | Not claimable today                | Because                                        | Blocking id |
| --- | ---------------------------------- | ---------------------------------------------- | ----------- |
| 1   | Any D365 shape "verified"          | No real export sample; synthetic fixtures only | O1          |
| 2   | "Your data is safe" / backup story | No key-escrow decision                         | O3          |
| 3   | SOX / audit authority              | No authority decision                          | O4          |
| 4   | Rolling-forecast correctness       | Roll semantics undefined                       | O2          |
| 5   | Sector/jurisdiction support tiers  | Tiering undecided                              | O5          |
| 6   | Any non-local AI                   | DEC-022 holds until decided                    | O6          |
| 7   | Native desktop / offline auth      | No real Tauri build verified                   | O7          |
| 8   | CI green on `main`                 | Actions API returns 403 here                   | O8          |
| 9   | Entity-scope authorization         | Authoritative entity set undefined             | O9          |
| 10  | Cross-currency FX conversion       | Not built; needs a DEC on scope                | #93         |
| 11  | Analyst-capacity replacement       | Requires owner-accepted real-data measurement  | —           |

If any of these is answered during the programme, its PR absorbs it and the row
moves. If none is answered, PR #100 still completes — with these rows
`BLOCKED-ON-OWNER`, which is exactly what the vision permits and requires.

---

## 8. How this plan could fail (and the controls)

| Failure mode                               | Control                                                              |
| ------------------------------------------ | -------------------------------------------------------------------- |
| Register filled with optimistic statuses   | `SUPPORTED` requires resolving test ids + gate lines (#86)           |
| "Complete" redefined at the end            | Contract C1–C6 fixed now, in this document, under DEC-058            |
| Breadth deleted to make numbers look good  | `RETIRED` requires a DEC; register counts route/engine totals        |
| Domain promotions without arithmetic proof | Oracle-value tests per domain (#92–#95)                              |
| One-stop rule waived by wording            | Census enumerates workflows, not adjectives (#90)                    |
| Bundle pressure met by dropping features   | Vendor/chunk work only; product deletion needs a DEC                 |
| Owner asks silently absorbed               | `BLOCKED-ON-OWNER` must name a live `O`-id; #98 regenerates the pack |
| The last PR discovers a gap                | #98 and #99 exist to find gaps while there is still a PR to fix them |

---

## 9. Working agreement for the remaining PRs

- Branch per session, `arena/…`; one merged PR per row above.
- Every PR body: what changed, the failing-first evidence, the gate line, and
  **what it does not claim**.
- Every PR runs: `tsc`, `eslint src --max-warnings 0`, focused tests, the full
  suite before merge, `docs:verify`, `docs:links`, `check-readme-claims`,
  `money:ast`, `bundle-check`, and the pre-push chain.
- Every PR that changes a capability updates: register JSON, matrix (generated),
  taskboard row, and the handover entry — in the same commit.
- If a PR cannot meet its exit gate, it ships **scope-reduced with the reduction
  recorded**, never with the gate relaxed.

---

## 10. One-paragraph summary

The product is not short of capability; it is short of **accounting for it**. 231
routes, 180 engines (98 called by a workflow) and 16,410 tests exist, while 47
routes have no
disposition, 231 of 231 routes have an unverified governance grade, money
adoption is 31.27 %, and 93 annex sections are source-owed. PRs #86–#100 close
that gap the only way it can honestly be closed: build a register that cannot be
filled without evidence, decide every undecided route, promote the spine and then
the domains to CONNECTED and GOVERNED with tests that would fail without the
work, prove the one-stop rule with a census, and publish the blocked list. At
PR #100 the claim is not "flawless"; it is **"every responsibility is accounted
for, every account has evidence, and the gaps are named"** — which is what the
vision actually asks for, and what "zero compromise" means in practice.
