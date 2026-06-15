<!-- DRAFT v0.1 — awaiting review — Hera 2026-06-13 -->
# T-HE-008 — Form Label & ARIA Association Patches

**Date:** 2026-06-13
**Author:** Hera (UX/A11y/Design System agent)
**Status:** Patch pre-staged, `git apply --check` PASS, tsc=0, **axe-core verification BLOCKED on Apollo T-AP-001 + Apollo post-push task `019ebcd3-526a-7a60-aefb-2fefe9865e04`**
**Original spec:** `TASKBOARD.md` task `019ebdf1-7e6e-7243-869f-f53d2add8817` (Hera T-HE-008) — "Output: `docs/drafts/hera/FORM_LABEL_ARIA_PATCHES.md` with file:line pre-write patches (Apollo git-apply ready) + verification using `axe-core` on the 3 forms. 60-90 min execution."
**Apollo parent task:** `019ebcd1-8d74-7601-9daa-443383874c40` (P3 a11y aria-association fixes)

---

## §1 — TL;DR

| Metric | Value |
|--------|-------|
| Target files | 2 (after D-009 spec corrections) |
| Form controls fixed | 11 (5 in ChartOfAccountsPage + 6 in SettingsPage) |
| WCAG SC closed | 3.3.2 Labels or Instructions (Level A) |
| Patch size | 7595 bytes, 131 lines, 2 files |
| `git apply --check` | ✅ PASS |
| `npx tsc --noEmit` | ✅ 0 errors |
| axe-core | ⏳ BLOCKED on vitest-axe dep (Apollo task `019ebcd3-526a-7a60-aefb-2fefe9865e04`) |
| Apollo git-apply | Ready (see §3 for the full unified diff) |

## §2 — D-009 spec corrections

Original spec referenced 3 files. After reading the repo:

| Spec target | Actual target | Verdict |
|-------------|---------------|---------|
| `src/components/ui/AllocationRuleBuilder.tsx` | ✅ EXISTS at `src/components/ui/` | **D-009 FALSE POSITIVE**: All 7 controls use the valid `<label>` WRAP pattern (input is INSIDE the `<label>` element, which is an equivalent ARIA association per WAI-ARIA 1.2 §4.10.1.2 "Implicit label association"). No fix needed. |
| `src/components/ui/AccountForm.tsx` | ❌ **DOES NOT EXIST** (Grep returns 0 hits) | **D-009 SPEC ERROR**: The actual account-management form is `src/pages/data/ChartOfAccountsPage.tsx` (5 form controls: Account Code, Name, Type, Category, Parent). Patches target this file. |
| `src/pages/SettingsPage.tsx` | ✅ EXISTS at `src/pages/settings/SettingsPage.tsx` | 6 form controls across 2 tabs (Organization, Preferences) lack `htmlFor`/`id`. **6 fixes applied**. |

**Net scope:** 2 files (not 3), 11 controls (not the 8+ originally spec'd).

## §3 — The 11 patches (file:line pre-write, Apollo git-apply ready)

### File 1: `src/pages/data/ChartOfAccountsPage.tsx` (5 patches)

#### Patch 1.1: Account Code (`coa-account-code`)
- **Location:** L412 (label) + L413 (Input opening)
- **WCAG SC:** 3.3.2 Labels or Instructions
- **axe-core rule:** `label` (label and form control have associated accessible name)

```diff
--- a/src/pages/data/ChartOfAccountsPage.tsx
+++ b/src/pages/data/ChartOfAccountsPage.tsx
@@ -410,8 +410,9 @@ export default function ChartOfAccountsPage() {
           </h2>
           <div className="space-y-4">
             <div>
-              <label className="block text-xs font-medium text-slate-400 mb-1">Account Code</label>
+              <label htmlFor="coa-account-code" className="block text-xs font-medium text-slate-400 mb-1">Account Code</label>
               <Input
+                id="coa-account-code"
                 value={form.code}
                 onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                 placeholder="e.g. 4100"
```

#### Patch 1.2: Account Name (`coa-account-name`)
- **Location:** L422 (label) + L423 (Input opening)

```diff
--- a/src/pages/data/ChartOfAccountsPage.tsx
+++ b/src/pages/data/ChartOfAccountsPage.tsx
@@ -420,8 +421,9 @@ export default function ChartOfAccountsPage() {
               {formErrors.code && <p className="text-xs text-red-400 mt-1">{formErrors.code}</p>}
             </div>
             <div>
-              <label className="block text-xs font-medium text-slate-400 mb-1">Account Name</label>
+              <label htmlFor="coa-account-name" className="block text-xs font-medium text-slate-400 mb-1">Account Name</label>
               <Input
+                id="coa-account-name"
                 value={form.name}
                 onChange={(e) => setForm({ ...form, name: e.target.value })}
                 placeholder="e.g. Subscription Revenue"
```

#### Patch 1.3: Account Type (`coa-account-type`)
- **Location:** L432 (label) + L433 (Select opening)

```diff
--- a/src/pages/data/ChartOfAccountsPage.tsx
+++ b/src/pages/data/ChartOfAccountsPage.tsx
@@ -430,26 +432,29 @@ export default function ChartOfAccountsPage() {
               {formErrors.name && <p className="text-xs text-red-400 mt-1">{formErrors.name}</p>}
             </div>
             <div>
-              <label className="block text-xs font-medium text-slate-400 mb-1">Account Type</label>
+              <label htmlFor="coa-account-type" className="block text-xs font-medium text-slate-400 mb-1">Account Type</label>
               <Select
+                id="coa-account-type"
                 options={accountTypes}
                 value={form.type}
                 onChange={(val) => setForm({ ...form, type: val as AccountType })}
               />
             </div>
```

#### Patch 1.4: Category (`coa-category`)
- **Location:** L442 (label) + L443 (Input opening)

```diff
--- a/src/pages/data/ChartOfAccountsPage.tsx
+++ b/src/pages/data/ChartOfAccountsPage.tsx
@@ -440,8 +445,9 @@ export default function ChartOfAccountsPage() {
               />
             </div>
             <div>
-              <label className="block text-xs font-medium text-slate-400 mb-1">Category</label>
+              <label htmlFor="coa-category" className="block text-xs font-medium text-slate-400 mb-1">Category</label>
               <Input
+                id="coa-category"
                 value={form.category}
                 onChange={(e) => setForm({ ...form, category: e.target.value })}
                 placeholder="e.g. Operating Revenue"
               />
```

#### Patch 1.5: Parent Account (`coa-parent-account`)
- **Location:** L451 (label opening) + L456 (Select opening)

```diff
--- a/src/pages/data/ChartOfAccountsPage.tsx
+++ b/src/pages/data/ChartOfAccountsPage.tsx
@@ -450,8 +456,9 @@ export default function ChartOfAccountsPage() {
             </div>
             <div>
-              <label className="block text-xs font-medium text-slate-400 mb-1">
+              <label htmlFor="coa-parent-account" className="block text-xs font-medium text-slate-400 mb-1">
                 Parent Account (optional)
               </label>
               <Select
+                id="coa-parent-account"
                 options={parentOptions}
                 value={form.parentId || ''}
                 onChange={(val) => setForm({ ...form, parentId: val || null })}
```

### File 2: `src/pages/settings/SettingsPage.tsx` (6 patches)

#### Patch 2.1: Company Name (`settings-company-name`)
- **Location:** L115 (label) + L116 (input opening)

```diff
--- a/src/pages/settings/SettingsPage.tsx
+++ b/src/pages/settings/SettingsPage.tsx
@@ -112,8 +112,9 @@ export default function SettingsPage() {
             <CardContent className="p-6 space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-2">
-                  <label className="text-sm font-bold text-slate-300">Company Name</label>
+                  <label htmlFor="settings-company-name" className="text-sm font-bold text-slate-300">Company Name</label>
                   <input
+                    id="settings-company-name"
                     type="text"
                     value={organization.name}
                     onChange={(e) => updateOrganization({ name: e.target.value })}
```

#### Patch 2.2: Base Currency (`settings-base-currency`)
- **Location:** L125 (label) + L126 (select opening)

```diff
--- a/src/pages/settings/SettingsPage.tsx
+++ b/src/pages/settings/SettingsPage.tsx
@@ -122,8 +123,9 @@ export default function SettingsPage() {
                   />
                 </div>
                 <div className="space-y-2">
-                  <label className="text-sm font-bold text-slate-300">Base Currency</label>
+                  <label htmlFor="settings-base-currency" className="text-sm font-bold text-slate-300">Base Currency</label>
                   <select
+                    id="settings-base-currency"
                     value={organization.baseCurrency}
                     onChange={(e) => updateOrganization({ baseCurrency: e.target.value })}
                     className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-white focus:border-blue-500 outline-none"
```

#### Patch 2.3: Fiscal Year Start Month (`settings-fiscal-year-start`)
- **Location:** L138 (label opening) + L144 (select opening)

```diff
--- a/src/pages/settings/SettingsPage.tsx
+++ b/src/pages/settings/SettingsPage.tsx
@@ -135,10 +137,11 @@ export default function SettingsPage() {
                   </select>
                 </div>
                 <div className="space-y-2">
-                  <label className="text-sm font-bold text-slate-300">
+                  <label htmlFor="settings-fiscal-year-start" className="text-sm font-bold text-slate-300">
                     Fiscal Year Start Month
                   </label>
                   <select
+                    id="settings-fiscal-year-start"
                     value={organization.fiscalYearStart.split('-')[1]}
                     className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-white focus:border-blue-500 outline-none"
                   >
```

#### Patch 2.4: Calendar Type (`settings-calendar-type`)
- **Location:** L152 (label) + L153 (select opening)

```diff
--- a/src/pages/settings/SettingsPage.tsx
+++ b/src/pages/settings/SettingsPage.tsx
@@ -149,8 +152,9 @@ export default function SettingsPage() {
                   </select>
                 </div>
                 <div className="space-y-2">
-                  <label className="text-sm font-bold text-slate-300">Calendar Type</label>
+                  <label htmlFor="settings-calendar-type" className="text-sm font-bold text-slate-300">Calendar Type</label>
                   <select
+                    id="settings-calendar-type"
                     value={organization.calendarType}
                     className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-white focus:border-blue-500 outline-none"
                   >
```

#### Patch 2.5: Decimal Places (`settings-decimal-places`)
- **Location:** L172 (label) + L173 (input opening)

```diff
--- a/src/pages/settings/SettingsPage.tsx
+++ b/src/pages/settings/SettingsPage.tsx
@@ -169,8 +173,9 @@ export default function SettingsPage() {
             <CardContent className="p-6 space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-2">
-                  <label className="text-sm font-bold text-slate-300">Decimal Places</label>
+                  <label htmlFor="settings-decimal-places" className="text-sm font-bold text-slate-300">Decimal Places</label>
                   <input
+                    id="settings-decimal-places"
                     type="number"
                     value={organization.decimalPlaces}
                     onChange={(e) =>
```

#### Patch 2.6: Date Format (`settings-date-format`)
- **Location:** L185 (label) + L186 (select opening)

```diff
--- a/src/pages/settings/SettingsPage.tsx
+++ b/src/pages/settings/SettingsPage.tsx
@@ -182,8 +187,9 @@ export default function SettingsPage() {
                   />
                 </div>
                 <div className="space-y-2">
-                  <label className="text-sm font-bold text-slate-300">Date Format</label>
+                  <label htmlFor="settings-date-format" className="text-sm font-bold text-slate-300">Date Format</label>
                   <select
+                    id="settings-date-format"
                     value={organization.dateFormat}
                     onChange={(e) => updateOrganization({ dateFormat: e.target.value })}
                     className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-white focus:border-blue-500 outline-none"
```

## §4 — Consolidated patch file (Apollo single-step git-apply)

The 11 patches above are also bundled in a single git-apply-ready file at:
**`docs/drafts/hera/a11y-form-label-fixes.patch`** (7595 bytes, 131 lines, 2 file headers)

```bash
cd "C:\Users\Tahir\Desktop\frontend that i want\fpa"
git apply --check docs/drafts/hera/a11y-form-label-fixes.patch  # ✅ PASS verified
git apply docs/drafts/hera/a11y-form-label-fixes.patch          # apply all 11 at once
npx tsc --noEmit                                                   # ✅ 0 errors verified
```

## §5 — Three Witnesses (D-002) per fix

| Witness | Evidence | Consequence |
|---------|----------|-------------|
| **Rule** | WCAG 2.1 Level A SC 3.3.2 Labels or Instructions: "Labels or instructions are provided when content requires user input." | Each form control must have an associated label, programmatically. |
| **Evidence** | 11 `<label>` elements (across 2 files) lacked `htmlFor` attribute. 11 corresponding `<Input>`/`<Select>`/`<select>`/`<input>` controls lacked `id` attribute. Before fix, axe-core would flag all 11 as `label` rule violations. | Screen readers would announce the field without its purpose (e.g., "edit text" instead of "Company Name, edit text"). |
| **Consequence** | (a) WCAG 2.1 AA compliance failure (Level A SC violation cascades to AA); (b) axe-core `label` rule fails; (c) Voice control users (e.g., Dragon NaturallySpeaking) cannot say "click Company Name" to activate; (d) Enterprise procurement audits (Section 508, EN 301 549) flag this as P1 a11y bug, blocking sales. | Closes the WCAG 3.3.2 violation on 2 form-heavy pages. Brings total a11y findings closed by Hera in this cycle to 4 (T-HE-004 keyboard nav 7 findings + T-HE-008 form labels 11 findings). |

## §6 — axe-core verification

### Verification methodology (D-009 compliant)

Per the T-HE-008 spec: "verification using `axe-core` on the 3 forms" (post-fix D-009 correction: 2 files, not 3 forms).

**The axe-core verification requires `vitest-axe` to be installed in the dev deps.** This dep is part of Apollo post-push task `019ebcd3-526a-7a60-aefb-2fefe9865e04` (P1: "Add vitest-axe + run Hera's wcag-aa.test.tsx").

### Verification status

| Form | Expected axe-core rules | Pre-fix status | Post-fix status (predicted) |
|------|------------------------|----------------|----------------------------|
| **ChartOfAccountsPage** (5 controls) | `label` (5) | 5 violations (no htmlFor/id) | **0 violations** (after apply) |
| **SettingsPage** (6 controls) | `label` (6) | 6 violations (no htmlFor/id) | **0 violations** (after apply) |
| **AllocationRuleBuilder** (7 controls) | `label` (0 — already valid) | 0 violations (WRAP pattern) | 0 violations (unchanged) |

### Verification command (post-Apollo-vitest-axe-apply)

```bash
# Once Apollo lands vitest-axe (task 019ebcd3-526a-7a60-aefb-2fefe9865e04):
cd "C:\Users\Tahir\Desktop\frontend that i want\fpa"
npm test -- src/__tests__/a11y/wcag-aa.test.tsx

# Expected output:
# ✓ ChartOfAccountsPage: 5 form controls have associated labels (5 / 5)
# ✓ SettingsPage: 6 form controls have associated labels (6 / 6)
# ✓ AllocationRuleBuilder: 7 form controls use valid WRAP pattern (7 / 7)
# Tests: 11 passed, 11 total
```

### Verification dependency chain

```
Apollo T-AP-001 (1-line DataGrid import fix)
    ↓ unblocks
Apollo post-push task 019ebcd3-526a (vitest-axe + run wcag-aa.test.tsx)
    ↓ enables
This task's axe-core verification (npm test -- src/__tests__/a11y/wcag-aa.test.tsx)
    ↓ validates
T-HE-008 patches (11 form-label fixes)
```

**Status as of 2026-06-13:** ⏳ **BLOCKED** — awaiting Apollo T-AP-001 (1-line fix in `src/__tests__/a11y/wcag-aa.test.tsx:39:10`, removing unused `DataGrid` import that causes TS6133 lint error).

## §7 — Additional fixes (deferred to T-HE-009, 90 min scope)

The original Athena v2 R4 finding for SettingsPage included 4 items beyond `htmlFor`/`id`:

| Item | Status | Reason for deferral |
|------|--------|---------------------|
| `htmlFor`/`id` on 6 controls | ✅ DONE in T-HE-008 | Direct WCAG 3.3.2 fix; minimal scope |
| `<fieldset>`/`<legend>` around 2 tab sections | ❌ DEFERRED to T-HE-009 | Structural refactor; 90 min scope; benefits from UX review (Mnemosyne co-author?) |
| `aria-labelledby` on tab sections | ❌ DEFERRED to T-HE-009 | Requires defining ID targets; tied to `<fieldset>` refactor |
| `aria-describedby` for help text | ❌ DEFERRED to T-HE-009 | No help text in current form; would require adding help text first |
| `role="status"` for save confirmations | ❌ DEFERRED to T-HE-009 | No save confirmation in current form; would require adding toast/notification |

**Recommend Leader queue T-HE-009 in next cycle (90 min, scopes above).**

## §8 — Apply instructions (for Apollo post-claim)

```bash
cd "C:\Users\Tahir\Desktop\frontend that i want\fpa"
git apply --check docs/drafts/hera/a11y-form-label-fixes.patch  # ✅ PASS verified
git apply docs/drafts/hera/a11y-form-label-fixes.patch          # apply all 11 at once
npx tsc --noEmit                                                   # ✅ 0 errors verified
npm run lint                                                       # 0/0 expected
git add src/pages/data/ChartOfAccountsPage.tsx src/pages/settings/SettingsPage.tsx
git commit -m "fix(a11y): add htmlFor/id form-label association on 11 controls (T-HE-008)

Closes WCAG 2.1 SC 3.3.2 (Labels or Instructions, Level A) for:
- ChartOfAccountsPage: 5 controls (Account Code, Name, Type, Category, Parent)
- SettingsPage: 6 controls (Company Name, Base Currency, Fiscal Year Start,
  Calendar Type, Decimal Places, Date Format)

ID naming: coa-* prefix for ChartOfAccountsPage, settings-* prefix for SettingsPage.
Prevents ID collisions when both forms render on the same page.

D-009 findings (logged separately, not part of this fix):
- src/components/ui/AccountForm.tsx does NOT exist; the real account form is
  src/pages/data/ChartOfAccountsPage.tsx (Athena v2 spec error).
- src/components/ui/AllocationRuleBuilder.tsx uses the valid <label> WRAP
  pattern; no fix needed (Athena v2 false positive).

Follow-up (T-HE-009, 90 min): wrap SettingsPage's 2 tab sections in
<fieldset>/<legend> for semantic grouping (Athena v2 R4 finding).

3W: rule=WCAG 3.3.2 / evidence=label-has-associated-control axe rule / consequence=screen-reader users cannot determine field purpose"
git push origin main
```

## §9 — Cross-Muse handoffs

| Muse | Trigger | Handoff |
|------|---------|---------|
| **Apollo** | Post-claim, pre-push | Apply patch via `git apply docs/drafts/hera/a11y-form-label-fixes.patch` (1-step). Run tsc + lint + tests. Push. |
| **Apollo** | Post-claim, post-T-AP-001 | Once vitest-axe is installed, run `npm test -- src/__tests__/a11y/wcag-aa.test.tsx` to validate the 11 fixes pass axe-core. |
| **Athena** | Post-claim | Add 3 D-009 findings to T-AT-008 audit-claim reconciliation log: (a) AllocationRuleBuilder false positive (WRAP pattern); (b) AccountForm.tsx doesn't exist; (c) SettingsPage is partial. |
| **Atlas** | Post-push | Add to CI: axe-core `label` rule should now pass for these 2 files. The vitest-axe infrastructure from T-019ebcd3-526a will catch any regressions. |
| **Hera (T-HE-009)** | Post-push | Wrap SettingsPage's 2 tab sections in `<fieldset>`/`<legend>` + add `aria-labelledby`/`aria-describedby`/`role="status"` (90 min, Athena v2 R4 deferred items). |
| **Hera (T-HE-010)** | Post-push | Re-grep the 35 stale `eslint-disable jsx-a11y/label-has-associated-control` files; AllocationRuleBuilder is one fewer false positive to chase. |

## §10 — Open questions for Leader (3)

1. **AllocationRuleBuilder false positive** — should I update the original Athena v2 R4 finding, or send Athena a "you got this wrong" message? **Recommend:** add to Athena's audit-claim reconciliation log without confrontation (sent already in cross-Muse message).
2. **AccountForm.tsx doesn't exist** — should I rename my deliverable from "3 files" to "2 files" in the formal handoff, or add a third file as a stub? **Recommend:** keep "2 files" (per D-009 finding) — the truth is the truth, and a stub file would be code pollution.
3. **SettingsPage `<fieldset>`/`<legend>`** — is the 90-min follow-up in scope for T-HE-008, or should it be a separate T-HE-009 task? **Recommend:** separate task (out of 60-90 min scope, and benefits from a UX review with Mnemosyne).

## §11 — D-009 reconciliation (audit-claim vs reality)

| Source claim | Reality | Verdict |
|--------------|---------|---------|
| "AllocationRuleBuilder: many `<Input>` lack `id`; many `<label>` lack `htmlFor`" | All 7 controls use `<label>` WRAP pattern (input inside label = valid ARIA) | ❌ FALSE POSITIVE |
| "`AccountForm.tsx` exists" | File does not exist; actual form is `ChartOfAccountsPage.tsx` | ❌ SPEC ERROR |
| "SettingsPage: add `aria-labelledby`, `<fieldset>/<legend>`, `aria-describedby`, `role=\"status\"`" | Currently: 6 unlabeled form controls. htmlFor/id done. The other 3 items deferred to T-HE-009. | ⚠️ PARTIAL |
| "Verification using `axe-core` on the 3 forms" | 2 files (not 3 forms). vitest-axe dep blocked on Apollo T-AP-001. | ⚠️ PARTIAL — patched, awaiting Apollo unblock |

## §12 — References

- WCAG 2.1 SC 3.3.2 Labels or Instructions (Level A) — https://www.w3.org/WAI/WCAG21/Understanding/labels-or-instructions.html
- WCAG 2.1 SC 1.3.1 Info and Relationships (Level A) — programmatic association required
- WCAG 2.1 SC 4.1.2 Name, Role, Value (Level A) — assistive tech must read field name
- WAI-ARIA 1.2 §4.10.1.2 "Implicit label association" (the WRAP pattern) — https://www.w3.org/TR/wai-aria-practices-1.2/
- `docs/drafts/hera/KEYBOARD_NAV_AUDIT_2026-06-13.md` (T-HE-004) — sibling a11y audit, 7 findings
- `docs/drafts/hera/MOTION_PATTERNS.md` (T-HE-007) — sibling a11y design system chapter
- `docs/drafts/hera/DESIGN_SYSTEM_GUIDE.md` (T-HE-006) — §4.4 a11y minimums cross-link
- `docs/drafts/hera/A11Y_FORM_LABEL_DISCOVERY_2026-06-13.md` — discovery doc for this task (supplementary)
- `docs/drafts/hera/a11y-form-label-fixes-README.md` — apply doc (supplementary)
- `docs/drafts/hera/a11y-form-label-fixes.patch` — single-file git-apply patch (the actual fix)
- Apollo post-push task `019ebcd3-526a-7a60-aefb-2fefe9865e04` — vitest-axe install (blocker for full axe-core verification)
- Apollo post-push task `019ebcd1-8d74-7601-9daa-443383874c40` — parent task (this is the git-apply-ready deliverable)
- Apollo pre-push T-AP-001 — 1-line DataGrid import fix (blocker for Apollo's post-push queue)

---

**Hera, FORM_LABEL_ARIA_PATCHES.md shipped (spec'd filename, 333L, 12 §). 11 patches inlined with file:line citations. Consolidated .patch file also on disk for 1-step git-apply. axe-core verification BLOCKED on Apollo T-AP-001 (per spec dependency chain). D-009 spec corrections (2 files not 3) applied. T-HE-009 follow-up queued for SettingsPage `<fieldset>`/`<legend>` refactor (90 min). Est: 60-90 min actual.**
