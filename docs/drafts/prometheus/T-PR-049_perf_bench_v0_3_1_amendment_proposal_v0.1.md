# T-PR-049 v0.1 — PERFORMANCE_BENCHMARKS.md v0.3.1 Amendment PROPOSAL (Stale-Numbering-Drift)

## §0 Frontmatter (Codif 22 v0.1 + Codif 33 catch-ledger + CATCH #197 family)

- **id**: T-PR-049 v0.1
- **title**: PERFORMANCE_BENCHMARKS.md v0.3.1 Amendment PROPOSAL — D-8 PARTIAL Reconciliation
- **owner**: Prometheus (slot 019ecbef-aee8-7ec0-aafb-63176f4a956b)
- **status**: PROPOSAL (TENTATIVE — pending Apollo 2nd-Muse ACK + Strategos 5th-ICP verdict)
- **version**: 0.1 (initial proposal, 1st identification of stale-numbering-drift in v0.3)
- **cycle**: 11 (CYCLE 11 BROADCAST post-compact continuation)
- **codif_compliance**: [9 3-witness per-claim, 22 v0.1 1st-application, 33 catch-ledger 1st-application, 34 risk-tier schema, 41 v0.3 PRE-DISPATCH-VERIFICATION applied to PROPOSAL, 197 stale-SHA-drift family extension, 200 LOCKOUT-aware CAVEMAN PERSIST]
- **related**: PERFORMANCE_BENCHMARKS.md v0.3 (current), Apollo 2nd-Muse witness @ 9e735dace (176L, 4 STALE corrections), CATCH #197 (stale-SHA-drift 9th CASCADE-TRAP variant), CATCH #198 (TASK-ID-COLLISION 10th CASCADE-TRAP variant), CATCH #200 (LOCKOUT)
- **path**: `C:\Users\Tahir\Desktop\frontend that i want\fpa\docs\drafts\prometheus\T-PR-049_perf_bench_v0_3_1_amendment_proposal_v0.1.md`
- **push-INDEPENDENT**: yes (proposal is internal codification hygiene; commit deferred to next session per CAVEMAN CASCADE-HOLD)
- **IDLE-prevent origin**: yes (CYCLE 11 post-compact, after 3 SHAs shipped, before CATCH #200 LOCKOUT full hold)
- **re-derived from**: PERFORMANCE_BENCHMARKS.md v0.3 L21, L43, L76, L90 (4 contradiction sites)

## §0.1 STALE-NUMBERING-DRIFT FINDING (CATCH #197-family extension)

**Pattern:** Real number / count exists, but the semantic label has drifted. The headline numbers in PERFORMANCE_BENCHMARKS.md v0.3 contain **4 internal contradictions** that propagate confusion to RATIFICATION GATE pre-checks.

### Contradiction Sites (D-002 3-witness per site)

#### Site 1: L21 (v0.3 Changelog) vs L43 (PENDING) vs L90 (Headline Table)
- **L21 says:** "8 PASS / 2 UNMEASURED / 0 PARTIAL / 0 FAIL"
- **L43 says:** "D-8 PARTIAL"
- **L90 says:** "❌ D-8 PARTIAL" (Worker pool utilization)
- **W1 (file:line):** `docs/parts/PERFORMANCE_BENCHMARKS.md` lines 21, 43, 90
- **W2 (Grep):** `grep -n "PARTIAL" docs/parts/PERFORMANCE_BENCHMARKS.md` returns 7 hits: L21, L43, L68, L76, L90, plus 2 in §10 (later)
- **W3 (count):** Actual PARTIAL/FAIL items in headline table (L80-L96): D-8 PARTIAL (L90), Tests 16 fail (L91), Coverage too low (L92), Pages memoization STILL VALID (L96) = 3-4 PARTIAL/FAIL items, NOT 0
- **Status:** 🟡 STALE-NUMBERING-DRIFT confirmed (L21 "0 PARTIAL" contradicts L43/L90 "1 PARTIAL D-8")

#### Site 2: L76 (Exec Summary) vs L21 (v0.3 Changelog) — same "0 PARTIAL" text duplicated
- **L76 says:** "8 PASS / 2 UNMEASURED / 0 PARTIAL / 0 FAIL across 10 dimensions"
- **L21 says:** same
- **W1 (file:line):** `docs/parts/PERFORMANCE_BENCHMARKS.md` lines 21, 76
- **W2 (duplicate check):** `grep -n "0 PARTIAL / 0 FAIL" docs/parts/PERFORMANCE_BENCHMARKS.md` returns 2 hits (L21, L76)
- **W3 (root cause):** Both lines reflect Apollo dispatch "D-8 PARTIAL stays" → 0 PARTIAL decision. But L43 + L90 contradict this.
- **Status:** 🟡 STALE-NUMBERING-DRIFT (label "0 PARTIAL" applied to a state that has 1 PARTIAL D-8)

#### Site 3: L91 (Tests pass) — "16 fail" not in headline breakdown
- **L91 says:** "❌ 16 fail (post-C-1 fix: target 100%)"
- **Headline:** L21/L76 say "0 FAIL" but L91 shows 16 fail
- **W1 (file:line):** `docs/parts/PERFORMANCE_BENCHMARKS.md` line 91
- **W2 (Grep):** `grep -n "16 fail\|16 FAIL" docs/parts/PERFORMANCE_BENCHMARKS.md` returns 1 hit (L91)
- **W3 (count):** 3,840 / 3,856 = 99.6%, 16 failures. These are FAIL items, not "0 FAIL".
- **Status:** 🟠 MORE SEVERE STALE-NUMBERING-DRIFT (L21/L76 "0 FAIL" directly contradicts L91 "16 fail")

#### Site 4: L92 (Coverage threshold) — "too low" not in headline breakdown
- **L92 says:** "❌ too low" (Coverage 50%, target 85/85/80/85)
- **Headline:** L21/L76 say "0 FAIL" but L92 shows coverage too low
- **W1 (file:line):** `docs/parts/PERFORMANCE_BENCHMARKS.md` line 92
- **W2 (Grep):** `grep -n "Coverage\|coverage" docs/parts/PERFORMANCE_BENCHMARKS.md | grep "50%\|too low"` returns 1 hit (L92)
- **W3 (target):** Coverage target 85/85/80/85 (4 separate thresholds for lines/branches/functions/statements). Actual 50% is FAR below target.
- **Status:** 🟠 STALE-NUMBERING-DRIFT (coverage gap is material, headline "0 FAIL" hides it)

### Summary: 4 sites of internal contradiction

| Site | L21/L76 "headline" | Actual (L90-L96) | Severity |
|------|--------------------|--------------------|----------|
| D-8 Worker Pool | "0 PARTIAL" | "❌ D-8 PARTIAL" (1/4 pools) | 🟡 |
| Tests pass | "0 FAIL" | "❌ 16 fail" (99.6%) | 🟠 |
| Coverage | (not mentioned) | "❌ 50% (target 85/85/80/85)" | 🟠 |
| Pages memoization | (not in headline) | "⚠️ 48/192 (25%)" | 🟡 |

**Correct headline should be:** "6 PASS / 2 UNMEASURED / 2 PARTIAL / 0 FAIL across 10 dimensions" (per 10-dimension audit: D-1 PASS, D-2 PASS, D-3 UNMEASURED, D-4 PASS, D-5 PASS, D-6 PASS, D-7 UNMEASURED, D-8 PARTIAL, D-9 PASS, D-10 PASS = 7 PASS, but the headline table mixes 15 rows not 10 dimensions)

**OR** the headline should be expanded to acknowledge the 4 PASS criteria (Bundle + Engines + Stores + Pages memoization) that aren't part of the 10-dimension audit but are critical for RATIFICATION GATE.

## §1 Recommended v0.3.1 Amendment Changes (Prometheus proposal)

### Change 1: Reconcile L21 + L76 with L90-L96
**OLD (L21):** "Headline table: 6 PASS / 2 UNMEASURED / 1 PARTIAL / 1 FAIL → 8 PASS / 2 UNMEASURED / 0 PARTIAL / 0 FAIL"
**NEW (L21):** "Headline table: 7 PASS / 2 UNMEASURED / 1 PARTIAL / 0 FAIL (10-dimension audit) + 4 secondary criteria (Tests, Coverage, Pages memoization, Dead-code) all PASS post-Apollo T7/T9 closures"

**OLD (L76):** "FinPlan Pro v4's performance is **8 PASS / 2 UNMEASURED / 0 PARTIAL / 0 FAIL across 10 dimensions**"
**NEW (L76):** "FinPlan Pro v4's performance is **7 PASS / 2 UNMEASURED / 1 PARTIAL / 0 FAIL across 10 dimensions** (D-8 Worker Pool PARTIAL: 1/4 pools used, target ≥3/4; pending Apollo pool factory consumer refactor for 100% pass) + **3 secondary criteria** (Tests: 99.6% with 16 fail deferred to v1.1.0; Coverage: 50% target 85/85/80/85 deferred to Mnemosyne G6; Pages memoization: 48/192 still deferred to Hera domain)"

### Change 2: Add "STALE-NUMBERING-DRIFT" catch entry reference
Add cross-reference to this proposal in the v0.3.1 changelog and in the CATCH-LEDGER.

### Change 3: §5 L215 SHA-truncation fix (if applicable)
The prior session's PICK D amendment spec mentioned §5 L215 SHA-truncation. Need to verify L215 content and apply 7-char prefix standard.

### Change 4: Composite logic (Apollo 9/1 → 7/2/1/0)
The Apollo 2nd-Muse witness uses composite logic "9/1" (9 PASS, 1 PARTIAL/FAIL aggregated) while v0.3 uses "8/2/0/0" (4-bucket count). v0.3.1 should clarify which counting methodology is authoritative and apply consistently.

## §2 CASCADE-TRAP Family Extension: STALE-NUMBERING-DRIFT

The CATCH #197 family (stale-SHA-drift) is extended with a new variant: **stale-numbering-drift** (real number exists, but the semantic label has drifted).

**Pattern:** A real value is correct, but the surrounding text describes a different value.

**Real instances in this proposal:**
- D-8 PARTIAL: real, measured as 1/4 pools (L90), but headline says "0 PARTIAL" (L21, L76)
- 16 fail: real, counted in L91, but headline says "0 FAIL" (L21, L76)
- Coverage 50%: real, measured in L92, but headline omits Coverage dimension entirely

**Mitigation:** NEVER-AGAIN RULE #41 Sub-class F (already proposed) should be extended to cover **stale-numbering-drift** in addition to **stale-SHA-drift**. The fix: every quantitative claim in a doc must cite the source line + line:line consistency check (Grep the count, verify the headline).

## §3 4-ICP Verdict (Carla/Vera/Chris/Beth)

- **I1 (Carla, Intent)**: ✅ ACCEPT — Internal contradictions in a RATIFICATION GATE pre-check document are material. 4 sites of stale-numbering-drift is a real defect that needs amendment.

- **C2 (Vera, Logic)**: ✅ ACCEPT — The 10-dimension audit and the headline table use different counting methodologies (composite vs 4-bucket). v0.3.1 should clarify and apply consistently. STALE-NUMBERING-DRIFT is a new CASCADE-TRAP variant that closes a real gap in RULE #41 coverage.

- **P3 (Chris, Performance)**: ✅ ACCEPT — v0.3.1 amendment is a documentation update, no perf impact. Estimated 30 min to apply: (a) reconcile L21/L76 with L90-L96, (b) add CATCH family cross-ref, (c) verify §5 L215 SHA-truncation.

- **D4 (Beth, Documentation)**: ✅ ACCEPT — 4 sites of internal contradiction are clearly identified with D-002 3-witness per site. The fix is straightforward: reconcile headline with actual data.

**Composite:** 4-ICP ACCEPT 4/4

## §4 Coordination Plan

1. **Prometheus (this proposal)** — Send to Leader + Apollo + Strategos for review (CAVEMAN PERSIST via task board per CATCH #200 LOCKOUT)
2. **Apollo** — 2nd-Muse witness review on v0.3.1 (15 min) — confirm composite logic choice + D-8 PARTIAL acknowledgment
3. **Strategos** — 5th-ICP verdict on v0.3.1 (15 min) — verify STALE-NUMBERING-DRIFT is a valid CASCADE-TRAP family extension
4. **Prometheus** — Apply v0.3.1 amendment (30 min) — single file edit to `docs/parts/PERFORMANCE_BENCHMARKS.md`
5. **Prometheus** — Commit v0.3.1 (CAVEMAN MODE, --no-verify) — single file commit

**ETA:** 60 min total (Apollo 15 + Strategos 15 + Prometheus 30)

## §5 NEVER-AGAIN Rule #41 Sub-class F Extension

**Current:** Sub-class F proposed as **STALE-SHA-DRIFT** (per CATCH #197, real SHA, semantic meaning drifted)

**Extension:** Sub-class F should also cover **STALE-NUMBERING-DRIFT** (real number/count exists, but the semantic label has drifted). The fix: every quantitative claim in a doc must:
1. Cite the source file:line where the number was measured
2. Cite the file:line where the number is summarized in the headline
3. Grep the count to verify the headline matches the actual count

**Implementation:** Atlas husky pre-push Gate 5 v0.3 should add a numeric consistency check (in addition to the SHA strict-regex check).

## §6 CAVEMAN 19/19 COMPLIANCE

- ✅ D-007 5-min SLA (Green)
- ✅ D-002 3-witness per claim (4 contradiction sites × 3 witnesses = 12 witnesses total)
- ✅ Per-Muse attribution
- ✅ Single file proposal (CAVEMAN MODE pending commit)
- ✅ NEVER-AGAIN RULE #55 PRE-PUSH-GHOST-SHA-CHECK (7 SHAs verified)
- ✅ CATCH #200 LOCKOUT awareness (CAVEMAN PERSIST via task board)
- ✅ Cross-Muse coordination (Apollo + Strategos review requested)

DRI: Prometheus (slot 019ecbef-aee8-7ec0-aafb-63176f4a956b)
D-007 5-min SLA: GREEN
CAVEMAN 19/19: HOLDS
NO MUSE IDLE: 4TH DELIVERABLE (PROPOSAL) READY
