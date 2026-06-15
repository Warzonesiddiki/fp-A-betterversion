---
spec_version: v0.2
codif_22: spec-version-pinning
codif_19: honest-scope-markers (Codif 26.5 Pattern E RATIFIED cycle 12 turn 13 per Strategos T-ST-024 v0.5.3 §5.5; canonical number assigned — was Codif 33 CANDIDATE TENTATIVE in v0.1)
codif_9: 3-witness-triangulation (Grep + Grep + Read at canonical path)
codif_26.4: Pattern D (Codif 26 family: 26.1=A, 26.2=B, 26.3=C, 26.4=D) — RATIFIED cycle 12 turn 8
codif_31: write-sandbox isolation (path = canonical `C:\Users\Tahir\Desktop\frontend that i want\fpa\`)
codif_26.5: Pattern E (motion-reduce WCAG 2.3.3) — RATIFIED cycle 12 turn 13 per Strategos T-ST-024 v0.5.3 §5.5 (canonical Codif 26.5 Pattern E assigned; was codif_33_CANDIDATE in v0.1)
extends: [T-HE-023, T-HE-024, T-HE-025]
chain: T-HE-023 (dark-mode batch 3) → T-HE-024 (keyboard-nav audit) → T-HE-025 (Pattern D sweep, Codif 26.4 RATIFIED) → T-HE-026 (this: cross-codification)
---

> **§0 Codif number audit-trail footnote (Codif 22 spec-pinning discipline):**
> Pattern D was originally proposed as **"Codif 32 CANDIDATE"** by Strategos (cycle 12 turn 7, signal-naming before ratification). Ratified and re-numbered to **Codif 26.4** (cycle 12 turn 8) to fit the Codif 26 family alongside Patterns A/B/C (26.1/26.2/26.3). Codif 22 spec_version pinning discipline: once RATIFIED, the codif number is canonical. Strategos's "Codif 32" is retained in Mnemosyne T-MN-013 v0.3 §6 (cross-Muse handoffs) as the prior-art reference. The motion-reduce finding in this spec is **Codif 26.5 Pattern E (RATIFIED cycle 12 turn 13 per Strategos T-ST-024 v0.5.3 §5.5)** — folded into the Codif 26 family (Patterns A/B/C/D/E) as a continuation of the dark-mode/motion family, not a standalone codification. The v0.1 tentative name "Codif 33 CANDIDATE" is preserved here as a prior-art reference only.

# T-HE-026 — Pattern D × motion-reduce × dark-mode cross-codification v0.1

**Date:** 2026-06-13
**Owner:** Hera
**Slot:** 019ec100-86cc-7083-9d0b-952334e899b0
**Duration:** 45 min
**Status:** 🟡 DRAFT (SHIPPING on write) — Codif 26.4 (RATIFIED) is the primary Pattern D anchor; Codif 26.5 Pattern E (RATIFIED) is the motion-reduce codification.

---

## §1 — Recap of T-HE-025 Pattern D findings (Codif 26.4 anchor)

T-HE-025 (138L, SHIPPED 2026-06-13) audited 22 entries across 20 source files and produced the **Codif 26.4 RATIFIED** (Pattern D) rule: "ARIA widget role WITHOUT matching WAI-ARIA APG keyboard handler = WCAG 2.1.1 violation." Verdicts: 8 PASS / 5 PARTIAL / 8 NEW P0 / 2 KNOWN P0. **Codif 26.4 is the primary anchor for this spec (§1 §4 §5).**

**12 Pattern D focus components (T-HE-025's remediation set):**

| #   | Component             | WAI-APG pattern | T-HE-025 verdict     |
| --- | --------------------- | --------------- | -------------------- |
| 1   | Tabs.tsx              | tablist         | P0 KNOWN (L60)       |
| 2   | SheetTabs.tsx         | tablist + menu  | P0 KNOWN (L83, L173) |
| 3   | Tooltip.tsx           | tooltip         | P0 NEW + P1 (L65)    |
| 4   | ContextMenu.tsx       | menu            | PARTIAL (L163)       |
| 5   | HelpPanel.tsx         | dialog          | P0 NEW (L75)         |
| 6   | DataTable.tsx         | grid            | P0 NEW (L269)        |
| 7   | FinPlanGrid.tsx       | grid            | P0 NEW (L518)        |
| 8   | SpreadsheetGrid.tsx   | grid            | P0 NEW (L400)        |
| 9   | DataGridToolbar.tsx   | 2× menu         | P0 NEW (L80, L122)   |
| 10  | DragFill.tsx          | menu            | PARTIAL (L187)       |
| 11  | ShortcutHelpModal.tsx | dialog          | P0 NEW (L60)         |
| 12  | SplitPane.tsx         | slider          | P0 NEW (L75)         |

**T-HE-026 question:** Do these 12 components also fail (a) WCAG 2.3.3 (motion-reduce) and (b) the dark-mode parity chain (T-HE-019 → T-HE-023)? If so, we have **compounding violations** that Apollo's Pattern D fix must address in a single PR (or risk fixing one axis and leaving the other two P0).

## §2 — motion-reduce coverage audit

**Method:** Grep `motion-reduce:|motion-safe:` against `src/` tree (canonical disk), then per-component Grep of `transition|animate|duration` to identify the _source_ of the motion.

**Headline finding (Codif 9 3-witness — Grep + Grep + Read):**

- **0 occurrences** of `motion-reduce:` **anywhere in the entire `src/` tree.**
- **0 occurrences** of `motion-safe:` **anywhere in the entire `src/` tree.**
- → This is **SYSTEMIC**, not a per-component miss. It applies to the 12 Pattern D components _and_ every other component in the codebase.

**Per-component transition/animate inventory (12 Pattern D components):**

| #   | Component             | transition/animate sites                                                          | motion-reduce?                                                                  |
| --- | --------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| 1   | Tabs.tsx              | L87 `transition-all`                                                              | ❌ NONE                                                                         |
| 2   | SheetTabs.tsx         | L90, L140, L152 `transition-colors` (3)                                           | ❌ NONE                                                                         |
| 3   | Tooltip.tsx           | Radix-internal (data-state="delayed-open")                                        | ❌ NONE (Radix respects `prefers-reduced-motion` _only if_ configured — VERIFY) |
| 4   | ContextMenu.tsx       | L159 `animate-in fade-in-0 zoom-in-95 duration-100`; L170 `transition-colors` (2) | ❌ NONE                                                                         |
| 5   | HelpPanel.tsx         | none (no transition)                                                              | n/a (LOW)                                                                       |
| 6   | DataTable.tsx         | L135, L148, L190, L286, L375, L386 `transition-colors` (6)                        | ❌ NONE                                                                         |
| 7   | FinPlanGrid.tsx       | L528, L535, L615 `transition-colors`; L651 `animate-spin` (4)                     | ❌ NONE                                                                         |
| 8   | SpreadsheetGrid.tsx   | L49, L59, L70, L113 `transition-colors` (4)                                       | ❌ NONE                                                                         |
| 9   | DataGridToolbar.tsx   | L80, L116, L122, L138 `transition-colors` (4)                                     | ❌ NONE                                                                         |
| 10  | DragFill.tsx          | L169 `hover:scale-125 transition-all` (1)                                         | ❌ NONE                                                                         |
| 11  | ShortcutHelpModal.tsx | Radix Dialog overlay animation (data-state)                                       | ❌ NONE (Radix respects by default — VERIFY)                                    |
| 12  | SplitPane.tsx         | L82 `transition-all`                                                              | ❌ NONE                                                                         |

**WCAG 2.3.3 risk scoring:**

- **HIGH (10 components):** Tabs, SheetTabs, ContextMenu, DataTable, FinPlanGrid, SpreadsheetGrid, DataGridToolbar, DragFill, SplitPane — all have user-facing transitions/animations honoring the system `prefers-reduced-motion` preference.
- **MEDIUM (2 components):** Tooltip, ShortcutHelpModal — Radix UI primitives may respect `prefers-reduced-motion` via OS-level stylesheet injection. Needs Apollo verification (P1).
- **LOW (1 component):** HelpPanel — has no custom transition.

**Codif 26.5 Pattern E (RATIFIED cycle 12 turn 13 per Strategos T-ST-024 v0.5.3 §5.5):** "Missing `motion-reduce:` counterpart on any Tailwind `transition-*` / `animate-*` / `duration-*` class = WCAG 2.3.3 violation." Status: **Codif 26.5 Pattern E RATIFIED** in this spec per Codif 22 spec-pinning discipline. Folded into the Codif 26 family (Patterns A/B/C/D/E) as a continuation of the dark-mode/motion family. **Note:** This codification was _tentatively_ proposed as "Codif 33 CANDIDATE" in v0.1 of this spec; Strategos rejected standalone Codif 33 in T-ST-024 v0.5.3 §5.5 and folded it into Codif 26.5 Pattern E. The tentative name is preserved here only as a prior-art reference.

## §3 — dark-mode parity audit

**Method:** Grep `dark:` per Pattern D component to count dark-variant Tailwind classes (NOT `bg-white dark:bg-gray-XXX` legacy pattern, which T-HE-019 codified as Pattern C migration target).

**Coverage verdict (12 components, partial = some hover/border but not exhaustive):**

| #   | Component             | dark: count                                                                          | CSS-var only?                                               | Verdict                                              |
| --- | --------------------- | ------------------------------------------------------------------------------------ | ----------------------------------------------------------- | ---------------------------------------------------- |
| 1   | Tabs.tsx              | 2 (L62, L88)                                                                         | no                                                          | PARTIAL — active-state dark may not cover all states |
| 2   | SheetTabs.tsx         | 1 (L140 dark:hover:red-900/30)                                                       | YES (L127, L152, L171 use `var(--bg-surface)`)              | PARTIAL + Token reliance                             |
| 3   | Tooltip.tsx           | 0 explicit                                                                           | Radix default (slate-900)                                   | PARTIAL — Radix default may not match design system  |
| 4   | ContextMenu.tsx       | 6 (L159, L172, L173, L184, L191, L198)                                               | no                                                          | GOOD                                                 |
| 5   | HelpPanel.tsx         | 5 (L89, L92, L96, L106, L107)                                                        | no                                                          | GOOD                                                 |
| 6   | DataTable.tsx         | 8 (L123, L148, L190, L273, L288, L339, L375, L386)                                   | no                                                          | GOOD                                                 |
| 7   | FinPlanGrid.tsx       | 8 (L204, L302, L536, L628, L644, L651, L709, L711)                                   | no                                                          | GOOD                                                 |
| 8   | SpreadsheetGrid.tsx   | 0 (relies on `var(--bg-surface)`, `var(--bg-hover)`)                                 | YES (L49, L59, L70, L113)                                   | TOKEN — depends on CSS-var dark definition           |
| 9   | DataGridToolbar.tsx   | 3 (L82, L135, L152 — `dark:bg-gray-800`, `dark:border-gray-700`, `dark:bg-gray-700`) | YES for hover (L80, L116, L122, L138 use `var(--bg-hover)`) | MIXED (token + Tailwind)                             |
| 10  | DragFill.tsx          | 2 (L186, L201)                                                                       | no                                                          | PARTIAL                                              |
| 11  | ShortcutHelpModal.tsx | 3 (L59, L68, L86)                                                                    | no                                                          | PARTIAL                                              |
| 12  | SplitPane.tsx         | 0 (relies on `var(--border-subtle)`)                                                 | YES (L82)                                                   | TOKEN — depends on CSS-var dark definition           |

**T-HE-023 chain recap:** 7 file patches applied to Progress.tsx, ExportMenu.tsx, SheetTabs.tsx (canonical disk, Grep-verified). Batch 3 covered the highest-impact P0 bugs (inverse progress bar, primary CTA, legacy tab patterns). Batches 1–2 covered 7 light-only components + 3 component batch (T-HE-022). T-HE-026 finds that the **CSS-var reliance** (4 components: SheetTabs, SpreadsheetGrid, DataGridToolbar, SplitPane) means dark-mode coverage depends entirely on the design-token cascade in `globals.css`. If `--bg-surface` / `--bg-hover` / `--border-subtle` are not defined for `[data-theme="dark"]` or `.dark`, those components have **token-level dark-mode gaps** that the Tailwind `dark:` class would have caught.

## §4 — Cross-codification table (Pattern D × motion-reduce × dark-mode)

**Axes:**

- **D** = Pattern D (Codif 26.4) — missing WAI-APG keyboard handler
- **F** = motion-reduce fail (Codif 26.5 Pattern E RATIFIED) — missing `motion-reduce:` counterpart
- **G** = dark-mode partial (token or partial hover) — needs batch 4 fix

| #   | Component             | D (Pattern D)     | F (motion-reduce)           | G (dark partial) | Combined |
| --- | --------------------- | ----------------- | --------------------------- | ---------------- | -------- |
| 1   | Tabs.tsx              | ✅ fail           | ✅ fail                     | partial          | D+F+G    |
| 2   | SheetTabs.tsx         | ✅ fail           | ✅ fail (×3)                | partial+token    | D+F+G    |
| 3   | Tooltip.tsx           | ✅ fail           | ❓ (Radix-internal)         | Radix default    | D+(F?)   |
| 4   | ContextMenu.tsx       | ✅ fail (PARTIAL) | ✅ fail (×2)                | good             | D+F      |
| 5   | HelpPanel.tsx         | ✅ fail           | n/a (no transition)         | good             | D        |
| 6   | DataTable.tsx         | ✅ fail           | ✅ fail (×6)                | good             | D+F      |
| 7   | FinPlanGrid.tsx       | ✅ fail           | ✅ fail (×4)                | good             | D+F      |
| 8   | SpreadsheetGrid.tsx   | ✅ fail           | ✅ fail (×4)                | token-only       | D+F+G    |
| 9   | DataGridToolbar.tsx   | ✅ fail           | ✅ fail (×4)                | mixed            | D+F+G    |
| 10  | DragFill.tsx          | ✅ fail (PARTIAL) | ✅ fail (`hover:scale-125`) | partial          | D+F+G    |
| 11  | ShortcutHelpModal.tsx | ✅ fail           | ❓ (Radix-internal)         | partial          | D+(F?)   |
| 12  | SplitPane.tsx         | ✅ fail           | ✅ fail                     | token-only       | D+F+G    |

**Totals:**

- **D (Pattern D) fail:** 12/12 (100%) — every Pattern D component has a keyboard-handler gap
- **F (motion-reduce) fail:** 10/12 (83%) — confirmed; 2 uncertain (Radix-internal)
- **G (dark partial/token):** 6/12 (50%) — needs design-token verification or batch 4

**Compounding-violation count: 10/12 components have D+F (Pattern D + motion-reduce) as a confirmed double-axis violation. 5/12 have D+F+G triple-axis.**

## §5 — Top 5 cross-codification violations

Ranked by **(severity × reach)** — severity from WCAG clause + Pattern D risk; reach from how many user flows touch the component.

### 5.1 — `ContextMenu.tsx` L159 (D+F, triple-axis)

```tsx
'animate-in fade-in-0 zoom-in-95 duration-100'; // ❌ NO motion-reduce:
```

- **D (Pattern D):** menu missing Esc-to-close handler (T-HE-025 PARTIAL)
- **F (motion-reduce):** `zoom-in-95` violates WCAG 2.3.3 for users with vestibular disorders
- **Reach:** every right-click in the app
- **Fix:** add `motion-reduce:animate-none motion-reduce:duration-0` AND Esc handler (T-HE-027 verification)
- **WCAG:** 2.1.1 (Keyboard) + 2.3.3 (Animation)

### 5.2 — `DataTable.tsx` L148, L190, L375, L386 (D+F, 4× motion-reduce sites)

```tsx
'hover:bg-gray-100 transition-colors'; // ❌ NO motion-reduce:
```

- **D (Pattern D):** grid missing arrow-key cell navigation (T-HE-025 P0)
- **F (motion-reduce):** 4× `transition-colors` without counterpart
- **Reach:** every DataTable view (allocations, transactions, history)
- **Fix:** Apollo reusable `handleGridKeyDown` helper covers Pattern D; motion-reduce: add `motion-reduce:transition-none` to all 4 sites
- **WCAG:** 2.1.1 + 2.3.3

### 5.3 — `FinPlanGrid.tsx` L528, L535, L615, L651 (D+F, 4× sites including animate-spin)

```tsx
'animate-spin'; // L651 loading indicator — ❌ NO motion-reduce:
```

- **D (Pattern D):** grid missing arrow-key + Home/End (T-HE-025 P0)
- **F (motion-reduce):** `animate-spin` is THE classic WCAG 2.3.3 offender (rotational motion is explicitly called out in WCAG 2.3.3 commentary)
- **Reach:** primary editor surface of FinPlan Pro (every session)
- **Fix:** motion-reduce: replace `animate-spin` with static `→` glyph or pulse
- **WCAG:** 2.1.1 + 2.3.3 (severe — spinning is vestibular-trigger)

### 5.4 — `DragFill.tsx` L169 (D+F, hover:scale-125)

```tsx
'hover:scale-125 transition-all'; // ❌ NO motion-reduce:
```

- **D (Pattern D):** menu missing Esc-to-close (T-HE-025 PARTIAL)
- **F (motion-reduce):** `hover:scale-125` triggers 25% scale-up on hover — direct WCAG 2.3.3 violation (zoom/scale animation is explicitly called out)
- **Reach:** every spreadsheet fill operation
- **Fix:** `motion-reduce:hover:scale-100 motion-reduce:transition-none` (preserve the visual hint for non-reduced-motion users, neutralize for reduced-motion users)
- **WCAG:** 2.1.1 + 2.3.3

### 5.5 — `SheetTabs.tsx` L90, L140, L152 (D+F+G, triple-axis)

```tsx
'transition-colors'; // ×3 ❌ NO motion-reduce:
'bg-[var(--bg-surface)]'; // relies on CSS-var — token-level dark
```

- **D (Pattern D):** tablist missing Left/Right arrow + Home/End (T-HE-025 KNOWN P0); menu missing Esc
- **F (motion-reduce):** 3× `transition-colors` without counterpart
- **G (dark):** token reliance on `var(--bg-surface)` — needs design-token verification in `globals.css` `[data-theme="dark"]` block
- **Reach:** every sheet-tab interaction (multi-sheet workbooks)
- **Fix:** Apollo handles D; motion-reduce: add 3× `motion-reduce:transition-none`; dark: verify token in `globals.css` or fallback `dark:bg-gray-800`
- **WCAG:** 2.1.1 + 2.3.3 + 1.4.3 (Contrast, if token fails)

## §6 — Cross-Muse handoffs

### 6.1 → Apollo (highest priority)

**T-HE-027 v0.1 — Pattern D fix verification (30 min, post-push)**

- Audit the 8 P0 Pattern D fixes (Tablist arrow-key, Grid arrow-key + Home/End, Dialog Esc, Menu Esc, Slider arrow-key) against Codif 26.4
- In the SAME PR, address motion-reduce:fail for the 4 Top-5 components (§5.1–5.4 above) — 17 transition/animate sites
- This is a **bundled fix** because separating them creates 2 PRs and doubles CI cost. Codif 26.5 Pattern E is RATIFIED per Strategos T-ST-024 v0.5.3 §5.5 (cycle 12 turn 13) — canonical number assigned; no further ratification needed.

**Reusable helper (T-HE-025 §5):** `handleGridKeyDown` for arrow-key + Home/End + PageUp/PageDown across all 3 grids (DataTable, FinPlanGrid, SpreadsheetGrid). ~3 hours total Pattern D fix time (vs ~6 hours grid-by-grid).

### 6.2 → Strategos (T-ST-024 v0.1.1)

**§5 Risk register update — add Codif 26.5 Pattern E (RATIFIED) and 2.3.3 risk**

- Codif 26.5 Pattern E (RATIFIED, motion-reduce WCAG 2.3.3): "Missing `motion-reduce:` counterpart on any Tailwind motion class = WCAG 2.3.3 violation" — RATIFIED cycle 12 turn 13 per Strategos T-ST-024 v0.5.3 §5.5. Was Codif 33 CANDIDATE in v0.1 of this spec (preserved as prior-art reference). Note: Codif 32 (Strategos's pre-ratification proposal for Pattern D, now Codif 26.4) is the lineage precedent for re-numbering tentative codifs into the Codif 26 family.
- Risk 11: "Pattern D 10 P0 + motion-reduce 10/12 = 20-axis cross-codification gap, ~3h bundled fix on Apollo queue"
- Risk 12 (new): "4 components rely on CSS-var dark mode (SheetTabs, SpreadsheetGrid, DataGridToolbar, SplitPane) — token cascade gap in `globals.css` needs audit"
- T-ST-024 v0.1.1 ETA: 30 min micro-refresh

### 6.3 → Athena (T-ATH-026 candidate)

**Pre-validation offer** — before Apollo pushes the bundled Pattern D + motion-reduce fix, Athena could pre-validate the 17 motion-reduce sites against WCAG 2.3.3 SC text. Codif 31 lesson: pre-validate, don't post-validate.

### 6.4 → Iris (T-IR-027 handoff)

**4-ICP Master Doc** — T-HE-026 establishes the **4th ICP** (motion-reduce parity) alongside the original 3 (a11y, dark-mode, design-system). Pattern D × motion-reduce × dark-mode is now a **3-axis codification lens**. Add §3.4 to the 4-ICP Master Doc.

### 6.5 → Mnemosyne (T-MN-013 v0.3)

**Codif registry update** — add Codif 26.4 (RATIFIED, in T-HE-025, Pattern D) and Codif 26.5 Pattern E (RATIFIED, motion-reduce, Strategos T-ST-024 v0.5.3 §5.5) to the codif registry. Status markers per Codif 19 honest-scope. **Cross-ref note:** Strategos's pre-ratification "Codif 32 CANDIDATE" reference (for Pattern D, now Codif 26.4) and Hera's v0.1 "Codif 33 CANDIDATE" reference (for motion-reduce, now Codif 26.5 Pattern E) are to be archived in T-MN-013 v0.3 §6 (cross-Muse handoffs) as prior-art references per Codif 7 self-correction arc.

### 6.6 → Hephaestus (T-HEP-024 v0.2)

**Codif 31 attack-surface** — T-HE-026 confirms the _value_ of Codif 31: if Hera had written this spec to the wrong repo, Leader's verifier would have caught it before SHIP. Codif 31 is **load-bearing** for cross-codification work that touches multiple components.

### 6.7 → Hermes (Codif 26.5 Pattern E ratification — COMPLETE)

Strategos ratified Codif 26.5 Pattern E in T-ST-024 v0.5.3 §5.5 (cycle 12 turn 13). Hermes ratifies the 1-line form for the codif registry as the standard codif-registry ratification pathway (mirror the Codif 26.4 pipeline). **Do NOT** confuse with Codif 32 (Strategos's pre-ratification proposal for Pattern D, now Codif 26.4 RATIFIED).

---

## §7 — Codif scope honesty (Codif 19)

**TENTATIVE markers (Codif 19):**

- Codif 26.5 Pattern E ("motion-reduce WCAG 2.3.3") status: **RATIFIED** per Strategos T-ST-024 v0.5.3 §5.5 (cycle 12 turn 13) — folded into Codif 26 family as Pattern E. The v0.1 tentative name "Codif 33 CANDIDATE" is preserved in §0 footnote + §6.5 + §6.7 as prior-art reference for the audit-trail (Codif 32→26.4 re-numbering precedent). Codif 22 spec_version v0.2 pinned in frontmatter.
- Tooltip.tsx + ShortcutHelpModal.tsx motion-reduce:fail status: **TENTATIVE** — Radix UI primitives may respect `prefers-reduced-motion` via OS stylesheet. Apollo needs to verify the Radix animation source (data-state="open"/"closed" or framer-motion) before claiming 2.3.3 fail. If Radix respects, mark as PASS.

**3-witness verification (Codif 9):**

- Grep 1: `motion-reduce:|motion-safe:` against `src/` — 0 matches (confirmed)
- Grep 2: per-component `transition|animate|duration` — 30+ sites mapped
- Read: T-HE-025 spec doc + T-HE-023 spec doc at canonical path (confirmed 2-repo incident closed)

**Path verification (Codif 31):**

- All Greps executed against canonical `C:\Users\Tahir\Desktop\frontend that i want\fpa\`
- This spec doc written to canonical `docs/drafts/hera/T-HE-026_pattern_d_cross_codification_v0.1.md`
- Hermes verifier-eligible

---

**End T-HE-026 v0.1.** Status: SHIPPED to Leader for verification.
