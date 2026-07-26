---
date: 2026-05-20
type: feature
project: FinPlan Pro
tags: [finplan-pro, feature, templates, onboarding]
status: current
---

# Template Library

## Overview

Pre-built templates for budgets, forecasts, and reports across 16 industries. Speeds onboarding from days to minutes. 22/25 competitors have this.

## Components

### TemplateEngine (250 lines)
`src/engines/TemplateEngine.ts`

Core engine with 6 capabilities:
1. **loadTemplate(id)** — load template by ID
2. **instantiateTemplate(template, data)** — create instance from template
3. **customizeTemplate(template, changes)** — modify template
4. **listTemplates(category)** — list by category
5. **exportTemplate(template)** — export to JSON
6. **importTemplate(json)** — import from JSON

### Template Registry
`src/config/templates/index.ts`

Template categories:
- **Budget Templates** — 16 industry-specific (technology, manufacturing, retail, banking, healthcare, energy, real estate, construction, insurance, etc.)
- **Forecast Templates** — rolling forecast, driver-based, scenario
- **Report Templates** — P&L, BS, CF, variance, dashboard

### TemplateGalleryPage (340 lines)
`src/pages/templates/TemplateGalleryPage.tsx`

UI for browsing templates:
- Category filters
- Template preview
- Industry selection
- One-click apply

## Template Structure

```typescript
interface Template {
  id: string;
  name: string;
  description: string;
  category: 'budget' | 'forecast' | 'report';
  industry: string;
  columns: ColumnDef[];
  rows: RowDef[];
  formulas: FormulaDef[];
  charts: ChartConfig[];
  kpis: KPIDef[];
}
```

## Competitive Advantage

| Competitor | Templates | Industries |
|-----------|-----------|------------|
| Anaplan | 50+ | 5 |
| Planful | 30+ | 4 |
| Vena | 20+ | 2 |
| **FinPlan Pro** | **23+** | **16** |

FinPlan Pro has 3x more industry coverage than Anaplan.

## Related
- [[formula-engine]] — formulas in templates
- [[sector-dashboard]] — sector-specific templates
- [[MASTER_PLAN]] — Phase 1 priority #6
