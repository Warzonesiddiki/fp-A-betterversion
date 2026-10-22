---
name: receiving-review
description: >
  Use when a review or audit finding arrives: verify it against the code before
  agreeing or disagreeing, and never quietly ignore it.
group: discipline
---

# Receiving review

**Use when** someone — a human, another agent, or your own audit — reports a
problem in your work.

## Method

1. **Reproduce the claim** before responding. Reviews are hypotheses.
2. Classify: (a) real bug, (b) real risk with a lower probability than stated,
   (c) taste, (d) wrong because the reviewer lacked context.
3. For (a): fix, add the failing-first test, say what it cost.
4. For (b)/(c): say what you changed, or why not, **in writing**, in the PR or the
   decision log. "Won't fix" without a reason is how debt becomes invisible.
5. For (d): answer with the smallest piece of evidence that settles it.
6. If the review reveals a gap in the gates, add the ratchet — do not rely on the
   reviewer catching it next time.

## In this repo

- A finding that a claim is unsupported outranks a finding about style.
- Do not weaken a gate to close a finding (see `gates-and-ratchets`).
- Record durable disagreements as a decision row, not as a comment thread.

## Red flags

- Agreeing to end the conversation.
- Fixing the symptom the reviewer saw instead of the cause.
- Deleting the test that made the finding legible.

**Proves itself with:** the finding's reproduction now passing, or a written reason.
**Source:** adapted from obra/superpowers `receiving-code-review` (MIT).
