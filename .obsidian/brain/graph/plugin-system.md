---
date: 2026-05-19
type: graph
project: FinPlan Pro
tags: [finplan-pro, graph, plugins]
status: current
---

# Plugin System — Graph Analysis

## Nodes

- `PluginRegistry` — central hub
- `PluginLoader` — depends on Registry
- `PluginAPI` — 10 sub-API nodes
- `PluginManager` — orchestrates Registry + Loader + API

## Edges

```
PluginManager → PluginRegistry (uses)
PluginManager → PluginLoader (uses)
PluginManager → createPluginAPI (calls)
PluginLoader → PluginRegistry (registers into)
PluginRegistry → PluginAPI (binds to entries)
PluginRegistry → Plugin (lifecycle)
PluginAPI → FormulaSpec (registers)
PluginAPI → ReportTemplate (registers)
PluginAPI → ImportConnector (registers)
PluginAPI → ExportFormat (registers)
PluginAPI → DashboardWidget (registers)
PluginAPI → WorkflowRule (registers)
```

## Communities

1. **Core** — Registry, Loader, Manager (lifecycle)
2. **API** — All 10 sub-APIs (extension surface)
3. **Types** — types.ts (shared contracts)
