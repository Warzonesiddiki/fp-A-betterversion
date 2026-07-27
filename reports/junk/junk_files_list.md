# JUNK FILES & DOCUMENTS — NOT NEEDED FOR PRODUCTION

Audit Date: 2026-07-27  |  Repository: fp-A-betterversion  |  Branch: arena/019fa391-fp-a-betterversion

---

## SUMMARY

The repository contains ~2,438 files in `docs/` alone, plus hundreds of scratch directories. Many are AI-generated ritual/process artifacts ("CAVEMAN PERSIST", "DRIFT", "3-witness"), strategic planning docs, redundant architecture descriptions, agent memory dumps, and archive scratch directories that serve no runtime or build function.

---

## CATEGORY A: ARCHIVE / SCRATCH DIRECTORIES (DELETE ENTIRELY)

| Path | Size / Files | Evidence / Reason |
|---|---|---|
| `docs/_archive/` | 24 subdirs, ~536 KB | Contains `muse-scratch/` with scratch docs (`CHANGELOG.md`, `TASKBOARD.md` 281 KB, `FOUNDER_PUSH_SCRIPT.sh`, `GLOSSARY.md` 25 KB, etc.) |
| `docs/_archive/muse-scratch/` | 24 subdirs | Subdirs: `adr/`, `apollo/`, `athena/`, `atlas/` (47 files), `diagrams/`, `founder/`, `hephaestus/`, `hera/`, `hermes/`, `iris/`, `jsdoc/`, `leader/` (28.6 KB), `leader_archive/`, `mimo/`, `mnemosyne/`, `mnemosyne_mirror/`, `oracle/`, `prometheus/`, `sentinel/`, `strategos/`, `themis/` |
| `docs/_archive/muse-scratch/atlas/` | 47 files | Scratch closeout reports (`CYCLE_10_ATLAS_CLOSEOUT.md`, `BACKUP_VERIFICATION_SPEC.md`, `DR_TABLETOP_PLAN.md`, `DOCKER_TAURI.md`) |

---

## CATEGORY B: AI AGENT / PROCESS RITUAL DIRECTORIES

| Path | Size | Evidence / Reason |
|---|---|---|
| `docs/CAVEMAN_PERSIST/` | Entire directory | Named after the ritual process; contains process docs not code |
| `.ai/` | Entire directory | Agent instructions not needed for build |
| `agent_runs/` | Entire directory | Agent execution traces |
| `.mimocode/` | Entire directory | Unused code generation artifacts |
| `.superpowers/` | Entire directory | Unused capability docs |
| `docs/agent-shared-memory.json` | 1.32 MB | Agent memory dump — not build/runtime needed |
| `docs/agent-status/` | Directory | Agent status tracking — scrap |
| `docs/cross-witness/` | Directory | Witness verification scratch docs |
| `docs/finalization/` | Directory | Finalization scratch docs |
| `docs/superpowers/` | Directory | Duplicate / scratch superpower docs |

---

## CATEGORY C: REDUNDANT / DUPLICATE DOCUMENTATION

| Path | Evidence / Reason |
|---|---|
| `docs/ARCHITECTURE.md` (32 KB) + `docs/FINPLAN_PRO_COMPLETE_ARCHITECTURE.md` (86 KB) + `docs/DESKTOP_FIRST_ARCHITECTURE.md` (21 KB) | Multiple overlapping architecture docs; keep one authoritative, delete others |
| `docs/FINPLAN_CURRENT_STATE.md` (2 KB) + `docs/FINPLAN_PERFECTION_PLAN.md` (21 KB) + `docs/FINPLAN_COMPETITIVE_DOMINATION_PLAN.md` (20 KB) + `docs/ROADMAP.md` (106 KB) | Strategic planning docs; not needed for code/build/security |
| `docs/MASTER_PLAN.md` (6 KB) + `docs/MERGED_MASTER_PLAN.md` (52 KB) + `docs/MISSING_FEATURES_DEEP_DIVE.md` (12 KB) | Duplicate master planning docs |
| `docs/COMPLETE_PROJECT_SPEC.md` (29 KB) + `docs/COMPETITOR_ANALYSIS.md` (11 KB) + `docs/COMPETITOR_GAP_ANALYSIS_25.md` (14 KB) | Market/research docs not needed for audit or runtime |
| `docs/GAP_ANALYSIS_LIVE.md` (6 KB) + `docs/GAP_ANALYSIS_PART2_PART3.md` (9 KB) + `docs/GAP_DEEP_ANALYSIS_PART1_8.md` (19 KB) + `docs/GAP_DEEP_ANALYSIS_PART9_15.md` (9 KB) + `docs/GAP_PART4_FINANCIAL_DOMAIN.md` (2 KB) + `docs/GAP_PART5_DEEP_GAPS.md` (2 KB) + `docs/GAP_PART6_COMPETITIVE_DIFFERENTIATION.md` (5 KB) | Redundant gap-analysis series |
| `docs/ONBOARDING.md` (12 KB) + `docs/FINPLAN_PRO_USER_GUIDE.md` (11 KB) + `docs/USER_GUIDE.md` (7 KB) + `docs/onboarding/` (directory) | Duplicate onboarding/user guides |
| `docs/TESTING.md` (29 KB) + `docs/_archive/muse-scratch/TESTING.md` (29 KB) | Duplicate testing docs |

---

## CATEGORY D: SCRATCH / PROPOSAL / PLAN DIRECTORIES

| Path | Evidence / Reason |
|---|---|
| `docs/plans/` | Entire scratch plan directory |
| `docs/proposals/` | Entire proposal scratch directory |
| `docs/rules/` | Process rules — scrap |
| `docs/ratification/` | Ritual/ratification docs — scrap |
| `docs/verdicts/` | Verdict scratch docs |
| `docs/security/security-deferrals.md` | Deferred security items — scrap unless actively tracking |
| `docs/perf/` | Performance scratch directory |
| `docs/bmad/` | Unused methodology directory |
| `docs/openhands/` | Unused collaboration directory |
| `docs/analytics/` | Unused analytics directory |
| `docs/case-studies/` | Unused case studies |

---

## CATEGORY E: ROOT-LEVEL PLANNING / STRATEGIC DOCS (NOT NEEDED FOR CODE)

| File | Size | Reason |
|---|---|---|
| `FINPLAN_CURRENT_STATE.md` | 2 KB | Scratch state doc |
| `FINPLAN_PERFECTION_PLAN.md` | 21 KB | Strategic plan |
| `FINPLAN_PRO_COMPLETE_ARCHITECTURE.md` | 86 KB | Duplicate architecture |
| `FINPLAN_COMPETITIVE_DOMINATION_PLAN.md` | 20 KB | Strategic plan |
| `FINPLAN_PRO_USER_GUIDE.md` | 11 KB | User guide duplicate |
| `PERFORMANCE_LOG.md` | 28 KB | Log file |
| `PROJECT_TASK_BOARD_2026-07-26.md` | 25 KB | Scratch task board |
| `ROADMAP.md` | 106 KB | Roadmap |
| `SECURITY.md` | 2 KB | Security doc (keep if authoritative, else scrap) |

---

## CATEGORY F: CONFIG / SCRIPT FILES NOT NEEDED FOR PRODUCTION BUILD

| File | Reason |
|---|---|
| `.mcp.json` | MCP server config — not needed |
| `skills-lock.json` | Unused skills lock |
| `portless.json` | Unused port config |
| `.lintstagedrc.json` | Can keep for dev, not needed in production image |
| `.prettierignore` / `.prettierrc` | Formatting config — optional for build |
| `.npmrc` | Registry config — optional |
| `.mimocode/` | Entire directory |

---

## CATEGORY G: DOCUMENT FOLDERS WITH MASSIVE DUPLICATE CONTENT

| Path | Size / Count | Evidence |
|---|---|---|
| `docs/parts/` | Multiple parts | Scratch parts directory |
| `docs/sectors/` | Multiple sectors | Scratch sectors |
| `docs/vision-pivot/` | Scratch vision docs |
| `docs/extreme-perfection/` | Scratch perfection docs |
| `docs/master-continuity/` | Scratch continuity docs |
| `docs/leader/` (inside docs/) | Duplicate leader docs |
| `docs/leader_archive/` | Archive leader docs |

---

## TOTAL IMPACT

- `docs/_archive/muse-scratch/` alone: ~536 KB, 24 subdirectories, hundreds of scratch files.
- `docs/agent-shared-memory.json`: 1.32 MB.
- `docs/` overall: 2,438 files — a significant portion are scratch/duplicate/proposal/ritual.
- `.ai/`, `agent_runs/`, `.mimocode/`, `.superpowers/`: agent artifacts.
- `docs/CAVEMAN_PERSIST/`: ritual docs.

---

## RECOMMENDATION

Delete `docs/_archive/` entirely. Delete agent scratch directories (`.ai/`, `agent_runs/`, `.mimocode/`, `.superpowers/`). Consolidate all architecture/docs into a single authoritative source (`docs/ARCHITECTURE.md` only) and delete all duplicates. Move strategic planning docs (`FINPLAN_*`, `ROADMAP.md`, `MASTER_PLAN.md`) out of the repo or into an external wiki. Remove `docs/CAVEMAN_PERSIST/` and all ritual/process directories (`cross-witness/`, `ratification/`, `verdicts/`, `finalization/`).
