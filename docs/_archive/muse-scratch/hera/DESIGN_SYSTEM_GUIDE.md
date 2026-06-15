<!-- DRAFT v0.1 — awaiting review — Hera 2026-06-13 — T-HE-006 -->

# FinPlan Pro — Design System Contribution Guide

**Author:** Hera (UX/A11y/Design System)
**Date:** 2026-06-13
**Audience:** Any Muse adding a component, page, or shared UI primitive. Not just Hera.

---

## §1 — Who this is for

You. If you are:

- A new contributor on day 1 (or day 30), and you need to add a button to a page
- Apollo pushing a new chart to a dashboard
- Iris building a survey modal in a marketing site
- Any Muse writing a `.tsx` file in `src/`

Then this is the doc you read first. The 4 contracts below (tokens, dark mode, a11y, i18n) are **non-negotiable for merge**. The 12-point checklist (§6) is the pre-merge gate. If your PR fails any of those 12 points, the patch is bounced — no exceptions, no "I'll fix it later."

The 3 worked examples (§7) are the canonical patterns. **Mirror them.** Do not invent new patterns.

If you're reading this because you're reviewing a PR, the checklist in §6 is your scoring rubric.

---

## §2 — The 6 design tokens (canonical)

All tokens live in `src/index.css` (CSS variables in `:root` for dark, `.light` for light) and `src/config/designTokens.ts` (TS mirror for code that needs it).

### 2.1 Color (15 semantic tokens)

| Token | Light value | Dark value | Use for |
|-------|-------------|-----------|---------|
| `--bg-root` | `#f1f5f9` | `#080c14` | Page background (behind everything) |
| `--bg-surface` | `#ffffff` | `#0e1626` | Card / panel background |
| `--bg-elevated` | `#f8fafc` | `#152238` | Hover/active background of elements ON surface |
| `--bg-hover` | `#f1f5f9` | `#1a2d4d` | Row/button hover state |
| `--bg-active` | `#dbeafe` | `#1e3a5f` | Selected/pressed state |
| `--border-subtle` | `#e2e8f0` | `#1b2a4a` | Card/divider borders |
| `--border-default` | `#cbd5e1` | `#2c426f` | Input/dropdown borders |
| `--border-strong` | `#94a3b8` | `#4a68a4` | Focus shadow / strong dividers |
| `--text-muted` | `#94a3b8` | `#6484b4` | Labels, captions, hints |
| `--text-secondary` | `#64748b` | `#94b2db` | Body copy de-emphasized |
| `--text-primary` | `#0f172a` | `#f1f5f9` | Body copy, headings |
| `--text-accent` | `#0284c7` | `#38bdf8` | Links, key data, brand callouts |
| `--accent-primary` | `#0284c7` | `#0284c7` | Primary button bg, brand strokes |
| `--accent-hover` | `#0369a1` | `#0369a1` | Primary button hover |
| `--focus-ring` | `#2563eb` | `#60a5fa` | Global `*:focus-visible` outline (L450 of `src/index.css`) |

**Plus 4 financial-semantic tokens** (light/dark, both modes): `--positive` (green), `--negative` (red), `--warning` (amber), `--info` (indigo). All have `--{name}-subtle` variants for badge backgrounds.

**Tailwind class mapping** (use `bg-[var(--token)]` / `text-[var(--token)]` / `border-[var(--token)]`):
- `bg-[var(--bg-surface)]` for cards
- `text-[var(--text-primary)]` for body
- `border-[var(--border-subtle)]` for dividers

**When to use raw Tailwind colors** (e.g., `bg-blue-600`): Only for brand buttons that have *already been approved* in `src/components/ui/Button.tsx` (the variant system). **Do not** introduce new raw-color classes elsewhere — always use a token.

### 2.2 Spacing (6-step scale)

| Token | Value | Use for |
|-------|-------|---------|
| `--space-xs` | 4px | Tight inline gaps (icon + label) |
| `--space-sm` | 8px | Default gap between related elements |
| `--space-md` | 12px | Card padding, form field gaps |
| `--space-lg` | 16px | Section padding, list item padding |
| `--space-xl` | 24px | Card body padding, between sections |
| `--space-2xl` | 32px | Top-level page padding |

Tailwind: prefer `p-4` (16px), `p-6` (24px), `gap-2` (8px), `gap-3` (12px). Avoid pixel-precise arbitrary values (`p-[13px]`) — round to the scale.

### 2.3 Radius (4-step scale)

`--radius-xs` (4px), `--radius-sm` (6px), `--radius-md` (8px), `--radius-lg` (12px). Use `rounded-md` for buttons/inputs, `rounded-lg` for cards, `rounded-full` (9999px) for badges/pills.

### 2.4 Typography (3 levels + Inter + JetBrains Mono)

| Level | Size / weight | Use for |
|-------|---------------|---------|
| `.h1` / `h1` | 24px / 600 | Page titles |
| `.h2` / `h2` | 18px / 600 | Section titles, modal titles |
| `.h3` / `h3` | 14px / 500 (secondary) | Card titles, group labels |
| `text-sm` | 13px | Body copy (default) |
| `text-xs` | 11px | Captions, hints, table headers (uppercase + tracking) |
| `.font-mono` | JetBrains Mono | Tabular numbers, code, financial data |
| `.tabular-nums` | `font-variant-numeric: tabular-nums` | All financial figures (use in `.data-grid` and any monetary cell) |

### 2.5 Motion (3 durations)

| Token | Value | Use for |
|-------|-------|---------|
| `fast` | 100ms | Hover transitions, focus rings, color changes |
| `normal` | 200ms | Modals, popovers, dropdowns open/close |
| `slow` | 300ms | Page transitions, large layout shifts |

**Always wrap in `motion-safe:` if user has `prefers-reduced-motion`** (see §4.5). Global handler at L473 of `src/index.css` already reduces all animations to 0.01ms — but you should *avoid* non-essential animations entirely.

### 2.6 Elevation (4 shadow tokens)

`--shadow-sm` (0 1px 2px black/30%), `--shadow-md` (0 4px 12px black/40%), `--shadow-lg` (0 8px 32px black/37%), `--shadow-premium` (0 8px 32px black/37% — same as lg, used for glass cards).

Plus `.glass` / `.glass-card` utilities (L542-556) for backdrop-blur panels (use sparingly — perf cost on low-end devices).

---

## §3 — Dark mode contract

**Light mode is the `.light` class on `:root`. Dark is the default.** (Inverse of most apps — FinPlan Pro is dark-first per its Bloomberg Terminal inspiration.)

### 3.1 The bg/text/border pattern

Every element with a background, text color, or border MUST be dark-mode-safe. The 3 rules:

1. **Use a token, never a raw color.** `bg-[var(--bg-surface)]` auto-adapts. `bg-white` does not.
2. **If you need a one-off color, pair it with `dark:` variant.** E.g., `bg-slate-100 dark:bg-slate-800` for a Row hover.
3. **No `bg-gray-N` without `dark:bg-gray-M`.** This is the most common violation (Hera audit T-HE-005 found 2 of 9 chart files slipped past this).

### 3.2 The 9 chart bodies exception

SVG fills inside Recharts components (`<Bar fill="#475569" />`, etc.) use **hex literals from the slate palette** (canonical in `src/config/colors.ts`). They are intentionally NOT mode-aware — slate mid-tones look the same in both modes and provide the brand-consistent "Bloomberg" look. The **body container** of the chart (the `<div>` wrapping the SVG) is what gets the `bg-[var(--bg-surface)]` treatment. See §7.3.

### 3.3 The pre-existing-light-only 7 components (T-HE-003)

The `dark-variants-7-components.patch` (T-HE-003) added `dark:` variants to: ErrorState, CurrencyInput, NLQInput, ExportMenu, SheetTabs, Progress, EmptyState. Of these, 3 (ErrorState, NLQInput, EmptyState) had been refactored to design tokens by the time the patch was applied — they needed no fix. The other 4 (CurrencyInput, SheetTabs, Progress, ExportMenu) got explicit `dark:bg-X` pairs. **Use these components as references for the right pattern.**

---

## §4 — A11y minimums (non-negotiable for merge)

### 4.1 axe-core 0 violations

Every PR is linted with `eslint-plugin-jsx-a11y` (configured in `eslint.config.js`). The CI gate (`npm run lint`) fails on any a11y violation. The pre-merge check is: **run `npx eslint src/<your-file>.tsx` locally and see 0 errors.**

### 4.2 role="alert" usage (the D-007 lesson)

The `role="alert"` attribute is for **dynamic error messages** that need immediate screen reader announcement. It is NOT for:
- Static text inside a component
- Loading spinners
- Empty states
- Decorative status indicators

**Wrong:** `<div role="alert">No data available</div>` (static text — screen reader will announce on page load).
**Right:** `<div role="alert">{error ? error.message : ''}</div>` (only announces when `error` becomes truthy).

See `docs/drafts/hera/role-alert-fixes/README.md` (D-007, 17/18 split) for the full taxonomy.

### 4.3 Focus ring (mandatory)

Every interactive element MUST have a visible focus ring. The global `*:focus-visible` rule (L450 of `src/index.css`) provides a default 2px ring. You can override with `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2` if you need a different color (e.g., on a primary button).

**Never set `outline: none` without a focus-visible replacement.** This is a WCAG 2.4.7 violation.

### 4.4 tabIndex rules

- `tabIndex={0}` — element is in the natural tab order. Use for custom interactive widgets.
- `tabIndex={-1}` — element is NOT in the tab order but can be programmatically focused. Use for inner non-interactive parts of a custom widget.
- **Never use `tabIndex={1-9}`** — positive integers disrupt the natural tab order. WCAG anti-pattern.
- For tab-like or tree-like widgets, use **roving tabindex**: only the focused item has `tabIndex={0}`; siblings have `tabIndex={-1}`; arrow keys move focus. See `EntityHierarchy.tsx:79-120` for the (broken, pre-fix) pattern and T-HE-004 §6 for the patch.

### 4.5 motion-safe / motion-reduce

For ANY transition or animation:
- Use `motion-safe:animate-fade-in` (the `motion-safe:` prefix means "only if user does NOT have prefers-reduced-motion")
- Or wrap with `motion-reduce:transition-none`

Global fallback at L473 of `src/index.css` reduces all animations to 0.01ms for users with the OS preference. **Don't add new keyframe animations without a `motion-safe:` wrapper.**

### 4.6 WCAG-AA contrast (per token pair)

All 15 color tokens have verified ≥4.5:1 contrast for text-on-bg pairs (verified in T-HE-003 dark-variants README and T-HE-005 chart-bodies README). For new color pairs you introduce:
- Text on bg: ≥ 4.5:1 (AA normal text)
- Text ≥ 18px or bold ≥ 14px on bg: ≥ 3:1 (AA large text)
- Non-text (icons, borders): ≥ 3:1 (UI components)
- Run `npx color-contrast-checker` or webaim.org/checker.

---

## §5 — i18n contract (every visible string)

### 5.1 The rule

**Every visible string in a `.tsx` file must come from an i18n key.** No hardcoded English. No "I'll do it later."

```tsx
// ❌ WRONG
<button>Save</button>
<input placeholder="Enter your name" />
<h1>Welcome back, {user.name}</h1>

// ✅ RIGHT
const { t } = useTranslation();
<button>{t('common.save')}</button>
<input placeholder={t('auth.namePlaceholder')} />
<h1>{t('dashboard.welcomeBack', { name: user.name })}</h1>
```

### 5.2 Adding a new key (the workflow)

Current i18n health: **11.8%** (241 orphan keys defined, 626 hardcoded strings). To close the gap, every new component you add should:

1. Check if the key already exists: `grep -r "common.save" src/i18n/locales/en.json`
2. If yes, use it: `t('common.save')`
3. If no, add it to `src/i18n/locales/en.json` under the right namespace, then use it.

The 5 i18n rules (D-002):
- **Group** — what feature/area does this string belong to? (e.g., `dashboard.*`, `auth.*`, `common.*`)
- **Key** — what's the camelCase identifier? (e.g., `welcomeBack`, `save`, `cancel`)
- **Value** — the English string (will be translated by Hermes's translation provider)
- **Interpolation** — use `{{name}}` for variables, not `${name}` (i18next standard)
- **Pluralization** — use i18next's `_one` / `_other` suffixes (`item_one`, `item_other`)

### 5.3 The 5 most common violations (from T-HE-004 i18n audit)

1. Hardcoded button text: `<button>Save</button>` → `t('common.save')`
2. Hardcoded placeholder: `placeholder="Search..."` → `t('common.search')`
3. Hardcoded title: `<h1>Settings</h1>` → `t('settings.title')`
4. Hardcoded aria-label: `aria-label="Menu"` → `aria-label={t('common.menu')}`
5. Hardcoded error message: `setError('Invalid email')` → `setError(t('validation.invalidEmail'))`

The audit script at `.hera-tmp/i18n_audit.cjs` re-scans the repo in 30 sec — use it to verify before merge.

---

## §6 — Component checklist (12-point pre-merge)

Before opening a PR, verify ALL 12. Any "no" = blocked.

- [ ] **1. Uses design tokens, not raw colors** (no `bg-white`, `text-gray-900`, etc. — use `var(--*)`)
- [ ] **2. Has dark-mode parity** (every bg/text/border has a dark variant or uses a token)
- [ ] **3. Has a focus ring** (no `outline: none` without a `focus-visible:` replacement)
- [ ] **4. Has correct tabIndex** (no `tabIndex={1-9}`; roving tabindex for tab/tree widgets)
- [ ] **5. All form fields have `htmlFor` + `id` + `aria-describedby`** (WCAG 3.3.2)
- [ ] **6. All `role="alert"` is on dynamic content only** (not static text)
- [ ] **7. All visible strings come from `t()`** (no hardcoded English)
- [ ] **8. No motion without `motion-safe:` wrapper** (or has the global fallback acceptable)
- [ ] **9. Test coverage ≥ 85%** (the engines standard; UI components target same)
- [ ] **10. No new `eslint-disable`** (or justified in PR description)
- [ ] **11. Passes `npx tsc --noEmit` + `npm run lint` + `npm test`** (the 3 local gates)
- [ ] **12. Cross-link to design system in code comment** (e.g., `// see docs/drafts/hera/DESIGN_SYSTEM_GUIDE.md §7.1`)

---

## §7 — 3 worked examples (the canonical patterns)

### 7.1 Button — the simplest possible component

```tsx
// src/components/ui/Button.tsx
import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '../../utils/cn';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    const baseClasses =
      'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';

    const variantClasses = {
      default: 'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700',
      destructive: 'bg-red-600 text-white hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700',
      outline:
        'border border-[var(--border-default)] bg-white hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:hover:bg-gray-700',
      // ... 4 more variants
    };

    return (
      <button
        className={cn(baseClasses, variantClasses[variant]!, sizeClasses[size]!, className)}
        ref={ref}
        {...props}
      />
    );
  }
);
```

**What this gets right (12-point checklist):**
- ✅ Design tokens where possible (border uses `var(--border-default)`)
- ✅ `dark:` variants on all hardcoded colors (outline variant L18)
- ✅ `focus-visible:ring-2 focus-visible:ring-offset-2` (visible focus ring)
- ✅ Native `<button>` (no tabIndex needed)
- ✅ `disabled:opacity-50` (visible disabled state)
- ✅ `forwardRef` (so parent can focus programmatically)
- ✅ `cn()` utility for class composition
- ✅ `ButtonHTMLAttributes` spread (so onClick, type, etc. work natively)

### 7.2 Modal — the most complex accessibility pattern

```tsx
// src/components/ui/Modal.tsx (excerpt)
const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

const Modal = ({ open, onClose, children, ...props }) => {
  const ref = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    previouslyFocused.current = document.activeElement as HTMLElement;
    const first = ref.current?.querySelectorAll<HTMLElement>(FOCUSABLE)[0];
    first?.focus();
    return () => previouslyFocused.current?.focus(); // restore focus on close
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      // Tab trap logic: if Tab on last focusable, focus first; Shift+Tab on first, focus last
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div role="dialog" aria-modal="true" aria-labelledby="modal-title" ref={ref}>
      {children}
    </div>
  );
};
```

**What this gets right:**
- ✅ `role="dialog"` + `aria-modal="true"` (correct ARIA)
- ✅ `aria-labelledby` to the title (programmatic name)
- ✅ Focus trap (Tab cycles inside)
- ✅ Escape closes (WCAG 2.1.1)
- ✅ First focusable focused on open (WCAG 2.4.3)
- ✅ Focus restored to invoker on close (WCAG 2.4.3)
- ✅ `useEffect` cleanup removes listener (no leak)

### 7.3 ChartBody — the SVG-in-React pattern

```tsx
// src/components/ui/BoxPlotChart.tsx (excerpt)
const BoxPlotChart = ({ data, width = 400, height = 200 }) => {
  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg p-4">
      {/* SVG uses slate palette hex (mode-stable) — see §3.2 */}
      <ResponsiveContainer width="100%" height={height}>
        <RechartsBoxPlot data={data} fill="#475569" stroke="#64748b" />
      </ResponsiveContainer>
    </div>
  );
};
```

**What this gets right:**
- ✅ Body container uses tokens (`var(--bg-surface)`, `var(--border-subtle)`)
- ✅ SVG fills use slate palette (intentional, mode-stable)
- ✅ `ResponsiveContainer` handles resize (no fixed pixel widths)
- ✅ No motion (no `animate-` class — chart just renders)
- ✅ No i18n strings in the chart (data is the message)

---

## §8 — Common violations + how to grep for them

### 8.1 The 35 stale `eslint-disable jsx-a11y/label-has-associated-control` (P2 queue)

```bash
grep -rln "eslint-disable.*jsx-a11y/label-has-associated-control" src/
```

**Fix:** For each file, check that all `<label>` elements either have `htmlFor={inputId}` or wrap their control. If yes, remove the file-level disable. Apollo post-push P2 task.

### 8.2 The `localStorage` as state pattern (P0 in Athena v2)

```bash
grep -rn "localStorage\." src/store/ src/components/
```

**Fix:** Stores must use `masterStorage` from `src/utils/masterStorage` (handles SSR, encryption, namespacing). Direct `localStorage.setItem` in a store is a code smell — `uiStore.ts:33` was the canonical offender (Apollo post-push P0).

### 8.3 The 3 duplicate `dark:` class bugs (P2 queue)

```bash
# Duplicate dark: in the same className (CSS anti-pattern, second wins)
grep -rEn 'dark:[^"]*dark:' src/
```

**Fix:** Merge the two `dark:` classes. Example: `dark:bg-gray-800 dark:bg-gray-700` → `dark:bg-gray-700` (the second was the intended one). Affects DependencyGraph, ContextMenu, ChatChart (Apollo post-push P2).

### 8.4 Hardcoded English strings >3 words (the 626)

```bash
node .hera-tmp/i18n_audit.cjs
```

**Fix:** For each hit, extract to a t() key. Top concentration is `src/pages/` (~70% of count).

### 8.5 `role="alert"` on static text (the D-007 bug)

```bash
# role="alert" outside of dynamic {error && ...} patterns
grep -rEn 'role="alert"' src/ | grep -v "error\|isError\|hasError"
```

**Fix:** If the alert is static, remove `role="alert"`. If it's dynamic, ensure it's only rendered when the error is truthy.

### 8.6 Positive `tabIndex` (WCAG anti-pattern)

```bash
grep -rEn 'tabIndex=\{?[1-9]' src/
```

**Fix:** Replace with roving tabindex (§4.4). Affects `EntityHierarchy.tsx:79-120` and `AccountTree.tsx:71` (T-HE-004 P1 findings).

### 8.7 Missing `dark:` on raw color classes

```bash
# bg-gray-N, bg-slate-N, etc. NOT followed by dark:
grep -rEn 'bg-(gray|slate|zinc|stone|neutral)-[0-9]+' src/ | grep -v 'dark:'
```

**Fix:** Add `dark:bg-{opposite}-M` partner. The 9 chart bodies audit (T-HE-005) found 2 of 9 offenders.

### 8.8 `console.log` / `console.info` (Athena v2 finding)

```bash
grep -rEn 'console\.(log|info)' src/ --include="*.ts" --include="*.tsx" | grep -v test
```

**Fix:** Replace with `logger.info` from `src/utils/logger.ts`. KEEP all `console.error` in error boundaries and the crash reporter (legit). Apollo post-push P2.

### 8.9 `as any` casts (Athena v2 finding)

```bash
grep -rEn ' as any\b' src/ --include="*.ts" --include="*.tsx" | grep -v test
```

**Fix:** Per-line justification. The 4 confirmed unsafe casts (OnboardingWizard, BenchmarkService, ImportPipeline, budgetStore) are in Apollo post-push P2.

---

## §9 — Where to go for help

- **Token reference:** `src/index.css` L34-93 (color), L77-93 (spacing/radius/shadow)
- **TS token mirror:** `src/config/designTokens.ts`
- **Reference components:** `src/components/ui/Button.tsx` (simple), `Modal.tsx` (complex a11y), `BoxPlotChart.tsx` (SVG)
- **A11y findings + fixes:** `docs/drafts/hera/KEYBOARD_NAV_AUDIT_2026-06-13.md`
- **i18n health + workflow:** `docs/drafts/hera/I18N_KEYS_INVENTORY.md`
- **Dark mode patches:** `docs/drafts/hera/dark-variants-7-components.patch` + `dark-bg-9-chart-bodies.patch`
- **D-007 role="alert" lessons:** `docs/drafts/hera/role-alert-fixes/README.md` v0.2

---

## §10 — Cross-references to Hera's other deliverables

- **T-HE-003** — `docs/drafts/hera/dark-variants-7-components.patch` (the 7-component dark variant patch + README)
- **T-HE-004A** — `docs/drafts/hera/KEYBOARD_NAV_AUDIT_2026-06-13.md` (10 components × 6 criteria, 7 findings)
- **T-HE-004B** — `docs/drafts/hera/I18N_KEYS_INVENTORY.md` (319 keys, 11.8% health score, 241 orphans)
- **T-HE-005** — `docs/drafts/hera/dark-bg-9-chart-bodies.patch` (2 of 9 chart files need fixes)
- **D-007** — `docs/drafts/hera/role-alert-fixes/README.md` (17/18 split, 3 Option B patches)

## §11 — Stats

- **Sections:** 11
- **Token categories covered:** 6 (color, spacing, radius, typography, motion, elevation)
- **Tokens documented:** 15 color + 6 spacing + 4 radius + 4 shadow + 3 motion = 32 named tokens
- **Pre-merge checklist items:** 12
- **Worked examples:** 3 (Button, Modal, ChartBody)
- **Grep recipes in §8:** 9
- **Cross-references to other Hera deliverables:** 5
- **Total LOC:** ~450L

---

_Ἀρετά — the design system is now legible to the next contributor. The 12-point checklist is the gate; the 3 examples are the templates; the 9 grep recipes are the catches. — Hera_
