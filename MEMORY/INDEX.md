---
id: MEMORY/INDEX.md
status: active
last_verified: 2026-08-18
verified_by: arena-agent/session-017
confidence: high
---

# MEMORY — INDEX (ALWAYS READ THIS FIRST)

## 1. What this project is

**OmniPlan** (repo/package name `finplan-pro`, repo `Warzonesiddiki/fp-A-betterversion`) is a
desktop-first (Tauri) + web (React 19 / Vite) all-in-one FP&A platform whose stated mission is to
replace Excel, Anaplan, Adaptive, Vena, Planful and Power BI across all industry verticals. The
governing constitution is `MASTER HANDOVER PROMPT.txt` (the Codex, K1–K20). The engineering
contract is `.agent/BLUEPRINT.md`, which is **LOCKED**, so product code is unblocked. Work is
currently in **Phase 0 / Wave W0.1.1**: removing IEEE-754 float arithmetic from money paths and
removing fabricated (hand-typed) financial figures from user-facing surfaces.

MEMORY is the anti-hallucination brain. Repair order: **disk > MEMORY > your recollection.**

## 2. Session boot ritual (mandatory, in order)

```
1. Read MEMORY/INDEX.md            (this file)
2. Read MEMORY/STATE.json          (machine resume)
3. Read MEMORY/TRUTH.md            (verified facts only)
4. Read MEMORY/TASKS/NOW.md        (the single critical path)
5. If touching money / engines / schema / auth / tenancy:
     also MEMORY/INVARIANTS.md and MEMORY/SCHEMA/*
6. Probe the filesystem for EVERY file you are about to name (ls / read / grep)
7. Work
8. Write-through in the SAME turn: STATE.json, TRUTH/ASSUMPTIONS/ANTI,
   TASKS/*, SESSIONS/<session>.md
9. Run the integrity pass (MEMORY/_system/INTEGRITY.md) on shards you touched
```

Project-specific: the Codex also requires reading `.agent/PROJECT_JOURNAL.md` (from session 007)
and `.agent/HANDOVER.md`. MEMORY does not replace those — it indexes them.

## 3. Pointer table — if you are about to X, read Y

| If you are about to…                          | Read                                                          |
| --------------------------------------------- | ------------------------------------------------------------- |
| Touch any money arithmetic                     | `MEMORY/INVARIANTS.md`, `src/utils/money.ts`                    |
| Add/alter a displayed financial figure         | `MEMORY/ANTI.md`, `scripts/fabrication-detector.mjs`            |
| Pick the next W0.1.1 module                    | `MEMORY/TASKS/NOW.md`, `npm run money:ast:list`                 |
| Understand what actually exists on disk        | `MEMORY/MAP/TREE.md`, `MEMORY/MAP/MODULES.md`                   |
| Touch persistence / stores / server DB         | `MEMORY/SCHEMA/DATA-MODEL.md`, `MEMORY/PRODUCT/GAPS.md`         |
| Run anything                                   | `MEMORY/QUALITY/COMMANDS.md`                                    |
| Claim a test proves something                  | `MEMORY/QUALITY/TEST-TRUTH.md`                                  |
| Make an architectural decision                 | `MEMORY/DECISIONS/README.md` + `.agent/PROJECT_JOURNAL.md` ADRs |
| Commit / push                                  | `MEMORY/PROTOCOL.md` §git                                       |

## 4. Current phase / NOW

Phase 0, Wave W0.1.1. NOW = *T-027: push + PR the session-026 pair, then the next money-AST
module (LeaseEngine / LeaseDetailPage / the class-wide `existing.debit += e.debit` idiom) and
fabrication `BoardPackPage` (3)*. PRs #65 and #66 merged 2026-08-19; session 026 landed money
397 → 390 and fabrication 16 → 13 → `MEMORY/TASKS/NOW.md`.

## 5. Danger list — the top 5 ways an agent hallucinates THIS repo

1. **Trusting the ratchets as certification.** `0 unsafe ops` / `0 fabrication findings` means
   *un-flagged*, not *correct*. Neither detector sees invented ratios (`pretax * 0.7`,
   `taxRate: 21`, `denialRate: 4.2`). Per-module source guards are mandatory.
2. **Using the wrong money module.** Only `src/utils/money.ts` is money-safe.
   **Never** `src/utils/decimalUtils.ts`.
3. **`vi.mock`-ing the whole engine in a test**, then asserting against the fixture. Two board-pack
   tests did exactly this and shipped `$12.4M` to a CONFIDENTIAL PDF. Use `importOriginal` + DOM
   assertions on the real engine.
4. **Inventing chart-of-accounts semantics.** Prefixes are `1 Asset · 2 Liability · 3 Equity ·
   4 Revenue · 5 COGS · 6 OpEx · 7 Interest · 8 Income tax`. There is no jurisdiction, D&A or
   cash-flow-activity split in the GL. Do not infer one.
5. **Assuming CI/workflows can be pushed.** `.github/workflows/**` is not pushable by this app;
   changes go to `ci-patches/`. `ci-patches/0005-*.patch` is still unapplied.

## 6. Last integrity check

2026-08-19 — see `STATE.json.integrity`. Result recorded there by
`node MEMORY/_system/check.mjs`.
