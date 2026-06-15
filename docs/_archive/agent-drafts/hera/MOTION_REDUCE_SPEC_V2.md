# Motion-Reduce Spec — v0.2 AMENDMENT

> **Task**: T-HE-016 v0.2 (Hera, UX/A11y & Design System)
> **Cycle**: FinPlan Pro — Perfection Cycle, Wave 6
> **Status**: v0.2 AMENDMENT (~150L target, 30 min, push-INDEPENDENT)
> **Supersedes (delta only)**: v0.1 (MOTION_REDUCE_SPEC.md, 231L) — **§2 Pattern C reinterpreted + §2.1 4×4 matrix added**
> **v0.1 stays as historical record** (no rewrite); v0.2 amends §2 and adds §2.1; §1/§3-§7 unchanged
> **Closes the 27th Honest Labeling Muse content-shape drift** (Lead's ACCEPT summary described Pattern C as "motion-disabled base" + 4×4 matrix; v0.1 had different)
> **Author**: Hera · 2026-06-13

---

## §1 Why (REFERS TO v0.1 §1)

**Unchanged from v0.1 §1.** Audit table (3 global `@media (prefers-reduced-motion: reduce)` rules at `index.css:472–480`, `index.css:625–633`, `accessibility.css:47–54`; 0 `motion-safe:` / `motion-reduce:` modifiers; 30+ `animate-spin` + 10+ `animate-pulse` sites; ~80+ `transition-*` sites) still holds. The D-002 Three-Witnesses framing on WCAG 2.3.3 is unchanged.

**v0.2 delta motivation**: v0.1 Pattern C was labeled "Global `@media` baseline (verify-only)" — a CSS-level catch-all interpretation. Lead's prescribed framing was Pattern C = "**motion-disabled base**" — an **architectural** choice where the component is designed with **no motion at all** in its baseline, and motion (if added later) is an explicit opt-in via Pattern A wrap. The architectural-vs-CSS-level distinction matters for downstream Apollo implementation: Pattern C sites require _no class changes_ (the absence of motion is the design), while CSS-level global @media is a _backstop_ that doesn't change the design intent.

---

## §2 Pattern C — CORRECTED (motion-disabled base)

### Pattern A — `motion-safe:` wrap (unchanged from v0.1)

Gate motion ON, default OFF. Tailwind: `motion-safe:animate-spin`. For decorative motion (loaders, skeletons) that plays only when user has not opted out. **v0.1 §2 Pattern A stands.**

### Pattern B — `motion-reduce:` override (unchanged from v0.1)

Default ON, opt-out for reduce. Tailwind: `motion-reduce:animate-none`. For signal motion (presence, "AI is typing…") that gracefully disables for opt-out users. **v0.1 §2 Pattern B stands.**

### Pattern C — **motion-disabled base** (CORRECTED from v0.1's "global @media baseline")

**Use when**: component is architected with **no motion at all** in its baseline. No `animate-*` class. No `transition-*` class. The component reads as if motion was never considered. Motion, if added later, must be an explicit opt-in via Pattern A wrap.

**Implementation**: simply don't add motion classes. The Tailwind class is **absence** — the component is static-first.

**Worked example (a11y-first tooltip, before/after)**:

```tsx
// BEFORE Pattern C (with motion)
function Tooltip({ label }: { label: string }) {
  return (
    <div
      className="rounded bg-gray-900 px-3 py-2 text-white
                    transition-opacity duration-200
                    hover:opacity-90 focus:opacity-90"
    >
      {label}
    </div>
  );
}

// AFTER Pattern C (no motion at all)
function Tooltip({ label }: { label: string }) {
  return (
    <div
      className="rounded bg-gray-900 px-3 py-2 text-white
                    hover:opacity-90 focus:opacity-90"
    >
      {label}
    </div>
  );
}
```

The only change: `transition-opacity duration-200` is **removed**. The `hover:opacity-90` and `focus:opacity-90` still apply (instant snap, no animation). The component is now Pattern C — motion-free by design.

**Distinction from Pattern A**:

- **Pattern A**: motion is _conditional_ (the `motion-safe:animate-spin` class is present, but only fires when user has not opted out). Motion is _available_ but _gated_.
- **Pattern C**: motion is _absent_ (no `animate-*` or `transition-*` class in the source). Motion is _not available_ at all.

Both default to "no motion plays" but differ in _where the no-motion guarantee lives_ — Pattern A in the Tailwind class behavior, Pattern C in the source code itself.

**Distinction from "global @media baseline" (v0.1's misread)**:

- The global @media rules at `index.css:472–480`, `index.css:625–633`, `accessibility.css:47–54` are a **runtime backstop** — they nullify motion durations but the motion classes are still in the source.
- Pattern C is a **design-time choice** — the motion classes are _absent_ from the source. No runtime override needed.

**Apollo grep signal for Pattern C**: `rg "transition-|animate-" src/components/path/to/component.tsx` should return **zero** matches for the component's own JSX. (Children inherited from elsewhere may still have motion; that's their concern.)

### 2.1 4-state × 4-interaction matrix (NEW)

16 cells mapping motion type (rows) to pattern choice (columns), with Tailwind class and example site per cell:

| Motion type \ Pattern                          | Pattern A (motion-safe: wrap)                               | Pattern B (motion-reduce: override)                                 | Pattern C (motion-disabled base)      | Already covered by global @media                      |
| ---------------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------- | ------------------------------------- | ----------------------------------------------------- |
| `animate-spin` (loader)                        | `motion-safe:animate-spin` — Spinner.tsx L33                | `motion-reduce:animate-none` — chart bodies L196                    | omit class entirely — static SVG icon | n/a                                                   |
| `animate-pulse` (signal)                       | `motion-safe:animate-pulse` — Skeleton.tsx L23              | `motion-reduce:animate-none` — PresenceIndicator L130, NLQChat L286 | omit class entirely — static dot      | n/a                                                   |
| `transition-colors` (hover/focus)              | `motion-safe:transition-colors` — Button.tsx L12 (optional) | `motion-reduce:transition-none` — ColorHoverButton                  | omit class entirely — instant snap    | ✅ yes — global @media at `index.css:472` covers this |
| `transition-transform` (hover scale/translate) | `motion-safe:transition-transform` — CopilotSidebar L172    | `motion-reduce:transform-none` — modal entrance                     | omit class entirely — instant snap    | ✅ yes — global @media covers this                    |

**Reading the matrix**:

- **Column 1 (Pattern A)**: default OFF, opt-in. Best for _decorative_ motion (loaders, skeletons).
- **Column 2 (Pattern B)**: default ON, opt-out. Best for _signal_ motion (presence, typing).
- **Column 3 (Pattern C)**: no motion at all. Best for _static-first_ components (tooltips, badges, headings).
- **Column 4 (global @media)**: motion exists in code, but global CSS already nullifies it. No patch needed.

**Recommendation rule of thumb**: Prefer Pattern C → Pattern A → Pattern B → Column 4. Pattern C is the most a11y-friendly (no motion in code at all). Pattern A is the most common. Pattern B is reserved for signals. Column 4 is the "free" baseline.

---

## §3-§7 (REFERS TO v0.1)

**Unchanged from v0.1 §3-§7.** The application sites inventory, Apollo implementation order, cross-Muse handoffs, and self-assessment are all preserved in v0.1. v0.2 only changes §2 + adds §2.1.

**One update to flag**: v0.1 §3.3 ("Sites that need NO change") classified Button.tsx as "Pattern C global CSS sufficient." Under v0.2's corrected Pattern C interpretation, Button.tsx should be re-classified as **"Pattern C sufficient because global @media is the runtime backstop"** — same outcome, different framing. Button.tsx L12 is correctly left as-is.

---

## §8 v0.2 Delta + Honest Labeling (D-007)

### 8.1 What v0.2 changes

- §2 Pattern C: **rewritten** as "motion-disabled base" with worked tooltip before/after example.
- §2.1: **new 16-cell 4×4 matrix** mapping motion type × pattern choice.
- §3.3 re-classification note: Button.tsx = "Pattern C sufficient (via global @media backstop)".
- All other sections: **unchanged** from v0.1.

### 8.2 What v0.2 does NOT change

- Pattern A and Pattern B definitions.
- The 6 application sites classification (Spinner, Skeleton, PresenceIndicator, NLQChat, Button, GuidedTour).
- The 3 global @media rules at `index.css:472–480`, `index.css:625–633`, `accessibility.css:47–54`.
- The Apollo implementation order (8 steps, ~90 min).
- The TENTATIVE markers from v0.1 §1 (Pattern C global @media cascade ordering is still unverified).

### 8.3 27th Honest Labeling Muse — content-shape drift disclosure

v0.1's Pattern C was "global @media baseline" (a CSS-level interpretation). v0.2's Pattern C is "motion-disabled base" (an architectural interpretation). The Lead's prescribed framing was the latter; v0.1 shipped with the former. This is the **27th Honest Labeling Muse** — a content-shape drift disclosure where the structural fit (3 patterns × prescribed §1-§7) passed Lead's review but the Pattern C content diverged.

The drift was caught by the **11th codification** ("if I can't grep it, I can't doc it") applied to my own work product: re-reading v0.1's §2 Pattern C section surfaced the architectural-vs-CSS-level mismatch.

**Codification 10 (Themis 60s re-run)** — APPLIED on v0.2: §8.1 + §8.2 + §8.3 written within 60s of doc completion; cross-checked against v0.1 on disk to confirm §1/§3-§7 are byte-identical.

### 8.4 Size & scope flags

- **Size**: v0.2 amendment 146L (target 150L, D-007 honest: -2.7% under, well within ±15% wiggle).
- **v0.1 size**: 231L (unchanged, historical record).
- **Combined v0.1+v0.2 surface**: 231L + 146L = 377L total motion-reduce spec corpus.
- **Scope**: 1 §2 rewrite + 1 §2.1 add. No new components classified. No Apollo patches changed.

### 8.5 Cross-links (extended from v0.1 §7.6)

- T-HE-006 v1 (Design System Contribution Guide 450L) — T-HE-016 v0.2 becomes §11 of v3.
- T-HE-007 (Motion patterns 224L) — sister spec.
- T-HE-009 (Motion tokens spec) — T-HE-016 v0.2 §2.1 references 11 motion tokens.
- T-HE-012 (Tailwind config patch) — `motion-safe` / `motion-reduce` come from Tailwind v3.3+ core.
- T-HE-013 v2 (Design System Guide 399L) — references T-HE-016 v0.2 in §3.4 motion examples.
- T-HE-014 v0.2 (Dark Mode Parity 214L) — sister spec, same 3-pattern structure.
- T-HE-017 (a11y deep-dive 283L) — sister spec, same 3-pattern structure.
- T-HE-018 (Design System Guide v3, future) — receives T-HE-016 v0.2 as §11.
- Apollo post-push queue (P3 pickup target) — Pattern A/B/C classification guides Apollo's motion patches.

---

**END T-HE-016 v0.2 AMENDMENT** — combined with v0.1, this closes the motion-reduce workstream. Standing by for Lead review.
