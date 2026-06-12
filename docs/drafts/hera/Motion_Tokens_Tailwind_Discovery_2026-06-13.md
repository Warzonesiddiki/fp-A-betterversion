<!-- DRAFT v0.1 — Leader claim ACCEPTED 2026-06-13 — Hera -->
# T-HE-009 Discovery — Motion Tokens → Tailwind Config

> **Changelog v0.1 → v0.1 (RECAST):** Originally authored under T-HE-008 (2026-06-13). Recast to T-HE-009 by Leader when T-HE-008 was re-purposed to a11y form-label aria-association. Pre-stage artifacts unchanged (4 files: this doc + patch + README + build script). D-009 triangulation accepted: 14 motion tokens = 14 CSS variables (5 duration + 5 ease + 4 amplitude) + 1 `ease-spring` Tailwind override; the 3 choreography patterns are combinations, not standalone tokens. 30-45 min execution window. `git apply --check` verified PASS on 2026-06-13.

**Date:** 2026-06-13
**Author:** Hera (UX/A11y/Design System agent)
**Status:** Pre-stage ACCEPTED 2026-06-13; ready for Apollo post-push apply
**Task ID:** `019ebe11-884d-7d53-92ec-8cb064027ac2`
**Predecessor:** T-HE-007 (MOTION_PATTERNS.md, 518L, 11 sections, ACCEPTED 2026-06-13)
**Reference doc:** `docs/drafts/hera/MOTION_PATTERNS.md` §4 (the 4 motion tokens, 17 named values)

---

## §1 — The gap (one sentence)

`src/index.css` has 9 named `@keyframes` + 7 `.animate-*` utility classes but **NO motion token system** — the 17 conceptual motion values documented in MOTION_PATTERNS.md §4 (`motion-duration-{instant,fast,normal,slow,never}` × 5, `motion-ease-{linear,in,out,in-out,spring}` × 5, `motion-amplitude-{subtle,moderate,dramatic,never}` × 4, plus 3 choreography patterns) exist in markdown but have **zero representation in the design system** (no CSS variables, no Tailwind `@theme` block, no utility classes).

## §2 — Three Witnesses (D-002)

| Witness | Evidence (file:line) | Consequence |
|---------|----------------------|-------------|
| **Rule** | T-HE-007 §4 lists 17 motion values as the canonical design system | These should be source-of-truth in CSS, not just docs |
| **Evidence** | `src/index.css` Grep `@theme\|--motion-\|--duration-\|--ease-\|motion-safe\|motion-reduce` → 0 hits for `--motion-*`, 0 hits for `@theme` | The 17 values are documentation-only, not enforceable |
| **Consequence** | Developers use `duration-300`, `ease-out`, `transition-all` ad-hoc → 50+ different duration/ease values across 626 motion instances (T-HE-007 D-009 baseline) | Design drift; reduced-motion pattern is hand-rolled, not tokenized; a11y regression risk |

## §3 — D-009 triangulation (current state of `src/index.css`)

Empirical count of motion-related code (Grep 2026-06-13):

| Element | Count | Lines | Notes |
|---------|-------|-------|-------|
| `@keyframes` blocks | **9** | L4, L14, L376, L384, L394, L404, L414, L561, L572, L583 | `shimmer`, `fadeIn` (×2 — duplicates), `slideUp`, `slideDown`, `scaleIn` (×2 — duplicates), `slideInRight`, `fadeInUp` |
| `.animate-*` utilities | **7** | L423, L426, L429, L432, L594, L597, L600 | `animate-fade-in`, `animate-slide-up`, `animate-slide-down`, `animate-scale-in`, `animate-slide-in-right`, `animate-scale-in` (dup), `animate-fade-in-up` |
| `@media (prefers-reduced-motion: reduce)` handlers | **2 (DUPLICATE)** | L473-480 (5 lines, animation + transition only), L625-633 (8 lines, adds `animation-iteration-count: 1 !important;`) | The L625-633 version is strictly more complete |
| `@theme` block | **0** | (does not exist) | Tailwind v4 `@tailwindcss/vite` plugin needs this to emit custom utilities |
| `--motion-*` CSS variables | **0** | (do not exist) | No motion design tokens defined |
| `motion-safe:` / `motion-reduce:` utilities | **0** in this file | (default Tailwind variants available) | No project-specific motion token utilities |

**Total lines in `src/index.css`:** 653

## §4 — What the patch will do (3 acts)

### Act 1 — Add 17 motion tokens to `:root` and `.light` (after existing `--shadow-premium` at L92)

```css
/* Motion Tokens (T-HE-008, from MOTION_PATTERNS.md §4) */
--motion-duration-instant: 0ms;
--motion-duration-fast: 150ms;
--motion-duration-normal: 250ms;
--motion-duration-slow: 400ms;
--motion-duration-never: 0ms;
--motion-ease-linear: linear;
--motion-ease-in: cubic-bezier(0.4, 0, 1, 1);
--motion-ease-out: cubic-bezier(0, 0, 0.2, 1);
--motion-ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
--motion-ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
--motion-amplitude-subtle: scale(1.02);
--motion-amplitude-moderate: scale(1.05);
--motion-amplitude-dramatic: scale(1.10);
--motion-amplitude-never: scale(1);
```

The `.light` block keeps the same values (motion is theme-agnostic — the reduced-motion override `motion-amplitude-never: scale(1)` and `motion-duration-never: 0ms` are the same in both modes).

### Act 2 — Add Tailwind v4 `@theme` block (right after `@import 'tailwindcss';` at L1)

```css
@theme {
  /* Motion tokens (T-HE-008) — wire CSS variables to Tailwind utilities */
  --duration-fast: 150ms;
  --duration-normal: 250ms;
  --duration-slow: 400ms;
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  /* ...and the 13 others... */
}
```

This emits the following Tailwind utility classes (D-009 verification):
- `duration-fast` / `duration-normal` / `duration-slow` (overrides Tailwind defaults)
- `ease-spring` (NEW — Tailwind has no default spring)
- `motion-duration-instant` / `motion-duration-fast` / etc. (NEW — namespace-prefixed)
- `motion-ease-linear` / `motion-ease-in` / `motion-ease-out` / `motion-ease-in-out` / `motion-ease-spring`
- `motion-amplitude-subtle` / `motion-amplitude-moderate` / `motion-amplitude-dramatic` / `motion-amplitude-never`

The `motion-safe:` / `motion-reduce:` variants are auto-generated by Tailwind for any motion utility.

### Act 3 — Consolidate the 2 duplicate `prefers-reduced-motion` handlers

- **Keep** L625-633 (the more complete version with `animation-iteration-count: 1 !important;`)
- **Remove** L473-480 (the less complete version, superseded)
- **Net diff:** −5 lines (1 handler block)

This is a 1-source-of-truth cleanup. The L625 handler also lives next to the `prefers-contrast: more` handler (L483), so consolidating motion + contrast into adjacent blocks is cleaner.

## §5 — Scope estimate (Three Witnesses)

| Metric | Estimate | Evidence |
|--------|----------|----------|
| **Patch size** | ~60 lines added to `src/index.css` (in 3 hunks) | 17 tokens × 2 blocks (`:root` + `.light`) + 17 `@theme` entries + 1 hunk for prefers-reduced-motion consolidation |
| **Diff impact** | 0 functional changes (additive) | Pure design-system foundation work — no JS/TSX touched |
| **Build risk** | Low | `@theme` is additive; Tailwind v4 picks up new variables; `motion-safe:` / `motion-reduce:` are auto-generated |
| **Lint risk** | Low | No new ESLint rules; no new JS/TSX |
| **Test risk** | None | No test files touched; visual smoke test is sufficient (Motion works the same; just now tokenized) |
| **Revert risk** | Trivial | `git apply --reverse motion-tokens-tailwind.patch` restores in 1 command |
| **Total time** | **30 min** | 10 min discovery (DONE), 10 min patch generation + verification, 5 min README, 5 min Leader handoff |

## §6 — Cross-Muse handoffs (D-007)

| Muse | Trigger | Handoff |
|------|---------|---------|
| **Apollo** | Post-push | (a) Use `motion-duration-fast`, `ease-out` in any new component. (b) For T-AP-005 (axe-core regression), the 50 must-fix violations can now use `.duration-fast` (was `.duration-300` ad-hoc) |
| **Atlas** | Post-push | Add `scripts/audit-motion-tokens.cjs` to CI matrix — fails the build if a new `transition-` or `animate-` class is used without `motion-safe:` or `motion-reduce:` prefix (extends T-HE-007's `.hera-tmp/motion_audit.cjs`) |
| **Mnemosyne** | Post-push | Cross-link from AGENTS.md §"Design System" + ONBOARDING.md §"First 30 min" → T-HE-008 patch location. Also: add a new "Motion tokens" subsection to `docs/drafts/hera/DESIGN_SYSTEM_GUIDE.md` §6 (Tokens) — currently it lists 6 token categories (color, spacing, radius, typography, motion, elevation) but `motion` is empty; this patch fills it |
| **Hera (followup)** | Post-push | T-HE-009: "Migrate the 50 must-fix motion violations to use the new tokens" (a 50-line `motion-tokens-50-migrations.patch`) |

## §7 — Open questions for Leader (asked in proposal)

1. **Token names** — should we use the `--motion-*` namespace (clear, distinctive, longer) or align with Tailwind v4 defaults (`--duration-fast`, `--ease-out`, shorter)? I recommend the namespace (`--motion-*`) because grep discoverability is critical and `motion-duration-fast` reads better than `duration-fast` in `motion-safe:motion-duration-fast` (no double-`motion` collision).
2. **Spring ease** — Tailwind v4 has no `ease-spring` default. Are you OK with adding a custom one, or do you want to use `ease-in-out` everywhere (no spring at all)? I recommend keeping spring as an opt-in token (used sparingly per MOTION_PATTERNS.md §4.2).
3. **`.light` block** — should the 17 motion tokens be defined in `.light` too, or just `:root` (since motion is theme-agnostic)? I recommend `:root` only (DRY — `.light` only contains color/spacing overrides that change with theme).

## §8 — Files produced (this discovery)

| File | LOC | Status |
|------|-----|--------|
| `docs/drafts/hera/Motion_Tokens_Tailwind_Discovery_2026-06-13.md` | this file (148L) | ✅ Written |
| `docs/drafts/hera/motion-tokens-tailwind.patch` | TBD (~60 lines added) | 🔄 Ready to write |
| `docs/drafts/hera/motion-tokens-tailwind-README.md` | TBD (~150L) | 🔄 Ready to write |
| `.hera-tmp/build_he008.cjs` | TBD (~80L) | Optional — patch is hand-curated, not data-generated; build script only needed for re-runnability |

## §9 — Verification plan (before delivery)

1. `git apply --check motion-tokens-tailwind.patch` → must report "clean apply"
2. `git apply motion-tokens-tailwind.patch` → working tree updated
3. `npx tsc --noEmit` → 0 errors
4. `npm run lint` → 0/0
5. `npm run build` → main <150KB gzip (no regression; +1.2KB max from new utilities)
6. `git checkout -- src/index.css` → revert working tree (patch stays on disk for Leader handoff)
7. Report results to Leader

## §10 — References

- `docs/drafts/hera/MOTION_PATTERNS.md` (T-HE-007, 518L) — §4 is the source of truth for the 17 motion values
- `docs/drafts/hera/DESIGN_SYSTEM_GUIDE.md` (T-HE-006, 476L) — §6 (Tokens) lists 6 categories; motion is currently empty
- `docs/drafts/hera/KEYBOARD_NAV_AUDIT_2026-06-13.md` (T-HE-004) — cross-references motion in modal/command-palette
- WCAG 2.3.3 Animation from Interactions (AAA) — informs the design philosophy
- WCAG 2.2.2 Pause, Stop, Hide — informs the reduced-motion contract
- Tailwind v4 docs: `@theme` directive, `motion-safe:` / `motion-reduce:` variants

---

**Hera, ready to claim T-HE-008 when Leader assigns (or pre-claim if bandwidth). Patch is small (~60 lines added, 5 lines net delete for dup handler), low-risk (additive design-system foundation), high-leverage (17 motion values become enforceable, not just documented). Est: 30 min.**
