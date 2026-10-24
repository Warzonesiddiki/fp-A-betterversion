---
name: evidence-chain-verification
description: Use when verifying that evidence chains are complete and unbroken. Checks that every claim traces to a test, every test exists, and every title matches.
group: meta
---

# Evidence Chain Verification

**Use it when:** verifying that the evidence chain from claim → test → title is complete and unbroken.

## The Chain

```
Claim (in evidence JSON) → Test File (exists) → Test Title (verbatim match) → Behavior (tested)
```

## Method

1. **Load evidence:** Parse `docs/plan/spine-evidence.json` and `docs/plan/governance-evidence.json`.
2. **For each claim:** Check that:
   - The test file exists at the cited path
   - The test file contains the cited title verbatim
   - The title appears in an `it()`, `test()`, or `describe()` call
3. **For each route:** Check that:
   - The page file exists at the cited path
   - The page file does not contain forbidden phrases (e.g., "Excel is required")
4. **Report:** Any missing file, missing title, or forbidden phrase is a failure.

## What This Prevents

- Fabricated test titles in evidence files
- Citing test files that do not exist
- Titles that don't match the actual test (renamed, deleted, or never existed)
- Page files that contain forbidden phrases

## Related

- `zero-compromise-verification` — the overarching discipline
- `gates-and-ratchets` — how the verification gate works
- `route-promotion-evidence` — promoting routes with real evidence
