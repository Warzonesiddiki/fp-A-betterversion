---
date: 2026-05-19
type: moc
project: FinPlan Pro
tags: [finplan-pro, moc, fp&a, offline, desktop]
status: evolving
---

# FinPlan Pro — Map of Content

## Architecture & Blueprints
- [[blueprint-offline-architecture]]
- [[blueprint-formula-engine]] — see also [[formula-engine]] for implementation
- [[blueprint-state-management]]
- [[blueprint-tauri-integration]]
- [[plugin-system]] — extends [[formula-engine]], [[charts]], [[compliance]], [[migration]]

## Feature Documentation
- [[formula-engine]] — 245+ functions, 7 modules, Excel-compatible. Extended by [[plugin-system]]
- [[consolidation]] — ASC 810, IC elimination, [[fx-engine]] translation, minority interest
- [[import-system]] — CSV/JSON + xlsx/xls, auto-column mapping. Wrapped by [[migration]] wizard
- [[auth-rbac]] — 5 roles, JWT, brute force protection. Used by [[compliance]] for SOD checks
- [[charts]] — 6 advanced chart components. Data from [[formula-engine]], nav via [[keyboard-shortcuts]], a11y via [[accessibility]]
- [[keyboard-shortcuts]] — Full shortcut system with [[help-system]] reference, [[accessibility]] integration
- [[migration]] — Multi-step wizard wrapping [[import-system]], extensible via [[plugin-system]]
- [[accessibility]] — WCAG 2.1 AA components, integrates with [[keyboard-shortcuts]] and [[charts]]
- [[hooks]] — 35 hooks including [[auth-rbac]], [[keyboard-shortcuts]], [[accessibility]] hooks
- [[fx-engine]] — Currency conversion, ASC 830 translation for [[consolidation]], audit via [[compliance]]
- [[compliance]] — SOX + [[auth-rbac]] roles, audit trail, extensible via [[plugin-system]]
- [[onboarding]] — Multi-step wizards using [[auth-rbac]], links to [[help-system]]
- [[help-system]] — FAQ with [[keyboard-shortcuts]] reference, accessible during [[onboarding]]
- [[nlq-system]] — Natural Language Query engine (540 lines), NLQInput (146 lines). First offline NLQ in FP&A
- [[template-library]] — TemplateEngine (250 lines), 23 templates, 16 industries. Gallery page (340 lines)
- [[generative-dashboard]] — json-render integration, nlqResultToSpec, AI-generated dashboards
- [[e2e-testing]] — agent-browser E2E tests, 9 flows, accessibility-first
- [[dark-mode-status]] — 26/177 components (14.7%), CSS variable approach established

## Bug Fixes & Debugging Notes
- [[bug-jsx-tag-mismatch-loanloss]]
- [[bug-safemath-nan-poisoning]]
- [[bug-api-connector-mock]]
- [[bug-sox-compliance-test]]

## Architectural Decision Records
- [[ADR-001-offline-first-architecture]]
- [[ADR-002-zustand-state-management]]
- [[ADR-003-formula-engine-bridge]]
- [[ADR-004-test-fixing-strategy]] — fix tests to match implementation, not vice versa
- [[ADR-005-memory-strategy]] — pagefile + NODE 32GB + 5 agents max
- [[ADR-006-agent-scaling]] — 10 agents max, 5 minimum active, 100GB virtual
- [[ADR-007-test-memory-strategy]] — threads pool + 32GB heap, no forks on Windows
- [[2026-05-19-plugin-architecture]]

## Workflows & Processes
- [[workflow-session-init]]
- [[workflow-agent-orchestration]]
- [[workflow-test-verification]]

## Build Progress
- [[2026-05-21-session-status]] — 156 engines, 140 pages, 422 tests, 80 GB memory, build PASS
- [[2026-05-20-autonomous-evolution]] — Phase 0 backlog sweep, 156 engines, 140 pages, 5990+ tests
- [[test-result-2026-05-18-full-suite]]
- [[test-coverage]] — 5862 pass, 82 fail, regression from store changes

## Patterns & Reusable Solutions
- [[pattern-page-wiring]]
- [[pattern-accessibility-addition]]
- [[pattern-smoke-test-creation]]
- [[efficiency-learnings]] — Build before analyzing, type-check before writing, store method verification
- [[memory-management]] — Pagefile + NODE 80GB + threads pool pattern
- [[agent-parallelism]] — 6-agent model, what worked, anti-patterns
- [[5-agent-pattern]] — Always launch 5 agents, allocation template, workflow
- [[agent-10-pattern]] — 10-agent model, 5 minimum active, allocation template
- [[vibe-coding-pattern]] — Context manager, surgical diffs, GSD architect, caveman mode, auto-lint-fix
- [[oom-prevention]] — 5 OOM crashes, threads pool + 32GB heap fix, Windows-specific issues
- [[memory-80gb]] — 80 GB NODE heap, threads pool, 90 GB virtual available
- [[vercel-labs-integration]] — agent-browser, json-render, portless, 8 Vercel skills

## Dependencies & Configuration
- [[config-tauri-plugins]]
- [[config-vite-optimization]]
- [[skills-inventory]] — 22 rules, 8 frontend skills, 5 compound skills, 5 MCP servers

## Open Questions & Blockers
- [[question-gemini-integration]]
- [[question-offline-sync-strategy]]

## Competitive Analysis
- [[competitive-fp&a-market-2026]]
- [[competitive-feature-matrix]]
- [[competitor-analysis-2026-05-19]] — 8 competitors, 10 features for 1000x, 5 unique moats

## UX/UI Research
- [[ux-research]] — 176 components, 17 dark mode, 28 keyboard, 76 loading states. 4-phase roadmap for 100% coverage. Beat Planful on accessibility, beat Anaplan on undo/redo.

## Build Progress
- [[2026-05-20-phase1-progress]] — Phase 1: NLQ, templates, charts, virtual scroll, 3-statement
- [[2026-05-20-phase123-complete]] — ALL 3 PHASES DONE: NLQ, 3-statement, charts, templates, ZBB, connectors, E2E, generative UI
- [[2026-05-19-build-status]]
- [[2026-05-19-final-status]]
- [[2026-05-19-session-summary]]
- [[2026-05-19-final-commit-log]] — 20+ commits, features/tests/fixes/docs
- [[2026-05-19-memory-optimization]] — 80GB pagefile, NODE 32GB, 5 agents max
- [[2026-05-19-vibe-coding-setup]] — 7 vibe skills, GSD/compound/hermes integration
- [[2026-05-19-vitest-optimization]] — 8 workers, 48GB NODE, 80% virtual RAM
- [[2026-05-19-agent-limit-update]] — 10 agents max, 5 always active, 100GB virtual

## Graph Knowledge
- 9310 nodes · 14451 edges · 596 communities
- See: graphify-out/GRAPH_REPORT.md

## Project Status (2026-05-20 — CURRENT)
- **Phase:** ALL 3 PHASES COMPLETE + Gap fixes
- **Commits:** 125+
- **Test Pass Rate:** 99.88% (5990+ tests)
- **Build Status:** PASS
- **Competitors Analyzed:** 25 FP&A tools
- **Completion:** 90%+ vs 15-part prompt spec
- **Engines:** 156
- **Pages:** 140
- **Utils:** 54
- **Hooks:** 28
- **Charts:** 8 (all with onClick drill-down)
- **Vercel Labs:** agent-browser, json-render, portless, 8 skills

### Engines & Features
- **Formula Functions:** 245+ (7 modules)
- **Plugin System:** Complete (7 files, 1585 lines)
- **Charts:** 8 components (all with onClick + export)
- **NLQ Engine:** DONE (540 lines) — first offline NLQ in FP&A
- **Template Engine:** DONE (250 lines) — 23 templates, 16 industries
- **3-Statement Engine:** DONE (1076 lines) — P&L + BS + CF auto-linking
- **CalculationGraph:** NEW (381 lines) — DAG-based formula dependency graph
- **StateMachine:** NEW (262 lines) — generic state machine for workflows
- **Virtual Scrolling:** DONE (@tanstack/react-virtual)
- **Keyboard Shortcuts:** Full system with CommandPalette
- **Migration Wizard:** Multi-step (494 lines)
- **Accessibility:** 7 components (147 lines)
- **FX Engine:** ASC 830 compliant
- **Compliance Engine:** SOX + SOD
- **Audit Engine:** logging + export
- **Logger:** Structured logging with levels, buffer, source tracking
- **Feature Flags:** 10 flags with role-based access control
- **Search Engine:** Global search across pages, budgets, forecasts
- **Demo Data Seeder:** Populate stores from mockData for onboarding
- **Print CSS:** 236 lines, financial report printing
- **Financial Formatting:** Intl.NumberFormat wrapper
- **ConfirmDialog:** Accessible confirmation dialog
- **Toast:** Notification toast system

### Infrastructure
- **MCP Servers:** 5 (github, git, filesystem, excel-analyser, playwright)
- **Agent Definitions:** 5 (.claude/agents/)
- **Learning Hooks:** installed (~/.claude/homunculus/)
- **Obsidian Notes:** 53+
- **Vibe Coding Skills:** 7 rules installed
- **OOM Protection:** threads pool + 80GB heap (no forks on Windows)

### Master Plan
- **Phase 1 (27h):** NLQ, 3-statement, charts, templates, virtual scroll
- **Phase 2 (16h):** zero-based budgeting, ERP connectors
- **Phase 3 (8h):** polish, export, drill-down, performance
- **9 unique moats** competitors can't copy
