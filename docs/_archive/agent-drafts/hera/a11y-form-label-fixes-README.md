<!-- DRAFT v0.1 — awaiting review — Hera 2026-06-13 -->
# T-HE-008 — A11y Form-Label aria-association Patch

**Date:** 2026-06-13
**Author:** Hera (UX/A11y/Design System agent)
**Status:** Patch pre-staged; awaiting Leader ACK + Apollo post-push apply
**File:** `docs/drafts/hera/a11y-form-label-fixes.patch` (7595 bytes, 131 lines, 11 edits + 1 spec correction note)
**Build script:** `.hera-tmp/build_he008_v2.cjs` (re-runnable, idempotent, D-007 discovery-driven)
**Verified:** `git apply --check` → PASS, `npx tsc --noEmit` → 0 errors, working tree reverted
**Predecessor:** Athena v2 rigor audit + Apollo post-push task `019ebcd1...` (a11y aria-association fixes)

---

## §1 — TL;DR

Adds `htmlFor={id}` to 11 `<label>` elements and matching `id={id}` to 11 form controls across 2 files (`ChartOfAccountsPage.tsx` and `SettingsPage.tsx`). Fixes WCAG 2.1 Level A **3.3.2 Labels or Instructions** violation: users with screen readers and other assistive tech cannot currently determine what each form field is for.

**Net effect:** 11 form controls go from "unlabeled" to "explicitly labeled via `htmlFor`/`id` association". No functional change to UI; no JS/TSX logic touched. Pure a11y attribute addition.

## §2 — D-009 spec corrections (Hera pre-flight)

The original task spec (`019ebcd1` Apollo post-push + T-HE-008 Leader assignment) referenced **3 files**:
- `src/components/ui/AllocationRuleBuilder.tsx` ✅ EXISTS
- `src/components/ui/AccountForm.tsx` ❌ **DOES NOT EXIST** (D-009 spec error)
- `src/pages/SettingsPage.tsx` ✅ EXISTS at `src/pages/settings/SettingsPage.tsx`

| Spec target | Actual target | Action |
|-------------|---------------|--------|
| `AllocationRuleBuilder.tsx` (claimed: many Inputs lack `id`) | All 7 controls use the **valid `<label> WRAP pattern`** (input is INSIDE the label, which is an equivalent ARIA association) | **NO FIX NEEDED** — spec was wrong. Patch does NOT touch this file. The file-level `eslint-disable jsx-a11y/label-has-associated-control` is no longer present in the current version (already removed by a prior commit). |
| `AccountForm.tsx` (claimed: file exists) | **File does not exist** in the repo. The actual account-management form is `src/pages/data/ChartOfAccountsPage.tsx` (5 form controls: Account Code, Name, Type, Category, Parent) | **5 fixes applied** in `ChartOfAccountsPage.tsx` |
| `SettingsPage.tsx` (claimed: add `aria-labelledby`, `<fieldset>/<legend>`, `aria-describedby`, `role="status"`) | Current state: 6 form controls (Company Name, Base Currency, Fiscal Year Start, Calendar Type, Decimal Places, Date Format) across 2 tabs lack `htmlFor`/`id`. The `<fieldset>/<legend>` refactor is a larger change outside this task's 60-90 min scope. | **6 fixes applied** (just `htmlFor`/`id`); `<fieldset>/<legend>` refactor flagged for follow-up task |

**D-009 finding for Leader:** The original Athena v2 audit's claim about AllocationRuleBuilder "having many `<Input>` lacking `id`" is **false positive** — the file uses the wrap pattern, which is valid ARIA. This should be added to the Athena T-AT-008 cross-check findings (audit-claim vs reality reconciliation).

## §3 — The 11 form-label fixes

### File 1: `src/pages/data/ChartOfAccountsPage.tsx` (5 fixes)

| # | Label | Control | New `htmlFor` | New `id` | WCAG SC |
|---|-------|---------|---------------|----------|---------|
| 1 | Account Code | `<Input>` | `coa-account-code` | `coa-account-code` | 3.3.2 |
| 2 | Account Name | `<Input>` | `coa-account-name` | `coa-account-name` | 3.3.2 |
| 3 | Account Type | `<Select>` | `coa-account-type` | `coa-account-type` | 3.3.2 |
| 4 | Category | `<Input>` | `coa-category` | `coa-category` | 3.3.2 |
| 5 | Parent Account (optional) | `<Select>` | `coa-parent-account` | `coa-parent-account` | 3.3.2 |

### File 2: `src/pages/settings/SettingsPage.tsx` (6 fixes)

| # | Label | Control | New `htmlFor` | New `id` | WCAG SC |
|---|-------|---------|---------------|----------|---------|
| 1 | Company Name | `<input type="text">` | `settings-company-name` | `settings-company-name` | 3.3.2 |
| 2 | Base Currency | `<select>` | `settings-base-currency` | `settings-base-currency` | 3.3.2 |
| 3 | Fiscal Year Start Month | `<select>` | `settings-fiscal-year-start` | `settings-fiscal-year-start` | 3.3.2 |
| 4 | Calendar Type | `<select>` | `settings-calendar-type` | `settings-calendar-type` | 3.3.2 |
| 5 | Decimal Places | `<input type="number">` | `settings-decimal-places` | `settings-decimal-places` | 3.3.2 |
| 6 | Date Format | `<select>` | `settings-date-format` | `settings-date-format` | 3.3.2 |

## §4 — ID naming convention (Three Witnesses)

| Decision | Rationale |
|----------|-----------|
| **Namespace by file** (`coa-*`, `settings-*`) | Prevents ID collisions when both forms are on the same page (e.g., in a modal). Also grep-discoverable. |
| **kebab-case** | Matches existing ID patterns in the codebase (e.g., `id="scenario-name"`, `id="report-title"` in modal components) |
| **No auto-generated IDs** (e.g., `useId()`) | The current Form components are static; auto-generated IDs would re-render and break test snapshots. Static IDs are explicit and grep-discoverable. |
| **No `aria-describedby`** | Out of scope for this task; the original Athena v2 finding mentioned it but adding error message associations is a separate refactor. |
| **No `<fieldset>/<legend>`** | Would be a UX improvement (groups related fields under a legend) but is a structural change outside the 60-90 min scope. Flagged for follow-up. |

## §5 — Three Witnesses (D-002) per fix

Each fix follows the same pattern:

| Witness | Evidence |
|---------|----------|
| **Rule** | WCAG 2.1 Level A SC 3.3.2 Labels or Instructions: "Labels or instructions are provided when content requires user input." |
| **Evidence** | `<label>` element exists in JSX but lacks `htmlFor` attribute. The associated `<Input>`/`<select>` lacks `id`. Screen readers cannot determine the field's purpose. |
| **Consequence** | (a) Screen reader users hear "edit text" with no context; (b) Voice control users cannot say "click Company Name"; (c) Forms fail automated accessibility audits (axe-core rule: `label`); (d) WCAG 2.1 AA compliance failure for any enterprise customer audit. |

## §6 — Verification results (this session, 2026-06-13)

| Check | Result |
|-------|--------|
| `git apply --check a11y-form-label-fixes.patch` | ✅ PASS (silent) |
| `git apply a11y-form-label-fixes.patch` | ✅ PASS (silent) |
| `npx tsc --noEmit` (after apply) | ✅ 0 errors (no output) |
| Total `<label>` elements scanned | 11 in 2 files (all fixed) |
| Total controls scanned | 11 in 2 files (all fixed) |
| D-009 spec corrections | 2 (AccountForm doesn't exist; AllocationRuleBuilder is false positive) |
| Working tree reverted | ✅ `git checkout -- <files>` |

## §7 — Apply instructions (for Apollo post-claim)

```bash
cd "C:\Users\Tahir\Desktop\frontend that i want\fpa"
git apply --check docs/drafts/hera/a11y-form-label-fixes.patch  # verify
git apply docs/drafts/hera/a11y-form-label-fixes.patch          # apply
npx tsc --noEmit                                                   # 0 errors expected
npm run lint                                                       # 0/0 expected
npm test -- --reporter=dot                                         # 8,350+ tests pass
git add src/pages/data/ChartOfAccountsPage.tsx src/pages/settings/SettingsPage.tsx
git commit -m "fix(a11y): add htmlFor/id form-label association on 11 controls (T-HE-008)

Closes WCAG 2.1 SC 3.3.2 (Labels or Instructions, Level A) for:
- ChartOfAccountsPage: 5 controls (Account Code, Name, Type, Category, Parent)
- SettingsPage: 6 controls (Company Name, Base Currency, Fiscal Year Start, Calendar Type, Decimal Places, Date Format)

ID naming: coa-* prefix for ChartOfAccountsPage, settings-* prefix for SettingsPage.
Prevents ID collisions when both forms render on the same page.

D-009 findings (logged separately, not part of this fix):
- src/components/ui/AccountForm.tsx does NOT exist; the real account form is
  src/pages/data/ChartOfAccountsPage.tsx (Athena v2 spec error).
- src/components/ui/AllocationRuleBuilder.tsx uses the valid <label> WRAP
  pattern; no fix needed (Athena v2 false positive).

Follow-up (out of scope, 90 min): wrap the two SettingsPage form sections in
<fieldset>/<legend> for semantic grouping (Athena v2 R4 finding).

3W: rule=WCAG 3.3.2 / evidence=label-has-associated-control axe rule / consequence=screen-reader users cannot determine field purpose"
git push origin main
```

## §8 — Cross-Muse handoffs

| Muse | Trigger | Handoff |
|------|---------|---------|
| **Apollo** | Post-claim, pre-push | Apply patch (steps in §7). Confirm `npx tsc --noEmit` and `npm run lint` pass. Push. |
| **Athena** | Post-claim | Update T-AT-008 (ADR cross-check) to flag: (a) AccountForm.tsx doesn't exist (D-009); (b) AllocationRuleBuilder is a false positive (D-009). Add to the audit-claim vs reality reconciliation log. |
| **Atlas** | Post-push | Add to CI: `npm run test -- --grep "a11y" -- wcag-aa.test.tsx` should now pass for the 2 fixed files. |
| **Hera (T-HE-009 follow-up)** | Post-push | 90-min scope: wrap SettingsPage's 2 tab sections in `<fieldset>`/`<legend>` for semantic grouping (Athena v2 R4 finding). |
| **Hera (T-HE-010 follow-up)** | Post-push | Re-grep the 35 stale `eslint-disable jsx-a11y/label-has-associated-control` files; AllocationRuleBuilder is one fewer. |

## §9 — Three open questions for Leader

1. **AllocationRuleBuilder is false positive** — should I update the original Athena v2 finding, or send Athena a "you got this wrong" message? Recommend: add to Athena's audit-claim reconciliation log without confrontation.
2. **AccountForm.tsx doesn't exist** — should I rename my patch from "3 files" to "2 files" in the Leader handoff, or add a third file as a stub? Recommend: keep "2 files" — the D-009 finding is the truth, and a stub file would be code pollution.
3. **SettingsPage `<fieldset>`/`<legend>`** — is the 90-min follow-up in scope for T-HE-008, or should it be a separate T-HE-009 task? Recommend: separate task (out of 60-90 min scope, and benefits from a UX review).

## §10 — D-009 reconciliation (audit-claim vs reality)

| Source claim | Reality | Verdict |
|--------------|---------|---------|
| "AllocationRuleBuilder: many `<Input>` lack `id`; many `<label>` lack `htmlFor`" | All 7 controls use `<label>` WRAP pattern (input inside label) | ❌ FALSE POSITIVE |
| "`AccountForm.tsx` exists" | File does not exist; actual form is `ChartOfAccountsPage.tsx` | ❌ SPEC ERROR |
| "SettingsPage: add `aria-labelledby`, `<fieldset>/<legend>`, `aria-describedby`, `role=\"status\"`" | Currently: 6 unlabeled form controls; no fieldset/legend/role. The fix for THIS task is `htmlFor`/`id` only. The other items (fieldset, aria-labelledby, etc.) are valid but out of scope. | ⚠️ PARTIAL — htmlFor/id done; other items deferred to T-HE-009 |

## §11 — References

- WCAG 2.1 SC 3.3.2 Labels or Instructions (Level A) — https://www.w3.org/WAI/WCAG21/Understanding/labels-or-instructions.html
- WCAG 2.1 SC 1.3.1 Info and Relationships (Level A) — programmatic association required
- WCAG 2.1 SC 4.1.2 Name, Role, Value (Level A) — assistive tech must be able to read field name
- `docs/drafts/hera/KEYBOARD_NAV_AUDIT_2026-06-13.md` (T-HE-004) — sibling a11y audit, 7 findings
- `docs/drafts/hera/MOTION_PATTERNS.md` (T-HE-007) — sibling a11y design system chapter
- `docs/drafts/hera/DESIGN_SYSTEM_GUIDE.md` (T-HE-006) — §4.4 a11y minimums cross-link
- Apollo post-push task `019ebcd1...` — parent task; this patch is the git-apply-ready deliverable

---

**Hera, ready for Leader handoff. Patch is small (11 fixes + 0 functional changes), low-risk (additive a11y attributes, tsc-clean), high-leverage (unblocks Apollo's a11y-fix post-push + Athena v2 reconciliation). Plus 2 D-009 spec corrections that improve the audit-claim fidelity for future tasks. Est: 60-90 min actual.**
