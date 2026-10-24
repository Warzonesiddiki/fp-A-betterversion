---
name: vision-alignment
description: >
  Use before starting any new surface, route, engine, store, capability, or
  when unsure whether a piece of work serves the product goal. Maps the work to
  the owner's four jobs (J1–J4) and one of the six pillars before a line is
  written.
group: discipline
---

# Vision alignment

**Use when:** starting any new surface (route, page, engine, store, connector,
sector pack) or any capability that claims to serve the product — or when unsure
whether a task is in scope.

**Skip when:** the work is a repair, guard, test, doc, or gate change that
serves an already-aligned surface; then the narrower skill or gate applies.

## Why this exists

The vision says "all-in-one FP&A" and the working agreement names four owner
jobs (J1–J4). A surface that serves no job and no pillar is scope creep — and
`AGENTS.md` §2 #8 ("No new surface before the spine works") exists to stop it.
Alignment is decided before building, not defended after.

## Method

1. **Name the job.** Which of the owner's four jobs does this serve?
   - **J1** — one D365 GL dump in, one workspace out.
   - **J2** — find the wrong entries.
   - **J3** — guide the accounts team to fix them.
   - **J4** — compare day / month / year in extreme detail.
     If it serves none of J1–J4, it is scope creep: stop and ask the owner
     (`AGENTS.md` §7). Do not build it and ask later.
2. **Name the pillar.** Which of the six pillars does it belong to?
   **DATA** · **CLOSE** · **PLAN** · **ANALYZE** · **MODEL** · **REPORT**
   (cross-cutting: **ADMIN**, **GOVERN**, **AI**). If it belongs to none, it
   does not belong to the product.
3. **Find the queue row.** Which row in
   [`docs/agent/WORKING_AGREEMENT.md`](../WORKING_AGREEMENT.md) §4 owns it?
   Work the topmost open row for that job. Do not start a new surface ahead of
   the queue.
4. **Find the spine gate.** If this is a new surface, is the spine (import →
   tie-out → statements → exception → consolidation → board output) working
   end-to-end on a synthetic D365-shaped file? `AGENTS.md` §2 #8 blocks new
   surfaces until Gate 2 of the roadmap is green.
5. **Find the skill and the gate.** Match the work to a skill in
   [`docs/agent/skills/README.md`](README.md) and the gate in
   [`docs/agent/05_COMMANDS_AND_GATES.md`](../05_COMMANDS_AND_GATES.md). A
   skill raises rigour; it never upgrades a claim.
6. **Record the alignment.** The commit message names the job, the pillar, and
   the queue row. The requirements register gets the alignment if it is a new
   capability.

## In this repo

- The goal and four jobs: [`docs/VISION.md`](../../VISION.md) §1,
  [`docs/agent/WORKING_AGREEMENT.md`](../WORKING_AGREEMENT.md) §1.
- The live queue: `docs/agent/WORKING_AGREEMENT.md` §4.
- The six pillars: `docs/VISION.md` §2.
- The "no new surface" rule: `AGENTS.md` §2 #8.
- The stop-and-ask rule: `AGENTS.md` §7.

## Red flags

- A surface that cannot name its job and pillar.
- Building ahead of the queue ("I'll come back to the spine").
- A capability that duplicates a queued item under a new name.
- Alignment decided in the commit message after the fact, instead of before.

**Proves itself with:** a commit message or register row that names J1–J4 and the
pillar for every new surface.

**Source:** original to FinPlan Pro, derived from the owner's four jobs
(DEC-015…DEC-018) and the vision's no-ceiling / no-new-surface rules.
