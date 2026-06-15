<!-- DRAFT v0.1 — awaiting review — Hera 2026-06-13 -->
# T-HE-008 Discovery — A11y Form-Label aria-association

**Date:** 2026-06-13
**Author:** Hera (UX/A11y/Design System agent)
**Status:** Discovery complete; patch pre-staged; awaiting Leader ACK
**File:** `docs/drafts/hera/a11y-form-label-fixes.patch` (7595 bytes, 131 lines, 11 fixes)
**Build script:** `.hera-tmp/build_he008_v2.cjs` (256 lines, re-runnable)
**Verified:** `git apply --check` → PASS, `npx tsc --noEmit` → 0 errors
**Predecessor:** Athena v2 rigor audit (T-AT-008) + Apollo post-push task `019ebcd1...` (A11y aria-association fixes)

---

## §1 — The 3 target files (D-009 triangulation)

Original task spec referenced 3 files. After reading the repo:

| File | Exists? | A11y status | Action |
|------|---------|-------------|--------|
| `src/components/ui/AllocationRuleBuilder.tsx` | ✅ YES | All 7 controls use `<label>` WRAP pattern (input inside label = valid ARIA association). File-level `eslint-disable jsx-a11y/label-has-associated-control` already removed in current version. | **NO FIX NEEDED** (D-009 spec error: Athena v2 claim was false positive) |
| `src/components/ui/AccountForm.tsx` | ❌ **DOES NOT EXIST** | (File referenced in spec but not in repo) | **REPLACED with `src/pages/data/ChartOfAccountsPage.tsx`** (5 form controls, all unlabeled) |
| `src/pages/SettingsPage.tsx` (at `src/pages/settings/`) | ✅ YES | 6 form controls across 2 tabs (Organization, Preferences) lack `htmlFor`/`id` | **6 fixes applied** |

## §2 — Three Witnesses (D-002)

| Witness | Evidence | Consequence |
|---------|----------|-------------|
| **Rule** | WCAG 2.1 SC 3.3.2 Labels or Instructions (Level A) | Labels must be programmatically associated with their form control |
| **Evidence** | 11 `<label>` elements (in 2 files) lack `htmlFor`; 11 corresponding `<Input>`/`<select>` elements lack `id` | Screen readers announce the field but not its purpose (e.g., "edit text" instead of "Company Name, edit text") |
| **Consequence** | (a) WCAG 2.1 AA compliance failure; (b) axe-core `label` rule fails; (c) Voice control users cannot activate by name; (d) Enterprise procurement audits flag this as P1 a11y bug | Blocks sales to enterprise customers with a11y procurement requirements (Section 508, EN 301 549) |

## §3 — D-009 reconciliation (audit-claim vs reality)

The original Athena v2 rigor audit (T-AT-008) made 3 claims about these 3 files. All 3 had D-009 issues:

| Athena v2 claim | D-009 finding | Verdict |
|-----------------|---------------|---------|
| "AllocationRuleBuilder: many `<Input>` lack `id`; many `<label>` lack `htmlFor`" | All 7 controls use `<label>` WRAP pattern. Input IS inside the `<label>`, which is equivalent ARIA association. | ❌ FALSE POSITIVE |
| "AccountForm.tsx exists" | Grep `**/AccountForm*` returns 0 hits. The actual account-management form is `src/pages/data/ChartOfAccountsPage.tsx` (5 form controls). | ❌ SPEC ERROR |
| "SettingsPage: add `aria-labelledby`, `<fieldset>/<legend>`, `aria-describedby`, `role=\"status\"`" | Current state: 6 unlabeled form controls (no `htmlFor`/`id`). No `<fieldset>`/`<legend>`. No `aria-describedby`. No `role="status"`. The 4 things Athena suggested are ALL valid, but the 60-90 min scope only allows `htmlFor`/`id` for the 6 controls. | ⚠️ PARTIAL — `htmlFor`/`id` done; the other 3 items deferred to T-HE-009 (90 min follow-up) |

**Hera D-009 finding for Athena**: This is the 3rd false positive/spec error in this cycle (Hera v2 found similar in `LoginPage` — task `019ebcd1` was originally v1-claimed but v2-fixed it). Recommend Athena re-validate with D-009 before claiming the next audit item.

## §4 — What the patch does (3 actions, 11 fixes)

### Action 1: AllocationRuleBuilder.tsx
- **D-009:** NO ACTION. The file already uses the valid `<label>` WRAP pattern. False positive from Athena v2.

### Action 2: ChartOfAccountsPage.tsx (AccountForm equivalent)
- Adds `htmlFor="coa-*"` to 5 `<label>` elements (Account Code, Name, Type, Category, Parent)
- Adds `id="coa-*"` to 5 corresponding controls
- 5 fixes total

### Action 3: SettingsPage.tsx
- Adds `htmlFor="settings-*"` to 6 `<label>` elements (Company Name, Base Currency, Fiscal Year Start, Calendar Type, Decimal Places, Date Format)
- Adds `id="settings-*"` to 6 corresponding controls
- 6 fixes total

**Total:** 11 fixes across 2 files, +11 lines (1 per fix), 0 functional changes

## §5 — ID naming convention

| Pattern | Files | Rationale |
|---------|-------|-----------|
| `coa-*` | `ChartOfAccountsPage.tsx` | Namespace by file prevents ID collisions if both forms render on the same page |
| `settings-*` | `SettingsPage.tsx` | Same; explicit grep-discoverable |

All IDs are **kebab-case** to match existing ID patterns in the codebase (e.g., `id="scenario-name"`, `id="report-title"` in modal components).

## §6 — Scope estimate (Three Witnesses)

| Metric | Estimate | Evidence |
|--------|----------|----------|
| **Patch size** | 11 fixes, 11 lines added (1 per fix) | Each fix = 1 `htmlFor={...}` attribute + 1 `id={...}` attribute on adjacent lines |
| **Diff impact** | 0 functional changes | Pure a11y attribute addition; no JSX logic touched |
| **Build risk** | Low | `npx tsc --noEmit` → 0 errors (verified) |
| **Lint risk** | Low | No new ESLint rules; the `eslint-disable` on AllocationRuleBuilder is unnecessary (already removed) |
| **Test risk** | None | No test files touched; visual smoke test + a11y test (axe-core) should pass for these 2 files |
| **Revert risk** | Trivial | `git checkout -- <files>` restores in 1 command |
| **Total time** | **60-90 min** (per Leader estimate) | 10 min discovery (DONE), 30 min build script, 5 min verify, 5 min README, 5 min Leader handoff |

## §7 — Out of scope (deferred to T-HE-009)

The original Athena v2 R4 finding for SettingsPage included 4 items:

| Item | In T-HE-008? | Why |
|------|--------------|-----|
| `htmlFor`/`id` on 6 controls | ✅ DONE | Direct WCAG 3.3.2 fix; minimal scope |
| `<fieldset>`/`<legend>` around 2 tabs | ❌ DEFERRED | Structural refactor; 90 min scope; benefits from UX review |
| `aria-labelledby` on tab sections | ❌ DEFERRED | Requires defining ID targets; tied to `<fieldset>` refactor |
| `aria-describedby` for help text | ❌ DEFERRED | No help text in current form; would require adding help text first |
| `role="status"` for save confirmations | ❌ DEFERRED | No save confirmation in current form; would require adding toast/notification |

**Total deferred work: 4 items, ~90 min, recommend as T-HE-009 (next Hera task).**

## §8 — Cross-Muse handoffs (D-007)

| Muse | Trigger | Handoff |
|------|---------|---------|
| **Apollo** | Post-claim, pre-push | Apply patch (steps in `a11y-form-label-fixes-README.md` §7). Run tsc + lint + tests. Push. |
| **Athena** | Post-claim | Update T-AT-008 to log: (a) AllocationRuleBuilder is a false positive; (b) AccountForm.tsx doesn't exist; (c) SettingsPage is partial. Add to the audit-claim vs reality reconciliation list. |
| **Atlas** | Post-push | Add to CI: axe-core `label` rule should now pass for the 2 fixed files. |
| **Hera (T-HE-009)** | Post-push | Wrap SettingsPage's 2 tab sections in `<fieldset>`/`<legend>` for semantic grouping (~90 min). |
| **Hera (T-HE-010)** | Post-push | Re-grep the 35 stale `eslint-disable jsx-a11y/label-has-associated-control` files; AllocationRuleBuilder is one fewer. |

## §9 — Files produced (this discovery)

| File | LOC | Status |
|------|-----|--------|
| `docs/drafts/hera/a11y-form-label-fixes.patch` | 131 | ✅ Written, PASSES `git apply --check` |
| `docs/drafts/hera/a11y-form-label-fixes-README.md` | 158 | ✅ Written |
| `docs/drafts/hera/A11Y_FORM_LABEL_DISCOVERY_2026-06-13.md` | this file (149L) | ✅ Written |
| `.hera-tmp/build_he008_v2.cjs` | 256 | ✅ Re-runnable build script |

## §10 — Verification plan (before delivery)

1. `git apply --check a11y-form-label-fixes.patch` → must report "clean apply" ✅
2. `git apply a11y-form-label-fixes.patch` → working tree updated ✅
3. `npx tsc --noEmit` → 0 errors ✅
4. `git checkout -- src/pages/data/ChartOfAccountsPage.tsx src/pages/settings/SettingsPage.tsx` → revert ✅
5. Report results to Leader (next)

## §11 — Open questions for Leader

1. **AllocationRuleBuilder false positive** — should I update the original Athena v2 finding, or send Athena a "you got this wrong" message? Recommend: add to Athena's audit-claim reconciliation log without confrontation.
2. **AccountForm.tsx doesn't exist** — should I rename my patch from "3 files" to "2 files" in the Leader handoff, or add a third file as a stub? Recommend: keep "2 files" — the D-009 finding is the truth, and a stub file would be code pollution.
3. **SettingsPage `<fieldset>`/`<legend>`** — is the 90-min follow-up in scope for T-HE-008, or should it be a separate T-HE-009 task? Recommend: separate task (out of 60-90 min scope, and benefits from a UX review).

## §12 — References

- WCAG 2.1 SC 3.3.2 Labels or Instructions (Level A) — https://www.w3.org/WAI/WCAG21/Understanding/labels-or-instructions.html
- `docs/drafts/hera/KEYBOARD_NAV_AUDIT_2026-06-13.md` (T-HE-004) — sibling a11y audit
- `docs/drafts/hera/MOTION_PATTERNS.md` (T-HE-007) — sibling a11y design system chapter
- `docs/drafts/hera/DESIGN_SYSTEM_GUIDE.md` (T-HE-006) — §4.4 a11y minimums cross-link
- Athena v2 rigor audit (T-AT-008) — origin of the (partially incorrect) findings
- Apollo post-push task `019ebcd1...` — parent task for the actual apply step

---

**Hera, T-HE-008 ready for Leader ACK. Patch is small (11 fixes + 0 functional changes), low-risk (tsc-clean, additive a11y), high-leverage (closes WCAG 3.3.2 for 2 form-heavy pages). Plus 2 D-009 spec corrections improve the audit-claim fidelity for future tasks. Est: 60-90 min actual. 4 follow-up items deferred to T-HE-009 (90 min) — recommend Leader queue T-HE-009 in next cycle.**
