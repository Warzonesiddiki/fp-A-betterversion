---
name: asc-810-consolidation-elimination
description: >
  Use when working on consolidation, intercompany elimination, ownership, or multi-entity close. Confirm applicable accounting policy and authoritative ASC 810 guidance for the transaction.
group: finance
---

# ASC 810 consolidation elimination

**Use when** touching `/consolidation`, `/consolidation/ic-eliminations`, `/consolidation/ownership`, ConsolidationEngine, ICEliminationPage, OwnershipTreePage, or any intercompany surface.

## Method

1. **Foundational rule ASC 810-10-45-1**: "In the preparation of consolidated financial statements, intra-entity balances and transactions shall be eliminated. This includes intra-entity open account balances, security holdings, sales and purchases, interest, dividends, and so forth. As consolidated financial statements are based on the assumption that they represent the financial position and operating results of a single economic entity, such statements shall not include gain or loss on transactions among the entities in the consolidated group."
2. **Do not net the elimination by ownership percentage.** Determine the intra-entity balances/transactions and applicable elimination amount under the accounting policy; calculate noncontrolling-interest attribution separately where required. Transaction direction, basis, and facts affect attribution; escalate ambiguous treatment rather than relying on a simplified example.
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
7. **Implementation boundary**: inspect the current engine API and tests before relying on a proposed model. A code path or test suite does not by itself prove complete ASC 810 coverage or production readiness.

## In this repo

- `/consolidation` is a product surface; verify route and component names against current source before citing them.
- Engine: `src/engines/ConsolidationEngine.ts`; inspect its current signature and behavior (including optional intercompany pairs) before use.
- Do not assume a dedicated consolidation store or UI behavior; trace the current caller and persisted state.
- Route status is governed by current evidence manifests and completion register, not inferred from the existence of loading/error/empty states.
- Tests: ConsolidationDashboard.test.tsx has loading branch announce-once.

## Red flags

- Eliminating only ownership % instead of 100%.
- Forgetting to eliminate intercompany interest/dividends.
- Allocating elimination before full elimination.
- Showing internal loan as asset in consolidated view.

**Evidence to inspect:** `src/engines/ConsolidationEngine.governance.test.ts`, current financial oracles, and route governance evidence. Passing tests cover their asserted cases only; they do not establish universal accounting compliance.
**Source:** original implementation guidance; verify accounting conclusions against authoritative ASC 810 text and the entity’s approved accounting policy.
