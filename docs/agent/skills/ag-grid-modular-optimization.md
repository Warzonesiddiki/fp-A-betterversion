---
name: ag-grid-modular-optimization
description: >
  Use when ag-grid bundle is large or DataGrid is changed: cherry-pick modules, register via ModuleRegistry, keep ValidationModule dev-only.
group: product-ui
---

# AG Grid modular optimization

**Use when** touching `DataGrid.tsx`, adding grid features, or bundle-check shows grid-community-vendor >270KB gz.
**Skip when** grid change is styling only.

## Method

1. **Use the installed major-version module API.** This repository currently uses AG Grid 35 and imports its feature modules from `ag-grid-community`; do not copy package names or instructions for older AG Grid majors.
2. **Cherry-pick**: only modules you use. Example: ClientSideRowModel, TextFilter, NumberFilter, DateFilter, RowSelection, RowStyle, CsvExport.
3. **Register via ModuleRegistry**: `ModuleRegistry.registerModules([ClientSideRowModelModule, ...])` globally once. Or per-grid for varying requirements.
4. **ValidationModule dev-only**: `...(import.meta.env.DEV ? [ValidationModule] : [])` — excludes from prod bundles.
5. **Version:** do not upgrade solely for a historical percentage claim. Check the lockfile, migration guide, supported APIs, and before/after measurements for the exact version.
6. **Measure**: run `npm run build` then `npm run bundle-check`; the current gate enforces a 300KB gzip lazy-vendor limit and warns at 90% of the limit. Quote only output produced by that build.
7. **No AllModules**: `@ag-grid-community/all-modules` is not tree-shakeable, includes everything even if you import one feature.

## In this repo

- `src/components/ui/DataGrid.tsx` registers only the used modules (ClientSideRowModel, text/number/date filters, row selection/style, CSV export); `ValidationModule` is included only in development.
- Gate: `npm run bundle-check` evaluates named lazy-vendor chunks using current limits in `scripts/bundle-check.js`. Do not treat an old plan’s chunk size as current evidence.

## Red flags

- Importing `ag-grid-community` without modules.
- Registering AllCommunityModule in prod.
- ValidationModule in prod bundle.

**Proves itself with:** bundle-check G19 PASS for grid vendors, DataGrid tests PASS.
**Source:** adapted from ag-grid.com/modules, blog.ag-grid.com/minimising-bundle-size (MIT docs, rewritten).
