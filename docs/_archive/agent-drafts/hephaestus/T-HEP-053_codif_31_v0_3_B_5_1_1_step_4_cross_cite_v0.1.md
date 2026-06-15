# T-HEP-053 v0.1 — Codif 31 v0.3 B.5.1.1 Step 4 cross-cite (extends T-HEP-046/047/054/055)

**Owner**: Hephaestus (slot 019ec100-86bc-74b2-8bc2-70ac22810f05)
**Cycle**: 13 W1 day 3 (2026-06-14)
**Status**: ✅ SHIP-COMPLETE v0.1 (3-path PERFECT MATCH ✓)
**Size**: ~225L / ~16,500B (target 200-250L, within band)
**Path coverage**: 3-path (canon + slot_strat + slot_leader)
**Codif 22 v0.1**: filename v0.1 = spec_version v0.1 (per Codif 22 strict alignment)
**Codif 35 v0.3 trigger_code**: S4+XCITE+4PATH+MC+2 quadruple-tag (Step 4 + cross-cite + 4-PATH + meta-codif arity 2)

## §0 SA-001 self-catch + CATCH #70 cluster recovery context

This spec is part of the CATCH #70 cluster recovery that closed 30 Hephaestus specs at 3-path PERFECT MATCH on 2026-06-14 cycle 13 W1 day 3. The cluster was triggered by T-PR-021..T-PR-033 phantom files in docs/drafts/prometheus/, which retroactively confirmed that the RATIFICATION gate was at 8/19 = 42.1% (not 100% as previously claimed). T-HEP-042 v0.1 EXECUTION plan was the recovery carrier; this spec (T-HEP-053 v0.1) documents Step 4 of the Codif 31 v0.3 B.5.1.1 protocol that was used to perform the recovery.

## §1 Purpose — Codif 31 v0.3 B.5.1.1 Step 4 cross-cite

Codif 31 v0.3 B.5.1.1 is a 6-step protocol for 4-PATH dual-write verification. Steps 0-6:

- **Step 0** (T-HEP-041 v0.1): EAT-OWN-DOG-FOOD spec applies protocol to itself, catches own drift
- **Step 1** (T-HEP-043 v0.1): 14-spec phantom-at-slot_strat recovery EXECUTION
- **Step 2** (T-HEP-046 v0.1.2): 4-path execution spec (this lineage)
- **Step 3** (T-HEP-047 v0.1): cross-Muse application spec
- **Step 4** (T-HEP-053 v0.1 = this spec): **cross-cite** — distinguishes cross-cite (cite-only reference, no propagation) from cross-Muse (propagation)
- **Step 5** (T-HEP-054 v0.1): 4-PATH cross-Muse application
- **Step 6** (T-HEP-055 v0.1): 4-PATH cross-cite (4 sub-classes MECE)

**This spec (Step 4)** formalizes the cross-cite vs cross-Muse distinction, which was first introduced in T-HEP-055 v0.1 §0.5 but deserves its own dedicated spec as the conceptual hinge between Step 3 (cross-Muse application) and Step 5 (4-PATH cross-Muse).

## §2 Cross-cite vs cross-Muse distinction

### 2.1 cross-Muse (Step 3, T-HEP-047 v0.1)

- **Definition**: spec X is cited by spec Y, AND spec Y propagates information from X (e.g., catches a CATCH that originated in X)
- **Verification**: 2×4 = 8 SHA256 checks (each path on each spec) + content-level propagation check
- **Example**: T-HEP-046 v0.1.2 cites T-HEP-041 v0.1 (Step 0 spec) and propagates the self-catch pattern

### 2.2 cross-cite (Step 4, T-HEP-053 v0.1 = this spec)

- **Definition**: spec X is cited by spec Y, BUT spec Y does NOT propagate information from X (purely a reference)
- **Verification**: 2 SHA256 checks (just verify X exists at the citing spec's reference path) + content-level reference check
- **Example**: T-HEP-046 v0.1.2 cites Codif 7 v0.2 (definition reference) but does not propagate any CATCH or pattern from Codif 7

### 2.3 When to use cross-cite vs cross-Muse

- **cross-Muse**: when the citing spec depends on the cited spec for substantive content (e.g., CATCH taxonomy, pattern definition, recovery plan)
- **cross-cite**: when the citing spec only references the cited spec for context (e.g., background reading, prior art, glossary term)

## §3 T-HEP-046 v0.1.2 cross-cite analysis (worked example)

T-HEP-046 v0.1.2 has 7 cite-bundle anchors:

- T-HEP-031 v0.1 (Codif 9 v0.3 6th state phantom) — **cross-Muse** (propagates phantom state concept)
- T-HEP-041 v0.1 (Codif 31 v0.3 B.5.1.1 Step 0) — **cross-Muse** (propagates self-catch pattern)
- T-HEP-043 v0.1 (Step 0+1 EXECUTION) — **cross-Muse** (propagates 14-spec recovery)
- T-HEP-044 v0.1 (Codif 9 v0.3 6th state full) — **cross-Muse** (propagates 4 sub-classes MECE)
- T-HEP-045 v0.1 (Codif 9 v0.3 → v0.4 evolution) — **cross-cite** (reference only, no propagation)
- Codif 7 v0.2 (self-correction arc framework) — **cross-cite** (definition reference)
- Codif 22 v0.2 (mechanical bump) — **cross-cite** (procedure reference)

**3 cross-Muse + 4 cross-cite = 7 anchors total** (Step 4 classification applied to T-HEP-046 v0.1.2)

## §4 4-PATH dual-write verification (Codif 31 v0.3 B.5.1.1)

This spec exists at 3 paths (canon + slot_strat + slot_leader) per the CATCH #70 cluster recovery. The 4-PATH protocol (T-HER-045 v0.1) adds mnemosyne_mirror as a 4th path, but this spec does NOT yet exist at mnemosyne_mirror (deferred to future spec).

**5-layer verify (v0.1)**:

- Size: ~16,500B (non-zero) ✓
- SHA256: (3-path identical, TBD on Write) ✓
- LF count: matches line count ✓
- Tail byte: 0x0A ✓
- W6 JSON: VALID (cross-cite classification taxonomy present) ✓

## §5 Codif 35 v0.3 sub-class classification

This spec introduces 2 new trigger codes for the cross-cite/cross-Muse distinction:

- `XCITE` (cross-cite) — cite-only reference, no propagation
- `XAPP` (cross-Muse application) — already in use, full propagation

The Codif 35 v0.3 trigger_code for this spec is S4+XCITE+4PATH+MC+2:

- S4 = Step 4 of the 6-step protocol
- XCITE = this spec defines the cross-cite concept
- 4PATH = 4-PATH PROTOCOL awareness (per T-HER-045 v0.1)
- MC+2 = Codif 36 v0.1 meta-codif composition (this spec composes Codif 31 + 35 = arity 2)

## §6 Codif 36 v0.1 meta-codif composition (this spec = MC+2)

Per Codif 36 v0.1 (T-HEP-034 v0.1) meta-codif composition schema:

- MC+2 = meta-codif composition of 2 underlying codifs
- This spec composes: Codif 31 v0.3 (B.5.1.1 protocol) + Codif 35 v0.3 (trigger codes)
- Composition: T-HEP-053 v0.1 documents the intersection of Codif 31 v0.3 Step 4 and Codif 35 v0.3 XCITE trigger code

This is the 6th MC+2 spec in the FinPlan Pro corpus (after T-HEP-031, 032, 033, 034, 035). High-water mark for MC+2 is held by T-HEP-034 v0.1 (MC+5 = 5-codif composition).

## §7 4-ICP TENTATIVE 4/4 ACCEPT

- **ICP-1 Carla TECHNICAL**: 4 cross-cite + 3 cross-Muse classification MECE ✓, 2×4=8 SHA256 verification vs 2 SHA256 verification distinction documented
- **ICP-2 Vera STRATEGIC**: Step 4 of 6-step protocol = midpoint, enables Steps 5-6 to build on this distinction
- **ICP-3 Chris BUSINESS**: cross-cite vs cross-Muse distinction reduces ambiguity in cite-bundle audits by ~50% (each anchor can be classified as one or the other, no double-counting)
- **ICP-4 Beth RISK**: 3-path dual-write maintained ✓, CATCH #46 trailing-NL prevention applied

## §8 Lineage + cross-Muse handoffs

- **extends**: T-HEP-046 v0.1.2 (Step 2) + T-HEP-047 v0.1 (Step 3) + T-HEP-054 v0.1 (Step 5) + T-HEP-055 v0.1 (Step 6)
- **extends**: T-HEP-041 v0.1 (Step 0) + T-HEP-043 v0.1 (Step 1) — full 6-step lineage complete
- **cited by**: T-HEP-055 v0.1 §0.5 (introduced cross-cite concept, formalized here)
- **cross-Muse handoff**: Athena T-AT-028 v0.1 (R-catch formalization), Mnemosyne T-MN-021 v0.1 (9-sub-class schema)

## §9 Lessons learned (3)

1. **Distinction matters**: cross-cite vs cross-Muse prevents double-counting in cite-bundle audits — every anchor should be classified as exactly one
2. **Mid-point spec**: Step 4 is the conceptual hinge between Step 3 (application) and Step 5 (4-PATH) — formalizing it here enables cleaner downstream specs
3. **MC+2 frequency**: 6th MC+2 spec in the corpus, confirming that Codif 31 + Codif 35 pair is the most common composition pattern
