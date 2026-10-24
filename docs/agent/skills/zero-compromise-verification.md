---
name: zero-compromise-verification
description: Use when claiming any capability is complete, verified, or perfect. Proves the claim with failing-first tests, exact evidence, and honest boundaries.
group: discipline
---

# Zero-Compromise Verification

**Use it when:** any claim is made about a capability being complete, verified, connected, governed, or enterprise-ready.

**The rule:** A claim is only true when the gate that enforces it passes, and the gate only passes when the evidence is real. No shortcuts, no fabrication, no optimistic statuses.

## Method

1. **Failing first:** Write the test that would fail without the work. Watch it fail. Then implement. Never write tests that pass trivially.
2. **Exact evidence:** Every claim names a test file and the exact test title inside it. The verification gate fails when the file or title does not resolve.
3. **Honest boundaries:** State what is NOT claimed. "SUPPORTED" does not mean "enterprise-ready." "GOVERNED" does not claim entity-scope authorization (O9 is BLOCKED-ON-OWNER).
4. **Zero fabrication:** Never invent test titles, page paths, or evidence that does not exist. If the evidence is missing, the status stays EXPERIMENTAL.
5. **Ratchet discipline:** Baselines move one way. If a ratchet drifts, fix the code, not the baseline (unless the baseline was wrong and the correction is recorded).

## What this prevents

- Fabricated test titles in evidence files
- Promoting routes to SUPPORTED without real governance tests
- Claiming "your data is safe" without a restore test
- Calling D365 "verified" without a real export
- Saying "complete" when 93 sections are UNASSESSED

## Related

- `gates-and-ratchets` — how gates and ratchets work
- `verification-before-completion` — run the command before claiming done
- `requirements-traceability` — map every requirement to evidence
