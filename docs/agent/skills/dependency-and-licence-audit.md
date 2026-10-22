---
name: dependency-and-licence-audit
description: >
  Use before adding a package or upgrading one: size, licence, maintenance, and
  whether the platform already does it.
group: engineering
---

# Dependency and licence audit

**Use when** a package is about to be added, upgraded, or replaced.

## Checklist before adding

1. **Can the platform do it?** A 40-line helper beats a dependency you must audit
   forever.
2. **Size**: measure the gzip cost against the 2,080 KB budget.
3. **Licence**: permitted list is enforced by `npm run license:check`; a new
   licence family is a decision row, not a surprise.
4. **Maintenance**: last release, open critical issues, bus factor. Unmaintained
   plus security-relevant means no.
5. **Transitive weight**: `npm run sbom` shows what else arrives.
6. **Advisories**: `npm run audit:prod` for published high severity findings.
7. **Removal plan**: what the code looks like if the package disappears (wrap it
   at one seam, never scatter its API).

## In this repo

- exceljs, recharts, zustand, zod, decimal.js and Tauri are the large shapes; each
  is a budget line, not a default.
- A dependency that duplicates an existing one (two date libraries, two chart
  libraries) is a finding even when both work.
- An upgrade that changes output must show before/after on a real page.

## Red flags

- `npm i` for a one-function utility.
- A licence change noticed at release.
- An upgrade bundled with a feature in one commit.

**Source:** original.
