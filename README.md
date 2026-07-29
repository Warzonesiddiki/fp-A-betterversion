# 📊 FinPlan Pro — Enterprise Financial Planning & Analysis Platform

![TypeScript](https://img.shields.io/badge/TypeScript-64.1%25-3178C6?style=flat-square&logo=typescript)
![React](https://img.shields.io/badge/React-19.2-61DAFB?style=flat-square&logo=react)
![Vite](https://img.shields.io/badge/Vite-8.0-646CFF?style=flat-square&logo=vite)
![Tailwind](https://img.shields.io/badge/Tailwind-4.3-38B2AC?style=flat-square&logo=tailwindcss)
![Tauri](https://img.shields.io/badge/Tauri-2.0-FFC131?style=flat-square&logo=tauri)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

> **Eliminate spreadsheets. Replace armies of financial analysts with real-time, accurate, and beautiful financial intelligence.**

FinPlan Pro is an enterprise-grade Financial Planning & Analysis (FP&A) platform built with modern web technologies. It provides sophisticated financial modeling, multi-entity consolidation, scenario analysis, and comprehensive reporting across 40+ industry verticals.

---

## 🌟 Key Features

### Core Capabilities

- **Multi-Entity Consolidation** — Automate inter-company eliminations, minority interest calculations, and FX translation
- **Scenario Analysis** — What-if modeling, Monte Carlo simulations, and driver-based planning
- **Financial Reporting** — P&L, Balance Sheet, Cash Flow statements, Variance Analysis, and Board Reports
- **Financial Engines** — 188 top-level engine modules (215 including subdirectories) covering
  SaaS metrics, CapEx planning, lease accounting (IFRS 16/ASC 842), tax optimization and more.
  A 2026-07-28 audit found 105 of 181 engines unreferenced by any page, store or service;
  the wire-or-remove inventory is tracked as F-0028, so treat the count as inventory, not
  shipped capability.
- **Industry Verticals** — Pre-configured templates for 40+ sectors including Energy, Healthcare, Real Estate, Construction, Retail, Insurance, and Banking
- **Dashboard Suite** — interactive dashboards across 195 page modules
- **Desktop & Web** — Native desktop app via Tauri + responsive web interface

### Technical Features

- **Extremely Optimized Build:** The critical rendering path is compressed via Brotli to a lightning-fast <150KB (down from 722KB).
- **Canonical money primitive (partial rollout):** `src/utils/money.ts` wraps `decimal.js`
  with explicit ROUND_HALF_UP and deterministic penny allocation. **Measured adoption: 3 of
  188 engine/store modules** (`ConsolidationEngine`, `FXEngine`, `glStore`) plus
  `SafeMathParser`. Across all financial paths (`src/engines`, `src/store`, `src/utils`,
  `src/services`) adoption is 3 of 352 modules with 134 raw `toFixed(n)` sites remaining —
  run `npm run money:adoption` for the current measurement. The remaining financial paths
  still use IEEE-754 doubles; migration is tracked as F-0006 / N-0009 and is guarded by a
  CI ratchet that fails if adoption regresses. Do not rely on repo-wide decimal exactness yet.
- **Background Web Workers (4):** `consolidation`, `monte-carlo`, `batch-calc` and `storage`
  workers keep heavy serialization and simulation off the UI thread. When the environment
  cannot construct a worker (CSP, unsupported module workers), storage serialization falls
  back to the main thread rather than failing.
- **Enterprise Scale UI & UX:** Deep ad-hoc analysis via native drag-and-drop Pivot Explorers and real-time Global Command Palette indexing matching Tier-1 platforms.
- Plugin system with an AST-validated, timeout-enforced sandbox
- Local-first storage encrypted at rest with a per-install device key (see caveats under Security)
- Web Worker support for CPU-intensive calculations
- Progressive Web App (PWA) support
- Accessibility: WCAG 2.2 AA is the design target. It is **not** CI-enforced
  (the axe job is `continue-on-error`), so the level is unverified.
- Real-time sync and collaborative editing are **not shipped** — no sync worker exists;
  `collaborationStore` holds local comment/task state only.

---

## 🏗️ Architecture Overview

FinPlan Pro follows a **strictly decoupled architecture** separating business logic, state management, and presentation:

### Core Layers

```
┌─────────────────────────────────────────────┐
│  Presentation Layer                         │
│  └─ Pages (195 modules, 78 sector dirs)    │
│  └─ Components (284 non-test .tsx)         │
├─────────────────────────────────────────────┤
│  State Management Layer                     │
│  └─ Zustand Stores (38 stores)             │
│  └─ Immer Middleware (immutable updates)   │
├─────────────────────────────────────────────┤
│  Business Logic Layer                       │
│  └─ Financial Engines (188 modules)        │
│  └─ Calculation Services                   │
├─────────────────────────────────────────────┤
│  Infrastructure Layer                       │
│  └─ Web Workers (4 active)                 │
│  └─ API Services & Storage                 │
└─────────────────────────────────────────────┘
```

### Directory Structure

| Directory            | Purpose                                     | Statistics                                            |
| -------------------- | ------------------------------------------- | ----------------------------------------------------- |
| `src/engines/`       | Financial calculation engines               | 188 top-level modules (105/181 unreferenced — F-0028) |
| `src/store/`         | Zustand state stores with persistence       | 38 stores                                             |
| `src/pages/`         | Route-level containers (lazy-loaded)        | 195 page modules, 78 sector dirs                      |
| `src/components/ui/` | Atomic UI primitives (barrel-exported)      | 128 components                                        |
| `src/components/`    | Domain-specific components                  | 284 non-test components in total                      |
| `src/hooks/`         | Custom React hooks with business logic      | 44 hooks                                              |
| `src/utils/`         | Formatters, calculations, storage utilities | Core utilities                                        |
| `src/services/`      | API layer, WebSocket, collaboration         | Network layer                                         |
| `src/workers/`       | Web Workers for intensive tasks             | 4 workers                                             |
| `src/plugins/`       | Plugin system with registry & sandbox       | Plugin framework                                      |
| `src/config/`        | Design tokens, shortcuts, sector configs    | Configuration                                         |
| `src/types/`         | Shared TypeScript type definitions          | Type system                                           |
| `src/templates/`     | Pre-built report & budget templates         | Templates                                             |
| `src/test/`          | Test setup, mocks, utilities                | Testing infrastructure                                |
| `src-tauri/`         | Tauri desktop shell (Rust)                  | Desktop integration                                   |

---

## 🛠️ Tech Stack

| Layer                    | Technology             | Version |
| ------------------------ | ---------------------- | ------- |
| **Frontend Framework**   | React                  | 19.2.6  |
| **Language**             | TypeScript             | 5.9.3   |
| **State Management**     | Zustand                | 5.0+    |
| **Immutable Updates**    | Immer                  | Latest  |
| **Styling**              | Tailwind CSS           | 4.1.17  |
| **Build Tool**           | Vite                   | 8.0+    |
| **Desktop Shell**        | Tauri                  | 2.0+    |
| **Charts**               | Recharts               | 3.8.1   |
| **Data Grid**            | AG Grid                | 35.3+   |
| **UI Components**        | Radix UI               | Latest  |
| **Icons**                | Lucide React           | 1.14+   |
| **Routing**              | React Router           | 7.15+   |
| **Validation**           | Zod                    | 4.4+    |
| **HTTP Client**          | Axios                  | 1.16+   |
| **Date Handling**        | date-fns               | 4.1+    |
| **Excel Export**         | ExcelJS                | 3.4+    |
| **PDF Export**           | jsPDF                  | 4.2+    |
| **Testing (Unit)**       | Vitest                 | 4.1+    |
| **Testing (E2E)**        | Playwright             | 1.60+   |
| **React Testing**        | @testing-library/react | 16.3+   |
| **Accessibility**        | jest-axe, vitest-axe   | Latest  |
| **Linting**              | ESLint                 | 9.39+   |
| **Code Format**          | Prettier               | 3.8+    |
| **Pre-commit Hooks**     | Husky                  | 9.1+    |
| **Error Tracking**       | Sentry                 | 10.57+  |
| **Internationalization** | i18next                | 26.2+   |

---

## 🚀 Quick Start

### Prerequisites

- Node.js 22+ (`npm ci` recommended)
- Git
- For desktop development: Rust toolchain ([Tauri Setup](https://v2.tauri.app/start/prerequisites/))

### Installation & Development

```bash
# Clone and install
git clone https://github.com/Warzonesiddiki/fp-A-betterversion.git
cd fp-A-betterversion
npm ci

# Development
npm run dev              # Start Vite dev server @ http://localhost:5173
npm run dev:watch       # Watch mode for rapid iteration

# Build
npm run build           # Production bundle
npm run preview         # Preview production build locally

# Desktop (Tauri)
npm run tauri:dev      # Launch native desktop app in dev mode
npm run tauri:build    # Build installers (NSIS/DMG/AppImage)
```

---

## 📋 npm Scripts

| Command                 | Purpose                | Details                                   |
| ----------------------- | ---------------------- | ----------------------------------------- |
| `npm run dev`           | Development server     | Vite hot-module reload @ :5173            |
| `npm run build`         | Production build       | Optimized bundle with code splitting      |
| `npm run preview`       | Preview production     | Local preview of production build         |
| `npm run tauri:dev`     | Desktop dev mode       | Launch Tauri app with hot reload          |
| `npm run tauri:build`   | Desktop production     | Build native installers for all platforms |
| `npm run lint`          | Linting with fix       | ESLint with auto-fix enabled              |
| `npm run format`        | Code formatting        | Prettier on all TypeScript/CSS/Markdown   |
| `npm run test`          | Unit tests             | Vitest single run (80GB heap)             |
| `npm run test:watch`    | Test watch mode        | Vitest with file watchers                 |
| `npm run test:e2e`      | E2E tests              | Playwright browser automation tests       |
| `npm run test:bench`    | Performance benchmarks | Vitest benchmarks with custom config      |
| `npm run test:bench:ci` | CI benchmarks          | JSON output for CI systems                |
| `npm run bundle-check`  | Bundle analysis        | Size checks: main ≤150KB, total ≤2MB gzip |

---

## 🧪 Testing

### Test Infrastructure (928 test files; ~8,500 tests counted across shards)

```bash
# Single run with coverage
npm test                          # All tests
npx vitest run --coverage        # With coverage report
npx vitest run src/path/file.test.ts  # Single file

# Watch mode
npm run test:watch               # Re-run on file changes

# E2E Testing
npm run test:e2e                 # Playwright E2E suite
```

### Test Conventions

- **Location**: Colocated with source (`Component.tsx` → `Component.test.tsx`)
- **Framework**: Vitest + @testing-library/react
- **Setup**: Auto-configured via `src/test/setup.ts`
- **Render Helper**: `import { render } from '@/test/testUtils'` (BrowserRouter wrapper)
- **Store Testing**: Reset state in `beforeEach` via `useStore.setState({...})`
- **Accessibility**: jest-axe and vitest-axe for WCAG compliance
- **Thread Pool**: 4 max workers for parallel execution

---

## 📦 Build & Deployment

### Build Configuration

- **Bundler**: Vite 7 with manual chunks:
  - `react-vendor` — React & DOM
  - `chart-vendor` — Recharts & dependencies
  - `grid-vendor` — AG Grid
  - `form-vendor` — Form utilities
  - `state-vendor` — Zustand, Immer
  - `ai-vendor` — AI/ML integrations

- **Styling**: Tailwind CSS 4 via `@tailwindcss/vite` plugin (zero PostCSS overhead)
- **PWA**: Automatic via vite-plugin-pwa (Workbox, auto-update)
- **Desktop**: Tauri 2 for cross-platform (Windows/macOS/Linux)

### Size Limits (CI Enforced)

- Main chunk: ≤150KB gzip
- Total JavaScript: ≤2MB gzip
- Check with: `npm run bundle-check`

### CI/CD Pipeline (GitHub Actions)

```
1. Type Check     → tsc --noEmit
2. Linting        → eslint src --max-warnings 0
3. Unit Tests     → vitest run
4. Build          → vite build
5. Bundle Check   → size verification
```

---

## 🔐 Code Conventions & Standards

### Naming & Exports

- **Named exports only** — no default exports (enforces explicit imports)
- **Component props** — explicit `{ComponentName}Props` interface
- **Store naming** — `{domain}Store.ts` pattern

### Styling & Layout

- **CSS**: Tailwind CSS only (no inline styles)
- **Design tokens** — centralized in `src/config/`
- **Responsive** — mobile-first Tailwind breakpoints
- **Variance colors**: Green (#16A34A) for favorable, Red (#DC2626) for unfavorable

### State Management

```typescript
// Required middleware order
export const useStore = create<State>()(
  subscribeWithSelector(
    // outermost
    persist(
      // middle
      immer((set, get) => ({
        // innermost
        // state + actions
      })),
      { name: 'store-name', storage: masterStorage }
    )
  )
);
```

### Data Handling

- **Financial numbers**: Raw `number` type (format only at display)
- **Percentages**: Stored as decimals (0.15 = 15%)
- **No `any` type**: Use `unknown` for untrusted input (strict mode enforced)
- **No fetch in components**: Use services or store actions

### File Size Limits

- Components: 300 lines max
- Engines/Stores: 500 lines max
- Utilities: 200 lines max

---

## 🎨 UI & Components

### Component Library

- **80+ UI Primitives** — Button, Input, Modal, Dropdown, Tabs, etc.
- **Radix UI Integration** — Unstyled, accessible base components
- **Tailwind Styled** — All components use Tailwind CSS with clsx merging
- **Barrel Exports** — `src/components/ui/index.ts` for convenient imports
- **Domain Components** — Budget, Reports, Analytics, Dashboard components

### Example Component Pattern

```typescript
// components/Button.tsx
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export function Button({ variant = 'primary', size = 'md', ...props }: ButtonProps) {
  return <button className={cn(baseStyles, variantStyles[variant])} {...props} />;
}

// Usage in components
import { Button } from '@/components/ui/Button';
```

---

## 🔄 State Management Deep Dive

### Store Architecture (38 Stores)

Each store follows a standard pattern for consistency:

```typescript
// src/store/budgetStore.ts
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/react';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { masterStorage } from '@/utils/masterStorage';

interface BudgetState {
  budgets: Budget[];
  activeBudgetId: string | null;

  // Actions
  addBudget: (budget: Budget) => void;
  updateBudget: (id: string, updates: Partial<Budget>) => void;
  deleteBudget: (id: string) => void;
}

export const useBudgetStore = create<BudgetState>()(
  subscribeWithSelector(
    persist(
      immer((set, get) => ({
        budgets: [],
        activeBudgetId: null,

        addBudget: (budget) =>
          set((state) => {
            state.budgets.push(budget);
          }),
        updateBudget: (id, updates) =>
          set((state) => {
            const budget = state.budgets.find((b) => b.id === id);
            if (budget) Object.assign(budget, updates);
          }),
        deleteBudget: (id) =>
          set((state) => {
            state.budgets = state.budgets.filter((b) => b.id !== id);
          }),
      })),
      { name: 'budget-store', storage: masterStorage }
    )
  )
);
```

### Middleware Order

1. **subscribeWithSelector** (outermost) — enables fine-grained subscriptions
2. **persist** (middle) — for auth, settings, UI preferences
3. **immer** (innermost) — immutable update helpers

---

## 💾 Financial Engines (188)

### Engine Categories

| Category                  | Count | Examples                                        |
| ------------------------- | ----- | ----------------------------------------------- |
| **Consolidation**         | 35+   | Eliminations, FX translation, minority interest |
| **Scenario Analysis**     | 28+   | Monte Carlo, sensitivity, what-if               |
| **Reporting**             | 42+   | P&L, Balance Sheet, Cash Flow, Variance         |
| **SaaS Metrics**          | 25+   | MRR, ARR, LTV, CAC, Churn                       |
| **CapEx Planning**        | 18+   | Depreciation, asset tracking, ROI               |
| **Lease Accounting**      | 22+   | IFRS 16, ASC 842, liability calculations        |
| **Tax Optimization**      | 20+   | Deductions, incentives, planning                |
| **Financial Forecasting** | 12+   | Trending, regression, seasonality               |

### Engine Pattern

```typescript
// Pure functions with no side effects
export function calculateConsolidatedP&L(
  entities: Entity[],
  transactions: Transaction[],
  config: ConsolidationConfig
): ConsolidatedStatement {
  // Pure calculation logic
  return {/* results */};
}
```

---

## 🌐 API Layer

### Service Architecture

```
src/services/
├── api.ts              # Axios instance & configuration
├── auth.ts             # Authentication & session
├── budget.ts           # Budget CRUD operations
├── consolidation.ts    # Multi-entity consolidation
├── scenario.ts         # Scenario analysis
├── reporting.ts        # Financial report generation
├── export.ts           # Excel/PDF export utilities
├── websocket.ts        # Real-time collaboration
└── mock/               # Development mock data (19 files)
```

### API Request Pattern

```typescript
// src/services/budget.ts
import { api } from './api';

export async function getBudgets(filters?: BudgetFilters) {
  const response = await api.get('/budgets', { params: filters });
  return response.data as Budget[];
}

export async function createBudget(budget: CreateBudgetInput) {
  const response = await api.post('/budgets', budget);
  return response.data as Budget;
}
```

---

## 🔌 Plugin System

### Plugin Architecture

- **Registry**: Centralized plugin registration
- **Sandbox**: Isolated execution environment
- **Marketplace**: NOT SHIPPED — no marketplace backend exists. Plugins are registered in-process only.
- **API**: Standard plugin interface for consistency

### Creating a Plugin

```typescript
// src/plugins/myPlugin/index.ts
export const myPlugin: FinPlanPlugin = {
  id: 'my-plugin',
  name: 'My Custom Plugin',
  version: '1.0.0',
  activate(context) {
    // Plugin initialization
  },
  deactivate() {
    // Cleanup
  },
};
```

---

## 🔗 Web Workers

### Active Workers (4)

| Worker                    | Purpose                    | Use Case                     |
| ------------------------- | -------------------------- | ---------------------------- |
| `consolidation.worker.ts` | Multi-entity consolidation | Large-scale FX, eliminations |
| `monte-carlo.worker.ts`   | Scenario simulations       | Monte Carlo analysis         |
| `formula.worker.ts`       | Formula evaluation         | Dynamic calculations         |
| `export.worker.ts`        | Excel/PDF generation       | Large exports                |
| `sync.worker.ts`          | Data synchronization       | Real-time sync               |
| `analytics.worker.ts`     | Analytics calculations     | Dashboard aggregations       |
| `transform.worker.ts`     | Data transformation        | Mapping & normalization      |

### Worker Usage Pattern

```typescript
// src/hooks/useWorker.ts
export function useWorker(workerPath: string) {
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const execute = useCallback((data) => {
    setIsLoading(true);
    const worker = new Worker(workerPath);
    worker.onmessage = (event) => {
      setResult(event.data);
      setIsLoading(false);
    };
    worker.postMessage(data);
  }, []);

  return { result, isLoading, execute };
}
```

---

## 📊 Routing & Pages

### Route Structure (192 Pages)

```
/dashboard         - Main dashboard hub
/budgets           - Budget management & planning
  /create          - Create new budget
  /edit/:id        - Edit budget
  /analyze/:id     - Budget analysis

/consolidation     - Multi-entity consolidation
  /setup           - Configure entities & eliminations
  /review          - Review consolidated results
  /export          - Export consolidation data

/scenarios         - What-if analysis & modeling
  /create          - Build new scenario
  /compare         - Compare scenarios
  /monte-carlo     - Run Monte Carlo simulation

/reports           - Financial reports
  /pl              - P&L statement
  /balance-sheet   - Balance sheet
  /cash-flow       - Cash flow statement
  /variance        - Variance analysis
  /custom          - Custom report builder

/sectors/:sector   - Industry-specific templates
  /energy
  /healthcare
  /real-estate
  /...and 37 more
```

### Page Implementation Pattern

```typescript
// src/pages/budgets/BudgetList.tsx
export const BudgetList = React.lazy(() => import('./BudgetList'));

function BudgetListComponent() {
  const { budgets, isLoading } = useBudgetStore();

  if (isLoading) return <Spinner />;

  return (
    <div>
      {budgets.map(budget => (
        <BudgetCard key={budget.id} budget={budget} />
      ))}
    </div>
  );
}

export default BudgetListComponent;
```

---

## 🎯 Performance Optimizations

### Code Splitting

- **Lazy-loaded pages** — All 192 pages loaded on-demand
- **Manual vendor chunks** — Separate React, charts, grid, forms, state, AI
- **Tree shaking** — Dead code elimination via Vite

### Runtime Optimizations

- **Web Workers** — Offload CPU-intensive calculations
- **Memoization** — useMemo/useCallback for expensive computations
- **Virtual scrolling** — AG Grid + React Virtual for large datasets
- **Image optimization** — SVG icons, lazy loading

### Build Output Targets

```
dist/
├── index.html                          (main entry)
├── assets/
│   ├── react-vendor.[hash].js         (~85KB gzip)
│   ├── chart-vendor.[hash].js         (~42KB gzip)
│   ├── grid-vendor.[hash].js          (~38KB gzip)
│   ├── main.[hash].js                 (~120KB gzip)
│   └── [other chunks]
├── workers/
│   ├── consolidation.worker.js
│   └── ...
└── [other assets]
```

---

## 🔐 Security Features

### Data Protection

- **Encryption at rest (local, not end-to-end)** — AES-256-GCM over the local store, keyed by
  a per-install device key generated on first run (or `MASTER_STORAGE_KEY`). This protects a
  copy of the database taken WITHOUT the key; it does **not** protect against an attacker
  with access to the same browser profile, and there is no server-side key escrow. Desktop
  OS-keychain integration is not implemented. Decryption failures fail closed.
- **JWT authentication** — Session-based with refresh tokens
- **CORS configuration** — Strict origin validation
- **Rate limiting** — API throttling to prevent abuse
- **Content Security Policy** — Prevent XSS attacks
- **Helmet.js** — Security headers (Server-side)

### Input Validation

- **Zod schemas** — Type-safe validation at runtime
- **XSS prevention** — DOMPurify for user-generated content
- **SQL injection prevention** — Parameterized queries (better-sqlite3)

---

## ♿ Accessibility (WCAG 2.2 AA — design target, not CI-enforced)

### Compliance Features

- **Semantic HTML** — Proper heading hierarchy, landmarks
- **ARIA labels** — aria-label, aria-describedby for components
- **Keyboard navigation** — Full keyboard support, focus management
- **Color contrast** — WCAG AA minimum ratios
- **Screen reader testing** — jest-axe, vitest-axe in tests
- **Reduced motion** — prefers-reduced-motion support

### Accessibility Testing

```bash
npm run test -- --run # Runs vitest-axe checks
```

---

## 🌍 Internationalization (i18n)

### Supported Languages

- English (en)
- Spanish (es)
- French (fr)
- German (de)
- Simplified Chinese (zh-CN)
- Japanese (ja)

### Translation Usage

```typescript
import { useTranslation } from 'react-i18next';

export function MyComponent() {
  const { t } = useTranslation();
  return <button>{t('common.save')}</button>;
}
```

---

## 🧩 Custom Hooks (40+)

### Hook Categories

| Category        | Examples                                       |
| --------------- | ---------------------------------------------- |
| **State**       | useBudgetStore, useScenarioStore, useUserStore |
| **Effects**     | useAsync, useFetch, useWindowResize            |
| **Validation**  | useFormValidation, useZodForm                  |
| **Performance** | useMemoized, useDebounce, useThrottle          |
| **UI**          | useModal, useToast, useTheme                   |
| **Data**        | useExport, useImport, useSync                  |

---

## 🚀 Desktop App (Tauri)

### Build Targets

```bash
npm run tauri:build
# Outputs:
# - Windows: NSIS installer (.exe)
# - macOS: DMG + App bundle
# - Linux: AppImage + deb
```

### Tauri Integration

- **Global shortcuts** — Keyboard shortcuts from Rust
- **SQL storage** — better-sqlite3 for local persistence
- **File dialogs** — Native file picker integration
- **Notifications** — Native OS notifications
- **System tray** — Background application support

### Tauri IPC (Rust ↔ Frontend)

```rust
// src-tauri/src/lib.rs
#[tauri::command]
fn calculate_consolidation(entities: Vec<Entity>) -> ConsolidationResult {
    // Rust-side calculation
}

// React
import { invoke } from '@tauri-apps/api/core';
const result = await invoke('calculate_consolidation', { entities });
```

---

## 📈 Performance Benchmarks

### Target Metrics

- **Initial Load**: <2s (LCP)
- **Time to Interactive**: <3.5s (TTI)
- **First Input Delay**: <100ms (FID)
- **Consolidation (1000 entities)**: <500ms
- **Monte Carlo (10,000 iterations)**: <2s
- **Report Generation**: <1s
- **Export to Excel**: <3s

### Benchmark Suite

```bash
npm run test:bench              # Run all benchmarks
npm run test:bench:ci           # JSON output for CI
npx vitest bench --run          # Direct Vitest run
```

---

## 🤝 Contributing

### Development Workflow

1. **Fork & Clone**: Create a feature branch
2. **Type Check**: `npm run lint` before commit
3. **Write Tests**: Coverage thresholds enforced in `vite.config.ts` are currently 50% (statements/branches/functions/lines). Do not claim a higher figure without a completed coverage run.
4. **Format Code**: `npm run format`
5. **Run Locally**: `npm run dev` + `npm test`
6. **Submit PR**: Link to relevant issues

### Commit Conventions

```
feat: Add new budget consolidation engine
fix: Correct FX translation calculation
docs: Update README with new features
refactor: Simplify state management
test: Add tests for export functionality
chore: Update dependencies
```

---

## 📚 Documentation

| Document                           | Purpose                              |
| ---------------------------------- | ------------------------------------ |
| [CLAUDE.md](CLAUDE.md)             | Developer guidance for AI assistants |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Contribution guidelines              |
| [ROADMAP.md](ROADMAP.md)           | Development roadmap & priorities     |

---

## 🐛 Troubleshooting

### Common Issues

**Q: Port 5173 already in use?**

```bash
npm run dev -- --port 3000
```

**Q: Tests timeout with "80GB heap"?**

```bash
# The test script uses 80GB virtual heap for large datasets
node --max-old-space-size=81920 node_modules/vitest/vitest.mjs run
```

**Q: Tauri build fails on Linux?**

```bash
# Install build dependencies
sudo apt-get install libssl-dev libgtk-3-dev libayatana-appindicator3-dev
```

**Q: Bundle size exceeds limits?**

```bash
npm run bundle-check     # Analyze bundle
npm run build -- --analyze  # Vite visualization
```

---

## 📊 Project Statistics

| Metric                | Value                                                                                                                                         |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| **Primary Language**  | TypeScript (64.1%)                                                                                                                            |
| **Total Stores**      | 38                                                                                                                                            |
| **Financial Engines** | 188 top-level (105/181 unreferenced)                                                                                                          |
| **Pages/Routes**      | 195 page modules                                                                                                                              |
| **Industry Sectors**  | 78 sector directories (depth varies)                                                                                                          |
| **Dashboard Count**   | 23                                                                                                                                            |
| **UI Components**     | 284 non-test components (128 in ui/)                                                                                                          |
| **Custom Hooks**      | 44                                                                                                                                            |
| **Web Workers**       | 4                                                                                                                                             |
| **Test Files**        | 928                                                                                                                                           |
| **Total Tests**       | ~8,500 counted across shards; a full single-run total is not yet obtainable (F-0025)                                                          |
| **Test Coverage**     | Unverified. Configured thresholds in `vite.config.ts` are 50% (statements/branches/functions/lines); no full-suite coverage run has completed |
| **Lines of Code**     | ~380,000 lines across `src/**/*.ts(x)` (includes tests)                                                                                       |

---

## 📜 License

[MIT](LICENSE) — Use freely for commercial and private projects.

---

## 🔗 Resources

- **React Docs**: https://react.dev/
- **TypeScript Docs**: https://www.typescriptlang.org/docs/
- **Vite Guide**: https://vitejs.dev/guide/
- **Zustand Docs**: https://github.com/pmndrs/zustand
- **Tailwind CSS**: https://tailwindcss.com/docs
- **Tauri Docs**: https://v2.tauri.app/
- **Testing Library**: https://testing-library.com/docs/
- **Playwright**: https://playwright.dev/

---

## 👤 Support & Contact

For issues, questions, or suggestions:

- 📖 Check existing [issues](../../issues)
- 💬 Start a [discussion](../../discussions)
- 🐛 Report bugs with detailed reproduction steps
- ✨ Request features with use cases

---

**Last Updated**: July 9, 2026  
**Repository**: [Warzonesiddiki/fp-A-betterversion](https://github.com/Warzonesiddiki/fp-A-betterversion)  
**Status**: 🟠 Under remediation — NOT production-ready.
Audit `ZCFA-2026-07-28-001` returned **UNACCEPTABLE** and remediation is in progress; see
`reports/ZERO_COMPROMISE_FORENSIC_AUDIT_2026-07-28.md` and `REMEDIATION_REPORT.md`.
The "Production-Ready" claim will not return until every gate in the remediation
report is green with attached command evidence.
