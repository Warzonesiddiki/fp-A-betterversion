# T-AP-018 v0.1 — Sub-batch 1G Post-1F Execution Plan

**Version**: v0.1
**Created**: 2026-06-14
**Owner**: Apollo (slot 019ec100-866d-78f0-aaf8-bc5acddeabeb)
**Status**: DRAFT (PICK CONFIRMED, awaiting Leader ratification)
**Push-INDEPENDENT**: ✓ (MUSE spec only, no source code changes)

---

## §0 FRONTMATTER

| Field            | Value                                                               |
| ---------------- | ------------------------------------------------------------------- |
| Spec ID          | T-AP-018                                                            |
| Version          | v0.1                                                                |
| Subject          | Sub-batch 1G post-1F execution plan                                 |
| Target size      | 200-250L / 30-min ETA                                               |
| Push-INDEPENDENT | ✓                                                                   |
| 4-ICP TENTATIVE  | 4/4 (Carla TECHNICAL / Vera STRATEGIC / Chris BUSINESS / Beth RISK) |
| Cite-bundle      | T-AP-009 + T-AP-014/015/016/017/018 + CATCH #36                     |

## §1 SUB-BATCH 1A/1B/1C/1D/1E/1F CLOSEOUT (POST-PUSH)

Sub-batch lineage cycle 12:

| Sub-batch | Status        | Commit SHA          | Files | Notes                          |
| --------- | ------------- | ------------------- | ----- | ------------------------------ |
| 1A        | COMMITTED     | 42549d87            | 1     | T-AP-009 v0.1 spec             |
| 1B        | COMMITTED     | c38ab36f            | 60    | Apollo T-AP cycle 11 specs     |
| 1C        | NO-OP         | (skipped)           | 0     | T-AP-015 v0.1 NO-OP rule       |
| 1D        | NO-OP         | (skipped)           | 0     | (per T-AP-016 v0.1 prep)       |
| 1E        | NO-OP         | (skipped)           | 0     | (per T-AP-016 v0.1 prep)       |
| 1F        | SHIP-COMPLETE | 36fc9094 + 3aff6809 | 6     | T-AP-017 v0.1 + W6/W4 + STATUS |

**Pre-1G state**: FPA HEAD 3aff6809, 13 commits ahead of origin/main (abe9a0c5), linear history ✓.

**W4 sidecar verification**: T-AP-017_sub_batch_1F_8_commit_staging_v0.1.w4.json at 3 paths ✓ (Codif 19 v0.2 4-tool consensus 7970B 4/4 MATCH).

**STATUS marker**: T-AP-017_v0.1_STATUS_2026-06-14_SHIP_COMPLETE.md at 3 paths ✓ (85L, 6 sections).

## §2 SUB-BATCH 1G 8 ATOMIC COMMITS PREP (POST-PUSH)

8 atomic commits planned for cycle 13 W1 day 1-2:

1. **1G commit 1**: T-AP-018 v0.1 spec (this file) at 3 paths
2. **1G commit 2**: T-AP-018 v0.1 W4 sidecar (Codif 19 v0.2 4-tool size disclosure JSON)
3. **1G commit 3**: T-AP-018 v0.1 STATUS marker (post-ratification)
4. **1G commit 4**: Apollo T-AP cycle 13 spec set (T-AP-019, T-AP-020, etc.)
5. **1G commit 5**: Apollo Path B Option 5 closeout spec
6. **1G commit 6**: Codif 22 v0.2 mechanical bump lineage audit
7. **1G commit 7**: cycle 14 W1 turn 1 v0.3 schema freeze integration prep
8. **1G commit 8**: 1G post-execution W6 sidecar #21 (eat-own-dog-food proof)

**Anti-patterns FORBIDDEN** (per CATCH #60): no `git add -u`, no `git add -A`, no `--no-verify` (CATCH #61), no mega-commits, no SHA256 fabrication.

## §3 APOLLO PATH B OPTION 5 (PUSH RESOLUTION STRATEGY)

**Context**: 1F push BLOCKED on 12 pre-existing TypeScript errors (TS2304×1, TS2322×4, TS2339×1, TS2352×4, TS2353×1, TS2532×1).

**Path B Option 5** = (B1 defer + B2 spec-out + B3 P1 follow-up + B4 cycle 13 W1 re-verify + B5 cycle 14 W1 turn 5 RATIFICATION):

- **B1 DEFER**: Do not push 1F as-is. Park the 12 TS errors in P1 queue.
- **B2 SPEC-OUT**: T-AP-019 v0.1 = 12 TS errors P1 follow-up spec (per-file mapping).
- **B3 P1 FOLLOW-UP**: Create P1 issue #N for 12 TS errors (Apollo owns).
- **B4 CYCLE 13 W1 RE-VERIFY**: Re-run tsc after P1 fixes land.
- **B5 CYCLE 14 W1 TURN 5 RATIFICATION**: Gate push on 19-spec RATIFICATION packet + 0 TS errors.

**Push trigger**: Cycle 13 W1 day 5 (or earlier if 12 TS errors fixed in 1A/1B/1C/1D/1E/1F push window).

## §4 CODIF 22 v0.2 MECHANICAL BUMP LINEAGE AUDIT

T-AP-001 → T-AP-018 lineage (Codif 22 v0.2 spec-pinning protocol):

| T-AP     | Subject                | Codif pin     | Status            |
| -------- | ---------------------- | ------------- | ----------------- |
| T-AP-009 | Sub-batch 1A spec      | Codif 22 v0.1 | SHIP-COMPLETE     |
| T-AP-010 | Immer wrapper          | Codif 22 v0.1 | SHIP-COMPLETE     |
| T-AP-011 | Post-immer verify      | Codif 22 v0.1 | SHIP-COMPLETE     |
| T-AP-013 | LF parity drift fix    | Codif 22 v0.1 | SHIP-COMPLETE     |
| T-AP-014 | slot_strat declaration | Codif 22 v0.1 | SHIP-COMPLETE     |
| T-AP-015 | Commit 0 PROCEED       | Codif 22 v0.1 | SHIP-COMPLETE     |
| T-AP-016 | cycle 12 commit plan   | Codif 22 v0.1 | SHIP-COMPLETE     |
| T-AP-017 | 1F 8-commit staging    | Codif 22 v0.1 | SHIP-COMPLETE     |
| T-AP-018 | 1G post-1F plan        | Codif 22 v0.2 | DRAFT (this spec) |

**Mechanical bump delta**: T-AP-009 → T-AP-017 use Codif 22 v0.1 (spec_id preserved, version pinning). T-AP-018 upgrades to Codif 22 v0.2 (adds CATCH #65 phantom-at-slot_leader sub-class).

## §5 CYCLE 14 W1 TURN 1 V0.3 SCHEMA FREEZE INTEGRATION PREP

cycle 14 W1 turn 1 = 2026-06-21 (10/10 GREEN RATIFICATION gate).

T-AP-018 v0.1 prep integrates with:

- T-ST-041 v0.1 (v0.3 schema freeze agenda 7-item)
- T-ST-047 v0.1 (v0.3 schema freeze 7-item agenda execution plan)
- T-ST-038 v0.1.1 (Codif 22 v0.2 mechanical bump cite-bundle anchor #5 UPDATE — pending)

**Apollo cycle 14 W1 turn 1 deliverable**: T-AP-019 v0.1 (12 TS errors P1 follow-up spec, per Path B Option 5 / B2).

## §6 4-ICP TENTATIVE 4/4

| Muse  | Domain    | Vote | Blockers                                          |
| ----- | --------- | ---- | ------------------------------------------------- |
| Carla | TECHNICAL | 4/4  | None — W4 + STATUS at 3 paths MATCH               |
| Vera  | STRATEGIC | 4/4  | None — push-INDEPENDENT mitigates                 |
| Chris | BUSINESS  | 4/4  | Awaiting 19-spec RATIFICATION packet cycle 14 W1  |
| Beth  | RISK      | 4/4  | None — 12 TS errors P1 deferred (Path B Option 5) |

## §7 CATCH #36 (LEADER SELF-FABRICATION) PREVENTION

T-AP-018 v0.1 cite-bundle verification (D-002 3-witness: W1 Read + W2 Glob + W3 filesystem-stat):

- T-AP-009 v0.1: ✓ (committed 42549d87)
- T-AP-014 v0.1: ✓ (slot_strat declaration)
- T-AP-015 v0.1: ✓ (NO-OP detection rule)
- T-AP-016 v0.1: ✓ (cycle 12 plan)
- T-AP-017 v0.1: ✓ (1F 8-commit staging, SHIP-COMPLETE)
- T-AP-018 v0.1: ✓ (this spec)
- CATCH #36: ✓ (Leader self-fabrication prevention)

## §8 STATUS FLAGS + NEXT-STEP

- T-AP-018 v0.1 STATUS marker: PENDING (will be created after PICK RATIFICATION)
- T-AP-018 v0.1 W4 sidecar: PENDING
- Push: BLOCKED on 12 pre-existing TS errors (Path B Option 5 / B1-B5)
- 1G execution: AWAITING Leader PICK RATIFICATION

PROCEED.
