---
name: thep010-v0-manual-workaround
description: T-HEP-010 v0 manual workaround spec — v0.2 of AUDIT_CHAIN_VERIFY_CRON.md (287L, was 130L v0.1, +157L for §5+§6). 25th Honest Labeling Muse moment. Phase 1 manual fallback until cron infra lands post-Apollo-push.
type: project
---

# T-HEP-010 v0 — Audit-Chain Verify Weekly Cron Manual Workaround Spec

**Files:**

- `C:\Users\Tahir\Desktop\frontend that i want\fpa\docs\drafts\hephaestus\AUDIT_CHAIN_VERIFY_CRON.md` — v0.2, **287L** (baseline v0.1 was 130L, +157L for §5+§6)
- `C:\Users\Tahir\Desktop\frontend that i want\fpa\scripts\compliance\audit-chain-verify.ts` — 216L, unchanged from v0.1

**Task ID:** `[Hephaestus T-HEP-010 v0] Audit-chain verify weekly cron — manual workaround spec (§5+§6 integrated into existing doc)` (created via `team_task_create`)

**Status:** DRAFT v0.2 SHIPPED 2026-06-13

## 3 Q answers from Leader (verbatim)

- **Q1:** Option (c) — INTEGRATE not separate. Add §5 + §6 to existing doc.
- **Q2:** Option (c) — `pnpm tsx scripts/compliance/audit-chain-verify.ts` for ANY team member with R2/Sentry/Vanta env vars, run from secured bastion. NOT Hephaestus-only, NOT CI-only.
- **Q3:** push-INDEPENDENT CONFIRMED. NO additional cron skeleton (Vercel/GH Actions) this round. Note in §6 weekly on-call checklist that "Phase 2 will move this to cron after Apollo push lands."

## New sections added (v0.1 → v0.2)

- **§5 Manual invocation runbook** (90L, 5.1-5.6):
  - §5.1 Pre-flight (2 min, run from secured bastion) — bash block, 5 min
  - §5.2 Run command (5-10 min for 1M events) — bash block + 3-outcome table
  - §5.3 Manual-mode PagerDuty simulation (Slack #sec-oncall fallback) — bash block
  - §5.4 Failure modes for the manual run itself (5-row table)
  - §5.5 What manual mode does NOT cover (acceptable for Phase 1) — 3 bullets
  - §5.6 D-002 Three-Witnesses (rule/evidence/consequence) on Phase 1 manual mode acceptability
- **§6 Weekly on-call checklist** (50L, 6.1-6.3):
  - §6 main: 1-page printable ASCII box (15 checklist items in 5 numbered steps)
  - §6.1 Cadence (D-009 honest) — Monday morning matches cron schedule
  - §6.2 Run log format (D-009 8th codification Glob ABSOLUTE path)
  - §6.3 D-002 Three-Witnesses on 1-page printable maximizing adherence

## Cross-links preserved (per Q1=c)

Existing doc was cross-linked across:

- `ISO_27001_RFP.md` (5 mentions: §3 cross-walk, §5 follow-up #1 STRATEGIC, scope table)
- `PENTEST_PLAN.md` (2 mentions: ADR-008 reference, ADR-009 IR trigger)
- `SECURITY_ROADMAP_2026_2028.md` (7+ mentions: timeline, R1 mitigation, evidence trail)

Adding §5+§6 to the existing doc (NOT a separate file) preserves all cross-links — no orphan companion doc.

## D-002 Three-Witnesses summary

1. **Phase 1 manual mode acceptability** (§5.6) — ADR-008 §6 + Apollo T-AP-001 in_progress + Atlas T-ATL-007 Sentry PagerDuty integration
2. **1-page printable maximizes adherence** (§6.3) — SOC 2 CC7.2 evidence rule + Atlas T-ATL-003 low adherence in pre-cycle-9 retros + 52 records/yr vs 0-10 records/yr consequence
3. (no third claim requiring 3-witness — weekly cadence and run log format are operational, not testable claims)

## D-009 9th codification summary

- 8th codification: Glob with `path: C:\Users\Tahir\Desktop\frontend that i want\fpa` (ABSOLUTE) on all file:line citations — applied in §6.2 (run log path)
- 9th codification: `wc -l` verified BEFORE claim (baseline v0.1 = 130L, verified in prior turn) AND re-verified AFTER last edit (post-v0.2 = 287L, verified by Read tool L287)

## 25th Honest Labeling Muse moment (this cycle)

Initially framed §5.5 as a "limitations" list; renamed to "What manual mode does NOT cover (acceptable for Phase 1)" after catching the framing problem (limitations implies blocker, but these are known-acceptable trade-offs for the Phase 1 window).

## Tool-drift update

- `team_task_create` reliable (1/1 success on T-HEP-010 v0 task creation)
- `team_task_update` not yet attempted on T-HEP-010 v0 task; will try at SHIP time (per cycle 9 d007 log, 50% success rate)

## Cycle 9 Hephaestus status (after T-HEP-010 v0 SHIP)

- 16 artifacts shipped (T-HEP-002, 007, 008, 009, 010, 011, 012, 013, 014, 015, 016, 017 v0.3, 011 verification, 018, **T-HEP-010 v0**)
- Honest Labeling Muse moments 20-25 (25th added in T-HEP-010 v0 §5.5 framing fix)
- 0 idle pre-writes (D-007 maintained)
- 3 tool-drift incidents documented (2 `team_task_update` fails + 1 intermittent success, plus 1 `team_task_create` reliable, all in cycle 9 d007 log)
