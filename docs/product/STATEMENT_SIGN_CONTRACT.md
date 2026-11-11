# Statement sign & classification contract (Phase 2)

**Status:** implemented and test-pinned, 2026-10-18. This is the one contract
every statement surface follows. Implementation lives in exactly one place:
`src/utils/accountClassification.ts`. Statement builders must not classify
accounts with ad-hoc code checks again.

> **2026-11-11 repository review note:** Re-verified against source and the core of the contract holds. `src/utils/accountClassification.ts`
> is the single resolver, twelve modules import it, the §1 table matches `SignConventionEngine.getNaturalSign` for every `AccountType`
> (`accountClassification.test.ts:82-86` pins the comparison), `signedClassAmount` never absolutises, and the §3 derivation rule is real.
>
> Two places still step outside the contract, both in **export builders**, which §7 claims follow "this same split":
>
> 1. **`buildBudgetVsActualRows` absolutises every account** (`src/engines/reportDataBuilder.ts:275`:
>    `Math.abs(roundTo(subtractMoney(e.debit, e.credit), 2))`) and then applies its own bare prefix test
>    (`const isRevenue = code.startsWith('4')`, line 290) instead of `resolveAccountClass`. That is the F-P2-02 pattern §1 retires,
>    surviving in the Budget-vs-Actual export, and it is the one builder that follows neither §1 nor §2. `SignConventionEngine`'s
>    contra-account list is a third, unconsulted favourability source. The §6 claim is therefore honest about statement builders but
>    not about the BvA export.
> 2. **No export builder discloses unclassified entries.** §2.3 says every statement builder returns `unclassifiedCount` and
>    `unclassifiedMovement`, and the three statement *pages* do display them (`ProfitLossPage.tsx:293-297` and the balance-sheet
>    equivalent). The export builders return only `headers`/`rows`/`footers`, so an account the convention cannot classify vanishes
>    from a downloaded P&L with no zero-line and no note — the same silence §2.3 exists to prevent, and the DEC-017 honesty claim
>    holds on screen but not in the export. §7's "the same split" overstates this.
>
> Also worth noting for anyone reading §1 alone: `resolveAccountClass` promotes an OpEx-typed account to `interest`/`tax` by code prefix
> (lines 84-92), so the seven demo entries (1xxx–6xxx only) never produce interest or tax — net income is unaffected, but the
> contract's four P&L classes are not all exercised by the default fixture.

## 1. Classes and natural signs

| Class          | Natural balance (positive direction) | Source types       |
| -------------- | ------------------------------------ | ------------------ |
| `asset`        | Dr − Cr                              | Asset, CapEx       |
| `liability`    | Cr − Dr                              | Liability          |
| `equity`       | Cr − Dr                              | Equity             |
| `revenue`      | Cr − Dr                              | Revenue            |
| `cogs`         | Dr − Cr                              | COGS               |
| `opex`         | Dr − Cr                              | OpEx               |
| `interest`     | Dr − Cr                              | OpEx with prefix 7 |
| `tax`          | Dr − Cr                              | OpEx with prefix 8 |
| `unclassified` | Dr − Cr (reporting direction only)   | none               |

This table agrees with `SignConventionEngine.getNaturalSign` for every
`AccountType` — pinned by `src/utils/accountClassification.test.ts`, so the
two implementations cannot drift silently. Amounts are exact decimals via
`src/utils/money.ts`, rounded once at emission. **Amounts are never
absolutised:** a credit-heavy expense is a negative expense, a contra posting
reduces the balance it offsets. (The retired P&L behaviour — `Math.abs` per
entry — is F-P2-02.)

## 2. Classification resolution order

For each entry, `resolveAccountClass` applies:

1. **Account-master type wins.** `glStore` is the DEC-012 authoritative
   store; entries are enriched from it (`withAccountTypes`, lookup by
   account id then code). CapEx types present as assets. Interest/tax are
   presentation subclasses: an OpEx-class entry whose code carries prefix
   7/8 presents as interest/tax, so the P&L's net income always articulates
   with the balance sheet's current-period earnings.
2. **Code-prefix convention falls back** (no typed account):
   1 Asset · 2 Liability · 3 Equity · 4 Revenue · 5 COGS · 6 OpEx ·
   7 Interest · 8 Income tax. This is what makes an unmapped file still
   produce statements — labelled by this document as convention, not truth.
3. **`unclassified` is reported, never dropped.** Every statement builder
   returns `unclassifiedCount` and `unclassifiedMovement`, and every
   statement page displays them when non-zero. An unclassified entry is in
   no total, and the page says so (DEC-017 honesty applied to statements).

## 3. The account master at import

Importing a file derives one account per new account code
(`deriveAccountsFromEntries`), typed by the prefix convention — the only
inference available at import time. The owner can correct the type in the
account master; corrections win everywhere because step 1 reads the type
first. Codes no convention classifies get **no** account (inventing a type
would fabricate financial structure); their trial-balance rows read
"Unknown" and statements report them as unclassified. Derived accounts are
master data: undoing an import removes its entries, not the chart of
accounts it introduced.

## 4. Drill-to-source

Every class figure on the P&L and balance sheet carries a Drill action to
`/drill-down?statementClass=<classes>` (comma-separated for composite
figures: total expenses = `opex,interest,tax`; current-period earnings =
`revenue,cogs,opex,interest,tax`). The drill page resolves classes through
this same contract against the same store, so the entries listed are
exactly the entries the figure was summed from. The tie is test-pinned
(`computeProfitLoss — figure → entries trace`).

## 5. Trial-balance basis (honest label, F-P2-04)

Until period-aware balances land (Phase 4), the trial balance aggregates
**all imported entries**: Beginning = position before the earliest imported
entry (zero unless opening balances were imported), Ending = Beginning +
Net Change. The page states this basis on its face. Do not describe it as an
opening-balance trial balance.

## 6. Legacy engine disposition

`src/engines/SignConventionEngine.ts` remains the variance-favourability
implementation (favourable/unfavourable direction per account type) for the
phases that wire BvA. Its hardcoded contra-account **code list** is legacy:
contra behaviour is an account-master property under this contract, the
list must not be extended, and statement builders do not consult it.
Adopt, don't duplicate: any new sign logic goes into
`src/utils/accountClassification.ts` or is deleted in favour of it.

## 7. Cash-flow layout lines (convention, explicitly)

The indirect cash-flow statement's working-capital and financing lines use
a two-digit **layout** convention inside the asset/liability/equity classes
(cash 11, receivables 12, inventory 13, prepaids 14, fixed assets 15,
payables 21, debt 22, dividends 31), and depreciation is matched by entry
description text. These are presentation groupings, not statement classes:
the class-level figures (net income above all) come from §1–§2. A layout
line with no matching accounts reads zero — the same zero as "no movement"
— until account-master cash-flow categories replace the layout convention
(tracked in the master plan as F-P2-06, Phase 9). The report-book export
builders (`src/engines/reportDataBuilder.ts`) follow this same split:
canonical class figures, layout lines by convention.
