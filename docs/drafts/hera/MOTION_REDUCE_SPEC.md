# Motion-Reduce Spec

> **Task**: T-HE-016 (Hera, UX/A11y & Design System)
> **Cycle**: FinPlan Pro — Perfection Cycle, Wave 6
> **Status**: v0.1 (60 min, ~250L target, push-INDEPENDENT)
> **Closes the design system loop**: T-HE-007 (motion patterns 224L) + T-HE-009 (tokens) + T-HE-012 (Tailwind config) + T-HE-014 (dark mode parity) = complete
> **Author**: Hera · 2026-06-13

---

## §1 Why

### 1.1 Problem (D-002 Three-Witnesses)

**Rule (WCAG 2.3.3 Animation from Interactions, Level AAA — also a strong AA signal)**: For motion animation triggered by user interaction, users must be able to disable it. The OS-level `prefers-reduced-motion: reduce` media query is the canonical signal. For FinPlan Pro's enterprise audience (analysts on long sessions, finance teams sensitive to vestibular triggers), respecting this is non-negotiable.

**Evidence (current state)**: Audit reveals a **partially-respecting** posture. Three global CSS overrides already exist that nullify `animation-duration` and `transition-duration` to `0.01ms` when the user opts out:

| #   | File                           | Line    | Rule                                                                                                        |
| --- | ------------------------------ | ------- | ----------------------------------------------------------------------------------------------------------- |
| 1   | `src/index.css`                | 472–480 | `*, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }` |
| 2   | `src/index.css`                | 625–633 | Same, plus `animation-iteration-count: 1 !important;`                                                       |
| 3   | `src/styles/accessibility.css` | 47–54   | Same as #2, plus `scroll-behavior: auto !important;`                                                        |

That covers the _fall-through_. But component-level Tailwind motion is **unconditional**: a `Grep` for `motion-safe:|motion-reduce:` across `src/` returns **zero matches**. Every `animate-spin`, `animate-pulse`, `transition-colors`, `transition-transform`, `transition-all` utility fires regardless of user preference.

**Consequence**: A user with `prefers-reduced-motion: reduce` set will see:

- 30+ `animate-spin` loaders still spin (chart bodies: ComboChart, BoxPlot, Bullet, Funnel, Gantt, Gauge, Heatmap, Sankey, Scatter, Tornado, TreeMap, Waterfall; migration wizard; login/register; AI copilot; chat; spinners)
- 10+ `animate-pulse` skeletons still pulse (KPICardEnhanced L91–93, NLQChat L286, ReportProgress L148, PresenceIndicator L130, DataLineagePage L245, ProgressStepper L97, GLUploadPage L430, NLQChatPage L503, Skeleton L23)
- `transition-colors` / `transition-all` on hover/focus still fire (Button L12, DataTable ~10 sites, DataGrid 5+, CurrencyInput L90, DriverSlider L38/L70/L76, ContextMenu L159, GuidedTour L107×3, MigrationWizard L458, AnomalyHighlight L84, CopilotSidebar L172, ChatPanel L93, etc.)

**TENTATIVE — global fallback verification**: I claim the 3 global CSS rules nullify motion, but Tailwind utility classes (e.g. `animate-spin` → `animation: spin 1s linear infinite`) include `animation-iteration-count: infinite`, which the override does **not** set to 1 (only `#2` and `#3` set it, and the cascade order matters). **To be verified in §5** that `animation-iteration-count: 1 !important` reaches every Tailwind `animate-*` utility at runtime — if not, Pattern B (component-level `motion-reduce:animate-none`) is required as backstop.

### 1.2 Reframe (Honest Labeling, D-007)

This is **not** "fix every motion site" — that would touch ~100 components. This is: **make Tailwind motion utilities honor `prefers-reduced-motion: reduce` reliably**, by combining (a) the existing global CSS fallback with (b) targeted `motion-safe:` / `motion-reduce:` modifiers at the most visible/perilous sites. Total scope: 6 components classified into 3 patterns.

---

## §2 Three Patterns (mirrors T-HE-014 v0.2 §2 3-pattern structure)

### Pattern A — `motion-safe:` wrap (gate motion ON, default OFF)

**Use when**: motion is a _delight_, not a signal. The component is still functional without it. Default: no motion. When user has NOT opted out, motion plays.

**Worked example (Spinner.tsx, L33 — the canonical loader)**:

```tsx
// BEFORE — unconditional spin, fires for all users
className={cn('rounded-full border-transparent animate-spin', sizeMap[size]!)}
```

```tsx
// AFTER — gated: no motion by default, motion only when user has not opted out
className={cn('rounded-full border-transparent motion-safe:animate-spin', sizeMap[size]!)}
```

**Why this is Pattern A, not C**: This is _per-component gating_, not a global override. The global rule is the backstop (Pattern C); this is the _primary_ signal that the loader is intentionally motion-gated. Apollo can grep for `motion-safe:animate-` to find all sites treated as Pattern A.

### Pattern B — `motion-reduce:` override (gate motion OFF, default ON)

**Use when**: motion _is_ a signal (e.g. live-presence dot, processing spinner that disambiguates from a static state). The component is functional with motion; we just want a graceful-off for opt-out users.

**Worked example (PresenceIndicator.tsx, L130 — the green "user is here" dot)**:

```tsx
// BEFORE — unconditional pulse (signals "live", not "decorative")
<span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
```

```tsx
// AFTER — defaults to pulse for normal users; static dot for reduce-motion users
<span className="h-2 w-2 rounded-full bg-green-500 motion-reduce:animate-none" />
```

**Important**: `motion-reduce:animate-none` is the canonical Tailwind v3+ pattern. It kills `animation` entirely, leaving the dot in its `0%` state (or whatever Tailwind defines as `animation: none`). For a presence dot this is acceptable; for a processing spinner this is _not_ — the user needs a static "Loading…" label instead (handoff to Pattern A: `motion-reduce:hidden` on the spinner + always-visible text).

### Pattern C — Global `@media (prefers-reduced-motion: reduce)` (already in place, verify-only)

**Use when**: catch-all safety net. The 3 existing rules at `index.css:472`, `index.css:625`, `accessibility.css:47` already nullify `animation-duration` and `transition-duration` globally. This pattern requires **no new code** — it is the _verify-only_ baseline.

**Recipe to verify it works** (4-state audit checklist):

1. Open the app in Chrome.
2. DevTools → ⋮ menu → More tools → Rendering → "Emulate CSS media feature prefers-reduced-motion" → set to `reduce`.
3. Visit: `/login`, `/dashboard`, `/ai/copilot`, `/data/import`, `/spreadsheet`.
4. For each: hover a button (transition-colors should not animate), focus a button (transition-all should not animate), observe a loading state (animate-spin should be effectively frozen — 0.01ms per frame).
5. Reset emulation to `no-preference`. Animations should resume.
6. If any animation visibly _still_ plays in step 4, Pattern C has failed and Pattern B is required at that site.

**TENTATIVE — order of cascade**: If a component uses `motion-safe:animate-spin` and Pattern C also fires, the cascade order is: Pattern C's `animation-duration: 0.01ms !important` wins over Pattern A's `animation: spin 1s linear infinite` because of `!important`. So Pattern A is _redundant_ for duration, but Pattern A still matters for `animation-iteration-count` (Pattern C only sets it in #2 and #3; #1 does not) and for explicit **signaling** to grep audits that "this site is motion-aware." This is the 25th Honest Labeling Muse moment: Pattern A is a _documentation_ mechanism, not a _runtime_ mechanism. The runtime is Pattern C. Patterns A and B are belt-and-suspenders for the cases Pattern C misses.

### 2.1 Pattern selection rule of thumb

- **Loader / progress / decorative**: Pattern A (`motion-safe:animate-spin`)
- **Live-status signal (presence, "AI is typing…")**: Pattern B (`motion-reduce:animate-none`) + ARIA text fallback
- **Hover/focus transitions on color or transform**: Pattern A (`motion-safe:transition-colors`) OR keep unconditional if very short (≤100ms) — global Pattern C will nullify them anyway
- **Page-level entrance (fadeIn, slideUp keyframes in `index.css`)**: Pattern C only (already covered by the 3 global rules)

---

## §3 Application Sites Inventory (per-component classification)

Pre-flight Grep across `C:\Users\Tahir\Desktop\frontend that i want\fpa\src` for `animate-spin|animate-pulse|transition-|duration-|ease-` returned ~100+ sites. The 6 most visible/perilous components, classified:

### 3.1 Spinner.tsx (L33) — **Pattern A**

- Site: `cn('rounded-full border-transparent animate-spin', sizeMap[size]!)`
- Why: the canonical loading primitive. Used in 30+ downstream sites. Fixing the source fixes everything downstream.
- Patch: `motion-safe:animate-spin`
- 30+ downstream sites inherit the fix transparently (test snapshots in `Spinner.test.tsx` will continue to find `.animate-spin` because `motion-safe:animate-spin` still compiles to `.animate-spin` in non-reduce builds — verify in CI).

### 3.2 Skeleton.tsx (L23) — **Pattern A**

- Site: `animation === 'pulse' && 'animate-pulse'`
- Why: full-page skeletons are vestibular-heavy. A 1.5s `shimmer` infinite is exactly what `prefers-reduced-motion` is for.
- Patch: `motion-safe:animate-pulse`
- Downstream: `KPICardEnhanced.tsx` L91–93 (3× `animate-pulse`), `DataLineagePage.tsx` L245, `GLUploadPage.tsx` L430 — all inherit the fix.

### 3.3 PresenceIndicator.tsx (L130) — **Pattern B**

- Site: `<span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />`
- Why: a _signal_ (someone is editing this row), not decoration. Reducing to a static green dot is semantically valid. Add `aria-label` (`"User is online"`) to compensate for the lost animation cue.
- Patch: `motion-reduce:animate-none` + `aria-label`

### 3.4 NLQChat.tsx (L286) + NLQChatPage.tsx (L503) — **Pattern B + text fallback**

- Site: `<Bot className="h-2.5 w-2.5 text-blue-400 animate-pulse" />`
- Why: a _signal_ that the AI is "thinking." Reducing it to a static bot icon is acceptable _only_ if paired with the `"AI is typing…"` text. Otherwise the user gets no cue.
- Patch: `motion-reduce:animate-none` + ensure adjacent text says `"AI is typing…"` (verify in DOM). If text is missing, escalate to T-HE-017 a11y.

### 3.5 Button.tsx (L12) — **Pattern A (transitions)**

- Site: `transition-colors`
- Why: hover-state color transition. Pattern C (global `transition-duration: 0.01ms !important`) already kills it. Pattern A is documentation-only.
- Patch: `motion-safe:transition-colors` (optional; Pattern C is sufficient).
- Decision: **leave as-is** — Pattern C is enough. This is the Honest Labeling call: not every site needs Pattern A.

### 3.6 GuidedTour.tsx (L107, plus 2 more) — **Pattern A + Pattern C**

- Site: `transition-all duration-300`, `animate-slide-up`
- Why: tour tooltips slide in from below. Vestibular-trigger for users on tour.
- Patch: `motion-safe:transition-all motion-safe:duration-300 motion-safe:animate-slide-up`
- Pattern C backs this up via global `transition-duration: 0.01ms !important`.

### 3.7 Sites that need NO change (Pattern C sufficient)

- `CopilotSidebar.tsx` L172 (`transition-transform duration-300`) — covered by Pattern C
- `ChatPanel.tsx` L93, L199 — `transition-transform`, `animate-spin`; spinner inherits Spinner fix
- `ContextMenu.tsx` L159 (`animate-in fade-in-0 zoom-in-95 duration-100`) — Pattern C; 100ms is below vestibular threshold
- `CurrencyInput.tsx` L90, L103 (`transition-all`, `transition-opacity`) — Pattern C
- `DataTable.tsx` ~10 `transition-colors` sites — Pattern C
- `DataGrid.tsx` 5+ `transition-colors` + `animate-spin` L477 (spinner inherits Spinner fix)
- `DriverSlider.tsx` L38, L70, L76 — Pattern C
- `AnomalyHighlight.tsx` L84 — Pattern C
- `MigrationWizard.tsx` L220, L445, L458 — spinners inherit; transitions Pattern C

---

## §4 Verify-Only Sites (Pattern C baseline verification)

The 3 global CSS rules are the backstop. Apollo's verification job:

1. `src/index.css:472–480` — verify it appears in compiled CSS bundle (`grep -c 'prefers-reduced-motion' dist/assets/*.css` should return ≥ 3).
2. `src/index.css:625–633` — same.
3. `src/styles/accessibility.css:47–54` — same; verify `scroll-behavior: auto !important` reaches `html` (test by setting reduce-motion and confirming `<html>` no longer has `scroll-behavior: smooth`).
4. Cross-check: no `transition-property` or `animation-name` override bypasses the global rule (i.e. no `@layer base { ... !important }` after the reduced-motion block).

TENTATIVE: I have not yet confirmed whether the global rule's `!important` outranks a hypothetical inline `style="animation: spin 1s linear infinite"`. Inline styles win specificity wars against `!important` in stylesheets only when not also `!important`. Apollo to verify in §5 step 4 above.

---

## §5 Apollo Implementation Order (5 steps, ~90 min wall-clock)

1. **Pattern C verify** (15 min): Run DevTools `prefers-reduced-motion: reduce` emulation across the 4 routes in §4 step 3. Document any failures. Fix Pattern C gaps by adding a 4th global rule if needed (consolidating the 3 existing into one canonical block in `accessibility.css`, removing the 2 duplicates in `index.css`).
2. **Spinner.tsx fix** (5 min): `animate-spin` → `motion-safe:animate-spin`. Run `Spinner.test.tsx` (4 tests). All should pass — Tailwind's `motion-safe:animate-spin` compiles to the same `animate-spin` class in non-reduce builds.
3. **Skeleton.tsx fix** (5 min): same. Skeleton snapshot tests use `.animate-pulse` query — should still resolve in non-reduce test env. If a test sets `prefers-reduced-motion: reduce`, add `motion-reduce:animate-none` to test setup to keep the static variant visible.
4. **PresenceIndicator.tsx fix** (10 min): Pattern B + `aria-label="User is online"`. Update `PresenceIndicator.test.tsx` (if any) to assert the `aria-label`.
5. **NLQChat.tsx + NLQChatPage.tsx fix** (15 min): Pattern B + verify adjacent `"AI is typing…"` text. If text is missing, add it. This crosses into T-HE-017 a11y territory — flag for cross-Muse handoff (§6).
6. **GuidedTour.tsx fix** (10 min): Pattern A triple (transition-all, duration-300, animate-slide-up).
7. **Pre-commit grep recipe** (5 min):
   ```bash
   # Find motion sites still missing the gate
   rg "animate-(spin|pulse|fade|slide|scale|bounce)" src/ \
     -l | xargs rg -L "motion-safe:|motion-reduce:"
   # Should return zero results post-implementation (modulo tests)
   ```
8. **CI gate** (15 min): add a Playwright test that sets `prefers-reduced-motion: reduce` at the context level, visits `/login`, and asserts the spinner is _not_ visibly rotating (check `getAnimations()` returns 0 on the spinner, or that `animation-duration` is ≤ 1ms).

Total: ~80 min implementation + 10 min buffer = 90 min.

---

## §6 Cross-Muse Handoffs

- **Apollo (T-HE-016 implementer)**: 6 files to patch (Spinner, Skeleton, PresenceIndicator, NLQChat, NLQChatPage, GuidedTour). Order from §5. CI gate recipe in §5 step 8.
- **Strategos (T-HE-018 design system guide v3)**: this spec becomes §11 of the v3 guide ("Motion-Reduce Patterns"). Three sub-sections: A (motion-safe wrap), B (motion-reduce override), C (global @media baseline). Reference table from §3.
- **Themis (WCAG compliance audit)**: T-HE-016 closes the 2.3.3 gap. The next `Themis audit cycle` can downgrade the 2.3.3 finding from "partial" to "passing" once Apollo lands the Spinner + Skeleton fixes (those are the most visible sites). Pattern B sites (Presence, NLQChat) are nice-to-have for 2.3.3 compliance, not strict requirement.
- **Mnemosyne (knowledge store)**: persist the 3-pattern framework (A: motion-safe, B: motion-reduce, C: global @media) as a reusable decision tree for any future motion-related component review.
- **Hephaestus (component impl)**: the Spinner.tsx fix in §5 step 2 is a 1-line change. Low-risk, high-reward. No new component needed; this is a className update.

---

## §7 Self-Assessment & Honest Labeling (D-007)

### 7.1 What I claim

- 3 global CSS rules exist (verified by Read at `index.css:472–480`, `index.css:625–633`, `accessibility.css:47–54`).
- 0 `motion-safe:` / `motion-reduce:` modifiers exist in `src/` (verified by Grep).
- 30+ `animate-spin` and 10+ `animate-pulse` sites exist (counted from Grep output above).
- 3-pattern framework (A/B/C) covers all observed motion types.

### 7.2 What I am uncertain about (TENTATIVE markers)

- Whether Pattern C's `!important` outranks hypothetical inline-style motion (likely yes, but unverified — Apollo to confirm in §5 step 4).
- Whether Spinner.tsx's `motion-safe:animate-spin` compiles to the same test selectors (likely yes, but unverified until `Spinner.test.tsx` runs in CI with no-reduce env).
- Whether `PresenceIndicator`'s static dot is semantically equivalent to the pulsing one for screen-reader users (likely yes, with `aria-label`, but unverified — Mnemosyne to consult accessibility research).

### 7.3 What I deliberately did NOT do

- Did not touch the 3 global CSS rules themselves (Apollo to consolidate in §5 step 1, not Hera).
- Did not patch the 30+ downstream `animate-spin` sites individually (Spinner.tsx fix propagates).
- Did not propose a new `useReducedMotion()` React hook (Tailwind's `motion-safe:` / `motion-reduce:` is sufficient and zero-JS).
- Did not propose user-toggleable motion settings in a UI (out of scope; respect OS preference only).

### 7.4 Size & scope flags

- **Size**: target ~250L, current 231L (D-007 honest: -7.6% under target, well within ±15% wiggle).
- **Scope**: 6 components classified, 6 components to patch (§5), 1 global CSS verification (§4), 1 CI gate (§5 step 8). Push-INDEPENDENT (docs + patches only, no runtime deploy).

### 7.5 Muse moments (transparency)

- **25th Honest Labeling Muse**: Pattern A is a _documentation_ mechanism (visible to grep audits), not a _runtime_ mechanism (Pattern C's `!important` overrides it). I caught this mid-draft and re-labeled the role of Pattern A in §2.1 and §2 Pattern C.
- **26th Honest Labeling Muse**: TENTATIVE markers in §1, §2 Pattern C, §4 are honest about what is unverified. I am naming 3 things Apollo must verify, not 3 things I have verified.

### 7.6 Cross-links

- T-HE-007 (motion patterns 224L): original motion design language
- T-HE-009 (motion tokens 11 tokens): the _what_; this spec is the _when-not_
- T-HE-012 (Tailwind config): `motion-safe` / `motion-reduce` come from Tailwind v3.3+ core, no extra config
- T-HE-013 v2 (Design System Contribution Guide 399L): will reference T-HE-016 in v3
- T-HE-014 v0.2 (Dark Mode Parity 214L): sister spec; same 3-pattern structure
- T-HE-017 (a11y deep-dive, next): receives NLQChat / PresenceIndicator text-fallback handoffs from §5 step 4
- T-HE-018 (Design System Guide v3, future): receives this spec as §11

---

**END T-HE-016 v0.1** — standing by for Lead review.
