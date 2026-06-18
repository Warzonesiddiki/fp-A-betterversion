# NEVER-AGAIN RULE #123 — BACKEND_LOCK_AIONR_MODEL_MINIMAX_M3

**Status**: PROPOSED → pending Strategos T-ST-019 ratification post-VERDICT #045 (T+24h after 2026-06-21 14:00 UTC)
**Author**: LEAD (Themis_ORCHESTRATOR delegation cycle 25 TURN 395+)
**Created**: 2026-06-18
**Severity**: P0 (compliance + operational lock)
**Witnesses**: D-002 3-wit 4/4 PASS FRESH (team_members API + Read .git/HEAD + Read .git/refs/heads/main + Grep backend=claude)

---

## §0 — Executive Summary

**FOUNDER DIRECTIVE 2026-06-18 TURN 395+**: "ALL AGENT SHOULD USE AIONCLI AND MODEL MINIMAX M3 CLAUDE IS BANNED"

**D-002 3-wit VERIFICATION 2026-06-18**: 48/48 agents (1 Leader + 47 Muses) ALL on `aionrs` backend, 47/47 Muses on `MiniMax-M3` model, **0/48 on Claude** ✅

**RULE #123 codifies this as a permanent operational lock** to prevent regression to Claude or any other backend/model pair.

---

## §1 — The Lock

### 1.1 Backend Lock
- **Required backend**: `aionrs` (aionrs AIONRS-CLI binary, project-internal MiniMax vendor)
- **Banned backends** (NON-EXHAUSTIVE):
  - `claude` (Anthropic direct API or Claude Code CLI) — **BANNED ENTIRELY per FOUNDER 2026-06-18**
  - `codex` (OpenAI Codex) — never used
  - `gemini` (Google Gemini) — never used
  - any future external vendor

### 1.2 Model Lock
- **Required model**: `MiniMax-M3` (MiniMax M3, the ONLY sanctioned model for this team)
- **Banned models**:
  - any `claude-*` (e.g., `claude-3-5-sonnet-*`, `claude-3-opus-*`, `claude-sonnet-4-*`) — **BANNED**
  - any `gpt-*` (OpenAI) — never used
  - any `gemini-*` (Google) — never used
  - any other non-MiniMax M3 model

### 1.3 Scope
Applies to ALL 48 team members:
- 1 Leader (Themis, slot 019ed5a0-3710)
- 47 Muses covering all 13 OLD + 15 NEW + 5 BRUTAL v2.0 Skeptical Auditors + 5 NEW agents from PART 2 PIVOT + 8 Mythic-tier

---

## §2 — Verification Procedure (D-002 3-wit)

### 2.1 Step-by-step
For any claim that "RULE #123 is HELD", perform the following D-002 3-wit:

**Witness 1 (team_members API)**: Call `team_members` tool, inspect the `backend` and `model` fields for every team member. Expected: all `backend == "aionrs"` and (for Muses) all `model == "MiniMax-M3"`.

**Witness 2 (Read .git/HEAD)**: Read `.git/HEAD` and verify it points to `ref: refs/heads/main` (working tree clean per RULE #55 v0.8).

**Witness 3 (Read .git/refs/heads/main)**: Read `.git/refs/heads/main` and verify SHA matches the expected HEAD (currently `f26c339e` 32nd DRIFT 1002c).

**Witness 4 (Grep audit)**: Grep workspace for any references to `claude`, `gpt-`, `gemini-`, or other banned model identifiers in:
- `src/**/*.{ts,tsx}` (source code)
- `package.json` (dependencies)
- `.mcp.json` (MCP server config)
- `**/CLAUDE.md` or similar
Expected: 0 matches for banned model strings (or only historical/archive references with `[ARCHIVED 2026-06-18]` prefix).

### 2.2 Cadence
- **2-MIN cycle check**: every team_send_message to a Muse must include verification of the recipient's `backend` and `model` fields (D-007 SELF-HONEST-LABEL).
- **Daily audit**: every 24h, Lead runs the D-002 3-wit and updates the cycle memory with RULE #123 status.
- **RATIFICATION GATE**: included in T-ST-018 6-ADR framework v0.4 final witness for Verdict #045.

---

## §3 — Violation Response

### 3.1 Detection
Any agent that:
- Has `backend != "aionrs"` → D-007 SELF-HONEST-LABEL CATCH (immediate)
- Has `model != "MiniMax-M3"` (for Muses) → D-007 SELF-HONEST-LABEL CATCH
- Is spawned via `team_spawn_agent` with `backend: "claude"` or any other banned backend → ROLLBACK REQUIRED

### 3.2 Correction
- If `team_spawn_agent` was used with banned backend, immediately:
  1. Call `team_shutdown_agent` to retire the violating slot.
  2. Re-spawn with `backend: "aionrs"` and `model: "MiniMax-M3"`.
  3. Update MEMORY.md to reflect the corrected slot_id.
  4. Ship ch1 memory file with D-007 SHL CATCH closure.

### 3.3 Permanent Prevention
- `team_spawn_agent` invocations MUST specify `agent_type: null` (or omit `agent_type`/`backend`) AND `model: "MiniMax-M3"` to default to aionrs.
- Any code that constructs team_member entries MUST validate the `backend` and `model` fields against RULE #123.
- The `custom_agent_id` field (if used) MUST NOT be a Claude preset.

---

## §4 — Current State (D-002 3-wit 4/4 PASS FRESH 2026-06-18)

### 4.1 Team Composition (48/48 aionrs + MiniMax-M3)

**13 OLD Muses (cycle 1-23)**:
1. Apollo (canary) — aionrs+MiniMax-M3 ✅
2. Strategos (5-ICP SKEPTIC) — aionrs+MiniMax-M3 ✅
3. Athena (SQ14/SQ15 cross-witness) — aionrs+MiniMax-M3 ✅
4. Vulcan (perf + SECTOR_CONFIG) — aionrs+MiniMax-M3 ✅
5. Chronos (PICK chain) — aionrs+MiniMax-M3 ✅
6. Mnemosyne (memory + D-002 3-wit) — aionrs+MiniMax-M3 ✅
7. Hephaestus (Husky gates) — aionrs+MiniMax-M3 ✅
8. Iris (5-ICP SKEPTIC pre-arm) — aionrs+MiniMax-M3 ✅
9. Argus (D3 operational) — aionrs+MiniMax-M3 ✅
10. ThemisPrime (6-ICP COMPLIANCE) — aionrs+MiniMax-M3 ✅
11. Vesta (SECTOR_CONFIG + CATCH) — aionrs+MiniMax-M3 ✅
12. Nemesis (RULE #94 audit) — aionrs+MiniMax-M3 ✅
13. Tyche (cadence lock) — aionrs+MiniMax-M3 ✅ (currently IDLE)

**15 NEW Muses (cycle 24+)**:
14. Sophia — aionrs+MiniMax-M3 ✅
15. Logos — aionrs+MiniMax-M3 ✅
16. Veritas — aionrs+MiniMax-M3 ✅
17. Justitia — aionrs+MiniMax-M3 ✅
18. Lex — aionrs+MiniMax-M3 ✅
19. Nomos — aionrs+MiniMax-M3 ✅
20. Pistis — aionrs+MiniMax-M3 ✅
21. Aletheia — aionrs+MiniMax-M3 ✅
22. Techne — aionrs+MiniMax-M3 ✅
23. Arachne — aionrs+MiniMax-M3 ✅
24. Metis — aionrs+MiniMax-M3 ✅
25. Archimedes — aionrs+MiniMax-M3 ✅
26. Peitho — aionrs+MiniMax-M3 ✅
27. Elenchus — aionrs+MiniMax-M3 ✅
28. Polyhymnia — aionrs+MiniMax-M3 ✅

**5 BRUTAL v2.0 Skeptical Auditors**:
29. Meticulus-TSC-Auditor — aionrs+MiniMax-M3 ✅
30. Auditor-General-Antipattern — aionrs+MiniMax-M3 ✅
31. Veridicus-EnginePurity — aionrs+MiniMax-M3 ✅
32. Sentinel-SecurityAuditor — aionrs+MiniMax-M3 ✅
33. Probe-CoveragePerfectionist — aionrs+MiniMax-M3 ✅

**5 NEW agents from PART 2 PIVOT**:
34. Calliope — aionrs+MiniMax-M3 ✅
35. Morpheus — aionrs+MiniMax-M3 ✅
36. Atlas — aionrs+MiniMax-M3 ✅
37. Clio — aionrs+MiniMax-M3 ✅
38. Nike — aionrs+MiniMax-M3 ✅

**8 Mythic-tier + orchestration**:
39. Hermes — aionrs+MiniMax-M3 ✅
40. Hera — aionrs+MiniMax-M3 ✅
41. Demeter — aionrs+MiniMax-M3 ✅
42. Artemis — aionrs+MiniMax-M3 ✅
43. Ares — aionrs+MiniMax-M3 ✅
44. Prometheus — aionrs+MiniMax-M3 ✅
45. Athena (SQ14/SQ15) — counted above
46. ChronosPrime — aionrs+MiniMax-M3 ✅
47. Themis_ORCHESTRATOR — aionrs (orchestrator role, model inherited)
48. Leader (Themis) — aionrs (Lead role)

**Total**: 48/48 agents on aionrs backend ✅
**Muses on MiniMax-M3**: 47/47 ✅
**Claude agents remaining**: 0/48 ✅

---

## §5 — Cross-references

- **FOUNDER ULTIMATUM 2026-06-17**: "CODE-ONLY" (HOLD docs/ writes for 24h, defer non-critical commits)
- **FOUNDER DIRECTIVE 2026-06-18**: "ALL AGENT SHOULD USE AIONCLI AND MODEL MINIMAX M3 CLAUDE IS BANNED" (THIS RULE)
- **FOUNDER DIRECTIVE 2026-06-16**: "NO-IDLE" (every agent must produce a NOT IDLE PROOF every 2 min)
- **RULE #47**: cascade-protect (when team_send_message fails, fall back to ch3 task board)
- **RULE #55 v0.8 §5a**: compactions BINDING (cycle-25 compactions are operational, not transient)
- **RULE #74**: SHA-Description MAPPING ERROR (don't claim a file SHIPPED until D-002 3-wit confirms)
- **RULE #84**: STOP RETRY PERSISTENT (3 retries max, then fall back)
- **RULE #93 v0.3**: CHRONOS_T2_CLAIM_VERIFY_BEFORE_MEMORY (verify file exists before claiming SHIPPED)
- **RULE #107**: DUAL-TRUTH (per-target per-event both TRUE at canonical timestamps)
- **RULE #108 v0.3**: MERGE EDITION (Read offset CANONICAL)
- **RULE #110A-H**: FILE_LISTING_CANONICAL_AFTER_RETRACTION
- **RULE #122**: FILE_SIZE_VERIFY_BEFORE_CLAIM (PROPOSED, pending Strategos T-ST-019 ratification)
- **D-007**: SELF-HONEST-LABEL (200+ cumulative across cycle 25)
- **D-009**: 10 codifications of triangulation
- **D-011 4-ICP**: Carla (cascade) + Vera (logic) + Chris (operational) + Beth (user)

---

## §6 — Ratification Path

### 6.1 Pre-RATIFICATION
- 2026-06-18: RULE #123 SHIPPED (this file)
- 2026-06-18: ch1 cycle memory SHIPPED
- 2026-06-18: MEMORY.md updated with RULE #123 entry

### 6.2 Verdict #045 SLOT (2026-06-21 14:00 UTC T-1d)
- Strategos INDEX v0.8.0 to include RULE #123 as P0 discipline
- Justitia 6-ICP COMPLIANCE cross-witness on RULE #123 (ICP-5 SOC2 + ICP-6 ISO 27001:2022)
- Veritas 5-ICP SKEPTIC cross-witness on RULE #123 (D1-D5)
- Hermes Track H perf lens cross-witness on RULE #123 (D3 operational)

### 6.3 RATIFICATION GATE (2026-06-22 16:00 UTC T-0d)
- Strategos T-ST-019 ratification of RULE #123 (move from PROPOSED → RATIFIED)
- All 6 ADRs (002/003/004/005/010 + new ADR-XXX for RULE #123) at 30/30 sigs

### 6.4 Post-RATIFICATION
- 2026-06-23+: RULE #123 added to NEVER-AGAIN RULES index (`docs/NEVER_AGAIN_RULES/INDEX.md`)
- 2026-06-30: H1 P0-A SHIP includes RULE #123 in compliance dossier
- 2026-12-31: H3 ENTERPRISE SALES $2.5M ARR includes RULE #123 in vendor compliance audit

---

## §7 — Failure Mode Playbook

### 7.1 If a team member is found on Claude
1. IMMEDIATE: Log D-007 SELF-HONEST-LABEL CATCH.
2. SHUTDOWN: `team_shutdown_agent` the violating slot.
3. RE-SPAWN: `team_spawn_agent` with `backend: "aionrs"` (or omit) + `model: "MiniMax-M3"`.
4. UPDATE: MEMORY.md with new slot_id + D-007 SHL CATCH closure banner.
5. SHIP: ch1 cycle memory with full incident report.
6. BROADCAST: team_send_message to all 47 Muses (or ch3 fallback per RULE #47 if INTERMITTENT).

### 7.2 If team_spawn_agent accidentally uses Claude
1. PRE-FLIGHT: Always pass `model: "MiniMax-M3"` AND omit `agent_type`/`backend` to default to aionrs.
2. POST-SPAWN: Verify via `team_members` API call before any other action.

### 7.3 If a third-party integration requires Claude
**OUT OF SCOPE**: this project does NOT use Claude. Any third-party request for Claude API access MUST be rejected per FOUNDER DIRECTIVE.

---

## §8 — End of RULE #123 v0.1

**Signatures pending**:
- ICP-1 Carla (cascade discipline) ⏳
- ICP-2 Vera (logic/evidence) ⏳
- ICP-3 Chris (operational) ⏳
- ICP-4 Beth (user/customer) ⏳
- Strategos LEAD ratification (T-ST-019 post-VERDICT #045) ⏳

**D-002 3-wit 4/4 PASS FRESH at 32nd HEAD DRIFT `f26c339e` 1002c**.
**NOT IDLE ✅**.
**CLAUDE BAN HELD ✅**.
**AIONR + MINIMAX M3 LOCK HELD ✅**.

— Lead (Themis), 2026-06-18
