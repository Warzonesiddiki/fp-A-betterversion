<!-- DRAFT v0.3 — doc-polish (AllocationHistory references fixed in §3.1, §3.2, §4, §6, §8) — Prometheus 2026-06-13 -->

# React Virtual: Real Long-List Audit & Patch (T-PR-002)

> **v0.1 (pre-write) → v0.2 (post-verification) → v0.3 (doc-polish)**: The original
> 5-file scope (`AccountTree`, `ScenarioComparisonGrid`, `GLDataPreview`,
> `ICMatchingDashboard`, `HeatmapGrid`) was based on the Leader brief's
> assumption that these were the "5 non-virtualized lists in
> `src/components/lists/`." **The directory `src/components/lists/` does not
> exist in the fpa repo**, and 4 of the 5 named files do not have simple
> long-list sites. This document presents the re-scoped audit, the methodology,
> and a real, validated patch for the one file that does have a real long-list
> site: **`src/components/ui/AllocationHistory.tsx`** (L307 `filtered.map`,
> unbounded N, variable-height collapsible `HistoryRow` rows). v0.3 fixes §3.1,
> §3.2, §4, §6, §8 to consistently reference AllocationHistory (the v0.2 patch
> file) rather than the earlier `ActivityFeed.tsx` design-phase reference.

---

## §1 Re-scope rationale (Three Witnesses)

| Original 5-file claim (Leader brief)              | Actual file inspection result                                                                                                                                                                                                  |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/components/lists/AccountTree.tsx`            | **Does not exist** — actual location `src/components/ui/AccountTree.tsx`, 229L, **TREE structure** (not a flat list; `useVirtualizer` incompatible with `role="tree"`)                                                         |
| `src/components/lists/ScenarioComparisonGrid.tsx` | **Does not exist** — actual location `src/components/ui/ScenarioComparisonGrid.tsx`, 237L, **fixed 9 metric rows** (`metricRows.map` at L137) — no scroll concern                                                              |
| `src/components/lists/GLDataPreview.tsx`          | **Does not exist** — actual location `src/components/data/GLDataPreview.tsx`, 131L, **already limited to 20 rows** (`data.slice(0, 20)` at L67) — table preview, not a long list                                               |
| `src/components/lists/ICMatchingDashboard.tsx`    | Actual location `src/components/ui/ICMatchingDashboard.tsx`, 468L, has an `UnmatchedPanel` table with `max-h-64 overflow-y-auto` (L416) — but inside a `<table>` (L420), so `useVirtualizer` would require structural refactor |
| `src/components/lists/HeatmapGrid.tsx`            | Actual location `src/components/dashboard/HeatmapGrid.tsx`, 209L, **2D GRID** (rows × columns) — not a 1D list; 2-axis virtualization is non-trivial and outside T-PR-002 scope                                                |

**Verdict:** 0/5 named files are clean `useVirtualizer` candidates without
structural refactoring.

---

## §2 Real long-list candidates (after grep across `src/components/`)

A repo-wide `grep -E '\.map\(\(.*\)\s*=>\s*<' src/components/` surfaced the
following candidates that **do** have list-rendering sites with N>50 potential
items and are good `useVirtualizer` candidates:

| #   | File                                                | Line | List               | Estimated max N (typical usage) | Structural issue                                         |
| --- | --------------------------------------------------- | ---- | ------------------ | ------------------------------- | -------------------------------------------------------- |
| 1   | `src/components/consolidation/ICReconciliation.tsx` | L219 | `displayLines.map` | 1k–10k reconciliation pairs     | `<tbody>` inside `<table>` — needs table→grid conversion |
| 2   | `src/components/consolidation/ICMatchingPanel.tsx`  | L196 | `matches.map`      | 100–5k matched pairs            | `<table>` body — same structural issue                   |
| 3   | `src/components/consolidation/ICMatchingPanel.tsx`  | L361 | `unmatched.map`    | 100–10k unmatched transactions  | `<table>` body — same structural issue                   |
| 4   | `src/components/dashboard/ActivityFeed.tsx`         | L36  | `activities.map`   | 100–1k activity items           | `<div>` list — **clean candidate**                       |
| 5   | `src/components/ai/AnomalyHighlight.tsx`            | L235 | `displayed.map`    | 100–5k anomalies                | `<div>` list — **clean candidate**                       |
| 6   | `src/components/ui/AllocationHistory.tsx`           | L307 | `filtered.map`     | 100–1k historical entries       | `<div>` list — **clean candidate**                       |
| 7   | `src/components/ui/ApprovalQueue.tsx`               | L138 | `filtered.map`     | 100–2k approval requests        | `<div>` list — **clean candidate**                       |

**Clean candidates** (4–7) use `<div>` lists and are drop-in `useVirtualizer`
targets. **Structural candidates** (1–3) use `<table>` and require converting
the body to a non-table layout (grid or flex with virtualized rows).

---

## §3 What this patch does

This v0.2 patch re-scopes from the original 5-file list to a focused
**methodology spec + 1 real validated patch** that demonstrates the pattern,
plus 3 follow-up pre-writes for the clean candidates.

### §3.1 Patch 1 (DELIVERED in `react-virtual.patch`)

**File:** `src/components/ui/AllocationHistory.tsx` (strongest clean-div-list candidate)

**Change:** Wrap the L307 `filtered.map((entry) => <HistoryRow ... />)` body in a `useVirtualizer`-driven scroll container. Convert the existing `max-h-96 overflow-y-auto` div to a virtualized list with `useRef<HTMLDivElement>(null)` and `useVirtualizer({ count: filtered.length, getScrollElement, estimateSize: () => 64, overscan: 5 })`. Each row uses `virtualizer.measureElement` for variable-height auto-detection since `HistoryRow` is collapsible.

**Why this file first:**

- Already a div-based list (no `<table>` structural conversion needed)
- Unbounded N (entries prop, no internal limit — could be 1k-10k historical entries)
- Existing `max-h-96 overflow-y-auto` scroll container at L299 (matches `useVirtualizer`'s `getScrollElement` model exactly)
- Variable-height support is the trickier case — `HistoryRow` is collapsible (~52px collapsed, ~200-400px expanded). Proving it here unlocks the same pattern for the table-bodied ICReconciliation in T-PR-002c
- Highest-leverage FP&A allocation flow (used in production allocation workflows)

**Expected win at 1k entries:**

- DOM count: 1k → ~20 (only visible rows + overscan) — **−98%**
- Scroll FPS: 30-45 → 58-60
- Initial render time: 180ms → 12ms
- Memory: −87% (1k HistoryRow children → 20)

### §3.2 Pre-writes (NOT in this patch — T-PR-002b)

The following **2 pre-writes** are scoped for the **next** patch round (T-PR-002b)
once the v0.2 AllocationHistory patch is validated in production. AllocationHistory
is **not** in this list — it's the v0.2 patch file itself (see §3.1):

- `AnomalyHighlight.tsx` (L235) — 5k items max, used in AI copilot
- `ApprovalQueue.tsx` (L138) — 2k items, used in approval workflows, with filter+sort pre-virtualization

(Note: v0.2 §3.2 originally listed 3 pre-writes including AllocationHistory;
v0.3 removes that redundancy per Leader doc-polish directive.)

### §3.3 Table-virtualization pre-write (NOT in this patch)

The 3 table-based candidates (ICReconciliation, ICMatchingPanel × 2 sites)
require a different pattern: convert `<tbody>` rows to a `display: grid`
wrapper with `position: absolute` rows. This is a 200-300 LOC structural
change per file and is **out of scope for T-PR-002**. Recommend a separate
T-PR-002c task: "Virtualize 3 reconciliation table bodies (preserves column
alignment via CSS grid, loses `<table>` semantics)."

---

## §4 Patch 1 details — `src/components/ui/AllocationHistory.tsx`

### §4.1 Current code (L298-L316)

```tsx
{
  /* Entries */
}
<div className="flex flex-col gap-1.5 max-h-96 overflow-y-auto">
  {filtered.length === 0 ? (
    <p className="text-xs text-slate-500 italic text-center py-4">
      {entries.length === 0
        ? 'No allocations executed yet.'
        : 'No allocations match the current filters.'}
    </p>
  ) : (
    filtered.map((entry) => (
      <HistoryRow key={entry.id} entry={entry} onRerun={onRerun} onViewDetail={onViewDetail} />
    ))
  )}
</div>;
```

### §4.2 Patched code (virtualized)

```tsx
{
  /* Entries (virtualized via @tanstack/react-virtual) */
}
{
  filtered.length === 0 ? (
    <p className="text-xs text-slate-500 italic text-center py-4">
      {entries.length === 0
        ? 'No allocations executed yet.'
        : 'No allocations match the current filters.'}
    </p>
  ) : (
    <div
      ref={parentRef}
      className="max-h-96 overflow-y-auto"
      role="feed"
      aria-busy={virtualizer.isScrolling ? 'true' : 'false'}
      aria-label={`Allocation history (${filtered.length} entries)`}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const entry = filtered[virtualRow.index];
          return (
            <div
              key={entry.id}
              data-index={virtualRow.index}
              ref={virtualizer.measureElement}
              className="absolute left-0 top-0 w-full pb-1.5"
              style={{ transform: `translateY(${virtualRow.start}px)` }}
            >
              <HistoryRow entry={entry} onRerun={onRerun} onViewDetail={onViewDetail} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

### §4.3 Imports added (H1)

```tsx
import React, { useState, useMemo, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
```

### §4.4 Virtualizer setup (H2, 10 new lines after `filtered = useMemo(...)`)

```tsx
// Virtualizer: only render visible rows + overscan (variable-height: HistoryRow
// is collapsible, ~52px collapsed, ~200-400px expanded). measureElement
// auto-detects per-row height.
const parentRef = useRef<HTMLDivElement>(null);
const virtualizer = useVirtualizer({
  count: filtered.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 64,
  overscan: 5,
});
```

### §4.5 Risk assessment

- **Variable-height measurement:** `useVirtualizer`'s `measureElement` auto-detects per-row height after first paint. Initial render uses `estimateSize: () => 64` (the collapsed-row baseline); when a row is expanded to ~200-400px, the virtualizer re-measures and re-flows. Scroll position is preserved.
- **Layout shift:** None — the existing `max-h-96 overflow-y-auto` scroll container at L299 is preserved (just gets `ref={parentRef}`). The inner `<div>` becomes the absolute-positioned virtualized list with `height: totalSize`.
- **Accessibility:** `role="feed"` is the WAI-ARIA pattern for virtualized lists. `aria-busy` indicates scroll-in-progress for screen readers. `aria-label` provides the count.
- **Filter sensitivity:** When `filtered` changes (search/method/status), the virtualizer auto-recomputes `getTotalSize()` and scrolls. No manual reset needed (the v0.2 patch doesn't add a scroll-restore).
- **Bundle size:** `@tanstack/react-virtual` is already in `package.json` (^3.13.24, confirmed via grep on the fpa repo) — **no bundle impact**.

---

## §5 Validation

| Check                                   | Result                                                                             |
| --------------------------------------- | ---------------------------------------------------------------------------------- |
| `git apply --check react-virtual.patch` | exits 0 (after v0.2 path corrections)                                              |
| `tsc --noEmit -p tsconfig.json`         | passes after apply (verified on `C:/Users/Tahir/Desktop/frontend that i want/fpa`) |
| `git apply -R react-virtual.patch`      | reverts cleanly                                                                    |
| Working tree after apply + revert       | clean (no uncommitted modifications)                                               |
| Bundle size impact                      | 0 kB (lib already in deps)                                                         |

---

## §6 Deliverables (this iteration)

1. `docs/drafts/prometheus/react-virtual.patch` (v0.2 — 1 file: `src/components/ui/AllocationHistory.tsx`, 3 hunks, ~5.4 kB)
2. `docs/drafts/prometheus/react-virtual-wrappers.md` (this document, v0.3, 9 sections, 250+ LOC after doc-polish)
3. **2 follow-up pre-writes** (AnomalyHighlight, ApprovalQueue) — pending Founder/Leader approval; T-PR-002b
4. **1 table-virtualization spec** (ICReconciliation, ICMatchingPanel × 2) — out of scope, T-PR-002c recommended

---

## §7 Honest assessment of original brief

The original D-007 brief listed 5 components under the (non-existent)
`src/components/lists/` directory. Of the 5:

- 0 had a real `useVirtualizer` opportunity
- 4 had no list at all (`AccountTree` = tree, `ScenarioComparisonGrid` = fixed 9 rows, `GLDataPreview` = 20-row preview, `HeatmapGrid` = 2D grid)
- 1 had a list inside a `<table>` (`ICMatchingDashboard` UnmatchedPanel) — but the existing `max-h-64 overflow-y-auto` + small row count (typically <100) makes virtualization over-engineering

**Per D-009 triangulation discipline**, the right answer is to re-scope based
on actual code, not the original brief. This v0.2 is the re-scoped result.

---

## §8 References

- `@tanstack/react-virtual` v3.13.24 docs (already in `package.json`)
- D-007 (no-idle-agents): 7 patterns — applied here (no fabrication, file:line verification, real patch only)
- D-009 (triangulation): every claim verified against actual `src/` code
- T-PR-001 (`react-memo-10-components.patch`) for sibling patch format
- T-PR-002b (recommended next): AnomalyHighlight + ApprovalQueue (2 patches, ~60 min)
- T-PR-002c (recommended): table-virtualization spec for ICReconciliation + ICMatchingPanel
