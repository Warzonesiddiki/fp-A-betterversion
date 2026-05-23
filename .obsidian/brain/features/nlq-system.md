---
date: 2026-05-20
type: feature
project: FinPlan Pro
tags: [finplan-pro, feature, nlq, ai, natural-language]
status: current
---

# Natural Language Query System

## Overview

NLQ lets users type financial queries in plain English and get auto-generated charts/tables. First offline NLQ in FP&A market.

## Components

### NLQEngine (540 lines)
`src/engines/NLQEngine.ts`

Core engine with 5 capabilities:
1. **parseQuery(text)** — parse natural language into structured query
2. **classifyIntent(query)** — classify as: chart, table, KPI, comparison, trend
3. **extractEntities(query)** — extract: time period, metric, dimension, filter
4. **executeQuery(query, stores)** — execute against Zustand stores
5. **generateChartConfig(result)** — generate Recharts config

Intent patterns:
- "show Q3 revenue" → chart, metric=revenue, period=Q3
- "compare budget vs actual" → comparison, metric=budget/actual
- "what is total expenses" → KPI, metric=expenses
- "trend of sales over time" → trend, metric=sales
- "revenue by region" → chart, metric=revenue, dimension=region

Entity extraction:
- Time: Q1-Q4, FY, month names, "last quarter", "this year"
- Metrics: revenue, expenses, profit, sales, etc.
- Dimensions: region, department, product, entity
- Filters: "where department = sales"

### NLQInput (146 lines)
`src/components/ui/NLQInput.tsx`

Search bar component:
- Autocomplete suggestions
- Keyboard navigation (up/down/enter)
- Recent queries history
- Wired into App.tsx

### ChatPanel (PLANNED)
`src/components/ui/ChatPanel.tsx`

Conversational interface:
- Message bubbles
- Inline chart rendering
- Multi-turn conversation
- Export chat history

## Competitive Advantage

| Competitor | NLQ Type | Offline? |
|-----------|----------|----------|
| Vena Copilot | Cloud AI | NO |
| Cube AI | Cloud AI | NO |
| Oracle GenAI | Cloud AI | NO |
| SAP SAC | Cloud AI | NO |
| **FinPlan Pro** | **Local AI** | **YES** |

FinPlan Pro is ONLY FP&A tool with offline NLQ. No data leaves the device.

## Dependencies

- AIEngine — AI processing
- FormulaEngine — formula parsing
- Chart components — visualization
- glStore, budgetStore, forecastStore — data sources

## Related
- [[formula-engine]] — formula parsing for NLQ
- [[charts]] — chart generation from NLQ results
- [[MASTER_PLAN]] — Phase 1 priority #1
