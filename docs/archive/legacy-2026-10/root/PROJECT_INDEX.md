# FinPlan Pro — Project Index (Obsidian-Compatible)

> **Build Status:** ✅ Compiles clean | **Output:** Tauri v2 Windows 11 desktop app
> **Total:** 282 source files → 1 installable .exe (via NSIS)
> **See:** PLAN.md (architecture), AGENTS.md (task assignments), agents/*.md (per-agent instructions)

---

## Quick Status

| Area | Progress | Files |
|------|:--------:|:-----:|
| Infrastructure | 9/9 DONE | App shell, theme, routing, CSS |
| Types | 2/2 DONE | Core types + sector-specific types |
| Layout | 3/3 DONE | AppLayout, Sidebar, Navbar |
| Zustand Stores | 13/13 DONE | All state management |
| Mock Data | 17/17 DONE | All test data files |
| Engines | 24/24 DONE | Pure TS, no UI deps |
| UI Components | 42/44 | Missing: SplitPane, FinancialTable |
| Hooks | 8/8 DONE | All custom hooks |
| Business Components | 34/34 DONE | All domain components |
| Pages | 74/74 DONE | All routes implemented |
| Sector Configs | 15/15 DONE | All 15 sectors configured |
| **Desktop Shell** | **NOT STARTED** | Agent 4 building Tauri |
| **Tests** | **NOT STARTED** | Agent 1 building |
| **Persistence** | **NOT STARTED** | Agent 3 building |
| **Mock Data Expand** | **NOT STARTED** | Agent 2 expanding |

## Active Agents

| Agent | Task | Target Files |
|:-----:|------|:------------:|
| 1 | SplitPane + FinancialTable + engine tests | components/ui/ + __tests__/ |
| 2 | Mock data expansion + UX audit | services/mockData/ + reports/ |
| 3 | IndexedDB persistence + store audit | utils/ + reports/ |
| 4 | Tauri v2 shell + page audit | src-tauri/ + reports/ |

## Key Architecture

```
FinPlan Pro.exe (self-contained Windows 11 app)
├── Tauri v2 (Rust) + React frontend
├── SQLite database (%APPDATA%/FinPlan Pro/)
├── 24 calculation engines (pure TS)
├── 74 pages (all 4-state compliant)
├── 15 sector configs (switchable)
└── Zero external dependencies
```

## Broken Imports (FIXED ✅)

All 7 import mismatches between stores and mock data have been repaired.
