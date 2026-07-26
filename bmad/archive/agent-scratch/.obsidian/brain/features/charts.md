---
date: 2026-05-19
type: feature
project: FinPlan Pro
tags: [finplan-pro, charts, recharts, visualization]
status: current
---

# Advanced Chart Components

## Location
`src/components/charts/`

## Components

| Component | Lines | Purpose |
|-----------|-------|---------|
| WaterfallChart | 82 | Revenue/expense waterfall using Recharts BarChart with invisible base |
| VarianceChart | 65 | Budget vs actual with favorable (green) / unfavorable (red) colors |
| SparklineChart | 40 | Inline mini chart for KPI cards |
| TreemapChart | 92 | Portfolio/allocation view using Recharts Treemap |
| HeatmapChart | 102 | Correlation matrix or time-based heatmap |
| GaugeChart | 112 | KPI gauge/target indicator |
| index.ts | 15 | Barrel export |

## Design Principles
- TypeScript with explicit props interface
- Responsive (uses ResponsiveContainer)
- Dark mode support via CSS variables
- Accessible (aria-label, role)
- Financial formatting (currency, percentages)
- Export support (data-testid for screenshot tests)

## Usage
```tsx
import { WaterfallChart, VarianceChart, SparklineChart } from '@/components/charts';
```

## Dependencies
- Recharts (already installed)
- Tailwind CSS for styling
- Data sourced from [[formula-engine]] calculations
- Chart navigation uses [[keyboard-shortcuts]] (arrow keys, Escape)
- Chart [[accessibility]]: aria-label on all charts, screen reader support via LiveRegion
