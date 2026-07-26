# Backlog — Autonomous Evolution

## 🔴 Must Fix (Blocks next cycle)
- [ ] [C1][P3] 828 unused import errors (TS6133) — bulk fix | src/ | HIGH
- [ ] [C2][P3] 767 type mismatch errors (TS2322) — fix chart/formula types | src/ | HIGH
- [ ] [C3][P4] 145 missing property errors (TS2339) — fix store/component interfaces | src/ | HIGH

## 🟡 Should Fix (Accumulated debt)
- [ ] [C4][P5] Formula engine uses float math for currency | src/engines/ | MEDIUM
- [ ] [C5][P8] 4 different grid components (DataTable, DataGrid, SpreadsheetGrid, FinancialTable) | src/components/ | LOW
- [ ] [C6][P9] Missing JSDoc on engine functions | src/engines/ | LOW
- [ ] [C7][P11] Toast notifications not wired into all store actions | src/store/ | LOW

## 🟢 Nice to Have (Discovered opportunities)
- [ ] [C8][P12] Circular reference visualization (dependency graph UI)
- [ ] [C9][P12] Allocation Rule Builder
- [ ] [C10][P12] Report Designer (WYSIWYG)

## ✅ Done (Cleared items)
- [x] [C11][P3] SafeMathParser duplicate keys → Fixed in 1e44fe64
- [x] [C12][P3] Store interface drift (4 stores) → Fixed in 1e44fe64
- [x] [C13][P5] IncrementalCalcEngine O(n²) queue → Fixed in 0477fe79
- [x] [C14][P4] Smoke tests for 43 uncovered pages → Fixed in e0c335d4
- [x] [C15][P11] CSS glassmorphic design overhaul → Fixed in 65f04a5e
