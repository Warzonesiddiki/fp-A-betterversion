---
date: 2026-05-20
type: feature
project: FinPlan Pro
tags: [finplan-pro, vercel-labs, agent-browser, json-render, portless, integration]
status: current
---

# Vercel Labs Integration — 2026-05-20

## Tools Installed

### 1. agent-browser (33.6k stars)
**What:** Browser automation CLI for AI agents — Rust-based, accessibility-first
**Version:** 0.27.0
**Use for:** E2E testing, screenshot generation, form automation
**Key feature:** `snapshot` returns accessibility tree with refs — no fragile CSS selectors
**Commands:** `agent-browser open`, `click`, `fill`, `screenshot`, `snapshot`

**E2E Test Results:**
- 9 flows tested, 8 passing
- Screenshots captured to `tests/e2e/screenshots/`
- Accessibility tree captured (15 nodes)
- All key pages: Dashboard, Budgets, Reports, Scenarios, Templates

### 2. json-render (14.9k stars)
**What:** Generative UI framework — AI generates JSON, renders as safe UI
**Version:** 0.19.0
**Use for:** AI-generated financial dashboards, dynamic report layouts
**Key feature:** Define component catalog with Zod schemas — AI can only use your components

**Integration:**
- `GenerativeDashboard.tsx` — renders AI-generated specs
- `nlqToSpec.ts` — converts NLQ results to json-render specs
- Catalog: Card, Metric, Chart, Grid components
- Registry: renders with Recharts + UI components

**Example:**
```typescript
const spec = nlqResultToSpec(nlqResult);
<GenerativeDashboard spec={spec} />
```

### 3. portless (9.4k stars)
**What:** Stable local URLs with HTTPS/HTTP2
**Version:** 0.13.0
**Use for:** Dev server with named URLs instead of port numbers
**Key feature:** `https://finplan.localhost` instead of `http://localhost:3000`
**Config:** `portless.json` in project root

**Benefits:**
- HTTP/2 multiplexing for faster dev
- Git worktree support
- Agent-friendly stable URLs

### 4. agent-skills (26.9k stars)
**What:** Vercel's official agent skills collection
**Skills installed (8):**
- vercel-optimize — audit cost/performance
- vercel-react-best-practices — 40+ React rules
- web-design-guidelines — 100+ UI/accessibility rules
- vercel-composition-patterns — scalable React patterns
- vercel-react-view-transitions — View Transition API
- vercel-react-native-skills — React Native patterns
- vercel-cli-with-tokens — CLI automation
- deploy-to-vercel — instant deployments

## How These Help FinPlan Pro

| Tool | Impact | Priority |
|------|--------|----------|
| agent-browser | E2E testing without Playwright | HIGH |
| json-render | AI-generated dashboards | HIGH |
| portless | Better dev experience | MEDIUM |
| agent-skills | React best practices | HIGH |

## E2E Test Coverage

```
tests/e2e/smoke-test.sh
├── Flow 1: Homepage load ✓
├── Flow 2: Accessibility snapshot ✓ (15 nodes)
├── Flow 3: Dashboard navigation ✓
├── Flow 4: Budgets navigation ✓
├── Flow 5: Reports navigation ✓
├── Flow 6: Scenarios navigation ✓
├── Flow 7: Templates navigation ✓
├── Flow 8: NLQ Chat input (skipped — no selector match)
└── Flow 9: Final screenshot ✓
```

## Related
- [[2026-05-20-phase123-complete]] — all phases done
- [[e2e-testing]] — agent-browser tests
- [[nlq-system]] — NLQ engine
- [[generative-dashboard]] — json-render integration
