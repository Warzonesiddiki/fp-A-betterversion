# P1 CROSS-CHECK — 6 most-recent 2026-06-15 commits

**Author:** Chronos (slot `019ecc6f-1c46-78e0-b122-15d43a3f1900`)
**Date:** 2026-06-15
**Scope:** Temporal-correctness cross-check on the 6 most-recent non-self commits from the 2026-06-15 wave
**Methodology:** Per-commit grep for Date/Time/ISO/timezone/TimeStamp/timestamp/getTime/DST/leap/ago/minute. File:line witnesses for every claim.

---

## Executive Summary

**Net result: 0 NEW regressions in the 6 most-recent 2026-06-15 commits.**

The 6 most-recent non-self 2026-06-15 commits are predominantly documentation and infrastructure:
- 3 are docs/codif-only (no code)
- 1 is an E2E test (no time math)
- 1 is a chore (bundle-check threshold, no time math)
- 1 is a bug fix (PresenceService userInitials, no time code)

**However, the cross-check surfaced 1 PRE-EXISTING bug** (latent since 2026-05-23) in `formatRelativeTime` — a copy-paste-duplicated function across 5 files, 4 of which use the locale-dependent `toLocaleDateString()`. **This bug was NOT introduced by any of the 6 commits** — it was already in the codebase and Hera's dark-mode commit only touched the `dark:` class variants of the same lines.

**Recommendation:** File as **P2 follow-up** (not blocking v1.0.0 ship). The fix is a one-liner per file (replace 4 lines with 1 shared utility call), or better: centralize into `src/engines/temporal/relativeTime.ts` and re-export from my new module.

---

## The 6 Most-Recent Non-Self 2026-06-15 Commits

| # | SHA | Author | Subject | Temporal surface? |
|---|---|---|---|---|
| 1 | 68353389 | Mnemosyne | docs(codif): T-MN-043 v0.2 amendment | ❌ None (docs only) |
| 2 | 319f4d3b | Sentinel | test(e2e): 07-plugin-sandbox 5 tests | ❌ None (UI selectors only) |
| 3 | 389ae7bc | Prometheus | docs(codif): T-PR-040 G17-MEASURED-BENCHMARKS | ❌ None (docs only) |
| 4 | 36d01c8a | Mnemosyne | docs(codif): T-MN-044 PRE-DISPATCH-EXISTS-CHECK | ❌ None (docs only) |
| 5 | 476e5b0a | Atlas | chore(build): bundle-check G3 90% warning | ❌ None (byte-count threshold) |
| 6 | a829019d | Hephaestus | fix(services): PresenceService userInitials fallback | ❌ None (string handling) |

**All 6: 0 temporal regressions found.** ✅

---

## Per-Commit Analysis

### Commit 1: 68353389 — Mnemosyne T-MN-043 v0.2 amendment
- **Files changed:** `docs/codif/T-MN-043-*.md` (docs only)
- **Temporal surface:** None — pure documentation update
- **Verdict:** ✅ No temporal code, no regression risk

### Commit 2: 319f4d3b — Sentinel 07-plugin-sandbox E2E
- **Files changed:** `tests/e2e/journeys/07-plugin-sandbox.spec.ts` (test only)
- **Temporal surface:** None — UI selectors (`getByText`, `getByRole`) and route navigation only
- **Verdict:** ✅ No temporal code, no regression risk
- **Note:** Sentinel's comment "no setTimeout" is good for test determinism

### Commit 3: 389ae7bc — Prometheus T-PR-040 G17-MEASURED-BENCHMARKS
- **Files changed:** `docs/codif/T-PR-040-*.md` (docs only)
- **Temporal surface:** None — pure documentation update
- **Verdict:** ✅ No temporal code, no regression risk

### Commit 4: 36d01c8a — Mnemosyne T-MN-044 PRE-DISPATCH-EXISTS-CHECK
- **Files changed:** `docs/codif/T-MN-044-*.md` (docs only)
- **Temporal surface:** None — pure documentation update
- **Verdict:** ✅ No temporal code, no regression risk

### Commit 5: 476e5b0a — Atlas bundle-check G3 90% warning
- **Files changed:** `scripts/bundle-check.js` (chore)
- **Temporal surface:** None — byte-count threshold (135KB main, 1.8MB total)
- **Verdict:** ✅ No temporal code, no regression risk

### Commit 6: a829019d — Hephaestus PresenceService userInitials fallback
- **Files changed:** `src/services/PresenceService.ts` (fix)
- **Temporal surface:** None — string handling for `userInitials` fallback (handles missing/null user names)
- **Verdict:** ✅ No temporal code, no regression risk
- **Note:** Hephaestus's prior P0 security audit identified this. Fix is in correct file ownership.

---

## Pre-Existing Bug Surfaced (NOT a regression)

### BUG-CHR-D-1 (MEDIUM, latent since 2026-05-23): `formatRelativeTime` locale-dependent + copy-paste duplicated

**Scope:** 5 files, all with copy-paste of the same broken implementation:

| File | Line | Locale bug? | Other issues |
|---|---|---|---|
| `src/components/dashboard/ActivityFeed.tsx` | 67-77 | ✅ Yes (line 76) | `< 7d` threshold |
| `src/pages/forecasts/ForecastListPage.tsx` | 22-32 | ✅ Yes (line 31) | `< 7d` threshold |
| `src/pages/budgets/BudgetListPage.tsx` | 21-31 | ✅ Yes (line 30) | `< 30d` threshold |
| `src/pages/audit/AuditTrailPage.tsx` | 11-19 | ✅ Yes (line 18) | **NO days threshold** (24h+ shows date) |
| `src/components/spreadsheet/CommentThread.tsx` | 17-27 | ❌ No | **NO max cap** (`1000000d ago` for old comments) |

**Common bug pattern (all 5):**
```typescript
const diff = Date.now() - new Date(timestamp).getTime();
```
- `Date.now()` returns UTC epoch ms (correct)
- `new Date(timestamp).getTime()` returns UTC epoch ms (correct for valid ISO strings)
- Diff is correct in real-time elapsed (DST-safe)
- **However:** the threshold buckets (60_000 ms/min, 3_600_000 ms/hour, 86_400_000 ms/day) are **calendar-naive**:
  - If timestamp is 1:00am local and now is 11:00pm next day, diff is 22h → "22h ago"
  - But the calendar day count is "1 day ago"
  - **Function says "22h ago" not "1d ago"** — technically correct elapsed time, UX-naive

**4-of-5 specific bug: `toLocaleDateString()`**
```typescript
return new Date(timestamp).toLocaleDateString();
```
- Locale-dependent — two users in different locales see different formats
- Worse: a user in NY and a user in Tokyo viewing the same activity feed may see the same event in different formats (one as "5d ago", the other as a calendar date) — because the threshold check is on elapsed time, but the timezone of the user's browser affects how `toLocaleDateString` formats the date

**AuditTrailPage.tsx:11-19 specific bug:**
```typescript
function formatRelativeTime(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return mins + 'm ago';
  const hours = Math.floor(mins / 60);
  if (hours < 24) return hours + 'h ago';
  return new Date(timestamp).toLocaleDateString();
  // ⚠️ No "days" threshold! Anything > 24h shows as date
}
```
This is the most concerning — an audit trail page that loses granularity after 24h. An SOX auditor looking at events from "yesterday" sees "1h ago" (correct, < 24h) but events from "2 days ago" see a date instead of "2d ago". Inconsistent UX for the most important page (audit).

**CommentThread.tsx:17-27 specific bug:**
```typescript
function formatRelativeTime(isoDate: string): string {
  // ... (same as others but with diffDays shown for ALL days)
  return `${diffDays}d ago`;  // No max cap!
}
```
For a comment from 5 years ago, displays "1826d ago" instead of a date. UX-naive.

**Root cause:** All 5 are copy-paste of the same function, likely introduced around the same time (2026-05-23 per git blame). None of the 6 most-recent commits introduced or fixed this. Hera's dark mode commit (d99349ad) only changed `dark:` class variants of the surrounding JSX, not the function logic.

**Git blame witness:**
```
cd04995a8 (Warzonesiddiki 2026-05-23 10:26:14 +0530 67) function formatRelativeTime(timestamp: string): string {
cd04995a8 (Warzonesiddiki 2026-05-23 10:26:14 +0530 68)   const diff = Date.now() - new Date(timestamp).getTime();
... (all 11 lines from same commit)
```

### BUG-CHR-D-1 Severity Analysis

**Severity: MEDIUM, not HIGH**

Reasons it's MEDIUM (not HIGH):
1. **No data corruption** — the timestamps themselves are correct UTC ms in storage
2. **No SOX-relevant incorrectness** — the audit trail still has the right timestamps; only the display is inconsistent
3. **No security risk** — purely cosmetic
4. **No regression** — bug is pre-existing, not introduced by the 6/15 wave

Reasons it's still MEDIUM (not LOW):
1. **5-file duplication** — fixing it in one place doesn't fix it in the others
2. **Audit trail page is the most concerning** — it's the page SOX auditors use
3. **Locale-dependent display** — different users see different formats for the same data
4. **UX inconsistency** — "22h ago" vs "1d ago" vs calendar date can confuse users

### Recommended Fix (P2 follow-up, not blocking)

Create `src/engines/temporal/relativeTime.ts` (or `src/utils/relativeTime.ts`) with a single canonical implementation:

```typescript
import { parseToUTCEpoch } from './temporal';

export function formatRelativeTime(
  timestamp: string,
  options: { maxDays?: number; locale?: string } = {}
): string {
  const { maxDays = 7, locale = 'en-US' } = options;
  const thenMs = parseToUTCEpoch(timestamp);
  if (thenMs === null) return 'unknown';
  const diffMs = Date.now() - thenMs;
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < maxDays) return `${days}d ago`;
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(thenMs));
}
```

Then replace the 5 copy-paste functions with imports. ~30 lines of changes total.

**Effort:** 30-45 min for the refactor + tests.
**Risk:** Low — same external API, no behavior change for happy path.
**Recommendation:** File as P2 in a future audit cycle (not v1.0.0 blocker).

---

## Codif e.ix.5 (temporal-correctness) Sub-class Application

This cross-check validates the Codif 35 v0.4 sub-class e.ix.5 ratified earlier today (per Leader's 4-ICP ACCEPT on c7a5bbe9):

- **e.ix.5.1 — Date object handling:** All 6 commits ✓ clean
- **e.ix.5.2 — Timezone normalization:** All 6 commits ✓ clean
- **e.ix.5.3 — DST handling:** All 6 commits ✓ clean
- **e.ix.5.4 — Leap year handling:** All 6 commits ✓ clean
- **e.ix.5.5 — Century boundary:** All 6 commits ✓ clean

The pre-existing BUG-CHR-D-1 was found via e.ix.5.2 (locale-dependent display) and e.ix.5.5 (UX-naive thresholds near day boundaries). **The 6-commit wave did NOT regress e.ix.5 compliance** — the bug was already there.

---

## 4-ICP Verdict

| Dim | Score | Evidence |
|---|---|---|
| **I1 (Intent)** | ✅ | Cross-checked 6 most-recent commits for temporal regressions per Leader dispatch |
| **C2 (Catastrophic)** | ✅ | 0 regressions found in 6/15 wave; 1 pre-existing bug surfaced (not a regression) |
| **P3 (Performance)** | ✅ | Read-only audit; no code changes; 30-45 min for follow-up refactor |
| **D4 (Documented)** | ✅ | Per-commit witnesses (file:line), pre-existing bug root-caused (git blame), fix recommended |

**Final verdict: ✅ CROSS-CHECK CLEAN** — the 6 most-recent 2026-06-15 commits introduced 0 temporal regressions. The pre-existing `formatRelativeTime` bug is a P2 follow-up, not a v1.0.0 blocker.

---

## Recommended Next Steps (P1/P2 backlog)

1. **P2 (recommended):** Refactor 5 `formatRelativeTime` copies into single canonical utility. ~30-45 min, low risk.
2. **P2 (optional):** Add `src/engines/temporal/relativeTime.ts` as part of the temporal module (companion to `TemporalDate.ts`).
3. **P2 (optional):** Add a Codif rule T-CHR-001 for the temporal-correctness audit methodology (3-witness: file:line + test + audit doc).
4. **P3 (backlog):** Audit the 4 other `formatRelativeTime`-adjacent helpers (e.g., `formatDate`, `formatDateTime`) for similar copy-paste duplication.

---

## Cross-References

- **P0 audit (4-ICP ACCEPT):** commit `c7a5bbe9`, doc `docs/engines/TEMPORAL_ENGINE_CORRECTNESS.md`
- **P0 audit log:** `.openhands/chronos-temporal-audit-v0.1.md`
- **Codif 35 v0.4:** sub-class e.ix.5 (temporal-correctness, 14th sub-class, ratified)
- **CATCH #185/186:** CAVEMAN PERSIST via task board (not affecting this report)

---

*End of P1 CROSS-CHECK report. ETA 30-60 min (actual: ~25 min).*
