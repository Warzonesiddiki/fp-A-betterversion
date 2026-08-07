# Contributing to FinPlan Pro

Thank you for your interest in contributing to FinPlan Pro! This project follows a specialized autonomous development protocol. Please read these guidelines before starting any work.

## 🐝 The Agent Swarm Protocol

FinPlan Pro is developed by a swarm of autonomous AI agents. Human contributors should align with this hive-mind architecture.

### 1. File Ownership
Each agent (and human contributor) must respect file ownership boundaries to prevent merge conflicts.
- **DATA:** `src/store/`, `src/types/`, `src/utils/`, `src/hooks/`
- **ENGINES:** `src/engines/`, `src/workers/`
- **PAGES:** `src/pages/`
- **QUALITY:** `src/components/`, `src/test/`
- **INFRA:** `.github/`, `src-tauri/`, `scripts/`, root configs

### 2. The Loop
Contributors should follow a similar loop to our agents:
1.  **Read & Assess:** Check `AGENT_SWARM/TASK_BOARD.md` for available tasks.
2.  **Claim:** Mark the task as `[CLAIMED]` on the board.
3.  **Execute:** Implement changes in your owned directory.
4.  **Verify:** Run `npm run build` and `npm run test`.
5.  **Commit:** Use conventional commits.

## 💻 Coding Standards

### TypeScript
- **Strict Mode:** Always on.
- **No `any`:** Never use the `any` type. Use `unknown` or specific interfaces.
- **Explicit Returns:** All functions must have explicit return types.
- **Interfaces over Types:** Use `interface` for object structures that might be extended.

### React
- **React 19 Hooks:** Use modern hooks correctly.
- **Performance:** Use `React.memo` for expensive UI components (charts, grids).
- **Styling:** Use Tailwind CSS 4 utility classes.
- **Interactions:** Add `data-testid` to all interactive elements for E2E testing.

## 🧪 Testing

- **Unit Tests:** Mandatory for all new engines, stores, and complex utils using Vitest.
- **E2E Tests:** Required for critical user flows using Playwright.
- **Coverage:** Aim for 80%+ coverage on business logic (engines).

## 📝 Commit Conventions

We follow Conventional Commits:
- `feat(agent-N): <description>`
- `fix(agent-N): <description>`
- `docs(agent-N): <description>`
- `test(agent-N): <description>`

## 🚀 Quality Gates

Before any task is considered complete:
1.  `npm run build` must pass with 0 errors.
2.  `npm run test` must pass all relevant suites.
3.  No new TypeScript errors or lint violations.
4.  No `console.log` statements in production code.

---

Together, we build the future of financial intelligence.

---

## ♿ A11y-Overrides (per NEVER-AGAIN RULE #50 A11Y-CI-ENFORCEMENT)

> **Source**: T-HE-019 cross-witness (process evidence archived in the 2026-08-07 docs triage), 2026-06-16.
> **Owner**: Hera (UI/UX Muse) + Artemis (A11Y owner) — joint co-ownership.
> **Ticket**: [A11Y-CI-ENFORCEMENT v0.2](https://example.com/ticket/A11Y-CI-v0.2) (post-ship).

### §A11y-Overrides.1 — The 4 `warn` overrides (UX-defensible downgrades)

The `eslint-plugin-jsx-a11y@6.10.2` configuration in `eslint.config.js` resolves 34 rules — 27 at `error`, 4 at `warn`, 3 at `off`. The 4 `warn` overrides are **NOT** security/compliance gaps; they are intentional developer-ergonomics tradeoffs. **Future maintainers must NOT auto-promote them back to `error` without understanding the rationale below.**

| Rule | UX rationale for `warn` (not `error`) | Investigation ticket |
|---|---|---|
| `interactive-supports-focus` | Many custom design-system widgets (Toggles, Sliders, Tabs) are role-implicit and don't need explicit `tabindex`; the rule produces false-positives on well-engineered Radix-style components. | T-A11Y-WARN-001 |
| `label-has-associated-control` | `<label>` wrapping a `<button>` (e.g., icon-button-with-tooltip) is semantically valid but the rule requires `<input>`/`<select>`. False-positives common in modern UI. | T-A11Y-WARN-002 |
| `no-autofocus` | Many modal/command-palette patterns intentionally call `focus()` after mount; `autoFocus` prop is occasionally needed. | T-A11Y-WARN-003 |
| `role-has-required-aria-props` | Some `role` values (e.g., `role="img"`) require `aria-label`; the rule has noisy false-positives on SVG components with implicit labels. | T-A11Y-WARN-004 |

### §A11y-Overrides.2 — The 3 `off` rules (legacy/overlap deprecations)

| Rule | Reason for `off` | Replacement |
|---|---|---|
| `anchor-ambiguous-text` | Genuinely noisy rule (flags "click here", "read more" etc. which is intentional in many patterns) | (none — pattern is intentional in tooltips/help text) |
| `label-has-for` | Deprecated in favor of `label-has-associated-control` | `label-has-associated-control` |
| `control-has-associated-label` | Replaced by `label-has-associated-control` | `label-has-associated-control` |

### §A11y-Overrides.3 — NEVER-AGAIN RULE #50 (A11Y-CI-ENFORCEMENT) 3-clause spec

**Clause 1 — Default level is `error`**: Any new SC for which a jsx-a11y rule exists must be enabled at `error` level by default. Any downgrade to `warn` must be documented in this `CONTRIBUTING.md` §A11y-Overrides with the UX rationale and a ticket linking to the false-positive investigation.

**Clause 2 — New rules require ARB sign-off**: Adding a new jsx-a11y rule that is NOT in `recommended` (e.g., `no-aria-hidden-on-focusable`) requires an Architecture Review Board (ARB) sign-off and a CHANGELOG entry.

**Clause 3 — Removed rules require deprecation notice**: Any rule removed from the config requires a deprecation notice + replacement rule + 30-day sunset period.

### §A11y-Overrides.4 — WCAG 2.2 coverage gap (P0 manual audit)

`eslint-plugin-jsx-a11y@6.10.2` does **NOT** have rules for the new WCAG 2.2 SCs:
- 2.4.11 Focus Not Obscured (Minimum) — see `src/__tests__/a11y/wcag-aa.test.tsx` for the manual test
- 2.4.12 Focus Appearance
- 2.4.13 Focus Appearance (Enhanced)
- 2.5.7 Dragging Movements
- 2.5.8 Target Size (Minimum)
- 3.2.6 Consistent Help
- 3.3.7 Redundant Entry
- 3.3.8 Accessible Authentication (Minimum)

These require **manual audit per page** for 8 SCs. Tracked as **A11Y-P0-1 (Focus Not Obscured BLOCKER)** (tracking doc archived in the 2026-08-07 docs triage).
