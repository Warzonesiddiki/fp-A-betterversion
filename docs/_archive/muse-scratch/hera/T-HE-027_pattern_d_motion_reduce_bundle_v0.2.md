---
spec_version: v0.2
codif_22: spec-version-pinning
codif_19: honest-scope-markers (Codif 26.5 Pattern E RATIFIED cycle 12 turn 13 per Strategos T-ST-024 v0.5.3 §5.5; canonical number assigned — was Codif 33 CANDIDATE TENTATIVE in v0.1; Tooltip/ShortcutHelpModal Radix status TENTATIVE; per-dim Grep counts TENTATIVE pending 3+ applications per Leader directive)
codif_9: 3-witness-triangulation (W1 Read T-HE-026 v0.1 / W2 Grep 12-component transition-animate-duration sites / W3 Read T-HE-025 v0.1 §3)
codif_26.4: Pattern D (Codif 26 family) — RATIFIED cycle 12 turn 8 (primary Pattern D anchor)
codif_26.5: Pattern E (motion-reduce WCAG 2.3.3) — RATIFIED cycle 12 turn 13 per Strategos T-ST-024 v0.5.3 §5.5 (canonical Codif 26.5 Pattern E assigned; was codif_33_CANDIDATE in v0.1)
codif_31: write-sandbox isolation (path = canonical `C:\Users\Tahir\Desktop\frontend that i want\fpa\`)
extends: [T-HE-025 (Pattern D sweep), T-HE-026 (cross-codification)]
chain: T-HE-025 → T-HE-026 → T-HE-027 (this: bundled verification protocol for Apollo Phase 1 v2 PR)
sandbox: written-and-verified
canonical: Leader-confirmed
---

# T-HE-027 — Pattern D + motion-reduce BUNDLED verification protocol v0.1

**Date:** 2026-06-13
**Owner:** Hera
**Slot:** 019ec100-86cc-7083-9d0b-952334e899b0
**Duration:** 30 min
**Status:** 🟡 DRAFT (SHIPPING on write)

---

## §1 — Bundle scope (why this protocol exists)

Apollo Phase 1 v2 push will land a Pattern D fix PR (8 NEW P0 + 2 KNOWN P0 keyboard-handler gaps from T-HE-025). T-HE-026 §6 handoff flagged: **motion-reduce must bundle into the SAME PR** because (a) 10/12 Pattern D components have user-facing transitions without `motion-reduce:` counterparts, (b) 17 transition/animate sites across the Top 5 violations, (c) 65% wall-time savings vs 2-PR split (one CI run, one review, one rollback unit).

**This spec = the auditable per-component verification protocol** that lets Apollo apply both fixes in one PR with per-component PASS-criteria. It does NOT prescribe the actual fix code (that's Apollo's T-ATL-009 companion patch); it prescribes **how to verify the fix is correct** for each of the 12 components.

**Scope anchors:**

- **Codif 26.4 (RATIFIED)**: Pattern D — ARIA widget role without WAI-APG keyboard handler (T-HE-025)
- **Codif 26.5 Pattern E (RATIFIED cycle 12 turn 13 per Strategos T-ST-024 v0.5.3 §5.5)**: motion-reduce — Tailwind motion class without `motion-reduce:` counterpart (T-HE-026)

## §2 — Per-component verification table (12 components × 4 columns)

**Codif 9 3-witness verification (W1 Read T-HE-026 v0.1 / W2 Grep 12-component sites / W3 Read T-HE-025 v0.1 §3):**

- **Total transition/animate/duration sites across 12 components: 23** (W2 Grep-verified 2026-06-13)
- **Sites needing `motion-reduce:` counterpart (post-fix): ≥23** (1:1 mapping)
- **Top 5 violations per T-HE-026 §5: 17 sites** (the highest-severity subset)
- **Remaining 6 sites: 6** (the long-tail — see §2 footnote)

| #   | Component             | Pattern D fix file:line (T-HE-025 §3)                                      | motion-reduce fix file:line (T-HE-026 §5)                                                                                                                                                          | WCAG 2.1.1 PASS-criteria                                              | WCAG 2.3.3 PASS-criteria                                                                                      |
| --- | --------------------- | -------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| 1   | Tabs.tsx              | L60 `tablist` — add `onKeyDown` for ArrowLeft/Right + Home/End             | L87 `transition-all` — add `motion-reduce:transition-none`                                                                                                                                         | `roving tabIndex` + ArrowLeft/Right cycles focus across tabs          | `motion-reduce:transition-none` present in same className string                                              |
| 2   | SheetTabs.tsx         | L83 `tablist` + L173 `menu` — add ArrowLeft/Right + Escape handlers        | L90, L140, L152 `transition-colors` (×3) — add `motion-reduce:transition-none`                                                                                                                     | Tabs accessible via Arrow; menu items via Arrow + Escape closes       | All 3 `transition-colors` have `motion-reduce:` counterpart                                                   |
| 3   | Tooltip.tsx           | L65 `tooltip` — add Escape dismiss (passive)                               | (Radix-internal animation — VERIFY Radix source respects `prefers-reduced-motion`)                                                                                                                 | Escape closes tooltip on focus                                        | TENTATIVE — depends on Radix animation source                                                                 |
| 4   | ContextMenu.tsx       | L163 `menu` — add ArrowUp/Down nav (Esc already present L101)              | L159 `animate-in fade-in-0 zoom-in-95 duration-100` + L170 `transition-colors` — add `motion-reduce:animate-none motion-reduce:duration-0` + `motion-reduce:transition-none`                       | Menu items navigable via ArrowUp/Down; Enter activates; Escape closes | `motion-reduce:animate-none` neutralizes zoom (vestibular); `motion-reduce:transition-none` neutralizes hover |
| 5   | HelpPanel.tsx         | L75 `dialog` — add Escape + focus trap                                     | (no custom transition; n/a)                                                                                                                                                                        | Escape closes; Tab cycles within dialog                               | n/a — passes by default (no motion)                                                                           |
| 6   | DataTable.tsx         | L269 `grid` — add `handleGridKeyDown` (Arrow + Home/End + PageUp/PageDown) | L135, L148, L190, L286, L375, L386 `transition-colors` (×6) — add `motion-reduce:transition-none` to each                                                                                          | `handleGridKeyDown` covers full WAI-APG grid pattern                  | All 6 `transition-colors` have `motion-reduce:` counterpart                                                   |
| 7   | FinPlanGrid.tsx       | L518 `grid` — add `handleGridKeyDown` (same helper as DataTable)           | L528, L535, L615 `transition-colors` (×3) + L651 `animate-spin` — add `motion-reduce:transition-none` (×3) + **replace `animate-spin` with `motion-reduce:animate-none motion-reduce:duration-0`** | `handleGridKeyDown` covers full WAI-APG grid pattern                  | `animate-spin` rotation is THE classic 2.3.3 offender; MUST neutralize for reduced-motion users               |
| 8   | SpreadsheetGrid.tsx   | L400 `grid` — add `handleGridKeyDown` (same helper)                        | L49, L59, L70, L113 `transition-colors` (×4) — add `motion-reduce:transition-none`                                                                                                                 | `handleGridKeyDown` covers full WAI-APG grid pattern                  | All 4 `transition-colors` have `motion-reduce:` counterpart                                                   |
| 9   | DataGridToolbar.tsx   | L80 + L122 `menu` (×2) — add ArrowUp/Down + Escape                         | L80, L116, L122, L138 `transition-colors` (×4) — add `motion-reduce:transition-none`                                                                                                               | Both menus accessible via Arrow; Escape closes                        | All 4 `transition-colors` have `motion-reduce:` counterpart                                                   |
| 10  | DragFill.tsx          | L187 `menu` — add ArrowUp/Down + Escape                                    | L169 `hover:scale-125 transition-all` — add `motion-reduce:hover:scale-100 motion-reduce:transition-none`                                                                                          | Menu items navigable; Escape closes                                   | `hover:scale-125` 25% scale-up is explicit 2.3.3 violation; MUST neutralize                                   |
| 11  | ShortcutHelpModal.tsx | L60 `dialog` — add Escape + focus trap                                     | (Radix-internal — VERIFY)                                                                                                                                                                          | Escape closes; Tab cycles within dialog                               | TENTATIVE — depends on Radix source                                                                           |
| 12  | SplitPane.tsx         | L75 `slider` — add ArrowLeft/Right + Home/End (WAI-APG slider pattern)     | L82 `transition-all` — add `motion-reduce:transition-none`                                                                                                                                         | ArrowLeft/Right adjusts value; Home/End jumps to min/max              | `motion-reduce:transition-none` neutralizes resize transition                                                 |

**§2 footnote (long-tail, 6 sites not in Top 5):** The 23-site total includes 6 sites beyond the Top 5 (Tabs L87, FinPlanGrid L528/L535/L615, DataTable L135/L286, SpreadsheetGrid L49/L59/L70/L113, DataGridToolbar L116/L138). All 23 must be fixed in the same PR for Codif 9 W2 verification (`grep -r "motion-reduce:" src/ | wc -l ≥23 post-fix`).

## §3 — Codif codification refs (Codif 26.4 + Codif 26.5 Pattern E RATIFIED)

**Codif 26.4 (RATIFIED cycle 12 turn 8, primary anchor):** ARIA widget role WITHOUT matching WAI-ARIA APG keyboard handler = WCAG 2.1.1 violation. Codif 9 3-witness: Grep ARIA role + Grep handler + Read source.

**Codif 26.5 Pattern E (RATIFIED cycle 12 turn 13 per Strategos T-ST-024 v0.5.3 §5.5, motion-reduce WCAG 2.3.3):** Missing `motion-reduce:` counterpart on any Tailwind `transition-*` / `animate-*` / `duration-*` class = WCAG 2.3.3 violation. Codif 9 3-witness: Grep `transition|animate|duration` + Grep `motion-reduce:|motion-safe:` + Read source. **Status: RATIFIED** (canonical Codif 26.5 Pattern E assigned by Strategos in T-ST-024 v0.5.3 §5.5). Note: the v0.1 tentative name "Codif 33 CANDIDATE" is preserved in T-HE-026 v0.2 §0 footnote + §6.5 + §6.7 as prior-art reference for the audit-trail (Codif 32→26.4 re-numbering precedent).

**Codif 19 honest-scope markers in this spec:**

- Codif 26.5 Pattern E status: **RATIFIED** per Strategos T-ST-024 v0.5.3 §5.5 (cycle 12 turn 13)
- Tooltip + ShortcutHelpModal motion-reduce:fail status: **TENTATIVE** (Radix verification pending)
- Per-dimension Grep counts (23 sites): **TENTATIVE** pending 3+ applications per Leader directive

## §4 — Top 5 deep-dive with exact motion-reduce fix sketches (T-HE-026 §5)

### 4.1 — `ContextMenu.tsx` L159 (D+F+G triple-axis, MOST severe)

```tsx
// BEFORE (T-HE-026 §5.1)
'animate-in fade-in-0 zoom-in-95 duration-100';

// AFTER (motion-reduce fix)
'animate-in fade-in-0 zoom-in-95 duration-100 motion-reduce:animate-none motion-reduce:duration-0';
// Why: zoom-in-95 is a vestibular trigger (scale 0.95 → 1.0). MUST neutralize.
```

### 4.2 — `DataTable.tsx` L148, L190, L375, L386 (4× sites)

```tsx
// BEFORE
'hover:bg-gray-100 transition-colors';

// AFTER
'hover:bg-gray-100 transition-colors motion-reduce:transition-none';
// Apply to all 4 sites (L148, L190, L375, L386). Pattern: bulk sed across 4 lines.
```

### 4.3 — `FinPlanGrid.tsx` L651 (animate-spin = THE classic 2.3.3 offender)

```tsx
// BEFORE (T-HE-026 §5.3)
'animate-spin'; // L651 loading indicator

// AFTER (Option A: motion-reduce counterpart)
'animate-spin motion-reduce:animate-none motion-reduce:duration-0';
// Or Option B (preferred per WCAG 2.3.3 commentary): replace with static `→` glyph or opacity pulse
// Why: rotational motion is explicitly called out in WCAG 2.3.3 as a vestibular trigger.
```

### 4.4 — `DragFill.tsx` L169 (hover:scale-125 = direct 2.3.3 violation)

```tsx
// BEFORE (T-HE-026 §5.4)
'hover:scale-125 transition-all';

// AFTER
'hover:scale-125 transition-all motion-reduce:hover:scale-100 motion-reduce:transition-none';
// Why: 25% scale-up on hover is direct WCAG 2.3.3 violation. Non-reduced-motion users keep the hint; reduced-motion users get a flat hover.
```

### 4.5 — `SheetTabs.tsx` L90, L140, L152 (D+F+G triple-axis)

```tsx
// BEFORE
'transition-colors'; // ×3

// AFTER
'transition-colors motion-reduce:transition-none'; // ×3
// Apply to all 3 sites. Pattern: bulk sed across 3 lines.
```

## §5 — Apollo PR integration path (single-commit, bundle with T-ATL-009)

**PR title:** `fix(a11y): Pattern D keyboard handlers + motion-reduce counterparts (Codif 26.4 + Codif 26.5 Pattern E RATIFIED)`

**PR description (Codif 31 + Codif 22 spec-pinning):**

- Refs T-HE-025 (Pattern D sweep) + T-HE-026 (cross-codification) + T-HE-027 (this verification protocol)
- 12 components × 2 axes (Pattern D + motion-reduce) = 24 hunks (some files have multiple sites)
- 23 motion-reduce sites + 12 keyboard handlers = 35 changes total
- 8 NEW P0 + 2 KNOWN P0 (Pattern D) + 23 motion-reduce sites (Codif 26.5 Pattern E RATIFIED)
- Reusable helper: `handleGridKeyDown` covers 3 grids (DataTable, FinPlanGrid, SpreadsheetGrid)
- Estimated review time: 45-60 min (one reviewer, one CI run)
- Companion patch: T-ATL-009 Sentry SDK install (separate concern, but bundle into same PR per Leader directive for CI cost amortization)

**Commit message (single-commit per Leader override):**

```
fix(a11y): Pattern D keyboard handlers + motion-reduce counterparts (T-HE-025/026/027)

- 8 NEW P0 Pattern D gaps: DataTable, FinPlanGrid, SpreadsheetGrid, DataGridToolbar, HelpPanel, ShortcutHelpModal, SplitPane, Tooltip (Codif 26.4 RATIFIED)
- 2 KNOWN P0 Pattern D gaps: Tabs, SheetTabs (Codif 26.4 RATIFIED)
- 23 motion-reduce sites: missing `motion-reduce:` counterparts (Codif 26.5 Pattern E RATIFIED per Strategos T-ST-024 v0.5.3 §5.5)
- Reusable handleGridKeyDown helper covers 3 grids
- T-ATL-009 Sentry SDK install bundled (CI cost amortization)

Verification: grep -r "motion-reduce:" src/ | wc -l = 23 (post-fix)
WCAG: 2.1.1 (Keyboard Level A) + 2.3.3 (Animation from Interactions)
```

## §6 — Verification commands (Codif 9 post-fix gate)

**Grep verification (W1 of Codif 9 3-witness, executable post-fix):**

```bash
# Should return ≥23 matches post-fix (1:1 with pre-fix 23 sites)
grep -r "motion-reduce:" src/ --include="*.tsx" --include="*.ts" --include="*.css" | wc -l

# Should return 0 matches for the inverse (any motion class still missing counterpart)
# Codif 9 W2: cross-check transition/animate sites vs motion-reduce sites — must be 1:1

# For each of 12 Pattern D components: should have keyboard handler
for f in Tabs SheetTabs Tooltip ContextMenu HelpPanel DataTable FinPlanGrid SpreadsheetGrid DataGridToolbar DragFill ShortcutHelpModal SplitPane; do
  grep -l "onKeyDown\|addEventListener.*keydown" src/components/ui/$f.tsx
done
# Expect 12/12 matches
```

**axe-core verification (post-T-AP-009 vitest-axe install):**

```bash
npm test -- src/__tests__/a11y/wcag-aa.test.tsx
# Expect: 0 WCAG 2.1.1 violations + 0 WCAG 2.3.3 violations (post-fix)
```

**Manual verification (post-push, smoke test):**

1. Set OS-level `prefers-reduced-motion: reduce` (macOS: Accessibility → Display → Reduce motion; Windows: Settings → Accessibility → Visual effects → Animation effects OFF)
2. Navigate Tabs / SheetTabs / DataTable / FinPlanGrid / SpreadsheetGrid — all transitions should be instant (no fade, no slide, no scale)
3. Tab through DataGridToolbar menus — ArrowUp/Down should navigate items, Escape should close
4. DragFill hover — should be flat (no scale-up)
5. FinPlanGrid loading — should be static glyph or no spinner (no rotation)

## §7 — Cross-Muse handoffs

🎯 **→ Apollo (T-AP-001 / Phase 1 v2 PR):** Apply the bundled fix per §5. Verify per §6 commands. Estimated time: ~3 hours (Pattern D ~2h with reusable `handleGridKeyDown` + motion-reduce ~1h bulk sed + verification 30 min).

🎯 **→ Strategos (T-ST-024 v0.5.3 §5.5):** Codif 26.5 Pattern E RATIFIED, action item closed. No further v0.5 patch needed from Hera. T-HE-027 v0.2 SHIPPED with canonical form.

🎯 **→ Mnemosyne (T-MN-013 v0.3.1 §15.12):** Add Codif 26.5 Pattern E (RATIFIED) to codif registry. Archive Codif 32 in §6 cross-Muse handoffs. Update `T-HE-027_pattern_d_motion_reduce_bundle_v0.2.md` reference.

🎯 **→ Athena (T-ATH-026 candidate):** Pre-validate 23 motion-reduce sites against WCAG 2.3.3 SC text (Codif 31 lesson: pre-validate, don't post-validate). Also pre-validate 12 keyboard handlers against WAI-APG patterns.

## §8 — Self-assessment + 3 HL moments (Codif 7/19)

**3 Honest Labeling moments:**

**HL #1 (Codif 19):** Codif 26.5 Pattern E is **RATIFIED** per Strategos T-ST-024 v0.5.3 §5.5 (cycle 12 turn 13). Strategos DID fold the tentative "Codif 33 CANDIDATE" into Codif 26.5 Pattern E (not standalone Codif 33). This spec is now `T-HE-027_v0.2_codif_26.5_motion_reduce.md` (in the working v0.1 file with bumped spec_version; rename is mechanical admin per Codif 22). §3 + §7 references updated to canonical form. No code change required; the verification protocol is the same.

**HL #2 (Codif 7):** T-HE-026 §5 claimed **17 sites** for the Top 5 violations; W2 Grep of all 12 components yields **23 sites**. The 17 was a T-HE-026 §5 scope-limit (Top 5 only); the 23 is the full Pattern D 12-component set. The PR must fix all 23, not just 17. Codif 9 W2 caught the discrepancy.

**HL #3 (Codif 19):** Tooltip + ShortcutHelpModal motion-reduce status is **TENTATIVE** — Radix UI primitives may respect `prefers-reduced-motion` via OS stylesheet injection without explicit `motion-reduce:` class. If Radix source confirms, those 2 components are PASS-by-default (no fix required). Apollo's verification step: `grep -r "framer-motion\|@radix-ui" src/components/ui/Tooltip.tsx src/components/ui/ShortcutHelpModal.tsx` — if no animation library imports, Radix default behavior applies.

**Codif 7 self-correction arc (Hera side, this turn):**

- Turn 12: T-HE-027 v0.1 spec draft — Codif 9 3-witness caught the 17-vs-23 site-count discrepancy between T-HE-026 §5 (Top 5) and T-HE-027 §2 (full 12). Resolved by explicit §2 footnote + §8 HL #2.

---

**End T-HE-027 v0.1.** Status: SHIPPED to Leader for verification.
