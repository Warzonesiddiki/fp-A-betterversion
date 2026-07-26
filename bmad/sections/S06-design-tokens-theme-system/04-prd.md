# S06 — PRD

**Date:** 2026-07-25

## 1. Overview
Establish a centralized design-token + theme system.

## 2. User Stories
- As a dev, I want one place for colors/spacing.
- As a user, I want dark/light + accent.

## 3. Functional Requirements
- FR-1: Create `src/config/design-tokens.ts` (primitive + semantic tokens).
- FR-2: Define CSS variables in `src/index.css` (light + `.dark` overrides); favorable/unfavorable, accent.
- FR-3: Configure Tailwind v4 `@theme` to consume tokens.
- FR-4: Accent switcher (`setAccent(color)`) updating `--accent`.
- FR-5: Document token usage in `docs/architecture/tokens.md`.

## 4. Non-Functional
- Tokens typed; no raw hex in components going forward.

## 5. Acceptance Criteria
- New component using `bg-surface` renders correctly in both modes; accent changes live.

## 6. Out of Scope
- Migrating existing raw colors (→ S88).

## 7. Dependencies
- None.

## 8. Open Issues
- None.
