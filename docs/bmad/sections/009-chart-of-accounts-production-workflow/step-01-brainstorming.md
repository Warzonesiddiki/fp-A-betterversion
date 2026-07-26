# Step 01 — brainstorming

Section 009 completes the current Chart of Accounts hardening slice by extracting validation logic into a tested domain helper and wiring the page to it.

## Acceptance Evidence

- Duplicate code validation is centralized.
- Account type aliases are normalized.
- Circular parent relationships are detected.
- Parent dropdown excludes self and descendants while editing.
- Relevant tests and gates pass.
