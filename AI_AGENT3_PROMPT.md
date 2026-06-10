# FinPlan Pro — Onboarding Prompt for AI Agent

You are joining 2 other AI agents to help ship **FinPlan Pro** — a desktop FP&A app (React 19 + TS 5.9 + Vite 8 + Tailwind 4 + Tauri 2 + AG Grid v35).

## Project Path
`C:\Users\Tahir\Desktop\frontend that i want\fp&A`

## What ALL Agents Shared Completed
- ✅ Feature coverage: **100%** (157/157 competitor features) — last gap (drag-fill) closed
- ✅ Build passes: `node node_modules/vite/bin/vite.js build`
- ✅ 166 noUncheckedIndexedAccess errors batch-fixed
- ✅ 3 smoke test suites fixed (mock constructors)
- ✅ FinPlanGrid test fixed
- ✅ Scenario merge + locking already implemented

## Current Metrics
- **TSC errors:** 2,698 (2,020 noUncheckedIndexedAccess + 678 real type errors)
- **Test failures:** 16 component files, 27 test failures
- **Engine barrel:** 171 engine exports, complete

## Your Assigned Work (PRIORITY 1)

### Fix the 16 failing component test files (27 failures)
Quickest path to value. Run individually to see each error:

```bash
node node_modules/vitest/vitest.mjs run src/components/ui/AccountTree.test.tsx
node node_modules/vitest/vitest.mjs run src/components/ui/ApprovalDashboard.test.tsx
node node_modules/vitest/vitest.mjs run src/components/ui/BoxPlotChart.test.tsx
node node_modules/vitest/vitest.mjs run src/components/ui/BulletChart.test.tsx
node node_modules/vitest/vitest.mjs run src/components/ui/CommandPalette.test.tsx
node node_modules/vitest/vitest.mjs run src/components/ui/ConditionalRuleEditor.test.tsx
node node_modules/vitest/vitest.mjs run src/components/ui/DataTable.test.tsx
node node_modules/vitest/vitest.mjs run src/components/ui/ErrorFallback.test.tsx
node node_modules/vitest/vitest.mjs run src/components/ui/ExportMenu.test.tsx
node node_modules/vitest/vitest.mjs run src/components/ui/FormulaBar.test.tsx
node node_modules/vitest/vitest.mjs run src/components/ui/Progress.test.tsx
node node_modules/vitest/vitest.mjs run src/components/ui/ProgressBar.test.tsx
```

Common failure patterns:
- **Text mismatch** — test expects "Search commands..." but component renders e.g. "Search..." or different label
- **Mock mismatch** — component uses internal state/patterns that don't match test expectations
- **Missing props** — test renders component without required props
- **Rendering crash** — ConditionalRuleEditor may be crashing on undefined/null values

### Fix Approach
1. Read the test file first → identify what it expects
2. Read the component source → see what it actually renders
3. Fix the **component** to match expectations, OR fix the test if component behavior is correct
4. Re-run to verify
5. Batch pass: then run all: `node node_modules/vitest/vitest.mjs run src/components/ui/`

## How to Verify
```bash
node node_modules/vite/bin/vite.js build
node node_modules/typescript/bin/tsc --noEmit | grep "error TS" | wc -l
node node_modules/vitest/vitest.mjs run src/components/ui/
```

## Conventions
- Named exports only, path alias `@/` → `src/`
- All engines in `src/engines/` have test files
- Build must pass before marking work done
- Don't modify test files unless fixing a specific test issue
- After fixing, update this prompt's "Current Metrics" section if you significantly change counts

## Cross-Agent Coordination
- Other agent is working on TSC type errors
- I am working on batch non-null fixes
- Don't redo work already marked as completed above
- If you find a feature gap, flag it — don't implement without coordination
