---
id: MEMORY/INVARIANTS.md
status: active
last_verified: 2026-08-18
verified_by: arena-agent/session-017
confidence: medium
---

# INVARIANTS — must remain true

`enforced_by: NONE` on a P0 is itself a defect; queue a test for it in `TASKS/QUEUE.md`.

```
[INV-001] All money arithmetic goes through src/utils/money.ts (decimal.js,
          precision 40, ROUND_HALF_UP). No IEEE-754 + - * / on a currency value.
  enforced_by: scripts/money-ast-detector.mjs (pre-push gate 9b, ratchet only)
  severity: P0
  note: ratchet caps regression; 489 unsafe ops remain, so this is NOT yet global.

[INV-002] No displayed financial figure may be a hand-typed literal.
  enforced_by: scripts/fabrication-detector.mjs (pre-push gate 9c) + per-module
               source guards
  severity: P0
  note: the detector sees `$12.4M` / `24.3%` in a `value:` property; it does NOT
        see `pretax * 0.7`, `taxRate: 21`, `denialRate: 4.2`.

[INV-003] Natural balance decides sign; per-entry Math.abs is banned.
          revenue (4) = credit - debit; cost (5,6,7,8) = debit - credit.
  enforced_by: per-module tests only (creditRiskData, dashboardModel, ...)
  severity: P0

[INV-004] A ratio is emitted only when its denominator genuinely exists on the
          posted GL. Otherwise null / an empty state. No fallback constants.
  enforced_by: per-module tests
  severity: P0

[INV-005] A figure the GL cannot support is disclosed as unavailable, never
          estimated, and never laundered through a correct engine.
  enforced_by: per-module DOM probes
  severity: P0

[INV-006] currency0 renders '—' for 0 and null.
  enforced_by: src/hooks/useCurrencyFormatter + its tests
  severity: P1

[INV-007] Account prefixes: 1 Asset, 2 Liability, 3 Equity, 4 Revenue, 5 COGS,
          6 OpEx, 7 Interest, 8 Income tax. No other split is inferable.
  enforced_by: NONE (convention documented in module headers)
  severity: P1

[INV-008] Industry vertical packs must not fork the core engine (K19).
  enforced_by: scripts/architecture-guardrails.mjs (scope unverified)
  severity: P1

[INV-009] No IEEE-754 money persisted to any store or DB.
  enforced_by: NONE  <-- Phase 0 exit requirement, test not written
  severity: P0

[INV-010] Multi-tenant isolation: tenant_id / environment_id on every financial
          row, with a per-table leak test.
  enforced_by: NONE  <-- `tenant` has 0 hits in server/src/db/ (see GAPS)
  severity: P0

[INV-011] A gate is never lowered to pass it (Codex §22.6); gate changes need an ADR.
  enforced_by: human review
  severity: P0
```
