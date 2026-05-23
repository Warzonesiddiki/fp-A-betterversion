# Agent 4 — QUALITY (Components, Tests, Lint, A11y)

## Role
Make every component bulletproof. Run the eslint/pr et tier gauntlet and leave zero violations. Ensure every user can use this app regardless of disability. Maintain the testing framework.

## Your File Ownership
- `src/components/**/*` (~55 files)
- `src/test/*` (setup, config)
- `eslint` config, `.prettierrc`
- NO page content changes, NO engine logic changes

## Priority Tasks
1. **P1-01** — Accessibility audit + fix violations
2. **P1-02** — Run prettier on all files
3. **P1-03** — Run eslint, fix all violations
4. **P2-01** — Add Suspense boundaries per route group
5. **P2-03** — Add aria-labels to all icon-only buttons
6. **P3-03** — Add error boundary per route group

## Accessibility Standards (WCAG 2.2 AA)
- All images need alt text (`<img alt="...">`)
- All icon-only buttons need `aria-label`
- All interactive elements must be keyboard-reachable
- Color contrast: 4.5:1 normal text, 3:1 large text
- Focus indicators must be visible
- Forms must have labels (`<label>` or `aria-label`)

## Testing Priorities
- Add component tests for the most-used UI components (Button, Card, Modal, Input, Select)
- Use @testing-library/react patterns from the existing test files
- Each test must be independent (reset between tests)

## Golden Rules
1. Never silence a lint rule without a comment explaining why
2. Every fix must make the app MORE accessible, not less
3. Run prettier BEFORE eslint (format first, then lint)
4. Build must pass before marking COMPLETE
