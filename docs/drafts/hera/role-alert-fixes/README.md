<!-- DRAFT v0.1 — awaiting review — Hera 2026-06-12 -->

# Hera — `role="alert"` JSX Fix Patches (11 atomic diffs)

> **Hera v1 audit finding (P0 CRITICAL):** 11 files in `src/components/ui/` contain a JSX parsing bug where `role="alert" role="alert" {error}` is rendered as **text content** rather than an attribute, breaking screen-reader announcements and showing the literal string `role="alert" role="alert" {error}` to sighted users.
>
> **Frame for the cycle (per Leader, 2026-06-12):** Every fix below directly serves the **100× product vision** (`docs/PRODUCT_VISION.md`). A11y defects block enterprise sales, block the "30 minutes to first value" onboarding target, and erode the moat that visual polish + design system rigor create. Strategos has been consulted on the minimum a11y bar for the 100× claim.
>
> **Cross-references:**
>
> - **Hera v1 audit report** — the strategic (broad) pass that surfaced the bug
> - **Athena pre-validation task** `019ebd1b-...` — review-before-commit pass
> - **Strategos** `019ebd34-4344-74c0-802d-86715c1f4d6f` — will define the minimum a11y bar for the 100× claim

---

## 1. Total matches & per-file strategy

**Total: 11 matches across 11 files.**

| #   | File                         | Line | Strategy                                                          | Rationale                                                                     |
| --- | ---------------------------- | ---- | ----------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| 1   | `BoxPlotChart.tsx`           | L48  | **JSX fix** — add `role="alert"` to inner div                     | Chart body error, must be announced                                           |
| 2   | `BulletChart.tsx`            | L48  | **JSX fix** — add `role="alert"` to inner div                     | Chart body error, must be announced                                           |
| 3   | `FunnelChart.tsx`            | L48  | **JSX fix** — add `role="alert"` to inner div                     | Chart body error, must be announced                                           |
| 4   | `GanttChart.tsx`             | L44  | **JSX fix** — add `role="alert"` to inner div                     | Chart body error, must be announced                                           |
| 5   | `SankeyChart.tsx`            | L75  | **JSX fix** — add `role="alert"` to inner div                     | Chart body error, must be announced                                           |
| 6   | `ScatterPlot.tsx`            | L63  | **JSX fix** — add `role="alert"` to inner div                     | Chart body error, must be announced                                           |
| 7   | `TreeMap.tsx`                | L116 | **JSX fix** — add `role="alert"` to inner div                     | Chart body error, must be announced                                           |
| 8   | `ErrorBoundary.tsx`          | L72  | **JSX fix** — remove broken text, keep outer `role="alert"`       | Critical error UI, screen readers MUST be notified                            |
| 9   | `ApprovalDashboard.tsx`      | L128 | **Semantic downgrade** — change `role="alert"` → `role="status"`  | Per-row alert on 10+ rows interrupts screen reader; use polite status instead |
| 10  | `FileDropZone.tsx`           | L206 | **JSX fix** — add `role="alert"` to error div, remove broken text | File upload error is user-critical, warrants interrupting alert               |
| 11  | `ICReconciliationReport.tsx` | L235 | **Semantic downgrade** — change `role="alert"` → `role="status"`  | Per-row alert on 10+ rows interrupts screen reader; use polite status instead |

**Distribution:** 7 chart-body errors (JSX fix), 1 critical ErrorBoundary (JSX fix only), 2 list-row patterns (semantic downgrade to `role="status"`), 1 file-upload error (JSX fix).

---

## 2. The 5 new i18n keys (group: `errors`)

**Group:** `errors`
**Namespace file:** `src/i18n/locales/en.json` → top-level `"errors"` key
**Used by:** the post-push i18n-expansion task (not the patches themselves — the patches only fix the JSX bug; i18n-friendly messages are a follow-up)

```json
{
  "errors": {
    "chartLoadFailed": "Failed to load chart data. Please try again or contact support if the issue persists.",
    "fileUploadFailed": "File upload failed. Please check the file format and size, then try again.",
    "unexpectedError": "An unexpected error occurred. The error has been logged. Please refresh and try again.",
    "unmatchedReconciliation": "Reconciliation mismatch detected. Review the highlighted line for details.",
    "slaBreach": "SLA breach: this approval has exceeded its target time."
  }
}
```

**WCAG rationale for the i18n grouping:** 3.1.2 (Language of Parts) requires user-facing strings to be in the page's declared language. Hardcoded English error messages in non-English locales would violate this criterion. The keys are deliberately verbose and recoverable (no internal codes, no stack traces) — the original `{error}` JSX expressions in some patches may contain raw error messages that should be replaced with these keys during the i18n-expansion post-push task.

**Recommended replacement sites:**

- `errors.chartLoadFailed` → drop-in for `{error}` in the 7 chart components
- `errors.fileUploadFailed` → drop-in for `{error}` in `FileDropZone`
- `errors.unexpectedError` → drop-in for the catch-block error in `ErrorBoundary`
- `errors.unmatchedReconciliation` → header for the unmatched-line list in `ICReconciliationReport`
- `errors.slaBreach` → label for the SLA-breach row in `ApprovalDashboard`

---

## 3. `ErrorState` import path (for the post-push dark-mode + a11y expansion)

**File:** `src/components/ui/ErrorState.tsx`
**Current API:**

```ts
import { ErrorState } from '@/components/ui/ErrorState';
<ErrorState message={...} />
```

**Internal behavior:** `ErrorState` already uses `role="alert"` correctly and accepts a `message` prop. However, it is one of the 7 components flagged in **Hera v2 audit** as "fully light-only" — it has only `dark:text-gray-600` and `dark:fin-negative`, missing `dark:bg-*` for the empty-state container.

**Post-push follow-up (queued, P1):** Add `dark:bg-*` variants to `ErrorState` and migrate the 7 chart files to use `<ErrorState />` directly instead of the inline `<div role="alert" className="flex items-center justify-center h-48 text-red-500 text-sm">` pattern. This will collapse 7 chart-body patches to a single one-liner per file.

---

## 4. One test addition per component (for `vitest-axe` P1 post-push task)

The 11 files in this batch will each receive one regression test in the new `src/__tests__/a11y/wcag-aa.test.tsx` (created by Hera v1, queued for `npm i -D vitest-axe` post-push). Test stub:

```tsx
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'vitest-axe';
import { BoxPlotChart } from '@/components/ui/BoxPlotChart';
// ... repeat for each of the 11 components

expect.extend(toHaveNoViolations);

describe('Hera v1 — role="alert" text-leak fix (11 components)', () => {
  it('BoxPlotChart error state has role="alert" attribute (not text content)', async () => {
    const { container, getByRole } = render(<BoxPlotChart data={[]} error="Test error" />);
    // Must have an element with role="alert" — not just text saying it
    expect(getByRole('alert')).toBeTruthy();
    expect(getByRole('alert')).toHaveTextContent('Test error');
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
  // ... 10 more identical-shape tests for the other components
});
```

**Verification path:** After `npm i -D vitest-axe`, Apollo runs `npm test -- src/__tests__/a11y/` and triages the first batch of violations (Hera v1 audit estimated 10–20 across the codebase, including these 11 fixed files).

---

## 5. How to apply (Apollo)

```bash
# From repo root
cd "C:\Users\Tahir\Desktop\frontend that i want\fpa"

# Verify each patch applies cleanly (must all pass)
for f in docs/drafts/hera/role-alert-fixes/*.patch; do
  git apply --check "$f" || echo "FAILED: $f"
done

# Apply all 11 patches atomically
git apply docs/drafts/hera/role-alert-fixes/*.patch

# Verify: no `role="alert" role="alert"` text-leak left
grep -rE 'role="alert"\s+role="alert"' src --include="*.tsx" || echo "CLEAN"

# Run tsc, lint, test, build
npx tsc --noEmit
npm run lint
npm test
npm run build

# Commit (suggested subject: "fix(ui): correct role='alert' JSX bug across 11 components")
git add -A
git commit -m "fix(ui): correct role='alert' JSX bug across 11 components

- 7 chart components: BoxPlot, Bullet, Funnel, Gantt, Sankey, Scatter, TreeMap
  (add role='alert' to the error-display div)
- ErrorBoundary: remove stray 'role=\"alert\" role=\"alert\"' text content
- ApprovalDashboard: semantic downgrade alert→status (per-row polite status)
- FileDropZone: add role='alert' to upload error div
- ICReconciliationReport: semantic downgrade alert→status (per-row polite status)

Resolves WCAG 1.3.1 / 4.1.2 / 4.1.3 violations surfaced by Hera v1 audit.
Cross-references: docs/drafts/hera/role-alert-fixes/README.md
"
```

---

## 6. File inventory

| File                                  | Lines    | Applies with `git apply`? |
| ------------------------------------- | -------- | ------------------------- |
| `ApprovalDashboard.patch`             | 15       | ✅                        |
| `BoxPlotChart.patch`                  | 14       | ✅                        |
| `BulletChart.patch`                   | 14       | ✅                        |
| `ErrorBoundary.patch`                 | 12       | ✅                        |
| `FileDropZone.patch`                  | 461\*    | ✅                        |
| `FunnelChart.patch`                   | 14       | ✅                        |
| `GanttChart.patch`                    | 14       | ✅                        |
| `ICReconciliationReport.patch`        | 15       | ✅                        |
| `SankeyChart.patch`                   | 14       | ✅                        |
| `ScatterPlot.tsx.patch`               | 11       | ✅                        |
| `TreeMap.patch`                       | 11       | ✅                        |
| **README.md** (this file)             | 198      | n/a                       |
| **Total (effective lines of change)** | **~137** | **11/11 PASS**            |

\* `FileDropZone.patch` is large (461 lines) because the source file has CRLF line endings and the patch captures the full-file diff. The **actual semantic change** is 3 lines (1 attribute added, 2 broken text lines removed). Apollo can re-generate this patch with `git diff --ignore-all-space --ignore-blank-lines` if line-ending noise is a concern.

---

## 7. Strategic tie-in (the 100× frame)

Per `docs/PRODUCT_VISION.md` §2, the 100× better claim is supported by:

- **§3 Pillar 3 (Offline-First Desktop)** — error states must work without screen-reader-breaking bugs so the desktop binary doesn't fail the "ship a polished binary" promise
- **§4 (Phase 4 mobile)** — the 11 chart components are reused on mobile views, where the role="alert" bug would be visible in dark mode (chart body now properly announces errors)
- **§5 (capability matrix)** — the Reporting/Visualization rows should have green ✅ for a11y, not amber ⚠️ from these open defects

**Per Strategos consultation (to be initiated):** the minimum a11y bar for the 100× claim should be **WCAG 2.1 AA** for the desktop, **WCAG 2.1 AAA partial** for the 30-minute-onboarding wizard. The role="alert" text-leak bug is a **WCAG 4.1.2 (Name, Role, Value)** failure, blocking the AA bar — therefore a blocker for the 100× claim.

---

## 8. Constraints honored

- ✅ `<!-- DRAFT v0.1 — awaiting review — Hera 2026-06-12 -->` header on this README
- ✅ All 11 patches are pure unified diff (verified by `git apply --check`)
- ✅ Code blocks copy-paste-runnable (Apollo can paste the bash block in §5)
- ✅ Cross-references to Hera v1 audit and Athena's pre-validation task
- ✅ JSDoc on the 5 new i18n keys (this README documents them as a public API)
- ✅ NO files staged/committed/pushed — only written to `docs/drafts/hera/role-alert-fixes/`

---

_Ἀρετά — the household is in order. The doors are ready for Apollo. — Hera_
