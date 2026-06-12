# FinPlan Pro — Component Design Patterns

This document defines the architectural standards for React components within the FinPlan Pro codebase. All agents MUST adhere to these patterns to ensure consistency, performance, and accessibility.

## 1. Naming & Structure

- **File Names:** Use `PascalCase.tsx` for component files.
- **Exports:** Prefer **Named Exports** over default exports to improve refactoring and IDE discovery.
- **Ref Forwarding:** Use `forwardRef` for primitive UI components (buttons, inputs) to ensure they can be used with libraries like Framer Motion or Headless UI.
- **Display Name:** Always set `Component.displayName` when using `forwardRef`.

```tsx
export const MyComponent = forwardRef<HTMLDivElement, MyProps>(({ className, ...props }, ref) => {
  return <div ref={ref} className={cn('base', className)} {...props} />;
});
MyComponent.displayName = 'MyComponent';
```

## 2. Styling Patterns

- **Tailwind CSS:** Use Tailwind for all styling. Avoid CSS modules or global styles unless necessary.
- **Class Merging:** Always use the `cn(...)` utility (from `@/utils/cn`) to merge class names.
- **CSS Variables:** Reference Bloomberg-inspired theme variables for colors to ensure dark/light mode compatibility:
  - `var(--bg-surface)`
  - `var(--text-primary)`
  - `var(--border-subtle)`
- **Conditional Classes:** Use `cn`'s object syntax for clarity: `cn('base', isActive && 'active')`.

## 3. Business Component States (The 4-State Pattern)

Data-driven components MUST handle four distinct states to provide a premium UX:

1.  **Loading:** Show `Skeleton` or `LoadingScreen`.
2.  **Error:** Show an `Alert` or error boundary fallback with a retry mechanism.
3.  **Empty:** Show a helpful message + CTA (e.g., "No data found. Import your GL records").
4.  **Data:** Render the actual content.

```tsx
if (isLoading) return <Skeleton />;
if (error) return <Alert type="error" message={error} />;
if (data.length === 0) return <EmptyState title="No records" />;
return <DataGrid data={data} />;
```

## 4. State Management (Zustand)

- **Selective Picking:** Pick ONLY the state/actions needed to prevent unnecessary re-renders.
- **Immer:** Use Immer (via Zustand's middleware) for complex state updates.

```tsx
// GOOD
const { entries, addEntry } = useGLStore((state) => ({
  entries: state.entries,
  addEntry: state.addEntry,
}));

// BAD (causes re-render on any store change)
const store = useGLStore();
```

## 5. Accessibility (WCAG 2.2 AA)

- **Interactive Elements:** All buttons and inputs MUST have `aria-label` if they don't have visible text.
- **Keyboard Navigation:** Ensure `tabIndex={0}` and proper focus rings (`focus-visible:ring-2`) are present.
- **Roles:** Use semantic HTML or explicit `role` attributes (e.g., `role="grid"` for data tables).
- **Alt Text:** Every `<img>` tag MUST have a descriptive `alt` attribute.

## 6. Performance

- **Memoization:** Wrap generic UI components and heavy list items in `React.memo`.
- **Callback Stability:** Use `useCallback` for functions passed to memoized children.
- **Compute Offloading:** Use `useMemo` for heavy calculations (financial formulas, filtering) inside the render loop.

## 7. Icons

- Use **Lucide React** for all icons.
- Standardize icon sizes: `h-4 w-4` for inline text, `h-5 w-5` for buttons.
