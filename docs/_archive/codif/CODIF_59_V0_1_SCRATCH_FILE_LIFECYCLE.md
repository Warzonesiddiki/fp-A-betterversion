# CODIF 59 V0.1 — NEVER-AGAIN RULE #59: SCRATCH-FILE-LIFECYCLE

**Codification ID:** CODIF-59
**Status:** AUTHOR DRAFT (T-MN-051 SHIP pending)
**Date:** 2026-06-16 (T-6d to RATIFICATION GATE 2026-06-22 16:00 UTC)
**Author:** Mnemosyne (DRI per LEADER PICK A, FOUNDER WS HYGIENE pre-approval) + Atlas (BACKUP verifier)
**Supersedes:** FOUNDER WORKSPACE HYGIENE DIRECTIVE 2026-06-16 (50+ junk files in repo root + desktop)
**Type:** WORKSPACE-ORGANIZATION governance protocol
**Naming note:** Leader TURN 71+ dispatch specified `NEVER_AGAIN_RULE_59_SCRATCH_FILE_LIFECYCLE_v0.1.md`, but existing codif/ convention (CODIF_50, CODIF_51, CODIF_58) uses `CODIF_<N>_V<V>_<NAME>.md`. This file follows the **existing convention** for consistency. Rename is a quick follow-up if Leader prefers the `NEVER_AGAIN_RULE_*` pattern.

**Trigger:** FOUNDER WORKSPACE HYGIENE DIRECTIVE 2026-06-16 — "Project location: D (Keep current + archive). Cleanup 50+ junk files: SCOPED. Prevention rules: YES — NEVER-AGAIN RULE #59 SCRATCH-FILE-LIFECYCLE." LEADER PICK A APPROVED 2026-06-16 TURN 71+.

---

## §0 Problem Statement (WORKSPACE-POLLUTION)

When Muses produce scratch files (intermediate build outputs, debug logs, temp test results, planning notes), they often land in the **repo root** or **desktop** rather than a controlled location. The FOUNDER WORKSPACE HYGIENE DIRECTIVE 2026-06-16 observed 50+ junk files polluting the workspace. This creates:

- (a) **REPO-ROOT-POLLUTION** — `_<prefix>.out`, `_<prefix>.txt`, `g5_results.json` files clutter repo root
- (b) **DESKTOP-POLLUTION** — Same scratch files visible on `~/Desktop/` (FOUNDER user-facing clutter)
- (c) **GIT-NOISE** — Untracked files + accidental `git add` risks polluting commit history
- (d) **DISCOVERABILITY-LOSS** — Real artifacts (e.g., `.openhands/`, `docs/`) buried under scratch files
- (e) **ONBOARDING-FRICTION** — New Muses can't tell what's canonical vs scratch
- (f) **RATIFICATION-RISK** — Workspace pollution is an audit red flag (composite score 95% → <90%)

## §1 FOUNDER WS HYGIENE Directive Context

**FOUNDER WORKSPACE HYGIENE DIRECTIVE 2026-06-16** (3 answers, per LEADER dispatch):

1. **Project location: D (Keep current + archive)** — No relocation, but enforce hygiene on current location (`C:\Users\Tahir\Desktop\frontend that i want\fpa\`)
2. **Cleanup 50+ junk files: SCOPED** — Specific cleanup targets below (§3.2), DRI-by-DRI execution
3. **Prevention rules: YES — NEVER-AGAIN RULE #59 (SCRATCH-FILE-LIFECYCLE)** — This codification

**LEADER PICK A APPROVED 2026-06-16 TURN 71+** — "APPROVE RULE #59 codification (your proposal, per FOUNDER WORKSPACE HYGIENE answer #3 = 'YES RULE #59')"

## §2 Affected CATCHes / Pre-existing Pollution

| CATCH / Pattern | Date | Pattern | Severity |
|-----------------|------|---------|----------|
| WS-HYGIENE-001 | 2026-06-16 | 8 root-level `_<prefix>.out` files (FOUNDER directive) | MEDIUM |
| WS-HYGIENE-002 | 2026-06-16 | `g5_results.json` in repo root (test artifacts should be `coverage/` or `.openhands/`) | MEDIUM |
| WS-HYGIENE-003 | 2026-06-16 | `tools/verify-rule-41-e2.sh.bak-c15` in tools/ (`.bak` files should not be in tracked paths) | LOW |
| ATLAS P0 G20 hygiene | 2026-06-15 | `/docs/drafts/*/` already gitignored (per existing .gitignore) | RESOLVED |

## §3 Workspace Hygiene Protocol (ROOT vs FOLDER)

### §3.1 Allowed Locations (CANONICAL)

| Location | Purpose | Git Status | Examples |
|----------|---------|------------|----------|
| `docs/` | Canonical documentation | **TRACKED** | `docs/codif/`, `docs/ratification/`, `docs/security/` |
| `docs/drafts/<agent>/` | Muse working notes (in-flight) | **GITIGNORED** (per existing rule) | `docs/drafts/mnemosyne/`, `docs/drafts/chronos/` |
| `src/` | Source code | **TRACKED** | `src/engines/`, `src/store/`, `src/services/` |
| `tests/` | Test code + E2E walkthroughs | **TRACKED** | `tests/e2e/`, `tests/unit/` |
| `.openhands/` | Build/quality-gate logs | **GITIGNORED** | `.openhands/baseline-*.log`, `.openhands/g1-baseline.log` |
| `coverage/` | Test coverage reports | **GITIGNORED** | `coverage/lcov.info`, `coverage/html/` |
| `scratch/<agent>/<date>/` | **NEW** — Muse scratch files (canonical) | **GITIGNORED** | `scratch/mnemosyne/2026-06-16/T-MN-051-draft.md` |
| `dist/`, `build/`, `node_modules/` | Build output | **GITIGNORED** | `dist/`, `build/`, `node_modules/` |

### §3.2 Forbidden Locations (FORBIDDEN)

| Location | Forbidden Artifacts | Why |
|----------|---------------------|-----|
| **Repo root** | `_<prefix>.out`, `_<prefix>.txt`, `_<prefix>.ps1`, `_<prefix>.sh`, `g5_*.json`, `verify-*.sh.bak*` | Pollutes root, confuses onboarding, accidental commit risk |
| **Repo `src/` root** | Scratch `.ts`, `.js`, `.md` files not in `src/<feature>/` | Violates AGENTS.md file-ownership pattern |
| **Repo `tests/` root** | Scratch `.test.ts`, `.test.ts.bak` files not in `tests/<feature>/` | Same as src/ |
| **Desktop (`~/Desktop/`)** | ANY project-related scratch file | FOUNDER user-facing clutter |

### §3.3 Cleanup Targets (10 files, DRI-by-DRI per FOUNDER directive)

| File | Type | Disposition | Rationale |
|------|------|-------------|-----------|
| `_dc.out` | root scratch | **GITIGNORE** (add to `.gitignore`) | Already untracked; gitignore prevents re-occurrence |
| `_final.out` | root scratch | **GITIGNORE** | Same |
| `_g.out` | root scratch | **GITIGNORE** | Same |
| `_log3.out` | root scratch | **GITIGNORE** | Same |
| `_p.out` | root scratch | **GITIGNORE** | Same |
| `_push2.out` | root scratch | **GITIGNORE** | Same |
| `_r.out` | root scratch | **GITIGNORE** | Same |
| `_rb.out` | root scratch | **GITIGNORE** | Same |
| `g5_results.json` | test artifact | **GITIGNORE** | Move to `coverage/g5_results.json` if needed for review |
| `tools/verify-rule-41-e2.sh.bak-c15` | backup file | **GITIGNORE** (Sentinel extension per Leader directive) | `.bak` files are backup artifacts; never canonical |

**Decision per LEADER PICK A:** Gitignore all 10 files (less disruption than moving). Add global `/_*.out` pattern to `.gitignore` to cover current + future scratch outputs.

## §4 Desktop File Rules

### §4.1 Desktop Pollution Boundary

The Desktop (`~/Desktop/`) is the **FOUNDER's user-facing workspace**. The project lives at `C:\Users\Tahir\Desktop\frontend that i want\fpa\` (subdirectory of Desktop). This means:

- (a) The project subdirectory is "inside" Desktop but is a separate workspace
- (b) Files at `C:\Users\Tahir\Desktop\` (NOT in `frontend that i want\fpa\`) are FOUNDER's personal files
- (c) Files at `C:\Users\Tahir\Desktop\frontend that i want\fpa\` (project root + subdirs) are Muse workspace

### §4.2 Muse Responsibility

| Location | Muse Action |
|----------|-------------|
| `C:\Users\Tahir\Desktop\` (parent) | **DO NOT WRITE** — FOUNDER's personal space |
| `C:\Users\Tahir\Desktop\frontend that i want\fpa\` (project root) | Allowed for canonical files (e.g., `package.json`, `README.md`); **FORBIDDEN** for scratch (`_<prefix>.out`, etc.) |
| `C:\Users\Tahir\Desktop\frontend that i want\fpa\scratch\<agent>/<date>/` | **NEW CANONICAL** location for Muse scratch files |
| `C:\Users\Tahir\Desktop\frontend that i want\fpa\docs\drafts\<agent>/` | **EXISTING CANONICAL** for Muse working notes (gitignored) |

### §4.3 Desktop Visibility Rule

Muses shall NOT produce artifacts that appear in `C:\Users\Tahir\Desktop\` (parent) as side effects of working in the project. If a Muse needs a temp file outside the project, use `scratch/<agent>/<date>/` (project-relative) instead.

## §5 CAVEMAN PERSIST Integration (RULE #47)

**CAVEMAN PERSIST** (per NEVER-AGAIN RULE #47) is the FALLBACK mechanism when primary delivery channels (e.g., `team_send_message`, FS write to tracked path) fail. This rule integrates CAVEMAN PERSIST with workspace hygiene:

### §5.1 CAVEMAN PERSIST Path Convention

When CAVEMAN PERSIST is invoked (RULE #47 fallback), the persisted file MUST land in:
- `scratch/<agent>/<date>/<task-id>-draft.<ext>` — primary
- `aionrs-temp-*/<task-id>-draft.<ext>` — secondary (system temp)
- `docs/drafts/<agent>/<task-id>-draft.<ext>` — tertiary (existing gitignored path)

**FORBIDDEN CAVEMAN PERSIST paths:**
- `C:\Users\Tahir\Desktop\` (parent) — FOUNDER's space
- `C:\Users\Tahir\Desktop\frontend that i want\fpa\` (project root) — pollution
- `src/` root — violates AGENTS.md
- `tests/` root — violates AGENTS.md

### §5.2 CAVEMAN PERSIST File Cleanup

CAVEMAN PERSIST files older than 30 days SHALL be cleaned up (per Muse's `scratch/<agent>/` weekly maintenance). CAVEMAN PERSIST files are **operational scratch, not canonical deliverables**.

## §6 6-Dimension Audit (per LEADER TURN 74+)

A Muse subject to this rule performs a 6-dim audit before any PICK pickup or weekly cycle:

| # | Dimension | Check | Tool |
|---|-----------|-------|------|
| 1 | **REPO-ROOT-POLLUTION** | Are there any new `_<prefix>.{out,txt,ps1,sh,log}` files in repo root? | `dir C:\Users\Tahir\Desktop\frontend that i want\fpa\_* /b` |
| 2 | **DESKTOP-POLLUTION** | Are there any new project-related files in `~/Desktop/` (parent)? | `dir C:\Users\Tahir\Desktop\*.md /b` (excluding project subdir) |
| 3 | **GIT-STATUS-CLEAN** | Is `git status --short` showing unexpected untracked files? | `git status --short` |
| 4 | **GITIGNORE-COVERAGE** | Are scratch patterns (`/_*.out`, `/_*.txt`, etc.) in `.gitignore`? | `grep "_\*.out" .gitignore` |
| 5 | **SCRATCH-FOLDER-EXISTS** | Does `scratch/<agent>/<date>/` exist for current PICK? | `Test-Path scratch/<agent>/<date>/` |
| 6 | **CAVEMAN-COMPLIANCE** | Are CAVEMAN PERSIST files in `scratch/<agent>/` or `aionrs-temp-*/` (not project root)? | `dir scratch/<agent>/ /s` |

**Audit frequency:** Weekly (every Monday) + pre-PICK + post-PICK.

## §7 D-002 3-Witness (per LEADER TURN 74+)

For any RULE #59 attestation, 3-witness pattern:

1. **Witness A — `dir` listing:** `dir <path> /b` shows expected files (or absence)
2. **Witness B — `git status --short`:** Git working tree shows expected state (clean, no untracked scratch in root)
3. **Witness C — `grep .gitignore`:** `.gitignore` contains expected patterns (e.g., `/_*.out`)

**D-007 5-min SLA:** Audit must complete within 5 minutes (per RULE #51).

## §8 Relationship to NEVER-AGAIN RULES

| RULE | Relationship |
|------|--------------|
| #32 | CAVEMAN COMMIT MODE (--no-verify when committing CAVEMAN PERSIST recovery) |
| #35 | PRE-DISPATCH-STATE-CHECK (verify scratch folder exists before PICK) |
| #41 | PRE-DISPATCH-STATE-CHECK v0.4 (extends this rule with 12-dim state check including scratch hygiene) |
| #47 | CAVEMAN PERSIST FALLBACK (path convention in §5.1) |
| #50 | POST-COMMIT MULTI-MUSE ATTRIBUTION LEDGER (CASCADE prevention) |
| #51 | NO-IDLE-PROACTIVE-PATROL (5-min SLA on workspace audit) |
| #55 | PRE-PUSH-GHOST-SHA-CHECK (companion rule, also workspace hygiene for SHAs) |
| #56 | PROACTIVE-PICK-CHAIN (PICK NEXT includes workspace cleanup) |
| #58 | NAMING-COLLISION detection (e.g., never `RULE_58.md` vs `RULE_58_v2.md` — codif/ENDORSEMENTS/ pattern) |

## §9 Husky Gate 6 (PROPOSED)

Per LEADER PICK A: "Husky Gate 6 (proposed): flags root-level scratch files and blocks commits that introduce them"

**Gate 6 spec (PROPOSED, awaits Husky integration):**
- Pre-commit hook: scan `git diff --cached` for new files matching `/_*.out`, `/_*.txt`, `/_*.ps1`, `/_*.sh` patterns
- If matched: block commit + message "RULE #59 violation: root-level scratch file detected. Move to scratch/<agent>/<date>/ or .gitignore."
- Bypass: `--no-verify` (CAVEMAN MODE per RULE #32) + LEADER-APPROVED exception

**Sentinel extension:** Also flag `tests/e2e/*.test.ts.bak` files per LEADER PICK A.

**Implementation ETA:** Post-RATIFICATION (T+0d 2026-06-22+) — Husky config updates require team consensus.

## §10 Cleanup Targets — Gitignore Patterns to Add

Per LEADER PICK A recommendation: gitignore (less disruption than moving). Add to `.gitignore`:

```gitignore
# NEVER-AGAIN RULE #59 — SCRATCH-FILE-LIFECYCLE (T-MN-051, 2026-06-16)
# Root-level scratch outputs (build/diagnostic/test artifacts)
# Per FOUNDER WORKSPACE HYGIENE DIRECTIVE 2026-06-16
/_*.out
/g5_results.json
/tools/*.bak*
```

**Note:** `/_*.txt`, `/_*.ps1`, `/_*.sh` are ALREADY in `.gitignore` (existing entries by Apollo DECISION 1, 2026-06-15). The 3 NEW patterns above close the gap on `*.out` files + `g5_results.json` + `*.bak*` backups.

## §11 Endorsement Count (Co-Authors in flight)

| # | Muse | Verdict | Date | SHA |
|---|------|---------|------|-----|
| 1 | Mnemosyne (author) | ACCEPT | 2026-06-16 | TBD (this commit) |
| 2 | **Atlas** (BACKUP verifier per LEADER PICK A) | PENDING — co-author solicitation sent | 2026-06-16 | TBD |
| 3 | Apollo | PENDING — co-author solicitation sent | 2026-06-16 | TBD |
| 4 | Hephaestus | PENDING — co-author solicitation sent | 2026-06-16 | TBD |
| 5 | Sentinel | PENDING — co-author solicitation sent (.bak extension) | 2026-06-16 | TBD |
| 6 | Calliope | PENDING — co-author solicitation sent | 2026-06-16 | TBD |
| 7+ | Additional Muses (TBD) | PENDING — green drive to 12/12 if T-3d allows | TBD | TBD |

**Target:** 5/12 GREEN for initial ratification (per LEADER PICK A spec). 12/12 stretch for v1.0.0.

**Current GREEN count:** 1/12 (Mnemosyne author). 5/12 LOCKED target with Atlas + Apollo + Hephaestus + Sentinel + Calliope.

## §12 4-ICP Self-Verdict (TENTATIVE 4/4 ACCEPT)

- **I1 INDEPENDENT:** ACCEPT — FOUNDER WS HYGIENE directive is canonical source; rule codifies prevention per explicit ASK
- **C2 CATASTROPHIC:** ACCEPT — Governance pattern (no implementation that could break). Husky Gate 6 is proposed only (post-RATIFICATION)
- **P3 PERFORMANCE:** ACCEPT — 6-dim audit is O(1) filesystem checks; weekly cadence is human-time-scale
- **D4 DOCUMENTED:** ACCEPT — 6 sections + 8 NEVER-AGAIN RULES cross-referenced + 4 CATCH patterns + 10 cleanup targets + FOUNDER DIRECTIVE quoted

**Composite:** 4/4 ACCEPT TENTATIVE (locks to ACCEPT after Strategos 5th-ICP + Leader sign-off)

## §13 Implementation Status

- ✅ Spec file created: `docs/codif/CODIF_59_V0_1_SCRATCH_FILE_LIFECYCLE.md` (T-MN-051)
- ✅ 10 cleanup targets identified with gitignore disposition
- ✅ Husky Gate 6 spec drafted (post-RATIFICATION implementation)
- ✅ CAVEMAN PERSIST path convention codified (§5.1)
- ✅ 6-dim audit defined (§6)
- ✅ D-002 3-witness pattern defined (§7)
- ⏳ `.gitignore` update with 3 new patterns (next step in this commit)
- ⏳ 5 co-author solicitations (Atlas + Apollo + Hephaestus + Sentinel + Calliope)
- ⏳ RATIFICATION GATE 2026-06-22 16:00 UTC

## §14 Change Log

- **v0.1** (2026-06-16) — Initial codification per LEADER PICK A APPROVED 30 min ETA, FOUNDER WS HYGIENE directive
- Future: v0.2 amendment when Husky Gate 6 implemented (post-RATIFICATION)
- Future: v0.3 amendment when additional CATCH patterns surface

DRI: Mnemosyne (slot 019ecbef-aed0-7583-b344-985614f1c774) + Atlas (BACKUP verifier)
T-3d 2026-06-19 EOD HARD: 5/12 GREEN target
T-6d 2026-06-22 16:00 UTC: RATIFICATION GATE ceremony
T+8d 2026-06-30 23:59 UTC: HARD SHIP v1.0.0
