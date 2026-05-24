---
name: code-simplifier
description: Simplify complex code — reduce nesting, extract functions, flatten conditionals
user-invocable: true
---

# Code Simplifier

Apply when: code is too complex, deeply nested, long functions, hard to read.

## Techniques
1. **Early returns** — exit guard clauses at top
2. **Extract function** — pull blocks into named functions
3. **Ternary for simple conditions** — `x ? a : b` instead of if/else
4. **Optional chaining** — `user?.address?.city` instead of nested ifs
5. **Nullish coalescing** — `value ?? default` instead of `value !== null ? value : default`
6. **Destructuring** — `const { name, age } = user` instead of `user.name`
7. **Array methods** — `map/filter/reduce` over for loops
8. **Object lookup** — map over switch/case for simple dispatch

## Before/After
```typescript
// Before: 4 levels nesting
if (user) {
  if (user.address) {
    if (user.address.city) {
      console.log(user.address.city);
    }
  }
}

// After: early return + optional chaining
if (!user?.address?.city) return;
console.log(user.address.city);
```

## Complexity Targets
- Cyclomatic complexity < 10 per function
- Cognitive complexity < 15 per function
- Max function length: 30 lines
- Max file length: 300 lines
