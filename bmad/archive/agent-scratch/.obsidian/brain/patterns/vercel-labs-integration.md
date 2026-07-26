---
date: 2026-05-20
type: pattern
project: FinPlan Pro
tags: [finplan-pro, pattern, vercel, tools, integration]
status: current
---

# Vercel Labs Integration Pattern

## Important: OpenClaude Tools, NOT Project Dependencies

These are tools for OpenClaude (the AI assistant) to use when building FinPlan Pro. They are NOT project dependencies — they should NEVER be in package.json.

## Tools Available to OpenClaude

### 1. agent-browser (global CLI)
- Browser automation CLI for AI agents
- Accessibility-first, Rust-based
- Use: E2E testing, screenshots, form automation
- Install: `npm install -g agent-browser` (already installed)
- Docs: `agent-browser --help`

### 2. json-render (pattern reference)
- Generative UI framework — pattern only, not a dependency
- Catalog → Registry → Spec → Render pattern
- Implemented in pure React: `GenerativeDashboard.tsx`
- Use: AI-generated financial dashboards in NLQ chat
- Pattern: defineCatalog → defineRegistry → renderElement

### 3. portless (global CLI)
- Stable local URLs with HTTPS/HTTP2
- Use: `https://finplan.localhost` instead of `http://localhost:3000`
- Install: `npm install -g portless`

### 4. agent-skills (in .claude/skills/)
- 8 skills for OpenClaude reference:
  - vercel-optimize — cost/performance audit
  - vercel-react-best-practices — 40+ React rules
  - web-design-guidelines — 100+ UI rules
  - vercel-composition-patterns — scalable patterns
  - vercel-react-view-transitions — View Transition API
  - vercel-react-native-skills — React Native
  - vercel-cli-with-tokens — CLI automation
  - deploy-to-vercel — instant deployments

## How OpenClaude Uses These

- **E2E testing**: `bash tests/e2e/smoke-test.sh` (agent-browser)
- **Generative UI**: `<GenerativeDashboard spec={nlqResultToSpec(data, intent)} />` (pure React)
- **Dev server**: `npx portless start` for HTTPS local dev
- **Skills**: auto-activate on relevant tasks

## Related
- [[generative-dashboard]] — pure React implementation of json-render pattern
- [[e2e-testing]] — agent-browser usage
- [[skills-inventory]] — all skills installed
- [[2026-05-20-phase123-complete]] — completion milestone
