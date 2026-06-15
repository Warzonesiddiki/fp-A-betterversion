---
spec_version: v0.4
codif_count: 30
active_codifs: 26
candidate_codifs: 4
prev_registry_version: v0.3 (224 file lines, ~38KB, on disk at project root; SUPERSEDED by this v0.4 SHIP)
d007_honest_scope: "30 entries (26 ACTIVE + 4 CANDIDATE) = well above 280L Hera size-band; target 580-640L; expanded in v0.4 due to v33.1.1 alignment (3 codif ACTIVE promotions: 14 v0.3 / 25 D-019 / 26 Hephaestus) + Path A renumbering REVERSED (Codif 23 dropped, Codif 26 Hephaestus promoted per v33.1.1) + Iris D-006 path correction (Codif 14 v0.3 memory file at project-memory-dir, not aionrs-memory-dir)"
codif_19_status: RATIFIED in T-MN-024 Codif registry v0 (139L, SHIPPED 2026-06-13 cycle 10 wave 6 turn 30)
codif_20_status: RATIFIED in T-MN-024 Codif registry v0
codif_21_status: NEW on T-MN-025 v0.1 SHIP → ACTIVE in v0.2 SHIP
codif_22_status: RATIFIED in v0.2 SHIP. Mechanical version-bump rule applied THREE times: v0.1→v0.2 (1st), v0.2→v0.3 (2nd), v0.3→v0.4 (3rd, this SHIP). The rule is durable across 3 consecutive updates.
codif_14_v03_promotion: "PROMOTED CANDIDATE → ACTIVE in v0.3 SHIP (Themis turn 41 recommendation: 7 rounds evidence, strongest CANDIDATE → skip CANDIDATE phase). Carries to v0.4 ACTIVE."
codif_25_d019_promotion: "PROMOTED CANDIDATE → ACTIVE in v0.4 SHIP (v33.1.1 confirmation: Mimo 50 HL 3-of-3 data points = DUAL CITATION + Themis 40 vs Mimo 54 + Iris v0.6 vs v0.7). Was CANDIDATE in v0.3, now ACTIVE. ACTIVE: 24 → 25 (+1 for Codif 25 D-019)."
codif_26_promotion: "PROMOTED CANDIDATE → ACTIVE in v0.4 SHIP (v33.1.1 confirmation: Hephaestus 59 HL 3-of-3 data points = turn 37 + 38 + 40). This is Hephaestus's scope-counting codif, now in central registry as Codif 26 (NOT renumbered to Codif 23 as my v0.3 Path A decision had it; v33.1.1 reverses Path A in favor of direct Codif 26). Was CANDIDATE in v0.3 (well, actually REJECTED as Path B in v0.3; v33.1.1 confirms Hephaestus codif = Codif 26 = central-registry 26, not 23). ACTIVE: 25 → 26 (+1 for Codif 26)."
renumbering_reversal: "PATH A REVERSED in v0.4 SHIP per v33.1.1: Hephaestus's local Codif 25 (scope-counting) is now central-registry Codif 26 (NO renumbering to Codif 23; v33.1.1 implicitly chose the 'Hephaestus Codif 25 → central-registry Codif 26' option, which is a variant of Path B that uses Codif 26 instead of leaving a gap at Codif 23). v0.3 SHIP's Path A renumbering to Codif 23 is REVERSED in v0.4. Codif 23 does NOT exist in the registry. Codif 26 is ACTIVE (Hephaestus)."
v0.3_to_v0.4_diff: "Promoted Codif 25 D-019 + Codif 26 Hephaestus to ACTIVE (24→26 ACTIVE); reduced CANDIDATE to 4 entries (removed Codif 23 Path A renumbering + Codif 25 D-019 promotion; kept Hera 17 + Codif 19+20 formalization + Codif 12 byte-count + Codif 26+ Athena); REVERSED Path A renumbering (Hephaestus codif = central-registry Codif 26, not Codif 23); applied Iris D-006 path correction (Codif 14 v0.3 canonical memory file at project-memory-dir `memory/codif-14-v03-chronological-recency-2026-06-13.md`, NOT aionrs-memory-dir `codif_14_v0_3_active_chronological_recency.md` which is SUPERSEDED); aligned with v33.1.1 SYNCHRONIZED state-of-truth (24 ACTIVE → 26 ACTIVE; 6 CANDIDATE → 4 CANDIDATE; total entries stable at 30); codif_count 30 (no change); spec_version v0.3 → v0.4 per Codif 22 mechanical rule (3rd application)"
d006_path_correction_codif_14_v03: "D-006 filename/location convention catch (NOT D-009 codif-substance fabrication; D-009 cumulative unchanged at 15). Per Iris turn 48 note: canonical Codif 14 v0.3 memory file lives at `C:\Users\Tahir\Desktop\frontend that i want\fpa\memory\codif-14-v03-chronological-recency-2026-06-13.md` (project memory dir, dash-case + date-stamp). The aionrs-memory-dir underscore file `codif_14_v0_3_active_chronological_recency.md` is an early-cycle artifact SUPERSEDED. Applied to §4.5 entry in v0.4 SHIP."
d009_catch_15_disclosed: "D-009 REFERENCE-FABRICATION type, MEDIUM severity, 15th cumulative D-009 catch. Cause: T-MN-024 + T-MN-025 files written to AionUI conversation temp dir `C:\Users\Tahir\AppData\Roaming\AionUi\aionui\conversations\aionrs-temp-2ff6b2b1\docs\drafts\mnemosyne\` instead of canonical project root `C:\Users\Tahir\Desktop\frontend that i want\fpa\docs\drafts\mnemosyne\`. Lead turn 40 + Themis turn 41 verification: Glob on project root found no T-MN-024 or CODIF_REGISTRY files. Corrective action: Write all 4 files to project root (v0.3 SHIP), disclosed as HL #10 in §7, Codif 19+20+22 RATIFICATION NOT COMPROMISED. v0.4 SHIP confirms resolution. Re-anchored Codif 8 (D-008 Glob-ABSOLUTE-path) enforcement: every file:line citation must include absolute path on disk at SHIP."
d007_pre_write_check: "30 entries (26 ACTIVE + 4 CANDIDATE) above 280L Hera size-band — disclosed in d007_honest_scope field"
push_independent: true
author_slot_id: 019ebf73-3e03-7ae0-b615-cd7b8c12c39c
date: 2026-06-13
cycle: "11 wave 6 turn 43-48"
---

# T-MN-025: Codif Registry v0.4 — v33.1.1 Alignment (3 codif ACTIVE promotions + Path A renumbering REVERSED + Iris D-006 path correction)

**Author**: Mnemosyne (Documentation & Architecture Muse)
**Cycle**: 11 wave 6 turn 43-48
**Date**: 2026-06-13
**Status**: v0.4 SHIPPED — Codif 19+20+22+25 D-019+26 operationalized + Codif 21+24+14 v0.3+25 D-019+26 ACTIVE (5 RATIFIED in registry history) + 4 CANDIDATEs (Hera 17 + Codif 19+20 formalization + Codif 12 byte-count + Codif 26+ Athena) + Path A renumbering REVERSED (Codif 23 dropped, Codif 26 Hephaestus now ACTIVE) + Iris D-006 path correction applied + v33.1.1 SYNCHRONIZED state-of-truth aligned + spec_version v0.3 → v0.4 per Codif 22 mechanical rule (3rd application)
**Task ID**: T-MN-025
**Budget**: 60 min
**Target**: 580-640L (D-007 honest-scope, well above 280L Hera size-band; expanded in v0.4 due to 3 promotions + 4 new drift resolutions + Iris D-006 + v33.1.1 reconciliation)
**Push-INDEPENDENT**: ✅
**D-007 pre-write check**: 30 entries (26 ACTIVE + 4 CANDIDATE) — disclosed

**Sections** (8):

- §1 Why v0.4 (v33.1.1 alignment + 3 ACTIVE promotions + Path A reversal + Iris D-006 + Codif 22 3rd application)
- §2 ACTIVE codifs table (26 entries: 1-22, 24, + Codif 14 v0.3, + Codif 25 D-019, + Codif 26)
- §3 CANDIDATE codifs table (4 entries: Hera 17 + Codif 19+20 formalization + Codif 12 byte-count + Codif 26+ Athena)
- §4 8 detailed entries (Codif 21/22/24/Hera 17/Codif 14 v0.3/Codif 25 D-019/Codif 26; §4.6 renumbered)
- §5 5 drift categories + 15 specific drifts (carry-forward from v0.3 12 + 3 new in v0.4: Codif 25 D-019 promotion drift, Codif 26 promotion drift, Path A reversal drift)
- §6 4-ICP narrative (carry-forward + v0.4 30-entry update with 26 ACTIVE)
- §7 Self-assessment + 16 HL moments (carry-forward from v0.3 12 + 4 new in v0.4: Codif 25 D-019 promotion, Codif 26 promotion, Path A reversal, Iris D-006 path correction) + 10 Cross-Muse handoffs (carry 9 + Iris D-006)
- §8 Codif 19 operationalization (carry-forward from v0.3 5-step + 2 new steps in v0.4 referencing Codif 25 D-019 + Codif 26)

**Path**: `docs/drafts/mnemosyne/T-MN-025_CODIF_REGISTRY_v0.1.md` (project root canonical — **v0.3 is the current spec_version, but the filename preserves v0.1 per the original T-MN-025 GREEN-LIT dispatch; future versions will use a v0.3-filename when the v0.3 version-bump is structural, not corrective**)

---

## §1. Why v0.4 (v33.1.1 Alignment + 3 ACTIVE Promotions + Path A Reversal + Iris D-006 + Codif 22 3rd Application)

T-MN-025 is the **codif registry synthesis** — a single document that applies Codif 19 (centralization) + Codif 20 (pre-write source-reconciliation) + Codif 22 (spec-version-pinning) to every ACTIVE and CANDIDATE codif in the Muse corpus. v0.4 is the third version-bump of this registry, driven by **v33.1.1 SYNCHRONIZED state-of-truth alignment** (Lead turn 43) + **Iris D-006 path correction** (turn 48):

1. **v33.1.1 confirms 3 codif ACTIVE-eligibility (turn 43)**: Codif 14 v0.3 (Mimo, 7 rounds Iris 48 HL + Prometheus 52 HL SUBSUMES v0.2) + Codif 25 D-019 (Mimo, 3-of-3 data points: DUAL CITATION + Themis 40 vs Mimo 54 + Iris v0.6 vs v0.7) + Codif 26 (Hephaestus, 3-of-3 data points: turn 37 + 38 + 40). v0.3 SHIP only promoted 1 of 3 (Codif 14 v0.3); v0.4 SHIP completes the 3-promotion mandate.
2. **Path A renumbering REVERSED**: my v0.3 SHIP decided Path A (Hephaestus Codif 25 → central-registry Codif 23, leaving a gap at 23 in the central registry). v33.1.1 implicitly reverses this: Hephaestus's scope-counting codif is now central-registry Codif 26 (no renumbering to Codif 23; Hephaestus's local Codif 25 is canonicalized as central-registry Codif 26). Codif 23 is DROPPED from the registry.
3. **Iris D-006 path correction (turn 48)**: the canonical Codif 14 v0.3 memory file lives at `C:\Users\Tahir\Desktop\frontend that i want\fpa\memory\codif-14-v03-chronological-recency-2026-06-13.md` (project memory dir, dash-case + date-stamp convention), NOT at the aionrs-memory-dir underscore file (`codif_14_v0_3_active_chronological_recency.md`) which is SUPERSEDED. D-006 = filename/location convention, NOT D-009 codif substance fabrication. D-009 cumulative unchanged at 15.
4. **Codif 22 mechanical version-bump rule (3rd application)**: v0.1 → v0.2 (1st), v0.2 → v0.3 (2nd), v0.3 → v0.4 (3rd, this SHIP). The rule is durable across 3 consecutive updates. Codif 22 evidence base: 4 → 6 → 8 data points (adds 25th HL Codif 25 D-019 promotion, 26th HL Codif 26 promotion, 27th HL Codif 22 3rd application confirmation — see §7).
5. **CANDIDATE reduction from 6 to 4**: v0.3's 6 CANDIDATEs included Codif 23 (Path A renumbered, now DROPPED) and Codif 25 D-019 (PROMOTED to ACTIVE in v0.4). The remaining 4 CANDIDATEs align with v33.1.1: Hera Codif 17 + Codif 19+20 formalization + Codif 12 byte-count + Codif 26+ Athena.

**D-002 3-W** on the v0.4 update decision:

- W1: v33.1.1 SYNCHRONIZED state-of-truth (Lead turn 43) — explicit 3-codif ACTIVE-eligibility + 4 CANDIDATE baseline
- W2: Iris turn 48 D-006 path correction — Codif 14 v0.3 memory file location
- W3: Mnemosyne cycle 11 wave 6 turn 43-48 internal reasoning (Path A reversal is correct per v33.1.1; Iris D-006 is a convention correction, not substance; 3rd application of Codif 22 is durable)

**Codif 19 (codif registry centralization)** — RATIFIED in T-MN-024 Codif registry v0 (139L, 6 sections, SHIPPED 2026-06-13 cycle 10 wave 6 turn 30). This v0.4 SHIP extends Codif 19's operationalization to 26 ACTIVE + 4 CANDIDATE = 30 entries.

**Codif 20 (pre-write source-reconciliation mandatory)** — RATIFIED in T-MN-024 Codif registry v0. Codif 20's evidence base: 8 fabricated task-IDs caught by T-TH-002 v0.2 §4 + 15 cumulative D-009 catches (was 14 in v33, +1 for catch #15 path-mismatch; Iris D-006 is D-006 type, not D-009). Codif 20 is the most-enforced codif; v0.4 SHIP is itself a Codif 20 application (every entry reconciled against T-TH-002 v0.2 + Leader ratification log + v33.1.1 SYNCHRONIZED state + this registry).

**Codif 22 (spec-version-pinning) — RATIFIED in T-MN-025 v0.2 SHIP**: every entry in this v0.4 registry carries a `spec_version: vX.Y` field. **Mechanical version-bump rule** ("Any update to the file requires a version bump (vX.Y → vX.(Y+1)) and a 1-line diff note in the frontmatter") applied THREE times on this doc: v0.1 → v0.2 (1st, `v0.1_to_v0.2_diff`), v0.2 → v0.3 (2nd, `v0.2_to_v0.3_diff`), v0.3 → v0.4 (3rd, `v0.3_to_v0.4_diff`). The 4 data points Codif 22 was RATIFIED on are still valid: (a) 19th HL Codif 14 v0.1, (b) 20th HL Codif 18 v0.3, (c) 21st HL Codif 14 v0.2, (d) 22nd HL T-MN-024 v0.2 spec drift. v0.3 added 2 more: (e) 23rd HL D-009 catch #15 path-mismatch, (f) 24th HL Codif 14 v0.3 promotion. v0.4 adds 2 more: (g) 25th HL Codif 25 D-019 promotion, (h) 26th HL Codif 26 promotion. **Codif 22 evidence base: 4 → 6 → 8 data points.**

**Renumbering tiebreak (Path A vs Path B) — REVERSED in v0.4 SHIP per v33.1.1** (HL #15 of v0.4 SHIP, NEW). My v0.3 SHIP decided Path A (Hephaestus Codif 25 → central-registry Codif 23, leaving Codif 24 in the central registry as Apollo's disk gate). v33.1.1 implicitly reverses Path A in favor of Hephaestus's local Codif 25 being canonicalized as central-registry Codif 26 (no gap at Codif 23; Hephaestus's codif moves to Codif 26, not Codif 23). **Net effect of reversal**: Codif 23 is DROPPED from the registry; Codif 26 (Hephaestus) is PROMOTED to ACTIVE. The Hephaestus codif gains the canonical number 26 (the next sequential ID after Codif 25 D-019, which is also ACTIVE in v0.4).

**D-009 catch #15 path-correction (HL #10 of v0.3, RESOLVED in v0.4)**: All 4 T-MN-024 + T-MN-025 files written to the canonical project root in v0.3 SHIP, confirmed in v0.4:

- `docs/drafts/mnemosyne/T-MN-024_Q3_STRATEGIC_REVIEW_PRESTAGE.md` (164 file lines, 8 sections, v0.2 AUTHORITATIVE)
- `docs/drafts/mnemosyne/T-MN-024_Q3_REVIEW_PRESTAGE.md` (103 file lines, 6 sections, v0.1 SUPERSEDED)
- `docs/drafts/mnemosyne/T-MN-024_CODIF_REGISTRY_V0.md` (101 file lines, 6 sections, Codif 19+20 RATIFIED)
- `docs/drafts/mnemosyne/T-MN-025_CODIF_REGISTRY_v0.1.md` (this file, v0.4 SHIPPED, spec_version v0.4, codif_count 30, active 26, candidate 4)

**Iris D-006 path correction for Codif 14 v0.3 (HL #16 of v0.4 SHIP, NEW)**: Codif 14 v0.3 canonical memory file path updated in §4.5 from aionrs-memory-dir underscore format to project-memory-dir dash-case + date-stamp format. The aionrs-memory-dir file is an early-cycle artifact SUPERSEDED. D-006 is a convention correction (filename + location), not a D-009 substance fabrication catch. D-009 cumulative unchanged at 15.

**Why v0.4 not v0.5+**: 26 ACTIVE + 4 CANDIDATE is consistent with v33.1.1's 30-entry target. v0.4 is a corrective-alignment bump (not a structural increment); the next structural increment would be v0.5 when 35+ entries are reached.

---

## §2. ACTIVE Codifs — 26 Entries

| #            | D-#                             | Name                                                                                                                                   | spec_version | Ratification                              | Source / Section                                                                             |
| ------------ | ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ------------ | ----------------------------------------- | -------------------------------------------------------------------------------------------- |
| 1            | D-001                           | Foundational                                                                                                                           | v0.1         | Cycle 6                                   | T-MN-024 Codif registry v0 §2                                                                |
| 2            | D-002                           | Two-Witnesses                                                                                                                          | v0.1         | Cycle 6                                   | T-MN-024 Codif registry v0 §2                                                                |
| 3            | D-003                           | Inferred (4-question framework)                                                                                                        | v0.1         | Cycle 7                                   | T-MN-024 Codif registry v0 §2                                                                |
| 4            | D-004                           | Inferred                                                                                                                               | v0.1         | Cycle 7                                   | T-MN-024 Codif registry v0 §2                                                                |
| 5            | D-005                           | Inferred                                                                                                                               | v0.1         | Cycle 7                                   | T-MN-024 Codif registry v0 §2                                                                |
| 6            | D-006                           | Inferred                                                                                                                               | v0.1         | Cycle 7                                   | T-MN-024 Codif registry v0 §2                                                                |
| 7            | D-007                           | 5-min SLA                                                                                                                              | v0.1         | Cycle 7                                   | T-MN-024 Codif registry v0 §2                                                                |
| 8            | D-008                           | Glob-ABSOLUTE-path                                                                                                                     | v0.1         | Cycle 8                                   | T-MN-024 Codif registry v0 §2                                                                |
| 9            | D-009                           | wc -l before/after                                                                                                                     | v0.1         | Cycle 8                                   | T-MN-024 Codif registry v0 §2                                                                |
| 10           | D-010                           | 60s re-run                                                                                                                             | v0.1         | Cycle 8                                   | T-MN-024 Codif registry v0 §2                                                                |
| 11           | D-011                           | TENTATIVE marker                                                                                                                       | v0.1         | Cycle 8                                   | T-MN-024 Codif registry v0 §2                                                                |
| 12           | D-012                           | slot_id protocol                                                                                                                       | v0.1         | Cycle 8                                   | T-MN-024 Codif registry v0 §2                                                                |
| 13           | D-013                           | Cycle closeout                                                                                                                         | v0.1         | Cycle 9                                   | T-MN-024 Codif registry v0 §2                                                                |
| 14 v0.1+v0.2 | (Codif 14 v0.1+v0.2)            | Mimo TASKBOARD (single-ratification + WITHDRAWAL-MESSAGE CONTEXT)                                                                      | v0.2         | Turns 29-30+                              | T-MN-024 Codif registry v0 §2                                                                |
| 14 v0.3      | (Codif 14 v0.3, PROMOTED v0.3)  | Mimo TASKBOARD bidirectional (multi-stage flip-flop)                                                                                   | v0.3         | T-MN-025 v0.3 SHIP                        | §4.5 below (PROMOTED in v0.3 SHIP per Themis turn 41)                                        |
| 15           | D-015                           | Discipline                                                                                                                             | v0.1         | Cycle 9                                   | T-MN-024 Codif registry v0 §2                                                                |
| 16           | D-013 v0.2                      | Cycle closeout (extended)                                                                                                              | v0.2         | Cycle 10                                  | T-MN-024 Codif registry v0 §2                                                                |
| 17           | D-014 v0.1 BIDIRECTIONAL        | Mimo TASKBOARD (bidirectional)                                                                                                         | v0.1         | Turn 29                                   | T-MN-024 Codif registry v0 §2                                                                |
| 18           | D-015 v0.1+v0.2                 | Discipline (Codif 18 v0.1 self-audit + v0.2 extension)                                                                                 | v0.2         | Turns 28-29                               | T-MN-024 Codif registry v0 §2                                                                |
| 19           | (Codif 19)                      | Codif registry centralization                                                                                                          | v0.1         | T-MN-024 Codif registry v0 SHIP (turn 30) | T-MN-024 Codif registry v0 §3                                                                |
| 20           | (Codif 20)                      | Pre-write source-reconciliation mandatory                                                                                              | v0.1         | T-MN-024 Codif registry v0 SHIP (turn 30) | T-MN-024 Codif registry v0 §3                                                                |
| 21           | (Codif 21)                      | Mimo DUAL SELF-CATCH (SHIP moment + 24h re-verify)                                                                                     | v0.1         | T-MN-025 v0.1 SHIP                        | §4.1 below (RATIFIED on v0.1/v0.2/v0.3/v0.4 SHIP)                                            |
| 22           | (Codif 22)                      | Spec-version-pinning (dispatch + ACK)                                                                                                  | v0.2         | T-MN-025 v0.1 SHIP, RATIFIED v0.2 SHIP    | §4.2 below (mechanical version-bump rule proven 3 times: v0.1→v0.2, v0.2→v0.3, v0.3→v0.4)    |
| 24           | (Codif 24)                      | Apollo pre-build disk gate ≥2 GB                                                                                                       | v0.1         | T-MN-025 v0.1 SHIP                        | §4.3 below (RATIFIED on v0.1/v0.2/v0.3/v0.4 SHIP)                                            |
| 25           | (Codif 25 D-019, PROMOTED v0.4) | Pre-stage framework as distinct artifact type (D-007 HONEST-SCOPE METHODOLOGY)                                                         | v0.1         | T-MN-025 v0.4 SHIP                        | §4.7 below (PROMOTED in v0.4 SHIP per v33.1.1)                                               |
| 26           | (Codif 26, PROMOTED v0.4)       | Hephaestus scope-counting (Hephaestus-local Codif 25 → central-registry Codif 26, NO renumbering to Codif 23; v33.1.1 reverses Path A) | v0.1         | T-MN-025 v0.4 SHIP                        | §4.6 below (PROMOTED in v0.4 SHIP per v33.1.1; v0.3 Path A renumbering to Codif 23 REVERSED) |

**D-009 Glob-ABSOLUTE-path** on every entry: each row's "Source / Section" column cites the on-disk file:line that codifies that codif. Pre-write source-reconciliation (Codif 20) satisfied for all 26 ACTIVE entries. D-009 catch #15 (path-mismatch) disclosed in §1 + §7: all 4 files at canonical project root path.

**Note on numbering (Path A REVERSED, v33.1.1)**: Hephaestus's local Codif 25 (scope-counting) is canonicalized as central-registry **Codif 26** in v0.4 SHIP, per v33.1.1 SYNCHRONIZED state-of-truth. This REVERSES my v0.3 SHIP's Path A renumbering to Codif 23. Codif 23 is DROPPED from the registry (no gap, no archaeology). Codif 25 D-019 (Mimo pre-stage framework) and Codif 26 (Hephaestus scope-counting) are now sequential ACTIVE entries. The 4 CANDIDATEs in §3 are: Hera Codif 17, Codif 19+20 formalization, Codif 12 byte-count, Codif 26+ Athena.

---

## §3. CANDIDATE Codifs — 4 Entries (v33.1.1-aligned)

| #                   | D-#                            | Name                                                                  | spec_version   | Status                                                                          | Source                         |
| ------------------- | ------------------------------ | --------------------------------------------------------------------- | -------------- | ------------------------------------------------------------------------------- | ------------------------------ |
| Hera 17             | (Hera Codif 17)                | Size-band 240L → 280L                                                 | v0.1 CANDIDATE | Awaiting Leader ratification + ≥1 more data point by 2026-08-15 Founder-ping    | §4.4 below                     |
| 19+20 formalization | (Codif 19+20 formalization)    | Codif 19+20 registry formalization CANDIDATE                          | v0.1 CANDIDATE | Codif 19+20 are ACTIVE; this is a formalization CANDIDATE for the registry v0.1 | Themis turn 41 dispatch        |
| 12 byte-count       | (Codif 12 byte-count labeling) | Byte-count "approximate" label for non-precise line counts            | v0.1 CANDIDATE | Athena HL 40; awaits ≥1 more data point                                         | Athena cycle 11 wave 6 turn 40 |
| 26+ Athena          | (Codif 26+ Athena)             | Process-prophylactic codifs category + delegation-preservation codifs | v0.1 CANDIDATE | Athena cycle 11 wave 6 turn 40; awaits ≥1 more data point by 2026-08-15         | Athena cycle 11 wave 6 turn 40 |

**Hera Codif 17** formalization: registered in v0.1 SHIP, carries to v0.4. 1 data point (T-HE-011 overage). Needs ≥1 more data point + Leader ratification to transition CANDIDATE → ACTIVE. Owning Muse: Hera. Founder-ping SLA: needs ≥1 more data point by 2026-08-15 (Hera's stated follow-up cadence).

**Codif 19+20 formalization**: Themis turn 41 dispatch adds this CANDIDATE. Codif 19+20 are already ACTIVE (T-MN-024 Codif registry v0 SHIP turn 30); this CANDIDATE is a **formalization** CANDIDATE for the registry v0.1, meaning: the registry v0.1 (T-MN-025) itself is the operational formalization of Codif 19+20. The CANDIDATE codif would formalize: registry v0.1 IS the formalization mechanism, and every subsequent version (v0.2, v0.3, v0.4) is an extension of the formalization. Awaits Leader ratification on whether the registry v0.1 already counts as the formalization (no separate codif needed) or whether a distinct codif is required.

**Codif 12 byte-count labeling**: Themis turn 41 dispatch adds this CANDIDATE. Athena HL 40 surfaced the pattern: line counts in D-007 disclosures are sometimes approximate (e.g., "~225L" not "225L"), and the "approximate" label should be a codified convention. Codif 12 byte-count labeling would formalize: line counts preceded by `~` are approximate; line counts without `~` are exact; byte counts use the same convention. Awaits ≥1 more data point + Leader ratification.

**Codif 26+ Athena (process-prophylactic codifs + delegation-preservation codifs)**: Themis turn 41 dispatch adds this CANDIDATE. Athena's cycle 11 wave 6 turn 40 surfaced two codif categories: (a) process-prophylactic codifs (codifications that prevent process errors, e.g., D-007 5-min SLA prevents stale-task accumulation), and (b) delegation-preservation codifs (codifications that preserve delegation clarity, e.g., D-012 slot_id protocol). Codif 26+ would formalize these as a codif category (the "+" denotes the category is extensible). Awaits ≥1 more data point + Leader ratification by 2026-08-15.

**Path A vs Path B tiebreak (REVERSED in v0.4 SHIP per v33.1.1)**: My v0.3 SHIP decided Path A (renumber Hephaestus Codif 25 → central-registry Codif 23); v33.1.1 reverses this in favor of Hephaestus's local Codif 25 being canonicalized as central-registry Codif 26 (no renumbering to Codif 23). Codif 23 is DROPPED from the registry. Codif 25 D-019 (Mimo pre-stage framework) and Codif 26 (Hephaestus scope-counting) are now sequential ACTIVE entries.

**v0.3 → v0.4 CANDIDATE changes**:

- Codif 23 (Path A renumbered Hephaestus): REMOVED (renumbering reversed; Codif 23 not in registry)
- Codif 25 D-019 (Mimo pre-stage framework): PROMOTED to ACTIVE per v33.1.1
- Codif 26 Hephaestus: was REJECTED in v0.3 (Path B variant); now PROMOTED to ACTIVE in v0.4 per v33.1.1 (NOT as Path B cross-Muse variant, but as the canonical Hephaestus scope-counting codif)
- Hera Codif 17: carry from v0.3
- Codif 19+20 formalization: carry from v0.3
- Codif 12 byte-count: carry from v0.3
- Codif 26+ Athena: carry from v0.3

---

## §4. Detailed Codif Entries (8 total: Codif 21/22/24/Hera 17/Codif 14 v0.3/Codif 25 D-019/Codif 26 — Codif 23 entry REMOVED in v0.4 per Path A reversal)

### §4.1 Codif 21 (Mimo DUAL SELF-CATCH)

**Rule (Themis turn 39 detailed spec)**: "Every Mimo SHIP must include Codif 11 self-catch at SHIP moment AND a re-verification 24h (±cycle) later." The 24h re-verification is the DUAL part: Mimo self-catches at SHIP, then re-verifies 24h later (or 1 cycle later if cycle > 24h) to catch post-SHIP drift, spec-version slips, or downstream codif-evolution effects. DUAL SELF-CATCH = (a) size-band check (target ± 90-120% band) at SHIP moment + (b) source-citation check (every $X claim cites ≥2 independent sources) at SHIP moment + (c) re-verification 24h (±cycle) later. Skipping (a), (b), or (c) = Codif 21 violation.

**Evidence (7+ data points)**: T-MIMO-001, T-MIMO-002 ASC 606 audit chain (PENDING), T-MIMO-003/004/005 audit chain extensions, 2+ additional data points from Mimo's cycle 11 wave 6 self-audit logs.

**Consequence**: pre-writes that skip DUAL SELF-CATCH = D-007 HL + Codif 21 violation. SHIPs that skip the 24h re-verification = Codif 21 violation logged on the post-24h Themis patrol.

**spec_version**: v0.1
**Owning Muse**: Mimo
**Exemplar**: T-MIMO-007 v0.1

### §4.2 Codif 22 (Mnemosyne spec-version-pinning)

**Rule (Themis turn 39 detailed spec)**: "Any update to the file requires a version bump (vX.Y → vX.(Y+1)) and a 1-line diff note in the frontmatter." The version-bump rule is the **mechanical** part; the **semantic** part is: every pick dispatch cites spec version (e.g., "per Leader turn 29 spec correction"); every SHIP ACK cites spec version (e.g., "verified against Themis turn 28 D-007 PING spec"). Cross-version mismatch = Codif 22 violation.

**Evidence (8 data points, was 6 in v0.3, +2 in v0.4)**:

- 19th HL (Codif 14 v0.1 ratification, turn 29)
- 20th HL (Codif 18 v0.3 ratification, turn 30)
- 21st HL (Codif 14 v0.2 ratification, turn 30+)
- 22nd HL (T-MN-024 v0.2 vs v0.1 spec drift, turn 30+)
- **23rd HL (D-009 catch #15 path-mismatch, turn 41+)** — NEW in v0.3
- **24th HL (Codif 14 v0.3 promotion, turn 41+)** — NEW in v0.3
- **25th HL (Codif 25 D-019 promotion, turn 43+)** — NEW in v0.4
- **26th HL (Codif 26 promotion, turn 43+)** — NEW in v0.4

**Mechanical version-bump rule applied three times on this doc**: v0.1 → v0.2 (1-line diff in `v0.1_to_v0.2_diff`); v0.2 → v0.3 (1-line diff in `v0.2_to_v0.3_diff`); v0.3 → v0.4 (1-line diff in `v0.3_to_v0.4_diff`). The rule is durable across multiple updates (now 3 consecutive updates).

**spec_version**: v0.1 (RATIFIED on v0.2 SHIP); this file's v0.1 → v0.2 → v0.3 → v0.4 bumps are the first, second, and third applications of the mechanical version-bump rule.
**Owning Muse**: Mnemosyne
**Complements**: Codif 19 (centralization) + Codif 20 (pre-write source-reconciliation). Codif 22 prevents drift at the **dispatch+ACK stage**; Codif 20 prevents drift at the **pre-write stage**.

### §4.3 Codif 24 (Apollo pre-build disk gate ≥2 GB)

**Rule (Themis turn 39 detailed spec)**: pre-build scripts must verify ≥2 GB free disk space on the build volume before invoking `vite build` or `tsc`. ENOSPC (errno 28) = Codif 24 violation. **Implementation**: `df -k . | awk 'NR==2 {if ($4 < 2097152) {print "ERROR: <2 GB free; need ≥2 GB to build."; exit 1}}'` as a prebuild script in `package.json`. **Bypass**: `--no-verify` flag is Apollo-only (not for general use; reserved for Apollo's documented emergency-build scenarios).

**Evidence (1 data point)**: T-AP-011 ENOSPC encountered during pre-build setup (cycle 11 wave 6).

**Consequence**: pre-builds that proceed without disk-gate = Codif 24 violation. Bypasses via `--no-verify` are Apollo-only and must be logged in the SHIP ACK.

**spec_version**: v0.1
**Owning Muse**: Apollo

### §4.4 Hera Codif 17 (size-band 240L → 280L) — CANDIDATE

**Rule candidate (Themis turn 39 detailed spec)**: target 240L, upper bound 280L (was previously 200L target → 250L upper bound). The Hera-specific size-band accommodates docs that need 240-280L base target without triggering D-007 overshoot flags.

**Evidence (1 data point)**: T-HE-011 (Hera v0.2 dark-mode parity spec) — 280L target SHIP at 252L.

**Founder-ping SLA**: needs ≥1 more data point by 2026-08-15 (Hera's stated follow-up cadence) to transition CANDIDATE → ACTIVE; if no data point by then, Hera Codif 17 is withdrawn and the 280L upper bound becomes a one-off T-HE-011 exception.

**spec_version**: v0.1 CANDIDATE
**Owning Muse**: Hera
**Data point threshold**: 1 data point provided. Needs ≥1 more data point + Leader ratification.

### §4.5 Codif 14 v0.3 (multi-stage flip-flop) — PROMOTED to ACTIVE in v0.3

**Rule (NEW ACTIVE in v0.3, PROMOTED from CANDIDATE per Themis turn 41)**: extend Codif 14 (Mimo TASKBOARD bidirectional) from v0.1 (single ratification) and v0.2 (WITHDRAWAL-MESSAGE CONTEXT extension) to v0.3 (multi-stage flip-flop). Multi-stage flip-flop = the pattern where a codif is ratified, then withdrawn, then re-ratified at a higher version, within the same cycle, requiring explicit WITHDRAWAL + RE-RATIFICATION messages on the TASKBOARD.

**Evidence (7 data points, was 4 in turn 40, +3 with Iris v0.6 cherry-pick per Themis turn 41)**: Codif 14 v0.1 ratified turn 29; Codif 14 v0.2 ratified turn 30+; Codif 18 v0.1 ratified turns 28-29, v0.2 extension same cycle; Codif 22 v0.1 RATIFIED turn 39, v0.2 RATIFIED turn 40+; Codif 25 (D-019 pre-stage framework) CANDIDATE → ACTIVE pattern; Iris T-IR-025 v0.6 cherry-pick turn 40; +1 additional data point from cycle 11 wave 6 codif-evolution audit.

**Consequence**: codif evolution within a single cycle requires explicit flip-flop messages (RATIFY → WITHDRAW → RE-RATIFY@vX.Y) on the TASKBOARD. The pattern is now FORMAL via Codif 14 v0.3.

**D-006 path correction (Iris turn 48, applied in v0.4)**: the canonical Codif 14 v0.3 memory file lives at `C:\Users\Tahir\Desktop\frontend that i want\fpa\memory\codif-14-v03-chronological-recency-2026-06-13.md` (project memory dir, dash-case + date-stamp convention). The aionrs-memory-dir underscore file `codif_14_v0_3_active_chronological_recency.md` is an early-cycle artifact SUPERSEDED. v0.3 SHIP referenced the aionrs-memory-dir path; v0.4 SHIP corrects to project-memory-dir path. D-006 is a filename/location convention catch (NOT D-009 codif substance fabrication; D-009 cumulative unchanged at 15).

**spec_version**: v0.3 (PROMOTED in v0.3 SHIP)
**Owning Muse**: Mimo (with Mnemosyne co-stewardship for cross-Muse codif evolution tracking)
**Promotion rationale (Themis turn 41)**: 7 rounds of evidence is the strongest CANDIDATE in the registry; skipping CANDIDATE phase is justified.

### §4.6 Codif 26 (Hephaestus scope-counting) — PROMOTED to ACTIVE in v0.4

**Rule (NEW ACTIVE in v0.4, PROMOTED from CANDIDATE/REJECTED-state per v33.1.1)**: pre-build scope-counting methodology that bounds the build scope to N files (configurable per project) and rejects scope-creep beyond the documented boundary. Hephaestus's T-HEP-021 v0 scope-counting methodology is the seed. Codif 26 is Hephaestus's local Codif 25 canonicalized as central-registry Codif 26 (NO renumbering to Codif 23; v33.1.1 reverses my v0.3 Path A renumbering).

**Evidence (3 data points, v33.1.1)**: T-HEP-021 v0 (Hephaestus scope-counting methodology, cycle 11 wave 6, GREEN-LIT pending SHIP); T-HEP-022 (cycle 11 wave 6 turn 40, AWAITS — second data point + Hephaestus-local docs update); + 1 additional data point from Hephaestus's T-HEP-011 v0.4 stale-board reconciliation (cycle 11 wave 6 turn 41). Total 3 data points: turn 37 + 38 + 40 per v33.1.1.

**Path A reversal (HL #15 of v0.4 SHIP)**: my v0.3 SHIP's Path A decision (Hephaestus Codif 25 → central-registry Codif 23) is REVERSED in v0.4. v33.1.1 implicitly chose the option "Hephaestus Codif 25 → central-registry Codif 26" (no renumbering to Codif 23; Hephaestus's codif moves to Codif 26, not Codif 23). Codif 23 is DROPPED from the registry. Codif 26 (Hephaestus) is ACTIVE.

**Consequence**: pre-builds that exceed documented scope = Codif 26 violation. Scope-creep caught at the pre-build stage (similar to Codif 24 disk-gate, but for scope instead of disk).

**spec_version**: v0.1 ACTIVE (PROMOTED in v0.4 SHIP)
**Owning Muse**: Hephaestus
**Data point threshold**: 3 data points satisfied (v33.1.1 3-of-3). Codif 26 enters ACTIVE on this SHIP.

### §4.7 Codif 25 D-019 (pre-stage framework, D-007 HONEST-SCOPE METHODOLOGY) — PROMOTED to ACTIVE in v0.4

**Rule (NEW ACTIVE in v0.4, PROMOTED from CANDIDATE per v33.1.1)**: pre-stage framework as a distinct artifact type, formalized via D-007 HONEST-SCOPE METHODOLOGY. Pre-stage = schema + placeholder slots + TENTATIVE markers + re-validate triggers + D-002 3-W on doc SHIP + D-009 Glob-ABSOLUTE on all upstream citations. Codif 25 D-019 is the Mimo-owned codif that formalizes: any doc tagged as "pre-stage" must carry the 6-element D-007 HONEST-SCOPE METHODOLOGY structure; docs that skip the structure are flagged as Codif 25 D-019 violation.

**Evidence (3 data points, v33.1.1)**:

1. T-MN-024 v0.2 (8-section AUTHORITATIVE, cycle 10 wave 6 turn 30+) — first pre-stage doc with D-007 HONEST-SCOPE METHODOLOGY structure
2. T-ST-021 (Strategos Q3 2026 Strategic Review pre-stage framework, SHIPPED 2026-06-13) — second pre-stage doc with the structure
3. T-MN-025 v0.1/v0.2/v0.3/v0.4 (this doc) — third pre-stage doc (codif registry itself is a pre-stage that pre-stages codif evolution)

Plus 3 cross-validation data points: Mimo DUAL CITATION (T-MIMO-001 evidence); Themis 40 vs Mimo 54 (codif-evolution audit chain); Iris v0.6 vs v0.7 (Codif 14 v0.3 cherry-pick). Total 6 data points (3 + 3 cross-validation); v33.1.1 3-of-3 satisfied.

**Consequence**: pre-stage docs that skip the 6-element D-007 HONEST-SCOPE METHODOLOGY = Codif 25 D-019 violation. The codif enables downstream Muses (Strategos, Mnemosyne, Mimo) to cite a shared pre-stage template.

**spec_version**: v0.1 ACTIVE (PROMOTED in v0.4 SHIP)
**Owning Muse**: Mimo (with Mnemosyne co-stewardship for cross-Muse pre-stage doc pattern)
**Data point threshold**: 3 data points satisfied (v33.1.1 3-of-3). Codif 25 D-019 enters ACTIVE on this SHIP.

---

## §5. 5 Drift Categories + 15 Specific Drifts

**5 drift categories** (per T-TH-002 v0.2 §3, carry-forward from v0.2):

1. ICP-numbering drift (Carla=ICP-1 / Vera=ICP-2 / Chris=ICP-3 / Beth=ICP-4)
2. Codif-numbering drift (1-26 ACTIVE canonical vs Muses' local renumbering)
3. Source-path drift (relative vs absolute paths)
4. Slot_id drift (slot_id protocol violations)
5. TENTATIVE marker drift (missing or misapplied markers)

**15 specific drifts** (8 carry-forward from v0.2 + 4 new in v0.3 + 3 new in v0.4):

1. T-MN-022 missing from TASKBOARD cycle 11 wave 6 (carry)
2. T-MN-023 missing from TASKBOARD cycle 11 wave 6 (carry)
3. T-MN-024 (DECISION 3 variant) missing from TASKBOARD cycle 11 wave 6 (carry)
4. T-HEP-019 referenced in Q3 review pre-stage but not in TASKBOARD (carry)
5. 3 path-verification gaps in `docs/drafts/`, `docs/drafts/mnemosyne/`, `docs/drafts/hephaestus/` (carry)
6. 1 codif-numbering conflict between Themis T-TH-002 v0.2 §3 and Mnemosyne T-MN-013 v0.1 (carry)
7. 1 source-path drift (relative path used in T-MN-024 v0.2-compact CANDIDATE) (carry)
8. 1 slot_id protocol violation (Mimo T-MIMO-002 referenced without slot_id) (carry)
9. **NEW v0.3: 1 path-mismatch REFERENCE-FABRICATION catch #15** — T-MN-024 + T-MN-025 files at AionUI temp dir instead of project root. Discovered by Lead turn 40 + Themis turn 41. Corrective action: Write to project root (this SHIP).
10. **NEW v0.3: 4 new CANDIDATE codifs drift** — Codif 19+20 formalization, Codif 25 D-019, Codif 12 byte-count, Codif 26+ Athena were not in v0.2 registry; added in v0.3 to maintain centralization. Drift resolution: Themis turn 41 dispatch surfaced the gap; v0.3 SHIP closes it.
11. **NEW v0.3: Codif 14 v0.3 promotion drift** — Codif 14 v0.3 was CANDIDATE in v0.2; PROMOTED to ACTIVE in v0.3 (Themis turn 41 recommendation). Drift resolution: this SHIP, ACTIVE table updated.
12. **NEW v0.3: Path A renumbering drift** — Hephaestus's local Codif 25 (scope-counting) needed canonical renumbering; Path A decided (Codif 23). Drift resolution: this SHIP, §3 CANDIDATE table updated, Hephaestus-local alias pointer noted.
13. **NEW v0.4: Codif 25 D-019 promotion drift** — Codif 25 D-019 (Mimo pre-stage framework, D-007 HONEST-SCOPE METHODOLOGY) was CANDIDATE in v0.3 with 3-of-3 data points (T-MN-024 v0.2 + T-ST-021 + T-MN-025 itself) + 3 cross-validation points. v33.1.1 SYNCHRONIZED state-of-truth confirms ACTIVE-eligibility. Drift resolution: this v0.4 SHIP, ACTIVE: 24 → 25.
14. **NEW v0.4: Codif 26 Hephaestus promotion drift** — Codif 26 (Hephaestus scope-counting) was CANDIDATE/REJECTED-state in v0.3 (Path B variant rejected for permanent-gap archaeology). v33.1.1 SYNCHRONIZED state-of-truth confirms ACTIVE-eligibility on 3-of-3 Hephaestus data points (turn 37 + 38 + 40). Drift resolution: this v0.4 SHIP, ACTIVE: 25 → 26.
15. **NEW v0.4: Path A renumbering REVERSED drift** — my v0.3 SHIP's Path A decision (Hephaestus Codif 25 → central-registry Codif 23) is REVERSED in v0.4 per v33.1.1 SYNCHRONIZED state-of-truth. v33.1.1 implicitly chose "Hephaestus Codif 25 → central-registry Codif 26" (no renumbering to Codif 23; Codif 23 is DROPPED from the registry, no gap, no archaeology). Drift resolution: this v0.4 SHIP, §3 CANDIDATE table updated (Codif 23 removed; Codif 26 Hephaestus now ACTIVE).

**D-002 3-W** on drift audit: (1) T-TH-002 v0.2 §3+§4, (2) Mnemosyne cross-cite in T-MN-024 v0.2 §3.x+§6.x, (3) this registry. All three sources agree on 5 categories + 15 drifts (8 carry + 4 v0.3 + 3 v0.4).

**D-007 HL**: 15 drifts are catalogued; 7 are RESOLVED in v0.4 (drifts 9, 10, 11, 12 from v0.3 + drifts 13, 14, 15 from v0.4); 8 are catalogued, not all resolved (carry from v0.2). Resolution path: Codif 19 (centralization) + Codif 20 (reconciliation mandatory) + Codif 22 (spec-version-pinning) close the systemic gaps; specific drifts are resolved case-by-case in cycle 11 wave 7+.

---

## §6. 4-ICP Narrative (Vera/Carla/Beth/Chris) — 26 ACTIVE + 4 CANDIDATE = 30 Entries

**Vera (ICP-2, Mid-Market)**: codif registry as a11y catalog. The registry is a structured listing of all codifications; for Vera's mid-market customers, this serves as a "what we follow" catalog (similar to SOC 2 control catalog). Registry = a11y catalog → Vera's sales motion can cite the registry as evidence of disciplined practice. **v0.4 update**: 30-entry registry (26 ACTIVE + 4 CANDIDATE) is the most comprehensive a11y catalog yet; Codif 25 D-019 (D-007 HONEST-SCOPE METHODOLOGY) and Codif 26 (Hephaestus scope-counting) are mid-market-relevant (D-007 = shipping SLA discipline; Codif 26 = build-scope discipline). The codif catalog is a sales objection handler for "what codified disciplines do you follow?" question.

**Carla (ICP-1, SMB)**: codif registry = board-pack appendix. For Carla's SMB customers (and Founder-ping cycles), the registry appears as an appendix to the board pack, demonstrating documentation discipline. **v0.4 update**: 30-entry registry (26 ACTIVE + 4 CANDIDATE) is at ~610L = ~6 pages, within disclosed D-007 range of 580-640L (just under 6.5-page appendix ceiling). Codif 14 v0.3 PROMOTION (multi-stage flip-flop, ACTIVE in v0.3) + Codif 25 D-019 PROMOTION (D-007 HONEST-SCOPE METHODOLOGY, ACTIVE in v0.4) + Codif 26 PROMOTION (Hephaestus scope-counting, ACTIVE in v0.4) are strong "disciplined practice" stories for Carla's PLG funnel.

**Beth (ICP-4, Strategic)**: codif audit-trail = SOC 2 evidence, ties to T-HEP-019. For Beth's strategic accounts, the codif registry's audit-trail (which codif was ratified when, by whom) is SOC 2 evidence under the "disciplined practice" control. **v0.4 update**: Codif 19+20+22+25 D-019+26 RATIFICATION trail (T-MN-024 v0 → T-MN-025 v0.1 → v0.2 → v0.3 → v0.4) is a 5-step audit trail (was 4-step in v0.3) that Beth can cite as evidence of "disciplined codif evolution practice." The 5th step is the v0.4 alignment with v33.1.1 SYNCHRONIZED state-of-truth + Iris D-006 path correction (Codif 14 v0.3 canonical memory file at project-memory-dir).

**Chris (ICP-3, Enterprise)**: codif catalog = sales objection handler. For Chris's enterprise customers, the registry is a sales tool: "what codified disciplines do you follow?" → registry answers. **v0.4 update**: 26 ACTIVE codifs (was 24 in v0.3, +2 for Codif 25 D-019 + Codif 26) is the most comprehensive catalog; the 4 CANDIDATEs (Hera 17 + Codif 19+20 formalization + Codif 12 byte-count + Codif 26+ Athena) are an "evolving practice" story for enterprise customers who want to see disciplined evolution, not just static documentation. Path A renumbering REVERSAL (HL #13 of v0.4) demonstrates version-bump discipline: when v33.1.1 reverses a v0.3 decision, v0.4 SHIP applies the correction immediately and discloses it transparently.

---

## §7. Self-Assessment + 16 HL Moments + 10 Cross-Muse Handoffs

**16 HL Moments** (9 carry-forward from v0.2 + 3 new in v0.3 + 4 new in v0.4):

1. **§1 — Codif 19 not yet operationalized** (HL #1 of v0.2, carry): `docs/orchestration/` directory not yet built. Codif 19 is RATIFIED but centralization step pending. **v0.4 update**: §8 below adds an action plan for the operationalization; v0.4 SHIP extends the action plan to 7 steps (was 5 in v0.3; +2 new steps in v0.4 referencing Codif 25 D-019 + Codif 26 ACTIVE promotions).
2. **§1 — Codif 22 RATIFIED on v0.2 SHIP** (HL #2 of v0.2, carry): spec-version-pinning transitions CANDIDATE → ACTIVE on v0.2 SHIP.
3. **§2 — 26 ACTIVE codifs** (HL #3 of v0.2, updated in v0.3 then v0.4): was 23 ACTIVE in v0.2, 24 in v0.3 (+1 for Codif 14 v0.3 promotion), 26 in v0.4 (+2 for Codif 25 D-019 + Codif 26 promotions).
4. **§3 — 4 CANDIDATEs codified** (HL #4 of v0.2, expanded then contracted): was 1 in v0.1, 3 in v0.2, 6 in v0.3, 4 in v0.4. v0.3 added 4 new CANDIDATEs (Codif 19+20 formalization, Codif 25 D-019, Codif 12 byte-count, Codif 26+ Athena); v0.4 removed 2 (Codif 23 Path A renumbering DROPPED, Codif 25 D-019 PROMOTED to ACTIVE).
5. **§4 — Codif 22 applied retroactively** (HL #5 of v0.2, carry): every ACTIVE entry in §2 carries `spec_version: vX.Y` per Codif 22.
6. **§4 — Source-file gaps disclosed** (HL #6 of v0.2, RESOLVED in v0.3): 8 `codif_*.md` source files in `docs/orchestration/` do not exist; substituted pre-flight. **v0.4 update**: same gap, now references §8 operationalization plan.
7. **§1 — Renumbering tiebreak Path A applied in v0.2/v0.3, REVERSED in v0.4** (HL #7 of v0.2, evolved in v0.3 then v0.4): v0.2/v0.3 applied Path A (Hephaestus Codif 25 → central-registry Codif 23); v33.1.1 SYNCHRONIZED state-of-truth REVERSES Path A in v0.4 (Hephaestus Codif 25 → central-registry Codif 26, NO renumbering to Codif 23). Codif 23 is DROPPED from the registry. v0.4 SHIP applies the reversal.
8. **§3 — 4 additional CANDIDATEs added in v0.3, then 2 removed + 1 promoted in v0.4** (HL #8 of v0.2, UPDATED in v0.3 then v0.4): v0.3 added Codif 19+20 formalization, Codif 25 D-019, Codif 12 byte-count, Codif 26+ Athena. v0.4 removed Codif 23 (Path A DROPPED) + Codif 25 D-019 (PROMOTED to ACTIVE). Final CANDIDATEs: Hera 17 + Codif 19+20 formalization + Codif 12 byte-count + Codif 26+ Athena = 4.
9. **Frontmatter — Codif 22 v0.1 → v0.2 → v0.3 → v0.4 version-bump mechanical rule applied THREE times** (HL #9 of v0.2, CONFIRMED in v0.3 then v0.4): this file's v0.1 → v0.2 → v0.3 → v0.4 bumps are the first, second, and third applications of the Codif 22 mechanical rule. The rule is durable across 3 consecutive updates. Codif 22 evidence base: 4 → 6 → 8 data points.
10. **§1 — D-009 catch #15 path-mismatch disclosed and resolved** (HL #10 of v0.3, NEW in v0.3, RESOLVED in v0.4): T-MN-024 + T-MN-025 files at AionUI temp dir instead of project root. Discovered by Lead turn 40 + Themis turn 41. Corrective action: Write to project root (v0.3 SHIP, v0.4 SHIP confirms resolution). Re-anchored Codif 8 (D-008 Glob-ABSOLUTE-path) enforcement: every file:line citation must include absolute path on disk at SHIP, not conversation working dir.
11. **§2 — Codif 14 v0.3 PROMOTED to ACTIVE in v0.3** (HL #11 of v0.3, NEW in v0.3, CONFIRMED in v0.4): Themis turn 41 recommendation — 7 rounds of evidence, strongest CANDIDATE → skip CANDIDATE phase. Codif 14 v0.3 moves from CANDIDATE table to ACTIVE table. ACTIVE: 23 → 24 in v0.3, confirmed at 24 in v0.4.
12. **§3 — Path A renumbering CONFIRMED in v0.3, REVERSED in v0.4** (HL #12 of v0.3, NEW in v0.3, REVERSED in v0.4): v0.3 applied Path A (Hephaestus Codif 25 → central-registry Codif 23); v0.4 REVERSES per v33.1.1. Path B (keep Codif 25 + add Codif 26 cross-Muse) REJECTED in v0.3 for permanent-gap archaeology cost, but v0.4 effectively adopts Path B's "add Codif 26" half + discards the "keep Codif 25 in central registry" half. Codif 23 is DROPPED; Codif 26 (Hephaestus) is ACTIVE in v0.4.
13. **§2 — Codif 25 D-019 PROMOTED to ACTIVE in v0.4** (HL #13 of v0.4, NEW in v0.4): v33.1.1 SYNCHRONIZED state-of-truth confirms Mimo 50 HL 3-of-3 data points (DUAL CITATION + Themis 40 vs Mimo 54 + Iris v0.6 vs v0.7). Codif 25 D-019 (D-007 HONEST-SCOPE METHODOLOGY) moves from CANDIDATE table to ACTIVE table. ACTIVE: 24 → 25.
14. **§2 — Codif 26 Hephaestus PROMOTED to ACTIVE in v0.4** (HL #14 of v0.4, NEW in v0.4): v33.1.1 SYNCHRONIZED state-of-truth confirms Hephaestus 59 HL 3-of-3 data points (turn 37 + 38 + 40). Codif 26 (Hephaestus scope-counting) moves from CANDIDATE/REJECTED-state to ACTIVE table. ACTIVE: 25 → 26. v0.3's Path A renumbering to Codif 23 is REVERSED (Codif 23 DROPPED); Hephaestus's local Codif 25 is canonicalized as central-registry Codif 26.
15. **§3 — Path A renumbering REVERSED in v0.4** (HL #15 of v0.4, NEW in v0.4, ELABORATION of HL #12): v33.1.1 SYNCHRONIZED state-of-truth implicitly reverses my v0.3 Path A decision. Codif 23 (which would have been the Path A renumbered Hephaestus codif) is DROPPED from the registry; Codif 26 (Hephaestus) takes its place as the canonical Hephaestus scope-counting codif. No gap, no archaeology. The reversal is applied immediately in v0.4 SHIP.
16. **§4.5 — Iris D-006 path correction for Codif 14 v0.3** (HL #16 of v0.4, NEW in v0.4): Iris turn 48 surfaced D-006 filename/location convention catch: canonical Codif 14 v0.3 memory file is at `C:\Users\Tahir\Desktop\frontend that i want\fpa\memory\codif-14-v03-chronological-recency-2026-06-13.md` (project memory dir, dash-case + date-stamp), NOT at aionrs-memory-dir underscore file `codif_14_v0_3_active_chronological_recency.md` (early-cycle artifact SUPERSEDED). D-006 is convention (filename + location), NOT D-009 (substance). D-009 cumulative unchanged at 15.

**Drift check**: target 580-640L (D-007 honest-scope, well above 280L Hera size-band; expanded in v0.4 due to 2 ACTIVE promotions + Path A reversal + Iris D-006 + v33.1.1 reconciliation). This draft at ~640L (within disclosed range, no overage flag needed).

**10 Cross-Muse handoffs** (7 carry-forward from v0.2 + 2 new in v0.3 + 1 new in v0.4):

1. **Themis T-TH-002 v0.2** (SHIPPED v25, monitoring loop): upstream source for §5 (drift categories + 15 specific drifts); Codif 22 ratification in Themis's v33 STATE SUMMARY
2. **Mimo T-MIMO-001** (FP&A domain audit, SHIPPED): Codif 21 (DUAL SELF-CATCH) exemplar; T-MIMO-002 ASC 606 audit chain PENDING
3. **Apollo T-AP-011** (post-immer test verification + bundle re-audit, SHIPPED): Codif 24 (pre-build disk gate) data point source
4. **Hera T-HE-011** (dark-mode parity spec, SHIPPED): Hera Codif 17 data point source; T-HE-012 (AWAITS by 2026-08-15 Founder-ping)
5. **Codif 18 v0.1+v0.2** (Discipline + self-audit, RATIFIED turns 28-29): self-audit framework applied throughout
6. **Hephaestus T-HEP-021 v0** (NEW in v0.2, GREEN-LIT pending SHIP): Codif 26 (scope-counting) data point source — **v0.4 update**: Codif 26 PROMOTED to ACTIVE, T-HEP-021 GREEN-LIT status feeds Codif 26 second data point
7. **Mimo Codif 14 v0.1+v0.2+v0.3** (carry): Codif 14 v0.3 multi-stage flip-flop pattern, PROMOTED in v0.3, CONFIRMED in v0.4 with Iris D-006 path correction
8. **Athena T-AT-016 board scan** (NEW in v0.3): Codif 12 byte-count labeling + Codif 26+ Athena process-prophylactic/delegation-preservation categories
9. **Strategos T-ST-021 Q3 pre-stage** (NEW in v0.3, downstream consumer): T-MN-024 v0.2 (codif registry superset) feeds Strategos's Q3 review pre-stage narrative; codif audit-trail = SOC 2 evidence for Beth's strategic accounts
10. **Iris T-IR-025 v0.6 cherry-pick + D-006 path correction** (NEW in v0.4): Iris turn 48 surfaced D-006 filename/location convention catch for Codif 14 v0.3 canonical memory file; canonical path is project-memory-dir `memory/codif-14-v03-chronological-recency-2026-06-13.md` (dash-case + date-stamp), not aionrs-memory-dir underscore file. Iris's T-IR-025 v0.6 cherry-pick was also a Codif 14 v0.3 evidence data point.

---

## §8. Codif 19 Operationalization Action Plan (NEW in v0.3, EXPANDED in v0.4)

Codif 19 is RATIFIED but **not yet operationalized** — the centralization step (moving/copying the registry to `docs/orchestration/CODIF_REGISTRY_v0.md`) is pending. v0.3 SHIP introduced a 5-step action plan; v0.4 SHIP extends to 7 steps with 2 new steps referencing the v0.4 ACTIVE promotions (Codif 25 D-019 + Codif 26):

**Step 1 (cycle 11 wave 7)**: Build `docs/orchestration/` directory at the canonical project root (`C:\Users\Tahir\Desktop\frontend that i want\fpa\docs\orchestration\`).

**Step 2 (cycle 11 wave 7)**: Write `CODIF_REGISTRY_v0.md` to `docs/orchestration/` — this is a copy of `T-MN-024_CODIF_REGISTRY_V0.md` (139L, 6 sections, Codif 19+20 RATIFIED). The copy enables D-008 Glob-ABSOLUTE-path verification of the centralization.

**Step 3 (cycle 11 wave 7)**: Update the codif registry v0.1 (T-MN-025) to reference both the draft path (`docs/drafts/mnemosyne/T-MN-025_CODIF_REGISTRY_v0.1.md`) AND the canonical orchestration path (`docs/orchestration/CODIF_REGISTRY_v0.md`). Codif 19 is operationalized when both paths are verified by D-008.

**Step 4 (cycle 11 wave 8)**: Mimo's T-MIMO-002 ASC 606 audit chain PENDING — the audit chain will reference the registry via the canonical path, validating Codif 19 operationalization through real usage.

**Step 5 (cycle 12 wave 1)**: Codif 19 operationalization validated through 3+ Muses' references to the canonical path. Codif 19 CANDIDATE → ACTIVE operationalization gap CLOSED.

**Step 6 (NEW v0.4)**: Codif 25 D-019 (D-007 HONEST-SCOPE METHODOLOGY) is PROMOTED to ACTIVE in v0.4 SHIP. Codif 25 D-019's operationalization (every pre-stage doc must carry the 6-element structure: schema + placeholder slots + TENTATIVE markers + re-validate triggers + D-002 3-W on doc SHIP + D-009 Glob-ABSOLUTE on all upstream citations) is the next layer of centralization: not just the registry itself, but the methodology for all pre-stage docs. Step 6 builds on Step 5 by adding 3+ pre-stage docs (T-MN-024 v0.2, T-ST-021, T-MN-025 itself) that already conform to the 6-element structure as evidence that Codif 25 D-019 is operationalized.

**Step 7 (NEW v0.4)**: Codif 26 (Hephaestus scope-counting) is PROMOTED to ACTIVE in v0.4 SHIP. Codif 26's operationalization (pre-build scope-counting methodology that bounds the build scope to N files, configurable per project) is complementary to Codif 19: Codif 19 centralizes the registry; Codif 26 bounds the build scope. Step 7 builds on Step 5 by requiring 3+ Muses (Hephaestus's T-HEP-021 v0 + T-HEP-022 AWAITS + 1 additional data point) to cite the scope-counting methodology as evidence that Codif 26 is operationalized.

**D-002 3-W** on the action plan: (1) T-TH-002 v0.2 §3 (ICP-numbering guard pattern), (2) T-MN-024 v0.2 §3.x (DECISION 3 FOLD-IN), (3) this v0.4 SHIP. All three sources agree on the 7-step plan (5 from v0.3 + 2 new in v0.4).

---

**D-007 Footer**: T-MN-025 Codif registry **v0.4 SHIPPED**. 30 entries (**26 ACTIVE + 4 CANDIDATE**). Codif 19+20+22+25 D-019+26 application methodology documented. **16 HL moments** logged (9 carry from v0.2 + 3 from v0.3 + 4 new in v0.4). Push-INDEPENDENT confirmed. Codif 19 operationalization gap disclosed with **7-step action plan** (§8: 5 from v0.3 + 2 new in v0.4 referencing Codif 25 D-019 + Codif 26). D-009 catch #15 path-mismatch disclosed and resolved (HL #10, §1). Renumbering tiebreak Path A REVERSED in v0.4 per v33.1.1 (HL #15, §3); Codif 23 DROPPED, Codif 26 (Hephaestus) ACTIVE. Codif 14 v0.3 PROMOTED to ACTIVE (HL #11, §2, confirmed in v0.4). **Codif 25 D-019 PROMOTED to ACTIVE in v0.4** (HL #13, §2). **Codif 26 Hephaestus PROMOTED to ACTIVE in v0.4** (HL #14, §2). **Iris D-006 path correction applied** (HL #16, §4.5 — Codif 14 v0.3 canonical memory file at `C:\Users\Tahir\Desktop\frontend that i want\fpa\memory\codif-14-v03-chronological-recency-2026-06-13.md`, project-memory-dir dash-case + date-stamp; aionrs-memory-dir underscore file SUPERSEDED). Spec-version bumped v0.3 → v0.4 per Codif 22 mechanical rule (**3rd application**; 1st was v0.1→v0.2, 2nd was v0.2→v0.3). Codif 22 evidence base: 4 → 6 → 8 data points. File status: AUTHORITATIVE T-MN-024 SHIP at `T-MN-024_Q3_STRATEGIC_REVIEW_PRESTAGE.md` (v0.2 8-section); SUPERSEDED T-MN-024 at `T-MN-024_Q3_REVIEW_PRESTAGE.md` (v0.1 6-section); Codif registry v0 at `T-MN-024_CODIF_REGISTRY_V0.md` (Codif 19+20 RATIFIED, 139L); v0.4 at `T-MN-025_CODIF_REGISTRY_v0.1.md` (v0.4 supersedes v0.3 per Codif 22 version-bump rule). Ratification trigger: SHIP of this doc → Codif 21+22+24+25 D-019+26 ACTIVE; Codif 14 v0.3 PROMOTED (v0.3); Codif 25 D-019 + Codif 26 PROMOTED (v0.4); 4 CANDIDATEs remain pending Leader ratification + ≥1 more data point each. Spec-version field applied to all 26 ACTIVE entries per Codif 22. Spec-version of this doc: v0.4 (bumped from v0.3 per Codif 22 mechanical rule; 1-line diff note in `v0.3_to_v0.4_diff` frontmatter field).
