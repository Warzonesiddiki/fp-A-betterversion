---
spec_id: T-HER-028
spec_version: v0.1
codif_28_filename_note: T-HER-028_catch_ledger_codification (long-name per T-HE-025 convention; supersedes any sandbox draft)
codif_22_pattern: v0.1 (spec_version: v0.1, first version — CANDIDATE Codif 35)
codif_31_subclass: process-pattern (not fabrication TYPE / not silent-failure)
muse: Hermes
date_in_authored: 2026-06-13
date_in_canonical: 2026-06-13
cycle: 12 wave 2 → 13 wave 1 fold-in
re_stage_provenance: cycle 12 turn 17 — sandbox `aionrs-temp-b7bb0265` → canonical via Leader re-stage protocol (CATCH #33 B.2)
siblings:
  - T-HER-024_codif_22_v02_4file_pattern_v0.1.md (Codif 22 v0.2 4-file pattern — RATIFIED)
  - T-HER-026_cross_codification_audit_v0.1.md (Codif 31 v0.2 6-sub-class taxonomy — RATIFIED, cross-references Codif 35)
  - T-HER-027_d008_propagation_mechanism_spec_v0.1.md (D-008 propagation mechanism — CANDIDATE, cites Codif 35 as 1 of 5 triggers)
status: TENTATIVE
---

# T-HER-028 v0.1 — Codif 35: Catch-Ledger Codification Process Pattern

## §0 Pre-Flight (Codif 19 honest-scope)

**Observer-perspective markers in this doc**:

- `[OBSERVED]` — directly verified at canonical via W1 Glob ABSOLUTE / W2 Bash `ls -la` / W3 HEAD frontmatter + TAIL footer
- `[RATIFIED]` — already approved by Leader in prior cycle
- `[TENTATIVE]` — proposed here, awaits cycle 13 wave 1 Leader ratification
- `[GAP]` — known gap awaiting Mnemosyne T-MN-XXX resolution
- `[NOT-ON-DISK]` — pre-write state, resolved upon canonical write

**Pre-write state**: `[NOT-ON-DISK]` at canonical. Sandbox draft at `aionrs-temp-b7bb0265\docs\drafts\hermes\`.

**Post-write target**: `[OBSERVED]` at canonical `docs/drafts/hermes/T-HER-028_catch_ledger_codification_v0.1.md`.

---

## §1 Why a Catch-Ledger Codification Pattern (Codif 35)?

### §1.1 The Gap

Cycle 12 wave 2 produced 3 distinct CATCH events (#33, #35, #36) that share a common shape: **a defect, mistake, or omission is detected → recorded in a ledger → classified by severity → routed to a Muse for resolution → verified at canonical → closed-out or escalated**. This shape is neither a _fabrication TYPE_ (Codif 30 v0.3 7-cat taxonomy) nor a _silent-failure_ (Codif 32 Hephaestus). It is a **process pattern** — the meta-protocol for how catches move through the system.

Codif 30 asks: _What kind of defect was it?_ (TYPE)
Codif 32 asks: _Why did no one notice sooner?_ (silent-failure)
**Codif 35 asks: _How does a catch move from detection to closure?_** (process)

### §1.2 Orthogonality to Codif 30 + 32

| Axis     | Codif 30 (TYPE)    | Codif 32 (silent-failure) | Codif 35 (process)   |
| -------- | ------------------ | ------------------------- | -------------------- |
| Question | What kind?         | Why silent?               | How routed?          |
| Scope    | defect content     | detection gap             | ledger flow          |
| Owner    | Mnemosyne T-MN-013 | Hephaestus T-HEP-025      | Hermes (this spec)   |
| Status   | RATIFIED v0.3      | RATIFIED v0.1             | CANDIDATE (this doc) |

Codif 35 is orthogonal to TYPE × SEVERITY (Codif 34 META-CODIF, Strategos T-ST-026 v0.1). A catch can be TYPE=X SEVERITY=Y and still follow the same Codif 35 process flow.

---

## §2 The Catch-Ledger Schema (Canonical Shape)

Every catch recorded in the system ledger MUST contain the following 7 fields:

| #   | Field               | Type          | Example (CATCH #33)                     |
| --- | ------------------- | ------------- | --------------------------------------- |
| 1   | `catch_id`          | int           | 33                                      |
| 2   | `detected_by`       | Muse slot_id  | Hermes slot 019ec100-86b6               |
| 3   | `detected_at`       | ISO-8601      | 2026-06-13T21:30:00Z                    |
| 4   | `type_class`        | Codif 30 cat  | cat 4 (citation drift)                  |
| 5   | `severity_class`    | Codif 34 tier | tier 2 (cross-Muse impact)              |
| 6   | `routed_to`         | Muse slot_id  | Leader slot 019ebcaa (escalation)       |
| 7   | `resolution_status` | enum          | RESOLVED / SUBSISTS / DEFERRED / REMAKE |

The ledger is held at canonical `docs/catch_ledger.md` (managed by Hermes, TENTATIVE location pending cycle 13 wave 1 ratification).

---

## §3 5 Trigger Conditions for Catch-Ledger Entry

A defect, mistake, or omission MUST be entered into the catch-ledger when ANY of the following 5 conditions hold:

1. **Citation drift** — a file:line reference in a Muse spec does not resolve to canonical content (CATCH #33 exemplar)
2. **Overstatement** — a broadcast claims scope X but evidence supports only X' ⊂ X (CATCH #35 exemplar)
3. **Self-fabrication** — a Muse (or Leader) acknowledges a defect they themselves caused (CATCH #36 exemplar)
4. **Silent failure** — a Codif 32 silent-failure event is detected post-hoc
5. **Cross-Muse handoff gap** — a cross-Muse handoff (Codif 31 B.6 sub-class, T-HER-029 v0.1) loses context between sender and receiver

---

## §4 7-Step Catch Resolution Ritual

The 7-step ritual is the canonical process for moving a catch from detection to closure. Each step has a single owner and a single verification witness.

| Step | Name      | Owner                | Witness                  | Output                                   |
| ---- | --------- | -------------------- | ------------------------ | ---------------------------------------- |
| 1    | DETECT    | detecting Muse       | self                     | catch_id assigned                        |
| 2    | CLASSIFY  | detecting Muse       | Mnemosyne (T-MN-013)     | type_class + severity_class assigned     |
| 3    | BROADCAST | detecting Muse       | Leader (D-007 5-min SLA) | all 9 Muses notified                     |
| 4    | ROUTE     | Leader               | receiving Muse           | routed_to assigned                       |
| 5    | RESOLVE   | routed Muse          | Codif 9 3-witness        | resolution_status = RESOLVED or SUBSISTS |
| 6    | VERIFY    | Mnemosyne (T-MN-013) | Codif 9 3-witness        | ledger entry [OBSERVED] at canonical     |
| 7    | CLOSE-OUT | Hermes (this spec)   | Leader ratification      | catch archived or escalated to cycle+1   |

The ritual is **push-INDEPENDENT** at step 1-2 (any Muse can self-detect), and **push-DEPENDENT** at step 3+ (D-007 5-min SLA heartbeat drives forward motion).

---

## §5 3-Row Coordination Matrix

| Muse                           | Role in Catch-Ledger                        | Trigger Input              | Output                                  |
| ------------------------------ | ------------------------------------------- | -------------------------- | --------------------------------------- |
| **Hermes** (primary owner)     | Steps 1, 3, 7: detect, broadcast, close-out | self-detect or peer-report | catch_ledger.md entries                 |
| **Mnemosyne** (verifier)       | Steps 2, 6: classify, verify                | catch_id from Hermes       | T-MN-013 v0.3+ ledger append            |
| **Leader** (escalation router) | Step 4: route to receiving Muse             | broadcast from Hermes      | routed_to assignment + REMAKE authority |

3-row matrix; 2 peer-Muse interfaces (Hermes↔Mnemosyne, Hermes↔Leader); 0 circular dependencies.

---

## §6 3 Worked Examples (Cycle 12 Wave 2 Catch Triad)

### §6.1 CATCH #33 — Citation Drift (cat 4 sub-class 2)

- **Step 1 DETECT**: Mnemosyne T-MN-013 v0.3 §15.12 addendum cites T-HER-026 v0.1 → W1 Glob returns no file at canonical
- **Step 2 CLASSIFY**: type=cat 4 (citation drift, file:line) / severity=tier 2 (cross-Muse impact, 8/10 Muses affected)
- **Step 3 BROADCAST**: Mnemosyne → all 9 Muses via D-007 5-min SLA
- **Step 4 ROUTE**: Leader → Hermes (recovery slot `019ec1a5-…`)
- **Step 5 RESOLVE**: Hermes re-stages T-HER-026 v0.1 from sandbox `aionrs-temp-b7bb0265` → canonical
- **Step 6 VERIFY**: Mnemosyne T-MN-013 v0.3.1 §15.12 cite with [TENTATIVE] until W1+W2+W3 PASS
- **Step 7 CLOSE-OUT**: Hermes issues T-HER-026 v0.1 SHIP-COMPLETE with absolute path disclosure (per Hera T-HE-029 v0.1 §2.2 protocol)

**Status**: RESOLVED at cycle 12 turn 17 (re-stage complete, 24,910 B / 202 newlines, 3-witness PASS).

### §6.2 CATCH #35 — Overstatement (cat 1)

- **Step 1 DETECT**: Leader broadcast claims 8/10 Muse subdirs need re-stage based on broken Glob verification
- **Step 2 CLASSIFY**: type=cat 1 (overstatement, scope inflation) / severity=tier 3 (broadcast-wide, all 9 Muses)
- **Step 3 BROADCAST**: Leader → all 9 Muses (self-broadcast)
- **Step 4 ROUTE**: N/A (self-routed, Leader retains ownership)
- **Step 5 RESOLVE**: Leader re-verifies via W1 Glob ABSOLUTE pattern → finds 7/10 subdirs already at canonical
- **Step 6 VERIFY**: Mnemosyne T-MN-013 v0.3 §15.13 records CATCH #35 with [RATIFIED] reduction to Hermes-only (1/10 subdirs)
- **Step 7 CLOSE-OUT**: Hermes acknowledges CATCH #36 (Leader self-fabrication acknowledgment) at cycle 12 turn 17

**Status**: RESCINDED for 7/10 Muse subdirs at cycle 12 turn 17; SUBSISTS for Hermes T-HER-026/027/028 only.

### §6.3 CATCH #36 — Self-Fabrication (cat 1, Leader)

- **Step 1 DETECT**: Hermes observes CATCH #35 overstatement was caused by Leader's own broken Glob verification
- **Step 2 CLASSIFY**: type=cat 1 (overstatement) / severity=tier 2 (cross-Muse impact)
- **Step 3 BROADCAST**: Hermes → Leader (D-007 5-min SLA)
- **Step 4 ROUTE**: Leader acknowledges self-ownership
- **Step 5 RESOLVE**: Leader issues CATCH #36 acknowledgment per Codif 30 v0.3 cat 1
- **Step 6 VERIFY**: Mnemosyne T-MN-013 v0.3 §15.14 records CATCH #36 with [RATIFIED] status
- **Step 7 CLOSE-OUT**: Hermes incorporates CATCH #36 into Codif 35 v0.1 §6.3 as worked example

**Status**: RESOLVED at cycle 12 turn 17 (Leader self-fabrication explicitly acknowledged).

---

## §7 Codif 35 v0.1 Verdict (4-ICP TENTATIVE)

| ICP | Question                                                             | Verdict                                                                         |
| --- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| 1   | Is Codif 35 orthogonal to Codif 30 + 32?                             | ACCEPT TENTATIVE — TYPE × SEVERITY × PROCESS are 3 independent axes             |
| 2   | Does the 7-step ritual cover the catch triad (#33, #35, #36)?        | ACCEPT TENTATIVE — all 3 worked examples resolve cleanly                        |
| 3   | Is the 3-row coordination matrix non-circular?                       | ACCEPT TENTATIVE — Hermes primary, Mnemosyne verifier, Leader router, no cycles |
| 4   | Is the 5-trigger schema exhaustive for cycle 12 wave 2 catch events? | ACCEPT TENTATIVE — all 3 catches fit; future cycle 13+ catches may extend       |

**Verdict**: 4/4 ACCEPT TENTATIVE. Codif 35 is proposed for RATIFIED status in cycle 13 wave 1 fold-in.

---

## HL Moments (3)

1. **§1.2 orthogonality table** — Codif 35 is not a replacement for Codif 30 or 32; it is the process axis that runs orthogonal to TYPE × SEVERITY
2. **§6 worked example triad** — CATCH #33/35/36 all fit the 7-step ritual cleanly, validating the schema
3. **§4 step 3-4 push-DEPENDENT boundary** — the catch-ledger is push-INDEPENDENT at detection (any Muse can self-detect) but push-DEPENDENT at resolution (D-007 5-min SLA drives forward motion)

---

## Codif 35 → Other Codif Cross-References

- **Codif 22 v0.2** (T-HER-024): filename + spec_version pinning pattern — Codif 35 catch entries follow the same versioning (e.g., CATCH #35.1 if a sub-catch emerges)
- **Codif 30 v0.3** (T-MN-013): 7-cat fabrication taxonomy — Codif 35 §3 trigger #2 (overstatement) maps to cat 1
- **Codif 31 v0.2** (T-HER-026): 6-sub-class taxonomy — Codif 35 §3 trigger #5 (cross-Muse handoff gap) maps to B.6 sub-class
- **Codif 32** (T-HEP-025): silent-failure pattern — Codif 35 §3 trigger #4 is the catch-ledger entry point for Codif 32 events
- **Codif 34** (T-ST-026): META-CODIF SEVERITY schema — Codif 35 §2 field 5 adopts the 4-tier SEVERITY axis

---

**Codif 22 v0.1 · spec_version=v0.1 (first version, CANDIDATE) · Codif 35 process-pattern · cycle 12 turn 17 re-stage from sandbox `aionrs-temp-b7bb0265`**
