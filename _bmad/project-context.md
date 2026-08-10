# Project Context — FinPlan Pro

> **Last updated:** 2026-08-10 · **Updated by:** Rex / Blaze

## 1. Project name & description

FinPlan Pro is a brownfield React/Tauri FP&A application being transformed into a trusted enterprise financial decision system. The proposed wedge is a controlled loop: import actuals → reconcile/close → plan/decide → publish an evidence-backed board pack.

## 2. Current phase & status

- **Current phase:** 4b — Evidence-track delivery. Gates G0–G5 approved hypothesis artifacts/planning on 2026-08-10; primary validation remains active.
- **Active story:** R-01 Recruit enterprise buying-committee sample — IN PROGRESS. Story 02 remains PAUSED; its Atlas foundation changes are retained but broad UI migration remains blocked.
- **Operating mode:** YOLO delivery authorized by owner; no conversational pauses, but research, assumptions, tests, QA evidence, and documented decisions remain mandatory.
- **Next action:** Owner selected both unblockers (E-002): execute R-01/R-02 when anonymized participant material/access is available and execute F-02 visual baseline when a browser-capable environment is available.

## 3. Research intelligence summary

1. Broad FP&A competitors already own connected-planning, close, modern modeling, and AI narratives.
2. Evidence-backed close/reconciliation/reporting is the enterprise credibility gate.
3. AI adoption/trust is immature; assisted, cited AI is safer than autonomous finance actions.
4. The source tree is breadth-rich but current source/test evidence does not establish enterprise maturity.
5. The controlled close-to-decision-to-board-pack loop is the leading strategic wedge, pending primary validation.

## 4. Critical assumptions under watch

See `_bmad/research/assumption-registry.md`. Critical: A-01 $500k willingness-to-pay, A-02 local-first as differentiator, A-03 five-job wedge over broad parity.

## 5. Tech stack & versions

React 19, TypeScript, Vite, Tailwind, Zustand, AG Grid, Recharts, decimal.js; Tauri 2 source; separate Express/TypeScript server; Vitest/Playwright. Exact dependency versions are in committed manifests, not duplicated manually.

## 6. Coding standards & conventions

TypeScript strict; decimal-safe money; no silent security or financial failures; characterization/regression tests before risky refactor; source/test existence never equals enterprise readiness; never claim verification not run.

## 7. Architectural patterns in use

Current: React client, Zustand stores, pure engines, local persistence, optional server/desktop. Proposed: Workspace draft/cache plus authoritative Enterprise Control Plane, incremental migration, typed commands, tenant policy, audit evidence, PostgreSQL/RLS/outbox.

## 8. Key rules & constraints

- Zero compromises: no unsupported readiness claim, no silent state change, no skipped evidence.
- Current `src/App.tsx` has a Tauri-only browser gate; browser/PWA is a target, not verified current capability.
- Client-local state cannot be official financial authority in the target architecture.
- Do not erase existing code/history to restart the process.

## 9. Environment & tooling

- Install dependencies: `npm ci --ignore-scripts`.
- Typecheck: `node node_modules/typescript/bin/tsc --noEmit`.
- Focused tests: `node --max-old-space-size=4096 node_modules/vitest/vitest.mjs run <file> --reporter=dot --pool=forks`.
- Capability inventory: `npm run capability:inventory`.

## 10. Artifact registry

| Artifact | Version / status | Notes |
|---|---|---|
| research-report.md | v1 DRAFT | Desk-research intelligence baseline |
| assumption-registry.md | v1 ACTIVE | 13 tracked assumptions |
| validation-plan.md | v1 ACTIVE | Primary research thresholds/interview guides |
| participant-screener.md | v1 ACTIVE | Sample and bias-control protocol |
| evidence-log.md | EMPTY | No primary evidence recorded yet |
| materiality-decision-policy-model.md | v1 DRAFT | Decision Workspace policy hypothesis; requires primary validation |
| financial-metric-lineage-model.md | v1 DRAFT | Official-number/evidence contract; requires controller/auditor/security validation |
| financial-model-workspace-contract.md | v1 DRAFT | Analyst grid/formula/version/conflict/offline contract; requires primary workflow validation |
| controlled-close-reconciliation-contract.md | v1 DRAFT | Close/reconciliation/certification/lock contract; requires controller/auditor validation |
| governed-reporting-board-pack-contract.md | v1 DRAFT | Immutable reporting/snapshot/distribution contract |
| integration-data-quality-contract.md | v1 DRAFT | Connector/import/mapping/quality/reconciliation contract |
| identity-security-compliance-contract.md | v1 DRAFT | Enterprise identity, security, privacy, compliance baseline |
| operations-reliability-contract.md | v1 DRAFT | SLO, reliability, deployment, support and recovery baseline |
| major-area-coverage-map.md | ACTIVE | Major-area scope and remaining-contract map |
| ai-governance-evaluation-contract.md | v1 DRAFT | Cited/supervised AI policy and evaluation requirements |
| collaboration-offline-sync-contract.md | v1 DRAFT | Local draft, conflict, replay, presence and authority contract |
| consolidation-fx-policy-contract.md | v1 DRAFT | Reproducible multi-entity/FX/elimination run policy |
| vertical-certification-standard.md | v1 DRAFT | Evidence standard for supported industry packs |
| commercial-implementation-gtm-contract.md | v1 DRAFT | ICP, economic value, pilot, packaging and implementation model |
| research-to-requirements-traceability.md | ACTIVE | Evidence/assumption to requirement/architecture chain |
| path-lock.md | ACTIVE | Owner-directed BMAD v4 delivery path; deviations require explicit documentation |
| BMAD_V4_OPERATING_CHARTER.md | ACTIVE | Durable interpretation of the owner-provided BMAD v4 process and YOLO semantics |
| research-session-notes-template.md | ACTIVE | Structured, anonymized primary-research evidence capture |
| recruitment-outreach-template.md | ACTIVE | Bias-controlled participant recruitment script |
| usability-prototype-test-plan.md | READY | Task scenarios, metrics and pivot rules for primary research |
| owner-direction-record-2026-08-10.md | ACTIVE | Enterprise/hybrid/multi-stakeholder owner direction, explicitly not market validation |
| enterprise-buying-committee-map.md | v1 DRAFT | Role-specific enterprise purchase hypotheses and proof packs |
| enterprise-pilot-charter-template.md | TEMPLATE | Evidence-based, scope-controlled design-partner pilot charter |
| participant-outreach-tracker.md | READY | Anonymized R-01 recruitment tracking and sample-bias checklist |
| secondary-voice-triangulation-2026-08-10.md | SECONDARY | Public review signals used only to refine research questions, never as primary validation |
| FinancialWorkspaceEmptyState component | VERIFIED FOUNDATION | Added to Dashboard no-data state; targeted UI tests and root typecheck passed on 2026-08-10 |
| F-01 Capability evidence governance | DONE / QA APPROVED | All route/module rows classified with role/disposition; 0 unresolved route source mappings; maturity claims remain UNVERIFIED |
| F-02 Atlas foundation | IN PROGRESS / QA REJECTED | Lint/type/tests, canonical automated a11y, and structural snapshot baseline pass; browser pixel baseline remains blocked by Playwright Chromium TLS download failures |
| brainstorm strategic wedge | DIRECTION SET | hypothesis direction, not primary validation |
| product-brief.md | REVALIDATION REQUIRED | created before Phase 0 research restart |
| prd.md | REVALIDATION REQUIRED | must trace to approved research |
| ux-design.md | REVALIDATION REQUIRED | must trace to user research |
| architecture.md | REVALIDATION REQUIRED | must trace to technical feasibility research |
| sprint-plan/stories | PAUSED | no further story execution until Phase 0 reconciliation |
| capability truth matrix | ACTIVE | mechanical source/test evidence baseline |

## 11. Brainstorm sessions conducted

| Topic | Date | Outcome |
|---|---|---|
| Strategic wedge | 2026-08-10 | controlled close-to-decision-to-board-pack is leading hypothesis |
| Executive workspace | 2026-08-10 | materiality-first decision workspace is the leading UX hypothesis |
| Enterprise research pre-mortem | 2026-08-10 | R-01 requires cohort balance, workflow-first interviews, and bias controls |

## 12. Glossary

**Authoritative:** server-enforced, versioned, audited state used for official finance. **Connected:** real data/contract plus lifecycle-state evidence. **Governed:** policy/audit/tenant/lifecycle evidence. **Enterprise-ready:** governed plus performance, accessibility, operations, and customer-workflow proof.

## 13. Change log

| Date | Agent | Change |
|---|---|---|
| 2026-08-10 | Rex / Blaze | Restarted planning at BMAD v4 Phase 0; produced research baseline, assumption registry, strategic-wedge brainstorm; paused downstream artifacts for reconciliation. |
| 2026-08-10 | System | Recorded BMAD v4 Operating Charter to make research-first path and YOLO semantics durable. |
| 2026-08-10 | Owner / Rex | Gate G0 approved the desk-research hypothesis baseline; Phase 1 discovery is active while primary validation remains open. |
| 2026-08-10 | Owner / Ana / Percy / Uxie | Gate G1 approved the hypothesis Product Brief; PRD and UX artifacts moved to research-traceable Gate G2/G3 drafts. |
| 2026-08-10 | Owner / Percy / Uxie / Archie | Gates G2/G3 approved the hypothesis PRD and UX specification; architecture moved to research-traceable Gate G4 draft. |
| 2026-08-10 | Owner / Archie / Bob | Gate G4 approved the hypothesis architecture; created research-informed Pack R/F/P delivery plan and R-01–R-04 evidence stories for Gate G5 review. |
| 2026-08-10 | Owner / Bob / Rex | Gate G5 approved hypothesis delivery plan; began R-01 with anonymized outreach tracker and recruitment operations. |
| 2026-08-10 | Amelia / Quinn | Completed safe Story F-01 capability evidence governance; generator now classifies all routes/modules and resolves all route sources; QA approved. |
| 2026-08-10 | Amelia / Quinn | Added Atlas status/header foundations and verified focused tests/typecheck before research restart. |
| 2026-08-10 | Bob | Created prior Story Pack A; now paused pending research reconciliation. |
