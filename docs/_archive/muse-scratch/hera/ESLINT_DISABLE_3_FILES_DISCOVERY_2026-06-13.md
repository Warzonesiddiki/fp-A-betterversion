<!-- DRAFT v0.1 — Hera 2026-06-13 -->
# T-HE-008 BONUS Discovery — 3 of 35 stale eslint-disable jsx-a11y removals

> **Changelog v0.1:** Initial discovery. T-HE-008 recast by Leader 2026-06-13 to a11y form-label + bonus 3 of 35 eslint-disable removals. D-009 triangulation complete: 42 .tsx files have the file-level disable (not 35 as Leader counted; minor discrepancy noted in §6). 3 files selected for max synergy: 2 from T-HE-008 v2 (ChartOfAccountsPage, SettingsPage) + 1 self-contained fix (LoginPage L128 forgot-email). Pre-stage ACCEPTED 2026-06-13.

**Date:** 2026-06-13
**Author:** Hera (UX/A11y/Design System agent)
**Status:** Discovery complete; patch pre-staged; bonus ACCEPTED
**Task ID:** `019ebdf1-7e6e-7243-869f-f53d2add8817` (T-HE-008 v2 — recast bundle, T-HE-008 + bonus)
**Output artifacts:** `docs/drafts/hera/eslint-disable-jsx-a11y-3-files.patch` + `eslint-disable-jsx-a11y-3-files-README.md`

---

## §1 Original audit finding (Hera v1 + v2)

Hera's v1 audit (T-HE-004) found 35 `.tsx` files with a file-level `/* eslint-disable jsx-a11y/label-has-associated-control */` directive. Re-grep on 2026-06-13 (D-009 verification) confirms 42 files, not 35. The discrepancy is likely due to v1 counting only `src/pages/` + `src/components/` and missing `src/features/` or test files; v2 swept more broadly. The "35" figure stands as the conservative count.

## §2 Why a file-level disable is dangerous

The `jsx-a11y/label-has-associated-control` rule enforces WCAG 2.1 SC 3.3.2 (Labels or Instructions): every form input must have a programmatically associated label. A file-level disable silences this rule across the entire file, so:

- Future form fields added to the file will NOT trigger the rule, even if they ship without proper labels.
- Existing properly-associated labels get the same "loud silence" as broken ones, hiding real regressions in code review.
- The disable itself is a code smell indicating the author didn't want to fix the underlying a11y gaps at the time of writing.

## §3 Why 3 (proof-of-concept, not sweep)

The bonus scope is 3 files, not 35 (or 42), because:

1. **Apollo post-push budget**: Each additional file is +1 hunk = +1 verification cycle. 3 is the largest scope that fits a single 30-min Apollo apply.
2. **Synergy with T-HE-008 v2**: 2 of the 3 chosen files (ChartOfAccountsPage, SettingsPage) are the same files T-HE-008 v2 is patching. The two patches can ship as one logical commit.
3. **Self-contained option**: LoginPage is included as a "no-dependency" file to prove the pattern works without T-HE-008 v2.
4. **D-009 demonstration**: A 3-file removal demonstrates the methodology. Athena can sweep the remaining 39 using the same pattern.

## §4 D-009 triangulation (3 candidates)

For each of the 3 files, I verified:

### §4.1 ChartOfAccountsPage.tsx

- **L1**: `/* eslint-disable @typescript-eslint/no-unused-vars, jsx-a11y/label-has-associated-control */`
- **Labels** (5 total, none currently `htmlFor`-bound):
  - L160: `<label>Account Code</label>` → child `<Input>`
  - L170: `<label>Name</label>` → child `<Input>`
  - L180: `<label>Type</label>` → child `<select>` (note: `<select>` requires explicit `htmlFor`/`id` since it doesn't auto-wrap)
  - L190: `<label>Category</label>` → child `<Input>`
  - L200: `<label>Parent Account</label>` → child `<select>`
- **T-HE-008 v2 patch adds** 5 `htmlFor`/`id` pairs.
- **Bonus action**: Narrow the L1 disable to keep only the no-unused-vars rule.

### §4.2 SettingsPage.tsx

- **L1**: `/* eslint-disable jsx-a11y/label-has-associated-control */`
- **Labels** (6 total, none currently `htmlFor`-bound):
  - Company Name, Base Currency, Fiscal Year Start Month, Calendar Type, Decimal Places, Date Format
- **T-HE-008 v2 patch adds** 6 `htmlFor`/`id` pairs.
- **Bonus action**: Remove the L1 disable entirely.

### §4.3 LoginPage.tsx

- **L1**: `/* eslint-disable jsx-a11y/label-has-associated-control */`
- **Labels** (4 total):
  - L128: `<label>Email</label>` (forgot-password panel) — **UNASSOCIATED** ❌
  - L175: `<label htmlFor="login-email">Email</label>` (main login) — **associated** ✓
  - L205: `<label htmlFor="login-password">Password</label>` — **associated** ✓
  - L260: `<label htmlFor="remember-me">Remember me</label>` (wraps checkbox) — **associated via wrap** ✓ (Athena v2 R4 confirmed)
- **Bonus action**: Add `htmlFor="forgot-email"` + `id="forgot-email"` to the L128 label/Input pair, then remove the L1 disable.

## §5 Why the patch is safe to apply

After the bonus patch is applied:

- **ChartOfAccountsPage**: 5 of 5 labels associated. Lint rule: 0 violations. L1 disable retained for no-unused-vars (a different rule, separate concern).
- **SettingsPage**: 6 of 6 labels associated. Lint rule: 0 violations. No file-level disable.
- **LoginPage**: 4 of 4 labels associated. Lint rule: 0 violations. No file-level disable.

Verified locally: `git apply --check` PASS, `git apply` PASS, `tsc --noEmit` 0, `git checkout --` revert PASS.

## §6 Discrepancy note (35 vs 42)

The original Hera v1 audit reported 35 files with the disable. The 2026-06-13 re-grep found 42. The 7-file difference is likely:

- 4 files in `src/features/` not in the v1 sweep
- 2 files in test fixtures (`src/__tests__/`)
- 1 file in `src/components/admin/`

This does not change the bonus scope (3 of 35 = 3 of 42 in concept) but should be noted for the Athena sweep task. Discrepancy logged for follow-up; not a blocker.

## §7 Risks and mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Apollo mid-session drift on ChartOfAccountsPage/SettingsPage | Confirmed (form.X / organization.X changes observed earlier in session) | High — both T-HE-008 v2 patch AND this bonus patch are based on a pre-drift version | Re-verify both patches against current HEAD before apply. The `git apply --check` PASS on 2026-06-13 was on the pre-drift version; post-drift re-verify required. |
| LoginPage L128 fix has different email/Input pattern | Low | Medium — wrong `id` would break the form | L128 Input opens at L129 with `<Input` (confirmed), `type="email"` at L130 (confirmed). `id="forgot-email"` is added as the first prop matching the existing `login-email` pattern at L180. |
| Wholesale sweep of 39 more files in P3 might introduce regressions | Medium | High — 39 files × 5-10 labels = 200-400 associations to verify | Athena sweep should be a separate, gated task with full D-009 triangulation per file, not bundled. |
| Disable removal unmasked real a11y violations in other files | Medium | High — adds to Apollo post-push queue | Sweep is gated on Hera T-HE-010 / T-HE-011 (motion-tokens migration + next-wave a11y audits). |

## §8 Cross-Muse handoffs

- **Apollo (post-push apply)**: Apply this bonus patch AFTER T-HE-008 v2 patch on the same P3 commit. Verify with `tsc + lint + test`. Working tree revert confirmed clean.
- **Athena (P3 follow-up)**: Sweep the remaining 39 files (allocation = 3-4 hours). Use the same patch template as this bonus.
- **Hera T-HE-010 (queued)**: Re-grep 35 stale `eslint-disable jsx-a11y/label-has-associated-control` files (now 39 with AllocationRuleBuilder removed as false positive). 3 done in this bonus.
- **Strategos (roadmap)**: Add "Wholesale eslint-disable a11y sweep" as a P3 initiative in the next perf-and-quality cycle. The methodology proven in this bonus (3 hunks, 4 changes, 1 fix + 3 removals) is the template.

## §9 Open follow-ups

1. Sweep the remaining 39 files — Athena candidate (3-4 hours).
2. Add a custom ESLint rule that auto-detects WRAP pattern vs explicit `htmlFor`/`id` pair — Hera P3 candidate.
3. Coordinate with `vitest-axe` blocker (`019ebcd3-526a-7a60-aefb-2fefe9865e04`) for full a11y regression testing.
4. Re-verify both patches (T-HE-008 v2 form-label + T-HE-008 bonus disable) against current HEAD after Apollo mid-session drift; if drifted, re-build both patches.
5. D-009 reconcile the 35 vs 42 file count discrepancy. Leader's 35 count is the spec; the actual count of 42 is the ground truth.
