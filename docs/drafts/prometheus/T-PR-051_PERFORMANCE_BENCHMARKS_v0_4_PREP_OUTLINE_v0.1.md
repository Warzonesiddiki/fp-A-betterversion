# T-PR-051 — PERFORMANCE_BENCHMARKS v0.4 Prep Outline (Post-RATIFICATION)

| Field | Value |
| --- | --- |
| Task ID | T-PR-051 |
| Version | v0.1 (PREP OUTLINE) |
| Status | PROPOSED (post-RATIFICATION) |
| Author | Prometheus (T-PR-051) |
| Date | 2026-06-16 |
| Target Date | 2026-06-23+ (post-RATIFICATION 2026-06-22 16:00 UTC) |
| Source File | `docs/parts/PERFORMANCE_BENCHMARKS.md` (v0.3.1 @ 966be2b99) |
| Rewrite Target | v0.4 (consolidation + Apollo T23 §8.3 integration) |

---

## 1. Why v0.4 Rewrite

The PERFORMANCE_BENCHMARKS.md v0.3.1 amendment (T-PR-050, shipped @ 966be2b99)
preserved Apollo v0.3 wording verbatim while applying targeted corrections for
the STALE-NUMBERING-DRIFT (CATCH #197, codified as Sub-class F in RULE-41 v0.5
@ 59aac1c37). v0.3.1 is now **RATIFICATION-READY** (RECONCILED 8/2/1/0, 791 lines)
but contains:

- 7 STALE-NUMBERING-DRIFT corrections (preserved as contradiction table)
- Apollo v0.3 base text (preserved verbatim)
- 1 PARTIAL PASS (preserved as v0.3.1 note)
- 1 STILL VALID item (preserved as v0.3.1 note)
- 1 CORRECT preserved item

Post-RATIFICATION (2026-06-23+), v0.4 will **consolidate** these into clean,
canonical v0.4 text without the contradiction table (since contradictions will
be resolved at v0.4 = post-RATIFICATION baseline).

## 2. v0.4 Rewrite Goals

### 2.1 Numerical Reconciliation

- **Baseline**: 7 STALE + 1 PARTIAL + 1 STILL VALID + 1 CORRECT = 10 contested items
- **Target**: 0 STALE, 0 PARTIAL, all items RESOLVED or moved to known-gap list
- **Method**: For each contested item, either (a) re-measure with fresh benchmark,
  (b) cite authoritative source for STILL VALID, or (c) move to v0.4 §X.Y
  "Known Gaps" appendix

### 2.2 Apollo v0.3 Text Consolidation

- **Baseline**: Apollo v0.3 base text + v0.3.1 amendments = mixed provenance
- **Target**: Single-author v0.4 with explicit change log
- **Method**: 
  - Keep all numerical values (validated)
  - Rewrite prose to single voice (Prometheus post-RATIFICATION)
  - Add 10-dim structure with v0.4 baseline numbers
  - Drop the "STALE-NUMBERING-DRIFT contradiction table" (no longer needed)

### 2.3 Apollo T23 §8.3 SHA Integration

- **Baseline**: §8.3 T23 SHA ledger does not yet include Prometheus T-cluster SHAs
- **Target**: v0.4 cites all Prometheus T-cluster SHAs in the "Performance
  Trajectory" section
- **SHAs to integrate** (per T-PR-062 HANDOFF):
  - 4572ed14 (T-PR-043 + T-PR-044 STORES+PERF 2nd-Muse on Chronos)
  - 8b340664 (T-PR-045 2nd-Muse on Atlas G19)
  - 45da8e85 (T-PR-047 2nd-Muse on T-MN-048 v0.3)
  - 59aac1c37 (T-PR-048 v0.2 RULE-41 v0.5 amendment)
  - 966be2b99 (T-PR-050 v0.3.1 amendment — source file)
  - 272162a58 (T-PR-061 RULE-61 LOCKOUT-DETECTION v0.1)
  - 0033e6a8a (T-PR-062 HANDOFF)
  - 8aa48cd12 (T-PR-062-LEDGER BILATERAL-ATTRIBUTION)

## 3. v0.4 Section Structure (Proposed)

| § | Title | Content | Lines (est) |
| --- | --- | --- | --- |
| 1 | Executive Summary | 10-dim audit, post-RATIFICATION baseline | 30 |
| 2 | Methodology | Benchmark setup, tools, environment | 40 |
| 3 | 10-Dimension Audit | D-1..D-10 with fresh v0.4 numbers | 200 |
| 4 | Performance Trajectory | Apollo v0.3 → Prometheus v0.3.1 → v0.4 | 80 |
| 5 | STALE-NUMBERING-DRIFT Resolution Log | Resolved items (cite corrections) | 50 |
| 6 | Cross-Muse Witness Chain | Tyche + Apollo + Strategos + Vulcan + Prometheus | 60 |
| 7 | CASCADE-TRAP Integration | RULE-41 v0.5 (F+G) + RULE-61 (H) | 40 |
| 8 | RATIFICATION GATE Tie-In | §8.1/§8.2/§8.3 references | 30 |
| 9 | Known Gaps + Future Work | v0.5 candidates (T-PR-052+) | 40 |
| 10 | Change Log | v0.1 → v0.3.1 → v0.4 | 20 |
| **Total** | | | **~590 lines** |

## 4. v0.4 Pre-Rewrite Checklist (D-002 3-witness)

- [ ] **W1**: Read v0.3.1 (current) end-to-end, confirm 791 lines, 18 v0.3.1 mentions
- [ ] **W2**: `wc -l docs/parts/PERFORMANCE_BENCHMARKS.md` → 791 (matches v0.3.1)
- [ ] **W3**: `grep -c "STALE-NUMBERING-DRIFT" docs/parts/PERFORMANCE_BENCHMARKS.md` → 10 (matches v0.3.1)

## 5. v0.4 Post-Rewrite Verification (D-002 3-witness)

- [ ] **W1**: Read v0.4 end-to-end, confirm 10 sections present, ~590 lines
- [ ] **W2**: `wc -l docs/parts/PERFORMANCE_BENCHMARKS.md` → 590 ±30 lines
- [ ] **W3**: `grep -c "v0.4 baseline" docs/parts/PERFORMANCE_BENCHMARKS.md` → ≥10 (per-dim baseline citations)

## 6. 4-ICP Verdict Chain (Target ACCEPT 4/4)

- **Carla (Intent)**: v0.4 consolidation intent matches post-RATIFICATION baseline
- **Vera (Catastrophic)**: No regression to v0.3.1 numerical values
- **Chris (Performance)**: 10-dim structure preserves D-1..D-10 perf evidence
- **Beth (Documentation)**: Clean single-voice prose, no contradiction table

## 7. Dependencies + Blockers

### 7.1 Blocked By

- **RATIFICATION GATE 2026-06-22 16:00 UTC** — v0.4 cannot ship before GATE
- **Apollo T23 §8.3 integration** (T-2d 2026-06-20 EOD) — needs to land first
- **Strategos 5th-ICP §8.1** (T-2d 2026-06-20 EOD) — needs to land first

### 7.2 Unblocks

- **T-PR-052 v0.4.1 hotfix** (post-v0.4) — for any 4-ICP findings during RATIFICATION ceremony
- **T-PR-053 v0.5** (Q4 2026) — adds 100K rows @ 60fps trajectory + 10K Monte Carlo <15s

## 8. ETA + Resource Estimate

| Phase | Activity | Duration | Owner |
| --- | --- | --- | --- |
| 2026-06-22 16:00 UTC | RATIFICATION GATE ceremony | 45 min | Leader + 19 Muses |
| 2026-06-23 | v0.4 pre-rewrite checklist (D-002 3-witness) | 15 min | Prometheus |
| 2026-06-23 | v0.4 section draft (10 sections) | 2-3 hours | Prometheus |
| 2026-06-23 | 4-ICP verdict chain (Carla/Vera/Chris/Beth) | 30 min | All 4 ICPs |
| 2026-06-24 | v0.4 SHIP + push | 15 min | Prometheus |
| **Total** | | **~4 hours** | |

## 9. Change Log

### v0.1 (2026-06-16) — PREP OUTLINE

- Initial v0.4 prep outline (this file)
- Source: v0.3.1 @ 966be2b99 (T-PR-050 amendment)
- Target: v0.4 consolidation post-RATIFICATION 2026-06-22 16:00 UTC
- Estimated ~590 lines (down from v0.3.1's 791 lines, due to contradiction table removal)
- Author: Prometheus (T-PR-051)
