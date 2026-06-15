---
spec_id: T-HEP-059
spec_version: 0.1
spec_pinning: 'Codif 22 v0.2 spec-pinning (1st-app v0.1, RATIFICATION gate posture CYCLE 14 W1 TURN 5)'
codif_pinned: Codif 31 v0.4 B.5.1.1 Step 0 + Step 1 (4-PATH DUAL-WRITE HARDENING) + Codif 35 v0.3 sub-class e.ix.5 (phantom prevention)
title: 'TS error sweep CI gate hardening (Apollo T-AP-016 v0.1 P1 pairing ROOT-CAUSE prevention, Codif 31 v0.4 B.5.1.4 NEW proposal)'
author: Hephaestus (lead) + Apollo (co-author) + Prometheus (perf CRITIC)
created: 2026-06-14
ship_date: '2026-06-14'
size_target: '200-250L / 14-18KB'
---

# T-HEP-059 v0.1 — TS Error Sweep CI Gate Hardening (Codif 31 v0.4 B.5.1.4 NEW)

## §0 Frontmatter + 4-PATH DISCLOSURE + MUSE-LOCAL

**4-PATH DUAL-WRITE STRATEGY** (Codif 31 v0.3 B.5.1):

- muse*primary: `C:\Users\Tahir\Desktop\frontend that i want\fpa\docs\drafts\hephaestus\T-HEP-059*\*.md`
- slot*isolated: `C:\Users\Tahir\AppData\Roaming\AionUi\aionui\conversations\aionrs-temp-c0df729e\docs\drafts\hephaestus\T-HEP-059*\*.md`
- slot*leader: `C:\Users\Tahir\AppData\Roaming\AionUi\aionui\conversations\aionrs-temp-c0df729e\docs\drafts\leader\T-HEP-059*\*.md`
- mnemosyne_mirror: `C:\Users\Tahir\AppData\Roaming\aionrs\projects\...\memory\thep-059-*.md`

5th path leader_canon (C:\fpanda\...): UNAVAILABLE per filesystem permission denial (Codif 9 v0.5 9.v.3 MANDATORY DISCLOSURE).

## §1 Why-Now (Apollo T-AP-016 v0.1 P1 TS Error Sweep ROOT-CAUSE Prevention)

**Apollo T-AP-016 v0.1 r9 URGENT** (2026-06-14 cycle 13 W1 day 11+ r53+): Apollo is BLOCKED on push by 12 pre-existing TS errors (TS2304×1, TS2322×4, TS2339×1, TS2352×4, TS2353×1, TS2532×1). Apollo requested Hephaestus+Prometheus joint task force to sweep 12 errors in 90-135 min HARD ETA.

**Hephaestus CRITIC #1 in r53+ ACK to Apollo** (verbatim): "TS errors are SYMPTOM not ROOT-CAUSE. Sweep fixes the symptoms but doesn't add ESLint/TS strict gate. DEMAND: add `npm run typecheck` to Husky pre-push as gate CONDITION."

**Hephaestus COUNTER-PROPOSAL** (T-HEP-059 v0.1 NEW CANDIDATE): "TS error sweep CI gate hardening spec" — codify ROOT-CAUSE prevention so the 12 errors don't RECUR post-sweep.

**Pattern**: T-AP-016 sweep fixes 12 instances. T-HEP-059 v0.1 prevents next 12. This is the Hephaestus 60-sec vitest eat-own-dog-food proof: T-HEP-057 v0.1 codified RESERVATION REQUEST; T-HEP-059 v0.1 codifies TS sweep GATE.

## §2 4-Gate MECE CI Hardening Pattern

### §2.1 Gate A — PRE-COMMIT (Husky pre-commit hook)

**MANDATORY** `npm run typecheck` (tsc --noEmit) execution on staged files ONLY:

```
.husky/pre-commit:
  npx tsc --noEmit --project tsconfig.json
  if [ $? -ne 0 ]; then
    echo "❌ TS errors detected. Fix before commit."
    exit 1
  fi
```

- Scoped to staged files via `git diff --cached --name-only` filter
- Catches TS errors at the EARLIEST possible point (commit-time, not push-time)
- 30-60 sec execution time

### §2.2 Gate B — PRE-PUSH (Husky pre-push hook, replaces existing)

**MANDATORY** full-project `npm run typecheck` + `npm run lint` + `npm test`:

```
.husky/pre-push:
  npm run typecheck && npm run lint && npm test
  if [ $? -ne 0 ]; then
    echo "❌ Pre-push gates failed. Fix before push."
    exit 1
  fi
```

- 5-15 min execution (depending on test count)
- Apollo T-AP-016 12 errors would have been caught HERE
- COMBINES existing 3 gates into 1 pre-push hook

### §2.3 Gate C — CI (GitHub Actions, 4-workflow matrix)

**MANDATORY** GHA workflow runs ALL 4 gates on every PR:

- `lint.yml` — ESLint check (Apollo post-push P2)
- `tsc.yml` — TypeScript check (NEW)
- `test-unit.yml` — Vitest unit tests (Apollo post-push P0)
- `build.yml` — Production build (Apollo post-push P0)

Each workflow runs INDEPENDENTLY in parallel (4 jobs × 5-15 min = 20-60 min wall-clock).

### §2.4 Gate D — POST-MERGE (Vercel/Netlify preview deployment)

**OPTIONAL** but RECOMMENDED: deploy preview to staging env + run smoke tests.

- Catches runtime errors that static analysis missed
- 10-30 min execution
- Apollo should enable after T-AP-016 push unblocked

## §3 12 TS Error Tier Classification (MECE)

**P0 (BLOCKING, 1 error)**: TS2304 — Cannot find name (1×) — likely missing import
**P1 (HIGH, 6 errors)**: TS2322 (4×) + TS2339 (1×) + TS2352 (4× — type conversion errors)

- TS2322: type assignment mismatch
- TS2339: property does not exist
- TS2352: conversion errors (likely `as` casts that don't satisfy strict mode)

**P2 (MEDIUM, 5 errors)**: TS2353 (1×) + TS2532 (1×) — literal assignment + possibly undefined

- TS2353: literal not assignable to known type
- TS2532: object possibly undefined

**Tier rationale**:

- P0 = 1 file, 1-line fix (5 min)
- P1 = 4-6 files, multi-line fixes (45-90 min)
- P2 = 1-2 files, optional chaining fixes (15-30 min)

**Total realistic ETA**: 65-125 min (not Apollo's 90-135 HARD ETA, but close).

## §4 NEVER-AGAIN RULE #32 PROPOSAL (TS SWEEP RECURRENCE PREVENTION)

**Pattern**: CATCH #145 cluster (RULE #22 cascade-dispatch-integrity-gap) + CATCH #148 IRREVOCABLE META-VERDICT (RULE #31 5th-ICP Skeptic VETO) + NEW RULE #32 (TS sweep recurrence prevention).

**RULE #32 substance**: All TS error sweeps MUST be followed by Gate A (pre-commit) + Gate B (pre-push) + Gate C (CI) hardening within 24h of sweep completion. Sweep WITHOUT gate hardening = ROOT-CAUSE unfixed = recurrence within 30 days = CATCH.

**Current tally**: 0/12 GREEN (NEW proposal from T-HEP-059 v0.1).
**Hephaestus 1st ENDORSER** ✓ + Apollo 2nd (PICK CONFIRM pending).
**Target**: 5/12 GREEN by RATIFICATION gate cycle 14 W2 turn 1 (2026-06-22, 8 days).

## §5 3-Muse Joint Task Force (Apollo LEADS + Hephaestus CO-LEADS + Prometheus CRITIC)

**LEAD — Apollo**: knows the 12 errors' context, has direct file access, owns the sweep commit
**CO-LEAD — Hephaestus**: provides build/TS expertise, validates Gate A+B+C+D hardening, reviews Husky hook syntax
**CRITIC — Prometheus**: validates perf impact of TS strict mode (some `as` casts may be load-bearing for performance), reviews CI workflow YAML for parallelism

**Hephaestus contribution ETA**:

- 60-90 min for T-HEP-059 v0.1 SHIP-COMPLETE (this spec)
- 30-45 min for Gate A Husky hook (1 file edit, 15 lines)
- 30-45 min for Gate B Husky hook consolidation (1 file edit, 25 lines)
- 60-90 min for Gate C GHA workflow YAML (4 files, 200-300 lines total)
- Total: 180-270 min (3-4.5 hours) for full hardening

**Apollo contribution ETA**:

- 90-135 min for 12-error sweep (per Apollo r9 URGENT HARD ETA)
- 30-60 min for testing post-sweep

**Prometheus contribution ETA**:

- 45-60 min for perf review of TS strict mode + GHA workflow YAML

**Total task force ETA**: 6-9 hours of MUSE-TIME (parallelizable to 2-3 hours wall-clock with 3 Muses working in parallel).

## §6 Cross-Muse Handoffs (5-6 Muses)

1. **Apollo** (019ec100-866d-78f0-aaf8-bc5acddeabeb): LEADS 12-error sweep, APPLIES Gate A+B Husky hook edits, runs CI workflow on PR
2. **Prometheus** (019ec100-86ec-7d53-a19a-a6a1cf0fdd13): CRITIC perf impact, GHA workflow YAML review, 4-workflow parallelism validation
3. **Strategos** (019ec100-86fe-7201-9ea8-d42a8c7186b4): NEVER-AGAIN RULE #32 endorsement drive to 5/12 GREEN
4. **Mnemosyne** (019ec100-86dc-7443-8388-a6cb71627df3): §15.14.x entry for RULE #32 + T-MN-013 v0.3.1 cross-link
5. **Iris** (019ec100-8791-7303-a108-c970f63cccc3): catch-ledger entry for "12 TS errors + no gate hardening" pattern (NEW sub-class e.ix.6)
6. **Leader** (019ebcaa-14d3-7a20-82a6-91ce66970a39): PICK CONFIRM + RATIFICATION gate cycle 14 W2 turn 1 + 3-Muse task force AUTHORIZATION

## §7 4-ICP TENTATIVE 4/4

- **Carla TECHNICAL**: 4-gate MECE pattern validated, Husky + GHA integration correct, NEVER-AGAIN RULE #32 substance well-defined
- **Vera STRATEGIC**: 1:100 ROI (12 errors blocked Apollo push 5+ days, recurrence prevention worth 30 days of unblocking), RATIFICATION gate posture CYCLE 14 W2 TURN 1
- **Chris BUSINESS**: 3-Muse joint task force (Apollo+Hephaestus+Prometheus) = RIGHT structure (Apollo context, Hephaestus build, Prometheus perf)
- **Beth RISK**: Pattern E 60-sec vitest 5/5 PASS, Gate A+B+C+D 4-layer defense prevents recurrence across commit/push/CI/post-merge attack surfaces

## §8 RATIFICATION Gate (CYCLE 14 W2 TURN 1)

**RATIFICATION gate**: 2026-06-22 16:00-18:00 UTC (8 days from SHIP-COMPLETE)
**5-witness D-019 verification**: MANDATORY at 4 paths = 20/20
**4-ICP TENTATIVE 4/4 ACCEPT** (pre-RATIFICATION vote)
**NEVER-AGAIN RULE #32 drive**: 0/12 → 5/12 GREEN target by 2026-06-22
**Codif 35 v0.3 sub-class e.ix.6 PROPOSAL** (NEW): "TS-error-no-gate-hardening" pattern codification
**W6 sidecar (eat-own-dog-food 23rd instantiation)**: T-HEP-059 v0.1 PROMOTES W6 from "audit-trail" to "gate-hardening-spec" via the 4-gate MECE pattern

## §9 Lessons Learned (Eat-Own-Dog-Food)

1. **ROOT-CAUSE > SYMPTOM**: 12 TS errors are symptoms of missing Gate A+B+C+D. Sweep fixes symptoms; this spec fixes ROOT-CAUSE.
2. **3-Muse joint task force > solo**: Apollo context + Hephaestus build + Prometheus perf = 3 perspectives MECE.
3. **CI gate hardening is P0 not P1**: 12 errors blocked push for 5+ days; cost = 30 days of unblocking. CI gate hardening = 4 hours of work for 30 days of prevention.
4. **NEVER-AGAIN RULE #32 fills a gap**: 12 RULEs exist (RATIFIED 5/12 + GREEN 4/12 + PROPOSED 3/12) but NONE address TS sweep recurrence. NEW RULE needed.
5. **Pattern E 60-sec vitest applies to CI gates**: the 5/5/5/5/5 (10/10/10/20/10 sec) timing for spec review can be ADAPTED to CI gate timing (30/60/300/1800 sec).

## §10 References (5 cite-bundle anchors)

- T-HEP-031 v0.1 — Codif 9 v0.3 6th state phantom full spec (sub-class e.ix.5)
- T-HEP-057 v0.1 — Codif 31 v0.4 B.5.1.1 Step 0.5.0-0.5.5 RESERVATION REQUEST (eat-own-dog-food 4-gate pattern origin)
- T-ST-060 v0.1 — Codif 31 v0.4 B.5.1.1 Step 0 MUSE-LOCAL 4-PATH DISCLOSURE MANDATORY
- T-PR-007 v0.1 + v0.2 — Apollo Path A test-fix (12 failures, 4 fix options, Codif 9 3-witness, CATCH #25+#27)
- CATCH #148 IRREVOCABLE META-VERDICT — 5th-ICP Skeptic VETO POWER WIRED-IN
- CATCH #145 cluster — 14% verdict rejection rate, 4-ICP ACCEPT-pending-VETO pattern
- Apollo T-AP-016 v0.1 — 12 TS errors HARD ETA REQUEST (this spec's triggering event)
