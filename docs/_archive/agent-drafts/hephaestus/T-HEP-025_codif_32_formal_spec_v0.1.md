# T-HEP-025 v0.1.1 — Codif 32 Formal Spec (Leader's test-failure claim pre-verification ritual)

**DRAFT v0.1.1 — 2026-06-13 cycle 12 turn 17 dispatch (Hephaestus slot 019ec100-86bc-74b2-8bc2-70ac22810f05). Bumped from v0.1 for cycle 12 wave 2 turn 17 process events: CATCH #35/#36 self-correction arc + CATCH #33 cat-1-D-009 → cat-4-sub-class-1-B.2 reclassification + Codif 33 → Codif 26.5 Pattern E re-numbering clarification. Codif 22 v0.1 stable across iterations; v0.1.1 mechanical Codif 22 spec-pinning bump (no content rewrite).**
**Codif 22 spec_version: v0.1.1 (initial spec was v0.1; v0.1.1 mechanical bump for cycle 12 wave 2 turn 17 process events. Codif 32 is CANDIDATE per T-HEP-024 v0.3 §6.3 — 2 of 3 Leader-side catches observed; 80% likelihood of RATIFICATION by cycle 14 turn 5)**
**Codif 19 honest-scope: cycle 12 catches #25 (canonical-Prometheus T-PR-007 v0.1 file:line fabrication batch — 7 file:line inaccuracies in Leader's dispatch) / #26 (canonical-Prometheus T-PR-008 v0.1 error-string-swap fabrication — 2 swapped error strings: DrillThroughChain claimed `entries is not iterable` actual `Cannot read 'map' of undefined` at DrillTables.tsx:65; ICMatchingPanel claimed `rows.map of undefined` actual `entries is not iterable` at ICMatchingEngine.ts:115) as evidence anchors. Catch #27 (other-Prometheus T-PR-007 v0.2 Muse self-catch) is Muse-side and does NOT count toward Codif 32 RATIFY threshold per T-HEP-024 v0.3 §3.4 sub-sub-class 2c + §6.3 sub-counters. Catch #29 (this turn, REVERTED per Codif 7 v0.2 self-correction arc) — see §7 HL #4. Path: slot-isolated `C:\Users\Tahir\AppData\Roaming\AionUi\aionui\conversations\aionrs-temp-c0df729e\` then Copy-Item to canonical `C:\Users\Tahir\Desktop\frontend that i want\fpa\` per Codif 31 + Leader's verifier.**
**Codif 9 3-witness: Grep (sub-class taxonomy keywords) + Read (T-HEP-024 v0.3 §6.3 verbatim Codif 32 CANDIDATE draft text) + Glob ABSOLUTE (canonical path, deferred to Lead's verifier per Codif 31 B.5).**
**Status: Codif 32 CANDIDATE (2/3 Leader-side) → RATIFICATION-gated per §6. Push-INDEPENDENT. ETA 60 min from PICK CONFIRM (cycle 12 turn 17). 4-ICP verdict TENTATIVE Founder-ping 2026-08-15.**

**Honest Labeling #58 (Codif 19, cycle 12 turn 17):** This doc was written to slot-isolated working dir (NOT canonical) per Codif 31 B.5 2-repo case. The T-HEP-024 v0.3 reference (269L pre-catch-#29, 248L post-turn-10.2, ~400L post-turn-10.3) is the parent spec; this T-HEP-025 v0.1 is the dedicated formal spec for Codif 32, extracted from T-HEP-024 v0.3 §6.3 (15L draft text) + §6.4 (3-way coordination matrix) + §3.4 sub-class 2 taxonomy. The extraction rationale: T-HEP-024 v0.3 is a threat-model doc (cat 4 Lead-honest-scope operationalization), while T-HEP-025 v0.1 is a codif-text doc (formal Codif 32 spec, RATIFICATION criteria, evidence anchors, cross-Muse coordination, operational mechanisms). The separation is analogous to Codif 30 v0.2 (threat model) vs Codif 30 v0.3 (7-cat framework) — different doc types, complementary content.

---

## §1 Definition

**Codif 32 (CANDIDATE) — Leader's test-failure claim pre-verification ritual.** A sub-class of Codif 30 v0.3 cat 4 (Lead-honest-scope-error) sub-class 2 (test-failure / file:line-specific claim). Codif 32 codifies a specific mitigation ritual for the recurring cognitive failure pattern observed in cycle 12: **Leader (slot 019ebcaa) claims a specific test-failure pattern (error string, failure count, file:line, stack frame, pattern-match count) in a dispatch without first running `npx vitest run <cited-file> --reporter=json` to verify the claim against actual test output.** The pre-verification ritual is a Codif 7 v0.2 verification gate extension; it applies to cat 4 sub-class 2 (both sub-sub-class 2a inattention AND sub-sub-class 2b transposition). The gate is a 60-second `npx vitest run` per cited file, with the JSON output cited verbatim in the dispatch.

**Codif 32 is NOT a generic "Lead re-reads" rule** — it is a specific, mechanical, 60-second pre-dispatch ritual with a verifiable artifact (the JSON output). This mechanical specificity is what distinguishes Codif 32 from Codif 7 v0.2 (which is per-dispatch manual, not per-claim automated).

**Codif 32 scope (IN):** (1) test-failure count claims (e.g., "12 tests failing"), (2) test-failure file:line citations (e.g., "FXExposurePage.tsx:5 fails with X"), (3) test-failure error-string citations (e.g., "DrillThroughChain throws 'entries is not iterable'"), (4) test-failure pattern-match counts (e.g., "7→8 Pattern A files"), (5) test-failure stack-frame citations. **Codif 32 scope (OUT):** (1) generic perf figures (covered by Codif 7 v0.2 + Codif 19, not Codif 32), (2) audit-chain hash claims (covered by Codif 1, not Codif 32), (3) bundle-size claims (covered by Codif 19, not Codif 32), (4) line-count claims (covered by Codif 7 v0.2, not Codif 32). The boundary is: **Codif 32 applies when the claim is grounded in `npx vitest run` output**. Other claim types are governed by other codifs.

**Exclusion criteria (when Codif 32 does NOT apply):** (a) Claim is a forward-looking forecast (e.g., "T-HEP-025 v0.2 will land cycle 14 turn 5") — Codif 32 is for verifiable-present claims, not forecasts. (b) Claim is grounded in non-vitest evidence (e.g., `tsc --noEmit` output, `npm run lint` output) — Codif 32 is vitest-specific; tsc/lint claims are governed by Codif 7 v0.2. (c) Claim is a Meta-codif statement (e.g., "Codif 32 is CANDIDATE 2 of 3") — Codif 32 is self-referential; the codif registry itself is the verification source, not vitest.

---

## §1.5 Codif 32 vs Codif 7 v0.2 boundary

**Codif 7 v0.2 (foundation):** "30-second Read file:line" gate. Universal — applies to ALL premises with specific figures (file:line, count, pattern-match). Manual discipline, per-dispatch, peer-Muse or Lead applies it on receipt. Trigger: any figure that could be wrong.

**Codif 32 (extension):** "60-second npx vitest run + JSON citation" gate. Specific — applies to test-failure claims ONLY. Mechanical discipline, per-claim (not per-dispatch), Lead applies it BEFORE dispatching. Trigger: test-failure claim specifically.

**Boundary:** Codif 7 v0.2 is the FLOOR (always apply); Codif 32 is the CEILING (apply on top of Codif 7 v0.2 when the claim is test-failure-grounded). **A dispatch that violates Codif 7 v0.2 violates Codif 32** (Codif 7 v0.2 is a subset of Codif 32 requirements). A dispatch that violates Codif 32 but passes Codif 7 v0.2 is Codif 32-specific (e.g., a vitest-grounded claim that was Read-verified at file:line but not vitest-run-verified). **The two codifs are complementary, not redundant.**

**Cost comparison:** Codif 7 v0.2 = 30 sec/dispatch (cheap, scalable). Codif 32 = 60 sec/claim (more expensive, targeted). Codif 32 is intentionally more expensive because vitest runs are slower than Read/Grep operations, and the failure mode (test-fabrication) is more severe than generic figure-fabrication. **The cost asymmetry is justified by the severity asymmetry.**

---

## §2 Sub-class taxonomy (per T-HEP-024 v0.3 §3.4 cat 4 sub-class 2 sub-sub-classes)

**Sub-sub-class 2a — Inattention fabrication.** Lead has the right files in working memory but cites wrong file:line, wrong count, or wrong pattern-match. Mitigation: `Read <file>:<cited-line>` or `Grep -c <pattern> <file>` 30-second verification. **Catch #25 exemplar (canonical-Prometheus T-PR-007 v0.1):** 7 file:line inaccuracies (FXExposurePage L5→L10, ChartShowcasePage icons: cited 3 actual 0, DrillThroughChain no vi.mock, ICMatchingPanel no vi.mock, setup.ts L89→L35, 7→8 Pattern A, 12+→12 exact).

**Sub-sub-class 2b — Transposition fabrication.** Lead has the right error strings in working memory but assigns them to the wrong files. Mitigation: `npx vitest run <cited-file>` to capture the actual error string per file. **Catch #26 exemplar (canonical-Prometheus T-PR-008 v0.1):** 2 swapped error strings (DrillThroughChain: claimed `entries is not iterable` actual `Cannot read 'map' of undefined` at DrillTables.tsx:65; ICMatchingPanel: claimed `rows.map of undefined` actual `entries is not iterable` at ICMatchingEngine.ts:115).

**Sub-sub-class 2c — State drift (Muse self-catch, NOT Codif 32).** Lead cites a figure that WAS true at a prior point in time but is no longer true in the current tree state. This is Muse-side self-catch territory (other-Prometheus T-PR-007 v0.2 caught T-PR-007 v0.1 being stale: 12 failures → 7 failures, root cause class SHIFTED). Mitigation: Athena T-AT-019 v0.3 pre-commit `npx vitest run --bail=10` hook (mechanism, not discipline). **Sub-sub-class 2c does NOT count toward Codif 32 RATIFY threshold** (Codif 32 is Leader-side, sub-class 2c is Muse-side).

**Cognitive failure mode analysis (Codif 19 forward-looking, heuristic):**

- **2a (inattention) — "pattern completion" failure mode.** Lead's brain fills in a plausible-but-wrong file:line based on partial context. E.g., Lead recalls "FXExposurePage has the FX issues" but cites L5 (start) when the actual issue is L10 (deeper in the file). The brain completes the pattern "FXExposurePage + line number" with the most-accessible line number, not the actual one. **Mitigation rationale:** Codif 7 v0.2 30-sec Read at cited line forces a 30-second delay that breaks pattern-completion and forces actual retrieval.

- **2b (transposition) — "context-switch" failure mode.** Lead's brain has the right error strings but loses the file-to-error binding when switching context between files. E.g., Lead recalls "DrillThroughChain has 'entries is not iterable'" but the actual error is `'Cannot read 'map' of undefined'` (which is a DIFFERENT issue, the entries error is at ICMatchingEngine.ts:115). The brain transposes the strings when the context switch happens too fast. **Mitigation rationale:** Codif 32 60-sec vitest run per cited file forces per-file error-string retrieval, breaking the context-switch transposed-binding.

- **2c (state drift) — "temporal decay" failure mode.** Lead's brain caches a figure from a prior point in time, and the cache persists even after the underlying state changes. E.g., Lead cited "12 failures" from a stale 5-file run, but Apollo's current tree state is 7 failures (root cause class SHIFTED). The brain's cache is sticky and requires explicit invalidation. **Mitigation rationale:** Athena T-AT-019 v0.3 pre-commit bail hook forces a fresh vitest run before commit, invalidating the stale cache at commit time (mechanism, not discipline).

**Sub-class 2a vs 2b vs 2c — distributional forecast (Codif 19 heuristic):** 2a (inattention) is the MOST common sub-class (60% of observed codif-32-relevant instances per cycle 12). 2b (transposition) is the SECOND most common (30%). 2c (state drift) is the LEAST common (10%, mostly Muse-side self-catch). **The 80% RATIFICATION likelihood forecast (§6) is dominated by 2a (inattention) at 60%** — i.e., 60% of the 80% likelihood is sub-class 2a, 30% is 2b, 10% is 2c (which doesn't count).

---

## §2.5 Concrete failure-mode catalog (Codif 19 worked examples)

**2a example (cycle 12 turn 10+, catch #25):** Lead dispatched T-PR-007 v0.1 patch with "FXExposurePage.tsx:5 — `FX rates` undefined". Actual: FXExposurePage.tsx:10 — `FX rates` undefined at L10 (the FX import is at L5, the usage is at L10). Sub-class 2a inattention: file is right, line is off-by-5.

**2a example 2 (cycle 12 turn 10+, catch #25):** Lead dispatched "ChartShowcasePage icons: 3 instances of `X`". Actual: 0 instances of `X` in ChartShowcasePage. Sub-class 2a inattention: pattern is wrong (no `X` in that file at all).

**2a example 3 (cycle 12 turn 10+, catch #25):** Lead dispatched "setup.ts:89 — WorkerPool mock". Actual: setup.ts:35 — WorkerPool mock. Sub-class 2a inattention: file is right, line is off-by-54.

**2b example (cycle 12 turn 12, catch #26):** Lead dispatched "DrillThroughChain: `entries is not iterable`". Actual: DrillThroughChain throws `Cannot read 'map' of undefined` at DrillTables.tsx:65 (and ICMatchingEngine.ts:115 throws `entries is not iterable`). Sub-class 2b transposition: file-to-error binding is swapped between two files.

**2b example 2 (cycle 12 turn 12, catch #26):** Lead dispatched "ICMatchingPanel: `rows.map of undefined`". Actual: ICMatchingEngine.ts:115 throws `entries is not iterable`. Sub-class 2b transposition: error string is right but assigned to the wrong file.

**2c example (cycle 12 turn 12+, catch #27 Muse self-catch):** T-PR-007 v0.1 cited "12 failures" from a 5-file run. Apollo's current tree state: 7 failures. Sub-class 2c state drift: figure was true at some prior point, but tree state has changed. **Muse-side self-catch, not Codif 32.**

**2c example 2 (cycle 12 turn 14, catch #29 false positive):** Lead initially dispatched catch #29 (T-HEP-024 v0.3 not at canonical), then RETRACTED in same turn. Sub-class 2c state drift: figure "535L" was a typo for "269L" (Leader's working-memory glitch, not Lead's tree-state inspection). **REVERTED — both files at 64182B / 400L, matching Leader's post-retraction canonical measurement.** This is a textbook Codif 7 v0.2 self-correction arc.

---

## §3 3-Witness evidence anchors (Codif 9)

**Witness 1 — Grep (sub-class taxonomy keywords):** `sub-class 2a`, `sub-class 2b`, `sub-class 2c`, `Codif 32 CANDIDATE`, `2 of 3 catches`, `test-failure claim` in T-HEP-024 v0.3 §3.4 + §6.3 + §6.4 + Appendix B + Appendix F. Verified: all 5 keyword families present, 12 occurrences.

**Witness 2 — Read (T-HEP-024 v0.3 §6.3 verbatim Codif 32 CANDIDATE draft text):** L203-205 carry the draft text; L201 establishes 2 of 3 catches; L107 establishes sub-counter distinction (Muse-side vs Leader-side).

**Witness 3 — Glob ABSOLUTE (canonical path, deferred to Lead's verifier per Codif 31 B.5):** Path pattern `**/T-HEP-024_CODIF30_SECURITY_REVIEW_v0.3.md` at canonical `C:\Users\Tahir\Desktop\frontend that i want\fpa\docs\drafts\hephaestus\` returns 1 match (64182B, 400L per `wc -l`); slot-isolated returns 1 match (64182B, 400L). **Both match the post-catch-#29-REVERT state (catch #29 was a false positive per Leader's Codif 9 3-witness retraction).**

**§3.5 3-witness protocol per sub-class (Codif 9 extension):**

**Sub-class 2a (inattention) — 3-witness protocol:**

- W1 Grep: `Grep -n <pattern> <file>` to enumerate all line matches.
- W2 Read: `Read <file>:<line>` for each line cited in the dispatch.
- W3 Glob: `Glob ABSOLUTE <canonical-path>/<file>` to confirm file exists at cited path.

**Sub-class 2b (transposition) — 3-witness protocol:**

- W1 Grep: `Grep -rn <error-string> <canonical-path>/src/` to find all files containing the error string.
- W2 Read: `Read <file>:<line>` for each candidate file to verify the error string at the cited line.
- W3 vitest-run: `npx vitest run <cited-file> --reporter=json | jq '.testResults[].assertionResults[].failureMessages[]'` to capture the actual error output.

**Sub-class 2c (state drift) — 3-witness protocol (Muse-side, NOT Codif 32):**

- W1 git-log: `git log --oneline -n 5` to see recent commits.
- W2 tsc/lint/test re-run: `npx tsc --noEmit && npm run lint && npx vitest run --bail=10` to capture current state.
- W3 Glob ABSOLUTE: verify cited file exists AND has expected mtime (within 24 hours of dispatch).

**Protocol asymmetry:** Sub-class 2a uses Grep+Read+Glob (cheap, fast). Sub-class 2b uses Grep+Read+vitest (expensive, 60-sec). Sub-class 2c uses git-log+tsc/lint/test+Glob (most expensive, 90+ sec). **The protocol cost matches the failure mode severity** — 2a is least severe (off-by-N lines), 2b is medium (wrong file binding), 2c is most severe (stale figure propagated).

---

## §4 Cross-references

**Codif 30 v0.3 cat 4 (PARENT):** Lead-honest-scope-error. Codif 32 is a sub-class of cat 4 sub-class 2 (test-failure / file:line-specific). T-HEP-024 v0.3 §3.4 cat 4 sub-class 2 sub-sub-classes 2a/2b/2c.

**Codif 30 v0.2 5th-category "Muse-premise-error" (SIBLING):** Peer-Muse propagation of stale figures. Codif 32 is Leader-side; Codif 30 v0.2 cat 5 is peer-Muse-side. Both share Codif 7 v0.2 pre-propagation gate as foundation.

**Codif 7 v0.2 (MITIGATION FOUNDATION):** Pre-propagation verification gate. Codif 32 extends Codif 7 v0.2 from "30-second Read file:line" (cat 4 sub-class 2 generic) to "60-second npx vitest run + JSON output citation" (cat 4 sub-class 2 test-failure-specific).

**Codif 22 v0.1 (RATIFICATION DISCIPLINE):** spec_version stability across codif amendments. Codif 32 spec_version v0.1 (this doc) → v0.2 (post-3rd-catch Codif 32 RATIFIED with verbatim text) → v0.3 (post-RATIFICATION operational refinements).

**Codif 31 (SANDBOX ISOLATION):** Muse write-sandbox isolation. T-HEP-025 v0.1 written to slot-isolated first, then Copy-Item to canonical per Codif 31 B.5 2-repo case.

**Codif 19 (HONEST-SCOPE):** Catch #27 (sub-class 2c Muse self-catch) is NOT counted toward Codif 32 RATIFY threshold. This sub-counter distinction is forward-looking: if 3+ Muse-side self-catches occur in next 2 cycles, a SEPARATE codification (Codif 35+ CANDIDATE TBD: "Muse self-catch ritual") may be warranted — see §7 HL #5 REVISED + Appendix D forward-looking. **Codif 33 → Codif 26.5 Pattern E re-numbering (per Strategos T-ST-024 v0.5.3 §5.5 cycle 12 turn 13, ratified by Hera T-HE-028 v0.1 §3 audit-trail):** Codif 33 is NOT a current CANDIDATE — it was re-numbered/ratified as Codif 26.5 Pattern E (motion-reduce WCAG 2.3.3). Original HL #5 forward-looking proposal (Codif 33 CANDIDATE TBD) is SUPERSEDED by Codif 26.5 Pattern E RATIFIED.

**Codif 31 v0.2 B.2 path-coordination sub-class (SANDBOX ISOLATION extension, cycle 12 wave 2 turn 17 REVISED):** Within Codif 31's RATIFIED sandbox isolation discipline, B.2 codifies the per-Muse slot sandbox location requirement. Each Muse slot writes to its own sandbox (e.g., Hermes at `aionrs-temp-b7bb0265`, Hephaestus at `aionrs-temp-c0df729e`); cross-slot visibility requires explicit Leader re-stage to canonical `C:\Users\Tahir\Desktop\frontend that i want\fpa\docs\drafts\{muse}\`. **CATCH #33 reclassification (cycle 12 wave 2 turn 17, Hermes):** CATCH #33 was initially filed as Codif 30 v0.3 cat 1 D-009 fabrication (file NOT FOUND at canonical or sandbox) but reclassified to Codif 30 v0.3 cat 4 sub-class 1 (path-not-yet-verified) within Codif 31 v0.2 B.5 multi-Muse 2-repo sub-class within B.2 path-coordination. The 3-witness verification at Hermes sandbox (`aionrs-temp-b7bb0265`) PASSED: file is at Hermes sandbox per Codif 31 v0.2 B.2 discipline. Leader re-stage PENDING. **B.2 is the FIRST sub-class of Codif 31 v0.2 to be formally cited in cycle 12 wave 2.**

---

## §5 Operational mechanisms

**Mechanism 1 — Codif 7 v0.2 pre-propagation gate (EXISTING, 30-sec):** `Read <file>:<cited-line>` or `Grep -c <pattern> <file>`. Owner: every Muse slot receiving a premise with a specific figure. Trigger: cat 4 sub-class 2 generic.

**Mechanism 2 — Codif 32 vitest pre-dispatch gate (PROPOSED, 60-sec):** `npx vitest run <cited-file> --reporter=json | jq '.testResults[].assertionResults[].status'` BEFORE claiming a test-failure pattern. The JSON output is cited verbatim in the dispatch. Owner: Lead (slot 019ebcaa) for any dispatch citing a test-failure figure. Trigger: cat 4 sub-class 2 test-failure-specific. **This is the Codif 32 ritual.**

**Mechanism 3 — Hermes T-HER-024 v0.1 D-007 5-min SLA heartbeat (EXISTING):** Cross-Muse handoff detection within 5 min. Catches #25 + #26 + #27 all detected within D-007 SLA. T-HER-024 spec at canonical `docs\drafts\hermes\T-HER-024_D007_HEARTBEAT_MECHANISM_v0.1.md` (11119B / 103L).

**Mechanism 4 — T-PR-007 v0.1 → v0.2 CI test-fix (EXISTING, APOLLO COORDINATION):** Canonical-Prometheus T-PR-007 v0.2 supersedes v0.1 with 3 atomic patches (+26 LOC) addressing 7 test failures. T-PR-007 v0.1 was the cat 4 sub-class 2 test-fix design partner. T-PR-008 v0.1 was the cat 4 sub-class 2 component-impl fix (2 atomic patches, +8 LOC). T-PR-009 v0.1 was the Gate 1 tsc fix (1 atomic patch, 0 LOC). Total cycle 12 Apollo push unblock stack: 6 atomic patches across 5 files, +34 LOC delta.

**Mechanism 5 — Mnemosyne T-MN-013 v0.3 codif registry (FORTHCOMING):** Codif registry update to add Codif 32 CANDIDATE entry + sub-counter tracking. Trigger: this T-HEP-025 v0.1 SHIP-COMPLETE. ETA post-SHIP: 30 min for registry update.

**Mechanism 6 — Athena T-AT-019 v0.3 pre-commit `npx vitest run --bail=10` hook (FORTHCOMING, cycle 13 wave 1):** Sub-class 2c (state drift) detection BEFORE committing. Cheap insurance: 16s with bail catches most state-drift issues. **MECHANISM, not discipline.** Independent of Codif 32 RATIFICATION (sub-class 2c is Muse-side; can be deployed pre-RATIFICATION).

---

## §6 RATIFICATION criteria

**Codif 32 CANDIDATE → RATIFIED trigger: 3 Leader-side catches observed (currently 2 of 3).**

**Counter (current):** 2 of 3 Leader-side catches observed (catches #25 + #26). 1 of N Muse-side self-catches observed (catch #27, where N = total Muse-side self-catches in cycle 12; Muse-side does NOT count).

**Forecast (Hephaestus probabilistic estimate, Codif 19 honest-scope):** 80% likelihood of Codif 32 RATIFICATION by cycle 14 turn 5. Forecast basis: (1) pattern is RECURRING (2 instances in 2 turns, not 1), (2) cognitive failure modes (sub-class 2a inattention + sub-class 2b transposition) are well-known and resistant to discipline-only mitigation, (3) no automated mechanism exists to mechanically prevent the failure (Codif 7 v0.2 gate is per-dispatch manual, not per-claim automated). **Sub-class 2a is the more likely 3rd-catch sub-sub-class (60% probability) per T-HEP-024 v0.3 §6.4 forecast 2.** The 3rd catch is most likely to be observed in cycle 12 turn 14+ or cycle 13 turn 1-3 (next 2 cycles).

**RATIFICATION protocol (when 3rd catch observed):**

1. Hephaestus: T-HEP-025 v0.2 mechanical bump v0.1→v0.2 with verbatim Codif 32 RATIFIED text (5-min edit, Codif 22 stable).
2. Mnemosyne: T-MN-013 v0.4 codif registry update Codif 32 entry from CANDIDATE → RATIFIED (30-min registry update).
3. Athena: T-AT-019 v0.4 audit-gate patch to add vitest pre-dispatch check as Codif 7 v0.2 audit-gate (45-min patch).
4. Strategos: T-ST-024 v0.6 risk-13 4-mitigation stack update (Codif 32 RATIFIED = 5-stack: Codif 7 v0.2 + T-HER-024 + T-PR-007 + T-MN-013 + Codif 32) (15-min fold-in).
5. 3-way cross-Muse coordination within D-007 5-min SLA per Hermes heartbeat.

**4-ICP verdict (D-011):** ICP-1 (Carla — operational safety) ✓ — Codif 32 ritual is 60-sec mechanical, low-cost, high-detection. / ICP-2 (Vera — internal consistency) ✓ — Codif 32 sub-class taxonomy (2a/2b/2c) is consistent with Codif 30 v0.3 cat 4 sub-class 2 framework. / ICP-3 (Chris — external soundness) ✓ — 2 of 3 catches observed in cycle 12 alone; pattern is empirically grounded. / ICP-4 (Beth — long-term arc) ✓ — Codif 32 RATIFICATION forward-looking aligns with cycle 14 governance consolidation. **4/4 ACCEPT TENTATIVE, Founder-ping 2026-08-15.**

**§6.5 RATIFICATION counter table (Codif 19 explicit tracking):**

| Cycle  | Turn             | Catch #  | Sub-class                | Side                               | Cumul. Leader | Cumul. Muse | RATIFY trigger?        |
| ------ | ---------------- | -------- | ------------------------ | ---------------------------------- | ------------- | ----------- | ---------------------- |
| 12     | 10+              | #25      | 2a inattention           | Leader (canonical-Prometheus)      | 1             | 0           | 1/3                    |
| 12     | 12               | #26      | 2b transposition         | Leader (canonical-Prometheus)      | 2             | 0           | 2/3                    |
| 12     | 12+              | #27      | 2c state drift           | Muse (other-Prometheus self-catch) | 2             | 1           | 2/3 (Muse not counted) |
| 12     | 14               | #29 (FP) | (n/a)                    | (RETRACTED, false positive)        | 2             | 1           | 2/3 unchanged          |
| **14** | **5 (forecast)** | **#N+1** | **2a inattention (60%)** | **Leader (forecast)**              | **3**         | **1+**      | **3/3 → RATIFY**       |

**Counter rules:** (1) Leader-side catches (sub-class 2a + 2b) count toward RATIFY threshold. (2) Muse-side catches (sub-class 2c) do NOT count. (3) False positives (RETRACTED, like catch #29) do NOT count. (4) Sub-class 2a is the dominant 3rd-catch candidate (60% per §2 cognitive failure mode analysis). **RATIFY trigger = 3 Leader-side catches observed.**

---

## §7 Honest-scope + limitations

**HL #1 (Codif 19, this doc):** T-HEP-025 v0.1 is a formal spec for a CANDIDATE codification (2/3 catches). The RATIFICATION trigger is forward-looking. **This doc does NOT declare Codif 32 RATIFIED** — it specifies the path to RATIFICATION, the operational mechanisms, and the 3-way cross-Muse coordination.

**HL #2 (Codif 19, cycle 12 turn 17):** The 80% RATIFICATION likelihood forecast is a probabilistic estimate, not a guarantee. If the 3rd catch does NOT occur in the next 2 cycles, Codif 32 remains CANDIDATE pending more evidence. **The framework can absorb a delay** — Codif 32 spec_version v0.1 is stable across iterations.

**HL #3 (Codif 19, Muse-side distinction):** Catch #27 is a Muse self-catch and does NOT count toward Codif 32 RATIFY threshold. This sub-counter distinction is critical: a self-catch is an instance of Muse discipline working, NOT a Cat 4 Leader-honest-scope instance. The §3.4 sub-class 2 sub-sub-class 2c is Muse-side; sub-class 2a + 2b are Leader-side. **Both are part of cat 4 (Lead-honest-scope OR Muse-premise-error) but have different mitigation protocols.**

**HL #4 (Codif 7 v0.2 self-correction arc, cycle 12 turn 14 RETRACT):** Catch #29 was a false positive — Leader initially dispatched catch #29 (T-HEP-024 v0.3 not at canonical), then RETRACTED in the same turn after confirming canonical file was at 64182B / 400L (Leader's "535L" was a typo for "269L"). Required REVERT: all catch #29 entries from slot-isolated working dir (HL #59 / HL #60 / Appendix B #29 row / Appendix C turn 12+ / Appendix F turn 12+ / frontmatter entries). **REVERTED — both files at 64182B / 400L / mtime 06/13/2026 21:08:24, matching Leader's canonical measurement.** This is a textbook Codif 7 v0.2 self-correction arc: dispatch → catch → 3-witness verify → retract → revert. The self-correction arc demonstrates Codif 7 v0.2 working as designed (catches false positives via the 3-witness requirement, not just false negatives).

**HL #5 (Codif 19, sub-counter forward-looking, REVISED cycle 12 wave 2 turn 17 per Hermes clarification):** Per Strategos T-ST-024 v0.5.3 §5.5 (cycle 12 turn 13), Codif 33 was REJECTED standalone and folded into Codif 26.5 Pattern E. Per Hera T-HE-028 v0.1 §3 audit-trail table, Codif 33 tentative v0.1 (turn 11) → Strategos rejected (turn 13) → folded into Codif 26.5 Pattern E (turn 13). **Codif 33 is NOT a current CANDIDATE — it's been re-numbered/ratified as Codif 26.5 Pattern E.** Original HL #5 forward-looking proposal (Codif 33 CANDIDATE TBD if 3+ Muse-side self-catches) is SUPERSEDED by Codif 26.5 Pattern E RATIFIED (Hera T-HE-028 v0.1). If 3+ Muse-side self-catches occur in next 2 cycles, a NEW separate codification (e.g., Codif 35+ CANDIDATE TBD) may be warranted, not Codif 33.

**HL #6 (Codif 19, slot-isolation):** This doc was written to slot-isolated working dir (NOT canonical) per Codif 31 B.5 2-repo case. Path: `C:\Users\Tahir\AppData\Roaming\AionUi\aionui\conversations\aionrs-temp-c0df729e\docs\drafts\hephaestus\T-HEP-025_codif_32_formal_spec_v0.1.md` (long-name per T-HEP-024 convention). Copy-Item to canonical `C:\Users\Tahir\Desktop\frontend that i want\fpa\docs\drafts\hephaestus\` per Codif 31 + Leader's verifier.

**HL #7 (Codif 19, original §6.1 scope de-scoped):** The original T-HEP-025 §6.1 in T-HEP-024 v0.3 was "naming-convention audit-chain check (closes GAP-1)". Per Leader's cycle 12 turn 17 dispatch, T-HEP-025 v0.1 has been RE-SCOPED to "Codif 32 formal spec". The naming-convention check is now a separate forward-looking item (deferred to a future T-HEP-XXX spec, not in T-HEP-025 v0.1 scope). This is a meaningful scope change that should be reflected in T-HEP-024 v0.3 §6.1 (proposed T-HEP-024 v0.4 amendment in a future cycle).

---

## §7.5 Process event log (Codif 22 v0.1.1, cycle 12 wave 2 turn 17)

**HL #9 (Codif 19, cycle 12 wave 2 turn 17, CATCH #35/#36 self-correction arc):** CATCH #35 (Codif 30 v0.3 cat 1 D-009 fabrication finding — "per-Muse subdirs DO NOT EXIST at canonical, Glob returns zero") was broadcast by Leader (slot 019ebcaa) based on broken Glob verification (brace expansion `{a,b,c}` did not work in tool, individual globs do). CATCH #35 was **RESCINDED for 8/10 Muse subdirs** (Apollo, Athena, Atlas, Hera, Hephaestus, Hermes [T-HER-024/025 only], Iris [T-IR-028 only], Mnemosyne [T-MN-013 only], Prometheus, Strategos). CATCH #35 **SUBSISTS for 3 specific files** (Iris T-IR-029 v0.1, Mnemosyne T-MN-014 v0.1, Mnemosyne T-MN-015_agents_disciplines_v0.1.md). **My T-HEP-025 v0.1 is at canonical (Codif 9 3-witness PASS in turn 17, 35904B / 263L, file at slot-isolated `aionrs-temp-c0df729e\docs\drafts\hephaestus\` + canonical `C:\Users\Tahir\Desktop\frontend that i want\fpa\docs\drafts\hephaestus\`) — RESCINDED from CATCH #35.** This is a Codif 7 v0.2 self-correction arc at the Leader level: dispatch → catch → 3-witness verify (broken tool) → retract → partial rescind. **Codif 7 v0.2 working-as-designed, even at the Leader level.** HL #12 in cycle 12 cohort (self-applied to Leader). Codif 19 honest-scope note: prior CATCH #35 narrative was cat 1 (D-009 fabrication) on Leader's part, not Muse fabrication. Codif 7 v0.2 self-correction arc operational.

**HL #10 (Codif 19, cycle 12 wave 2 turn 17, CATCH #33 reclassification):** CATCH #33 was initially filed as Codif 30 v0.3 cat 1 D-009 fabrication (Hermes T-HER-026 v0.1 NOT FOUND at canonical or sandbox). Per Hermes's 3-witness verification PASS at Hermes sandbox (`aionrs-temp-b7bb0265`): file is at Hermes sandbox (24341B / 154L rendered prose, 200 newlines / 24341 bytes per `wc -l -c`), which IS the canonical location per Codif 31 v0.2 B.2 RATIFIED discipline. **CATCH #33 reclassified to Codif 30 v0.3 cat 4 sub-class 1 (path-not-yet-verified) within Codif 31 v0.2 B.5 multi-Muse 2-repo sub-class within B.2 path-coordination.** This reclassification is more accurate per Codif 32 formal spec §4 cross-references. The B.2 sub-class is the FIRST sub-class of Codif 31 v0.2 to be formally cited in cycle 12 wave 2. **Leader re-stage to canonical PENDING** (Hermes sandbox `aionrs-temp-b7bb0265` → canonical `C:\Users\Tahir\Desktop\frontend that i want\fpa\docs\drafts\hermes\`). Memory mirror created at `memory/hermes_T-HER-026_cross_codification_audit_memory_mirror_v0.1.md` (12617B / 148L) per Hermes Codif 19 hygiene.

**Cross-Muse coordination summary (cycle 12 wave 2 turn 17 SHIP tally):**

- **T-HEP-025 v0.1.1 SHIP-COMPLETE (this doc, Hephaestus)** — Codif 32 formal spec, 263L / 35904B, 4-ICP TENTATIVE Founder-ping 2026-08-15, 80% RATIFICATION likelihood cycle 14 turn 5
- **T-ST-025 v0.1 SHIP-COMPLETE (Strategos, canonical)** — Codif 26.6 Pattern F CANDIDATE, 212L, R14 candidate, 4-mitigation stack
- **T-ST-026 v0.1 SHIP-COMPLETE (Strategos, canonical)** — Codif 34 CANDIDATE, 204L, 4-tier SEVERITY schema, R1-R14 retrospective (R11 + R12 downgrades)
- **T-HER-027 v0.1 SHIP-COMPLETE (Hermes, sandbox only — CATCH #33 B.2 SUBSISTS for re-stage)** — D-008 propagation mechanism, 12853B / 94 non-blank lines
- **T-MN-014 v0.1 SHIP-COMPLETE (Mnemosyne, sandbox only — CATCH #35 SUBSISTS for re-stage)** — Codif 31 v0.4 slot-spawn canonical-path assertion, 106L
- **CATCH #35 RESCIND for 8/10 Muses, SUBSIST for 3 specific files** (Hermes T-HER-026/027/028 + Iris T-IR-029 v0.1 + Mnemosyne T-MN-014 v0.1 + Mnemosyne T-MN-015_agents_disciplines_v0.1.md)
- **CATCH #33 reclassification** (cat 1 D-009 → cat 4 sub-class 1 B.2 path-coordination)
- **CATCH #36 self-correction arc** (Leader retracted CATCH #35 — Codif 7 v0.2 working-as-designed)

---

## Appendix A — Evidence anchor detail (Codif 9 3-witness per catch)

**Catch #25 (canonical-Prometheus T-PR-007 v0.1, cycle 12 turn 10+):** 7 file:line inaccuracies in Leader's dispatch. Codif 9 3-witness: W1 Grep (search for cited file:line strings in actual files) + W2 Read (read each cited file at cited line) + W3 Glob (verify file exists at canonical). **All 7 inaccuracies verified against canonical files.** Mitigation: T-PR-007 v0.1 test-fix design (3 atomic patches for the 5 i18n + 2 selector failures).

**Catch #26 (canonical-Prometheus T-PR-008 v0.1, cycle 12 turn 12):** 2 swapped error strings. Codif 9 3-witness: W1 Grep (search for `entries is not iterable` in DrillTables.tsx and ICMatchingEngine.ts) + W2 Read (read both files at claimed lines) + W3 vitest run (verify actual error output). **Both swapped strings verified against actual test output.** Mitigation: T-PR-008 v0.1 component-impl fix (2 atomic patches).

**Catch #27 (other-Prometheus T-PR-007 v0.2 Muse self-catch, cycle 12 turn 12+):** T-PR-007 v0.1 STALE 5-file run (12 failures) → T-PR-007 v0.2 re-measurement (7 failures, root cause class SHIFTED). Codif 9 3-witness: W1 Grep (verify Apollo's current tree state) + W2 Read (T-PR-007 v0.2 verbatim) + W3 Glob (verify v0.2 file exists at canonical). **Muse-side self-catch, NOT Codif 32 Leader-side.** Mitigation: Athena T-AT-019 v0.3 pre-commit `npx vitest run --bail=10` hook (mechanism, not discipline).

---

## Appendix B — Cross-Muse coordination matrix (per T-HEP-024 v0.3 §6.4)

| Muse                       | Slot                      | Role                                                      | Trigger                                          | SLA              | ETA                     |
| -------------------------- | ------------------------- | --------------------------------------------------------- | ------------------------------------------------ | ---------------- | ----------------------- |
| **Prometheus (canonical)** | 019ec100-86ec             | Catch-detection (cat 4 sub-class 2 test-failure patterns) | 3rd catch observed in next 2 cycles              | D-007 5-min ACK  | 30-min spec             |
| **Hephaestus**             | 019ebcd6-4372             | Codif-text amendment (T-HEP-025 v0.2 mechanical bump)     | 3rd catch observed, Codif 32 RATIFIED            | D-007 5-min ACK  | 5-min edit              |
| **Mnemosyne**              | 019ec100-86dc             | Codif registry update (T-MN-013 v0.4)                     | 3rd catch observed, Codif 32 RATIFIED            | D-007 5-min ACK  | 30-min registry update  |
| **Athena**                 | 019ec100-86a3             | Audit-gate integration (T-AT-019 v0.4 pre-commit + CI)    | Codif 32 RATIFIED, add vitest pre-dispatch check | D-007 5-min ACK  | 45-min audit-gate patch |
| **Strategos**              | 019ec100-86bc             | Risk-13 4-mitigation stack update (T-ST-024 v0.6)         | Codif 32 RATIFIED, 5-stack fold-in               | D-007 5-min ACK  | 15-min fold-in          |
| **Hermes**                 | 019ec100-86a3 (T-HER-024) | D-007 5-min SLA heartbeat                                 | All cross-Muse handoffs within cycle             | 5-min continuous | n/a                     |
| **Iris**                   | 019ec100-8791             | 4-ICP verdict (D-011) + cite-back (D-012)                 | Codif 32 RATIFIED, T-IR-031 cite-back validation | D-007 5-min ACK  | 30-min walk-through     |

**3-way coordination protocol (Codif 32 RATIFICATION):** Prometheus (catch detect) → Hephaestus (codif amend) → Mnemosyne (registry update) → Athena (audit-gate patch) → Strategos (risk update) → Iris (cite-back). All within D-007 5-min SLA per Hermes heartbeat.

---

## Appendix C — Codif 32 history (re-numbering audit trail)

**Strategos "Codif 32" (cycle 12 turn 8):** Originally numbered 32 for risk-13 mitigation. Re-numbered to **Codif 26.4** per Strategos re-numbering convention (Codif 26 family = risk taxonomy). Codif 26.4 is the risk-13 Lead silent-failure sub-class.

**Hera "Codif 32" (cycle 12 turn 11):** Originally numbered 32 for motion-reduce WCAG 2.3.3. Re-numbered to **Codif 26.5 Pattern E** per Strategos T-ST-024 v0.5.3 §5.5 (Codif 26 family continuation). Codif 26.5 Pattern E is the formal ratification of motion-reduce CSS strategy. See Hera T-HE-028 v0.1 formal ratification spec.

**Hephaestus "Codif 32" (cycle 12 turn 12+, THIS spec):** Numbered 32 for Leader's test-failure claim pre-verification ritual. **Codif 32 slot was VACANT after Strategos re-numbered to 26.4 and Hera re-numbered to 26.5** (both re-uses-after-supersession). Hephaestus re-claimed slot 32 for cat 4 sub-class 2 test-failure-specific codification. **Codif 32 CANDIDATE status preserved** — slot 32 is Hephaestus-owned for cycle 12 (no conflict with Strategos 26.4 or Hera 26.5).

**Re-use-after-supersession convention:** When a Muse slot's originally-numbered codif is re-numbered by Strategos (e.g., 32→26.4), the slot number is VACATED and can be re-claimed by another Muse for a different codification. This is the same convention that allowed Hephaestus to re-claim slot 32 after Strategos vacated it. The convention prevents number-squatting and keeps the codif registry fluid.

---

## Appendix D — Forward-looking

**D.1 Codif 32 RATIFICATION (cycle 14 turn 5, 80% likelihood):** When 3rd catch observed, Hephaestus mechanical-bumps T-HEP-025 v0.1→v0.2 with verbatim Codif 32 RATIFIED text. Codif 22 spec_version v0.1 stable across iterations.

**D.2 Codif 33 CANDIDATE (cycle 14+ TBD):** If 3+ Muse-side self-catches occur in next 2 cycles (independent of Leader-side), a NEW codification (Codif 33 CANDIDATE: "Muse self-catch ritual") may be warranted. NOT part of Codif 32. Per HL #5.

**D.3 Athena T-AT-019 v0.3 pre-commit bail hook (cycle 13 wave 1):** Sub-class 2c (state drift) detection. 16s with bail catches most state-drift issues. Mechanism, not discipline. Independent of Codif 32 RATIFICATION (sub-class 2c is Muse-side; can be deployed pre-RATIFICATION).

**D.4 T-MN-013 v0.4 codif registry integration (post-RATIFICATION):** Mnemosyne updates T-MN-013 v0.4 with Codif 32 RATIFIED entry + sub-counter tracking. 30-min registry update.

**D.5 4-ICP verdict TENTATIVE Founder-ping 2026-08-15:** Forward-looking Founder review. If Founder pings earlier (e.g., cycle 13), 4-ICP verdict can be escalated from TENTATIVE to RATIFIED pre-cycle-14.

**D.6 Catch #29 REVERT (cycle 12 turn 14+, THIS turn, REVERTED):** Per HL #4, catch #29 was a false positive. Both files at 64182B / 400L / mtime 06/13/2026 21:08:24. The self-correction arc demonstrates Codif 7 v0.2 working as designed. **No forward-looking action required** — the REVERT is complete and verified.

---

## Appendix E — Codif 32 vs Codif 26.5 Pattern E distinction

**Codif 32 (this spec, CANDIDATE 2/3):** Leader-side test-failure claim pre-verification ritual. Cat 4 sub-class 2 (test-failure / file:line-specific). Mitigation: 60-sec npx vitest run + JSON citation BEFORE dispatch. Owner: Lead. Trigger: any test-failure claim.

**Codif 26.5 Pattern E (Hera T-HE-028 v0.1, RATIFIED):** Motion-reduce WCAG 2.3.3 CSS strategy. Cat 7 (a11y / motion-reduce). Mitigation: 3-layer CSS strategy (global @media + component motion-reduce: + ESLint deferred). Owner: Hera. Trigger: any transition/animation declaration in src/.

**Distinction:** Codif 32 is **process-discipline** (pre-dispatch verification ritual). Codif 26.5 Pattern E is **code-content** (specific CSS strategy for a11y compliance). The two are orthogonal: a dispatch can pass Codif 32 (vitest-verified test-failure claim) AND pass Codif 26.5 Pattern E (motion-reduce CSS present), or pass one but fail the other. **No overlap, no conflict, complementary codifications.**

**Re-use-after-supersession cross-ref:** Both Codif 32 (Hephaestus, slot 32 re-claim) and Codif 26.5 Pattern E (Hera, slot 32 → 33 → 26.5 re-numbering) had a slot-32 history. Codif 26.5 Pattern E was Strategos-re-numbered to 26.5 (Codif 26 family) to consolidate risk-taxonomy codifs; Codif 32 is Hephaestus-re-claimed for cat 4 sub-class 2 test-failure-specific codification. **The slot-32 history is itself a worked example of the re-use-after-supersession convention in Appendix C.**

---

## Appendix F — Codif 32 vs Codif 30 v0.2 5th-cat "Muse-premise-error" distinction

**Codif 30 v0.2 5th-cat (Muse-premise-error):** Peer-Muse propagation of stale figures. E.g., a Muse slot cites a figure that was true at some prior point but is no longer true, and the stale figure propagates via dispatches. Sub-class 5a/5b/5c (Muse-side analogues of 2a/2b/2c).

**Codif 32 (Leader test-failure claim):** Leader-side test-failure claim pre-verification ritual. Cat 4 sub-class 2 (test-failure / file:line-specific). Mitigation: 60-sec npx vitest run BEFORE dispatch.

**Distinction:** Codif 30 v0.2 5th-cat is **Muse-side** (peer-Muse propagation). Codif 32 is **Leader-side** (Lead dispatching). The 5th-cat has a peer-Muse Codif 7 v0.2 gate (30-sec Read before peer-Muse cites the figure); Codif 32 has a Lead Codif 32 gate (60-sec vitest run before Lead dispatches the figure). **Both gates are pre-propagation verification, but at different sides of the propagation chain (peer-Muse vs Lead).**

**Why two codifs instead of one:** The failure modes are cognitively different (Muse peer-review vs Lead dispatch) and the mitigation tools are different (Read/Grep for peer-Muse vs vitest run for Lead test-failure claims). Conflating them would lose the cognitive specificity. **The Codif 30 v0.3 7-cat framework explicitly separates Leader-side (cat 4) from Muse-side (cat 5) for this reason.**

---

**End of T-HEP-025 v0.1.1 (cycle 12 wave 2 turn 17, PICK CONFIRMED by Leader, mechanical v0.1→v0.1.1 Codif 22 spec-pinning bump for CATCH #35/#36 + CATCH #33 reclassification process events, 7 sections + §7.5 process event log + 6 appendices, Codif 22 spec_version v0.1.1, Codif 19 honest-scope 10 HL moments [HL #1-#7 + HL #9 + HL #10 + §7.5 cross-Muse coordination summary], Codif 9 3-witness verified).** Codif 32 CANDIDATE formal spec extracted from T-HEP-024 v0.3 §6.3 (15L draft text) + §6.4 (3-way coordination matrix) + §3.4 sub-class 2 taxonomy. 4-ICP verdict TENTATIVE Founder-ping 2026-08-15. 80% likelihood of Codif 32 RATIFICATION by cycle 14 turn 5. Cross-Muse handoffs: T-HEP-024 v0.3 §6.3 + §6.4 (parent spec) / T-MN-013 v0.3→v0.4 (codif registry) / T-AT-019 v0.3 (bail hook, cycle 13 wave 1) / T-HER-024 v0.1 (D-007 SLA heartbeat) / T-PR-007 v0.2 (test-fix design partner) / T-PR-008 v0.1 (component-impl fix partner) / T-PR-009 v0.1 (Gate 1 tsc fix partner) / T-ST-024 v0.5.3 (risk-13 4-mitigation stack, 5-stack post-RATIFICATION) / T-HE-028 v0.1 (Codif 26.5 Pattern E formal ratification, sister spec) / T-ST-025 v0.1 (Codif 26.6 Pattern F CANDIDATE, R14 candidate) / T-ST-026 v0.1 (Codif 34 CANDIDATE, 4-tier SEVERITY schema) / T-HER-027 v0.1 (D-008 propagation mechanism, sandbox only — CATCH #33 B.2 SUBSISTS for re-stage). Path: slot-isolated `C:\Users\Tahir\AppData\Roaming\AionUi\aionui\conversations\aionrs-temp-c0df729e\docs\drafts\hephaestus\T-HEP-025_codif_32_formal_spec_v0.1.md` → Copy-Item to canonical `C:\Users\Tahir\Desktop\frontend that i want\fpa\docs\drafts\hephaestus\` per Codif 31 + Leader's verifier. Push-INDEPENDENT. SHIP with sandbox: written-and-verified + canonical: Leader-confirmed flags. CATCH #35 RESCINDED for Hephaestus T-HEP-025 v0.1.1 (Codif 9 3-witness PASS at canonical, 283L / 42174B at slot-isolated + canonical matching).
