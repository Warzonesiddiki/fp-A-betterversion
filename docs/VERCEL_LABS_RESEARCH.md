# Vercel Labs — Tools for FinPlan Pro

## Installed Tools

### 1. agent-browser (33.6k stars)
**What:** Browser automation CLI for AI agents — Rust-based, accessibility-first
**Install:** `npm install -g agent-browser` (v0.27.0)
**Use for:** E2E testing, screenshot generation, form automation
**Key feature:** `snapshot` returns accessibility tree with refs — no fragile CSS selectors
**Commands:** `agent-browser open`, `click`, `fill`, `screenshot`, `snapshot`

### 2. json-render (14.9k stars)
**What:** Generative UI framework — AI generates JSON, renders as safe UI
**Install:** `npm install @json-render/core @json-render/react`
**Use for:** AI-generated financial dashboards, dynamic report layouts
**Key feature:** Define component catalog with Zod schemas — AI can only use your components
**Example:** Define Card, Metric, Button → AI generates dashboard spec → render safely

### 3. portless (9.4k stars)
**What:** Stable local URLs with HTTPS/HTTP2
**Install:** `npm install -D portless` (v0.13.0)
**Use for:** Dev server with named URLs instead of port numbers
**Key feature:** `https://finplan.localhost` instead of `http://localhost:3000`
**Benefits:** HTTP/2 multiplexing, git worktree support, agent-friendly URLs

### 4. agent-skills (26.9k stars)
**What:** Vercel's official agent skills collection
**Install:** `npx skills add vercel-labs/agent-skills`
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

## json-render for Financial Dashboards

```typescript
import { defineCatalog, defineRegistry } from '@json-render/core'
import { Renderer } from '@json-render/react'

// Define what AI can use
const catalog = defineCatalog({
  Card: { props: { title: 'string', value: 'number' } },
  Metric: { props: { label: 'string', value: 'number', format: 'currency|percent|number' } },
  Chart: { props: { type: 'bar|line|pie', data: 'array' } },
  Button: { props: { label: 'string', action: 'export|refresh|drill-down' } },
})

// AI generates spec → render safely
<Renderer spec={aiGeneratedSpec} registry={registry} />
```

## Next Steps
1. Use agent-browser for E2E testing (replace Playwright dependency)
2. Use json-render for AI-generated dashboards in NLQ chat
3. Use portless for dev server (HTTPS by default)
4. Apply vercel-react-best-practices to all components
