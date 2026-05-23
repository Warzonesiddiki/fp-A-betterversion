# 🧠 AGENT SKILLS UTILIZATION DIRECTIVE

## ALL AGENTS — Read This Now

You have access to dozens of installed skills in `~/.opencode/skills/`, `~/.claude/skills/`, and `~/.agents/skills/`. USE THEM. Even if a skill helps only 1%, load it. Physical skills (code patterns, testing, security) and virtual skills (planning, brainstorming, documentation) alike.

## Agent-Specific Skill Recommendations

### A1 — DATA
- `frontend-patterns` (React hooks patterns)
- `testing-quality` (test patterns, coverage goals)
- `coding-standards` (naming, immutability)
- `architecture-patterns` (store architecture)

### A2 — ENGINES
- `testing-quality` (JUnit patterns → adapt to vitest)
- `financial-backtesting` (financial math validation)
- `coding-standards` (function size, naming)
- `security-review` (formula injection, XSS in eval)

### A3 — PAGES
- `frontend-patterns` (component composition, lazy loading)
- `design-system` (visual consistency, color usage)
- `accessibility` (WCAG 2.2 AA - aria labels, keyboard nav)
- `browser-qa` (test pages load without console errors)

### A4 — QUALITY
- `accessibility` (WCAG 2.2 AA - required reading)
- `e2e-testing` (Playwright smoke tests)
- `testing-quality` (component test patterns)
- `design-system` (visual audit)
- `coding-standards` (DRY, naming, readability)

### A5 — INFRA
- `deployment-patterns` (Docker, health checks, rollback)
- `devops-ci-cd` (GitHub Actions patterns)
- `security-review` (Tauri config, CSP headers)
- `git-workflow` (branching, conventional commits)
- `architecture-decision-records` (document ADRs)

## How to Load a Skill
Use the `skill()` tool with the skill name. Example:
```
skill("testing-quality")
```

## Rule
If you haven't used a skill in your last 3 task cycles, you're not using enough skills. Load at least the ones listed above for your role.

## Available Skills (Quick Reference)
- `frontend-patterns` — React/TS patterns, hooks, composition
- `accessibility` — WCAG 2.2 AA, ARIA, keyboard nav
- `testing-quality` — TDD, coverage, mock patterns
- `security-review` — XSS, injection, CSP, secrets
- `e2e-testing` — Playwright patterns
- `coding-standards` — Naming, DRY, immutability
- `architecture-patterns` — Clean architecture, DDD
- `design-system` — Visual consistency
- `browser-qa` — Visual regression
- `deployment-patterns` — Docker, CI/CD, rollback
- `devops-ci-cd` — GitHub Actions
- `git-workflow` — Branching, commits
- `financial-backtesting` — Financial math
- `click-path-audit` — State flow bugs
- `documentation-lookup` — API reference
