# Atlas — Treasury Docs Verification (Round 1 v0.14)

**Author:** Atlas
**Date:** 2026-06-15
**Trigger:** Founder SHIP-COMPLETE ACK requested verification of PART_161-165
**Status:** ✅ ALL 5 PASS — completed in v0.14 round 1

---

## Verification

All 5 treasury docs were authored in **v0.14 round 1** (single dispatch, 12-file batch on 2026-06-15). Each passes the founder's quality bar:

- ≥ 80 lines ✅
- LF Unix (0 CRLF, 0 bare CR) ✅
- Template-compliant (Status / Owner / Cross-refs / Inputs / Summary / Sections / Open Questions / Sign-off) ✅
- sha256 + line count reported ✅
- Cross-referenced to INFRASTRUCTURE_READINESS + other audits ✅

---

## Treasury docs (5/5 PASS)

| #   | File                                | Lines | LF  | sha256 (first 16) | Status  |
| --- | ----------------------------------- | ----- | --- | ----------------- | ------- |
| 1   | PART_161_TREASURY_DEBT_COVENANTS.md | 407   | LF  | 3ffef7594314eb30… | ✅ PASS |
| 2   | PART_162_HEDGING_INSTRUMENTS.md     | 393   | LF  | 36bc451a64a54c2b… | ✅ PASS |
| 3   | PART_163_INVESTMENT_CAP_TABLE.md    | 406   | LF  | b1379da585b0ab13… | ✅ PASS |
| 4   | PART_164_M2M_MARK_TO_MARKET.md      | 301   | LF  | 5122db2bfff92bdf… | ✅ PASS |
| 5   | PART_165_BANK_ACCOUNT_MANAGEMENT.md | 351   | LF  | a946c0673b1d32b6… | ✅ PASS |

**Totals**: 5 files, 1,858 lines, ~131 KB. All LF Unix.

---

## Per-doc substance summary

### PART_161 Treasury Debt & Covenants (407 lines)

- Debt instrument registry (term loan, revolver, bond, lease)
- Amortization engine: level payment / interest-only / bullet / custom
- Interest accrual: simple / continuous / discrete; effective interest method (ASC 835-30)
- Day count conventions: 30/360, Actual/360, Actual/365, Actual/Actual
- Variable rate handling with per-period overrides
- Covenant catalog: 10 built-in templates (Net Leverage, Interest Coverage, DSCR, etc.)
- Custom covenant DSL with Zod-validated formulas
- Compliance dashboard: green/amber/red with cure rights + grace periods
- Debt schedule rollforward with multi-currency revaluation
- Refinancing modeler: side-by-side, NPV, sensitivity ±100bps
- 10 built-in reports (debt summary, maturity profile, interest expense forecast, etc.)
- libsql/SQLite schema with full DDL

### PART_162 Hedging Instruments (393 lines)

- FX forwards (outright, NDF, swap) with forward curve interpolation
- Interest rate swaps (fixed-for-floating, basis, cross-currency) with DCF valuation
- FX options (Black-Scholes / Garman-Kohlhagen) + vol surface interpolation
- IR caps/floors/collars/swaptions (Black's model)
- Commodity hedges (futures, swaps, options) for 11 commodities
- M2M engine with formula versioning + inputs hash for reproducibility
- Hedge accounting: ASC 815 / IFRS 9 (fair value, cash flow, net investment)
- Effectiveness testing: critical terms, dollar offset, regression, hypothetical derivative
- Effectiveness rebalancing + de-designation workflow
- Disclosure pack: ASC 815-10-50 / IFRS 7 in Word template format
- 9 reporting artifacts + counterparty exposure matrix

### PART_163 Investment & Cap Table (406 lines)

- Strategic investment registry: subsidiaries, JVs, associates (ASC 323)
- Equity method accounting rollforward (investments, share of NI, dividends, CTA, OCI, impairment)
- Intercompany profit elimination (downstream + upstream)
- Marketable securities: equity, debt, ETF, mutual fund, derivative, MM
- M2M classification: trading (P&L), AFS (OCI), HTM (amortized), equity method, cost method
- Fair value hierarchy (ASC 820 / IFRS 13) Level 1/2/3 disclosure
- Private fund interests: PE/VC/hedge with commitment, called %, NAV, DPI, TVPI, IRR, MOIC
- Full cap table: common, preferred A/B/C/..., options, warrants, SAFEs, convertibles
- Cap table math: basic, fully diluted, pre/post-money, dilution
- Exit waterfall: LP, participation cap, pari passu vs sequential, common proceeds
- Multi-currency translation + CTA
- Intercompany investment elimination (consolidation integration)

### PART_164 M2M Framework (301 lines)

- One unified M2M engine across debt / hedge / security / fund / cash
- Inputs: market data snapshots (immutable, per-as-of-date)
- Source: manual / CSV / copy-forward / API (v1.1)
- Valuation methods by hierarchy: Level 1 (quoted), Level 2 (observable), Level 3 (unobservable)
- Output classification: P&L (trading, hedge ineffective, FV hedge), OCI (AFS, CF hedge, NI hedge, CTA), BS-direct (HTM, equity, cost, consolidation)
- Reconciliation: monthly M2M-to-GL tie-out with $1 or 0.01% tolerance
- Auto-generated disclosure packs (ASC 820, 815-10-50, 321, 323, IFRS 9, 13, 7)
- Web Worker architecture (offload heavy M2M from main thread)
- Performance: P95 < 30s for 1,000-instrument portfolio
- Edge cases: defaulted credit, pledged securities, day count, holiday calendars, late data

### PART_165 Bank Account Management (351 lines)

- Bank account registry: name, masked number, routing, SWIFT, currency, type, owner entity
- Account types: operating, payroll, tax, escrow, money market, term deposit, investment, restricted
- Balance tracking: opening + inflows - outflows ± FX reval = closing
- Multi-currency with FX revaluation (ASC 830)
- Cash positioning dashboard: entity view, currency view, type view, restricted view
- Cash forecast: 13-week (weekly), 12-month (monthly), 3/5-year (quarterly/annual)
- Forecast confidence: committed / probable / possible
- Intercompany cash transfers: loan / equity / dividend / mgmt fee / cost share
- Interest income/expense: daily accrual on positive/negative balances
- Account number encrypted at rest with per-tenant DEK (only last 4 shown in UI)
- 10 built-in reports: cash summary, forecast vs actual, IC activity, FX exposure, interest, restricted cash
- Multi-tenancy: per-tenant isolation, RBAC, audit trail

---

## Task board status

All 5 PART_161-165 task IDs already marked **completed** in round 1:

- `019ec9c5-12bc-7a63-8f1d-d43daf4211a8` — Atlas — 10 PART doc writes (T-LE-VERDICT v0.14) — ✅ completed

No additional task entries needed; the v0.14 task closure covers all 5 treasury docs.

---

## PICK CONFIRM

✅ Atlas confirms ALL 5 treasury docs (161, 162, 163, 164, 165) are filed, LF Unix, ≥ 80 lines, with sha256 reported, and were completed in v0.14 round 1.

✅ No idle time. Standing by for next dispatch.

---

## Sign-off

| Role                  | Status       | Date       | Notes                                                                                 |
| --------------------- | ------------ | ---------- | ------------------------------------------------------------------------------------- |
| Atlas (author)        | ✅ VERIFIED  | 2026-06-15 | 5 files, 1,858 lines, all LF Unix, all PASS                                           |
| Athena (data)         | ⏳ PENDING   | —          | Validate §13 schema vs Part 6 canonical entities                                      |
| Hephaestus (security) | ⏳ PENDING   | —          | Sign-off on Part 165 encrypted account numbers + Part 162 hedge counterparty exposure |
| Apollo (build)        | ⏳ PENDING   | —          | Confirm amortization / M2M / cap table calc engine feasibility + Web Worker offload   |
| Strategos (priority)  | ⏳ PENDING   | —          | Validate scope vs Part 199 future roadmap (multi-tenant cloud, real-time feeds)       |
| Leader                | ⏳ TENTATIVE | 2026-06-15 | Awaiting 4-ICP ratification in v0.14 cycle                                            |

**File:** `docs/drafts/leader/ATLAS-TREASURY-VERIFICATION_v0.1.md`
**LF Unix:** yes
**Line count:** 125
