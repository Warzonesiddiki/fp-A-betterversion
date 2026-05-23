# Shared Warnings & Known Issues

Add warnings here when you find issues that other agents should know about.

Format:
```
## [DATE] - [Short Issue Title]
- **Found by:** Agent [N]
- **File:** path/to/file
- **Issue:** Description
- **Impact:** What agents this affects
- **Suggested fix:** (optional)
```

---

## Current Warnings

- **BudgetVsActualPage 946KB** — exportExcel now lazy-loaded. Do NOT import exceljs at top level in any page file.
- **Heatmap.tsx** — Pre-existing TS errors unrelated to recent changes. Not caused by swarm.
- **Input.tsx** — Pre-existing TS errors unrelated to recent changes. Not caused by swarm.
- **FormulaEngine.test.ts** — Pre-existing failures: parseFormula error handling and parentheses evaluation. (Agent 2 task)
- **ScenarioEngine.test.ts** — Pre-existing failure: zero base value handling in sensitivity analysis. (Agent 2 task)
- **smoke.spec.ts** — ✅ RESOLVED. Vitest config already has `exclude: ['tests/**']`. No crash. (Agent 5 verified 2026-05-16)
