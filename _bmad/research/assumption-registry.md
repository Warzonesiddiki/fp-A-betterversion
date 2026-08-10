# Assumption Registry — FinPlan Pro

> **Maintained by:** Rex · **Version:** 2.0 · **Date:** 2026-08-10 · **Status:** ACTIVE / UNVALIDATED
> **v2.0 rebaseline:** Re-baselined in a new session under YOLO mode. No market assumption changed status — the only new evidence is technical/environmental (E-004 full-suite verification, E-005 CI billing block), which does **not** validate any buyer/market/deployment assumption. Evidence links column added.

| ID | Assumption | Domain | Risk | Validation approach | Status | Evidence links |
|---|---|---|---|---|---|---|
| A-01 | CFOs will pay $500k+ for a unified, local-first FP&A offering. | Market | CRITICAL | 12–15 structured buyer interviews; 3 paid design-partner LOIs; willingness-to-pay test against implementation/SLA packaging. | UNVALIDATED | none (E-001 owner direction only) |
| A-02 | Local-first/offline is a decisive differentiator rather than a procurement burden. | User / Strategy | CRITICAL | Test deployment, security, and IT buyer preferences across regulated and non-regulated target accounts. | UNVALIDATED | E-003 secondary signals only |
| A-03 | The five-job Release 1 loop is more valuable than broad route/vertical parity. | Problem | CRITICAL | Prototype usability and workflow-value study with CFO, controller, analyst cohorts. | UNVALIDATED | E-003 secondary signals only |
| A-04 | A hybrid Control Plane can meet enterprise security/audit needs without eroding local-first advantage. | Technical | HIGH | Threat model, architecture spike, customer security questionnaire review, restore/tenant-isolation tests. | UNVALIDATED | none |
| A-05 | Existing client engines can be reused as authoritative calculation components with bounded migration risk. | Technical | HIGH | Characterization suite, server-execution spike, independent financial reconciliation. | UNVALIDATED | E-004 (suite health only, not engine authority) |
| A-06 | A finance-native Decision Workspace beats familiar dashboard-card patterns for executive adoption. | User / UX | HIGH | Comparative prototype study with five CFO/finance leaders. | UNVALIDATED | none |
| A-07 | One connector plus robust import is enough for the initial pilot. | Market / Scope | HIGH | Design-partner system inventory and import-frequency analysis. | UNVALIDATED | none |
| A-08 | Controlled/cited AI is valuable before autonomous finance actions. | User / Risk | HIGH | Task-based evaluation: variance narrative, source tracing, approval behavior; measure trust/accuracy. | UNVALIDATED | none |
| A-09 | Five certified vertical packs create stronger differentiation than 78 shallow sector pages. | Strategy | MEDIUM | Pipeline analysis, vertical SME interviews, certification cost model. | UNVALIDATED | none |
| A-10 | The stated reference workload represents the target buyer. | Technical | MEDIUM | Collect anonymized data-volume/concurrency profile from design partners. | UNVALIDATED | none |
| A-11 | PostgreSQL/RLS/outbox is sufficient through initial enterprise scale. | Technical | MEDIUM | Benchmark at agreed workload; failure/recovery and isolation tests. | UNVALIDATED | none |
| A-12 | Browser/PWA is required for commercial success despite current Tauri-only runtime gate. | Product | MEDIUM | Buyer/IT research and prototype access-mode study. | UNVALIDATED | none |
| A-13 | Enterprise multi-entity organizations are the best initial commercial segment. Owner direction supersedes the prior upper-mid-market hypothesis. | Market | CRITICAL | Enterprise CFO/controller/FP&A/IT interviews, procurement analysis and paid-pilot evidence. | UNVALIDATED — OWNER-DIRECTED | E-001 owner direction |
| A-14 | A multi-stakeholder enterprise buying committee can be served by one connected product narrative and implementation path. | Strategy | HIGH | Role-based research, buying-process mapping, pilot/LOI evidence. | UNVALIDATED | E-001 owner direction |

## Critical-assumption challenge order

1. **A-01:** no price/segment proof means the entire $500k framing may be wrong.
2. **A-02:** offline-first may be a moat, a niche, or an IT obstacle; evidence must decide.
3. **A-03:** broad feature inventory may be less valuable than the controlled close-to-decision loop.

## v2.0 evidence-status notes

- E-004 (full unit suite / type / lint / build / audit pass on merged main) is **technical verification evidence**. It supports the *quality* of existing foundations but does not change any market, buyer, deployment, or economic assumption status.
- E-005 (GitHub Actions billing block) is **environmental/operational evidence** (repo-wide, pre-existing, not a code regression). It does not validate or invalidate any product assumption.
- E-003 (secondary voice triangulation) remains secondary only: it may refine research questions; it must not validate A-01/A-02/A-03/A-07/A-13 or the strategic wedge.

No requirement, architecture choice, or feature claim may treat an assumption as fact without linking its validation evidence.
