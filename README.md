# FinPlan Pro — Enterprise FP&A Platform

[![React](https://img.shields.io/badge/React-19.2-blue.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-7.3-646CFF.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.1-38B2AC.svg)](https://tailwindcss.com/)
[![Tauri](https://img.shields.io/badge/Tauri-Desktop-FFC131.svg)](https://tauri.app/)

Eliminate spreadsheets. Replace armies of financial analysts with real-time, accurate, beautiful financial intelligence.

## Features

- **Multi-Entity Consolidation** — Automate inter-company eliminations, minority interest, FX translation
- **Scenario Analysis** — What-if modeling, Monte Carlo simulation, driver-based planning
- **Financial Reporting** — P&L, Balance Sheet, Cash Flow, Variance Analysis, Board Reports
- **24 Domain Engines** — SaaS metrics, CapEx planning, Lease accounting (IFRS 16/ASC 842), Tax, and more
- **74 Interactive Dashboards** — Energy, Healthcare, Real Estate, Construction, Retail, Insurance, Banking
- **Desktop & Web** — Tauri desktop app + Vite web build

## Tech Stack

| Layer | Technology |
|-------|-----------|
| UI | React 19 + TypeScript 5.9 |
| State | Zustand 5 + Immer |
| Styling | Tailwind CSS 4 |
| Charts | Recharts 3 |
| Grid | AG Grid 35 |
| Build | Vite 7 |
| Desktop | Tauri 2 |
| Testing | Vitest + Playwright + Testing Library |
| CI/CD | GitHub Actions |
| A11y | WCAG 2.2 AA (eslint-plugin-jsx-a11y) |

## Quick Start

```bash
git clone <repo-url>
cd finplan-pro
npm install
npm run dev          # Start dev server at http://localhost:5173
npm run build        # Production build
npm test             # Run 519+ unit tests
npm run lint         # ESLint check
```

## Project Structure

```
src/
├── components/       # 55+ reusable UI components (ui/, layout/, domain/)
├── pages/            # 74 routes across 27 industry domains
├── store/            # 13 Zustand state stores
├── engines/          # 24 financial calculation engines
├── hooks/            # 12 custom React hooks
├── utils/            # Pure utility functions
├── services/         # Mock data (19 files) and API layer
├── types/            # TypeScript type definitions
├── workers/          # 4 Web Workers
├── config/           # Domain-specific configurations
└── test/             # Test setup and utilities
```

## Architecture Overview

FinPlan Pro is built with a strictly decoupled architecture, separating business logic (Engines) from state (Stores) and presentation (Pages/Components).

- **Engines** (`src/engines/`) — 24 pure-function financial calculation engines (Consolidation, FX, Scenario, Tax, SaaS Metrics, etc.)
- **Stores** (`src/store/`) — 13 Zustand stores with Immer middleware for immutable state updates
- **Pages** (`src/pages/`) — 74 route-level containers across 27 industry verticals
- **Components** (`src/components/`) — 55+ atomic UI primitives and domain-specific components
- **Workers** (`src/workers/`) — 4 Web Workers for CPU-intensive computations (consolidation, formulas, scenarios, export)

## Test Suite (519+ tests)

```bash
npm test                 # Run all tests
npx vitest run --coverage # With coverage
npm run test:e2e         # Playwright E2E tests
```

## Scripts

| Command | Description |
|---------|-------------|
| npm run dev | Development server |
| npm run build | Production bundle |
| npm test | Unit tests (vitest) |
| npm run lint | ESLint |
| npm run format | Prettier |
| npm run tauri:dev | Tauri desktop dev |
| npm run tauri:build | Tauri desktop build |

## Desktop (Tauri)

```bash
npm run tauri:dev     # Launch desktop app in dev mode
npm run tauri:build   # Build installers (NSIS/DMG/AppImage)
```

> Requires Rust toolchain. See [Tauri docs](https://v2.tauri.app/start/prerequisites/) for setup.

## Documentation

| Document | Description |
|----------|-------------|
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | System architecture, data flow, design decisions |
| [COMPONENT_PATTERNS.md](docs/COMPONENT_PATTERNS.md) | Component design standards |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Contributing guidelines |
| [ROADMAP.md](ROADMAP.md) | Development roadmap |

## License

[MIT](LICENSE)
