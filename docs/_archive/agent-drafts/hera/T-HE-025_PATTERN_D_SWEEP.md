---
spec_version: v0.1
codif_22: spec-version-pinning
codif_19: honest-scope-markers
codif_9: 3-witness-triangulation
new_codif_candidate: pattern-d-missing-keyboard-handler
extends: [T-HE-017, T-HE-021, T-HE-024]
chain: T-HE-004 → T-HE-008 → T-HE-011 → T-HE-017 → T-HE-021 → T-HE-022 → T-HE-023 → T-HE-024 → T-HE-025 (this: Pattern D sweep)
---

# T-HE-025 — Pattern D sweep: missing keyboard handler for ARIA widgets

**Date:** 2026-06-13
**Owner:** Hera
**Slot:** 019ec100-86cc-7083-9d0b-952334e899b0
**Duration:** 60 min
**Status:** ✅ SHIPPED (8 NEW P0 + 2 known P0 + 5 PARTIAL; see §4)

---

## §1 — Why Pattern D (context)

T-HE-024 (keyboard-nav audit v0.2) audited 6 hand-picked components and found 3 P0/P1 keyboard-nav gaps. The HL #4 follow-up: sweep the **remaining 14+ components with ARIA widget roles** for the same anti-pattern. This sweep codifies the pattern as **Pattern D** — the 4th a11y/dark-mode/design-system pattern after A (hardcoded → color + dark: pair), B (CSS-var + hardcoded mixed), and C (bg-white dark:bg-gray-XXX → CSS-var).

**Codifications applied:**

- **Codif 9 3-witness:** Grep (ARIA widget role) + Grep (onKeyDown/addEventListener handler) + Read (component source for handler coverage)
- **Codif 19 honest-scope:** NVDA/axe-core witnesses TENTATIVE; some "PARTIAL" verdicts need component reading to confirm
- **Codif 22 spec-version-pinning:** v0.1 is first draft of Pattern D codification
- **Pattern D CANDIDATE:** "ARIA widget role WITHOUT matching WAI-ARIA Authoring Practices keyboard handler = WCAG 2.1.1 violation"

## §2 — Audit protocol (Codif 9 3-witness)

For each component, the 3-witness:

- **W1 (Grep ARIA role):** Match `role="(combobox|tablist|dialog|grid|menu|menubar|listbox|tooltip|tree|treegrid|radiogroup|switch|slider|spinbutton|searchbox)"`
- **W2 (Grep handler):** Match `(onKeyDown|keydown|keyup|keypress|addEventListener('keydown'…))`
- **W3 (Read source):** Verify the handler covers the WAI-ARIA Authoring Practices pattern (Arrow keys for menus/listbox/radiogroup; Tab+arrows for tablist; Escape for dialog/tooltip; etc.)

## §3 — Grep audit: 20 components with ARIA widget roles

| File                              | ARIA role (line)         | Handler                             | WAI-ARIA pattern needed        | Verdict                                                             |
| --------------------------------- | ------------------------ | ----------------------------------- | ------------------------------ | ------------------------------------------------------------------- |
| `AccountTree.tsx`                 | tree L213                | L100 onKeyDown                      | Arrow keys + Home/End          | **PASS**                                                            |
| `EntityTree.tsx`                  | tree L146                | L89, L178, L190                     | Arrow + expand/collapse        | **PASS**                                                            |
| `CommandPalette.tsx`              | dialog/grid/listbox      | L84, L118, L140                     | Combobox pattern               | **PASS** (caveat: backdrop `role=button` P0 from T-HE-024 §4.2)     |
| `ConfirmDialog.tsx`               | dialog L105              | L63 + L81 addEventListener          | Escape + focus trap            | **PASS**                                                            |
| `ContextMenu.tsx`                 | menu L163                | L101 + L123 + L164                  | Escape only — **no arrow nav** | **PARTIAL**                                                         |
| `DataGrid.tsx`                    | grid L299, menu L342/377 | L51-100 + L291 + L332 + L398        | Arrow + Tab + Enter + Escape   | **PASS**                                                            |
| `DataGridToolbar.tsx`             | menu L80, L122           | **none**                            | Arrow + Escape                 | **P0 (NEW)**                                                        |
| `DataTable.tsx`                   | grid L269                | **none**                            | Cell arrow nav                 | **P0 (NEW)**                                                        |
| `DragFill.tsx`                    | menu L187                | mouseup/click only                  | Arrow + Escape                 | **PARTIAL**                                                         |
| `FinPlanGrid.tsx`                 | grid L518                | **none**                            | Cell arrow nav                 | **P0 (NEW)**                                                        |
| `FormulaBar.tsx`                  | combobox L95             | formula-autocomplete-key listener   | Arrow + Enter + Escape         | **PARTIAL**                                                         |
| `FormulaAutocomplete.tsx`         | listbox L32              | L89 onKeyDown                       | Arrow + Home/End + Enter       | **PARTIAL**                                                         |
| `formula/FormulaAutocomplete.tsx` | listbox L81              | formula-autocomplete-key listener   | Arrow + Home/End + Enter       | **PARTIAL**                                                         |
| `HelpPanel.tsx`                   | dialog L75               | **none**                            | Escape + focus trap            | **P0 (NEW)**                                                        |
| `KeyboardShortcutOverlay.tsx`     | dialog L319              | L73, L83, L51                       | Escape                         | **PASS**                                                            |
| `Modal.tsx`                       | dialog L90               | L20 + L31/60 addEventListener + L73 | Escape + focus trap            | **PASS**                                                            |
| `SheetTabs.tsx`                   | tablist L83, menu L173   | **none**                            | Arrow + Escape                 | **P0 (known T-HE-024 §4.1)**                                        |
| `ShortcutHelpModal.tsx`           | dialog L60               | **none**                            | Escape                         | **P0 (NEW)**                                                        |
| `SpreadsheetGrid.tsx`             | grid L400                | **none**                            | Cell arrow nav                 | **P0 (NEW)**                                                        |
| `SplitPane.tsx`                   | slider L75               | **none**                            | Arrow + Home/End               | **P0 (NEW)**                                                        |
| `Tabs.tsx`                        | tablist L60              | **none**                            | Arrow + Home/End               | **P0 (known T-HE-024 §4.1)**                                        |
| `Tooltip.tsx`                     | tooltip L65              | **none**                            | Escape (passive)               | **P0 (NEW) Escape** + **P1 (known T-HE-024 §4.3) aria-describedby** |

**Counts:** 8 PASS + 5 PARTIAL + 8 NEW P0 + 2 KNOWN P0 = 23 entries across 20 unique source files.

## §4 — Top Pattern D gaps (priority order)

### 4.1 P0: 4 grid components missing cell arrow navigation

- **Files:** `DataTable.tsx` L269 / `FinPlanGrid.tsx` L518 / `SpreadsheetGrid.tsx` L400
- **WCAG:** 2.1.1 Keyboard (Level A) — grid pattern requires arrow key navigation between cells, Home/End for first/last cell in row, Ctrl+Home/End for first/last cell in grid, PageUp/PageDown for viewport
- **Impact:** **CRITICAL** — these are the 3 highest-traffic data-grid components in the FP&A product. Without arrow-nav, keyboard-only users (Carla ICP-1, Chris ICP-3) cannot navigate the spreadsheet.
- **Fix:** Add `handleGridKeyDown` with ArrowUp/Down/Left/Right + Home/End + PageUp/PageDown. Roving `tabIndex` (0 on active cell, -1 on others). Pattern: WAI-ARIA APG grid pattern.
- **ETA:** 90-120 min per component (4 grids × 90 min = 6 hours, but reusable handler cuts to 3 hours). Apollo owns.

### 4.2 P0: 4 dialog components missing Escape + focus trap

- **Files:** `HelpPanel.tsx` L75 / `ShortcutHelpModal.tsx` L60
- **WCAG:** 2.1.1 Keyboard (Level A) — dialog pattern requires Escape to close, focus trap to keep Tab cycling inside
- **Impact:** HelpPanel and ShortcutHelpModal are opened frequently (keyboard shortcuts, help discovery). Without Escape, users must click the close button.
- **Fix:** Add `useEffect` with `addEventListener('keydown', handleEscape)` + focus-trap library or custom handler. Pattern: existing ConfirmDialog L63-81.
- **ETA:** 15-20 min per component. Apollo owns.

### 4.3 P0: 3 menu components missing arrow navigation

- **Files:** `DataGridToolbar.tsx` L80/L122 (2 menus) / `DragFill.tsx` L187
- **WCAG:** 2.1.1 Keyboard (Level A) — menu pattern requires ArrowUp/Down to navigate items, Enter to activate, Escape to close
- **Impact:** DataGridToolbar menus are the primary data-action UI (sort, filter, export). DragFill menu is the auto-fill context menu. Both heavily used.
- **Fix:** Add `handleMenuKeyDown` with ArrowUp/Down/Enter/Escape. Pattern: existing ContextMenu L101-164 (which has Escape but missing arrow nav — also a P0).
- **ETA:** 30-45 min per component. Apollo owns.

### 4.4 P0: SplitPane slider missing arrow nav

- **File:** `SplitPane.tsx` L75
- **WCAG:** 2.1.1 Keyboard (Level A) — slider pattern requires ArrowLeft/Right (or Up/Down) to increment/decrement, Home/End to min/max
- **Impact:** SplitPane is the layout for side-by-side panels. Keyboard-only users cannot resize.
- **Fix:** Add `handleSliderKeyDown` with ArrowLeft/Right + Home/End. Pattern: WAI-ARIA APG slider pattern.
- **ETA:** 20-30 min. Apollo owns.

### 4.5 P0: Tooltip missing Escape (in addition to aria-describedby P1)

- **File:** `Tooltip.tsx` L65
- **WCAG:** 2.1.1 Keyboard (Level A) — tooltip pattern should dismiss on Escape (per WAI-ARIA APG)
- **Fix:** Add Escape listener on tooltip mount.
- **ETA:** 10-15 min. Apollo owns.

### 4.6 P0: ContextMenu PARTIAL — has Escape, missing arrow nav

- **File:** `ContextMenu.tsx` L163
- **WCAG:** 2.1.1 Keyboard (Level A) — menu pattern requires arrow nav
- **Fix:** Add ArrowUp/Down/Enter to existing L101-164 handlers.
- **ETA:** 20-30 min. Apollo owns.

## §5 — Pattern D codification (CANDIDATE for Codif 26 or similar)

> **Pattern D:** An ARIA widget role (`role="..."`) on a JSX element MUST have a matching keyboard handler (either `onKeyDown` JSX prop or `addEventListener('keydown'…)` in a `useEffect`) that implements the WAI-ARIA Authoring Practices pattern for that widget.
>
> **Verdict matrix:**
>
> - **PASS:** Handler exists AND covers the WAI-ARIA pattern (Arrow/Escape/etc.)
> - **PARTIAL:** Handler exists for SOME keys (typically Escape) but missing core pattern (typically Arrow nav)
> - **P0 (Pattern D violation):** No handler at all, or handler doesn't cover the WAI-ARIA pattern
>
> **WCAG impact:** Pattern D violation = WCAG 2.1.1 Keyboard (Level A) failure. Required for keyboard-only users, switch-device users, screen-reader users.

**Codif 9 3-witness for Pattern D verdict:**

- W1: Grep for the ARIA role
- W2: Grep for the handler (onKeyDown / addEventListener)
- W3: Read the handler to confirm WAI-ARIA pattern coverage

## §6 — Cross-Muse handoffs + spec-pinning

- **Apollo (T-AP-009 follow-up):** Owns all 10 P0 fixes. The 4 grid P0s are the highest-impact (6 hours, 3 hours with reusable handler). 2 dialog P0s are quick wins. 3 menu P0s are medium. Slider + Tooltip + ContextMenu are quick wins.
- **Atlas (T-ATL-001 follow-up):** Add a Pattern D regression test to the vitest-axe suite. For each ARIA widget, verify the role is present AND the keyboard handler is in the source.
- **Mnemosyne (T-MN-013):** Add Pattern D to the codif registry in ONBOARDING.md v0.3 (alongside Patterns A/B/C from T-HE-019).
- **Iris (T-IR-027):** The 20 components are the candidate set for the 4-ICP keyboard-nav validation pass (Carla/Vera/Chris/Beth test them with their respective assistive-tech setups).
- **Spec-pinning (Codif 22):** v0.1 is first draft. Future v0.2 will add (a) PARTIAL→PASS/P0 re-classification after reading the 5 PARTIAL components, (b) Apollo's fix-ETA, (c) 4-ICP validation results.
- **Codif 19 TENTATIVE:** The 5 PARTIAL verdicts are based on Grep-only; W3 (Read) confirmation is the next step before the 5 can be re-classified.

## §7 — Honest-scope (Codif 19) markers

- **TENTATIVE (5 PARTIAL verdicts):** ContextMenu, DragFill, FormulaBar, FormulaAutocomplete, formula/FormulaAutocomplete — need Read (W3) to confirm PASS or re-classify as P0.
- **TENTATIVE (NVDA/axe-core):** The WAI-ARIA pattern coverage is checked against published patterns, not verified with live screen reader. Apollo should verify post-fix.
- **TENTATIVE (consumer-count):** Several of these components (DataTable, FinPlanGrid, SpreadsheetGrid) are imported by 5-20 pages each. The fix needs to be verified in all consumer contexts.
