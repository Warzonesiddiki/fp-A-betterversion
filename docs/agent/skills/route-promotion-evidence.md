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
2. **Exact title:** The test title is recorded verbatim in `docs/plan/completion-register.json`. The verification gate checks that the title exists in the file.
3. **Governance evidence:** The route has at least one test in `src/__tests__/spineGovernance.test.ts` that starts with `GOVERNED {route}` and proves authorization, audit, or write-guard behavior.
4. **Page path:** The `page` field in `governance-evidence.json` points to a real file that exists.

## Method

1. Find the route's test file: `src/pages/{path}/*.test.tsx`
2. Extract exact test titles using regex: `(?:it|test)\s*\(\s*['"\`]([^'"\`]+)['"\`]`
3. Skip "smoke test" and "renders without crashing" — use a meaningful title.
4. Find the governance test title: search `spineGovernance.test.ts` for titles starting with `GOVERNED {route}`.
5. Update `completion-register.json` with the exact titles.
6. Update `governance-evidence.json` with the exact titles and real page path.
7. Run `npm run docs:verify` — it must PASS.

## What this prevents

- Promoting routes with fabricated test titles
- Promoting routes without governance evidence
- Using generic titles that don't match real tests
- Pointing to page paths that don't exist

## Related

- `zero-compromise-verification` — the overarching discipline
- `gates-and-ratchets` — how the verification gate works
