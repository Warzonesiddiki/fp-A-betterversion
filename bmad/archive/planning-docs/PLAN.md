<!-- LEGACY: Superseded by FINPLAN_PROJECT_BLUEPRINT.md + MASTER_PLAN_V2.md (2026-05-24) -->
﻿# FinPlan Pro — Complete Platform Blueprint

> Version: 3.2 | Status: Active Development
> Mission: Replace 1,000+ FP&A analysts across ALL global sectors
> Architecture: TRUE self-contained Windows 11 desktop application
> Runtime: Zero external dependencies. Zero cloud. Zero browser requirement.
> Output: Single installable .exe via Tauri v2 + NSIS installer

---

## ARCHITECTURE

```
FinPlan Pro.exe (self-contained)
├── Tauri v2 (Rust) — native Windows window, file system, SQLite, auto-update
├── React frontend — compiled, embedded in binary
└── SQLite database — local file in user's app data directory

NO browser required. NO cloud. NO internet. NO external dependencies.
Everything in one installable file. Windows 11 ONLY.
```

## HOW IT WORKS

1. User downloads a single .exe file (~10MB)
2. Double-click the MSI installer
3. App installs to Program Files, appears in Start Menu
4. Opens as a NATIVE desktop window — no browser, no webview
5. All data stored in `%APPDATA%/FinPlan Pro/finplan.db` (SQLite)
6. All calculations run on-device — no server, no cloud
7. Updates via built-in auto-updater
8. Works fully OFFLINE — no internet required

## WHAT IT IS NOT

- Not a web app (no browser tabs, no URLs, no server)
- Not a PWA (no browser chrome, no address bar)
- Not a cloud service (no login, no subscription, no vendor lock-in)
- Not cross-platform (Windows 11 only — optimized for it)

## TECH STACK

| Layer | Technology | Why |
|-------|------------|-----|
| Desktop Shell | Tauri v2 (Rust) | 5MB binary, native Windows, SQLite |
| Frontend | React 19 + TypeScript 5.9 | Compiled, embedded in binary |
| State | Zustand 5 + SQLite | Persisted, ACID-compliant |
| UI | Tailwind 4 + CSS variables | Dark/light |
| Charts | Recharts | Client-side SVG |
| Data Grid | AG Grid Community | Excel-like editing |
| Database | SQLite (via Tauri) | Local file, reliable |
| Build | Vite 7 + Tauri CLI | Optimized, embedded |
| Installer | NSIS (via Tauri) | Windows MSI/Setup.exe |

## FILE COUNT

282 TypeScript/React source files → compiled → embedded in executable
