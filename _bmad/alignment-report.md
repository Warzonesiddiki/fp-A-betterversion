# PRD ↔ Architecture Alignment Report

> **Status:** COMPLETE — reviewed during Phase 4a on 2026-08-10; re-baselined 2026-08-10 (YOLO mode)
> **Inputs:** approved PRD G2, UX G3, Architecture G4

> **v2.1 rebaseline note:** Verdict unchanged (ALIGNED WITH EXPLICIT DECISIONS REQUIRED). All five open decisions remain open and correctly gated by research/evidence: design partner + first connector, deployment/residency model, browser/PWA support level, pilot vertical/workflow, named business owners.

## Verdict

**ALIGNED WITH EXPLICIT DECISIONS REQUIRED BEFORE IMPLEMENTATION.** No PRD epic lacks an architectural owner. No architectural decision adds an unapproved product capability. The issues below are decision dependencies, not permission to improvise.

| PRD / UX requirement                               | Architecture coverage               | Alignment | Required action                                                   |
| -------------------------------------------------- | ----------------------------------- | --------- | ----------------------------------------------------------------- |
| E1 global context, five-pillar shell, trust states | Architecture §§2, 3, 6, 7; UX §§3–4 | Aligned   | Establish typed FinancialContext contract before UI migration.    |
| E2 identity, tenancy, audit evidence               | Architecture §§4–5, 8               | Aligned   | Decide IdP/deployment/residency before production implementation. |
| E3 master data/import                              | Architecture §§4–6, 9               | Aligned   | Select first connector/design partner before connector story.     |
| E4 close/consolidation                             | Architecture §§4–5, 9               | Aligned   | Define pilot consolidation scope, ownership and FX policies.      |
| E5 planning/grid/offline                           | Architecture §§3, 6–7               | Aligned   | Agree conflict policy and official server-calculation boundary.   |
| E6 decision workspace                              | Architecture §§2, 4, 6              | Aligned   | Define materiality configuration ownership.                       |
| E7 reports/snapshots                               | Architecture §§4–6                  | Aligned   | Define report certification/distribution policy.                  |
| E8 operations/recovery                             | Architecture §§9–10                 | Aligned   | Fund SRE/operations responsibility and RPO/RTO commitment.        |
| UX desktop/tablet/mobile boundary                  | Architecture §7 and §10             | Aligned   | Approve browser/PWA vs desktop-first support matrix.              |
| Controlled AI / vertical packs                     | Architecture §§8–9, ADR-E08         | Aligned   | Deferred post-Release 1; no implementation in Pack A.             |

## Conflicts resolved

1. **Old broad stack prompt vs. current architecture:** Resolved in favor of incremental PostgreSQL/control-plane adoption; no mandated big-bang Next/Fastify/Kafka/multi-DB rewrite.
2. **Local-first vs. authoritative financial operations:** Resolved: local is cache/draft; official commands are server-authorized and audited.
3. **Breadth vs. supported product claim:** Resolved: capability matrix maturity is the commercial truth source; only certified workflows are supported.

## Blocking decisions tracked for G5

- [OPEN DECISION] Design partner and first production connector.
- [OPEN DECISION] Managed cloud, customer-managed, or hybrid deployment/residency model.
- [OPEN DECISION] Browser/PWA support level, given current Tauri-only runtime gate.
- [OPEN DECISION] Pilot vertical and exact first close/planning workflow.
- [OPEN DECISION] Named business owners for materiality, FX, report certification, close exceptions, and SoD policy.

These decisions may be resolved while foundational stories run only if they do not change an approved story’s acceptance criteria. Otherwise the story must be amended and reapproved.
