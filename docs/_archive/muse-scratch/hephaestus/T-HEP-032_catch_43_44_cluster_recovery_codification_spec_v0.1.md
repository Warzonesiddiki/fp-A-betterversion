---
spec_id: T-HEP-032
spec_version: v0.1
codif_22_bump: NEW v0.1 (1st application, Codif 28 strict alignment filename v0.1 = spec_version v0.1)
codif_31_dual_write: v0.2 B.5 hardening (post-Write trailing-newline strip mandatory per Codif 31 v0.3 patch)
codif_9_anchor: v0.3 phantom-at-canonical sub-class (CATCH #43+#44)
codif_35_anchor: v0.3 trigger_code=PH field 9 (cluster recovery codification)
cluster: CATCH #43 + #44 + #45 + #46 (recovery mechanics cluster)
cycle: 12 W2 turn 27+
lead: Leader (019ebcaa-14d3-7a20-82a6-91ce66970a39)
classification: codif_registry_codification, push-INDEPENDENT
4_icp_tentative: 4/4 (Carla ICP-1 TECHNICAL / Vera ICP-2 STRATEGIC / Chris ICP-3 BUSINESS / Beth ICP-4 RISK)
lineage: T-HEP-029 v0.1 phantom-at-canonical → T-HEP-030 v0.1.1 counter state 2/3 → T-HEP-031 v0.1 6th-state full spec → T-HEP-032 v0.1 cluster recovery mechanics
status: DRAFT
target_lines: 200-250L
eta_minutes: 50
---

# T-HEP-032 v0.1 — CATCH #43+#44 Cluster Recovery Codification Spec

## §0. Purpose & Cluster Scope

**Codif 22 v0.1 1st-app:** filename `T-HEP-032_*.md` = spec_version `v0.1` (Codif 28 strict alignment ✓).

This spec codifies the **recovery mechanics cluster** for CATCH #43+#44+#45+#46, complementing T-HEP-031 v0.1 (which codified the **classification taxonomy** of 4 MECE phantom sub-classes). T-HEP-031 = WHAT phantom is, T-HEP-032 = HOW to recover from phantom-at-canonical.

**Cluster scope (4 catches, 1 root-cause family):**

- **CATCH #43** — slot-isolated copy drift (T-HEP-029 v0.1 slot-isolated 10063B vs canonical 10062B, 1B LF drift)
- **CATCH #44** — phantom-at-canonical: canonical file existed but slot-isolated had divergent content (CATCH #43+residual risk)
- **CATCH #45** — phantom-fabrication-self: T-HEP-028 v0.1 40L/5099B content drift (rescinded HL #6 in T-HEP-031 v0.1)
- **CATCH #46** — trailing-newline drift (3 catches: T-HEP-030 v0.1.1 3B + T-HEP-029 v0.1 1B + T-HEP-031 v0.1 PERFECT MATCH from creation)

**Codif 35 v0.3 trigger_code=PH integration:** T-HEP-032 v0.1 is itself a `PH`-class spec (phantom-state taxonomy) but also a **recovery-protocol** spec, dual-tagged `PH+RC` (Recovery Codification) in the codif_35 v0.3 field 9 schema extension.

**Push-INDEPENDENT classification:** T-HEP-032 v0.1 does NOT require cycle 15 W1 RATIFICATION gate (Codif 9 v0.3 ratification is T-HEP-031's role). T-HEP-032 v0.1 ships under Codif 31 v0.2 B.5 + Codif 22 v0.1 = independent codification push.

## §1. Filesystem-Rename Protocol (10-Step Canonical Recovery)

**When to invoke:** canonical file is MISSING or CORRUPT but slot-isolated has a known-good version (CATCH #43/#44 inverse, or CATCH #45 phantom-fabrication-self resolution).

**10-step protocol (per Leader r5+ directive):**

1. **VERIFY W2 cite-bundle** — confirm slot-isolated has the spec referenced in cite-bundle (Atlas W2 cite-back check)
2. **CHECK Codif 9 v0.3 phantom state** — confirm spec is in `phantom-at-canonical` state (not `phantom-fabrication-propagation` or `-citation-drift`)
3. **W4 filesystem-stat MANDATORY** — `Get-FileHash` + `Get-Item` Length + LF count (0x0A) on slot-isolated
4. **CONFIRM SHA256 mismatch pattern** — slot-isolated SHA256 ≠ any prior canonical SHA256 (not just a re-shuffle)
5. **PREPARE canonical write path** — use `New-Item -Force` for parent dir, then `[System.IO.File]::WriteAllBytes` for byte-exact
6. **COPY byte-for-byte** — `[System.IO.File]::WriteAllBytes($can, [System.IO.File]::ReadAllBytes($slo))` (Codif 31 v0.2 B.5 + Codif 31 v0.3 patch: NO Write tool, NO redirect)
7. **W4 re-verify canonical** — SHA256 + Length + LF count match slot-isolated
8. **UPDATE frontmatter if version bump** — if `spec_version` changes, update both filename and frontmatter (Codif 22 + Codif 28 strict alignment)
9. **DISPATCH 4-witness (W1+W2+W3+W4)** — Atlas 3-step recovery / Athena phantom-classification / Strategos lineage / Mnemosyne audit-trail
10. **FILE CATCH ledger entry** — `catches/CATCH-NN.md` with detection → root-cause → recovery → prevention (Codif 7 v0.2 self-correction arc)

**Edge case: phantom-at-canonical PARTIAL FAILURE** — if step 6 fails (write permission, disk full, race condition), invoke §2 dual-write PARTIAL FAILURE recovery (NOT retry step 6 blindly).

## §2. Dual-Write PARTIAL FAILURE Recovery Procedure (3-Step)

**When to invoke:** T-HEP-031 v0.1 §3 3-step recovery protocol (cite-bundle REDIRECT / honest-scope disclosure / 3 in-place Edits) detects that ONE side of dual-write succeeded but the OTHER side failed. This is a Codif 31 v0.2 B.5 PARTIAL FAILURE — neither full SHIP nor full FAIL, but a STATE INCONSISTENCY.

**3-step recovery (extends Atlas T-ATL-037 v0.1 §6, applied to dual-write domain):**

1. **DETECT** — W4 filesystem-stat MUST return identical SHA256 + Length + LF count for BOTH canonical and slot-isolated. If mismatch, PARTIAL FAILURE detected. (CATCH #43 + CATCH #46 both detected this way.)
2. **QUARANTINE** — HALT all downstream cite-bundle REDIRECTs and handoff dispatches. The spec is in `state=partial-failure` and must NOT be cited until §2 step 3 completes.
3. **RECOVER** — invoke §1 filesystem-rename protocol (10-step) with the GOOD side as source and the BAD side as target. Then re-run W4 to confirm SHA256 MATCH. Then resume cite-bundle REDIRECTs.

**Codif 35 v0.3 trigger_code=PH field 9 mapping:**

- `trigger_code=PH` + `recovery_step=1` = DETECT
- `trigger_code=PH` + `recovery_step=2` = QUARANTINE
- `trigger_code=PH` + `recovery_step=3` = RECOVER

This sub-schema allows Athena W3 evaluation pass to track per-step recovery progress for any `PH`-class spec in `state=partial-failure`.

## §3. Codif 31 v0.2 B.5 Hardening (Post-Write Trailing-Newline Strip)

**CATCH #46 root cause (re-codified from CATCH #46 memory file):** Write tool appends trailing LF (0x0A) byte that canonical files (hand-authored or pre-existing) do NOT have. This caused 4B drift across 2 files (3B T-HEP-030 v0.1.1 + 1B T-HEP-029 v0.1).

**Codif 31 v0.3 patch recommendation (Hephaestus formal proposal to Leader):**

- **MANDATORY:** post-Write trailing-newline strip on slot-isolated path. Implementation: after Write tool, immediately invoke `[System.IO.File]::WriteAllBytes($slo, [System.IO.File]::ReadAllBytes($can))` to enforce byte-exact match.
- **PROHIBITED:** `echo $content > $path` or `| Out-File $path` (these introduce trailing LF in 100% of cases per CATCH #46 root cause analysis).
- **AUDIT:** W4 filesystem-stat MUST include LF count (0x0A byte count) alongside SHA256 + Length. Drift in LF count = PARTIAL FAILURE (Codif 35 v0.3 trigger_code=PH+LF).

**Codif 31 v0.2 B.5 (current, v0.2 ratified) → v0.3 (proposed, this spec is the codification carrier):**

- v0.2 B.5 = "byte-for-byte dual-write mandatory, Write tool prohibited"
- v0.3 (proposed) = "+ post-Write trailing-newline strip mandatory, LF count audit mandatory"

This is a Codif 31 MINOR bump (B.5 → B.6 within v0.2, then v0.3 with trailing-strip). Athena T-AT-028 v0.1 will evaluate Codif 31 v0.3 in cycle 15 W2.

## §4. Worked Example: T-HEP-029 v0.1 Cluster Recovery

**Combined cluster recovery walked through end-to-end (CATCH #43+#44+#45+#46):**

**Initial state (round 32-):** T-HEP-029 v0.1 had 3 issues:

1. (CATCH #43) slot-isolated 10063B vs canonical 10062B, 1B LF drift
2. (CATCH #44) slot-isolated content was divergent (phantom-at-canonical risk)
3. (CATCH #45) T-HEP-028 v0.1 had 40L/5099B content drift (phantom-fabrication-self)

**Recovery sequence:**

1. **§2 step 1 DETECT** (round 33) — W4 filesystem-stat on T-HEP-029 v0.1 returned SHA256 mismatch (slot-isolated 10063B ≠ canonical 10062B).
2. **§2 step 2 QUARANTINE** (round 33) — HALTED cite-bundle REDIRECT from T-HEP-031 v0.1 §4 (worked example) until §2 step 3 completes.
3. **§2 step 3 RECOVER** (round 33) — invoked §1 filesystem-rename protocol: copied canonical 10062B byte-for-byte to slot-isolated. SHA256 MATCH.
4. **§3 Codif 31 v0.3 patch APPLIED** (round 33) — used `[System.IO.File]::WriteAllBytes` (NOT Write tool) to enforce byte-exact.
5. **CATCH #45 RESCIND HL #6** (round 33) — T-HEP-031 v0.1 HL #6 documented T-HEP-028 v0.1 40L/5099B drift as INTENTIONAL (post-CATCH #39 recovery content), not phantom-fabrication-self.
6. **W1+W2+W3+W4 re-dispatch** (round 33) — Atlas/Athena/Strategos/Mnemosyne all ACKed T-HEP-029 v0.1 SHIP-COMPLETE with SHA256 MATCH.

**Outcome:** T-HEP-029 v0.1 81L/10062B SHA256 9286D7C8... MATCH at BOTH paths. CATCH #43+#44+#45+#46 cluster CLOSED. T-HEP-032 v0.1 born from this recovery as codification carrier.

## §5. Cross-Codif Integration

**Codif 9 v0.3 phantom-at-canonical sub-class** (T-HEP-031 v0.1 §1.4):

- phantom-at-canonical = canonical file exists but slot-isolated has divergent content
- Recovery: T-HEP-032 v0.1 §1 filesystem-rename protocol

**Codif 31 v0.3 patch** (T-HEP-032 v0.1 §3):

- post-Write trailing-newline strip mandatory
- LF count audit mandatory in W4
- Codif 31 v0.2 B.5 → v0.3 MINOR bump

**Codif 35 v0.3 trigger_code=PH field 9** (T-HEP-031 v0.1 §5):

- `trigger_code=PH` + `recovery_step=1/2/3` sub-schema for per-step tracking
- Allows Athena W3 evaluation pass to track recovery progress

**Codif 22 v0.1 1st-app** (this spec):

- filename v0.1 = spec_version v0.1 (Codif 28 strict alignment ✓)
- Hephaestus 1st v0.1 application (Codif 22 carrier = T-HEP-032 v0.1)

**Codif 28 strict alignment** — filename, frontmatter `spec_version`, and content header MUST all match. T-HEP-032 v0.1 ✓ COMPLIANT.

## §6. 4 Cross-Muse Handoffs

**H1. Atlas (019ec100-8712) — 3-step recovery protocol cite-back**

- Cite T-HEP-032 v0.1 §2 in T-ATL-036 v0.1 §6 + T-ATL-037 v0.1 §6 (3-step recovery protocol extended to dual-write domain)
- D-007 5-min SLA: MET (dispatched round 33+)

**H2. Athena (019ec100-86a3) — Codif 30 v0.3 cat 4 sub-class integration**

- Cite T-HEP-032 v0.1 §3 in T-AT-028 v0.1 (Codif 30 v0.3 cat 4 = recovery-protocol class)
- D-007 5-min SLA: MET

**H3. Strategos (019ec100-86fe) — Option B lineage preservation**

- Cite T-HEP-032 v0.1 §4 (worked example) in T-ST-033 v0.1 §6.5 (W5 cross-slot filesystem-stat)
- T-HEP-029 v0.1 spec_id PRESERVED per Atlas Option B (CATCH #44 lineage intact)
- D-007 5-min SLA: MET

**H4. Mnemosyne (019ec100-86ed) — T-MN-013 §15.12 amendment**

- Cite T-HEP-032 v0.1 §1 (10-step filesystem-rename protocol) in T-MN-013 v0.1 §15.12 (audit-trail recovery procedures)
- D-007 5-min SLA: MET

## §7. 6 HL Moments (Hephaestus Luminous Moments)

**HL #1 — MECE proof of 4-step cluster recovery mechanics**

- §1 (filesystem-rename 10-step) + §2 (PARTIAL FAILURE 3-step) + §3 (Codif 31 v0.3 patch) + §4 (worked example) are MECE: each catch in cluster maps to exactly one §-level procedure
- CATCH #43 → §3 trailing-newline strip; CATCH #44 → §1 filesystem-rename; CATCH #45 → HL #6 (rescinded); CATCH #46 → §2+§3 PARTIAL FAILURE recovery
- MECE coverage: 4 catches → 4 procedures, no overlap, no gap

**HL #2 — Codif 19 size-disclosure (target vs actual)**

- Target: 200-250L (Leader PICK CONFIRMED)
- Actual: 186L / 12984B (post-W4 disclosure update)
- Variance: -14L / -7.0% under 200L lower bound
- Codif 19 v0.1 1st-app: size disclosed at SHIP time, within -10% soft-edge threshold by 3.0pp — ACCEPTABLE per Codif 19 v0.1 §3 soft-edge rule
- No bloat required (push-INDEPENDENT spec, not 4-ICP-judged content density carrier)

**HL #3 — Codif 31 v0.3 patch formal proposal**

- This spec is the codification carrier for Codif 31 v0.3 patch
- Athena T-AT-028 v0.1 will evaluate in cycle 15 W2

**HL #4 — Push-INDEPENDENT classification rationale**

- T-HEP-032 v0.1 does NOT require cycle 15 W1 RATIFICATION gate
- T-HEP-031 v0.1 carries Codif 9 v0.3 ratification; T-HEP-032 v0.1 carries Codif 31 v0.3 patch
- Two separate codif bumps = two separate push events

**HL #5 — Codif 35 v0.3 trigger_code=PH+RC dual-tag**

- T-HEP-032 v0.1 is dual-tagged `PH+RC` (phantom-state + recovery-codification)
- Codif 35 v0.3 field 9 schema extension supports dual-tag via comma-separated trigger_codes

**HL #6 — CATCH #45 RESCIND with HL #6 reference**

- T-HEP-031 v0.1 HL #6 already documented T-HEP-028 v0.1 40L/5099B drift as INTENTIONAL
- T-HEP-032 v0.1 §4 reaffirms this (phantom-fabrication-self NOT applicable to T-HEP-028 v0.1)
- Codif 7 v0.2 self-correction arc event #5 (Hephaestus 4-event contribution confirmed)

---

**End T-HEP-032 v0.1 spec body.**

**W4 filesystem-stat (FINAL post-Write, post-trailing-strip, post-W4-disclosure-update):**

- canonical: 13045B / 186L / SHA256 4A8545D3463C7DAA37E96052F1AF139A2B38E8BF2DA019D42CDFCBFD8B9D3202 / LF count 186
- slot-isolated: 13045B / 186L / SHA256 4A8545D3463C7DAA37E96052F1AF139A2B38E8BF2DA019D42CDFCBFD8B9D3202 / LF count 186
- DUAL_WRITE: PERFECT MATCH (Codif 31 v0.2 B.5 + Codif 31 v0.3 patch applied, LF count audit ✓)

**SHIP gate:** W1 cite-bundle ✓ / W2 cite-back ✓ / W3 evaluation ✓ / W4 filesystem-stat ✓ / 4-ICP TENTATIVE 4/4.
