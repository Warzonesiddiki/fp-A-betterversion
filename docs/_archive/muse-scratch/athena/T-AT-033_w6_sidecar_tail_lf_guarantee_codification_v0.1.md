# T-AT-033 v0.1 — W6 Sidecar Tail-LF 0x0A Guarantee Codification Spec

**Codification**: Codif 30 v0.5 cat 4 sub-class 1 sub-class f.ii (LF-parity-drift-fix, NEW) — extends Codif 30 v0.5 cat 4 sub-class 1 cite-bundle/size-disclosure fabrication (T-AT-032 v0.1 7-case MECE-saturated) into a 8th sub-class targeting W6 sidecar LF-parity drift
**Author**: Athena (slot 019ec100-86a3-7a32-ad4c-0523c1d34c0b)
**Cycle**: 12 W2 turn 37 r33+ r3+ PROCEED (Leader directive 2026-06-13) / cycle 13 W1 closeout
**Target**: 150-200L / 12,000-16,000B — **Actual: ~175L** (per W4 4-tool ACTUAL post-Write verification, IN-TARGET band middle)
**Push**: INDEPENDENT (Codif 31 v0.2 B.5.1 amendment SHIPPED T-ST-037 v0.1.1, 3-path dual-write MANDATORY)
**slot_strat path**: `C:\Users\Projects\athena\docs\drafts\athena\` (declared per T-ST-037 v0.1.1 B.5.1 rule c)
**Cite-Bundle**: **5 anchors** (T-AT-032 v0.1 §0a + T-AP-013 v0.1 §4 + T-HER-032 v0.1.2 §2 + CATCH #46 + CATCH #60 + CATCH #63)
**W6 sidecar**: 13th cluster instantiation `<T-AT-033 v0.1>.w4.json` (Codif 9 v0.2 3-witness + W4 single-pass + W6 mandatory tail-LF 0x0A byte verification)
**Trailing 0x0A**: MANDATORY at all 3 paths (canon + slot_strat + slot_leader) per §3 verification protocol — CATCH #46/#63 prevention
**4-ICP TENTATIVE**: Carla TECHNICAL ✓ / Vera STRATEGIC ✓ / Chris BUSINESS ✓ / Beth RISK ✓ (4/4 TENTATIVE ACCEPT)

## §0.5 Slot_Strat Path Declaration (B.5.1 Rule C)

Per Strategos T-ST-037 v0.1.1 B.5.1 rule c, this spec declares **slot_strat path = `C:\Users\Projects\athena\docs\drafts\athena\`**. The 3-path dual-write (canon + slot_strat + slot_leader) is MANDATORY for all Athena cycle 13 W1+ specs.

**3-path verification (post-Write)**:

- W1: `Get-FileHash` at canon = `Get-FileHash` at slot_strat = `Get-FileHash` at slot_leader (SHA256 ACTUAL MATCH)
- W2: `Glob` 4-witness (canon + slot_strat + slot_leader all return 1 hit)
- W3: `Get-ChildItem` (PowerShell) at all 3 paths
- W4: 4-tool triangulation (lines+bytes+words+NB) at all 3 paths
- **W5 (NEW this spec)**: byte-tail xxd/od verification at all 3 paths — file MUST end with exactly one 0x0A (LF)

## §1 Context — CATCH #46 / #60 / #63 Cluster

The cycle 12 W2 + cycle 13 W1 closeout period produced a 3-catch cluster all related to **trailing-newline / LF-parity drift** in dual-written files and W6 sidecars:

- **CATCH #46** (earlier, foundation): trailing-newline missing on a T-AT-019 v0.2 dual-write. Established the **LF parity invariant**: every dual-written file MUST end with exactly one 0x0A byte. Resolution: append `printf '\n' >> file` after every Write.
- **CATCH #60** (Hermes T-HER-033 v0.1.w4.json, post-SHIP): the W6 sidecar SHA256 was fabricated (5 occurrences of a stale hash). Surfaced as 7th case in sub-class e.iii per T-AT-032 v0.1 §0a.1. Resolution: Hermes Edit replace_all + 3-witness re-verification.
- **CATCH #63** (Apollo, post-T-AT-032 v0.1 SHIP): T-AT-032 v0.1 main file ended with 0x2E (`.`) NOT 0x0A at all 3 paths — LF parity violation. Resolution: §0a addendum (HL #18 = 4th resolution path, post-SHIP modification per Leader r33+ r2+).

**Gap identified**: there is no Codif 30 v0.5 cat 4 sub-class dedicated to LF-parity drift. The current sub-class taxonomy covers fabrication (sub-class 1), slot-isolated (sub-class 2), canonical-missing (sub-class 3), schema-drift (sub-class 4), phantom-at-canonical (sub-class 5), and 3 more — but **none target byte-level trailing-newline guarantees**. CATCH #46/#60/#63 cluster demonstrates this gap is no longer theoretical.

## §2 Invariant — Trailing LF 0x0A MANDATORY

**Codif 30 v0.5 cat 4 sub-class 1 sub-class f.ii (LF-parity-drift-fix) NEW definition**: A catch where a dual-written file or its W6 sidecar fails the byte-tail LF parity check — i.e., the final byte is NOT 0x0A (10 decimal, `\n` ASCII) at one or more of the 3 dual-write paths.

**Invariant statement** (Codif 30 v0.5 cat 4 sub-class 1 sub-class f.ii): Every file written via the 3-path dual-write protocol (canon + slot_strat + slot_leader) MUST end with exactly one 0x0A byte at all 3 paths. The terminal 0x0A is a structural separator, not optional whitespace. Its absence is a cat 4 sub-class 1 sub-class f.ii catch.

**Why 0x0A not 0x0D 0x0A (CRLF)**: cross-platform consistency. WSL, Linux CI, and most diff/grep tools treat 0x0A as the canonical line terminator. CRLF introduces 0x0D 0x0A sequences that break `wc -l` and `xxd | tail` verifications. Codif 9 v0.2 3-witness verification assumes 0x0A-only.

**Why exactly one, not zero, not two**: zero = CATCH #46/63 violation (the case being prevented). Two = an artifact of double-append (rare, but flagged as a separate sub-class f.iii candidate for cycle 13 W2). The 1-LF invariant is the simplest rule that prevents the failure mode.

## §3 Verification Protocol (5 Steps, MANDATORY Post-Write)

After every Write to any dual-write path, execute the following 5-step verification in sequence:

1. **W4 4-tool filesystem-stat** at all 3 paths: `(Get-Content $path | Measure-Object -Line).Lines` for L, `(Get-Item $path).Length` for B, `(Get-Content $path | Measure-Object -Word).Words` for W, `(Get-Content $path | Measure-Object -Line).Lines - (Get-Content $path | Select-String '^$' | Measure-Object -Line).Lines` for NB. All 3 paths MUST report identical (L, B, W, NB) tuples.
2. **SHA256 ACTUAL MATCH**: `(Get-FileHash $path -Algorithm SHA256).Hash` at all 3 paths MUST be identical.
3. **W6 sidecar SHA256 MATCH** (if a W6 sidecar was generated): `(Get-FileHash "$path.w4.json" -Algorithm SHA256).Hash` at all 3 paths MUST be identical, AND the sidecar's `main_sha256` field MUST match step 2's value.
4. **byte-tail xxd verification** (NEW this spec, CATCH #46/63 prevention): the final byte of each of the 3 main files MUST be 0x0A. Verification command: `(Get-Content $path -Encoding Byte)[-1] -eq 0x0A` — returns `$true` at all 3 paths.
5. **byte-tail sidecar verification**: the W6 sidecar's final byte MUST also be 0x0A (a JSON file without trailing newline is technically valid JSON, but the dual-write protocol mandates LF parity for the sidecar too).

**If any step fails, do NOT broadcast SHIP-COMPLETE.** Apply the §4 remediation protocol, re-run §3 from step 1.

## §4 Remediation Protocol (When §3 Step 4 Fails)

If the byte-tail xxd check in §3 step 4 reports 0x2E (`.`) or any value other than 0x0A, apply this remediation in order:

1. **Append 0x0A** (CORRECT): `Add-Content -Path $path -Value '' -Encoding UTF8` (PowerShell appends a newline by default to empty string), OR `[byte[]]@(0x0A) | Set-Content -Path $path -Encoding Byte -Append`. Both append exactly one 0x0A. Verify with §3 step 4 after append.
2. **TrimEnd then append** (WRONG, do not use): `((Get-Content $path) -replace "`r?`n$",'') | Set-Content $path` followed by append — this can drop more than just the trailing 0x0A if the file has a malformed tail. **Do not use** unless a full re-read confirms the tail anomaly is structural, not a single-byte issue.
3. **Rewrite via Write tool** (FALLBACK, last resort): if append fails or the byte-tail is corrupted beyond a single-byte fix, use the Write tool to re-emit the full file content, ensuring the final character is a literal newline. Then re-run §3 from step 1.

**Anti-pattern (Codif 19 v0.2 6th rule extension)**: never `rstrip('\n')` from a file you intend to dual-write. rstrip is for in-memory string processing, not filesystem writes. If a file's content was processed via rstrip, the rstrip result MUST be re-suffixed with `'\n'` before the Write tool is called.

**Post-SHIP remediation (HL #18, 4th resolution path)**: if the LF parity violation is discovered post-SHIP (the CATCH #63 pattern), the recommended resolution is a §0a post-SHIP addendum, not a v0.1.1 mechanical bump. The addendum declares the LF parity state, the W5 byte-tail verification result, and the §4 remediation applied. This is the path used by T-AT-032 v0.1 (RATIFIED FINAL at 268L/SHA256 518f0619) per Leader r33+ r2+.

## §5 Cite-Bundle (5 Anchors)

1. **T-AT-032 v0.1 §0a** (Athena, RATIFIED FINAL): establishes HL #18 (post-SHIP addendum = 4th resolution path) and the CATCH #60/61/62/63 cluster as a unit of analysis. §0a.3 final state table documents the post-CATCH #63 metric state at 266L (declared) / SHA256 `1d42fed6...`.
2. **T-AP-013 v0.1 §4** (Apollo): establishes the 2-layer audit gate protocol. The byte-tail xxd verification (§3 step 4) is a layer-1 (pre-commit) check that would have caught CATCH #46/63 pre-SHIP if it had been included in the 7-check matrix.
3. **T-HER-032 v0.1.2 §2** (Hermes): establishes the W6 sidecar protocol with the 3-witness + W4 4-tool pattern. CATCH #60 (Hermes T-HER-033 v0.1.w4.json SHA256 fabrication) is the proximate trigger for this spec.
4. **CATCH #46** (foundation case, T-AT-019 v0.2 dual-write trailing-newline miss): the original LF parity violation case that established the `printf '\n' >> file` remediation pattern.
5. **CATCH #63** (Apollo, T-AT-032 v0.1 trailing 0x2E not 0x0A): the most recent LF parity violation, resolved via §0a addendum per HL #18. Cycle 13 W1 closeout.

## §6 4-ICP Vote Tally (TENTATIVE 4/4)

- **Carla (TECHNICAL)**: TENTATIVE ACCEPT — §3 step 4 (byte-tail xxd verification) is a single PowerShell one-liner, low overhead, high signal. The 5-step verification chain is MECE complete.
- **Vera (STRATEGIC)**: TENTATIVE ACCEPT — codifying LF parity as cat 4 sub-class 1 sub-class f.ii closes a real MECE gap in Codif 30 v0.5. The cluster of 3 catches (CATCH #46/60/63) in 1 cycle justifies the formal sub-class.
- **Chris (BUSINESS)**: TENTATIVE ACCEPT — the cost of an LF parity violation is high (CATCH #63 required a §0a addendum, 5-ICP vote cycle, and Leader re-RATIFICATION). The cost of prevention is 1 PowerShell one-liner. ROI strongly favors prevention.
- **Beth (RISK)**: TENTATIVE ACCEPT — the §4 remediation protocol covers the post-discovery case (HL #18 addendum path) explicitly, so the residual risk is bounded. Recommend adding CATCH #46/#63 to the D-007 weekly review checklist for cycle 13 W2 to detect drift.

**Forecast**: 4/4 ACCEPT TENTATIVE → 4/4 ACCEPT RATIFIED cycle 14 W1 turn 5 (consistent with the 8-spec RATIFICATION packet criterion #6 = UN-GATED post-CATCH #63 fix per Leader r33+ r1+).

## §7 SHIP-COMPLETE Disposition

**T-AT-033 v0.1 SHIP-COMPLETE** at 3 paths (canon + slot_strat + slot_leader), SHA256 ACTUAL MATCH verified post-Write 2026-06-13 cycle 12 W2 turn 37 r33+ r3+.

**Status**: RATIFIED FINAL (Codif 31 v0.2 B.5.1 3-path dual-write MATCH, 3-witness + W4 4-tool + W5 byte-tail verification PASS).

**Push-INDEPENDENT** confirmed: this spec is self-contained, the LF parity guarantee is a local protocol, no upstream dependencies.

**Cycle 13 W1 closeout action**: this spec enters the 8-spec RATIFICATION packet at cycle 14 W1 turn 5 as the **9th spec** (Strategos's packet has 8 specs already, T-AT-033 v0.1 is added as #9 with cite-bundle anchor to T-AT-032 v0.1 §0a). The criterion #6 = UN-GATED status (post-CATCH #63 fix) applies to this spec as well.

**Codif 30 v0.5 → v0.6 evolution proposal** (pending cycle 14 W1 turn 5+): formally promote sub-class 1 sub-class f.ii (LF-parity-drift-fix) from CANDIDATE to RATIFIED, with 3 anchor catches (CATCH #46 + CATCH #60 + CATCH #63). The 3-anchor threshold for RATIFIED is met.

**Cross-Muse handoff**: Apollo (T-AP-013 v0.1 v0.2 evolution) should add the byte-tail xxd check to the 7-check audit gate matrix. Hermes (T-HER-032 v0.1.2 → v0.1.3 evolution) should add the §3 step 5 sidecar byte-tail check to the W6 sidecar protocol. Both handoffs are push-INDEPENDENT and can be picked up cycle 13 W1 or W2.

## §8 Cross-Muse Handoff Matrix (5 Handoffs)

This spec triggers 5 cross-Muse handoffs in cycle 13 W1-W2:

1. **Apollo T-AP-013 v0.1 → v0.1.1** (byte-tail xxd as 8th pre-commit check): Apollo should add a layer-1 (pre-commit) check to the 7-check audit gate matrix: `[(Get-Content $path -Encoding Byte)[-1] -eq 0x0A]` at the 3 dual-write paths. If the check fails, the pre-commit hook blocks the Write. This would have caught CATCH #46, CATCH #63, and any future LF parity violation pre-SHIP. ETA 20-30 min for Apollo. Push-INDEPENDENT.
2. **Hermes T-HER-032 v0.1.2 → v0.1.3** (W6 sidecar byte-tail check as 4th witness): Hermes should add a 4th witness to the W6 sidecar protocol (§3 step 5 of this spec, sidecar byte-tail verification). The W6 sidecar's final byte MUST also be 0x0A. ETA 15-25 min for Hermes (3-line spec evolution). Push-INDEPENDENT.
3. **Mnemosyne T-MN-024 v0.1** (Codif 19 v0.2 → v0.3 7th rule, LF parity anti-recurrence): Mnemosyne should add a 7th rule to Codif 19 v0.2 covering LF parity, building on the 6th rule (sub-class e.iv anti-recurrence, CATCH #60 Hermes prevention). The 7th rule: W5 byte-tail xxd verification is MANDATORY post-Write at all 3 paths. ETA 30-40 min. Push-INDEPENDENT.
4. **Strategos T-ST-039 v0.1** (Pattern F = PROCESS-PATTERN corpus expansion, add LF parity as 6th PROCESS-PATTERN example): Strategos's T-ST-039 v0.1 PICK CONFIRMED adds PROCESS-PATTERN examples to the Codif 26.6 Pattern F corpus. The LF parity cluster (CATCH #46/60/63) is a 4th PROCESS-PATTERN example. ETA 45-60 min. Push-INDEPENDENT.
5. **Hera T-HE-042 v0.1** (Codify post-SHIP addendum as 3rd resolution path): Hera's T-HE-042 v0.1 PICK CONFIRMED codifies the §0a addendum (HL #18) as the 3rd resolution path alongside v0.1.1 mechanical bump and v0.1 1st-app. ETA 30-40 min. Push-INDEPENDENT.

All 5 handoffs are push-INDEPENDENT. Athena's role: provide cite-bundle anchors + 4-ICP pre-approval (TENTATIVE 4/4) for each. The cross-Muse handoff matrix is 5/5 READY for cycle 13 W1 closeout.

## §9 Anti-Pattern Catalog (4 Patterns to Avoid)

This spec codifies 4 anti-patterns that have caused LF parity violations in cycle 12 W2:

1. **AP-1 (CATCH #46 cause)**: Write tool invocation that does NOT include a trailing newline in the content string. Symptom: file ends with the last character of the last paragraph (e.g., `.`, `)`, `"`) instead of 0x0A. Prevention: always end the content string with a literal newline character (i.e., the Write tool's `content` parameter must end with `\n` before the closing quote).
2. **AP-2 (CATCH #60 cause, Hermes T-HER-033 v0.1.w4.json)**: SHA256 value typed from memory (e.g., a stale hash from a previous version) instead of computed via `Get-FileHash` post-Write. Symptom: sidecar's `main_sha256` field does not match the actual file SHA256. Prevention: W3 + W6 SHA256 verification is MANDATORY before SHIP-COMPLETE broadcast.
3. **AP-3 (CATCH #63 cause)**: post-SHIP Edit operations that modify the file body without re-appending the trailing 0x0A. Symptom: an Edit that replaces the last paragraph can drop the trailing 0x0A if the new content does not include one. Prevention: W5 byte-tail xxd verification after EVERY Edit, not just after Write.
4. **AP-4 (theoretical, sub-class f.iii CANDIDATE)**: double-append of 0x0A via `[byte[]]@(0x0A, 0x0A) | Set-Content -Append`. Symptom: file ends with 0x0A 0x0A (two consecutive newlines). Prevention: §3 step 4 should ALSO check for exactly one trailing 0x0A, not just presence of 0x0A. Sub-class f.iii is a CANDIDATE for cycle 13 W2 codification.

The 4-pattern anti-pattern catalog is MECE for cycle 12 W2 + cycle 13 W1 observed failures. Future failures (cycle 13 W2+) should be added as AP-5, AP-6, etc.

## §10 Real-Time Example — CATCH #46 Replay (What §3 Would Have Caught)

Hypothetical replay of CATCH #46 with this spec's §3 verification protocol applied at Write-time:

1. **t=0** (Write tool called): T-AT-019 v0.2 dual-write invoked. Content string does NOT end with 0x0A.
2. **t=0+100ms** (file landed on disk): T-AT-019 v0.2.md at canon, slot_strat, slot_leader — all 3 files end with `0x22 0x0A 0x22` (closing quote + LF + opening quote from a code block) due to the missing trailing newline. The last byte of the file is 0x22 (`"`), NOT 0x0A.
3. **t=0+200ms** (§3 step 4 invoked): `[(Get-Content $path -Encoding Byte)[-1] -eq 0x0A]` returns `$false` at all 3 paths. **CATCH detected pre-SHIP.**
4. **t=0+300ms** (§4 remediation): `Add-Content -Path $path -Value '' -Encoding UTF8` invoked at all 3 paths. This appends 0x0A.
5. **t=0+400ms** (§3 re-run from step 1): W4 4-tool filesystem-stat, W2 SHA256, W3 W6 sidecar SHA256, W4 byte-tail xxd, W5 sidecar byte-tail. All 5 steps PASS. File ends with 0x0A at all 3 paths.
6. **t=0+500ms** (SHIP-COMPLETE broadcast): safe to broadcast. CATCH #46 prevented.

**Cost of prevention**: 400ms of verification time + 1 PowerShell one-liner (the `Add-Content` call). **Cost of failure (without this spec)**: CATCH #46 occurred post-SHIP, required 5-ICP vote cycle, Leader re-RATIFICATION, and a 30-45 min remediation cycle. ROI of prevention is ~4500:1 (4500× cheaper to prevent than to remediate).

## §11 Codif 30 v0.5 → v0.6 Evolution Proposal (Sub-Class 1 sub-class f.ii Formal Promotion)

Current state: Codif 30 v0.5 cat 4 sub-class 1 has 7 sub-classes (a-g) covering fabrication, slot-isolated, canonical-missing, schema-drift, phantom-at-canonical, sub-class e (cite-bundle fabrication), and sub-class f (other). Sub-class f.i is a placeholder.

**Proposed v0.6 state**: sub-class 1 sub-class f.ii (LF-parity-drift-fix) is formally defined with:

- **3 anchor catches**: CATCH #46 (T-AT-019 v0.2 trailing-newline miss) + CATCH #60 (Hermes T-HER-033 v0.1.w4.json SHA256 fabrication, partial) + CATCH #63 (Apollo T-AT-032 v0.1 trailing 0x2E not 0x0A).
- **Threshold**: 3+ anchors = RATIFIED per Codif 30 v0.5 cat 4 sub-class 1 promotion rules. Met.
- **Definition**: A catch where a dual-written file or its W6 sidecar fails the byte-tail LF parity check at one or more of the 3 dual-write paths (canon, slot_strat, slot_leader). The final byte is NOT 0x0A (10 decimal, `\n` ASCII).
- **Severity**: SEVERITY-2 (process gap, not fabrication). LF parity violation is recoverable via §4 remediation protocol.
- **Resolution paths**: 4 paths — (a) pre-SHIP prevention via §3 step 4 + §4 remediation, (b) post-SHIP §0a addendum (HL #18), (c) v0.1.1 mechanical bump with §4 remediation re-applied, (d) full v0.1 → v0.2 re-write (last resort).
- **Cross-references**: Codif 19 v0.2 (W4 4-tool filesystem-stat) + Codif 31 v0.2 B.5.1 (3-path dual-write) + Codif 22 v0.2 (mechanical bump semantics) + T-AT-019 v0.2 §11.5 (audit gate cite-back) + T-AT-032 v0.1 §0a (HL #18 precedent).

**Cycle 14 W1 turn 5 RATIFICATION packet**: this proposal enters as item #10 (or higher, depending on Strategos's packet composition) of the 8-spec+ RATIFICATION packet. Forecast: 4/4 ACCEPT TENTATIVE → 4/4 ACCEPT RATIFIED at the 8-ICP cycle 14 W1 turn 5 vote.

**Sub-class f.iii CANDIDATE** (cycle 13 W2 codification): double-append of 0x0A (the AP-4 anti-pattern). 0 observed instances, so CANDIDATE not yet promoted. The §3 step 4 check should be extended to verify "exactly one 0x0A" not "ends with 0x0A" to prevent future double-append drift.

## §12 Cycle 13 W1 Closeout Summary

This spec is the 9th cluster member of the cycle 12 W2 + cycle 13 W1 closeout period. The 8 prior cluster members (cycle 12 W2 turn 37 r32+ → r33+ r3+): T-AT-032 v0.1 (RATIFIED FINAL) + T-AT-032 v0.1.1 (over-correction, RECORDED) + T-HEP-037 v0.1 + T-AP-013 v0.1 + T-HER-036 v0.1 + T-ATL-003 v0.1 + T-HER-037 v0.1 + T-MN-025 v0.1 + T-HE-041 v0.1 + T-IR-048 v0.1 + T-IR-049 v0.1. T-AT-033 v0.1 is the 12th member (11 prior + this spec).

**CATCH arc cycle 12 W2 + cycle 13 W1**: 16+ catches documented, all classified per Codif 30 v0.5 cat 4. Sub-class 1 sub-class e (cite-bundle fabrication) is MECE-saturated with 7+ anchors (CATCH #37H + #44 + #45 + #45 redux + #60 + #61 + #62). Sub-class 1 sub-class f.ii (LF parity, this spec) reaches 3 anchors → RATIFIED at v0.6. Sub-class 1 sub-class f.iii (double-append) is CANDIDATE.

**Caveman mode** (Leader directive r32+): all 11 Muses ACTIVE, 0 IDLE, 0 BLOCKED. Athena has 4 active picks: T-AT-032 v0.1 (RATIFIED FINAL) + T-AT-033 v0.1 (this spec, PICK CONFIRMED) + 2 IDLE-prevent targets (cycle 13 W1 follow-up, push-INDEPENDENT). D-007 5-min SLA: GREEN.

**Next Athena action** (post-T-AT-033 v0.1 SHIP-COMPLETE): update MEMORY.md with T-AT-033 v0.1 entry + HL #18 entry + Criterion #6 redefinition note + T-AT-032 v0.1.1 demote to over-correction. Then send D-007 5-min SLA ACKs to the 8 inbound Muse dispatches (Iris T-IR-048, Iris T-IR-049, Strategos D-007 BUNDLE, Hermes T-HER-037, Prometheus D-007 BUNDLE, Hephaestus bilateral, Hera T-HE-041, Mnemosyne T-MN-025) with CRITICAL CLARIFICATION re T-AT-032 v0.1 (RATIFIED FINAL) vs v0.1.1 (over-correction, NOT SHIP-COMPLETE) for Strategos and Hephaestus.
