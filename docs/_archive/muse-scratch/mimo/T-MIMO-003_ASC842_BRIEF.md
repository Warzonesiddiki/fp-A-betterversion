# T-MIMO-003 Brief — ASC 842 Lease Audit (cycle 8-10 corpus)

**Date:** 2026-06-13
**Muse:** Mimo (12th Muse, FP&A Domain Expert, D-002 third-witness specialist)
**Slot:** 019ebf73-3ec2-74d2-82f7-6a67a0746347
**Cycle:** 10 wave 6 (Mimo's 3rd ship)
**Q3 pre-commit pair:** T-MIMO-002 (ASC 606) + T-MIMO-003 (ASC 842) — closes GAAP/IFRS compliance lens

---

## §1 — Task

ASC 842 (US GAAP) / IFRS 16 (IFRS) multi-year lease-accounting audit of FinPlan Pro lease-like commitments in the cycle 8-10 corpus. Surface balance-sheet implications (ROU asset, lease liability, discount rate, term) for any commitment that meets the ASC 842-10-15-4 lease identification test.

## §2 — Why this task

1. **Strategos Q3 strategic review §7.1 L188** pre-staged Mimo as "T-MIMO-003 (channel economics refresh)" — but the Q3 HL pre-commit was for ASC 842 (GAAP pair to ASC 606). I am honoring the Q3 HL pre-commit. The Strategos pre-stage framing is acknowledged and noted in §6 of the audit.
2. **ARCHITECTURE.md L163** + **ENGINES.md L46** confirm `LeaseEngine.ts` exists in the codebase (253 LOC) implementing ASC 842 / IFRS 16 — but the engine is **ORPHAN** (no live data, no UI consumer, no integration with strategic corpus).
3. **Y2 board pack v0.3 §5** lists a 5-year CloudHSM commitment (~$198K lifetime) that has NOT been evaluated for ASC 842 capitalization. This is a real balance-sheet GAP.
4. **T-ATL-022 (R2 lifecycle)** + **T-ATL-020 (backup verification)** list 7-year storage commitments that need ASC 842 scope test (likely NOT leases, but must verify).

## §3 — Scope (3-doc minimum, 5-doc target)

| #   | Doc                                      | Why included                  |
| --- | ---------------------------------------- | ----------------------------- |
| 1   | Y2 board pack v0.3 §5                    | CloudHSM 5-year commitment    |
| 2   | T-ATL-022 R2 lifecycle policy spec       | R2 7-year retention           |
| 3   | T-ATL-020 daily backup verification spec | AWS S3 7-year cold            |
| 4   | T-HEP-007 SOC 2 RFP                      | Vanta SOC 2 SaaS subscription |
| 5   | `src/engines/LeaseEngine.ts` (253 LOC)   | Implementation reference      |

## §4 — Out of scope

- **Code patches** to LeaseEngine.ts (Athena's lane, not Mimo's)
- **P0 fixes** — this is a docs-only audit; P0 fixes routed to Hephaestus + Strategos
- **HQ office lease** — Founder pending; flagged as GAP if Founder confirms WFO
- **AWS Reserved Instances (compute)** — not yet committed in cycle 8-10 corpus
- **CloudFront commits** — not yet committed

## §5 — Verdict scale

- ✅ **LEASE** — commitment is a lease under ASC 842-10-15-4; capitalize
- ⚠️ **LEASE-BORDERLINE** — needs additional info (term length, exclusivity, IBR)
- ❌ **NOT-LEASE** — service contract, SaaS, or employment; no balance-sheet impact
- 🚨 **GAP** — commitment not documented in corpus; Founder must confirm
- ❌ **FABRICATION** — would be a fabricated lease or balance-sheet item (target: 0)

## §6 — Disciplines applied

- **D-002 Three-Witnesses** — Source:file:line / Data claim / Data re-derived / Context third-witness / Verdict / Cascade
- **D-007 5-min SLA + Honest Labeling** — actual line count, claim tally, self-corrections
- **D-009 Triangulation** — Glob ABSOLUTE path on every source doc reference

## §7 — ETA

- Pre-stage (this brief): 5 min
- Audit document: 50-80 min
- Self-review + HL tally: 5-10 min
- **Total: 60-90 min, ship 17:55-18:25 IST**

## §8 — Pair-activation justification

T-MIMO-003 closes the GAAP/IFRS compliance lens that T-MIMO-002 opened. Together they form a complete accounting-pane audit:

- **ASC 606** (T-MIMO-002): revenue side of multi-year contracts
- **ASC 842** (T-MIMO-003): lease side of multi-year commitments
- **Mnemosyne cascade:** GLOSSARY v0.3 needs "ASC 842 5-step lease test" + "ROU asset" + "IBR" + "Operating vs finance lease" entries (T-MN-013 candidate)
