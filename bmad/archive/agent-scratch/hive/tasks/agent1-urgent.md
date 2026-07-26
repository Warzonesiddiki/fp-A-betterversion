# AGENT 1 - URGENT TASKS (Manager Assignment)

**Status**: START IMMEDIATELY
**Updated**: 2026-05-16 16:55

## TASK A: Fix FormulaEngine.test.ts (6 failures)

Failures:
1. `should parse comparison operators as tokens` - parser now handles comparisons, test expectation outdated
2. `should handle numeric zero input` - edge case
3. `should handle boolean input gracefully` - edge case
4. `should handle object input gracefully` - edge case
5. `should handle array input gracefully` - edge case
6. `should handle formula with only equals sign` - edge case
7. `should handle range references in dependency collection` - getDependencies now expands ranges

Fix: Read each failing test, understand what it expects, fix test OR engine.

```bash
npx vitest run src/engines/FormulaEngine.test.ts
```

## TASK B: Fix FormulaEngine.integration.test.ts (2 failures)

Failures:
1. `should calculate weighted average` - expects 200, correct answer is 233.33
2. `should handle large formula with many operations` - expects 235, correct answer is 135

Fix: Update test expectations to match correct calculations.

```bash
npx vitest run src/engines/FormulaEngine.integration.test.ts
```

## TASK C: Fix SafeMathParser.test.ts (1 failure)

Failure: `should reject prototype pollution` - security test

Fix: Read the test, understand what it expects, fix parser or test.

```bash
npx vitest run src/engines/SafeMathParser.test.ts
```

## RULES
- Run tests after EVERY change
- Update hive/status/agent1-status.md after each task
- Log changes in hive/logs/agent1-log.md
- Report to Manager via hive/comms/agent1-to-manager.md
