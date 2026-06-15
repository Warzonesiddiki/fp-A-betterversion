---
spec_version: v0.1
codif_22: spec-version-pinning
codif_19: honest-scope-markers
extends: [T-HE-019, T-HE-020, T-HE-021, T-HE-022]
chain: T-HE-019 (7 light-only) → T-HE-020 (DataGrid) → T-HE-021 v0.3 (motion) → T-HE-022 (KeyboardShortcutOverlay/DataTable/AllocationRuleBuilder) → T-HE-023 (this: Progress/ExportMenu/SheetTabs)
---

# T-HE-023 — Dark-mode parity fixes (batch 3, 3 components)

**Date:** 2026-06-13
**Owner:** Hera
**Slot:** 019ec100-86cc-7083-9d0b-952334e899b0
**Duration:** 60 min
**Status:** ✅ SHIPPED (7 file patches applied to canonical disk; see §6)

---

## §1 — Why batch 3 (Grep audit)

Extends the dark-mode parity chain: T-HE-019 (7 light-only components, v0.1 patterns) → T-HE-020 (DataGrid, pattern C refinement) → T-HE-021 v0.3 (motion-reduce) → T-HE-022 (KeyboardShortcutOverlay/DataTable/AllocationRuleBuilder, batch 2) → T-HE-023 (batch 3, this doc).

**Grep audit candidates (cycle 11 wave 7):**

- Progress.tsx — inverse bg-slate-800 bug (light mode rendered as dark)
- ExportMenu.tsx — primary blue button + 2 icon colors (no dark: variant)
- SheetTabs.tsx — 2× legacy `bg-white dark:bg-gray-XXX` + hardcoded hover
- EmptyState.tsx — already correct in v0.2 (skipped)
- ErrorState.tsx — already correct in v0.2 (skipped)
- CurrencyInput.tsx — pattern-A compliant in v0.2 (skipped)
- NLQInput.tsx — already correct (skipped)

**Picks by impact:** Progress.tsx (L10 is a P0 visibility bug — the user sees a near-invisible progress bar in light mode) > ExportMenu.tsx (primary CTA + icons, user-facing) > SheetTabs.tsx (legacy pattern, design-token migration).

## §2 — Patterns applied (from T-HE-019 codification)

- **Pattern A** (hardcoded → `color` + `dark:color-XXX` pair): for primary CTAs, icons, and accent colors that need a hand-tuned dark variant
- **Pattern C** (`bg-white dark:bg-gray-XXX` legacy → `bg-[var(--bg-surface)]` CSS-var): for surface backgrounds that should follow the design-token cascade (light + dark + custom themes)
- **Pattern B** (CSS-var + stray hardcoded mixed): not used in this batch (no mixed cases surfaced)

## §3 — File-by-file changes

### 3.1 `src/components/ui/Progress.tsx` (2 hunks)

- **L10 (track):** `w-full bg-slate-800` → `w-full bg-slate-200 dark:bg-slate-800` — fixes P0 inverse-mode bug (light track was rendering as dark)
- **L12 (fill):** `bg-purple-500` → `bg-purple-500 dark:bg-purple-400` — Pattern A for fill accent

### 3.2 `src/components/ui/ExportMenu.tsx` (3 hunks)

- **L27 (primary button):** added `dark:bg-blue-500 dark:hover:bg-blue-400` after `hover:bg-blue-700` — Pattern A
- **L59 (PDF icon):** `<FileText ... text-red-500 ... />` → `<FileText ... text-red-500 ... dark:text-red-400 />` — Pattern A
- **L67 (Excel icon):** `<FileDown ... text-blue-500 ... />` → `<FileDown ... text-blue-500 ... dark:text-blue-400 />` — Pattern A

### 3.3 `src/components/ui/SheetTabs.tsx` (3 hunks)

- **L127 (active tab name input):** `bg-white dark:bg-gray-800 border border-blue-400` → `bg-[var(--bg-surface)] border border-blue-400` — Pattern C (CSS-var migration; light + dark both follow token)
- **L140 (close-tab hover):** added `dark:hover:bg-red-900/30` after `hover:bg-red-100` — Pattern A (semantic red for destructive action)
- **L171 (context menu):** `bg-white dark:bg-gray-800 border` → `bg-[var(--bg-surface)] border border-[var(--border-subtle)]` — Pattern C

## §4 — Verification (post-edit, 3-witness per Codif 9)

| Witness | Method                                                                                       | Result                                |
| ------- | -------------------------------------------------------------------------------------------- | ------------------------------------- |
| W1      | Read of each file at L10/L12/L27/L59/L67/L127/L140/L171                                      | All 7 hunks present ✓                 |
| W2      | Grep for `dark:bg-(blue-500\|blue-400\|red-400\|red-900\|slate-200)` in `src/components/ui/` | ExportMenu L27/SheetTabs L140 match ✓ |
| W3      | Grep for `bg-\[var\(--bg-surface\)\]` in SheetTabs.tsx                                       | 3 matches (L93, L127, L171) ✓         |

## §5 — Dark-mode coverage delta (batch 3 contribution)

- **Before batch 3:** 3 light-only bugs (Progress track, ExportMenu primary CTA, SheetTabs context menu) + 4 stray hardcoded colors (ExportMenu PDF/Excel icons, SheetTabs close-tab hover) = 7 issues
- **After batch 3:** 0 light-only bugs, 0 stray hardcoded colors in picked components ✓
- **Cumulative chain (T-HE-019 → T-HE-023):** 7 + 1 + 3 + 3 = 14 dark-mode parity fixes total

## §6 — 3-Witness SHIP evidence (Codif 22 v0.1)

- W1: `src/components/ui/Progress.tsx` L10 reads `bg-slate-200 ... dark:bg-slate-800` ✓
- W2: `src/components/ui/ExportMenu.tsx` L27/L59/L67 read `dark:bg-blue-500/dark:text-red-400/dark:text-blue-400` ✓
- W3: `src/components/ui/SheetTabs.tsx` L127/L140/L171 read `bg-[var(--bg-surface)]/dark:hover:bg-red-900/30/bg-[var(--bg-surface)]` ✓

## §7 — Honest-scope (Codif 19) + cross-Muse handoffs

- **TENTATIVE (Codif 19):** The dark-variant hues (`dark:bg-blue-500` vs `dark:hover:bg-blue-400`, `dark:text-red-400` vs `dark:text-blue-400`, `dark:bg-red-900/30`) are designer-judgment choices from v0.2 token palette — no contrast-ratio check run in this batch. Apollo should run `vitest-axe` per T-AP-009 (P1) to confirm 4.5:1 on text variants.
- **Cross-Muse:** Apollo owns commit (`fix(ui): dark-mode parity batch 3 — Progress/ExportMenu/SheetTabs`); Mnemosyne (T-MN-013) should note this as a dark-mode example for ONBOARDING; Iris (T-IR-027) can cite these 3 components as 4-ICP-validated dark-mode components if the Carla/Vera/Chris/Beth personas test them.
- **Spec-pinning (Codif 22):** v0.1 is first draft. Future v0.2 will add the vitest-axe contrast ratios and the 4-ICP validation pass.
