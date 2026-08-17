---
id: MEMORY/HYPOTHESES.md
status: active
last_verified: 2026-08-18
verified_by: arena-agent/session-017
confidence: medium
---

# HYPOTHESES — testable guesses

```
[H-001] Other pages besides DashboardPage accumulate `debit - credit` into a
        variable named `revenue`, i.e. the sign-inversion class is systemic.
  confidence: 0.6
  experiment: grep for `revenue +=`, `revenue:` near `debit - credit` across
              src/pages and src/engines; render a seeded ledger and assert the
              sign of each displayed revenue figure.
  pass/fail: >=1 additional surface plots revenue negative -> confirmed.
  status: open

[H-002] A "raw float across a format boundary" detector would find live defects
        beyond ProfessionalExportEngine's autoTable rows.
  confidence: 0.7
  experiment: prototype a type-aware AST rule: number-typed expression flowing
              into a formatter/renderer argument without a money helper.
  pass/fail: >=1 non-export-engine hit that prints an unrounded float.
  status: open  (tracked as W0.1.6 type-based detection)

[H-003] Several `*Engine.calculateStats` methods are dead code that only survive
        because no page calls them (Construction 1.5x backlog, Insurance 0.85x /
        360, Retail 254 / 92.8, RealEstate 4.2 / 94.8 / 6.2).
  confidence: 0.75
  experiment: scripts/engine-reachability.mjs + grep for call sites.
  pass/fail: zero non-test call sites -> delete or rewrite, do not leave armed.
  status: open

[H-004] HealthcareEngine.calculatePatientRevenue's `daysInAR` 30-day divisor and
        `cashCollected = sum(prefix 11)` misstate the metric for any ledger whose
        period is not a calendar month or whose cash accounts include non-patient
        receipts.
  confidence: 0.8
  experiment: seed a two-month ledger; compare daysInAR against a hand-computed
              value using actual period length and patient-only collections.
  pass/fail: divergence -> the metric must be disclosed, not displayed.
  status: open
```
