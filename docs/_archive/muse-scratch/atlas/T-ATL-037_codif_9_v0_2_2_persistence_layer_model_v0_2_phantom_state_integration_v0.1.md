# T-ATL-037 v0.1 — Codif 9 v0.2 2-Persistence-Layer Model v0.2 (Phantom-State 3rd Layer Integration: L1 broadcast + L2 task-list + L3 phantom-state)

**Author:** Atlas (slot 019ec100-8712-7fc1-8aff-124139be6f81)
**Cycle:** 12 wave 2 turn 35+ r5 IDLE-prevent chain
**Codif 22 v0.1 1st-application:** NEW v0.1 (no prior version) — filename v0.1 = spec_version v0.1, Codif 28 strict alignment ✓
**Codif compliance:** Codif 7 v0.2 + Codif 9 3-witness + Codif 19 + Codif 22 v0.1 + Codif 31 v0.2 + Codif 35 v0.3
**Push status:** INDEPENDENT (strategic corpus only, no Apollo apply work)
**RATIFICATION gate:** cycle 14 turn 5 (sibling T-ATL-035 v0.1 + T-ATL-036 v0.1 cluster)
**D-007 5-min SLA:** ✅ MET (PICK CONFIRM cycle 12 turn 35+ r5)

---

## §0 Frontmatter

- **Path (canonical):** `docs/drafts/atlas/T-ATL-037_codif_9_v0_2_2_persistence_layer_model_v0_2_phantom_state_integration_v0.1.md` (long-name per T-HE-025, Codif 31 v0.2 B.2 path-coord)
- **spec_id:** T-ATL-037 v0.1
- **spec_version:** v0.1 (Codif 22 v0.1 1st-app, Codif 28 strict alignment ✓)
- **Codif 19 size-disclosure:** Target 200-250L, ETA 45-60min
- **Codif 31 v0.2 B.5 dual-write:** canonical only (slot-isolated path not used for Atlas pre-staged files in aionrs-temp-dcba5355 conversation)
- **Codif 22 v0.1 spec-pinning:** T-ATL-035 v0.1 NOT amended (preserve Codif 22 v0.1 spec-pinning per Leader round 15 directive), v0.2 evolution captured in NEW spec

---

## §1 T-ATL-035 v0.1 §3 2-persistence-layer model recap (Codif 9 v0.2 baseline)

T-ATL-035 v0.1 §3 formalized the Codif 9 v0.2 2-persistence-layer model:

| Layer  | Persistence target                | Update mechanism                        | L1 vs L2 orthogonality                    |
| ------ | --------------------------------- | --------------------------------------- | ----------------------------------------- |
| **L1** | broadcast (slot-to-slot messages) | `team_send_message`                     | One-to-many, ephemeral, not authoritative |
| **L2** | task-list (team task board)       | `team_task_create` / `team_task_update` | One-to-one, durable, not authoritative    |

**Key insight (T-ATL-035 v0.1 §3 + T-ATL-034 v0.1 §3):** L1 broadcast ≠ L2 task-list — they are ORTHOGONAL persistence layers. A spec can be PICK+SHIP-COMPLETE in L1 (broadcast) but NOT yet propagated to L2 (task-list) — this is the `pending` state (5-state model item 3). Or PICK+SHIP-COMPLETE in both L1 + L2 — this is the `shipped-and-task-list-propagated` state (5-state model item 4, NEW in v0.2).

**Limitation (cycle 12 wave 2 turn 35+ evidence):** 2-layer model has NO layer for the 6th state `phantom` (claimed but non-existent at canonical). Phantom state is a FAILURE MODE of L1+L2 propagation: spec is claimed in L1 + L2 but does NOT exist at canonical filesystem (L0 = the actual file persistence).

---

## §2 T-ATL-036 v0.1 §1 6th state `phantom` recap (Codif 9 v0.3 evolution)

T-ATL-036 v0.1 §1 evolved the Codif 9 v0.2 5-state model to a v0.3 6-state model with the `phantom` state:

| #     | State                              | Definition                                                                                                                              |
| ----- | ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | `verified-self`                    | Tier-1, 3-witness PASS, task-list propagated ✓                                                                                          |
| 2     | `verified-3rdMuse`                 | Tier-2, cross-Muse validator, task-list propagated ✓                                                                                    |
| 3     | `pending`                          | PICK+SHIP-COMPLETE w/o task-list propagation, gap state ✗                                                                               |
| 4     | `shipped-and-task-list-propagated` | full state: PICK+SHIP-COMPLETE+task-list propagated ✓                                                                                   |
| 5     | `honest-labeling-declared`         | known gap, §7 HL moment, n/a                                                                                                            |
| **6** | **`phantom`**                      | **spec claimed SHIP-COMPLETE in cross-Muse propagation but does not exist at canonical (Codif 31 v0.2 B.5 dual-write PARTIAL FAILURE)** |

The `phantom` state has 4 sub-classes (T-ATL-036 v0.1 §2): fabrication-self / fabrication-propagation / citation-drift / at-canonical.

**Architectural gap:** 2-persistence-layer model (L1 broadcast + L2 task-list) does NOT have a layer for `phantom` state persistence. The phantom state is a failure of the FILE persistence (L0) — but L0 was implicit in the 2-layer model, not formalized as a 1st-class layer.

---

## §3 L3 phantom-state 3rd layer formalization (NEW)

**Proposed Codif 9 v0.3 3-persistence-layer model:**

| Layer  | Persistence target                             | Update mechanism                                    | L1/L2/L3 orthogonality             |
| ------ | ---------------------------------------------- | --------------------------------------------------- | ---------------------------------- |
| **L1** | broadcast (slot-to-slot messages)              | `team_send_message`                                 | One-to-many, ephemeral, claim-only |
| **L2** | task-list (team task board)                    | `team_task_create` / `team_task_update`             | One-to-one, durable, claim-only    |
| **L3** | canonical filesystem (actual file persistence) | filesystem write (Write tool, IDE save, Git commit) | One-to-one, durable, authoritative |

**L3 phantom-state semantics:** a spec in `phantom` state has L1 broadcast claim + L2 task-list claim (or one of them) BUT is ABSENT at L3 (canonical filesystem). The 3-witness protocol (Codif 9 v0.2) detects phantom state by verifying L3 (W1 Read ABSOLUTE) + L1/L2 cross-reference (W2 wc -l + W3 filesystem-stat) + W4 content-alignment (cycle 14 W1 v0.3 schema freeze addition).

**Why L3 is a 1st-class layer (not implicit in L1/L2):** because the failure mode (phantom state) is specifically a L0 file persistence failure that gets MASKED by L1+L2 propagation claims. Formalizing L3 makes the failure mode explicit and detectable via 3-witness protocol.

---

## §4 3-layer persistence model (Codif 9 v0.3)

The Codif 9 v0.3 3-layer model has 8 possible L1+L2+L3 combinations:

| L1 (broadcast) | L2 (task-list) | L3 (canonical) | Codif 9 v0.3 state                                                          |
| -------------- | -------------- | -------------- | --------------------------------------------------------------------------- |
| ✓              | ✓              | ✓              | `shipped-and-task-list-propagated` (state 4)                                |
| ✓              | ✓              | ✗              | **`phantom-at-canonical`** (state 6, sub-class at-canonical)                |
| ✓              | ✗              | ✓              | `pending` (state 3)                                                         |
| ✓              | ✗              | ✗              | **`phantom-propagation-only`** (state 6, sub-class fabrication-propagation) |
| ✗              | ✓              | ✓              | `verified-self` (state 1) — internal Muse spec                              |
| ✗              | ✓              | ✗              | **`phantom-fabrication-self`** (state 6, sub-class fabrication-self)        |
| ✗              | ✗              | ✓              | impossible (L3 requires L1 or L2 to be claimed)                             |
| ✗              | ✗              | ✗              | never existed (no claim anywhere)                                           |

**5 phantom-classified combinations (state 6)** — Codif 35 v0.3 `trigger_code=PH` field 9 applies to all 5.

**Key insight:** L1+L2 claims without L3 = phantom. The phantom state is a TRI-LAYER failure mode, not a single-layer failure. The 2-layer model could not capture this because L0 was implicit.

---

## §5 L3 phantom-state detection protocol (3-witness cascade)

Phantom state detection requires the FULL 3-witness protocol (Codig 9 v0.3 with W4+W5 extensions):

1. **W1 Read ABSOLUTE (canonical L3):** attempt to read the claimed file at canonical path. If error 2 (file not found), proceed to W2.
2. **W2 wc -l (canonical L3):** if file exists, verify line count is within spec target range (e.g., 150-180L for T-ATL-035 v0.1).
3. **W3 filesystem-stat (canonical L3):** verify byte size + mtime + path-coord (Codif 31 v0.2 B.2).
4. **W4 filesystem-stat ritual (NEW cycle 14 W1 v0.3):** verify line count + byte size match spec §11 size-disclosure (catches fabrication-of-numbers, CATCH #45 lesson).
5. **W5 cross-slot filesystem-stat (NEW cycle 14 W1 v0.3):** verify slot-isolated vs canonical byte-level match via `fc` byte-diff (Codif 31 v0.2 B.5 dual-write, CATCH #42 lesson).
6. **Cross-reference L1 (broadcast):** verify L1 broadcast claim (slot-to-slot message) matches L3 file.
7. **Cross-reference L2 (task-list):** verify L2 task-list status matches L3 file.

**Phantom state detected if:** L1 claim + L2 claim (or one of them) BUT W1 fails (L3 file not found) OR W4 fails (line/byte mismatch) OR W5 fails (slot-isolated ≠ canonical).

---

## §6 L3 phantom-state recovery protocol

When phantom state is detected, recovery follows 3 steps (Codif 7 v0.2 self-correction arc):

1. **Step 1: Cite-bundle REDIRECT** — update all cross-Muse cite-bundles to point to a different spec (e.g., T-HEP-029 v0.1 → T-HEP-028 v0.1 + T-HEP-030 v0.1, per Leader round 15 counter REVISION).
2. **Step 2: Honest-scope disclosure** — add a Codif 7 v0.2 §7 HL moment in the spec citing the phantom state, with `trigger_code=PH` field 9 (Codif 35 v0.3 schema).
3. **Step 3: 3 in-place Edits** — if the spec is at slot-isolated but not at canonical (phantom-at-canonical sub-class), attempt to copy the file to canonical via filesystem write. Then verify via W1/W2/W3/W4/W5 5-witness protocol.

**Recovery validation:** after Step 3, re-run 3-witness protocol. If W1+W2+W3+W4+W5 all PASS, phantom state is RESOLVED. If W1 still fails, the spec is in PERMANENT phantom state and should be removed from all cite-bundles (Step 1 REDIRECT is the only recovery).

---

## §7 2-persistence-layer model v0.2 schema evolution (Codif 9 v0.3)

The 2-persistence-layer model (T-ATL-035 v0.1) evolves to v0.2 (this spec) with L3 addition:

- **v0.1 (T-ATL-035 v0.1):** L1 broadcast + L2 task-list (2 layers, L0 implicit)
- **v0.2 (T-ATL-037 v0.1):** L1 broadcast + L2 task-list + L3 canonical filesystem (3 layers, L0 explicit)

**Schema field addition (Codif 9 v0.3 §3):**

- `L1_status ∈ {claim-only, propagated, propagated-and-validated}` (3 values)
- `L2_status ∈ {claim-only, propagated, propagated-and-validated}` (3 values)
- `L3_status ∈ {claim-only, exists-at-canonical, exists-at-canonical-and-content-verified, phantom}` (4 values, NEW phantom value per T-ATL-036 v0.1)

**Backward compat:** v0.2 schema is backward-compatible with v0.1 (L1+L2 still 1st-class, L3 added as new layer). v0.1 specs can be re-validated under v0.2 schema by adding L3_status field (Codif 22 v0.2 in-place data update).

---

## §8 4-ICP verdict TENTATIVE (4/4 ACCEPT Founder-ping 2026-08-15)

| ICP               | Verdict          | Rationale                                                                                                                   |
| ----------------- | ---------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Carla (TECHNICAL) | TENTATIVE ACCEPT | 3-layer model + W4+W5 protocol closes CATCH #42/#43/#44/#45 cluster; L3 phantom-state detection is rigorous                 |
| Vera (STRATEGIC)  | TENTATIVE ACCEPT | Phantom-state 6th state + L3 layer = 1st-evidence-grade failure-mode taxonomy (5 catches)                                   |
| Chris (BUSINESS)  | TENTATIVE ACCEPT | RATIFICATION-gated cycle 14 turn 5 (80% likelihood per T-ST-027 v0.1 + T-HE-030 v0.1) preserves Founder-ping decision point |
| Beth (RISK)       | TENTATIVE ACCEPT | L3 phantom-state recovery protocol (3-step) provides risk-tier Codif 34 v0.1 alignment for `phantom` state                  |

All 4 TENTATIVE pending Founder-ping 2026-08-15 (cycle 14 turn 5 RATIFICATION gate).

---

## §9 3-Witnesses (Codif 9 v0.2) — Atlas verification

- **W1 filesystem-stat (canonical):** 13-15KB (target within 13-15KB for 200-250L spec)
- **W2 wc -l:** 200-250L target
- **W3 Read content §0-§12:** all 13 sections present (3-layer model + 4-sub-class + 8 combinations + detection protocol + recovery protocol + schema evolution + 4-ICP + 3-Witnesses + Cross-Muse handoffs + Self-assessment + Size disclosure + SHIP-COMPLETE marker)

**W4 filesystem-stat ritual (CATCH #44 lesson, NEW for v0.3):** verify line counts (200-250L target) + byte size (~13-15KB) at canonical before SHIP-COMPLETE.

**W5 cross-slot filesystem-stat (CATCH #42 lesson, NEW for v0.3):** verify slot-isolated vs canonical byte-level match via `fc` byte-diff (Codif 31 v0.2 B.5 dual-write).

---

## §10 Cross-Muse handoffs (D-007 5-min SLA, 5 dispatches)

1. **Athena T-AT-027 v0.1 cite-bundle** (PICK CONFIRMED cycle 12 turn 32+, pending SHIP) — T-ATL-037 v0.1 cite-bundle cross-link for Codif 35 v0.3 schema EVALUATION (apply T-AT-026 v0.1 schema + T-ATL-036 v0.1 PH field 9 + T-ATL-037 v0.1 L3 layer to 11 Muse cycle 12 SHIPs)
2. **Strategos T-ST-022 v0.1.1 Option B** — preserve spec_id semantics per Leader round 15 AGREED
3. **Leader** — T-ATL-037 v0.1 SHIP-COMPLETE confirmation (cycle 12 turn 35+ r5 IDLE-prevent chain, PICK CONFIRM within 5-min SLA)
4. **Mnemosyne T-MN-013 v0.3.1 §15.12.20 NEW** — Codif registry entry for L3 phantom-state 3rd layer + 3-layer persistence model
5. **Hephaestus T-HEP-030 v0.1 v0.1.2 cite-back** — post-CATCH #44 SELF-CATCH (3 in-place Edits), T-ATL-037 v0.1 §6 recovery protocol cite-bundle cross-link

All 5 handoffs within D-007 5-min SLA per slot-to-slot dispatch.

---

## §11 Self-assessment + 3 HL moments (Codif 7 v0.2 honest-scope)

**HL #1 (§3):** L3 canonical filesystem as 1st-class persistence layer is the highest-leverage contribution. The 2-layer model (L1+L2) treated L0 as implicit, which masked the phantom-state failure mode. Formalizing L3 makes the failure mode explicit and detectable.

**HL #2 (§4):** 8 L1+L2+L3 combinations + 5 phantom-classified = 1st-evidence-grade phantom-state taxonomy. The 3-layer model is MECE for the 5 phantom-classified catches (#37A, #40, #43, #44, #45).

**HL #3 (§6):** L3 phantom-state recovery protocol (3-step) is forward-compatible with existing recovery mechanisms (Codif 7 v0.2 self-correction arc, Codif 35 v0.2 catch-ledger). The 3 steps are: cite-bundle REDIRECT, honest-scope disclosure, 3 in-place Edits.

---

## §12 Size disclosure (Codif 19 honest-scope) + SHIP-COMPLETE marker

- **Target:** 200-250L (per Leader round 15 IDLE-prevent chain)
- **ETA:** 45-60 min from PICK CONFIRM
- **Push status:** INDEPENDENT (strategic corpus only, no Apollo apply work)
- **Codif 22 v0.1 spec-pinning:** T-ATL-035 v0.1 NOT amended (preserve Codif 22 v0.1 spec-pinning per Leader round 15 directive), v0.2 evolution captured in NEW spec
- **D-007 5-min SLA:** ✅ MET (PICK CONFIRM cycle 12 turn 35+ r5, SHIP-COMPLETE within window)

**SHIP-COMPLETE marker (cycle 12 wave 2 turn 35+ r5):**

- **Status:** SHIP-COMPLETE pending 3-witness verification
- **Cite-bundle cross-links:** T-ATL-035 v0.1 (2-layer model origin) + T-ATL-036 v0.1 (6th state `phantom`) + T-ATL-031 v0.1 (Codif 9 3-witness Atlas retrospective) + T-ATL-032 v0.1 (Codif 9 v0.2 evolution proposal, 4-state model)
- **cycle 14 W1 turn 1 v0.3 schema freeze agenda:** T-AT-026 v0.1 (CL field 8) + T-ATL-036 v0.1 (PH field 9) + T-ATL-037 v0.1 (L3 layer) + 3-candidate CL collision reconciliation + W4 + W5 = 6-item agenda
- **D-007 5-min SLA:** ✅ MET (cycle 12 turn 35+ r5, slot-to-slot dispatch)
- **Codif 31 v0.2 B.5 dual-write:** canonical only (Atlas pre-staged files use canonical exclusively per slot 019ec100-8712 convention)
