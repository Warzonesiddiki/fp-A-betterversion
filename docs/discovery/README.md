# FP&A Copilot — Audit & Product Discovery Pack

> **Product goal (authoritative):** [`docs/VISION.md`](../VISION.md). This folder
> is the discovery-phase plan of record — requirements, decisions, risks and the
> gated roadmap. Where this pack and VISION.md disagree on *product direction*,
> VISION.md wins; where they disagree on *requirements evidence*, this pack wins.

**Status:** Plan of record (proposed, DEC-006) — adopted into `docs/discovery/` on 2026-10-15; target repository checks executed, see [audit progress](audit-progress-2026-10-15.md) and the full audit [`../audit/AUDIT_VS_FPA_MODULAR_2026-10-15.md`](../audit/AUDIT_VS_FPA_MODULAR_2026-10-15.md)  
**Product ambition:** An all-in-one FP&A workspace that becomes the user's trusted one-stop solution.  
**Current known workflow:** The user exports a General Ledger (GL) dump from Microsoft Dynamics 365 each month, performs FP&A work, and highlights abnormalities and potentially incorrect entries.

> This pack prepares for an evidence-based audit and product-definition session. It is not a claim that the product already implements any capability. All product choices below are proposals until validated with the user and repository evidence.

## Documents

0. [Preliminary repository reconnaissance](preliminary-repository-recon.md) — first-pass GitHub inspection; corrects the apparent target/reference technology mix-up and records evidence limits.
0a. [Audit progress (2026-10-15)](audit-progress-2026-10-15.md) — shallow-clone baseline, reference test result, source observations, and next audit steps.
1. [Audit charter and evidence plan](audit-charter.md) — scope, method, evidence rules, and audit checklist.
2. [Product vision and scope](product-vision.md) — ambition, users, outcomes, boundaries, and success measures.
3. [Current workflow and discovery questions](current-workflow.md) — known monthly process, proposed workflow map, and information needed.
4. [Product and feature suggestions](product-suggestions.md) — opportunity areas, options, and staged recommendations.
5. [UI/UX discovery brief](ui-ux-discovery.md) — principles, information architecture, screen concepts, and UX states.
6. [Initial requirements register](requirements-register.md) — draft, testable requirements with statuses.
7. [Risk and controls register](risk-register.md) — initial FP&A, data, AI, security, and product risks.
8. [Audit evidence checklist](audit-evidence-checklist.md) — evidence to collect before making claims or prioritizing remediation.
9. [Proposed roadmap](roadmap.md) — discovery-to-vertical-slice sequence, conditional on audit findings.
10. [Decision log](decision-log.md) — DEC-001…DEC-006; all Proposed, awaiting owner.
11. [Full repository audit vs. FPA-modular](../audit/AUDIT_VS_FPA_MODULAR_2026-10-15.md) — measured findings and the 25-item prioritised list (outside this folder).

## How to use this pack

- Treat **Known** statements as facts supplied by the project owner, not independently verified repository facts.
- Treat **Proposed** items as discussion starters, not approved requirements.
- Record decisions in a decision log with date, rationale, owner, and affected requirement IDs.
- During the audit, replace unknowns with evidence or keep them explicitly unknown.
- Keep the ambition uncompromised, but phase delivery. “One-stop solution” is a product direction; it does not mean claiming universal ERP coverage, perfect anomaly detection, or zero defects before evidence supports those claims.

## Current evidence boundary

Owner-stated workflow: use of Dynamics 365, a monthly exported GL dump, FP&A work around that export, and manual highlighting/pointing out of abnormalities and potentially wrong entries. A preliminary public GitHub page inspection also found that the target repository describes a TypeScript/React/Vite/Tauri application, while the reference README describes a Python app at M0. See [preliminary reconnaissance](preliminary-repository-recon.md). Update 2026-10-15: a full source audit and test run of the target have now been executed (TypeScript/React/Vite/Tauri confirmed as the product of record; results in the audit-progress document). The sentence that follows remains true for the owner-side items. The exact Dynamics 365 product/version, export shape, user workflow, data sensitivity, deployment, and implemented controls still require verification.
