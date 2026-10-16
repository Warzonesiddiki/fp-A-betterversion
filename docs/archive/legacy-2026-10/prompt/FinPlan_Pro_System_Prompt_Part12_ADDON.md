# FINPLAN PRO — AI FLEET SYSTEM PROMPT
## Part 12 of 15: Consolidation Engine Complete Specification
## Version 5.0.0 | Generated 2026-05-18 | VERIFIED FROM ACTUAL CODEBASE

---

## 0. WHY THIS PART EXISTS

Consolidation is the MOST COMPLEX feature in FP&A software. It combines
accounting standards (ASC 810, ASC 805, ASC 830), multi-entity data,
intercompany eliminations, currency translation, and minority interest
calculations into a single, auditable output.

Without this part, the AI will write consolidation code that WORKS
mathematically but violates accounting standards, creating legal and
audit risks.

The ConsolidationEngine.ts (973 lines) implements ASC 810 compliant
consolidation. This part documents HOW it works, WHY it works that way,
and what edge cases to handle.

---

## 1. CONSOLIDATION OVERVIEW

### 1.1 What Is Consolidation (Plain English)

Imagine a parent company owns 3 subsidiaries. Each subsidiary has its
own books — revenue, expenses, assets, liabilities. Consolidation
combines ALL of them into ONE set of financial statements as if they
were a single company.

Why it's hard:
  - Parent sold goods to Subsidiary A. That's not real revenue — it's
    an internal transfer. Must be ELIMINATED.
  - Parent owns only 80% of Subsidiary B. The other 20% belongs to
    outside investors. That's MINORITY INTEREST.
  - Subsidiary C operates in Euros but reports in Dollars. Every line
    item must be TRANSLATED at the right exchange rate.
  - Parent paid $10M for Subsidiary D whose book value was $7M. The
    extra $3M is GOODWILL.

### 1.2 The 5 Hardest Problems in Consolidation

```
PROBLEM 1: Intercompany Eliminations
  Parent records $1M revenue from selling to Sub.
  Sub records $1M cost of goods from buying from Parent.
  In consolidation, BOTH must disappear. If they don't,
  the consolidated P&L is inflated by $1M.

PROBLEM 2: Unmatched Intercompany
  Parent says Sub owes them $500K.
  Sub's books show they owe Parent $480K.
  Where did the $20K go? Timing difference? Error?
  The engine must handle this gracefully.

PROBLEM 3: Currency Translation
  Sub's revenue is €10M. At what rate?
  - Income statement: average rate for the period
  - Balance sheet: closing rate at period end
  - Equity: historical rate at transaction date
  Using the wrong rate creates material misstatement.

PROBLEM 4: Minority Interest
  Parent owns 80% of Sub. Sub earned $1M.
  Only $800K belongs to the parent. The other $200K
  is minority interest — it goes below net income on
  the P&L and in equity on the balance sheet.

PROBLEM 5: Goodwill & Purchase Price Allocation
  Parent paid $10M for Sub worth $7M on paper.
  The $3M difference is goodwill. Under ASC 350,
  goodwill is NOT amortized but must be tested for
  impairment annually. The engine must track it.
```

### 1.3 Consolidation Workflow (Step-by-Step)

```
STEP 1: Import Entity Data
  ┌─────────────────────────────────────────┐
  │ Parent Entity (USD)  → GL Entries       │
  │ Subsidiary A (USD)   → GL Entries       │
  │ Subsidiary B (EUR)   → GL Entries       │
  │ Subsidiary C (GBP)   → GL Entries       │
  └─────────────────────────────────────────┘

STEP 2: Translate Foreign Subsidiaries (ASC 830)
  ┌─────────────────────────────────────────┐
  │ Subsidiary B (EUR → USD)                │
  │   Assets/Liabilities: closing rate      │
  │   Revenue/Expenses: average rate        │
  │   Equity: historical rate               │
  │                                         │
  │ Subsidiary C (GBP → USD)                │
  │   Same rules apply                      │
  └─────────────────────────────────────────┘

STEP 3: Combine All Entries
  ┌─────────────────────────────────────────┐
  │ All entries from all entities combined  │
  │ into a single list for processing       │
  └─────────────────────────────────────────┘

STEP 4: Eliminate Intercompany Transactions
  ┌─────────────────────────────────────────┐
  │ Manual IC Pairs: User-specified matches │
  │ Auto-detect IC: Accounts with prefix 9  │
  │                                         │
  │ For each IC pair:                       │
  │   - Find matching amounts               │
  │   - Create elimination entry            │
  │   - Ensure eliminations net to zero     │
  └─────────────────────────────────────────┘

STEP 5: Calculate Minority Interest
  ┌─────────────────────────────────────────┐
  │ For each subsidiary (full method only): │
  │   minorityPct = 100 - ownershipPct      │
  │   minorityNI = minorityPct × netIncome  │
  │   minorityDiv = minorityPct × dividends │
  │   endingBal = beginning + NI - divs     │
  └─────────────────────────────────────────┘

STEP 6: Calculate Goodwill (ASC 805)
  ┌─────────────────────────────────────────┐
  │ goodwill = acquisitionCost              │
  │          - bookValue × ownershipPct     │
  │          - fairValueAdjustments         │
  │                                         │
  │ Track: acquisition cost, book value,    │
  │ fair value adjustments, minority at     │
  │ acquisition, amortization schedule      │
  └─────────────────────────────────────────┘

STEP 7: Process VIE Consolidation (ASC 810-10)
  ┌─────────────────────────────────────────┐
  │ Variable Interest Entities:             │
  │   - Primary beneficiary consolidates    │
  │   - Ownership % may not apply           │
  │   - Eliminate investment in VIE         │
  └─────────────────────────────────────────┘

STEP 8: Build Consolidation Adjustments
  ┌─────────────────────────────────────────┐
  │ Combine:                                │
  │   - User-specified adjustments          │
  │   - Goodwill adjustments                │
  │   - Fair value adjustments              │
  │   - Push-down accounting (if applicable)│
  └─────────────────────────────────────────┘

STEP 9: Apply Eliminations & Adjustments
  ┌─────────────────────────────────────────┐
  │ For each entry:                         │
  │   newAmount = original + adjustments    │
  │                                         │
  │ For adjustment-only entries (goodwill): │
  │   Create new GL entries                 │
  └─────────────────────────────────────────┘

STEP 10: Verify Balance
  ┌─────────────────────────────────────────┐
  │ Check: Assets + Liabilities + Equity    │
  │        + Minority Interest = 0          │
  │                                         │
  │ Tolerance: < $0.01 (rounding)           │
  │ If imbalanced → ERROR, do not proceed   │
  └─────────────────────────────────────────┘

STEP 11: Build Worksheet
  ┌─────────────────────────────────────────┐
  │ Full transparency document:             │
  │   - Parent entries                      │
  │   - Subsidiary entries                  │
  │   - Combined entries                    │
  │   - Eliminations                        │
  │   - Adjustments                         │
  │   - Consolidated entries                │
  │   - Minority interest details           │
  │   - Balance check                       │
  └─────────────────────────────────────────┘
```

---

## 2. ENTITY HIERARCHY

### 2.1 Structure

```
                    ┌──────────────┐
                    │   Parent Co  │
                    │   (USD)      │
                    └──────┬───────┘
                           │
            ┌──────────────┼──────────────┐
            │              │              │
     ┌──────┴──────┐ ┌────┴─────┐ ┌──────┴──────┐
     │  Sub A (USD)│ │Sub B (EUR)│ │ Sub C (GBP) │
     │  100% owned │ │ 80% owned │ │ 60% owned   │
     └─────────────┘ └──────────┘ └─────────────┘
```

### 2.2 Ownership Data Model

```typescript
interface OwnershipStructure {
  parentId: string;         // "parent"
  childId: string;          // "sub-a"
  ownershipPct: number;     // 80 (percentage, 0-100)
  method: ConsolidationMethod; // 'full' | 'equity' | 'cost'
  acquisitionDate?: string; // "2023-01-15"
  acquisitionCost?: number; // 10000000
  bookValueAtAcquisition?: number; // 7000000
}
```

### 2.3 Consolidation Methods

```
FULL CONSOLIDATION (ownership > 50%):
  - All subsidiary assets, liabilities, revenue, expenses included
  - Minority interest calculated for non-owned portion
  - Used when: parent controls the subsidiary

EQUITY METHOD (20-50% ownership):
  - Parent records share of subsidiary's net income as single line
  - No elimination of individual line items
  - Used when: parent has significant influence but not control

COST METHOD (< 20% ownership):
  - Investment recorded at cost
  - Dividends recognized as income
  - No consolidation adjustments
  - Used when: parent has no significant influence
```

### 2.4 Multi-Level Hierarchy

```
Grandparent (100%)
  └── Parent (80%)
        ├── Sub A (100%)
        └── Sub B (60%)

Effective ownership of Sub B by Grandparent:
  Grandparent owns 80% of Parent
  Parent owns 60% of Sub B
  Effective: 80% × 60% = 48%

This means Grandparent should use EQUITY method for Sub B
(not full consolidation, since effective ownership is < 50%).
```

---

## 3. INTERCOMPANY TRANSACTIONS

### 3.1 What Are Intercompany Transactions

When one entity in the group transacts with another entity in the
same group, those transactions must be eliminated in consolidation.
Otherwise, the consolidated statements overstate both revenue and
expenses (or assets and liabilities).

### 3.2 IC Transaction Types

```typescript
type ICPairType =
  | 'receivable'   // Entity A owes money to Entity B
  | 'payable'      // Entity B owes money to Entity A
  | 'revenue'      // Entity A sold goods/services to Entity B
  | 'expense'      // Entity B purchased from Entity A
  | 'investment'   // Entity A invested in Entity B
  | 'dividend'     // Entity B paid dividends to Entity A
  | 'loan';        // Entity A lent money to Entity B
```

### 3.3 IC Identification

The engine identifies IC transactions two ways:

```
METHOD 1: Manual IC Pairs (user-specified)
  The user explicitly marks transactions as intercompany.
  This is the most accurate method.

  Example:
    ICPair {
      fromEntityId: "parent"
      toEntityId: "sub-a"
      accountCode: "4100"
      amount: 1000000
      type: "revenue"
    }

METHOD 2: Auto-Detection (account prefix '9')
  Any GL entry with an account code starting with '9' is
  automatically treated as intercompany. The engine groups
  these by account code and eliminates across entities.

  Example:
    Account 9100: "Intercompany Revenue"
    Account 9200: "Intercompany COGS"
    Account 9300: "Intercompany Receivable"
    Account 9400: "Intercompany Payable"
```

### 3.4 IC Matching Logic

```
For each IC account:
  1. Group entries by entityId
  2. Sum balances per entity
  3. For each entity pair (i, j):
     - matchedAmount = min(|balance_i|, |balance_j|)
     - Create elimination for matchedAmount
  4. Unmatched amounts remain (flag for review)
```

### 3.5 Unmatched IC Handling

```
SCENARIO: Parent says Sub owes $500K. Sub says $480K.

RESULT:
  $480K is eliminated (matched amount)
  $20K remains as unmatched

ACTION REQUIRED:
  - Flag as IC difference
  - Require user explanation before finalizing
  - Common causes: timing, FX, errors
  - NEVER auto-eliminate unmatched amounts
```

---

## 4. INTERCOMPANY ELIMINATIONS

### 4.1 Elimination Entry Structure

```typescript
interface EliminationEntry {
  fromEntityId: string;      // "parent"
  toEntityId: string;        // "sub-a"
  accountCode: string;       // "4100"
  accountName: string;       // "IC Revenue"
  eliminatedAmount: number;  // -1000000 (negative = credit)
  debitAmount: number;       // 0
  creditAmount: number;      // 1000000
  description: string;       // "Elimination of IC revenue"
  type: EliminationEntryType;
}
```

### 4.2 Full Elimination (100% Ownership)

```
Parent sold $1M goods to Sub (100% owned):

ELIMINATION:
  Debit:  IC Revenue (Parent)     $1,000,000
  Credit: IC COGS (Sub)           $1,000,000

RESULT:
  Consolidated revenue decreases by $1M
  Consolidated expenses decrease by $1M
  Net income unchanged (correct)
```

### 4.3 Partial Elimination (Partial Ownership)

```
Parent sold $1M goods to Sub (80% owned):

ELIMINATION:
  Same as full — eliminate the FULL $1M
  Minority interest will account for the 20%

NOTE: IC eliminations are ALWAYS 100% regardless of
ownership percentage. The ownership % affects minority
interest calculation, not elimination amount.
```

### 4.4 Elimination of Unrealized Profit in Inventory

```
SCENARIO:
  Parent sold inventory to Sub for $1M (cost: $700K)
  Parent's profit: $300K
  Sub still holds the inventory at period end

PROBLEM:
  The $300K profit is unrealized — it hasn't been sold
  to an external party yet. It must be eliminated.

ELIMINATION:
  Debit:  Revenue (Parent)        $1,000,000
  Credit: Inventory (Sub)         $300,000
  Credit: COGS (Parent)           $700,000

RESULT:
  Inventory on consolidated BS = $700K (original cost)
  No unrealized profit in consolidated P&L
```

### 4.5 Elimination of Unrealized Profit in Fixed Assets

```
SCENARIO:
  Parent sold a building to Sub for $2M (book value: $1.5M)
  Parent's gain: $500K
  Sub will depreciate over 20 years

PROBLEM:
  The $500K gain is unrealized. Sub's depreciation will be
  based on $2M instead of $1.5M, overstating depreciation.

ELIMINATION:
  1. Eliminate the $500K gain
  2. Adjust depreciation for the $500K overstatement
     Annual adjustment: $500K / 20 years = $25K/year
```

### 4.6 Netting Rule

```
ALL eliminations must net to zero.

Verification:
  Sum of all debit elimination amounts
  = Sum of all credit elimination amounts

If not zero → ERROR in elimination logic.
This is a HARD CONSTRAINT that the engine enforces.
```

---

## 5. CURRENCY TRANSLATION

### 5.1 Functional vs. Reporting Currency

```
FUNCTIONAL CURRENCY:
  The currency of the primary economic environment
  in which the entity operates.

  Example: A UK subsidiary operating primarily in the UK
  has GBP as its functional currency.

REPORTING CURRENCY:
  The currency in which the consolidated financial
  statements are presented.

  Example: A US parent reports consolidated statements in USD.
```

### 5.2 Translation Methods (ASC 830)

```
CLOSING RATE METHOD (Balance Sheet):
  Assets and liabilities are translated at the
  exchange rate at the balance sheet date.

  Example: UK Sub has £100K in cash.
  Closing rate: 1 GBP = 1.25 USD
  Translated: £100K × 1.25 = $125K

AVERAGE RATE METHOD (Income Statement):
  Revenue and expenses are translated at the
  weighted average exchange rate for the period.

  Example: UK Sub earned £500K revenue.
  Average rate: 1 GBP = 1.22 USD
  Translated: £500K × 1.22 = $610K

HISTORICAL RATE METHOD (Equity):
  Equity items (capital, retained earnings) are
  translated at the historical rate when the
  transaction occurred.

  Example: UK Sub was capitalized at £1M.
  Historical rate: 1 GBP = 1.30 USD
  Translated: £1M × 1.30 = $1.3M (fixed)
```

### 5.3 FX Rate Data Model

```typescript
interface FXRate {
  fromCurrency: string;  // "GBP"
  toCurrency: string;    // "USD"
  rate: number;          // 1.25
  rateType: 'spot' | 'average' | 'historical';
  date: string;          // "2026-03-31"
}
```

### 5.4 CTA (Cumulative Translation Adjustment)

```
When assets are translated at closing rate and equity at
historical rate, the difference creates a CTA.

CTA = Translated Assets - Translated Liabilities
     - Translated Equity (historical)

CTA appears in Other Comprehensive Income (OCI) on the
consolidated income statement. It is NOT included in
net income — it goes directly to equity.

Example:
  Translated assets: $500K
  Translated liabilities: $300K
  Translated equity (historical): $180K
  CTA = $500K - $300K - $180K = $20K (in OCI)
```

### 5.5 Translation Engine Flow

```
INPUT: Entity with EUR entries + FX rates

FOR EACH entry:
  1. Determine account category (asset/liability/revenue/expense/equity)
  2. Select appropriate rate:
     - asset/liability → closingRate
     - revenue/expense → averageRate
     - equity → historicalRate
  3. Translate: newAmount = originalAmount × rate
  4. Set currency to reporting currency (USD)

OUTPUT: Translated entity with USD entries
```

---

## 6. MINORITY INTEREST

### 6.1 What Is Minority Interest

When a parent owns less than 100% of a subsidiary, the portion
owned by outside investors is called "minority interest" or
"non-controlling interest" (NCI).

### 6.2 Calculation

```typescript
// From ConsolidationEngine.ts:
const minorityPct = 100 - ownershipPct;

// Net income allocation:
const minorityNI = (minorityPct / 100) * netIncome;

// Dividends reduce minority interest:
const minorityDiv = (minorityPct / 100) * dividends;

// Ending balance:
const endingBalance = beginningBalance + minorityNI - minorityDiv;
```

### 6.3 Example

```
Parent owns 80% of Sub. Sub earned $1M, paid $100K dividends.

MINORITY INTEREST CALCULATION:
  Minority %: 100% - 80% = 20%
  Minority share of net income: 20% × $1M = $200K
  Minority share of dividends: 20% × $100K = $20K
  Minority interest increase: $200K - $20K = $180K

CONSOLIDATED P&L:
  Net income attributable to parent: $800K
  Net income attributable to minority: $200K
  Total consolidated net income: $1M

CONSOLIDATED BALANCE SHEET:
  Minority interest in equity section: $180K (beginning + $180K)
```

### 6.4 Where Minority Interest Appears

```
INCOME STATEMENT (below net income):
  Net Income                    $1,000,000
  Less: Minority Interest       ($200,000)
  Net Income to Parent           $800,000

BALANCE SHEET (in equity section):
  Total Equity (parent)         $5,000,000
  Minority Interest               $180,000
  Total Equity                  $5,180,000
```

---

## 7. CONSOLIDATION JOURNAL ENTRIES

### 7.1 Standard Elimination Entries

```
IC Revenue Elimination:
  DR: IC Revenue (Parent)           $1,000,000
  CR: IC COGS (Sub)                 $1,000,000

IC Receivable/Payable Elimination:
  DR: IC Payable (Sub)                $500,000
  CR: IC Receivable (Parent)          $500,000

IC Loan Elimination:
  DR: IC Loan Payable (Sub)           $200,000
  CR: IC Loan Receivable (Parent)     $200,000
```

### 7.2 Investment Elimination Entries

```
Elimination of Investment in Subsidiary:
  DR: Common Stock (Sub)            $1,000,000
  DR: Retained Earnings (Sub)       $2,000,000
  CR: Investment in Sub (Parent)    $3,000,000

If purchase price > book value (goodwill):
  DR: Common Stock (Sub)            $1,000,000
  DR: Retained Earnings (Sub)       $2,000,000
  DR: Goodwill                      $1,000,000
  CR: Investment in Sub (Parent)    $4,000,000
```

### 7.3 Translation Adjustment Entries

```
CTA Entry (when assets > translated equity):
  DR: Assets (various)                $20,000
  CR: CTA - OCI                       $20,000
```

### 7.4 Minority Interest Entries

```
Record minority share of net income:
  DR: Net Income (consolidated)       $200,000
  CR: Minority Interest (equity)      $200,000

Record minority share of dividends:
  DR: Minority Interest (equity)       $20,000
  CR: Dividends (consolidated)         $20,000
```

### 7.5 Full Example: 3-Entity Consolidation

```
ENTITIES:
  Parent (USD) — owns 100% of Sub A, 80% of Sub B
  Sub A (USD) — 100% owned
  Sub B (EUR) — 80% owned

TRANSACTIONS:
  Parent sold $500K goods to Sub A (IC revenue)
  Sub A owes Parent $200K (IC receivable)
  Sub B earned €1M (translated at average rate 1.20)

CONSOLIDATION ENTRIES:

  1. Eliminate IC revenue (Parent → Sub A):
     DR: IC Revenue (Parent)    $500,000
     CR: IC COGS (Sub A)        $500,000

  2. Eliminate IC receivable (Parent ← Sub A):
     DR: IC Payable (Sub A)     $200,000
     CR: IC Receivable (Parent)  $200,000

  3. Translate Sub B revenue:
     €1,000,000 × 1.20 = $1,200,000

  4. Record minority interest (Sub B):
     Minority %: 100% - 80% = 20%
     Sub B net income (translated): $1,200,000
     Minority share: 20% × $1,200,000 = $240,000
     DR: Net Income              $240,000
     CR: Minority Interest       $240,000

  5. Verify balance:
     Assets + Liabilities + Equity + Minority Interest = 0
     ✅ Balanced
```

---

## 8. GAAP vs. IFRS DIFFERENCES

### 8.1 ASC 810 (US GAAP) vs. IFRS 10

```
CONTROL MODEL:
  GAAP: Voting rights model + VIE model
  IFRS: Single control model (power + variable returns)

VARIABLE INTEREST ENTITIES:
  GAAP: Special rules for VIEs (ASC 810-10)
  IFRS: No separate VIE concept — all under IFRS 10

CONSOLIDATION THRESHOLD:
  GAAP: > 50% voting interest OR primary beneficiary of VIE
  IFRS: Control (which may exist at < 50% in some cases)

PRESENTATION:
  GAAP: Minority interest below net income, in equity on BS
  IFRS: NCI in equity, separate line on P&L

GOODWILL:
  GAAP: Not amortized, test for impairment (ASC 350)
  IFRS: Not amortized, test for impairment (IAS 36)
  Same treatment, different impairment models.
```

### 8.2 VIE Rules (GAAP Only)

```
A VIE is an entity where:
  - Equity investors lack controlling financial interest, OR
  - Equity is insufficient to finance operations, OR
  - Decision-making is not proportional to ownership

PRIMARY BENEFICIARY:
  The entity that has:
  - Power to direct activities that significantly impact economics
  - Obligation to absorb losses or right to receive returns

ENGINE HANDLING:
  ConsolidationEngine.processVIEConsolidation()
  - Checks vieNotifications for isPrimaryBeneficiary
  - If primary beneficiary: consolidate VIE 100%
  - Eliminate investment in VIE
  - Ownership percentage may not apply
```

---

## 9. STEP-BY-STEP CONSOLIDATION WORKFLOW

### 9.1 User Workflow (5 Entities)

```
STEP 1: Import Entity Data
  ┌─────────────────────────────────────────┐
  │ [Import Wizard]                         │
  │ Upload Excel/CSV for each entity:       │
  │   - Entity 1: Parent Corp (USD)         │
  │   - Entity 2: Sub A (USD)              │
  │   - Entity 3: Sub B (EUR)              │
  │   - Entity 4: Sub C (GBP)              │
  │   - Entity 5: Sub D (USD)              │
  └─────────────────────────────────────────┘

STEP 2: Define Ownership Structure
  ┌─────────────────────────────────────────┐
  │ [Ownership Editor]                      │
  │ Parent → Sub A: 100%, full              │
  │ Parent → Sub B: 80%, full               │
  │ Parent → Sub C: 60%, full               │
  │ Parent → Sub D: 30%, equity             │
  └─────────────────────────────────────────┘

STEP 3: Configure FX Rates
  ┌─────────────────────────────────────────┐
  │ [FX Rate Manager]                       │
  │ EUR/USD: spot=1.08, avg=1.06, hist=1.12│
  │ GBP/USD: spot=1.27, avg=1.25, hist=1.30│
  └─────────────────────────────────────────┘

STEP 4: Identify IC Transactions
  ┌─────────────────────────────────────────┐
  │ [IC Transaction Finder]                 │
  │ Auto-detected IC accounts (prefix '9'): │
  │   9100: IC Revenue — 12 transactions    │
  │   9200: IC COGS — 12 transactions       │
  │   9300: IC Receivable — 5 transactions  │
  │   9400: IC Payable — 5 transactions     │
  │                                         │
  │ Manual IC pairs to add:                 │
  │   [Add IC Pair]                         │
  └─────────────────────────────────────────┘

STEP 5: Review Eliminations
  ┌─────────────────────────────────────────┐
  │ [Elimination Preview]                   │
  │ Total eliminations: 34 entries          │
  │ Eliminated amount: $4,200,000           │
  │ Net of eliminations: $0.00 ✅           │
  │                                         │
  │ ⚠ 2 unmatched IC pairs flagged          │
  │ [Review Unmatched]                      │
  └─────────────────────────────────────────┘

STEP 6: Generate Consolidation
  ┌─────────────────────────────────────────┐
  │ [Consolidation Running...]              │
  │ Translating Sub B (EUR → USD)... ✅     │
  │ Translating Sub C (GBP → USD)... ✅     │
  │ Eliminating IC transactions... ✅       │
  │ Calculating minority interest... ✅     │
  │ Calculating goodwill... ✅              │
  │ Building consolidated entries... ✅     │
  │ Verifying balance... ✅ BALANCED        │
  └─────────────────────────────────────────┘

STEP 7: Review Consolidated Statements
  ┌─────────────────────────────────────────┐
  │ [Consolidated View]                     │
  │ P&L: Revenue $50M, Net Income $8M       │
  │ BS: Assets $120M, Equity $45M           │
  │ Minority Interest: $1.2M                │
  │ Goodwill: $3M                           │
  │                                         │
  │ [Export to PDF] [Export to Excel]        │
  └─────────────────────────────────────────┘
```

---

## 10. EDGE CASES & ERROR HANDLING

### 10.1 Circular Ownership

```
SCENARIO:
  Entity A owns 60% of Entity B
  Entity B owns 40% of Entity C
  Entity C owns 20% of Entity A

PROBLEM:
  Circular ownership creates a recursive calculation.
  A's value depends on B, which depends on C, which
  depends on A.

HANDLING:
  The engine does NOT support circular ownership.
  If detected, throw an error:
  "Circular ownership detected: A → B → C → A"
  User must restructure ownership before consolidating.
```

### 10.2 Negative Equity in Subsidiary

```
SCENARIO:
  Sub has accumulated losses exceeding its equity.
  Sub's equity is -$500K.

PROBLEM:
  Minority interest calculation with negative equity.
  Should minority interest be negative?

HANDLING:
  Under ASC 810, if the minority interest balance
  goes negative, the parent absorbs the losses
  (once the minority's interest is zero).

  The engine caps minority interest at zero:
  if (endingBalance < 0) endingBalance = 0;
```

### 10.3 Mid-Year Acquisition/Disposal

```
SCENARIO:
  Parent acquired Sub B on July 1. Fiscal year ends Dec 31.
  Sub B's full-year revenue is $12M.

PROBLEM:
  Only 6 months of Sub B's results should be consolidated.

HANDLING:
  The engine does NOT currently support partial periods.
  User must provide only the relevant period's data
  (July 1 - Dec 31 entries for Sub B).
```

### 10.4 Different Fiscal Year Ends

```
SCENARIO:
  Parent: fiscal year ends Dec 31
  Sub A: fiscal year ends Mar 31

PROBLEM:
  Sub A's year-end is 3 months after Parent's.

HANDLING:
  Under GAAP, Sub's financials must be as of the
  same date or no more than 93 days different.
  If > 93 days, user must provide adjusted data.
```

### 10.5 Intercompany Loans in Foreign Currency

```
SCENARIO:
  Parent (USD) lent €1M to Sub (EUR).
  Exchange rate at loan date: 1.10
  Exchange rate at period end: 1.08

PROBLEM:
  The loan amount in USD changes due to FX movement.
  Parent's receivable: €1M × 1.08 = $1.08M
  Sub's payable: €1M (unchanged in EUR)

HANDLING:
  1. Translate Sub's payable at closing rate: €1M × 1.08 = $1.08M
  2. Eliminate: $1.08M receivable vs $1.08M payable → $0
  3. FX gain/loss recognized in OCI (CTA)
```

---

## 11. VALIDATION RULES

### 11.1 Engine Validation

```typescript
// ConsolidationEngine.validate() checks:

// 1. Balance check
if (!result.isBalanced) {
  errors.push(`Imbalance: ${result.imbalanceAmount.toFixed(2)}`);
}

// 2. Elimination completeness
for (const elimination of result.eliminations) {
  if (elimination.debitAmount > 0 && elimination.creditAmount > 0) {
    errors.push('Elimination has both debit and credit');
  }
}

// 3. Minority interest validity
for (const mi of result.minorityInterestDetails) {
  if (mi.minorityPct < 0 || mi.minorityPct > 100) {
    errors.push('Invalid minority percentage');
  }
  if (mi.ownershipPct < 100 && mi.endingBalance === 0) {
    errors.push('Minority interest is zero despite partial ownership');
  }
}
```

### 11.2 Pre-Consolidation Checks

```
BEFORE running consolidation, verify:

□ All entities have entries
□ All entities have valid currency codes (3-letter ISO)
□ Ownership percentages are 0-100
□ No circular ownership
□ FX rates provided for all foreign currencies
□ IC pairs have valid entity IDs
□ Account codes follow standard chart of accounts
```

### 11.3 Post-Consolidation Checks

```
AFTER consolidation, verify:

□ Balance: Assets + Liabilities + Equity + MI = 0 (±$0.01)
□ Eliminations net to zero
□ Minority interest is non-negative
□ Goodwill is non-negative
□ All foreign entities are translated
□ Worksheet matches consolidated entries
□ Net income = Revenue + Expenses (expenses negative)
```

---

## 12. QUICK REFERENCE

### 12.1 Engine API

```typescript
// Main consolidation
ConsolidationEngine.consolidate(
  entities: EntityData[],
  ownerships: OwnershipStructure[],
  icPairs: ICPair[],
  fxRates: FXRate[],
  adjustments: ConsolidationAdjustment[],
  vieNotifications: VIENotification[]
): ConsolidatedResult

// Utility functions
ConsolidationEngine.eliminateIntercompany(entries, icPairs, ownerships, entityMap)
ConsolidationEngine.calculateMinorityInterestDetails(subsidiaries, ownerships, entityMap)
ConsolidationEngine.calculateMinorityInterest(netIncome, ownershipPct)
ConsolidationEngine.calculateGoodwill(ownerships, entityMap)
ConsolidationEngine.processVIEConsolidation(entities, ownerships, vieNotifications, entityMap)
ConsolidationEngine.translateForeignSubsidiaries(entities, fxRates)
ConsolidationEngine.getICBalance(entries, fromEntityId, toEntityId, accountCode)
ConsolidationEngine.validate(result)
```

### 12.2 Account Category Mapping

```
Prefix 1: Asset
Prefix 2: Liability
Prefix 3: Equity
Prefix 4: Revenue
Prefix 5: Expense
Prefix 6: Expense
Prefix 7: Expense
Prefix 8: Revenue
Prefix 9: Revenue (also IC auto-detect)
```

### 12.3 Currency Translation Rules

```
Account Type     │ Rate Type
─────────────────┼──────────────
Asset            │ Closing rate
Liability        │ Closing rate
Revenue          │ Average rate
Expense          │ Average rate
Equity           │ Historical rate
```

---

*Version 5.0.0 | FinPlan Pro AI Fleet System Prompt*
*Consolidation Engine — ASC 810 Compliant | 973 lines of code*
