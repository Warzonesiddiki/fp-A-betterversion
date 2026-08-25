# Secondary Evidence Synthesis — Multi-Agent Research Squad (Round 2)

> **Date:** 2026-08-11 · **Method:** BMAD v5 multi-agent squad, live web research (Rex: commercial/WTP · Percy: close/consolidation · Uxie: FP&A workflow · Archie: deployment/security · Bob: implementation burden)
> **Status:** SECONDARY EVIDENCE ONLY — refines R-02 interview probes and R-03 synthesis criteria. It does **NOT** validate any FinPlan market assumption (A-01, A-02, A-03, A-07, A-13, A-14 remain UNVALIDATED).
> **Usage rule:** cite in R-02 guides as probe sharpeners; never as proof of customer demand.

---

## 1. Commercial calibration (A-01 probe sharpener) — Rex

| Finding                                                                                                                                                 | Source (public)                                 | Relevance to R-02/R-03                                                                                                                                                                                       |
| ------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| OneStream implementations: $500K–$2M+ SI services; 12–18 month timelines; 3-year TCO $1.5M–$3M+; avg annual license ~$178K; per-user $20–30/mo at scale | cfoshortlist.com/vendors/onestream (2026 guide) | A-01 ($500k+ WTP) is plausible only at the high end; probes must ask: "what did your last EPM/planning programme cost (license + SI + admin)?" and "what spend level would require your CFO board approval?" |
| Year-1 ranges: OneStream $150–300K lic + $400K–1.5M impl; Anaplan $150–500K lic + $250K–1.5M impl; Oracle FCCS $120–350K + $300K–1.2M                   | cfoshortlist.com (TCO table)                    | Gives R-02 a concrete price-ladder to test WTP against (not as a pitch — as a calibration question)                                                                                                          |
| Enterprise FP&A software starts at $60K–$100K/yr (Anaplan, Workday); mid-market $1,400–2,000+/mo                                                        | golimelight.com FP&A pricing guide 2026         | Confirms wide market band; A-01 stays UNVALIDATED; probe middle-market vs enterprise WTP separately                                                                                                          |
| 3-yr admin FTEs are a major hidden cost: $360K–$1.1M (OneStream), $360K–$780K (Anaplan/Oracle)                                                          | cfoshortlist.com TCO                            | Directly relevant to the "admin burden" wedge hypothesis; add to controller/IT probes                                                                                                                        |

## 2. Close / consolidation pain (A-03 probe sharpener) — Percy

| Finding                                                                                                                                                      | Source (public)                                     | Relevance                                                                       |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------- | ------------------------------------------------------------------------------- |
| 62% of finance orgs still rely on spreadsheets as a primary close tool (Gartner)                                                                             | bprglobal.co month-end close guide (citing Gartner) | R-02 close-walkthrough probe: "which close steps live in spreadsheets and why?" |
| 88–90% of spreadsheets contain ≥1 error; 1–5% error rate per cell in complex models (Panko)                                                                  | bprglobal.co                                        | Probe: "what does a late/wrong number cost?" — quantify error consequence       |
| Manual reconciliation = 30–40% of close time (10–20 hrs/person/mo); SMB close 100–300 person-hrs; mid-market 300–1,000; 73% work overtime (avg 11 extra hrs) | bprglobal.co; Robert Half surveys                   | Concrete time/cost quantification prompts for controllers                       |
| Late adjusting entries extend close 1–3 days for 35–45% of orgs; inter-department comms delays affect 40–50%                                                 | bprglobal.co                                        | Probe close-delay causes and control-exception handling                         |

## 3. FP&A workflow pain (A-03, A-06 probe sharpener) — Uxie

| Finding                                                                                                                         | Source (public)                                               | Relevance                                                                              |
| ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| 65–75% of FP&A time on data collection/validation; only ~35% on insight (AFP survey; growcfo innovation report)                 | growcfo.net Q3 2025 innovation report; netsuite.com (AFP 75%) | Core R-02 analyst probe: "map your last forecast — where did hours go?"                |
| 52% of FP&A teams primarily use Excel for planning                                                                              | growcfo.net                                                   | Excel-first cohort selection criterion already in screener — now quantified externally |
| 29% of companies take >10 days to finalize forecasts                                                                            | growcfo.net                                                   | Probe: "how long was your last forecast cycle and what delayed it?"                    |
| 55% of FP&A orgs report basic/developing analytical maturity; 51% of time on data collection/validation (CFO University survey) | cfo.university                                                | Context for materiality/decision-workspace probes (A-06)                               |

## 4. Deployment / security preferences (A-02, A-04 probe sharpener) — Archie

| Finding                                                                                                                                                                       | Source (public)                                          | Relevance                                                                                    |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Cloud vs on-prem decision driven by: regulatory hosting constraints, data-residency mandates, legacy integration dependence, DR maturity; hybrid transition models are common | sysgenpro.com cloud-vs-onprem ERP risk comparison (2026) | R-02 IT probes: "which factors would force on-prem/hybrid for finance data in your org?"     |
| Data residency laws require finance data to stay in geographic boundaries; on-prem naturally satisfies but limits scalability                                                 | veryfi.com, tfltechinc.com (banking 2026)                | A-02/A-04: local-first is plausible for regulated orgs but NOT validated as a differentiator |
| Cloud usually wins on true 5-yr TCO (30–50% cheaper) for most orgs; on-prem only where mandates force it                                                                      | tfltechinc.com                                           | Counterweight to the local-first hypothesis — include as disconfirmation probe               |

## 5. Implementation burden (A-07 probe sharpener) — Bob

| Finding                                                                                                                                                      | Source (public)                                            | Relevance                                                                                 |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| OneStream: 12–18 mo enterprise / 6–9 mo mid-market; $200K–$1M+ annual; Anaplan: 6–12+ mo; Oracle EPM: 9–18 mo; spreadsheet-first mid-market tools: 4–8 weeks | cfoshortlist.com anaplan-alternatives-2026 decision matrix | R-02 partner probes: "how long does a typical implementation run and where does time go?" |
| Fast time-to-value alternatives (Pigment 6–9 mo, Abacum 8–16 weeks) exist — speed is a real competitive axis                                                 | cfoshortlist.com                                           | Tests whether "controlled close loop" beats "faster planning tool" as the wedge (A-03)    |
| Oracle ERP integration near-zero for Oracle EPM vs $30–120K connector costs for others                                                                       | loop-wise.com GCC 2026 guide                               | A-07: connector economics vary by incumbent ERP — probe source-system stacks              |

---

## Synthesis implications (what the squad concludes)

1. **A-01 remains open but testable**: the public market band is $60K/yr (mid) to $500K–2M+ implementations (enterprise). R-02 must capture _participant_ spend/approval thresholds, not rely on these ranges.
2. **Close + reconciliation is the most quantified pain** (62% spreadsheet close, 30–40% reconciliation share, overtime) — strongest evidence-backed candidate wedge (still hypothesis until primary).
3. **Excel dependence is real and quantified** (52% planning, 62% close) — supports the Excel-cohort screener quota.
4. **Local-first is NOT validated as a differentiator** — public sources show cloud wins on TCO for most; on-prem only where mandates force it. R-02 IT probes must actively seek disconfirmation (A-02).
5. **Implementation speed is a live competitive axis** (4–8 week spreadsheet-first tools vs 12–18 mo enterprise EPM) — R-03 synthesis must weigh this against the close-wedge hypothesis.

## What this does NOT do

- Does not validate WTP, ICP, wedge, connector, vertical, or deployment preference.
- Does not replace the ≥3-participant primary evidence standard.
- Secondary sources are vendor-adjacent or general surveys; treat all figures as directional signals.

## Source list (all public, accessed 2026-08-11)

- cfoshortlist.com/vendors/onestream · /reports/anaplan-alternatives-2026
- golimelight.com FP&A software pricing guide (2025/2026)
- bprglobal.co month-end close automation guide (citing Gartner/Panko/Robert Half)
- growcfo.net Q3 2025 Planning/Budgeting Innovation Report (citing AFP)
- netsuite.com FP&A resource (AFP survey)
- cfo.university FP&A maturity article
- sysgenpro.com cloud-vs-onprem ERP risk comparison (2026)
- veryfi.com / tfltechinc.com cloud-vs-onprem finance/banking (2025-2026)
- loop-wise.com Oracle/OneStream/Anaplan GCC comparison (2026)
