# CLAUDE.md — FinPlan Pro Project Guide

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev              # Vite dev server on :5173 (strictPort)
npm run build            # Production build (Tauri-ready)
npm run test             # Run all 5990+ tests with 80GB heap
npm run lint             # ESLint with auto-fix
npm run format           # Prettier formatting
npx tsc --noEmit        # Type checking
```

## Project Overview
FinPlan Pro is an enterprise FP&A platform. It is ~90% complete and currently in **Phase 4: Operational Excellence**.

### Architecture
- **Framework**: React 19 + TypeScript + Vite + Tailwind CSS (4.0).
- **State**: Zustand (Immer + Persist + MasterStorage bridge).
- **Persistence**: SQLite (via Tauri) + IndexedDB (Web fallback).
- **Engines**: 156 specialized financial engines in `src/engines/`.
- **A11y**: WCAG 2.1 AA compliant components.

### Core Modules
- **Formula Engine**: Excel-compatible, 245+ functions, DAG-based evaluation.
- **Data & GL**: Robust import system (Excel/CSV) with auto-mapping.
- **Reporting**: Three-statement engine (P&L, BS, CF), BVA, and Sector KPIs.
- **AI Analyst**: Local GPU-accelerated anomaly detection (Transformers.js).

### Industries Supported
- SaaS, Manufacturing, Retail, Banking, Healthcare, Energy, Real Estate, Construction, Insurance, Telecom, Logistics, Hospitality, Government, Education, Agriculture.

## Directory Map

| Directory | What lives here |
|-----------|----------------|
| `src/store/` | 30+ Zustand stores, colocated `.test.ts` files |
| `src/engines/` | 150+ pure calculation engines (financial logic, no side effects) |
| `src/pages/` | Route pages, 30+ domain subdirs, all `React.lazy` |
| `src/components/ui/` | 80+ atomic UI primitives, barrel-exported via `index.ts` |
| `src/components/` | Domain components (budget/, reports/, analytics/) |
| `src/hooks/` | 40+ custom hooks (`use` prefix) |
| `src/workers/` | Web Workers (Monte Carlo, consolidation, formulas) |
| `src/services/` | API layer, WebSocket, collaboration |
| `src/plugins/` | Plugin system (registry, sandbox, marketplace) |
| `src/utils/` | Formatters, calculations, storage, encryption |
| `src/config/` | Design tokens, keyboard shortcuts, sector configs |
| `src/types/` | Shared TS types |
| `src/test/` | Test setup, mocks, utilities |
| `src-tauri/` | Tauri desktop shell (Rust) |

## Development Standards
- **Exports**: Named exports only — no default exports.
- **Imports**: Use `@/` path alias for all internal modules.
- **TDD**: Write failing tests in `*.test.ts(x)` before implementation.
- **States**: Data-dependent components must handle Loading, Empty, Error, and Data states.
- **Security**: All imported data must be sanitized via `src/utils/security.ts`.
- **Performance**: High-weight assets (AI models, Large libraries) must be lazy-loaded.

## Continuity & Context
- **Planning**: See `PHASE_4_PLAN.md` for active tasks.
- **History**: See `docs/master-continuity/EXECUTION_LOG.md`.
- **Memory**: Obsidian vault index in `.obsidian/brain/MOC-FinPlan-Pro.md`.
- **Instructions**: Read `docs/master-continuity/AI_INSTRUCTIONS.md` for handover protocols.
