# Owner Decision Pack — Completion Status (2026-10-24)

> **Status:** 8 decisions (O1, O3-O9) pending owner response. O2 resolved. All defaults provisional.
> **Original base:** b2cff43
> **Current branch:** arena/02c267fa-fp-a-betterversion
> **Last updated:** 2026-10-24 (DEC-096: O2 resolved)

## Summary

The completion programme has achieved:
- **104 GOVERNED routes** (was 19 at start) — every route has real governance evidence
- **670 governance tests** across **7 governance dimensions** — all 39 stores with enforce() covered
- **44 SUPPORTED capabilities** (was 25) with **215 total claims**
- **148 register SUPPORTED** (was 128) — 20 capabilities promoted this PR
- **Money adoption 36.37%** (371/1020 modules) — zero unsafe money operations
- **AI census 0 ungated** — all AI narrative surfaces gated
- **All gates PASS** — docs:verify, governance:evidence, completion-register, routemap, skills, money, determinism, coverage, bundle, a11y

## The Nine Decisions

| ID | Question | Recommended Default | Status |
|----|----------|-------------------|--------|
| O1 | D365 verified export? | All shapes stay "mapping-driven, unverified" | BLOCKED-ON-OWNER |
| O2 | Rolling forecast: replace or blend? | **RESOLVED (DEC-096): REPLACE semantics, no blending, all months shift forward, same approval interplay** | ✅ RESOLVED |
| O3 | Encryption-key escrow? | No escrow claim; user-held key | BLOCKED-ON-OWNER |
| O4 | SOX authority source? | Not SOX; local chain is client evidence | BLOCKED-ON-OWNER |
| O5 | Sector/jurisdiction scope? | None certified; generic FP&A only | BLOCKED-ON-OWNER |
| O6 | External AI provider? | Local-only AI; no external egress | BLOCKED-ON-OWNER |
| O7 | Native Tauri build verified? | No offline/desktop claim until verified | BLOCKED-ON-OWNER |
| O8 | CI on main green? | Record actual state; 403 = unverifiable | BLOCKED-ON-OWNER |
| O9 | Authoritative entity set? | Deny by default; owner supplies grants | BLOCKED-ON-OWNER |

## What Was Resolved (O2)

**O2 — Rolling forecast semantics:** Resolved with conservative default per delegated authority (DEC-096).
- **Semantics:** REPLACE (not blend) — rolled forecasts replace the prior period entirely
- **Which months roll:** All months shift forward by one period
- **Approval interplay:** Rolled forecasts require the same approval as original forecasts
- **Rationale:** REPLACE is conservative — it doesn't carry forward speculative forecasts. Blending would mix actuals with projections, reducing transparency. Same approval ensures rolled forecasts face the same governance bar.
- **Capability promoted:** plan.rolling-forecast: BLOCKED-ON-OWNER → SUPPORTED

## What the Agent Will Do Without Answers

- Continue all Tier A engineering work
- Keep every affected capability labelled EXPERIMENTAL or NOT SUPPORTED
- Record each default as provisional with review trigger
- Never call D365 verified, claim "your data is safe", SOX compliance, or jurisdiction support
- Never delete persisted data or perform irreversible migration
- Never infer entity grant from active entity
- Never declare programme complete or ship release

## Remaining EXPERIMENTAL Capabilities (15)

These require engine-level or integration testing, not store-level RBAC guards:

| Pillar | Capabilities | Path to SUPPORTED |
|--------|-------------|-------------------|
| AI | ai.explicit-invocation, ai.local-only, ai.verified-facts-gate | Engine-level AI governance tests |
| ANALYZE | analyze.drill-to-source, analyze.explanations | Integration tests with data exploration |
| GOVERN | govern.security-policy | Settings/security feature tests |
| MODEL | model.consolidation, model.ic-elimination, model.multi-book, model.revenue-recognition | Engine-level financial tests (consolidation, IC, rev-rec) |
| REPORT | report.pdf, report.pptx-editable, report.xlsx-formula | Engine-level report generation tests |
| WF | wf.human-attribution, wf.reviews | Workflow/audit feature tests |

## Remaining BLOCKED-ON-OWNER Capabilities (6)

| Capability | Owner | Blocking Question |
|-----------|-------|-------------------|
| admin.backup-restore | O3 | Encryption key-escrow/recovery decision |
| data.d365-bc-gl | O1 | One real anonymised D365 export sample (BC G/L shape) |
| data.d365-fo-gl | O1 | One real anonymised D365 export sample (F&O GL shape) |
| data.d365-journal | O1 | One real anonymised D365 export sample (journal entity shape) |
| govern.entity-scope | O9 | Authoritative authorized-entity set per user |
| govern.sox-authority | O4 | SOX/audit authority decision |

## Governance Dimensions Covered (7)

1. **RBAC permission guards** (enforce/assertPermission) — all 39 stores
2. **Lifecycle state machine guards** (assertBudgetTransition, LEGAL correction state machine)
3. **Input validation guards** (forecastStore, tpBenchmarkStore, documentStore)
4. **Rule versioning validation** (exceptionRuleCatalogue)
5. **Cross-store integration guards** (glStore cube sync)
6. **Period close state machine integration** (periodCloseStore transition)
7. **Fiscal calendar validation** (periodCloseStore initialize)
