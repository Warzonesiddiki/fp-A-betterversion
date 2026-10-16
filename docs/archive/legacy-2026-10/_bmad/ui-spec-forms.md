# UI-SPEC-B · Form-System Implementation Spec + Migration Wave Map (UI-05)

> **Status:** HYPOTHESIS — every recommendation here is a proposal pending Phase 3 authorization (honesty rules; breadth ≠ approved redesign).
> **Author:** Vega (UI builder), team fpa · **Date:** 2026-08-23 · **Task:** UI-SPEC-B (plan §1 UI-05), read-only spec — zero code changes made.
> **Inputs:** `_bmad/project-completion-plan.md` §1 UI-05 · `_bmad/ui01-design-system-audit.md` Gap #6 (form-control layer) + Gap #7 (save states) · fresh witnesses re-measured by Vega (see §8).

---

## 1. Current state (witnessed 2026-08-23)

All counts re-measured by Vega via PowerShell `Select-String` (`-List`, case-sensitive where noted) over non-test `.tsx` under `src/pages` unless stated otherwise. Method chosen because the Grep MCP tool has known false-negative flakiness in this repo.

| Witness                                                                           | Value                                                                                                                                                                                              | Source                                                                                                                                    |
| --------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Non-test page files                                                               | **203**                                                                                                                                                                                            | fresh count, matches Uxie's audit denominator                                                                                             |
| Pages with raw `<input`                                                           | **52**                                                                                                                                                                                             | fresh count, matches audit Gap #6                                                                                                         |
| Pages with raw `<select`                                                          | **36**                                                                                                                                                                                             | fresh count, matches audit Gap #6                                                                                                         |
| Pages with hand `<label`                                                          | **34**                                                                                                                                                                                             | fresh count — **+1 vs audit's 33** (drift note in §8; plausible cause: label added by concurrent E-02/E-02-F a11y fixes since Uxie's run) |
| Pages showing a Saving… indicator                                                 | **2** — `ProcurementCyclePage.tsx:6`, `ValueBasedCarePage.tsx:38`                                                                                                                                  | fresh count, matches audit Gap #7 ("2/203")                                                                                               |
| Pages disabling submit while busy                                                 | **7** — `EngineCatalogPage.tsx:179`, `AIIntelligencePage.tsx:358`, `GoalSeekPage.tsx:257`, `ForgotPasswordPage.tsx:161`, `LoginPage.tsx:287`, `RegisterPage.tsx:80`, `ScenarioBuilderPage.tsx:377` | fresh count, matches audit Gap #7                                                                                                         |
| Files under `src/components/**` mentioning `FormField\|Textarea\|Checkbox\|Radio` | **0**                                                                                                                                                                                              | absence witness (case-sensitive) — repo has NONE of these primitives today                                                                |
| Form primitives in the ui barrel                                                  | only `Input` (`src/components/ui/index.ts:44`), `Select` (`:57`), `Button` (`:9`), `CurrencyInput` (`:18`) — all 93 lines scanned, no field-level primitives                                       | barrel read                                                                                                                               |
| Existing save-related hook                                                        | `src/hooks/useAutoSave.ts` defines `SaveStatus = 'idle' \| 'pending' \| 'saving' \| 'saved' \| 'error'` (`:9`); debounce autosave-oriented; **0 page consumers**                                   | hook read + importer sweep                                                                                                                |
| Radix packages installed                                                          | `react-alert-dialog`, `react-dialog`, `react-dropdown-menu`, `react-popover`, `react-select`, `react-slider`, `react-tabs` — **no checkbox / radio-group**                                         | `package.json` witness                                                                                                                    |
| Primitive test coverage precedent                                                 | `Input.test.tsx`, `Select.test.tsx`, `Button.test.tsx`, `CurrencyInput.test.tsx` exist colocated                                                                                                   | dir listing                                                                                                                               |

**Representative hand-rolled markup (exemplars):**

- `src/pages/budgets/BudgetCreatePage.tsx:186-199` — hand label (`htmlFor`) + `Input` + conditional error `<p className="text-xs text-red-400">`; repeated verbatim-style blocks for Fiscal Year (`:201-218`, includes an unguarded `parseInt(e.target.value)` coercion at `:215`) and Base Currency (`:220-232`); a segmented button group impersonating radios at `:234-260` (`role="group"` + twin styled buttons).
- `src/pages/currency/FXRatesPage.tsx:249-311` — add-rate modal built from four stacked raw `<label>`/`<select>`/`<input>` pairs (`:249/:255`, `:269/:272`, `:289/:292`, `:305/:311`), no shared error/save treatment.

These two exemplars anchor every API decision below: if the primitives cannot absorb _these two pages cleanly_, they fail the mission.

---

## 2. Benchmark contract (ZohoBooks, per plan + audit)

1. **Label placement:** top-aligned above control, left-aligned text, `text-sm font-medium`; optional hint below label or beside required marker. (Audit Gap #4 flagged today's mixed `text-xs` labels and `text-[10px]` errors as off-scale — the primitives below fix this at the component level so pages can't drift.)
2. **Validation:** error message **below the control**, prefixed state color only from tokens (`--*-danger` family used by existing error text, cf. `BudgetCreatePage.tsx:199`), never color alone (icon/text carries the signal — WCAG).
3. **Save states:** submit buttons show inline spinner + label change ("Saving…"); controls stay editable-but-locked visually (opacity, `aria-busy`); success/failure surfaced once via existing Toast, not per-field noise.
4. **Density:** compact vertical rhythm — label mb-1 (4px), control h-9/h-10 inherited from `Input`, error mt-1. Matches ZohoBooks' tight scanning density called out in the plan benchmark definition.

---

## 3. Primitive API sketches

Conventions honored: named exports only; explicit `{Primitive}Props`; Tailwind-only; controlled `value/onChange` vocabulary consistent with existing usage (`BudgetCreatePage.tsx:192-198`); raw `number` financial values (no formatting inside primitives); exact prop-name reconciliation against current `Input.tsx`/`Select.tsx` internals is a **Wave-0 implementation checklist item** (this spec fixes the contract shape, not byte-level prop spellings — labeled honestly).

### 3.1 `FormField` — composition root (the missing piece)

Layout + accessibility shell only; holds **no state**. Wraps any single control.

```tsx
export interface FormFieldProps {
  /** Visible label text (i18n stays the caller's job — primitives take plain strings). */
  label: string;
  /** Optional helper text rendered under the label, above the control. */
  hint?: string;
  /** Error message; presence toggles invalid wiring on the child control. */
  error?: string;
  /** Required indicator (*) + aria-required propagation. */
  required?: boolean;
  /** Render-prop receives ids to spread onto ANY control (Input, Select, raw input…). */
  children: (ids: FormFieldControlIds) => ReactNode;
  /** Horizontal option for dense rows (default vertical per benchmark). */
  layout?: 'vertical' | 'horizontal';
}

export interface FormFieldControlIds {
  id: string; // useId()-generated, stable SSR-safe
  'aria-invalid': boolean; // true iff error present
  'aria-describedby': string; // space-joined hintId + errorId (only existing parts)
}
```

Why render-prop instead of context/cloning: works unchanged with `Input`, `Select`, `CurrencyInput`, AND the 52 pages' raw inputs during incremental migration (a page can adopt `FormField` before swapping the control itself — decouples the two risks). Error node renders with `role="alert"` so screen readers announce on appear.

### 3.2 `Textarea`

Mirror of `Input`'s contract (same label/error/hint handling delegated to `FormField` composition; standalone `error?: string` passthrough kept for parity with current `Input` usage so both styles compile):

```tsx
export interface TextareaProps {
  value: string;
  onChange: (value: string) => void; // string-first like Input, not the DOM event
  rows?: number; // default 3
  resize?: 'none' | 'vertical'; // default 'vertical'
  invalid?: boolean;
  id?: string; // pass FormFieldControlIds.id through
  placeholder?: string;
  disabled?: boolean;
  maxLength?: number;
}
```

### 3.3 `Checkbox`

**Recommendation: native `<input type="checkbox">` + styled box**, NOT `@radix-ui/react-checkbox`. Rationale: the dep is not installed (§1 witness) and every KB matters while P-02-I gate-tightening toward 2048KB is in flight; a native checkbox + peer label is fully keyboard/a11y correct with ~zero bytes. Radix path listed as alternative requiring a dependency-decision ADR — out of scope here.

```tsx
export interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string; // clicking label toggles (real <label> wrapper, not div)
  description?: string; // secondary line under label
  invalid?: boolean;
  disabled?: boolean;
  id?: string;
}
```

### 3.4 `RadioGroup` / `Radio` (+ `CardRadioGroup` variant)

```tsx
export interface RadioGroupProps {
  value: string;
  onChange: (value: string) => void;
  name: string; // native group semantics
  orientation?: 'vertical' | 'horizontal';
  invalid?: boolean;
  children: ReactNode; // Radio items
}

export interface RadioProps {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}
```

Native `<input type="radio">` inside `<fieldset role="radiogroup">` semantics — same zero-dependency rationale as Checkbox. Additionally provide **`CardRadioGroup`**: the tile-with-description pattern already hand-built at `BudgetCreatePage.tsx:234-260` (Incremental vs Zero-Based cards), formalized so that page's bespoke styling becomes one component call. Keyboard arrows move selection per native radio behavior.

### 3.5 `useSubmitState` — double-submit guard (Gap #7 core)

Reuses the existing `SaveStatus` union from `src/hooks/useAutoSave.ts:9` rather than minting a second vocabulary — single source of truth for idle/pending/saving/saved/error across autosave and submit flows.

```tsx
import type { SaveStatus } from '@/hooks/useAutoSave';

export interface UseSubmitStateResult<TArgs extends unknown[], TResult> {
  status: SaveStatus;
  isSaving: boolean;                     // status === 'saving'
  /** Guarded runner: re-entrant calls while saving are ignored (returns undefined). */
  submit: (...args: TArgs) => Promise<TResult | undefined>;
  reset: () => void;                     // back to 'idle' (after toast/navigation)
}

export function useSubmitState<TArgs extends unknown[], TResult>(
  action: (...args: TArgs => Promise<TResult>),
  opts?: { timeoutMs?: number }         // safety release, default 30_000
): UseSubmitStateResult<TArgs, TResult>;
```

Mechanics: a `useRef` in-flight flag set synchronously before the first await and cleared in `finally` — makes double-click physically unable to re-enter `action` even before React re-renders (state alone races); timeout releases a hung promise to 'error'; strict-mode safe (idempotent cleanup).

### 3.6 `Button` — `loading` prop (small diff, big reach)

Add to existing `Button`: `loading?: boolean`. Behavior: spinner icon replaces leading icon slot, `aria-busy="true"`, click suppressed (pointer-events guard + `disabled` visual), **width preserved** (spinner reserves icon space so layout doesn't jump — ZohoBooks polish detail), label optionally swapped by caller (`{loading ? 'Saving…' : 'Save'}`). `type="button"` default unchanged; forms opt into submit explicitly. This is the only change proposed inside an existing shared primitive, and it is additive/opt-in — zero effect until a caller passes `loading`.

### 3.7 Canonical composed pattern (target end-state)

```tsx
const { submit, isSaving } = useSubmitState(async () => {
  await createBudget(form);
  toast.success(t('budget.created'));
});
// ...
<FormField label={t('budget.name')} error={formErrors.name} required>
  {(ids) => (
    <Input {...ids} value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
  )}
</FormField>
<Button loading={isSaving} onClick={() => void submit()}>
  {isSaving ? t('common.saving') : t('common.save')}
</Button>
```

This collapses BudgetCreatePage's 15-line hand-rolled block (`:186-200`) to 5 lines and makes double-submit impossible by construction.

---

## 4. Validation & error-display contract (one rulebook)

- **When to show:** validate on blur once a field is touched; always re-validate on submit; clear field error on change-after-error. (ZohoBooks: never punish typing mid-entry.)
- **On failed submit:** focus first invalid field; surface summary via existing Toast (page-level), field errors inline.
- **Markup:** error `<p role="alert">`, `aria-invalid` on control, `aria-describedby` → hint + error ids (all wired by `FormField`).
- **Required:** asterisk in label + `aria-required`; word "required" only in error copy.
- **Error copy convention:** what happened + how to fix ("Enter a name", "Year must be ≥ 2000"), never just "Invalid".

---

## 5. Migration wave map

Ordering principle: foundations first with zero page risk → prove the system on the smallest-blast-radius high-traffic forms → money-critical forms → breadth sweeps. Each wave ships independently revertable; **estimates are ESTIMATES** (labeled, unvalidated by implementation).

| Wave                                        | Scope                                                                                                                                                                                                                                  | Why this order                                                                                                   | Risk notes                                                                                                                                                                                                                                                                              | Est.       |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| **0 · Foundations**                         | Add `FormField`, `Textarea`, `Checkbox`, `RadioGroup/Radio/CardRadioGroup` (+colocated tests each, per repo convention), `useSubmitState` (+tests), `Button.loading` (+test), barrel exports. **Zero page edits.**                     | Purely additive; enables everything else; nothing to break.                                                      | Reconcile prop vocabulary with `Input.tsx`/`Select.tsx` internals; lint/tsc clean; no bundle regression (native inputs ≈ +0KB; whole wave ESTIMATE <2KB gz — verify with `npm run build` + bundle-check).                                                                               | M (2–3d)   |
| **1 · Auth quartet**                        | `LoginPage.tsx:287`, `RegisterPage.tsx:80`, `ForgotPasswordPage.tsx:161` (already guard submits — swap hand guards → `useSubmitState` + `Button.loading`), plus `OnboardingWizard` fields if trivial.                                  | Highest traffic-per-line-of-risk; three pages already have guards proving demand; instant dogfood of full stack. | Auth flows are sensitive: targeted suites + login e2e must stay green; watch saved password-manager heuristics (keep real `<form>` + named inputs). Pixel baselines unlikely affected (behavior-only) — if any structural snapshot shifts: STOP, report, regen needs Lead sign-off.     | S (½–1d)   |
| **2 · Money-touching create/edit forms**    | `BudgetCreatePage` (kills the 3 hand-rolled blocks `:186-232` + formalizes card-radios `:234-260`), `FXRatesPage` modal (`:249-311`), `ScenarioBuilderPage.tsx:377`, `GoalSeekPage.tsx:257`.                                           | Where form correctness = financial correctness; highest user-visible payoff of the benchmark.                    | `parseInt` coercion at `BudgetCreatePage.tsx:215` — replace with explicit numeric parse during migration (flag to Lead; behavior-affecting). Store interactions (budgetStore) need targeted store tests. Visual snapshots WILL likely shift here → coordinate baseline policy up front. | M (2–3d)   |
| **3 · Settings & config (raw-select belt)** | The 36 raw-`<select>` pages, prioritized by traffic (settings, integrations, treasury config first); wrap in `FormField`, swap raw selects for `Select` where drop-in, keep complex ones wrapped-only.                                 | `Select` primitive already exists (barrel `:57`) — this wave is mostly composition work, low novelty.            | Long tail = long tail of bespoke behaviors: date-format pickers, dependent selects; migrate mechanically identical ones first, escalate oddballs rather than force-fit (charter A1).                                                                                                    | M–L (3–5d) |
| **4 · Long-tail input sweep + guardrail**   | Remaining hand-rolled `<input>` pages to reach ~0 raw labels/inputs in `src/pages`; then PROPOSE (not implement) an ESLint `no-restricted-syntax` rule banning raw `<input>/<select>/<label>` outside `components/ui/` as the ratchet. | Mechanical repetition is cheapest last, once patterns are proven.                                                | Fatigue risk = quality dip: batch by directory, spot-check axe per batch; the lint rule only goes live AFTER counts hit zero, else CI red noise.                                                                                                                                        | L (4–6d)   |

**Out of scope (explicit):** AG Grid cell editors (grid-owned UX), plugin-sandbox forms, `server/` dir, redesigning validation logic or store shapes (composition only), new dependencies (Radix checkbox/radio rejected for now — §3.3 rationale).

**Per-wave exit battery (standing):** `npx tsc --noEmit` → lint touched files → targeted vitest for touched pages/components → axe checks following the E-02 route-test pattern → visual/structural baselines verified untouched (any drift → STOP + report; regen requires Lead sign-off) → `mock-data:audit` unaffected but cheap to re-run on Wave 2+ (forms touch demo defaults sometimes).

---

## 6. Success criteria (measurable)

1. Post-Wave-1+: zero double-submit possible on migrated forms (guard is structural, not behavioral discipline).
2. Every migrated page: labels/errors/saves come from the shared system — spot-checkable by absence of hand `text-red-400` error `<p>`s.
3. Raw-tag counts trend to 0 — re-runnable witness command included in §8.
4. Axe-clean on all migrated routes (WCAG 2.1 AA, matching the E-02 bar).
5. Bundle: total JS gzip does not regress beyond current enforced limit; Wave-0 measured delta reported honestly.

---

## 7. Open questions for the Lead (escalated, not guessed)

1. **Baseline policy for Waves 2–4:** pre-authorize snapshot-regen windows per merged wave, or strict STOP-on-drift throughout?
2. **`parseInt`-style coercions** discovered during migration (first witness `BudgetCreatePage.tsx:215`): fix-in-passing authorized, or file separately under Track E?
3. **ESLint ratchet (Wave 4 closer):** acceptable as a follow-up governance task after waves complete?

---

## 8. Honesty appendix (D-002/D-009/D-007)

- All §1 counts measured by Vega, 2026-08-23, PowerShell `Select-String` (`-List` = per-file dedup) over `Get-ChildItem src\pages -Recurse -Filter *.tsx` excluding `*.test.*`. Command sketch to re-run the census:
  `$p = gci src\pages -Recurse -Filter *.tsx | ? { $_.Name -notmatch '\.test\.' }; ("<input", "<select", "<label" | % { "$_ : " + ($p | sls $_ -SimpleMatch -List).Count })`
- First saving-indicator pass returned 0 because the regex missed the Unicode `…` variant; widened pattern ('isSaving|Saving…|Saving\.\.\.|saving') reproduced the audit's 2 pages exactly. Recorded here per D-007 rather than silently discarded.
- Label-page count is **34 today vs audit's 33** — ±1 drift, full file list captured during measurement; most plausible cause is concurrent-session churn (E-02/E-02-F landed labels after Uxie's snapshot). Not reconciled further (would require diffing against a historical tree); flagged instead.
- Absence claims (no FormField/Textarea/Checkbox/Radio anywhere under `src/components`) rest on one case-sensitive recursive Select-String sweep returning zero hits + full read of the 93-line barrel — two independent witnesses; a third (tsconfig-aware symbol search) is listed as a Wave-0 kickoff checklist item.
- Grep-tool false negative encountered and documented en route (FXRatesPage raw-control search returned empty via Grep; same file showed 8 hits via Select-String) — consistent with prior repo memory; Select-String used as canonical witness throughout.
- Effort sizes (S/M/L) are ESTIMATES by a UI-builder agent, unvalidated by implementation; per-wave estimates assume the concurrent-session freezes lift normally and no baseline regens are needed.
- This document is the ONLY file created/edited by this task. No code, tests, configs, or other docs touched.
