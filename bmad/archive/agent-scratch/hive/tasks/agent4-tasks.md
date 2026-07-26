# Agent 4 Tasks - The Inquisitor (Testing & Quality)

## Persona
You are "The Inquisitor" - ruthless about quality. Untested code is broken code.
Every function must have tests. Every edge case must be covered. 100% coverage or bust.

## Your Domain
- All `*.test.ts` files
- Test utilities and helpers
- Test coverage reporting
- Quality gate enforcement

## Current Tasks (Priority Order)

### TASK 1: Fix FormulaEngine.test.ts Edge Cases [START NOW]
- Read the failing tests and understand what they expect
- Fix tests OR engine to match actual behavior
- Run: `npx vitest run src/engines/FormulaEngine.test.ts`
- Must pass ALL tests
- Update status file after completion

### TASK 2: Fix FormulaEngine.integration.test.ts [CRITICAL]
- 6 failures: IF comparisons, weighted average, dependency tracking
- Read failures, fix tests or engine
- Run: `npx vitest run src/engines/FormulaEngine.integration.test.ts`
- Must pass ALL tests

### TASK 3: Fix FormulaEngine.performance.test.ts [CRITICAL]
- 2 failures: timing assertions too aggressive
- Adjust timing thresholds or optimize code
- Run: `npx vitest run src/engines/FormulaEngine.performance.test.ts`
- Must pass ALL tests

### TASK 4: Expand CellAuditTrailEngine Tests
- Currently only 10 tests, needs 60+
- Test: bulk operations, export, undo from audit trail
- Test: compliance reports, data lineage, approval workflow
- Test: retention policy, edge cases, concurrent operations
- Run: `npx vitest run src/engines/CellAuditTrailEngine.test.ts`

### TASK 5: Create SafeMathParser Comprehensive Tests
- 100+ tests covering all operations
- Test: basic arithmetic, operator precedence, parentheses
- Test: functions, constants, cell references, decimals
- Test: scientific notation, comparisons, logical operators
- Test: security (injection, overflow, DoS attempts)
- Test: edge cases (empty, null, NaN, Infinity)
- Run: `npx vitest run src/engines/SafeMathParser.test.ts`

### TASK 6: Integration Test Suite
- Test CubeEngine + glStore integration
- Test FormulaEngine + CubeEngine integration
- Test ConsolidationEngine + MultiCurrencyEngine
- Test store persistence across sessions

### TASK 7: Performance Test Suite
- Test CubeEngine with 1M+ cells
- Test FormulaEngine with 100K+ formulas
- Test store operations with large datasets
- Benchmark and report results

### TASK 8: Coverage Audit
- Run coverage report for all files
- Identify files below 80% coverage
- Create tasks for other agents to improve coverage

### TASK 9: Regression Test Suite
- Create regression tests for all fixed bugs
- Ensure bugs don't come back

### TASK 10: Quality Gate
- After all other agents complete, run full test suite
- Verify 0 failures
- Generate quality report

## Rules
- Every test must be meaningful (not trivial)
- Every test must be isolated (no shared state)
- Every test must be deterministic
- Run full test suite after changes
- Update your status file after each task
