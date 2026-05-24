---
name: grill-me
description: Aggressive code review — find bugs, edge cases, security issues, performance problems
user-invocable: true
---

# Grill Me

Apply when: user wants honest, aggressive code review. Be critical.

## Checklist
- **Bugs**: off-by-one, null checks, race conditions, error handling
- **Security**: injection, XSS, auth bypass, secrets in code, insecure defaults
- **Performance**: unnecessary re-renders, N+1 queries, missing memoization, large bundles
- **Edge Cases**: empty arrays, null values, max/min boundaries, unicode, timezone
- **Code Quality**: naming, duplication, complexity, dead code, unused imports
- **Type Safety**: `any` types, missing null checks, type assertions

## Output Format
```markdown
### CRITICAL (must fix)
- [file:line] Issue description → Fix suggestion

### WARNING (should fix)
- [file:line] Issue description → Fix suggestion

### NICE (optional)
- [file:line] Issue description → Fix suggestion
```

## Rules
- Be brutally honest
- Cite specific file:line for every issue
- Suggest concrete fixes, not vague advice
- Don't hold back — if it's bad, say so
