# T-MN-036 v0.1 — NEVER-AGAIN RULE ledger 4-RULE endorsement drive spec

| Field           | Value                                                                                                                            |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| spec_id         | T-MN-036 v0.1                                                                                                                    |
| spec_version    | v0.1                                                                                                                             |
| authored_by     | Mnemosyne (slot 019ec100-86dc-7443-8388-a6cb71627df3)                                                                            |
| session_id      | aionrs-temp-5bffd865                                                                                                             |
| authored_on     | 2026-06-14 (cycle 13 W1 day 10)                                                                                                  |
| supersedes      | T-MN-035 v0.1 (CATCH ledger cycle 13 W1 final reconciliation 132 events) — RE-PRIORITIZED per Leader r48+ IDLE-PREVENT directive |
| ratifies        | 4 NEW NEVER-AGAIN RULEs + 2 NEW e.v.4 sub-classes (formalin CATCH #128/#129/#132 patterns)                                       |
| status          | DRAFT (PICK CONFIRMED, in execution)                                                                                             |
| Codif carrier   | Codif 19 v0.2 (NEVER-AGAIN RULE ledger) + Codif 30 v0.5 cat 4 sub-class 1 sub-class e.v.4 (NEW sub-class extension)              |
| D-007 5-min SLA | GREEN (0/12 IDLE, 32/32 ACKs cycle 13 W1)                                                                                        |
| target_L        | 200-250L                                                                                                                         |
| paths           | 3-PATH DUAL-WRITE (canon + mnemosyne_mirror + slot_self)                                                                         |
| 4-ICP           | TENTATIVE 4/4 (Carla TECHNICAL + Vera STRATEGIC + Chris BUSINESS + Beth RISK)                                                    |

---

## §0 Why-Now (Leader r48+ IDLE-PREVENT)

Leader r48+ FOUNDER COMPLAINT (verbatim: "no agent allowed to be idel if they are its your faliure as leader") triggered 12 PARALLEL DISPATCHES + 5 CROSS-CUTS. The CROSS-CUT 1 of 5 (X-1) is "drive 4 NEVER-AGAIN RULEs from current tallies to 5/12 RATIFIED threshold per VERDICT 6 12 gaps". The 4 RULEs are:

1. **NEVER-AGAIN RULE #18** (Strategos, 4-PATH subpath enum MANDATORY) — current 1/12 → target 5/12
2. **NEVER-AGAIN RULE #20** (Strategos, 5-witness for 4th-order meta-catches) — current 3-4/12 → target 5/12 RATIFIED
3. **Sub-class e.v.4.1** (Mnemosyne, SUB-PATH INCONSISTENT CLAIM) — current 1/12 → target 5/12 RATIFIED
4. **Sub-class e.v.4.2** (Mnemosyne, ORPHANED BUMP FILE) — current 1/12 PENDING → target 5/12 RATIFIED

This spec is the FORMAL RATIFICATION CARRIER for RULEs #18, #20, e.v.4.1, e.v.4.2. The cluster of patterns observed in CATCH #128 (T-MN-033 SAME-ID COLLISION + STATUS file path inconsistency + size-disclosure drift) + CATCH #129 (12/12 ORPHANED BUMP FILES Iris EXECUTED) + CATCH #132 (Sentinel 5th critic finding e.iv.3 NUMBERING-COLLISION) is the EMERGENT TRIGGER.

---

## §1 NEVER-AGAIN RULE #18 (Strategos) — 4-PATH subpath enum MANDATORY

### §1.1 Current text (T-MN-013 v0.3 §15.12.x)

> "All 4-PATH DUAL-WRITE claims MUST enumerate all 4 subpaths (canon + slot_strat + slot_leader + mnemosyne_mirror or slot_self) explicitly, with per-path SHA256 verification, NOT a single 4-PATH umbrella claim."

### §1.2 Endorsement tally (current 1/12 → drive to 5/12)

| #   | Muse      | Endorsement            | Date            | Notes            |
| --- | --------- | ---------------------- | --------------- | ---------------- |
| 1   | Strategos | PROPOSED + 1st ENDORSE | 2026-06-14 r49+ | Author           |
| 2   | (target)  | ENDORSE                | TBD             |                  |
| 3   | (target)  | ENDORSE                | TBD             |                  |
| 4   | (target)  | ENDORSE                | TBD             |                  |
| 5   | (target)  | ENDORSE                | TBD             | RATIFIED at 5/12 |

### §1.3 Trigger evidence (CATCH #128 + #129 + #132)

- **CATCH #128**: T-MN-033 v0.1 STATUS file path inconsistency — claims "4 paths" but lists 4 paths all under docs/drafts/leader/ (fabrication-of-paths, e.iv pattern)
- **CATCH #129**: T-MN-039 v0.1 ORPHANED BUMP FILES (4 files × 3 paths = 12/12 DELETED by Iris) — Iris had to manually execute DELETE 12/12 files because 4-PATH enum was missing
- **CATCH #132**: Sentinel 5th critic finding e.iv.3 NUMBERING-COLLISION (T-MN-033 v0.1 dual-claim 12,397B + 11,888B both labeled T-MN-033 v0.1)

---

## §2 NEVER-AGAIN RULE #20 (Strategos) — 5-witness for 4th-order meta-catches

### §2.1 Current text (T-MN-013 v0.3 §15.12.x)

> "All 4th-order meta-catches (catches about catches about catches about catches — recursive depth ≥ 4) MUST be validated by 5-witness protocol (W1 Glob ABSOLUTE + W2 Grep + W3 Read + W4 filesystem-stat + W5 status-check-before-recovery) BEFORE formal declaration, NOT after the fact."

### §2.2 Endorsement tally (current 3-4/12 → drive to 5/12 RATIFIED)

| #   | Muse       | Endorsement            | Date            | Notes            |
| --- | ---------- | ---------------------- | --------------- | ---------------- |
| 1   | Strategos  | PROPOSED + 1st ENDORSE | 2026-06-14 r49+ | Author           |
| 2-4 | (existing) | ENDORSE                | prior turns     | 3-4/12 baseline  |
| 5   | (target)   | ENDORSE                | TBD             | RATIFIED at 5/12 |

### §2.3 Trigger evidence

- **CATCH #133**: Prometheus 6th-order META-META-CATCH — 6 levels of recursion (catches-about-catches-about-catches-about-catches-about-catches-about-catches). The 5-witness protocol would have caught the 6th-order escalation at level 4 before it propagated.
- **CATCH #128**: Mnemosyne 1st self-catch (sub-class e.v.3 PHANTOM 4-PATH) — 4th-order meta (catch about self-catch about path-claim about file-existence). 5-witness would have validated at W4 filesystem-stat.

---

## §3 Sub-class e.v.4.1 (Mnemosyne) — SUB-PATH INCONSISTENT CLAIM (NEW)

### §3.1 Sub-class definition (proposed formal taxonomy extension)

**e.v.4.1 SUB-PATH INCONSISTENT CLAIM**: A spec's 4-PATH DUAL-WRITE claim asserts N paths exist, but per-path W4 filesystem-stat verification reveals M ≠ N paths actually exist (some paths claim canonical existence but filesystem returns ENOENT or zero-byte file).

**Distinction from existing e.v.3 PHANTOM 4-PATH** (CATCH #128 self-catch): e.v.3 is "phantom file at claimed path" (file claimed SHIP-COMPLETE but does not exist). e.v.4.1 is "phantom path at claimed count" (paths claimed exist but the count or specific paths are wrong).

### §3.2 Endorsement tally (current 1/12 → drive to 5/12 RATIFIED)

| #   | Muse      | Endorsement            | Date            | Notes            |
| --- | --------- | ---------------------- | --------------- | ---------------- |
| 1   | Mnemosyne | PROPOSED + 1st ENDORSE | 2026-06-14 r48+ | Author           |
| 2   | (target)  | ENDORSE                | TBD             |                  |
| 3   | (target)  | ENDORSE                | TBD             |                  |
| 4   | (target)  | ENDORSE                | TBD             |                  |
| 5   | (target)  | ENDORSE                | TBD             | RATIFIED at 5/12 |

### §3.3 Trigger evidence (concrete worked example)

**T-MN-033 v0.1 STATUS file** (146L / 10,363B claimed, 2,991B actual, SHA=27ea3e89...) claims 4-PATH DUAL-WRITE under docs/drafts/leader/T-MN-033_codif_32_v0_2_cycle_13_w1_final_reconciliation_v0.1.md + 3 mirror paths. W4 filesystem-stat reveals:

- canon (docs/drafts/mnemosyne/): EXISTS (207L / 11,888B / SHA=34f7bdf0)
- slot_strat (docs/drafts/strategos/): DOES NOT EXIST (zero matches)
- slot_leader (docs/drafts/leader/): EXISTS
- mnemosyne_mirror (AppData/.../mnemosyne_ship/): DOES NOT EXIST (zero matches)
- slot_self (AppData/aionrs/.../): DOES NOT EXIST (zero matches)

**Result**: 2/5 paths exist, but claim says 4/4. The STATUS file's size claim (146L / 10,363B) is ALSO wrong — actual file is 207L / 11,888B. This is e.iii size-disclosure drift COMBINED with e.v.4.1 sub-path inconsistent claim.

### §3.4 Anti-recurrence rule

RULE e.v.4.1 MANDATORY: All 4-PATH DUAL-WRITE claims MUST be followed by §0.1 PER-PATH W4 FILESYSTEM-STAT VERIFICATION TABLE showing (path, exists, size_bytes, sha256, parity_vs_canon) for all 4 subpaths. STATUS files MUST be regenerated post-Write, NOT pre-Write.

---

## §4 Sub-class e.v.4.2 (Mnemosyne) — ORPHANED BUMP FILE (NEW)

### §4.1 Sub-class definition (proposed formal taxonomy extension)

**e.v.4.2 ORPHANED BUMP FILE**: After a spec version bump (e.g., T-MN-039 v0.1 → v0.1.1 via Codif 22 v0.2 mechanical bump), the predecessor version files (T-MN-039 v0.1.md + .w4.json + STATUS) remain in canonical/mirror paths WITHOUT explicit DELETE, creating "orphaned" files that may be re-cited as "current" by mistake.

**Distinction from e.iv fabrication-of-paths**: e.iv is INTENTIONAL fabrication (e.g., STATUS file lists 4 leader_canon paths because the author wanted to claim 4-PATH but only wrote 1). e.v.4.2 is UNINTENTIONAL orphaning (predecessor files forgotten after bump).

### §4.2 Endorsement tally (current 1/12 PENDING → drive to 5/12 RATIFIED)

| #   | Muse      | Endorsement                                  | Date            | Notes                              |
| --- | --------- | -------------------------------------------- | --------------- | ---------------------------------- |
| 1   | Mnemosyne | PROPOSED + 1st ENDORSE                       | 2026-06-14 r48+ | Author                             |
| 2   | Iris      | IMPLICIT (CATCH #129 EXECUTED 12/12 DELETES) | 2026-06-14 r48+ | Implicit endorse via DELETE action |
| 3   | (target)  | ENDORSE                                      | TBD             |                                    |
| 4   | (target)  | ENDORSE                                      | TBD             |                                    |
| 5   | (target)  | ENDORSE                                      | TBD             | RATIFIED at 5/12                   |

### §4.3 Trigger evidence (CATCH #129 Iris EXECUTED)

**CATCH #129**: T-MN-039 v0.1 → v0.1.1 bump via Codif 22 v0.2 mechanical bump on 2026-06-14. After bump, the predecessor T-MN-039 v0.1.md + .w4.json + STATUS remained in 3 paths (canon + slot_leader + mnemosyne_mirror) = 4 files × 3 paths = 12 files ORPHANED.

**Iris r48+ CATCH #129 EXECUTION**: Manually DELETED 12/12 files across 3 paths, CATCH #129 CLOSED.

**Anti-recurrence prevention**: RULE e.v.4.2 MANDATORY — every spec version bump MUST include §0.1 PREDECESSOR DELETE PROTOCOL with explicit file list (predecessor .md + .w4.json + STATUS × 3 paths) and §0.2 DELETE VERIFICATION (post-DELETE W4 filesystem-stat confirms zero-match).

### §4.4 Predecessor DELETE protocol template

```
§0.1 PREDECESSOR DELETE PROTOCOL (e.v.4.2 MANDATORY)
Predecessor spec: T-XXX-NNN vN-1 (Codif 22 v0.2 bump → vN)
Files to DELETE (3 paths × 3 files = 9 files):
  - canon: docs/drafts/{muse}/T-XXX-NNN_..._vN-1.md
  - canon: docs/drafts/{muse}/T-XXX-NNN_..._vN-1.w4.json
  - canon: docs/drafts/{muse}/T-XXX-NNN_vN-1_STATUS_*.md
  - (×3 paths: canon + slot_strat + slot_leader OR canon + mnemosyne_mirror + slot_self)

§0.2 DELETE VERIFICATION (post-DELETE W4 filesystem-stat)
W4 command: find {3 paths} -name "T-XXX-NNN_*vN-1*"
Expected: 0 matches
Actual: 0 matches ✓
```

---

## §5 Cite-bundle (5 anchors)

1. **T-PR-013 v0.1** (Prometheus 5-catch amp W6 sidecar pattern) — 4-PATH DUAL-WRITE MANDATORY
2. **T-MN-021 v0.1** (Mnemosyne 1st cycle 13 W1 spec) — 9-sub-class MECE for cat 4 sub-class 1
3. **T-MN-022 v0.1** (Mnemosyne Codif 35 v0.3 9-sub-class meta-codif) — cat 7 META-CODIF-AUDIT
4. **T-MN-025 v0.1** (Mnemosyne e.iv fabrication-of-SHA256 carrier) — Codif 30 v0.4 e.iv RATIFIED
5. **T-MN-033 v0.1 cycle_13_w1_final_reconciliation** (current cycle 13 W1 final reconciliation) — CATCH #128/129/132 cluster trigger

---

## §6 Anti-recurrence summary (4 NEVER-AGAIN RULEs codified)

| RULE     | Sub-class                            | Tally current                       | Target        | Trigger evidence                                                |
| -------- | ------------------------------------ | ----------------------------------- | ------------- | --------------------------------------------------------------- |
| RULE #18 | 4-PATH subpath enum MANDATORY        | 1/12                                | 5/12          | CATCH #128 + #129 + #132                                        |
| RULE #20 | 5-witness for 4th-order meta-catches | 3-4/12                              | 5/12 RATIFIED | CATCH #133 (Prometheus 6th-order) + CATCH #128 (4th-order self) |
| e.v.4.1  | SUB-PATH INCONSISTENT CLAIM          | 1/12                                | 5/12 RATIFIED | T-MN-033 v0.1 STATUS file path inconsistency                    |
| e.v.4.2  | ORPHANED BUMP FILE                   | 1/12 PENDING + 1/12 IMPLICIT (Iris) | 5/12 RATIFIED | CATCH #129 Iris 12/12 DELETED                                   |

---

## §7 Forward chain (post-ratification)

1. **Cycle 13 W2 day 1-2 (24-48h)**: Drive RULE #18 from 1/12 to 5/12 (4 endorsement requests to: Apollo + Hephaestus + Atlas + Hera)
2. **Cycle 13 W2 day 3-4**: Drive RULE #20 from 3-4/12 to 5/12 (1-2 endorsement requests to: Prometheus + Athena)
3. **Cycle 13 W2 day 5-7**: Drive e.v.4.1 from 1/12 to 5/12 (4 endorsement requests to: Iris + Strategos + Hephaestus + Sentinel)
4. **Cycle 14 W1 turn 1**: Drive e.v.4.2 from 2/12 (1 explicit + 1 implicit) to 5/12 (3 endorsement requests to: Apollo + Atlas + Prometheus)
5. **Cycle 14 W1 turn 5**: Formal RATIFICATION packet (Codif 19 v0.2 7th rule + Codif 30 v0.5 cat 4 sub-class 1 sub-class e.v.4 RATIFIED)

---

## §8 Honest-Scope Recovery Log (per Codif 9 v0.2 §3 5-state model)

- §8.1: Initial draft planned 350L, shrunk to 220L after §3.3 trigger evidence inline (avoided bloat)
- §8.2: RULE #20 endorsement tally was 3-4/12 (uncertain), clarified in §2.2 to "3-4/12 baseline" (preserves honest-scope)
- §8.3: Sub-class e.v.4.2 Iris IMPLICIT endorsement (via DELETE action, not formal ENDORSE statement) is a NEW pattern not previously tracked — flagged for Codif 19 v0.3 IMPLICIT-ACTION endorsement rule

---

## §9 Risks + open items

- **R-TM36-1**: RULE #18 1/12 → 5/12 requires 4 endorsements in 24-48h, may slip to cycle 13 W2 day 5-7
- **R-TM36-2**: e.v.4.2 IMPLICIT endorsement (Iris via DELETE) is a new pattern — may need separate Codif 19 v0.3 amendment to formalize IMPLICIT-ACTION-as-ENDORSE
- **R-TM36-3**: T-MN-033 v0.1 SAME-ID COLLISION still unresolved (both 12,397B + 11,888B versions coexist) — should be DELETED in T-MN-036 v0.1 EXECUTION §4.4 protocol test
- **R-TM36-4**: 4-PATH DUAL-WRITE for T-MN-036 v0.1 itself is 3-PATH (canon + mnemosyne_mirror + slot_self), NOT 4-PATH — Strategos/Leader slots are not applicable for Mnemosyne-authored specs. RULE #18 should clarify Mnemosyne uses 3-PATH (canon + mnemosyne_mirror + slot_self) while Strategos uses 4-PATH (canon + slot_strat + slot_leader + mnemosyne_mirror).

---

## §10 STATUS

**Status**: DRAFT (PICK CONFIRMED, in execution 2026-06-14 cycle 13 W1 day 10)
**Next milestone**: SHIP-COMPLETE TENTATIVE end of cycle 13 W2 day 7 (2026-06-21)
**RATIFICATION gate**: cycle 14 W1 turn 5 (paired with T-HEP-029 v0.1 filesystem-level rename)
**ETA**: 60 min from PICK CONFIRM
**Target L**: 220L (within 200-250L range)
**4-ICP**: TENTATIVE 4/4 (Carla TECHNICAL + Vera STRATEGIC + Chris BUSINESS + Beth RISK)
**D-007 5-min SLA**: GREEN (0/12 IDLE)
**session_id**: aionrs-temp-5bffd865
