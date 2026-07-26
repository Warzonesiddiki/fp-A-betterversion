---
date: 2026-05-19
type: architecture
project: FinPlan Pro
tags: [finplan-pro, plugins, api, extensibility]
status: current
---

# Plugin System Architecture

## Files

| File | Lines | Purpose |
|------|-------|---------|
| types.ts | 323 | Type definitions (manifest, API interfaces, plugin spec) |
| PluginRegistry.ts | 248 | Lifecycle, events, storage, dependency/conflict |
| PluginLoader.ts | 196 | Validation, semver, module loading |
| PluginAPI.ts | 333 | 10 sub-API implementations |
| PluginManager.ts | 171 | High-level orchestrator |
| index.ts | 51 | Barrel export |
| PluginRegistry.test.ts | 263 | 30 tests |

## Plugin Types

`formula` | `report` | `import` | `export` | `dashboard` | `workflow` | `industry` | `theme`

## Lifecycle

```
install → validate → activate → [running] → deactivate → uninstall
```

## API Surface

- **formula** — registerFunction, unregisterFunction, listFunctions
- **reports** — registerTemplate, unregisterTemplate, listTemplates
- **import** — registerConnector, unregisterConnector, listConnectors
- **export** — registerFormat, unregisterFormat, listFormats
- **dashboards** — registerWidget, unregisterWidget, listWidgets
- **workflows** — registerRule, unregisterRule, listRules
- **events** — on, off, emit
- **storage** — get, set, delete, clear, keys (per-plugin isolated)
- **ui** — showNotification, showDialog, registerMenuItem, registerToolbarButton
- **log** — info, warn, error

## Permissions

`read-data` | `write-data` | `read-settings` | `network` | `websocket` | `read-files` | `write-files` | `notifications` | `clipboard` | `menus` | `dialogs` | `storage`
