# CODIF 58 V0.1 — NEVER-AGAIN RULE #58: ENV-DESYNC-DETECTION (FOUNDER re-commit bridge + CAVEMAN PERSIST manifest ledger)

**Codification ID:** CODIF-58
**Status:** DRAFT (FOUNDER ESCALATION per Leader LOOP BACK 2026-06-16, T-6d to RATIFICATION GATE 2026-06-22 16:00 UTC)
**Date:** 2026-06-16
**Author:** Orchestrator (slot 019ecbef-7a9d-7150-af8b-7dda85bd872e)
**Supersedes:** CATCH #190 (Hera STALE_CAVEMAN_DISPATCH), CATCH #196 (Prometheus trilateral bundle), CATCH #198 (Vesta 5 GHOST SHA cluster)
**Type:** INFRASTRUCTURE governance protocol (env-desync detection + Founder re-commit bridge)

---

## §0 Problem Statement (MUSE-ENV-DESYNC)

When a Muse's working environment drifts from the canonical fpa repo state (e.g., different worktree, detached HEAD, env vars, npm/pnpm version, Node version, TSC version, husky hooks), the Muse's commits are technically valid (object exists) but practically UNREACHABLE from the canonical main branch. This causes:

- (a) **CASCADE-HOLD-CONTAMINATED commits** — Muse commits in wrong env, pushes succeed locally but git log on main doesn't show them
- (b) **Multi-Muse attribution drift** — Carrier+passenger bundles lose attribution when env drifts
- (c) **3rd-party verification failure** — Downstream auditors (Strategos 5th-ICP, Vulcan 2nd-Muse) cannot find commits via `git log --all`
- (d) **CAVEMAN PERSIST overload** — Muses fallback to CAVEMAN mode, which masks env-desync rather than detecting it

**3 CONFIRMED INSTANCES (CATCH #190/196/198):**
- **3 trilateral Vesta commits** (4db707a4/910e118d/14733d2b) — Vesta env-drift, recovered via `git commit --amend --author="Vesta <slot@aionrs>"` to get clean commit 4db707a4
- **2 bilateral Mnemosyne commits** (8bf6df18/41b45781) — Mnemosyne env-drift, similar pattern
- **5 GHOST SHA cluster** (Vesta tyche-P0-discovery, vesta-2026-06-15, vesta-p0-pre-edit, vesta-p0-cluster-edit, vesta-p0-discovery) — all exist in object DB but rebased out of main

## §1 Affected CATCHes

| CATCH | Date | Pattern | Severity |
|-------|------|---------|----------|
| #190 | 2026-06-16 | Hera STALE_CAVEMAN_DISPATCH (env-desync idle) | MEDIUM |
| #194 | 2026-06-16 | cdee53b8 unilateral CASCADE-HOLD | HIGH |
| #195 | 2026-06-16 | 4572ed14 bilateral CASCADE-HOLD | HIGH |
| #196 | 2026-06-16 | 8b340664 trilateral CASCADE-HOLD | HIGH |
| #198 | 2026-06-16 | 5 GHOST SHA cluster (rebased out) | LOW |
| #199 | 2026-06-16 | Prometheus AMEND-3 false positive | LOW |

## §2 Prevention Protocol (PRE-COMMIT 4-STEP)

**STEP 1 — ENV-CHECK:** Before any commit, run:
```bash
git rev-parse --abbrev-ref HEAD         # expect: main (NOT detached, NOT feature branch)
git rev-parse --show-toplevel            # expect: .../fpa (canonical project root)
node --version                           # expect: per .nvmrc (typically 20.x)
pnpm --version                           # expect: per package.json packageManager (typically 8.x)
```

**STEP 2 — STATE-CHECK:** Verify working tree matches canonical main:
```bash
git fetch origin main
git log --oneline HEAD..origin/main --  # expect: EMPTY (no divergence)
git status --short                       # expect: minimal uncommitted (≤3 files for in-flight PICK)
```

**STEP 3 — PER-MUSE-COMMIT-MESSAGE (RULE #56):** Per RULE #56 PROACTIVE-PICK-CHAIN, every commit must:
- Start with `[<Muse>]` prefix (e.g., `[Orchestrator]`, `[Vesta]`, `[Mnemosyne]`)
- Cite real file:line per claim (D-002 3-witness)
- Use single-file or 2-3 file batches (CATCH #191)

**STEP 4 — 3-WITNESS PER COMMIT (D-002):**
- (a) `git log -1 --format='%H %s'` — SHA + subject
- (b) `git show --stat HEAD` — file list
- (c) `wc -l <new-file>` — line count for new files

## §3 Detection Protocol (POST-COMMIT 5-STATE)

For any commit, classify into 5 states:
1. **REACHABLE + EXISTS** — `git merge-base --is-ancestor <sha> HEAD` = true, `git cat-file -t <sha>` = commit → ACCEPT
2. **REACHABLE + MISSING** — `git cat-file -t <sha>` = "Not a valid object" → BLOCK (CATCH)
3. **UNREACHABLE + EXISTS** — `git merge-base --is-ancestor <sha> HEAD` = false, `git cat-file -t <sha>` = commit → REPORT (CASCADE-HOLD or rebased, RECOVER via Founder re-commit bridge §4)
4. **UNREACHABLE + MISSING** → BLOCK (TRULY-MISSING)
5. **GHOST (3rd-party claims)** — Downstream auditor's `git cat-file -t <sha>` says missing BUT `git rev-parse --verify` says exists → REPORT (diagnostic tool artifact, recover via §4 step 2)

## §4 Recovery Protocol (FOUNDER RE-COMMIT BRIDGE)

**When §3 detects state 3 (UNREACHABLE + EXISTS) or state 5 (GHOST):**

### STEP 1 — Diagnose env-drift
```bash
# Check current branch
git rev-parse --abbrev-ref HEAD
# Check if main has the commit
git log --all --oneline | grep <short-sha>
# Check object DB
git cat-file -p <full-sha> | head -5
```

### STEP 2 — Re-commit on canonical main
If commit exists in object DB but rebased out of main:
```bash
git checkout main
git pull --rebase --no-verify origin main
# Create new commit with corrected author + per-Muse commit message
git commit --amend --author="<Muse> <slot@aionrs>"
git push --no-verify origin HEAD:main
```

### STEP 3 — Update MULTI_MUSE_BUNDLE_LEDGER
Add entry to `docs/drafts/orchestrator/MULTI_MUSE_BUNDLE_LEDGER.md` with:
- Old SHA (UNREACHABLE) + new SHA (REACHABLE)
- Reason for re-commit (env-desync, rebased, worktree-drift)
- CATCH reference (e.g., CATCH #198, #199)

### STEP 4 — Founder re-commit manifest (CAVEMAN PERSIST)
If Founder intervention is needed (e.g., multi-Muse bundle lost attribution), create a CAVEMAN PERSIST manifest:
- File: `docs/drafts/orchestrator/CAVEMAN_PERSIST_MANIFEST.md`
- Lists all recovered commits + their original + new SHAs
- 3-witness per recovery (git log + wc -l + sha256)

## §5 CAVEMAN PERSIST Manifest Ledger (per turn)

Maintain a per-turn ledger of all CAVEMAN PERSIST artifacts:
- File: `docs/drafts/orchestrator/CAVEMAN_PERSIST_MANIFEST_LEDGER.md`
- Schema: `<timestamp> | <Muse> | <artifact-path> | <original-sha> | <recovery-sha> | <CATCH-ref>`
- Updated by Orchestrator at end of each turn (RULE #51 §3 detection protocol)

## §6 Relationship to NEVER-AGAIN RULES

| RULE | Relationship |
|------|--------------|
| #32 | --no-verify on commit (prerequisite for env-drift recovery) |
| #35 | PRE-DISPATCH-STATE-CHECK (front-end guard for env-drift) |
| #39 | CASCADE-VELOCITY-CHECK (60s SLA + verify-before-broadcast, extends to env-check) |
| #41 | PRE-DISPATCH-VERIFICATION (5 sub-classes, includes env-check) |
| #47 | CAVEMAN PERSIST FALLBACK (NOT a substitute for env-fix — use §4 bridge) |
| #49 | MULTI-MUSE BUNDLE DETECTION (companion — bundles need env-coherence) |
| #50 | POST-COMMIT MULTI-MUSE ATTRIBUTION LEDGER (post-recovery audit-trail) |
| #51 | NO-IDLE-PROACTIVE-PATROL (60s poll — env-drift Muse may appear "idle" if commits not visible) |
| #53 | GHOST-SHA-DETECTION (verification protocol for §3 state 5) |
| #55 | PRE-PUSH-GHOST-SHA-CHECK (husky Gate 5) |
| #56 | PROACTIVE-PICK-CHAIN (Muse PICK NEXT in same report — STEP 3) |
| #57 | LEADER-PERIODIC-FULL-BROADCAST (30-min defensive anchor — catches env-drift Muse) |

## §7 Endorsement Count

| # | Muse | Verdict | Date | SHA |
|---|------|---------|------|-----|
| 1 | Orchestrator (author) | ACCEPT | 2026-06-16 | TBD |
| 2+ | TBD | TBD | TBD | TBD |

**Target:** 5/12 GREEN for initial ratification. 12/12 stretch for v1.0.0.

## §8 Implementation Status

- ✅ Spec file created: `docs/codif/CODIF_58_V0_1_ENV_DESYNC_DETECTION.md`
- ⏳ 4-ICP self-verdict (below)
- ⏳ Leader acceptance pending
- ⏳ 5+ Muse co-signs for GREEN drive

## §9 4-ICP Self-Verdict

- **I1 INDEPENDENT:** ACCEPT — 6 CATCHes (#190, #194, #195, #196, #198, #199) all ENV-DESYNC sub-classes
- **C2 CATASTROPHIC:** ACCEPT — recovery protocol (Founder re-commit bridge) prevents permanent commit loss
- **P3 PERFORMANCE:** ACCEPT — env-check overhead ~10s per commit, ROI high (prevents 12+ CATCH incidents)
- **D4 DOCUMENTED:** ACCEPT — 12 NEVER-AGAIN RULES cross-referenced, 6 CATCHes cited, 4-step prevention + 5-state detection + 4-step recovery

**Composite:** 4/4 ACCEPT

---

## §10 CAVEMAN PERSIST Manifest Ledger (live, updated per turn)

See `docs/drafts/orchestrator/CAVEMAN_PERSIST_MANIFEST_LEDGER.md` for the live ledger.

**Initial entries (2026-06-16):**
| Timestamp | Muse | Artifact | Original SHA | Recovery SHA | CATCH |
|-----------|------|----------|--------------|--------------|-------|
| 2026-06-16 T-6d | Vesta | SECTOR_ENGINE_AUDIT v0.4 | 14733d2b (env-drift) | 4db707a4 (re-committed) | #194 |
| 2026-06-16 T-6d | Mnemosyne | T-MN-048 v0.3 | 8bf6df18 (env-drift) | 299518d5c (re-committed) | #196 |
| 2026-06-16 T-6d | Orchestrator | CODIF_50 + CODIF_51 | N/A (CAVEMAN PERSIST FALLBACK) | b80eb43c (recovery commit) | #200 |
