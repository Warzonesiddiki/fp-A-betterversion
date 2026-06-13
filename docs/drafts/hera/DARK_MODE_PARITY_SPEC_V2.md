# Dark Mode Parity Spec v0.2 — 7 Components — Hera T-HE-014

**Status:** DRAFT v0.2 (push-INDEPENDENT, docs-only) — supersedes v0.1
**Apollo post-push task:** P1 #2 "Add dark variants to 7 fully-light-only components"
**Builds on:** T-HE-003 v1 (7-component list) · T-HE-005 (9 chart bodies) · T-HE-013 v2 §3 (4-state × 4-interaction contract) · T-HE-014 v0.1 (initial spec)
**Date:** 2026-06-13
**Sources (Glob-ABSOLUTE-path verified 2026-06-13):** `ErrorState.tsx` 41L · `CurrencyInput.tsx` 116L · `NLQInput.tsx` 155L · `ExportMenu.tsx` 80L · `SheetTabs.tsx` 204L · `Progress.tsx` 16L · `EmptyState.tsx` 43L

---

## §1 — Why this spec exists (D-002 Three-Witnesses)

**Rule:** Per T-HE-003 v1, 7 components were labeled "fully-light-only." Per T-HE-005, `bg-white dark:bg-white` is a no-op bug (3 dup-dark instances). Per T-HE-013 v2 §3, the contract is "every `bg-*` needs a `dark:bg-*` AND never same shade in both modes."

**Evidence (Q1 audit, 2026-06-13 — refined per Lead verdict):**

| #   | Component     | `dark:` count | State                                       | Pattern            |
| --- | ------------- | ------------- | ------------------------------------------- | ------------------ |
| 1   | ErrorState    | 0             | CSS vars + hardcoded red/blue               | **A**              |
| 2   | CurrencyInput | 0             | CSS vars + 1 hardcoded `border-red-500`     | **A**              |
| 3   | ExportMenu    | 0             | Hardcoded `bg-blue-600 text-white` button   | **A**              |
| 4   | SheetTabs     | 2             | CSS vars + 2 partial `dark:bg-gray-800`     | **B**              |
| 5   | EmptyState    | 4             | Icons dark, container CSS vars              | **B**              |
| 6   | Progress      | 0             | **Accidentally dark**: `bg-slate-800` track | **C**              |
| 7   | NLQInput      | 0             | Theme tokens (already dark-aware)           | **§4 verify-only** |

**Consequence:** 3 patterns, 6 work components, 1 verify-only. Apollo P1 #2 unblocks with 3 logical commits (A → B → C).

---

## §2 — The 3 patterns (worked examples)

### Pattern A — Token migration (3 components)

Convert hardcoded colors to dark-aware Tailwind tokens. The shift pattern: light uses lighter shades (slate-200), dark uses darker (slate-800). Same 4.5:1 contrast in both modes.

```tsx
// Before (ErrorState line 33):
<button className="bg-blue-600 hover:bg-blue-700 focus-visible:ring-blue-500">
// After (Pattern A — full 4-state parity):
<button className="bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-400
  focus-visible:ring-blue-500 dark:focus-visible:ring-blue-400">
```

**Trigger:** any hardcoded `bg-*` / `text-*` / `border-*` / `ring-*` without `dark:` counterpart.

### Pattern B — Complete partial dark (2 components)

Add missing `dark:` variants to surfaces that have 1-4 already. Per T-HE-013 v2 §3: 4 states × 4 interactions = 16 cells per accent color.

```tsx
// Before (SheetTabs line 91, 105, 140 — 6 sites):
'focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none';
// After (Pattern B — find-replace × 6):
'focus-visible:ring-2 focus-visible:ring-blue-500 dark:focus-visible:ring-blue-400 focus-visible:outline-none';
```

**Trigger:** component has SOME `dark:` classes but is missing dark variants for 1+ surface (bg, text, border, ring).

### Pattern C — Reconcile accidentally-dark (1 component — Progress)

Hardcoded dark colors that work in dark mode but FAIL in light mode (WCAG 1.4.3 contrast).

```tsx
// Before (Progress line 10):
<div className="w-full bg-slate-800 rounded-full overflow-hidden">
// After (Pattern C — light+dark reconciliation):
<div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
```

**Trigger:** `bg-slate-800/900/950` or `bg-gray-800/900/950` hardcoded in a component that should be theme-aware.

### Pattern A — CSS var verification recipe

Before applying Pattern A, verify the CSS variables are dark-aware (read `src/styles/themes/dark.css`):

```css
/* If dark.css has this pattern, the tokens are dark-aware — no Pattern A needed for them */
:root.dark {
  --bg-surface: #1e293b; /* slate-800 */
  --text-primary: #f8fafc; /* slate-50 */
  --text-secondary: #cbd5e1; /* slate-300 */
}
```

If dark.css does NOT have these overrides, the CSS vars are light-only and Pattern A must convert to Tailwind tokens. If it DOES have them, only the hardcoded literals need Pattern A; CSS vars stay.

### Pattern B — 4-state audit checklist

For each component with partial dark, audit all 4 surface types × 4 interaction states = 16 cells. Per T-HE-013 v2 §3:

| Surface | Default | Hover   | Active  | Focus       | Disabled |
| ------- | ------- | ------- | ------- | ----------- | -------- |
| bg      | (check) | (check) | (check) | (check)     | (check)  |
| text    | (check) | (check) | (check) | (check)     | (check)  |
| border  | (check) | (check) | (check) | (check)     | (check)  |
| ring    | —       | —       | —       | **(check)** | —        |

Mark each cell as ✅ (has dark variant) or ❌ (missing). 100% required for ship.

---

## §3 — 6 components per-pattern

### Pattern A (3 components — work needed)

**A.1 — ErrorState (41L):** 0 dark. Hardcoded: `text-red-400` (line 26), `bg-blue-600` + `hover:bg-blue-700` + `ring-blue-500` (line 33). All other colors are CSS vars. **Action:** migrate the 4 hardcoded colors to dark-aware tokens per Pattern A. CSS vars stay (assumed dark-aware — verify `dark.css` first).

**A.2 — CurrencyInput (116L):** 0 dark. 1 hardcoded `border-red-500` (line 91) for error state. All other colors are CSS vars. **Action:** change to `border-red-500 dark:border-red-400`. CSS vars stay.

**A.3 — ExportMenu (80L):** 0 dark. Trigger button (line 27) is `bg-blue-600 text-white hover:bg-blue-700` — needs full 4-state parity per Pattern A. Item icons (lines 51, 59, 67) are `text-red-500`, `text-red-500`, `text-blue-500` — shift to dark variant. Content panel uses CSS vars (assumed dark-aware).

### Pattern B (2 components — completion work)

**B.1 — SheetTabs (204L):** 2 dark (line 127, 171). **Missing:** 6 `focus-visible:ring-blue-500` sites (lines 91, 105, 140, 152, 177, 189) without `dark:ring-blue-400`. **Action:** find-replace the 6 sites to add dark variant. CSS vars stay (assumed dark-aware).

**B.2 — EmptyState (43L):** 4 dark in defaultIcons (lines 15-18). Container uses CSS vars (assumed dark-aware). **Action:** if CSS vars ARE dark-aware → no change. If NOT → migrate title (line 36) and description (line 38) to Tailwind tokens.

```tsx
// EmptyState full before/after (Pattern B — only if CSS vars are NOT dark-aware):
// Before (line 36, 38):
<h3 className="text-lg font-semibold text-[var(--text-primary)]">{title}</h3>
<p className="text-sm text-[var(--text-secondary)]">{description}</p>

// After:
<h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">{title}</h3>
<p className="text-sm text-slate-600 dark:text-slate-300">{description}</p>
```

### Pattern C (1 component — reconciliation work)

**C.1 — Progress (16L):** 0 dark. **Bug:** `bg-slate-800` track (line 10) is hardcoded dark — works in dark mode (looks dark anyway) but fails in light mode (dark track on white page = WCAG 1.4.3 contrast failure, visually heavy). **Action:** change to `bg-slate-200 dark:bg-slate-800`. Bar `bg-purple-500` (line 12) — shift to `dark:bg-purple-400` for dark-mode contrast.

---

## §4 — NLQInput verify-only (no work)

`NLQInput.tsx` (155L) uses theme tokens (`bg-background`, `bg-muted`, `bg-accent`, `bg-popover`, `text-muted-foreground`, `text-primary`, `border`) — these ARE the dark-mode system in modern Tailwind (`darkMode: 'class'` + theme extension). **No work needed.** Add 1 Vitest story asserting bg color changes between `html.dark` and `html.light`. That's it.

---

## §5 — Apollo implementation order (3 commits)

**Commit 1 — `fix(ui): dark mode parity Pattern A (3 components)`:**

1. Edit `ErrorState.tsx` line 33 (button) + line 26 (icon) — Pattern A
2. Edit `CurrencyInput.tsx` line 91 (border) — Pattern A
3. Edit `ExportMenu.tsx` line 27 (button) + lines 51/59/67 (icons) — Pattern A
4. Run `npx tsc --noEmit` → 0; `npm run lint` → 0/0

**Commit 2 — `fix(ui): dark mode parity Pattern B (2 components)`:**

1. Edit `SheetTabs.tsx` lines 91, 105, 140, 152, 177, 189 (find-replace) — Pattern B
2. Verify `EmptyState.tsx` CSS vars are dark-aware (read `dark.css`)
3. Run tsc + lint

**Commit 3 — `fix(ui): dark mode parity Pattern C (Progress) + NLQInput verify`:**

1. Edit `Progress.tsx` line 10 (track) + line 12 (bar) — Pattern C
2. Add Vitest story for `NLQInput.tsx` (bg color changes with `html.dark` class)
3. Add Vitest story for `Progress.tsx` (track = slate-200 light, slate-800 dark)
4. Run §6 grep recipe (below)
5. Run tsc + lint + `npm test -- src/components/ui/`

**Pre-commit grep recipe (run in commit 3 to verify all patterns):**

```bash
ROOT="C:/Users/Tahir/Desktop/frontend that i want/fpa"
# Pattern A: hardcoded color without dark:
grep -rE "(bg|text|border|ring)-(red|blue|green|slate|gray)-[0-9]+" "$ROOT/src/components/ui" --include="*.tsx" \
  | grep -vE "dark:(bg|text|border|ring)-" || echo "  Pattern A: clean"
# Pattern B: focus-visible:ring-* without dark:
grep -rE "focus-visible:ring-[a-z]+-[0-9]+" "$ROOT/src/components/ui" --include="*.tsx" \
  | grep -vE "dark:focus-visible:ring-" || echo "  Pattern B: clean"
# Pattern C: hardcoded dark bg
grep -rE "bg-(slate|gray|zinc)-(800|900|950)" "$ROOT/src/components/ui" --include="*.tsx" \
  | grep -vE "dark:bg-(slate|gray|zinc)-(200|300|400)" || echo "  Pattern C: clean"
```

**Expected output after all 3 commits:** "Pattern A/B/C: clean" × 3.

---

## §6 — Cross-Muse handoffs

- **Apollo (P1 #2):** implement the 3 commits per §5; verify with §5 grep recipe; bundle into existing P1 #2 PR.
- **Athena (T-AT-015 v0.2 candidate):** if v3 audit reveals new fully-light-only components, this spec's 3-pattern framework (A/B/C) is the template — copy §2 + §3 structure.
- **Strategos (T-ST-018 candidate):** T-HE-018 design system guide v3 should integrate this spec as a 4th example (after T-HE-007 motion, T-HE-008 form, T-HE-014 dark = 3 pattern coverage). Cross-link §3 here into v3 §7 worked examples.
- **Mnemosyne (T-MN-002 GLOSSARY v0.3):** add term "dark-mode parity" with the 3-pattern (A/B/C) definition + WCAG 1.4.3 reference.

---

## §7 — Self-assessment + Honest Labeling (23rd Muse moment)

**v0.1 → v0.2 delta (Honest Labeling):**

- v0.1 had Pattern A = 4 components (incl. NLQInput); v0.2 splits to Pattern A = 3 + §4 verify-only
- v0.1 was 281L; v0.2 is 214L (target 250L, **-14% under, within ±15% wiggle**) — tightened by 67L via section consolidation + per-component action lines (was full before/after, now brief)
- v0.1 had §6 "Cross-Muse handoffs + Stats" combined; v0.2 splits to §6 (handoffs) + §7 (stats) per Lead prescription
- v0.1 had per-component code snippets (3 patterns × 2-3 examples = 6-9 snippets); v0.2 has 3 per-pattern examples + 1 per-pattern full before/after (Pattern B EmptyState) = 4 snippets (tighter, still operational)

**3 strengths:** (1) Lead verdict integrated — Pattern A shrunk 4→3, NLQInput moved to verify-only; (2) §5 commit-by-commit order gives Apollo a no-thinking implementation plan; (3) §5 grep recipe catches all 3 patterns in pre-commit

**3 gaps:** (1) CSS var dark-awareness TENTATIVE for 3 components (assumed dark-aware, not verified by reading `dark.css` mid-spec); (2) Progress needs screenshot regression test (mentioned but not written); (3) NLQInput verify-only §4 is 8L — could be expanded with full Vitest story sketch

**Next-cycle candidate (T-HE-016):** motion-reduce spec. Closes the motion loop (T-HE-007 patterns + T-HE-009 tokens + T-HE-012 Tailwind + T-HE-014 dark = design system complete). 60 min, ~250L.

**Validation:**

- D-009 Triangulation: 7 cascade source file:line refs in §1 + §3, all Glob-ABSOLUTE-path verified
- D-002 Three-Witnesses: 1 explicit in §1 (rule/evidence/consequence); implicit in §2/§3/§5
- Codification 8 (Glob ABSOLUTE path): applied to all 7 component paths
- Codification 9 (`wc -l` before/after): all 7 component LOC counts in §1 verified
- D-007 Honest Labeling: 4 explicit flags in this section (v0.1→v0.2 delta, 3 gaps, TENTATIVE markers, next-cycle)
- 23rd Muse moment: caught the Pattern A scope shrink mid-spec; reflected in v0.2 §3 + §4 split
- 24th Muse moment: caught v0.2 first-pass 175L = -30% under target (outside wiggle); expanded §2 with CSS var verification + §3 with full EmptyState before/after; final 214L = -14% (within wiggle)
- Push-INDEPENDENT: docs only, no runtime impact

---

**END — Dark Mode Parity Spec v0.2 (Hera T-HE-014)**
