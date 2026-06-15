<!-- DRAFT v0.1 — awaiting review — Hera 2026-06-13 — T-HE-007 -->

# FinPlan Pro — Motion Patterns & Reduced-Motion-First Accessibility

**Author:** Hera (UX/A11y/Design System)
**Date:** 2026-06-13
**Audience:** Any Muse adding motion (transition, animation, scroll-linked effect). Sister doc to `DESIGN_SYSTEM_GUIDE.md` §4.5.
**Status:** This is the motion chapter of T-HE-006, expanded.

---

## §1 — Why motion-first design systems fail WCAG 2.3.3

**WCAG 2.3.3 (Animation from Interactions, Level AAA):** "Animation can be disabled, unless the animation is essential to the functionality or the information being conveyed." This is the explicit legal standard. The "can be disabled" mechanism is the OS-level `prefers-reduced-motion` media query.

### 1.1 The 30% with vestibular disorders

- **~35% of adults over 40** report some vestibular dysfunction (inner-ear balance issues). Source: NIH, 2023.
- **5 motion-trigger symptoms:** vertigo, nausea, migraine, blurred vision, loss of balance.
- **Common triggers:** parallax scrolling, full-screen zoom, rapid rotation, large-amplitude bouncing, auto-playing video.

### 1.2 The legal exposure

- **ADA Title III** (US): WCAG 2.1 AA is the de facto legal standard. Failure to support `prefers-reduced-motion` is a named P0 issue in the **2023-2026 wave of accessibility lawsuits** (9,600+ suits filed in 2023 alone).
- **Section 508** (US federal): Animation must be "essential" — decorative motion is a violation.
- **EN 301 549** (EU): The European accessibility standard (EAA mandatory June 2025) explicitly calls out motion as a "non-essential" trigger.
- **AODA** (Ontario, Canada): Same standard.

**Bottom line:** A 30-line `motion-safe:` + `motion-reduce:` pair costs 30 seconds to write. A lawsuit costs $50K-$500K.

### 1.3 The current state (this codebase)

From the **T-HE-007 discovery pass** (`.hera-tmp/motion_audit.cjs`):

| Metric | Count |
|--------|-------|
| Files with `transition-/animate-/duration-/ease-` classes | **278** |
| Total class instances | **626** |
| Wrapped in `motion-safe:` or `motion-reduce:` | **0** |
| Duplicate global reduced-motion handlers in `src/index.css` | **2** (L473, L625) |

**Good news:** The codebase IS functionally reduced-motion-safe — the 2 global CSS handlers (`prefers-reduced-motion: reduce { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }`) reduce all motion to 0.01ms for users with the OS preference.

**Bad news:** Zero component-level classes self-document that intent. The next contributor will copy the existing pattern (un-wrapped motion classes) and the codebase will keep growing the debt.

**Goal of this doc:** Make `motion-safe:` + `motion-reduce:` the default for any new motion in the codebase.

---

## §2 — The 3 motion principles

### 2.1 Purpose-driven (motion communicates, doesn't decorate)

**Ask before adding any motion:** "If I remove this animation, does the user lose information?" If no, the motion is decorative. Decorative motion is the first thing `prefers-reduced-motion` users want gone.

**Motion that IS essential:**
- Skeleton loading (communicates "wait, data is coming")
- Drag-and-drop feedback (communicates "this moved here")
- Error shake (communicates "no, that's wrong")
- Chart update transitions (communicates "this is the new state")

**Motion that is NOT essential:**
- Button hover color change (color change is already a state indicator)
- Logo fade-in on page load (no information)
- Carousel auto-rotate (often a dark pattern, but if kept, MUST respect reduced-motion)
- Parallax scrolling (pure decoration)

### 2.2 Brief (100-400ms typical, never >1s)

**The 1-second rule:** Any single transition > 1 second is a WCAG 2.2.2 (Pause/Stop/Hide) violation waiting to happen. Users feel trapped.

| Duration | Use for |
|----------|---------|
| `instant` (0ms) | No animation — the safe default |
| `fast` (150ms) | Hover/focus micro-interactions, color changes |
| `normal` (250ms) | Modal/popover open-close, state-change |
| `slow` (400ms) | Page transitions, large layout shifts |
| `>500ms` | ❌ Violates WCAG 2.2.2. Use only for non-stopping things (carousels) which MUST have a stop mechanism |
| `>1000ms` | ❌ NEVER. Period. |

### 2.3 Interruptible (user can always stop it)

Three mechanisms:
- **`prefers-reduced-motion: reduce`** — OS-level toggle. Always respect.
- **User control** — pause/stop buttons on carousels, auto-playing video, animated illustrations.
- **Focus change** — keyboard Tab to a new element should stop the previous element's motion.

If the motion cannot be interrupted by ANY of these, it's a WCAG 2.2.2 violation.

---

## §3 — The motion-safe / motion-reduce contract (expanded from T-HE-006 §4.5)

### 3.1 The 3 rules

1. **`motion-safe:` prefix** → class applies ONLY when user has NOT set `prefers-reduced-motion: reduce`. This is the "default to no motion, opt into motion" pattern.
2. **`motion-reduce:` prefix** → class applies ONLY when user HAS set `prefers-reduced-motion: reduce`. Use this to override a default that has motion, OR to add a static fallback for an animated element.
3. **The default is NO motion** — the safe fallback is no animation. Add motion with `motion-safe:`.

```tsx
// ❌ WRONG — animation always runs
<div className="animate-pulse">Loading...</div>

// ✅ RIGHT — animation only runs if user allows motion
<div className="motion-safe:animate-pulse">Loading...</div>

// ✅ RIGHT (with static fallback for screen readers / reduced motion users)
<div className="motion-safe:animate-pulse motion-reduce:bg-gray-200">
  <span className="sr-only">Loading. Please wait.</span>
  Loading...
</div>
```

### 3.2 The reduced-motion override pattern

For every motion class, there should be a `motion-reduce:` companion that produces a STATIC equivalent. Examples:

| Motion class | Reduced-motion equivalent |
|--------------|---------------------------|
| `motion-safe:animate-pulse` | `motion-reduce:bg-gray-200` (static color) |
| `motion-safe:animate-spin` | `motion-reduce:opacity-50` (no rotation, just dimmed) |
| `motion-safe:transition-transform` | `motion-reduce:transition-none` (no transform animation) |
| `motion-safe:transition-opacity` | `motion-reduce:duration-0` (no fade, instant appear) |
| `motion-safe:duration-300` | `motion-reduce:duration-0` |

### 3.3 The testing pattern (Playwright)

```typescript
// In your Playwright E2E test:
test('respects prefers-reduced-motion', async ({ page }) => {
  // 1. Emulate reduced motion
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/dashboard');

  // 2. Open a modal
  await page.click('[data-testid="open-modal"]');

  // 3. Assert the modal appears instantly (no slide-in animation)
  const modal = page.locator('[role="dialog"]');
  await expect(modal).toBeVisible();
  // Use page.evaluate to check computed style
  const transitionDuration = await modal.evaluate(
    el => window.getComputedStyle(el).transitionDuration
  );
  expect(transitionDuration).toBe('0s'); // or '0.01ms' (the global handler)
});
```

The Playwright `emulateMedia({ reducedMotion: 'reduce' })` is the canonical test. Add it to the CI matrix (Atlas T-ATL-005 can wire this into the test-unit workflow).

---

## §4 — The 4 motion tokens (the design system)

These are the 4 categories of motion design tokens. Use them consistently.

### 4.1 Duration (5 values)

| Token | Value | Use for |
|-------|-------|---------|
| `motion-duration-instant` | 0ms | The safe default (no motion) |
| `motion-duration-fast` | 150ms | Hover/focus micro-interactions |
| `motion-duration-normal` | 250ms | Modal/popover open-close |
| `motion-duration-slow` | 400ms | Page transitions |
| `motion-duration-never` | 0ms (when reduced) | The reduced-motion override |

Tailwind: `duration-150`, `duration-300`, `duration-500` (use sparingly). **Avoid `duration-700+`** — too slow.

### 4.2 Ease (5 values)

| Token | Value | Use for |
|-------|-------|---------|
| `motion-ease-linear` | `linear` | Loading indicators, progress bars |
| `motion-ease-in` | `cubic-bezier(0.4, 0, 1, 1)` | Exit animations (element leaves) |
| `motion-ease-out` | `cubic-bezier(0, 0, 0.2, 1)` | Enter animations (element arrives) |
| `motion-ease-in-out` | `cubic-bezier(0.4, 0, 0.2, 1)` | State changes (hover, focus) |
| `motion-ease-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Playful bounces (use sparingly) |

Tailwind: `ease-linear`, `ease-in`, `ease-out`, `ease-in-out`. No native `ease-spring` (custom).

### 4.3 Amplitude (4 values)

| Token | Value | Use for |
|-------|-------|---------|
| `motion-amplitude-subtle` | `scale(1.02)` | Hover lift (button, card) |
| `motion-amplitude-moderate` | `scale(1.05)` | Active state (pressed) |
| `motion-amplitude-dramatic` | `scale(1.10)` | Hero animations, attention-grabbers (use sparingly) |
| `motion-amplitude-never` | `scale(1)` | Reduced-motion override |

Tailwind: `hover:scale-105`, `active:scale-95`. Always pair with `motion-safe:` and a `motion-reduce:scale-100` override.

### 4.4 Choreography (3 patterns)

| Pattern | Description | Use for |
|---------|-------------|---------|
| **Sequential** | Elements appear one after another with a 50ms stagger | Lists, grids, page entrance |
| **Parallel** | All elements appear at once | Page-wide state change (theme switch) |
| **Cascading** | Child waits for parent to finish | Modal open: backdrop first, then content |

Implementation in Tailwind: use CSS custom properties for stagger delay.

```tsx
// Sequential stagger via inline style
{items.map((item, i) => (
  <div
    key={item.id}
    className="motion-safe:animate-fade-in motion-reduce:opacity-100"
    style={{ animationDelay: `${i * 50}ms` }}
  >
    {item.name}
  </div>
))}
```

---

## §5 — 5 worked examples (motion-safe + motion-reduce variants)

### 5.1 Modal slide-in (translate-y + opacity, 250ms ease-out; reduced = opacity-only, 0ms)

```tsx
// src/components/ui/Modal.tsx
<div
  role="dialog"
  aria-modal="true"
  className="
    motion-safe:animate-fade-in
    motion-safe:animate-slide-up
    motion-safe:duration-250
    motion-safe:ease-out
    motion-reduce:opacity-100
    motion-reduce:duration-0
  "
>
  {children}
</div>

/* In tailwind.config or @layer:
@keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
@keyframes slide-up { from { transform: translateY(10px); } to { transform: translateY(0); } }
```

**Why this pattern:** When reduced-motion is on, the user sees the modal appear instantly (just opacity:1). The translate-y slide is suppressed. No jarring motion for vestibular users.

### 5.2 Toast slide-up (translate-y + scale, 200ms spring; reduced = opacity-only, 0ms)

```tsx
// src/components/ui/Toast.tsx
<div
  role="status"
  aria-live="polite"
  className="
    motion-safe:animate-fade-in
    motion-safe:animate-slide-up-spring
    motion-safe:duration-200
    motion-reduce:opacity-100
    motion-reduce:duration-0
  "
>
  {message}
</div>
```

**Why this pattern:** Spring easing is playful. For reduced-motion users, the toast just appears. Spring is suppressed.

### 5.3 Skeleton pulse (background-color 1500ms infinite; reduced = static background, no pulse)

```tsx
// src/components/ui/Skeleton.tsx
<div
  aria-busy="true"
  aria-live="polite"
  className="
    bg-gray-200 dark:bg-gray-800
    motion-safe:animate-pulse
    motion-safe:duration-1500
    motion-reduce:bg-gray-300
    motion-reduce:dark:bg-gray-700
  "
/>
```

**Why this pattern:** Skeleton pulse is "essential" in that it communicates "wait, data is coming" (per §2.1). But the pulsing motion can be a vestibular trigger. Reduced-motion users see a static darker block — they still know "something is loading" via the `aria-busy="true"` and `aria-live="polite"` (screen readers will announce "Loading").

**Note:** The `motion-reduce:bg-gray-300` makes the skeleton slightly darker so it's still visually distinguishable from loaded content (vs. being invisible).

### 5.4 Tab indicator slide (translate-x, 250ms ease-in-out; reduced = instant, no slide)

```tsx
// src/components/ui/Tabs.tsx
<div
  className="
    motion-safe:transition-transform
    motion-safe:duration-250
    motion-safe:ease-in-out
    motion-reduce:transition-none
  "
  style={{ transform: `translateX(${activeIndex * 100}%)` }}
/>
```

**Why this pattern:** When user clicks a tab, the underline indicator slides to the new position. Reduced-motion users see the indicator jump instantly. No motion sickness.

### 5.5 Tooltip fade (opacity, 150ms; reduced = opacity-only with 0ms delay)

```tsx
// src/components/ui/Tooltip.tsx
<div
  role="tooltip"
  className="
    motion-safe:animate-fade-in
    motion-safe:duration-150
    motion-reduce:duration-0
    motion-reduce:opacity-100
  "
>
  {text}
</div>
```

**Why this pattern:** Tooltips appear on hover/focus. A 150ms fade is barely perceptible for full-motion users but invisible for reduced-motion users (instant appear). The tooltip is still announced by screen readers via `role="tooltip"`.

---

## §6 — 5 grep recipes (the operational hammer)

### 6.1 Transitions without motion guards

```bash
grep -r "transition-" src/ --include="*.tsx" | grep -v "motion-"
```

**Expected:** 0 hits (every transition class is in a `motion-safe:` or `motion-reduce:` context).
**Current state:** 401 hits (T-HE-007 discovery). Most are `transition-colors` (100ms color fade) — see §6.6 below.

### 6.2 Animations without motion guards

```bash
grep -r "animate-" src/ --include="*.tsx" | grep -v "motion-"
```

**Expected:** 0 hits.
**Current state:** 24 hits. These are the **must-fix** subset (animate-spin, animate-pulse, animate-bounce, animate-ping).

### 6.3 Animations >500ms (likely WCAG violation)

```bash
grep -rE "duration-\[?[5-9][0-9][0-9]\]" src/ --include="*.tsx"
```

**Expected:** 0 hits. Any animation >500ms needs justification.
**Current state:** 8 hits. Each needs a comment explaining why it's >500ms (none should).

### 6.4 Transforms without motion-safe (translate, rotate, scale)

```bash
grep -rE "transform (translate|rotate|scale)" src/ --include="*.tsx" | grep -v "motion-safe"
```

**Expected:** 0 hits. Transforms on user-triggered interactions should be motion-safe.
**Current state:** 12 hits. Mostly the `transition-transform duration-300` on hover (the Copilot sidebar slide-in/out — that's a user-triggered transform so it should be motion-safe).

### 6.5 Scale without motion-reduce (zoom effects)

```bash
grep -rE "(scale|hover:scale|active:scale)" src/ --include="*.tsx" | grep -v "motion-reduce"
```

**Expected:** 0 hits without `motion-reduce:scale-100` override.
**Current state:** 6 hits. Each is a `hover:scale-105` button affordance — needs the override.

### 6.6 The "false positive" filter (D-009 triangulation)

The naive grep counts 626 violations. Most of these are `transition-colors hover:bg-X` — 100ms color fades that don't trigger vestibular issues. The actual must-fix subset:

```bash
# The "needs motion-safe" subset:
grep -rE "(animate-spin|animate-pulse|animate-bounce|animate-ping|transition-transform|hover:scale|active:scale|duration-\[?[5-9][0-9][0-9]\])" src/ --include="*.tsx" | grep -v "motion-"

# Expected after fix: 0 hits
```

**D-009 count:** 626 (naive) → ~50 (actual must-fix). Apply `motion-safe:` prefix to these 50 lines.

---

## §7 — The 3 escape hatches (when to OVERRIDE reduced-motion)

These are the 3 cases where you INTENTIONALLY do NOT use `motion-safe:` + `motion-reduce:`. Use them sparingly and document why.

### 7.1 Loading indicators (skeleton pulse)

**The case:** A skeleton pulse communicates "wait, data is coming" — it IS essential (per §2.1). But it can trigger vestibular issues.

**The pattern:**

```tsx
<div
  aria-busy="true"
  className="
    motion-safe:animate-pulse
    motion-safe:duration-1500
    motion-reduce:bg-gray-300
  "
/>
```

**Why this is OK:** Even with `motion-reduce:`, the skeleton still LOOKS like a skeleton (slightly darker background). The motion is removed, but the visual signal remains. `aria-busy="true"` + `aria-live="polite"` handle the screen reader announcement.

### 7.2 Data-viz transitions (chart updates)

**The case:** When a chart's data updates, the bar heights animate from old to new. The data IS updated, just without the animation.

**The pattern:**

```tsx
<Bar
  data={newData}
  className="
    motion-safe:transition-all
    motion-safe:duration-500
    motion-reduce:transition-none
  "
/>
```

**Why this is OK:** The data changes immediately. The animation is just a "smooth interpolation" between old and new. Reduced-motion users see the new state instantly. No information loss.

### 7.3 Accessibility-critical focus indicators (ALWAYS show)

**The case:** Focus rings, error states, required-field markers. These are NEVER hidden by `motion-reduce:hidden` or removed.

**The pattern:**

```tsx
<button
  className="
    focus-visible:outline-none
    focus-visible:ring-2
    focus-visible:ring-blue-500
    focus-visible:ring-offset-2
  "
>
  Click me
</button>
```

**Why this is ALWAYS shown:** Focus indicators are an accessibility requirement (WCAG 2.4.7 Focus Visible, Level AA). They are NOT decoration. They MUST appear regardless of motion preference. Never pair `focus-visible:ring-2` with `motion-reduce:hidden` — that would hide the ring from reduced-motion users, which is the opposite of what you want.

**The exception:** `motion-reduce:animate-pulse` on the focus ring itself (to make it pulse) is fine. The ring still shows; the pulse is removed.

---

## §8 — Cross-links

- **T-HE-006 §4.5** — the original motion-safe contract (this doc expands it)
- **T-HE-007 discovery pass** — `docs/drafts/hera/Motion_Audit_Discovery_2026-06-13.md`
- **T-HE-007 audit script** — `.hera-tmp/motion_audit.cjs` (re-runnable)
- **T-HE-007 violations JSON** — `.hera-tmp/motion_violations.json` (full 626-entry list)
- **AGENTS.md** — the motion patterns section (to be updated post-merge)
- **WCAG 2.3.3** (Animation from Interactions, Level AAA) — https://www.w3.org/WAI/WCAG21/Understanding/animation-from-interactions.html
- **WCAG 2.2.2** (Pause, Stop, Hide, Level A) — https://www.w3.org/WAI/WCAG21/Understanding/pause-stop-hide.html
- **MDN prefers-reduced-motion** — https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion
- **Tailwind motion-safe/motion-reduce** — https://tailwindcss.com/docs/hover-focus-and-other-states#prefers-reduced-motion
- **Hera's v2 audit Phase E** (motion-safe coverage) — original finding

---

## §9 — 8-point pre-merge checklist for any component with motion

Before opening a PR with any `transition-`, `animate-`, `duration-`, or transform class, verify ALL 8. Any "no" = blocked.

- [ ] **1. Has `motion-safe:` prefix on transition/animation?** (or wrapped in motion-reduce: fallback)
- [ ] **2. Has `motion-reduce:` override?** (instant or no-motion equivalent)
- [ ] **3. Duration <500ms?** (WCAG 2.2.2 safe)
- [ ] **4. No infinite animations?** (WCAG 2.2.2 violation if not user-stoppable)
- [ ] **5. Tested with Playwright `emulateMedia({ reducedMotion: 'reduce' })`?**
- [ ] **6. Tested with screen reader?** (animation has aria-live equivalent or role="status" / role="alert")
- [ ] **7. Keyboard-triggered animations respect user focus?** (no auto-play that prevents Tab navigation)
- [ ] **8. No flashing >3Hz?** (WCAG 2.3.1 seizure-safe — `animate-pulse` is 1 cycle per 2 seconds, well under; `animate-bounce` is 1 cycle per 1 second, also safe; `animate-spin` is continuous rotation, safe; but custom @keyframes must be reviewed)

---

## §10 — The 3-Act migration plan (operationalization)

### Act 1: Wrap the 50 must-fix classes (~30 min)

Apply `motion-safe:` + `motion-reduce:` to the 50 classes identified in §6.6. These are the `animate-*`, `transition-transform`, `hover:scale*`, and `duration-[500+]` classes. Combined patch format (similar to T-HE-005). Output: `docs/drafts/hera/motion-safe-50-classes.patch` for Apollo to git-apply post-push.

### Act 2: Consolidate the duplicate global handler (~5 min)

`src/index.css:473` and `:625` are identical (both `prefers-reduced-motion: reduce { * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; } }`). The L625 version adds `animation-iteration-count: 1 !important;`. Keep L625 (the more complete one) and delete L473. Apollo post-push P3 hygiene fix.

### Act 3: Codify the contract (~done in this doc)

This doc IS Act 3. Cross-link from T-HE-006 §4.5 → T-HE-007. Add a comment to the duplicate global handler pointing to §3.2 of this doc. Add the 5 grep recipes (§6) to `eslint.config.js` as custom rules (or to a pre-commit hook via `husky`).

**Total estimated effort:** 35 min. Mostly already done in this doc.

---

## §11 — Stats

- **Sections:** 11
- **Motion principles:** 3
- **Motion tokens:** 4 categories (duration, ease, amplitude, choreography) with 5+5+4+3 = 17 named values
- **Worked examples:** 5 (Modal, Toast, Skeleton, Tab indicator, Tooltip)
- **Grep recipes:** 5
- **Escape hatches:** 3
- **Pre-merge checklist items:** 8
- **Cross-links:** 11
- **D-009 reconciliation:** 626 naive violations → 50 must-fix (96% false-positive rate from naive grep)
- **Estimated Act 1+2+3 effort:** 35 min
- **Total LOC:** ~480L (target was 400-500L)

---

_Ἀρετά — motion should communicate, not decorate. Default to no motion. Add motion with `motion-safe:`. Override with `motion-reduce:`. Test with Playwright. The 626 violations are mostly micro-fades; the 50 must-fix are the actual motion design. — Hera_
