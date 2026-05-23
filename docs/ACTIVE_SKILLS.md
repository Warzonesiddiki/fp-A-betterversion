# Active Skills — FinPlan Pro

Skills loaded and activated for this project. Each skill is a rule layer that guides code generation, review, and workflow decisions.

---

## 1. frontend-patterns

**What it does for FinPlan Pro:** Governs React component composition, Zustand state management, data fetching, performance optimization (memoization, virtualization, code splitting), form validation with Zod, and accessible responsive UI patterns. Directly applicable to every page/component in src/.

**Key rules:**
- Composition over inheritance — use compound component patterns (Card > CardHeader > CardBody)
- Zustand stores with subscribeWithSelector + persist + immer middleware stack
- Memoize expensive computations with useMemo/useCallback
- Lazy-load route components with React.lazy + Suspense
- Validate all user input with Zod schemas at system boundaries
- No analytics/tracking without explicit approval

**When to invoke:** Building any React component, managing state, optimizing renders, working with forms, or implementing data fetching.

---

## 2. coding-standards

**What it does for FinPlan Pro:** Baseline cross-project conventions — descriptive naming, immutability defaults, readability (KISS/DRY/YAGNI), error-handling expectations, and code-smell review. The shared floor that all other skills build on.

**Key rules:**
- Self-documenting code over comments
- Immutability by default — no mutation of function arguments
- Extract common logic into reusable functions/components
- Don't build features before they're needed (YAGNI)
- Consistent formatting enforced by linter hooks

**When to invoke:** Starting a new module, reviewing code quality, refactoring, or enforcing naming/formatting consistency.

---

## 3. tdd-workflow

**What it does for FinPlan Pro:** Enforces test-driven development — tests BEFORE code, 80%+ coverage, unit/integration/E2E test types. Directly maps to Vitest (unit), @testing-library/react (component), and Playwright (E2E).

**Key rules:**
- Write tests first (RED), implement to pass (GREEN), refactor (IMPROVE)
- Minimum 80% coverage (unit + integration + E2E)
- All edge cases, error scenarios, and boundary conditions tested
- Unit: pure functions, utils, store actions
- Integration: component + store interactions
- E2E: critical user flows (login, budget creation, report export)

**When to invoke:** Writing new features, fixing bugs, refactoring code, or adding API endpoints.

---

## 4. verification-loop

**What it does for FinPlan Pro:** Post-implementation quality gate — build check, type check, lint check, test suite, and coverage verification. Ensures nothing ships broken.

**Key rules:**
- Phase 1: `npm run build` must pass
- Phase 2: `npx tsc --noEmit` must pass
- Phase 3: `npm run lint` must pass
- Phase 4: `npm run test` must pass with 80%+ coverage
- Phase 5: Manual spot-check of changed files
- If ANY phase fails, STOP and fix before continuing

**When to invoke:** After completing a feature, before creating a PR, after refactoring, or when you want to ensure quality gates pass.

---

## 5. security-review

**What it does for FinPlan Pro:** Security checklist for auth, input validation, secrets management, XSS/CSRF prevention, and dependency auditing. Critical for a financial application handling budget data.

**Key rules:**
- No hardcoded secrets — all in environment variables
- Validate ALL user input with Zod schemas
- Sanitize output to prevent XSS
- JWT tokens in memory only, not localStorage
- RBAC enforcement at route level (5 roles: Admin/Manager/Analyst/DeptHead/Viewer)
- Audit trail for all state mutations
- No `dangerouslySetInnerHTML` without sanitization

**When to invoke:** Implementing auth, handling user input, creating endpoints, working with secrets, or storing/transmitting sensitive data.

---

## 6. accessibility

**What it does for FinPlan Pro:** WCAG 2.2 compliance — screen reader testing, keyboard navigation, ARIA patterns, focus management, and semantic HTML. Essential for a data-heavy financial app with grids and charts.

**Key rules:**
- All interactive elements keyboard-accessible
- Focus indicators with 3:1 minimum contrast ratio
- Form inputs with associated labels
- Error messages programmatically associated with inputs
- Color not the only means of conveying information
- ARIA roles on data grids (role="grid", aria-rowcount, aria-colcount)
- Modal dialogs trap focus and restore on close
- Skip-to-content link at top of each page

**When to invoke:** Building any interactive component, data grid, chart, modal, or form. Also for testing existing components for WCAG compliance.

---

## 7. eval-harness

**What it does for FinPlan Pro:** Formal evaluation framework — defines pass/fail criteria for task completion, measures agent reliability with pass@k metrics, creates regression test suites for prompt/agent changes, and benchmarks performance across model versions.

**Key rules:**
- Define expected behavior BEFORE implementation (eval-driven development)
- Run evals continuously during development
- Track regressions with each change
- Use pass@k metrics for reliability measurement
- Code-based graders for deterministic checks
- Model-based graders for subjective quality assessment

**When to invoke:** Setting up eval-driven development, defining pass/fail criteria for tasks, measuring agent reliability, or creating regression test suites.

---

## 8. strategic-compact

**What it does for FinPlan Pro:** Context management — suggests manual `/compact` at logical task boundaries rather than arbitrary auto-compaction. Prevents losing important context mid-task.

**Key rules:**
- Compact AFTER exploration, BEFORE execution (keep plan, clear research)
- Compact AFTER completing a milestone (fresh start for next phase)
- Compact BEFORE major context shifts (different task domain)
- Default threshold: 50 tool calls, then remind every 25
- Never compact mid-complex-operation

**When to invoke:** Long sessions approaching context limits, multi-phase tasks (research → plan → implement → test), switching between unrelated tasks, or when responses slow down.

---

## Additional Project Skills

### graphify
**Purpose:** Turn codebase into navigable knowledge graph with community detection.
**When to use:** Understanding architecture before touching anything, finding surprising connections.

### compound:ce-brainstorm
**Purpose:** Interactive Q&A to think through features before planning.
**When to use:** Before any multi-file feature — think requirements through before coding.

### compound:ce-plan
**Purpose:** Turn feature ideas into detailed implementation plans.
**When to use:** After brainstorming, before execution.

### compound:ce-code-review
**Purpose:** Multi-agent code review before merging.
**When to use:** After writing code, before committing.

### compound:ce-debug
**Purpose:** Systematic bug investigation — reproduce, trace root cause, fix.
**When to use:** When encountering bugs or test failures.

### gsd-execute-phase
**Purpose:** Execute plans with atomic commits and task tracking.
**When to use:** Working through a multi-step implementation plan.

### gsd-code-review
**Purpose:** Review source files for bugs, security issues, code quality.
**When to use:** After writing code, before merging.

### finplan-external-patterns
**Purpose:** 20 patterns from external research (AG Grid, Zustand, Tauri, Excel, Recharts).
**When to use:** Working with any of these specific technologies.
