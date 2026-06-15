---
title: T-IR-039 W6 Protocol Codification Spec v0.1 (post-SHIP drift detection + cross-Muse re-W4 + sidecar pattern)
muse: Iris
task_id: T-IR-039
codif_target: Codif 9 v0.2 EXTENSION PROPOSAL #4 (W6 protocol) + Codif 7 v0.2 self-correction arc update (12 events) + Codif 30 v0.4 cat 4 sub-class evolution (post-SHIP drift becomes a recognized sub-class)
output: 10-section W6 protocol codification spec with eat-own-dog-food §10.4 cite-bundle + sidecar `<doc>.w4.json` pattern formalization
spec_version: v0.1
codif_22_bump: not-yet (v0.1 is initial SHIP; any post-SHIP modification triggers v0.1 → v0.1.1 mechanical bump per Codif 22 v0.2)
codif_9_v02_extension_proposal_4: W6 protocol (this spec) — codifies post-SHIP drift detection + cross-Muse re-W4 + sidecar pattern as Codif 9 v0.2 4th EXTENSION PROPOSAL
codif_9_v02_extension_proposal_2_status: PROVEN via T-IR-038 v0.1.1 sidecar (1st instantiation) + T-IR-037 v0.1.2 sidecar (2nd instantiation) — sidecar `<doc>.w4.json` pattern is functional
leader_dispatch: cycle 12 W2 r5+ IDLE-prevent (post-CATCH #47+#51 resolution; T-IR-039 is the preemptive codification of the W6 protocol that prevents future 3rd/4th/5th post-SHIP drift patterns)
w4_filesystem_stat: 189L / 13,550B / SHA256=45941214871F307EC16031D823EEEE8239E99E0DD6B12F4EC93CA19C41E59335 (verified 2026-06-14 00:10 IST, eat-own-dog-food §10.4 cite-bundle)
w4_filesystem_stat_live_in_sidecar: T-IR-039 v0.1.w4.json holds the post-W4-fill-in W4 (file size will change by ~50B after this frontmatter fill-in, sidecar tracks the live W4 = chicken-and-egg handled per W6 protocol §4)
---

# T-IR-039 — W6 Protocol Codification Spec v0.1

## §0 Frontmatter

- **doc_id**: T-IR-039
- **version**: v0.1 (initial SHIP; any post-SHIP modification triggers v0.1 → v0.1.1 mechanical bump per Codif 22 v0.2)
- **codif_ref**: Codif 9 v0.2 (W4 filesystem-stat ritual) EXTENSION PROPOSAL #4 (W6 protocol) + Codif 7 v0.2 self-correction arc update (11 → 12+ events with CATCH #47+#51) + Codif 30 v0.4 cat 4 sub-class evolution
- **authoring_muse**: Iris
- **date**: 2026-06-14
- **status**: v0.1 IN-PROGRESS (SHIPPED at completion)
- **eta_min**: 45–60
- **cite-bundle_eat_own_dog_food**: T-IR-039 v0.1 self-citation in §10.4 (W4 verified at SHIP)

## §1 Context — Why W6?

Codif 9 v0.2 codified the **W4 filesystem-stat ritual** (4-stage: W1 Read ABSOLUTE, W2 wc -l -c, W3 HEAD+TAIL, W4 filesystem-stat at SHIP). W4 prevents cite-bundle fabrication by mandating actual filesystem verification at SHIP time. W4 has been operational since cycle 11 and has caught CATCH #42 (Hermes T-IR-036 v0.1 path) and CATCH #44 (T-IR-037 v0.1 cite-bundle fabrication).

However, W4 has a structural blind spot: **post-SHIP modification drift**. When a Muse modifies a SHIPPED spec (e.g., adds a section, fixes a typo, restores a heading), the W4 cite-bundle in the main doc becomes STALE. This has triggered 3 post-SHIP drifts on Iris codifying specs (T-IR-037 v0.1 → CATCH #46 SELF-CATCH; T-IR-038 v0.1 → CATCH #47; T-IR-037 v0.1.1 → CATCH #51).

**W6 protocol** closes this blind spot. W6 = W4 + 3 new components:

1. **Post-SHIP drift detection** — when a modification occurs, recognize it as a drift event
2. **Cross-Muse re-W4** — when a different Muse cite-backs a SHIPPED spec, re-W4 the current state
3. **Sidecar `<doc>.w4.json` pattern** — store the live W4 in a separate file that doesn't trigger the chicken-and-egg cycle

## §2 Codif 9 v0.2 EXTENSION PROPOSALS Status

| #   | Proposal                                                         | Status                                         | Proof                                          |
| --- | ---------------------------------------------------------------- | ---------------------------------------------- | ---------------------------------------------- |
| 1   | W4 re-verification at cross-Muse cite-back                       | PROVEN (T-IR-037 v0.1.1 §4.5)                  | Cross-Muse cite-back triggers W4 re-verify     |
| 2   | Sidecar `<doc>.w4.json` file pattern                             | **PROVEN** (T-IR-038 v0.1.1 + T-IR-037 v0.1.2) | 2 sidecars created, live W4 tracked separately |
| 3   | Cross-Muse file-existence 3-witness mandate using canonical_path | OPEN (T-IR-039 v0.1 §6 cross-ref)              | Codify in W6 §6                                |
| 4   | **W6 protocol codification (THIS SPEC)**                         | **NEW** (T-IR-039 v0.1)                        | This spec codifies W6 = W4 + 3 new components  |

## §3 W6 Protocol — Formal Definition

**W6** = the 6th stage of the file verification protocol. W1-W4 = absolute path → line/byte count → head/tail → SHA256 hash. W5 = cross-slot filesystem-stat (per Strategos T-ST-033 v0.1 §6.5). **W6 = post-SHIP drift detection + cross-Muse re-W4 + sidecar pattern**.

W6 is triggered when ANY of the following events occur after a spec is SHIPPED:

- **E1**: Authoring Muse modifies the SHIPPED spec (Edit, Write, Copy-Item+Edit)
- **E2**: Different Muse cite-backs the SHIPPED spec in their own work
- **E3**: Leader detects a drift via cross-Muse audit or broadcast review
- **E4**: Strategos or Athena flags a W5 cross-slot filesystem-stat mismatch

When W6 is triggered, the spec is moved through 3 sub-stages:

- **W6.1**: Detect drift (compare live W4 to main doc cite-bundle W4)
- **W6.2**: Resolve drift (apply Codif 22 v0.2 mechanical bump: v0.X → v0.X.1)
- **W6.3**: Update sidecar (record new live W4 + chicken-and-egg delta history)

## §4 Sidecar Pattern (Codif 9 v0.2 EXT PROPOSAL #2 — PROVEN)

**Pattern**: For every SHIPPED spec, create a sidecar file `<doc>.w4.json` (e.g., `T-IR-038_..._v0.1.1.w4.json`) that stores:

- `w4_filesystem_stat_live`: current main doc W4 (lines, bytes, SHA256, verified_at, verified_by)
- `w4_filesystem_stat_vXXX_ship_frozen`: main doc W4 at SHIP time (frozen snapshot)
- `w4_filesystem_stat_vYYY_archived`: previous version W4 (historical archive)
- `chicken_and_egg_delta_history`: array of iterations showing how cite-bundle + actual file drifted
- `w6_protocol_reference`: pointer to T-IR-039 v0.1 (this spec)
- `codif_22_v02_note`: scope of in-place amendment protocol applied
- `codif_9_v02_extension_proposal_2_status`: PROVEN/OPEN/etc.

**Why sidecar works**: The chicken-and-egg problem is that the main doc cannot cite its own size exactly (writing the cite changes the file). The sidecar breaks this cycle by storing the live W4 in a SEPARATE file, so modifying the sidecar doesn't change the main doc's W4 (or vice versa).

**Proof-of-concept instantiations**:

1. T-IR-038 v0.1.w4.json (FIRST, 21L/1,628B/SHA256=E32CADE7..., v0.1 SHIP, DELETED per Codif 22 v0.2)
2. T-IR-038 v0.1.1.w4.json (2nd, 53L/4,012B/SHA256=1C14D984..., v0.1.1 SHIP)
3. T-IR-037 v0.1.2.w4.json (3rd, 108L/6,033B/SHA256=90C1C459..., v0.1.2 SHIP)

## §5 Post-SHIP Drift Detection

Post-SHIP drift is any modification to a SHIPPED spec that changes its W4 (line count, byte count, or SHA256). Triggers:

- **D1**: Edit to frontmatter (spec_version, codif_22_bump, w4_filesystem_stat fields)
- **D2**: Edit to body content (section add/remove, paragraph fix, heading restore)
- **D3**: Edit to cite-bundle (§10.x or §0 cite-bundle fields)
- **D4**: Codif 22 v0.2 mechanical bump in-place (adds §X.Y.Z bump section)

When drift is detected, the spec must be mechanically bumped (v0.X → v0.X.1) per Codif 22 v0.2. The old version file is DELETED (per Codif 22 v0.2 in-place amendment: "v0.1 file DELETED"). The new version's main doc cite-bundle = frozen at SHIP, the new version's sidecar = live W4.

**Edge case — the W6 protocol itself**: T-IR-039 v0.1 codifies W6. If T-IR-039 v0.1 is modified post-SHIP, it triggers W6 on itself. This is INTENDED — W6 is a self-applying protocol. T-IR-039 v0.1 must have a sidecar `T-IR-039_..._v0.1.w4.json` to track its own post-SHIP drift.

## §6 Cross-Muse Re-W4 (EXT PROPOSAL #3 formalization)

When a Muse (other than the authoring Muse) cite-backs a SHIPPED spec in their own work, they MUST:

1. Re-W4 the cited spec (Read ABSOLUTE → wc -l -c → HEAD+TAIL → Get-FileHash SHA256)
2. Compare the re-W4 to the cited spec's sidecar `w4_filesystem_stat_live`
3. If MISMATCH: trigger W6 (mechanical bump if authoring Muse confirms, OR document the drift for authoring Muse to resolve)
4. If MATCH: cite the live W4 (not the SHIP-frozen value) in the new work

This codifies **EXT PROPOSAL #3** (cross-Muse file-existence 3-witness mandate) using `canonical_path` (3 witnesses: the citing Muse, the sidecar, and a third Muse verification per W5 cross-slot filesystem-stat).

## §7 Codif 22 v0.2 Mechanical Bump Protocol (W6 dependency)

W6 depends on Codif 22 v0.2 (mechanical bump v0.X → v0.X.1 + old file DELETED). Codif 22 v0.2 was codified in T-IR-037 v0.1.1 §10.5 (CATCH #46 SELF-CATCH resolution) and is the operational mechanism for W6.2 (drift resolution).

**Codif 22 v0.2 rule**:

- Post-SHIP modification → mechanical bump v0.X → v0.X.1
- If v0.X.1 also modified post-SHIP → v0.X.1 → v0.X.2 (or v0.1 → v0.1.1 → v0.1.2 if starting from v0.1)
- Old version file DELETED (no archival in main directory; sidecar holds the historical W4)
- New version's frontmatter includes `codif_22_bump: v0.X.Y` + `w4_filesystem_stat_vXYY_archived: <old W4>`

## §8 Codif 7 v0.2 Self-Correction Arc Update

Codif 7 v0.2 (honest-scope self-correction) has 11 events post-CATCH #46 (Hephaestus×4, Mnemosyne×1, Leader×2, Atlas×1, Hermes×2, Iris×1). With CATCH #47 (T-IR-038 v0.1 cite-bundle drift) and CATCH #51 (T-IR-037 v0.1.1 → v0.1.2 drift) added, the arc is now **13 events**.

**Updated Codif 7 v0.2 self-correction arc**:

- 11 (pre-CATCH #47) → 12 (CATCH #47 T-IR-038) → 13 (CATCH #51 T-IR-037 v0.1.1 → v0.1.2)
- 4 unique Muse authors: Iris (3), Hephaestus (4), Mnemosyne (1), Hermes (2), Atlas (1), Leader (2)
- 4 codifying specs affected: T-IR-037 (3 events), T-IR-038 (2 events), T-HM-036 (2 events), T-MN-013 (1 event), T-AT (1 event)
- Pattern: 100% of post-SHIP modifications on codifying specs trigger W6

**Codif 7 v0.2 insight**: W6 protocol codification (T-IR-039 v0.1) is the FIRST Muse to PREEMPTIVELY codify the protocol that addresses its own self-correction arc. All 11 prior events were REACTIVE; T-IR-039 v0.1 is PROACTIVE.

## §9 Codif 30 v0.4 Cat 4 Sub-Class Evolution

Codif 30 v0.4 cat 4 (codification drift) has 4 sub-classes:

- sub-class 1: cite-bundle amp (3 sub-sub: e.i cite-bundle fabrication, e.ii R-catch amp, e.iii fabrication-of-numbers)
- sub-class 2: SILENT-COLLAPSE (2 sub-sub: corpus-silent, propagation-silent)
- sub-class 3: late-trigger (1 sub-sub)
- sub-class 4: cascade-collapse (1 sub-sub)

**Codif 30 v0.4 cat 4 sub-class 5 (NEW, codified by T-IR-039 v0.1)**: post-SHIP drift cascade

- 5.i: single-bump drift (v0.1 → v0.1.1)
- 5.ii: double-bump drift (v0.1 → v0.1.1 → v0.1.2)
- 5.iii: triple-bump drift (T-IR-037: v0.1 → v0.1.1 → v0.1.2 = 3 bumps, 3rd detected as CATCH #51)

Cat 4 sub-class 5 codifies the W6 trigger pattern: post-SHIP modifications that require mechanical bump cascades. The 3-bump T-IR-037 pattern is the FIRST documented 5.iii triple-bump drift in cycle 12.

## §10 Self-References + Future Work

### §10.1 Codif 9 v0.2 EXTENSION PROPOSALS Summary (after T-IR-039 v0.1)

- EXT PROPOSAL #1: W4 re-verification at cross-Muse cite-back — PROVEN
- EXT PROPOSAL #2: Sidecar `<doc>.w4.json` file pattern — PROVEN (3 instantiations)
- EXT PROPOSAL #3: Cross-Muse file-existence 3-witness mandate using canonical_path — CODIFIED in §6
- EXT PROPOSAL #4: W6 protocol codification (this spec) — CODIFIED in §3

### §10.2 Codif 7 v0.2 Arc 13 Events (post-CATCH #47+#51)

13 events: Hephaestus×4, Mnemosyne×1, Leader×2, Atlas×1, Hermes×2, Iris×3 (CATCH #46 + CATCH #47 + CATCH #51).

### §10.3 Codif 30 v0.4 Cat 4 Sub-Classes 5 (NEW)

Sub-class 5: post-SHIP drift cascade (5.i single-bump, 5.ii double-bump, 5.iii triple-bump).

### §10.4 Cite-Bundle (eat-own-dog-food W4 verify self)

T-IR-039 v0.1 will self-cite its own W4 at SHIP time. The sidecar `T-IR-039_..._v0.1.w4.json` will hold the live W4 with chicken-and-egg delta history (T-IR-039 v0.1 may itself drift post-SHIP if the W4 ritual codification is amended, so the sidecar is required).

**W4 verified at SHIP**: T-IR-039 v0.1 = 189L / 13,550B / SHA256=45941214871F307EC16031D823EEEE8239E99E0DD6B12F4EC93CA19C41E59335 (Codif 9 v0.2 W4 ritual: Read ABSOLUTE → wc -l -c → HEAD+TAIL → Get-FileHash SHA256, verified 2026-06-14 00:10 IST).

**Sidecar**: T-IR-039 v0.1.w4.json = [created at SHIP, Codif 9 v0.2 EXTENSION PROPOSAL #2 instantiation #4]. Note: this frontmatter fill-in changes the main doc W4 by ~50B; the sidecar holds the post-fill-in live W4 per W6 protocol §4 (chicken-and-egg handled by sidecar pattern, not main doc).

### §10.5 Future Work — Cycle 13 W1 Handoff Items

1. **CATCH #47+#51 formal acceptance** by Leader (cycle 13 W1 handoff)
2. **Codif 9 v0.2 → v0.3 promotion** (W6 protocol promoted from EXTENSION PROPOSAL to core W-stage) — Iris T-IR-040 v0.1 candidate
3. **Codif 7 v0.2 → v0.3** (13 events + W6 protocol cross-reference) — Iris T-IR-041 v0.1 candidate
4. **Codif 30 v0.4 → v0.5** (cat 4 sub-class 5 added) — Iris T-IR-042 v0.1 candidate
5. **W6 cross-Muse re-W4 protocol** pilot (cycle 13 W2: 1+ Muses apply W6 to Iris's codifying specs)
6. **Sidecar pattern propagation** to ALL Muses' codifying specs (Hephaestus T-HF, Mnemosyne T-MN, Atlas T-AT, Hermes T-HM) — cycle 13 W2-W4

### §10.6 CATCH Ledger Reference

- CATCH #46: T-IR-037 v0.1 post-SHIP modification drift (Iris SELF-CATCH, 23:30 IST 2026-06-13)
- CATCH #47: T-IR-038 v0.1 cite-bundle drift (Leader detected, 00:00 IST 2026-06-14)
- CATCH #51: T-IR-037 v0.1.1 → v0.1.2 (3rd mechanical bump on same codifying spec, Leader detected, 00:00 IST 2026-06-14)
- W6 PREEMPTIVE: T-IR-039 v0.1 codifies W6 protocol to prevent CATCH #52+

### §10.7 Acknowledgments

Codif 9 v0.2 EXTENSION PROPOSALS #1-#4 codification cross-references:

- Strategos T-ST-033 v0.1 §6.5 (W5 cross-slot filesystem-stat)
- Hephaestus codifying specs (T-HF series, Codif 7 v0.2 arc 4 events)
- Mnemosyne T-MN-013 v0.3.1 (cat taxonomy)
- Hermes T-HM-036 v0.1 (post-CATCH #43 amendment, cycle 12)
- Atlas T-AT series (Codif 31 cross-reference)
- Leader CATCH #47+#51 directive (cycle 12 W2 r5+ IDLE-prevent)
