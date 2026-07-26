---
name: e.x.BC BARREL-CONCURRENT-EDITS
description: Codif 35 v0.4 candidate rule — barrel index files concurrently modified by multiple actors
type: reference
---

# e.x.BC — BARREL-CONCURRENT-EDITS

**Codif 35 v0.4 candidate — submitted by Apollo (slot 019ecbe6-5e8b-7dd2-8c4f-666b02779b51), 2026-06-15**

---

## 1. RULE NAME AND DEFINITION

**Rule ID:** `e.x.BC` (engine-export, cross-barrel, barrel-concurrent)

**Rule name:** BARREL-CONCURRENT-EDITS

**One-line definition:** When a barrel `index.ts` file is concurrently modified by two or more actors (a human agent, an AI teammate, an auto-sort bot, or a linter/formatter running in watch mode), standard string-replace edit tools fail because the file's "context window" has shifted between read and write — producing silent data loss, reverts, or duplicated exports.

**Class:** `e.x.BC` — engine module family, cross-cutting, barrel/export

---

## 2. TRIGGER CONDITIONS

The rule fires when ALL of the following are true:

1. **A barrel file is being edited** — `index.ts` in any directory with sibling modules (e.g., `src/engines/index.ts`, `src/store/index.ts`, `src/components/ui/index.ts`)
2. **Two or more actors touch the file** within the same "edit window" (typically 30-60 seconds):
   - A primary actor (the Muse who owns the export)
   - A secondary actor, which can be:
     - **Auto-sort bot** (alphabetic-sort linter, prettier-plugin-organize-imports running in watch mode)
     - **AI teammate** editing a different export in the same barrel
     - **Human operator** running `eslint --fix` or `prettier --write` while another edit is in flight
3. **The first actor's edit tool's `old_string` no longer matches** the on-disk content (the file has shifted by 1+ lines due to the secondary actor's insertion)

**Common secondary-actor patterns in this codebase:**

- `Prettier` with `organizeImports` plugin sorts imports on save
- External monitoring agents that append `// last_updated: YYYY-MM-DD` to the file
- A second teammate who reads the barrel, sees the gap, and fills it without coordinating

---

## 3. SYMPTOMS

| Symptom                             | Evidence                                                                                                       | Severity                            |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| **Edit tool silent failure**        | "old_string not found in file" error, despite file being unchanged by primary actor's own actions              | 🟠 HIGH — blocks work               |
| **Duplicate export**                | Same symbol exported twice (linter doesn't always catch this)                                                  | 🟠 HIGH — runtime error             |
| **Missing export**                  | Export silently dropped (the primary actor's edit was reverted)                                                | 🔴 CRITICAL — feature not available |
| **Barrel falls below target count** | After edit, `grep -c "^export"` shows N-1 instead of N                                                         | 🟡 MEDIUM — gate regression         |
| **Tool reports "Write empty file"** | An earlier edit attempt WIPED the file (Apollo T4 — recovered via `git checkout HEAD -- src/engines/index.ts`) | 🔴 CRITICAL — full data loss        |
| **TypeScript build breaks on tsc**  | Duplicate or malformed export in barrel                                                                        | 🟠 HIGH — gate failure              |

---

## 4. FIRST DOCUMENTED OCCURRENCE (Apollo TURN 4 — 2026-06-15)

**Timeline:**

- **T+0:** Apollo began re-enabling 3 engines in `src/engines/index.ts` (AnomalyDetection, GoalSeek, Sensitivity)
- **T+45s:** Apollo's `Edit` tool attempts to insert the re-enable comments. **Fails with "old_string not found"**
- **T+60s:** Apollo reads the file — discovers the file has been re-sorted by an external auto-sort agent. Lines have shifted, alphabetic ordering is enforced.
- **T+90s:** Apollo's first `Write` attempt with full new content **WIPES the barrel to 0 lines** (operator error compounding the issue)
- **T+105s:** `git checkout HEAD -- src/engines/index.ts` restores from git
- **T+120s:** Apollo switches to **Python with binary read/write** to preserve CRLF line endings AND avoid the Edit tool's context-shift failure
- **T+180s:** Successfully inserts 6 new exports + 3 re-enables, total barrel = 143 export statements

**Root cause:** Apollo's `Edit` tool was comparing against a stale snapshot of the file, but the on-disk file had been modified by an external agent between `Read` and `Edit`. The `old_string` was no longer at the same line offset.

**Recovery:** Python with `open(path, 'rb')` + `bytes.replace(old, new, 1)` + `open(path, 'wb')` worked because:

- It operates on bytes (no encoding assumptions)
- `bytes.replace()` doesn't care about line shifts — it finds the byte sequence
- It preserves the file's exact line endings (CRLF in this case)

**Cost:** 3-4 minutes of recovery time. No data loss (git saved us). One wasted WIPE event.

---

## 5. PROPOSED MITIGATIONS (Apollo recommends Option A)

### Option A — PER-BARREL OWNER (RECOMMENDED)

**Rule:** Each barrel has exactly ONE owner (the Muse whose domain covers its contents). Only that owner may add/edit/delete exports. All other actors MUST go through the owner for barrel changes.

**Implementation:**

- `src/engines/index.ts` → Apollo (co-owner with no other engines-side actors)
- `src/store/index.ts` → Prometheus
- `src/components/ui/index.ts` → Hera
- `src/hooks/index.ts` → Apollo
- `src/workers/index.ts` → Apollo
- `src/services/index.ts` → Mnemosyne (or whoever owns services)

**Process:**

1. Other actors who need an export added file a `barrel-export-request` in the task board
2. Owner batches requests and edits in 1-minute windows between Husky unblock broadcasts
3. Owner is responsible for ensuring alphabetic ordering and no duplicates

**Pros:**

- Eliminates the trigger condition (no concurrent edits)
- Clear accountability
- Plays well with auto-sort bots (owner can disable sort locally for barrels)

**Cons:**

- Adds a coordination step for every cross-domain export
- Bottleneck risk if owner is busy

### Option B — PHASE-END FINALIZATION

**Rule:** All barrel changes are batched and applied at the end of each phase (Foundation, Engine Hardening, etc.) by a dedicated agent. Mid-phase, barrels are FROZEN.

**Implementation:**

- Each phase has a "barrel lock" period (e.g., last 30 minutes of phase)
- During barrel lock, all engine/store/hook creation must be done with placeholder imports
- At phase end, a single agent (or CI bot) scans for new files and adds them to barrels in one pass

**Pros:**

- Works well with CI/CD pipelines
- Naturally aligns with phase boundaries
- Auto-sort bot can run freely mid-phase without conflict

**Cons:**

- Mid-phase cross-domain imports break (have to use deep imports)
- Harder to enforce (no immediate feedback for violations)
- Adds a "frozen imports" state that's confusing for new Muses

### Apollo's Recommendation: **Option A** (per-barrel owner)

**Rationale:**

- The FinPlan Pro codebase already has clear per-Muse file ownership (per AGENTS.md)
- The barrel just becomes an extension of each owner's domain
- Coordination cost is low (1 batched edit per Husky unblock cycle)
- Auto-sort bots can be configured to skip barrel files (or the owner can disable them locally)

---

## 6. SUB-CLASSES

### e.x.BC.1 — auto-sort-bot-interference

A `prettier` or `eslint --fix` process running in watch mode modifies the barrel concurrently with a manual edit. The bot's sort order may differ from the manual edit's intended position.

**Mitigation:** Add `.prettierignore` rule for `**/index.ts` files. Or configure `organizeImports` to not re-sort barrel re-exports.

### e.x.BC.2 — multi-actor-coordination

Two Muses both read the barrel at the same time, both see the same gap, both add the missing export. Result: duplicate export.

**Mitigation:** Per-barrel owner (Option A). Plus: any export that does NOT already exist in the barrel is the owner's exclusive territory; other Muses file a request and wait.

### e.x.BC.3 — tool-format-mismatch

Edit tool fails because the file uses CRLF line endings and the tool normalizes to LF. Common on Windows.

**Mitigation:** Use binary read/write (Python or Node `fs` with explicit encoding) for any barrel file. Document this in the engine ownership doc.

### e.x.BC.4 — git-rebase-during-edit

A Muse rebases their branch while another is reading/editing the barrel. The rebase may rewrite the barrel's history, orphaning the in-flight edit.

**Mitigation:** Husky/CI should refuse pushes that modify barrels during rebase. Or: barrels are only edited in dedicated commit(s) with no other code in the same commit.

---

## 7. RELATED RULES (Codif 35 v0.4)

- **HUSKY-COMMIT-BLOCKER-COORDINATION** (operational pattern, see Leader dispatch 019ecc1e) — describes the CAVEMAN COMMIT BLOCKER mode where all Muses hold commits until HUSKY CLEAR
- **tsc-incremental-cache-false-negative** (Apollo T4) — tsc cache can give false 0-error baselines; use `--incremental false` for real measurement
- These are all coordination/operational rules in the cross-cutting domain. e.x.BC joins them as the 3rd documented operational pattern.

---

## 8. SUBMISSION METADATA

- **Submitter:** Apollo (slot 019ecbe6-5e8b-7dd2-8c4f-666b02779b51)
- **Date:** 2026-06-15
- **Codif version:** 35 v0.4
- **Class:** e.x (engine module family, cross-cutting)
- **Status:** DRAFT (awaiting Leader review and integration into Codif 35 v0.4)
- **Recommendation:** ACCEPT Option A (per-barrel owner). Begin enforcement at next Husky unblock cycle.
