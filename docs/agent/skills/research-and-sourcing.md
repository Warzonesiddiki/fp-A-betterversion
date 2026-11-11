---
name: research-and-sourcing
description: >
  Use before repeating any external fact, benchmark, standard or library claim:
  find the source, date it, and say what it does not prove.
group: discipline
---

# Research and sourcing

**Use when** a claim comes from outside this repository: a standard, a benchmark,
a library behaviour, a competitor feature.

## Method

1. Name the question precisely. "Is WCAG 2.2 AA required for enterprise sales?"
   beats "accessibility research".
2. Prefer primary sources: the spec, the changelog, the RFC, the code.
3. Date it. A 2019 benchmark is evidence about 2019.
4. Record what it does **not** establish — most bad claims are true statements
   stretched one step.
5. Summarise into the document that will be read; do not leave the finding in a
   chat message that the next session cannot see.

## Sandbox limits here

- Outbound network reaches github.com, codeload.github.com, api.github.com,
  registry.npmjs.org, pypi.org and files.pythonhosted.org. Nothing else is
  reachable, and `raw.githubusercontent.com` is blocked — use the GitHub contents
  API instead.
- A fact you could not fetch is labelled unfetched, not remembered.

## In this repo

- External claims in docs carry a source and a date, or they are cut.
- "Verified" is reserved for evidence measured here; a vendor page is not
  verification. Check accepted decisions in `docs/discovery/decision-log.md` and
  unanswered source/provider items in the master plan; dated taskboards are not
  automatically current.
- When a source contradicts the docs, the docs get corrected in the same session.

## Red flags

- A number with no origin that everyone repeats.
- Treating a library's marketing page as its behaviour.
- Citing a source you did not open.

**Proves itself with:** a citation a reader can open, plus its date.
**Source:** original.
