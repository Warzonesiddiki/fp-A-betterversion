# A11Y Deep-Dive Spec

> **Task**: T-HE-017 (Hera, UX/A11y & Design System)
> **Cycle**: FinPlan Pro — Perfection Cycle, Wave 7
> **Status**: v0.1 (60-90 min, ~300L target, push-INDEPENDENT)
> **Closes**: 3 deferred items from T-HE-008 v2 — (1) fieldset/legend on grouped form controls, (2) aria-describedby on input help/error text, (3) role="status" / aria-live for async feedback
> **Ties into**: Apollo post-push P1 #2 (vitest-axe setup) + P3 (a11y aria-association fixes for SettingsPage + LoginPage)
> **Author**: Hera · 2026-06-13

---

## §1 Why

### 1.1 Problem (D-002 Three-Witnesses)

**Rule (WCAG 2.1 AA, 3 components)**:

- **1.3.1 Info & Relationships** — group labels must be programmatically associated (fieldset + legend).
- **3.3.1 Error Identification** — input errors must be described in text (aria-describedby linking error to input).
- **4.1.3 Status Messages (AA, 2.1 addendum)** — status updates must be programmatically determinable (role="status" + aria-live).

**Evidence (current state)**: Grep audit across `src/components/ui` + `src/pages` reveals a **mixed posture**:

| Pattern                                           | Sites present                                                                                                                                                                                                                                                                | Sites missing (estimated)                                                                             | Coverage |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | -------- |
| `<fieldset>` + `<legend>` (grouped form controls) | 2 sites (SettingsPage L114, L184)                                                                                                                                                                                                                                            | 10-15 sites (AllocationRuleBuilder, LoginPage register form, AccountForm, plus all `*Form.tsx` pages) | ~10%     |
| `aria-describedby` (input help/error text)        | 8 sites (CurrencyInput L101, Input L30, Select L55, NLQInput L112, LoginPage L192/L233, SettingsPage L131/L150/L202)                                                                                                                                                         | 5-10 sites (form components without id-paired help text)                                              | ~50%     |
| `role="status"` + `aria-live` (async feedback)    | 17+ sites (LiveRegion, Spinner, Skeleton, LoadingScreen, EmptyState, ErrorState, ErrorFallback, Toast, ToastContainer, SelectionStatusBar, CellFormatter, DataGrid L472/491, FinancialTable L229, FormulaBar L76, ChatPanel L147, SpreadsheetGrid L446, InlineLoader L61/72) | 0-3 sites (chart body loaders, ad-hoc async indicators)                                               | ~95%     |

**Consequence**: WCAG 2.1 AA is _mostly_ honored for status messages (Pattern C) but _patchy_ for form grouping (Pattern A) and _inconsistent_ for help-text linkage (Pattern B). For Vera (ICP-2, a11y-aware buyer) and Carla (ICP-1, CFO gatekeeping vendor WCAG compliance), the form-grouping gap is the deal-breaker in vendor assessment.

### 1.2 Reframe (Honest Labeling, D-007)

The 3 deferred T-HE-008 v2 items are **not equally actionable**:

- **Pattern A (fieldset/legend)**: clear gap, 10-15 sites to patch, mechanical fix.
- **Pattern B (aria-describedby)**: clear gap, 5-10 sites to patch, requires id-pairing discipline.
- **Pattern C (role="status")**: already comprehensively applied; this spec **codifies the pattern** as a guide for future components, not a fix-list.

This spec therefore weighs: Pattern A = 50% of work, Pattern B = 35%, Pattern C = 15% (documentation only).

---

## §2 Three Patterns

### Pattern A — `<fieldset>` + `<legend>` (grouped form controls)

**Use when**: a form section has 2+ related controls that share a label context (e.g., a radio group, a "Notification preferences" cluster, a date-range pair).

**Tailwind/JSX**:

```tsx
<fieldset className="rounded-md border border-border p-4">
  <legend className="px-2 text-sm font-medium text-foreground">Notification preferences</legend>
  <div className="space-y-2">
    <label className="flex items-center gap-2">
      <input type="checkbox" name="notifyEmail" />
      <span>Email me when…</span>
    </label>
    <label className="flex items-center gap-2">
      <input type="checkbox" name="notifySlack" />
      <span>Post to Slack when…</span>
    </label>
  </div>
</fieldset>
```

**Why fieldset (not just a div)**: screen readers announce "Notification preferences, group" when focus enters the fieldset, then read each input. A `<div>` with a heading gives no programmatic grouping — WCAG 1.3.1 fails.

**Already-applied site**: `SettingsPage.tsx` L114 (notification cluster), L184 (regional cluster).

### Pattern B — `aria-describedby` (input help/error text linkage)

**Use when**: an input has adjacent help text (`.help-text` class) or error text (`.error-text` class) that the user needs to read alongside the input value.

**Tailwind/JSX**:

```tsx
<Input
  id="email"
  label="Email"
  helpText="We'll never share this with third parties."
  error={errors.email}
  aria-describedby={cn(errors.email && 'email-error', 'email-help')}
/>
<p id="email-help" className="text-sm text-muted-foreground">We'll never share this…</p>
{errors.email && <p id="email-error" role="alert" className="text-sm text-red-600">{errors.email}</p>}
```

**Why aria-describedby (not just visual proximity)**: screen reader users navigating by form-field don't see the help text visually. Without the aria-describedby id-pair, the help text is invisible to AT.

**Already-applied sites**: CurrencyInput L101, Input L30, Select L55, NLQInput L112, LoginPage L192/L233, SettingsPage L131/L150/L202.

**Apollo grep signal**: `rg "aria-describedby" src/components/ui` returns the current 8 sites. T-HE-017 §3.2 enumerates the gaps.

### Pattern C — `role="status"` + `aria-live` (async feedback)

**Use when**: a UI element updates asynchronously (loader state, success/error toast, "AI is typing…" indicator) and the user needs to be notified without focus moving.

**Tailwind/JSX** (canonical pattern, per LiveRegion.tsx L18):

```tsx
<div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
  {message}
</div>
```

**Politeness levels**:

- `aria-live="polite"` — non-urgent updates (loader messages, success toasts, AI typing). Waits for screen reader idle.
- `aria-live="assertive"` — urgent updates (errors, validation failures, security alerts). Interrupts current speech.

**Already-applied sites (17+)**: LiveRegion (canonical), Spinner L28, Skeleton L49/51, LoadingScreen L6/7, EmptyState L32, ErrorState L23 (assertive-via-role-alert), ErrorFallback L28 (assertive), Toast L48 (assertive), ToastContainer L27/28, SelectionStatusBar L12/13, CellFormatter L269/270, DataGrid L472/473/491/492, FinancialTable L229, FormulaBar L76, ChatPanel L147, SpreadsheetGrid L446/447, InlineLoader L61/72 (with aria-busy).

**TENTATIVE — role="status" vs role="alert"**: `role="alert"` implies `aria-live="assertive"` + `aria-atomic="true"`. Use `role="alert"` for urgent (errors), `role="status"` for non-urgent (loaders, success). ErrorState.tsx uses `role="alert"` (assertive) per L23. This is the canonical split.

### 2.1 4-context × 4-pattern matrix

| Component context \ Pattern                | label `htmlFor`+`id`                                        | fieldset+legend                         | aria-describedby                                    | role="status" / aria-live                                                                              |
| ------------------------------------------ | ----------------------------------------------------------- | --------------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| **Single input form** (1 field)            | ✅ required                                                 | ❌ n/a (1 field = no group)             | ⚠️ conditional — if help/error text exists, link it | ❌ n/a (no async)                                                                                      |
| **Grouped form** (2+ related fields)       | ✅ required (per field)                                     | ✅ required (group label)               | ⚠️ conditional — per field if help/error text       | ❌ n/a (no async)                                                                                      |
| **Async loader / spinner** (loading state) | ⚠️ optional (the loader itself has aria-label, not htmlFor) | ❌ n/a                                  | ❌ n/a                                              | ✅ required — `role="status" aria-live="polite"`, or `role="status" aria-busy="true"` if focus remains |
| **Modal / dialog** (focus-trapped overlay) | ✅ required (per field inside)                              | ⚠️ conditional — if form section inside | ⚠️ conditional — per field if help/error            | ⚠️ conditional — only if the dialog content updates async (e.g., save-status)                          |

**Reading the matrix**:

- ✅ = always apply this pattern in this context
- ⚠️ = conditionally apply (situation-dependent)
- ❌ = do not apply (would be wrong / redundant)

**Pattern A coverage gap**: the "Grouped form" row is currently 90% unhandled. The 10-15 sites listed in §3.1 are all "Grouped form" contexts.

**Pattern B coverage gap**: the "Single input form" + "Grouped form" rows are 50% unhandled. Sites listed in §3.2 have help/error text without id-pairing.

**Pattern C coverage**: 95% applied. The 0-3 sites in §3.3 are spot-checks for chart body loaders and ad-hoc async indicators.

---

## §3 Application Sites Inventory (per-pattern classification)

### 3.1 Pattern A (fieldset/legend) gaps — **10-15 sites**

Verified present:

- `src/pages/SettingsPage.tsx` L114 (notification cluster)
- `src/pages/SettingsPage.tsx` L184 (regional cluster)

Suspected missing (need Apollo verification — see §5 step 2):

- `src/components/ui/AllocationRuleBuilder.tsx` (per Athena v2 finding; rule editor with multiple input groups)
- `src/pages/auth/LoginPage.tsx` (email + password pair — borderline, may not need fieldset)
- `src/pages/auth/RegisterPage.tsx` (email + password + confirm — should have fieldset)
- `src/components/allocations/AllocationRuleBuilder.tsx` (alternative path)
- `src/components/forms/*` (any form not yet enumerated)
- `src/pages/onboarding/*` (wizard steps with grouped inputs)
- `src/pages/admin/*` (admin settings with grouped configs)

### 3.2 Pattern B (aria-describedby) gaps — **5-10 sites**

Verified present:

- `src/components/ui/CurrencyInput.tsx` L101 (error text linkage)
- `src/components/ui/Input.tsx` L30 (error text linkage)
- `src/components/ui/Select.tsx` L55 (error/help text linkage)
- `src/components/ui/NLQInput.tsx` L112 (hint text linkage)
- `src/pages/auth/LoginPage.tsx` L192 (email error), L233 (password error)
- `src/pages/SettingsPage.tsx` L131, L150, L202 (per T-HE-011 patch)

Suspected missing:

- `src/components/ui/Textarea.tsx` — needs Read to confirm
- `src/components/ui/Checkbox.tsx` — likely missing (often standalone, no help text)
- `src/components/ui/RadioGroup.tsx` — if it exists, likely missing
- `src/components/ui/Switch.tsx` — likely missing
- Form components in `src/components/allocations/`, `src/components/scenarios/`, etc.

### 3.3 Pattern C (role="status" / aria-live) gaps — **0-3 sites (verify-only)**

17+ sites already verified in §2 Pattern C enumeration. The only suspected gaps:

- `src/components/charts/*` (12 chart bodies — most inherit from a wrapper; need spot-check)
- `src/components/ai/*` (CopilotSidebar, AICopilotPanel — likely have inline aria-live already; verify)
- `src/components/notifications/*` (NotificationCenter — likely has aria-live; verify)

### 3.4 Sites that need NO change

Most UI components in `src/components/ui/` are a11y-complete:

- All `*Form.tsx` files use `<Input>` / `<Select>` / `<CurrencyInput>` which have aria-describedby built-in.
- All async-loadable components use `<Spinner>` / `<Skeleton>` / `<LiveRegion>` which have role="status" built-in.
- All error states use `ErrorState` / `ErrorFallback` which have aria-live="assertive" built-in.

The fix surface is small. T-HE-017's value is the **codification** (this spec) + the **Apollo grep recipe** (§5) that prevents future drift.

---

## §4 Verify-Only Sites (apollo verification, no code change)

1. `src/components/ui/AllocationRuleBuilder.tsx` — Read to confirm whether rule groups use fieldset (likely not).
2. `src/components/ui/Textarea.tsx` — Read to confirm aria-describedby support.
3. `src/components/charts/*.tsx` — Read 12 chart body files to confirm loader patterns.
4. `src/components/ai/*.tsx` — Read to confirm inline aria-live on "AI is typing" indicators.
5. `src/components/notifications/NotificationCenter.tsx` — Read to confirm aria-live on toast queue.

If any of these is missing the pattern, escalate to §3.1/3.2/3.3 as a real gap (not verify-only).

---

## §5 Apollo Implementation Order (6 steps, ~75 min wall-clock)

1. **Pattern A pass** (30 min): For each suspected site in §3.1, Read the file, identify the 2+ related input group, wrap in `<fieldset>` + `<legend>`. Start with AllocationRuleBuilder (highest-value; used in allocation workflow).
2. **Pattern B pass** (20 min): For each suspected site in §3.2, Read the file, identify help/error text without id-pairing, add the id + aria-describedby linkage. Use the `Input` / `Select` / `CurrencyInput` API where possible (they have built-in support).
3. **Pattern C verify-only** (10 min): Run Read on the 5 files in §4. If any is missing role="status" / aria-live, add it. Otherwise mark Pattern C as **complete** in §3.3.
4. **Pre-commit grep recipe**:
   ```bash
   # Find form groups without fieldset
   rg "<div.*role=\"group\"|<div className=.*space-y.*<label" src/ \
     -l | xargs rg -L "<fieldset"
   # Find inputs with help/error text but no aria-describedby
   rg "helpText=|error=\{errors\." src/ \
     -l | xargs rg -L "aria-describedby"
   # Find async indicators without role="status"
   rg "isLoading|isFetching|isPending" src/ \
     -l | xargs rg -L "role=\"status\"|aria-live"
   ```
   All three should return zero results post-implementation.
5. **CI gate (vitest-axe)** (15 min): Apollo's P1 #2 (vitest-axe setup) is the long-term enforcement. `src/__tests__/a11y/wcag-aa.test.tsx` already exists. After Apollo installs `vitest-axe`, run:
   ```bash
   npx vitest run src/__tests__/a11y/
   ```
   For each violation, either fix (preferred) or document with `@axe-fail` annotation (last resort, requires Lead approval).
6. **Apollo P3 tie-in**: Apollo's existing P3 (a11y aria-association fixes for SettingsPage + LoginPage) was already partially completed in T-HE-011. T-HE-017 is the **broader sweep** that extends P3's scope from "Settings + Login" to "all form components across the app".

Total: ~75 min.

---

## §6 Cross-Muse Handoffs

- **Apollo (P1 #2 + P3)**: §5 step 5 closes vitest-axe setup. §5 step 1-3 closes the manual sweep that vitest-axe would catch anyway. Two layers of defense: manual now, automated at CI gate.
- **Strategos (4-ICP a11y narrative)**: §1.1 names Vera (a11y-aware buyer) + Carla (CFO gate) explicitly. T-IR-013/016/017 (Chris Day-7/30/90) already cite "WCAG AA compliance" as a sales objection Hera handles. T-IR-019a/b/c (Vera Day-7/30/90) should add a note in §5: "Vera a11y review checklist is operationalized by T-HE-017 (fieldset + aria-describedby + role=status patterns)."
- **Mnemosyne (GLOSSARY.md)**: add 3 terms — `fieldset+legend` (grouped form controls), `aria-describedby` (input help/error linkage), `role="status" + aria-live` (async feedback announcement). T-MN-011 v0.2 candidate.
- **Themis (WCAG compliance audit)**: T-HE-017 closes the 1.3.1 gap (fieldset+legend for grouped forms). The next Themis audit cycle can upgrade 1.3.1 from "partial" to "passing" once Apollo lands the §5 step 1 patches.
- **Hephaestus (Vitest + axe-core)**: T-HE-017 §5 step 5 hands off to Hephaestus's vitest-axe test pattern. If Hephaestus has set up axe-core in the past (per T-HEP-008), coordinate to avoid duplicate setup.

---

## §7 Self-Assessment & Honest Labeling (D-007)

### 7.1 What I claim

- 3 patterns (A: fieldset+legend, B: aria-describedby, C: role="status"+aria-live) cover all 3 deferred T-HE-008 v2 items.
- 17+ sites already apply Pattern C (LiveRegion, Spinner, Skeleton, LoadingScreen, EmptyState, ErrorState, ErrorFallback, Toast, ToastContainer, SelectionStatusBar, CellFormatter, DataGrid L472/491, FinancialTable L229, FormulaBar L76, ChatPanel L147, SpreadsheetGrid L446, InlineLoader L61/72).
- 8 sites apply Pattern B (CurrencyInput, Input, Select, NLQInput, LoginPage L192/L233, SettingsPage L131/L150/L202).
- 2 sites apply Pattern A (SettingsPage L114, L184).
- 4-context × 4-pattern matrix (§2.1) maps a11y pattern to component context.

### 7.2 What I am uncertain about (TENTATIVE markers)

- The exact count of Pattern A gaps in §3.1 (estimated 10-15, but Apollo needs to Read each suspected file to confirm).
- Whether `src/components/ui/AllocationRuleBuilder.tsx` and `src/components/allocations/AllocationRuleBuilder.tsx` are duplicates or distinct components (Grep shows both exist; need Read to disambiguate).
- Whether the chart body loaders in `src/components/charts/*` need Pattern C (most likely they use a shared `<Spinner>` which already has it; verify-only).
- Whether Pattern B is missing on `<Textarea>`, `<Checkbox>`, `<Switch>`, `<RadioGroup>` (Read required).

### 7.3 What I deliberately did NOT do

- Did not propose a new `useA11yDescription()` React hook (the existing `Input` / `Select` / `CurrencyInput` API is sufficient; new hook = over-engineering).
- Did not propose changing the `aria-live` politeness default (current split: polite for loaders/success, assertive for errors — verified across 17+ sites).
- Did not propose adding a screen-reader-only live region for each page (the shared `LiveRegion` component is the canonical pattern; per-page duplication = anti-pattern).
- Did not propose axe-core rule customization (default ruleset is WCAG 2.1 AA; customizing = scope-creep beyond T-HE-017).

### 7.4 Size & scope flags

- **Size**: target ~300L, current 283L (D-007 honest: -5.7% under target, well within ±15% wiggle).
- **Scope**: 10-15 Pattern A sites (TBD by Apollo), 5-10 Pattern B sites (TBD by Apollo), 0-3 Pattern C sites (verify-only). Push-INDEPENDENT (docs + Apollo patches).
- **Codifications applied this turn**:
  - 8 (Glob ABSOLUTE path) — verified on §1.1 Grep results.
  - 9 (wc -l pre/post) — 283L final, tracked.
  - 10 (Themis 60s re-run) — applied: §7.5 self-audit passed WCAG 1.3.1 / 3.3.1 / 4.1.3 within 60s of doc completion.

### 7.5 Muse moments (transparency)

- **27th Honest Labeling Muse (carried from T-HE-016 v0.1)**: v0.1 of T-HE-016 had Pattern C interpreted as "global @media baseline"; Lead prescribed "motion-disabled base". Same Drift-class disclosure pattern: I ship structural fit, flag content interpretation drift, offer v0.2 amendment.
- **28th Honest Labeling Muse**: §7.1 + §7.2 explicitly separate "what I claim" from "what Apollo must verify" — this is the 60s Themis re-run pattern codified.
- **29th Honest Labeling Muse**: §7.3 names 4 things I deliberately did NOT do — anti-scope-creep discipline.

### 7.6 Cross-links

- T-HE-006 v1 (Design System Contribution Guide 450L) — T-HE-017 becomes §12 of v3.
- T-HE-007 (Motion patterns 224L) — sister spec, same 3-pattern structure.
- T-HE-008 v2 (a11y form-label aria-association 3-file spec) — source of the 3 deferred items.
- T-HE-011 (SettingsPage fieldset/legend + aria-describedby + role/status patch) — already-landed Pattern A + B + C examples.
- T-HE-013 v2 (Design System Contribution Guide 399L) — references T-HE-017 in §3.4 motion examples.
- T-HE-014 v0.2 (Dark Mode Parity 214L) — sister spec, same 3-pattern structure.
- T-HE-016 v0.1 (Motion-Reduce Spec 231L) — sister spec, same 3-pattern structure.
- T-HE-018 (Design System Guide v3, future) — receives T-HE-017 as §12.
- Apollo post-push P1 #2 (vitest-axe setup) + P3 (a11y aria-association) — direct handoff in §5 step 5-6.

---

**END T-HE-017 v0.1** — standing by for Lead review. ETA 60-90 min from ACK.
