# FinPlan Pro — Audit & Product Discovery Pack

> **Product goal (authoritative):** [`docs/VISION.md`](../VISION.md). This folder
> owns discovery requirements, decisions, risks and evidence. The detailed
> proposed product strategy and execution approach is
> [`MASTER_PRODUCT_AND_EXECUTION_PLAN.md`](MASTER_PRODUCT_AND_EXECUTION_PLAN.md);
> [`roadmap.md`](roadmap.md) is its high-level gate summary. Accepted decisions
> in `decision-log.md` override any proposal. Where this pack and VISION.md
> disagree on product direction, VISION.md wins; where they disagree on
> requirement evidence, the measured evidence wins.

**Status:** Discovery/governance records, updated 2026-11-10. The owner approved the phased execution sequence (DEC-105); detailed source, deployment, provider and industry choices remain governed by open questions. No new provider or industry support is certified by the plan. The historical repository audit remains at [`../audit/AUDIT_VS_FPA_MODULAR_2026-10-15.md`](../audit/AUDIT_VS_FPA_MODULAR_2026-10-15.md).
**Product ambition:** An all-in-one FP&A workspace; universal user-mapped finance-data intake and all-industry extensibility are long-term goals (DEC-033/104, reaffirmed 2026-11-10).
**Current owner-specific workflow:** The user exports a General Ledger (GL) dump from Microsoft Dynamics 365 each month, performs FP&A work, reviews potentially incorrect entries, guides the accounts team, and compares daily/monthly/yearly results. D365 remains the first real-source validation target.

> This pack prepares for an evidence-based audit and product-definition session. It is not a claim that the product already implements any capability. All product choices below are proposals until validated with the user and repository evidence.

## Documents

0. [Master product and execution plan](MASTER_PRODUCT_AND_EXECUTION_PLAN.md) — detailed proposal for owner review: product boundaries, current truth, import/API strategy, architecture, phased work packages, gates, risks, measures and open decisions.
0a. [Preliminary repository reconnaissance](preliminary-repository-recon.md) — first-pass GitHub inspection; corrects the apparent target/reference technology mix-up and records evidence limits.
0b. [Audit progress (2026-10-15)](audit-progress-2026-10-15.md) — shallow-clone baseline, reference test result, source observations, and next audit steps.
1. [Audit charter and evidence plan](audit-charter.md) — scope, method, evidence rules, and audit checklist.
2. [Product vision and scope](product-vision.md) — ambition, users, outcomes, boundaries, and success measures.
3. [Current workflow and discovery questions](current-workflow.md) — known monthly process, proposed workflow map, and information needed.
4. [Product and feature suggestions](product-suggestions.md) — opportunity areas, options, and staged recommendations.
5. [UI/UX discovery brief](ui-ux-discovery.md) — principles, information architecture, screen concepts, and UX states.
6. [Initial requirements register](requirements-register.md) — draft, testable requirements with statuses.
7. [Risk and controls register](risk-register.md) — initial FP&A, data, AI, security, and product risks.
8. [Audit evidence checklist](audit-evidence-checklist.md) — evidence to collect before making claims or prioritizing remediation.
9. [Proposed roadmap](roadmap.md) — discovery-to-vertical-slice sequence, conditional on audit findings.
10. [Decision log](decision-log.md) — DEC-001 onward; owner rulings are binding, agent technical dispositions are marked delegated.
11. [Full repository audit vs. FPA-modular](../audit/AUDIT_VS_FPA_MODULAR_2026-10-15.md) — historical measured findings and the 25-item prioritised list (outside this folder).
12. [Vision/connector recheck (2026-11-02)](VISION_ALIGNMENT_RECHECK_2026_11_02.md) — current routed workflow, connector reachability, pagination/import limits, and remaining owner validation; supersedes the October 24 audit's current-state conclusions without rewriting its history.
13. [Vision/connector audit (2026-10-24)](VISION_ALIGNMENT_AUDIT_2026_10_24.md) — the audit that the 2026-11-02 recheck supersedes; retained as dated evidence for its current-state conclusions only.
14. [Owner scope register 108–200](OWNER_SCOPE_REGISTER_111_200.md) — blocker record: 93 owner-checklist sections remain unassessed until the exact source is recovered; do not infer titles.
15. [Owner decision packet](OWNER_DECISION_PACKET.md) — one-page O1–O9 and §12 request with recommended safe defaults and a reply template.
16. [Owner decision packet completion](OWNER_DECISION_PACKET_COMPLETION.md) — dated record of that packet's status; not an owner reply and not a decision source.
17. [D365 GL export mapping contract](d365-export-contract.md) — research basis for the parser contract and the DEC-047 header-alias implementation; explicitly **not** verified D365 support until a real anonymised export validates it.

## How to use this pack

- Treat **Known** statements as facts supplied by the project owner, not independently verified repository facts.
- Treat **Proposed** items as discussion starters, not approved requirements.
- Record decisions in a decision log with date, rationale, owner, and affected requirement IDs.
- During the audit, replace unknowns with evidence or keep them explicitly unknown.
- Keep the ambition uncompromised, but phase delivery. “One-stop solution” is a product direction; it does not mean claiming universal ERP coverage, perfect anomaly detection, or zero defects before evidence supports those claims.

## Current evidence boundary

Owner-stated workflow: use of Dynamics 365, a monthly exported GL dump, FP&A work around that export, and manual highlighting/pointing out of abnormalities and potentially wrong entries. A preliminary public GitHub page inspection also found that the target repository describes a TypeScript/React/Vite/Tauri application, while the reference README describes a Python app at M0. See [preliminary reconnaissance](preliminary-repository-recon.md). Update 2026-10-15: a full source audit and test run of the target have now been executed (TypeScript/React/Vite/Tauri confirmed as the product of record; results in the audit-progress document). The sentence that follows remains true for the owner-side items. The exact Dynamics 365 product/version, export shape, user workflow, data sensitivity, deployment, and implemented controls still require verification.
