# Handover — 2026-10-19 — next-session prompt + state of the tree

> **How to use this file:** start the new session, open the repo, and paste the
> prompt in §1 verbatim. Everything after §1 is the evidence pack the prompt
> points at. Facts here were measured in this tree; anything not measured is
> labelled as owed.

---

## 1. Paste-ready prompt for the next session

```
You are continuing work on FinPlan Pro (repo: fp-A-betterversion), an all-in-one
FP&A desktop app. The owner's goal: "all in one FP&A tool — a one-stop solution";
the owner uses Dynamics 365, exports a GL dump, needs wrong entries found and
the accounts team guided to fix them, with day/month/year comparison in extreme
detail.

THE ONE RULE — ZERO COMPROMISES: nothing missed, nothing wrong/flawed/improper
left unlisted or unaddressed. Never present a spine-only or deferred-breadth
plan as complete.

READ FIRST, IN ORDER:
1. docs/HANDOVER_NEXT_SESSION.md (this file) — state, queues, owner-blocked items
2. docs/TASKBOARD.md — the live task board; pick up the top unblocked item
3. docs/PROJECT_AUDIT_AND_EXECUTION_PLAN.md — governing plan (Parts I+II, §18.1)
4. docs/MASTER_CHECKLIST_COVERAGE.md — 110-section coverage annex (status per row)
5. docs/discovery/decision-log.md — DEC-001…DEC-024; owner rulings are binding
6. AGENTS.md + docs/agent/ — standing engineering rules

OWNER RULINGS ALREADY DECIDED (do not re-ask, do not re-narrow):
- DEC-015: D365 importer handles ALL export shapes (mapping-driven); "verified"
  per shape still needs one real anonymised sample from the owner.
- DEC-016: surfaces ALL, dependency order: spine (J1 import→workspace) →
  exception queue (J2) → correction hand-off (J3) → comparison (J4).
- DEC-017: materiality EVERYTHING — thresholds rank/tier only, never suppress.
- DEC-018: hand-off = Excel list + in-tool tracking
  (REQUESTED → APPLIED → RE-VERIFIED, human action only).
- DEC-022: AI local-only, behind the verified-facts gate; external AI provider
  needs a new owner DEC first.
- DEC-024: bundle budget 2080 KB gzip (measured re-baseline); any further rise
  needs a new DEC with measured proof.

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

## 2. State of the tree

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
- Engines: 183 (101 shipped / 82 orphan) · stores 49 · workers 5 ·
  money-primitive adoption 29.83 % of financial modules (89 of 267
  engine/store modules import `money.ts`) · coverage thresholds 50 %.
  All from `node scripts/verify-readme-stats.mjs` / `scripts/money-adoption.mjs`.
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
- MASTER_CHECKLIST_COVERAGE.md has **no mechanical guard**: every row edit
  must cite its verifying command in the commit message (plan §18.1).
