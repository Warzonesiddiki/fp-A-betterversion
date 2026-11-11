---
name: bundle-budget-management
description: Use when managing the bundle budget across vendor chunks, lazy routes, and future dependencies. Tracks current usage, warns at thresholds, and enforces gates.
group: product-ui
---

# Bundle Budget Management

**Use it when:** the bundle is near the size limit, or a new dependency is being added.

## Gate limits (not current measurements)

`bundle-check` currently enforces 150 KB gzip for the main chunk, 2,080 KB gzip for total JavaScript, 300 KB gzip per named lazy vendor, and 750 KB gzip for the critical path. Warnings begin at 90% for the applicable limit. These are thresholds, not current bundle sizes or a pass result. Run a fresh build and bundle check before reporting usage.

## Method

1. **Measure:** Run `npm run build`, then `npm run bundle-check`; the checker reads build output.
2. **Identify:** Which vendor chunk is largest? Which route is heaviest?
3. **Optimize:** Apply proven methods (vendor splitting, lazy loading, tree-shaking, custom components, stubbing).
4. **Verify:** Re-run bundle-check and inspect every emitted warning/error; missing or unmeasured chunks are not evidence of a pass.
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
