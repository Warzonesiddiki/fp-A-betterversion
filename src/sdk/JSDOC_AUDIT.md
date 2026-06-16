# Plugin Surface — JSDoc Coverage Audit

**Generated:** 2026-06-16 (CYCLE 6 PICK C, post-SDK scaffold)
**Methodology:** `wc -l` + `grep -c "^\s*\*"` + `grep -c "^\s*export "` per file
**Scope:** 36 source files in `src/**` matching `plugin|widget|extension`
(extends beyond `src/plugins/*` to cover the broader plugin-related surface:
engines, hooks, stores, types, UI components, and pages that touch the
plugin system).
**Goal:** Identify JSDoc gaps so future 1-Muse picks can close them
incrementally without re-auditing the whole surface.

---

## TL;DR

| Metric | Value |
|--------|-------|
| Files in scope | 36 |
| Total LOC | 11_676 |
| Total JSDoc lines | 153 |
| Overall JSDoc density | **1.31 %** (target: ≥5 % for SDK-style public surface) |
| Files with **0** JSDoc | 18 / 36 (50 %) |
| Files with **good** JSDoc (≥10 lines) | 6 / 36 (17 %) |
| Files with **excellent** JSDoc (≥20 lines) | 4 / 36 (11 %) |
| **SDK surface (this PR)** | 4 files / 867 LOC / **116 JSDoc lines (13.4 %)** ✅ |

**Verdict:** the plugin surface is **under-documented**; the new
`src/sdk/*` is the documented exception and is the model the rest should
follow. Recommended coverage target: every `export class`, `export
function`, and `export interface` should have a JSDoc block with `@param`
/ `@returns` / `@example` where applicable.

---

## Per-file audit

Columns: `total` = LOC, `jsdoc` = `^\s*\*` lines, `exports` = `^\s*export `
count. Verdict codes: ✅ good, ⚠ partial, ❌ missing, ➖ non-source (no
exports worth documenting).

| File | total | jsdoc | exports | verdict | gap |
|------|------:|------:|--------:|---------|-----|
| `src/App.tsx` | 588 | 4 | 1 | ❌ | 1 class |
| `src/components/dashboard/DashboardTemplate.tsx` | 383 | 0 | 4 | ❌ | 4 exports |
| `src/components/dashboard/WidgetLibrary.tsx` | 244 | 0 | 5 | ❌ | 5 exports |
| `src/components/dashboard/index.ts` | 11 | 0 | 11 | ➖ | barrel |
| `src/components/errors/PluginErrorBoundary.tsx` | 79 | 0 | 1 | ❌ | 1 class |
| `src/components/plugins/PluginCard.tsx` | 170 | 3 | 1 | ⚠ | 1 class |
| `src/components/plugins/PluginDetail.tsx` | 294 | 3 | 1 | ⚠ | 1 class |
| `src/components/plugins/index.ts` | 6 | 2 | 2 | ✅ | — |
| `src/components/ui/FileDropZone.tsx` | 229 | 0 | 2 | ❌ | 2 exports |
| `src/engines/CubeEnginePersistence.ts` | 855 | 0 | 1 | ❌ | 1 class |
| `src/engines/DashboardBuilderEngine.ts` | 273 | 0 | 6 | ❌ | 6 exports |
| `src/engines/ImportEngine.ts` | 636 | 29 | 8 | ✅ | — |
| `src/engines/PluginEngine.ts` | 454 | 0 | 2 | ❌ | 2 exports |
| `src/engines/RevRecEngine.ts` | 232 | 0 | 6 | ❌ | 6 exports |
| `src/engines/RollingForecastEngine.ts` | 392 | 0 | 8 | ❌ | 8 exports |
| `src/engines/index.ts` | 336 | 0 | 145 | ➖ | barrel |
| `src/hooks/useTauriGlobalShortcuts.ts` | 49 | 0 | 1 | ❌ | 1 hook |
| `src/hooks/useTauriMenu.ts` | 142 | 0 | 2 | ❌ | 2 hooks |
| `src/pages/_docs.ts` | 1144 | 6 | 2 | ⚠ | — |
| `src/pages/_routeHelpMap.ts` | 618 | 15 | 4 | ✅ | — |
| `src/pages/analytics/DashboardBuilderPage.tsx` | 189 | 0 | 1 | ❌ | 1 page |
| `src/pages/plugins/PluginMarketplacePage.tsx` | 245 | 3 | 1 | ⚠ | 1 page |
| `src/plugins/PluginAPI.ts` | 333 | 6 | 2 | ⚠ | 1 class |
| `src/plugins/PluginLoader.ts` | 211 | 17 | 4 | ✅ | — |
| `src/plugins/PluginManager.ts` | 171 | 3 | 2 | ⚠ | 1 class |
| `src/plugins/PluginMarketplace.ts` | 334 | 5 | 3 | ⚠ | 3 exports |
| `src/plugins/PluginRegistry.ts` | 277 | 2 | 3 | ❌ | 3 exports |
| `src/plugins/PluginSandbox.ts` | 598 | 53 | 3 | ✅ | exemplar |
| `src/plugins/index.ts` | 57 | 2 | 12 | ⚠ | barrel |
| `src/plugins/test-sandbox.ts` | 8 | 0 | 0 | ➖ | test util |
| `src/plugins/types.ts` | 323 | 3 | 34 | ❌ | 34 type exports |
| `src/store/dashboardStore.ts` | 205 | 0 | 8 | ❌ | 8 exports |
| `src/store/uiStore.ts` | 95 | 0 | 1 | ❌ | 1 store |
| `src/types/index.ts` | 855 | 0 | 66 | ➖ | barrel + ambient types |
| `src/types/plugin.ts` | 189 | 0 | 17 | ❌ | 17 type exports |
| `src/utils/tauriSqlStorage.ts` | 55 | 0 | 2 | ❌ | 2 exports |

**Totals:** 11_676 LOC, 153 JSDoc lines (1.31 %), 388 exports.

---

## Coverage by directory

| Directory | Files | JSDoc density | Verdict |
|-----------|------:|---------------:|---------|
| `src/sdk/` (NEW, this PR) | 4 | **13.4 %** | ✅ **exemplar** |
| `src/plugins/` (core) | 11 | 7.2 % | ⚠ partial |
| `src/components/plugins/` | 3 | 7.6 % | ⚠ partial |
| `src/engines/` (plugin-related) | 7 | 2.2 % | ❌ under |
| `src/store/` (plugin-related) | 2 | 0.0 % | ❌ missing |
| `src/hooks/` (Tauri plugin bridges) | 2 | 0.0 % | ❌ missing |
| `src/types/` (plugin types) | 2 | 0.0 % | ❌ missing |
| `src/pages/` (plugin pages) | 3 | 2.0 % | ❌ under |
| `src/utils/` (tauri storage) | 1 | 0.0 % | ❌ missing |
| `src/components/{dashboard,errors,ui}/` | 5 | 0.0 % | ❌ missing |

---

## Exemplar — `src/plugins/PluginSandbox.ts` (53 JSDoc lines)

This is the file every other engine / hook / store should imitate:

- ✅ Class-level JSDoc explaining purpose & threat model
- ✅ Method-level JSDoc with `@param` / `@returns` / `@throws`
- ✅ Inline JSDoc on private helpers explaining the "why"
- ✅ Security-relevant assumptions called out explicitly

**Suggested PICK for a follow-on:** bring `src/engines/PluginEngine.ts`
(454 LOC, 0 JSDoc) up to the `PluginSandbox.ts` standard. ~2h, ~80
JSDoc lines added. Self-contained — no Muse collision risk.

---

## Recommended incremental picks

Listed in order of **highest user-visible impact × lowest risk**:

1. **PICK C-2** — `src/engines/PluginEngine.ts` JSDoc pass (2h, ~80 lines, 0 risk)
2. **PICK C-3** — `src/engines/CubeEnginePersistence.ts` (855 LOC, 0 JSDoc) — high impact, ~2-3h
3. **PICK C-4** — `src/types/plugin.ts` + `src/types/index.ts` (plugin subset) — type docs unblock SDK consumers
4. **PICK C-5** — `src/store/dashboardStore.ts` + `uiStore.ts` — store API surface
5. **PICK C-6** — `src/hooks/useTauri*.ts` — Tauri plugin bridge docs
6. **PICK C-7** — `src/components/plugins/{PluginCard,PluginDetail}.tsx` — UI surface

---

## Methodology caveats

- `^\s*\*` counts every line starting with ` *` inside a JSDoc block,
  so it includes the opening `/**`, closing `*/`, and any blank lines
  inside the block. Real "informative" line count is ~70 % of this
  number.
- The audit counts `^\s*export ` (any export). It does not distinguish
  between `export class`, `export function`, `export const`, and
  `export interface` — each of which has different documentation
  needs.
- Barrel files (`index.ts`) and test utilities are flagged `➖` and
  excluded from gap totals.

---

## Cross-references

- **SDK documentation target:** `src/sdk/README.md` (this PR)
- **SDK public type contract:** `src/sdk/types.ts` (this PR, 152L)
- **SDK quick-start example:** `docs/parts/API_EXAMPLES.md §6`
- **Plugin API contract:** `src/plugins/PluginAPI.ts` (10 sub-APIs)
- **CASCADE-HOLD notice:** Do not modify any of the 36 in-scope files
  outside a dedicated PICK — the JSDoc pass picks above are designed
  to be CASCADE-safe (1 file per commit).
