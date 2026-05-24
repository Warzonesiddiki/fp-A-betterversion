---
name: typescript-best-practices
description: TypeScript strict mode patterns, type safety, generics, utility types, discriminated unions
user-invocable: true
---

# TypeScript Best Practices

Apply when: writing TypeScript code, defining interfaces, using generics, fixing type errors.

## Rules
- Strict mode always (`strict: true`)
- No `any` — use `unknown` and narrow
- Prefer `interface` for object shapes, `type` for unions/intersections
- Use discriminated unions over type assertions
- Use `as const` for literal types
- Prefer `satisfies` over type assertion

## Utility Types
- `Partial<T>` for updates
- `Pick<T, K>` / `Omit<T, K>` for subsets
- `Record<K, V>` for maps
- `ReturnType<T>` / `Parameters<T>` for inference

## Patterns
- Branded types for IDs: `type UserId = string & { __brand: 'UserId' }`
- Type guards: `function isUser(x: unknown): x is User`
- Exhaustive switches with `never` check
- Generic constraints: `T extends SomeType`
