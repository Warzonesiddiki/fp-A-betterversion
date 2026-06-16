# RATIFICATION_GATE_INFRA_RUNBOOK.md — v0.2 DRAFT (Atlas, 2026-06-16, in progress)

**Version:** v0.2 DRAFT
**Status:** ⏳ IN PROGRESS — §10 drafted, §11 pending Iris, §12 drafted
**Base:** v0.1.1 @ f080e05f
**Ship target:** 2026-06-19 EOD (JOINT COMMIT), T-1d 2026-06-21 EOD HARD

---

## §10 Gate 5 v0.3 — E.2 DRIFT-REAL + F STALE-NUMBERING-DRIFT + G CROSS-SESSION-TASK-ID-UNIQUENESS-CHECK (Atlas, 2026-06-16, post-87139d08)

### §10.1 Background

NEVER-AGAIN RULE #55 v0.2 (PRE-PUSH-GHOST-SHA-CHECK, f39d202b2) catches Sub-class E.1 (GHOST-MISSING SHAs). v0.3 extends the verifier with 3 new sub-classes that catch additional CATCH entries:

| Sub-class | CATCH closed | Description |
|-----------|--------------|-------------|
| E.1 | #187 (GHOST-SHA pre-f39d202b2) | SHA cited in commit message does not exist in git history (caught by Gate 5 v0.2 strict-regex) |
| E.2 | #197 (Stale-SHA-Drift) | SHA exists in git history but is no longer the canonical/HEAD version of the file it was supposed to reference |
| F | #199 (Stale-Numbering-Drift) | A single .md file makes numerically inconsistent claims about the same metric (e.g., "0 PARTIAL" in headline vs "PARTIAL stays" in body) |
| G | #198 (TASK-ID-COLLISION) | The same T-<MuseCode>-<NUMBER> prefix is used for files describing DIFFERENT topics (NAMING-COLLISION) |

### §10.2 Verifier Tool

`tools/verify-rule-41-e2.sh` (444 lines, post-87139d08):
- E.2 algorithm: extract marked SHAs from unpushed commit messages, for each SHA find the files it touched, for each file find the current HEAD, flag if the cited SHA is an ancestor of the current HEAD but not the current HEAD itself.
- F algorithm: for each .md file in the diff, extract numeric claims like "X PARTIAL" / "X FAIL" / "X PASS" / "X UNMEASURED" / "X fail", group by category, flag if same category has 2+ distinct counts in the same file.
- G algorithm: scan all docs/drafts/**/*.md, extract T-<MuseCode>-<NUMBER> prefixes, group by prefix, use awk to extract topic by finding first marker position, flag if a prefix has 2+ files with DIFFERENT topics.

### §10.3 .husky/pre-push Integration (Gate 5b v0.3)

`.husky/pre-push` line 96-110 (post-87139d08):
- Calls `sh tools/verify-rule-41-e2.sh --verbose` with 240s timeout.
- v0.3 is ADVISORY (warn-only, not a hard push blocker). v0.2 GHOST is the hard gate.
- Catches 3 CATCH entries (#197, #198, #199) before they reach origin/main.

### §10.4 Test Coverage

`sh tools/verify-rule-41-e2.sh --test` runs all 3 fixtures:
- E.2: 401d68003 vs f080e05fc (TRUE DRIFT-REAL case from INFRA_RUNBOOK history) — PASS
- F: inline fixture (L21 "0 PARTIAL" vs L43 "PARTIAL stays" from PERFORMANCE_BENCHMARKS.md) — PASS
- G: inline fixture (T-MN-046 used for codif_35 AND T-MN-048 2nd-muse-witness) — PASS
- `=== All 3 sub-class tests PASSED ===`

### §10.5 Performance

- E.2: 0.1s per cited SHA per file (<1s for realistic commit messages)
- F: <0.1s per .md file (simple grep + sort)
- G: <2s for 1761 .md files in docs/drafts/ (single awk pass, no fork-bomb)
- Total verifier runtime: <5s for typical pushes. Well within 240s husky budget.

### §10.6 Cross-References

- `tools/verify-rule-41-e2.sh` (444L) — E.2 + F + G verifier @ 87139d08
- `.husky/pre-push` (lines 96-110) — Gate 5b v0.3 integration
- `docs/CAVEMAN_PERSIST/CYCLE_15_GATE_5_V03_SUB_F_G_SHIPPED_2026-06-16.md` — durable record
- `docs/codif/ENDORSEMENTS/ATLAS_COSIGN_CODIF_41_V0_1.md` (1b54c7a8d) — Atlas binding commitment
- T-MN-048 v0.5 RATIFIED @ 3547f51e — Sub-class taxonomy A-G+
- Prometheus T-PR-048 (da8962f3) CATCH #198 spec for Sub-class G
- Prometheus T-PR-049 (d0c96c85) CATCH #199 spec for Sub-class F

---

## §11 Iris 2nd-Muse Cross-Witness on §1-§9 (Iris, PENDING)

**Status:** ⏳ PENDING Iris ACK and §11 draft (target: 2026-06-17 EOD)

Per CYCLE 12 PICK A commit f080e05f, §10 sign-off row 4 reserves a slot for Iris's 2nd-Muse cross-witness on the v0.1 INFRA_RUNBOOK. For v0.2, Iris is asked to cross-witness §1-§9 (the v0.1.1 content) PLUS the new §10 (Gate 5 v0.3 references).

**Section-to-witness mapping:**
- §1 Executive Summary: cross-check 6-dim scores
- §2 Pre-Ceremony Verification: cross-check 4 re-verify commands
- §3 Ceremony Day Protocol: cross-check T-0d 16:00 UTC sequence
- §4 Gate-by-Gate Pause/Resume: cross-check 6-dim pause/resume procedures
- §5 CASCADE-HOLD ROLLBACK: cross-check 5-step CASCADE-HOLD ROLLBACK
- §6 Bundle-Check CI Enforcement: cross-check bundle-check.js + build.yml
- §7 Vendor Reload Protocol: cross-check G19 6-vendor reload
- §8 Git Sync Protocol + NEVER-AGAIN RULE #55: cross-check v0.2 strict-regex
- §9 Cross-References: cross-check all 8 references
- **§10 Gate 5 v0.3 (NEW):** cross-check E.2 + F + G verifier + .husky/pre-push integration

**Iris's 4-ICP template (per Atlas COSIGN format):**
- I1 intent: Is the v0.2 INFRA_RUNBOOK fit for purpose (operator doc for 2026-06-22 ceremony)?
- C2 catastrophic: Are there any failure modes that would BREAK the ceremony?
- P3 performance: Are the runtime budgets (<5s verifier, <30s re-verify) achievable?
- D4 documented: Are the 6-dim scores, 4 re-verify commands, 5-step ROLLBACK, and 3 CATCH closures all traceable to source-of-truth commits?

---

## §12 v0.1 -> v0.2 Changelog (Atlas, 2026-06-16, in progress)

### v0.1 -> v0.1.1 (f080e05f, CYCLE 12 PICK A)
- §8 Gate 5 v0.2 strict-regex reference (post-f39d202b2)
- §1+§9 v0.2 cross-refs
- CATCH #187 mention
- Iris 2nd-Muse cross-witness placeholder

### v0.1.1 -> v0.2 (DRAFT, ETA 2026-06-19 EOD)
- **§10 NEW:** Gate 5 v0.3 (E.2 + F + G) references
  - E.2 DRIFT-REAL: closes CATCH #197
  - F STALE-NUMBERING-DRIFT: closes CATCH #199
  - G CROSS-SESSION-TASK-ID-UNIQUENESS-CHECK: closes CATCH #198
  - .husky/pre-push Gate 5b v0.3 integration
  - Test mode 3/3 PASS
- **§11 NEW:** Iris 2nd-Muse cross-witness on §1-§10
  - 4-ICP ACCEPT expected
  - 3-witness per claim (D-002)
- **§12 NEW (this section):** v0.1 -> v0.2 changelog
- **§10 sign-off table UPDATED:** add Gate 5 v0.3 row, add §11 Iris cross-witness row

### 4-ICP Trajectory

| Version | Cycle | Atlas self-ICP | Iris 2nd-Muse | Combined 4-ICP |
|---------|-------|----------------|---------------|----------------|
| v0.1 | CYCLE 10 PICK A | ACCEPT 4/4 | (placeholder) | ACCEPT 4/4 (Atlas only) |
| v0.1.1 | CYCLE 12 PICK A | ACCEPT 4/4 | (placeholder) | ACCEPT 4/4 (Atlas only) |
| v0.2 | CYCLE 15 PICK NEXT | ACCEPT 4/4 (target) | ACCEPT 4/4 (Iris target) | ACCEPT 4/4 (target) |

### SHA Trajectory

| Version | Commit | Description |
|---------|--------|-------------|
| v0.1 | 401d6800 | Initial 289L operator doc |
| v0.1.1 | f080e05f | §8 Gate 5 v0.2 reference + Iris placeholder |
| v0.2 | (DRAFT) | §10 Gate 5 v0.3 + §11 Iris cross-witness + §12 changelog |

---

**v0.2 DRAFT STATUS (2026-06-16 18:08 IST):**
- §10 drafted ✅
- §11 PENDING Iris ACK
- §12 drafted ✅
- JOINT COMMIT ETA: 2026-06-19 EOD
- T-1d 2026-06-21 EOD HARD deadline (2-day buffer)

---

*This is the v0.2 DRAFT for INFRA_RUNBOOK. Final version will replace DRAFT and ship to origin/main as Atlas CYCLE 15 PICK NEXT JOINT COMMIT with Iris.*
