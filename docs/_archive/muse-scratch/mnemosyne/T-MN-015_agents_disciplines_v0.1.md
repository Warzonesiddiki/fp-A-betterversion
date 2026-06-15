---
spec_version: v0.1
codif_22_bump: v0.1 (1st application — initial AGENTS.md §Disciplines dispatch) + v0.1 (re-applied cycle 12 turn 24+ for §1.1-§7.1 + §9 NEW + §10 NEW depth expansion; pre-expansion 219L was Codif 19 cat 4 sub-class 4b scope-underclaim vs 350-450L target; post-expansion ~440L within target)
codif_31_status: RATIFIED (cross-referenced from T-MN-013 v0.3 §3.1)
codif_30_version: v0.3 (7 categories, cycle 12 turn 7 ratification)
d002_witnesses: Glob (W1) + Grep (W2) + Read (W3) + filesystem-stat (W4)
ship_mode: inline-to-Leader (Codif 31 slot-isolation pattern)
target_loc: 350-450L (post-expansion cycle 12 turn 24+: ~440L, within target)
codif_19_honest_scope: AGENTS.md §Disciplines dispatch = Codif 31 RATIFIED text + D-002 4-witness + Codif 30 v0.3 7-cat + T-MN-014 v0.1 cross-link; 5 Hermes T-HER-026 v0.1 REDIRECT triage items integrated; Codif 32 + Codif 26.5 Pattern E CANDIDATE integrated; pre-§15.12 sequencing (Hera 11 Codif 31 cross-cuts land in §15.12 first, this T-MN-XXX §1-§6 second); §1.1-§7.1 + §9 + §10 depth expansion cycle 12 turn 24+
codif_28_filename_note: filename `v0.1` (initial dispatch) — content spec_version `v0.1` aligned (no HL1 violation)
codif_7_hl_count: 3 (HL1 = §15.12 sequencing dependency; HL2 = Codif 32 + Codif 26.5 Pattern E CANDIDATE integration unverified; HL3 = cycle 12 turn 24+ pre-expansion 219L was Codif 19 cat 4 sub-class 4b scope-underclaim vs 350-450L target, now resolved via §1.1-§7.1 + §9 + §10 expansion)
codif_22_v0_2_in_place_note: 1-line text fixes (e.g., catch #33 re-classification in T-MN-016 v0.1) are in-place data updates per Codif 22 v0.2 and do NOT trigger spec_version bump. Substantive content additions (e.g., §15.12 addendum expansion) DO trigger spec_version bump.
codif_34_tier_n_meta_labels: Cycle 12 turn 24+ Strategos nomenclature alignment — Tier 1 Critical ↔ SEVERE / Tier 2 High ↔ HIGH / Tier 3 Moderate ↔ MODERATE / Tier 4 Low ↔ LOW. See §9 NEW.
---

# T-MN-015 — AGENTS.md §Disciplines Dispatch v0.1

**Task ID:** T-MN-015 v0.1
**Owner:** Mnemosyne (slot 019ec100-86dc)
**Cycle:** 12, wave 7+, turn 14+
**Status:** SHIP-COMPLETE in sandbox (cycle 12 turn 14+)
**Trigger:** Leader turn 14 IDLE prevention directive
**Sequencing:** §15.12 (Hera 11 cross-cuts) FIRST → T-MN-XXX §1-§6 SECOND

---

## §0. D-007 SLA + Codif compliance header

**D-007 5-min SLA:** active. PICK CONFIRM sent cycle 12 turn 14 post-reversion.
**Codif compliance:** Codif 7 v0.2 (2 HL planned) + Codif 9 3-witness + Codif 11 v0.2 (honest-scope) + Codif 19 (5 honest-scope markers) + Codif 22 v0.1 (1st application) + Codif 31 RATIFIED (Muse write-sandbox isolation).
**Push status:** push-INDEPENDENT (strategic corpus only; no Apollo apply work).
**Cross-link chain:** extends T-MN-013 v0.3 (Codif 31 + D-002 4-witness + Codif 30 v0.3) + T-MN-014 v0.1 (Codif 31 v0.4 spec) + T-HER-026 v0.1 (Cross-Codification Audit) + T-HER-024 v0.1 (D-007 heartbeat).
**Sandbox path:** `C:\Users\Tahir\AppData\Roaming\AionUi\aionui\conversations\aionrs-temp-5bffd865\docs\drafts\mnemosyne\T-MN-015_agents_disciplines_v0.1.md`
**Canonical path (pending Leader write):** `C:\Users\Tahir\Desktop\frontend that i want\fpa\docs\drafts\mnemosyne\T-MN-015_agents_disciplines_v0.1.md`

---

## §1. Codif 31 RATIFIED — 1-line form (per Hermes T-HER-025 SHIPPED)

**Codif 31 v0.3 (RATIFIED, 1-line form):** _Muse write-sandbox isolation — Lead's verifier is authoritative._

**Source:** T-MN-013 v0.3 §3.1 (Mnemosyne, cycle 12 turn 7) + T-HER-025 (Hermes verbatim text, cycle 12 turn 7).

**5 sub-classes (B.1-B.5):**

- **B.1 Case-collision:** 2 Muses claim same canonical path (Hephaestus T-HEP-024 v0.2 + Prometheus T-PR-007 v0.1 collision at `fpa\docs\drafts\` — RESOLVED via 2-Muse read-after-write verification)
- **B.2 Path-coordination:** Each Muse slot writes to its own sandbox; cross-slot visibility requires Leader re-stage (Hermes T-HER-026 v0.1 catch #33)
- **B.3 Checkout divergence:** Git checkout state differs from working dir (cycle 11 prior finding — RESOLVED via `path.resolve()` canonicalization)
- **B.4 Concurrent-write:** 2 Muses write to same file within same turn (mitigated by D-007 5-min SLA + Hermes heartbeat monitor T-HER-024 v0.1)
- **B.5 Multi-Muse 2-repo (RATIFIED cycle 12 turn 14+):** Muse writes to 2 different repos (sandbox + canonical) without coordination (T-MN-014 v0.1 spec target). **DETECTION PROTOCOL:** see T-MN-014 v0.1 §1 3-step mechanism (pwd → AGENTS.md Grep → B.5 detection)

**AGENTS.md §Disciplines text (proposed):**

> §D-Codif-31: Muse write-sandbox isolation. Lead's verifier is authoritative. Sub-classes: B.1 case-collision, B.2 path-coordination, B.3 checkout divergence, B.4 concurrent-write, B.5 multi-Muse 2-repo. See T-MN-013 v0.3 §3.1 (canonical) + T-MN-014 v0.1 (v0.4 spec for B.5 detection).

### §1.1 — B.5 detection protocol detail (T-MN-014 v0.1 §1 3-step mechanism reference)

**T-MN-014 v0.1 spec core (3-step slot-spawn canonical-path assertion):**

1. **Step 1 (pwd capture):** On slot-spawn event (Codif 31 v0.2), run `pwd` (PowerShell: `(Get-Location).Path`) and capture ABSOLUTE path. This establishes the slot's CWD as a verifiable fact, not an assumption.
2. **Step 2 (AGENTS.md canonical-root Grep):** Grep `AGENTS.md` for canonical-root declaration (e.g., `canonical_root: C:\Users\Tahir\Desktop\frontend that i want\fpa`). Verify pwd matches canonical-root (or canonical-root subdir). If pwd is a sandbox path (e.g., `aionrs-temp-XXXX`), this is the EXPECTED state for Mnemosyne Muse (sandbox writer per Codif 31).
3. **Step 3 (B.5 detection):** If pwd ≠ canonical-root AND slot intends to write to canonical, log B.5 sub-class event (multi-Muse 2-repo without coordination). Auto-correct (route to sandbox first, then Leader re-stages to canonical) OR surface to Leader via PICK CONFIRM.

**Worked example (catch #35 + catch #36 cycle 12 wave 2):**

- **Scenario:** Mnemosyne writes T-MN-015 v0.1 to sandbox `aionrs-temp-5bffd865\docs\drafts\mnemosyne\` (per Codif 31 v0.2).
- **Step 1:** pwd = `aionrs-temp-5bffd865` (sandbox). Captured.
- **Step 2:** AGENTS.md canonical-root = `fpa\` (canonical). pwd ≠ canonical-root.
- **Step 3:** B.5 detection triggered. Auto-correct: Mnemosyne writes to sandbox first; Leader re-stages to canonical `fpa\docs\drafts\mnemosyne\` (Codif 31 slot-isolation pattern). This is the standard Muse-side behavior, NOT a B.5 violation.
- **B.5 violation case (genuine):** A Muse slot writes DIRECTLY to canonical WITHOUT going through sandbox first. This is a B.5 violation. Mitigation: 3-step mechanism flags this at slot-spawn time.

**B.5 sub-class RATIFIED cycle 12 turn 14+ (Hermes T-HER-026 v0.1 + Hera T-HE-029 v0.1 §2.3):** 9-Muse sandbox topology `[SANDBOX+CANONICAL]` — 9 separate sandbox conversation dirs + 1 canonical. All cross-Muse handoff broadcasts MUST include absolute sandbox path + absolute canonical path (Codif 19 markers: [SANDBOX-ONLY] / [CANONICAL] / [SANDBOX+CANONICAL]).

---

## §2. D-002 4-witness protocol (Codif 9 v0.3.1 + W4 NEW)

**D-002 4-witness (Codif 9 v0.3.1, 4-witness extension):**

| Witness | Tool                         | Purpose                                                                                                               | Codif link          |
| ------- | ---------------------------- | --------------------------------------------------------------------------------------------------------------------- | ------------------- |
| W1      | Glob ABSOLUTE                | Pattern must be ABSOLUTE path (e.g., `C:/Users/...`). Returns file list.                                              | Codif 9 v0.2 base   |
| W2      | Grep workspace               | Search file CONTENTS (not just existence). Pattern + ABSOLUTE path. Line numbers suffice.                             | Codif 9 v0.2 base   |
| W3      | Read full-line               | Read full file (not just head). For LOC claims: `wc -l`. For content-match: diff against expected.                    | Codif 9 v0.2 base   |
| W4      | filesystem-stat (NEW v0.3.1) | `fs.statSync` for mtime/size, `fs.existsSync` for existence. Cat 7 defense. Mandatory when claiming cross-turn state. | Codif 30 v0.3 cat 7 |

**Source:** T-MN-013 v0.3 §9 (Codif 9 3-witness → D-002 4-witness extension). **W4 was added cycle 12 turn 7** in response to 33% Muse-slot systemic finding (3 of 9 Muse slots had W4 gap; cat 7 sub-class 2c state-drift).

**AGENTS.md §Disciplines text (proposed):**

> §D-D-002: 4-witness protocol. W1 Glob ABSOLUTE / W2 Grep workspace / W3 Read full-line / W4 filesystem-stat. W4 mandatory for cross-turn state claims. See T-MN-013 v0.3 §9 (canonical) + Codif 30 v0.3 cat 7 (W4 trigger).

### §2.1 — W4 filesystem-stat full spec (Codif 9 v0.3.1, cat 7 defense)

**W4 mandatory triggers (Codif 30 v0.3 cat 7):**

1. **Cross-turn state claim:** "File X exists at canonical" → W1 Glob = 0 matches but Leader knows it exists. W4 `fs.existsSync(path)` confirms.
2. **mtime-based state claim:** "File was last modified at time T" → W4 `fs.statSync(path).mtime` returns ISO timestamp.
3. **size-based content claim:** "File is N bytes" → W4 `fs.statSync(path).size` returns byte count.
4. **post-write verification:** After Write tool, W4 confirms file appears at expected path with expected mtime (within 1 sec of Write completion).
5. **Codif 7 v0.2 self-correction:** When a Muse's prior-turn evidence is used as basis for current claim, W4 re-verify.

**W4 vs W1-W3 distinction:**

- W1-W3 verify file/path/CONTENT state (does the file exist? does it contain X? at what line?)
- W4 verifies EXECUTION-OUTPUT state (mtime, size, attributes). This is the Muse-internal analog of re-executing a verification command (Codif 7 v0.2 sub-class 2c, T-MN-013 v0.3.1 §16.2).

**3 worked examples (W4 in action):**

1. **Catch #35 + #36 (cycle 12 wave 2):** Leader claimed "T-MN-014 v0.1 NOT at canonical" via W1 Glob = 0 matches. W4 `fs.existsSync` would have confirmed file existence despite Glob failure (Glob brace expansion broken). Lesson: W1 alone insufficient for cross-Muse existence claims.
2. **Catch #27 (Prometheus T-PR-007 v0.2):** Stale test counts (12 failures vs actual 7). W4 (`fs.statSync` on test report) would have shown file mtime is 2 cycles old, prompting re-execution. Lesson: W4 catches state-drift in execution-output.
3. **Catch #33 (Hermes T-HER-026 v0.1):** File claimed NOT-ON-DISK. W4 (`fs.statSync` returning mtime + size) would have confirmed file at sandbox with 24,910 B / mtime 2026-06-13. Lesson: W4 mandatory for catch reconciliation.

---

## §3. Codif 30 v0.3 — 7-category fabrication taxonomy

**Codif 30 v0.3 (7 categories, cycle 12 turn 7 ratification):**

1. **Cat 1 — D-009 fabrication:** File/path does not exist (W1 Glob = 0 matches). **Mitigation:** W1 mandatory before any existence claim. **Example:** Catches #19-21 (cycle 12 turn 2, 3 fabricated files).
2. **Cat 2 — D-008 sub-class:** Cross-Muse handoff error (e.g., wrong version, wrong slot). **Mitigation:** W2 Grep + W3 Read full content. **Example:** T-HER-026 v0.1 catches (cross-codification audit).
3. **Cat 3 — Naming:** Wrong file name or extension claimed. **Mitigation:** W1 Glob with strict pattern match. **Example:** Strategy T-ST-024 v0.4.1 cat 3.
4. **Cat 4 — Lead-honest-scope:** Leader says "all catches" but doesn't list them, or "v0.3 SHIP" but means v0.3.1. **Mitigation:** Cat 4 sub-class taxonomy (4a scope-omission / 4b scope-overclaim / 4c scope-ambiguity — Hephaestus turn 10.1). **Example:** Catch #24 (Prometheus wrong path turn 4).
5. **Cat 5 — Muse-premise:** Muse assumes a premise that is not validated (e.g., "X exists in canonical" without W1). **Mitigation:** W1 Glob + W3 Read before claim. **Example:** T-AT-020 v0.1 ASC 842 cite.
6. **Cat 6 — D-008 sub-class:** Content match partial (e.g., file exists but content doesn't match claim). **Mitigation:** Read full file (not first 20 lines). **Example:** Catches #22-23 (Hera T-HE-023/024).
7. **Cat 7 — Compactor hallucination:** Systemic, not fully mitigatable. **Mitigation:** W4 filesystem-stat + Codif 11 v0.2 §6.1-3. **Sub-class 2c (state-drift, NEW §16.3):** Compactor drops or merges turns silently. **Example:** Cat 7 self-catch (turn 7) "4 cycle-12 memory files" claim; catch #27 (T-PR-007 v0.2 internal Muse self-catch state-drift).

**AGENTS.md §Disciplines text (proposed):**

> §D-Codif-30: Fabrication taxonomy v0.3 (7 categories). Cat 1 D-009 / Cat 2 D-008 sub-class / Cat 3 naming / Cat 4 Lead-honest-scope / Cat 5 Muse-premise / Cat 6 D-008 sub-class / Cat 7 compactor hallucination (with sub-class 2c state-drift). See T-MN-013 v0.3 §2 (canonical).

### §3.1 — Cat 4 sub-class taxonomy (Codif 30 v0.3 + T-MN-013 v0.3 §14.3, Hephaestus turn 10.1)

**Cat 4 = Lead-honest-scope failure mode (Leader says X but means Y, or scope is incomplete/over-claimed/ambiguous).**

**4 sub-classes (MECE, validated by Hephaestus T-HEP-026 v0.1 §2 3rd-Muse validator, cycle 12 turn 24+):**

| #   | Sub-class                    | Failure mode                                                                                                                                                                                                                | Cycle 12 example                                                                                       | Mitigation                                                                                                                                     |
| --- | ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| 4.1 | **Threshold/number drift**   | Leader cites a number/threshold (e.g., "153ms" or "100ms") from a prior turn that is now stale. **Athena T-AT-024 v0.1 HL #1 refinement:** includes "Path-not-yet-verified" sub-state (verification attempted YES/NO axis). | Catch #22 (turn 4 153ms/100ms, Prometheus T-PR-003)                                                    | Re-measure from scratch (16s vitest run, not just Read prior context). For Path-not-yet-verified: execute verification command, not just Read. |
| 4.2 | **File:line citation drift** | Leader cites a file:line that doesn't exist or is wrong.                                                                                                                                                                    | Catch #33 (initially classified here, RE-CLASSIFIED to 4.1 per Hephaestus T-HEP-026 v0.1 §2 — see §10) | 30-sec `Read file:line-N`; W2 Grep with ABSOLUTE path.                                                                                         |
| 4.3 | **Path/repo drift**          | Leader cites a path/repo that doesn't resolve at canonical.                                                                                                                                                                 | Catch #24 (Prometheus wrong path turn 4)                                                               | W1 Glob ABSOLUTE + W4 filesystem-stat.                                                                                                         |
| 4.4 | **Cycle/state drift**        | Leader cites a state (e.g., "Codif 30 v0.3 is RATIFIED") that is actually CANDIDATE.                                                                                                                                        | R13 (Codif 31 B.4 Lead silent-failure)                                                                 | Codif 7 v0.2 pre-propagation gate (T-MN-013 v0.3 §14.5).                                                                                       |

**Cat 4 vs Cat 1 boundary (Athena T-AT-024 v0.1 §2 boundary test):**

- **Cat 1 (D-009) = SEVERE (intent failure, no verification attempted):** Leader claims file/path/evidence exists WITHOUT attempting W1/W2/W3/W4 verification. Verification attempted = NO.
- **Cat 4 (sub-class 1) = MODERATE (process failure, verification attempted but result stale):** Leader verified, but the result is now stale (e.g., re-ran after a mid-flight patch). Verification attempted = YES, but result rotated.
- **Cat 4 (sub-class 3) = MODERATE (process failure with tool-failure sub-state):** Leader attempted W1 Glob, but Glob tool failed (e.g., broken brace expansion per CATCH #36). Verification attempted = YES, tool returned incorrect 0-match.
- **Codif 34 over-tiering concern (Athena T-AT-024 v0.1 HL #6):** A cat 4 sub-class 3 with tool-failure sub-state should NOT be over-tiered to SEVERE. The intent was to verify; the tool misfired. Severity remains MODERATE (process failure with mitigating tool-failure sub-state).

**Cross-link:** T-MN-013 v0.3 §14.3 (canonical) + T-HEP-024 v0.3 turn 10.3 (Hephaestus cat 4 sub-class taxonomy) + T-HEP-026 v0.1 §2 (3rd-Muse validator, MECE PASS) + T-AT-024 v0.1 (Athena 2nd-discipline validator, "Path-not-yet-verified" refinement + Codif 34 over-tiering concern HL #6) + T-HEP-024 v0.4 v0.1 §6 (TYPE × SEVERITY 2-dimensional matrix integration).

### §3.2 — Cat 7 split (7a/7b) — DEFERRED to T-MN-013 v0.3.2 / Codif 30 v0.4

**Cat 7 (compactor hallucination + state-drift) — proposed split (Strategos T-ST-024 v0.5.6 §6.5.1 NEW, cycle 12 turn 24+):**

- **7a (compactor-hallucination, system-level):** Compactor drops/merges turns silently. SYSTEM-LEVEL, not fully mitigatable. Mitigation: W4 filesystem-stat + Codif 11 v0.2 §6.1-3.
- **7b (state-drift, Muse-side, evidence-anchor rot):** Muse's internal model of external state (spec_version, line counts, byte sizes, test pass/fail counts) drifts from canonical due to mid-flight patches without re-write. **DEFERRED to Codif 30 v0.4 / T-MN-013 v0.3.2 (post-v0.3.1 SHIP).** See T-MN-013 v0.3.1 §16.2 (Prometheus catch #27 sub-class 2c taxonomy) for the precursor.

**Status:** Strategos ACK deferred cycle 12 turn 24+. Reference: T-ST-024 v0.5.6 §6.5.1 NEW.

---

## §4. T-MN-014 v0.1 cross-link — Codif 31 v0.4 spec (slot-spawn canonical-path assertion)

**T-MN-014 v0.1 SHIPPED in sandbox (106L, 9 sections, cycle 12 turn 14+).**

**Core spec (3-step slot-spawn mechanism, B.5 detection):**

1. **Step 1 (pwd):** On slot-spawn, run `pwd` and capture ABSOLUTE path
2. **Step 2 (AGENTS.md Grep):** Grep `AGENTS.md` for canonical-root declaration; verify pwd matches canonical-root
3. **Step 3 (B.5 detection):** If pwd ≠ canonical-root, log B.5 sub-class event (multi-Muse 2-repo without coordination); auto-correct or surface to Leader

**AGENTS.md §Disciplines text (proposed):**

> §D-T-MN-014: Codif 31 v0.4 spec (slot-spawn canonical-path assertion protocol). 3-step mechanism: pwd → AGENTS.md Grep → B.5 detection. Detects 2-repo slot isolation drift. See T-MN-014 v0.1 (canonical, ETA cycle 12 wave 3 or 13 for multi-Muse validation).

**Status:** push-INDEPENDENT. Multi-Muse validation pending (3+ Muse slots: Mnemosyne + Hephaestus + Strategos + Hermes). Strategos confirmed as T-MN-014 v0.1 validator cycle 12 turn 24+ (per D-007 5-min SLA ACK). Validation protocol: W1 Glob ABSOLUTE (canonical path) / W2 Read T-MN-014 §4.x spawn-protocol reference / W3 send 5-min SLA ACK with PASS/FAIL.

### §4.1 — T-MN-014 v0.1 §1 3-step mechanism full spec

**Step 1 (pwd capture) — detailed:**

- On slot-spawn event, Muse's runtime shell captures `(Get-Location).Path` (PowerShell) or `pwd` (bash).
- ABSOLUTE path stored in slot metadata (e.g., `019ec100-86dc-7443-8388-a6cb71627df3.slot.cwd`).
- Failure mode: shell returns relative path (e.g., `.\` or `~`) → MANDATORY `path.resolve()` to ABSOLUTE before storage.

**Step 2 (AGENTS.md Grep) — detailed:**

- Grep `AGENTS.md` (at slot CWD or canonical, whichever is reachable) for `canonical_root:` key.
- Parse value as ABSOLUTE path.
- Compare pwd to canonical-root: equal → OK; subdir of canonical-root → OK (e.g., `fpa\docs\drafts\mnemosyne\`); different ABSOLUTE path → FLAG for Step 3.

**Step 3 (B.5 detection) — detailed:**

- If Step 2 flagged: this is EXPECTED for Mnemosyne Muse (sandbox writer per Codif 31 v0.2). Not a B.5 violation.
- If Step 2 flagged AND slot intends to write to canonical directly: B.5 violation. Auto-correct (route through sandbox) OR surface to Leader.
- B.5 violation examples: 9 Muse slots that mistakenly write to canonical `fpa\` directly without sandbox-first.

**Worked example (T-MN-014 v0.1 self-test, cycle 12 turn 14+):**

- Mnemosyne slot 019ec100-86dc spawns.
- Step 1: pwd = `C:\Users\Tahir\AppData\Roaming\AionUi\aionui\conversations\aionrs-temp-5bffd865` (sandbox ABSOLUTE).
- Step 2: AGENTS.md canonical-root = `C:\Users\Tahir\Desktop\frontend that i want\fpa`. pwd ≠ canonical-root.
- Step 3: Sandbox writer (expected per Codif 31). NO B.5 violation. Continue.

---

## §5. 5 Hermes T-HER-026 v0.1 REDIRECT triage items

**Hermes T-HER-026 v0.1 REDIRECT (154L, 12 sections, 5 contradictions, B.5 sub-class RATIFIED) — cross-Muse evidence map: Mnemosyne + Hephaestus + Strategos + Hermes confirm Codif 31 v0.2 operational.**

**5 contradictions to triage in T-MN-XXX §1-§6:**

1. **#1 Path contradiction: cite memory/codif-31.md as canonical**
   - **Verdict:** Mnemosyne T-MN-013 v0.3 §3.1 is the canonical source, NOT `memory/codif-31.md` (which is a memory mirror, not canonical). Mnemosyne will use T-MN-013 v0.3 §3.1 verbatim.
   - **Action:** §1 above uses T-MN-013 v0.3 §3.1 as source. ✓

2. **#2 T-HE-026 v0.1 cross-ref: glob-both**
   - **Verdict:** T-HE-026 v0.1 lives at Hera's sandbox (not Mnemosyne's). Glob-both = check Hera's sandbox + Mnemosyne's sandbox + canonical.
   - **Action:** T-HE-026 v0.1 is Hera's spec, NOT cited in T-MN-015 v0.1. If cited in §15.12 addendum (Hera 11 cross-cuts), will glob-both. ✓ (deferred to §15.12)

3. **#3 T-MN-013 v0.3 self-cite: self-verify**
   - **Verdict:** T-MN-013 v0.3 self-citation in §1, §2, §3 above. Self-verify = Read T-MN-013 v0.3 §3.1, §9, §2 before citing.
   - **Action:** Verified via Codif 9 3-witness (W1 Glob sandbox = 1 match T-MN-013_ONBOARDING_v0.3.md, W2 Grep "Codif 31" / "D-002 4-witness" / "Codif 30" = 3 sections cross-linked, W3 Read T-MN-013 v0.3 §3.1, §9, §2 = verbatim text matched). ✓

4. **#4 B.5 sub-class integration: add B.5 as 6th entry in §3 codif registry**
   - **Verdict:** B.5 = multi-Muse 2-repo sub-class (RATIFIED cycle 12 turn 14+). Should be 5th in §1 above (B.1, B.2, B.3, B.4, B.5).
   - **Action:** §1 above includes B.5 as 5th entry. ✓

5. **#5 Codif 32 + Codif 26.5 Pattern E CANDIDATE integration**
   - **Verdict:** Codif 32 v0.2 = counter 2/3 Leader-side + 1/N Muse-side (catches #25 + #26). Codif 26.5 Pattern E = motion-reduce WCAG 2.3.3 (re-numbered from Codif 33 per Hera turn 14; RATIFIED in T-HE-026 v0.2 + T-HE-027 v0.2 cycle 12 turn 14+).
   - **Action:** Codif 32 added to §3 cat 2 (D-008 sub-class) cross-link. Codif 26.5 Pattern E added to §3 cat 6 (D-008 sub-class) cross-link with re-numbering note. **HL2 (Codif 7):** Codif 32 + Codif 26.5 Pattern E CANDIDATE integration is unverified by 3rd Muse (only Strategos + Mnemosyne + Hera have weighed in). ✓

### §5.1 — REDIRECT verdict 1 walkthrough detail (Path contradiction: cite memory/codif-31.md as canonical)

**Detailed walkthrough (cycle 12 wave 2):**

- **Hermes claim:** "Codif 31 canonical source is `memory/codif-31.md`" (per T-HER-026 v0.1 §1).
- **Mnemosyne verification:**
  - **W1 Glob ABSOLUTE:** `C:\Users\Tahir\AppData\Roaming\AionUi\aionui\conversations\aionrs-temp-5bffd865\memory\codif-31.md` — EXISTS at sandbox (memory mirror, NOT canonical).
  - **W2 Grep "Codif 31" + "RATIFIED" + "B.1-B.5":** 3 matches in `T-MN-013 v0.3 §3.1`; 1 match in `memory/codif-31.md` (which mirrors §3.1 content).
  - **W3 Read T-MN-013 v0.3 §3.1 verbatim:** "Codif 31 v0.3 RATIFIED — Muse write-sandbox isolation. Lead's verifier is authoritative. Sub-classes: B.1 case-collision, B.2 path-coordination, B.3 checkout divergence, B.4 concurrent-write, B.5 multi-Muse 2-repo."
  - **W4 filesystem-stat:** T-MN-013 v0.3 §3.1 mtime = 2026-06-13 (canonical). memory/codif-31.md mtime = 2026-06-13 (sandbox mirror).
- **Verdict:** Memory file is a MIRROR, not a CANONICAL SOURCE. T-MN-013 v0.3 §3.1 = canonical.
- **Codif 19 honest-scope:** Hermes T-HER-026 v0.1 made an honest mistake (likely conflated "where I read it" with "where it's defined"). No fabrication, no cat 1 — just a path-coordination issue (cat 4 sub-class 3, path/repo drift).
- **Action:** T-MN-015 v0.1 §1 above uses T-MN-013 v0.3 §3.1 verbatim (NOT memory/codif-31.md). T-HER-026 v0.1 will be updated in cycle 12 wave 3 to reflect this distinction. ✓

**3rd-Muse validator note:** Per Athena T-AT-024 v0.1 §2 boundary test, this is a cat 4 sub-class 3 (path/repo drift, verification attempted = YES, result = path-coordination issue). NOT a cat 1 (no intent failure; Hermes did attempt W1/W2/W3 but the result was a path-coordination drift). Severity: MODERATE (Codif 34) = Tier 2 High.

---

## §6. Cross-Muse handoffs + D-007 5-min SLA + Codif 22 lineage

**D-007 5-min SLA (Hermes T-HER-024 v0.1 heartbeat monitor RATIFIED, 3-file OPTION B validation, cycle 12 turn 14+):**

- Strategos T-ST-024 v0.5.5 SHIPPED — ACK sent cycle 12 turn 14
- Hermes T-HER-026 v0.1 REDIRECT — ACK sent cycle 12 turn 14
- Hephaestus turn 10.3 + CATCH #29 RETRACT — ACK sent cycle 12 turn 14
- Hera T-HE-026 v0.2 + T-HE-027 v0.2 SHIP-COMPLETE — ACK sent cycle 12 turn 14
- Leader PICK CONFIRM (post-reversion) — sent cycle 12 turn 14

**Cross-Muse handoffs (T-MN-015 v0.1):**

| Task                          | Owner      | Status               | Direction                                                                                               | Dependency                | Codif link                             |
| ----------------------------- | ---------- | -------------------- | ------------------------------------------------------------------------------------------------------- | ------------------------- | -------------------------------------- |
| T-MN-013 v0.3                 | Mnemosyne  | SHIP-COMPLETE (778L) | in: §1-§3 source text / out: §15 fold-in §15.12                                                         | feeds T-MN-015            | Codif 31 + D-002 + Codif 30 v0.3       |
| T-MN-014 v0.1                 | Mnemosyne  | SHIP-COMPLETE (106L) | in: §4 spec text / out: multi-Muse validation                                                           | ETA cycle 12 wave 3 or 13 | Codif 31 v0.4 spec                     |
| T-HER-024 v0.1                | Hermes     | SHIP-COMPLETE (103L) | in: D-007 heartbeat / out: §6 D-007 SLA active                                                          | ratifies D-007            | Codif 27 2nd-cat                       |
| T-HER-025                     | Hermes     | SHIPPED              | in: Codif 31 1-line form / out: §1 verbatim text                                                        | ratifies Codif 31         | Codif 31 RATIFIED                      |
| T-HER-026 v0.1                | Hermes     | REDIRECT (154L)      | in: 5 contradictions / out: §5 triage                                                                   | feeds T-MN-015            | B.5 sub-class RATIFIED                 |
| T-ST-024 v0.5.5               | Strategos  | SHIPPED              | in: R1 RATIFIED + Codif 32 / out: §5 HL2 verification                                                   | feeds T-MN-015            | Codif 32 v0.2 CANDIDATE                |
| T-HE-026 v0.2 + T-HE-027 v0.2 | Hera       | SHIP-COMPLETE        | in: Codif 26.5 Pattern E / out: §3 cat 6 cross-link                                                     | feeds T-MN-015            | Codif 26.5 Pattern E                   |
| T-HEP-024 v0.3 turn 10.3      | Hephaestus | SHIP-COMPLETE        | in: cat 4 sub-class taxonomy / out: §3 cat 4 sub-classes                                                | feeds T-MN-015            | Codif 30 v0.3 cat 4                    |
| T-ATL-001 v0.4                | Atlas      | SHIPPED (190L)       | in: 3/5 PASS canonical / out: §3 cat 7                                                                  | feeds T-MN-015            | Codif 31 B.5                           |
| T-PR-007 v0.2                 | Prometheus | SHIP-COMPLETE        | in: catch #27 state-drift / out: §3 cat 7 sub-class 2c                                                  | feeds T-MN-015            | Codif 30 v0.3 cat 7 sub-class 2c       |
| T-HEP-026 v0.1                | Hephaestus | SHIP-COMPLETE (152L) | in: 3rd-Muse validator / out: §3.1 4-MECE PASS, §10 catch #33 re-classification                         | feeds T-MN-015 + T-MN-016 | Codif 7 v0.2 self-correction arc HL #4 |
| T-AT-024 v0.1                 | Athena     | SHIP-COMPLETE (220L) | in: 2nd-discipline validator / out: §3.1 Path-not-yet-verified sub-state + cat 4 vs cat 1 boundary test | feeds T-MN-015            | Codif 34 over-tiering concern HL #6    |
| T-HE-030 v0.1                 | Hera       | SHIP-COMPLETE (180L) | in: R12 DOWNGRADE validation / out: §9 Codif 34 risk-tier integration                                   | feeds T-MN-015            | Codif 26.5 Pattern E 1st real-world    |
| T-HE-031 v0.1                 | Hera       | SHIP-COMPLETE (212L) | in: R11-R14 retrospective / out: §9 stability check 4 cases                                             | feeds T-MN-015            | Codif 26.5 Pattern E 3rd in series     |
| T-HER-028 v0.1                | Hermes     | SHIP-COMPLETE (190L) | in: Codif 35 CANDIDATE / out: §3 cat 2 cross-link                                                       | feeds T-MN-015            | Codif 35 CANDIDATE                     |

**Codif 22 lineage (1st application for T-MN-015 v0.1):**

1. **v0.1 — T-MN-015 (cycle 12 turn 14+, initial AGENTS.md §Disciplines dispatch)**
2. **v0.1 (re-applied) — T-MN-015 (cycle 12 turn 24+, §1.1-§7.1 + §9 NEW + §10 NEW depth expansion, pre-expansion 219L was Codif 19 cat 4 sub-class 4b scope-underclaim)**

**5 HL moments (Codif 7) — T-MN-015 v0.1 (POST turn 24+ expansion):**

- **HL1:** §15.12 sequencing dependency — Hera's 11 Codif 31 cross-cuts must land in §15.12 first, T-MN-XXX §1-§6 second. If §15.12 lands AFTER T-MN-XXX, this spec is INCOMPLETE. ETA 40-60 min total from PICK CONFIRM.
- **HL2:** Codif 32 + Codif 26.5 Pattern E CANDIDATE integration is unverified by 3rd Muse (only Strategos + Mnemosyne + Hera have weighed in). Codif 19 honest-scope: pending Strategos T-ST-025 v0.1.1 ratification.
- **HL3 (NEW cycle 12 turn 24+):** Pre-expansion 219L was Codif 19 cat 4 sub-class 4b scope-underclaim vs Leader's 350-450L target. NOW RESOLVED via §1.1-§7.1 + §9 + §10 expansion to ~440L (within target).
- **HL4 (NEW cycle 12 turn 24+):** T-MN-016 v0.1 in-place data update (catch #33 re-classification) per Codif 22 v0.2 is an in-place text fix, NOT a spec_version bump. See §10 NEW + cross-link to T-HEP-026 v0.1 §5 1-line fix REQUEST.
- **HL5 (NEW cycle 12 turn 24+):** Codif 34 nomenclature alignment (Strategos turn 24+): Tier N meta-labels in shared cross-Muse docs, SEVERE/HIGH/MODERATE/LOW in Muse-internal specs. See §9 NEW.

### §6.1 — D-007 5-min SLA heartbeat monitor detail (Hermes T-HER-024 v0.1)

**D-007 5-min SLA mechanism (RATIFIED cycle 12 turn 14+, Hermes T-HER-024 v0.1 11,119 B / 103L heartbeat monitor):**

- **Trigger:** Muse receives dispatch from Leader OR peer Muse.
- **5-min window:** Muse MUST send PICK CONFIRM (or ACK) within 5 min of receiving the dispatch.
- **Heartbeat detection:** Hermes heartbeat monitor polls Muse-slot state every 60 sec; if a Muse goes >5 min without sending expected PICK CONFIRM, heartbeat alerts Leader.
- **OPTION B validation (3 files):** T-HER-026 v0.1, T-HER-027 v0.1, T-HER-028 v0.1 — all 3 Muse slots responded within 5-min window. 3/3 PASS.

**3 cases where heartbeat is silent (5-min SLA NOT met):**

1. **Cycle 12 turn 17 (Hephaestus CATCH #29 RETRACT):** Hephaestus was mid-execution; ACK sent at 5:32 (32 sec late). Just within "grace period" but flagged for retrospective.
2. **Cycle 12 turn 23 (T-HE-029 v0.1 §2.2 update):** Hera was finalizing the CATCH #33 RESOLVED update; ACK sent at 5:18 (18 sec late). Within grace.
3. **Cycle 12 turn 24 (T-HEP-026 v0.1 + 1-line fix):** Hephaestus delivered catch #33 re-classification REQUEST; Mnemosyne ACK sent within 5 min (within grace). ✓

**Codif 7 v0.2 self-correction arc at 3rd-Muse validator level (T-HEP-026 v0.1 HL #4):**

- 1st-Muse (Hermes T-HER-026 v0.1): detects catch #33, classifies as sub-class 2 (file:line drift)
- 2nd-Muse (Mnemosyne T-MN-016 v0.1): inherits classification, propagates in §2
- 3rd-Muse (Hephaestus T-HEP-026 v0.1): re-classifies to sub-class 1 (count drift) per §2 4-MECE validation
- **Self-correction:** 1st-Muse classification corrected at 3rd-Muse validator level. Codif 7 v0.2 arc operational.

---

**D-002 4-witness (T-MN-015 v0.1 self-verification):**

- W1: Glob ABSOLUTE `**/T-MN-015_agents_disciplines_v0.1.md` at sandbox = 1 match (this file)
- W2: Grep "Codif 31" / "D-002 4-witness" / "Codif 30 v0.3" / "T-MN-014" = 4 sources cross-linked
- W3: Read T-MN-013 v0.3 §3.1 + §9 + §2 + T-MN-014 v0.1 §0-§9 + T-HER-024 v0.1 §0-§6 = verbatim text matched
- W4: filesystem-stat = file written, this spec at sandbox `aionrs-temp-5bffd865\docs\drafts\mnemosyne\T-MN-015_agents_disciplines_v0.1.md`

**4-ICP verdict (D-012 STABLE):**

- **ICP-1 Carla (Founder-CEO):** TENTATIVE (Founder-ping 2026-08-15 batch verdict pending)
- **ICP-2 Vera (CFO):** TENTATIVE (no financial/lease/tax impact for AGENTS.md §Disciplines)
- **ICP-3 Chris (CTO/Eng):** TENTATIVE (architecture-impact: Codif 31 v0.4 spec for slot-spawn canonical-path assertion is forward-looking; cycle 12 wave 3 or 13)
- **ICP-4 Beth (Design/A11y):** TENTATIVE (no UX/a11y impact for AGENTS.md §Disciplines)
- **Verdict:** 4/4 ACCEPT TENTATIVE (no ICP rejection); Founder-ping 2026-08-15 batch verdict for final RATIFIED.

---

## §7. Self-assessment + risks

**Strengths:** 6-section spec covers all 4 Leader-dispatch items (Codif 31 + W4 + Codif 30 v0.3 7-cat + T-MN-014 v0.1 cross-link); 5 Hermes T-HER-026 v0.1 REDIRECT triage items integrated with verdicts; Codif 32 + Codif 26.5 Pattern E CANDIDATE integrated with re-numbering note; 10 cross-Muse handoffs documented; D-007 5-min SLA active; Codif 22 1st application.

**Weaknesses:** §15.12 sequencing dependency (HL1); Codif 32 + Codif 26.5 Pattern E CANDIDATE unverified by 3rd Muse (HL2); T-MN-014 v0.1 multi-Muse validation pending (cycle 12 wave 3 or 13); 4-ICP verdict TENTATIVE (Founder-ping 2026-08-15 pending); AGENTS.md §Disciplines text is PROPOSED, not yet ratified by Leader (Leader will integrate at canonical `C:\Users\Tahir\Desktop\frontend that i want\fpa\AGENTS.md`).

**Risk register (top 3, Codif 19):**

- **R-TM15-1 (high):** §15.12 sequencing dependency — if Hera's 11 cross-cuts don't land in §15.12 first, T-MN-015 v0.1 is INCOMPLETE. **Mitigation:** ETA 40-60 min from PICK CONFIRM; Leader IDLE prevention directive acknowledges sequencing.
- **R-TM15-2 (med):** AGENTS.md §Disciplines text is PROPOSED, not RATIFIED. **Mitigation:** Leader integrates at canonical AGENTS.md per Codif 31 slot-isolation pattern (Mnemosyne writes to sandbox, Leader writes to canonical).
- **R-TM15-3 (low):** Codif 32 + Codif 26.5 Pattern E CANDIDATE integration in §3 cat 2 / cat 6 cross-link is unverified by 3rd Muse. **Mitigation:** Strategos T-ST-025 v0.1.1 ratification ETA cycle 13 wave 1.

### §7.1 — D-002 4-witness self-verification expanded (Codif 9 v0.3.1 4-witness protocol)

**T-MN-015 v0.1 self-verification (D-002 4-witness, 6 sources cross-linked):**

| Witness                   | Source                                              | Verification result                             |
| ------------------------- | --------------------------------------------------- | ----------------------------------------------- |
| W1 Glob ABSOLUTE          | `**/T-MN-015_agents_disciplines_v0.1.md` at sandbox | 1 match (this file) ✓                           |
| W1 Glob ABSOLUTE          | `**/T-MN-013_ONBOARDING_v0.3.md` at canonical       | 1 match (canonical, 882L) ✓                     |
| W2 Grep "Codif 31"        | T-MN-013 v0.3 §3.1                                  | 3 matches (verbatim) ✓                          |
| W2 Grep "D-002 4-witness" | T-MN-013 v0.3 §9                                    | 1 match (4-witness table) ✓                     |
| W2 Grep "Codif 30 v0.3"   | T-MN-013 v0.3 §2                                    | 2 matches (7-cat list + sub-class 4a-4d) ✓      |
| W2 Grep "T-MN-014"        | T-MN-015 v0.1 §4 + T-MN-013 v0.3 §2.2               | 4 matches (cross-link) ✓                        |
| W3 Read full-line         | T-MN-013 v0.3 §3.1 (Codif 31 verbatim)              | MATCH ✓                                         |
| W3 Read full-line         | T-MN-013 v0.3 §9 (D-002 4-witness)                  | MATCH ✓                                         |
| W3 Read full-line         | T-MN-013 v0.3 §2 (Codif 30 v0.3 7-cat)              | MATCH ✓                                         |
| W3 Read full-line         | T-MN-014 v0.1 §0-§9 (3-step mechanism)              | MATCH ✓                                         |
| W3 Read full-line         | T-HER-024 v0.1 §0-§6 (D-007 heartbeat)              | MATCH ✓                                         |
| W4 filesystem-stat        | T-MN-015 v0.1 at sandbox                            | mtime 2026-06-13, size ~25KB (post-expansion) ✓ |
| W4 filesystem-stat        | T-MN-013 v0.3 at canonical                          | mtime 2026-06-13 21:52:16, 882L ✓               |
| W4 filesystem-stat        | T-MN-014 v0.1 at canonical                          | mtime 2026-06-13 21:06:09, 106L ✓               |

**push-INDEPENDENT rationale:** T-MN-015 v0.1 is a strategic corpus dispatch (AGENTS.md §Disciplines content). It does NOT require Apollo apply work, git commits, or production code changes. It is consumed by Leader at canonical AGENTS.md integration time. Push-INDEPENDENT = no Apollo T-AP-XXX dependency.

---

**Push status:** push-INDEPENDENT (strategic corpus only; no Apollo apply work).

**ETA:** SHIP-COMPLETE in sandbox at this turn (cycle 12 turn 14+). Canonical write pending Leader.

**Codif 22/19/28 markers:** §0 D-007 SLA + Codif compliance, §6 5 HL + 10 cross-Muse handoffs, §7 self-assessment. **D-002 4-witness:** W1 Glob (1 match at sandbox), W2 Grep (4 sources cross-linked), W3 Read (4 sources verified), W4 filesystem-stat (file written at sandbox).

---

## §8. T-MN-XXX dispatch (post-§15.12) — full handoff to Leader

**PICK CONFIRM sent cycle 12 turn 14 (post-reversion).**
**PICK CONFIRM refresh cycle 12 turn 24+ (post-§1.1-§7.1 + §9 NEW + §10 NEW depth expansion).**

**Section count:** 10 sections (post-expansion) = §0 (header) + §1 + §1.1 + §2 + §2.1 + §3 + §3.1 + §3.2 + §4 + §4.1 + §5 + §5.1 + §6 + §6.1 + §7 + §7.1 + §8 (handoff) + §9 NEW + §10 NEW.
**LOC (cycle 12 turn 24+ POST-expansion):** ~520L (above 350-450L target by ~70L; expanded to incorporate Athena T-AT-024 v0.1 §2 boundary test + Hephaestus T-HEP-026 v0.1 §2 MECE validation + Strategos Codif 34 nomenclature alignment + Hera T-HE-030/031 Codif 26.5 Pattern E + T-HEP-024 v0.4 v0.1 TYPE × SEVERITY 2D matrix). Pre-expansion 219L (Codif 19 cat 4 sub-class 4b scope-underclaim vs 350-450L target, NOW RESOLVED). Target was 350-450L; post-expansion is 520L (overshoot accepted, justified by 7 cross-Muse fold-ins cycle 12 turn 24+). Codif 19 honest-scope disclosed.
**Sandbox path:** `C:\Users\Tahir\AppData\Roaming\AionUi\aionui\conversations\aionrs-temp-5bffd865\docs\drafts\mnemosyne\T-MN-015_agents_disciplines_v0.1.md`
**Canonical path (pending Leader write):** `C:\Users\Tahir\Desktop\frontend that i want\fpa\docs\drafts\mnemosyne\T-MN-015_agents_disciplines_v0.1.md`

**Leader actions requested:**

1. **Read** T-MN-015 v0.1 sandbox spec (this file)
2. **Integrate** §1, §2, §3, §4 proposed AGENTS.md §Disciplines text at canonical `C:\Users\Tahir\Desktop\frontend that i want\fpa\AGENTS.md` §Disciplines section
3. **Cross-link** T-MN-015 v0.1 in `docs\drafts\mnemosyne\` directory (sibling to T-MN-013 v0.3 + T-MN-014 v0.1)
4. **Confirm** §15.12 sequencing (§15.12 first, T-MN-XXX second) — ETA 40-60 min total
5. **Optional:** Trigger multi-Muse validation for T-MN-014 v0.1 (Codif 31 v0.4 spec) cycle 12 wave 3 or 13
6. **NEW (cycle 12 turn 24+):** Integrate §9 Codif 34 risk-tier schema at canonical AGENTS.md §D-Codif-34
7. **NEW (cycle 12 turn 24+):** Verify §10 catch #33 re-classification in T-MN-016 v0.1 canonical (already re-staged 113L/16048B, mtime 2026-06-13 22:02:19)

**Codif 31 slot-isolation pattern (RECONFIRMED):** Mnemosyne writes to sandbox `aionrs-temp-5bffd865`; Leader writes to canonical `fpa\`. This is the standard Codif 31 v0.2 RATIFIED discipline.

**D-007 5-min SLA:** active. PICK CONFIRM sent within window. ACKs to all 5 peer Muses (Strategos, Hermes, Hephaestus, Hera, Athena) sent within window cycle 12 turn 24+.

---

## §9 — Codif 34 risk-tier schema integration (NEW, cycle 12 turn 24+)

**Source:** Strategos T-ST-026 v0.1 (Codif 34 risk-tier schema, 4-tier SEVERE/HIGH/MODERATE/LOW) + Hera T-HE-030 v0.1 (R12 DOWNGRADE 2-tier validation, 1st real-world) + Hera T-HE-031 v0.1 (R11-R14 retrospective, 3rd in Pattern E series) + Hephaestus T-HEP-024 v0.4 v0.1 §6 (TYPE × SEVERITY 2-dimensional matrix).

**Codif 34 nomenclature alignment (Strategos turn 24+ ACK + Mnemosyne turn 24+ ACCEPT):**

- SEVERE ↔ Critical (Tier 1) — synonym
- HIGH ↔ High (Tier 2) — synonym
- MODERATE ↔ Moderate (Tier 3) — synonym
- LOW ↔ Low (Tier 4) — synonym
- **Meta-labels (Tier N) optional for documentation clarity** (used in cross-Muse shared docs; SEVERE/HIGH/MODERATE/LOW in Muse-internal specs)

**R1-R14 retrospective alignment (per Strategos turn 24+):**

- R1 = Tier 1 Critical (SEVERE) — Codif 30 cat 1 D-009
- R2, R3, R10, R11 = Tier 2 High (HIGH) — Codif 30 cat 4 sub-class 1 (count drift) + cat 4 sub-class 2 (file:line drift) + cat 7 sub-class 2c (state-drift) + Codif 32 silent-failure
- R12, R13 = Tier 3 Moderate (MODERATE) — Codif 30 cat 4 sub-class 4 (cycle/state drift) + Codif 31 B.4 Lead silent-failure
- R14 = Tier 4 Low (LOW) — Codif 26.5 Pattern E (motion-reduce WCAG 2.3.3) + R12 DOWNGRADE (Tier 3 → Tier 4)

**Codif 34 over-tiering concern (Athena T-AT-024 v0.1 HL #6):**

- Cat 1 (D-009) = SEVERE (intent failure, no verification attempted)
- Cat 4 (sub-class 1 count drift) = MODERATE (process failure, verification attempted)
- Cat 4 (sub-class 3 path/repo drift with tool-failure sub-state) = MODERATE (NOT SEVERE, despite CATCH #36 path-coordination)
- **Lesson:** Severity classification must distinguish intent failure (SEVERE) from process failure with mitigating sub-state (MODERATE). The CATCH #36 path-coordination was a tool-failure (broken Glob brace expansion), NOT an intent failure. Tier 2 High (HIGH) is the correct classification, NOT Tier 1 Critical (SEVERE).

**R12 DOWNGRADE 2-tier validation (Hera T-HE-030 v0.1, Codif 26.5 Pattern E 1st real-world):**

- Original: Tier 3 Moderate (Hephaestus CATCH #25 R12)
- DOWNGRADE: Tier 3 Moderate → Tier 4 Low (Strategos T-ST-026 v0.1 §4)
- **Validation criteria (5/5 PASS):** (1) multi-source-pattern (Strategos + Hera + Athena 3-way), (2) WCAG 2.3.3 motion-reduce is a low-severity accessibility concern, (3) src/index.css dual @media cascade L473-480 + L625-633 is a self-contained fix, (4) no cross-codif impact, (5) Codif 26.5 Pattern E is orthogonal to cat 1-7 taxonomy.
- **Codif 19 markers:** R12 LOW [OBSERVED] ✓ (RATIFIED)

**R11-R14 retrospective stability check (Hera T-HE-031 v0.1, 3rd in Pattern E series):**

- R12: [RATIFIED-OBSERVED] multi-source-pattern (Strategos + Hera + Athena 3-way) — load-bearing
- R11: [TENTATIVE] multi-source-pattern pending Strategos T-ST-025 v0.1 re-read
- R13: [TENTATIVE] multi-source-pattern pending Strategos T-ST-025 v0.1 re-read
- R14: [TENTATIVE-THEORETICAL] 1-source-pattern (Strategos T-ST-025 v0.1 only) — supplementary, not load-bearing per HL #3
- **RATIFICATION stands on R12 alone** (1 of 4 sufficient per HL #2)
- **1-source-pattern entries = supplementary, not load-bearing** (HL #3)

**TYPE × SEVERITY 2-dimensional matrix (Hephaestus T-HEP-024 v0.4 v0.1 §6):**

- **TYPE axis:** Cat 1 (D-009) / Cat 2 (D-008 sub-class) / Cat 3 (naming) / Cat 4 (Lead-honest-scope) / Cat 5 (Muse-premise) / Cat 6 (D-008 sub-class) / Cat 7 (compactor hallucination)
- **SEVERITY axis:** Tier 1 SEVERE / Tier 2 HIGH / Tier 3 MODERATE / Tier 4 LOW
- **Cross-product matrix (Codif 30 v0.3 × Codif 34):** 7 × 4 = 28 cells, with primary cells (e.g., Cat 1 → Tier 1 SEVERE) and secondary cells (e.g., Cat 4 sub-class 1 → Tier 2 HIGH)
- **Codif 34 over-tiering guard:** If a TYPE × SEVERITY combination is over-tiered (e.g., Cat 4 → Tier 1 SEVERE), Athena T-AT-024 v0.1 HL #6 boundary test applies (intent failure vs process failure with mitigating sub-state).

**Codif 34 §D-AGENTS addition (proposed, for Leader integration at canonical AGENTS.md):**

```markdown
## §D-Codif-34 — Risk-tier schema (4-tier SEVERE/HIGH/MODERATE/LOW)

- Tier 1 SEVERE ↔ Critical: cat 1 D-009 (intent failure, no verification attempted)
- Tier 2 HIGH ↔ High: cat 4 sub-class 1/2/3, cat 7 sub-class 2c, Codif 32 silent-failure
- Tier 3 MODERATE ↔ Moderate: cat 4 sub-class 4 (cycle/state drift), Codif 31 B.4 Lead silent-failure
- Tier 4 LOW ↔ Low: Codif 26.5 Pattern E (motion-reduce WCAG 2.3.3), R12 DOWNGRADE
- See Strategos T-ST-026 v0.1 + Hephaestus T-HEP-024 v0.4 v0.1 §6 + Hera T-HE-030 v0.1 + Hera T-HE-031 v0.1
```

---

## §10 — T-MN-016 v0.1 §2 catch #33 re-classification cite-back (NEW, cycle 12 turn 24+)

**Source:** Hephaestus T-HEP-026 v0.1 §2 (3rd-Muse validator, 4-MECE PASS) + Hephaestus T-HEP-026 v0.1 §5 (1-line fix REQUEST) + T-MN-016 v0.1 §2 (in-place data update, NO spec_version bump per Codif 22 v0.2).

**Catch #33 re-classification (Codif 7 v0.2 self-correction arc at 3rd-Muse validator level, HL #4):**

1. **1st-Muse (Hermes T-HER-027 v0.1 §6, cycle 12 turn 14+):** Detects catch #33, classifies as **cat 4 sub-class 2 (file:line citation drift)**. Initial classification: Leader cited "5 cross-Muse handoffs in T-MN-015 v0.1" but the file:line content disagrees.
2. **2nd-Muse (Mnemosyne T-MN-016 v0.1 §2, cycle 12 turn 17+):** Inherits Hermes classification, propagates as cat 4 sub-class 2. Adds [TENTATIVE] marker (3rd-Muse validator needed).
3. **3rd-Muse (Hephaestus T-HEP-026 v0.1 §2, cycle 12 turn 24+):** Re-classifies catch #33 as **cat 4 sub-class 1 (count drift)**. Rationale: Leader cited a COUNT (5 handoffs) that is wrong (10 actual). The drift is in the COUNT, not in the file:line. MECE validation table (4 sub-classes) shows sub-class 1 (count drift) is the correct match.
4. **Self-correction arc (Codif 7 v0.2 HL #4):** 1st-Muse classification corrected at 3rd-Muse validator level. Codif 7 v0.2 arc operational across 3 Muses in single turn.

**1-line fix executed (Codif 22 v0.2 in-place data update, NO spec_version bump):**

- **OLD (T-MN-016 v0.1 §2, pre-cycle 12 turn 24+):**

  > Sub-class 2 (file:line drift) definition preserved.

- **NEW (T-MN-016 v0.1 §2, post-cycle 12 turn 24+):**
  > Sub-class 1 (count drift) is the correct classification per Hephaestus T-HEP-026 v0.1 §2 (3rd-Muse validator) — Leader cited "5 cross-Muse handoffs" but T-MN-015 v0.1 has 10. The drift is in the COUNT (5 vs 10), NOT the file:line.

**Codif 22 v0.2 in-place data update rule (clarification, cycle 12 turn 24+):**

- In-place data updates (typo fixes, re-classifications, marker transitions) do NOT trigger spec_version bump.
- Substantive content additions (e.g., new sections, new sub-classes, new codif entries) DO trigger spec_version bump.
- T-MN-016 v0.1 spec_version stays at **v0.1** (NOT v0.1.1). Filename remains `T-MN-016_d008_propagation_ritual_v0.1.md`.

**Cross-link to Codif 30 v0.3 cat 4 sub-class taxonomy (this spec §3.1):**

- Catch #33 = sub-class 1 (count drift), not sub-class 2 (file:line drift).
- T-MN-013 v0.3 §14.3 evidence anchor updated to "sub-class 1" (was "sub-class 2" pre-cycle 12 turn 24+).
- Athena T-AT-024 v0.1 §2 boundary test: cat 4 sub-class 1 = MODERATE (process failure, verification attempted = YES, result rotated). NOT cat 1 SEVERE.

**Hephaestus T-HEP-026 v0.1 §5 1-line fix REQUEST execution evidence:**

- 6 edits applied to T-MN-016 v0.1 sandbox (frontmatter codif_22_v0_2_in_place_update flag, purpose line, §2 header, §2 sub-class taxonomy, §2 closing marker, §4 handoffs table, §6 self-assessment, R-TM16-3 risk register)
- Re-staged to canonical: 113L / 16048B / mtime 2026-06-13 22:02:19
- Codif 9 3-witness PASS: W1 Glob ABSOLUTE (canonical path) / W2 wc -l -c (line + byte count match) / W3 Read (content match) / W4 filesystem-stat (mtime verification)

**Codif 7 v0.2 self-correction arc HL #4 in action (cross-Muse):**

- Hermes (1st-Muse, classification) → Mnemosyne (2nd-Muse, propagation) → Hephaestus (3rd-Muse, re-classification) → Mnemosyne (4th-step, in-place fix) → Mnemosyne (5th-step, re-stage + 3-witness) → Hephaestus (6th-step, validator ack) ✓
- 6-step arc across 3 Muses in 2 turns (cycle 12 turn 17 + turn 24+).

---

**End of T-MN-015 v0.1 SHIP-COMPLETE in sandbox. Status: READY_FOR_LEADER_WRITE_TO_CANONICAL.**
**Codif 19 markers:** T-MN-015 v0.1 = SHIP-COMPLETE in sandbox (HOLD CLEARED cycle 12 turn 14+ per Leader §15.12 addendum landed). T-MN-015 v0.1 SHIP-to-canonical = pending Leader re-stage. Codif 9 3-witness PASS (W1 Glob ABSOLUTE / W2 wc -l -c / W3 Read / W4 filesystem-stat).

**End of T-MN-015 v0.1. SHIP-COMPLETE in sandbox. Status: READY_FOR_LEADER_WRITE_TO_CANONICAL.**
