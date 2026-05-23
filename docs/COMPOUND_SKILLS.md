# Compound Engineering Skills — Activated for FinPlan Pro

## ce-brainstorm
**What:** Interactive Q&A to explore requirements and write a right-sized requirements doc. One question at a time, prefers multiple-choice, identifies scope boundaries and success criteria before any code.
**Trigger:** `/ce-brainstorm [feature idea]`
**FinPlan use:** Use before planning any multi-file feature (new engine, new page domain, new store). Produces requirements doc in `docs/brainstorms/` that `ce-plan` consumes. Key for scoping features against the 15-part prompt spec.

## ce-plan
**What:** Turns requirements into structured implementation plans with file paths, dependencies, test scenarios, and risk analysis. Does NOT implement code — decisions only. Supports deepening passes for existing plans.
**Trigger:** `/ce-plan [feature or requirements path]`
**FinPlan use:** Use after brainstorm to create plans in `docs/plans/`. Maps implementation units to specific files in `src/engines/`, `src/store/`, `src/pages/`. Critical for coordinating 5-agent parallel work — each agent gets a plan section.

## ce-code-review
**What:** Multi-agent code review with tiered reviewer personas (security, performance, testing, TypeScript). Spawns parallel sub-agents that return structured JSON findings, merges and deduplicates into single report. Supports autofix, report-only, and headless modes.
**Trigger:** `/ce-code-review [PR link or blank for current branch]`
**FinPlan use:** Run before every commit batch. Autofix mode applies safe fixes automatically. Key reviewers: `ce-security-reviewer` (auth/financial code), `ce-performance-reviewer` (store re-renders), `ce-testing-reviewer` (test coverage gaps).

## ce-compound
**What:** Documents recently solved problems while context is fresh. Creates structured docs in `docs/solutions/` with YAML frontmatter. Full mode cross-references existing docs to prevent duplicates. Headless mode for automation.
**Trigger:** `/ce-compound [optional context]`
**FinPlan use:** After fixing test regressions, store pattern issues, or build failures — compound the solution. Prevents re-discovering the same fix. Key for the "82 test failures" scenario — once fixed, the pattern is documented.

## ce-debug
**What:** Systematic bug investigation: reproduce → trace → root cause → fix. Follows causal chain before proposing fix. One change at a time, test-first discipline. Fetches from GitHub issues if referenced.
**Trigger:** `/ce-debug [issue, error, or description]`
**FinPlan use:** Use for test failures, build errors, runtime bugs. Phase 0 triages (trivial fast-path for obvious bugs). Phase 1 reproduces. Phase 2 traces root cause with predictions. Phase 3 applies fix with tests. Key for the smoke test regressions.

---

## Integration with FinPlan Workflow

```
User request
    ↓
ce-brainstorm (what to build)
    ↓
ce-plan (how to build)
    ↓
5 agents execute plan sections
    ↓
ce-code-review (verify quality)
    ↓
ce-compound (document what we learned)
    ↓
ce-debug (fix any issues)
```

## Key Patterns

- **One question at a time** — never stack questions
- **Repo-relative paths** — never absolute paths in docs
- **YAGNI** — prefer simplest approach
- **Test-first** — write failing test, then fix
- **Causal chain** — never fix without understanding why
