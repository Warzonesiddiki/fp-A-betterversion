---
name: clean-code
description: Clean code principles — naming, functions, DRY, SOLID, readability
user-invocable: true
---

# Clean Code Principles

Apply when: refactoring, reviewing code, naming variables/functions, structuring files.

## Rules
- Functions do one thing (under 20 lines ideal)
- Descriptive names: `calculateTotalPrice()` not `calc()` or `doStuff()`
- No magic numbers — use constants
- Early returns to reduce nesting
- DRY — extract repeated logic into helpers
- No dead code — delete, don't comment out

## Naming
- Variables: camelCase, noun (`userCount`, `isActive`)
- Functions: camelCase, verb (`getUser`, `calculateTotal`)
- Booleans: `is`, `has`, `can`, `should` prefix
- Constants: UPPER_SNAKE_CASE
- Types/Interfaces: PascalCase

## Code Smells
- Functions > 30 lines
- Nesting > 3 levels
- More than 3 function parameters
- Comments explaining what (code should be self-documenting)
- Duplicate logic in 2+ places
