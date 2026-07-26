---
date: 2026-05-19
type: competitive-analysis
project: FinPlan Pro
tags: [finplan-pro, competitive, features, matrix]
status: current
---

# FinPlan Pro Feature Matrix

## Core Engine Status

| Feature | Status | Lines | Notes |
|---------|--------|-------|-------|
| [[formula-engine]] | COMPLETE | 5309 | 245+ functions, 7 modules, Excel-compatible |
| [[consolidation]] | COMPLETE | 966 | ASC 810, IC elimination, FX, minority interest |
| [[import-system]] | COMPLETE | 574 | CSV/JSON, auto-delimiter, encoding detection |
| Excel Import | COMPLETE | 412 | xlsx/xls, auto-column mapping, validation |
| [[auth-rbac]] | COMPLETE | 333 | 5 roles, JWT, brute force protection |
| [[plugin-system]] | COMPLETE | 1585 | Registry, Loader, API, Manager |
| [[fx-engine]] | COMPLETE | 139 | Currency conversion, ASC 830 |
| [[compliance]] | COMPLETE | 169 | SOX, SOD, audit trail |

## Sector Coverage (16 configs)
- Technology/SaaS, Manufacturing, Retail, Banking, Healthcare
- Energy, Real Estate, Construction, Insurance, Telecom
- Logistics, Hospitality, Government, Education, Agriculture
- + index.ts registry

## Page Status
- 50+ page domains across src/pages/
- 20+ pages with TODO/stub markers
- Key wired pages: Dashboard, Budget, Forecast, Scenario, Reports, GL Explorer

## Competitive Advantages
1. **Offline-first** — No cloud dependency, Tauri desktop
2. **Formula parity** — 245+ Excel-compatible functions
3. **Multi-entity** — Full ASC 810 consolidation
4. **Sector-specific** — 15 industry configs with domain KPIs
5. **Plugin extensibility** — Typed plugin API (foundation)

## vs Competitors
| Feature | FinPlan | Planful | Adaptive | Anaplan |
|---------|---------|---------|----------|---------|
| Offline mode | Yes | No | No | No |
| Self-hosted | Yes | No | No | No |
| Plugin system | Yes | No | Limited | Yes |
| Formula functions | 245+ | 200+ | 150+ | 300+ |
| ASC 810 | Yes | Yes | Yes | Yes |
| Price (annual) | $0-1788 | $30K+ | $50K+ | $100K+ |
