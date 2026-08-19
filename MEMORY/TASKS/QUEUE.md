---
id: MEMORY/TASKS/QUEUE.md
status: active
last_verified: 2026-08-18
verified_by: arena-agent/session-017
confidence: high
---

# TASKS/QUEUE — ordered next work

1. Money-AST: next ranked module from `node scripts/money-ast-detector.mjs --list`
   (**skip `src/services/mockData/index.ts` — it is the fixture factory**).
2. Fabrication: Education → Government → Logistics sector dashboards.
3. Write a test for INV-009 (no IEEE-754 money persisted) — currently `enforced_by: NONE`.
4. Write `scripts/escape-ledger-check.mjs` (Section 24) and wire into `docs:verify`.
5. Wire `docs:links --strict` into `docs:verify` / pre-push.
6. W0.1.6 type-based detection: raw float across a format boundary; fix `arr`/`cash` substring FPs.
7. Disarm engine mocks: RealEstate, Retail, Construction (Insurance cleaned s022;
   Healthcare's patientRevenue fixed s017).
8. W0.8 persistence authority (before W0.2): glStore authoritative, schema equality, tenancy +
   per-table leak tests.
9. Decide `BoardPackTemplate`: route it or delete it.
10. Re-derive `formula-functions/financial.ts` oracles; split `ODDFPRICE`/`ODDLPRICE`.
11. Retire legacy `money:adoption` after W0.1.1.
12. **Cosmic UI theme decision (user-raised 2026-08-19).** `rizkimuhammada/cosmic-ui` is a
    sci-fi themed Tailwind + React component collection (copy-style distribution, zag.js
    accessibility; NOT an npm runtime dependency — the npm `cosmic-ui` package is an unrelated
    spacing library). Verdict so far: do NOT adopt during Phase 0 (correctness ratchets +
    LOCKED blueprint + finance-trust aesthetics). Re-open after Phase 0 exit as an OPTIONAL
    user-selectable theme; pilot on one or two showcase surfaces first; requires blueprint
    parts edit + ADR + UI-07/contrast-contract review + G19 bundle budget check.
