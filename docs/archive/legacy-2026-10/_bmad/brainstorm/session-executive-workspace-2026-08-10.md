# Brainstorm Session: Executive Finance Workspace

> **Facilitator:** Blaze · **Date:** 2026-08-10 · **Status:** DIRECTION SET — HYPOTHESIS  
> **Decision:** What should replace the generic executive dashboard while primary user research is pending?

## Input context

Rex’s desk research and the codebase audit suggest that a finance executive needs materiality, comparison context, lineage, accountability, and trusted reporting—not a grid of decorative KPIs. This remains a hypothesis pending CFO study.

## Techniques applied

How-Might-We reframing, Crazy 8s, reverse brainstorming, and impact/risk scoring.

## How might we

- How might we let a CFO identify the one decision requiring attention in under 60 seconds?
- How might we retain analyst-grade drill depth without making the executive view feel like a spreadsheet?
- How might we make freshness, scope, confidence, and evidence unavoidable but not noisy?

## Divergent phase — all concepts

1. Traditional KPI card dashboard with custom widgets.
2. Narrative-first daily finance briefing.
3. Materiality-ranked variance inbox.
4. Cash-command center focused only on runway/liquidity.
5. Board-pack reader as the application home.
6. Close-status cockpit as the CFO home.
7. Decision timeline: changes, decisions, owners, outcomes.
8. KPI scorecard with thresholds and traffic lights.
9. AI chat as the primary home surface.
10. Strategy map linking operating drivers to financial outcomes.
11. Portfolio view: entity/business-unit risk heatmap.
12. Evidence graph explorer.

## Non-obvious combinations

- 3 + 7: Material variances become decision cases with owner/due/evidence history.
- 2 + 3: Narrative explains only the ranked exceptions, avoiding generic AI commentary.
- 3 + 11: A materiality queue plus entity heatmap surfaces concentration without burying action.
- 5 + 3: Board-pack snapshot links to live exception/evidence only for authorized users.

## Crazy idea

**Decision SLA Ledger:** Every material variance creates a tracked decision with a named owner, response deadline, outcome, and post-period learning loop. Steelman: converts FP&A from reporting to operating discipline. Risk: too much workflow burden for routine variance. Decision: support materiality thresholds and only create actions deliberately or by policy.

## Convergent phase

### Evaluation criteria

Decision clarity (30%), evidence/trust (25%), actionability (20%), executive cognitive load (15%), implementation risk (10%). Scores are design hypotheses, not user-test results.

| Concept              | Clarity | Trust | Action | Load | Risk | Total / 5 |
| -------------------- | ------: | ----: | -----: | ---: | ---: | --------: |
| KPI widget dashboard |       2 |     2 |      1 |    3 |    4 |       2.3 |
| Narrative briefing   |       3 |     2 |      2 |    4 |    4 |       3.0 |
| Materiality inbox    |       5 |     4 |      5 |    4 |    4 |       4.5 |
| Cash-only center     |       4 |     3 |      3 |    5 |    4 |       3.8 |
| Board-pack home      |       3 |     5 |      2 |    3 |    4 |       3.5 |
| Close cockpit home   |       3 |     5 |      3 |    3 |    3 |       3.5 |
| AI-chat home         |       2 |     1 |      2 |    3 |    3 |       2.1 |
| Entity heatmap       |       3 |     3 |      2 |    3 |    4 |       3.0 |

## Pre-mortem — materiality-first Decision Workspace

| Failure                             | Early signal                            | Mitigation                                                                |
| ----------------------------------- | --------------------------------------- | ------------------------------------------------------------------------- |
| Users cannot agree on materiality   | queue is ignored or manually overridden | configurable metric/entity thresholds with policy owner and visible basis |
| Evidence drill-down is slow         | users export to Excel/PDF               | performance budget and direct linked source/snapshot paths                |
| Action queue becomes task noise     | excessive low-value assignments         | require materiality/role policy or explicit user creation                 |
| Executives still want headline view | requests to restore card grid           | compact top-line summary above ranked decisions, not a widget grid        |

## Recommended direction

A **Materiality-First Decision Workspace**:

1. compact financial headline with named baseline and freshness;
2. ranked material variances, each with driver/evidence/action affordance;
3. decision/action queue with owner, due date, status, and blocker;
4. optional entity concentration heatmap and concise cited narrative;
5. board-pack/snapshot link; no AI-first or generic-widget-first home page.

## Architecture flags

- [ARCH FLAG: materiality requires a governed metric/threshold/configuration model.]
- [ARCH FLAG: each financial item requires permission-aware evidence/lineage API.]
- [ARCH FLAG: actions require workflow/task/audit model.]

## Open validation questions

- Does CFO behavior favor a variance inbox over headline KPI cards?
- Which materiality threshold/metric logic is acceptable per target vertical?
- Does an executive want actions in the same surface or a separate operating review?
