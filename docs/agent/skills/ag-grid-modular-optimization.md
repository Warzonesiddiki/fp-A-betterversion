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

1. **Install modules, not packages**: use `@ag-grid-community/client-side-row-model`, etc., not `ag-grid-community` + `ag-grid-enterprise` which bloats.
2. **Cherry-pick**: only modules you use. Example: ClientSideRowModel, TextFilter, NumberFilter, DateFilter, RowSelection, RowStyle, CsvExport.
3. **Register via ModuleRegistry**: `ModuleRegistry.registerModules([ClientSideRowModelModule, ...])` globally once. Or per-grid for varying requirements.
4. **ValidationModule dev-only**: `...(import.meta.env.DEV ? [ValidationModule] : [])` — excludes from prod bundles.
5. **Version**: use at least v30 (ESM default, 5-10% reduction), v32 (up to 15% reduction), v33 (up to 40% reduction via tree-shaking from single bundle).
6. **Measure**: `npm run build` + `bundle-check` — grid-community-vendor should be <300KB gz (G19), warn at 270KB. Before modular, main.js 520KB gz → after 300KB gz = 43% reduction (blog.ag-grid.com).
7. **No AllModules**: `@ag-grid-community/all-modules` is not tree-shakeable, includes everything even if you import one feature.

## In this repo

- `src/components/ui/DataGrid.tsx` already does modular registration (P-02-I): ClientSideRowModel, TextFilter, NumberFilter, DateFilter, RowSelection, RowStyle, CsvExport, ValidationModule dev-only.
- Gate: `scripts/bundle-check.js` checks `grid-community-vendor` and `grid-react-vendor` each <300KB gz.
- Witness: docs/plan/PR_94_40H_PLAN.md §bundle optimization — grid-community-vendor 206KB gz PASS.

## Red flags

- Importing `ag-grid-community` without modules.
- Registering AllCommunityModule in prod.
- ValidationModule in prod bundle.

**Proves itself with:** bundle-check G19 PASS for grid vendors, DataGrid tests PASS.
**Source:** adapted from ag-grid.com/modules, blog.ag-grid.com/minimising-bundle-size (MIT docs, rewritten).
