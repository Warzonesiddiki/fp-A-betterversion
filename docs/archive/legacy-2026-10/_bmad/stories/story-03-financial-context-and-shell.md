# Story 03: Financial Context Contract and Atlas Shell

## Status: SUPERSEDED — research-contextualized and renamed (see `story-f03-financial-context-shell.md` / `story-f04-control-plane-contract-spike.md`, 2026-08-10)

## Context & Purpose

Fulfils PRD E1.1–E1.3 and UX §§3–4. Introduces a five-pillar shell and global Scope → Time → Version → Currency → Freshness context contract.

## Dependencies

- Requires Stories 01–02 DONE.
- Relevant files: `src/components/layout/AppLayout.tsx`, `Sidebar.tsx`, `Navbar.tsx`, `src/App.tsx`, `src/store/`.

## Acceptance Criteria

- [ ] Permission-aware five-pillar navigation has keyboard/current-page semantics.
- [ ] Financial context is typed, visible, URL/saved-view serializable, and explains incompatible filter resets.
- [ ] Offline/stale/queued/published labels meet UX state contract.
- [ ] Command palette is keyboard-first and does not leak financial queries to generic telemetry.

## Technical Guidance

Use adapter/feature flag; retain legacy routes until Story 01 dispositions are approved. Context authorization must be designed with Story 04 API contract; UI-only filtering is prohibited.

## Definition of Done

- [ ] Unit/E2E keyboard, context persistence, responsive and a11y tests pass.
- [ ] QA review and G6/G7 approval completed.
