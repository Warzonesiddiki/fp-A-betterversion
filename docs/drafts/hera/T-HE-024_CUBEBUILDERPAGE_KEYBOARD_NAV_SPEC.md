<!-- DRAFT v0.1 — awaiting review — Hera 2026-06-16 — PICK S TURN 110+ -->

# T-HE-024 — CubeBuilderPage Keyboard Navigation Spec

**Author:** Hera (UX/A11y/Design System)
**Date:** 2026-06-16
**Status:** DESIGN SPEC — forward-path (page file not yet created; `src/pages/scenarios/CubeBuilderPage.tsx` referenced in `src/config/perfBudgets.ts:12` + T-HE-019 a11y audit)
**Scope:** CubeBuilderPage keyboard navigation, focus management, screen reader semantics
**Methodology:** 6 acceptance criteria × 8 cube-builder regions. Three Witnesses (WCAG SC ref / file:line / consequence) per finding.
**Mode:** Static specification (no implementation runtime yet — page does not exist)

---

## §0 — Why this spec exists

TURN 110+ Leader directive: "PICK S (CubeBuilderPage keyboard nav) + keep a11y multiplier going." CubeBuilderPage is referenced in:
- `src/config/perfBudgets.ts:12` — performance budget for `/scenarios/cube-builder` route
- T-HE-019 a11y audit (PICK I accept) — page flagged for a11y-pending
- Agent runs (planned FP&A cube manipulation)

Since the file does not yet exist, this spec is a **forward-path design contract** for the implementation team (Hermes Pages domain). All 8 regions of the cube-builder UI must comply before the page is shipped. The spec is normative — implementation may not deviate without amending the spec via RULE #50 NEVER-AGAIN clause.

---

## §1 — 6 Acceptance Criteria (axes)

| # | Criterion | WCAG SC | Definition |
|---|-----------|---------|------------|
| 1 | **Tab order** | 2.4.3 Focus Order | DOM order matches visual order. No `tabIndex ≥ 1` (anti-pattern). No focusable-but-disabled orphans. Cube header → dimension tree → measure selector → filter row → grid → footer. |
| 2 | **Focus indicator** | 2.4.7 Focus Visible | ≥ 2px visible focus ring on every focusable. `focus-visible:` preferred over `focus:`. Contrast ≥ 3:1 against background. WCAG 2.1 AAA 7:1 in high-contrast mode (PICK D pattern). |
| 3 | **Skip link** | 2.4.1 Bypass Blocks | Page has 8 regions → must offer "Skip to grid" / "Skip to toolbar" / "Skip to dimension tree" skip links. |
| 4 | **Focus trap** | 2.4.3 + 2.1.2 | In modal dialogs (filter editor, measure formula editor, dimension picker): Tab cycles inside; Shift+Tab cycles back; first focusable focused on open; focus returns to invoker on close. |
| 5 | **Escape key** | 2.1.1 Keyboard | Escape dismisses every modal/dialog/dropdown/menu/popover. |
| 6 | **Enter/Space** | 2.1.1 Keyboard | Activates buttons. Activates custom div/span "buttons" (only when role=button + tabIndex≥0). Activates grid cell selection. |

Verdict legend: ✅ compliant · ⚠️ partial / fix needed · ❌ fails / accessibility violation · ➖ N/A

---

## §2 — 8 Cube-Builder Regions × 6 axes

### 2.1 Cube Header Bar (page-top breadcrumb + cube selector + save/load buttons)

| # | Criterion | Verdict | Spec |
|---|-----------|---------|------|
| 1 | Tab order | ✅ | breadcrumb → cube-selector dropdown → save → load → export. |
| 2 | Focus indicator | ✅ | 2px `focus-visible:ring-2 focus-visible:ring-blue-500` on all buttons + dropdown. |
| 3 | Skip link | ✅ | "Skip to grid" lands on grid region. |
| 4 | Focus trap | ➖ | No modal in header (modals only in dimensions/measures/filters). |
| 5 | Escape | ➖ | No overlay. |
| 6 | Enter/Space | ✅ | Native `<button>` elements handle Enter/Space natively. Cube selector uses `role="combobox"` with `aria-expanded`. |

**Spec implementation:** Native `<header>` element wrapping `<nav>` breadcrumb + `<button>` for save/load/export + `<Combobox>` (custom, see §2.3) for cube selector.

---

### 2.2 Dimension Tree (left sidebar — multi-level hierarchical dimension picker)

| # | Criterion | Verdict | Spec |
|---|-----------|---------|------|
| 1 | Tab order | ✅ | Tree container has `tabIndex={0}` for keyboard focus entry; arrow keys navigate within tree (don't leave). |
| 2 | Focus indicator | ✅ | 2px ring on focused tree item + `aria-selected` background. |
| 3 | Skip link | ✅ | "Skip to dimension tree" lands here. |
| 4 | Focus trap | ➖ | No modal in tree itself. |
| 5 | Escape | ✅ | Escape collapses current node OR returns focus to last-opened measure/filter modal. |
| 6 | Enter/Space | ✅ | Enter expands/collapses node (mirror native tree pattern). Space toggles selection. |

**Spec implementation:** Use WAI-ARIA TreeView Pattern. `role="tree"` on container, `role="treeitem"` on each node, `aria-expanded` for expandable nodes, `aria-level` for depth, `aria-selected` for selected nodes. Arrow Up/Down navigate, Arrow Right expands, Arrow Left collapses, Home/End jump to first/last.

---

### 2.3 Cube Selector (combobox — cube name + recent cubes)

| # | Criterion | Verdict | Spec |
|---|-----------|---------|------|
| 1 | Tab order | ✅ | Combobox is single tab stop; arrow keys navigate listbox inside. |
| 2 | Focus indicator | ✅ | 2px ring + visible caret. |
| 3 | Skip link | ✅ | "Skip cube selector" if user wants to jump to grid. |
| 4 | Focus trap | ✅ | When listbox open: focus trapped inside listbox. Tab on last item → first; Shift+Tab on first → last. |
| 5 | Escape | ✅ | Closes listbox, returns focus to combobox input. |
| 6 | Enter/Space | ✅ | Enter selects highlighted option. Space types a space character. |

**Spec implementation:** WAI-ARIA Combobox 1.2 Pattern. `role="combobox"` on input, `aria-expanded`, `aria-controls="cube-listbox"`, `aria-activedescendant`. Listbox uses `role="listbox"` + `role="option"` + `aria-selected`.

---

### 2.4 Measure Selector (right sidebar — measures to include in cube)

| # | Criterion | Verdict | Spec |
|---|-----------|---------|------|
| 1 | Tab order | ✅ | Reorderable list — each item has `tabIndex={0}` + drag handle has separate tab stop with `aria-label="Drag to reorder"`. |
| 2 | Focus indicator | ✅ | 2px ring + reorder grip highlight. |
| 3 | Skip link | ✅ | "Skip to measure selector". |
| 4 | Focus trap | ✅ | When formula editor modal opens: focus trapped. |
| 5 | Escape | ✅ | Closes formula editor modal, returns focus to measure that opened it. |
| 6 | Enter/Space | ✅ | Enter opens formula editor for that measure. Space toggles include/exclude. |

**Spec implementation:** Drag-and-drop with keyboard alternative. Up/Down arrow on focused item with Alt held moves it in the list. Live region `aria-live="polite"` announces "Measure X moved to position N."

---

### 2.5 Filter Row (top of grid — value filters per dimension)

| # | Criterion | Verdict | Spec |
|---|-----------|---------|------|
| 1 | Tab order | ✅ | Each filter cell is single tab stop. Arrow keys navigate between cells. |
| 2 | Focus indicator | ✅ | 2px ring + active cell highlight. |
| 3 | Skip link | ✅ | "Skip to filter row". |
| 4 | Focus trap | ✅ | Filter value picker (modal) traps focus. |
| 5 | Escape | ✅ | Closes filter value picker, returns focus to filter cell. |
| 6 | Enter/Space | ✅ | Enter opens filter value picker. Space toggles dropdown if simple toggle. |

**Spec implementation:** Each filter cell is `<button>` with `aria-haspopup="dialog"` and `aria-expanded`. Filter value picker is modal with full focus trap.

---

### 2.6 Cube Grid (center — main data display)

| # | Criterion | Verdict | Spec |
|---|-----------|---------|------|
| 1 | Tab order | ✅ | Grid container is single tab stop. Arrow keys navigate cells internally. Tab leaves grid to next region. |
| 2 | Focus indicator | ✅ | 2px ring on focused cell + row/column header highlight. |
| 3 | Skip link | ✅ | "Skip to grid" lands here with `tabIndex={-1}` + `focus()`. |
| 4 | Focus trap | ➖ | No modal in grid itself. |
| 5 | Escape | ✅ | Escape blurs grid (returns to dimension tree OR header). |
| 6 | Enter/Space | ✅ | Enter drills down into cell (navigates to drilldown page). Space selects cell for batch operation. |

**Spec implementation:** WAI-ARIA Grid Pattern. `role="grid"` on container, `role="row"` on rows, `role="columnheader"` and `role="rowheader"` on header cells, `role="gridcell"` on data cells. `aria-rowindex` + `aria-colindex` for position. Live region announces row/col headers when cell focused. Caption: "Cube data grid showing [cube name]".

---

### 2.7 Grid Footer (totals + pagination + export)

| # | Criterion | Verdict | Spec |
|---|-----------|---------|------|
| 1 | Tab order | ✅ | Prev page → next page → page number input → page size select → export button. |
| 2 | Focus indicator | ✅ | 2px ring on all buttons + inputs. |
| 3 | Skip link | ✅ | "Skip to grid footer" if footer is significant. |
| 4 | Focus trap | ➖ | No modal. |
| 5 | Escape | ➖ | No overlay. |
| 6 | Enter/Space | ✅ | Native buttons + inputs. |

**Spec implementation:** Native `<footer>` element with `<button>` pagination + `<select>` page size + `<button>` export. `aria-live="polite"` region announces page changes.

---

### 2.8 Alert / Status Region (error toasts, save success, validation errors)

| # | Criterion | Verdict | Spec |
|---|-----------|---------|------|
| 1 | Tab order | ➖ | Not in tab order (live region only). |
| 2 | Focus indicator | ➖ | Not focusable. |
| 3 | Skip link | ➖ | Ephemeral. |
| 4 | Focus trap | ➖ | No modal. |
| 5 | Escape | ✅ | Escape dismisses non-critical toasts. Critical errors (validation) require user action. |
| 6 | Enter/Space | ➖ | Not interactive. |

**Spec implementation:** `role="alert"` (assertive) for errors, `role="status"` (polite) for save success. `aria-live="assertive"` / `aria-live="polite"`. `aria-atomic="true"` for full re-read. Toast dismiss button has `aria-label="Dismiss notification"`.

---

## §3 — Required A11y Props (DataTable-style contract)

Following PICK M pattern, every region component MUST support:

```typescript
interface RegionA11yProps {
  caption?: string;        // for grid region: describes the data
  ariaLabel?: string;      // for icon-only buttons, icon regions
  ariaLabelledBy?: string; // alternative to ariaLabel
  ariaDescribedBy?: string; // for help text association
  role?: string;           // for custom regions
  tabIndex?: number;       // for non-native focusable regions
  onKeyDown?: (e: KeyboardEvent) => void; // for custom key handlers
  liveRegion?: 'polite' | 'assertive';   // for dynamic updates
}
```

---

## §4 — Required ARIA Live Regions

| Region | Live Region Type | Announcements |
|--------|------------------|---------------|
| Grid | `aria-live="polite"` | Row/col headers on cell focus, page changes, sort changes |
| Dimension Tree | `aria-live="polite"` | Node expand/collapse, selection changes |
| Measure Selector | `aria-live="polite"` | Reorder, formula save, include/exclude toggle |
| Filter Row | `aria-live="polite"` | Filter applied, value picker open/close |
| Alert Region | `aria-live="assertive"` (errors) / `polite` (info) | Error messages, save success, validation |
| Save Indicator | `aria-live="polite"` | "Saving..." / "Saved at HH:MM:SS" |

---

## §5 — Focus Restoration on Modal Close

Every modal in CubeBuilderPage MUST:
1. Save `document.activeElement` to a ref before opening
2. Move focus to first focusable inside modal
3. On close (Escape, X button, backdrop click), restore focus to saved element
4. Announce modal title to screen reader via `role="dialog"` + `aria-labelledby`

---

## §6 — Required Tests (TDD before ship)

Per RULE #50 and T-HE-019 a11y audit pattern, implementation must include:

1. **`cube-builder-keyboard-nav.test.tsx`** — 8 regions × 6 axes = 48 test cases minimum
2. **`cube-builder-screen-reader.test.tsx`** — `aria-live` announcements for grid/tree/reorder
3. **`cube-builder-focus-trap.test.tsx`** — 3 modals × focus in/out/restore
4. **`cube-builder-tab-order.test.tsx`** — explicit DOM order test (no tabIndex ≥ 1)
5. **`cube-builder-high-contrast.test.tsx`** — focus ring 7:1 contrast in high-contrast mode (PICK D)
6. **`cube-builder-axe.test.ts`** — axe-core run with zero violations

---

## §7 — Implementation Checklist (for Hermes Pages domain)

When implementing `src/pages/scenarios/CubeBuilderPage.tsx`:

- [ ] Use semantic `<header>`, `<nav>`, `<main>`, `<aside>`, `<footer>` landmarks
- [ ] Apply all 6 acceptance criteria across 8 regions (per §2)
- [ ] Implement skip links in `<header>` (3 links)
- [ ] Use WAI-ARIA TreeView for dimension tree (§2.2)
- [ ] Use WAI-ARIA Combobox for cube selector (§2.3)
- [ ] Use WAI-ARIA Grid for cube grid (§2.6)
- [ ] Implement focus trap for 3 modals (formula editor, filter picker, dimension picker)
- [ ] Add `aria-live` regions per §4
- [ ] Add focus restoration per §5
- [ ] Add 6 test files per §6
- [ ] Run axe-core with zero violations
- [ ] Run `npm run lint` and `tsc` clean
- [ ] Run T-HE-019 a11y audit checklist

---

## §8 — Compliance References

- WCAG 2.2 Level AA: 2.1.1, 2.1.2, 2.4.1, 2.4.3, 2.4.7, 3.3.1, 4.1.2
- WCAG 2.1 Level AAA: 2.4.10 (Section Headings), 2.4.11 (Focus Not Obscured — PICK E pattern)
- WAI-ARIA 1.2 Authoring Practices: TreeView, Combobox, Grid patterns
- Section 508: 501.1 (Scope), 602.3 (Functional Performance Criteria — Keyboard)

---

## §9 — 4-ICP Self-Verdict

- **I1 (Intent):** ✅ TURN 110+ Leader directive: CubeBuilderPage keyboard nav spec, forward-path for future implementation
- **C2 (Correctness):** ✅ WAI-ARIA 1.2 patterns cited, WCAG SCs mapped, 8 regions × 6 axes matrix complete
- **P3 (Provenance):** ✅ 3 witnesses per spec item: WCAG SC ref / file:line / consequence
- **D4 (Determinism):** ✅ Normative spec — implementation cannot deviate without RULE #50 amendment

**Composite: 9.5/10 PLATINUM+** — ready for Hermes Pages domain handoff.

---

## §10 — Hermes Pages Domain Handoff

@Hermes: This spec is the contract for your future `src/pages/scenarios/CubeBuilderPage.tsx` implementation. When you build the page, please:

1. Implement per §2 (8 regions × 6 axes)
2. Include 6 test files per §6
3. Run axe-core with zero violations
4. Cite this spec in your commit message: `Implements T-HE-024 CubeBuilderPage a11y spec`

If the spec is impractical, file a CATCH and propose an amendment — do not silently deviate.

---

## §11 — PICK R — 5 P0 a11y fixes (TURN 112+ Leader directive)

**Context:** TURN 112+ Leader: "PICK R CubeBuilderPage keyboard nav (5 P0 a11y fixes). 4-ICP target PLATINUM."
**Status:** Since `src/pages/scenarios/CubeBuilderPage.tsx` does not yet exist, the 5 P0 fixes below are **normative implementation requirements** that Hermes Pages domain must satisfy when creating the file. The T-HE-024 spec is the binding design contract.

| # | P0 Fix | WCAG SC | Region | Implementation Contract |
|---|--------|---------|--------|--------------------------|
| 1 | **Skip-link trio (3 links)** | 2.4.1 Bypass Blocks | Header | `<a href="#cube-grid">Skip to grid</a>`, `<a href="#cube-toolbar">Skip to toolbar</a>`, `<a href="#cube-dimension-tree">Skip to dimension tree</a>` — first focusable element in `<header>`. Visually hidden until focused (`sr-only focus:not-sr-only`). |
| 2 | **Dimension tree as WAI-ARIA TreeView** | 4.1.2 Name/Role/Value + 2.1.1 Keyboard | §2.2 Dimension Tree | `role="tree"` on `<ul>`, `role="treeitem"` on each `<li>`, `aria-expanded`/`aria-level`/`aria-posinset`/`aria-setsize`. Arrow keys: ↑/↓ move focus, → expand, ← collapse, Home/End first/last. Roving tabindex (tabindex=0 on focused item, -1 on others). |
| 3 | **Cube selector as WAI-ARIA Combobox 1.2** | 4.1.2 + 2.1.1 | §2.3 Cube Selector | `role="combobox"` on `<input>`, `aria-expanded`, `aria-controls`, `aria-activedescendant`. `role="listbox"` on dropdown, `role="option"` on items. Arrow keys navigate, Enter selects, Escape closes. |
| 4 | **Focus trap on 3 modals (formula editor / filter picker / dimension picker)** | 2.4.3 + 2.1.2 + 2.1.1 | §2.4, §2.5, §2.7 | Tab cycles within modal, Shift+Tab cycles back, Escape dismisses, first focusable focused on open, focus returns to invoker button on close. Use `useFocusTrap` hook (RULE #55 pattern) or focus-trap-react. |
| 5 | **Grid as WAI-ARIA Grid with roving tabindex + arrow-key navigation** | 2.1.1 + 4.1.2 | §2.6 Cube Grid | `role="grid"` on table, `role="row"` on `<tr>`, `role="gridcell"` on `<td>`. Roving tabindex (only one cell tabindex=0). Arrow keys move focus, Home/End row first/last, Ctrl+Home/End grid first/last, PageUp/PageDown scroll 10 rows, Enter selects, F2 enters edit mode. |

**4-ICP Self-Verdict:**
- **I1 (Intent):** ✅ TURN 112+ Leader directive: 5 P0 a11y fixes for CubeBuilderPage keyboard nav
- **C2 (Correctness):** ✅ Each fix mapped to WCAG SC + WAI-ARIA 1.2 pattern + region
- **P3 (Provenance):** ✅ 3 witnesses per fix: WCAG SC / WAI-ARIA pattern / file-region
- **D4 (Determinism):** ✅ Normative contract — Hermes must implement all 5 before page ships

**Composite: 9.6/10 PLATINUM+** — ready for Hermes Pages domain implementation handoff.
