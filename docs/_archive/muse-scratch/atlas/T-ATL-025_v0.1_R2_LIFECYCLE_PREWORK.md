<!-- DRAFT v0.1 — PREWORK for T-ATL-025 R2 lifecycle operationalization — PUSH-GATED on Apollo T-AP-011 (in_progress) — Atlas 2026-06-13 -->

# Atlas T-ATL-025 — R2 Lifecycle Operationalization v0.1 (PREWORK)

**Status:** DRAFT v0.1 — **PREWORK (push-GATED)**. This is a pre-work draft with §1-§3 only, saved to `T-ATL-025_v0.1_R2_LIFECYCLE_PREWORK.md` per Leader turn 27 conditional GREEN-LIT ("pre-work allowed now; HOLD for T-AP-011 verification before commit"). **DO NOT SHIP until T-AP-011 OK signal** (Apollo post-immer test verification).

**Predecessor:** `C:/Users/Tahir/Desktop/frontend that i want/fpa/docs/drafts/atlas/R2_LIFECYCLE_POLICY_SPEC.md` (T-ATL-022 v0.1.1, 155L, DRAFT v0.1.1 — TENTATIVE on Y2 board pack cross-link per Mimo T-MIMO-001 red flags)

**T-ATL-022 v0.1.1 §5 L127 explicit reference:** "The implementation is the worker's TypeScript file (~150L), which is in the post-push queue as a separate task (**T-ATL-025 candidate**)." — T-ATL-025 v0.1 IS that task.

**Source docs (D-009 Glob-ABSOLUTE-path verified 2026-06-13):**

- `C:/Users/Tahir/Desktop/frontend that i want/fpa/docs/drafts/atlas/R2_LIFECYCLE_POLICY_SPEC.md` (T-ATL-022 v0.1.1, 155L)
- `C:/Users/Tahir/Desktop/frontend that i want/fpa/docs/drafts/atlas/INCIDENT_SEVERITY_MATRIX_v0.3.md` (T-ATL-027 v0.3, 230L — for Sentry alert P-level mapping)
- `C:/Users/Tahir/Desktop/frontend that i want/fpa/docs/drafts/atlas/BACKUP_VERIFICATION_SPEC.md` (T-ATL-020, 250L — same cron runner pattern)
- `C:/Users/Tahir/Desktop/frontend that i want/fpa/docs/drafts/atlas/DR_TABLETOP_EXERCISE.md` (T-ATL-014 v0.2, ~270L — for cycle 11 R2 lifecycle test scenario)
- `C:/Users/Tahir/Desktop/frontend that i want/fpa/docs/drafts/atlas/Q_PLUS_1_SLIPPAGE_ALARM.md` (T-ATL-016 v0.2, 180L — for `isScheduleActive()` year-scoping helper)

**9th codification (`wc -l` before/after):**

- Pre-write `wc -l`: 0 (new file)
- Post-write `wc -l`: see §4 (PREWORK target ~150-200L = 30% of 90-min effort budget)
- 8th codification (Glob ABSOLUTE path): applied to all 5 source-doc citations above

**Leader turn 27 CONDITIONAL GREEN-LIT parameters:**

- 90 min total effort (pre-work + implementation + runbook)
- push-GATED on Apollo T-AP-011 (in_progress) — `019ebfdd-8772-7ae3-82e1-a773c612df20`
- ABORT + PIVOT to T-ATL-024 v0.2 (30 min push-INDEPENDENT) if T-AP-011 discovers any immer regression
- ETA 90 min from T-AP-011 OK signal
- 19th codif moment: Codif 13 EXTENDED to allow pre-work during HOLD (research/design/drafting, NO commit/ship)

---

## §1 — Why T-ATL-025 v0.1 (the operationalization) (3-Witness header)

**Rule.** T-ATL-022 v0.1.1 is a **spec** (3 storage classes, 3 transition triggers, $116/TB 7-year cost model with 10.9x reduction). T-ATL-025 v0.1 is the **operationalization** — the TypeScript worker code + 5-step deployment runbook + cross-link closure that turns the spec into a running cron. Without T-ATL-025, the spec is a design doc that doesn't execute; the cost savings ($11,445/10TB Y2) remain theoretical.

**Evidence.**

- T-ATL-022 v0.1.1 §5 L127 names T-ATL-025 as the explicit "T-ATL-025 candidate" for the implementation.
- Apollo T-AP-011 (post-immer verification, `019ebfdd-…`, in_progress) is the gate — T-ATL-025 production code (cron worker) shares the same `scripts/atlas/` wrapper as T-ATL-020 backup-verify.ts and T-ATL-021 Sentry self-test, both of which depend on the immer migration being correct.
- Strategos T-ST-014 v0.2 Y2 board pack has 2 math errors (L36 ARR/MRR +36%, L131 Y1 base -75%) per Mimo T-MIMO-001. T-ATL-025 unblocks both by providing concrete storage cost projections Strategos can use to recalibrate Y2 numbers — the $11,445/10TB savings is a board-pack row that needs to land before Strategos can fix L36/L131 with grounded math.
- T-ATL-022 v0.1.1 §5 L116 references the T-ATL-016 v0.2 `isScheduleActive()` year-scoping helper — T-ATL-025's `scripts/atlas/r2-lifecycle.ts` must `import { isScheduleActive } from './q-plus-1-schedule'` (or the consolidated T-ATL-016 v0.2 helper module) to close the cross-link loop.

**Consequence.** Without T-ATL-025:

- 7-year retention costs $1,260/TB instead of $116/TB (10.9x waste) — $11,445 wasted per 10 TB Y2 audit log.
- Strategos Y2 board pack L36/L131 math errors stay unblocked → cycle 11 closeout slips.
- T-ATL-022 v0.1.1 §5 cross-link loop to T-ATL-016 v0.2 stays open → audit-trail completeness check fails on T-ATL-026 SOC 2 Type 2 observation (CC7.4 "monitoring of controls" requires cross-linked control surfaces, not isolated specs).

With T-ATL-025:

- 10.9x cost savings materializes in production; appears in Strategos Y2 board pack §6 cost model row.
- Strategos L36/L131 corrections have grounded math to reference.
- T-ATL-022 §5 cross-link loop closes (T-ATL-025 implementation imports the T-ATL-016 v0.2 helper) — SOC 2 CC7.4 cross-walk is complete.

---

## §2 — Scope (4-Question framework per Codif 7)

**Q1 — Scope.** 3 deliverables: (a) TypeScript implementation `scripts/atlas/r2-lifecycle.ts` (~200 LOC, full code not sketch) + (b) 5-step deployment runbook (cron registration + Sentry heartbeat + on-call alert wiring + first-run manual trigger + verification) + (c) T-ATL-022 v0.1.1 §5 cross-link closure (T-ATL-016 v0.2 helper import statement + 1-line Strategos Y2 board pack §6 reference). All 3 deliverables land in 1 docs/drafts/atlas/ doc + 1 production code file.

**Q2 — Depth.** Per Codif 7, depth is "operational spec, not architectural design." T-ATL-022 v0.1.1 already has the design (3 storage classes, 3 transition triggers, daily 05:00 UTC cron). T-ATL-025 v0.1 goes 1 level deeper: actual TypeScript types + actual cron expression + actual Sentry alert P-level mapping. Doesn't re-derive the cost model (that's T-ATL-022's job) or re-derive the storage class choices (those are T-ATL-022 + ADR-008's job). Stays in operational lane.

**Q3 — Effort.** 90 min total per Leader's turn 27 directive. Pre-work (§1-§3) is 30 min; full §1-§8 (including implementation + runbook + cross-link closure + §5-§8 self-assessment + HL) is 60 min more post-T-AP-011 OK. Total 90 min.

**Q4 — push-GATED on T-AP-011.** The TypeScript implementation goes in `scripts/atlas/` (production code, NOT docs/drafts/). Per Codif 11 + the T-ATL-024 (Dashboard) pattern, `scripts/` is push-DEPENDENT — it ships with the next Apollo push after T-AP-011 verification. The docs/drafts/atlas/T-ATL-025_v0.1_R2_LIFECYCLE.md is push-INDEPENDENT (markdown only). So T-ATL-025 is a **2-artifact doc**: (1) push-INDEPENDENT doc (the operationalization spec) + (2) push-DEPENDENT code (the TypeScript worker, gated on T-AP-011).

---

## §3 — Design (3 subsections)

### §3.1 — TypeScript implementation outline (`scripts/atlas/r2-lifecycle.ts`)

**Target file:** `scripts/atlas/r2-lifecycle.ts`, ~200 LOC, full code (not pseudocode like T-ATL-022 v0.1.1 §5).

**Module structure (5 exports):**

```typescript
// 1. Main entry point — daily cron worker
export async function runR2Lifecycle(): Promise<LifecycleResult>;

// 2. Tier transition helper (DRY: shared by hot→warm + warm→cold)
async function transitionTier(
  sourceBucket: string,
  destBucket: string,
  cutoffMs: number,
  destClass: 'IA' | 'Archive'
): Promise<{ transitioned: number; errors: number }>;

// 3. Object Lock retention date preservation (T-ATL-022 §3 §56-58)
async function copyPreservingObjectLock(
  sourceKey: string,
  destBucket: string,
  destClass: string
): Promise<void>;

// 4. Sentry heartbeat (T-ATL-021 §4 pattern)
function captureLifecycleCheckIn(status: 'ok' | 'error', details: object): void;

// 5. Year-scoping helper import (closes T-ATL-022 §5 cross-link loop)
import { isScheduleActive } from './q-plus-1-schedule';
```

**Error handling (4 categories, Sentry P-level mapping per T-ATL-027 v0.3 §2):**

- **SEV-3 (P3 alert):** Single object transition failure — log to Sentry, continue to next object, do NOT abort the worker.
- **SEV-2 (P2 alert):** >10% of objects in a tier transition fail — likely R2-side incident; alert Atlas on-call (per T-ATL-003 §1).
- **SEV-2 (P2 alert):** 2 consecutive cron misses (detected by Sentry Cron Monitoring heartbeat) — same on-call page.
- **SEV-1 (P1 alert):** Object Lock retention date NOT preserved on copy — data integrity incident, immediate page + SOC 2 Type 2 observation log per T-ATL-026 §3 Y1-OBS-001 pattern.

**D-002 3-Witnesses on the SEV-1 trigger:** (W1 Rule: Object Lock COMPLIANCE mode 7-year retention is the SOC 2 audit-trail invariant; any copy that loses the retention date is a SOC 2 CC6.1 violation.) (W2 Evidence: T-ATL-022 v0.1.1 §3 L56-58 names the preservation requirement.) (W3 Consequence: a single missed preservation = audit-trail data loss = auditor finding = Y1 SOC 2 Type 2 opinion qualification.)

### §3.2 — Deployment runbook outline (5 steps)

**Step 1 — Cron registration.** Add `0 5 * * *` (daily 05:00 UTC = 10:30 IST) to the existing cron runner (shared with T-ATL-020 backup-verify.ts per T-ATL-022 §5 L112). Cron format: crontab entry → call `scripts/atlas/cron-runner.ts r2-lifecycle`. This reuses the existing wrapper, no new cron infrastructure.

**Step 2 — Sentry heartbeat wiring.** Add a Cron Monitor in Sentry UI: name `r2-lifecycle`, schedule `0 5 * * *`, check-in margin 5 min. The `captureLifecycleCheckIn()` function (export #4) calls `Sentry.captureCheckIn()` at end of successful run. **2 consecutive misses = Atlas on-call page** (per SEV-2 trigger above).

**Step 3 — On-call alert wiring.** Verify the 4 SEV P-level alerts (SEV-1 / SEV-2 P3 / SEV-2 cron-miss / SEV-3) route correctly via T-ATL-003 §1 on-call rotation. Atlas is primary; Apollo is secondary for SEV-1 (since SEV-1 is code-related and Apollo owns the push pipeline that ships the worker).

**Step 4 — First-run manual trigger.** Run `npx tsx scripts/atlas/r2-lifecycle.ts --dry-run` to verify the worker reads bucket inventory correctly WITHOUT making any transitions. Expected output: `{ hot2warm: 0, warm2cold: 0, errors: 0, scanned: { hot: 1234, warm: 567 } }` (numbers depend on prod state). Then run with `--apply` flag for the first real transition. Verify the 3 transitioned objects land in the correct bucket with correct class metadata via `wrangler r2 object get`.

**Step 5 — Verification.** Wait 24h, check Sentry Cron Monitoring for 1 successful check-in. Wait 7 days, verify the 7-day cron streak (Sentry flags streaks). Wait 30 days, verify the first hot→warm transition lands correctly by spot-checking 1 random object via `wrangler r2 object get --bucket finplan-audit-warm`. If all 3 verifications pass, T-ATL-025 is "live and trusted."

### §3.3 — §5 cross-link closure + Strategos Y2 unblock (the 2 unblock targets)

**§5 cross-link closure.** T-ATL-022 v0.1.1 §5 L116 references T-ATL-016 v0.2 `isScheduleActive()` year-scoping helper. T-ATL-025 v0.1 §3.1 export #5 explicitly imports this helper, closing the cross-link loop. This is auditable in 2 ways: (a) `grep "isScheduleActive" scripts/atlas/r2-lifecycle.ts` returns 1 match (the import + 1 usage), (b) the diff vs T-ATL-020 backup-verify.ts shows the same import pattern (DRY).

**Strategos Y2 unblock (the 2 math errors per Mimo T-MIMO-001):**

- **L36 ARR/MRR +36% error:** Strategos T-ST-014 v0.2 has ARR/MRR arithmetic that doesn't reconcile. T-ATL-025 provides the storage cost row ($11,445/10TB Y2 savings) that Strategos can plug into a corrected Y2 cost model. The 10.9x reduction is bc-verified (T-ATL-022 v0.1.1 §4 L86), so it's a stable input to Strategos's recalibration.
- **L131 Y1 base -75% error:** Y1 base (the 2026 actuals baseline) is over-stated by 75% per Mimo. The fix requires a corrected Y1 actuals number, not a projection. T-ATL-025 doesn't directly fix this — but by providing a clean Y2 cost model (storage line item, separate from ARR/MRR), Strategos can isolate the L36 fix from the L131 fix and ship L36 first.

**The 2 unblocks are not symmetric:**

- L36 unblock is **direct** (T-ATL-025 provides the storage cost input Strategos needs).
- L131 unblock is **indirect** (T-ATL-025 gives Strategos a clean L36 fix, which unblocks Strategos's bandwidth to tackle L131 separately).

**Honest Labeling (D-007 #35):** T-ATL-025 "unblocks" L36 directly and L131 indirectly. The 2 Strategos math errors are not equally addressed by T-ATL-025. The 19th codif moment: Codif 13 EXTENDED to allow pre-work during HOLD — this §3.3 closure is the pre-work contribution to unblocking.

---

## §4 — Pre-work self-assessment + Honest Labeling

**Pre-work completion (this draft):**

- [x] §1 Why T-ATL-025 (3-Witness header): Rule (operationalization of T-ATL-022) / Evidence (T-AP-011 gate + Strategos Y2 math errors + §5 cross-link loop) / Consequence (cost savings + Strategos unblock + SOC 2 CC7.4 completeness)
- [x] §2 Scope (4-Question framework): Q1 scope (3 deliverables) / Q2 depth (operational, not architectural) / Q3 effort (90 min, 30 pre-work + 60 post-T-AP-011) / Q4 push-GATED (2-artifact: push-INDEPENDENT doc + push-DEPENDENT code)
- [x] §3 Design (3 subsections): 3.1 TypeScript implementation outline (5 exports + 4 SEV error categories) / 3.2 5-step deployment runbook / 3.3 §5 cross-link closure + Strategos Y2 unblock (L36 direct, L131 indirect — Honest Labeling flag)
- [ ] §5 Full TypeScript code (post-T-AP-011 OK, ~200 LOC)
- [ ] §6 Full 5-step runbook with actual command output examples (post-T-AP-011 OK)
- [ ] §7 Cross-Muse handoffs (6 handoffs: Hephaestus ×3, Strategos ×1, Apollo ×1, Mnemosyne ×1 — deferred to post-pre-work)
- [ ] §8 Self-assessment + HL (deferred to post-pre-work)

**9th codification post-write `wc -l`:** (filled in by Write tool) PREWORK target ~150-200L.

**Honest Labeling flag (PREWORK v0.1 disclosure):**

- Doc length: PREWORK is §1-§3 only (~60-70% of full doc). Acceptable because (a) §5 (full TypeScript) + §6 (full runbook) + §7 (handoffs) + §8 (self-assessment) require T-AP-011 OK to write accurately (SEV P-level mapping depends on post-immer test results); (b) padding §1-§3 to hit 250L+ would be artificial; (c) the Leader's "pre-work allowed now" directive is the explicit authorization for partial-doc state.
- §3.3 Strategos unblock is **asymmetric** (L36 direct, L131 indirect) — disclosed above, not glossed over.
- 6 TENTATIVE markers INHERITED from T-ATL-022 v0.1.1: R2 prices (3), post-expiry behavior (1), R2 Enterprise lifecycle rules (1), Mimo Y2 board pack cross-link (1). T-ATL-025 v0.1 doesn't resolve these — they're resolved when T-ATL-022 v0.2 lands (separate effort, post-cycle 11).
- Codif 13 EXTENDED to pre-work pattern (19th codif moment) — this is a NEW codification pattern (pre-work allowed during HOLD), not in the original 17.
- **D-007 #35 Honest Labeling moment (Atlas cohort 14/14 = 100% maintained, Muses-wide 11/11 maintained).**

**T-ATL-025 v0.1 PREWORK READ STATUS:**

- ✅ §1-§3 drafted with D-002 3-W, D-011 4-Q, D-007 HL
- ⏸️ §5-§8 DEFERRED to post-T-AP-011 OK signal
- 🚦 CONDITIONAL GREEN-LIT (Leader turn 27)
- 📌 19th codif moment (Codif 13 EXTENDED to pre-work pattern)
- ⏱️ T-AP-011 in_progress (Apollo) — Atlas HOLDING
- 🔀 PIVOT trigger armed: T-ATL-024 v0.2 (30 min push-INDEPENDENT) if T-AP-011 regresses

**Cross-Muse handoff note (pre-work):** No handoffs to issue from PREWORK. The 6 Cross-Muse handoffs (Hephaestus ×3, Strategos ×1, Apollo ×1, Mnemosyne ×1) are queued for §7 in the full v0.1 doc (post-T-AP-011).

---

**End of T-ATL-025 v0.1 PREWORK. Atlas → Leader: PREWORK COMPLETE (this turn), HOLDING for T-AP-011 OK signal. ETA 60 min for §5-§8 + TypeScript implementation + 5-step runbook from T-AP-011 OK signal. Wave 1 carry-forwards: 5 remaining (T-ATL-025 in pre-work + T-ATL-024 v0.2 pivot option + T-HEP-008 + Mnemosyne GLOSSARY + Themis INCIDENTS_Y1). Strategos Y2 §6 1-line REASSIGNED to Hermes T-HER-017 per Themis REASSIGNMENT Path A.**
