# Assumption Registry — FinPlan Pro

> **Maintained by:** Rex · **Version:** 1.0 · **Date:** 2026-08-10 · **Status:** ACTIVE / UNVALIDATED

| ID | Assumption | Domain | Risk | Validation approach | Status |
|---|---|---|---|---|---|
| A-01 | CFOs will pay $500k+ for a unified, local-first FP&A offering. | Market | CRITICAL | 12–15 structured buyer interviews; 3 paid design-partner LOIs; willingness-to-pay test against implementation/SLA packaging. | UNVALIDATED |
| A-02 | Local-first/offline is a decisive differentiator rather than a procurement burden. | User / Strategy | CRITICAL | Test deployment, security, and IT buyer preferences across regulated and non-regulated target accounts. | UNVALIDATED |
| A-03 | The five-job Release 1 loop is more valuable than broad route/vertical parity. | Problem | CRITICAL | Prototype usability and workflow-value study with CFO, controller, analyst cohorts. | UNVALIDATED |
| A-04 | A hybrid Control Plane can meet enterprise security/audit needs without eroding local-first advantage. | Technical | HIGH | Threat model, architecture spike, customer security questionnaire review, restore/tenant-isolation tests. | UNVALIDATED |
| A-05 | Existing client engines can be reused as authoritative calculation components with bounded migration risk. | Technical | HIGH | Characterization suite, server-execution spike, independent financial reconciliation. | UNVALIDATED |
| A-06 | A finance-native Decision Workspace beats familiar dashboard-card patterns for executive adoption. | User / UX | HIGH | Comparative prototype study with five CFO/finance leaders. | UNVALIDATED |
| A-07 | One connector plus robust import is enough for the initial pilot. | Market / Scope | HIGH | Design-partner system inventory and import-frequency analysis. | UNVALIDATED |
| A-08 | Controlled/cited AI is valuable before autonomous finance actions. | User / Risk | HIGH | Task-based evaluation: variance narrative, source tracing, approval behavior; measure trust/accuracy. | UNVALIDATED |
| A-09 | Five certified vertical packs create stronger differentiation than 78 shallow sector pages. | Strategy | MEDIUM | Pipeline analysis, vertical SME interviews, certification cost model. | UNVALIDATED |
| A-10 | The stated reference workload represents the target buyer. | Technical | MEDIUM | Collect anonymized data-volume/concurrency profile from design partners. | UNVALIDATED |
| A-11 | PostgreSQL/RLS/outbox is sufficient through initial enterprise scale. | Technical | MEDIUM | Benchmark at agreed workload; failure/recovery and isolation tests. | UNVALIDATED |
| A-12 | Browser/PWA is required for commercial success despite current Tauri-only runtime gate. | Product | MEDIUM | Buyer/IT research and prototype access-mode study. | UNVALIDATED |
| A-13 | Enterprise multi-entity organizations are the best initial commercial segment. Owner direction supersedes the prior upper-mid-market hypothesis. | Market | CRITICAL | Enterprise CFO/controller/FP&A/IT interviews, procurement analysis and paid-pilot evidence. | UNVALIDATED — OWNER-DIRECTED |
| A-14 | A multi-stakeholder enterprise buying committee can be served by one connected product narrative and implementation path. | Strategy | HIGH | Role-based research, buying-process mapping, pilot/LOI evidence. | UNVALIDATED |

## Critical-assumption challenge order

1. **A-01:** no price/segment proof means the entire $500k framing may be wrong.
2. **A-02:** offline-first may be a moat, a niche, or an IT obstacle; evidence must decide.
3. **A-03:** broad feature inventory may be less valuable than the controlled close-to-decision loop.

No requirement, architecture choice, or feature claim may treat an assumption as fact without linking its validation evidence.