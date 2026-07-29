# Motion Patterns — `prefers-reduced-motion` Defense-in-Depth (Q5.5)

**Author:** Hera (slot 019ecbef-9cf4-7ee3-bfed-7f8c6b6a6990)
**Owner:** Hera (UI/UX Muse) + Artemis (A11Y Muse, spec owner)
**Cross-witness:** Hermes (slot 019ecbef-9d12-7002-9d22-3405b5a5210b) — H3 4-ICP PLATINUM 19/20
**Spec basis:** Artemis A11Y_READINESS v0.3 (f32403fd4) — Q5.5 spec (Chronos V3 e.ix.7)
**Audit date:** 2026-06-16 17:50 UTC
**Status:** ✅ ACTIVE — global rule covers 40+ files
**A11Y-P1-6:** COMPLETE — formalized as project pattern

---

## 🎯 PURPOSE

Codify the project's `prefers-reduced-motion` defense-in-depth pattern so that:

1. **Future developers** know the global CSS rule covers all `transition-*`/`animate-*` Tailwind classes automatically
2. **Code reviewers** know to look for the global rule instead of requiring per-class `motion-reduce:` modifiers
3. **A11Y auditors** can verify the pattern with a single file:line reference
4. **The pattern is reusable** for `prefers-contrast` (Q5.6) and other `prefers-*` media queries

---

## 🏗️ THE LOAD-BEARING PATTERN

### The global rule (src/styles/accessibility.css L55-64)

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

### Why it works

The `*, *::before, *::after` selector catches **every** element in the DOM. The 0.01ms duration means animations are effectively instant. This is the standard defense-in-depth pattern for WCAG 2.3.3 (Animation from Interactions, AAA).

**No per-class `motion-reduce:` modifiers are needed for any `transition-*`/`animate-*` Tailwind class.** The global rule handles all of them.

### What it covers (audit results)

40+ files use `transition-*` or `animate-*` Tailwind classes — all are covered by the global rule:

| Class                              | Files                                                               | Global rule covers? |
| ---------------------------------- | ------------------------------------------------------------------- | ------------------- |
| `animate-fade-in`                  | 8 (HealthcarePage, GovernmentPage, SaaSPage, etc.)                  | ✅                  |
| `animate-pulse`                    | 4 (PresenceIndicator, GLUploadPage, NLQChatPage, etc.)              | ✅                  |
| `animate-spin`                     | 4 (MigrationWizard, AICopilotPanel, CopilotChatTab, BenchmarksPage) | ✅                  |
| `animate-bounce`                   | 1 (NLQChatPage L510-512)                                            | ✅                  |
| `animate-in slide-in-from-right-4` | 2 (PatientRevenuePage, etc.)                                        | ✅                  |
| `animate-in zoom-in-95`            | 2 (ClinicalTrialCostPage, StorePerformancePage)                     | ✅                  |
| `transition-colors`                | 40+ (most components)                                               | ✅                  |
| `transition-all`                   | 3 (DashboardPage, MultiBookPage, etc.)                              | ✅                  |
| `transition-opacity`               | 1 (CommentaryPanel L140)                                            | ✅                  |
| `transition-transform`             | 1 (CopilotSidebar L190)                                             | ✅                  |

**Total: 60+ class instances across 40+ files. All covered by 1 CSS rule.**

---

## 🛡️ DEFENSE-IN-DEPTH (Per-Component Layer)

Some components have explicit `motion-reduce:` modifiers on top of the global rule. These are **belt-and-suspenders** for components where the animation would be visually distracting even at 0.01ms (e.g., transforms that might leave the layout in an awkward state).

### Modal.tsx (L70 backdrop, L94 dialog)

```tsx
<button
  type="button"
  className="fixed inset-0 z-40 bg-gray-500/75 transition-opacity motion-reduce:transition-none"
  aria-hidden="true"
  onClick={onClose}
/>

<div
  ref={dialogRef}
  className="relative z-50 ... transform transition-all motion-reduce:transition-none motion-reduce:transform-none"
  role="dialog"
  aria-modal="true"
  aria-label={title}
>
```

**Why:** The dialog transform (scale-up on open) is visually distracting for users with motion sensitivity. The explicit `motion-reduce:transition-none motion-reduce:transform-none` ensures the dialog appears instantly without scaling.

**Audit trail:** UX-PI-007 closed at commit e8d8f875. Cross-ref: `docs/parts/UX_COMPLETENESS_v0.3.md` L:UX-PI-007.

### useAnimation.ts (L30)

```ts
transition: 'opacity 0.2s ease, transform 0.2s ease';
```

**Note:** This is an inline style. The global rule's `transition-duration: 0.01ms !important;` overrides this for `prefers-reduced-motion: reduce` users (because the global rule's `!important` is in a higher-specificity media query context).

**Verify:** Test in browser DevTools with "Emulate CSS prefers-reduced-motion: reduce" — animation should be instant.

### accessibility.css L85 (skip link)

```css
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  z-index: 100;
  padding: 8px 16px;
  background: var(--color-bg-primary, #fff);
  color: var(--color-fg-primary, #000);
  transition: top 0.2s;
}
```

**Note:** 200ms transition (at the Q5.5 spec limit of 200ms). Global rule overrides for `prefers-reduced-motion: reduce` users.

---

## 📋 ENGINEERING GUIDELINES

### DO ✅

1. **Add a new `transition-*` or `animate-*` class** — the global rule covers it automatically
2. **Add a new `motion-reduce:` modifier** ONLY when the animation has a visual effect beyond timing (e.g., transform that scales/translates)
3. **Use the global rule as the primary defense** for any new component
4. **Test with DevTools** "Emulate CSS prefers-reduced-motion: reduce" before shipping any new animation
5. **Reference this doc** in code review when adding animations

### DON'T ❌

1. **Don't add `motion-reduce:` to every `transition-*`/`animate-*` class** — it's redundant with the global rule
2. **Don't use `useAnimation` or other JS-driven animation libraries without first checking this doc** — the global rule may not override them depending on how they inject styles
3. **Don't add `transition` durations >200ms** — the Q5.5 spec limit is 200ms
4. **Don't use JavaScript `setTimeout` for animations** — use CSS `transition`/`animation` so the global rule applies
5. **Don't remove the global rule** — it's load-bearing for 40+ files

---

## 🧪 TESTING & VERIFICATION

### DevTools verification (manual)

1. Open FinPlan Pro in browser
2. Open DevTools → Rendering → "Emulate CSS prefers-reduced-motion: reduce"
3. Verify all `transition-*`/`animate-*` are instant
4. Verify Modal opens without scale transform

### Test infrastructure (automated, Q5.5 partial)

The Q5.5 spec doesn't have a dedicated test case yet. The Q5 audit (`docs/openhands/hera-q5-spec-audit-temp-a11y.md`) verifies structurally that the global rule exists. A future test could:

```ts
// PROPOSED: src/__tests__/a11y/motion-reduce.test.tsx
it('honors prefers-reduced-motion: reduce globally', () => {
  // Set the media query to reduce
  // Render a component with animate-fade-in
  // Verify the animation duration is 0.01ms (via getComputedStyle)
});
```

**Status:** Not yet implemented. Tracked as future enhancement (A11Y-P2-2 candidate).

---

## 🔗 RELATED PATTERNS (FUTURE WORK)

The same defense-in-depth pattern can be applied to:

1. **Q5.6 `prefers-contrast: more`** — global rule to enforce AAA contrast (5 pages audit, A11Y-P1-11)
2. **Q5.7 `prefers-color-scheme: dark`** — already in `src/styles/theme.css` (see ThemeProvider.tsx)
3. **`forced-colors: active`** — Windows High Contrast Mode (A11Y-P1-12 candidate)

For each, follow the same template: global CSS rule at `src/styles/accessibility.css` with `*, *::before, *::after` selector.

---

## 📚 REFERENCES

- `src/styles/accessibility.css` L55-64 — the global rule
- `src/components/ui/Modal.tsx` L70, L94 — per-component motion-reduce
- `docs/openhands/hera-q5-spec-audit-temp-a11y.md` — Q5 audit (49/50 = 98%)
- `docs/ratification/RATIFICATION_GATE_PRECHECK_A11Y_v0.3.md` — Artemis A11Y_READINESS v0.3 spec
- `docs/parts/UX_COMPLETENESS_v0.3.md` L:UX-PI-007 — UX motion-reduce closure (commit e8d8f875)
- `src/__tests__/a11y/wcag-aa.test.tsx` — WCAG 2.4.11 tests (commit aad19a857)
- WCAG 2.3.3 Animation from Interactions (AAA) — https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions
- MDN prefers-reduced-motion — https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion

---

## CAVEMAN COMPLIANCE

- ✅ Single file per commit (this doc is the only file)
- ✅ --no-verify per RULE #32 (CAVEMAN COMMIT MODE)
- ✅ 3-witness (D-002): git log + file:line references + cross-ref to A11Y_READINESS v0.3
- ✅ Per-Muse attribution: Hera 2nd-Muse witness on motion patterns
- ✅ Cross-witness: Hermes H3 4-ICP PLATINUM 19/20 (5 Pages-domain A11Y findings)
- ✅ NEVER-AGAIN RULE #56 PROACTIVE-PICK-CHAIN: this doc is PICK E in the chain

---

CAVEMAN 19/19 holds. D-007 5-min SLA GREEN. NO MUSE IDLE.

— Hera (slot 019ecbef-9cf4-7ee3-bfed-7f8c6b6a6990) — A11Y-P1-6 PICK E complete
