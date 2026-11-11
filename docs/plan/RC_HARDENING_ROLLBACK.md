# RC Hardening — Rollback Rehearsal (2026-10-23)

> **Status:** Rehearsal runbook — not yet executed in production
> **Purpose:** Verify rollback works before any release candidate ships

> **2026-11-11 repository review note:** The runbook is accurate about itself — it says "not yet executed in production", and no rehearsal
> *was* executed in this review. What was checked is that each procedure targets something that actually exists:
>
> - **Scenario 1 (money migration)** is sound and every verification command it names is real and currently passing: `money:ast` (0 unsafe
>   operations), `money:adoption` (ratchet holds), `docs:verify`. Its "no-op at rest" data-impact claim is consistent with DEC-051/DEC-052.
> - **Scenario 2 (route promotion → EXPERIMENTAL)** is viable: `docs/plan/completion-register.json` really is keyed by status with the full
>   vocabulary `SUPPORTED / EXPERIMENTAL / BLOCKED-ON-OWNER / RETIRED / NOT_BUILT`, and `npm run completion:register` is a real script. Note the
>   register's census (227 routes / 180 engines / 21 requirements / 200 annex / 83 capabilities) agrees with the independently measured 227 and
>   180 — this is one of the few places those numbers are consistent.
> - **Scenario 3 (bundle diet)** requires that `route-dispositions.json` carry a non-RETIRED disposition for the route being restored. Mostly true,
>   but 74 of the 123 ungoverned routes have **no disposition entry at all** (recorded in the route-promotion batch), so a rollback of one of those
>   would have nothing to flip. The procedure is correct only for routes that have an entry.
> - **Scenario 4 (AI census)** is sound; `ai-census` reports 0 ungated surfaces.
> - **The 15-item release checklist is a good instrument, and two items are simply false today.** `npm run test:sharded` does **not** pass 8/8 —
>   it fails on the coverage threshold at 32.40 / 26.69 / 30.62 / 33.14 against 50, and the last shard-1 sample in this review passed 366 files /
>   4,445 tests without coverage. The final item — "Owner decisions O1–O9 either answered or recorded as BLOCKED-ON-OWNER" — is **not** satisfiable
>   as written, because the governance manifest both claims O9 is resolved (DEC-103) and requires 104 route claims to assert it is blocked
>   (AUD-105). A checklist item cannot be closed while the gate contradicts itself.
> - The checkboxes are all unticked, which is the correct state and matches the Status line. Do not run this checklist and report it green: the
>   coverage item and the O1–O9 item would both have to be lied about.

## Rollback Scenarios

### Scenario 1: Money Migration Rollback

**Trigger:** A user reports incorrect calculations after money migration.

**Steps:**
1. Identify the commit that introduced the change: `git log --oneline --grep="money"`
2. Revert the commit: `git revert <commit-hash>`
3. Verify: `npm run money:ast` must PASS (0 unsafe ops)
4. Verify: `npm run money:adoption` must hold ratchet
5. Verify: `npm run docs:verify` must PASS
6. Deploy the reverted build

**Data impact:** None — money migration was a no-op at rest (DEC-051, DEC-052).

### Scenario 2: Route Promotion Rollback

**Trigger:** A route promoted to SUPPORTED has a governance gap.

**Steps:**
1. Change status in `docs/plan/completion-register.json`: SUPPORTED → EXPERIMENTAL
2. Update `docs/plan/governance-evidence.json`: remove route entry
3. Run: `npm run completion:register`
4. Run: `npm run docs:verify` — must PASS
5. Commit and deploy

**Data impact:** None — route promotion is documentation only.

### Scenario 3: Bundle Diet Rollback

**Trigger:** A retired route needs to be re-introduced.

**Steps:**
1. Re-add lazy import in `src/App.tsx`
2. Update `docs/product/route-dispositions.json`: RETIRED → EXPERIMENTAL
3. Run: `npm run build`
4. Run: `node scripts/bundle-check.js` — verify budget
5. Run: `npm run docs:verify` — verify route dispositions
6. Commit and deploy

**Data impact:** None — route retirement is code removal only.

### Scenario 4: AI Census Rollback

**Trigger:** An AI narrative surface is found to be ungated.

**Steps:**
1. Add `verifyNarrative` gate to the surface
2. Run: `node scripts/ai-census.mjs` — must show 0 ungated
3. Run: `npm run docs:verify` — must PASS
4. Commit and deploy

**Data impact:** None — AI gating is code addition only.

## Verification Checklist

Before any release candidate ships:

- [ ] `tsc --noEmit` PASS (exit 0)
- [ ] `eslint src --max-warnings 0` PASS (exit 0)
- [ ] `npm run docs:verify` PASS
- [ ] `npm run docs:links -- --strict` PASS (0 broken)
- [ ] `node scripts/money-ast-detector.mjs` PASS (0 unsafe)
- [ ] `node scripts/money-adoption.mjs` PASS (ratchet holds)
- [ ] `node scripts/palette-ratchet.mjs` PASS (ratchet holds)
- [ ] `node scripts/ai-census.mjs` PASS (0 ungated)
- [ ] `node scripts/verify-readme-stats.mjs` PASS
- [ ] `node scripts/determinism-ratchet.mjs` PASS (ratchet holds)
- [ ] `node scripts/fabrication-detector.mjs` PASS (0 findings)
- [ ] `node scripts/verify-missing-is-not-zero.mjs` PASS (0 violations)
- [ ] `npm run skills:verify` PASS
- [ ] `npm run test:sharded` PASS (8/8 shards)
- [ ] Owner decisions O1-O9 either answered or recorded as BLOCKED-ON-OWNER
