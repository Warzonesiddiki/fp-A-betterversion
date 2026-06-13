<!-- DRAFT v0.1 — awaiting review — Hera 2026-06-13 -->

# T-HE-011 — `settings-fieldset-aria-fixes.patch` Apply Doc

> **Apply status: WORK ALREADY IN HEAD bcf44df0** — this README is informational only.
> If you need to re-apply on a pre-T-HE-011 branch (e.g., backporting), follow the steps below.

**Task:** T-HE-011 (Hera) — SettingsPage `<fieldset>/<legend>` + `aria-describedby` patches
**Spec doc:** [`docs/drafts/hera/SETTINGS_FIELDSET_ARIA_PATCHES.md`](./SETTINGS_FIELDSET_ARIA_PATCHES.md) (12 §, +18/−0 lines, 5 patches)
**Patch file:** `docs/drafts/hera/settings-fieldset-aria-fixes.patch` (7170 bytes, 124 lines, 2 hunks, 1 file)
**Predecessor:** T-HE-008 v2 `a11y-form-label-fixes.patch` — 6 `htmlFor`/`id` additions on the same file; T-HE-011 layers on top
**Apollo git-apply:** N/A (work is in HEAD via bcf44df0, 2026-06-13)
**Apollo post-claim verification:** Run `npm test -- src/__tests__/a11y/wcag-aa.test.tsx` once vitest-axe is installed (T-AP-001 + 019ebcd3-526a)

---

## §1 — TL;DR

The T-HE-011 work was committed in `bcf44df0` on 2026-06-13 by Warzonesiddiki as part of the round-2 muse pipeline deliverables. The single-file patch (`docs/drafts/hera/settings-fieldset-aria-fixes.patch`) is informational / for backport. There is **no action required from Apollo** — the code changes are already on `main`. The only remaining work is verification once vitest-axe is installed.

**Net effect on SettingsPage:**

- 2 `<fieldset>` + `<legend>` wrappers (Org + Pref tab sections) — visually invisible (no border), semantically meaningful
- 3 `aria-describedby` attributes (Base Currency, Fiscal Year Start, Date Format) — each points to a new help `<p>` element
- 3 help `<p>` elements — explain the non-obvious semantics of the 3 tricky fields
- 0 removals
- 18 lines added, 0 lines removed

## §2 — File-level change summary

| File                                  | Hunks | Lines added | Lines removed | Net     |
| ------------------------------------- | ----- | ----------- | ------------- | ------- |
| `src/pages/settings/SettingsPage.tsx` | 2     | +18         | −0            | +18     |
| **Total**                             | **2** | **+18**     | **−0**        | **+18** |

The 2 hunks are:

- **Hunk 1** (L110-165, Org tab): adds `<fieldset>` + `<legend>Organization Profile</legend>` open, 2 `aria-describedby` attributes (Base Currency, Fiscal Year Start) with 2 help `<p>` elements, and `</fieldset>` close. 11 lines added.
- **Hunk 2** (L167-199, Pref tab): adds `<fieldset>` + `<legend>Preferences</legend>` open, 1 `aria-describedby` attribute (Date Format) with 1 help `<p>` element, and `</fieldset>` close. 7 lines added.

## §3 — Three-step apply (Apollo 6-step flow, abbreviated for "already applied")

> For full Apollo 6-step flow, see `docs/drafts/hera/a11y-form-label-fixes-README.md` §3 (the T-HE-008 v2 sibling).

### Step 1 — Pre-apply sanity

```bash
cd "C:\Users\Tahir\Desktop\frontend that i want\fpa"
git status --short
# Expected: working tree has only the docs/drafts/hera/ modifications from earlier in this session
# No unstaged changes to src/pages/settings/SettingsPage.tsx
```

### Step 2 — `git apply --check` (dry-run)

```bash
git apply --check docs/drafts/hera/settings-fieldset-aria-fixes.patch
# Expected: silent PASS (no output, exit 0)
```

**NOTE:** This step will fail if the work is already in HEAD (which it is, in bcf44df0). To verify the patch WOULD apply cleanly against the pre-T-HE-011 state, check out the parent first:

```bash
git stash  # save any working tree changes
git checkout HEAD~1 -- src/pages/settings/SettingsPage.tsx
git apply --check docs/drafts/hera/settings-fieldset-aria-fixes.patch  # now PASSES
git checkout HEAD -- src/pages/settings/SettingsPage.tsx  # restore post-T-HE-011 state
git stash pop  # restore any saved changes
```

### Step 3 — `git apply` (actual apply, only if not already in HEAD)

```bash
git apply docs/drafts/hera/settings-fieldset-aria-fixes.patch
# 5 patches applied: 2 fieldset/legend + 3 aria-describedby
```

### Step 4 — `tsc` + `lint` + `test`

```bash
npx tsc --noEmit
# Expected: 0 errors

npm run lint -- src/pages/settings/SettingsPage.tsx
# Expected: 0 errors, 0 warnings (or unchanged from baseline)

npm test -- src/__tests__/a11y/wcag-aa.test.tsx
# Expected: 17 tests pass (11 from T-HE-008 v2 + 6 from T-HE-011) — BLOCKED on vitest-axe
```

### Step 5 — `git diff --stat` to confirm

```bash
git diff --stat
# Expected: src/pages/settings/SettingsPage.tsx | 18 +++++++++++++-
# 1 file changed, 18 insertions(+), 0 deletions(-)
```

### Step 6 — Commit + push

```bash
git add src/pages/settings/SettingsPage.tsx
git commit -m "fix(a11y): add fieldset/legend + aria-describedby on SettingsPage (T-HE-011)

Closes 2 of 3 deferred items from T-HE-008 v2 (Athena T-AT-008 v2 R4 finding):
- Org tab: <fieldset> + <legend>Organization Profile</legend> wrapping 4 controls
- Pref tab: <fieldset> + <legend>Preferences</legend> wrapping 2 controls
- Base Currency / Fiscal Year Start / Date Format: aria-describedby + <p> help text

D-009 finding (not part of this fix): Athena v2 R4 spec'd role='status' for save
confirmation toast, but SettingsPage has no toast. No role='status' added.

3W: rule=WCAG 1.3.1 (Info and Relationships, Level A) + WAI-ARIA describedby /
evidence=axe-core group + aria-describedby rules / consequence=screen reader users
cannot determine form section grouping or non-obvious field semantics"
git push origin main
```

## §4 — Validation checklist (per Apollo post-claim)

After Apollo T-AP-001 + vitest-axe install (`019ebcd3-526a-7a60-aefb-2fefe9865e04`):

- [ ] `npx tsc --noEmit` returns 0 errors
- [ ] `npm run lint` returns 0/0 for `src/pages/settings/SettingsPage.tsx`
- [ ] `npm test -- src/__tests__/a11y/wcag-aa.test.tsx` passes 17/17 tests:
  - [ ] AllocationRuleBuilder: 6 label-has-associated-control (already passing from T-HE-004)
  - [ ] AllocationRuleBuilder: 1 select with 3 options (already passing)
  - [ ] SettingsPage: 6 htmlFor/id pairs (T-HE-008 v2)
  - [ ] **SettingsPage Org tab: `<fieldset>` has `<legend>Organization Profile</legend>`** (T-HE-011)
  - [ ] **SettingsPage Pref tab: `<fieldset>` has `<legend>Preferences</legend>`** (T-HE-011)
  - [ ] **SettingsPage Base Currency: `aria-describedby="settings-base-currency-help"` resolves** (T-HE-011)
  - [ ] **SettingsPage Fiscal Year Start: `aria-describedby="settings-fiscal-year-start-help"` resolves** (T-HE-011)
  - [ ] **SettingsPage Date Format: `aria-describedby="settings-date-format-help"` resolves** (T-HE-011)
- [ ] Manual keyboard test: Tab through Org tab → all 4 controls announce with "Organization Profile group" + 2 fields announce with help text
- [ ] Manual screen reader test (NVDA/VoiceOver): announce "Organization Profile group, Company Name, edit, ... Base Currency, combobox, Used as the default currency for all financial reports and transactions, ... Fiscal Year Start Month, combobox, Determines the 12-month period for budgets, P&L, and variance reports, ... Calendar Type, combobox"

## §5 — Revert instructions (Apollo emergency rollback)

If the patches cause any production regression (extremely unlikely — they're additive):

```bash
cd "C:\Users\Tahir\Desktop\frontend that i want\fpa"
git revert bcf44df0 --no-edit  # full commit revert
# OR
git revert -n bcf44df0  # stage but don't commit; then git checkout -- src/pages/settings/SettingsPage.tsx
```

Or, to revert just the SettingsPage changes from the round-2 commit (mixed with other Muses' work):

```bash
git show bcf44df0 -- src/pages/settings/SettingsPage.tsx | git apply -R
npx tsc --noEmit  # verify 0 errors after revert
git add src/pages/settings/SettingsPage.tsx
git commit -m "revert(a11y): rollback T-HE-011 fieldset/legend/aria-describedby from SettingsPage (T-HE-011 ROLLBACK)"
```

## §6 — Apollo's 6-step flow (full reference)

For consistency with T-HE-008 v2, T-HE-009, and T-HE-005 sibling patches, Apollo follows this flow on every Hera patch:

1. **Pre-claim** — read this README + spec doc; note cross-Muse handoffs in §9 of the spec doc.
2. **Pre-apply git-apply-check** — run `git apply --check <patch>`; expect silent PASS.
3. **Apply** — `git apply <patch>`; expect exit 0.
4. **Verify** — `npx tsc --noEmit` (0 errors), `npm run lint` (clean), `npm test` (where vitest-axe is installed).
5. **Commit + push** — use the commit message in §3 step 6 above; cross-link spec doc.
6. **Post-claim cross-link** — update `CHANGELOG.md`, `AGENTS.md` §Accessibility Patterns, `wcag-aa.test.tsx` if applicable.

For T-HE-011, all 6 steps are N/A because the work is in HEAD bcf44df0. Apollo's only action is step 4 (verify after vitest-axe is installed) and step 6 (cross-link).

## §7 — Cross-Muse handoffs (post-claim)

- **Apollo (post-T-AP-001)**: Run `npm test -- src/__tests__/a11y/wcag-aa.test.tsx`; expect 17/17 pass.
- **Apollo (CRITICAL — DO THIS FIRST)**: Apply `docs/drafts/hera/settings-jsx-closing-order-bugfix.patch` (879B, 2 hunks) BEFORE push. The bcf44df0 commit has broken JSX (14 tsc errors) in SettingsPage. The fix is a 4-line, 1-commit fix. **Without this, `npx tsc --noEmit` will fail in Apollo's post-push verify.**
- **Athena (P3 audit-claim reconciliation)**: Flag the `role="status"` D-009 spec error in T-AT-008 v2 R4 cross-check log.
- **Athena (D-006 lesson learned)**: Add "JSX closing-order verification — always run `tsc --noEmit` before commit, not just after" to D-006 lessons. Reference: bcf44df0 T-HE-011 work (14 tsc errors post-commit, found by Hera post-context-restoration).
- **Atlas (P3 CI)**: Add to CI: axe-core `group` rule (fieldset with legend) should pass for SettingsPage now.
- **Mnemosyne (P3 docs)**: Cross-link from `AGENTS.md` §Accessibility Patterns and `DESIGN_SYSTEM_GUIDE.md` §4.4 a11y minimums.
- **Hera (T-HE-012 follow-up)**: axe-core rerun after Apollo lands vitest-axe; update `wcag-aa.test.tsx` with the 6 new test cases.

## §7.5 — T-HE-011 v0.2 bugfix addendum (post-context-restoration)

**🚨 CRITICAL FINDING (2026-06-13 post-context-restoration):** The T-HE-011 work in bcf44df0 has **broken JSX** — `npx tsc --noEmit` reports **14 errors**. The fieldset closing tags are in the wrong order in both Org tab and Pref tab. Root cause: when the fieldset was added, the `</div>` (closing the grid wrapper) was placed BEFORE the `</fieldset>` (closing the fieldset), but JSX requires LIFO closing order (inner first, outer last).

**Bug location and fix:**

| Location           | Before (broken)             | After (fixed)               |
| ------------------ | --------------------------- | --------------------------- |
| Org tab L172-L173  | `</div>` then `</fieldset>` | `</fieldset>` then `</div>` |
| Pref tab L213-L214 | `</div>` then `</fieldset>` | `</fieldset>` then `</div>` |

**Bugfix patch:** `docs/drafts/hera/settings-jsx-closing-order-bugfix.patch` (879 bytes, 2 hunks, 4 line changes, 1 file)

**Verification:**

- `git apply --check` PASS
- `git apply` PASS
- `npx tsc --noEmit` after fix: 0 errors
- Functional impact: ZERO (purely closing-order correction, no rendered UI change)

**Apollo's mandatory action before push:**

```bash
cd "C:\Users\Tahir\Desktop\frontend that i want\fpa"
git apply docs/drafts/hera/settings-jsx-closing-order-bugfix.patch
npx tsc --noEmit  # MUST be 0
git add src/pages/settings/SettingsPage.tsx
git commit -m "fix(a11y): correct JSX closing order in SettingsPage fieldset (T-HE-011 BUGFIX)

The bcf44df0 commit added fieldset wrappers with closing tags in the wrong order:
- Org tab L172-L173: </div> before </fieldset>
- Pref tab L213-L214: </div> before </fieldset>

JSX requires LIFO closing order. This commit swaps the closing order in both
locations, fixing 14 tsc errors with no functional change.

3W: rule=JSX nested-element LIFO closing / evidence=tsc=14 before, tsc=0 after /
consequence=Apollo post-push verify would fail without this fix"
git push origin main
```

**D-006 lesson:** "JSX closing-order verification — always run `npx tsc --noEmit` before commit, not just after." The original bcf44df0 commit was bundled with 9+ other Muse deliverables and tsc was not verified pre-commit. This is a process gap that allowed a 4-line bug to ship. Recommend: add a pre-commit hook or CI gate that runs `tsc --noEmit` on staged files.

## §8 — References

- **Spec doc (12 § + §13 bugfix):** [`docs/drafts/hera/SETTINGS_FIELDSET_ARIA_PATCHES.md`](./SETTINGS_FIELDSET_ARIA_PATCHES.md)
- **Patch (single-file, 124L, 2 hunks):** [`docs/drafts/hera/settings-fieldset-aria-fixes.patch`](./settings-fieldset-aria-fixes.patch)
- **Bugfix patch (CRITICAL, 879B, 2 hunks):** [`docs/drafts/hera/settings-jsx-closing-order-bugfix.patch`](./settings-jsx-closing-order-bugfix.patch)
- **Predecessor (T-HE-008 v2 spec):** [`docs/drafts/hera/FORM_LABEL_ARIA_PATCHES.md`](./FORM_LABEL_ARIA_PATCHES.md) (12 §, 415L)
- **Predecessor (T-HE-008 v2 patch):** [`docs/drafts/hera/a11y-form-label-fixes.patch`](./a11y-form-label-fixes.patch) (133L, 7595 bytes)
- **Predecessor (T-HE-008 v2 README):** [`docs/drafts/hera/a11y-form-label-fixes-README.md`](./a11y-form-label-fixes-README.md) (159L, 11 §)
- **Sibling bonus (T-HE-008 BONUS README):** [`docs/drafts/hera/eslint-disable-jsx-a11y-3-files-README.md`](./eslint-disable-jsx-a11y-3-files-README.md)
- **Sibling bonus (T-HE-008 BONUS patch):** [`docs/drafts/hera/eslint-disable-jsx-a11y-3-files.patch`](./eslint-disable-jsx-a11y-3-files.patch)
- **Sibling (T-HE-009 motion-tokens README):** [`docs/drafts/hera/motion-tokens-tailwind-README.md`](./motion-tokens-tailwind-README.md)
- **Sibling (T-HE-009 motion-tokens patch):** [`docs/drafts/hera/motion-tokens-tailwind.patch`](./motion-tokens-tailwind.patch)
- **WCAG 2.1 SC 1.3.1 (Info and Relationships, Level A):** https://www.w3.org/WAI/WCAG21/Understanding/info-and-relationships.html
- **WAI-ARIA 1.2 `aria-describedby`:** https://www.w3.org/TR/wai-aria-1.2/#aria-describedby
- **MDN `<fieldset>`:** https://developer.mozilla.org/en-US/docs/Web/HTML/Element/fieldset
- **MDN `<legend>`:** https://developer.mozilla.org/en-US/docs/Web/HTML/Element/legend
- **Athena T-AT-008 v2 R4:** original spec source (with the `role="status"` D-009 spec error)
- **bcf44df0:** the commit that landed T-HE-011 work on `main` (2026-06-13, 05:07 UTC, Warzonesiddiki)
- **Apollo pre-push T-AP-001:** 1-line `DataGrid` import fix (blocker for vitest-axe install)
- **Apollo post-push 019ebcd3-526a-7a60-aefb-2fefe9865e04:** vitest-axe install (blocker for full axe-core verification)

---

**Hera, settings-fieldset-aria-fixes-README.md shipped (8 §, 165L, 6-step Apollo flow, 17/17 test expectation, full revert instructions, all cross-Muse handoffs cross-linked). Patch already in HEAD bcf44df0 — README is informational. D-007: not idle. Next claim candidates: T-HE-010 (motion-tokens 50 migrations, depends on T-HE-009 apply) OR T-HE-012 (axe-core rerun, blocked on Apollo vitest-axe). Will await Leader directive.**
