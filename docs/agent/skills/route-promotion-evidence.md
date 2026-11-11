---
name: route-promotion-evidence
description: Use when promoting a route from EXPERIMENTAL to SUPPORTED. Requires real page tests with exact titles and real governance tests in spineGovernance.test.ts.
group: discipline
---

# Route Promotion Evidence

**Use it when:** promoting a route from EXPERIMENTAL to SUPPORTED in the completion register.

## Requirements

A route may be graded SUPPORTED only when:

1. **Page test exists:** The route's page component has a colocated `*.test.tsx` file with at least one meaningful test (not just "renders without crashing").
2. **Canonical evidence:** The route has a valid claim in `docs/plan/spine-evidence.json`; the cited file and exact test title resolve.
3. **Governance evidence:** The route has the required claim(s) in `docs/plan/governance-evidence.json`; exact cited files and titles resolve and prove applicable controls. Do not assume every valid claim must live in one test file or match a hand-written title prefix.
4. **Page path:** The evidence manifests point at real page/test files; the verifier enforces the current schema and connected/governed requirements.

## Method

1. Read route acceptance criteria and current status in the completion register and evidence manifests.
2. Add/repair failing-first page behavior and governance tests where the measured gap requires them; do not write titles from memory.
3. Record exact observed test paths/titles in the evidence records according to their current schemas; do not hand-edit generated views.
4. Run `npm run spine:evidence`, `npm run governance:evidence`, `npm run completion:register:check`, and `npm run docs:verify`.
5. Recheck the generated truth matrix with `npm run capability:inventory:check`; report exactly what evidence establishes and what remains unverified.

## What this prevents

- Promoting routes with fabricated test titles
- Promoting routes without governance evidence
- Using generic titles that don't match real tests
- Pointing to page paths that don't exist

## Related

- `zero-compromise-verification` — the overarching discipline
- `gates-and-ratchets` — how the verification gate works
