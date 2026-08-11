# Research Report — FinPlan Pro Enterprise Decision System

> **Version:** 2.1 · **Status:** REBASELINED HYPOTHESIS BASELINE — Gate G0 approved by owner on 2026-08-10; re-baselined 2026-08-10 under YOLO mode; **BMAD v5.0 re-certified 2026-08-10** (restart Step 1, see `_bmad/v5-restart-2026-08-10.md`); primary validation remains mandatory
> **Research Director:** Rex · **Date:** 2026-08-10
> **Method:** Brownfield code/document audit plus desk research. Vendor claims are treated as competitive signals, not independent proof.

---

## v2.0 rebaseline summary (2026-08-10)

**What changed since v1.0:**

1. **Merged delivery verified.** PR #53 (`feat: establish research-driven finance UX foundations`) is merged at `f3834e2` on `main`. All merged artifacts confirmed present (BMAD charter, capability matrix, Atlas UI foundation, Dashboard adoption).
2. **Technical verification evidence added (non-market).** On merged `main` and the session branch (`4d6d402`): full unit suite **1,179 files / 13,315 tests passed** (1 skipped), root `tsc --noEmit` 0 errors, full-src ESLint 0 warnings, production build passed, capability inventory deterministic, docs-truth passed, production audit 0 vulnerabilities. Two stale tests asserting the pre-merge Dashboard empty state were reconciled (verified pre-existing on clean merged main).
3. **Real accessibility defect found and fixed.** The populated-Dashboard interim baseline surfaced a genuine heading-order violation (h1 → h3). Fixed page-scoped (section headings now h2; `ChartWrapper` gained backward-compatible `headingLevel` prop). Safe-foundation evidence, not market validation.
4. **GitHub Actions CI is blocked by account billing, not code.** Every workflow job on every recent commit fails before starting, with GitHub's annotation: *"recent account payments have failed or your spending limit needs to be increased."* Repo-wide and pre-existing (affects commits from 2026-08-09); no code regression. Owner action required in Billing & plans.
5. **F-02 pixel baseline remains blocked.** Playwright Chromium download still fails with TLS `ECONNRESET` in this environment. Structural DOM baselines (empty + populated Dashboard) and `jest-axe` pass; pixels/fonts/theme/responsive remain unverified.
6. **No primary market evidence added.** R-01 remains externally blocked; nothing fabricated. All market/user/economic assumptions stay `UNVALIDATED`.

**Unchanged strategic hypothesis (owner-directed, unvalidated):**
> FinPlan Pro should prove a controlled **close → decision → board-pack** operating loop, backed by an analyst-grade workspace and an authoritative enterprise Control Plane.

---

## v1.0 baseline (preserved below)

## Executive intelligence summary

1. **The category has converged on connected, governed planning—not generic dashboards.** Anaplan positions connected, cross-functional planning and scale; OneStream positions unified close/planning/reporting; Pigment positions governed collaborative modeling and agents. [Anaplan](https://www.anaplan.com/content/dam/anaplan/wp-content/uploads/2020/08/platformOverviewBrief_072020.pdf) · [OneStream](https://www.onestream.com/) · [Pigment](https://www.pigment.com/ai-info-about-pigment)
2. **Finance AI is an adoption/trust problem, not a model-count problem.** A 2025 FP&A Trends survey reported 53% of teams did not use AI in any process and only 10% used it in forecasting/analytics; the first winning AI work should be cited assistance and reviewable narratives. [FP&A Trends](https://fpa-trends.com/article/getting-started-ai-fpa-tools-governance-and-first-steps)
3. **Close, reconciliation, source lineage, and control are the credibility gate.** Competitors sell a single source of truth and governed auditability; a client-only/local authoritative story cannot support the intended enterprise claim. [OneStream](https://www.onestream.com/)
4. **The current codebase is a breadth-rich prototype/foundation, not evidence of an enterprise system of record.** The capability matrix finds 199 routed screens, 216 page modules, 213 static engine modules, 45 stores, 329 components, and 60 services—but source/test presence cannot demonstrate connected, governed, or enterprise-ready maturity.
5. **The strategic bet must be validated before scale investment:** an exceptional controlled decision loop for a chosen segment/vertical has a stronger evidence basis than attempting route, connector, or sector parity simultaneously.

## 1. Problem-space analysis

### Root-cause assessment

The apparent problem (“UI feels generic”) is a symptom. The root problem is that the product lacks a consistently authoritative **decision loop**: financial signal → named comparison/context → evidence/driver → accountable action → workflow/control → immutable report. Page count cannot repair this.

### Jobs-to-be-done map

| Job | Current workaround / failure | Required outcome |
|---|---|---|
| Controller closes a period | spreadsheets, messaging, manual checklists, disconnected reconciliations | visible controls, evidence, exceptions, certification, lock |
| Analyst reforecasts | local grids, exports, unclear version/owner status | governed model/version/assumption/approval loop |
| CFO decides | generic KPIs, presentation exports, difficult lineage | materiality-ranked decision and accountable next action |
| Admin ingests data | files/mappings/retries without authoritative quality evidence | staged, idempotent, reconciled import with recovery |
| Auditor verifies | mutable/fragmented trail | scoped, immutable, exportable evidence |

### Current-solution failures

The reviewed source exposes broad pages and engines but current route inventory shows duplicated/legacy/sector paths. Current `src/App.tsx` blocks ordinary browser rendering with a Tauri-only gate. Existing local storage/desktop strengths are valuable, but require a server authority boundary for official operations.

## 2. Market and opportunity analysis

### Timing signals

Category messaging in 2026 emphasizes continuous planning, integrated operational/financial models, AI assistance, real-time decision support, governance, and explainability. [Board market guide](https://www.board.com/guide/best-fpa-software) · [CloudZero buyer guide](https://www.cloudzero.com/blog/fpa-software/)

### Opportunity

A credible whitespace position is **controlled local-first finance decision operations**: analyst-grade local productivity with an optional enterprise control plane for authoritative data, evidence, collaboration, and deployment choice. This is an opportunity, not a validated customer demand claim.

### Regulatory/compliance implications

SOC 2-style processing integrity and confidentiality expectations make input validation, reconciliation, change control, audit trail, encryption, access restriction, retention, and recovery product requirements—not sales collateral. [SOC 2 control overview](https://www.venn.com/learn/soc2-compliance/)

## 3. User and behavior research

### Evidence-based current hypothesis

Public category material consistently highlights data collection, validation, scenarios, collaboration, and reporting as finance-team work. The FP&A Trends survey states 46% of FP&A time is spent on data collection/validation; this is directional external evidence, not a substitute for FinPlan customer interviews. [FP&A Trends](https://fpa-trends.com/article/getting-started-ai-fpa-tools-governance-and-first-steps)

### What users say vs. likely behavior

- Users may request “AI”; early usage is likely highest for narrative, exploration, formula help, and variance explanation—not unreviewed postings.
- Users may request “Excel-like”; their actual need is speed, familiar keyboard/paste flows, and safe reconciliation, not a pixel-for-pixel spreadsheet clone.
- Executives may request dashboards; their actual job is determining material change, confidence, and accountable next action.

These are [ASSUMPTIONS] pending discovery interviews.

## 4. Competitive intelligence

| Competitor signal | Strength | Risk to FinPlan | Strategic response |
|---|---|---|---|
| Anaplan | connected planning, large multidimensional models, cross-functional scale | feature/scale parity trap | focus initial proof on controlled finance loop; benchmark scale honestly |
| OneStream | close/consolidation/governance positioning | credibility gap for close/audit | prioritize reconciliation, certification, immutable reports |
| Pigment | modern collaborative modeling, visual UX, governed AI positioning | generic UI rejection / AI hype gap | Atlas decision workspace; cited, supervised AI |
| Excel-native tools | adoption/familiarity | power users export if grid is slow | keyboard-first grid and safe import/export, not anti-Excel rhetoric |

### Whitespace hypothesis

No desk research proves that a local-first enterprise FP&A product is underserved. The defensible claim is narrower: **offer deployment and offline workspace flexibility only where it strengthens customer control, while keeping official state governed.**

## 5. Technical feasibility assessment

### What is ready

The checked-out project contains React/TypeScript/Vite/Tauri, decimal.js, AG Grid, existing engines, local persistence, server code, and meaningful test infrastructure. These reduce greenfield risk.

### Highest technical risks

1. Reusing client engines for official calculations without a deterministic server execution/reconciliation boundary.
2. Offline command replay, conflict resolution, tenant/entity authorization, and audit integrity.
3. Scaling a broad UI without first consolidating route/feature ownership and design patterns.
4. Treating browser/PWA support as delivered while the current source has a strict Tauri gate.

### Build-vs-buy conclusion

Build the finance-specific domain/control experience. Buy or manage commodity capability where appropriate: enterprise IdP, KMS/secrets, object storage, observability, malware scanning, managed database/backups. Do not build generic auth, vault, or infrastructure orchestration first.

## 6. Strategic-risk assessment

| Risk | Likelihood | Impact | Evidence-led mitigation |
|---|---:|---:|---|
| Feature breadth overwhelms core workflow quality | High | Critical | certify only five core jobs and selected verticals |
| $500k positioning lacks segment/WTP proof | High | Critical | design-partner interviews, LOIs, pricing/implementation research |
| Local-first conflicts with IT/security policy | Medium | Critical | customer security discovery and hybrid deployment spike |
| AI overpromises reduce finance trust | High | High | citations, approval, evaluation, no autonomous write |
| Generic UX blocks adoption before depth is seen | High | High | research-tested canonical workspaces before broad restyling |

## Assumption registry summary

See `_bmad/research/assumption-registry.md`. A-01, A-02, and A-03 are the three most dangerous assumptions.

## Recommended strategic direction

1. Target one validated buyer/segment and one close-to-decision workflow before broad industry claims.
2. Make controlled imports, reconciliation, plan/forecast versioning, evidence, and report snapshots the core differentiation proof.
3. Treat the Atlas UX system as a financial trust system, not visual polish.
4. Make AI assisted, cited, and reviewable; defer autonomous actions.
5. Preserve local-first productivity, but make the server Control Plane authoritative for all official results.

## Disconfirming evidence

- Cloud-native vendors already have strong modern-UX/agent messaging; “AI-native” alone is not differentiation.
- Large competitors have mature scale/integration positions; immediate parity is implausible.
- Local-first can increase deployment, sync, device, support, and security complexity rather than reduce it.
- No primary research yet proves a buyer will pay $500k+ or choose deployment flexibility over mature integration ecosystems.

## Research gaps

- No primary customer interviews, ethnography, or observed close/planning workflow.
- No validated ICP, geography, regulatory target, pricing model, or connector priority.
- No measured competitor benchmark using a common customer dataset.
- No pilot workload profile, security questionnaire, or procurement analysis.

## Key questions for discovery

1. Which buyer signs, which user champions, and which controller/analyst workflow creates the first measurable value?
2. What is the cost/time/risk of the current close/reforecast process?
3. Is local-first requested by buyers, tolerated, or rejected by IT?
4. Which system must integrate first, and what data/control evidence is non-negotiable?
5. What would make a $500k+ purchase rational versus Anaplan, OneStream, Pigment, or staying in Excel?
