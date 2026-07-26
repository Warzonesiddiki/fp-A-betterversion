<!-- LEGACY: Superseded by FINPLAN_PROJECT_BLUEPRINT.md + MASTER_PLAN_V2.md (2026-05-24) -->
# FinPlan Pro — Gemini CLI Project Context

## Overview
FinPlan Pro is an enterprise Financial Planning & Analysis (FP&A) web application built with React 19, TypeScript, Vite, and Tailwind CSS. It provides budget management, forecasting, variance analysis, scenario planning, and multi-entity consolidation. The project aims for 100% offline capability, WCAG 2.1 AA compliance, and state-of-the-art performance.

## Status: 82% Complete
- **Current Phase**: Phase 16-17 (Accessibility & Testing)
- **Active Agents**:
  - **Agent 1**: Core UI components (`SplitPane`, `FinancialTable`).
  - **Agent 4**: Business hooks and domain components.
- **Build Status**: PASS (488KB, 107KB gzip, 0 errors).

## Tech Stack
- **Frontend**: React 19.2.6 + TypeScript 5.9.3 (strict) + Vite 7.3.2
- **Styling**: Tailwind CSS 4.1.17 + Radix UI primitives + Lucide icons
- **State**: Zustand 5.0.13 + Immer (with undo/redo)
- **Grid**: AG Grid Community 35.3.0
- **Charts**: Recharts 3.8.1
- **Forms**: React Hook Form + Zod 4.4.3
- **Data**: TanStack Query v5, TanStack Virtual v3
- **Export**: jsPDF + ExcelJS
- **Desktop**: Tauri v2
- **Testing**: Vitest 4.1.6 + Playwright 1.60.0
- **SDKs**: @a5c-ai/babysitter-sdk v5

## System Architecture

### 1. High-Level Data Flow
```
External Data (Excel/CSV/API)
  → Import Engines (src/engines/)
    → Zustand Stores (src/store/)
      → Calculation Engines (src/engines/) — pure functions
        → UI Layer (Pages/Components) & Export Engine
```

### 2. Component Hierarchy
- **Layouts**: Root layouts with navigation, sidebar, and theme context.
- **Pages**: 74 lazy-loaded route components (React.lazy).
- **Domain Components**: Business-specific components (e.g., `BudgetTable`, `VarianceChart`).
- **UI Primitives**: Atomic components in `src/components/ui/`.
- **Workers**: Heavy computations (Monte Carlo, consolidation) in `src/workers/`.

## Key Patterns & Standards

### Zustand Store Pattern
All stores use this mandatory middleware stack:
```typescript
export const useSomeStore = create<State>()(
  subscribeWithSelector(
    persist(
      immer((set, get) => ({
        // state + actions using immer drafts
      })),
      { name: 'store-name', storage: masterStorage }
    )
  )
);
```

### Engine Pattern
Engines are pure functions. Same inputs = same outputs. No side effects. Test files must be colocated (`src/engines/FooEngine.ts` → `src/engines/FooEngine.test.ts`).

### Code Standards
- **Named exports only** — No default exports.
- **TypeScript strict** — No `any`, use `unknown` for external data.
- **Files under 300 lines** (components), **500 lines** (engines/stores).
- **Financial numbers** — Stored as raw `number`, formatted at display layer.
- **Percentages** — Stored as decimals (0.15 = 15%).
- **Variance colors** — Favorable = Green (`#16A34A`), Unfavorable = Red (`#DC2626`).

## Development Commands
```bash
npm install          # Install dependencies
npm run dev          # Start Vite dev server
npm run build        # Production build
npm run lint         # ESLint with --fix
npm run format       # Prettier format
npm run test         # Vitest unit tests (80GB heap enabled)
npm run test:e2e     # Playwright E2E tests
npm run tauri:dev    # Tauri desktop dev
npm run tauri:build  # Tauri production build
npx tsc --noEmit     # Type check
```

## Multi-Agent Coordination (A1-A5)
| Agent | Role | Focus |
|-------|------|-------|
| **A1** | Calculator/UI | Engines, types, core UI components |
| **A2** | Auditor/A11y | Reports, keyboard, sectors, accessibility |
| **A3** | Infrastructure | Persistence, import, custom fields, Tauri |
| **A4** | Page Architect | Domain pages, hooks, business components |
| **A5** | Enterprise | Advanced phases (19-68), deep domain logic |

### File Conflict Matrix
| Directory | Owner | Others |
|-----------|-------|--------|
| `src/store/` | A1, A5 | ❌ |
| `src/components/ui/` | A1, A2, A4 | ✅ (coordinated) |
| `src/engines/` | A1, A2 | ❌ |
| `src/pages/` | A1, A2, A4, A5 | ✅ (domain-split) |
| `src/hooks/` | A4 | ❌ |
| `src-tauri/` | A3 | ❌ |

## Roadmap Highlights
1. **Phase 16**: WCAG 2.1 AA Accessibility (Current).
2. **Phase 17**: 100% Test Coverage Target (Current).
3. **Phase 20-21**: 500+ Formula Functions & Offline-First Data Layer.
4. **Phase 25**: Real-Time Collaboration (WebSocket/OT).

## MCP Servers
- **github**, **git**, **filesystem**, **excel-analyser**, **playwright**.
