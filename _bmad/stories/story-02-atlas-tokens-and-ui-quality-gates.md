# Story 02: FinPlan Atlas Tokens and UI Quality Gates

## Status: SUPERSEDED — 2026-08-10 (replaced by `story-f02-atlas-foundation-completion.md`; foundation merged via PR #53; F-02 remains IN PROGRESS pending browser pixel baseline)

## Context & Purpose

Fulfils PRD E1 and UX §6. Replaces ad-hoc/generic styling foundations before screen migration.

## Dependencies

- Requires Story 01 DONE and G5 approval.
- Relevant files: `src/index.css`, shared UI under `src/components/ui/`, layout components, visual/a11y test configuration.

## Acceptance Criteria

- [ ] Primitive, semantic, financial, and component token layers are documented and implemented without breaking current theme behavior.
- [ ] Shared status patterns cover draft/calculated/manual/pending/locked/certified/stale/offline/failed/AI with non-color cues.
- [ ] Component contract includes keyboard/ARIA, loading/empty/error, responsive and visual-regression requirements.
- [ ] New shared UI lint/test convention prevents raw semantic color/spacing use outside token definitions.

## Technical Guidance

Characterize current light/dark behavior before changes. Preserve `finplan-theme` compatibility if present. Do not repaint all routes. Follow UX §§4, 6, 7.

## Definition of Done

- [ ] Token/component tests, AA checks, visual baseline, type/lint pass.
- [ ] QA review and G6/G7 approval completed.
