# FinPlan Pro — Frontend Build Blueprint

> See PLAN.md for full product scope.
> Desktop application (Tauri + React + SQLite). Zero AI. Pure calculation engine.

---

## Architecture

`
TAURI DESKTOP SHELL
  |-- Native menus, file dialogs, system tray, auto-update
  |-- Rust backend: SQLite, file I/O, export generation
  |
  -- REACT FRONTEND (Vite + TypeScript)
       |-- App.tsx -> Router + ThemeProvider + Layout
       |-- 70+ Pages (React.lazy, code-split)
       |-- 13 Zustand Stores (persisted to SQLite)
       |-- 24 Calculation Engines (pure TS, deterministic)
       |-- 44 UI Components + 35 Business Components
       |-- Exports: PDF (jsPDF), Excel (xlsx), CSV
`

## Key Technical Decisions

### Desktop Shell: Tauri v2
- 5MB installer vs 150MB for Electron
- Rust backend for native file system access
- SQLite for ACID-compliant data storage (not IndexedDB)
- Auto-updater via Tauri built-in
- Cross-platform: Windows MSI, macOS DMG, Linux AppImage

### Data Storage: SQLite (via Tauri SQL plugin)
- Each user's data in a single .db file
- Table-per-store pattern matching Zustand stores
- Direct file read/write via Rust commands
- Backup: just copy the .db file
- Migration: SQL schema versioning

### No AI
This is a deterministic calculation engine. Every output is:
- Verifiable (check the inputs)
- Reproducible (same inputs = same outputs)
- Auditable (complete calculation chain tracked)

No commentary generation. No anomaly detection. No predictions.

### Export
- PDF: jsPDF + jsPDF-autotable (existing deps)
- Excel: xlsx library (existing deps)
- CSV: native file write via Rust
- Print: CSS print-optimized layouts (existing)

## Build Order

Phase 0: Desktop shell setup (Tauri + SQLite)  
Phase 1: Data pipeline (import → validate → store)  
Phase 2: Core reports (TB, P&L, BS, CF, BvA)  
Phase 3: Planning (budgets, forecasts, scenarios)  
Phase 4: Sector configs + sector-specific metrics  
Phase 5: Polish (installer, auto-update, documentation)
