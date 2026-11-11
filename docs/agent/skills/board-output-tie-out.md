---
name: board-output-tie-out
description: >
  Use when producing or changing a board pack (Excel / PPTX / PDF), or when any
  report leaves the app. The exported number must tie back to the screen,
  verified by a failing-first test, and the file must be safe to open.
group: product-ui
---

# Board-output tie-out

**Use when:** producing, changing, or exporting any board output (Excel, PPTX,
PDF) or any report that leaves the app.

## Why this exists

The vision's success criterion #7 is that a board pack ties out to the screen,
**verified by test** — and §3's zero-compromise rule is "measured, or not
stated." A number in an export that is not on the screen is a defect, not a
formatting choice. The export is the moment the product's honesty is most
visible to the owner.

## Method

1. **Tie out to the screen.** Every number in the export must equal the number
   on the screen that produced it. The export is not a second computation; it is
   the same computation rendered to a file.
2. **Write the failing-first test.** Before changing an output, write a test
   that asserts the exported cell/text equals the screen value and watch it fail
   for the right reason. The pattern is
   `src/pages/reports/BoardPackPage.exportTieOut.test.tsx`.
3. **Per-format rules.**
   - **Excel:** formula-preserving XLSX where the product promises it; cell
     values match the screen; no formula recomputed to a different number.
   - **PPTX:** editable; text and values match; placeholders are not rendered as
     visible content.
   - **PDF:** safe to open; `NaN`, `undefined`, `[object Object]` never reach
     the page — missing renders as unavailable with a reason, never as 0.
4. **Control totals.** Tie the output to the selected, documented input batch and its
   available control totals. Do not imply that a D365 source/control total exists
   unless the user supplied and mapped it; a self-consistent export is not source
   reconciliation.
5. **Missing is not zero.** An absent period in the board pack says "not in
   file", never `0`.
6. **Run the gate.** the relevant export and safety gates and targeted tie-out test pass on the
   reviewed tree. Capture their actual results; docs verification alone does not
   establish export correctness.

## In this repo

- The success criterion: [`docs/VISION.md`](../../VISION.md) §5 #7.
- The current tie-out test (verify its assertions before reusing as a pattern):
  `src/pages/reports/BoardPackPage.exportTieOut.test.tsx`.
- Excel export: [`excel-and-report-exports`](excel-and-report-exports.md).
- Missing-is-not-zero: `AGENTS.md` §2 #6;
  [`docs/agent/03_DOMAIN_RULES.md`](../03_DOMAIN_RULES.md).
- Export safety: [`security-and-secrets`](security-and-secrets.md).

## Red flags

- An export test that asserts only that the file was created, not that the
  numbers match.
- A board pack whose control totals do not tie to the source batch.
- `NaN` / `undefined` / `0` rendered where a period is absent.
- The tie-out test passing without a failing-first run captured.
- Excel formulas recomputed to different values in the file.

**Proves itself with:** a failing-first tie-out test that asserts exported
values equal screen values, green on the committed tree.

**Source:** original to FinPlan Pro, from the vision's board-output success
criterion and the zero-compromise measured-or-not-stated rule.
