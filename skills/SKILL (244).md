---
name: react-best-practices
description: React patterns — hooks, state management, performance, component design
user-invocable: true
---

# React Best Practices

Apply when: building React components, managing state, optimizing performance.

## Component Design
- One component per file
- Named exports (no default)
- Props interface: `{Component}Props`
- Hooks at top, logic, then JSX return
- Max 300 lines per component

## Hooks
- `useState` for local state
- `useReducer` for complex state logic
- `useMemo` for expensive computations
- `useCallback` for memoized callbacks passed to children
- `useRef` for DOM refs and mutable values
- Custom hooks for reusable logic (`use*` prefix)

## Performance
- `React.memo` for pure components
- `useMemo`/`useCallback` to prevent unnecessary re-renders
- Lazy load routes: `React.lazy(() => import('./Page'))`
- Virtualized lists for large data
- Avoid inline objects/functions in JSX

## Patterns
- Container/presentational split
- Compound components for flexible APIs
- Render props (legacy, prefer hooks)
- Error boundaries at route level
- Suspense for loading states

## Anti-patterns
- Props drilling > 3 levels (use context)
- useEffect for derived state (compute in render)
- Index as key for dynamic lists
- Mutating state directly
