# FinPlan Pro — Zero-Compromise Product, Experience & Delivery Blueprint

> **Status:** Research-revalidation required — BMAD v4 Phase 0 restarted on 2026-08-10. This blueprint remains a proposed direction, not validated market truth.
>
> **Research inputs:** `_bmad/research/research-report.md` · `_bmad/research/assumption-registry.md` · `_bmad/brainstorm/session-strategic-wedge-2026-08-10.md`
>
> **Date:** 2026-08-10  
> **Audience:** Product, Finance, Design, Engineering, Security, Implementation, and Executive leadership  
> **Decision requested:** Approve the target product operating model, release sequence, and quality gates—not a cosmetic redesign alone.

---

## 0. Executive mandate

FinPlan Pro will become a trusted **financial decision system**, not a collection of finance pages. A CFO, FP&A leader, controller, and budget owner must be able to answer three questions on any screen, in seconds:

1. **What changed?** (actual, plan, forecast, prior period, materiality)
2. **Why did it change?** (drivers, transactions, assumptions, ownership, lineage)
3. **What should we do next?** (decision, workflow, scenario, accountable owner, due date)

The $500k+ proposition is not “more features.” It is: **faster and safer material decisions with evidence an auditor, controller, and board can trust.**

### Non-negotiable outcomes

| Outcome | Product promise | Measurable release criterion |
|---|---|---|
| Trusted numbers | No official number is untraceable, silently rounded, or calculated only in the client. | 100% of published report cells have version, source, calculation, FX, and actor lineage. |
| Decision velocity | A finance user moves from signal to accountable action without exporting data. | Top five monthly workflows complete end-to-end in usability testing with a median task success ≥95%. |
| Enterprise control | Tenant, data scope, approval, and audit rules are enforced server-side. | Authorization, RLS, audit, and destructive-action tests are mandatory gates; no client-only enforcement for official operations. |
| Spreadsheet dignity | Power users retain speed and keyboard fluency, while the model is governed. | Budget grid opens ≤3s at agreed reference scale and supports paste, formulas, undo, provenance, locks, and conflict resolution. |
| Honest intelligence | AI is cited, bounded, permission-aware, and never posts or changes financial data without review. | Every AI answer/action displays sources, confidence, scope, and an approval path; red-team suite passes. |
| Operable platform | A customer can deploy, recover, observe, and upgrade predictably. | SLO dashboards, restore drills, migration rehearsal, incident runbooks, and release rollback are proven before GA. |

**Zero compromise does not mean shipping all 78 verticals or all integrations at once.** It means every released capability meets its contractual quality bar, and anything below that bar remains explicitly unavailable—not disguised as complete.

### BMAD delivery governance — mandatory control system

This transformation follows the BMAD artifact-and-gate model supplied by the owner. The active artifacts are deliberately stored in `_bmad/`, so the roadmap does not depend on chat memory:

| BMAD phase | Required artifact | Current state | Human gate |
|---|---|---|---|
| 1. Discovery | `_bmad/project-context.md`, `_bmad/product-brief.md` | Draft product brief and brownfield baseline created | **G1:** approve / request changes / reject Product Brief |
| 2. Planning | `_bmad/prd.md`, `_bmad/ux-design.md` | Blocked until G1 | **G2/G3:** approve PRD and UX specification |
| 3. Solutioning | `_bmad/architecture.md`, ADRs | Blocked until G2/G3 | **G4:** approve architecture |
| 4. Delivery planning | `_bmad/sprint-plan.md`, `_bmad/stories/` | Blocked until G4 | **G5:** approve story plan before implementation |
| 4. Delivery | implementation + QA report per story | Blocked until G5 | **G6/G7:** review implementation and QA before merge |

No planned feature, code change, maturity promotion, or architecture migration may skip its applicable gate. The detailed evidence register is `docs/CAPABILITY_TRUTH_MATRIX.md`; it feeds discovery, planning, architecture, stories, and QA but is not itself approval to build.

---

## 1. Current-state truth and strategic reset

### 1.1 What is genuinely valuable today

The repository is a strong **local-first FP&A product foundation**, not yet a cloud enterprise system of record:

- React 19, TypeScript, Vite, Tauri, Zustand, AG Grid, Recharts, decimal.js, and a separate Express server are the current stack (`package.json`, `server/package.json`, `AGENTS.md`).
- The UI has 193 lazy routes (`src/App.tsx`), broad component/domain coverage (`src/components/`, `src/pages/`), sector configuration (`src/config/sectors/`), financial engines (`src/engines/`), and local encrypted persistence (`docs/ARCHITECTURE.md`; `docs/architecture/backup-restore.md`).
- Decimal-safe financial patterns, security checks, architecture guards, and a substantial Vitest suite already exist (`AGENTS.md`, `scripts/`).
- Tauri desktop is a product asset. The checked-out `src/App.tsx` currently blocks standard-browser rendering with a Tauri-only alert; browser/PWA operation is a **target capability requiring a verified implementation**, not a current readiness claim. Local-first operation remains valuable for regulated, disconnected, and privacy-sensitive teams.

### 1.2 What must not be overstated

The old master prompt describes a finished target architecture (Next.js, Fastify, Prisma, Kafka, PostgreSQL/ClickHouse/Neo4j, Python ML services). **Those are not the present implementation.** Replacing the application wholesale to match that prompt would create a multi-year migration risk and would not itself improve financial correctness.

The existing vision and older plans also contain inconsistent counts and dates (for example engine, sector, test, page, and component counts). Metrics must henceforth be generated from CI scripts, never copied manually into strategic claims.

### 1.3 Product positioning decision

Adopt a two-plane architecture and sell it clearly:

1. **FinPlan Workspace (desktop/PWA):** performant local modeling, offline review, secure local cache, analyst-grade grid, controlled synchronization.
2. **FinPlan Enterprise Control Plane (hosted or customer-managed):** identity, tenancy, official data, policy, workflows, audit evidence, integrations, reporting jobs, collaboration, and AI governance.

The workspace never becomes a loophole around policy. Local calculations may support draft work; **official reports, locks, certifications, approvals, journal posting, and published forecasts are authoritative only after server-side validation and immutable evidence capture.**

### 1.4 Product boundary for the first enterprise release

The first enterprise release must be exceptional for these five connected jobs:

1. **Close:** ingest actuals, reconcile, certify, consolidate, and explain.
2. **Plan:** build annual budget and rolling forecast from governed drivers.
3. **Decide:** identify material variance, model options, assign an owner, and approve a response.
4. **Report:** publish a traceable management/board pack.
5. **Operate:** administer identity, entities, access, integrations, and audit evidence.

Headcount planning is included only where it completes these flows. Generic vertical pages, niche analytics, and AI novelty do not interrupt this critical path.

---

## 1.5 Evidence-based gap analysis — current product vs. $500k enterprise bar

### Assessment method and maturity language

This is a deliberately conservative gap analysis. A route, component, engine, test, or document is **evidence of implementation**, not proof that a customer can use a capability in production. Each capability must be classified in the implementation tracker as:

- **Built:** code exists and passes its local test scope.
- **Connected:** uses real domain data and survives loading/error/empty states.
- **Governed:** server-authorized, validated, auditable, permission-scoped, and versioned.
- **Enterprise-ready:** governed plus performance-tested, accessible, observable, documented, operationally supported, and validated by a customer-shaped workflow.

Until a feature reaches the fourth state, product language must say *available in development*, *pilot*, or *planned*—never “complete.” This rule fixes the largest planning risk: breadth has been allowed to look like depth.

### Portfolio gap matrix

| Area | Existing evidence | Gap to enterprise standard | Required correction | Release gate | Priority |
|---|---|---|---|---|---|
| Product narrative | Broad pages, engines, sectors, and several older strategy documents exist. | Counts and claims vary between documents; feature presence is conflated with readiness. | Create a CI-generated capability truth matrix with owner, maturity, evidence links, and customer status. | No unsupported public/product claim. | P0 |
| Application IA | `AppLayout`, `Sidebar`, `Navbar`, and many route groups exist. | Navigation is route/module-led, not decision- or persona-led; context is not a unified product contract. | Replace shell through an Atlas migration layer; map all routes to five pillars; add global context and command surface. | 90% of tested users locate a core job without help. | P0 |
| UI visual language | `src/index.css` has dark/light tokens, card/button/grid styles, and `docs/DESIGN_SYSTEM_ANALYSIS.md` identifies a foundation. | Generic dashboard-card aesthetics, inconsistent page composition, ad-hoc utility styling, weak hierarchy, and no governed component standard create an immediately rejectable enterprise impression. | Build FinPlan Atlas tokens, layout primitives, patterns, component contracts, visual regression suite, and page templates. | Canonical screens pass design QA and accessibility review. | P0 |
| Executive workspace | Dashboard components and dashboard pages exist. | A generic KPI/card dashboard does not tell a CFO what needs a decision, why it changed, or who owns the next step. | Replace with materiality-ranked decision workspace, action queue, cited variance drivers, cash/forecast story, and drill-through. | CFO can complete five decision tasks in moderated testing ≥95%. | P0 |
| Planning/grid | Budget pages, AG Grid patterns, formula/engine work, and grid tests exist. | Need a consistent analyst-grade model workspace: formula/lineage/audit panel, version context, controlled states, collaboration/conflict and official-publish semantics. | Deliver one canonical grid shell before enhancing every planning route. | Keyboard/paste/undo/formula/lineage/workflow journeys pass E2E. | P0 |
| Close/consolidation | Components/pages/engines exist across close and consolidation domains. | The product must prove controlled close workflow, reconciliation evidence, lock enforcement, reproducibility, and exception governance end-to-end. | Build Close Cockpit vertical slice on authoritative service. | Simulated month-end completes with traceable evidence. | P0 |
| Reporting | Report pages/charts/export-related code exist. | No claim of a governed semantic layer, immutable snapshots, report certification, or a sufficiently deliberate board-pack experience can be made until verified. | Metric catalog + controlled report definitions + snapshots + evidence drawer. | Every published number drills to source/version. | P0 |
| Data/integrations | Import UI and local/server foundations exist; data import is tested. | Enterprise connector lifecycle, credential custody, mapping versioning, quality quarantine, reconciliation, retry, and observability need a durable control plane. | Build import framework and one demand-led production connector. | Import/re-run/reconcile/failure-recovery test passes. | P0 |
| Identity/tenancy | Existing mock/dev auth and server authz tests are useful foundations. | Local client state and an optional Express service are not a multi-tenant enterprise authority model. | OIDC/SAML/SCIM, policy service, tenant/entity RLS, API enforcement, access reviews. | External authz/tenant-isolation review passes. | P0 |
| Audit integrity | Local audit trails exist; audit chain hardening has been identified as pending. | Client-local/unkeyed chains cannot provide enterprise tamper resistance or independent evidence. | Authoritative append-only audit service, protected evidence sink, correlation IDs, retention/legal holds. | Attempted tamper/privilege tests and evidence export pass. | P0 |
| Offline-first | Encrypted local persistence and desktop/PWA are differentiated assets. | Offline status, mutation queue, conflict semantics, and official-vs-draft boundary need to be made explicit. | Command/sync protocol, conflict UX, testable publish authority. | Network interruption and concurrent edit E2E suite passes. | P1 |
| AI | Copilot/AI-related pages and engines exist. | AI must not be marketed as a trusted copilot without permission-aware retrieval, citations, evaluation, provider governance, and supervised actions. | Governed AI gateway and finance evaluation harness. | Red-team, citation, permission, and hallucination tests pass. | P1 |
| Sector breadth | Sector folders/configurations and many dashboards exist. | Breadth can look superficial if templates, metric dictionaries, mappings, controls, and guides are not certified together. | Five certified vertical packs; label all other sectors as configurable/experimental. | Vertical certification checklist is signed. | P1 |
| Performance & operations | Workers, benchmarks, scripts, and architecture docs exist. | Missing proof of full scale, resilience, deployment, alerting, restore, and production SLO behavior. | Reference dataset, benchmark pipeline, SRE dashboards, drills, managed deployment plan. | SLO, load, failure, and restore gates pass. | P1 |
| Accessibility & localization | A11y tests/docs and current dark/light themes exist. | Accessibility must be continuously enforced across new dense grid/workflow patterns; responsive behavior needs a deliberate product strategy. | Atlas accessibility contracts, screen-reader/keyboard journeys, locale/number/date design. | WCAG AA test suite + manual audit pass. | P1 |
| Codebase maintainability | Strong test/engine coverage and guardrails exist. | Large route/components/engines make UI evolution slow and raise regression risk. | Characterization tests then incremental decomposition by critical journey; no cosmetic rewrites inside business logic. | New canonical screens use bounded modules and meet budgets. | P1 |

### The UI/UX gap, stated plainly

The user is correct: the current experience risks immediate rejection because it resembles a **generic dark admin dashboard with finance widgets**, not a confident, purpose-built operating environment for high-stakes finance work. The issue is not simply color, icons, or adding animation. The failure modes are structural:

1. **Route-first instead of decision-first:** a long menu of functional areas asks users to know the implementation vocabulary before the system helps them decide what matters.
2. **Dashboard-card theater:** cards/charts can look polished while omitting the comparison basis, freshness, materiality, source, owner, and next action that make finance information useful.
3. **No consistent global context:** finance pages can become incompatible interpretations of entity, scenario, version, period, and currency.
4. **Generic components instead of financial patterns:** a generic table, form, modal, and card do not create an analyst-grade grid, close checklist, variance review, or board-review experience.
5. **Weak information hierarchy:** when every panel has a dark surface, border, title, badge, and button, nothing appears important. Dense finance software needs hierarchy through composition, typography, alignment, and progressive disclosure.
6. **Inconsistent journey quality:** current research documents onboarding, import, budget, reporting, scenario, approval, and consolidation friction (`docs/UX_FLOW_ANALYSIS.md`). Fixing single pages independently would preserve inconsistency.
7. **No visible trust model:** draft, calculated, stale, locked, approved, offline, failed, AI-derived, and certified states need a shared language across every screen.

### UI/UX remediation: non-negotiable sequence

Do not “refresh” all existing pages with new colors. That creates expensive inconsistency. Build a small set of hardened patterns, then migrate routes only when the pattern can make the workflow materially better.

| Workstream | Design output | Engineering output | Acceptance proof |
|---|---|---|---|
| 1. Experience research | Persona interview guide, task map, benchmark recordings, usability baselines | Instrumented current journeys with privacy-safe event taxonomy | 5 users/persona; top task baseline documented |
| 2. Atlas foundations | Token architecture, type/spacing/elevation/color/data-viz scales, icon and content rules | CSS token layer, theme contract, component playground, lint/style restrictions | No raw semantic colors/spacing in new shared UI; visual tests |
| 3. New shell | Navigation model, context bar, command palette, page-header and layout specs | `AppLayout` migration adapter; permission-aware five-pillar nav; context store/URL contract | Navigation, keyboard, responsive, and state-persistence E2E tests |
| 4. Decision workspace | CFO decision canvas and materiality/action states | New workspace composition backed by real data adapters | Moderated CFO task success and evidence drill-down test |
| 5. Analyst workspace | Grid, formula bar, inspector, audit/comment panel, model lifecycle specs | Canonical grid shell and reusable data-model interaction primitives | Keyboard + error/conflict/offline + a11y journey suite |
| 6. Close workspace | Checklist, reconciliation, certification, exception, evidence-room specs | Close Cockpit composition and policy state adapters | Controller completes close simulation without undocumented workarounds |
| 7. Report workspace | Library/designer/viewer/board-pack patterns | Controlled snapshots, narrative/evidence panels, exports | Board pack review task + snapshot reproducibility |
| 8. Migration factory | Route mapping, deprecation policy, design QA checklist | Codemods/templates, visual regression baselines, feature flags | Each route migration removes—not adds—legacy styling/interaction debt |

### UI quality bar: no exceptions

A canonical screen is rejected if it lacks any of the following:

- explicit page purpose and a single primary action;
- global context plus page-local filters with a visible reset/saved-view model;
- loading, empty, permission-denied, stale/offline, validation, and error states;
- an evidence/drill-through path for every official financial figure;
- keyboard path, focus management, screen-reader names, non-color state indicators, and minimum AA contrast;
- responsive behavior intentionally designed for desktop, compact desktop, tablet, and mobile—not merely wrapped flex rows;
- performance budget, telemetry, and visual regression coverage;
- domain-specific language instead of generic “data,” “items,” and “records”; and
- a documented owner, state model, and destructive/approval behavior.

### Controlled capability truth register — mandatory companion artifact

The roadmap is now controlled by **[`docs/CAPABILITY_TRUTH_MATRIX.md`](CAPABILITY_TRUTH_MATRIX.md)**. It is a generated, route-by-route and module-by-module baseline that covers every route discovered from `src/App.tsx` and every source module under `src/pages`, `src/engines`, `src/store`, `src/components`, and `src/services`.

**This is part of the blueprint, not optional documentation.** The register has seven required status dimensions for each route/module: source/evidence; Built; Connected; Governed; Enterprise-ready; required next evidence; and a human-reviewed maturity decision. It uses `UNVERIFIED` rather than optimistic claims until evidence exists.

| Status | What may be claimed | What cannot be inferred |
|---|---|---|
| **Built** | A source module/route exists. | That it is wired to real data, usable, secure, or tested sufficiently. |
| **Built — test evidence** | A conventionally named local test was discovered. | That all paths, integrations, workflows, or users are covered. |
| **Partially wired** | A manual audit demonstrates some real-data integration but missing lifecycle/error/policy evidence. | That the feature is safe for official financial work. |
| **Connected** | Real contract/data, state handling, and journey evidence are linked. | That it has authorization/audit/operational controls. |
| **Governed** | Server-side policy, tenant scope, validation, versioning, and audit evidence are linked. | That it meets performance/accessibility/support readiness. |
| **Enterprise-ready** | Every required evidence class is approved for a defined supported workflow. | That an unrelated route/module inherits the same maturity. |
| **Missing** | Required capability/source/evidence does not exist. | Nothing; it must be scheduled, deferred, or explicitly out of scope. |

#### Inventory operating rules

1. Regenerate the baseline with `node scripts/generate-capability-truth-matrix.mjs` whenever routing or module structure changes.
2. The generated inventory is deliberately evidence-conservative: it detects source and conventionally named local tests; it cannot and must not manufacture integration, security, usability, or operational claims.
3. Every row must receive a named owner, persona/job, data source, authorization policy, audit event, test IDs, accessibility proof, performance budget, runbook, and review date before it can move beyond `Built`.
4. The five enterprise journeys—Close, Plan, Decide, Report, and Operate—are audited first. No secondary/sector route receives higher maturity before its dependency journey is governed.
5. Duplicate, legacy, and alias routes are explicitly marked **retire**, **redirect**, or **consolidate** in the human review. Route count is not a measure of product value.
6. Maturity changes are BMAD approval events. They cannot be changed merely because code was merged or a demo looked successful.

#### Inventory completion roadmap

| Pass | Scope | Output | Gate |
|---|---|---|---|
| **Pass A — mechanical baseline** | All routes and page/engine/store/component/service modules | Generated source/test evidence matrix | Complete now; no readiness claims made |
| **Pass B — core journey audit** | Workspace, Modeling, Close, Reporting, Admin routes and their dependencies | Connected/governed evidence records and duplication map | Product + finance owner approve priorities |
| **Pass C — platform control audit** | API, server, persistence, sync, identity, audit, imports, workers | Authority/security/operability evidence | Architecture + security approval |
| **Pass D — design-system audit** | Every shared pattern and migrated canonical screen | UX/a11y/performance/visual evidence | Design + accessibility approval |
| **Pass E — vertical certification** | Each selected industry pack | Metric/template/mapping/report/control evidence | Domain owner approval |
| **Pass F — release certification** | Supported customer journeys only | Enterprise-ready release evidence pack | Executive release gate |

## 2. Target users, jobs, permissions, and moments that matter

### 2.1 Primary personas

| Persona | Primary job | First screen | Cannot compromise on |
|---|---|---|---|
| CFO / Executive | Decide where to intervene and certify the narrative. | **Executive Workspace** | materiality, confidence, cash, accountability, board-ready story |
| VP FP&A / Finance Director | Run planning cadence and forecast process. | **Planning Command Center** | scenario speed, ownership, calendar, workflow visibility |
| FP&A Analyst | Build and explain models. | **My Work + Model Grid** | keyboard speed, lineage, formulas, reliable imports, no UX friction |
| Controller / Consolidation Manager | Produce a complete, reconciled close. | **Close Cockpit** | reconciliation, locks, eliminations, certifications, audit evidence |
| Budget Owner | Submit accountable plan inputs. | **Assigned Actions** | scoped instructions, simple edits, due dates, help |
| Data / Systems Admin | Keep data secure and current. | **Operations Console** | connector health, mapping, permissions, observable failures |
| Auditor / External Reviewer | Verify evidence without altering it. | **Evidence Room** | immutable history, access scope, exportable evidence, read-only clarity |

### 2.2 Experience principles

1. **Context is global, visible, and persistent.** Entity, consolidation scope, scenario/version, period range, currency, and view mode appear in one context bar. A change explains its blast radius and never silently resets a view.
2. **Data density without visual noise.** Financial users need more information, not dashboard theater. Use compact tables, tabular numerals, progressive disclosure, and strong hierarchy.
3. **Every figure is interactive evidence.** A number can reveal formula, sources, transaction drill-down, driver contribution, FX method, edits, comments, and approvals.
4. **Actions live beside the decision.** “Create scenario,” “assign variance,” “request explanation,” “certify,” and “export” appear where the decision is made.
5. **The system communicates state continuously.** Draft, pending sync, stale, reconciled, locked, certified, failed, and AI-generated states are unambiguous text-plus-icon states—not color alone.
6. **Safe by default, fast when deliberate.** Undo for reversible drafts; confirmation with impact summary for irreversible or high-materiality actions; four-eyes approval where policy requires it.
7. **Accessibility is a functional requirement.** Full keyboard operation, visible focus, screen-reader semantics, contrast, reduced motion, and non-color signals are acceptance criteria for every component.

---

## 3. Information architecture and navigation contract

### 3.1 The five-pillar application

The sidebar must be reduced from route inventory to a task-oriented information architecture. It is collapsible, remembers state per user, and contains labels even when icons are shown.

| Pillar | Purpose | Core destinations |
|---|---|---|
| **Workspace** | Understand, prioritize, act. | Executive Workspace, My Work, Alerts, Calendar, Saved Views |
| **Modeling** | Build plans and models. | Plans, Forecasts, Scenarios, Drivers, Headcount, Model Library |
| **Close** | Produce controlled actuals and consolidation. | Close Cockpit, Reconciliations, Consolidation, Intercompany, Certifications |
| **Reporting** | Communicate governed results. | Report Library, Board Pack, Dashboards, Report Designer, Schedules |
| **Admin** | Configure and operate the platform. | Data Connections, Data Management, Entities & COA, Users & Policies, Audit, Platform Health |

A user sees only authorized pillars. Sector modules are **contextual capabilities**, surfaced inside a relevant workspace or model template, not a sprawling primary navigation tree.

### 3.2 Global command surface

`Ctrl/Cmd+K` opens a searchable command palette with five result groups: Navigate, Create, Recent, Data, and Actions. It supports keyboard-only operation, honors permissions and context, and records no sensitive query text outside approved telemetry policy.

The top bar contains: organization, global context, sync/offline status, notifications/tasks, command palette, help, and profile. It must never host unrelated page-specific controls.

### 3.3 Core screen contracts

#### A. Executive Workspace — “What needs a decision?”

- A concise headline: forecast, cash runway, and material exceptions against a selected baseline.
- KPI cards have period/comparison labels, data freshness, trend, and drill-through; no naked metrics.
- A materiality-ranked variance waterfall explains the current result.
- An “Actions required” queue exposes owner, due date, severity, workflow state, and quick actions.
- Narrative is structured: observation → evidence → driver → recommendation → owner. AI content is visibly labeled and cited.

#### B. Planning Command Center — “Can we deliver the plan?”

- Cycle timeline, coverage/completion, blocked submissions, assumptions changed, risk concentration, and forecast accuracy.
- Start a plan from template, prior version, driver model, or controlled blank model.
- Each plan has explicit lifecycle: Draft → In review → Approved → Locked → Superseded/Archived.
- Version comparison is always available; scenario forks name their base version and owner.

#### C. Analyst Grid — “Can I model quickly and safely?”

- Formula bar, named ranges, view selector, freeze panes, grouped periods, outline levels, keyboard shortcuts, copy/paste, fill, undo/redo, comments, and filters.
- Cell state is semantic: calculated/manual, draft/approved/locked, local/published, validation issue, comment, conflict. Tooltips and accessible labels explain it.
- Selection inspector shows formula, dependencies, lineage, validation, audit, and comments. A cell edit proposes a change set and records reason when policy requires.
- Large datasets use virtualization and server pagination. Excel compatibility is deliberate: imports are previewed/mapped/validated; exports identify any unsupported semantics.

#### D. Close Cockpit — “Is this period safe to close?”

- Checklist grouped by data ingestion, reconciliations, eliminations, FX, adjustments, certifications, consolidation, reporting.
- Each task has owner, due date, dependency, evidence, SLA, and escalation path.
- A close cannot advance while critical controls fail. Exceptions require approver, rationale, expiry, and audit record.
- Reconciliation expresses difference, tolerance, data freshness, matched/unmatched count, and drill-through—not a generic green badge.

#### E. Reporting & Board Pack — “Can this be trusted outside the system?”

- Report library distinguishes templates, drafts, approved reports, snapshots, and scheduled outputs.
- Designer is a governed canvas with reusable rows, dimensions, filters, formatting, data sources, and preview; it is not an unconstrained drag-and-drop toy.
- Published snapshots are immutable, versioned, signed/certified where configured, watermarked by state, and retain export evidence.

---

## 4. Design system: financial-grade, accessible, and governed

### 4.1 Visual direction

Retain the best part of the current Bloomberg-inspired foundation (`docs/DESIGN_SYSTEM_ANALYSIS.md`): information density, dark/light capability, semantic finance colors, tabular numerals. Evolve it into **FinPlan Atlas**, a tokenized design system rather than page-by-page Tailwind styling.

- **Brand posture:** calm, precise, executive, not “futuristic finance.”
- **Typography:** an accessible UI sans for interface; a high-legibility mono for figures/formulas only. Define responsive type, line-height, weight, and tracking scales.
- **Spacing:** a 4px base scale (4, 8, 12, 16, 20, 24, 32, 40, 48, 64), documented layout primitives, and no arbitrary one-off spacing in product code.
- **Color:** semantic tokens (`surface`, `text`, `border`, `action`, `positive`, `negative`, `warning`, `info`, `focus`), not raw hex in components. Charts use a tested categorical palette plus patterns/labels.
- **Elevation:** layers are meaningfully named: base, raised, floating, modal; shadows are never used as the only separation.
- **Motion:** default transitions ≤200ms, no motion needed to understand outcome, `prefers-reduced-motion` honored.

### 4.2 Component contract

Every shared component must define: purpose, anatomy, variants, states, responsive behavior, keyboard behavior, ARIA semantics, tokens, analytics events (if any), test matrix, and visual-regression story. Initial system inventory:

1. App shell, context bar, page header, split pane, resizable panel, status bar.
2. Button/action menu, confirmation dialog, toast, inline alert, empty state, skeleton, error boundary.
3. Filter bar, entity tree picker, period range picker, scenario/version picker, account picker, saved-view manager.
4. Data grid, formula bar, cell inspector, audit drawer, comment thread, attachment/evidence list.
5. KPI tile, variance tile, waterfall, bridge, trend, heatmap, table chart, narrative block.
6. Workflow timeline, task card, approval panel, certification control, exception request.

### 4.3 Content design rules

- State the financial object first: “Revenue forecast is 4.2% below plan,” not “Negative variance.”
- Always show comparison basis, currency, period, rounding, and freshness near financial conclusions.
- Destructive language is explicit: “Lock FY27 Budget” explains who loses edit capability and how to unlock.
- Error messages name problem, location, recovery, and reference ID. Never say only “Something went wrong.”
- Empty states distinguish “no data yet,” “no matching results,” “not permitted,” “loading,” and “sync failed.”

### 4.4 Design governance

Figma/pen-and-paper prototypes precede component work for new flows. Design tokens are the only styling API for shared UI. Storybook (or an equivalent isolated component environment), automated visual regression tests, and an accessibility test matrix are required before a component reaches “stable.”

---

## 5. Financial product model and authoritative data architecture

### 5.1 Canonical domains

The original schema is useful as a domain inventory but must become **bounded contexts**, not one giant implementation event:

| Domain | Authoritative entities | Core invariant |
|---|---|---|
| Identity & tenancy | organization, user, role, policy, membership | every request has tenant and scoped actor context |
| Master data | entity, hierarchy, COA, cost center, department, calendar, currency | effective-dated, versioned, importable, never silently overwritten |
| Actuals & close | journal, transaction, balance, reconciliation, certification, close period | debits equal credits; closed state blocks unauthorized change |
| Planning | plan, version, model, driver, assumption, line item, scenario | version lineage and model dependency graph are explicit |
| Consolidation | ownership, FX rate, rule, elimination, run, result | reproducible from frozen inputs and rule versions |
| Reporting | semantic metric, report definition, snapshot, schedule, distribution | published output is reproducible and immutable |
| Collaboration | comment, task, approval, notification, presence | action history is attributable and scope-aware |
| Integrations | connection, credential reference, mapping, sync job, data quality result | credentials are never application data; imports are reversible |
| Audit/evidence | append-only event, evidence artifact, retention/legal hold | tamper evidence, actor/time/request chain, exportability |

### 5.2 Money, time, and calculation rules

- Decimal fixed precision is mandatory end-to-end. Decimal.js is appropriate client-side; database numeric precision and service-level rounding policy are authoritative.
- Store money as amount + ISO 4217 currency; record original, functional, and reporting currency where applicable. Record FX rate, rate type, source, effective date, and translation method.
- Fiscal calendar is tenant-defined and supports 4-4-5, 13-period, adjustment periods, and restatements. No UI assumes January fiscal year.
- A calculation is a versioned graph: formula/version, input versions, dimensions, execution environment, timestamp, result, and validation status.
- Official numbers are reproducible. Forecast snapshots cannot change when source data changes; a new run/version is created.
- Reversals replace mutation for posted financial records. Soft-delete alone is insufficient for regulated records.

### 5.3 The local-first synchronization contract

Local encrypted storage remains a workspace cache and offline draft mechanism. Add explicit sync semantics:

- Every mutation has a UUID, actor/device, base revision, idempotency key, timestamp, and domain command.
- Server validates authorization, period status, workflow, schema, and optimistic concurrency before accepting the command.
- Conflict policy is domain-specific: comments merge; cell edits expose conflict resolution; master data requires review; published financial facts never last-write-win.
- Offline banner lists queued actions, last successful sync, failures, and “publish blocked” reason. There is no false implication that offline drafts are official.
- Conflict and retry behavior are property-tested and E2E-tested under network interruption.

### 5.4 Target platform architecture

Do **not** prematurely deploy every database listed in the old prompt. Start with operational simplicity and deliberate scale thresholds:

- **Web/BFF:** retain React/Vite for the workspace until a migration has a demonstrated business gain. Introduce a typed API client and a BFF only where security/session boundaries warrant it.
- **Core API:** evolve the existing server into modular TypeScript services behind a versioned REST API; use GraphQL only for demonstrated compositional/read needs. Fastify is a candidate ADR, not a command to rewrite Express overnight.
- **System of record:** PostgreSQL with row-level security, migrations, PITR, and partitioning is the default authoritative store. Do not use SQL.js/localStorage as enterprise authoritative persistence.
- **Async work:** a durable queue plus outbox/event publication for imports, report runs, notifications, ML, and consolidation. Start managed queue/Redis when required; Kafka only at proven multi-consumer/event-volume need.
- **Analytics:** PostgreSQL read replicas/materialized views first; ClickHouse only after workload evidence shows analytical query isolation needs.
- **Object storage:** encrypted tenant-scoped artifacts, immutable report snapshots, malware scanning, lifecycle policies, and signed access.
- **Search:** database search first; add a search platform when audit-safe cross-domain search requires it.
- **AI service:** isolated, policy-governed service; model providers are pluggable. No raw data is sent to a provider without tenant policy, minimization, and audit.

Every adoption requires an ADR covering problem, options, cost, data residency, operational ownership, SLO effect, rollback, and exit plan.

---

## 6. Functional delivery blueprint

### 6.1 Release 1 — Enterprise Decision Loop

Release only when the five jobs in §1.4 work in one tenant across a realistic reference dataset.

**Close:** import actuals; mapping/version validation; reconciliation; period checklist; certified close; controlled adjustment; multi-entity consolidation; currency translation; intercompany match/exceptions; reproducible consolidation run.

**Planning:** plan version lifecycle; driver library; assumptions; top-down/bottom-up allocations; annual-to-period spread; headcount cost model; review/approval; rolling forecast; scenario comparison; audit-worthy changes.

**Reporting:** P&L, balance sheet, cash flow, BvA, variance bridge, cash forecast, management pack; transaction drill-through; controlled report definitions; PDF/XLSX/CSV output; scheduled distribution; immutable snapshots.

**Workflow:** configurable approval/certification policies, delegated approvers, segregation-of-duties checks, reminders/escalation, exception control, evidence attachments, complete decision history.

**Data management:** CSV/XLSX plus one production-grade ERP connector chosen from customer demand; import preview; mapping; data-quality rules; quarantine; correction/resume; idempotent re-run; reconciliation report.

### 6.2 Release 2 — Collaborative Modeling and Report Design

- Real-time collaboration with presence, scoped cell locks, conflict workflow, and offline interoperability.
- Template/model library with vertical templates backed by actual domain validation—not brochure-only pages.
- Governed report and dashboard designer; metric catalog; certified semantic definitions; saved context-aware views.
- Allocation rule builder, circular-reference diagnostics, model dependency graph, model testing and promotion lifecycle.
- Connector SDK and two additional production-grade connectors selected by pipeline evidence.

### 6.3 Release 3 — Intelligence with controls

- Explainable forecasting competition (baseline, statistical, driver-based) with back-testing and bias/accuracy tracking.
- Anomaly detection ranked by materiality and false-positive feedback.
- Copilot retrieves only authorized data, produces cited answers, can prepare—not automatically execute—commands, and requires explicit confirmation/workflow for write actions.
- Narrative generation with source links, prohibited claims policy, human review, and regulated-output watermarking.

### 6.4 Vertical strategy

Retain 78-sector breadth as a **template and extension catalog**, but certify only five “deep verticals” at a time. Initial selection should be made from customer pipeline and data availability; a sensible default is SaaS, manufacturing, professional services, retail, and healthcare. A vertical earns “supported” only if it has a tested metric dictionary, model templates, data mappings, reports, user guide, demo data, and named domain owner.

---

## 7. Security, privacy, compliance, and audit posture

### 7.1 Baseline controls

- Enterprise SSO (OIDC/SAML), SCIM, MFA, session controls, device/IP policy where required.
- RBAC plus ABAC; tenant, entity, cost-center, data classification, and workflow state are authorization attributes. Enforcement is API/database side, never merely hidden UI.
- PostgreSQL RLS and tenant-scoped storage/cache/queue keys. Automated cross-tenant negative tests are required.
- TLS 1.3 in transit, envelope encryption at rest, KMS/HSM-backed keys, rotation and revocation procedure, secrets manager only. The prior hardcoded-key incident class is a release-blocking secret scan rule.
- Rate limits, schema validation, output encoding, CSRF strategy for cookie sessions, CSP, dependency and container scanning, SBOM, signed builds, and provenance attestation.

### 7.2 Audit evidence

An audit event includes who, tenant, permission context, action, before/after or secure diff reference, affected object, correlation ID, client/device, timestamp, policy result, and evidence hash. It is append-only in the authoritative service and exported to a write-once/retention-controlled sink. An unkeyed client-only hash chain is not sufficient proof against a privileged local attacker; server-side immutable storage and independently protected keys are the target.

### 7.3 Compliance roadmap

- **GA baseline:** SOC 2 control design, security policies, DPIA/data map, incident response, vulnerability SLA, backup/restore, access review, secure SDLC evidence.
- **Enterprise readiness:** SOC 2 Type II operating evidence; GDPR DSR/export/deletion policy; SOX control mappings; regional residency; HIPAA/Basel/other vertical requirements only after scoped legal review.
- Compliance is never claimed because a page exists. Each claim has an owner, evidence artifact, test/control, review cadence, and expiry.

---

## 8. Reliability, performance, and data quality SLOs

Set a reference workload before committing numbers: 20 entities, 5 years actuals, 2m GL rows, 50 concurrent planners, and 250k planning cells. Scale tiers require re-benchmarking.

| Capability | Target at reference workload | Measurement |
|---|---:|---|
| Interactive context/page switch | p95 ≤2s | real-user monitoring |
| Budget/grid initial usable state | p95 ≤3s | browser performance trace |
| Command/search result | p95 ≤500ms | API + UI trace |
| Simple report | p95 ≤5s | job telemetry |
| Complex governed report | p95 ≤30s | job telemetry |
| Import 10k normalized rows | ≤60s excluding source latency | sync telemetry |
| Consolidation (10 entities) | ≤5 min | reproducible benchmark |
| API read | p95 ≤200ms excluding asynchronous work | API telemetry |
| Availability | ≥99.9% control plane target post-GA | SLO/error budget |
| Restore | RPO ≤15 min, RTO ≤4 h initially | quarterly restore drill |

Data quality is measured independently: completeness, validity, uniqueness, referential integrity, timeliness, reconciliation difference, and mapping coverage. Failed quality controls quarantine data; they never silently coerce values.

---

## 9. Engineering quality system

### 9.1 Definition of done

A story is done only when it has: approved UX/spec; domain invariants; typed contract; server authorization; validation; loading/empty/error/offline states; telemetry; audit behavior; unit/integration/E2E tests; accessibility coverage; docs/runbook; migration/rollback plan if data changes; and product-owner acceptance against real data.

### 9.2 Test pyramid and release gates

| Layer | Required evidence |
|---|---|
| Financial engines | example, boundary, property, reconciliation, and golden-dataset tests; decimal/FX/period rules |
| API/domain | contract, tenancy/authz negative, idempotency, concurrency, migration tests |
| UI | component interaction/accessibility, visual regression, keyboard paths, error/offline states |
| End-to-end | close, plan, approval, report, import recovery, role boundary, and offline conflict journeys |
| Non-functional | load/soak, security DAST/SAST/dependency/secret scans, backup restore, chaos/failure injection |

Current checks—including TypeScript, lint, build, architecture guards, money adoption, mock-data audit, and targeted Vitest suites—are retained and made non-bypassable. Add full-suite, Playwright, bundle, benchmark, and Tauri verification to a capacity-appropriate runner; a test that cannot run is **unverified**, not “assumed green.”

### 9.3 Observability and supportability

Adopt structured logs with redaction, distributed tracing, metrics, correlation IDs, business event telemetry, audit/event separation, feature flag telemetry, SLO dashboards, on-call alerts, runbooks, and customer-safe support bundles. Never place raw financial data, secrets, or prompt content in general logs.

---

## 10. Delivery plan, dependencies, and exit criteria

### Phase 0 — Align and prove (6–8 weeks)

**Deliverables:** approved product requirements, service blueprint, user research (minimum 5 representatives per primary persona), journey maps, metric dictionary, data classification, target-domain ADRs, reference dataset, threat model update, design-token foundation, and prioritized backlog.

**Exit:** prototype tests demonstrate the new Workspace, Grid, and Close Cockpit flows; architecture review chooses the authoritative backend path; executive sponsor signs scope and quality gates.

### Phase 1 — Trust foundation (12–16 weeks)

**Deliverables:** identity/tenancy policy model; PostgreSQL authoritative store/migrations; audit evidence service; typed API; sync command contract; master-data administration; import/mapping/quality pipeline; observability; backup/restore; FinPlan Atlas shell/context/navigation.

**Exit:** independent security review of tenant isolation; restore drill; 100% of core commands audited; a customer-shaped data import passes reconciliation; no official write depends solely on local storage.

### Phase 2 — Close and plan vertical slice (16–20 weeks)

**Deliverables:** Close Cockpit, reconciliations, calendar/locks/certifications, planning model/grid, versions/scenarios/drivers, approval workflow, BvA and financial statements, evidence drill-through, selected ERP connector.

**Exit:** a finance team completes a simulated month-end and reforecast on the reference dataset; every board-pack number drills to evidence; performance SLOs pass; pilot readiness review approves.

### Phase 3 — Pilot hardening (12–16 weeks)

**Deliverables:** consolidation/intercompany/FX hardening, report designer and snapshots, collaboration foundation, implementation tools, migration tooling, support/admin console, runbooks, accessibility and localization baseline.

**Exit:** 2–3 design partners complete a controlled pilot; defect severity, uptime, adoption, and close-cycle metrics meet agreed thresholds; security/compliance evidence package is reviewable.

### Phase 4 — Scale and differentiated intelligence (ongoing)

**Deliverables:** connector SDK, certified vertical packs, advanced model governance, controlled AI, scale architecture based on telemetry, SOC 2 Type II evidence, enterprise deployment variants.

**Exit per capability:** it meets its own SLO, control, usability, and supportability bar. No feature is promoted based on demos alone.

### 10.5 UX transformation roadmap — from generic dashboard to financial operating system

This is a product rebuild at the experience layer, delivered without discarding working calculation logic. Each wave has a UX owner, technical owner, acceptance research, and a feature flag. No broad route migration begins before the shared pattern is validated.

| Wave | Duration | What ships | What explicitly does **not** happen | Exit evidence |
|---|---:|---|---|---|
| **UX-0: Discover and measure** | 2 weeks | Persona/task research, current-flow recordings, UI inventory, page taxonomy, content audit, reference dataset, analytics/privacy plan | No “quick redesign” commits | Approved decision journeys, baseline task metrics, all current UI classified as retain/rework/retire |
| **UX-1: Atlas foundations** | 3–4 weeks | Tokens, typography, data-viz palette, layout primitives, status taxonomy, empty/error/loading patterns, accessibility contract, component lab | No route-by-route paint job | Design-system review; visual/a11y regression foundation; token adoption rules merged |
| **UX-2: The shell and context** | 3–4 weeks | Five-pillar sidebar, context bar, command palette, page-header template, saved views, task/notification center, responsive desktop shell | No mass content move or deep backend rewrite | Keyboard journey, permission-aware nav, context propagation, user test success |
| **UX-3: Decision Workspace** | 4–6 weeks | CFO workspace, materiality-ranked variance review, cash/forecast story, owner/action queue, drill-through evidence | No generic widget marketplace as the first experience | Decision task test, RUM budget, design QA, real-data integration |
| **UX-4: Analyst Model Workspace** | 6–8 weeks | Canonical financial grid, formula bar, inspector, audit/comment drawer, scenario/version lifecycle, model error states | No attempt to replicate all Excel features without validated use case | Analyst workflow test including paste, formula, undo, approval, conflict, offline state |
| **UX-5: Close and reporting workspaces** | 6–8 weeks | Close Cockpit, reconciliation, exception/certification, report library/viewer, board-pack evidence surface | No ungoverned drag/drop report builder | Controller/board-review simulation, report reproducibility, accessible journey tests |
| **UX-6: Migration and retirement** | Continuous | Migrate routes by user journey; remove duplicate/legacy patterns; publish pattern adoption scorecard | No permanent parallel UI for the same job | Legacy route removal and zero new generic patterns |

### 10.6 Dependency order — the roadmap cannot be reordered for visual demos

1. **Truth and user evidence:** inventory, research, reference data, product metric definitions.
2. **Authority and safety:** tenancy/identity, audit, authorization, data classification, error/telemetry conventions.
3. **Design language and shell:** Atlas, global context, information architecture, command/actions.
4. **Core financial vertical slice:** actuals/import → reconcile → close → plan/forecast → approve → report → drill to evidence.
5. **Operational hardening:** performance, migration, restore, support, observability, deployment.
6. **Collaboration and scale:** synchronization, conflict semantics, connector framework, report designer.
7. **Controlled differentiation:** AI, certified verticals, advanced modeling, marketplace/extensions.

This order is mandatory because an attractive dashboard without canonical context, controlled data, provenance, and a working action loop is an expensive mockup—not an enterprise product.

### Team model

A credible parallel delivery team is 20–30 people: product lead, finance domain lead/controller, staff architect, 6–10 full-stack/backend engineers, 3–5 frontend/design-system engineers, 2 data/integration engineers, 2 QA/SDET, product designer + researcher, security/DevOps/SRE, implementation lead, and technical writer/support engineer. Regulated vertical work adds specialist counsel. This is an enterprise program, not a solo-feature estimate.

---

## 11. Backlog order for the existing repository

1. **Create the product truth baseline:** reconcile stale counts/docs against CI-generated inventory; mark features as shipped, prototype, wired, or planned.
2. **Run missing evidence:** Playwright, full suite, performance/benchmarks, bundle checks, and Tauri build on a suitable runner; publish results with date/environment.
3. **UX discovery and shell prototype:** do not refactor 193 routes individually. Build the Atlas shell, global context, navigation, command palette, status model, and first three canonical screens behind a feature flag.
4. **Audit hardening:** move official audit evidence to an authoritative server design; document local-chain threat limits; address key derivation/HMAC only as part of a coherent server-backed evidence model.
5. **Target backend foundation ADRs:** database, tenancy, auth, API/versioning, sync, queue, object storage, deployment. Build a thin vertical slice—not every microservice.
6. **Deliver the close-to-report vertical slice** before broadening pages, sectors, or AI.
7. **Decompose only when serving a shipped flow:** large pages/engines are technical-debt workstreams with behavior-characterization tests, not opportunistic rewrites.

---

## 12. Decisions required from the owner

| Decision | Options | Recommended default | Why it matters now |
|---|---|---|---|
| Primary buyer/user | CFO-led, analyst-led, dual | Dual: CFO outcomes + analyst-grade execution | Determines home screen and purchasing narrative |
| Deployment | desktop-first, web-first, hybrid | Hybrid two-plane | Protects local-first advantage without sacrificing enterprise control |
| Initial verticals | breadth-first, five certified verticals | Five certified verticals | Prevents shallow/unsafe sector claims |
| System of record | local-only, managed cloud, customer-managed/hybrid | managed cloud + customer-managed option | Governs audit, collaboration, integration, and compliance cost |
| First connector | QuickBooks, NetSuite, SAP, Workday, Salesforce | choose from signed design partners | Connector value is customer-specific |
| AI posture | assistant-only, supervised actions, autonomous | assistant + supervised actions | Financial write autonomy is unacceptable before proven controls |
| Product naming | FinPlan Pro vs FinanceOS | FinPlan Pro | Avoids split brand/domain naming |
| Commercial model | perpetual, subscription, hybrid | enterprise subscription + deployment/implementation | Funds security, support, integration, and operating controls |

---

## 13. Risks we will manage explicitly

| Risk | Prevention / response |
|---|---|
| Feature sprawl disguises incomplete workflows | Release by job-to-be-done vertical slices; capability maturity labels; kill/park weak modules. |
| Local-first and collaboration conflict | Define command/sync/conflict rules before real-time UX; server authority for official state. |
| “AI” creates false financial claims | Retrieval scope, citations, human approval, red-team tests, provider controls, immutable conversation audit. |
| Big-bang stack rewrite | Incremental strangler path and ADR gates; retain working financial engines while moving authority server-side. |
| Inconsistent financial definitions | Semantic metric catalog, owner, calculation version, certification, and report reuse. |
| Enterprise security debt | Threat-model every boundary, automated gates, external assessment, incident/restore rehearsals. |
| Beautiful but slow grid | Performance budgets, reference datasets, virtualization, web workers, benchmark CI. |
| Vertical claims lack depth | Certified-pack standard with domain-owner sign-off and evidence. |

---

## 14. Governance cadence and scorecard

- **Weekly:** delivery risks, quality gate failures, customer discovery, architecture decision review.
- **Biweekly:** design critique with finance-domain participants; accessibility review; demo only from reproducible environments.
- **Monthly:** security/privacy review, SLO/error budget, technical debt capacity, dependency/license scan, roadmap re-prioritization.
- **Quarterly:** restore drill, access review, penetration test/controls review, reference-scale benchmark, strategy/vertical investment decision.

Executive dashboard metrics: close duration, forecast accuracy, planning completion on time, data freshness, reconciliation exception aging, material variance action closure, report production time, active analyst adoption, task success rate, critical defects, availability, SLO compliance, and audit-evidence completeness.

---

## 15. Immediate next actions

1. Appoint an executive sponsor, product owner, finance-domain owner, security owner, and architecture owner.
2. Hold a two-week discovery sprint with CFOs, analysts, controllers, and admins; validate the five jobs and context model.
3. Approve the decisions in §12 and create ADRs for the target authority/sync architecture.
4. Build and test a clickable/high-fidelity Atlas prototype for Executive Workspace, Analyst Grid, and Close Cockpit before broad UI implementation.
5. Establish a reference dataset and a public-internal “feature truth” inventory backed by CI.
6. Select 2–3 design partners and their first connector/vertical requirements.
7. Start Phase 1 only after the acceptance gates in §10 are funded, staffed, and owned.

**The standard is simple:** a capability is not enterprise-grade because it appears in navigation, compiles, or demos well. It is enterprise-grade only when a finance professional can rely on it under deadline, an administrator can operate it safely, and an auditor can independently reconstruct what happened.
