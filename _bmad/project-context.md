# Project Context — FinPlan Pro

> **Last updated:** 2026-08-10 · **Updated by:** Rex / Blaze (BMAD v5.0 ULTRA-YOLO upgrade)

## 1. Project name & description

FinPlan Pro is a brownfield React/Tauri FP&A application being transformed into a trusted enterprise financial decision system. The proposed wedge is a controlled loop: import actuals → reconcile/close → plan/decide → publish an evidence-backed board pack.

## 2. Current phase & status

- **Current phase:** 4b — Evidence-track delivery. Gates G0–G5 approved hypothesis artifacts/planning on 2026-08-10; **full artifact stack re-baselined on 2026-08-10 (v2.x) in a new session under YOLO mode**; primary validation remains active.
- **Active story:** R-01 Recruit enterprise buying-committee sample — IN PROGRESS, externally blocked (no participants/anonymized notes; nothing fabricated).
- **Safe foundations:** F-01 DONE / QA APPROVED. F-02 IN PROGRESS / QA REJECTED (structural + a11y baselines pass incl. populated state; browser pixel baseline blocked). F-03/F-04 stories approved and research-contextualized — implementation pending.
- **Pilot track (P-01…P-07):** BLOCKED until R-04.
- **Operating mode:** YOLO delivery authorized by owner; no conversational pauses, but research, assumptions, tests, QA evidence, and documented decisions remain mandatory.
- **Next action:** (1) Execute R-01/R-02 when anonymized participant material/access is available; (2) execute F-02 visual baseline when a browser-capable environment is available; (3) owner resolves GitHub billing block so CI can run; (4) implement F-03/F-04 from their approved stories once this doc/verification cycle is committed.

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

## 10. YOLO autonomy tracker (BMAD v5.0)

| Agent | Current autonomy level | Basis | Last certified |
|---|---|---|---|
| Rex (Research) | A5 — FULL YOLO | Research path locked; evidence sovereignty enforced; R-01 externally blocked (no fabrication) | 2026-08-10 |
| Blaze (Brainstorm) | A5 — FULL YOLO | Ideation only; no direction change without owner | 2026-08-10 |
| Ana / Percy / Uxie / Archie | A5 — FULL YOLO within approved hypothesis artifacts | Gates G1–G4 approved; no rebaseline without evidence | 2026-08-10 |
| Bob (Planning) | A5 — FULL YOLO | Sprint plan v2.1 approved (G5); P-track blocked by R-04 | 2026-08-10 |
| Amelia (Developer) | A5 — FULL YOLO on safe foundations | F-01/F-03/F-04 approved stories; story ambiguity → A1 | 2026-08-10 |
| Quinn (QA) | A5 — FULL YOLO | Adversarial review; critical security → A1 | 2026-08-10 |
| System (reconciliation) | A5 — verified fast-forward only | Never destructive; documented procedure | 2026-08-10 |

**Escalation status (open):** A3 — workflow-file push blocked (missing `workflows` permission; changes preserved in worktree). A2 — R-01 participants, F-02 browser environment, CI billing block (all external). No A1 active.

## 11. Artifact registry

| Artifact | Version / status | Notes |
|---|---|---|
| research-report.md | v2.1 REBASELINED (v5 re-certified) | Hypothesis baseline re-baselined 2026-08-10; v1 preserved below; primary validation mandatory |
| assumption-registry.md | v2.1 ACTIVE | 14 tracked assumptions, all UNVALIDATED, confidence-scored (v5); E-004/E-005 technical/environmental only |
| validation-plan.md | v2.0 ACTIVE (v5 re-certified) | Primary research thresholds/interview guides; R-01 ops ready, externally blocked |
| participant-screener.md | v1 ACTIVE | Sample and bias-control protocol |
| evidence-log.md | ACTIVE — no primary customer evidence | E-001/E-002 owner direction; E-003 secondary; E-004 technical verification; E-005 CI billing block |
| research-to-requirements-traceability.md | v2.0 ACTIVE | Added R-06/R-07; safe-foundation rows F-01/F-02 recorded |
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
| BMAD_V5_OPERATING_CHARTER.md | ACTIVE | Durable interpretation of the owner-provided BMAD v5.0 ULTRA-YOLO process (DRP + reasoning ledger + autonomy matrix); v4 charter superseded and kept as historical record |
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
| F-03 Context/trust-state shell | DONE / QA APPROVED | Typed FinancialContext, URL serialization, five-pillar permission-aware nav, context bar, palette filtering; 46 targeted tests + axe; pixel baseline still part of F-02 |
| F-04 Control-plane contract spike | DONE / QA APPROVED | Typed command envelope, idempotency, base revisions, negative authz, audit evidence; 8 contract tests + 122 server tests; spike only |
| F-02 Atlas foundation | IN PROGRESS / QA REJECTED | Lint/type/tests, canonical automated a11y (empty + populated states), and structural snapshot baselines (empty + populated) pass; populated-state baseline surfaced and fixed a real heading-order defect; browser pixel baseline remains blocked by Playwright Chromium TLS download failures |
| brainstorm strategic wedge | DIRECTION SET | hypothesis direction, not primary validation |
| product-brief.md | v2.2 APPROVED HYPOTHESIS BRIEF | Re-baselined 2026-08-10; no scope/thesis change |
| prd.md | v2.1 APPROVED HYPOTHESIS PRD | Re-baselined 2026-08-10; no requirement change |
| ux-design.md | v2.1 APPROVED HYPOTHESIS UX | Re-baselined 2026-08-10; heading-hierarchy rule implemented |
| architecture.md | v2.1 APPROVED HYPOTHESIS ARCHITECTURE | Re-baselined 2026-08-10; no ADR change |
| alignment-report.md | v2.1 COMPLETE | Verdict unchanged; 5 open decisions remain |
| sprint-plan | v2.1 APPROVED HYPOTHESIS DELIVERY PLAN | Live execution-status table added |
| story-f01 / story-f02 | DONE / IN PROGRESS | F-02 QA REJECTED only for pixel baseline |
| story-f03 / story-f04 | DONE / QA APPROVED | Implemented and verified 2026-08-10 |
| capability truth matrix | ACTIVE | mechanical source/test evidence baseline |

## 12. Brainstorm sessions conducted

| Topic | Date | Outcome |
|---|---|---|
| Strategic wedge | 2026-08-10 | controlled close-to-decision-to-board-pack is leading hypothesis |
| Executive workspace | 2026-08-10 | materiality-first decision workspace is the leading UX hypothesis |
| Enterprise research pre-mortem | 2026-08-10 | R-01 requires cohort balance, workflow-first interviews, and bias controls |

## 13. Reasoning ledger reference (BMAD v5.0)

`_bmad/reasoning-ledger.md` is the permanent intellectual record: every meaningful decision logs its DRP summary (first principles, evidence, options, risks, consequences), confidence score, and autonomy level. Backfilled through Ledger Entry #8 (session history); new entries append. This file is required reading for any agent inheriting ambiguous state.

## 14. Glossary

**Authoritative:** server-enforced, versioned, audited state used for official finance. **Connected:** real data/contract plus lifecycle-state evidence. **Governed:** policy/audit/tenant/lifecycle evidence. **Enterprise-ready:** governed plus performance, accessibility, operations, and customer-workflow proof.

## 15. Change log

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
| 2026-08-10 | System | Investigated merged-main CI failures in a healthy `gh` environment: every workflow job fails before starting with GitHub annotation "recent account payments have failed or your spending limit needs to be increased" — repo-wide billing block predating PR #53, not a code regression. Owner action required on GitHub billing; local verification of merged main (`f3834e2`) passes. See `_bmad/qa/ci-actions-billing-block-2026-08-10.md`. |
| 2026-08-10 | Amelia / Quinn | Extended F-02 interim evidence: populated-Dashboard structural baseline + jest-axe (`DashboardPage.populated.contract.test.tsx`); fixed real heading-order defect found by it (Dashboard sections h3 → h2; `ChartWrapper` gained backward-compatible `headingLevel` prop). Pixel baseline remains blocked; F-02 verdict unchanged (REJECTED — REQUIRES COMPLETION). |
| 2026-08-10 | Amelia / Quinn | Reconciled two stale tests broken by the merged Dashboard empty-state change (`src/pages/dashboard/DashboardPage.test.tsx`, `src/pages/smoke.test.tsx`): verified pre-existing on clean merged main via temp worktree, then updated assertions to the merged `FinancialWorkspaceEmptyState` heading. |
| 2026-08-10 | System / Rex | New-session P0: local refs reconciled to remote branch `4d6d402` (fast-forward via `update-ref` + index refresh; no destructive commands, nothing discarded). Baseline verified: full suite 1,179 files / 13,315 tests passed, tsc 0 errors, inventory/docs/audit/diff green. |
| 2026-08-10 | Rex / Blaze | BMAD v4 Phase 0–4 restart: full artifact stack re-baselined to v2.x (research-report v2.0, assumption-registry v2.0, traceability v2.0, validation-plan v2.0, brief v2.2, PRD v2.1, UX v2.1, architecture v2.1, alignment v2.1, sprint-plan v2.1) with evidence entries E-004/E-005; story-02/03/04 superseded; story-f03/f04 created and approved for implementation; no market assumption status changed. |
| 2026-08-10 | Rex | F-02 environment re-check: Playwright Chromium download re-attempted in new sandbox — still TLS `ECONNRESET` (cdn.playwright.dev). Pixel baseline remains BLOCKED; verdict unchanged. |
| 2026-08-10 | Amelia / Quinn | Implemented Story F-03 (typed FinancialContext + URL serialization + five-pillar permission-aware navigation + context bar + command-palette filtering) and Story F-04 (control-plane command-envelope spike with idempotency, base revisions, negative authorization, audit evidence; client mirror). QA APPROVED for both; server suite 12 files / 122 tests; targeted client suites green; root tsc + changed-file lint clean. |
| 2026-08-10 | Amelia / Quinn | Governance hardening: pinned all GitHub Actions to commit SHAs across 9 workflows (supply-chain hardening — architecture guardrail now passes), added vitest test sharding to ci.yml (CI-002), made the a11y gate blocking with runner-detection error (CI-003, runner exists and passes locally: 448 tests). Compliance evidence now 22/22. CI execution still blocked by the account billing issue (E-005). **PUSH CAVEAT:** the `.github/workflows/*.yml` edits could not be pushed (GitHub App token lacks `workflows` permission) and are preserved as UNCOMMITTED working-tree changes — see `_bmad/qa/ci-actions-billing-block-2026-08-10.md`; commit them with a token that has `workflows` permission. |
| 2026-08-10 | Amelia / Quinn | Full-suite verification post-sandbox-recycle: **1,184 files / 13,333 tests passed** (1 skipped) — cleanest full run to date (no flakes). Extended Atlas structural baseline with FinancialContextBar hierarchy + trust-state semantics tests (4 tests in `AtlasFoundations.visual-contract.test.tsx`); updated E-004 with full verification battery (build, a11y 448, governance 22/22). F-02 interim evidence strengthened; pixel baseline remains blocked. |
| 2026-08-10 | Amelia / Quinn | Extended Atlas structural baseline to 8 tests: all ten `FinancialStatusBadge` lifecycle states (text + icon + role + data attribute, never colour-only; deterministic badge-set snapshot) and PageHeader full/minimal anatomy. Fixed 11 broken backtick citations found by `docs-link-check --strict` across 6 BMAD docs (0 broken links/citations repo-wide now). Production build + bundle check green. F-02 verdict unchanged (pixel baseline blocked). |
| 2026-08-10 | Amelia / Quinn | Completed F-04 client side: `src/api/commandClient.ts` typed Control-Plane transport (`submitCommand`/`getCommandResult`, bearer auth, typed errors, `isCommandResult` validation, feature-flag gated via `VITE_CONTROL_PLANE_URL`/`VITE_ENABLE_CONTROL_PLANE`); contract types (`CommandResult`/`CommandError`/`CommandStatus`) mirrored in `src/types/commandEnvelope.ts`. 14 client/contract tests (mocked fetch). Not wired into any screen until a Control Plane deployment is configured. QA addendum filed; architecture §11.1 updated. |
| 2026-08-10 | System / All agents | **BMAD v5.0 ULTRA-YOLO upgrade (owner direction):** new `_bmad/BMAD_V5_OPERATING_CHARTER.md` (DRP + reasoning ledger + autonomy matrix + repo-mapped escalations); v4 charter superseded (historical); `_bmad/reasoning-ledger.md` established and backfilled (entries #1–#8); path-lock updated to v5; project-context gains §10 autonomy tracker and §13 ledger reference. Locked delivery path and hypothesis gates unchanged. |
| 2026-08-10 | System / All agents | **BMAD v5.0 restart from Step 1 (owner direction, reusing existing docs):** `_bmad/v5-restart-2026-08-10.md` records phase-by-phase DRP re-certification — Step 1 Phase 0 (research v2.1 + assumption-registry v2.1 with Confidence/Last-reviewed columns), Step 2 Phase 1 (brief v2.3), Step 3 Phase 2 (PRD/UX v5 headers), Step 4 Phase 3 (architecture v5 header + F-04 spike evidence), Step 5 Phase 4 (sprint-plan v2.2 + story/QA status verification). Reasoning ledger entries #9–#13 appended. No market assumption status changed; gates G0–G5 remain approved hypotheses. |

## 16. CI / GitHub Actions status

- **2026-08-10:** All workflow runs fail before any job step runs. GitHub check-run annotation: *"The job was not started because recent account payments have failed or your spending limit needs to be increased. Please check the 'Billing & plans' section in your settings"*. Affects every workflow (CI, tsc, lint, test-unit, build, deploy, cascade-hold, sentry-self-test) on commits predating PR #53 as well as merged main — a repo-wide infrastructure block, **not** a code regression.
- Local verification of merged main + session branch passes (re-run in new session 2026-08-10): full unit suite **1,179 files / 13,315 tests passed** (1 skipped), root `tsc --noEmit` 0 errors, full-src ESLint 0 warnings, production build passed, capability inventory deterministic, docs truth passed, production dependency audit 0 vulnerabilities, diff hygiene clean. Evidence: E-004.
- Owner action required: resolve the GitHub account billing / spending limit, then re-run workflows. Until jobs execute, CI status must not be treated as code evidence.
- Details: `_bmad/qa/ci-actions-billing-block-2026-08-10.md`
