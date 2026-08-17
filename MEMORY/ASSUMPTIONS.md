---
id: MEMORY/ASSUMPTIONS.md
status: active
last_verified: 2026-08-18
verified_by: arena-agent/session-017
confidence: medium
---

# ASSUMPTIONS — unverified but currently acted upon

```
[A-001] The account-prefix convention (1 Asset, 2 Liability, 3 Equity, 4 Revenue,
        5 COGS, 6 OpEx, 7 Interest, 8 Income tax) holds for every tenant ledger
        imported into the app.
  why: every derivation module written in W0.1.1 filters on it.
  blast radius: HIGH — misclassified prefixes silently misstate every P&L tile.
  verify: inspect real customer chart-of-accounts imports; add a COA validation
          step at import that rejects/queries unmapped prefixes.
  retire when: a mapping table exists (COA -> statement line) and is authoritative.

[A-002] `period` (`YYYY-MM`) or `date.slice(0,7)` on a GL entry is a correct
        monthly bucket key for trend charts.
  why: used by dashboardModel.deriveMonthlyTrend and several pages.
  blast radius: MEDIUM — a 4-4-5 or 13-period fiscal calendar buckets wrong.
  verify: reconcile against src/utils/fiscalPeriods.ts + org fiscal settings.
  retire when: trends read the fiscal calendar rather than the ISO month.

[A-003] Zustand `persist()` localStorage stores are the de-facto system of
        record today (41 of 44 stores persist).
  why: only a minority of code paths call the server.
  blast radius: HIGH — no durability, no tenancy, no audit on financial truth.
  verify: W0.8 persistence-authority wave.
  retire when: glStore is authoritative and drift-checked against the server.

[A-004] The frontend suite's ~15 min / 8 GiB profile still fits the sandbox.
  why: session 002 ran it fully in 3 GB.
  blast radius: LOW — slow feedback only.
  verify: run `npm test` end to end and record in QUALITY/BENCH.md.
```
