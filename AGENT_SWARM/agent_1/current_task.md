# Current Task: P1-03 - Write utility tests

**Objective:** Write unit tests for the following utilities: `calculations.ts`, `formatters.ts`, `cn.ts`, and `retry.ts`.

**Plan:**

1.  **Analyze:** Reviewed implementation of all four utility files.
2.  **Setup:** Create corresponding `*.test.ts` files in `src/utils/`.
3.  **Implement Tests:**
    *   `calculations.ts`: Test all financial formulas, including edge cases like division by zero in growth rates and margins.
    *   `formatters.ts`: Test currency, percentage, and compact number formatting.
    *   `cn.ts`: Test tailwind class merging.
    *   `retry.ts`: Test `withRetry` with successful and failing promises. (Note: `createWorker` might be harder to test without a DOM environment, but I'll see if I can mock it).
4.  **Verify:**
    *   Run `npm test`.
    *   Run `npm run build`.
