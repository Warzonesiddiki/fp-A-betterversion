<!-- DRAFT v0.1 — awaiting review — Hera 2026-06-13 — T-HE-007 discovery -->

# T-HE-007 Discovery Pass — Motion Patterns & Reduced-Motion Audit

**Author:** Hera (UX/A11y/Design System)
**Date:** 2026-06-13
**Status:** Pre-claim discovery (D-007 no-idle-agents)

---

## §0 — Headline

**626 motion class instances across the codebase, 0 wrapped in `motion-safe:` or `motion-reduce:`.** The codebase IS functionally reduced-motion-safe via 2 global CSS handlers (`src/index.css:473` and `:625`), but ZERO component-level classes self-document that intent. This is the largest a11y debt category Hera has found in cycle 2.

## §1 — The numbers

| Metric | Count |
|--------|-------|
| Files with `transition-/animate-/duration-/ease-` classes | **278** |
| Total class instances | **626** |
| Wrapped in `motion-safe:` | **0** |
| Wrapped in `motion-reduce:` | **0** |
| Duplicate global handlers in `src/index.css` | **2** (L473, L625) |

## §2 — Top 20 offender files

| Violations | File |
|------------|------|
| 13 | `src/pages/ai/NLQChatPage.tsx` |
| 10 | `src/pages/budgets/BudgetListPage.tsx` |
| 9 | `src/components/ui/FileDropZone.tsx` |
| 9 | `src/components/ui/GuidedTour.tsx` |
| 8 | `src/components/layout/Sidebar.tsx` |
| 8 | `src/components/ui/ExportMenu.tsx` |
| 8 | `src/pages/data/ChartOfAccountsPage.tsx` |
| 8 | `src/pages/reports/BudgetVsActualPage.tsx` |
| 7 | `src/components/data/FindReplaceDialog.tsx` |
| 7 | `src/components/reports/designer/DesignerSidebar.tsx` |
| 7 | `src/components/reports/ReportBuilder.tsx` |
| 7 | `src/components/ui/AccountTree.tsx` |
| 7 | `src/components/ui/Toast.tsx` |
| 6 | `src/components/dashboard/KPICardEnhanced.tsx` |
| 6 | `src/components/layout/Navbar.tsx` |
| 6 | `src/components/reports/ReportTemplateLibrary.tsx` |
| 6 | `src/components/ui/DataTable.tsx` |
| 5 | `src/components/ai/AICopilotPanel.tsx` |
| 5 | `src/components/ai/CopilotSidebar.tsx` |
| 5 | `src/components/migration/MigrationWizard.tsx` |

**Top 20 = 144 violations (23% of total).** The other 482 are spread across 258 files (avg <2 per file — the long tail).

## §3 — The duplicate global handler finding

`src/index.css` has **two** identical `prefers-reduced-motion` handlers:
- L473-480: `*, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }`
- L625-633: same + `animation-iteration-count: 1 !important;`

The second one is inside a section starting at L610 that includes `.animation-delay` styles. **They're functionally identical** (the second adds iteration-count). The duplication is a P3 hygiene finding.

## §4 — T-HE-007 deliverable proposal (if I get the lane)

### Section structure (target ~450L, 8 sections)

- §1 **Why motion-safe matters** — WCAG 2.3.3 (AAA), prefers-reduced-motion is OS-level, vestibular disorders affect 35% of adults over 40
- §2 **The current state** — 626 instances, 0 wrapped; the global handler is the safety net but not the contract
- §3 **The 4 categories of motion** — hover/focus (micro, 100ms), state-change (small, 200ms), layout-shift (medium, 300ms), entrance/exit (large, 400ms+)
- §4 **The motion-safe pattern** — when to wrap (`motion-safe:transition-colors`), when NOT to wrap (color/border micro-transitions are universally fine)
- §5 **Advanced motion patterns** — orchestrated staggers (CSS `--delay` custom properties), gesture-driven (Framer Motion or radix-ui primitives), scroll-linked (intersection observer)
- §6 **The 3-Act migration** — Act 1: wrap the 144 high-leverage classes (top 20 files); Act 2: consolidate the duplicate global handler; Act 3: codify the contract in T-HE-006 §4.5
- §7 **Audit + apply patch** — combined `motion-safe-144-classes.patch` (similar to T-HE-005 format)
- §8 **Verification** — test in browser with `prefers-reduced-motion: reduce` enabled (DevTools → Rendering → Emulate CSS media)

### Estimated effort: 60 min for §1-8; ~2-3 hours to generate the patch (144 lines across 20 files).

### D-009 reconciliation likely

Many of the 144 are `transition-colors hover:bg-X` (color change on hover) — these are universally fine and don't need `motion-safe:` wrapping (a 100ms color fade doesn't trigger vestibular issues). The actual wrap count after D-009 verification: probably **30-50 lines** that are layout-shifting (width, height, transform, translate).

## §5 — The 30-second summary for Leader

> "626 motion class instances in 278 files. ZERO are wrapped in `motion-safe:`. The codebase IS reduced-motion-safe via 2 duplicate global CSS handlers. The work is (a) consolidate the 2 duplicate handlers, (b) wrap the ~30-50 layout-shifting motion classes (not the 626 color-fade micro-transitions), (c) document the contract in T-HE-006 §4.5. Estimated 1 hour for the contract doc, 2-3 hours for the patch."

## §6 — Cross-references

- T-HE-006 §4.5 — motion-safe / motion-reduce contract (entry point for the design system)
- `src/index.css:473, :625` — the 2 duplicate global handlers
- `.hera-tmp/motion_audit.cjs` — re-runnable discovery script
- `.hera-tmp/motion_violations.json` — full 626-entry list (file:line, class, snippet)

---

**Tooling preserved:** `.hera-tmp/motion_audit.cjs` (re-runnable for ongoing motion-class audits).

**Status:** Discovery done. Awaiting Leader's T-HE-007 assignment decision.
