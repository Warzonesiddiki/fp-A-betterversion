# Component Tests Report

## Summary
- **Total test files**: 113 (all passing)
- **Total tests**: 974 (all passing)
- **New test files created**: 32
- **Date**: 2026-05-24

## New Test Files (32)

### Top-Level Components (27)
| File | Tests |
|------|-------|
| `AccountTree.test.tsx` | 12 |
| `AllocationHistory.test.tsx` | 13 |
| `AllocationPreview.test.tsx` | 16 |
| `AllocationRuleBuilder.test.tsx` | 12 |
| `ApprovalQueue.test.tsx` | 17 |
| `ApprovalWorkflowDesigner.test.tsx` | 12 |
| `BoxPlotChart.test.tsx` | 12 |
| `BulletChart.test.tsx` | 15 |
| `CalendarHeatmap.test.tsx` | 15 |
| `CellCommentPanel.test.tsx` | 2 |
| `ChartCard.test.tsx` | 4 |
| `ChatPanel.test.tsx` | 1 |
| `CommentaryTemplate.test.tsx` | 6 |
| `ConditionalFormattingPanel.test.tsx` | 1 |
| `ConfirmDialog.test.tsx` | 4 |
| `DataGridToolbar.test.tsx` | 6 |
| `DrillThroughBreadcrumb.test.tsx` | 5 |
| `ErrorFallback.test.tsx` | 3 |
| `ErrorState.test.tsx` | 14 |
| `ExportMenu.test.tsx` | 9 |
| `FileDropZone.test.tsx` | 6 |
| `GenerativeDashboard.test.tsx` | 1 |
| `Heatmap.test.tsx` | 21 |
| `OnboardingWizard.test.tsx` | 4 |
| `TourOverlay.test.tsx` | 13 |
| `WhatIfSandbox.test.tsx` | 7 |

### RuleEditor Components (5)
| File | Tests |
|------|-------|
| `ColorScaleOptions.test.tsx` | 1 |
| `ColorStyleOptions.test.tsx` | 1 |
| `ConditionFields.test.tsx` | 2 |
| `DataBarOptions.test.tsx` | 1 |
| `IconSetOptions.test.tsx` | 1 |

## Coverage Improvement
- Previously untested components in `src/components/ui/` now have smoke tests
- All 5 `RuleEditor/` sub-components are now tested
- Tests verify: rendering, props, user interaction, accessibility, edge cases, and error states

## Issues Fixed During Creation
1. **Arrow function constructors** — `vi.fn().mockImplementation(() => ...)` with `new` fails. Used `function()` instead.
2. **CSS class mismatches** — `Badge` and `Button` outline/ghost variants use `var(--border-default)` and `var(--bg-hover)`, not literal Tailwind classes.
3. **ProgressStepper prop shape** — accepts `{label, status}[]`, not `string[]`.
4. **ConditionalFormattingPanel props** — takes `rules` + `onRulesChange`, not `engine`.
5. **ConfirmDialog zustand store** — `open()` returns unresolved Promise; state changes don't trigger synchronous re-render. Used `waitFor` for assertions.
6. **`getByDisplayValue` with controlled selects** — replaced with `getByLabelText` and `getByText` for option text.
7. **Require() bypassing vi.mock hoisting** — replaced with direct class instantiation.
8. **Nested Router** — removed `MemoryRouter` from tests using `@/test/testUtils` which already wraps `BrowserRouter`.
