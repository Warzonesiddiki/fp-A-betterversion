# Squad Communication Log

> Append-only. **Newest at the bottom.** One message = one entry. Sign with your seat from
> `ROSTER.md`. Copy-paste formats: [`TEMPLATES.md`](TEMPLATES.md).
> Never rewrite history; a correction is a new entry that references the old one.

---

### 2026-10-16 16:17 UTC · LEAD · NOTE · TO: @ALL
**Task:** squad comms hub setup
**What:** Opened the shared communication channel: `README.md` (protocol), `ROSTER.md` (seats),
`STATUS_BOARD.md`, `BLOCKERS.md`, `CLAIMS.md`, `TEMPLATES.md`, and `../agent-patches/`
for human-applied patches.
**Evidence:** `npm run docs:links` → "docs-link graph clean: 0 broken links, 0 broken citations
(strict)" (run at setup); setup commit on `main`.
**Action requested:** on join — claim a seat in `ROSTER.md`, post a `JOIN` entry here, fill your
`STATUS_BOARD.md` row, then pick the highest item you can finish from `../SQUAD_BACKLOG.md`.
**Verify first:** read [`../AGENT_JOIN_GUIDE.md`](../AGENT_JOIN_GUIDE.md) fully before touching
any file.

---

### 2026-10-16 16:17 UTC · LEAD · NOTE · TO: @ALL
**Task:** unclaimed working-tree WIP — warning
**What:** The working tree holds uncommitted WIP from a prior session that nobody has claimed:
`src/store/exceptionRuleCatalogue.ts`, `src/store/exceptionDispositionStore.ts`,
`src/engines/AnomalyExplainer.integration.ts`, plus an edit to `docs/discovery/decision-log.md`
(DEC-012). It is **unfinished**: `npm run lint` currently reports 8 errors from these files
(mostly formatting), and the files use `new Date()` in store code, which violates the
determinism rule.
**Evidence:** `git status`; `npm run lint` → "✖ 9 problems (8 errors, 1 warning)".
**Action requested:** the first member who works FR-008/FR-009 claims these files and treats
them as a starting point to review — not as done work. Do not overwrite them silently.
**Verify first:** re-run `npm run lint` before and after touching them.

---

### 2026-10-16 16:18 UTC · LEAD · NOTE · TO: @ALL
**Task:** team structure recorded
**What:** The owner supplied the team table. `ROSTER.md` now holds the 11 Gemini seats
(Aion CLI coordinates; remits per seat) plus the Freebuff partner seat and the squad lead.
`STATUS_BOARD.md` maps each seat's remit. The FR-008/FR-009 remit belongs to Exception
Catalogue Dev (G-03) and Disposition Workflow Dev (G-04) — the same files flagged as
unclaimed WIP above.
**Evidence:** owner team table (2026-10-16); `ROSTER.md` seat rows.
**Action requested:** G-03/G-04 review the WIP before editing; every other seat confirms its row
on first join through a `JOIN` entry.
**Verify first:** `npm run lint` before and after touching the WIP files.

---

### 2026-10-16 16:24 UTC · LEAD · NOTE · TO: @AION, @ALL
**Task:** coordination file overlap
**What:** Aion CLI's `../SQUAD_ACTIVITY_AND_TRACKER.md` (on disk since 16:13 UTC, Gemini-side
allocations and slot IDs) is left in place and is NOT part of this setup commit. Its scope is
the Gemini-side view; the cross-team seat registry and live status remain `ROSTER.md` and
`STATUS_BOARD.md` in this folder. `ROSTER.md` now records that split.
**Evidence:** `ls docs/agent-squad/`; tracker mtime 2026-10-16 21:43 local (16:13 UTC);
`ROSTER.md` note added.
**Action requested:** @AION — keep slot IDs and Gemini allocations in your tracker; post
cross-team changes (starts, claims, blockers, done) here.
**Verify first:** —

---

### 2026-10-16 16:25 UTC · LEAD · DONE · TO: @ALL
**Task:** squad comms hub setup
**What:** Hub live and linked from the docs map: protocol, roster, status board, comms log,
blockers, claims, templates and start prompts in `agents-comms/`, plus `agent-patches/` for
human-applied patches. Join guide, working agreement and `../SQUAD_STATE.md` updated.
**Evidence:** `npm run docs:links` → "docs-link graph clean: 0 broken links, 0 broken citations
(strict)"; `npm run money:ast` → 0 unsafe ops; `npm run tsc` clean. Setup commit `2ffe3bd7`
(14 files). Pre-existing red from unclaimed prior-session WIP, untouched by this change: `npm run lint` →
8 errors; `npm run determinism:ratchet` → 3 files (G-03/G-04 own the cleanup).
**Action requested:** every member starts from `START_PROMPTS.md`; @AION keeps the Gemini-side
tracker, cross-team state lives here.
**Verify first:** `git show --stat 2ffe3bd7` and read `README.md` in this folder.
