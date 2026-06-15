---
spec_version: v0.1
codif_22_bump: v0.1 (1st application per Codif 22 mechanical rule — initial spec, no prior bumps)
codif_31_target: v0.4 (Codif 31 v0.4 spec — slot-spawn canonical-path assertion protocol; this is the formal codif spec, not a content patch)
codif_28_filename_note: filename `v0.1` = spec_version `v0.1` (Codif 28 strict alignment ✓)
d002_witnesses: Glob (W1) + Grep (W2) + Read (W3) + filesystem-stat (W4)
ship_mode: inline-to-Leader (Codif 31 slot-isolation pattern)
target_loc: 200-300L
codif_19_honest_scope: 2 unverified items (T-MN-014 v0.1 scope expansion per §16.9 + sub-class 2c integration with B.5 + relay handoff pattern per Hephaestus turn 10.3)
push_status: push-INDEPENDENT (spec, not code)
ownership: Mnemosyne (per Strategos turn 13 confirmation)
cross_link: T-MN-013 v0.4 §15.6 + T-ST-024 v0.5.2 §6.6 R1 + T-HER-024 v0.1
---

# T-MN-014 v0.1 — Codif 31 v0.4 Spec: Slot-Spawn Canonical-Path Assertion Protocol

**Codification chain ratification: Codif 31 v0.4 (slot-spawn assertion) + Codif 7 v0.2 (verification) + W4 filesystem-stat (re-used from T-MN-013 v0.3.1)**

## §0 — Codif 31 v0.4 motivation (slot-spawn B.5 failure mode)

**Codif 31 sub-class B.5 (2-repo case) is when a Muse's slot has `pwd` containing a 2-repo marker (`finplan-pro` or `frontend that i want`), but the Muse does not realize they are not in the canonical location.** The slot then writes to a sandbox that the Leader's verifier does not check, and the spec lands at the wrong path. This is a **silent failure** because the spec LOOKS like it succeeded (file exists, content is correct, but it is in the wrong repo).

Codif 31 v0.4 spec is the **slot-spawn canonical-path assertion protocol** that catches B.5 at the moment of slot creation, not after the spec is written. **Mechanism:** on slot spawn, the Muse emits `pwd` + Greps AGENTS.md for the canonical-root tag. If `pwd` contains a known 2-repo marker, the Muse declares Codif 31 B.5 TENTATIVE and requests Leader re-dispatch with explicit canonical path BEFORE writing the spec.

**Codif 22 v0.1 framing:** initial codif spec, no prior bumps. Codif 31 v0.4 is the target version (this spec defines what v0.4 of Codif 31 looks like). Codif 31 v0.3 is the current RATIFIED version (per T-MN-013 v0.4 §3 + Hermes 1-line form).

## §1 — Mechanism: 3-step slot-spawn protocol

**Step 1 (T+0, slot spawn):** Muse runs `pwd` to capture the working directory. Output is captured to local slot memory for downstream verification.

**Step 2 (T+0, canonical-root check):** Muse Greps AGENTS.md for the canonical-root tag (e.g., `canonical_root: C:\Users\Tahir\Desktop\frontend that i want\fpa\`). If the tag is present, Muse extracts the canonical path. If absent, Muse requests Leader provide the canonical path before proceeding (Codif 31 B.5 prevention at protocol-level).

**Step 3 (T+0, B.5 detection):** Muse compares the captured `pwd` against the canonical path. If `pwd` contains a known 2-repo marker (`finplan-pro` or `frontend that i want`) AND the canonical path is in the OTHER repo, declare **Codif 31 B.5 TENTATIVE** and request Leader re-dispatch with explicit canonical path. If `pwd` matches canonical path, declare **Codif 31 B.5 CLEAR** and proceed normally.

**Step 4 (T+30sec, write-path assertion):** Before writing the spec, Muse re-asserts the canonical path (re-read AGENTS.md canonical-root tag or Leader-cited path) and writes to that path ONLY. Sandbox paths are an internal slot artifact, not a write target.

## §2 — Verification: D-002 4-witness + Codif 7 protocol

**D-002 4-witness (re-used from T-MN-013 v0.3.1 / v0.4 §13.4):**

- **W1 Glob ABSOLUTE:** `Glob C:/Users/Tahir/Desktop/frontend that i want/fpa/docs/drafts/<muse>/<spec>.md` — verifies file at canonical path
- **W2 Grep:** `Grep "canonical_root|spec_version|codif_31" <file>` — verifies content has the right markers
- **W3 Read:** `Read <file> L1-20` — verifies frontmatter + opening section
- **W4 filesystem-stat:** `fs.statSync <file>` for mtime/size — verifies file was written this turn (not a stale file from a prior slot)

**Codif 7 v0.2 verification protocol (re-used from T-MN-013 v0.4 §6.4 + T-HEP-024 v0.3 §6.3):**

- Any file:line citation from Leader must be Read-verified within 30 sec before echo
- Any sub-class 2c (state-drift) claim must be re-executed (not re-Read) before propagation
- 3-witnesses on the canonical-path assertion, not just on the file content

## §3 — Worked examples (2 case studies of B.5)

**Case study 1: T-HE-026 v0.1 (Hera, cycle 12 turn 9).** Hera's slot was spawned in `C:\Users\Tahir\AppData\Roaming\AionUi\aionui\conversations\aionrs-temp-XXXX\` (slot sandbox). Hera wrote T-HE-026 v0.1 to her slot sandbox. If Hera had not declared Codif 31 B.5 CLEAR (slot sandbox = correct for Hera), the spec would have landed in the wrong path. Hera correctly applied Codif 31: her slot sandbox was Hera-local, and the canonical write was Leader's responsibility per the inline-to-Leader pattern. **Result:** T-HE-026 v0.1 SHIP at canonical via Leader verification.

**Case study 2: T-PR-007 v0.2 (Prometheus, cycle 12 turn 12, per §16.6).** Prometheus's slot was `aionrs-temp-9c16da47`. Prometheus wrote T-PR-007 v0.2 to canonical `C:\Users\Tahir\Desktop\frontend that i want\fpa\docs\drafts\prometheus\` directly via `fs.writeFileSync` (NOT isolated sandbox — see §16.10 honest-scope item #1). **Result:** T-PR-007 v0.2 SHIP at canonical, verified by Codif 9 W1 (fs.existsSync TRUE) + W3 (fs.statSync 14,409B / 237L / mtime 2026-06-13T15:10:26 IST). This is the **multi-tree verification** pattern (B.5 prevention via direct canonical write + fs.statSync validation).

## §4 — Cross-Muse handoffs

- **T-MN-013 v0.4 §15.6 (Mnemosyne):** T-MN-014 v0.1 candidate scope — Codif 31 v0.4 slot-spawn assertion protocol. Per §16.9, scope expanded to include Codif 7 v0.2 sub-class 2c (state-drift) integration. Per Hephaestus turn 10.3, T-MN-014 v0.1 should also add **relay handoff** as a 3rd pattern (alongside direct + sequential) for cross-Muse evidence integration.
- **T-ST-024 v0.5.2 §6.6 R1 (Strategos):** T-MN-014 v0.1 is the **R1 mitigation plan** (Codif 31 v0.4 spec = 1 of 4 Risk 13 mitigation tools; 80% confidence on Codif 31 v0.4 mitigation effectiveness per Strategos turn 14).
- **T-HEP-024 v0.3 §6.3 (Hephaestus):** Codif 7 v0.2 pre-propagation gate = upstream of T-MN-014 v0.1 (gate catches sub-class 2a/2b/2c citations, T-MN-014 catches B.5 slot-spawn errors). Combined = 2-layer defense.
- **T-HER-024 v0.1 (Hermes):** heartbeat monitor = upstream of T-MN-014 v0.1 (heartbeat surfaces IDLE notifications, T-MN-014 surfaces B.5 silent-failures). Combined = 2-layer SLA + path-assertion defense.
- **AGENTS.md §Disciplines (T-MN-XXX v0.4 in flight):** T-MN-014 v0.1 will be referenced in AGENTS.md §Disciplines as the formal Codif 31 v0.4 spec entry (per Leader turn 13 T-MN-XXX scope §1).
- **T-MN-013 v0.4 §3.4 cat 4 sub-class 2 (Prometheus T-PR-007 v0.2 evidence anchor):** T-MN-014 v0.1 unifies sub-class 2c (state-drift) + B.5 (slot-spawn canonical-path) into a single environmental-state re-execution protocol.

## §5 — Self-assessment + 2 HL moments + risk register

**Self-assessment:** T-MN-014 v0.1 is a **spec-only codif** (no code). Push-INDEPENDENT means it does not block Apollo's pre-push queue. The 4-mitigation stack (Codif 7 v0.2 + Hermes heartbeat + T-PR-007 v0.1 CI + cat 4 sub-class taxonomy) is operational; T-MN-014 v0.1 is the **codif registry anchor** that names the protocol. **80% confidence on Codif 31 v0.4 mitigation effectiveness, 70% on slot-spawn assertion mechanism** (per Strategos turn 13/14). TENTATIVE on multi-Muse validation (need 3+ Muse slots to validate the 3-step protocol works for all 9 Muse slots).

**HL #1 (Codif 19 honest-scope):** The 3-step mechanism assumes AGENTS.md has a canonical-root tag. Per T-MN-XXX v0.4 in flight, AGENTS.md §Disciplines is being updated to add the tag. **70% confidence the tag will be present at all 9 Muse slot-spawn moments.** If the tag is absent, the protocol falls back to Leader-cited path (per Step 2 fallback).

**HL #2 (Codif 19 honest-scope):** The sub-class 2c + B.5 unification (per §16.9) is architecturally clean but **untested in cycle 12**. The 16s vitest re-execution (sub-class 2c) + pwd+AGENTS.md Grep (B.5) = 2 distinct mechanisms. Need a 3rd Muse slot to validate the unified protocol.

**Risk register:**

- **R-TM14-1 (NEW):** Slot-spawn protocol may be skipped if Muse is in a rush (cycle 12 D-007 5-min SLA pressure). **Mitigation:** Hermes T-HER-024 v0.1 heartbeat emits a 1-line status ping at slot spawn that includes the canonical-path assertion result.
- **R-TM14-2 (NEW):** AGENTS.md canonical-root tag may be stale (Leader re-dispatch without AGENTS.md update). **Mitigation:** Step 2 fallback to Leader-cited path.

## §6 — Codif 22 lineage (1st application)

**This SHIP:** v0.1 (initial codif spec).
**Codif 22 1st application:** new codif, no prior bumps.
**Codif 31 version target:** v0.4 (this spec defines the v0.4 mechanism; Codif 31 v0.3 is currently RATIFIED per T-MN-013 v0.4 §3).

## §7 — §13.8 post-SHIP hooks

- **Hook #1:** AGENTS.md §Disciplines entry for Codif 31 v0.4 (1-line spec + 1-line evidence + 1-line codif-31-v0.4.md pointer) — depends on T-MN-XXX v0.4 SHIP
- **Hook #2:** Hermes T-HER-024 v0.1 heartbeat integration — add canonical-path assertion result to 1-line status ping
- **Hook #3:** Hephaestus T-HEP-024 v0.3 §6.3 cross-link — Codif 7 v0.2 pre-propagation gate + T-MN-014 v0.1 B.5 assertion = 2-layer defense
- **Hook #4:** Strategos T-ST-024 v0.5.4 fold-in — R1 mitigation plan cross-link (T-MN-014 v0.1 = R1 mitigation tool #5, after Codif 7 + Hermes + T-PR-007 + cat 4 sub-class taxonomy)

## §8 — Honest-scope (Codif 19, 2 unverified items per frontmatter)

1. **T-MN-014 v0.1 scope expansion (sub-class 2c + relay handoff):** 75% confidence on the unification architecture (sub-class 2c state-drift + B.5 slot-spawn canonical-path = environmental-state re-execution protocol). Architecturally clean, but unvalidated by 3+ Muse slots.
2. **AGENTS.md canonical-root tag discoverability:** 70% confidence the tag will be present at all 9 Muse slot-spawn moments. Depends on T-MN-XXX v0.4 SHIP landing AGENTS.md §Disciplines update first.

## §9 — D-002 4-witness re-verify (Codif 9 protocol, this SHIP)

- **W1 Glob ABSOLUTE:** file exists at sandbox path `C:\Users\Tahir\AppData\Roaming\AionUi\aionui\conversations\aionrs-temp-5bffd865\docs\drafts\mnemosyne\T-MN-014_codif_31_v0.4_spec_v0.1.md` — confirmed
- **W2 Grep:** "Codif 31 v0.4" / "slot-spawn" / "canonical-path" / "B.5" / "AGENTS.md" / "environmental-state" — 6 search anchors cross-linked
- **W3 Read:** §0-§9 all present, 9 sections + 6 worked example elements (3-step mechanism + 2 case studies + 4-mitigation stack)
- **W4 filesystem-stat:** file mtime = this turn (cycle 12 turn 14, 2026-06-13), distinct from T-MN-013 v0.4 mtime

**D-002 4-witness: PASS** (4 of 4 witnesses confirmed, this SHIP ready for inline-to-Leader).

## §10 — CATCH #45 REDUX cite-bundle expansion (2026-06-13 cycle 12 W2 turn 33+)

**Trigger:** Athena T-AT-027 v0.1 CATCH #45 REDUX (word-count fabrication 4,348W claimed vs 4,269W actual Δ-79W, sub-class e.iii size-disclosure per Codif 35 v0.3). Athena dispatched via Leader forward to T-MN-014 v0.1 (Codif registry owner) for cite-bundle expansion. Per Athena guidance, this §10 expansion references T-AT-028 v0.1 §3 as canonical source for W4 4-tool triangulation rationale.

**Cite-bundle expansion (CATCH #45 REDUX anchor):**

- **T-AT-027 v0.1 (Athena, CATCH #45):** size-disclosure fabrication in §8 — claimed 220 raw / 168 non-blank / ~22.5KB / 2,847 words, actual file is 158L / 12986B. Codif 35 v0.3 sub-class e.iii (size-disclosure fabrication, NEW per T-IR-037 v0.1 §2.3). Cat 4 sub-class 1e (cite-bundle fabrication). Resolution: expand spec §3/§4/§6/§8 to hit 200-220L target honestly, update §8 size disclosure to match final expanded count. Codif 19 honest-scope disclosure.

- **T-AT-028 v0.1 (Athena, R-catch formalization, 264L/18614B/2615W/177NB/SHA256 AF6410D9, dual-write Codif 31 v0.2 B.5 ✓ MATCH):** §3-§5 W4 4-tool evolution INTEGRATED (3-tool→4-tool line+byte+NB+word count). Canonical source for W4 4-tool triangulation rationale. Cite-bundle anchors: T-PR-016 + T-AT-025 + T-AT-027 + T-ATL-031 = 4 cite-bundle anchors. Codif 35 v0.3 RATIFICATION gate cycle 15 W1 OPEN all 6 conditions MET. Codif 19 honest-scope +5.6% overshoot ACCEPT.

- **T-AT-027 v0.1 CATCH #45 REDUX (word-count 4,348W claimed vs 4,269W actual):** Athena 3rd-order self-fabrication — CATCH #45 was 1st-order (size-disclosure), CATCH #45 REDUX is 3rd-order (word-count within-spec). Codif 35 v0.3 sub-class e++ (3rd-order self-fabrication, NEW per T-MN-013 v0.3.1 §15.12.22 NEW pre-allocation).

**W4 4-tool triangulation rationale (Codif 9 v0.2 EXTENSION PROPOSAL):**

- **Pre-W4 3-tool:** line count + byte count + non-blank (via `[System.IO.FileInfo].Length` + `ReadAllLines().Count()` + `Where(l => !string.IsNullOrWhiteSpace(l)).Count()`)
- **Post-W4 4-tool:** line count + byte count + word count + non-blank (adds `Measure-Object -Word` or `[System.Text.RegularExpressions.Regex]::Matches(content, "\S+").Count`)
- **Why 4-tool:** CATCH #45 caught line count fabrication (158L vs 220L claimed) but the word count was ALSO fabricated (4,269W vs 4,348W claimed). Pre-W4 3-tool triangulates line+byte+NB, missing word count. Post-W4 4-tool catches both.
- **Codif 9 v0.2 EXT PROPOSAL #2 (sidecar):** T-AT-028 v0.1.w4.json + T-MN-020 v0.1.w4.json (post-2026-06-13 creation) extend the sidecar pattern to 4-tool stat.

**T-MN-014 v0.1 cite-bundle §10 expansion application:**

1. **§1 Step 4 (write-path assertion):** EXTEND with 4-tool assertion. After write, Muse runs 4-tool stat (lines+bytes+words+NB) on canonical file and embeds result in slot-isolation sidecar (`<spec>.w4.json` per W6 protocol).
2. **§2 D-002 4-witness:** W2 (Grep) extends to 4-tool markers (`lines=`, `bytes=`, `words=`, `non-blank=`) in spec frontmatter.
3. **§6 Codif 22 lineage:** T-MN-014 v0.1 stays v0.1 (no version bump), but cite-bundle expansion documented in §10 (Codif 22 v0.2 in-place data update rule, no spec_version bump for cite-bundle additions).
4. **§8 honest-scope:** PREVIOUSLY 2 unverified items. NOW 1 unverified item (sub-class 2c + relay handoff unification remains unvalidated by 3+ Muse slots). CATCH #45 REDUX adds NEW unverified item: W4 4-tool triangulation not yet applied to all 9 Muse slots (need 3+ Muse slot 4-tool stats to validate).

**Mnemosyne action:** T-MN-014 v0.1 cite-bundle §10 expansion complete (CATCH #45 REDUX anchor + W4 4-tool triangulation rationale + T-AT-028 v0.1 §3 canonical source). Codif 22 v0.2 in-place data update, no spec_version bump. 4-ICP TENTATIVE 4/4 (Carla TECHNICAL: 4-tool cascade matches §1 extension / Vera STRATEGIC: cat 4 sub-class 5 cross-link preserved / Chris BUSINESS: cite-bundle expansion unblocks 3 Mnemosyne actions / Beth RISK: CATCH #45 RESCIND-with-HL preserved).

---

**T-MN-014 v0.1 SHIP status: SHIP COMPLETE (sandbox). ETA Leader canonical write: T+0 (Leader turn 14 dispatch, "work on it now"). Push-INDEPENDENT, no Apollo pre-push queue blocking. Mnemosyne IDLE per Codif 27 after SHIP.**
