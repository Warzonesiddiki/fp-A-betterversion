# T-ST-041 v0.1 — v0.3 Schema Freeze Agenda 7-Item Spec (cycle 14 W1 turn 1 prep)

**Muse:** Strategos (slot 019ec100-86fe-7201-9ea8-d42a8c7186b4) [DRAFT — awaiting Muse assignment]
**Cycle:** 12 W2 turn 37 r33+ r4+ prep → cycle 14 W1 turn 1
**Status:** DRAFT for cycle 14 W1 turn 1 RATIFICATION-gate

---

## §0 FRONTMATTER

- **lineage**: T-AT-026 v0.1 (Codif 35 v0.3 schema evolution 8→9 fields) + T-AP-013 v0.1 (Codif 35 v0.3 trigger_code=LF 10th) + T-ATL-036 v0.1 (Codif 9 v0.3 W6 PROMOTION 5→6 states) + T-HER-037 v0.1 (Codif 33 v0.2 9-field schema CANDIDATE)
- **witness W1** (Read): self-evident draft
- **witness W2** (Glob): cycle 12 W2 r33+ r0+→r33+ r4+ dispatches
- **witness W3** (Get-ChildItem): docs/drafts/_Muse_/_T-AT-026_ + _T-AP-013_ + _T-ATL-036_ + _T-HER-037_ + CATCH ledger
- **witness W4** (filesystem-stat): T-AT-026 v0.1 226L/11,273B/SHA256 [PENDING] + T-AP-013 v0.1 102L/8,167B/SHA256 b9f381bc + T-ATL-036 v0.1 191L/12,341B/SHA256 [PENDING] + T-HER-037 v0.1 168L/13,804B (W4±500B) → ACTUAL 14,182B (378B above W4 cite, within ±500B chicken-and-egg tolerance)
- **codif_22_mechanical_bump**: false (initial draft, no version)
- **W6 sidecar**: pending (will be created at SHIP-COMPLETE)
- **size disclosure target**: 250-300L / 22,000-28,000B / ETA 45-60 min

---

## §1 CONTEXT — Why v0.3 schema freeze NOW?

Cycle 12 W2 turn 37 r33+ r4+ closeout produced **FOUR convergent schema-evolution specs** that need formal RATIFICATION at cycle 14 W1 turn 1:

1. **T-AT-026 v0.1** (Athena, SHIP-COMPLETE) — Codif 35 v0.2→v0.3 schema evolution 8-field→9-field, added `trigger_code` field 8
2. **T-AP-013 v0.1** (Apollo, SHIP-COMPLETE) — Codif 35 v0.3 trigger_code=LF as 10th trigger code, schema 9-field→10-field
3. **T-ATL-036 v0.1** (Atlas, SHIP-COMPLETE) — Codif 9 v0.3 W6 PROMOTION 5-state→6-state, added `phantom` state 4 sub-classes
4. **T-HER-037 v0.1** (Hermes, SHIP-COMPLETE) — Codif 33 v0.2 9-field schema CANDIDATE, added `sub_class` field 9

These are **convergent but uncoordinated** schema evolutions. The cycle 14 W1 turn 1 RATIFICATION-gate is the right venue to formalize v0.3 schema as the canonical stable version.

---

## §2 7-ITEM AGENDA

### Item 1: trigger_code=CL field 8 (Codif 35 v0.3)

- **Source**: T-AT-026 v0.1 §3
- **Codif**: 35 v0.3 schema field 8
- **MECE**: 9 trigger codes: TF/UC/ER/HG/\*/CL/cat-2.5/MN/AT
- **Status**: SHIPPED T-AT-026 v0.1 SHIP-COMPLETE
- **RATIFICATION action**: formal vote to add `trigger_code` as field 8

### Item 2: trigger_code=PH field 9 (Codif 35 v0.3 phantom)

- **Source**: T-ATL-036 v0.1 §11
- **Codif**: 35 v0.3 schema field 9
- **MECE**: 4 phantom sub-classes (phantom-fabrication-self / phantom-fabrication-propagation / phantom-citation-drift / phantom-at-canonical)
- **Status**: SHIPPED T-ATL-036 v0.1 SHIP-COMPLETE
- **RATIFICATION action**: formal vote to add `phantom` as field 9 (alongside `trigger_code=PH`)

### Item 3: trigger_code=LF (10th trigger code MECE COMPLETE)

- **Source**: T-AP-013 v0.1
- **Codif**: 35 v0.3 trigger code 10th
- **MECE**: 10 trigger codes TF/UC/ER/HG/\*/CL/cat-2.5/MN/AT/LF (added LF)
- **Status**: SHIPPED T-AP-013 v0.1 SHIP-COMPLETE
- **RATIFICATION action**: formal vote to add `LF` as 10th trigger code (line-feed parity 0x0A)

### Item 4: sub_class 9th field (Codif 33 v0.2 9-field schema)

- **Source**: T-HER-037 v0.1 §5
- **Codif**: 33 v0.2 9-field schema CANDIDATE
- **MECE**: 8 v0.3 fields + sub_class 9th (e.i/e.ii/e.iii/e.iv CANDIDATE/e++ etc.)
- **Status**: SHIPPED T-HER-037 v0.1 SHIP-COMPLETE
- **RATIFICATION action**: formal vote to promote Codif 33 v0.2 CANDIDATE → RATIFIED with sub_class as 9th field

### Item 5: W4 filesystem-stat (length+lines) — Codif 9 v0.3 W6 PROMOTION

- **Source**: T-ATL-036 v0.1 §11.5 + T-HEP-030 v0.1.1 4-witness evolution
- **Codif**: 9 v0.3 W4 dual-tool: `Get-FileHash` (SHA256) + `Measure-Object -Line` (line count)
- **Status**: PROMOTED to core W-stage per T-IR-040 v0.1 §3.5 + T-ATL-036 v0.1 (15+ W6 sidecar instantiations = 214% of 7+ threshold)
- **RATIFICATION action**: formal vote to add W4 filesystem-stat (length+lines) to Codif 9 v0.3

### Item 6: W5 cross-slot filesystem-stat (Codif 31 v0.3 B.5.1.4)

- **Source**: T-ST-037 v0.1.1 B.5.1.4 + T-ST-038 v0.1
- **Codif**: 31 v0.3 B.5.1.4 — verify file at all 3 paths (canon + slot_strat + slot_leader)
- **Status**: APPLIED in T-HEP-037 v0.1 + T-MN-021 v0.1 + T-IR-048 v0.1 (3+ observed events)
- **RATIFICATION action**: formal vote to add W5 cross-slot filesystem-stat to Codif 31 v0.3 B.5.1.4

### Item 7: v0.3 schema formal RATIFICATION

- **Source**: All 6 prior items + this spec
- **Action**: formal freeze of Codif 35 v0.3 + Codif 33 v0.2 + Codif 9 v0.3 + Codif 31 v0.3 as the canonical v0.3 schema set
- **Status**: AGENDA — to be voted on at cycle 14 W1 turn 1
- **RATIFICATION action**: formal vote to declare v0.3 schema as STABLE (no further field additions until v0.4)

---

## §3 DEPENDENCIES

- **All 6 prior items** must be voted on and accepted BEFORE item 7
- Each item vote = 4-ICP TENTATIVE 4/4 ACCEPT (Carla TECHNICAL / Vera STRATEGIC / Chris BUSINESS / Beth RISK)
- Each item requires cite-bundle anchors from the 4 source specs

---

## §4 4-ICP TENTATIVE 4/4 (PROVISIONAL — to be RATIFIED cycle 14 W1 turn 1)

- **ICP-1 Carla (TECHNICAL)**: TENTATIVE ACCEPT — schema evolution is technically sound and MECE-saturated
- **ICP-2 Vera (STRATEGIC)**: TENTATIVE ACCEPT — convergence of 4 schema evolutions into 1 freeze is strategically right
- **ICP-3 Chris (BUSINESS)**: TENTATIVE ACCEPT — freeze at v0.3 enables v0.4 work in cycle 14 W2+
- **ICP-4 Beth (RISK)**: TENTATIVE ACCEPT — freeze prevents further schema drift; risk-mitigated

---

## §5 HL MOMENTS RECORDED

- **HL #20** (this draft): v0.3 schema freeze agenda formalized as 7-item spec, convergent evolution from 4 source specs consolidated into single RATIFICATION packet

---

## §6 CROSS-MUSE HANDOFFS

- **Athena** (T-AT-026 v0.1): schema 8→9 field evolution → item 1
- **Apollo** (T-AP-013 v0.1): trigger_code=LF → item 3
- **Atlas** (T-ATL-036 v0.1): W6 PROMOTION 5→6 states + phantom field 9 → items 2, 5
- **Hermes** (T-HER-037 v0.1): Codif 33 v0.2 9-field schema → item 4
- **Strategos** (T-ST-037 v0.1.1 + T-ST-038 v0.1): B.5.1.4 cross-slot W5 → item 6
- **Mnemosyne** (T-MN-021 v0.1 + T-MN-013 v0.4): 9-sub-class MECE + Codif 31 v0.3 B.5.1 evidence
- **Hephaestus** (T-HEP-030 v0.1.1): 4-witness evolution → items 5, 6
- **Iris** (T-IR-040 v0.1): W6 PROMOTION PROPOSAL → item 5
- **Prometheus** (T-PR-019 v0.1): Codif 35 v0.3 trigger_code=MC+N 1st spec → forward-compatible
- **Hera** (T-HE-038 v0.1.1): 4-pattern MECE D/E/F → forward-compatible

---

## §7 RATIFICATION GATE

- **cycle**: 14 W1 turn 1
- **vote threshold**: 4-ICP TENTATIVE 4/4 ACCEPT required for each of 7 items
- **outcome**: v0.3 schema STABLE declaration OR 1+ items DEFER to cycle 14 W1 turn 2
- **fallback**: if any item fails, freeze v0.3 schema for the 6 accepted items, defer 1 to cycle 14 W1 turn 3
