---
name: skill-authoring
description: >
  Use when adding a skill to this library: one job, a trigger line, the method,
  and the gate that proves it. Keep it short enough to be read in one pass.
group: meta
---

# Skill authoring

**Use when** a new repeatable method should be added to `docs/agent/skills/`.

## Shape

```
---
name: <file-name-without-.md>
description: >
  Use when <the trigger, in the words the work arrives in>. <one line on the output>
---

# Title

**Use when** …
**Skip when** …            (optional but useful)

## Method / Rules        (numbered, imperative, no essays)
## In this repo          (real paths and real commands)
## Red flags
**Proves itself with:** …
**Source:** original | adapted from <repo> (<licence>), rewritten
```

## Rules

1. **One job per skill.** If the title needs "and", split it.
2. **Trigger in the description** — that line is what makes the skill get used.
3. **No claim the repo cannot prove.** Name the command, or say "human judgement".
4. **Prefer deleting** an older skill over running two that disagree.
5. **Register it**: add the row to `docs/agent/skills/README.md` and to
   `docs/agent/00_INDEX.md`; `npm run skills:verify` fails if a file is unlisted,
   unindexed, or missing frontmatter.
6. **Cite provenance** for anything adapted; keep licences visible.

## In this repo

- The library index is `docs/agent/skills/README.md`.
- `npm run skills:verify` checks frontmatter, filename match, and index coverage.
- A skill that contradicts the gates in `docs/agent/05_COMMANDS_AND_GATES.md` is wrong;
  fix the skill.

## Red flags

- A skill longer than the work it describes.
- Two skills covering the same trigger with different advice.
- A skill that only restates a gate command.

**Source:** adapted from anthropics/skills `skill-creator` (see its licence in that
repository) and obra/superpowers `writing-skills` (MIT), rewritten for this repo.
