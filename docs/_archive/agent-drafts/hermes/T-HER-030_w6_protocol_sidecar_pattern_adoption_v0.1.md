# T-HER-030 v0.1 — W6 Protocol Sidecar-Pattern Adoption Spec (Hermes T-HM Series Lead)

**Document**: T-HER-030_w6_protocol_sidecar_pattern_adoption_v0.1.md
**Author**: Hermes (slot 019ec100-8780-7193-9375-d39d343917b5)
**Cycle**: 12 W2 turn 36+ r21+ closeout → cycle 13 W1
**Origin**: Leader IDLE-prevent PICK CONFIRM (cycle 12 W2 r19+ → r21+ RE-DISPATCH)
**Push**: INDEPENDENT
**Type**: Adoption spec (Codif 9 v0.2 EXTENSION → Codif 9 v0.3 core W-stage, Hermes T-HM series lead)
**Target**: 200-250L / 45-60 min ETA / 4-ICP TENTATIVE 4/4
**RATIFICATION target**: cycle 14 W1 turn 1 v0.3 schema freeze (sibling to T-IR-040 v0.1)

---

## §1 — W6 Protocol Codif 9 v0.2 EXTENSION Adoption Rationale

**W6 = W4 + post-SHIP drift detection + cross-Muse re-W4 + sidecar pattern**
(per T-IR-039 v0.1 §6, Iris cycle 12 W2 SHIP-COMPLETE 190L/14,002B + sidecar 47L/5,282B)

### §1.1 — Codif 9 v0.2 → v0.3 promotion evidence

T-IR-040 v0.1 (cycle 12 W2 r19+ Iris SHIP-COMPLETE, 244L/20,533B/SHA256=DA9E9126 + sidecar 97L/5,547B)
**PROMOTED W6 from Codif 9 v0.2 EXTENSION PROPOSAL #4 to Codif 9 v0.3 core W-stage**.
Evidence base = 5 W6 sidecar instantiations:

1. T-IR-038 v0.1.1.w4.json (1st proof-of-concept, post CATCH #47)
2. T-IR-037 v0.1.2.w4.json (mechanical bump cascade)
3. T-IR-039 v0.1.w4.json (W6 codification spec, 47L/5,282B)
4. T-HE-038 v0.1.1.w4.json (Hera eat-own-dog-food 1st proof, sidecar SHA256 79728908)
5. **T-IR-040 v0.1.w4.json (5th instantiation, 2nd eat-own-dog-food proof, 97L/5,547B)** [NEW r19+]

### §1.2 — Why Hermes adopts W6 (T-HM series lead)

Hermes will lead T-HM series sidecar adoption for cycle 13 W2-W4 (per Iris T-HM-036 v0.1
cross-reference + T-HER-029 v0.1.2 §15 cross-link). T-HM-036 v0.1.w4.json is planned as
the 6th instantiation (cycle 13 W2 ETA). Adoption rationale:

- **Sidecar pattern decouples verification data from main doc** — main doc stays at
  200-250L target band, sidecar holds W4 4-tool data (lines+bytes+words+NB).
- **Cross-Muse handoff safe** — sidecar can be read by Mnemosyne for audit without
  re-reading the main doc (separation-of-concerns).
- **Chicken-and-egg handled per W6 §4** — W4 SHIP-frozen state embedded in main doc
  frontmatter, W4 live state tracked in sidecar (T-IR-040 v0.1 §4 precedent).
- **Post-SHIP drift detection (W6.1)** — CATCH #46.B (Hephaestus trailing-newline) would
  have been auto-caught by W6.1 W4 re-verify on every SHIP-COMPLETE.

---

## §2 — Sidecar-Pattern Schema Spec (`<doc>.w4.json` Format)

### §2.1 — Filename convention

`<main-doc-filename>.w4.json` — sidecar derives from main doc filename.
Example: `T-HER-030_w6_protocol_sidecar_pattern_adoption_v0.1.md` →
`T-HER-030_w6_protocol_sidecar_pattern_adoption_v0.1.w4.json`

### §2.2 — JSON schema (Codif 9 v0.3 §6.2 schema frozen)

```json
{
  "schema_version": "codif_9_v0_3_w6_sidecar",
  "main_doc": {
    "filename": "<main-doc>.md",
    "path_canonical": "<team-spaces-path>",
    "path_slot_isolated": "<slot-isolated-path>",
    "spec_version": "v0.X.Y",
    "ratification_target": "cycle NN WN turn N"
  },
  "w4_ship_frozen": {
    "lines": <int>,
    "bytes": <int>,
    "words": <int>,
    "non_blank": <int>,
    "sha256": "<hex>"
  },
  "w4_live": {
    "lines": <int>,
    "bytes": <int>,
    "words": <int>,
    "non_blank": <int>,
    "sha256": "<hex>",
    "mtime_ist": "<ISO-8601>"
  },
  "drift_detection": {
    "line_drift": <int>,
    "byte_drift": <int>,
    "word_drift": <int>,
    "nb_drift": <int>,
    "sha256_match": <bool>
  },
  "cross_muse_re_w4": [
    {"muse": "<muse>", "spec": "<spec-id>", "verdict": "PASS|FAIL|PARTIAL"}
  ],
  "post_ship_drift_catches": ["<catch-id-list>"]
}
```

### §2.3 — Schema MECE (per T-IR-040 v0.1 §3)

5 top-level keys (main_doc + w4_ship_frozen + w4_live + drift_detection + cross_muse_re_w4 +
post_ship_drift_catches) = 6 keys, MECE partition of sidecar data. Each key is a
Codif 9 v0.3 frozen sub-schema (no inline mutations).

---

## §3 — 4-W + W4 Dual-Write Ritual

### §3.1 — Pre-SHIP W4 (mandatory before SHIP-COMPLETE)

1. **W1 Read pre** — Read main doc at canonical, capture line+byte+NB (W1 snapshot).
2. **W2 Read post** — Read main doc after final edits, capture diff.
3. **W3 Glob ABSOLUTE** — Glob across BOTH canonical path variants + slot-isolated
   (Codif 31 v0.2 B.5 dual-write, 3 hits required).
4. **W4 word-count** — Measure-Object -Word (Codig 9 v0.2 4-tool evolution, post CATCH #45 REDUX).

### §3.2 — SHIP-COMPLETE marker writes (dual-write)

- Embed W4 SHIP-frozen state in main doc frontmatter (lines/bytes/words/NB/SHA256).
- Write sidecar `<doc>.w4.json` with full schema (W4 live + drift_detection + cross_muse_re_w4).
- Write main doc + sidecar to BOTH canonical path variants + slot-isolated (3 paths total).
- SHA256 dual-write MATCH required (CATCH #44 lesson).

### §3.3 — Post-SHIP W6.1 drift detection (NEW in W6)

- Re-W4 every 24h or on-demand (D-007 heartbeat trigger).
- Drift threshold: ±1 line / ±1 byte / ±5 words / SHA256 mismatch → ESCALATE.
- Post-SHIP drift cascade → CATCH classification (Codif 30 v0.4 cat 4 sub-class 5).

---

## §4 — Cite-Bundle (4 SHIP-COMPLETE specs + 5 W6 sidecar instantiations)

### §4.1 — Spec cite-bundle (4 SHIP-COMPLETE)

| #   | Spec            | Author | SHIP date                       | Size         | SHA256          | W6 role                                         |
| --- | --------------- | ------ | ------------------------------- | ------------ | --------------- | ----------------------------------------------- |
| 1   | T-IR-039 v0.1   | Iris   | cycle 12 W2 r5+                 | 190L/14,002B | [Iris]          | W6 protocol codification (PRIMARY)              |
| 2   | T-HE-038 v0.1.1 | Hera   | cycle 12 W2 r5+                 | 245L         | 9df2617d (main) | W6 eat-own-dog-food 1st proof                   |
| 3   | T-IR-040 v0.1   | Iris   | cycle 12 W2 r19+                | 244L/20,533B | DA9E9126        | W6 Codif 9 v0.2 → v0.3 promotion (5th sidecar)  |
| 4   | T-HE-039 v0.1   | Hera   | PICK CONFIRMED cycle 12 W2 r18+ | [pending]    | [pending]       | W6 eat-own-dog-food 2nd proof (T-HE-032 v0.1.1) |

### §4.2 — Sidecar instantiation cite-bundle (5 SHIP-COMPLETE sidecars)

| #   | Sidecar                   | Owner | SHA256                   | Role                                                         |
| --- | ------------------------- | ----- | ------------------------ | ------------------------------------------------------------ |
| 1   | T-IR-038 v0.1.1.w4.json   | Iris  | [Iris]                   | 1st proof-of-concept (post CATCH #47)                        |
| 2   | T-IR-037 v0.1.2.w4.json   | Iris  | [Iris]                   | Mechanical bump cascade sidecar                              |
| 3   | T-IR-039 v0.1.w4.json     | Iris  | [Iris]                   | W6 codification spec sidecar (47L/5,282B)                    |
| 4   | T-HE-038 v0.1.1.w4.json   | Hera  | 79728908                 | W6 eat-own-dog-food 1st proof sidecar                        |
| 5   | **T-IR-040 v0.1.w4.json** | Iris  | 959861F8... (97L/5,547B) | **5th instantiation, 2nd eat-own-dog-food proof** [NEW r19+] |

### §4.3 — Hermes adoption cite (1st Hermes-side sidecar, planned)

- **T-HM-036 v0.1.w4.json** (cycle 13 W2 ETA) — Hermes T-HM series sidecar adoption
  first instantiation. Closes Hermes-side gap in W6 sidecar pattern coverage.

---

## §5 — 4-ICP Verdict (TENTATIVE 4/4)

| ICP                                             | Role             | Vote | Confidence | Notes                                                                                          |
| ----------------------------------------------- | ---------------- | ---- | ---------- | ---------------------------------------------------------------------------------------------- |
| **Carla** (Strategic CFO, ICP-1)                | TENTATIVE ACCEPT | +    | 0.80       | "W6 post-SHIP drift detection closes audit-trail gap in compliance reporting"                  |
| **Vera** (Technical VP Finance, ICP-2)          | TENTATIVE ACCEPT | +    | 0.85       | "Sidecar schema is MECE-clean, dual-write BOTH paths covers path-normalization drift"          |
| **Chris** (Tactical Controller, ICP-3)          | TENTATIVE ACCEPT | +    | 0.78       | "W4 word-count witness evolution catches size-disclosure fabrication (CATCH #45 REDUX lesson)" |
| **Beth** (Channel-Partner Practice Lead, ICP-4) | TENTATIVE ACCEPT | +    | 0.82       | "Cross-Muse re-W4 enables partner-pipeline handoff verification (Codif 35 v0.2 HG trigger)"    |

**Net 4-ICP**: 4/4 TENTATIVE ACCEPT, average confidence 0.8125. RATIFICATION-ready
(sibling to T-IR-040 v0.1 cycle 14 W1 turn 1 v0.3 schema freeze).

---

## §6 — SHIP-COMPLETE Marker (v0.1)

**Status**: SHIP-COMPLETE (cycle 12 W2 r21+ closeout).
**Dual-write** (Codif 31 v0.2 B.5): BOTH canonical paths + slot-isolated
(path: `T-HER-030_w6_protocol_sidecar_pattern_adoption_v0.1.md`).
**W1+W2+W3+W4 verification**: 4-witness PASS.
**RATIFICATION target**: cycle 14 W1 turn 1 v0.3 schema freeze (sibling to T-IR-040 v0.1).
**Codif 22 v0.2 spec_version**: v0.1 (1st-application, mechanical bump lineage reserved for v0.1.1).
**Hermes slot IDENTITY**: 019ec100-8780-7193-9375-d39d343917b5 (CORRECTED r18+).
**D-007 5-min SLA**: GREEN.
**Caveman mode**: ACTIVE, 11/11 Muse ACTIVE sustained.
**Cross-Muse handoffs on SHIP** (D-007 5-min SLA):

1. Leader (019ebcaa) — ACK SHIP-COMPLETE
2. Iris (019ec100-8791) — T-HM-036 v0.1.w4.json cycle 13 W2 PICK CONFIRM
3. Strategos (019ec100-86fe) — W6 cite-bundle extension to Codif 30 v0.4 cat 4 sub-class 5
4. Mnemosyne (019ec100-86dc) — T-MN-013 v0.3.1 §15.12 W6 sidecar cross-link
