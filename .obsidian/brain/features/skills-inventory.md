---
date: 2026-05-19
type: feature
project: FinPlan Pro
tags: [finplan-pro, skills, inventory, tools]
status: current
---

# Skills Inventory

## Vibe Coding Rules (22 total in `.claude/rules/`)

| Rule | Purpose |
|------|---------|
| skill-vibe-context-manager | Context bleed prevention |
| skill-surgical-diffs | Patch-only edits |
| skill-gsd-architect | Plan-before-build |
| skill-caveman-mode | Speed communication |
| skill-auto-lint-fix | Self-correction loop |
| skill-finplan-scope | FP&A scope guard |
| skill-zustand-pattern | Canonical store pattern |
| finplan-conventions | TS/component/naming standards |
| finplan-financial | Number formatting, variance display |
| finplan-testing | Coverage requirements, test org |
| finplan-security | Auth, RBAC, input validation |
| finplan-accessibility | WCAG 2.1 AA compliance |
| agents.md | Agent orchestration rules |
| code-review.md | Review standards |
| coding-style.md | Code style rules |
| development-workflow.md | Feature implementation flow |
| git-workflow.md | Commit/PR workflow |
| hooks.md | Hook configuration |
| patterns.md | Reusable patterns |
| performance.md | Model selection, context management |
| security.md | Security constraints |
| testing.md | Testing standards |

## Frontend/Testing Skills (8 from everything-claude-code)

| Skill | What It Does |
|-------|-------------|
| frontend-patterns | React component patterns, hooks, state management |
| coding-standards | Code quality, naming, structure |
| tdd-workflow | Test-driven development cycle |
| verification-loop | Verify implementations work |
| security-review | OWASP Top 10, dependency scanning |
| accessibility | WCAG compliance, screen reader support |
| eval-harness | Evaluation and benchmarking |
| strategic-compact | Context management for long sessions |

## Compound Engineering Skills (5)

| Skill | What It Does |
|-------|-------------|
| ce-brainstorm | Structured requirement brainstorming |
| ce-plan | Implementation planning with dependencies |
| ce-code-review | Multi-perspective code review |
| ce-compound | Document learnings for reuse |
| ce-debug | Systematic debugging protocol |

## MCP Servers (5)

| Server | Purpose |
|--------|---------|
| github | GitHub API access |
| git | Git operations |
| filesystem | File system access |
| excel-analyser | Excel file parsing |
| playwright | E2E browser testing |

## Agent Definitions (5 in `.claude/agents/`)

| Agent | Phases |
|-------|--------|
| a1-consolidation | 1, 8, 15 |
| a2-reports | 5, 6, 10, 13 |
| a3-persistence | 2, 4, 12, 16, 17 |
| a4-onboarding | 3, 9, 11, 14 |
| a5-content | 19-68 |

## External Repos Cloned

| Repo | Location | Value |
|------|----------|-------|
| awesome-claude-code-toolkit | .claude/toolkit/ | 135 agents, 35 skills |
| compound-engineering | .claude/compound/ | 49 agents, 36 skills |
| hermes-agent | .claude/hermes/ | Self-improving agent |
| get-shit-done | .claude/gsd/ | 29 agents, hooks, commands |

## Related

- [[vibe-coding-pattern]] — workflow using these skills
- [[vibe-coding-setup]] — installation details
- [[MOC-FinPlan-Pro]] — master index
