// PICK T v0.10 — Post-Ship Drift Check — D-002 3-Witness Verification Script
// Hermes | TURN 139+ | 2026-06-19

PATTERN A: Duplicate scope="col" attribute on single element
Pattern: <th scope="col" ... scope="col">
This is a JSX/HTML error where the same attribute appears twice.

File 1: src/pages/data/DataImportPage.tsx (Reconciliation Results + Import Job History)
File 2: src/pages/saas/ChurnAnalysisPage.tsx (At-Risk Customers)

Verification:
- DataImportPage.tsx line 762-789 (Reconciliation Results): 5 duplicate scope="col" instances
- DataImportPage.tsx line 893-905 (Import Job History): 5 duplicate scope="col" instances
- ChurnAnalysisPage.tsx line 336-367 (At-Risk Customers): 5 duplicate scope="col" instances
- TOTAL: 15 duplicate scope="col" instances

Root cause: Husky Gate 15 v0.3 (commit 454c756cc) added role="columnheader" attributes
BUT did NOT remove the existing duplicate scope="col" attribute on each <th> element.

This is the EXACT signature of CATCH #227 V sub-class REGRESSION-MERGE-CASCADE:
- Prior commit introduced duplicate scope="col" (via add attribute)
- Subsequent commit re-introduced/retained the defect (failed to remove in line-level edit)

CATCH #227 V sub-class is now CONFIRMED at HEAD 1293f3326 with 15/15 witnesses.
