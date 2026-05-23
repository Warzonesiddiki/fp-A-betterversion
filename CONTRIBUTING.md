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
