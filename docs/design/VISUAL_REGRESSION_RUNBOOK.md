# FinPlan Atlas Visual Regression Runbook

> **Status:** Required to complete BMAD Story F-02.  
> **Current sandbox note:** Playwright Chromium download failed with TLS connection resets on 2026-08-10; run this in a browser-capable CI or developer environment.

## Purpose

Protect the Atlas finance UI from accidental hierarchy, spacing, theme, status, and accessibility regressions. Visual snapshots complement—not replace—unit, `jest-axe`, keyboard, type, and integration tests.

## Required baseline scenarios

1. `FinancialStatusBadge`: all ten lifecycle states in dark and light themes.
2. `PageHeader`: title/purpose/status/actions in wide and compact layouts.
3. `FinancialWorkspaceEmptyState`: icon/actions and long step descriptions in dark and light themes.
4. Dashboard empty workspace: 1440px desktop and 390px compact viewport.
5. Dashboard populated workspace: local-draft trust status visible, 1440px desktop and 1024px compact viewport.

## Browser setup

```sh
npm ci --ignore-scripts
node node_modules/@playwright/test/cli.js install chromium
```

If browser download is blocked, use a CI runner/image that preinstalls the Playwright browser revision pinned by `@playwright/test`.

## Tauri test shim

The checked-out app has a Tauri runtime gate. Before navigating in browser screenshots, install:

```ts
await page.addInitScript(() => {
  Object.defineProperty(window, '__TAURI_INTERNALS__', { value: {}, configurable: true });
  localStorage.setItem('finplan-setup-complete', 'true');
});
```

This is a test-only shim. It must never be used to relax production desktop/browser policy.

## Screenshot discipline

- Fix timezone, locale, color scheme, viewport, device scale factor, fonts, and fixture data.
- Disable animations/reduced-motion in test context.
- Use deterministic seeded fixture data; never use current dates, live APIs, random values, or real financial data.
- Mask timestamps or dynamically generated identifiers only when they do not represent user-visible behavior.
- Review every `--update-snapshots` change as a code change. A changed image is never auto-approved.

## Required review checklist

- Financial status retains text/icon/pattern, not color-only meaning.
- Data authority/freshness state remains visible.
- Page title, purpose, action hierarchy, and spacing remain intact.
- Empty state is actionable and does not resemble error/permission-denied state.
- Compact layout does not clip actions, status, or setup steps.
- Dark/light contrast remains acceptable.

## Completion evidence

Attach Playwright report, snapshot diff review, viewport list, fixture version, browser version, and reviewer decision to `_bmad/qa/story-f02-atlas-foundation-review.md`. Only then may F-02 move from QA rejected to approved.