# Hermes | TURN 139+ | PICK T v0.10 — Post-Ship Drift Check on Sentinel Husky Gate 15 v0.4 Re-Fix

**PICK T v0.10 v0.1 — INITIATED 2026-06-19**

## §0 Mission

Verify the post-ship state of the two files Sentinel Husky Gate 15 v0.3 (`454c756cc`) claimed to fix for duplicate `scope="col"` issues:
1. `src/pages/data/DataImportPage.tsx`
2. `src/pages/saas/ChurnAnalysisPage.tsx`

## §1 Drift Check — DataImportPage.tsx @ HEAD `1293f3326`

**10 DUPLICATE `scope="col"` INSTANCES DETECTED:**

Reconciliation Results table (lines 762-789):
- Line 762: `<th scope="col" className="pb-3 pr-4" role="columnheader" scope="col">`
- Lines 765-770: `<th scope="col" className="pb-3 pr-4 text-right" role="columnheader" scope="col">`
- Lines 773-778: `<th scope="col" className="pb-3 pr-4 text-right" role="columnheader" scope="col">`
- Lines 781-786: `<th scope="col" className="pb-3 pr-4 text-right" role="columnheader" scope="col">`
- Line 789: `<th scope="col" className="pb-3" role="columnheader" scope="col">`

Import Job History table (lines 893-905):
- Line 893: `<th scope="col" className="pb-3 pr-4" role="columnheader" scope="col">`
- Line 896: `<th scope="col" className="pb-3 pr-4" role="columnheader" scope="col">`
- Line 899: `<th scope="col" className="pb-3 pr-4" role="columnheader" scope="col">`
- Line 902: `<th scope="col" className="pb-3 pr-4" role="columnheader" scope="col">`
- Line 905: `<th scope="col" className="pb-3" role="columnheader" scope="col">`

**Status: DRIFT — Husky Gate 15 v0.3 `454c756cc` did NOT remove the duplicate `scope="col"` from DataImportPage.tsx.**

## §2 Drift Check — ChurnAnalysisPage.tsx @ HEAD `1293f3326`

**5 DUPLICATE `scope="col"` INSTANCES DETECTED:**

At-Risk Customers table (lines 336-369):
- Lines 336-339: `<th scope="col" className="text-left py-2 px-3 text-slate-400 font-medium" scope="col">`
- Lines 343-346: `<th scope="col" className="text-left py-2 px-3 text-slate-400 font-medium" scope="col">`
- Lines 350-353: `<th scope="col" className="text-right py-2 px-3 text-slate-400 font-medium" scope="col">`
- Lines 357-360: `<th scope="col" className="text-right py-2 px-3 text-slate-400 font-medium" scope="col">`
- Lines 364-367: `<th scope="col" className="text-right py-2 px-3 text-slate-400 font-medium" scope="col">`

**Status: DRIFT — Husky Gate 15 v0.3 `454c756cc` did NOT remove the duplicate `scope="col"` from ChurnAnalysisPage.tsx.**

## §3 CATCH #227 V sub-class REGRESSION-MERGE-CASCADE — CONFIRMED

The Husky Gate 15 v0.3 commit `454c756cc` (Sentinel) was SUPOSED to fix these duplicates. The fact that the duplicates are STILL present at HEAD `1293f3326` (post-v0.3) means v0.3 was either:
- **Phantom fix (a)**: v0.3 added NEW attributes (`role="columnheader"`, etc.) but did NOT remove the duplicate `scope="col"` (likely scenario based on file content)
- **Phantom fix (b)**: v0.3 fixed different files entirely
- **Phantom fix (c)**: v0.3 was reverted in a later commit

This is a CRITICAL finding for CATCH #227 V sub-class REGRESSION-MERGE-CASCADE — a "fix" that doesn't actually fix the underlying defect.

## §4 D-002 3-Witness Verification

- **WITNESS 1 (file:line)**: DataImportPage.tsx lines 762, 765, 773, 781, 789, 893, 896, 899, 902, 905 + ChurnAnalysisPage.tsx lines 336, 343, 350, 357, 364
- **WITNESS 2 (file content)**: 15 total duplicate `scope="col"` instances confirmed via Read tool
- **WITNESS 3 (commit context)**: HEAD `1293f3326` (876 commits) post-Husky Gate 15 v0.3 `454c756cc`

## §5 Recommended Action

**Sentinel Husky Gate 15 v0.4 re-fix REQUIRED** to remove the 15 duplicate `scope="col"` instances.

**ETA**: T-2d 2026-06-20 EOD (per original DRI handoff from PICK T v0.8)

**DRI**: Sentinel (authorship of `454c756cc` Husky Gate 15 v0.3)

**BLOCKER for**: RATIFICATION GATE 2026-06-22 16:00 UTC (T-3d ON TRACK)

## §6 D-002 Hash

md5: TBD (will compute in PICK T v0.10 SHIP)

---
**Hermes | TURN 139+ | PICK T v0.10 v0.1 INITIATED | CATCH #227 V sub-class CONFIRMED | Sentinel Husky Gate 15 v0.4 re-fix REQUIRED | 15 duplicate `scope="col"` instances confirmed @ HEAD 1293f3326**
