# UX & UI Design Specification — FinPlan Atlas

> **Status:** APPROVED HYPOTHESIS UX SPECIFICATION — Gate G3 approved by owner on 2026-08-10; primary validation remains mandatory  
> **BMAD phase:** 2 — UX Design complete  
> **Depends on:** approved hypothesis Product Brief (G1), `_bmad/prd.md` (G2 pending), `_bmad/research/research-report.md`, `session-executive-workspace-2026-08-10.md`, `usability-prototype-test-plan.md`  
> **Design goal:** Replace generic dark-admin-dashboard behavior with a finance-native operating environment without treating desk research as completed user validation.

---

## 1. Experience thesis

FinPlan should feel like an **operating system for financial decisions**: quiet, precise, dense when needed, and never ambiguous about context, authority, or evidence. It must combine the speed expectations of a spreadsheet with the trust, workflow, lineage, and control expected of a financial close/reporting platform.

### Anti-patterns explicitly prohibited

1. Card grids that repeat headline numbers without comparison basis, freshness, materiality, or action.
2. Long module/route navigation presented as an information architecture.
3. A dashboard widget marketplace before a coherent executive decision workflow.
4. Color-only positive/negative, approved/rejected, or error states.
5. Modal-driven workflows that hide financial context or lose selection.
6. Generic labels such as “items,” “records,” or “data” where a finance object is known.
7. Decorative motion, gradients, glass effects, or chart density that impair reading finance information.
8. A mobile “responsive” layout that merely wraps desktop widgets and claims complex model editing support.

## 2. Experience principles

| Principle | Product behavior |
|---|---|
| Context before content | Entity scope, period, scenario/version, currency, data freshness, and mode are visible before interpretation. |
| Signal before surface | Materiality, action required, and confidence rank above card/chrome decoration. |
| Evidence at the point of decision | Every official number, exception, and AI statement opens a permission-aware source/lineage trail. |
| Dense but calm | Use alignment, typography, whitespace, and progressive disclosure; do not make every item a bordered card. |
| Keyboard is first class | Analysts can navigate, edit, search, inspect, approve, and recover without a mouse. |
| Safe speed | Reversible draft changes are fast; material/published changes summarize impact and policy before commitment. |
| Trust is visible | Draft, calculated, stale, queued, failed, locked, certified, and AI-derived are shared explicit states. |
| One system, multiple depths | CFO sees decision summary; analyst drills into model; controller drills into reconciliation—without losing context. |

## 3. Information architecture

### 3.1 Primary navigation

| Pillar | User question | Destinations | Default persona |
|---|---|---|---|
| Workspace | What needs my attention? | Executive Workspace, My Work, Alerts, Calendar, Saved Views | CFO, all |
| Modeling | Can we deliver the plan? | Plans, Forecasts, Scenarios, Drivers, Headcount, Model Library | FP&A |
| Close | Is the period safe to close? | Close Cockpit, Reconciliations, Consolidation, Intercompany, Certifications | Controller |
| Reporting | Can I communicate a trusted story? | Report Library, Board Pack, Dashboards, Report Designer, Schedules | CFO/FP&A |
| Admin | Is the platform controlled and healthy? | Connections, Data Management, Entities/COA, Users/Policies, Audit, Platform Health | Admin |

**Rule:** Sector capabilities live as contextual templates/metrics/analysis inside these pillars. They are not first-class sidebar sprawl unless the selected certified vertical proves a recurring operational job.

### 3.2 Navigation anatomy

1. **Product rail:** organization mark, collapse control, five pillars, support/help. It is stable across the product.
2. **Pillar navigation:** contextual destinations, organized by task sequence—not source code folder.
3. **Global Context Bar:** entity/consolidation scope, period range, scenario/version, currency, data freshness/sync status, saved view.
4. **Action Bar:** page-level title, explanation, primary action, secondary actions, page-local filters.
5. **Work area:** decision/model/close/report content.
6. **Inspector rail:** contextual details (evidence, formula, comments, task, audit) that does not replace the primary work area.
7. **Status bar:** optional compact technical state for sync, formula/model recalculation, and selection.

### 3.3 Command palette

`Cmd/Ctrl+K` is the universal interaction gateway.

- Search groups: Navigate, Create, Recent, My Work, Data/metrics, Actions.
- Keyboard: open, query, arrow navigation, enter action, escape returns focus to invoker.
- Permission and context filtering occur before results render.
- “Create” results state required context and policy before action.
- Search never logs raw financial inputs to generic analytics.

## 4. Global state and trust-language system

### 4.1 Context contract

The context bar always uses this order: **Scope → Time → Version → Currency → Freshness**.

| Context | Control behavior | Guardrail |
|---|---|---|
| Organization/entity | Tree/multi-select according to entitlement | Cannot select unauthorized entity; consolidation scope labels included entities |
| Period | Fiscal calendar range selector | Shows calendar type, locked/adjustment status, comparison baseline |
| Version/scenario | Version picker with lifecycle state/base version | Disallows incompatible plan/report selection with explanation |
| Currency | Functional/reporting currency selector | Shows rate type/date and translation status when applicable |
| Freshness | Sync/data time and offline queue status | Never says “current” when data is stale or queued |

### 4.2 Shared financial states

Every state has text, icon, accessible label, and defined action:

| State | Visual treatment | Accessible label | Primary action |
|---|---|---|---|
| Draft | neutral label + pencil | “Draft; not published” | Continue/edit/submit |
| Calculated | formula indicator | “Calculated from formula; inspect dependencies” | Inspect formula |
| Manual input | input indicator | “Manual financial input” | Inspect/audit |
| Pending approval | clock label | “Awaiting approval by [role/user]” | View workflow |
| Locked | lock label | “Locked; edits are prohibited” | Request adjustment/unlock |
| Certified | check/shield label | “Certified for [scope] at [time]” | View certificate |
| Stale | time/warning label | “Data may be stale since [time]” | Refresh/view source health |
| Offline/queued | device/queue label | “Offline; [n] changes queued, not official” | View queue |
| Failed | error icon/text | “Action failed: [reason]” | Retry/resolve/support |
| AI-generated | sparkle + source count | “AI-generated draft; review sources before use” | Review/cite/approve |

## 5. Canonical workspace specifications

### 5.1 Executive Decision Workspace

**Job:** Determine what changed, why it changed, and who must act.

**Layout, desktop (1440px+):**

```
[Global Context Bar]
[Title: Executive Workspace] [Last refreshed] [Share] [Export]
[Decision headline: Forecast / cash / risk statement with named baseline]
[Materiality-ranked variance bridge            ][Actions required]
[Top KPIs with basis/freshness/drill            ][Narrative + cited drivers]
[Trend: actual / plan / forecast                ][Risk / opportunity queue]
```

- Headline maximum: one primary insight, one comparison basis, one action affordance.
- KPI tiles: label, formatted value, period, comparison, delta, trend, freshness, definition tooltip, drill-through. No unlabeled “up/down” arrows.
- Variance bridge is ranked by materiality and uses domain-aware favorable/unfavorable semantics.
- Action queue is not an activity feed: owner, due date, materiality, status, blocked reason, and next action are mandatory.
- Narrative structure: observation → evidence → driver → implication → recommended action. AI content includes citations and draft label.

**Empty state:** explains whether no data is imported, scope has no data, access is restricted, or no material items require action.

### 5.2 Planning Command Center

**Job:** Coordinate forecast/planning cadence.

```
[Context] [Plan / Forecast name + lifecycle] [Create version] [Submit / Approve]
[Cycle timeline and completion] [Blocked submissions] [Risk concentration]
[Assumption changes] [Forecast accuracy] [My assigned model areas]
[Version comparison / scenario coverage table]
```

- Lifecycle order is visible and non-negotiable: Draft → Review → Approved → Locked → Superseded/Archived.
- Progress is calculated from authoritative workflow/task status.
- “Create version” asks for base version, scope, purpose, owner, and key assumptions—not a blank modal.

### 5.3 Analyst Model Workspace

**Job:** Model quickly, understand result, and submit a governed change.

```
[Context + Model/Version lifecycle] [Undo/Redo] [Validate] [Submit]
[View / dimension / filter bar]
[Formula bar: name box | formula/value | validation | calculate state]
[Row hierarchy | Period-grouped virtualized financial grid | selection]
[Bottom/status: selected aggregates, queue/recalc state]
[Right inspector: Overview | Formula | Evidence | Comments | Audit | Tasks]
```

- Grid uses a finance table pattern, not generic data-table styling.
- Row labels are left-aligned/hierarchical; numeric values use tabular numerals/right alignment; subtotal and total treatment is semantic and consistent.
- Input/calculated/locked/error/comment/audit/conflict states use redundant non-color cues.
- Bulk paste previews affected range, validation failures, and change count before authoritative save when policy requires.
- Inspector does not hide grid selection or formula context. It is resizable and keyboard reachable.

### 5.4 Close Cockpit

**Job:** Complete close with evidence and controlled exceptions.

```
[Close period + status] [Close controls summary] [Escalate] [Certify / Lock]
[Checklist by: ingest | reconcile | IC | FX | adjustments | certify | report]
[Selected control detail: owner, SLA, dependencies, evidence, comments]
[Exceptions and blockers] [Recent evidence / activity]
```

- Progress never uses a simple percentage without listing blockers.
- A task shows one of: not started, in progress, blocked, awaiting evidence, awaiting approval, complete, exception approved, failed.
- Reconciliation detail centers on source/target/tolerance/difference/matched/unmatched/drill-through.
- Close/lock destructive actions use an impact review: scope, blockers, approvers, irreversibility, and adjustment path.

### 5.5 Report and Board Pack Workspace

**Job:** Review/publish a controlled financial narrative.

```
[Report identity + status + as-of context] [Run] [Publish] [Export] [Share]
[Outline / report sections] [Report canvas] [Evidence / comments inspector]
[Snapshot/version history] [Distribution / certification]
```

- Canvas favors report readability: true hierarchy, statements/tables before visual decoration, print-aware pagination, and stable number alignment.
- Snapshot mode visibly differs from edit/draft mode.
- Every value can explain definition, source, scope, calculation/FX, and last publication.
- Exports declare currency, period, scope, draft/certification status, and data cut-off.

## 6. FinPlan Atlas design system

### 6.1 Token layers

| Layer | Tokens | Rule |
|---|---|---|
| Primitive | neutral, blue, green, amber, red palettes; spacing; radii; shadow; font families | Not used directly by product components except token definitions |
| Semantic | surface, text, border, action, focus, positive, negative, warning, info, disabled | Components consume semantic tokens only |
| Financial | input, calculated, locked, certified, stale, variance-favorable, variance-unfavorable, subtotal, total | Must include text/icon/pattern behavior, not only color |
| Component | button, grid, metric, chart, panel, dialog, workflow, empty/error/loading | Versioned contracts and variants |

### 6.2 Typography and spacing

- UI sans: chosen for high legibility; mono applies only to numeric/formula/data-grid contexts.
- Type scale: 12, 13, 14, 16, 20, 24, 32px with documented line heights/weights; no arbitrary heading sizes in feature code.
- Spacing: 4px base; permitted scale 4/8/12/16/20/24/32/40/48/64.
- Numbers: tabular numeral variant, right aligned; negative format and accounting format selectable by report/context policy.
- Dense modes are a deliberate setting with minimum 44px target for primary touch controls in touch contexts; dense grid cells remain keyboard-first desktop controls.

### 6.3 Color and data visualization

- Meet WCAG 2.2 AA contrast for textual states in both themes.
- Positive/negative is never solely red/green; use signed value, label, icon/pattern, and context.
- Categorical chart palette provides at least 8 distinguishable accessible colors plus pattern/label fallback.
- Charts require title, unit/currency, period, source/basis, accessible table/data alternative, and no misleading truncated axis.
- Waterfall/bridge default: baseline, drivers, subtotal/total distinctly encoded; data labels/tooltip provide exact decimal policy value.

### 6.4 Component quality contract

A component may enter the stable Atlas catalog only with: anatomy; variants; semantic tokens; keyboard/ARIA spec; responsive rule; loading/empty/error/disabled states; content rules; tests; visual regression story; ownership; changelog.

## 7. Interaction, accessibility, and responsive requirements

### Keyboard map (canonical baseline)

| Interaction | Requirement |
|---|---|
| Global command | Cmd/Ctrl+K open; Esc close and restore focus |
| Navigation | Arrow/Tab according component semantics; Enter activates; current route announced |
| Grid | Arrow navigation, Enter/F2 edit, Escape cancel, Tab moves cell, Shift+arrow range, accessible selection announcement |
| Inspector | Opens from selected object by keyboard; focus returns to originating cell/control |
| Dialog | Trapped focus, labelled title/description, escape only when safe, focus restore |
| Filter/context | Full keyboard selection, clear/reset, result count and scope announcements |
| Status changes | Important async/workflow status announced through appropriate live region without noisy repetition |

### Responsive contract

- **Wide desktop ≥1440:** rail + full context + work area + optional inspector.
- **Desktop 1024–1439:** compact rail, context may collapse non-critical labels, inspector is toggleable pane.
- **Tablet 768–1023:** task review/approval/report consumption supported; complex grids use dedicated full-screen model mode or read-only warning when edit quality cannot be preserved.
- **Mobile <768:** My Work, approval, alerts, report review, evidence review, and simple input tasks only. Do not claim full model editing parity.

## 8. UX research and validation plan

| Study | Participants | Questions | Exit criterion |
|---|---:|---|---|
| IA/tree test | CFO, FP&A, controller, budget owner | Can users find five jobs/destinations? | ≥90% direct-find rate |
| Executive workspace usability | 5 CFO/finance leaders | Can they identify material issue, evidence, owner, action? | ≥95% task success across sample |
| Analyst model test | 5 analysts | Can they change a driver, inspect formula, resolve error, submit? | ≥95% success; no critical keyboard failure |
| Close simulation | 5 controllers | Can they identify blocker, reconcile, exception, certify? | 100% control-path completion |
| Report/board review | 5 CFO/board-prep users | Can they validate number and publication status? | ≥95% evidence retrieval success |
| Accessibility audit | keyboard + screen reader specialists | Do canonical workflows meet AA/operability? | No critical/blocking issue |

## 9. Architectural implications flagged for Phase 3

1. Global context requires a typed, permission-aware, URL/saved-view serializable query model and server filtering.
2. Trust states require common lifecycle/event semantics across planning, close, reports, sync, and AI.
3. Evidence inspector requires authoritative lineage/audit APIs; it cannot be fabricated from client state.
4. Grid offline/collaboration requires command IDs, base revisions, idempotency, conflict policy, and queue observability.
5. Report snapshot/publish experience requires immutable artifact storage, policy, versioning, distribution, and export audit controls.
6. Responsive constraints must be first-class product policy; desktop-only complex actions cannot be silently exposed as broken mobile controls.

## 10. Gate G3 decision

**Approve, request changes, or reject this UX specification.**

Approval authorizes Phase 3 architecture design after G2 also approves the PRD. It does not authorize implementation.
