---
name: gates-and-ratchets
description: >
  Use when adding, changing or bypassing a check. A gate is only worth what it
  catches; a ratchet only moves one way.
group: engineering
---

# Gates and ratchets

**Use when** you add a rule, fix a rule's failure, or feel tempted to loosen one.

## The rules

1. **A gate must be able to fail.** Write the violation first, watch the gate
   catch it, then remove the violation. Otherwise you have written a comment.
2. **Ratchet direction:** the number may improve freely; making it worse needs a
   written reason and a new baseline, in a decision row. Editing the baseline to
   match today's state is erasing the audit.
3. **Never fix a claim by editing the checker.** The checker measures the tree;
   the tree is what changes.
4. **A gate that is skipped is a gate that is false.** `--no-verify`, `|| true`,
   and "known failure" lists are the failure modes, not the fix.
5. **Name the failure output.** A gate should tell the next person the file, the
   line and the rule, in one line they can act on.
6. **Prefer one gate over three scripts** when they enforce the same rule.

## In this repo

| Rule | Gate |
| --- | --- |
| docs match the tree | `npm run docs:verify` |
| citations resolve | `npm run docs:links -- --strict` |
| money arithmetic safe | `npm run money:ast` |
| no invented financial literals | `npm run fabrication:audit` |
| deterministic calculations | `npm run determinism:ratchet` |
| theme tokens, not palette stops | `npm run palette:ratchet` |
| type safety not getting worse | `npm run type-safety:ratchet` |
| imports respect layering | `npm run architecture:guardrails` |
| engine manifest current | `npm run engines:verify` |
| skills indexed | `npm run skills:verify` |

## Red flags

- A new "advisory" check that nobody runs.
- Baseline reset in the same commit as the violation.
- A test asserting the gate's implementation instead of its behaviour.

**Source:** original, from this repository's gate culture.
