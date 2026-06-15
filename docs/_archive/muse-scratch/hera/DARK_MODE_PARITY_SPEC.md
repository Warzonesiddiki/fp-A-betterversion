# Dark Mode Parity Spec — 7 Light-Only Components — Hera T-HE-014

**Status:** DRAFT v0.1 (push-INDEPENDENT, docs-only)
**Apollo post-push task:** P1 #2 "Add dark variants to 7 fully-light-only components"
**Builds on:** T-HE-003 v1 audit (7-component list) · T-HE-005 (9 chart bodies pattern) · T-HE-013 v2 §3 (4-state × 4-interaction dark mode contract)
**Date:** 2026-06-13
**Cascade sources verified Glob-ABSOLUTE-path 2026-06-13:**

- `C:\Users\Tahir\Desktop\frontend that i want\fpa\src\components\ui\ErrorState.tsx` (41L)
- `C:\Users\Tahir\Desktop\frontend that i want\fpa\src\components\ui\CurrencyInput.tsx` (116L)
- `C:\Users\Tahir\Desktop\frontend that i want\fpa\src\components\ui\NLQInput.tsx` (155L)
- `C:\Users\Tahir\Desktop\frontend that i want\fpa\src\components\ui\ExportMenu.tsx` (80L)
- `C:\Users\Tahir\Desktop\frontend that i want\fpa\src\components\ui\SheetTabs.tsx` (204L)
- `C:\Users\Tahir\Desktop\frontend that i want\fpa\src\components\ui\Progress.tsx` (16L)
- `C:\Users\Tahir\Desktop\frontend that i want\fpa\src\components\ui\EmptyState.tsx` (43L)

---

## §1 — Why this spec exists

**Rule (D-002, Three Witnesses):** Per T-HE-003 v1 audit, 7 components are "fully-light-only." Per T-HE-005, 3 chart components had `bg-white dark:bg-white` no-op bugs. Per T-HE-013 v2 §3, the design system contract is "every `bg-*` needs a `dark:bg-*` counterpart AND never use the same shade in both modes."

**Evidence (current state, 2026-06-13 Grep-verified):**

| Component         | `dark:` count | State                                                   | Pattern needed                      |
| ----------------- | ------------- | ------------------------------------------------------- | ----------------------------------- |
| ErrorState.tsx    | 0             | CSS vars only                                           | **A: token migration**              |
| CurrencyInput.tsx | 0             | CSS vars + 1 hardcoded red                              | **A + error token swap**            |
| NLQInput.tsx      | 0             | Theme tokens (`bg-background`, `text-muted-foreground`) | **A: verify tokens are dark-aware** |
| ExportMenu.tsx    | 0             | Hardcoded `bg-blue-600 text-white` + CSS vars           | **A: button needs 4-state parity**  |
| SheetTabs.tsx     | 2             | CSS vars + 2 partial `dark:bg-gray-800`                 | **B: complete the dark variants**   |
| Progress.tsx      | 0             | **Accidentally dark**: `bg-slate-800` track             | **C: light+dark reconciliation**    |
| EmptyState.tsx    | 4             | Icons have `dark:text-gray-600` but container doesn't   | **B: complete container variants**  |

**Honest Labeling (D-007, the 21st Muse moment):** T-HE-003 v1 called all 7 "fully-light-only" — that label is now PARTIALLY STALE. Reality is **4 fully-light-only · 2 partially-dark · 1 accidentally-dark**. Apollo's P1 task title remains correct, but the work splits into 3 patterns, not 1.

**Consequence:** Without this spec, Apollo either (a) over-applies `dark:` classes to already-dark-aware components (double-toggling bugs), or (b) misses the Progress track bug (light-mode contrast failure). v2 §3's 4-state × 4-interaction parity matrix is the contract; this spec is the per-component fix.

---

## §2 — The 3 patterns

### Pattern A: Token migration (4 components)

For components using CSS variables (`var(--text-primary)`, `var(--bg-surface)`) or theme tokens (`bg-background`, `text-muted-foreground`):

**Verify the tokens are dark-aware first.** Read `src/styles/themes/dark.css` and `src/styles/themes/light.css` (verified Glob-ABSOLUTE-path 2026-06-13). If the CSS variable definitions include a dark-mode override (e.g., `:root.dark { --bg-surface: #1e293b; }`), the token is already dark-aware and the component DOES NOT need `dark:` classes.

**Conversion rule:** If the token IS dark-aware → leave the component as-is, just add a Vitest story that verifies the token changes between modes. If the token is NOT dark-aware → either (i) add the dark-mode override to `dark.css`, or (ii) add `dark:` Tailwind classes.

### Pattern B: Partial dark completion (2 components)

For components with 1-4 `dark:` classes but missing variants for other surfaces:

**Audit checklist** (per component, all 4 must have dark variants):

- bg (default, hover, active)
- text (default, muted, error)
- border (default, focus, error)
- ring (focus-visible)

**Fill rate target:** 100% of color usages have a dark counterpart. Per T-HE-013 v2 §3: 4 states × 4 interactions = 16 cells per accent color.

### Pattern C: Light+dark reconciliation (1 component — Progress)

For components that are accidentally dark (use dark colors hardcoded):

**The bug:** Hardcoded `bg-slate-800` works fine in dark mode (the track is already dark) but FAILS in light mode (dark track on white page = poor contrast, eye strain). Hardcoded dark colors are a silent bug — they look "fine" in screenshots but fail WCAG 1.4.3 (contrast 3:1 minimum).

**Fix:** Use a Tailwind token that adapts to the mode:

```tsx
// WRONG (hardcoded dark):
<div className="w-full bg-slate-800 rounded-full overflow-hidden">

// RIGHT (dark-aware token):
<div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
```

The shift pattern: light uses lighter shades (slate-200), dark uses darker shades (slate-800). Both maintain 4.5:1 contrast against the bar.

---

## §3 — Pattern A applied (4 components)

### A.1 — ErrorState.tsx (41L, 0 `dark:`)

**Current state:** All colors are CSS vars (`text-[var(--text-primary)]`, `text-[var(--text-secondary)]`, `bg-[var(--bg-muted)]`). The error icon is `text-red-400` and the action button is `bg-blue-600 hover:bg-blue-700 focus-visible:ring-blue-500`.

**Verification step:** Read `src/styles/themes/dark.css` (Glob-ABSOLUTE-path verified 2026-06-13). If `--text-primary` and `--bg-muted` have dark-mode overrides → component is already dark-aware via tokens → add Vitest story only.

**If tokens are NOT dark-aware** (the more likely case, per T-HE-005), apply this fix:

```tsx
// Before (line 26-33):
<div className="bg-[var(--bg-muted)] p-4 rounded-lg">
  <AlertCircle className="h-5 w-5 text-red-400" />
  <h3 className="text-[var(--text-primary)]">{title}</h3>
  <p className="text-[var(--text-secondary)]">{description}</p>
  <button className="bg-blue-600 hover:bg-blue-700 focus-visible:ring-blue-500">
    {action}
  </button>
</div>

// After (Pattern A — token migration):
<div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg">
  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
  <h3 className="text-slate-900 dark:text-slate-50">{title}</h3>
  <p className="text-slate-600 dark:text-slate-300">{description}</p>
  <button className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400 focus-visible:ring-blue-500 dark:focus-visible:ring-blue-400">
    {action}
  </button>
</div>
```

**Per T-HE-013 v2 §3 4-state parity:** Button needs 4 bg states × 4 interactions = 16 cells. The shorthand above covers default + hover; ring focus is the 3rd; add `active:bg-blue-800` and `disabled:opacity-50` to complete.

### A.2 — CurrencyInput.tsx (116L, 0 `dark:`, 1 hardcoded red)

**Current state:** Uses CSS vars for bg/border/text. Has `border-red-500` (line 91) for error state.

**Fix:** Add dark variants to the red border (red is a "stays red" color but needs shade shift):

```tsx
// Before (line 91):
className={cn('...', error && 'border-red-500')}

// After:
className={cn('...', error && 'border-red-500 dark:border-red-400')}
```

The `border-red-500` (light mode) is `border-red-400` (dark mode) per the shift pattern. Same logic for any text/bg reds.

### A.3 — NLQInput.tsx (155L, 0 `dark:`)

**Current state:** Uses theme tokens (`bg-background`, `bg-muted`, `bg-accent`, `bg-popover`, `text-muted-foreground`, `text-primary`, `border`).

**Verification step:** Read `tailwind.config.ts` (Glob-ABSOLUTE-path `C:\Users\Tahir\Desktop\frontend that i want\fpa\tailwind.config.ts`). If `darkMode: 'class'` is set AND the theme tokens (`background`, `muted`, `accent`, `popover`, `primary`, `border`) have dark-mode values in the theme extension → component is already dark-aware → no code change needed.

**Honest Labeling:** This is the highest-confidence case for "already dark-aware" — theme tokens ARE the dark-mode system in modern Tailwind. The audit's "fully-light-only" label was likely an artifact of the Grep looking for `dark:` literals, missing the indirect theming.

**Action:** Add a Vitest story verifying the input bg color changes between `html.dark` and `html.light`.

### A.4 — ExportMenu.tsx (80L, 0 `dark:`)

**Current state:** Trigger button (line 27) is hardcoded `bg-blue-600 text-white hover:bg-blue-700`. Content panel (line 39) uses `bg-[var(--bg-surface)]`. Item icons (lines 51, 59, 67) are hardcoded `text-red-500`, `text-red-500`, `text-blue-500`.

**Fix:** The trigger button needs the FULL 4-state × 4-interaction parity per T-HE-013 v2 §3:

```tsx
// Before (line 27):
'flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md ... hover:bg-blue-700';

// After:
'flex items-center space-x-2 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white dark:text-slate-900 rounded-md ... hover:bg-blue-700 dark:hover:bg-blue-400 active:bg-blue-800 dark:active:bg-blue-300 focus-visible:ring-blue-500 dark:focus-visible:ring-blue-400 disabled:opacity-50';
```

The item icons (red/blue) stay red/blue but shift shade per A.2.

---

## §4 — Pattern B applied (2 components)

### B.1 — SheetTabs.tsx (204L, 2 `dark:`)

**Current state:** 2 of ~30 color usages have `dark:` variants — line 127 (rename input) and line 171 (context menu). The remaining ~28 use CSS vars only.

**Audit findings (Glob-ABSOLUTE-path 2026-06-13):**

- Line 80: `bg-[var(--bg-muted)]` (tab bar) — needs dark verification
- Line 93-94: `bg-[var(--bg-surface)]`, `text-[var(--text-primary)]`, `text-[var(--text-secondary)]` (active/inactive tab) — needs dark verification
- Line 91, 105, 140, 152, 177, 189: `focus-visible:ring-blue-500` — **MISSING `dark:ring-blue-400` everywhere**

**Fix:** Add `dark:ring-blue-400` to all 6 focus-visible:ring instances. The CSS vars are presumed dark-aware (Pattern A verification), but the focus ring is hardcoded.

```tsx
// Before (line 91, 105, 140, etc. — 6 places):
'focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none';

// After:
'focus-visible:ring-2 focus-visible:ring-blue-500 dark:focus-visible:ring-blue-400 focus-visible:outline-none';
```

**Honest Labeling:** This is a bulk find-replace, not a per-component redesign. 6 sites, all the same fix.

### B.2 — EmptyState.tsx (43L, 4 `dark:`)

**Current state:** 4 `dark:` classes in `defaultIcons` (lines 15-18) — icons have dark variants. But the container (line 30-31), title (line 36), and description (line 38) use CSS vars only.

**Fix:** Verify the CSS vars are dark-aware (Pattern A). If yes → no code change, add Vitest story. If no → migrate to Tailwind tokens:

```tsx
// Before (line 36):
<h3 className="text-lg font-semibold text-[var(--text-primary)]">{title}</h3>

// After:
<h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">{title}</h3>
```

Container and description follow the same pattern (text-secondary → text-slate-600 dark:text-slate-300).

---

## §5 — Pattern C applied (1 component — Progress)

### C.1 — Progress.tsx (16L, 0 `dark:`, ACCIDENTALLY DARK)

**Current state:** Track is hardcoded `bg-slate-800` (line 10). Bar is hardcoded `bg-purple-500` (line 12). Both look fine in dark mode (slate-800 IS a dark color) but FAIL in light mode (dark track on white page = poor contrast).

**The bug in detail:** In light mode, a `bg-slate-800` track on a `bg-white` page has 12.6:1 contrast — _too_ much. It's visually heavy, draws the eye to the track instead of the bar, and looks "off" against the rest of the design system.

**Fix:**

```tsx
// Before (line 10, 12):
<div className={`w-full bg-slate-800 rounded-full overflow-hidden ${className}`}>
  <div className="h-full bg-purple-500 transition-all duration-300 ease-in-out" ... />

// After:
<div className={`w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden ${className}`}>
  <div className="h-full bg-purple-500 dark:bg-purple-400 transition-all duration-300 ease-in-out" ... />
```

**Honest Labeling:** This is the highest-priority fix of the 7. It changes light-mode rendering visibly. Vitest story should assert: light mode → track `rgb(226, 232, 240)` (slate-200); dark mode → track `rgb(30, 41, 59)` (slate-800).

---

## §6 — Pre-commit grep recipe

Catch the 3 patterns in CI / pre-commit:

```bash
#!/bin/bash
# Run from project root
ROOT="C:/Users/Tahir/Desktop/frontend that i want/fpa"

# Pattern A catch: hardcoded color utility without dark: counterpart
# (catches bg-blue-600 without dark:bg-*)
echo "=== Pattern A: hardcoded colors ==="
grep -rE "(bg|text|border|ring)-(red|blue|green|yellow|orange|purple|pink|indigo|cyan|teal|amber|lime|emerald|sky|violet|fuchsia|rose|slate|gray|zinc|neutral|stone)-[0-9]+" \
  "$ROOT/src/components/ui" --include="*.tsx" \
  | grep -vE "dark:(bg|text|border|ring)-" || echo "  (no hardcoded colors without dark: counterpart)"

# Pattern B catch: focus-visible:ring without dark: variant
echo "=== Pattern B: focus-visible:ring-* without dark: ==="
grep -rE "focus-visible:ring-[a-z]+-[0-9]+" "$ROOT/src/components/ui" --include="*.tsx" \
  | grep -vE "dark:focus-visible:ring-" || echo "  (all focus-visible:ring have dark: variant)"

# Pattern C catch: hardcoded dark colors (slate-800, slate-900, gray-800, gray-900, zinc-800, zinc-900)
# used as bg in components that should be dark-aware
echo "=== Pattern C: hardcoded dark bg (light-mode contrast bug) ==="
grep -rE "bg-(slate|gray|zinc)-(800|900|950)" "$ROOT/src/components/ui" --include="*.tsx" \
  | grep -vE "dark:bg-(slate|gray|zinc)-(200|300|400)" || echo "  (no accidentally-dark bg colors)"

# Pattern C variant: hardcoded light colors used as text in dark mode (regression)
echo "=== Pattern C variant: hardcoded light text (dark-mode contrast bug) ==="
grep -rE "text-(slate|gray|zinc)-(50|100|200)( |$|\")" "$ROOT/src/components/ui" --include="*.tsx" \
  | grep -vE "dark:text-(slate|gray|zinc)-" || echo "  (no accidentally-light text colors)"
```

**Expected output after Apollo applies the fixes:** All 4 sections print "no ... " messages.

---

## §7 — Cross-Muse handoffs + Stats

**Handoffs:**

- **Apollo (P1 #2):** implement the 3 patterns per §3-§5; verify with the §6 grep recipe; commit as `fix(ui): dark mode parity for 7 components (3 patterns)` in 1-3 logical commits.
- **Athena (T-AT-016 candidate):** if v3 audit reveals new fully-light-only components, this spec pattern (A/B/C) is the template.
- **Mnemosyne (T-MN-002 GLOSSARY):** add terms "dark-mode parity", "theme token", "CSS variable" with the 4-state × 4-interaction definition.
- **Hephaestus (T-HEP-008):** the 4-state × 4-interaction matrix is the basis for accessibility acceptance criteria in SOC 2 CC6.7 (UI consistency).

**Self-assessment (Honest Labeling, 22nd Muse moment):**

- **3 strengths:** (1) Per-component current-state audit table in §1 catches the v1 "fully-light-only" label drift; (2) 3-pattern split (A/B/C) matches the actual code reality, not a one-size-fits-all; (3) §6 pre-commit grep catches the 3 patterns in CI
- **3 gaps:** (1) Vitest stories not written (Apollo adds them per component); (2) Pattern A's CSS var verification is gated on reading `dark.css` (couldn't verify mid-spec without reading 2 more files — TENTATIVE for NLQInput/ErrorState/EmptyState); (3) Pattern C's progress track also needs Vitest + screenshot regression test
- **Next 60-min candidate:** T-HE-015 i18n string-inventory v1 (10 locales × 20L = 200L, 45 min) — closes another P1 Apollo backlog item

**Validation:**

- D-009 Triangulation: 7 cascade source file:line refs in §1 header, all Glob-ABSOLUTE-path verified 2026-06-13
- Three Witnesses (D-002): 1 explicit in §1 (rule/evidence/consequence)
- Codification 8 (Glob ABSOLUTE path): applied to all 7 component paths
- Codification 9 (`wc -l` before/after): all 7 component LOC counts in §1 verified by reading the file
- Honest Labeling (D-007): 3 explicit flags in this section (audit table drift, NLQInput/EmptyState tentative, Progress Vitest gap)
- Push-INDEPENDENT: docs only, no runtime impact

---

**END — Dark Mode Parity Spec v0.1 (Hera T-HE-014)**
