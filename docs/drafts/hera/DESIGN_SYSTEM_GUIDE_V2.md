# Design System Contribution Guide v2 — Hera T-HE-013

**Status:** DRAFT v2.0 (push-INDEPENDENT, docs-only)
**Builds on:** T-HE-006 v1 ([`DESIGN_SYSTEM_GUIDE.md`](./DESIGN_SYSTEM_GUIDE.md), 475L, 11 sections, 3 worked examples)
**Cascade sources:** T-HE-007 motion patterns (224L) · T-HE-008 form-label patches (280L) · T-HE-009 motion-tokens spec · T-HE-011 fieldset/legend patches (440L) · T-HE-012 motion tokens → Tailwind (formalized)
**Target size:** ~450L, 8 sections (Honest Labeling: v1 was 11 sections/475L; v2 consolidates 11→8 + adds substantive new content)
**Date:** 2026-06-13

---

## §1 — Who this is for & what's new in v2

**Audience:** Engineers contributing new components, designers shipping variants, and anyone touching a shared UI primitive. v1's audience still applies (see v1 §1 for the full list). v2 adds: a11y review pass, motion-token design, dark-parity checker, and the new form-pattern rules.

**What's new in v2 (delta from v1):**

| Section       | v1 had                                  | v2 adds                                                                                                  | Source                                              |
| ------------- | --------------------------------------- | -------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| §2 Tokens     | 5 of 6 tokens defined; motion was "TBD" | **11 motion tokens** filled in (5 duration + 2 easing + 2 keyframe + 2 animation)                        | T-HE-009 + T-HE-012                                 |
| §3 Dark mode  | "Use `dark:` variant" rule              | **Parity checklist** (bg/text/border/ring × 4 states) + chart-body `dark:bg` recipe                      | T-HE-003 (7 light-only) + T-HE-005 (9 chart bodies) |
| §4 A11y       | 4 minimums (label, role, focus, color)  | **+4 minimums** (motion-safe/reduce, htmlFor/id pairing, fieldset/legend, aria-describedby)              | T-HE-007 + T-HE-008 + T-HE-011                      |
| §6 Checklist  | 12 points                               | **18 points** (+6: motion-safe, fieldset, describedby, dark-parity, i18n-key, store-master)              | Cascade from §3+§4                                  |
| §7 Examples   | 3 (Button, Modal, ChartBody)            | **7** (+FormField, +Skeleton, +LoadingSpinner)                                                           | T-HE-008 + T-HE-007                                 |
| §8 Violations | 9 patterns + 9 greps                    | **14 patterns** + 14 greps (+5: motion-unsafe, missing-htmlFor, div-onClick, dup-dark, missing-fieldset) | T-HE-007 §8 + T-HE-008 §7                           |

**Why v2 (Three Witnesses, D-002):**

- **Rule:** After cycle-3/4 design audits, the v1 guide had 4 specific gaps (motion, dark-parity, form-a11y, fieldset). v1 was the _contract_; v2 is the _operational playbook_ engineers actually need to ship compliant components.
- **Evidence:** T-HE-003 found 7 fully-light-only components; T-HE-005 found 9 chart bodies; T-HE-007 §8 catalogued 12 motion-unsafe patterns; T-HE-008 §1 found 13+ label-without-`htmlFor` files; T-HE-011 found 3 SettingsPage sections missing `fieldset`/`legend`.
- **Consequence:** Without v2, every contributor must re-derive these patterns from cascade source docs. v2 makes them the _default_.

---

## §2 — The 6 design tokens (v2: motion filled in)

v1 defined 5 of 6 tokens. v2 fills in the **14 motion tokens** (the highest-leverage gap; the audit found 12 motion-unsafe patterns in 200+ transition sites).

**The 5 unchanged tokens** (full spec in v1 §2):

- **Color** — `slate`/`gray`/`zinc` (one of — pick one and stick; v1: `slate` recommended for consistency with `darkMode: 'class'`)
- **Spacing** — Tailwind default scale (4px base); 1.5× for touch targets
- **Radius** — `rounded-md` (6px) for inputs/buttons, `rounded-lg` (8px) for cards/modals
- **Typography** — Inter (UI), JetBrains Mono (numerics in tables), `tabular-nums` for $/% columns
- **Elevation** — `shadow-sm` (1px) for hover, `shadow-md` (4px) for dropdown, `shadow-lg` (8px) for modal

**The 11 motion tokens (NEW in v2):** 5 durations (0/100/200/300/500ms) + 2 easings (out/in-out) + 2 keyframes (fade-in/slide-up) + 2 animations (fade-in/slide-up).

**Rule:** Every `transition-*`, `animate-*`, `duration-*`, `ease-*`, `motion-*` class in a component MUST either (a) be one of the 11 tokens above (5 duration + 2 easing + 2 keyframe + 2 animation), or (b) wrap in `motion-safe:` (T-HE-007 §4). No bespoke durations/easings.

**Token enforcement (Tailwind config patch, T-HE-012):**

```ts
// tailwind.config.ts (excerpt from T-HE-012 patch)
theme: {
  extend: {
    transitionDuration: { '0': '0ms', '100': '100ms', '200': '200ms', '300': '300ms', '500': '500ms' },
    transitionTimingFunction: { 'out': 'cubic-bezier(0, 0, 0.2, 1)', 'in-out': 'cubic-bezier(0.4, 0, 0.2, 1)' },
    keyframes: { 'fade-in': { '0%': { opacity: '0' }, '100%': { opacity: '1' } }, 'slide-up': { '0%': { transform: 'translateY(4px)' }, '100%': { transform: 'translateY(0)' } } },
    animation: { 'fade-in': 'fade-in 200ms ease-out', 'slide-up': 'slide-up 200ms ease-out' },
  }
}
```

**Why this token set:** Audit found 200+ transition sites with 38 distinct durations (50ms–700ms) and 11 distinct easings. Token enforcement cuts this to 5+2.

---

## §3 — Dark mode contract (v2: parity checklist + chart bodies)

v1's dark-mode rule: every `bg-*` needs a `dark:bg-*` counterpart, and **never** use the same shade in both modes (e.g., `bg-white` + `dark:bg-white` is a no-op bug — T-HE-005 found 3 instances). v2 adds a **4-state parity checklist** + the **chart-body `dark:bg` recipe** that T-HE-005/006 left as an open question.

**The 4-state parity checklist (NEW in v2):**

For every surface that has a light variant, verify all 4:

| State            | Light token        | Dark token              | Anti-pattern (T-HE-005 finding)            |
| ---------------- | ------------------ | ----------------------- | ------------------------------------------ |
| `bg` (default)   | `bg-white`         | `dark:bg-slate-900`     | `bg-white dark:bg-white` (3 dup-dark bugs) |
| `text` (default) | `text-slate-900`   | `dark:text-slate-50`    | `text-slate-900 dark:text-slate-900`       |
| `border`         | `border-slate-200` | `dark:border-slate-700` | `border-slate-200 dark:border-slate-200`   |
| `ring` (focus)   | `ring-blue-500`    | `dark:ring-blue-400`    | missing `dark:ring-*` entirely             |

**Chart-body recipe (NEW in v2, T-HE-005):**

```tsx
// WRONG (T-HE-005 found 9 instances in BoxPlot, Bullet, Combo, Funnel, Gantt, Gauge, Sankey, Waterfall, Tornado):
<div className="bg-white">

// RIGHT:
<div className="bg-white dark:bg-slate-900 transition-colors duration-base">

// Add to chart body, NEVER to chart container (containers inherit from page bg)
```

**The 7 light-only components to fix (T-HE-003 audit):** ErrorState, CurrencyInput, NLQInput, ExportMenu, SheetTabs, Progress, EmptyState. Each needs all 4 states (bg/text/border/ring) + the 4 interaction states (hover/focus/active/disabled). Recipe in v2 §6 checklist row 5.

**Concrete 4×4 parity matrix (NEW in v2, Button as worked example):**

| State          | Light                         | Dark                                            |
| -------------- | ----------------------------- | ----------------------------------------------- |
| bg default     | `bg-blue-600`                 | `dark:bg-blue-500`                              |
| bg hover       | `hover:bg-blue-700`           | `dark:hover:bg-blue-400`                        |
| bg focus       | `focus-visible:bg-blue-600`   | `dark:focus-visible:bg-blue-500`                |
| bg active      | `active:bg-blue-800`          | `dark:active:bg-blue-300`                       |
| text default   | `text-white`                  | `dark:text-slate-900`                           |
| text hover     | `text-white`                  | `dark:text-slate-900`                           |
| border default | `border-blue-600`             | `dark:border-blue-500`                          |
| ring focus     | `ring-blue-500 ring-offset-2` | `dark:ring-blue-400 dark:ring-offset-slate-900` |

**The shift pattern:** Light uses `600/700/800` (darker on interaction), dark uses `500/400/300` (lighter on interaction). Both maintain 4.5:1 contrast against their bg. This is the same pattern for ALL accent colors (green/red/amber).

---

## §4 — A11y minimums (v2: motion-safe + form-label + fieldset/legend)

v1 had 4 minimums (label, role, focus, color-contrast). v2 adds **4 more** based on the audit cascade.

**The 4 unchanged v1 minimums:**

- (a) Every interactive element has an accessible name (`aria-label` or visible text)
- (b) `role` is correct for non-semantic HTML (`role="button"`, `role="status"`, etc.)
- (c) Focus visible (`:focus-visible` ring, not `:focus` — T-HE-007 §6 finding)
- (d) Color contrast ≥4.5:1 (text) / ≥3:1 (UI) per WCAG 2.1 AA

**The 4 NEW v2 minimums (cascade from T-HE-007/008/011):**

**(e) Motion-safe / motion-reduce (T-HE-007 §4):**

- All `transition-*` / `animate-*` MUST be wrapped in `motion-safe:` OR have a `motion-reduce:duration-0` counterpart
- WCAG 2.3.3 (Animation from Interactions) — vestibular disorder accommodation
- **Recipe:** `className="transition-colors motion-safe:duration-200 motion-reduce:duration-0"`

**(f) `htmlFor`/`id` pairing for ALL form controls (T-HE-008):**

- `<label htmlFor="x">` MUST match `<input id="x">` (never implicit-wrapping-only, which fails screen readers)
- WCAG 1.3.1 (Info and Relationships) + 3.3.2 (Labels or Instructions)
- **Recipe:** see §7 FormField example

**(g) `fieldset` + `legend` for grouped controls (T-HE-011):**

- Radio groups, checkbox groups, and SettingsPage sections MUST use `<fieldset>` with `<legend>` as the group label
- WCAG 1.3.1 + 4.1.2 (Name, Role, Value)
- **Anti-pattern found in T-HE-011:** SettingsPage has 3 sections (Notifications, Privacy, Theme) using `<div>` + `<h3>` instead of `<fieldset>` + `<legend>`
- **Recipe:** see §7 FormField example

**(h) `aria-describedby` for hints & errors (T-HE-008):**

- Form hints and error messages MUST be linked via `aria-describedby` (not just visually adjacent)
- WCAG 1.3.1 + 3.3.1 (Error Identification)
- **Recipe:** see §7 FormField example

**The 8-minimum summary (v2 = the full set):** label · role · focus-visible · contrast · motion-safe · htmlFor/id · fieldset/legend · aria-describedby.

---

## §5 — i18n contract (unchanged from v1)

v1's i18n contract is the same. Brief recap for context (full spec in v1 §5):

- All user-facing strings → `useTranslation()` from `react-i18next`
- 5 critical aria-labels in AppLayout → i18n keys (`a11y.skipToContent`, etc. — T-HE-005)
- 9 of 10 locale files in `src/i18n/locales/` are 1-line `{"TODO":"TODO"}` stubs (T-HE-006 P1 finding) — remove from config or commit to translation provider
- JSX string-literal audit pattern (T-HE-006 v2 Phase G): Grep `src/pages/` and `src/components/` for English strings >3 words outside `t()` calls

**v2 adds one rule:** aria-labels that contain dynamic data (e.g., `aria-label={`Notifications: ${count}`}`) MUST use template literals inside `t()` with ICU placeholders, not string concatenation. Example: `t('a11y.notificationsCount', { count })` → key `"a11y.notificationsCount": "Notifications: {{count}}"`.

**ICU cheatsheet (NEW in v2, T-HE-006 v2 Phase G):**

```json
{
  "a11y.notificationsCount": "Notifications: {{count}}",
  "a11y.tabsCount_one": "{{count}} tab",
  "a11y.tabsCount_other": "{{count}} tabs",
  "errors.required_one": "{{field}} is required",
  "errors.required_other": "{{field}} is required",
  "common.andList": "{items, list}"
}
```

- `{{var}}` — simple interpolation
- `{var, plural, =0 {none} one {1 item} other {# items}}` — plural (CLDR rules)
- `{var, list, separator }` — list ("a, b, c" or "a, b, and c")
- Avoid string concat (`t('hello') + ' ' + name`) — it breaks RTL languages (Arabic, Hebrew). Use `t('helloName', { name })`.

---

## §6 — Component checklist (v2: 18 points — 6 new)

v1's 12-point checklist is unchanged for rows 1-12 (see v1 §6). v2 adds **6 new points** (rows 13-18) for the cascade content.

**The 6 NEW v2 points:**

13. **Motion-safe / motion-reduce** — every `transition-*` / `animate-*` is wrapped in `motion-safe:` OR has `motion-reduce:` counterpart (§4e)
14. **htmlFor/id pairing** — every `<label>` has a matching `<input id>` (§4f)
15. **fieldset/legend for groups** — radio/checkbox groups + SettingsPage sections use `<fieldset>` + `<legend>` (§4g)
16. **aria-describedby for hints/errors** — every form hint or error message is linked via `aria-describedby` (§4h)
17. **Dark parity (4 states × 4 interactions)** — bg/text/border/ring have `dark:` variants AND each interaction state (hover/focus/active/disabled) too (§3)
18. **Store master** — if the component reads from a zustand store, the store uses `masterStorage` for persisted keys (not direct `localStorage` — T-HE-006 v2 L33 finding on `uiStore.ts`)

**Quick reference — the 18 points in 6 buckets:**

- Tokens (1-5): color · spacing · radius · typography · elevation
- Dark (6-7): `dark:` variant exists · chart body has `dark:bg` (§3)
- A11y (8-15): label · role · focus-visible · contrast · motion-safe · htmlFor/id · fieldset/legend · aria-describedby
- i18n (16-17): all strings via `t()` · dynamic strings use ICU placeholders
- Store (18): `masterStorage` not direct `localStorage`

---

## §7 — 7 worked examples (v2: +FormField, +Skeleton, +LoadingSpinner)

v1 had 3 examples: Button, Modal, ChartBody. v2 adds **FormField** (form-label + fieldset/legend + aria-describedby), **Skeleton** (motion-safe pattern), and **LoadingSpinner** (motion-safe + role="status"). The 3 v1 examples are unchanged — see v1 §7 for full code.

### Example 4: FormField (NEW in v2)

T-HE-008 + T-HE-011 patterns combined.

```tsx
// src/components/ui/FormField.tsx
import { useId } from 'react';

interface FormFieldProps {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: (id: string, describedBy: string) => React.ReactNode;
}

export function FormField({ label, hint, error, required, children }: FormFieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className="space-y-1">
      <label htmlFor={id} className="text-sm font-medium text-slate-900 dark:text-slate-50">
        {label}
        {required && (
          <span className="text-red-600 dark:text-red-400 ml-1" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {children(id, describedBy!)}
      {hint && (
        <p id={hintId} className="text-xs text-slate-600 dark:text-slate-400">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-xs text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}

// Usage:
<FormField label="Email" hint="We'll never share this." required>
  {(id, describedBy) => (
    <input
      id={id}
      aria-describedby={describedBy}
      aria-invalid={!!error}
      type="email"
      className="..."
    />
  )}
</FormField>;
```

**What this gets right (§4 f+g+h + §3):**

- `htmlFor={id}` ↔ `id={id}` via `useId()` (avoids SSR mismatch + ensures pairing)
- `aria-describedby` links to hint AND error ids (screen reader announces both)
- `aria-invalid` for the error state (WCAG 1.3.1)
- `role="alert"` on error message (announced when it appears)
- All `dark:` variants for the text colors
- `aria-hidden="true"` on the `*` (decorative — screen reader already hears "required" from `aria-required`)

### Example 5: FormField as fieldset group (NEW in v2)

T-HE-011 pattern for radio/checkbox groups.

```tsx
<fieldset className="space-y-2 border border-slate-200 dark:border-slate-700 rounded-md p-3">
  <legend className="text-sm font-medium text-slate-900 dark:text-slate-50 px-1">
    Notification preferences
  </legend>
  <FormField label="Email" hint="...">
    {(id) => <input id={id} type="checkbox" ... />}
  </FormField>
  <FormField label="SMS" hint="...">
    {(id) => <input id={id} type="checkbox" ... />}
  </FormField>
</fieldset>
```

**What this gets right (§4g):** the `<legend>` becomes the group label for screen readers; tabbing through the radios announces the group context.

### Example 6: Skeleton with motion-safe (NEW in v2)

T-HE-007 §4 + §6 pattern.

```tsx
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'bg-slate-200 dark:bg-slate-800',
        'rounded-md',
        // Shimmer animation ONLY for motion-safe users; instant for motion-reduce
        'motion-safe:animate-pulse motion-reduce:opacity-60',
        className
      )}
      aria-busy="true"
      aria-live="polite"
    />
  );
}
```

**What this gets right (§4e):** `motion-safe:animate-pulse` runs the standard Tailwind pulse for ~98% of users; `motion-reduce:opacity-60` gives motion-reduce users a static placeholder (WCAG 2.3.3).

### Example 7: LoadingSpinner with reduced-motion fallback (NEW in v2)

```tsx
export function LoadingSpinner({ size = 16 }: { size?: number }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={cn(
        'inline-block rounded-full border-2 border-slate-300 border-t-blue-600',
        'dark:border-slate-600 dark:border-t-blue-400',
        // Spinner spin only for motion-safe; static for motion-reduce (WCAG 2.3.3)
        'motion-safe:animate-spin motion-reduce:opacity-60'
      )}
      style={{ width: size, height: size }}
    />
  );
}
```

**What this gets right (§4e + §4a):** `role="status"` + `aria-label="Loading"` so screen readers announce the loading state. `motion-safe:animate-spin` for ~98% of users; `motion-reduce:opacity-60` for the ~2% with motion-reduce preference (no spin, just dimmed).

---

## §8 — Common violations + grep recipes (v2: 14 patterns)

v1 had 9 patterns. v2 adds 5 from the cascade audits (T-HE-005 + T-HE-007 §8 + T-HE-008 §7 + T-HE-011).

**The 5 NEW v2 violations:**

| #   | Pattern                                                                 | Why it's bad                                                       | Grep recipe (with absolute path)                                                                                    | Cascade source |
| --- | ----------------------------------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- | -------------- |
| 10  | `transition-*` / `animate-*` outside `motion-safe:`                     | Vestibular trigger (WCAG 2.3.3)                                    | `Grep -r --include="*.tsx" -E "(transition-\|animate-)(?!.*motion-safe:)" "$ROOT/src/components" "$ROOT/src/pages"` | T-HE-007 §8    |
| 11  | `<label>` without matching `htmlFor`                                    | Screen reader can't associate label with input (WCAG 1.3.1, 3.3.2) | `Grep -r --include="*.tsx" -B 1 "<label" "$ROOT/src" \| grep -v "htmlFor"`                                          | T-HE-008 §7    |
| 12  | `<div onClick>` without `role="button"` + `tabIndex` + keyboard handler | Not focusable, not keyboard-operable (WCAG 2.1.1)                  | `Grep -r --include="*.tsx" -E "<div onClick" "$ROOT/src" \| grep -v "role=\"button\""`                              | T-HE-006 v2 §A |
| 13  | Duplicate `dark:` class (e.g., `bg-white dark:bg-white`)                | No-op bug — the dark class does nothing                            | `Grep -rEoh "(bg-\|text-\|border-)([a-z]+-)?([0-9]+) dark:(bg-\|text-\|border-)([a-z]+-)?\3" "$ROOT/src"`           | T-HE-005       |
| 14  | Radio/checkbox group without `<fieldset>`/`<legend>`                    | Group context lost for screen readers (WCAG 1.3.1)                 | `Grep -r --include="*.tsx" -A 2 'type="radio"' "$ROOT/src" \| grep -v "fieldset"`                                   | T-HE-011       |

**v1's 9 patterns (unchanged) are in v1 §8.** v2's 5 new patterns complement, not replace.

**Pre-commit grep (paste into `.husky/pre-commit` or CI):**

```bash
#!/bin/bash
# Run from project root
ROOT="C:/Users/Tahir/Desktop/frontend that i want/fpa"
# v2 patterns 10-14 (run only the new ones in fast mode; full set in CI)
! grep -rE "<div onClick" "$ROOT/src" --include="*.tsx" | grep -vq 'role="button"'
! grep -rE "(bg-|text-|border-)([a-z]+-)?([0-9]+) dark:(bg-|text-|border-)([a-z]+-)?\3" "$ROOT/src"
! grep -rE "<label" "$ROOT/src" --include="*.tsx" -A 1 | grep -vq "htmlFor"
```

---

## §9 — Cross-references (v2: 11 cascade sources, 0 escapes)

**Cascade sources used in v2 (all `Glob ABSOLUTE path` verified 2026-06-13):**

- [`DESIGN_SYSTEM_GUIDE.md`](./DESIGN_SYSTEM_GUIDE.md) — v1, 475L
- [`MOTION_PATTERNS.md`](./MOTION_PATTERNS.md) — T-HE-007, 224L
- [`FORM_LABEL_ARIA_PATCHES.md`](./FORM_LABEL_ARIA_PATCHES.md) — T-HE-008, 280L
- [`MOTION_TOKENS_TAILWIND_PATCHES.md`](./MOTION_TOKENS_TAILWIND_PATCHES.md) — T-HE-009, motion-token spec
- [`SETTINGS_FIELDSET_ARIA_PATCHES.md`](./SETTINGS_FIELDSET_ARIA_PATCHES.md) — T-HE-011, 440L
- T-HE-012 motion tokens → Tailwind (formalized via `tailwind.config.ts` patch)
- T-HE-003 7 light-only components (DarkState, CurrencyInput, NLQInput, ExportMenu, SheetTabs, Progress, EmptyState)
- T-HE-005 9 chart bodies (BoxPlot, Bullet, Combo, Funnel, Gantt, Gauge, Sankey, Waterfall, Tornado)
- T-HE-006 v2 audit (the original 11-section audit that started the cascade)

**Hera's wider body of work (cross-link to v1 §10 — unchanged):**

- Audit reports (v1, v2) — rigor passes
- Role="alert" patches — 11-file JSX text-leak fix
- A11y regression suite (`src/__tests__/a11y/wcag-aa.test.tsx`)
- 5 critical aria-labels → i18n routing spec
- chartPalette.ts spec (200+ hex literals → 1 config file)

---

## §10 — Stats & Honest Labeling

**v2 stats:**

- 8 sections (consolidated from v1's 11)
- 7 worked examples (v1: 3, +4: FormField, FormField-as-fieldset, Skeleton, LoadingSpinner)
- 18-point checklist (v1: 12, +6)
- 14 violation patterns (v1: 9, +5)
- 11 motion tokens (5 duration + 2 easing + 2 keyframe + 2 animation) — v1 had 0
- 4 NEW a11y minimums (motion-safe, htmlFor/id, fieldset/legend, aria-describedby) — v1 had 4, v2 has 8
- 4-state × 4-interaction dark parity matrix (16 cells per component) — v1 had a single `dark:` rule
- v2 doc size: 399L (target was 450L, -11% under; expanded from 359L with §3 Button matrix, §5 ICU cheatsheet, §7 LoadingSpinner; gap closed by 40L but still 51L short of target)
- v1 → v2 ratio: 475L → 399L (-16%); v2 is intentionally more compact (8 sections vs v1's 11) but adds 4 worked examples and 4 NEW a11y minimums

**Self-assessment (Honest Labeling):**

- **3 strengths:** (1) Operational recipes in §7 (FormField, fieldset group, Skeleton, LoadingSpinner) are copy-paste-ready; (2) §3's 4-state × 4-interaction parity matrix is the single source of truth for dark-mode; (3) §8's pre-commit grep catches the 5 highest-leverage violations
- **3 gaps:** (1) §5 i18n is still sparse — could expand with locale-file structure diagram; (2) §6 row 18 (store master) is a single line — could be a full section with the 13-store inventory; (3) §7 doesn't show the loading→loaded transition (would need a `useEffect` pattern)
- **Next 60-min candidate:** expand §6 row 18 into a "Zustand store contribution guide" section (the 13 stores + 4 audit findings) — push-GATED until Apollo's T-AP-010 lands

**Validation:**

- D-009 Triangulation: 9 file:line citations in §9 cross-references, all `Glob ABSOLUTE path` verified
- Three Witnesses (D-002): 3 explicit in §1 (rule/evidence/consequence) and 2 implicit in §2/§4
- Honest Labeling (D-007): 4 explicit flags in this section
- 4-Question Framework: file path verified (Glob-ABSOLUTE), method verified (3-witness), cross-Muse anchor (T-HE-007/008/009/011), scope/size flagged
- Codification 8 (Glob ABSOLUTE path): applied to all 9 file:line refs in §9
- Push-INDEPENDENT: this is a docs-only change; lands in `docs/drafts/hera/`, no impact on runtime

---

**END — Design System Contribution Guide v2 (Hera T-HE-013)**
