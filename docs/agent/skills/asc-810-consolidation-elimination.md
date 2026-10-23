---
name: asc-810-consolidation-elimination
description: >
  Use when working on consolidation, IC elimination, ownership tree, or multi-entity close: 100% elimination per ASC 810-10-45-1, single economic entity, NCI attribution.
group: finance
---

# ASC 810 consolidation elimination

**Use when** touching `/consolidation`, `/consolidation/ic-eliminations`, `/consolidation/ownership`, ConsolidationEngine, ICEliminationPage, OwnershipTreePage, or any intercompany surface.

## Method

1. **Foundational rule ASC 810-10-45-1**: "In the preparation of consolidated financial statements, intra-entity balances and transactions shall be eliminated. This includes intra-entity open account balances, security holdings, sales and purchases, interest, dividends, and so forth. As consolidated financial statements are based on the assumption that they represent the financial position and operating results of a single economic entity, such statements shall not include gain or loss on transactions among the entities in the consolidated group."
2. **100% elimination regardless of NCI**: ASC 810-10-45-18: amount eliminated not affected by noncontrolling interest. If parent owns 80% and sub sold inventory upstream at $100K markup still on shelf, eliminate $100K, not $80K. Full elimination, then allocate impact: downstream (parent→sub) reduces only controlling interest; upstream (sub→parent) reduces both controlling and NCI proportionally.
3. **Elimination entries**:
   - Intercompany receivable/payable (loan): Dr Intercompany Payable, Cr Intercompany Receivable — removes internal loan, net zero.
   - Intercompany interest: Dr Interest Income, Cr Interest Expense — group cannot earn interest from itself.
   - Intercompany sales: Dr Intercompany Revenue, Cr COGS/Expense — removes internal sale.
   - Unrealized profit inventory: Dr COGS or Retained Earnings, Cr Inventory.
   - Dividends: Dr Dividend Income (Parent), Cr Dividends Declared (Sub).
   - Investment vs equity: eliminate parent investment against sub equity, recognize goodwill and NCI.
4. **Single economic entity**: consolidated group cannot recognize profit from trading with itself. Only transactions with outside parties survive.
5. **VIEs**: ASC 810-10-35-3: intercompany fees between primary beneficiary and consolidated VIE eliminated against related expense/income of VIE, effect attributed to primary beneficiary not NCI.
6. **IFRS 10 para 20**: intragroup assets, liabilities, equity, income, expenses, cash flows eliminated in full, regardless of ownership.
7. **Implementation**: EntityData (entityId, currency, entries), OwnershipStructure (parentId, childId, ownershipPct, method), ConsolidationEngine.consolidate() must produce elimination journal entries, then NCI attribution as separate calc.

## In this repo

- `/consolidation`: ConsolidationDashboard, ICEliminationPage, OwnershipTreePage, ConsolidationPage.
- Engine: `src/engines/ConsolidationEngine.ts` with `consolidate(entityData, ownerships)`.
- Store: glStore for entries, no consolidationStore — uses engine directly.
- Page already has loading (isLoading from glStore) and error (local useState) and empty (no entities) — ready for promotion.
- Tests: ConsolidationDashboard.test.tsx has loading branch announce-once.

## Red flags

- Eliminating only ownership % instead of 100%.
- Forgetting to eliminate intercompany interest/dividends.
- Allocating elimination before full elimination.
- Showing internal loan as asset in consolidated view.

**Proves itself with:** consolidation oracle tests with known-balanced multi-entity scenario, IC elimination entries, NCI attribution.
**Source:** adapted from houseblend.io ASC 810 intercompany elimination rules, dart.deloitte.com ASC 810-10-45-1/45-18, pwc viewpoint 8.2 intercompany transactions, indinero.com (MIT docs, rewritten).
