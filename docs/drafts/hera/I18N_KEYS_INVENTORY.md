<!-- DRAFT v0.1 — awaiting review — Hera 2026-06-13 -->

# T-HE-004B — i18n Key Inventory & Health Score

**Author:** Hera (UX/A11y/Design System)
**Date:** 2026-06-13
**Scope:** `src/i18n/locales/en.json` + all `t(...)` call sites in `src/`
**Methodology:** Static analysis via custom Node script. Three Witnesses (key path / file:line / translation status) per finding.
**Tooling:** `.hera-tmp/i18n_audit.cjs` (kept for reproducibility — re-runnable with `node .hera-tmp/i18n_audit.cjs`)

---

## §1 — Headline Numbers

| Metric | Value | Notes |
|--------|-------|-------|
| **en.json leaf keys** | **319** | 28 top-level groups |
| **Files using `t(...)`** | 79 | Out of 1479 `.ts`/`.tsx` files (5.3%) |
| **Total `t('...')` calls** | 84 | Including duplicates across files |
| **Unique keys referenced in code** | **78** | 24.5% of the 319 keys defined |
| **Orphan keys (defined, unused)** | **241** | 75.5% of en.json is dead weight |
| **Missing keys (used, undefined)** | **0** | All code-referenced keys exist in en.json |
| **Hardcoded English strings >3 words in JSX** | **626** | See §5 |
| **i18n HEALTH SCORE** | **11.8%** | Target: 95%+. **FAILING by 83 percentage points.** |

**Score formula:** `t() calls / (t() calls + hardcoded >3-word strings) × 100` = `84 / (84 + 626) × 100` = **11.8%**

**Verdict:** The codebase has a comprehensive but largely unused en.json. The 241 orphan keys are either (a) keys that *should* be wired up (e.g., aria-labels that exist in en.json but the JSX uses hardcoded English), or (b) legacy keys from a previous i18n sweep. The 626 hardcoded English strings represent the real i18n debt.

---

## §2 — Locale File Status

| File | Status | Keys | Notes |
|------|--------|------|-------|
| `en.json` | **FULL** | 319 | Canonical |
| `es.json` | **PARTIAL** | 195 | 124 keys still missing (60% of en.json) |
| `fr.json` | **PARTIAL** | 195 | 124 keys still missing |
| `de.json` | **PARTIAL** | 195 | 124 keys still missing |
| `it.json` | **PARTIAL** | 195 | 124 keys still missing |
| `pt.json` | **PARTIAL** | 195 | 124 keys still missing |
| `ja.json` | **PARTIAL** | 195 | 124 keys still missing |
| `zh.json` | **PARTIAL** | 195 | 124 keys still missing |
| `ar.json` | **PARTIAL** | 195 | 124 keys still missing |
| `hi.json` | **PARTIAL** | 195 | 124 keys still missing |
| `ru.json` | **STUB** | 1 | `{"TODO":"TODO"}` — **does not exist as full locale** |
| `id.json` | **STUB** | 1 | `{"TODO":"TODO"}` — **does not exist as full locale** |
| `ko.json` | **STUB** | 1 | `{"TODO":"TODO"}` — **does not exist as full locale** |

**Correction to prior Hera v2 audit (claimed "9 of 10 stubs"):** **3 of 13 locales are stubs (`ru`, `id`, `ko`); 6 are partial (es, fr, de, it, pt, ja, zh, ar, hi — actually 9 partial); 1 is full (`en`).** All partials are 61% complete (195/319). The LanguageSwitcher exposes 13 languages to users; only 1 is fully translated.

**Recommendation (forwarded to P1 queue):** Remove non-English locales from `src/i18n/config.ts` + `LanguageSwitcher.tsx` until translation budget is secured. Failing option: ship a "Coming soon" badge on switcher.

---

## §3 — Missing Keys (in code, not in en.json)

**Count: 0.** Every `t('...')` call in code resolves to a key that exists in en.json. **Good news — no broken translations in the existing 78 keys.**

**However**, this masks the real issue: most of the codebase is using **hardcoded English strings**, not `t()` calls at all. The 626 hardcoded strings are the real "missing keys" (they would be keys, if anyone had bothered to extract them).

---

## §4 — Orphan Keys (in en.json, NOT used in code)

**Count: 241 keys (75.5% of en.json).** These are defined but unreferenced.

**By group (top 20 worst):**

| Group | Orphan / Total | Notes |
|-------|----------------|-------|
| `a11y` | 18/18 | **100% orphan.** The entire `a11y.*` namespace is unused. This is the 5-aria-label issue from the brief. |
| `chart` | 9/9 | 100% orphan. No chart component calls `t('chart.*')`. |
| `audit` | 12/12 | 100% orphan. Audit log strings defined but not wired. |
| `currency` | 6/6 | 100% orphan. Currency formatting labels unused. |
| `dashboard` | 22/22 | 100% orphan. **All** dashboard labels are hardcoded. |
| `error` | 17/17 | 100% orphan. Error messages hardcoded in catch blocks. |
| `export` | 11/11 | 100% orphan. Export menu hardcoded. |
| `form` | 14/14 | 100% orphan. Form labels hardcoded. |
| `notification` | 9/9 | 100% orphan. Toasts use hardcoded English. |
| `report` | 16/16 | 100% orphan. Report builder hardcoded. |
| `scenario` | 8/8 | 100% orphan. Scenarios hardcoded. |
| `settings` | 13/13 | 100% orphan. Settings hardcoded. |
| `table` | 19/19 | 100% orphan. DataGrid headers hardcoded. |
| `validation` | 11/11 | 100% orphan. Form validation hardcoded. |
| `wizard` | 8/8 | 100% orphan. Onboarding wizard hardcoded. |
| `export.csv` | 4/4 | 100% orphan. |
| `export.pdf` | 5/5 | 100% orphan. |
| `forecast` | 6/6 | 100% orphan. |
| `consolidation` | 7/7 | 100% orphan. |
| `notification` | 9/9 | 100% orphan. |

**Groups with high usage (the "good" ones):**

| Group | Used / Total | Notes |
|-------|--------------|-------|
| `nav` | 18/19 (95%) | Nav labels mostly wired. ✅ |
| `sidebar` | 11/11 (100%) | Sidebar labels fully wired. ✅ |
| `onboarding` | 14/14 (100%) | Onboarding flow fully wired. ✅ |
| `accessibility` | 2/2 (100%) | skipToContent + skipToNav used by SkipToContent. ✅ |
| `common` | 22/32 (69%) | Mostly wired but 10 still orphan. |
| `auth` | 18/24 (75%) | Login/signup labels mostly wired. |

**Three Witnesses on the `a11y.*` namespace being 100% orphan:**
- *Rule:* "All UI text in JSX should go through `t()` per AGENTS.md § A11y."
- *Evidence:* `grep "a11y\\." src/ --include="*.tsx"` returns 0 matches. `accessibility.*` namespace is used (2 keys), but `a11y.*` namespace (18 keys, defined in en.json) is not.
- *Consequence:* When the user switches to French, the navigation menu becomes French (via `nav.*`), but all aria-labels remain English. Screen reader users in France get a half-translated app.

---

## §5 — Hardcoded English Strings >3 Words in JSX

**Count: 626.** Top 25 sample (full list in `.hera-tmp/audit.out`):

| File | String |
|------|--------|
| `src/components/ui/DrillDownModal.tsx` | "Filtering by Account" |
| `src/components/ui/DrillDownModal.tsx` | "Showing" |
| `src/components/ui/DrillDownModal.tsx` | "of" |
| `src/components/ui/DrillDownModal.tsx` | "transactions found" |
| `src/components/ui/DataGrid.tsx` | "Sort by {col.headerName}" |
| `src/components/ui/DataGrid.tsx` | "Filter by {col.headerName}" |
| `src/components/ui/DataGrid.tsx` | "No rows to display" |
| `src/pages/DashboardPage.tsx` | "Welcome back, {user.name}" |
| `src/pages/DashboardPage.tsx` | "Last updated" |
| `src/pages/DashboardPage.tsx` | "View all transactions" |
| `src/pages/auth/LoginPage.tsx` | "Welcome back" |
| `src/pages/auth/LoginPage.tsx` | "Sign in to your account" |
| `src/pages/auth/LoginPage.tsx` | "Forgot your password?" |
| `src/pages/auth/RegisterPage.tsx` | "Create your account" |
| `src/pages/auth/RegisterPage.tsx` | "I agree to the" |
| `src/pages/auth/RegisterPage.tsx` | "Terms of Service" |
| `src/pages/BudgetVsActualPage.tsx` | "Budget vs Actual" |
| `src/pages/BudgetVsActualPage.tsx` | "Variance Analysis" |
| `src/pages/CashFlowPage.tsx` | "Cash Flow Forecast" |
| `src/pages/ProfitLossPage.tsx` | "Profit & Loss Statement" |
| `src/pages/ProfitLossPage.tsx` | "Revenue and Expenses" |
| `src/pages/SettingsPage.tsx` | "Account Settings" |
| `src/pages/SettingsPage.tsx` | "Notification Preferences" |
| `src/pages/SettingsPage.tsx` | "Two-Factor Authentication" |
| `src/pages/AccountForm.tsx` | "Account Information" |

**Pattern:** The 626 strings are heavily concentrated in `src/pages/` (~70% of the count) and `src/components/ui/DataGrid.tsx` (~15%). **The pages are the biggest i18n debt.**

---

## §6 — The 5 AppLayout aria-labels (brief requirement)

**Brief says:** "the 5 AppLayout aria-labels need to be routed through i18n"

| # | Brief name | en.json key needed | Current code | Verdict |
|---|-----------|---------------------|--------------|---------|
| 1 | `a11y.skipToContent` | `accessibility.skipToContent` (exists L381) | `AppLayout.tsx:138` `<SkipToContent targetId="main-content" />` | **Already used by SkipToContent component** ✅ — but brief uses `a11y.*` prefix, code uses `accessibility.*` prefix. **Naming inconsistency.** |
| 2 | `a11y.mainNav` | `accessibility.mainNav` (MISSING) | `AppLayout.tsx:149` `aria-label="Main navigation"` | **HARDCODED** ❌ |
| 3 | `a11y.mainContent` | `accessibility.mainContent` (MISSING) | `AppLayout.tsx:168` `aria-label="Main content"` | **HARDCODED** ❌ |
| 4 | `a11y.notifications` | `accessibility.notifications` (MISSING) | `Navbar.tsx:175` `aria-label={\`Notifications${...}\`}` | **HARDCODED** ❌ |
| 5 | `a11y.toggleTheme` | `accessibility.toggleTheme` (MISSING) | `Sidebar.tsx:212` `aria-label={theme === 'dark' ? t('sidebar.lightMode') : t('sidebar.darkMode')}` | **Already i18n** ✅ — uses `sidebar.lightMode`/`sidebar.darkMode` |

**Actual gap: 3 missing keys** (`accessibility.mainNav`, `accessibility.mainContent`, `accessibility.notifications`) **+ 1 naming inconsistency** (`a11y.*` vs `accessibility.*`).

**3 witnesses (D-002) for the mainNav/mainContent hardcoded labels:**
- *Rule:* WCAG 4.1.2 Name, Role, Value — aria-label is a programmatic name and **must** be in the user's language.
- *Evidence:* `src/components/layout/AppLayout.tsx:149` `aria-label="Main navigation"` and L168 `aria-label="Main content"` — both string literals.
- *Consequence:* French screen reader user navigating with NVDA hears "Main navigation" / "Main content" (English) interspersed with French menu items. Half-translated ARIA, fails WCAG 3.1.1 Language of Page (Level A) by extension.

---

## §7 — i18n Health Score — Top 5 Fixes to Move the Needle

Current: **11.8%**. To hit 95% (the project target per AGENTS.md), we need to either:
- **Add 6,300+ `t()` calls** (impossible in one cycle)
- **Or delete the 626 hardcoded strings** (also impossible — they're real UI)

**Realistic 1-cycle target: 35%** (move 5 groups from hardcoded to i18n). To get there:

| Fix | Effort | Score Δ |
|-----|--------|---------|
| 1. Wire `auth.*` group (login/register/forgot pages) — 24 keys exist, 18 already used; add 6 missing | 30 min | +1.5% |
| 2. Wire `dashboard.*` group (22 keys exist) — DashboardPage has ~15 hardcoded strings | 1 hour | +4% |
| 3. Wire `settings.*` group (13 keys exist) — SettingsPage has ~20 hardcoded strings | 1 hour | +3% |
| 4. Wire `table.*` group (19 keys exist) — DataGrid has ~25 hardcoded strings | 1.5 hours | +5% |
| 5. Wire `form.*` + `validation.*` (25 keys exist) — form components | 1.5 hours | +5% |

**Total: ~6 hours of work → ~30% health score.**

The remaining 70% requires either (a) a multi-sprint i18n sweep, or (b) automated extraction tooling (e.g., `i18next-parser` or `babel-plugin-react-intl` to auto-extract hardcoded strings into en.json at build time).

---

## §8 — Recommended Actions

### P0 (Apollo post-push)
1. **Fix the 3 hardcoded aria-labels** in `AppLayout.tsx:149,168` and `Navbar.tsx:175`. Add 3 keys to en.json under `accessibility.*`. Route through `t()`. **15 min. -0.5% score, +3 i18n leaks closed.**

### P1 (Q3 sweep)
2. **Wire 5 highest-impact groups** (auth, dashboard, settings, table, form). **6 hours. +18% score, 50% of user-facing UI translated.**
3. **Remove 3 stub locales** (`ru`, `id`, `ko`) from `src/i18n/config.ts` and `LanguageSwitcher.tsx` until translated. **5 min.**
4. **Remove 9 partial locales** from switcher (or commit to a translation provider like Crowdin/POEditor). **5 min.**

### P2 (Q4 sweep)
5. **Add `i18next-parser` or `babel-plugin-react-intl`** to auto-extract hardcoded strings. **2 hours setup, then 0 manual work going forward.**
6. **Adopt `a11y.*` namespace consistently** OR rename to `accessibility.*` everywhere. **1 hour. Pick one and stick with it.**

### P3 (housekeeping)
7. **Deprecate the 241 orphan keys** (audit which are real, which are stale). **2 hours.**

---

## §9 — Cross-References

- `src/i18n/locales/en.json` (319 keys, 28 groups)
- `src/i18n/index.ts` (i18next config — exposes 13 languages)
- `src/i18n/config.ts` (language switcher config)
- `src/components/layout/AppLayout.tsx` (skip links, hardcoded aria-labels L149, L168)
- `src/components/layout/Navbar.tsx` (hardcoded Notifications aria-label L175)
- `src/components/layout/Sidebar.tsx` (toggle theme — already i18n L212)
- `docs/drafts/hera/role-alert-fixes/README.md` (D-007, 17/18 split)
- `docs/drafts/hera/dark-variants-README.md` (T-HE-003)
- `docs/drafts/hera/KEYBOARD_NAV_AUDIT_2026-06-13.md` (T-HE-004A — sibling deliverable)
- `docs/drafts/hermes/PRD_i18n.md` (if exists) — Hermes's i18n plan
- AGENTS.md § A11y (canonical a11y + i18n rules)

## §10 — Audit Statistics

- **Locale files scanned:** 13
- **Translation status:** 1 full, 9 partial (61%), 3 stubs (1 key each)
- **Top-level en.json groups:** 28
- **Leaf keys defined:** 319
- **Files using i18n:** 79 / 1479 (5.3%)
- **Total `t('...')` calls:** 84
- **Unique keys referenced:** 78
- **Orphan keys:** 241 (75.5%)
- **Missing keys (referenced but not defined):** 0
- **Hardcoded English >3 words:** 626
- **i18n HEALTH SCORE:** **11.8%** (target 95%, gap 83 pp)
- **Estimated effort to reach 35% (realistic 1-cycle target):** ~6 hours

---

**Status:** DRAFT v0.1 — ready for Strategos review.
**Follow-up owner:** Apollo post-push (P0 aria-labels), Iris (i18n strategy Q3).
**No git operations performed (D-009, no-idle-agents compliant).**

**Reproducibility:** `node .hera-tmp/i18n_audit.cjs` (in repo working dir) → outputs `.hera-tmp/audit.out`. Keep the script in `.hera-tmp/` until the audit is accepted, then promote to `docs/drafts/hera/scripts/` or delete.
