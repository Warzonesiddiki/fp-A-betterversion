---
name: verification-before-completion
description: >
  Use before saying done, fixed, passing, clean or green — in a reply, a commit,
  a PR body or a Notion page. Run the command, read the output, then claim.
group: discipline
---

# Verification before completion

**Use when** about to make any statement that work is complete or working.
**Never skip** because the change is small or the gate is slow.

## Iron law

No completion claim without evidence produced **in this session**.

## The loop

1. **Identify** the command that proves the claim.
2. **Run** the whole command, fresh. Not the tail of an old log.
3. **Read** the exit code and the full failure list, not the last line.
4. **Decide**: claim with the number, or state the actual status with the number.
5. Only then write the sentence.

## Claim → what actually proves it

| Claim | Proves it | Does not prove it |
| --- | --- | --- |
| types are sound | `npm run tsc` exit 0 | the editor not complaining |
| lint clean | `npm run lint` exit 0 | "small change" |
| tests pass | full run summary, failures = 0 | one focused file, last run |
| budget holds | `bundle-check` output | a build that looked fine |
| docs true | `npm run docs:verify` exit 0 | the sentence reading well |
| links resolve | `npm run docs:links -- --strict` | a rendering check |
| CI green | a CI result | a local run with the same script |

## In this repo

- A local run does not establish CI status. Check the current GitHub check result
  when available; if it cannot be inspected, label CI status unverified rather than
  inferring green or red.
- A recorded number is dated and named as recorded — never restated as measured.
- A partial run is reported as partial, with the files it covered.

## Red flags

- "Should be fine", "probably", "looks good", "done!" before the command.
- Quoting a summary from earlier in the session after code changed since.
- Reading only the tail of a log and inferring the total.

**Source:** adapted from obra/superpowers `verification-before-completion` (MIT).
