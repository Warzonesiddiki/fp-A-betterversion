# AGENT 5 (INFRA) — Detailed Execution Plan

YOUR MISSION: Make this project production-ready. Solid infrastructure, comprehensive documentation, and hardened security. Every developer should be able to clone, run, and deploy in under 5 minutes.

YOU OWN: `.github/*`, `src-tauri/*`, `scripts/*`, root config files, `README.md`, `AGENTS.md`
YOU NEVER TOUCH: Any file under `src/`

## TASK 1: Tauri Config Audit & Hardening

Read: `src-tauri/tauri.conf.json`

### Check these specific things:
1. CSP headers — is `script-src 'self'` set? No `'unsafe-inline'` for scripts?
2. Dangerously exposed commands — any `"shell:allow-open"` or similar dangerous capabilities?
3. Window config — title "FinPlan Pro", correct default size (1280x800+)?
4. File system scope — is it properly restricted?
5. Security — any allowlist entries that are too permissive?

### Fix any issues found:
- Add strict CSP: `"csp": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'"`
- Lock down window config if needed
- Remove dangerous capabilities

### Verify build:
```
cd C:\Users\Tahir\Desktop\frontend that i want
npm run build 2>&1 | Select-Object -Last 5
```

Note: `npm run tauri:build` requires Tauri CLI. If not installed, just document the config changes and skip the build.

## TASK 2: README.md

Create `README.md` at project root. Must include:

```markdown
# FinPlan Pro — Enterprise FP&A Platform

Eliminate spreadsheets. Replace your army of financial analysts with real-time, 
accurate, beautiful financial intelligence. Every strategic decision, powered by FinPlan Pro.

## Features
- **Multi-Entity Consolidation** — Automate inter-company eliminations, minority interest, and currency translation
- **Scenario Analysis** — What-if modeling, Monte Carlo simulation, driver-based planning
- **Financial Reporting** — P&L, Balance Sheet, Cash Flow, Variance Analysis, Board Reports
- **24 Domain Engines** — SaaS metrics, CapEx planning, Lease accounting (IFRS 16/ASC 842), Tax provisioning, and more
- **74 Interactive Dashboards** — Energy, Healthcare, Real Estate, Construction, Retail, Insurance, Banking, and more
- **Real-Time Collaboration** — Multi-user budget editing, approval workflows, audit trails
- **Desktop & Web** — Tauri desktop app + Vite web build

## Tech Stack
| Layer | Technology |
|-------|-----------|
| UI | React 19 + TypeScript 5.9 |
| State | Zustand 5 |
| Styling | Tailwind CSS 4 |
| Charts | Recharts 3 |
| Grid | AG Grid 35 |
| Build | Vite 7 |
| Desktop | Tauri 2 |
| Testing | Vitest + Playwright |
| CI/CD | GitHub Actions |

## Quick Start

### Prerequisites
- Node.js 20+
- npm 10+

### Installation
```bash
git clone <repo-url>
cd finplan-pro
npm install
npm run dev
```

The app will be available at `http://localhost:5173`

### Scripts
| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm test` | Run unit tests |
| `npm run lint` | Run ESLint |
| `npm run format` | Format with Prettier |
| `npm run tauri:dev` | Start Tauri desktop app (dev) |
| `npm run tauri:build` | Build Tauri desktop app |

## Project Structure
```
src/
├── components/    # Reusable UI components
│   └── ui/        # Design system primitives
├── pages/         # 74 route pages across 27 domains
├── store/         # Zustand state management (13 stores)
├── engines/       # Financial calculation engines (24)
├── hooks/         # Custom React hooks
├── utils/         # Pure utility functions
├── services/      # Mock data and API layer
├── types/         # TypeScript type definitions
├── workers/       # Web Workers
├── context/       # React Context providers
└── config/        # Domain configurations
```

## Architecture
[Brief description of the architecture patterns used]

## Testing
```bash
# Run all tests
npm test

# Run with coverage
npx vitest run --coverage

# Run E2E tests
npx playwright test
```

## Deployment
[Deployment instructions for Vercel/Railway/etc.]

## License
MIT
```

## TASK 3: CONTRIBUTING.md

Create `CONTRIBUTING.md` at project root. Must include:

```markdown
# Contributing to FinPlan Pro

## Development Setup
[Same as README quick start]

## Code Conventions
- TypeScript strict mode enabled
- Functional components with hooks (no class components except ErrorBoundary)
- Zustand for global state, React context for theme/preferences
- Tailwind CSS for all styling
- Imports: React → libraries → internal (absolute via @/)
- No console.log in production code

## Commit Message Format
Follow conventional commits:
- `feat:` New feature
- `fix:` Bug fix
- `test:` Adding/updating tests
- `docs:` Documentation only
- `refactor:` Code change that neither fixes nor adds
- `perf:` Performance improvement
- `chore:` Maintenance

## PR Process
1. Create branch from main
2. Make changes
3. Run `npm run lint` and `npm test`
4. Run `npm run build` to verify
5. Create PR with description of changes
6. PR must pass CI checks before merge

## File Ownership
| Area | Owner |
|------|-------|
| State management | src/store/ |
| Business logic | src/engines/ |
| UI components | src/components/ |
| Page content | src/pages/ |
| Build/deploy | .github/ |
| Desktop | src-tauri/ |
```

## TASK 4: Performance Budget

Modify `vite.config.ts` to add chunk size warnings:
```typescript
build: {
  chunkSizeWarningLimit: 300, // KB — warn if any chunk exceeds this
  rollupOptions: {
    output: {
      manualChunks: {
        // Already configured — just verify
      }
    }
  }
}
```

Read the current `vite.config.ts` first, then adjust settings.

## TASK 5: Architecture Documentation

Update `AGENTS.md` at project root to include:
1. Current architecture diagram (simplified)
2. Component hierarchy
3. Data flow (stores → components → pages)
4. Engine architecture
5. Routing structure
6. Key design decisions

Read the current `AGENTS.md` first, then add to it (don't overwrite existing content).

## QUALITY GATE
After EACH task:
```
cd C:\Users\Tahir\Desktop\frontend that i want
npm run build 2>&1 | Select-Object -Last 5
```
Build must pass (should always pass for infra changes since you never touch src/).
