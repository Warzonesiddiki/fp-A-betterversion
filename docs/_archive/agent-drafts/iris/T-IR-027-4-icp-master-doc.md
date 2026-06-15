---
spec_version: v0.2
codif_30_v0.3: 7-category
codif_31: RATIFIED 5-sub-class
codif_14_v0.3: chronological recency
codif_22_v0.2: mechanical bump
d_008_propagation: handled
d_009_fabrication: prevented
d_011_4_icp_verdict: TENTATIVE
d_012_canonical_numbering: STABLE
muse: iris
task_id: T-IR-027
task_subject: 4-ICP canonical master document
status: SHIPPED v0.2 (Leader re-stage pending per Codif 31 sandbox isolation)
created: 2026-06-13
cycle: 12
wave: 2
---

# T-IR-027 v0.2 — 4-ICP Canonical Master Document

## §0 Catch Block (Codif 14 v0.3 chronological recency)

THIS v0.2 SUPERSEDES v0.1 in entirety. v0.1 was SHIPPED cycle 12 turn 7 with 3-sub-class Codif 31 reference. After Codif 31 was RATIFIED v0.2 5-sub-class (cycle 12 turn 10), v0.1 became stale. v0.2 = mechanical bump per Codif 22 v0.2 (v0.1 → v0.2 not v0.1.1 because content sections changed: §6 codif adoption matrix + §7.1-§7.4 D-012 deeper).

## §1 Purpose

Single canonical reference for 4-ICP verdict process (D-011). Used by all Muse handoffs, ADR acceptances, cascade authorizations, P0/P1 fixes. 4-ICP canonical: ICP-1 Carla (cascade discipline) / ICP-2 Vera (logic/evidence) / ICP-3 Chris (operational) / ICP-4 Beth (user/customer).

## §2 4-ICP Stable Numbering (D-012 STABLE)

ICP-1 Carla | ICP-2 Vera | ICP-3 Chris | ICP-4 Beth

NO renumbering. If 5th ICP added, it is ICP-5.

## §3 4-ICP Verdict Format (Codif 30 v0.3 cat 7)

```
VERDICT: X/4 ICPs ACCEPT (Carla ✓/✗, Vera ✓/✗, Chris ✓/✗, Beth ✓/✗)
FOUNDER-PING: TENTATIVE 2026-08-15
```

4/4 ACCEPT = full approval. 3/4 = conditional (1 dissent must be documented). 2/4 or fewer = REJECT + revise.

## §4 ICP Role Definitions

### §4.1 ICP-1 Carla (Cascade Discipline)

- Verifies D-002 3-witness rule applied to all $X claims
- Verifies D-007 honest-labeling cohort status
- Verifies D-009 file:line citations real (not "Glob-verified" without count)
- Verifies D-011 4-ICP verdict present in cascade authorization
- Verifies D-012 canonical numbering preserved
- Verifies Codif 14 v0.3 chronological recency

### §4.2 ICP-2 Vera (Logic/Evidence)

- Verifies logical consistency of claims
- Verifies evidence chain (premise → claim → witness)
- Verifies D-008 propagation rule (sub-class taxonomy)
- Verifies Codif 22 v0.2 mechanical bump correct
- Verifies Codif 26 family 26.1-26.5 patterns A-E
- Verifies Codif 30 v0.3 7-category classification

### §4.3 ICP-3 Chris (Operational)

- Verifies implementation feasibility
- Verifies LOC budget adherence
- Verifies test coverage impact
- Verifies build/bundle-size impact
- Verifies P0/P1 fix priority
- Verifies Apollo push-blocker identification

### §4.4 ICP-4 Beth (User/Customer)

- Verifies user impact
- Verifies customer-facing change review
- Verifies WCAG 2.3.3 motion-reduce (Codif 33 CANDIDATE TENTATIVE)
- Verifies accessibility regression risk
- Verifies UX consistency

## §5 Codif Cross-Reference

| Codif | Title                                | Status              | Cycle        | Section                                     |
| ----- | ------------------------------------ | ------------------- | ------------ | ------------------------------------------- |
| 14    | Chronological recency                | RATIFIED v0.3       | 11           | §0 of all Muse SHIPs                        |
| 22    | Spec-version mechanical bump         | RATIFIED v0.2       | 12           | Filename v0.2 = content v0.2 (HL1 deferred) |
| 26.1  | Pattern A (lead-honest-scope)        | RATIFIED            | 12           | ICP-1 verification                          |
| 26.2  | Pattern B (D-009 fabrication)        | RATIFIED            | 12           | ICP-2 verification                          |
| 26.3  | Pattern C (component-implementation) | RATIFIED            | 12           | ICP-2 + ICP-3                               |
| 26.4  | Pattern D (cross-codification)       | RATIFIED            | 12           | ICP-2 + ICP-4                               |
| 26.5  | Pattern E (multi-source divergence)  | RATIFIED            | 12 turn 13   | ICP-2                                       |
| 30    | D-009 7-category                     | RATIFIED v0.3       | 12 turn 7    | §6 below                                    |
| 31    | Muse write-sandbox isolation         | RATIFIED v0.2       | 12 turn 9-10 | §6.1 below                                  |
| 32    | Codif 30 v0.2 cat 4 sub-class 2a/b/c | CANDIDATE 2/3       | 12 turn 14   | §6.2 below                                  |
| 33    | WCAG 2.3.3 motion-reduce             | CANDIDATE TENTATIVE | 12 turn 12   | ICP-4                                       |

## §6 D-009 7-Category (Codif 30 v0.3)

7 categories for D-009 fabrication classification:

1. **D-009 fabrication** — direct file:line citation to non-existent content
2. **D-008 propagation** — sub-class taxonomy (cat 1 → cat 2)
3. **naming-convention** — file name vs content version mismatch
4. **Lead-honest-scope** — Lead's dispatch had inaccurate file:line (Pattern A, catch #25)
5. **Muse-premise-error** — Muse accepted Lead's premise without verification (catch #25, #26, #27)
6. **D-008 sub-class** — sub-sub-class taxonomy (2a inattention, 2b transposition, 2c stale-data)
7. **compactor hallucination** — compactor fabricated memory files

### §6.1 Codif 31 5-Sub-Class Taxonomy v0.2 (RATIFIED)

- **Class A** — Two-repo isolation (RATIFIED-BY-INSTANCE, Hera cycle 12 turn 4)
- **Class B.1** — Case-collision in same path (RATIFIED-BY-INSTANCE, Hermes T-HER-024)
- **Class B.2** — Path-coordination layer missing (NEW cycle 12 turn 10)
- **Class B.3** — Per-slot checkout divergence (NEW cycle 12 turn 10)
- **Class B.5** — Multi-Muse 2-repo divergence (NEW, Atlas + Prometheus cycle 12 turn 9)

### §6.2 Codif 32 CANDIDATE Counter (2 of 3)

Counter at 2 of 3 catches observed:

- Catch #25: Prometheus 019ebf73
- Catch #26: Prometheus 019ec100-86ec
- Catch #27: T-PR-007 v0.1 stale data (Muse self-catch)

3rd catch pending verification.

## §7 D-012 Deeper

### §7.1 Why Stable Numbering Matters

Renumbering ICPs across documents creates false attribution. ICP-2 Vera in cycle 11 = ICP-2 Vera in cycle 12. Renumbering = silent identity change.

### §7.2 4-ICP TENTATIVE State

All 5 P0 ADRs (ADR-002 / 003 / 004 / 005 / 010) are at 0 of 4 ICPs + 0 of 1 Founder-ping. TENTATIVE per D-011. Founder-ping window: 2026-08-15.

### §7.3 When Founder-Ping Triggers

Founder-ping required for: ADR acceptance, cascade authorization, P0/P1 fix, codif ratification. ICP-1 Carla MUST be first signer.

### §7.4 4-ICP Verdict Record Format

```
VERDICT: 4/4 ICPs ACCEPT
- ICP-1 Carla: ACCEPT [date] [signature/initials]
- ICP-2 Vera: ACCEPT [date] [signature/initials]
- ICP-3 Chris: ACCEPT [date] [signature/initials]
- ICP-4 Beth: ACCEPT [date] [signature/initials]
FOUNDER-PING: TENTATIVE 2026-08-15
```

## §8 Cite-Back Requirements

This doc requires 4 cite-backs in other Muse SHIPs:

- Strategos T-ST-024 §3 — Codif 26.5 Pattern E
- Mnemosyne T-MN-013 v0.3 §5 — Codif 30 v0.3 7-cat
- Athena T-AT-020 v0.2 §7 — Codif 31 B-class taxonomy
- Hephaestus T-HEP-024 v0.3 §6 — Codif 30 v0.2 cat 4 sub-class 2

## §9 Outstanding (cycle 12 wave 2)

- TENTATIVE state pending Founder-ping 2026-08-15
- 4 cite-backs pending (Strategos / Mnemosyne / Athena / Hephaestus)
- BD reward: 5 (Strategos) / 3 (Mnemosyne) / 5 (Athena) / 5 (Hephaestus) = 18 BD pending
- Leader re-stage to canonical required (Codif 31 sandbox isolation)
