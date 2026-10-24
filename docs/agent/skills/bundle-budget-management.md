---
name: bundle-budget-management
description: Use when managing the bundle budget across vendor chunks, lazy routes, and future dependencies. Tracks current usage, warns at thresholds, and enforces gates.
group: product-ui
---

# Bundle Budget Management

**Use it when:** the bundle is near the size limit, or a new dependency is being added.

## Current Budget (2026-10-23)

- **Total JS:** 95.7% of limit (warns at 1872KB / 2.0MB)
- **Vendor chunks:**
  - excel-core-vendor: 248.23KB gzip (<= 300KB) ✓
  - grid-community-vendor: 206.35KB gzip (<= 300KB) ✓
  - pdf-vendor: 134.31KB gzip (<= 300KB) ✓
  - chart-vendor: 121.16KB gzip (<= 300KB) ✓
  - grid-react-vendor: 14.28KB gzip (<= 300KB) ✓
- **All G19 vendor checks PASS**

## Method

1. **Measure:** Run `node scripts/bundle-check.js` to get current usage.
2. **Identify:** Which vendor chunk is largest? Which route is heaviest?
3. **Optimize:** Apply proven methods (vendor splitting, lazy loading, tree-shaking, custom components, stubbing).
4. **Verify:** Re-run bundle-check. All G19 vendor checks must PASS.
5. **Record:** If retiring EXPERIMENTAL routes, record DEC id + commit (DEC-006).

## What This Prevents

- Adding a dependency without measuring the impact
- Deleting SUPPORTED routes to fit budget
- Weakening the bundle gate without a recorded decision
- Shipping un-split bundles

## Related

- `bundle-optimization-methodology` — proven methods
- `bundle-optimization-advanced` — advanced techniques
- `performance-and-bundle` — the general skill
- `gates-and-ratchets` — how bundle-check works
