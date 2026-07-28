---
id: HUSKY_GATES_INDEX
name: Husky Gate Index
version: 0.1
date: 2026-06-17
owner: Atlas (INFRASTRUCTURE lead)
dri_by_gate:
  {
    Gate 5: Atlas,
    Gate 5b: Atlas,
    Gate 5c: Atlas,
    Gate 9: Atlas + Prometheus,
    Gate 10: Atlas + Hephaestus,
  }
total_gates: 10 (5 active, 5 proposed/pending)
status: ACTIVE
---

# Husky Gate Index

> Centralized index of all Husky gates enforcing the NEVER-AGAIN RULES and CASCADE-TRAP family detection. Gates run in `.husky/pre-push` and `.github/workflows/`.

**Owner:** Atlas (INFRASTRUCTURE lead, slot `019ecbef-8ca9-77c1-a9a6-adf43b25f673`)
**Last updated:** 2026-06-17

## Active Gates (5)

| Gate        | Name                                                            | Author             | DRI        | Catches Closed         | SHAs                                    |
| ----------- | --------------------------------------------------------------- | ------------------ | ---------- | ---------------------- | --------------------------------------- |
| **Gate 1**  | TypeScript strict                                               | Atlas              | Atlas      | —                      | 87139d08                                |
| **Gate 2**  | ESLint                                                          | Atlas              | Atlas      | —                      | 87139d08                                |
| **Gate 3**  | Vitest security-critical                                        | Atlas              | Atlas      | —                      | 87139d08                                |
| **Gate 4**  | Vite production build                                           | Atlas              | Atlas      | —                      | 87139d08                                |
| **Gate 5**  | NEVER-AGAIN RULE #55 PRE-PUSH-GHOST-SHA-CHECK v0.2 strict-regex | Atlas              | Atlas      | CATCH #187, #198       | f39d202b2                               |
| **Gate 5b** | NEVER-AGAIN RULE #41 v0.3 E.2 + F + G (Sub-class taxonomy)      | Atlas              | Atlas      | CATCH #197, #198, #199 | 87139d08                                |
| **Gate 5c** | NEVER-AGAIN RULE #60 v0.2 4-tier abort threshold                | Atlas              | Atlas      | CATCH #202             | 4c4af4aa                                |
| **Gate 10** | NEVER-AGAIN RULE #68 CASCADE-HOLD-BUNDLE Auto-Detection         | Atlas + Hephaestus | Hephaestus | CATCH #207 #4          | `.husky/pre-push` (restored 2026-07-29) |

> **Status correction (2026-07-29, F-0024 remediation):** the F-0024 rewrite of
> `.husky/pre-push` replaced the previously inert hook bundle with enforced
> product gates 1–6 (tsc, eslint, vitest security shard, vite build, bundle
> budget, version consistency). Gates 5, 5b and 5c are **RETIRED** from the hook
> pending any formal re-introduction. Gate 10 was accidentally deleted by that
> rewrite — breaking `.github/workflows/cascade-hold-check.yml` — and has been
> restored as a **hard block** per spec §2 (the advisory-to-block escalation
> date 2026-06-21 EOD has passed). Header counts in this index predate the
> rewrite.

## Proposed Gates (5)

| Gate        | Name                                                               | Author             | DRI        | Status   | ETA                                |
| ----------- | ------------------------------------------------------------------ | ------------------ | ---------- | -------- | ---------------------------------- |
| **Gate 7**  | Husky Gate 7 — author fit verification (Atlas co-sign TBD)         | Atlas              | Atlas      | PROPOSED | TBD                                |
| **Gate 9**  | NEVER-AGAIN RULE #63 BILATERAL-ATTRIBUTION-CASCADE                 | Atlas + Prometheus | Prometheus | PROPOSED | T+1d 2026-06-23+ post-RATIFICATION |
| **Gate 11** | NEVER-AGAIN RULE #68 CATCH-NUMBERING-COLLISION PREVENTION          | Mnemosyne          | Mnemosyne  | PROPOSED | TBD                                |
| **Gate 12** | NEVER-AGAIN RULE #64 PATH-SEPARATOR-DISCIPLINE                     | Calliope           | Calliope   | PROPOSED | T+1d 2026-06-23+                   |
| **Gate 13** | NEVER-AGAIN RULE #65 PRE-COMMIT-STAGED-FILE-VERIFY                 | Calliope           | Calliope   | PROPOSED | T+1d 2026-06-23+                   |
| **Gate 14** | NEVER-AGAIN RULE #67 ATTRIBUTION-DRIFT-AUTO-RECOVERY (P0 CRITICAL) | Calliope           | Calliope   | PROPOSED | T+1d 2026-06-23+                   |

## Gate 10 Detail

See `docs/security/HUSKY_GATE_10_CASCADE_HOLD_BUNDLE.md` for full spec.

**3 Detection Criteria (OR-logic):**

- A. Multi-T-IDs in commit message (T-`<MuseCode>`-`<NUMBER>`, 2+ unique IDs)
- B. Multi-Co-Authored-By lines (2+ co-authors)
- C. Cross-Muse path span (commit touches files in 2+ `docs/<muse>/` subdirs)

**Workflow:**

1. Pre-push hook detects candidate
2. Checks `docs/security/CASCADE_HOLD_LEDGER.md` for `CHB.*<short_sha>` pattern
3. If not found, BLOCKS push with remediation message
4. User adds CHB-XXX entry, then re-pushes

**CI integration:** `.github/workflows/cascade-hold-check.yml` validates ledger entries on every push + PR.

## Gate 9 Detail (PROPOSED)

See Atlas's RULE #60 v0.1 co-sign §3 for full spec (`docs/codif/ENDORSEMENTS/ATLAS_COSIGN_CODIF_60_V0_1.md`).

**Detection criteria:**

- Commit message has bilateral Muse mentions (e.g., "Apollo + Iris collaborated on T-MN-049 v1")
- Each Muse has their own co-sign file referencing the other's SHA
- RULE #50 attribution ledger would show BOTH Muses as primary authors of same work

**Workflow:**

1. Pre-push hook extracts `slot [0-9a-f-]{36}` mentions
2. If 2+ mentions, requires 2+ co-sign files in `docs/codif/ENDORSEMENTS/`
3. If <2 co-sign files, BLOCKS push with remediation

**ETA:** T+1d 2026-06-23+ post-RATIFICATION

## Adding a New Gate

1. Author spec file at `docs/security/HUSKY_GATE_<N>_<NAME>.md` with 11 sections (Purpose, Detection, Ledger/Schema, Hook Implementation, Active Entries, CI Integration, NEVER-AGAIN Linkage, Co-author Solicitation, CWE/SOC 2/GDPR/CCPA Mapping, 4-ICP Verdict, Next Steps)
2. Add Gate detection logic to `.husky/pre-push` with `Gate <N>:` comment header
3. Create CI workflow at `.github/workflows/<gate>-check.yml` (or extend existing)
4. Add test file at `tests/security/HuskyGate<N>.test.sh` (40+ tests, 100% PASS required)
5. Add row to Active Gates table above
6. Get joint DRI sign-off + Strategos 5-ICP verdict
7. Commit with Husky Gate convention: `feat(husky): Gate <N> <NAME> v0.1 DRAFT`
8. PUSH to origin/main

## NEVER-AGAIN RULES Enforced

- **Gate 5** → RULE #55 PRE-PUSH-GHOST-SHA-CHECK
- **Gate 5b** → RULE #41 CASCADE-TRAP family v0.3 (Sub-classes A-G)
- **Gate 5c** → RULE #60 CASCADE-HOLD-ABORT-MERGE TRAP v0.2 (4-tier)
- **Gate 9** → RULE #63 BILATERAL-ATTRIBUTION-CASCADE
- **Gate 10** → RULE #68 CATCH-NUMBERING-COLLISION PREVENTION (also enforces RULE #47, #50, #60, #61)
- **Gate 11** → RULE #68 CATCH-NUMBERING-COLLISION (catalog)
- **Gate 12** → RULE #64 PATH-SEPARATOR-DISCIPLINE
- **Gate 13** → RULE #65 PRE-COMMIT-STAGED-FILE-VERIFY
- **Gate 14** → RULE #67 ATTRIBUTION-DRIFT-AUTO-RECOVERY (P0)

---

**Atlas INFRASTRUCTURE lead signature:** `slot 019ecbef-8ca9-77c1-a9a6-adf43b25f673` — 2026-06-17 CYCLE 15 PICK A — Husky Gate 10 SHIPPED.
