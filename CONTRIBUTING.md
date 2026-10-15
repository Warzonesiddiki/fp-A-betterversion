# Contributing to FinPlan Pro

**Start with [`AGENTS.md`](AGENTS.md).** It is the canonical entry point for
humans and agents alike; the full handbook is in
[`docs/agent/00_INDEX.md`](docs/agent/00_INDEX.md).

The short version:

1. Read `AGENTS.md`, `docs/agent/00_INDEX.md`, `docs/agent/09_KNOWN_GAPS.md`.
2. Work only on items in `docs/discovery/roadmap.md` for the open gate or the
   audit's prioritised list; do not resolve open decisions (DEC-001…006) in
   code.
3. Every change: failing test first, `npm run tsc`, `npm run lint`,
   `npm run format:check`, the ratchets you could have moved, targeted tests;
   `npm run check` before claiming "green".
4. Commit as `type(scope): summary` with gate tallies in the body
   (`docs/agent/07_WORKFLOW_AND_DOD.md`).
5. Update the docs that describe what you changed in the same commit.

Coding standards (TypeScript strict, no `any`, money only through
`@/utils/money`, time only through `@/utils/clock`, no new surface while a
gate is red) are in `docs/agent/04_ENGINEERING_RULES.md`. Domain invariants are
in `docs/agent/03_DOMAIN_RULES.md`.

The previous "agent swarm protocol" in this file referenced
`AGENT_SWARM/TASK_BOARD.md`, which does not exist in the repository; it is
superseded.
