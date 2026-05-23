# AGENT 4 (QUALITY) — Detailed Execution Plan

YOUR MISSION: Make every component, every route, and every user interaction bulletproof. Accessibility, error handling, loading states, and defensive programming everywhere.

YOU OWN: `src/components/**/*`, `src/test/*`, eslint/prettier config, `src/App.tsx` (Suspense/ErrorBoundary only)
YOU NEVER TOUCH: `src/pages/**/*` (content), `src/engines/*`, `src/store/*`

## TASK 1: Suspense Boundaries per Route Group

File to modify: `src/App.tsx`

Read App.tsx first. Find the route definitions. Currently there's ONE Suspense boundary wrapping all routes. This means if ONE heavy page loads, ALL navigation is blocked.

### Fix:
Wrap each route group in its OWN Suspense boundary with its OWN fallback:

```typescript
// Example structure (adapt to match actual App.tsx routing)
<Routes>
  <Route path="/" element={<AppLayout />}>
    {/* Main dashboard routes — separate suspense */}
    <Route path="dashboard" element={
      <Suspense fallback={<LoadingScreen message="Loading dashboard..." />}>
        <DashboardPage />
      </Suspense>
    } />

    {/* Analytics routes — separate suspense */}
    <Route path="analytics/*" element={
      <Suspense fallback={<LoadingScreen message="Loading analytics..." />}>
        <AnalyticsRoutes />
      </Suspense>
    } />
  </Route>
</Routes>
```

Key requirements:
1. Every route defined with `element={lazy(() => import(...))}` needs a Suspense boundary
2. Use `LoadingScreen` from `src/components/ui/LoadingScreen` as the fallback
3. Give each Suspense a unique message prop so users know what's loading
4. Group related routes under shared Suspense (e.g., all /energy/* routes under one)

## TASK 2: Error Boundaries per Route Group

Same file: `src/App.tsx`

Wrap each Suspense boundary with an ErrorBoundary:

```typescript
import { ErrorBoundary } from 'react-error-boundary'

function RouteErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div className="flex flex-col items-center justify-center p-12">
      <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
      <p className="text-muted-foreground mb-4">{error.message}</p>
      <Button onClick={resetErrorBoundary}>Try Again</Button>
    </div>
  )
}

// Usage:
<ErrorBoundary FallbackComponent={RouteErrorFallback} onReset={() => {}}>
  <Suspense fallback={<LoadingScreen />}>
    <Page />
  </Suspense>
</ErrorBoundary>
```

Check if `react-error-boundary` is installed (it's in package.json). If not, create a simple ErrorBoundary class component instead.

## TASK 3: E2E Smoke Tests

Create: `tests/smoke.spec.ts` (read existing one first, then EXPAND it)

Add Playwright tests for:
```typescript
import { test, expect } from '@playwright/test'

test.describe('FinPlan Pro — Critical User Flows', () => {

  test('should load the application without console errors', async ({ page }) => {
    const errors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text())
    })
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    expect(errors).toHaveLength(0)
  })

  test('should navigate through main sections', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Test sidebar navigation — find each nav link and click
    const navLinks = page.locator('nav a, nav button[role="link"]')
    const linkCount = await navLinks.count()
    expect(linkCount).toBeGreaterThan(5)

    // Click first 3 links and verify page loads
    for (let i = 0; i < Math.min(3, linkCount); i++) {
      await navLinks.nth(i).click()
      await page.waitForTimeout(500)
      await expect(page.locator('h1')).toBeVisible({ timeout: 10000 })
    }
  })

  test('should display KPIs on dashboard', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    const kpiCards = page.locator('[class*="kpi"], [class*="KPI"]')
    // Or check for any card-like elements with values
    await expect(page.locator('h1')).toBeVisible()
  })

  test('should handle 404 routes gracefully', async ({ page }) => {
    const response = await page.goto('/nonexistent-route')
    // Should show a 404 page, not crash
    await expect(page.locator('text=404').or(page.locator('text=not found'))).toBeVisible({ timeout: 5000 })
  })
})
```

Check if Playwright is configured properly:
- Does `playwright.config.ts` exist? If not, check if tests can still run
- `@playwright/test` is in devDependencies

## TASK 4: Component Patterns Documentation

Create: `docs/component-patterns.md`

Document:
1. Component architecture (layout components, UI primitives, domain components)
2. State management pattern (Zustand stores + selectors)
3. Styling approach (Tailwind + cn() utility)
4. Code conventions (naming, file structure, exports)
5. Testing patterns (vitest + testing-library)
6. Performance patterns (React.memo, useCallback, lazy loading)

Format: clean Markdown with code examples from actual components.

## QUALITY GATE
After EACH task:
```
cd C:\Users\Tahir\Desktop\frontend that i want
npm run build 2>&1 | Select-Object -Last 5
```
Build must pass.
