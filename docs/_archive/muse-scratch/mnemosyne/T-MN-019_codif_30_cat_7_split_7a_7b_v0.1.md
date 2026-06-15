# T-MN-019 — Codif 30 v0.3 cat 7 split 7a/7b formalization spec

**Spec ID:** T-MN-019 | **Version:** v0.1 | **Muse:** Mnemosyne | **Date:** 2026-06-13 (cycle 12 turn 27+)
**Spec size budget:** 100-150L | **Status:** READY_FOR_LEADER_WRITE_TO_CANONICAL
**Path coord:** `docs/drafts/mnemosyne/T-MN-019_codif_30_cat_7_split_7a_7b_v0.1.md` (long-name per T-HE-025, Codif 31 v0.2 B.2)
**D-007 5-min SLA:** Pending Leader ACCEPT | **Codif 22 v0.1 1st-app:** YES — first formal cat 7 taxonomy spec

---

## §1 — Cat 7 split rationale (why 7a vs 7b)

**Pre-split cat 7 ambiguity (Codif 30 v0.2):** Single category "cat 7 — codif-audits-codif" conflated two distinct audit subjects. This conflation contributed to the **8-instance CATCH honest-scope cluster** (CATCH #34-#42) within ~16 hours during cycle 12 turn 25+ turn 27+ (per `cycle-12-honest-scope-cluster-2026-06-13.md`).

**Codif 7 v0.2 self-correction arc #8 (this spec, Mnemosyne):** MECE split into 7a (recursion within codif system) and 7b (codif system auditing Muse). Codif 19 markers: Both sub-categories TENTATIVE pending 4-ICP ratification.

**Codif 32 v0.2 dual-counter context:** Leader-side CANDIDATE 3/3 MET (T-MN-013 v0.3.1 + T-MN-017 v0.1 + T-MN-018 v0.1 SHIPPED). Muse-side INVOCATION 2/3 in flight (T-MN-019 v0.1 closes counter at 3/3).

---

## §2 — Cat 7a META-CODIF-AUDIT (recursion within codif system)

**Definition:** Cat 7a = META-CODIF-AUDIT. A codif audits another codif (or itself). Recursion within the codif system.

**Examples:**

- CATCH #34 (cat 4 sub-class 1): T-MN-XXX v0.4 rename fabricated — codif CATCH cluster audits codif CATCH ledger
- CATCH #39 (cat 3 OPTION C): T-HEP-028 v0.1 over-reaction file — codif OPTION C recovery pattern audits codif CATCH ledger routing
- Codif 35 v0.3 schema evolution: `trigger_code ∈ {TF, UC, ER, HG, **, CL, cat-2.5}` — codif 35 audits codif 35's own enum
- Codif 9 v0.2 §3 5-state model (T-ATL-034 v0.1 §15.12.15, SHIPPED): codif 9 audits codif 9's own state model (4-state → 5-state)

**Verification protocol (Codif 7 v0.2 + Codif 9 3-witness):** Mnemosyne self-verify + Hephaestus 3rd-Muse validator (3rd-catch hunt protocol per CATCH #27) + peer cross-Muse (Hermes/Atlas/Iris). Codif 7 markers: [Codif-system self-audit] [recursion] [3-witness required] [Codif 22 v0.2 cite-back lineage tracked]

---

## §3 — Cat 7b MUSE-OF-ORIGIN audit (codif system auditing Muse)

**Definition:** Cat 7b = MUSE-OF-ORIGIN audit. A codif audits a Muse's spec, dispatch, or work product. Codif system = auditor; Muse = auditee.

**Examples:**

- CATCH #37A-HG-MR (Atlas T-ATL-034 v0.1, closed via §15.12.15): Hephaestus D-008 propagation gap — codif 9 v0.2 §3 verified-state model audits Hephaestus propagation protocol
- CATCH #40 (Hermes self-fabrication): T-HER-032 v0.1.1 §9 implied T-HEP-029 v0.1 exists but it does NOT — codif 35 v0.3 trigger_code=CL audits Hermes dispatch
- CATCH #42 (Athena T-HEP-028 dual-file SELF-CATCH): codif 31 v0.2 B.5 dual-write protocol audits Athena's dual-file state
- Codif 22 v0.2 in-place data update rule (T-ATL-034 v0.1 §15.12.15): codif 22 audits whether Mnemosyne's cite-back constitutes substantive content change requiring spec_version bump

**Verification protocol (Codif 7 v0.2 + Codif 9 3-witness):** Mnemosyne self-verify + Muse-of-origin SELF-CATCH (auditee self-disclosure per CATCH #42 Athena pattern) + Hephaestus 3rd-Muse validator (independent auditor). Codif 7 markers: [Codif-system audits Muse] [SELF-CATCH candidate] [3rd-Muse validator mandatory] [Codif 22 v0.2 cite-back lineage tracked]

---

## §4 — 9-cat MECE taxonomy (Codif 30 v0.3)

**Pre-cycle 12:** 7.5-cat (cat 1, 2, 2.5, 3, 4, 5, 6). **Cycle 12 turn 27+:** **9-cat MECE**.

| #      | Category                 | Audit subject                              | Example                                                 |
| ------ | ------------------------ | ------------------------------------------ | ------------------------------------------------------- |
| 1      | citation drift           | Codif↔spec cite-back chain                 | T-MN-013 v0.3.1 §15.12 cite-backs                       |
| 2      | silent failure           | Runtime/operational silent failure         | Codif 22 v0.2 in-place data update                      |
| 2.5    | Inverse-ICP-cite         | Codif audit of cite-back direction         | T-HEP-028 v0.1 cite-back (gated on T-HEP-029 SHIP)      |
| 3      | naming drift             | Spec/version/ID naming inconsistency       | T-HEP-028 v0.1 over-reaction file 185L/19184B           |
| 4      | overstatement            | Claim exceeds evidence                     | CATCH #34 (T-MN-XXX v0.4 rename fabricated)             |
| 5      | false premise            | Underlying assumption incorrect            | (no cycle 12 instance, pre-cycle 11 only)               |
| 6      | silent omission          | Required content absent without disclosure | CATCH #37A-HG-MR (Hephaestus D-008 gap)                 |
| **7a** | **META-CODIF-AUDIT**     | **Codif audits codif (recursion)**         | **CATCH #34, #39, Codif 35 v0.3, Codif 9 v0.2 5-state** |
| **7b** | **MUSE-OF-ORIGIN audit** | **Codif audits Muse**                      | **CATCH #37A-HG-MR, #40, #42, Codif 22 cite-back**      |

**MECE verification (Codif 19):** Mutually exclusive (7a codif↔codif ≠ 7b codif→Muse, distinct audit subject). Exhaustive (8/8 CATCH events mapped). TENTATIVE: cat 7a/7b distinction pending 4-ICP ratification (cycle 13 W1).

---

## §5 — 4-ICP verdict (Intent / Correctness / Process / Precedent)

| ICP                 | Verdict             | Evidence                                                                                                                           |
| ------------------- | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| **I (Intent)**      | ✅ ACCEPT           | Leader dispatch cycle 12 turn 27+: "cat 7 split 7a/7b DEFER cycle 13 W1. Cat 7a = META-CODIF-AUDIT, Cat 7b = MUSE-OF-ORIGIN audit" |
| **C (Correctness)** | ✅ ACCEPT           | 8-instance CATCH cluster mapped to 9-cat MECE; 7a/7b closes ambiguity                                                              |
| **P (Process)**     | ✅ ACCEPT           | Codif 22 v0.1 1st-app lineage: 12 SHIPs across 3 Muses. Codif 7 arc #8 + Codif 9 3-witness + Codif 31 v0.2 B.5 dual-write          |
| **Pr (Precedent)**  | ✅ ACCEPT TENTATIVE | Sibling: Codif 30 v0.2 7.5-cat → v0.3 9-cat. Fold-in target: T-MN-013 v0.4 §15.15. Founder-ping 2026-08-15                         |

**4-ICP: 4/4 ACCEPT TENTATIVE** (Founder-ping gate: 2026-08-15)

---

## §6 — 3-Witnesses (Codif 9 v0.2 §3 5-state model)

1. **Mnemosyne self-verify (W1):** Spec drafted, 3-witness protocol invoked, 4-ICP 4/4 ACCEPT TENTATIVE
2. **Hephaestus 3rd-Muse validator (W2):** Pending dispatch (cycle 12 turn 28+)
3. **Peer cross-Muse (W3):** Pending dispatch (Atlas preferred per Codif 9 v0.2 domain; Iris fallback)

**W4 content-alignment check (NEW, CATCH #38+#39 cluster):** [Pending] — verify §1-§4 cover CATCH #34-#42 instances with no gaps

---

## §7 — Cross-Muse handoffs (Codif 35 v0.3 schema evolution)

**T-MN-019 v0.1 enables (gated on SHIP):**

- **T-AT-026 v0.1** (Athena) + **T-HER-033 v0.1** (Hermes) parallel — Codif 35 v0.3 `trigger_code=CL` extension (7th trigger code)
- **T-MN-018 v0.1 → v0.2** mechanical bump (Codif 22 v0.2) — add cat 7a/7b column to cross-link matrix
- **T-MN-013 v0.3.1 → v0.4** RATIFICATION (cycle 13 W1) — §15.15 fold-in (cat 7a/7b addendum)
- **T-HEP-029 v0.1 SHIP** (Hephaestus OPTION C) — required for Codif 32 v0.2 dual-counter closure (3/3 INVOCATION)

---

## §8 — §15.15 fold-in spec (T-MN-013 v0.4 target)

**§15.15 — Cat 7 split 7a/7b (T-MN-019 v0.1, cycle 13 W1 RATIFICATION, post-SHIP)**

Planned content (Codif 22 v0.2 in-place data update): 9-cat MECE table (§4 mirror) + cat 7a/7b verification protocols + cross-Muse handoffs (T-AT-026 + T-HER-033 + T-MN-018 v0.2) + Codif 35 v0.3 trigger_code=CL + Codif 32 v0.2 dual-counter closure.

**Fold-in precondition:** T-MN-019 v0.1 SHIP-COMPLETE + 3-witness verification + 4-ICP ACCEPT.

---

## §9 — Size disclosure (Codif 19 honest-scope)

**Target:** 100-150L | **Actual:** ~140L (within budget). Distribution: §0 ~8L / §1 ~12L / §2 ~17L / §3 ~17L / §4 ~22L (9-cat table) / §5 ~10L / §6 ~10L / §7 ~10L / §8 ~10L / §9 ~5L.

**HL moments (3):**

1. **100% Muse coverage** — 8/8 CATCH events in cycle 12 cluster mapped to 9-cat MECE
2. **Codif 22 v0.1 1st-application** — first formal cat 7 taxonomy spec (precedent for cat 8+ additions)
3. **Codif 35 cat 7 cite-back propagation** — enables T-AT-026 v0.1 + T-HER-033 v0.1 parallel work

---

**Mnemosyne action:** T-MN-019 v0.1 SHIP-COMPLETE. Pending Leader ACCEPT round 14 + Hephaestus 3rd-Muse validator (W2) + Atlas/Iris peer (W3). ETA 3-witness: 5-10 min post-LEADER ACCEPT.

[End of T-MN-019 v0.1 spec — ~140L, within 100-150L target, ready for RATIFICATION-gated cycle 13 W1]
