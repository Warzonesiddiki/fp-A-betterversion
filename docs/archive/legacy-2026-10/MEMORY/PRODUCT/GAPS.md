---
id: MEMORY/PRODUCT/GAPS.md
status: active
last_verified: 2026-08-18
verified_by: arena-agent/session-017
confidence: high
---

# PRODUCT/GAPS — missing capability vs the all-in-one claim

## Correctness / detection

- 421 unsafe money operations across 163 modules remain (81.44% safe). Phase 0 exit needs ≥90%,
  i.e. roughly 250 — consider a class-wide fix for the `existing.debit += e.debit` grouping idiom
  that recurs across at least six pages.
- 32 fabricated displayed literals across 13 files remain, concentrated in `src/pages/sectors/*`
  dashboards that read no store, or fall back to demo fixtures when their store is empty.
- No detector for a **raw float crossing a render/format boundary**. Live instance:
  `ProfessionalExportEngine` types rows as `(string|number)[][]` and passes them to `autoTable`
  with only column 0 stringified — an unformatted float can print `0.30000000000000004` into a
  board pack.
- No detector for **numeric ratio invention** (`pretax * 0.7`, `taxRate: 21`, `denialRate: 4.2`)
  or view/memo divergence. Source guards are per-module.
- Detector blind spot: single-line arrow bodies over `args[i]!` (W0.1.6 type-based detection, not
  started). `arr`/`cash` substring false positives unfixed.
- `formula-functions/financial.ts` oracle values need re-derivation from published Excel output.
  `ODDFPRICE` / `ODDLPRICE` bodies are byte-identical and both ignore `_firstPeriod`/`_lastPeriod`.

## Infrastructure

- `scripts/escape-ledger-check.mjs` specified in Section 24 but **not written**; must wire into
  `docs:verify`.
- `docs:links --strict` exists as a script but is not part of `docs:verify` / pre-push.
- Legacy `money:adoption` (~25%) measures imports, not operations — retire after W0.1.1; never
  conflate with AST safety.
- **W0.8 persistence authority partial (sess_031):** inventory, `$d:` serialization, authority
  contract, schema-equality gate, DurabilityBanner done. glStore is still local-draft (W0.8.6
  after tenancy). `tenant` still has 0 hits in `server/src/db/` (W0.2).
- **MSI installer missing** (NSIS only) — Section 23 requires MSI + NSIS at GA.
- `ci-patches/0005-*.patch` unapplied, so those CI gates are not enforced.
- GitHub Vitest coverage job fails for lack of a `coverage/` artifact — not a product-test failure.

## Product

- `BoardPackTemplate` is exported through the barrel but **not routed** — decide: route or delete.
- 13 P0-open features in blueprint §3.8: F-PLAT-001/005, F-SEM-001, F-MDM-001, F-OPS-002,
  F-SEC-003/004, F-CTRL-001, F-AI-011, F-INTEGRATE-000, F-WORKFLOW-007/008, F-COLLAB-002.
- Stores that persist seeded fixtures for every tenant: `healthcareStore` (qualityMetrics,
  savingsData, programs) — feeds ValueBasedCarePage.
- Engine mocks still armed: RealEstate (4.2 / 94.8 / 6.2 + amount-sign/prefix-80 fork),
  Retail (254 / 92.8), Construction (1.5× backlog + abs), Insurance (0.85× / 360),
  Healthcare: `denialRate` fixed in session 017; `cashCollected` still sums every 11xx receipt
  rather than patient collections (H-004).

## Top risks (score)

R-21 no system of record (20) · R-22 money-gate false-green (20) · R-24 desktop unverifiable (20) ·
R-29 all-in-one claimed while users still leave (20) · R-27 unsigned installer (16).
