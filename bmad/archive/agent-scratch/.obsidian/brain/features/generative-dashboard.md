---
date: 2026-05-20
type: feature
project: FinPlan Pro
tags: [finplan-pro, feature, ai, generative-ui, json-render]
status: current
---

# Generative Dashboard — json-render Integration

## What
AI-generated financial dashboards from JSON specs using Vercel's json-render framework.

## Components
- `src/components/ui/GenerativeDashboard.tsx` (171 lines)
  - `defineCatalog()` — Card, Metric, Chart, Table, KPIRow
  - `defineRegistry()` — maps to Recharts + custom components
  - `nlqResultToSpec()` — converts NLQ query results to renderable specs
  - `<GenerativeDashboard spec={spec} />` — renders AI-generated dashboard

## How It Works
1. NLQ engine parses "show revenue by region"
2. NLQEngine returns structured data + intent
3. `nlqResultToSpec()` converts to json-render spec
4. `<Renderer spec={spec} registry={registry} />` renders safe UI

## Catalog
| Component | Props | Purpose |
|-----------|-------|---------|
| Card | title, value, format | KPI display |
| Metric | label, value, trend | Metric with up/down indicator |
| Chart | type, data, title | bar/line/pie/area chart |
| Table | columns, data | Data table |
| KPIRow | items | Row of metrics |

## Why json-render
- AI can only use components in your catalog (safe)
- JSON output matches Zod schema (type-safe)
- Supports streaming (progressive render)
- Works with any AI model (offline-compatible)

## Dependencies
- @json-render/core@0.19.0
- @json-render/react@0.19.0

## Related
- [[nlq-system]] — provides query data
- [[charts]] — underlying chart components
- [[vercel-labs-integration]] — Vercel Labs tools
