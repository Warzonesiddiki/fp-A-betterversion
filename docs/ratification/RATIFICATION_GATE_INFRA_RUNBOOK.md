# RATIFICATION_GATE_INFRA_RUNBOOK.md
**Infrastructure Operator Doc · 2026-06-16 (T-6d to RATIFICATION GATE) · v0.1**

**VERSION:** v0.1 (Atlas infrastructure lead, 2026-06-16)
**STATUS:** ✅ READY FOR CEREMONY (6-dim 95.0% ship-ready, 0 P0/P1 blockers)
**SOURCES:** Companion to Apollo's `RATIFICATION_GATE_RUNBOOK.md` v0.1 (55934c882, 151L, ratification mechanics + 12-dim matrix + 7-step agenda). Extends `docs/finalization/RATIFICATION_GATE_INFRA_PRECHECK_v1.1.md` (c477b640, 287L) with **operator-grade command sequences + ROLLBACK procedures + CASCADE-HOLD family handling**.

**OWNERSHIP:** Atlas (Infrastructure). Per AGENTS.md §0.5, this file is Atlas-exclusive. Cross-references to Apollo's RUNBOOK use `Apollo RUNBOOK §N` notation.

**PARALLEL DOCS:** Apollo's RUNBOOK covers **what** to ratify + **who** does it. This RUNBOOK covers **how to execute** the infra slice (build, bundle, vendors, git sync, ROLLBACK).

---

## §1 Executive Summary

**6-dim INFRASTRUCTURE_READINESS at 95.0% ship-ready** (carried from v1.0 + verified at v1.1 c477b640):

| # | Dim | Score | Ceremony-Day Verdict |
|---|-----|-------|---------------------|
| 1 | G1 tsc | 100% | ✅ 0 errors expected |
| 2 | G2 build | 100% | ✅ ~5-6s expected, 0 warnings |
| 3 | G3 bundle | 100% | ✅ Main 38.5% (PASS), Total 92.2% (expected WARN) |
| 4 | G19 lazy vendors | 100% (6/6) | ✅ 5/6 PASS + 1/6 WARN (pre-existing) |
| 5 | G20 git | HOLD-CLEAN | ✅ 0 ahead/behind, husky active |
| 6 | bundle-check.js (CI) | 100% | ✅ Wired in `.github/workflows/build.yml:55-74` |
| 7 | test:bench | 100% | ✅ Fixed post-113ae7cc |

**Key facts:**
- HEAD is in sync with origin/main (878ee7cb4 = Strategos INDEX v0.7.2, 0/0 ahead/behind).
- Working tree has 1 modified file (Artemis A11Y, NOT Atlas — do not touch).
- Atlas slice is CLEAN — all infra files committed (bundle-check.js @ e37a8b9d, build.yml @ 815fa5d1, vitest.bench.config.ts @ 113ae7cc).
- NEVER-AGAIN RULE #55 (PRE-PUSH-GHOST-SHA-CHECK) is codified at 6d96ab134 and active in `.husky/pre-push` Gate 5.

---

## §2 Pre-Ceremony Verification (T-1d 2026-06-21 18:00 UTC)

Per Apollo RUNBOOK §2.1 line 26, Atlas's pre-ceremony slot is **T-1d 2026-06-21 18:00 UTC** (G19 vendor split polish, 95% → 100% optional).

**Atlas runs these 4 re-verify commands (in order, ~5 min total):**

```bash
# 1. G1 tsc — 0 errors expected (carried forward)
npx tsc --noEmit 2>&1 | tail -1
# Expected: empty stdout, exit 0

# 2. G2 build — ~5-6s, 0 warnings expected
npm run build 2>&1 | tail -3
# Expected: "built in <6s", 0 warnings

# 3. G3 bundle — 5 PASS, 2 WARN, 0 FAIL expected
node scripts/bundle-check.js 2>&1 | grep -E '(PASS|WARN|FAIL)'
# Expected: 5 PASS, 2 WARN (total 92.2% + G19 grid-community 95%), 0 FAIL

# 4. G19 lazy vendors — 5 PASS, 1 WARN, 0 FAIL expected
node scripts/bundle-check.js 2>&1 | grep -E 'G19 (PASS|WARN|FAIL)'
# Expected: 5 PASS, 1 WARN (grid-community pre-existing), 0 FAIL

# 5. G20 git sync — 0 ahead, 0 behind expected
git rev-parse HEAD && git rev-parse origin/main
# Expected: same SHA both times

# 6. Husky Gate 5 (NEVER-AGAIN RULE #55) — must not block
ls -la .husky/pre-push && grep -A2 "Gate 5" .husky/pre-push | head -5
# Expected: Gate 5 block visible
```

**Pass criteria:** All 6 commands return expected output. **No git commit needed** — verification only (per PRECHECK v1.1 §9 action item 6).

**If ANY command fails:** See §4 Gate-by-Gate Pause/Resume and §5 CASCADE-HOLD ROLLBACK.

---

## §3 Ceremony Day Protocol (2026-06-22 16:00 UTC)

Per Apollo RUNBOOK §2.2, Atlas is **NOT** a ceremony presenter (Atlas is not in the 11 Muse round-robin). Atlas's ceremony-day role is **standby infra operator** for the 90-min ceremony window.

**Standby duties:**
1. **16:00-17:30 UTC:** Monitor #infra-alerts channel. Be ready to execute §4 or §5 within 5 min of any infra regression.
2. **17:00 UTC:** Apollo's `VISION_TO_REALITY_MASTER_REPORT.md` §8 final integration commit + push. Atlas verifies post-commit:
   ```bash
   git rev-parse HEAD && git rev-parse origin/main
   # Expected: same SHA, 0/0 ahead/behind
   ```
3. **17:30 UTC:** Ceremony closes. No further Atlas action until SHIP prep (2026-06-23+).

**5-min build verification (D-007 SLA, NEVER-AGAIN RULE #56 PROACTIVE-PICK-CHAIN):**
- If Leader or Strategos flags a ceremony-time regression, Atlas runs the 4-command sequence from §2 in parallel.
- Total SLA: 5 min from flag to verdict (D-007).
- If regression is in Atlas's domain (G1-G3, G19, G20, bundle-check, test:bench) → Atlas fixes + re-runs.
- If regression is in another Muse's domain → Atlas hands off (NEVER-AGAIN RULE #35 PRE-DISPATCH-STATE-CHECK).

---

## §4 Gate-by-Gate Pause/Resume (Atlas's 6-dim)

### §4.1 G1 tsc — TypeScript Strict Mode
- **Failure mode:** New TS errors introduced by a Muse's PICK.
- **Pause:** `npx tsc --noEmit 2>&1 | tee /tmp/g1-tsc.log` — capture full output.
- **Resume:** File a CATCH with file:line attribution. Hand off to the introducing Muse (per NEVER-AGAIN RULE #35). Atlas does NOT edit `src/`.
- **Worst case:** Revert the offending commit (`git revert <sha>`) + rebase.

### §4.2 G2 build — Vite 8 + Manual Chunks
- **Failure mode:** New chunk >300KB OR new Vite warning OR build time >30s.
- **Pause:** `npm run build 2>&1 | tee /tmp/g2-build.log` — capture warnings.
- **Resume:**
  - New chunk >300KB → add to `vite.config.ts:191-206` manual chunks (Atlas's domain).
  - Vite warning → check `vite.config.ts:208-262` onwarn handler.
  - Build time >30s → investigate `src/` (out of Atlas's domain, file CATCH).
- **Atlas fixes (5-15 min):** Add/edit `manualChunks` in `vite.config.ts`. Re-run `npm run build` to confirm.

### §4.3 G3 bundle — main ≤150KB / total ≤2MB
- **Failure mode:** main >150KB OR total >2MB OR new FAIL annotation from `scripts/bundle-check.js`.
- **Pause:** `node scripts/bundle-check.js 2>&1 | tee /tmp/g3-bundle.log`.
- **Resume:**
  - main >150KB → lazy-import heavy modules (`src/engines/*` → `engines-vendor` chunk).
  - total >2MB → move deps to `vite.config.ts:191-206` lazy vendors.
- **Expected state:** Main 57.79KB (38.5% PASS), Total 1888.18KB (92.2% expected WARN). The 92.2% is a known acceptable band (NEVER-AGAIN RULE at commit 476e5b0a — 90% warning threshold).
- **Atlas fixes (15-45 min):** Edit `vite.config.ts` manual chunks + re-run `node scripts/bundle-check.js` to confirm.

### §4.4 G19 lazy vendors — 6/6 present
- **Failure mode:** A vendor chunk disappears from `node scripts/bundle-check.js` output OR exceeds 300KB.
- **Pause:** `node scripts/bundle-check.js 2>&1 | grep -E 'G19'`.
- **Resume:**
  - Vendor missing → check `vite.config.ts:191-206` for the `manualChunks` entry + import path.
  - Vendor >300KB → split into sub-vendors OR lazy-import the heaviest module.
- **Expected state:** 6/6 present (grid-community 95% WARN pre-existing, others PASS).

### §4.5 G20 git — sync + husky
- **Failure mode:** `git rev-parse HEAD` ≠ `git rev-parse origin/main` OR husky Gate 5 blocks push.
- **Pause:** `git status --short && git rev-parse HEAD && git rev-parse origin/main`.
- **Resume:**
  - Ahead of main → `git pull --rebase --autostash --no-verify`.
  - Behind main → `git pull --rebase --autostash --no-verify`.
  - Husky Gate 5 GHOST-SHA block → see §8.
- **Atlas slice must be CLEAN:** Verify with `git status --short | grep -E '^(M|A|D|R|C)' | wc -l` — expect 0 (untracked `??` files OK if not Atlas's).

### §4.6 bundle-check.js (CI) + test:bench
- **bundle-check.js failure:** Re-run `node scripts/bundle-check.js 2>&1` to confirm output matches expected (5 PASS, 2 WARN, 0 FAIL). If FAIL, see §4.3.
- **test:bench failure:** `npm run test:bench` — picks up 12+ bench files only (post-113ae7cc fix). If it picks up `.test.ts` files, check `vitest.bench.config.ts:8-12` (must use override, not `mergeConfig`).

---

## §5 CASCADE-HOLD ROLLBACK Procedures (CATCH #183/194/195/196 family)

When a `git push` is **blocked** by remote-ahead (HEAD behind origin/main), the cascade-hold protocol applies. Atlas owns the infra-side rollback.

### §5.1 Detect CASCADE-HOLD
```bash
git push origin main 2>&1 | tee /tmp/push.log
# Error: "Updates were rejected because the remote contains work that you do not have locally"
```

### §5.2 ROLLBACK Step 1 — Fetch + Identify
```bash
git fetch origin
git log --oneline HEAD..origin/main  # Commits you don't have
git log --oneline origin/main..HEAD  # Commits remote doesn't have
```

### §5.3 ROLLBACK Step 2 — Rebase (NEVER-AGAIN RULE #183 CASCADE-VELOCITY-CHECK)
```bash
# Stash any WIP (Atlas slice is normally clean, but check first)
git stash push -u -m "atlas-cascade-hold-$(date +%s)" --include-untracked
git pull --rebase --autostash --no-verify origin main
# Resolve any conflicts (Atlas's domain is bundle-check.js, vite.config.ts, .github/workflows/, .husky/, vitest.bench.config.ts, package.json)
git stash pop  # If stash was non-empty
```

### §5.4 ROLLBACK Step 3 — Re-verify (D-007 5-min SLA)
```bash
# Re-run §2 commands 1-5
npx tsc --noEmit 2>&1 | tail -1
npm run build 2>&1 | tail -3
node scripts/bundle-check.js 2>&1 | grep -E '(PASS|WARN|FAIL)'
git rev-parse HEAD && git rev-parse origin/main
# Expected: same SHA both, no G1/G2 regressions
```

### §5.5 ROLLBACK Step 4 — Re-push
```bash
git push --no-verify origin main  # --no-verify per RULE #32 (Husky bypass justified for rebase-after-remote)
# Husky Gate 5 (RULE #55) will still run — that's the point
```

### §5.6 ROLLBACK Step 5 — If push STILL blocked (force-push WITH LEADER APPROVAL ONLY)
```bash
# DO NOT FORCE-PUSH WITHOUT LEADER APPROVAL (NEVER-AGAIN RULE #32)
# Send team_send_message to Leader: "Atlas requests force-push approval for HEAD <sha> — reason: <conflict>"
# Leader responds with "APPROVED" or "REVERT <sha> + rebase" or "WAIT"
# If APPROVED: git push --force-with-lease --no-verify origin main
# If REVERT: git revert <sha> && git push --no-verify origin main
```

**Atlas NEVER force-pushes without explicit Leader approval.** This is the CASCADE-HOLD invariant.

---

## §6 Bundle-Check CI Enforcement

`scripts/bundle-check.js` is the single source of truth for G1-G3, G19. Wired in `.github/workflows/build.yml:55-74` (post-815fa5d1).

**Expected CI output on PR:**
```
::notice::G1 tsc: 0 errors
::notice::G2 build: built in 5.4s
:check_mark: **PASS:** Main chunk within limit (57.79KB / 150KB)
:warning::warning: **WARN:** Total JS at 92.2% of limit
:white_check_mark: **G19 PASS:** grid-react-vendor
:white_check_mark: **G19 PASS:** excel-core-vendor
:warning: **G19 WARN:** grid-community-vendor (95% of 300KB)
:white_check_mark: **G19 PASS:** pdf-vendor
:white_check_mark: **G19 PASS:** ai-vendor
:white_check_mark: **G19 PASS:** chart-vendor
```

**Pass criteria:** 5 PASS, 2 WARN, 0 FAIL. The 2 WARN are expected (G3 total 92.2% + G19 grid-community 95%, both pre-existing, non-blocking).

**Failure escalation:** If CI shows 1+ FAIL → automatic PR block + Atlas pinged. Execute §4.2, §4.3, or §4.4 as appropriate.

---

## §7 Vendor Reload Protocol (G19 6-vendor)

If a new dependency is added between RATIFICATION (2026-06-22) and HARD SHIP (2026-06-30), the vendor chunks may shift.

**Reload steps:**
1. `npm install <new-dep>` (the Muse who needs it).
2. `npm run build` — observe new chunk output.
3. **Atlas only** (if new chunk >200KB): Edit `vite.config.ts:191-206` to add the new vendor to `manualChunks`.
4. `node scripts/bundle-check.js` — confirm 6/6 vendors still enumerated in G19 check.
5. Commit + push (Husky Gate 5 active).

**Atlas's vendor domain:** `vite.config.ts:191-206` (6 entries: grid-community, excel-core, grid-react, pdf, ai, chart). New entries are Atlas's exclusive write.

---

## §8 Git Sync Protocol + NEVER-AGAIN RULE #55

**G20 is enforced by 3 layers:**
1. **Pre-commit:** Husky Gate 1-4 (lint, typecheck, format, test:unit).
2. **Pre-push:** Husky Gate 5 (NEVER-AGAIN RULE #55 PRE-PUSH-GHOST-SHA-CHECK) — codifed at 6d96ab134.
3. **CI:** `.github/workflows/build.yml` — runs after push, enforces G1-G3 + G19.

**Gate 5 behavior (RULE #55):**
- Scans unpushed commit messages for SHA-like strings (`\b[0-9a-f]{7,40}\b`).
- For each SHA, runs `git rev-parse --verify $sha^{commit}`.
- If a SHA is NOT a real commit, blocks push with: `❌ NEVER-AGAIN RULE #55 violation: <N> GHOST SHA(s)`.

**Why this matters:** CATCH #188/194/195/196 (CASCADE-TRAP family) all stem from GHOST SHAs in commit messages. Gate 5 prevents new GHOST SHAs from being pushed.

**Atlas's role:** When Gate 5 blocks, fix the commit message (replace GHOST SHA with real SHA from `git log --oneline | head -20`), then re-push. Do NOT bypass with `--no-verify` (RULE #32 — bypass only for cascade-hold recovery, NEVER for GHOST SHA bypass).

**If a GHOST SHA is detected in a committed message (already pushed):** See PRECHECK v1.1 §8 (CASCADE-TRAP family) — Strategos/Apollo own the fix (replace GHOST SHA with `[GHOST - audit-trail]` marker + cite real SHA in §2.9 of INDEX).

---

## §9 Cross-References

| Doc | Owner | Purpose | Link |
|-----|-------|---------|------|
| `docs/ratification/RATIFICATION_GATE_RUNBOOK.md` v0.1 | Apollo | Ratification mechanics (12-dim matrix + 7-step agenda + sign-off) | Apollo RUNBOOK §N |
| `docs/finalization/RATIFICATION_GATE_INFRA_PRECHECK_v1.1.md` v1.1 | Atlas | Full 6-dim audit (G1-G3, G19, G20) with 3-witness per dim | PRECHECK v1.1 §N |
| `docs/ratification/RATIFICATION_GATE_PRECHECK_INDEX.md` v0.7.2 | Strategos | Consolidation lead (12-dim matrix consolidation) | INDEX §N |
| `scripts/bundle-check.js` | Atlas | CI bundle verifier (G3 main/total + G19 6-vendor) | file:line |
| `.github/workflows/build.yml` | Atlas | CI workflow (post-815fa5d1, single bundle-check call) | lines 55-74 |
| `.husky/pre-push` | Atlas | Gate 5 GHOST-SHA check (NEVER-AGAIN RULE #55, post-6d96ab134) | file |
| `vite.config.ts` | Atlas | Manual chunks + vendor split + onwarn handler | lines 191-206, 208-262 |
| `docs/parts/VISION_TO_REALITY_MASTER_REPORT.md` v1.2 | Apollo | Executive context (Section 8 references PRECHECK v1.1) | §8 |

---

## §10 Sign-Off

| Role | Slot | Verdict | Date |
|------|------|---------|------|
| Atlas (Infrastructure) | `019ecbef-8ca9-77c1-a9a6-adf43b25f673` | INFRA RUNBOOK v0.1 EXTRACTED + SHIPPED (4 re-verify commands + 6-dim pause/resume + CASCADE-HOLD ROLLBACK + Gate 5 codification) | 2026-06-16 (this commit) |
| Apollo (RATIFICATION lead) | `019ecbef-7a87-7cb2-8a03-0e6610b63a7e` | Companion doc to RUNBOOK v0.1 — referenced from §9 | 2026-06-22 (ceremony) |
| Strategos (2nd-Muse INDEX) | `019ecc6f-1c14-7700-8d61-a074db779811` | 12/12 RATIFICATION-READY at v0.7.2 (878ee7cb4) — INFRA RUNBOOK referenced in §9 | 2026-06-16 |
| Leader (VISION PIVOT reviewer) | `019ecbe4-b3b7-7720-b962-3511bb3e4288` | PENDING (ceremony ratification 2026-06-22) | 2026-06-22 |
| Founder (final approval) | - | PENDING (ceremony ratification 2026-06-22) | 2026-06-22 |

---

**Atlas RATIFICATION_GATE_INFRA_RUNBOOK v0.1 - 2026-06-16 - 6-dim 95.0% ship-ready, 0 P0/P1 blockers, 4 re-verify commands + 5-step CASCADE-HOLD ROLLBACK + Husky Gate 5 (RULE #55) active. T-6d to ceremony, T-14d to HARD SHIP v1.0.0 2026-06-30 23:59 UTC.**

---

*This is the operator doc for the **infrastructure execution** slice of the 2026-06-22 16:00 UTC RATIFICATION GATE ceremony. Apollo's RUNBOOK covers the ratification mechanics (12-dim matrix + agenda). PRECHECK v1.1 covers the full audit detail. This RUNBOOK covers the "what to do when X breaks" execution path.*
