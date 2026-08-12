# Assumption Registry — FinPlan Pro

> **Maintained by:** Rex · **Version:** 2.1 · **Date:** 2026-08-10 · **Status:** ACTIVE / UNVALIDATED
> **v2.2 (2026-08-11, owner re-baseline):** Enterprise participant interviews are unavailable (solo development — `owner-direction-record-2026-08-11-solo-dev.md`). Validation approaches below are re-interpreted to solo-achievable evidence per `validation-plan.md` §Solo-dev evidence strategy (Tier 2–4), and `UNVALIDATED` status is retained for every assumption. Interview-based validation (Tier 1) is revivable if access appears.
> **v2.1 (BMAD v5.0 restart Step 1):** Confidence column added per v5 confidence-governed autonomy. Scores are confidence-in-the-hypothesis (0–100%), NOT validation status; every assumption remains `UNVALIDATED` until primary evidence meets the validation-plan thresholds. v2.0 rebaseline note: no market assumption changed status — the only new evidence is technical/environmental (E-004, E-005), which does **not** validate any buyer/market/deployment assumption.

| ID | Assumption | Domain | Risk | Validation approach | Status | Confidence | Last reviewed | Evidence links |
|---|---|---|---|---|---|---|---|---|
| A-01 | CFOs will pay $500k+ for a unified, local-first FP&A offering. | Market | CRITICAL | 12–15 structured buyer interviews; 3 paid design-partner LOIs; willingness-to-pay test against implementation/SLA packaging. | UNVALIDATED | 10% | 2026-08-10 | none (E-001 owner direction only) |
| A-02 | Local-first/offline is a decisive differentiator rather than a procurement burden. | User / Strategy | CRITICAL | Test deployment, security, and IT buyer preferences across regulated and non-regulated target accounts. | UNVALIDATED | 15% | 2026-08-10 | E-003 secondary signals only |
| A-03 | The five-job Release 1 loop is more valuable than broad route/vertical parity. | Problem | CRITICAL | Prototype usability and workflow-value study with CFO, controller, analyst cohorts. **2026-08-12 scope-direction note (E-019):** owner directed an all-in-one FP&A goal ("user should not need any other tool") — this is SCOPE INTENT, not validation; the wedge remains the strategic anchor and A-03 stays UNVALIDATED pending evidence on breadth vs focus. | UNVALIDATED | 20% | 2026-08-12 | E-003 secondary signals only; E-019 direction
| A-04 | A hybrid Control Plane can meet enterprise security/audit needs without eroding local-first advantage. | Technical | HIGH | Threat model, architecture spike, customer security questionnaire review, restore/tenant-isolation tests. | UNVALIDATED | 25% | 2026-08-10 | none |
| A-05 | Existing client engines can be reused as authoritative calculation components with bounded migration risk. | Technical | HIGH | Characterization suite, server-execution spike, independent financial reconciliation. | UNVALIDATED | 40% | 2026-08-10 | E-004 (suite health only, not engine authority) |
| A-06 | A finance-native Decision Workspace beats familiar dashboard-card patterns for executive adoption. | User / UX | HIGH | Comparative prototype study with five CFO/finance leaders. | UNVALIDATED | 20% | 2026-08-10 | none |
| A-07 | One connector plus robust import is enough for the initial pilot. | Market / Scope | HIGH | Design-partner system inventory and import-frequency analysis. | UNVALIDATED | 15% | 2026-08-10 | none |
| A-08 | Controlled/cited AI is valuable before autonomous finance actions. | User / Risk | HIGH | Task-based evaluation: variance narrative, source tracing, approval behavior; measure trust/accuracy. | UNVALIDATED | 30% | 2026-08-10 | none |
| A-09 | Five certified vertical packs create stronger differentiation than 78 shallow sector pages. | Strategy | MEDIUM | Pipeline analysis, vertical SME interviews, certification cost model. **2026-08-12 scope-direction note (E-019):** all-industry breadth is the owner-directed target; breadth ≠ certified vertical depth — certification claims still require evidence. | UNVALIDATED | 20% | 2026-08-12 | E-019 direction
| A-10 | The stated reference workload represents the target buyer. | Technical | MEDIUM | Collect anonymized data-volume/concurrency profile from design partners. | UNVALIDATED | 25% | 2026-08-10 | none |
| A-11 | PostgreSQL/RLS/outbox is sufficient through initial enterprise scale. | Technical | MEDIUM | Benchmark at agreed workload; failure/recovery and isolation tests. | UNVALIDATED | 35% | 2026-08-10 | none |
| A-12 | Browser/PWA is required for commercial success despite current Tauri-only runtime gate. | Product | MEDIUM | Buyer/IT research and prototype access-mode study. **2026-08-11:** beta-enablement flag (VITE_BETA_WEB) implemented for the solo-dev validation loop (F-05) — this enables the beta channel, NOT validation of the assumption. **2026-08-12:** flag removed by owner decision (desktop-only product) — the browser/PWA channel no longer exists; remains UNVALIDATED with no active evidence path. | UNVALIDATED | 25% | 2026-08-12 | E-014 (direction), E-017 (direction) |
| A-13 | Enterprise multi-entity organizations are the best initial commercial segment. Owner direction supersedes the prior upper-mid-market hypothesis. | Market | CRITICAL | Enterprise CFO/controller/FP&A/IT interviews, procurement analysis and paid-pilot evidence. | UNVALIDATED — OWNER-DIRECTED | 30% | 2026-08-10 | E-001 owner direction |
| A-14 | A multi-stakeholder enterprise buying committee can be served by one connected product narrative and implementation path. | Strategy | HIGH | Role-based research, buying-process mapping, pilot/LOI evidence. | UNVALIDATED | 25% | 2026-08-10 | E-001 owner direction |

## Critical-assumption challenge order

1. **A-01:** no price/segment proof means the entire $500k framing may be wrong.
2. **A-02:** offline-first may be a moat, a niche, or an IT obstacle; evidence must decide.
3. **A-03:** broad feature inventory may be less valuable than the controlled close-to-decision loop.

## v2.0 evidence-status notes

- E-004 (full unit suite / type / lint / build / audit pass on merged main) is **technical verification evidence**. It supports the *quality* of existing foundations but does not change any market, buyer, deployment, or economic assumption status.
- E-005 (GitHub Actions billing block) is **environmental/operational evidence** (repo-wide, pre-existing, not a code regression). It does not validate or invalidate any product assumption.
- E-003 (secondary voice triangulation) remains secondary only: it may refine research questions; it must not validate A-01/A-02/A-03/A-07/A-13 or the strategic wedge.

No requirement, architecture choice, or feature claim may treat an assumption as fact without linking its validation evidence.
