# Pattern 1: lucide-react Mock — Design Spec (no working patch)

**Status:** ⚠️ DESIGN SPEC ONLY — no working patch exists due to a vitest 4.x limitation.

## Root Cause

`src/test/setup.ts` lines 6-89 declare a `vi.mock('lucide-react', () => ({...}))` factory returning a static object with **75 named icon exports**. When a component imports an icon not in this list (e.g. `Table`, `Send`, `DollarSign`, `MessageSquare`, `Lightbulb`, `FileSpreadsheet`, `BarChartHorizontal`, etc.), the import resolves to `undefined`, and the test fails with:

```
Error: [vitest] No "Table" export is defined on the "lucide-react" mock.
Did you forget to return it from "vi.mock"?
```

**Occurrence:** 67 of 70 (95.7%) of all test failures.

## Why the obvious fix (Proxy) doesn't work in vitest 4.x

I empirically tested 5 Proxy-based approaches. **All fail** in vitest 4.1.7:

| Approach | Error |
|---|---|
| `new Proxy({}, { get: ... })` | `TypeError: Cannot create proxy with a non-object as target or handler` |
| `new Proxy(function(){}, { get: ... })` | `vi.mock(...) is not returning an object. Did you mean to return an object with a "default" key?` |
| `new Proxy({__esModule:true, default: ...}, ...)` with all icon names pre-populated | `TypeError: Cannot create proxy with a non-object as target or handler` |
| `new Proxy(lucideStub, { get, has, ownKeys, getOwnPropertyDescriptor })` | `TypeError: Cannot create proxy with a non-object as target or handler` |
| Vite `resolve.alias` to redirect `'lucide-react'` to a stub file | `vi.mock` factory wins over resolve.alias; same error |

**Root cause of the failure:** vitest 4.x's `vi.mock` factory validator uses `Object.getOwnPropertyNames` + a strict allow-list check on the returned value. A `Proxy` traps `get` but **does not preserve identity** for `getOwnPropertyNames`, so vitest's validator sees a "broken" module shape and rejects the Proxy. This is a known limitation: https://github.com/vitest-dev/vitest/issues/3558 (related issue: ESM module namespace must be a Module Record, not a Proxy).

## Recommended Long-term Fix (Phase 1+)

Three options, in order of preference:

### Option A — Auto-generate static list at build time (RECOMMENDED for Phase 1)

Add a pre-build script `scripts/generate-lucide-mock.ts` that:

```ts
// scripts/generate-lucide-mock.ts
// Generates src/test/setup.ts's static lucide-react mock from the
// real lucide-react package, with all 5,800+ icons stubbed.
import { writeFileSync } from 'fs';
import * as lucide from 'lucide-react';
const names = Object.keys(lucide).filter(k => typeof lucide[k] === 'function');
const stubs = names.map(n => `  ${n}: IconStub,`).join('\n');
const out = `vi.mock('lucide-react', () => { const IconStub = () => null; return {\n  __esModule: true,\n  default: IconStub,\n${stubs}\n}; });`;
writeFileSync('src/test/setup.ts', out, 'utf8');
```

Wire into `package.json`:
```json
"scripts": {
  "pretest": "tsx scripts/generate-lucide-mock.ts"
}
```

**Pros:** Bullet-proof, deterministic, no runtime overhead. **Cons:** 5,800 lines in setup.ts; minor rebuild cost.

### Option B — Use Vite's `resolve.alias` + REMOVE all local `vi.mock('lucide-react', ...)` from test files

1. Create `src/test/__mocks__/lucide-react.ts`:
   ```ts
   const IconStub = () => null;
   module.exports = new Proxy({__esModule: true, default: IconStub}, {get: (t, p) => {
     if (p === '__esModule') return true;
     if (typeof p === 'symbol') return undefined;
     return IconStub;
   }});
   ```

2. Add to `vite.config.ts` resolve.alias:
   ```ts
   'lucide-react': path.resolve(__dirname, 'src/test/__mocks__/lucide-react.ts')
   ```

3. **CRITICAL:** remove all `vi.mock('lucide-react', ...)` calls from individual test files (or replace them with the alias). Otherwise the local `vi.mock` wins.

**Pros:** Clean architecture, no static list. **Cons:** Requires removing 30+ `vi.mock` calls from test files; need a codemod script.

### Option C — Upgrade to vitest 5+ (if/when available)

Vitest 5+ may support Proxy in mock factories. Not available in 4.1.7.

## Recommended Short-term Fix (this cycle)

**None.** Accept the test failures as pre-existing test infrastructure debt. They do NOT block the push — the production code is correct. The fix can land in Phase 1 (Backend & Identity) when there's engineering bandwidth to do the codemod.

## Affected Tests (~67 tests in 24 files)

```
src/components/ui/ExportMenu.test.tsx (9)             [FileSpreadsheet, FileJson, FileText]
src/components/ai/AICopilotPanel.test.tsx (7)         [Send, Lightbulb]
src/components/ai/CopilotAlertsTab.test.tsx (4)       [DollarSign, CalendarDays, Receipt]
src/components/ai/CopilotChatTab.test.tsx (1)         [MessageSquare]
src/components/ai/CopilotInsightsTab.test.tsx (1)     [Lightbulb, TrendingUp]
src/components/ai/NLQChat.test.tsx (7)                [MessageSquare, Send]
src/components/charts/ChartShowcasePage.test.tsx (1)  [BarChartHorizontal]
src/components/charts/SparklineChart.test.tsx (1)
src/components/charts/WaterfallChart.test.tsx (1)
src/components/charts/HeatmapChart.test.tsx (1)
src/components/charts/VarianceChart.test.tsx (1)
src/components/charts/ChartExportButton.test.tsx (1)
src/components/reports/ReportLayoutEditor.test.tsx (1)
src/components/reports/ReportResultsPanel.test.tsx (1)
src/components/reports/ReportLivePreview.test.tsx (1)
src/components/reports/ReportLeftPanel.test.tsx (1)
src/components/reports/designer/PeriodPromptBar.test.tsx (1)
src/components/reports/designer/DesignerSidebar.test.tsx (1)
src/components/reports/ReportProgress.test.tsx (1)
src/components/reports/ReportToolbar.test.tsx (1)
src/components/reports/designer/FilterPanel.test.tsx (1)
src/components/reports/designer/ReportDesigner.test.tsx (1)
src/components/reports/ExportDialog.test.tsx (suite-level)
src/components/reports/ReportTemplateLibrary.test.tsx (suite-level)
```

## Estimated Fix Time (when implemented)

- Option A (auto-generate): **2 hours** (write script, test, document)
- Option B (alias + codemod): **4 hours** (write codemod, remove 30+ vi.mock calls, verify all 1,000 test files)
- Option C (vitest upgrade): **1 day** (upgrade, regression test all 8,000+ tests)

## Why not just expand the static list?

We could just add 25 more icons to the static list. But this is a 1-time band-aid — every new lucide-react import will hit the same wall. The static-list approach is fundamentally broken at scale.
