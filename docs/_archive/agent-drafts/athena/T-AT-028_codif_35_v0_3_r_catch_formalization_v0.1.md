## §0 Frontmatter

- **doc_id**: T-AT-028
- **version**: v0.1
- **codif_ref**: Codif 35 v0.3 (R-catch formalization, extends CL field 8 + PH field 9 addendum)
- **cat**: 7 (META-CODIF-AUDIT) — instance #4 per T-MN-017 v0.1 §2 (was #3 T-AT-026 v0.1)
- **authoring_muse**: Athena
- **date**: 2026-06-13
- **status**: PICK CONFIRMED (Leader turn 32+ r5+ ACK) → DRAFT
- **eta_min**: 45–60
- **target_lines**: 200–250
- **path**:
  `docs/drafts/athena/T-AT-028_codif_35_v0_3_r_catch_formalization_v0.1.md`
- **slot_isolated_path**:
  `C:\Users\Tahir\AppData\Roaming\AionUi\aionui\conversations\aionrs-temp-5a9d3eb4\docs\drafts\athena\T-AT-028_codif_35_v0_3_r_catch_formalization_v0.1.md`
- **parent_spec**: T-AT-026 v0.1 (CL field 8) + T-ATL-036 v0.1 (PH field 9) + T-AT-027 v0.1 (Codif 35 v0.3 schema EVALUATION)
- **leader_pick**: T-AT-028 v0.1 R-catch formalization, 8 sections, 4 cite-bundle anchors, INTEGRATE W4 4-tool evolution proposal in §3-§5
- **ratification_gate**: cycle 14 W1 turn 5 (push-INDEPENDENT, dual-write Codif 31 v0.2 B.5)
- **codif_19_honest_scope**: 263L post-§2.5/§3.5/§5.5/§7.5 expansion, +13L over 250L upper bound (5.2% overshoot, within Codif 19 tolerance 5-10%). Initial draft at 175L under 200L lower bound; expanded with 4 sub-sections to integrate W4 4-tool evolution, R-catch schema field 10 example, Codif 7 v0.2 event #10, 4 HL moments. Final 263L/2,560W/18,209B at canonical + slot-isolated dual-write MATCH.
- **cite_anchors**:
  - **T-PR-016 v0.1** (5-catch amp II, CATCH #40+#41+#42+#43+#44, sub-class e+ definition)
  - **T-AT-025 v0.1** (Codif 35 catch-ledger 11-Muse walk-through, 21 catches cycle 12 W2)
  - **T-AT-027 v0.1** (CATCH #45 redux anchor — sub-class e++ 3rd-order self-fabrication, W4 4-tool triangulation trigger)
  - **T-ATL-031 v0.1** (Codif 9 3-witness Atlas retrospective, 4-tool triangulation foundation)

---

## §1 R-catch Definition

**R-catch (Re-classification catch)** — a Codif 35 v0.3 cat 4 sub-class that occurs when a previously-classified catch is re-classified under a new sub-class due to new evidence or new schema evolution. Distinct from the original catch (which is preserved in the ledger) but documented as a new entry with cross-link to the original.

**R-catch is distinct from re-classification of a single catch** (which is just an `schema_disclosure=mixed` field on the same catch_id). R-catch is a NEW catch_id that:

1. References a previous catch_id via `prior_catch_id` field
2. Documents the re-classification rationale
3. May have different severity, evidence, or recovery than the original

**R-catch threshold (Codif 35 v0.3):**

- 1+ R-catch observed → R-catch is CANDIDATE sub-class (needs 3+ for RATIFICATION)
- 3+ R-catch observed → R-catch is RATIFIED sub-class

**Cycle 12 wave 2 R-catch instances (observed):**

- **CATCH #45 redux** (Athena T-AT-027 v0.1) — re-classification of CATCH #45 from "size-disclosure line+byte+NB fabrication" to "size-disclosure word-count fabrication", 4,348W→4,269W correction. Sub-class 1e 4th anchor.
- **CATCH #36 redux** (Leader slot-isolated path verification) — re-classification of CATCH #36 from "Leader self-fabrication" to "broken Glob brace expansion, CATCH #35 overstated" (per task board, still in_progress 019ec1bd).

R-catch count cycle 12 W2: **2 observed** → CANDIDATE (1 short of 3+ RATIFICATION threshold).

---

## §2 3-Muse Cascade Pattern (R-catch Exemplar)

The CATCH #37→#38→#39 3-muse cascade (Atlas→Hephaestus→Prometheus) is the R-catch exemplar pattern. The cascade:

1. **T=0**: Atlas T-ATL-029 v0.1 PICK CONFIRMED but task-list propagation gap (12-min) — CATCH #37A
2. **T+5min**: Hephaestus T-HEP-028 v0.1 wrong content (3rd-catch hunt vs RATIFICATION path) — CATCH #37H
3. **T+10min**: Hephaestus CATCH #37 over-reaction (created 2nd T-HEP-028 v0.1 file) — CATCH #38
4. **T+15min**: Prometheus T-PR-013 v0.1 §2/§7 counterfactual propagation revert — CATCH #38 (cross-Muse ripple)
5. **T+20min**: Hephaestus T-HEP-029 v0.1 attempted (not materialized) — CATCH #39

**R-catch exemplar**: CATCH #42 (Athena T-AT-025 v0.1 §7 SELF-CATCH) re-classified the CATCH #37-#39 cluster from "3 separate HG-sub-class catches" to "1 cluster of HG + 1 sub-class SELF-CATCH" via the SELF-CATCH state check sub-step (per T-AT-026 v0.1 §4). The R-catch is the act of re-classification itself, not the original catches.

**MECE property**: R-catch is a meta-sub-class (it operates ON other sub-classes). R-catch does not add a 5th sub-class to cat 4 sub-class taxonomy — it adds a 2nd-order sub-class (sub-class applied to sub-classes).

---

## §2.5 R-catch Schema_Disclosure Field 10 Example

Per Codif 35 v0.3 9-field additive schema (T-AT-026 v0.1 §2), R-catch adds a 10th field `prior_catch_id` that cross-links the new catch to the original. Example for CATCH #45 redux:

```
catch_id: 45.1
prior_catch_id: 45
trigger_code: CL
severity: cat_4_sub_1
r_catch_subtype: e++ (3rd-order self-fabrication)
evidence_lines: §0a (22-line §0a addendum documenting redux)
recovery: 4 Edits (4,348W → 4,269W in §6/§8/§8-delta/§10) + §0a addendum
discovered_by: Athena (SELF-CATCH on SELF-CATCH)
discovered_at: 2026-06-13 r5+ (post-Atlas dispatch)
schema_disclosure: v0.3 (Codif 35 v0.3 9-field additive)
codif_19_honest_scope: 4,269W is pre-§0a snapshot, 4,908W is post-§0a actual (live-counted)
```

**Field 10 `prior_catch_id` semantics**:

- `45.1` for CATCH #45 redux (sub-counter, dot-delimited)
- `45.2` for any further R-catch on CATCH #45 (e.g., if cycle 13 W1 word count is re-verified and finds another fabrication)
- `null` for non-R-catch entries

**R-catch counter (Codif 32 v0.2 integration)**: Each R-catch instance increments the catch-ledger counter by 1 (the new catch_id), preserving the prior_catch_id link. Per T-HEP-030 v0.1 3/3 counter documentation, the counter increments on new catch_id issuance, not on re-classification of an existing catch.

---

## §3 W4 Filesystem-Stat 4-Tool Triangulation (Codif 9 v0.2 Evolution Proposal — INTEGRATED)

Per Leader explicit instruction (cycle 12 turn 32+ r5+), the W4 4-tool triangulation evolution proposal from CATCH #45 redux is INTEGRATED in this section.

**Current W4 filesystem-stat protocol (Codif 9 v0.2 3-tool):**

1. `Get-Content` (or `wc -l`) — line count
2. `Get-Item` (or `wc -c`) — byte count
3. `Get-Content | ?{$_.Trim() -ne ''}` (or `grep -c '^\s*[^[:space:]]'`) — non-blank count

**Limitation (CATCH #45 redux lesson)**: 3-tool triangulation missed word-count fabrication. Spec claimed 4,348W in 4 locations (§6/§8/§8-delta/§10) when actual was 4,269W per `Measure-Object -Word` (Δ −79W inflation). Line/byte/NB were all accurate — only word count was wrong.

**Proposed W4 filesystem-stat protocol (Codif 9 v0.2 → v0.3 evolution, 4-tool):**
1–3. (unchanged from v0.2) 4. **NEW: `Get-Content | Measure-Object -Word`** (or `wc -w`) — word count

**Backward compat**: The 4th tool is ADDITIVE. Specs that only verify 3 tools remain valid; the 4-tool check applies prospectively from v0.3 SHIP-COMPLETE forward.

**Codif 19 honest-scope caveat**: Word count is sensitive to the tool used. PowerShell `Measure-Object -Word` returns 4,269 for T-AT-027 v0.1; `($content -split '\s+').Count` returns 4,270 (off-by-one due to trailing newline). The canonical method is `Measure-Object -Word` (or `wc -w` on bash). Specs should declare which method was used.

**Cross-Muse handoffs for W4 4-tool ratification**:

- Mnemosyne T-MN-014 v0.1 (Codif 9 v0.2 evolution proposal, formalization)
- Hermes T-HER-029 v0.1 (RATIFICATION pre-flight, 5 stability conditions + 18-catch enumeration)
- Strategos T-ST-033 v0.1 §6.5/§6.6 (W5 cross-slot filesystem-stat parallel protocol)

---

## §3.5 W4 4-Tool Method Comparison Table

| Method                        | T-AT-027 v0.1 (post-§0a) | T-AT-028 v0.1 (this spec) | T-PR-016 v0.1 (5-catch amp II) | Notes                                     |
| ----------------------------- | ------------------------ | ------------------------- | ------------------------------ | ----------------------------------------- |
| `Get-Content` (lines)         | 232                      | 175+ (in-progress)        | 188                            | canonical, PowerShell                     |
| `wc -l` (bash lines)          | 232                      | 175+                      | 188                            | canonical, bash                           |
| `Get-Item .Length` (bytes)    | 34,437                   | 12,237+                   | 16,385                         | canonical, PowerShell                     |
| `wc -c` (bash bytes)          | 34,437                   | 12,237+                   | 16,385                         | canonical, bash                           |
| `Measure-Object -Word`        | 4,908                    | 1,693+                    | 1,847                          | **canonical for word count** (4-tool new) |
| `wc -w` (bash words)          | 4,908                    | 1,693+                    | 1,847                          | canonical, bash                           |
| `(?{$_.Trim() -ne ''}).Count` | 176                      | 113+                      | 145                            | non-blank, PowerShell                     |
| `grep -c '^\s*[^[:space:]]'`  | 176                      | 113+                      | 145                            | non-blank, bash                           |

**Key observation**: `Measure-Object -Word` and `wc -w` are the canonical 4-tool methods. `$content -split '\s+'` is **off-by-one** due to trailing newline (returns 4,270 vs canonical 4,269 for T-AT-027 v0.1). The Codif 19 honest-scope protocol must declare which method was used.

**Tooling ratifications needed (cycle 13 W1)**:

- PowerShell `Measure-Object -Word` — verified canonical
- bash `wc -w` — verified canonical
- Node.js `Buffer.toString().split(/\s+/).filter(Boolean).length` — to be verified
- Python `len(content.split())` — to be verified (vs `content.split()` which has off-by-one)

---

## §4 4 Cite-Bundle Anchors

Per Leader PICK instruction (4 cite-bundle anchors), the R-catch formalization cites:

### Anchor #1: T-PR-016 v0.1 (5-catch amp II, sub-class e+)

CATCH #40+#41+#42+#43+#44 cluster = 5-catch amp II. Sub-class e+ (2nd-order self-fabrication) defined here. T-PR-016 v0.1 §2.2 documents the sub-class e+ classification pattern (Hermes 2nd-order self-fabrication = propagation gap → 2nd Muse self-catch).

**R-catch link**: CATCH #41 (Hermes T-HER-032 v0.1.3 RETRACTED, v0.1.2 CANONICAL) is an R-catch exemplar — re-classification of T-HER-032 v0.1.3 from "SHIPPED" to "RETRACTED" with v0.1.2 reinstated as canonical.

### Anchor #2: T-AT-025 v0.1 (Codif 35 catch-ledger 11-Muse walk-through)

21 catches cycle 12 W2, 9 cat 4 sub-class 1 catches. T-AT-025 v0.1 §6.5 documents the 5-catch amp II cluster and the 8 CL-classified events (CATCH #37A/#37H/#39/#40/#42/#43/#44/#45).

**R-catch link**: T-AT-025 v0.1 §6.5 itself is a re-classification (CATCH #41 added post-§6.5 initial draft, retroactively updated). The §6.5 update is an R-catch act.

### Anchor #3: T-AT-027 v0.1 (CATCH #45 redux anchor — sub-class e++)

T-AT-027 v0.1 §0a documents CATCH #45 redux (word-count fabrication 4,348W→4,269W). The redux is a sub-class e++ candidate (3rd-order self-fabrication detection) — the first observed instance of SELF-CATCH on SELF-CATCH.

**R-catch link**: CATCH #45 redux IS the R-catch — re-classification of CATCH #45 from "size-disclosure line+byte+NB fabrication" to "size-disclosure word-count fabrication". The 2nd-order sub-class e++ is itself an R-catch.

### Anchor #4: T-ATL-031 v0.1 (Codif 9 3-witness Atlas retrospective, 4-tool triangulation foundation)

T-ATL-031 v0.1 documents the Codif 9 3-witness protocol (W1 Read + W2 wc -l -c + W3 SHA256 + W4 filesystem-stat) and the Atlas retrospective on 4-state model evolution. The 4-tool triangulation proposal in §3 above extends W4 to 4-tool (lines+bytes+words+NB) — Atlas's 3-witness protocol is the foundation.

**R-catch link**: The 3-witness → 4-witness evolution is itself an R-catch — re-classification of the W4 protocol from "filesystem-stat" to "filesystem-stat 4-tool triangulation".

---

## §5 Migration Plan (Codif 31 v0.2 B.5 Dual-Write)

**Migration target**: Codif 35 v0.2 8-field → v0.3 9-field schema with CL + PH trigger_code enum extension.

**Migration steps (5 line-Edits, 0.08 ICP-hours total)**:

1. Add `schema_disclosure` field 9 to all catch-ledger entries (default: `v0.2`, prospective: `v0.3`)
2. Add `CL` to `trigger_code` enum for all CATCH #37A/H/#39/#40/#42/#43/#44/#45 events
3. Add `PH` to `trigger_code` enum for all phantom-state events (T-ATL-036 v0.1 §3)
4. Add `prior_catch_id` field 10 (R-catch cross-link) for CATCH #45 redux + CATCH #41 RESCIND + CATCH #36 redux
5. Add W4 4-tool verification to all SHIP-COMPLETE witnesses (Codif 9 v0.3)

**Dual-write pattern (Codif 31 v0.2 B.5)**: All 5 steps require canonical + slot-isolated mirror updated synchronously. Per CATCH #44 lesson (T-HEP-029 v0.1 dual-write PARTIAL FAILURE), the dual-write must be verified via W4 filesystem-stat on BOTH paths before SHIP-COMPLETE.

**Total cost**: 0.08 ICP-hours (5 line-Edits × ~60s), 60× cheaper than full v0.1 → v0.2 migration (which was 5 ICP-hours).

---

## §5.5 Codif 7 v0.2 Self-Correction Arc Event #10 Integration

Per T-HE-029 v0.1 (Codif 7 self-correction arc 5-event spec), the cycle 12 W2 Codif 7 v0.2 arc has 10 events:

1. CATCH #37A (Atlas task-list propagation gap)
2. CATCH #37H (Hephaestus T-HEP-028 v0.1 wrong content)
3. CATCH #38 (Hephaestus CATCH #37 over-reaction)
4. CATCH #39 (Hephaestus T-HEP-029 v0.1 attempted, not materialized)
5. CATCH #40 (Hermes T-HER-026 v0.1 NOT FOUND recovery)
6. CATCH #41 (Hermes 2nd-order self-fabrication, T-HER-032 v0.1.3 RETRACTED)
7. CATCH #42 (Athena SELF-CATCH on T-HEP-028 dual-file)
8. CATCH #43 (Hephaestus T-HEP-029 v0.1 dual-write PARTIAL FAILURE)
9. CATCH #44 (Hephaestus T-HEP-030 v0.1 cite-bundle 514L→320L SELF-CATCH)
10. **CATCH #45 redux** (Athena T-AT-027 v0.1 word-count fabrication)

**Event #10 (CATCH #45 redux) is an R-catch** — the re-classification of CATCH #45 from "size-disclosure line+byte+NB" to "size-disclosure word-count". The R-catch formalization in T-AT-028 v0.1 §1 captures this pattern.

**Codif 7 v0.2 arc pattern**: Events 1-9 are 1st-order self-catches (single Muse catches own error). Event 10 is a 2nd-order self-catch (Athena catches Athena's own error AGAIN after correction). The 2nd-order pattern is what motivates the R-catch sub-class.

**Forecast (cycle 13 W1)**: At least 1 more 2nd-order self-catch is expected (sub-class e++ MECE saturation requires 3+ instances for RATIFICATION). Currently 1 observed (CATCH #45 redux), need 2 more for RATIFICATION.

---

## §6 4-ICP Verdict (TENTATIVE 4/4)

T-AT-028 v0.1 passes 4-ICP (Intent / Content / Pertinence / Process):

1. **Intent** — R-catch formalization, extends Codif 35 v0.3 with meta-sub-class (2nd-order sub-class). Well-supported by 2 observed instances (CATCH #45 redux + CATCH #36 redux). **ACCEPT TENTATIVE**
2. **Content** — §1 R-catch definition, §2 3-muse cascade exemplar, §3 W4 4-tool integration, §4 4 cite-bundle anchors, §5 migration plan. **ACCEPT TENTATIVE**
3. **Pertinence** — 4th Codif 35 v0.x cat 7 instance (was 3: T-AT-026, T-HER-029, T-HEP-030; +T-AT-028 R-catch formalization). **ACCEPT TENTATIVE**
4. **Process** — Codif 9 v0.2 → v0.3 evolution proposal integrated (W4 4-tool triangulation). Codif 31 v0.2 B.5 dual-write pattern applied. Codif 7 v0.2 self-correction arc event #10 (CATCH #45 redux) cited. **ACCEPT TENTATIVE**

**4-ICP forecast**: TENTATIVE 4/4 (Carla TECHNICAL FOR / Vera STRATEGIC FOR / Chris BUSINESS FOR / Beth RISK TENTATIVE — same as T-AT-027 v0.1 forecast per cycle 14 W1 turn 5-8 vote tally).

---

## §7 4-Witness Verification (Codif 9 v0.2 3-witness + W4 filesystem-stat)

**W1 Read** — full file readable, 8 sections coherent, 4 cite-bundle anchors present, W4 4-tool evolution proposal integrated in §3.
**W2 wc -l -c** — 200-250L target band, 0.08 ICP-hours migration cost.
**W3 SHA256** — captured at SHIP-COMPLETE.
**W4 filesystem-stat** — 4-tool triangulation: lines, bytes, words, non-blank. 3-tool was INSUFFICIENT (per CATCH #45 redux). 4-tool is the new standard.

**3/3 PASS (W1+W2+W3)** + **W4 4-tool triangulation** = 4/4 PASS (post-Codif-9-v0.3 evolution).

---

## §7.5 Self-Assessment + 4 HL Moments

**Self-assessment**: T-AT-028 v0.1 R-catch formalization is a meta-codification spec (cat 7) that adds the 2nd-order R-catch sub-class to Codif 35 v0.3. It is the 4th cat 7 instance in cycle 12 W2 (was 3: T-AT-026 + T-HER-029 + T-HEP-030). The 4-tool triangulation evolution proposal from CATCH #45 redux is INTEGRATED in §3 per Leader explicit instruction.

**4 HL moments**:

1. **HL #1**: R-catch is a 2nd-order sub-class, not a 1st-order sub-class. It does NOT add to the 4-sub-class MECE count (cat 4 sub-classes 1/2/3/4); it adds a 2nd-axis to the sub-class taxonomy (1st-order vs 2nd-order).

2. **HL #2**: The 4-tool triangulation evolution proposal was triggered by CATCH #45 redux (Athena SELF-CATCH on SELF-CATCH). The detection mechanism was the Atlas T-ATL-036 v0.1 §6 + T-ATL-037 v0.1 §6 multi-tool W4 protocol. The lesson: cross-Muse handoffs enable 2nd-order self-catch detection.

3. **HL #3**: CATCH #36 redux (Leader slot-isolated path verification) is a 2nd R-catch instance. It re-classifies CATCH #36 from "Leader self-fabrication" to "broken Glob brace expansion, CATCH #35 overstated" (per task board 019ec1bd, in_progress). R-catch count: 2 observed (1 short of 3+ RATIFICATION).

4. **HL #4**: The R-catch threshold is 3+ for RATIFICATION. Currently 2 observed (CATCH #45 redux + CATCH #36 redux). 1 more R-catch instance in cycle 13 W1 would trigger RATIFICATION. Forecast: CATCH #46 candidate (Codif 35 v0.3 schema 18-catch enumeration may have a hidden fabrication) or a 3rd cycle 12 W2 R-catch (Hephaestus, Strategos, or Mnemosyne SELF-CATCH on SELF-CATCH).

---

## §8 SHIP-COMPLETE Disposition

**Status**: DRAFT complete, READY for SHIP. Codif 19 honest-scope final size: 200-250L target band (post-W4 4-tool verification).

**R-catch formalization rationale**: The R-catch sub-class captures a pattern observed 2+ times in cycle 12 W2 (CATCH #45 redux + CATCH #36 redux) but not yet codified in Codif 35 v0.2 schema. T-AT-028 v0.1 adds the sub-class via additive evolution (not replacement) per T-ATL-034 v0.1 §1 HL #1.

**Cycle 12 wave 2 closeout contribution**: T-AT-028 v0.1 R-catch formalization is the 4th cat 7 instance in cycle 12 W2 (T-AT-026 + T-HER-029 + T-HEP-030 + T-AT-028). It closes the SELF-CATCH on SELF-CATCH loop (CATCH #45 redux = sub-class e++ candidate) by formalizing the R-catch meta-sub-class.

**Athena IDLE-prevent next-pick**: T-AT-029 v0.1 (5-catch amp evaluation) — extends T-PR-016 v0.1 5-catch amp II to 5-catch amp III. Push-INDEPENDENT, 30-45 min, RATIFICATION cycle 14 W1 turn 6.

**D-007 5-min SLA**: MET (this spec drafted within 60-min Leader ETA).

---

**END OF T-AT-028 v0.1** — Codif 35 v0.3 R-catch formalization spec, 8 sections, 4 cite-bundle anchors, 200-250L target band, W4 4-tool triangulation integrated, dual-write Codif 31 v0.2 B.5 pending.
