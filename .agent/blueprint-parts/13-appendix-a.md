# APPENDIX A — DOMAIN MODULE SPECIFICATIONS (ADDENDUM II, PARTS XXXI–LX)

Sections 0–22 are the blueprint required by XVIII-C. This appendix carries the
domain-level detail mandated by the Addendum II lock checklist (Codex line 3042). Each
subsection is normative and is referenced from the phase where it is built.

---

## A.1 Temporal domain, calendars, locales, i18n (Part XXXI)

### A.1.1 Time model

| Concept         | Representation                        | Rule                                                                        |
| --------------- | ------------------------------------- | --------------------------------------------------------------------------- |
| Instant         | `TIMESTAMPTZ`, UTC internally, always | Never a local-time string in storage                                        |
| Civil date      | ISO-8601 date, no timezone            | Period keys, due dates, effective dates                                     |
| Period          | First-class entity (`periods` table)  | **Never** "just a date column"                                              |
| Fiscal calendar | Tenant-configurable **and versioned** | Calendars change; history must not silently rewrite                         |
| Clock           | Injected                              | Tests freeze it; production uses NTP. No engine calls `Date.now()` directly |

**Calendars supported:** standard Gregorian 12; fiscal-year offset (any month start, any
day start); 4-4-5 / 4-5-4 / 5-4-4 retail; 13-period; 53-week year with an **explicit 53rd-week
allocation policy** recorded per tenant; 4-4-4; custom period table (uploaded dates);
public-sector appropriation year (may differ from the fiscal year).

**Period types:** `hour, day, week, period, month, quarter, half, year, ytd, r12, r13, ltd`.

### A.1.2 As-of reporting

Every report accepts `as_of_ts`. Late-arriving actuals do **not** rewrite history unless
the restatement protocol (A.4.5) runs. _"What did the board pack say on the day we
published it"_ is a first-class, indexed query — not an archaeology exercise.

### A.1.3 Timezone & close boundaries

```
TZ1  Tenant has a close_timezone. "Period close at 00:00" means that zone.
TZ2  Integrations normalise to UTC on ingest; period-bucketing uses close_timezone.
TZ3  DST transitions never split or duplicate a posting. Tests for America/New_York
     and Europe/London March and November transitions are MANDATORY.
TZ4  Each entity may have a local close timezone; consolidation uses the group close
     timezone plus an explicit lag policy (e.g. +1 day).
TZ5  "Today" in the UI is tenant-local, never browser-local, unless the user overrides.
```

### A.1.4 Locale, numerals, RTL

Languages — Phase 1: `en-US, en-GB`. Phase 2: `de, fr, es, pt-BR, ja, zh-Hans, nl, it, sv, pl`.
Phase 3: `ko, zh-Hant, ar, he, hi, th, vi, tr, nb, da, fi, cs, ro, uk`.
RTL (`ar`, `he`): grid, formula bar, and PDF all flip correctly — verified, not assumed.

Number formats follow CLDR (`1,234.56` / `1.234,56` / `1 234,56` / `1'234.56`). Currency
display carries ISO code, symbol, and correct minor units (**JPY = 0, KWD = 3, CLP = 0** —
hardcoding 2 decimal places is a defect). Negative conventions: locale default, user
override, tenant policy. Date formats: locale plus an ISO toggle for auditors. Fiscal
labels (`FY26 P03`) and calendar labels (`May 2025`) are independently togglable.

### A.1.5 Formula localisation

```
Storage:   ALWAYS canonical English function names (SUM, IF, XLOOKUP).
Display:   optional locale aliases (SOMME, WENN) — a translation layer only.
Separators: locale-aware in the UI (; vs ,); the AST stores structured arguments.
NEVER persist localised formula text as the source of truth.
```

### A.1.6 Holiday, workday, seasonality calendars

Per-country and per-entity holiday calendars (cash, staffing, retail). `NETWORKDAYS` /
`WORKDAY` equivalents in the formula engine. Event calendars (Black Friday, Chinese New
Year, Ramadan, earnings dates). Reusable seasonality profiles bound to drivers.

---

## A.2 MDM, semantic layer, and the query planner (Part XXXII)

### A.2.1 Master data management

```
MDM1   Every dimension member has a stable internal id and a business key.
MDM2   All members are SCD2 (valid_from / valid_to). No in-place semantic change.
MDM3   Member lifecycle: draft → active → frozen → merged | retired.
MDM4   Merge records survivorship: which attributes won, who decided, when, why.
MDM5   Hierarchies are versioned; a restated hierarchy does not rewrite prior reports.
MDM6   Ragged and alternate hierarchies are supported; weights on edges support
       proportional consolidation.
MDM7   Golden-record matching is proposed by the system and CONFIRMED by a human.
MDM8   Unmapped members land in a holding node, raise an alert, and BLOCK period close.
MDM9   Bulk load is validated, staged, diffed, and approved — never applied blind.
MDM10  External ids from every source system are retained (external_ids JSONB) so
       lineage back to the source survives a merge.
```

### A.2.2 Metric store (K21)

```
MET1  A metric has: id, name (i18n), description, formula AST, grain, unit,
      applicable books, owners, version, certification state, changelog.
MET2  Metrics are versioned. A report snapshot pins the metric versions it used.
MET3  Certification is maker-checker. The definer cannot certify alone.
MET4  Every non-GAAP metric declares its GAAP reconciliation metric. No exceptions —
      an uncontrolled "adjusted EBITDA" is how finance products lose credibility.
MET5  A metric used in a published report must be certified. Uncertified metrics
      render with a visible DRAFT marker and are blocked from FINAL board packs.
```

### A.2.3 Semantic query planner

A query names **metrics, dimensions, filters, and a grain** — never tables. The planner:

1. resolves metric ASTs at the pinned version;
2. determines the minimum fact grain required;
3. injects the caller's RLS predicate (PC4) — unconditionally, before optimisation;
4. applies field masking to the projection;
5. selects a source: base facts, a precomputed rollup, or a derived columnar store
   (never the reverse — a derived store is never the system of record, ST2);
6. estimates cost and rejects over-budget queries (`OMNI-QUERY-0451`);
7. returns results with the metric versions, FX rate set, and lineage ids used.

**Book mixing is rejected at plan time** (`FIN-008`), not discovered in a total.

---

## A.3 Multi-book & local GAAP honesty (Part XXXIII)

### A.3.1 Book taxonomy

```
BOOK.MGMT           management / decision
BOOK.STAT_IFRS      IFRS group
BOOK.STAT_US        US GAAP
BOOK.LOCAL_{cc}     local statutory (HGB, J-GAAP, ASBE, Ind-AS, UK-GAAP, CPC…)
BOOK.TAX            tax basis
BOOK.CASH           cash / treasury view
BOOK.STATUTORY_FUND nonprofit / government
```

```
MB1  A fact may exist in one book and be derived into others via adjustment journals.
MB2  Adjustments are typed: GAAP_TO_IFRS, MGMT_TO_STAT, TAX_TO_BOOK, ELIM, RECLASS.
MB3  Book is chosen at session or report level. NEVER mix books in one total.
MB4  Consolidation scope may differ by book (management may include JVs).
MB5  Local close may precede group close; books have INDEPENDENT period statuses.
```

### A.3.2 Chart mapping

`Legal COA (per entity, per ERP) ↕ Management COA (group) ↕ Statutory group COA ↕ Industry KPI accounts`

All maps are **SCD2 and bidirectional**. A 2026 map must not silently rewrite 2025
statutory numbers.

### A.3.3 Local GAAP pack honesty matrix

| Pack                                                              | Phase | Status language when not implemented |
| ----------------------------------------------------------------- | ----- | ------------------------------------ |
| US GAAP, IFRS                                                     | 2     | —                                    |
| HGB, UK FRS 102, J-GAAP, ASBE, Ind-AS, Brazilian CPC, Mexican NIF | 3     | **"Not available"**                  |
| GASB, IPSAS, UK Whole of Government                               | 3     | **"Not available"**                  |
| Insurance statutory vs GAAP                                       | 3     | **"Not available"**                  |
| Bank regulatory (CCAR and similar)                                | 3+    | **"Not available" — never faked**    |

**Honesty rule:** if a local pack is not implemented, the UI says **Not available**. It
never renders an approximate local statement. A plausible-looking wrong statutory number is
worse than no number, because the user will file it.

---

## A.4 Record-to-report: Close OS, journals, reconciliation, restatement (Part XXXIV)

### A.4.1 Close orchestration

Artefacts: close calendar (entity × book × period × task), task template library,
dependencies (consolidation cannot start until all children close), SLA clocks, an
**evidence locker** (file + screenshot + system extract, each hashed), and sign-off
(e-sign, role, timestamp, IP, reason).

Task types: `subledger_close, flux, rec, journal, ic_match, fx_reval, consol,
tax_provision, commentary, package, certify`.

### A.4.2 Journal engine

```
J1  Journals have a header and lines; lines balance debit/credit (or are memo-book).
J2  Recurring, reversing, allocation, and standard journals are all supported.
J3  Posting to a CLOSED period is forbidden except reversing entries and the
    restatement protocol.
J4  Auto-reverse-next-period is a first-class flag, not a manual habit.
J5  Management journals NEVER post to the ERP unless an explicit push integration is
    configured and approved. Default: they stay in OmniPlan.
J6  Every journal carries an attachment, a ticket reference, and SoD (preparer ≠ poster).
J7  Statistical journals (headcount, sqft, kWh) use the same control plane as monetary ones.
```

### A.4.3 Account reconciliation

Types: `GL_to_subledger, GL_to_bank, IC, system_to_system, rollforward`.
States: `OPEN → PREPARED → REVIEWED → APPROVED`, plus `BROKEN`.
Matching: exact, fuzzy amount, many-to-one, one-to-many, date-window, and AI-suggested
matches that **always require confirmation**.
Rollforwards: prepaid, deferred revenue, fixed assets, debt, tax, equity.
Materiality is a tenant policy per account. Auto-certification only when unmatched items
are below materiality **and** the ruleset itself is certified. Unreconciled items age with
escalation.

### A.4.4 Flux & commentary

Automated flux at configurable thresholds; commentary mandatory above threshold with
per-account templates; **numbers cited in commentary hyperlink to the cells that produced
them**; prior-period commentary carries forward with stale warnings; AI drafts (Tier 2)
never auto-publish.

### A.4.5 Restatement protocol

```
R1  A restatement is a named object: reason, periods, books, approvers.
R2  It creates a NEW immutable version of affected facts. The old version remains.
R3  Downstream locked board packs are marked SUPERSEDED — never silently changed.
R4  Rolling forecasts that consumed restated actuals recompute on a branch first.
R5  An external disclosure checklist is generated covering what was already published.
```

---

## A.5 Treasury, cash, debt, covenants (Part XXXV)

**Cash position:** bank account master (IBAN masked), balances via Open Banking / Plaid /
Yodlee / file / ERP, optional intraday (Phase 3), cash pooling and ZBA awareness.

**Forecast:** direct method (receipts/disbursements) and indirect (from the three-statement
model); 13-week weekly plus 18-month monthly; collections curves by customer segment;
payroll, tax, debt-service, and capex calendars.

**Debt:** facilities, draws, amortisation, revolver, bonds, leases-as-debt view; interest
day-count conventions actual/360, 30/360, actual/actual; variable rates with forward curves
and scenarios; **covenant definitions as code** with a headroom dashboard; default, waiver,
and amendment events.

**Investments:** surplus cash, money market, simple securities (fair value optional, Phase 3).

**FX operations:** exposures, natural hedges, forwards inventory. **Not a full TMS in Phase 1.**
Hedge accounting (IFRS 9 / ASC 815) is an explicitly scoped Phase 3 pack.

**Explicit non-goal — payments:** OmniPlan does **not** become a payment rail. It plans and
monitors. Initiation, if ever built, is via a certified partner with dual control and PCI
out of scope.

```
TR1  Bank credentials are NEVER stored in the OmniPlan application database.
     Aggregator tokens only.
TR2  Cash actuals must reconcile to GL cash (A.4) or the period cannot close.
TR3  A forecast covenant breach is a P0 alert path (treasurer + CFO, immediately).
```

---

## A.6 Revenue recognition (Part XXXVI)

**Standards:** ASC 606, IFRS 15.
**Objects:** customer contract, performance obligation, SSP catalog, allocation, contract
asset / contract liability, variable consideration (with constraint), modification, refund
liability, principal-vs-agent flag.
**Methods:** point in time; over time (output); over time (input, cost-to-cost); usage;
milestone.
**Waterfalls:** deferred revenue rollforward — `beginning + billings − recognised + fx +
other = ending` — which **must tie to the balance sheet** as a blocking assertion.
**Integrations:** Stripe, Zuora, Chargebee, NetSuite, Salesforce CPQ.

**Phased honesty:** Phase 1 ingests recognised and deferred balances and builds the
waterfall. Phase 2 computes recognition for standard SaaS/subscription. Phase 3 handles
complex multi-element arrangements and contract modifications.
**Do not claim a full Zuora replacement on day one** — claim planning, waterfall, and audit.

---

## A.7 Leases, SBC, tax provision (Part XXXVII)

**Leases (ASC 842 / IFRS 16):** lease inventory from abstracted terms; classification
(finance/operating under US GAAP; single model under IFRS); ROU asset and liability
schedules; IBR policy; modifications, indexation, and term options; documented transition
elections. Outputs feed the three-statement model, covenants, and cash.
_Phase 1: import schedules. Phase 2: compute from abstracts._

**Stock-based compensation (ASC 718 / IFRS 2):** grant register (options, RSUs, ESPP,
performance awards); cliff and graded vesting; forfeiture policy; expense attribution and
equity contra; dilution for EPS and cap-table scenarios.
**Non-goal:** OmniPlan does not replace Carta/Shareworks as the legal cap-table system of record.

**Tax provision (ASC 740 / IAS 12):**
Phase 1 — ETR bridge, deferred rollforward import, rate scenarios.
Phase 2 — temporary-difference library, valuation-allowance workflow.
Phase 3 — Pillar Two GloBE, CbCR helper, uncertain tax positions.
**Never, in any phase** — full corporate tax compliance or e-filing.
Outputs: provision, deferred tax balance sheet, ETR, cash tax forecast.

---

## A.8 Intercompany matching, eliminations, transfer pricing (Part XXXVIII)

**Partner master:** every entity knows its counterparties.
**Transaction types:** goods, services, royalties, loans, management fees, dividends.
**Matching:** auto-match on reference + amount + currency + date window; materiality
tolerances; dispute workflow; a confirmation portal for subsidiary controllers (external
users, scoped access).

**Elimination identities (each a tested assertion, not a journal habit):**
balance-sheet IC AR/AP; IC loans; investment-in-subsidiary vs equity; P&L IC revenue and
expense; unrealised profit in inventory; NCI / minority interest. Consolidation method is
declared **explicitly per investee**: full consolidation, equity method, or proportionate.

**FX on IC:** remeasurement and translation are distinguished (complete IAS 21).
Hyperinflation (IAS 29) is an explicit pack, **off by default**.

**Netting:** the system proposes netting statements. It does **not** move cash without
treasury approval.

**Transfer pricing:** policy library (CUP, resale, cost-plus, TNMM, profit split), a
calculator, and an OECD BEPS documentation stub. **Not a full TP suite in Phase 1.**

```
IC1  Post-elimination IC balances must net to zero within tolerance.
     The assertion is BLOCKING — consolidation does not complete if it fails.
IC2  Investment-in-sub vs equity elimination is a tested identity.
```

---

## A.9 ESG / sustainability FP&A (Part XXXIX)

Finance now owns climate numbers; a platform that ignores this is not all-in-one.

**Frameworks:** ISSB IFRS S2, CSRD/ESRS, TCFD, SEC climate rules as applicable, GRI crosswalk.

**Carbon data model:** Scope 1 / Scope 2 / Scope 3 (by category); a **versioned,
source-cited emission-factor library**; activity data (kWh, fuel, travel, purchased goods);
intensity metrics (per revenue, per unit, per FTE).

**Financial linkage:** carbon price scenarios flowing into OpEx and COGS and capex; carbon
tax and ETS modelling; capex tagging (taxonomy eligible / aligned); transition-plan opex.

**Controls:** identical audit trail, lineage, and period locks as financial data.
**An emission-factor change is a versioned restatement (A.4.5), never a silent rewrite** —
this is the single most common integrity failure in ESG tooling and it is banned here.

**Honesty:** OmniPlan is the planning and control plane. Raw IoT and utility-meter data may
remain in specialist systems; OmniPlan ingests and governs it.

---

## A.10 Search, help, academy, empty states (Part XLII)

**Search:** global across models, reports, metrics, journals, tasks, people, help, and
settings. Operators: `metric:`, `entity:`, `period:`, `book:`, `owner:`, `status:`.
Semantic search runs over names, descriptions, and commentary — **never over raw amounts**,
unless the tenant explicitly enables it and the data stays in-region. Recents, pinned
items, and "jump to my incomplete tasks" are first-class. Results are permission-filtered:
search never reveals the existence of an object the user may not see.

**Help:** contextual coach marks bound to feature ids; a formula assistant that explains a
formula in English; **"why is this number" resolves to lineage, never to a tooltip guess**;
in-app academy (CFO 30-minute path, Analyst 3-hour path, Admin 4-hour path); certification
exams for implementation partners; a per-tenant changelog reflecting that tenant's flags.

**Empty states:** every screen has a purposeful empty state with exactly one primary
action, plus a first-run sample model per industry pack — synthetic and labelled `DEMO`.

---

## A.11 Notifications, digests, escalations (Part XLIII)

**Event envelope:** `{id, tenant, type, severity, actor, entity_ref, ts, dedupe_key}`.
**Deliveries:** in-app, email, Slack, Teams, webhook, optional SMS.
**Preferences:** per user, per type, quiet hours, digest (daily/weekly).

**Escalation ladders:** budget overdue → owner → manager → FP&A lead; covenant headroom
below threshold → treasurer + CFO immediately; three-statement break → on-call finance
systems **and block the close**.

```
N1  No notification without a deep link to the exact object.
N2  Financial amounts in email/Slack obey field-level masking (Section 10.3).
N3  Unsubscribe cannot disable legal or control notices (close, SoD).
N4  100% of delivery attempts are logged; webhooks retry and then dead-letter.
```

---

## A.12 Entitlements, metering, commercial engine (Part XLIV)

The product must sell, meter, and enforce itself, or it is not complete.

**Metering dimensions:** seats by role, legal entities, model cells / facts, connected
systems, industry packs, AI queries, environments, VPC isolation.
**Plans:** starter, professional, enterprise, public sector.

**Entitlements engine:** evaluated **server-side on every API call**.
**Feature flags ≠ entitlements** — a flag ships code; an entitlement grants use. Conflating
them is how customers get access they did not buy, and how paying customers lose access
they did.

**Metering:** usage events in an append-only ledger; a customer-visible usage dashboard —
the customer must never be surprised by their own bill.

**Billing:** Stripe for self-serve; invoice + PO + net-30 for enterprise; **raw PAN is never
stored (PCI out of scope)**.

**Fair use:** soft limit warns → hard limit with grace → paid overage or a freeze on
non-close work. **Close and audit paths are never frozen for non-payment** without a legal
notice workflow (see R-20).

---

## A.13 Privacy, retention, legal hold, residency (Part XLVII)

```
PR1   Data map: financial, HR-comp, bank, usage, logs — categories documented.
PR2   Residency: tenant region pin (US, EU, UK, AU, CA, JP, IN…). Backups stay in-region.
PR3   BYOK / CMEK for enterprise, with a rehearsed key-rotation runbook.
PR4   Financial record retention default 7–10 years (tenant + jurisdiction policy).
PR5   GDPR erasure of a person: erase identifying fields, RETAIN the anonymised
      financial amounts required by law (K25), and document the legal basis in the
      erasure log.
PR6   Legal hold freezes purge jobs for specified entities, periods, and people.
PR7   Lower environments: production clones are masked (salaries, names, accounts).
PR8   DLP: block outbound webhooks containing unmasked salary or bank fields unless
      the destination is allow-listed.
PR9   Subprocessors published; DPA templates; SCC/IDTA as applicable.
PR10  Customer amounts are NEVER used to train shared models.
```

---

## A.14 Formula compatibility & calc profiler (Part LIII)

### A.14.1 Function library (implemented in heat order)

```
Core    IF, IFS, SWITCH, IFERROR, IFNA, AND, OR, NOT, LET, LAMBDA (Phase 2)
Math    SUM, SUMIF(S), SUMPRODUCT, AVERAGE, MIN, MAX, ROUND, ROUNDUP, ROUNDDOWN,
        MROUND, ABS, SIGN, MOD, POWER, SQRT, LOG, LN, EXP, INT, TRUNC
Lookup  INDEX, MATCH, XLOOKUP, XMATCH, CHOOSE, INDIRECT (restricted), OFFSET (restricted)
Ref     named ranges, structured table refs, spill arrays (Phase 2)
Logic   comparisons; boolean coercion rules documented as Excel-compatible AND tested
Text    LEFT, RIGHT, MID, LEN, TRIM, UPPER, LOWER, TEXT, VALUE, CONCAT, TEXTJOIN
Date    DATE, DATEVALUE, EOMONTH, EDATE, YEAR, MONTH, DAY, YEARFRAC, NETWORKDAYS,
        WORKDAY, WEEKNUM, ISOWEEKNUM
Fin     NPV, XNPV, IRR, XIRR, MIRR, PMT, IPMT, PPMT, FV, PV, NPER, RATE,
        SLN, DDB, SYD, DB, VDB
Stat    STDEV.S/P, VAR.S/P, MEDIAN, PERCENTILE, CORREL, FORECAST, GROWTH, LINEST
Array   FILTER, SORT, UNIQUE, SEQUENCE, MAP, REDUCE (Phase 2)
Omni    METRIC(), ALLOC(), FX(), CONSOL(), PRIOR(), YOY(), R12(), DRIVER(),
        SCENARIO(), BOOK(), ASSET_DEP(), HC_FTE(), IC_ELIM(), COVENANT()

BANNED  INDIRECT/OFFSET against unbounded ranges; volatile NOW/RAND inside locked
        packs (sandbox only); CALL/REGISTER; any file or URL fetch from a formula.
```

### A.14.2 Compatibility & circular-reference policy

200 golden workbooks cover operator precedence, implicit intersection, percent handling,
and the date-serial policy (**ADR required: Excel serial OR ISO — pick one and document
it**), plus locale argument separators.

**Circular references default to FAIL**, not to Excel-style silent iteration.
Optional iterative calculation is a **tenant flag** requiring: a maximum iteration count,
a change threshold, convergence proof, and a **watermark on every output produced by an
iterative model**. A user must never be unable to tell whether a number converged.

**Profiler:** top 50 slowest nodes, dependent counts, cache hit rate; trace precedents /
dependents / evaluate-stepper for auditors; an inconsistent-formula linter across a block.

---

## A.15 Controls, fraud analytics, ICFR / SOX (Part LIV)

**Control library:** COSO-aligned catalogue. Types: preventive, detective, ITGC,
entity-level, transaction. Each control records an owner, frequency, evidence template,
population, and sampling method, with an automated test wherever one is possible
(SoD checks, period-lock checks, reconciliation completeness).

**SOX 404:** process narratives are **generated from the actual workflow graphs**, not
written as Word fiction that drifts from reality. Deficiency → remediation task → retest,
tracked as workflow instances.

**Fraud analytics:** Benford analysis on journals; round-dollar, weekend, and holiday
postings; sequential invoice gaps; duplicate payments and duplicate journals; related-party
keyword and entity-graph detection; unusual reversal patterns. Every finding is
**explainable and never auto-accusatory** — the system surfaces a pattern for a human to
investigate.

**ICFR honesty:** OmniPlan provides evidence and automation. It does **not** "make you SOX
compliant", and no surface, document, or sales claim will say that it does.

---

## A.16 M&A, deal room, impairment (Part LV)

**Virtual data room:** permissioned folders, watermarking, Q&A threads, NDA gate;
financials published as **frozen packs** (Section 14.4), never live links.

**Models:** merger (accretion/dilution, share issuance); LBO template (debt schedules,
returns); synergy tracker (plan vs actual, one-time vs run-rate); TSA income and cost;
carve-out P&L with stranded cost; working-capital peg and true-up; purchase price
allocation slots (intangibles, goodwill); earnout tracker.

**Impairment:** CGU / reporting-unit register; IAS 36 and ASC 350 workflow; DCF and market
approach slots; disclosure checklist.

---

## A.17 Implementation methodology & ecosystem (Part LVIII)

### The 14-day playbook (the promise that must be kept)

| Day    | Milestone                                         | Proof it happened                                                  |
| ------ | ------------------------------------------------- | ------------------------------------------------------------------ |
| **0**  | Sandbox provisioned with an industry sample model | Tenant exists; `DEMO` data labelled; user logged in                |
| **1**  | One actuals source connected; COA mapped          | Sync completes with a reconciliation report; unmapped accounts = 0 |
| **3**  | Three statements balance                          | TS1–TS3 pass at runtime on real data; variance to source = 0       |
| **7**  | First rolling forecast produced                   | Forecast published with method, backtest error, and interval       |
| **14** | **First board pack generated from live actuals**  | Pack FINAL, frozen, watermarked, every figure drillable to source  |

This is a tested, timed commitment — not a marketing slogan. Failure to hit Day 14 with
three design partners blocks the GA gate (Section 22.5).

**Displacement playbooks:** Excel takeover; Anaplan / Adaptive / Planful / Vena
displacement; NetSuite-native finance team; SAP ECC / S4 group finance; PE portfolio
rollout via template-tenant cloning.

**Partner ecosystem:** certified implementer exam, sandbox entitlements, and an
implementation-project object **inside OmniPlan** — we run our own implementations on our
own product.

---

## A.18 Demo, sandbox, synthetic data (Part LIX)

```
SYN1  A deterministic, seeded generator per industry. Same seed = same dataset,
      so performance results and bug reports are comparable across runs.
SYN2  Every generated record is labelled DEMO. It is structurally impossible to
      confuse synthetic data with real data.
SYN3  Coverage of edge cases is mandatory, not optional: mid-year fiscal start,
      53-week years, multi-currency, intercompany transactions, NCI, adjustment
      periods, negative balances, zero-amount facts, and closed-period corrections.
SYN4  Performance dataset: 50M facts, 5,000 cost centres. Runs nightly in CI, never
      on a pull request (2-core constraint, K2).
SYN5  Masked-clone job for support access, gated on legal approval plus a
      customer-issued token, time-boxed and audited.
```

Three standard sizes back the Section 11.7 load profile: small (1M facts), medium (50M),
large (500M).

---

## A.19 Client surfaces beyond web (Part XLIX)

| Surface              | Phase | Contract                                                                                                                                                                                                           |
| -------------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Web                  | 1     | Primary. React 19 + Vite (ADR-003).                                                                                                                                                                                |
| Excel add-in         | 2     | Office.js. Cells bind to metric queries. **Writeback only to unlocked input cells, fully audited, subject to identical period locks and maker-checker.** Offline cache replays through the COL6 conflict protocol. |
| Google Sheets add-on | 2     | Read-first; writeback under the same rules.                                                                                                                                                                        |
| Slack / Teams        | 3     | Approve/reject budget lines, ask masked NLQ, complete close tasks. **Never dumps a full P&L into a channel.**                                                                                                      |
| Mobile               | 2     | Read-only dashboards and approvals; biometric + step-up auth; **no local plaintext database of financials**. Modelling is an explicit non-goal (Section 9.10).                                                     |
| Browser extension    | 3     | Optional capture of ERP screenshots into the evidence locker.                                                                                                                                                      |
| Public API + SDKs    | 3     | TypeScript and Python, generated from the OpenAPI document.                                                                                                                                                        |
| Embed SDK            | 3     | iframe + scoped token for customer portals, field-masked.                                                                                                                                                          |

---

## A.20 Storage tiers & derived stores (Part L)

```
ST1   Postgres OLTP is the system of record for facts, journals, workflow, and MDM.
ST2   Any OLAP path (DuckDB, columnar, cube) is DERIVED, rebuildable, and NEVER the SoR.
ST3   Sparse addressing: store only non-null intersections. A "1B-cell model" stored
      densely is a lie.
ST4   Aggregate navigator precomputes common grains (entity × account × month).
ST5   CQRS: writes go to facts + outbox; readers may use replicas or derived stores.
ST6   Derived-store lag is PUBLISHED IN THE UI ("actuals as of 03:12 UTC"). A user
      must never be silently reading stale numbers.
ST7   Columnar export (Parquet) to a customer warehouse (Snowflake share / S3).
ST8   Arrow Flight optional in Phase 3 for partner BI — it does not replace the OmniPlan UI.
ST9   Partitions compressed and encrypted at rest.
ST10  Hot / warm / cold tiers: current FY hot, prior FY warm, 6+ years cold.
```

---

## A.21 Secure SDLC (Part LII)

Threat model per new endpoint. SAST, DAST, SCA, container scan, and IaC scan in CI. SBOM
generated per release. Blocking secret scan. Pinned dependencies with advisory ingest.
Annual penetration test **and an additional test after any major calculation-engine
change**. Bug bounty after Phase 2. WAF, DDoS protection, and bot management at the edge.
No user-supplied SSRF in connectors — outbound URLs are allow-listed.

### Certification roadmap (honesty matrix)

| Phase | Target                                                                                                                       | Claim permitted before issuance                |
| ----- | ---------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| 1     | SOC 2 Type I controls designed; vulnerability management                                                                     | "Controls designed to meet SOC 2"              |
| 2     | SOC 2 Type II, ISO 27001, GDPR/UK DPA, CCPA                                                                                  | "Audit in progress" only once fieldwork starts |
| 3     | ISO 27701; HIPAA BAA only if ePHI is ever in scope (default: avoid); IRAP / FedRAMP-adjacent for public-sector packs as sold | None                                           |

**Do not print "FedRAMP authorized" until authorized.** This applies to every certification
in the table, without exception.

---

## A.22 Addendum II lock-checklist coverage map

| Checklist item (Codex line 3042)                           | Where satisfied                                               |
| ---------------------------------------------------------- | ------------------------------------------------------------- |
| Temporal domain + fiscal calendars + TZ/DST tests (XXXI)   | A.1; Section 5.1 `periods`; 18.3 W1.3                         |
| MDM + SCD2 + metric store + semantic planner (XXXII)       | A.2; Section 5.1; 15.3; 18.3 W1.1/W1.3                        |
| Multi-book + local GAAP honesty matrix (XXXIII)            | A.3; Section 5.1 `books`; 18.3 W1.4                           |
| Close OS + journals + recs + restatement (XXXIV)           | A.4; Section 13.7; 6.7; 18.4                                  |
| Treasury / cash / debt / covenant scope + non-goals (XXXV) | A.5; 18.4                                                     |
| RevRec phases + waterfalls (XXXVI)                         | A.6; 18.4                                                     |
| Leases, SBC, tax provision phases (XXXVII)                 | A.7; 18.4/18.5                                                |
| IC match + elimination identities (XXXVIII)                | A.8; 18.4                                                     |
| ESG data model + factor versioning (XXXIX)                 | A.9; 18.5                                                     |
| Dev/UAT/Prod + model promotion (XL)                        | Section 16.1 (EN1–EN7); 18.2 W0.2                             |
| Collaboration conflict protocol for money (XLI)            | Section 13.5 (CL1–CL7); ADR-006                               |
| Search / academy / empty states (XLII)                     | A.10; Section 9.4; 9.9                                        |
| Event bus + masking in notifications (XLIII)               | A.11; Section 13.8                                            |
| Entitlements + metering (XLIV)                             | A.12                                                          |
| SLIs/SLOs including 100% integrity (XLV)                   | Section 16.5–16.6                                             |
| SCIM, SoD, JML, break-glass (XLVI)                         | Section 10.4; A.13; 18.3 W1.8                                 |
| Retention vs erasure + residency + BYOK (XLVII)            | A.13 (PR1–PR10); Section 10.7                                 |
| Board pack freeze + watermark + e-sign (XLVIII)            | Section 14.4 (BP1–BP7); A.4.1                                 |
| Excel add-in writeback rules (XLIX)                        | Section 8.4; A.19                                             |
| Sparse cube + CQRS + SoR rule (L)                          | A.20 (ST1–ST10); Section 11.4; ADR-005                        |
| Connector outbox/inbox/DLQ (LI)                            | Section 8.2 (IR1–IR8); 5.1; 18.3 W1.6                         |
| Certification honesty matrix (LII)                         | A.21; Section 10.6                                            |
| Formula function list + circular-ref policy (LIII)         | A.14; Section 6.2 (F1–F9)                                     |
| SOX/ICFR evidence model (LIV)                              | A.15; Section 10.6                                            |
| Deal room + impairment workflow (LV)                       | A.16; 18.5                                                    |
| Mobile non-goals (LVI)                                     | Section 9.10; A.19                                            |
| Ledger design system tokens (LVII)                         | Section 9.8                                                   |
| 14-day implementation playbook (LVIII)                     | A.17                                                          |
| Synthetic data generator spec (LIX)                        | A.18; Section 11.7                                            |
| Stable error code registry (LX)                            | Section 16.8; A.14                                            |
| Full tree (LXI) as `docs/architecture/TREE.md`             | Written at lock; see Section 21 ADR index and the lock record |
