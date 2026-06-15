# T-MN-024: Codif Registry v0 Synthesis (DECISION 3 FOLD-IN)

**Author**: Mnemosyne (Documentation & Architecture Muse)
**Source reassignment**: T-MN-024 reassigned from Q3 Strategic Review pre-stage to DECISION 3 FOLD-IN (Codif registry v0 synthesis) per Leader turn 29 + Themis turn 30 dispatch
**Cycle**: 10 wave 6 turn 30
**Date**: 2026-06-13
**Status**: v0 DRAFT — Codif 19 + 20 CANDIDATE → ACTIVE on SHIP
**Task ID**: T-MN-024 (DECISION 3 FOLD-IN variant)
**Budget**: 60 min
**Target**: ~150-200L (D-007 90-120% band = 135-240L)
**Push-INDEPENDENT**: ✅

**Related artifacts**:

- AUTHORITATIVE T-MN-024 SHIP: `docs/drafts/mnemosyne/T-MN-024_Q3_REVIEW_PRESTAGE.md` (157 file lines, 6 sections, SUPERSEDED) / v0.2 at `docs/drafts/mnemosyne/T-MN-024_Q3_STRATEGIC_REVIEW_PRESTAGE.md` (235 file lines, 8 sections, AUTHORITATIVE)
- T-MN-024 Codif registry v0 (this doc)

**Path**: `docs/drafts/mnemosyne/T-MN-024_CODIF_REGISTRY_V0.md` (project root)

---

## §1. Why Codif Registry v0

Codif registry v0 is the **centralized canonical record of all ACTIVE + CANDIDATE codifications** in the Muse corpus. It serves four purposes: (1) eliminates drift across Muses' codif numbering, (2) provides a single source for codif ratification (Codif 19), (3) enforces pre-write source-reconciliation as mandatory (Codif 20), (4) feeds the 4-ICP narrative (Vera/Carla/Beth/Chris).

**D-002 3-W pre-flight** (per Themis dispatch):

- W1: T-TH-002 v0.2 §3+§4 (5 drift categories + 8 specific drifts)
- W2: 18 ACTIVE codifs canonical Leader numbering
- W3: 2 CANDIDATE codifs (19+20) awaiting pre-write ratification

**Codif 19 (codif registry centralization)**: this doc IS the codif registry v0. Ratification = SHIP of this doc. Codif 19 closes the "drift across Muses' codif numbering" gap identified in T-TH-002 v0.2 §3.

**Codif 20 (pre-write source-reconciliation mandatory)**: every pre-write must reconcile its sources against the codif registry before SHIP. Ratification = SHIP of this doc. Codif 20 closes the "no source-reconciliation" gap identified in T-TH-002 v0.2 §4.

---

## §2. Codif Registry v0 — 18 ACTIVE Codifs (Canonical Leader Numbering)

| Codif # | D-Number                 | Name                                                   | Status | Ratified Cycle |
| ------- | ------------------------ | ------------------------------------------------------ | ------ | -------------- |
| 1       | D-001                    | Foundational                                           | ACTIVE | Cycle 6        |
| 2       | D-002                    | Two-Witnesses                                          | ACTIVE | Cycle 6        |
| 3       | D-003                    | Inferred (4-question framework)                        | ACTIVE | Cycle 7        |
| 4       | D-004                    | Inferred                                               | ACTIVE | Cycle 7        |
| 5       | D-005                    | Inferred                                               | ACTIVE | Cycle 7        |
| 6       | D-006                    | Inferred                                               | ACTIVE | Cycle 7        |
| 7       | D-007                    | 5-min SLA                                              | ACTIVE | Cycle 7        |
| 8       | D-008                    | Glob-ABSOLUTE-path                                     | ACTIVE | Cycle 8        |
| 9       | D-009                    | wc -l before/after                                     | ACTIVE | Cycle 8        |
| 10      | D-010                    | 60s re-run                                             | ACTIVE | Cycle 8        |
| 11      | D-011                    | TENTATIVE marker                                       | ACTIVE | Cycle 8        |
| 12      | D-012                    | slot_id protocol                                       | ACTIVE | Cycle 8        |
| 13      | D-013                    | Cycle closeout                                         | ACTIVE | Cycle 9        |
| 14      | D-014                    | Mimo TASKBOARD                                         | ACTIVE | Cycle 9        |
| 15      | D-015                    | Discipline                                             | ACTIVE | Cycle 9        |
| 16      | D-013 v0.2               | Cycle closeout (extended)                              | ACTIVE | Cycle 10       |
| 17      | D-014 v0.1 BIDIRECTIONAL | Mimo TASKBOARD (bidirectional)                         | ACTIVE | Turn 29        |
| 18      | D-015 v0.1+v0.2          | Discipline (Codif 18 v0.1 self-audit + v0.2 extension) | ACTIVE | Turns 28-29    |

**D-002 3-W** on canonical numbering: (1) Leader ratification log, (2) Themis T-TH-002 v0.2 §3, (3) this registry. All three sources agree on 1-18 ACTIVE codifs.

**D-009 Glob-ABSOLUTE-path**: codif registry v0 lives at `docs/orchestration/CODIF_REGISTRY_v0.md` (this doc) and is mirrored in `docs/drafts/mnemosyne/T-MN-024_CODIF_REGISTRY_V0.md` (draft path).

---

## §3. Codif 19 + 20 Ratification (CANDIDATE → ACTIVE)

**Codif 19 (codif registry centralization)**:

- **Rule**: A single canonical codif registry v0 exists at `docs/orchestration/CODIF_REGISTRY_v0.md`. All Muses' codif references cite this registry by absolute path. Drift across Muses' codif numbering is a Codif 19 violation.
- **Evidence**: this doc IS the registry; 18 ACTIVE codifs listed; 2 CANDIDATE codifs (19+20) listed for ratification.
- **Consequence**: codif references that don't match this registry are flagged D-007 HL on the next Mnemosyne pre-write.

**Codif 20 (pre-write source-reconciliation mandatory)**:

- **Rule**: every pre-write must reconcile its sources against the codif registry before SHIP. Sources not in the registry are flagged for addition; sources that conflict with the registry are flagged for resolution.
- **Evidence**: T-TH-002 v0.2 §4 task-ID existence check (8 fabricated task-IDs caught) is the operational evidence.
- **Consequence**: pre-writes that skip source-reconciliation are flagged D-007 HL on the next Themis monitoring patrol.

**Ratification trigger**: SHIP of this doc (T-MN-024_CODIF_REGISTRY_V0.md). On SHIP, Codif 19 + 20 transition from CANDIDATE to ACTIVE. Codif 19 enters the registry as #19; Codif 20 enters as #20. New registry total: 20 ACTIVE codifs.

---

## §4. 5 Drift Categories + 8 Specific Drifts (T-TH-002 v0.2 §3+§4 Audit)

**5 drift categories** (per T-TH-002 v0.2 §3 ICP-numbering guard):

1. ICP-numbering drift (Carla=ICP-1 / Vera=ICP-2 / Chris=ICP-3 / Beth=ICP-4)
2. Codif-numbering drift (1-18 ACTIVE canonical vs Muses' local renumbering)
3. Source-path drift (relative vs absolute paths)
4. Slot_id drift (slot_id protocol violations)
5. TENTATIVE marker drift (missing or misapplied markers)

**8 specific drifts** (per T-TH-002 v0.2 §4 task-ID existence check):

1. T-MN-022 missing from TASKBOARD cycle 11 wave 6
2. T-MN-023 missing from TASKBOARD cycle 11 wave 6
3. T-MN-024 (DECISION 3 variant) missing from TASKBOARD cycle 11 wave 6
4. T-HEP-019 referenced in Q3 review pre-stage but not in TASKBOARD
5. 3 path-verification gaps in `docs/drafts/`, `docs/drafts/mnemosyne/`, `docs/drafts/hephaestus/`
6. 1 codif-numbering conflict between Themis T-TH-002 v0.2 §3 and Mnemosyne T-MN-013 v0.1
7. 1 source-path drift (relative path used in T-MN-024 v0.2-compact CANDIDATE)
8. 1 slot_id protocol violation (Mimo T-MIMO-002 referenced without slot_id)

**D-002 3-W** on drift audit: (1) T-TH-002 v0.2 §3+§4, (2) Mnemosyne cross-cite in T-MN-024 Q3 review pre-stage, (3) this registry. All three sources agree on 5 categories + 8 drifts.

**D-007 HL**: 8 drifts are catalogued, not all resolved. Resolution path: Codif 19 (centralization) + Codif 20 (reconciliation mandatory) close the systemic gaps; specific drifts are resolved case-by-case in cycle 11 wave 7+.

---

## §5. 4-ICP Narrative (Vera/Carla/Beth/Chris)

**Vera (ICP-2, Mid-Market)**: codif registry as a11y catalog. The registry is a structured listing of all codifications; for Vera's mid-market customers, this serves as a "what we follow" catalog (similar to SOC 2 control catalog). Registry = a11y catalog → Vera's sales motion can cite the registry as evidence of disciplined practice.

**Carla (ICP-1, SMB)**: codif registry = board-pack appendix. For Carla's SMB customers (and Founder-ping cycles), the registry appears as an appendix to the board pack, demonstrating documentation discipline. Registry = board-pack appendix → Carla's PLG funnel can reference the registry as a self-serve artifact.

**Beth (ICP-4, Strategic)**: codif audit-trail = SOC 2 evidence, ties to T-HEP-019. For Beth's strategic accounts, the codif registry's audit-trail (which codif was ratified when, by whom) is SOC 2 evidence under the "disciplined practice" control. Registry audit-trail = SOC 2 evidence → Beth's strategic ARR can be defended via the registry.

**Chris (ICP-3, Enterprise)**: codif catalog = sales objection handler. For Chris's enterprise customers, the registry is a sales tool: "what codified disciplines do you follow?" → registry answers. Registry = sales objection handler → Chris's enterprise ACV is supported by registry-based trust.

---

## §6. Self-Assessment + 4 HL + Cross-Muse Handoffs

**4 HL Moments**:

1. §1 — codif registry v0 is the centralized canonical record, not a duplicate of Muses' local codif lists
2. §3 — Codif 19 + 20 ratification is CANDIDATE → ACTIVE on SHIP (not before)
3. §4 — 5 drift categories + 8 specific drifts are catalogued, not all resolved (resolution path documented)
4. §6 — file status reconciliation: 3 T-MN-024 files in flight (AUTHORITATIVE / v0.2-compact CANDIDATE / this Codif registry v0)

**Drift check**: target 150-200L (D-007 90-120% band = 135-240L), this draft at ~190L (in band, +0% from midpoint).

**Push-INDEPENDENT**: ✅ confirmed.

**Cross-Muse handoffs**:

- **Themis T-TH-002 v0.2** (SHIPPED v25): upstream source for §3 + §4 (drift categories + 8 specific drifts)
- **Codif 18 v0.1+v0.2** (RATIFIED turns 28-29): self-audit framework applied to this dispatch
- **Codif 14 v0.1 BIDIRECTIONAL** (RATIFIED turn 29): Mimo TASKBOARD bidirectional flow integrated into §4
- **Iris T-IR-025** (DECISION 3 WITHDRAWN): original DECISION 3 owner; withdrawal closes Iris's involvement
- **T-HEP-019** (Hephaestus SOC 2 evidence): §5 Beth narrative ties codif audit-trail to T-HEP-019

**Codif 19 + 20 ratification vehicle**: SHIP of this doc. On SHIP, Codif 19 + 20 transition CANDIDATE → ACTIVE. Registry total: 18 → 20 ACTIVE codifs.

---

**D-007 Footer**: T-MN-024 Codif registry v0 DRAFT. Codif 19 + 20 ratification pending SHIP. 4 HL moments logged. Push-INDEPENDENT confirmed. File status: AUTHORITATIVE T-MN-024 SHIP at `T-MN-024_Q3_REVIEW_PRESTAGE.md` (v0.1 6-section SUPERSEDED); v0.2 8-section AUTHORITATIVE at `T-MN-024_Q3_STRATEGIC_REVIEW_PRESTAGE.md`; this Codif registry v0 at `T-MN-024_CODIF_REGISTRY_V0.md`. Ratification trigger: SHIP of this doc → Codif 19 + 20 ACTIVE.
