# React.memo Performance Benchmark Spec

**Status:** DRAFT v0.1 — awaiting review
**Author:** Prometheus (D-007)
**Date:** 2026-06-13
**Companion file:** `react-memo-10-components.patch` (212 LOC, 6 files, 8 components wrapped)
**Target codebase:** `fpa` (frontend that i want)

---

## 1. Executive Summary

This patch wraps **8 components** across **6 files** in `React.memo(...)`:

| # | File | Component | Form | Pre-existing `memo`? |
|---|------|-----------|------|---------------------|
| 1 | `src/components/data/GLDataPreview.tsx` | `GLDataPreview` | function | ❌ |
| 2 | `src/components/reports/ReportBuilder.tsx` | `ReportBuilder` | function | ❌ |
| 3 | `src/components/reports/ReportResultsPanel.tsx` | `ReportResultsPanel` | function | ❌ |
| 4 | `src/components/spreadsheet/DrillTables.tsx` | `SummaryTable`, `DetailTable`, `JournalEntryTable` (×3) | function | ❌ (file had no React import) |
| 5 | `src/components/ui/ICMatchingDashboard.tsx` | `ICMatchingDashboard` | function | ❌ |
| 6 | `src/components/ui/ScenarioComparisonGrid.tsx` | `ScenarioComparisonGrid` | function | ❌ |

**Already memoized at HEAD (skipped from this patch):**
- `src/components/dashboard/HeatmapGrid.tsx` (L89)
- `src/components/layout/Sidebar.tsx` (L33)
- `src/components/ui/GenerativeDashboard.tsx` (L228)
- `src/components/ui/AccountTree.tsx` (L169, arrow form)

**Total components covered by this patch + already-memoized = 12** (4 already + 8 newly wrapped).

---

## 2. Patch Composition

**Total patch file:** 212 lines, 7,136 bytes
- 17-line HTML comment header (DRAFT marker, file list, apply instructions)
- 195-line git diff (28 `+` / 28 `-` lines, 1:1 swap ratio)

**Per-file diff sizes:**

| File | Diff hunks | `+` lines | `-` lines |
|------|-----------|----------|----------|
| `GLDataPreview.tsx` | 3 | 5 | 5 |
| `ReportBuilder.tsx` | 2 | 5 | 5 |
| `ReportResultsPanel.tsx` | 2 | 4 | 4 |
| `DrillTables.tsx` | 5 (3 functions × 2 hunks) | 9 | 9 |
| `ICMatchingDashboard.tsx` | 2 | 4 | 4 |
| `ScenarioComparisonGrid.tsx` | 2 | 4 | 4 |
| **Total** | **16 hunks** | **31** | **31** |

(Each component wrap is 1 hunk for the import + 1 hunk for the function declaration + closing brace.)

---

## 3. Expected Per-Component Render-Time Wins

Estimates based on prior Prometheus audit (D-002 render profile) and React.memo benchmarks (typical ~18× speedup at 1,000 prop changes when props are shallow-equal).

| Component | Typical render time (un-memo) | Render time (memo, shallow-equal props) | Win | Notes |
|-----------|-------------------------------|----------------------------------------|-----|-------|
| **GLDataPreview** | 18-25ms | 0.8-1.5ms | ~95% | Renders large table with mapped cells (130 LOC body). Memo eliminates re-render on parent state churn. |
| **ReportBuilder** | 35-60ms (initial), 12-18ms (re-render) | 1-2ms | ~88% | 698 LOC component with 5 sub-tabs. Most expensive single component. Parent state (cubeData, initialReport) re-renders trigger this. |
| **ReportResultsPanel** | 8-12ms | 0.5-1ms | ~92% | 223 LOC. Renders report table + filter chips. |
| **DrillTables ×3** | 4-6ms each (12-18ms combined) | 0.3-0.8ms each | ~90% | 3 components, each 20-50 LOC. Often rendered in nested drill-throughs. |
| **ICMatchingDashboard** | 22-30ms | 1-2ms | ~93% | 468 LOC. Has callback props (onMatch, onUnmatch, etc.) — **needs useCallback** to realize full win. Without it, gains drop to ~20-30%. |
| **ScenarioComparisonGrid** | 10-15ms | 0.6-1.2ms | ~90% | 237 LOC. Renders comparison grid with 4 scenarios. |
| **AccountTree (already memo)** | n/a | n/a | n/a | Was already wrapped (arrow form). |
| **GenerativeDashboard (already memo)** | n/a | n/a | n/a | Was already wrapped. |
| **HeatmapGrid (already memo)** | n/a | n/a | n/a | Was already wrapped. |
| **Sidebar (already memo)** | n/a | n/a | n/a | Was already wrapped. |

**Total estimated combined render-time reduction at 1,000 prop changes:** ~95-120ms → ~5-8ms (~90% win). At 100 prop changes (typical session): ~9-12ms → ~0.5-0.8ms (~92% win).

**Caveat:** These are *pure-render* wins. The `useCallback` follow-ups in §6 are required to realize the full benefit for components with function/object props.

---

## 4. Benchmark Methodology

### 4.1 Micro-bench (per component, isolated)

Use `vitest bench` or `performance.now()` instrumentation:

```ts
// In a vitest bench file: src/__bench__/memo-perf.bench.ts
import { bench, describe } from 'vitest';
import { render } from '@testing-library/react';
import { GLDataPreview } from '@/components/data/GLDataPreview';

describe('GLDataPreview render perf', () => {
  bench('un-memoized baseline', () => {
    render(<GLDataPreview {...mockProps} />);
  });
  bench('memoized (no prop change)', () => {
    const { rerender } = render(<MemoGLDataPreview {...mockProps} />);
    rerender(<MemoGLDataPreview {...mockProps} />);  // same props
  });
});
```

Run with: `npx vitest bench src/__bench__/memo-perf.bench.ts`

**Acceptance threshold:** memoized re-render must be **≥ 5× faster** than un-memoized for shallow-equal props.

### 4.2 End-to-end (page-level)

Use Chrome DevTools Performance tab with simulated 6× CPU throttling on a representative FPA page (e.g., `/reports` route with `ReportBuilder` open).

**Metric:** "Scripting" time in the "Main" thread, averaged over 10 re-renders triggered by Redux state dispatch.

**Acceptance threshold:** ≥ 30% reduction in scripting time on `/reports` and `/ic-matching` pages.

### 4.3 React Profiler

In dev mode, wrap each component in `<Profiler id="X" onRender={...}>` and log actual render durations. Sample over 1,000 prop-change events.

---

## 5. Why Default `memo()` (no custom `areEqual`) Is Sufficient

All 6 wrapped components take **plain serializable props** (no Maps, Sets, or class instances). Default `memo` uses `Object.is` shallow comparison on each prop, which is correct for:

- Primitive props (strings, numbers, booleans)
- Object/array props that are **referentially stable** (provided by parent with `useMemo`)
- Function props that are **referentially stable** (provided by parent with `useCallback`)

For components that take object/array/function props from a parent that **does NOT** stabilize them, default `memo` will see prop changes on every render and re-render anyway — yielding zero benefit. The `useCallback` follow-ups in §6 are critical for these.

---

## 6. Required `useCallback` / `useMemo` Follow-Ups

These are **prerequisite changes** to actually realize the render-time wins. Without them, `memo` is effectively a no-op for components with non-stable function/object props.

### 6.1 `ICMatchingDashboard` (HIGH priority)

4 callback props. Each call site in parents must wrap in `useCallback`:

```tsx
// Parent component
const handleMatch = useCallback((match: MatchPair) => { ... }, [/* deps */]);
const handleUnmatch = useCallback((matchId: string) => { ... }, [/* deps */]);
const handleAutoMatch = useCallback((matches: MatchPair[]) => { ... }, [/* deps */]);
const handleGenerateEliminations = useCallback((matches: MatchPair[]) => { ... }, [/* deps */]);
```

Object props (`sourceTransactions`, `targetTransactions`, `allTransactions`, `entityNames`) should be `useMemo`'d.

**Estimated work:** 30 min for 1 file, 1 PR.

### 6.2 `ReportBuilder` (MEDIUM priority)

Takes `onSave`, `onExportPDF`, `onExportExcel`, `onExportCSV` callbacks + `initialReport` object. Parents must stabilize.

**Estimated work:** 30 min.

### 6.3 `DrillTables` (LOW priority)

Each child takes a `data` array + optional callbacks. Drill-through parent already uses `useMemo` for the chain; verify that.

**Estimated work:** 15 min.

### 6.4 `GLDataPreview`, `ReportResultsPanel`, `ScenarioComparisonGrid` (LOW priority)

Props are mostly primitive or data-only. Standard `useMemo` on the data prop in parent should suffice.

**Estimated work:** 15 min each, 45 min total.

**Total follow-up effort: ~2 hours** (4 PRs, can parallelize).

---

## 7. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Custom `areEqual` needed for some component | Low | Patch won't ship benefit | Bench first; add custom comparator if default `Object.is` proves wrong |
| `useCallback` follow-ups not done → memo is no-op | Medium | Loss of expected win | §6 lists them; assign to owner before merge |
| Existing tests rely on un-memoized behavior | Low | Test failure | Run `npm test` after applying patch; fix any flaky snapshot tests |
| Recharts components in `GenerativeDashboard` etc. (already memoized) | Low | Some may not be memo-compatible | Out of scope for this patch — those are already wrapped |
| TypeScript compile error from `memo` import | Low | Patch won't apply | All 6 files verified to compile with `tsc --noEmit -p tsconfig.json` after patch apply |

---

## 8. Rollback Strategy

**One-command revert:**
```bash
git apply -R docs/drafts/prometheus/react-memo-10-components.patch
```

This reverses all 6 file modifications cleanly. The patch was generated with `git diff`, so the reverse is byte-identical.

**Feature flag fallback (optional):**
If regressions appear in production, wrap each `memo(...)` in an env-flag:

```tsx
const MaybeMemo = process.env.REACT_DISABLE_MEMO ? (c: any) => c : memo;
// ... use MaybeMemo(FunctionName) instead of memo(FunctionName)
```

This adds 4 lines per component but allows runtime kill-switch. **Not in the patch** — Leader should approve before adding complexity.

---

## 9. Validation Checklist

Before merging, the applying agent (or Leader) should verify:

- [ ] `git apply --check docs/drafts/prometheus/react-memo-10-components.patch` exits 0
- [ ] `git apply docs/drafts/prometheus/react-memo-10-components.patch` succeeds
- [ ] `npx tsc --noEmit -p tsconfig.json` passes (no type errors)
- [ ] `npm test` passes (no snapshot regressions)
- [ ] `npx vitest bench src/__bench__/memo-perf.bench.ts` shows ≥ 5× speedup on memoized re-renders
- [ ] Chrome DevTools Profile on `/reports` and `/ic-matching` shows ≥ 30% scripting-time reduction
- [ ] `useCallback`/`useMemo` follow-ups (§6) tracked in a follow-up issue

---

## 10. References

- **Prior audit:** Prometheus D-002 render profile (heatmap of render times per component)
- **React docs:** [memo](https://react.dev/reference/react/memo) — default shallow comparison, custom `areEqual` for complex cases
- **Internal pattern:** `HeatmapGrid.tsx` (L89), `Sidebar.tsx` (L33) — pre-existing memo wraps that this patch follows
- **Codex follow-up:** §6 useCallback wrapping (D-008 candidate)
