# D365 General Ledger Export — Mapping Contract (research basis)

**Status:** research basis for the parser contract. **Not** verified D365 support.
**Owner directive:** 2026-10-16 — "we can acquire D365 format from internet" (DEC-013).
**Prepared by:** squad lead, 2026-10-16. Consumed by G-02 (GL Ingestion Dev).

> **What this document is.** A cited summary of how Microsoft documents D365 Finance GL
> exports, turned into the mapping rules our importer must implement. It is the *expected*
> contract. The acceptance bar in `DEC-001` is unchanged: a real anonymized export must
> validate it before any claim of "verified D365 support" appears in the product or docs.

## 1. There is no single "D365 GL CSV"

Microsoft documents several different outputs. They have different headers, different
debit/credit encodings and different row semantics. The parser must therefore be
**mapping-driven**, never a fixed-column reader.

| Export path | What it is | Debit/Credit shape | Use for our slice |
| --- | --- | --- | --- |
| **General ledger statement by main account** (Electronic Reporting, Excel) | Posted-transaction detail; closest documented analogue of a monthly GL dump | **Separate** `Debit`/`Credit` columns (both transaction and accounting currency) | **Primary target** |
| **General journal entity** (Data management) | Journal **create/update/import** schema, not a posted-ledger export | Separate `DEBITAMOUNT`/`CREDITAMOUNT` in its example | Reference only |
| **Trial balance** (list page / `LedgerTrialBalanceFiscalYearSnapshotDataEntity`) | **Balance snapshot** for a financial dimension set | Balance columns (opening/closing), not transactions | Not a GL dump |
| **Country-specific formats** (e.g. Belgium "Export ledger transactions" ASCII) | Account balances, four columns | Balance columns | Out of scope |

Sources: [GL statement by main account](https://learn.microsoft.com/en-us/dynamics365/finance/general-ledger/general-ledger-statement-by-main-account) ·
[General journal entity](https://learn.microsoft.com/en-us/dynamics365/fin-ops-core/dev-itpro/data-entities/entity-general-journal) ·
[General ledger account balances](https://learn.microsoft.com/en-us/dynamics365/finance/general-ledger/general-ledger-account-balances) ·
[Export ledger transactions (Belgium)](https://learn.microsoft.com/en-us/dynamics365/finance/localizations/belgium/emea-bel-export-ledger-transactions)

## 2. Documented columns of the primary target

`General ledger statement by main account`, transaction detail (grouping cleared), in
documented order:

```text
Transaction posting date        → GeneralJournalEntry.AccountingDate
Transaction number              → GeneralJournalEntry.SubledgerVoucher   (the VOUCHER, not JournalNumber)
Main account                    → GeneralJournalAccountEntry.MainAccount
Main account name
Counterparty number             (customer/vendor, when applicable)
Counterparty name
Ledger account                  → GeneralJournalAccountEntry.LedgerAccount (account string INCLUDING dimensions)
Description                     → GeneralJournalAccountEntry.Text
Transaction currency            → GeneralJournalAccountEntry.TransactionCurrencyCode
Debit in transaction currency   → TransactionCurrencyAmount where IsCredit = false
Credit in transaction currency  → TransactionCurrencyAmount where IsCredit = true
Debit                           → AccountingCurrencyAmount or ReportingCurrencyAmount where IsCredit = false
Credit                          → AccountingCurrencyAmount or ReportingCurrencyAmount where IsCredit = true
Accumulated balance             (calculated)
Sales tax code / Sales tax amount  (only when the tax spec is included)
```

Source fields behind those columns:
[GeneralJournalAccountEntry](https://learn.microsoft.com/en-us/common-data-model/schema/core/operationscommon/tables/finance/ledger/transactionline/generaljournalaccountentry) ·
[GeneralJournalEntry](https://learn.microsoft.com/en-us/common-data-model/schema/core/operationscommon/tables/finance/ledger/transactionheader/generaljournalentry)
(`JournalNumber`, `JournalCategory`, `DocumentDate`, `DocumentNumber`, `PostingLayer`, `Ledger`
exist on the header but are **not** in the published report columns — request them explicitly).

**Traps in this report:** it can emit opening-balance and account-group **total rows** as well
as transactions; `Group by main account` hides `Ledger account` and aggregates rows; its date
range must stay within one fiscal year; the displayed language follows the user's preference.

## 3. Mapping contract for our importer (FR-001 → FR-005)

| Our field | Accepted source column(s) | Rule |
| --- | --- | --- |
| `accountCode` | `Main account`, or the main-account segment of `Ledger account` | Required. Missing/blank → reject with row + code + reason (FR-002). |
| `postDate` | `Transaction posting date` / `AccountingDate` / `TRANSDATE` | Required; ISO `YYYY-MM-DD` and `dd-MMM-yyyy` (e.g. `11-Nov-2023`) must both parse; anything else rejects with the offending text. |
| `debit` / `credit` | Either separate `Debit`/`Credit` columns, or one amount column + `IsCredit` | Exactly one encoding per file; detect it from the header, never guess per row. Never accept both encodings silently. |
| `currency` | `Transaction currency` / `CURRENCYCODE` | If absent → **unavailable**, never a default (FR-001). |
| `description` | `Description` / `TEXT` / `DESCRIPTION` | Optional. |
| `reference` | `Transaction number` (voucher) / `VOUCHER`; `JournalNumber` when the export provides it | Optional; keep voucher and journal number distinct when both exist. |
| entity / company | Company column when the export carries one | If absent → **unavailable** (FR-001); never inferred from the account string. |
| dimension detail | `Ledger account`, or separate dimension columns (`Account.BusinessUnit`, …) | Either layout is legal. Keep the combined string as the account identity; do not silently split dimensions without a mapping for each. |

## 4. Parser behaviours that are non-negotiable

1. **Header detection, not assumption.** Data-management exports can be configured **without**
   headers; report workbooks can carry several header rows. Detect or require a mapping; a
   headerless file must be mapped by the user, not guessed.
2. **Delimiter, qualifier, encoding are configuration.** DMF allows configuring row/column
   delimiters and text qualifiers; UTF-8 with or without BOM occurs. A `split(',')` parser is
   unsafe. Never assume BOM presence or absence — inspect and handle both.
3. **Numbers are locale- and path-dependent.** Thousands separators and decimal comma must be
   handled explicitly, and a value that cannot be parsed exactly rejects the row (never a
   silent 0 — FR-006). Amounts stay decimal strings; no float math.
4. **Non-transaction rows are refused, not skipped.** Opening-balance rows, group headings,
   calculation rows and totals must be rejected with a code and a reason so the row count is
   explained (FR-002), or excluded by an explicit, user-visible scope rule.
5. **Debit/credit encoding is per-file and explicit.** Declare which of the two encodings the
   mapping uses; the file's other encoding, if present, is ignored by name, not by position.
6. **Scope stays honest.** Entity/currency/period that the file does not carry are reported as
   unavailable with a reason (FR-001); the importer never invents a company, currency or period.

## 5. What only the owner (or a real sample) can settle

- **Which export path the owner's D365 uses.** The Microsoft ER report, an Excel add-in grid
  export, or a Data-management entity produce different files.
- **Which currency the `Debit`/`Credit` columns carry** (accounting vs reporting vs transaction).
- **Whether the dump carries a company/legal-entity column**, and its exact name.
- **Whether dimensions arrive as one combined `Ledger account` string or as separate columns**,
  and in what order.
- **Real-file hazards** that public documentation does not promise: BOM presence, no-header
  exports, thousands separators, and report-only total rows.

Until a real anonymized sample is validated, this document is the contract and every claim
stays "expected", per `DEC-001` and `DEC-013`.

## Sources

- [General ledger statement by main account](https://learn.microsoft.com/en-us/dynamics365/finance/general-ledger/general-ledger-statement-by-main-account)
- [General journal entity](https://learn.microsoft.com/en-us/dynamics365/fin-ops-core/dev-itpro/data-entities/entity-general-journal)
- [GeneralJournalAccountEntry schema](https://learn.microsoft.com/en-us/common-data-model/schema/core/operationscommon/tables/finance/ledger/transactionline/generaljournalaccountentry)
- [GeneralJournalEntry schema](https://learn.microsoft.com/en-us/common-data-model/schema/core/operationscommon/tables/finance/ledger/transactionheader/generaljournalentry)
- [General ledger account balances (trial balance snapshot)](https://learn.microsoft.com/en-us/dynamics365/finance/general-ledger/general-ledger-account-balances)
- [Data import and export jobs (delimiters, qualifiers, encoding)](https://learn.microsoft.com/en-us/dynamics365/fin-ops-core/fin-ops/data-entities/data-import-export-job)
- [View journal entries and transactions](https://learn.microsoft.com/en-us/dynamics365/finance/general-ledger/view-journal-entries-transactions)
- [Financial dimensions](https://learn.microsoft.com/en-us/dynamics365/finance/general-ledger/financial-dimensions) · [Account structures](https://learn.microsoft.com/en-us/dynamics365/finance/general-ledger/configure-account-structures) · [Financial dimension sets](https://learn.microsoft.com/en-us/dynamics365/finance/general-ledger/financial-dimension-sets)
- [Export ledger transactions (Belgium)](https://learn.microsoft.com/en-us/dynamics365/finance/localizations/belgium/emea-bel-export-ledger-transactions)
