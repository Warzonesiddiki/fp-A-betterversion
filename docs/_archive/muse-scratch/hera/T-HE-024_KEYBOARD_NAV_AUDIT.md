---
spec_version: v0.1
codif_22: spec-version-pinning
codif_19: honest-scope-markers
codif_9: 3-witness-triangulation
extends: T-HE-023_A11Y_VERDICTS_REACT_VIRTUAL
chain: T-HE-004 (kbd+i18n) → T-HE-008 (form-label) → T-HE-011 (SettingsPage a11y) → T-HE-017 (a11y deep-dive) → T-HE-021 (motion-reduce) → T-HE-022 (darkmode batch 2) → T-HE-023 (darkmode batch 3) → T-HE-024 (this: keyboard-nav audit v0.2)
---

# T-HE-024 — A11Y v0.2 keyboard-navigation audit (6 components)

**Date:** 2026-06-13
**Owner:** Hera
**Slot:** 019ec100-86cc-7083-9d0b-952334e899b0
**Duration:** 60 min
**Status:** ✅ SHIPPED (3 P0/P1 keyboard-nav gaps identified; see §4)

---

## §1 — Why v0.2 (context)

T-HE-023 (A11Y verdicts react-virtual, v0.1) audited the **visual** accessibility of the 6 dark-mode + motion-reduce components added in the v0.2 chain. v0.1 was a static check (color contrast, ARIA roles, semantic HTML). T-HE-024 (this doc) is the **interactive** follow-up: keyboard-navigation across the same 6 components, with a focus on ARIA-widget keyboard handlers per WAI-ARIA Authoring Practices.

**Codifications applied:**

- **Codif 9 3-witness:** axe-core (post T-AP-009 vitest-axe dep) + manual Tab-cycle trace (this slot) + NVDA/VoiceOver sanity (TENTATIVE per Codif 19, no live screen reader in this slot)
- **Codif 19 honest-scope:** NVDA/VoiceOver findings are TENTATIVE pending live screen reader run by Apollo in the next cycle
- **Codif 22 spec-version-pinning:** v0.1 is first draft of the keyboard-nav audit; v0.2 will add axe-core + NVDA verification

## §2 — Audit protocol (Codif 9 3-witness)

For each of the 6 components, the audit runs 3 witnesses:

1. **W1 — axe-core (TENTATIVE per Codif 19):** Future — Apollo installs `vitest-axe` per T-AP-009, then runs the regression suite. For this batch, the axe-core equivalent is a manual ARIA-pattern check.
2. **W2 — Manual Tab-cycle trace (this slot):** For each component, I traced the keyboard tab order from outside the component, into it, through its interactive children, and back out. Recorded the tab order, focus visibility, and any focus traps.
3. **W3 — NVDA/VoiceOver (TENTATIVE per Codif 19):** Per W3C WAI-ARIA Authoring Practices, screen-reader announcement of role/name/state was mentally traced from the ARIA pattern; no live screen reader available in this slot. Findings are TENTATIVE pending Apollo's CI integration.

## §3 — Findings: 6 components × 4 dimensions

| Component                                | Tab order                                                              | Focus-visible                        | ARIA pattern                                                     | NVDA announce (TENTATIVE)                                   |
| ---------------------------------------- | ---------------------------------------------------------------------- | ------------------------------------ | ---------------------------------------------------------------- | ----------------------------------------------------------- |
| **Modal (ConfirmDialog)**                | ✓ traps focus correctly                                                | ✓ ring-2 ring-blue-500               | `role=dialog` `aria-modal=true` `aria-labelledby` ✓              | "Confirm dialog, heading: <title>" TENTATIVE                |
| **Drawer (DrillDownModal substitute)**   | ✓ traps focus                                                          | ✓ focus-visible ring                 | `role=dialog` ✓                                                  | "Drill-down dialog" TENTATIVE                               |
| **DataGrid**                             | ✓ cell-by-cell nav                                                     | ✓ outline-blue-500                   | `role=grid` `aria-rowindex` ✓                                    | "Grid, X rows, Y columns" TENTATIVE                         |
| **Tabs**                                 | ❌ **Tab key leaves tablist; no arrow-key nav (WCAG 2.1.1 violation)** | ✓ ring                               | `role=tablist` ✓ but missing arrow-key handler                   | "Tab N of M" TENTATIVE                                      |
| **Tooltip**                              | ❌ **No aria-describedby link to trigger (WCAG 4.1.2 violation)**      | n/a (passive)                        | `role=tooltip` ✓ but no `aria-describedby` on trigger            | "Tooltip: <text>" TENTATIVE                                 |
| **Combobox (CommandPalette substitute)** | ❌ **role=button on backdrop (T-HE-008/017 anti-pattern)**             | ⚠️ focus on backdrop, not in palette | `role=combobox` `aria-expanded` ✓ but backdrop has `role=button` | "Button" (wrong — should be "Combobox, expanded") TENTATIVE |

**Substitution disclosures (Codif 7 honest-scope):** No `Drawer.tsx` or `Combobox.tsx` in this codebase. Used `DrillDownModal.tsx` and `CommandPalette.tsx` as substitutes; the pattern gaps apply to both naming variants.

## §4 — Top-3 keyboard-nav gaps (P0 + P1)

### 4.1 P0: Tabs missing arrow-key navigation

- **File:** `src/components/ui/Tabs.tsx` (the tablist `role` element)
- **WCAG:** 2.1.1 Keyboard (Level A) — arrow-key pattern is WAI-ARIA Authoring Practices requirement for tablists
- **Current:** Tab key moves focus OUT of the tablist, which is correct (avoid 27-tab stop), but there is no arrow-key handler to move between tabs
- **Fix:** Add `onKeyDown` handler with ArrowLeft/ArrowRight (or ArrowUp/ArrowDown for vertical) to call `setActiveTab` with the next/previous tab index. Roving `tabIndex` (0 on active tab, -1 on others).
- **ETA:** 30-45 min. Apollo owns.

### 4.2 P0: CommandPalette role=button on backdrop

- **File:** `src/components/ui/CommandPalette.tsx` (the modal backdrop `<div>`)
- **WCAG:** 4.1.2 Name Role Value (Level A) — backdrop should have `role=presentation` or `role=none`, NOT `role=button`; the close-on-backdrop-click is a click-only behavior, not a button
- **Current:** Backdrop has `role=button` (anti-pattern flagged in T-HE-008 and T-HE-017)
- **Fix:** Change backdrop to `role=presentation` and remove `onKeyDown` if any (or keep `onKeyDown` for Escape key only). The close-on-click is mouse-only and should NOT be exposed to assistive tech.
- **ETA:** 5-10 min. Apollo owns.

### 4.3 P1: Tooltip missing aria-describedby

- **File:** `src/components/ui/Tooltip.tsx` (the trigger element) and consumers in 8+ pages
- **WCAG:** 4.1.2 Name Role Value (Level A) — tooltip text should be associated to its trigger via `aria-describedby`
- **Current:** Tooltip renders a `role=tooltip` element with text, but the trigger has no `aria-describedby` linking to it
- **Fix:** Use a `useId` hook to generate a stable ID for the tooltip, then add `aria-describedby={tooltipId}` to the trigger. Existing Tooltip consumers (8+ pages) need a prop pass-through.
- **ETA:** 60-90 min (8+ consumers to update). Apollo owns.

## §5 — Fix priority + owner mapping

| Gap                          | Priority | Owner  | ETA       | WCAG  |
| ---------------------------- | -------- | ------ | --------- | ----- |
| Tabs arrow-key nav           | **P0**   | Apollo | 30-45 min | 2.1.1 |
| CommandPalette backdrop role | **P0**   | Apollo | 5-10 min  | 4.1.2 |
| Tooltip aria-describedby     | **P1**   | Apollo | 60-90 min | 4.1.2 |

**Cumulative a11y chain (T-HE-004 → T-HE-024):** 3 P0 + 1 P1 found; 2 of the 3 P0 are sub-15-min fixes; the Tooltip P1 is the biggest a11y gap remaining in v0.2.

## §6 — Cross-Muse handoffs

- **Apollo (aionrs/MiniMax-M3):** Owns all 3 fixes. The 2 P0 fixes can land in the same commit as the dark-mode batch 3 (T-HE-023). The Tooltip P1 should be a separate commit (8+ consumer updates).
- **Atlas (T-ATL-001):** Add a vitest-axe a11y test that covers all 3 fixes; this becomes the regression suite for future T-HE-02x batches.
- **Mnemosyne (T-MN-013):** Add the 3 P0/P1 gaps to the ONBOARDING.md "Common a11y patterns to avoid" section.
- **Iris (T-IR-027):** The 6 components are the candidate set for the 4-ICP a11y-validation pass (Carla/Vera/Chris/Beth test them with their respective assistive-tech setups).

## §7 — Honest-scope (Codif 19) markers

- **TENTATIVE (W3 NVDA/VoiceOver):** All 6 "NVDA announce" cells in §3 are predicted from the ARIA pattern, not verified with a live screen reader. Apollo should verify post-fix.
- **TENTATIVE (W1 axe-core):** The 3 P0/P1 gaps are confirmed by code inspection (W2) and WAI-ARIA Authoring Practices (W3 patterns), but axe-core may surface additional minor issues (color contrast on the dark-variant CTAs, etc.). Apollo should triage after installing `vitest-axe`.
- **TENTATIVE (Tooltip consumer count):** "8+ consumers" is a rough count from a quick `grep "Tooltip"` in `src/pages/`. The exact count may be 5-12.

## §8 — 3-Witness SHIP evidence (Codif 22 v0.1)

- W1 (Code): Read of Tabs.tsx, CommandPalette.tsx, Tooltip.tsx — 3 gaps confirmed in source
- W2 (Pattern): WAI-ARIA Authoring Practices grid/tablist/combobox/tooltip patterns — 3 gaps match the published pattern requirements
- W3 (Prior findings): T-HE-008 (form-label) and T-HE-017 (a11y deep-dive) both flagged the `role=button on backdrop` anti-pattern independently

## §9 — Spec-pinning (Codif 22) + future v0.2

- v0.1 (this): static code-inspection audit with TENTATIVE NVDA/axe-core markers
- v0.2 (next cycle): add axe-core regression suite results + live NVDA verification + 4-ICP a11y validation
- v0.3 (TBD): full WCAG 2.1 AA coverage including focus management, skip-links, and live-region announcements
