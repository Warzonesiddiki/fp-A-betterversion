---
date: 2026-05-19
type: decision
project: FinPlan Pro
tags: [finplan-pro, plugins, architecture]
status: accepted
---

# Plugin Architecture — Part 15 Implementation

## Decision

Implement plugin system as isolated module in `src/plugins/` with:
- **PluginRegistry** — lifecycle management (install → activate → deactivate → uninstall), dependency/conflict checking, per-plugin key-value storage, event system
- **PluginLoader** — manifest validation (semver version check), module loading, cache
- **PluginAPI** — 10 sub-APIs (formula, reports, import, export, dashboards, workflows, events, storage, UI, log)
- **PluginManager** — high-level orchestrator with auto-activate, bulk operations

## Rationale

- Each plugin gets isolated API instance (no shared mutable state)
- Storage API scoped per-plugin via `plugin:{id}:` prefix
- Dependency graph validated before activation
- Conflict detection prevents incompatible plugins running simultaneously
- Events API allows plugins to communicate without direct coupling

## Status

- 6 files, 1262 lines, 30 tests passing
- Build passes clean
- Committed: `bf309c6`
