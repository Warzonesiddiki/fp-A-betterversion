---
date: 2026-05-20
type: feature
project: FinPlan Pro
tags: [finplan-pro, plugins, architecture, extensibility]
status: current
---

# Plugin System — 2026-05-20

## Overview
FinPlan Pro has a complete plugin architecture with 9 files totaling 1925 lines.

## Files
| File | Lines | Purpose |
|------|-------|---------|
| types.ts | 323 | Type definitions (PluginManifest, PluginCapability, PluginPermission) |
| PluginRegistry.ts | 248 | Register/discover/query plugins with lifecycle management |
| PluginLoader.ts | 196 | Dynamic module loading with validation |
| PluginAPI.ts | 333 | 10 sub-APIs for plugin access |
| PluginManager.ts | 171 | High-level orchestrator (install, activate, deactivate, uninstall) |
| PluginSandbox.ts | ~200 | Sandboxed execution environment |
| PluginMarketplace.ts | ~200 | Browse/install/search plugins |
| index.ts | 51 | Barrel export |
| PluginRegistry.test.ts | 263 | 30 tests, all passing |

## Plugin Lifecycle
1. **Install** — Register plugin manifest, validate dependencies
2. **Activate** — Load module, initialize, register capabilities
3. **Deactivate** — Cleanup, remove listeners
4. **Uninstall** — Remove completely

## Capabilities
- Custom formula functions
- Custom chart types
- Custom export formats
- Custom data sources
- Custom dashboard widgets

## Security
- Sandboxed execution (no direct store access)
- Permission system (data:read, data:write, network:fetch, etc.)
- Version compatibility checking
- Dependency validation

## Related
- [[formula-engine]] — plugins can add formula functions
- [[charts]] — plugins can add chart types
- [[compliance]] — plugins audited via compliance engine
- [[MASTER_PLAN_259_GAPS]] — plugin marketplace foundation
