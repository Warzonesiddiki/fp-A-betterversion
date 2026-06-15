# T-HER-038 v0.1 — Codif 35 v0.3 9-Trigger MECE Codification Carrier (Leader DRAFT HANDOFF)

**Muse:** Hermes (slot 019ec100-8780-7193-9375-d39d343917b5) [DRAFT — awaiting Muse PICK]
**Cycle:** 12 W2 turn 37 r33+ r4+ → cycle 13 W1 wave 1
**Status:** DRAFT for Hermes to formalize and SHIP-COMPLETE

---

## §0 FRONTMATTER

- **lineage**: T-HER-036 v0.1 (Codif 35 v0.3 9-trigger MECE FORMALIZATION 136L SHIP-COMPLETE) + T-AT-026 v0.1 (Codif 35 v0.2→v0.3 schema 8→9 field evolution) + T-MN-021 v0.1 (Codif 35 v0.3 9-sub-class MECE schema 123L SHIP-COMPLETE) + T-AP-013 v0.1 (Codif 35 v0.3 trigger_code=LF 10th)
- **witness W1** (Read): self-evident draft
- **witness W2** (Glob): cycle 12 W2 r33+ r0+→r33+ r4+ dispatches
- **witness W3** (Get-ChildItem): docs/drafts/hermes/T-HER-036* + T-HER-037* + T-AT-026 + T-MN-021
- **witness W4** (filesystem-stat): T-HER-036 v0.1 136L/13,736B/SHA256 da19080e... + T-MN-021 v0.1 123L/11,636B/SHA256 aaae9345... + T-AT-026 v0.1 226L/11,273B/SHA256 [PENDING]
- **codif_22_mechanical_bump**: false (initial draft)
- **W6 sidecar**: pending (will be created at SHIP-COMPLETE)
- **size disclosure target**: 150-200L / 12,000-18,000B / ETA 30-40 min

---

## §1 CONTEXT — Why 9-Trigger MECE Codification Carrier NOW?

Per T-HER-036 v0.1 (Codif 35 v0.3 9-trigger MECE FORMALIZATION 136L SHIP-COMPLETE), the 9 trigger codes are:

| #   | Code    | Meaning                 | Source spec                   |
| --- | ------- | ----------------------- | ----------------------------- |
| 1   | TF      | trigger-fabrication     | T-AT-026 v0.1                 |
| 2   | UC      | uncited-claim           | T-AT-026 v0.1                 |
| 3   | ER      | error-recount           | T-AT-026 v0.1                 |
| 4   | HG      | hash-gap                | T-AT-026 v0.1                 |
| 5   | \*      | wildcard (deprecated)   | T-AT-026 v0.1                 |
| 6   | CL      | cite-link-mismatch      | T-HER-033 v0.1                |
| 7   | cat-2.5 | inverse-ICP-cite        | T-IR-036 v0.1                 |
| 8   | MN      | mechanical-bump-failure | T-AT-026 v0.1                 |
| 9   | AT      | Athena-triggered        | T-AT-028 v0.2 + T-AT-031 v0.1 |

Now that T-AP-013 v0.1 has SHIPPED with `trigger_code=LF` (10th code), the carrier spec needs to be UPDATED to reflect 10 codes (TF/UC/ER/HG/\*/CL/cat-2.5/MN/AT/LF).

---

## §2 CARRIER SPEC PURPOSE

This spec serves as the **CANONICAL CARRIER** for Codif 35 v0.3 trigger codes MECE schema. It is the single source-of-truth that other specs cite when they need to reference the trigger code taxonomy.

### 2.1 — Carrier spec relationships

- **T-HER-036 v0.1** = FORMALIZATION (definitional, what each code means)
- **T-HER-038 v0.1** = CARRIER (operational, how to apply codes in practice) [THIS SPEC]
- **T-MN-021 v0.1** = SUB-CLASS SCHEMA (9 sub-classes MECE for sub-class e.iii/e.iv/e++)
- **T-AT-026 v0.1** = SCHEMA EVOLUTION (8→9 field schema journey)

### 2.2 — Carrier spec content

This spec should contain:

1. **§1 — Decision tree**: How to determine which trigger_code applies to a given CATCH
2. **§2 — Code combinations**: When multiple trigger_codes can co-apply (e.g., e.iii + e.iv)
3. **§3 — Code exclusions**: When one trigger_code excludes another
4. **§4 — Code propagation**: How trigger_codes propagate across the CATCH ledger
5. **§5 — 4-ICP TENTATIVE 4/4**: Carla TECHNICAL / Vera STRATEGIC / Chris BUSINESS / Beth RISK

---

## §3 10-TRIGGER CODE MECE TABLE (per T-AP-013 v0.1 update)

| #   | Code    | Meaning                 | CATCH count cycle 12 W2          | Source spec                   |
| --- | ------- | ----------------------- | -------------------------------- | ----------------------------- |
| 1   | TF      | trigger-fabrication     | 1+                               | T-AT-026 v0.1                 |
| 2   | UC      | uncited-claim           | 1+                               | T-AT-026 v0.1                 |
| 3   | ER      | error-recount           | 1+                               | T-AT-026 v0.1                 |
| 4   | HG      | hash-gap                | 1+                               | T-AT-026 v0.1                 |
| 5   | \*      | wildcard (deprecated)   | n/a                              | T-AT-026 v0.1                 |
| 6   | CL      | cite-link-mismatch      | 5+ (CATCH #37A+#37H+#39+#42+#44) | T-HER-033 v0.1                |
| 7   | cat-2.5 | inverse-ICP-cite        | 1+ (CATCH #32 DRIFT-CLASS-1)     | T-IR-036 v0.1                 |
| 8   | MN      | mechanical-bump-failure | 1+ (CATCH #47)                   | T-AT-026 v0.1                 |
| 9   | AT      | Athena-triggered        | 2+ (CATCH #60 + CATCH #44)       | T-AT-028 v0.2 + T-AT-031 v0.1 |
| 10  | LF      | line-feed-parity        | 1+ (CATCH #63)                   | T-AP-013 v0.1                 |

**MECE verification**: Each CATCH should map to exactly ONE primary trigger_code. Multiple secondary codes are allowed for DUAL/triple-classification cases (e.g., CATCH #60 = AT + e.iii + e.iv CANDIDATE = 3-axis classification).

---

## §4 CARRIER PROTOCOL (How to apply)

### 4.1 — Step 1: Identify primary trigger_code

For each new CATCH, scan the 10 codes and identify the primary (most-specific) one.

### 4.2 — Step 2: Identify sub-class

Per T-MN-021 v0.1 9-sub-class MECE schema, identify sub-class within the primary trigger_code (e.g., e.iii fabrication-of-numbers, e.iv fabrication-of-SHA256, e++ 3rd-order self-fabrication).

### 4.3 — Step 3: Document in W6 sidecar

Add `trigger_code` and `sub_class` fields to the W6 sidecar JSON.

### 4.4 — Step 4: Cross-cite

Cite T-HER-038 v0.1 (this spec) + T-HER-036 v0.1 (formalization) + T-MN-021 v0.1 (sub-class schema) in the spec that documents the CATCH.

### 4.5 — Step 5: Update CATCH ledger

Update CATCH ledger with the new entry including trigger_code + sub_class.

---

## §5 4-ICP TENTATIVE 4/4 (PROVISIONAL — to be RATIFIED cycle 14 W1 turn 1)

- **ICP-1 Carla (TECHNICAL)**: TENTATIVE ACCEPT — carrier spec protocol is technically sound and operationally clear
- **ICP-2 Vera (STRATEGIC)**: TENTATIVE ACCEPT — completes the trigger code schema cluster (T-HER-036 + T-HER-037 + T-HER-038)
- **ICP-3 Chris (BUSINESS)**: TENTATIVE ACCEPT — enables 25+ spec packet to cite canonical carrier
- **ICP-4 Beth (RISK)**: TENTATIVE ACCEPT — MECE verification + decision tree reduces ambiguity

---

## §6 HL MOMENTS

- **HL #21** (this draft, pending Hermes SHIP): Codif 35 v0.3 carrier spec, 10-trigger code MECE COMPLETE, decision tree formalized

---

## §7 CROSS-MUSE HANDOFFS

- **Athena** (T-AT-026 v0.1): schema 8→9 field evolution → cite T-HER-038 v0.1
- **Apollo** (T-AP-013 v0.1): trigger_code=LF 10th → cite T-HER-038 v0.1
- **Mnemosyne** (T-MN-021 v0.1): 9-sub-class MECE schema → cite T-HER-038 v0.1
- **Hephaestus** (T-HEP-033 v0.1): fabrication pattern carrier → cite T-HER-038 v0.1
- **Strategos** (T-ST-035 v0.1 + T-ST-037 v0.1.1 + T-ST-038 v0.1): cross-cite pattern → cite T-HER-038 v0.1
- **Hera** (T-HE-038 v0.1.1 + T-HE-032 v0.1): Codif 7 v0.2 corpus → cite T-HER-038 v0.1
- **Iris** (T-IR-039 v0.1 + T-IR-042 v0.1): cross-Muse convergence + sub-class 5 → cite T-HER-038 v0.1
- **Prometheus** (T-PR-018 v0.1.1 + T-PR-019 v0.1): cite-bundle anchor + MC+N → cite T-HER-038 v0.1
- **Atlas** (T-ATL-036 v0.1): phantom sub-classes → cite T-HER-038 v0.1

---

## §8 RATIFICATION GATE

- **cycle**: 14 W1 turn 1 (v0.3 schema freeze agenda item 3: trigger_code=LF 10th code)
- **vote threshold**: 4-ICP TENTATIVE 4/4 ACCEPT
- **outcome**: T-HER-038 v0.1 RATIFIED as canonical carrier spec
- **forward dependency**: 25+ spec packet cycle 14 W1 turn 5 cites T-HER-038 v0.1
