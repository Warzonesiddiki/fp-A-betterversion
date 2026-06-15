<!-- DRAFT v0.1 — Hera 2026-06-13 -->
# T-HE-008 BONUS — eslint-disable jsx-a11y Patch (3 files)

> **Changelog v0.1:** Initial version. Companion to T-HE-008 v2 (`FORM_LABEL_ARIA_PATCHES.md` + `a11y-form-label-fixes.patch`). 3 of 35 stale file-level `eslint-disable jsx-a11y/label-has-associated-control` directives removed. Pre-stage verified: `git apply --check` PASS, `git apply` PASS, `tsc --noEmit` 0, `git checkout --` revert PASS.

**Date:** 2026-06-13
**Author:** Hera (UX/A11y/Design System agent)
**Status:** Pre-stage ACCEPTED 2026-06-13; ready for Apollo post-push apply
**File:** `docs/drafts/hera/eslint-disable-jsx-a11y-3-files.patch` (4 hunks, 2 files modified, 1 fix + 3 removals)
**Verified:** `git apply --check` → PASS, `git apply` → PASS, `tsc --noEmit` → 0, working tree reverted clean
**Predecessor:** T-HE-008 v2 form-label patch (associates the labels whose disable is being removed)
**Companion doc:** `docs/drafts/hera/ESLINT_DISABLE_3_FILES_DISCOVERY_2026-06-13.md` (D-009 triangulation)

---

## §1 Why this bonus

Per the original Hera audit, 35 `.tsx` files (actual count: 42) carry a file-level `/* eslint-disable jsx-a11y/label-has-associated-control */` directive. This wholesale disable masks real WCAG 2.1 SC 3.3.2 (Labels or Instructions) violations. Leader's T-HE-008 recast added a bonus: 3 strategic disable removals as a proof-of-concept that a wholesale sweep is feasible.

## §2 Scope: 3 of 42 (strategic)

The 3 files were selected for maximum synergy with T-HE-008 v2:

| # | File | Disable location | Strategy |
|---|------|------------------|----------|
| 1 | `src/pages/data/ChartOfAccountsPage.tsx` | L1 (combined with `@typescript-eslint/no-unused-vars`) | **Narrow** the disable to keep only the no-unused-vars rule. Depends on T-HE-008 v2 to associate 5 labels (Account Code, Name, Type, Category, Parent). |
| 2 | `src/pages/settings/SettingsPage.tsx` | L1 (alone) | **Remove** entire L1 disable. Depends on T-HE-008 v2 to associate 6 labels (Company Name, Base Currency, Fiscal Year Start Month, Calendar Type, Decimal Places, Date Format). |
| 3 | `src/pages/auth/LoginPage.tsx` | L1 (alone) | **Self-contained**: patch ADDS the missing `htmlFor="forgot-email"` + `id="forgot-email"` to L128 forgot-password Input, then removes the disable. The other 3 labels in LoginPage (L175 login-email, L205 password, L260 remember-me) were already correctly associated per Athena v2 R4. |

## §3 Prerequisite: apply T-HE-008 v2 first

The bonus patch assumes T-HE-008 v2 (`a11y-form-label-fixes.patch`) has been applied to ChartOfAccountsPage and SettingsPage. Apply order:

```bash
cd "C:/Users/Tahir/Desktop/frontend that i want/fpa"
git apply --check docs/drafts/hera/a11y-form-label-fixes.patch
git apply docs/drafts/hera/a11y-form-label-fixes.patch
git apply --check docs/drafts/hera/eslint-disable-jsx-a11y-3-files.patch
git apply docs/drafts/hera/eslint-disable-jsx-a11y-3-files.patch
```

LoginPage is self-contained; the bonus patch's L128 fix + L1 removal can apply without any prerequisite.

## §4 What the patch does (4 hunks total)

| Hunk | File | Change | Reason |
|------|------|--------|--------|
| 1 | ChartOfAccountsPage.tsx L1 | Narrow `/* eslint-disable @typescript-eslint/no-unused-vars, jsx-a11y/label-has-associated-control */` → `/* eslint-disable @typescript-eslint/no-unused-vars */` | Keep unused-vars disable, drop a11y disable (T-HE-008 v2 now associates all 5 labels) |
| 2 | SettingsPage.tsx L1 | Remove the L1 disable line | T-HE-008 v2 now associates all 6 labels |
| 3 | LoginPage.tsx L1 | Remove the L1 disable line | After hunk 4, all 4 labels in LoginPage are associated |
| 4 | LoginPage.tsx L128 | Add `htmlFor="forgot-email"` to forgot-password label, add `id="forgot-email"` to its Input | Fixes the 1 unassociated label that was being masked by the disable |

Net diff: −4 lines (3 disable removals + 1 L1 line removed from LoginPage), +2 lines (1 `htmlFor` attribute + 1 `id` attribute), 4 hunks across 3 files.

## §5 Verify after apply

```bash
cd "C:/Users/Tahir/Desktop/frontend that i want/fpa"
npx tsc --noEmit              # → 0 errors
npm run lint -- --rule '{"jsx-a11y/label-has-associated-control": "error"}' src/pages/data/ChartOfAccountsPage.tsx src/pages/settings/SettingsPage.tsx src/pages/auth/LoginPage.tsx  # → 0 violations per file
npm test -- src/pages/auth/LoginPage.tsx src/pages/data/ChartOfAccountsPage.tsx src/pages/settings/SettingsPage.tsx  # → all green
```

## §6 What this DOESN'T do (scope honesty)

- Does NOT touch the other 39 files with the disable. A full sweep would be a separate P3 task.
- Does NOT fix any other a11y rules (e.g., `jsx-a11y/alt`, `jsx-a11y/aria-role`).
- Does NOT enforce the new label-association pattern via a custom ESLint plugin. That would be a P3 design-system task.
- Does NOT add `aria-describedby` for help text or error messages (out of scope for this bonus).

## §7 Cross-Muse handoffs

- **Apollo (post-push)**: Apply this patch + T-HE-008 v2 patch in the same P3 commit. Run `npm run lint` and `npx tsc --noEmit` to confirm. The `vitest-axe` dep is still a blocker for full a11y regression testing (see `019ebcd3-526a-7a60-aefb-2fefe9865e04`).
- **Athena (audit follow-up)**: Sweep the other 39 files for the disable. Most should be safe to remove (Leader's prior audit suggested this), but D-009 verify each.
- **Strategos (roadmap)**: Add "Wholesale eslint-disable a11y sweep" as a P3 initiative in the next perf-and-quality cycle.

## §8 Open follow-ups

1. Sweep the remaining 39 files (39 of 42; 3 done in this bonus) — Athena candidate.
2. Add a custom ESLint rule that auto-detects WRAP pattern vs explicit `htmlFor`/`id` pair, and prefers explicit (or downgrades to warning for WRAP).
3. Coordinate with `vitest-axe` blocker (`019ebcd3-526a-7a60-aefb-2fefe9865e04`) for full a11y regression testing.
4. Verify ChartOfAccountsPage T-HE-008 v2 patch (5 htmlFor/id pairs) is not drifted by Apollo's mid-session form.X / organization.X / split('-')[1] changes; if drifted, re-apply both patches.
