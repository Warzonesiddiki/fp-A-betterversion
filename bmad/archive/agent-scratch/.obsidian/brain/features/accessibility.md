---
date: 2026-05-19
type: feature
project: FinPlan Pro
tags: [finplan-pro, accessibility, a11y, wcag]
status: current
---

# Accessibility Components

## Components
| File | Lines | Purpose |
|------|-------|---------|
| AsyncErrorBoundary.tsx | 37 | Catches async errors, shows fallback |
| PageErrorBoundary.tsx | — | Page-level error boundary |
| ErrorFallback.tsx | — | Error fallback UI |
| FocusTrap.tsx | 48 | Traps focus within modals/dialogs |
| LiveRegion.tsx | 26 | aria-live announcements for screen readers |
| SkipToContent.tsx | 10 | Skip navigation link |
| VisuallyHidden.tsx | — | Visually hidden but accessible content |

## Hooks
| File | Purpose |
|------|---------|
| useAnnounce.ts | Announce messages to screen readers |
| useErrorHandler.ts | Global error handler |
| useFocusRestore.ts | Restore focus after modal close |

## Test Utilities
- `src/test/accessibilityTestUtils.ts` (26 lines) — a11y test helpers

## Related
- [[keyboard-shortcuts]] for keyboard-only navigation
- [[charts]] components have aria-label on all charts
- [[help-system]] includes keyboard shortcut reference table

## WCAG 2.1 AA Compliance
- All interactive elements keyboard accessible
- Focus indicators with 3:1 minimum contrast
- Form inputs have associated labels
- Error messages programmatically associated
- Color not sole information carrier
- Skip-to-content link on each page
- Route changes focus main heading
