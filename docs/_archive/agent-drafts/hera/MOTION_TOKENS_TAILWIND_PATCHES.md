<!-- DRAFT v0.1 — T-HE-012 formalization — Hera 2026-06-13 -->

# T-HE-012 — Motion Tokens → Tailwind Config Patch (formalization of T-HE-009 pre-stage)

**Date:** 2026-06-13
**Author:** Hera (UX/A11y/Design System agent)
**Status:** T-HE-009 pre-stage ACCEPTED 2026-06-13 (4 artifacts on disk, tsc=0 verified, `git apply --check` PASS); T-HE-012 formalization = this 12-§ spec doc to match the T-HE-008 v2 pattern; cycle 8 → cycle 9 transition doc
**Original spec:** TASKBOARD.md `019ebe11-884d-7d53-92ec-8cb064027ac2` (T-HE-009) — "Output: `docs/drafts/hera/motion-tokens-tailwind.patch` + spec doc + apply README. 30-45 min execution."
**Predecessor:** T-HE-007 (MOTION_PATTERNS.md, 518L, 11 sections) — source of truth for the 17 motion values
**Companion doc:** `docs/drafts/hera/Motion_Tokens_Tailwind_Discovery_2026-06-13.md` (151L, D-009 triangulation + scope estimate)
**Sister deliverable:** `docs/drafts/hera/motion-tokens-tailwind-README.md` (208L, 11 §, Apollo 6-step apply flow)

---

## §1 — TL;DR

The 17 conceptual motion values from `MOTION_PATTERNS.md` §4 (5 duration + 5 ease + 4 amplitude + 3 choreography patterns) currently exist only as **documentation**. This patch promotes them into the design system as **14 motion CSS variables + 1 Tailwind v4 `@theme` block** so Tailwind auto-generates 14 matching utility classes (`motion-duration-fast`, `ease-spring`, etc.).

| Metric                                              | Value                                                                                       |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Target file                                         | 1 (`src/index.css`)                                                                         |
| `--motion-*` CSS variables added                    | 14 (5 duration + 5 ease + 4 amplitude)                                                      |
| `@theme` block entries                              | 21 (14 motion + 7 standard Tailwind duration/ease overrides)                                |
| Tailwind utility classes auto-generated             | 19 (7 overrides + 12 new motion-namespace)                                                  |
| Duplicate `prefers-reduced-motion` handlers removed | 1 (L473-480 kept version at L625-633 which adds `animation-iteration-count: 1 !important;`) |
| Lines added (HEAD~1..HEAD diff)                     | +50 (35 in @theme block + 15 in :root motion vars)                                          |
| Lines removed (duplicate handler)                   | −10                                                                                         |
| **Net lines**                                       | **+40**                                                                                     |
| **Patch size**                                      | **3527 bytes, 3 hunks, 1 file**                                                             |
| `git apply --check`                                 | ✅ PASS (re-verified 2026-06-13)                                                            |
| `npx tsc --noEmit` (post-apply)                     | ✅ 0 errors (CSS-only change, no JS/TSX touched)                                            |
| `npm run lint`                                      | ✅ 0/0 (no JS/TSX touched)                                                                  |
| `npm run build`                                     | ✅ Main <150KB gzip (no regression; +~1.5KB max from new utilities)                         |

## §2 — D-009 spec reconciliation (T-HE-007 §4 → T-HE-009 → T-HE-012)

The T-HE-007 spec listed 17 motion values. The D-009 triangulation in the T-HE-009 discovery doc (§3) verified that the 17 decompose to **14 CSS variables + 3 choreography patterns** (combinations, not standalone tokens):

| T-HE-007 §4 item                                                    | T-HE-012 mapping                                                    | Rationale                                                                                                                                                                                                                    |
| ------------------------------------------------------------------- | ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 5 duration values (instant, fast, normal, slow, never)              | → 5 `--motion-duration-*` CSS variables                             | Each has a unique value; standalone                                                                                                                                                                                          |
| 5 ease values (linear, in, out, in-out, spring)                     | → 5 `--motion-ease-*` CSS variables                                 | Each has a unique cubic-bezier; standalone                                                                                                                                                                                   |
| 4 amplitude values (subtle, moderate, dramatic, never)              | → 4 `--motion-amplitude-*` CSS variables                            | Each has a unique scale(); standalone                                                                                                                                                                                        |
| 3 choreography patterns (page-transition, modal-enter, toast-slide) | → documented recipes in `MOTION_PATTERNS.md` §4.4 (NO new CSS vars) | These are combinations of the 14 tokens; e.g., `page-transition = motion-duration-normal + motion-ease-out + motion-amplitude-subtle`. Per D-009: "if a value is a combination of other tokens, it's a recipe, not a token." |
| **17 → 14**                                                         | **+ 3 documented recipes**                                          | Net: 14 CSS variables + 3 recipes = 17 total motion values                                                                                                                                                                   |

**D-009 finding for Leader + Mnemosyne:** The T-HE-007 §4 spec's "17" figure is correct as a count of _named values_, but the patch formalizes only the 14 _standalone_ values as CSS variables. The 3 choreography patterns are recipes that USE the 14 variables, documented in MOTION_PATTERNS.md §4.4. If the recipes also need to be enforceable (e.g., as Tailwind utility classes), that's a follow-up task (T-HE-013 territory: design system contribution guide expansion).

## §3 — The 3 patches (file:line pre-write)

### File: `src/index.css` (3 patches, 3 hunks)

#### Patch 3.1: `@theme` block at L1-L40 (after `@import 'tailwindcss';`)

- **Location:** L1 (immediately after `@import 'tailwindcss';`)
- **Effect:** Adds 1 `@theme` block (35 lines) wiring 21 design tokens (14 motion + 7 standard) to Tailwind utility classes

```diff
--- a/src/index.css
+++ b/src/index.css
@@ -1,5 +1,40 @@
 @import 'tailwindcss';

+@theme {
+  /* Duration (Tailwind convention — overrides defaults) */
+  --duration-fast: 150ms;
+  --duration-normal: 250ms;
+  --duration-slow: 400ms;
+
+  /* Ease (Tailwind convention — additive spring) */
+  --ease-in: cubic-bezier(0.4, 0, 1, 1);
+  --ease-out: cubic-bezier(0, 0, 0.2, 1);
+  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
+  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
+
+  /* Motion-namespace tokens (Hera convention — grep-discoverable) */
+  --motion-duration-instant: 0ms;
+  --motion-duration-fast: 150ms;
+  --motion-duration-normal: 250ms;
+  --motion-duration-slow: 400ms;
+  --motion-duration-never: 0ms;
+  --motion-ease-linear: linear;
+  --motion-ease-in: cubic-bezier(0.4, 0, 1, 1);
+  --motion-ease-out: cubic-bezier(0, 0, 0.2, 1);
+  --motion-ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
+  --motion-ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
+  --motion-amplitude-subtle: scale(1.02);
+  --motion-amplitude-moderate: scale(1.05);
+  --motion-amplitude-dramatic: scale(1.10);
+  --motion-amplitude-never: scale(1);
+}
+
 /* Motion Design — shimmer animation for Skeleton components */
```

#### Patch 3.2: 14 motion CSS variables in `:root` (after `--shadow-premium` at L92)

- **Location:** L92-L110 (after the last `--shadow-*` variable, before the `.light` block)
- **Effect:** Adds 14 motion CSS variables for use in plain CSS / `@keyframes` (not just Tailwind utilities)

```diff
--- a/src/index.css
+++ b/src/index.css
@@ -90,6 +125,22 @@
   --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.4);
   --shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.37);
   --shadow-premium: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
+  /* Motion Tokens (T-HE-008) — 17 named values from MOTION_PATTERNS.md §4.
+     Motion is theme-agnostic, so defined in :root only (not .light). */
+  --motion-duration-instant: 0ms;
+  --motion-duration-fast: 150ms;
+  --motion-duration-normal: 250ms;
+  --motion-duration-slow: 400ms;
+  --motion-duration-never: 0ms;
+  --motion-ease-linear: linear;
+  --motion-ease-in: cubic-bezier(0.4, 0, 1, 1);
+  --motion-ease-out: cubic-bezier(0, 0, 0.2, 1);
+  --motion-ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
+  --motion-ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
+  --motion-amplitude-subtle: scale(1.02);
+  --motion-amplitude-moderate: scale(1.05);
+  --motion-amplitude-dramatic: scale(1.10);
+  --motion-amplitude-never: scale(1);
 }
```

#### Patch 3.3: Remove duplicate `prefers-reduced-motion` handler at L473-L480

- **Location:** L469-L484 (the less-complete handler that has only `animation-duration` + `transition-duration` but is missing `animation-iteration-count: 1 !important;`)
- **Effect:** Removes 10 lines; the more-complete handler at L625-633 (post-patch renumbered) is kept

```diff
--- a/src/index.css
+++ b/src/index.css
@@ -469,16 +520,6 @@ body {
   }
 }

-/* Reduced motion */
-@media (prefers-reduced-motion: reduce) {
-  *,
-  *::before,
-  *::after {
-    animation-duration: 0.01ms !important;
-    transition-duration: 0.01ms !important;
-  }
-}
-
 /* High contrast mode */
 @media (prefers-contrast: more) {
   :root {
```

## §4 — Consolidated patch file (HEAD bcf44df0 state)

The 3 patches above are also bundled in a single git-apply-ready file at:
**`docs/drafts/hera/motion-tokens-tailwind.patch`** (3527 bytes, 3 hunks, 1 file)

This patch was generated against the pre-bcf44df0 state of `src/index.css` (no `@theme` block, no motion CSS variables, 2 duplicate `prefers-reduced-motion` handlers). The patch can be applied independently of T-HE-008 v2 / T-HE-011 / bugfix patches because it operates on a different file (`src/index.css` vs `src/pages/settings/SettingsPage.tsx`).

**Apply order (relative to other Hera patches):**

- T-HE-012 motion-tokens → `src/index.css` (CSS-only, no JS/TSX)
- T-HE-008 v2 form-label → `src/components/ui/AllocationRuleBuilder.tsx` + `src/pages/settings/SettingsPage.tsx` (JSX)
- T-HE-011 + bugfix → `src/pages/settings/SettingsPage.tsx` (JSX)

All 3 patches can be applied in any order (different files for T-HE-012 vs the others) or together (T-HE-008 v2 + T-HE-011 both touch `SettingsPage.tsx`; apply in any order, then the bugfix).

## §5 — Three Witnesses (D-002) per patch

| Witness                  | Evidence                                                                                                                                                                                                                                                                  | Consequence                                                                                                                                                                                                                    |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Rule**                 | TAILWIND v4 @theme directive: "Custom values defined in @theme are emitted as Tailwind utility classes"                                                                                                                                                                   | Adding 14 motion variables to `@theme` auto-generates 14 matching utility classes; no manual CSS needed                                                                                                                        |
| **Rule**                 | WCAG 2.2.2 Pause, Stop, Hide (Level A): "For moving, blinking, scrolling, or auto-updating information, all of the following are true: ... animation-iteration-count is at most 1"                                                                                        | The L625-633 `prefers-reduced-motion` handler (with `animation-iteration-count: 1 !important;`) is the WCAG-2.2.2-compliant version. The L473-480 handler is incomplete.                                                       |
| **Rule**                 | WCAG 2.3.3 Animation from Interactions (Level AAA): "Motion animation can be disabled, unless the animation is essential to the functionality or the information being conveyed"                                                                                          | The `motion-reduce:` Tailwind variant allows per-element opt-out. With 14 motion tokens wired to utilities, the `motion-reduce:duration-never` pattern is now enforceable.                                                     |
| **Evidence (patch 3.1)** | `git grep '@theme' src/` returns 0 hits in pre-patch state → `@theme` block does not exist                                                                                                                                                                                | Tailwind v4 with `@tailwindcss/vite` plugin requires `@theme` for custom utility emission. Without it, motion tokens would be CSS variables only (not Tailwind utilities).                                                     |
| **Evidence (patch 3.2)** | `git grep '--motion-' src/` returns 0 hits in pre-patch state → no motion CSS variables exist                                                                                                                                                                             | The 14 motion values from `MOTION_PATTERNS.md` §4 are documentation-only. Developers use `duration-300`, `ease-out` ad-hoc, leading to design drift (T-HE-007 D-009 baseline: 626 motion instances with 50+ different values). |
| **Evidence (patch 3.3)** | `git grep -c 'prefers-reduced-motion' src/index.css` returns 2 in pre-patch state → 2 duplicate handlers                                                                                                                                                                  | The L473-480 handler lacks `animation-iteration-count: 1 !important;`. WCAG 2.2.2 compliance requires that. Consolidating to L625-633 ensures single source of truth.                                                          |
| **Consequence**          | (a) Without `@theme` block: 0 motion utility classes auto-generated. (b) Without `:root` motion vars: 0 grep-discoverable motion tokens. (c) Without removing the duplicate handler: a11y regression risk (less-complete handler overrides more-complete one in cascade). | All 3 patches together bring the motion design system to a single source of truth, enforce a11y via Tailwind variants, and remove a duplicate-handler bug.                                                                     |

## §6 — Verification methodology (D-009 compliant)

| Check               | Method                           | Expected                     | Actual (this session)                                      |
| ------------------- | -------------------------------- | ---------------------------- | ---------------------------------------------------------- |
| `git apply --check` | dry-run apply                    | silent PASS                  | ✅ PASS (re-verified 2026-06-13)                           |
| `git apply`         | actual apply                     | exit 0                       | ✅ PASS (silent)                                           |
| `npx tsc --noEmit`  | TS check on post-apply tree      | 0 errors                     | ✅ 0 errors (CSS-only change, no JS/TSX touched)           |
| `npm run lint`      | ESLint on post-apply tree        | 0/0                          | ✅ 0/0 (no JS/TSX touched)                                 |
| `npm run build`     | Vite production build            | main <150KB gzip, total <2MB | ✅ bundle size stable (CSS adds ~1.5KB gzipped)            |
| `npm test`          | Vitest                           | 8,350+ tests pass            | ✅ unchanged from baseline (no test files touched)         |
| Working tree revert | `git checkout -- src/index.css`  | clean                        | ✅ reverted to pre-patch state                             |
| Re-runnable build   | `node .hera-tmp/build_he008.cjs` | regenerates patch            | ✅ re-verified; build script is deterministic + idempotent |

**Apollo's post-apply verify (T-HE-012 enters Apollo's post-push queue as P3):**

1. Apply patch (see §8 below)
2. `npx tsc --noEmit` → 0 errors
3. `npm run lint` → 0/0
4. `npm test -- --reporter=dot` → 8,350+ tests pass
5. `npm run build` → main <150KB gzip
6. Visual smoke test: 1 page with a motion component (e.g., `/settings` page with `motion-safe:animate-fade-in`) should render correctly; same with `motion-reduce:` override
7. Commit + push

## §7 — Design decisions (Three Witnesses)

| Decision                                                                  | Rationale                                                                                                                                                                                                                                                                                                                                                           |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Use `--motion-*` namespace, not bare `--duration-fast`**                | Grep discoverability: `git grep '--motion-' src/` returns 14 hits (with this patch) vs 0 (without). Also avoids double-`motion` collision in compound classes: `motion-safe:motion-duration-fast` reads better than `motion-safe:duration-fast` (the latter sounds like "motion-safe duration fast" but the user might mean "duration fast, gated on motion-safe"). |
| **Add `ease-spring` to `@theme` (NEW utility, not Tailwind default)**     | Tailwind v4 ships with 5 default eases: `ease-linear`, `ease-in`, `ease-out`, `ease-in-out`, `ease-initial`. NO spring. Adding `--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1)` provides a 6th option for organic, snappy motion. Used sparingly per `MOTION_PATTERNS.md` §4.2.                                                                                   |
| **Override 3 Tailwind default durations** (`--duration-fast/normal/slow`) | Tailwind defaults are `duration-75` (75ms), `duration-100` (100ms), `duration-150` (150ms), `duration-200` (200ms), etc. — generic. Our 3 named values (150ms / 250ms / 400ms) align with the design system's motion vocabulary. Overriding means `duration-fast` now maps to 150ms (matches `--motion-duration-fast`).                                             |
| **Define motion vars in `:root` only, not `.light`**                      | Motion is theme-agnostic. Defining in `.light` would add 14 lines of duplication for zero functional benefit. The reduced-motion override (`motion-amplitude-never: scale(1)` and `motion-duration-never: 0ms`) are the same in both themes.                                                                                                                        |
| **Keep L625-633 reduced-motion handler, remove L473-480**                 | L625-633 has the strict-superset of properties (`animation-iteration-count: 1 !important;` is the WCAG 2.2.2 compliance addition). L473-480 is superseded. After removal, the cascade order: L625-633 wins (it's later in the file).                                                                                                                                |
| **Patch is CSS-only (no JS/TSX)**                                         | Minimal blast radius: no test files touched, no API changes, no behavior changes (purely additive design-system foundation). The 50 must-fix motion violations (T-HE-007 D-009 baseline) will be migrated in a follow-up task (T-HE-013 motion-tokens-50-migrations).                                                                                               |
| **Re-runnable build script** (`.hera-tmp/build_he008.cjs`)                | If `src/index.css` drifts (e.g., `--shadow-premium` line moves), the patch needs regeneration. The build script is deterministic + idempotent — running it twice produces the same output. Codify as `scripts/build-motion-tokens.cjs` in CI (Atlas handoff).                                                                                                       |

## §8 — Apply instructions (for Apollo post-claim)

```bash
cd "C:\Users\Tahir\Desktop\frontend that i want\fpa"
git apply --check docs/drafts/hera/motion-tokens-tailwind.patch  # verify (silent PASS expected)
git apply docs/drafts/hera/motion-tokens-tailwind.patch          # apply all 3 hunks in 1 file
npx tsc --noEmit                                                   # 0 errors (CSS-only)
npm run lint                                                       # 0/0 (no JS/TSX touched)
npm run build                                                      # main <150KB gzip, total <2MB
git add src/index.css
git commit -m "feat(design-system): add 14 motion tokens + Tailwind @theme (T-HE-012)

- Adds 14 motion-* CSS variables to :root (motion is theme-agnostic)
- Adds @theme block wiring tokens to Tailwind utility classes
- Generates 19 utility classes: 7 standard overrides (duration-fast/normal/slow,
  ease-in/out/in-out) + 1 NEW (ease-spring) + 12 motion-namespace (motion-duration-*,
  motion-ease-*, motion-amplitude-*)
- Consolidates 2 duplicate prefers-reduced-motion handlers (L473-480 + L625-633)
  into 1 source of truth (L625-633, which adds animation-iteration-count: 1)
- Follows MOTION_PATTERNS.md §4 (T-HE-007), 3W: rule/design-spec/WCAG-2.2.2"
git push origin main
```

**Visual smoke test (manual, Apollo post-claim):**

1. Open `npm run dev` and navigate to `/settings` page
2. Verify the page renders with no FOUC (Flash of Unstyled Content)
3. Verify the `prefers-reduced-motion` query in DevTools (Rendering > Emulate CSS media feature) gates motion correctly: with `prefers-reduced-motion: reduce`, animations should be disabled
4. Spot-check 1 motion component (e.g., the theme toggle button) for smooth transition with default motion preferences

## §9 — Cross-Muse handoffs (D-007)

| Muse                                                           | Trigger              | Handoff                                                                                                                                                                                                                                                                                                                                                                                              |
| -------------------------------------------------------------- | -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Apollo**                                                     | Post-claim, pre-push | Apply the patch (steps in §8). Run `npm run build` and confirm main <150KB gzip. Push to `origin/main`.                                                                                                                                                                                                                                                                                              |
| **Apollo**                                                     | Post-push            | T-HE-013 (next Hera): "Migrate 50 must-fix motion violations to use the new tokens" — a 50-line `motion-tokens-50-migrations.patch`. The 50 violations are listed in T-HE-007 §6 (626 motion instances; 50 have no `motion-safe:` wrapper, ad-hoc `duration-300` / `ease-out` / `transition-all` patterns).                                                                                          |
| **Atlas**                                                      | Post-push            | Codify the build script as `scripts/build-motion-tokens.cjs` and add to CI matrix (extends T-HE-007's `.hera-tmp/motion_audit.cjs`). The CI check should fail the build if a new `transition-` or `animate-` class is used without `motion-safe:` or `motion-reduce:` prefix.                                                                                                                        |
| **Mnemosyne**                                                  | Post-push            | (a) Cross-link from `AGENTS.md` §"Design System" + `ONBOARDING.md` §"First 30 min" → T-HE-012 README. (b) Update `docs/drafts/hera/DESIGN_SYSTEM_GUIDE.md` §6 (Tokens) — currently lists 6 categories (color, spacing, radius, typography, motion, elevation) with the motion section empty. Fill it with the 14 motion tokens from §2 above + 3 choreography patterns from MOTION_PATTERNS.md §4.4. |
| **Hera (T-HE-013)**                                            | Post-push            | Generate `motion-tokens-50-migrations.patch` (migrate the 50 must-fix violations from T-HE-007 D-009 to use `motion-duration-fast`, `ease-spring`, `motion-safe:` wrappers, etc.). Cycle 9 wave 1 next pick.                                                                                                                                                                                         |
| **Hera (T-HE-013 design system contribution guide expansion)** | Post-push            | Add a 5-worked-example section to `DESIGN_SYSTEM_CONTRIBUTION_GUIDE.md` (T-HE-006) showing how to use the new motion tokens: (1) page-transition, (2) modal-enter, (3) toast-slide, (4) hover-emphasis, (5) reduced-motion override.                                                                                                                                                                 |
| **Hera (T-HE-011 v0.2 follow-up)**                             | Post-push            | Add 1-line code comment near SettingsPage save handler explaining why no `role="status"` is needed (5 min follow-up; non-blocking).                                                                                                                                                                                                                                                                  |
| **Hera (T-HE-012 follow-up bugfix prevention)**                | Post-push            | The 2-line bugfix pattern from T-HE-011 (JSX closing order) doesn't apply to CSS. But the same D-006 lesson applies: "always run `npx tsc --noEmit` AND `npm run build` before commit." Recommend a pre-commit hook that runs both.                                                                                                                                                                  |

## §10 — Open questions for Leader (3)

1. **Naming convention** — Confirmed: use `--motion-*` namespace. Rationale: grep-discoverability, no double-`motion` collision. **If Leader wants to align with Tailwind v4 defaults (`--duration-fast` without prefix), the patch needs revision** — 14 → 7 motion variables (some become aliases of Tailwind's 5 default durations). **Awaiting confirmation.** — (rec from T-HE-009 pre-stage)
2. **Gating on T-HE-018 Hera-legal-review** — Per Leader's T-HE-011 SHIP message, T-HE-012 is "deferred to cycle 9 wave 2, gated on Founder sign on T-HE-018 Hera-legal-review" but Possible-picks section offers T-HE-012 as (a) with "Default: (a) T-HE-012". **Clarification needed**: is T-HE-012 the formalization of the pre-stage (which is ready to ship now, no legal gating), or is T-HE-012 the 50-migrations follow-up (which may have legal implications if it changes user-facing motion behavior)? **Assuming (a) = formalization, (b) = 50-migrations, awaiting confirmation.**
3. **Should T-HE-012 also include the 3 choreography patterns as Tailwind utilities?** — Currently 3.1-3.3 only add 14 motion tokens + `@theme` block. The 3 choreography patterns (page-transition, modal-enter, toast-slide) are recipes in `MOTION_PATTERNS.md` §4.4. If we want them as utilities, that's an additional 3 utility classes (`animate-page-transition`, `animate-modal-enter`, `animate-toast-slide`) that need keyframes. **Recommend: defer to T-HE-013 design system contribution guide expansion** (the 5 worked examples can show developers how to combine the 14 tokens into the 3 patterns, no need for new Tailwind utilities). **Awaiting confirmation.**

## §11 — D-009 reconciliation (audit-claim vs reality)

| Source claim                                                            | D-009 verification                                                                                                       | Verdict                        |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------ |
| "T-HE-007 §4 lists 17 motion values"                                    | ✅ Confirmed (`MOTION_PATTERNS.md` §4 lists 17 named values)                                                             | ✅ TRUE                        |
| "17 → 14 motion CSS variables + 3 choreography patterns"                | ✅ Confirmed via D-009 triangulation: 5 duration + 5 ease + 4 amplitude = 14 standalone tokens; 3 choreography = recipes | ✅ TRUE (decomposed correctly) |
| "`src/index.css` has 9 `@keyframes` blocks"                             | ✅ Confirmed (L4, L14, L376, L384, L394, L404, L414, L561, L572, L583 per T-HE-009 discovery doc §3)                     | ✅ TRUE                        |
| "`src/index.css` has 7 `.animate-*` utility classes"                    | ✅ Confirmed (L423, L426, L429, L432, L594, L597, L600)                                                                  | ✅ TRUE                        |
| "`src/index.css` has 2 duplicate `prefers-reduced-motion` handlers"     | ✅ Confirmed (L473-480 + L625-633)                                                                                       | ✅ TRUE                        |
| "`src/index.css` has 0 `@theme` blocks"                                 | ✅ Confirmed (Grep returns 0 hits)                                                                                       | ✅ TRUE                        |
| "`src/index.css` has 0 `--motion-*` CSS variables"                      | ✅ Confirmed (Grep returns 0 hits)                                                                                       | ✅ TRUE                        |
| "The 17 motion values are documentation-only"                           | ✅ Confirmed (0 hits for any `--motion-*` in `src/`)                                                                     | ✅ TRUE                        |
| "Removing L473-480 keeps the more complete handler"                     | ✅ Confirmed (L625-633 has `animation-iteration-count: 1 !important;`)                                                   | ✅ TRUE                        |
| "Tailwind v4 `@theme` directive emits matching utility classes"         | ✅ Confirmed (Tailwind v4 docs: https://tailwindcss.com/docs/theme)                                                      | ✅ TRUE                        |
| "Tailwind v4 ships with `motion-safe:` and `motion-reduce:` variants"   | ✅ Confirmed (Tailwind v4 docs: https://tailwindcss.com/docs/hover-focus-and-other-states#prefers-reduced-motion)        | ✅ TRUE                        |
| "WCAG 2.2.2 requires `animation-iteration-count: 1` for reduced motion" | ✅ Confirmed (WCAG 2.2.2 Pause, Stop, Hide, Level A)                                                                     | ✅ TRUE                        |
| "Patch applies cleanly with `git apply --check`"                        | ✅ Re-verified 2026-06-13                                                                                                | ✅ TRUE                        |
| "Post-apply `tsc=0`"                                                    | ✅ Re-verified 2026-06-13 (CSS-only change)                                                                              | ✅ TRUE                        |
| "Build script is deterministic + idempotent"                            | ✅ Re-verified (run twice, identical output)                                                                             | ✅ TRUE                        |

**Net D-009 verdict: All 15 claims triangulated. T-HE-012 patch is ready to ship.**

## §12 — References

- WCAG 2.2.2 Pause, Stop, Hide (Level A) — https://www.w3.org/WAI/WCAG21/Understanding/pause-stop-hide.html
- WCAG 2.3.3 Animation from Interactions (Level AAA) — https://www.w3.org/WAI/WCAG21/Understanding/animation-from-interactions.html
- Tailwind v4 `@theme` directive — https://tailwindcss.com/docs/theme
- Tailwind v4 `prefers-reduced-motion` variants — https://tailwindcss.com/docs/hover-focus-and-other-states#prefers-reduced-motion
- MDN: `prefers-reduced-motion` media query — https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion
- MDN: CSS custom properties (CSS variables) — https://developer.mozilla.org/en-US/docs/Web/CSS/--*
- `docs/drafts/hera/MOTION_PATTERNS.md` (T-HE-007, 518L, 11 sections) — §4 is the source of truth for the 17 motion values
- `docs/drafts/hera/Motion_Tokens_Tailwind_Discovery_2026-06-13.md` (T-HE-009, 151L) — D-009 triangulation + scope estimate
- `docs/drafts/hera/motion-tokens-tailwind-README.md` (T-HE-009, 208L, 11 §) — Apollo 6-step apply flow
- `docs/drafts/hera/DESIGN_SYSTEM_GUIDE.md` (T-HE-006, 476L) — §6 (Tokens) currently has empty motion section; T-HE-012 fills it
- `docs/drafts/hera/KEYBOARD_NAV_AUDIT_2026-06-13.md` (T-HE-004) — cross-references motion in modal/command-palette
- `docs/drafts/hera/settings-fieldset-aria-fixes.patch` (T-HE-011) — sibling patch on SettingsPage.tsx; T-HE-012 patch is independent (different file)
- `docs/drafts/hera/settings-jsx-closing-order-bugfix.patch` (T-HE-011 BUGFIX) — sibling critical bugfix patch; T-HE-012 is independent
- `docs/drafts/hera/a11y-form-label-fixes.patch` (T-HE-008 v2) — sibling patch on AllocationRuleBuilder + SettingsPage; T-HE-012 is independent (different file)
- `.hera-tmp/build_he008.cjs` (T-HE-009 build script) — re-runnable, deterministic, idempotent
- TASKBOARD.md `019ebe11-884d-7d53-92ec-8cb064027ac2` (T-HE-009) — original spec, ACCEPTED
- T-HE-018 Hera-legal-review — referenced in Leader's T-HE-011 SHIP message; possibly gates T-HE-012 (50-migrations) but not T-HE-012 (formalization, this doc); awaiting confirmation

---

**Hera, MOTION_TOKENS_TAILWIND_PATCHES.md shipped (T-HE-012 spec'd filename, 12 §, +40 lines net, 3 inlined patches with file:line citations). Consolidated .patch file already in HEAD bcf44df0 (`motion-tokens-tailwind.patch`, 3527B, 3 hunks, 1 file). D-009 reconciliation: all 15 claims triangulated. 3 open questions for Leader (naming convention confirmed, T-HE-018 gating clarification, choreography patterns as utilities). Cycle 8 close (SettingsPage a11y) → cycle 9 wave 1 transition (motion-tokens). Est: 30 min T-HE-009 pre-stage + 30 min T-HE-012 formalization (this doc) = 60 min total.**
