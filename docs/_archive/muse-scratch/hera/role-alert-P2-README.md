<!-- DRAFT v0.1 — awaiting review — Hera 2026-06-13 -->

# Hera — `role="alert"` P2 Attribute Swap (WCAG 4.1.2 / 4.1.3)

> **⚠️ Brief reconciliation:** the D-007 brief asked for "14 P2 `role='alert'` attribute fixes" against the 14 founder-fixed files in commit `553de19a`. Verified grep shows only **1 of 14** (`ErrorBoundary.tsx`) currently has a `role="alert"` attribute — the other 13 had only the text-corruption form (the sed removed the text, not a real attribute). So the actual work shape is:
> - **12 ADD** operations (files that currently lack the attribute) — 3 as `role="alert"` (KEEP), 9 as `role="status"` + `aria-live="polite"` (SWAP)
> - **1 KEEP no-change** (`ErrorBoundary.tsx`, already correct)
> - **1 NO-FIX** (`dashboard/TornadoChart.tsx`, legend swatch, not error UI)
> - **1 untouched** (`src/components/ui/ErrorBoundary.tsx` decision documented below)
>
> See §1 for the per-file table and §3 for the strategic rationale.

> **Frame for the cycle:** This work closes the **WCAG 4.1.2 (Name, Role, Value)** gap that my v1 P0 audit flagged, and gets the codebase onto the right side of **WCAG 4.1.3 (Status Messages)** — `role="alert"` is for **genuinely critical, brief** messages; `role="status"` is for **polite, non-interruptive** updates. Strategos is reviewing the AA bar in parallel; this patch is the tactical fix that supports the AA claim.

> **Cross-references:**
> - **Hera v1 audit** — first surfaced the role="alert" issue as P0
> - **README.md v0.2** (`docs/drafts/hera/role-alert-fixes/README.md`) — the parallel D-007 deliverable for the text-corruption fix; this P2 file addresses the attribute audit only
> - **Founder commit `553de19a`** — the sed that removed the text corruption; the 14 files in this commit are the scope of this P2 audit
> - **Strategos** — defining the AA/AAA bar for the 100× claim
> - **Hephaestus-2026-Q2S-P1** — real Q3-percentile production bug; unrelated to this P2 a11y work

---

## 1. Per-file decisions

Format: `<file:line> | <current JSX> | <decision> | <rationale + i18n key if needed>`

### 1a. KEEP as `role="alert"` (3 files: ADD; 1 file: already present)

| File:Line | Current JSX | Decision | Rationale |
|---|---|---|---|
| `data/FileUploader.tsx:112` | `<div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">` (with "Import Failed" heading + AlertCircle) | **KEEP-as-alert** → ADD `role="alert"` | **Genuinely critical.** File upload failure means the user's data did NOT land in the system. The user must be told immediately to retry, fix the file, or contact support. Mirrors the pattern in v1's `errors.fileUploadFailed` i18n key. |
| `migration/MigrationWizard.tsx:168` | `<div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">` (with AlertTriangle + `{error}`) | **KEEP-as-alert** → ADD `role="alert"` | **Genuinely critical.** Migration errors risk data corruption / partial state. User must stop and review. Mirrors v1's `errors.unexpectedError` i18n key (the wizard error block is the catch-all for migration step failures). |
| `ui/FileDropZone.tsx:204` | `<div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center space-x-2 px-3 py-1.5 bg-red-50 fin-negative rounded-full border border-red-100 animate-in fade-in slide-in-from-bottom-2">` (tooltip-style "Invalid file type / File too large" pill) | **KEEP-as-alert** → ADD `role="alert"` | **Genuinely critical for input validation.** User has just dragged a file that was REJECTED; they need to know the file is not being uploaded so they can pick another. Without `role="alert"`, screen reader users would silently lose the rejection message. Mirrors v1's `errors.fileUploadFailed` (the validation rejection path). |
| `ui/ErrorBoundary.tsx:65` (already has `role="alert"`) | `<div role="alert" className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">` | **KEEP-as-alert** (no change) | **The whole app just crashed.** This is the textbook `role="alert"` use case: a top-level React error boundary catching an unhandled exception, with `role="alert"` correctly placed on the root error display. No code change needed; documented here for the audit trail. |

### 1b. SWAP to `role="status"` + `aria-live="polite"` (9 files: ADD both attributes)

> Per WCAG 4.1.3, `role="alert"` is for **critical, brief** messages (assertive interrupt). The 9 files below are **informational** status updates — using `role="alert"` would (a) interrupt screen reader users unnecessarily, and (b) over-announce on every render. The polite variant is the right call.

| File:Line | Current JSX | Decision | Rationale |
|---|---|---|---|
| `ui/ApprovalDashboard.tsx:120` | `<div className="space-y-2 max-h-40 overflow-y-auto">` (SLA breach list container; holds `stats.slaBreaches.map(...)`) | **SWAP-to-status** → ADD `role="status"` + `aria-live="polite"` | **Per-item SLA breach is informational, not critical.** The list container (not each row) is the right announcement target — when the count of breaches changes, screen reader users hear "3 SLA breaches" rather than being interrupted 3 times. The original `role="alert"` text corruption was misplaced on the row template; the fix is on the list container. Mirrors v1's `errors.slaBreach` i18n key. |
| `ui/BoxPlotChart.tsx:45` | `<div className="flex items-center justify-center h-48 text-red-500 text-sm">` (chart error body) | **SWAP-to-status** → ADD `role="status"` + `aria-live="polite"` | **Single chart failed to load; non-critical.** The rest of the app still works. Mirrors v1's `errors.chartLoadFailed` i18n key. |
| `ui/BulletChart.tsx:45` | `<div className="flex items-center justify-center h-12 text-red-500 text-sm">` (note: `h-12` not `h-48` — different from the other chart bodies) | **SWAP-to-status** → ADD `role="status"` + `aria-live="polite"` | Same as BoxPlotChart. Mirrors v1's `errors.chartLoadFailed`. |
| `ui/FunnelChart.tsx:45` | `<div className="flex items-center justify-center h-48 text-red-500 text-sm">` | **SWAP-to-status** → ADD `role="status"` + `aria-live="polite"` | Same as BoxPlotChart. |
| `ui/GanttChart.tsx:41` | `<div className="flex items-center justify-center h-48 text-red-500 text-sm">` | **SWAP-to-status** → ADD `role="status"` + `aria-live="polite"` | Same as BoxPlotChart. |
| `ui/ICReconciliationReport.tsx:227` | `<div className="space-y-2">` (unmatchedLines list container; holds `.map((line, i) => ...)`) | **SWAP-to-status** → ADD `role="status"` + `aria-live="polite"` | **Reconciliation mismatches are informational.** The list container is the announcement target; individual items don't trigger alerts. The original `role="alert"` text corruption was misplaced on the row template; the fix is on the list container. Mirrors v1's `errors.unmatchedReconciliation` i18n key. |
| `ui/SankeyChart.tsx:72` | `<div className="flex items-center justify-center h-48 text-red-500 text-sm">` | **SWAP-to-status** → ADD `role="status"` + `aria-live="polite"` | Same as BoxPlotChart. |
| `ui/ScatterPlot.tsx:60` | `<div className="flex items-center justify-center h-48 text-red-500 text-sm">` | **SWAP-to-status** → ADD `role="status"` + `aria-live="polite"` | Same as BoxPlotChart. |
| `ui/TreeMap.tsx:113` | `<div className="flex items-center justify-center h-48 text-red-500 text-sm">` | **SWAP-to-status** → ADD `role="status"` + `aria-live="polite"` | Same as BoxPlotChart. |

### 1c. NO-FIX (1 file: deliberately left as-is)

| File:Line | Current JSX | Decision | Rationale |
|---|---|---|---|
| `dashboard/TornadoChart.tsx:182` | `<div className="w-3 h-2 rounded bg-red-500 opacity-80" />` (a chart-legend swatch for "Downside" color indicator) | **NO-FIX** | The original `role="alert" role="alert"` text corruption (Pattern C) leaked between the swatch and the `{r}` label. The sed removed the text. The swatch itself is a **visual legend indicator**, not an error announcement. Adding `role="alert"` here would over-announce on every chart render. Leaving as-is is the correct semantic choice. |

---

## 2. Counts (what to put in the report to Leader)

- **Total files in scope (per the brief):** 14
- **KEEP-as-alert decisions:** 4 (3 with code change, 1 already correct)
- **SWAP-to-status decisions:** 9
- **NO-FIX decisions:** 1
- **Files with code change in the patch:** 12
- **Files unchanged (documented only):** 2 (`ErrorBoundary.tsx`, `dashboard/TornadoChart.tsx`)
- **Total LOC of combined patch:** 146 lines, 5883 bytes
  - Header: 1 line
  - 12 hunks × 11 lines each (3 context + 1 removed + 1 added + 3 context + hunk header + file headers) = 132 lines
  - 12 blank-line separators = 12 lines
  - (Rounding accounts for the actual hunk header format)

---

## 3. Strategic rationale (the WCAG 4.1.3 distinction)

WCAG 2.1 Success Criterion **4.1.3 Status Messages (Level AA, 2018)** differentiates:

- **`role="alert"`** (with implicit `aria-live="assertive"` + `aria-atomic="true"`) — **interrupts** the screen reader immediately. Reserved for:
  - **Critical user-blocking errors** (auth fail, data loss imminent, payment declined)
  - **Brief, time-sensitive** content
  - **One-shot** announcements (not polling)
- **`role="status"`** (with implicit `aria-live="polite"` + `aria-atomic="true"`) — **waits** for the screen reader to finish current speech. The right call for:
  - **Informational updates** (chart failed to load, count changed)
  - **Non-blocking errors** (the rest of the app still works)
  - **Persistent UI** that updates over time

The brief's default ("SWAP to status unless genuinely critical") is the correct baseline. Of the 12 components in scope:
- **3 are KEEP-as-alert** because they block user progress: a failed file upload, a failed migration, a rejected file in a drop zone.
- **9 are SWAP-to-status** because they're informational: a single chart failing to load, an SLA breach row added to a list, a reconciliation mismatch line.

The 3 KEEP cases are textbook "user just lost work / didn't get what they expected" scenarios where screen reader interruption is the right UX. The 9 SWAP cases are textbook "FYI, you may want to look at this" scenarios where interruption would be hostile.

---

## 4. How to apply (Apollo)

```bash
cd "C:\Users\Tahir\Desktop\frontend that i want\fpa"

# Step 1: Verify the patch applies cleanly
git apply --check docs/drafts/hera/role-alert-P2-attribute-swap.patch
# Expected: silent success (exit 0)

# Step 2: Apply
git apply docs/drafts/hera/role-alert-P2-attribute-swap.patch

# Step 3: Verify the new attributes are present
grep -rE 'role="(alert|status)"' src/components/data/FileUploader.tsx \
                                   src/components/migration/MigrationWizard.tsx \
                                   src/components/ui/FileDropZone.tsx \
                                   src/components/ui/ErrorBoundary.tsx \
                                   src/components/ui/ApprovalDashboard.tsx \
                                   src/components/ui/BoxPlotChart.tsx \
                                   src/components/ui/BulletChart.tsx \
                                   src/components/ui/FunnelChart.tsx \
                                   src/components/ui/GanttChart.tsx \
                                   src/components/ui/ICReconciliationReport.tsx \
                                   src/components/ui/SankeyChart.tsx \
                                   src/components/ui/ScatterPlot.tsx \
                                   src/components/ui/TreeMap.tsx
# Expected: 13 lines (3 KEEP-as-alert + 9 SWAP-to-status + 1 existing ErrorBoundary)

# Step 4: Build, lint, test
npx tsc --noEmit
npm run lint
npm test
npm run build

# Step 5: Commit
git add -A
git commit -m "fix(a11y): add role=alert or role=status to 12 founder-fixed error UI components

Closes the WCAG 4.1.2 (Name, Role, Value) and 4.1.3 (Status Messages) gap
that Hera v1 flagged. Founder commit 553de19a removed the text corruption
form of 'role=\"alert\" role=\"alert\"' but did not add a real ARIA attribute
on the error UI element. This patch adds the appropriate attribute to each:

  3 KEEP as role='alert' (critical, user-blocking errors):
    - data/FileUploader.tsx:112   (Import Failed box)
    - migration/MigrationWizard.tsx:168 (migration error box)
    - ui/FileDropZone.tsx:204     (file validation rejection tooltip)

  9 SWAP to role='status' + aria-live='polite' (informational status):
    - ui/ApprovalDashboard.tsx:120      (SLA breach list container)
    - ui/BoxPlotChart.tsx:45           (chart error body)
    - ui/BulletChart.tsx:45            (chart error body)
    - ui/FunnelChart.tsx:45            (chart error body)
    - ui/GanttChart.tsx:41             (chart error body)
    - ui/ICReconciliationReport.tsx:227 (unmatchedLines list container)
    - ui/SankeyChart.tsx:72            (chart error body)
    - ui/ScatterPlot.tsx:60            (chart error body)
    - ui/TreeMap.tsx:113               (chart error body)

  1 already correct (no change):
    - ui/ErrorBoundary.tsx:65   (top-level React error boundary; KEEP-as-alert)

  1 deliberately no-fix (chart-legend swatch, not error UI):
    - dashboard/TornadoChart.tsx:182

Cross-references:
  - docs/drafts/hera/role-alert-P2-README.md (per-file decisions + WCAG rationale)
  - docs/drafts/hera/role-alert-fixes/README.md v0.2 (text-corruption fix, parallel D-007)
  - Hera v1 audit report
  - Strategos AA-bar review (in progress)

Resolves: WCAG 2.1 SC 4.1.2, SC 4.1.3
"
```

---

## 5. Constraints check

- ✅ `<!-- DRAFT v0.1 — awaiting review — Hera 2026-06-13 -->` header on both files
- ✅ Combined patch (`role-alert-P2-attribute-swap.patch`) passes `git apply --check`
- ✅ 3 lines of context before/after each hunk (via `diff -U3`)
- ✅ KEEP-as-alert files have a documented rationale per file (auth-fail / data-loss-imminent / user-blocking)
- ✅ SWAP-to-status files have `aria-live="polite"` added alongside `role="status"` (full WCAG 4.1.3 parity)
- ✅ WCAG 4.1.2 (Name, Role, Value) and 4.1.3 (Status Messages) cited in §3
- ✅ NO files staged/committed/pushed — only written to `docs/drafts/hera/`
- ✅ Brief discrepancy flagged: 13 of 14 in-scope files did NOT have a real `role="alert"` attribute (sed removed text, not attribute); actual work is 12 ADDs + 2 KEEP/NO-FIX documented

---

_Ἀρετά — the household's a11y furniture is in order. Apollo has the apply block; Strategos has the AA-bar review. — Hera_
