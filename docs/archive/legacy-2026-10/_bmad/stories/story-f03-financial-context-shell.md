# Story F-03: Financial Context Contract and Atlas Shell

> **File history:** created as `story-03-financial-context-and-shell.md`; research-contextualized and renamed F-03 on 2026-08-10 (YOLO mode).

## Status: DONE — implemented and QA approved 2026-08-10 (see `_bmad/qa/story-f03-financial-context-review.md`)

## Size: L | Risk: MEDIUM

## Why This Story Exists

Fulfils PRD Epic E1 (product truth, navigation, global context) and UX §§3–4 (information architecture, global state/trust language). Without a typed, visible financial context, the product cannot answer "what is this screen showing and how fresh is it?", which is the precondition for the close → decision → board-pack loop.

## Research Context

- R-03: finance credibility requires explicit authority/evidence context; R-04: generic dashboards without context do not demonstrate a decision loop.
- Atlas foundations (F-02) provide `PageHeader`, `FinancialStatusBadge`, `FinancialWorkspaceEmptyState` and the heading-hierarchy contract; this story builds the shell/context layer on top.
- Trust states (draft/certified/locked/stale/failed/offline-queued) are already textual/non-color-only in the Atlas contract — this story makes them global and permission-aware.
- No ICP, connector, vertical, or deployment decision is pre-decided; context is a safe foundation.

## Dependencies

- Requires: F-02 foundations merged (PR #53) — COMPLETE; story-f01 capability governance — COMPLETE.
- Files to inspect/modify: `src/App.tsx`, `src/components/layout/AppLayout.tsx`, `Sidebar.tsx`, `Navbar.tsx`, `src/store/`, `src/components/ui/FinancialStatusBadge.tsx`, `docs/design/FINPLAN_ATLAS.md`, `_bmad/prd.md` (E1), `_bmad/ux-design.md` (§§3–4).
- Depended on by: F-04 (context envelope), P-01…P-07 (context-aware pilot slice).

## Acceptance Criteria

- [x] AC1: Permission-aware five-pillar navigation has keyboard/current-page semantics and exposes no inaccessible destination as an enabled action.
- [x] AC2: Financial context (entity/scope, period range, scenario/version, currency, freshness) is typed, visible on canonical screens, and serialized into shareable/saved views without leaking unauthorized scope.
- [x] AC3: Context changes show affected dimensions and reset only incompatible page-local filters with an explicit explanation.
- [x] AC4: Offline/stale/queued/published states use the Atlas trust-language contract (text + icon + accessible name; never color-only).
- [x] AC5: Cmd/Ctrl+K command palette is keyboard-first, permission-filtered, and never emits sensitive financial query text to generic telemetry.
- [x] AC6: Server-side context filtering is used for official views; no client-only authorization filtering for official data.

## Implementation Context

- Use adapter/feature-flag approach; retain legacy routes until dispositions are approved.
- `FinancialContext` is a typed contract shared with the F-04 API envelope — define it once in a shared types module.
- Respect the Atlas heading-hierarchy rule (page h1; sections h2; nested panels h3).
- Do not implement MaterialityPolicy, DecisionCase, or authoritative controls in this story.

## Out of Scope

- Decision Workspace logic; close/planning/reporting redesign; connector or vertical selection; browser/PWA support changes (current Tauri gate stays).

## Definition of Done

- [ ] All ACs verified; unit/interaction/a11y tests cover keyboard, context persistence, responsive, and state semantics.
- [ ] Typecheck and changed-file lint pass; full targeted suite green.
- [ ] QA review records explicit verdict (`_bmad/qa/`).
- [ ] Capability Truth Matrix and project context updated.
