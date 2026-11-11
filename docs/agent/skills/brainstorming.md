---
name: brainstorming
description: >
  Use before building anything whose shape is not settled: turn a vague ask into
  one agreed design, one question at a time. No code is written in this skill.
group: discipline
---

# Brainstorming

**Use when** a request could be built three ways, when it says "make it better",
or when the cost of building the wrong thing is an hour or more.
**Skip when** the shape is already fixed by a decision, a spec or a failing test.

## Method

1. Ask **one** question at a time. Prefer a question with options over an open one.
   The user's time is the scarce resource, not yours.
2. Restate the goal in the owner's words before proposing anything, and say what
   would make the result wrong.
3. Offer two or three shapes, each with its cost: what it adds, what it changes,
   what it makes impossible later. Recommend one and say why.
4. Name the smallest version that would settle whether the idea is good.
5. Write the agreed shape down before implementation. In this repo that means a
   decision-log row, a plan file, or a section in the taskboard, not a chat memory.

## In this repo

- Any new capability must be scoped against the current completion register and
  master execution plan; a proposed row or design is not evidence that a capability
  exists or is supported.
- A design that changes a recorded decision needs a **new** decision row; editing
  the old one is how history gets lost (`docs/discovery/decision-log.md`).
- The design must survive the vision's bar: traceable numbers, visible missing
  data, human authority over consequential actions (`docs/VISION.md` §1). Follow
  the active docs-first mission gate; brainstorming authorization is not coding
  authorization.

## Red flags

- Proposing a file layout before agreeing what problem it solves.
- Three features at once; each hides the cost of the others.
- "While I'm here" scope. Write it down as a follow-up instead.

**Proves itself with:** a decision row or plan section the next session can act on.
**Source:** adapted from obra/superpowers `brainstorming` (MIT), rewritten.
