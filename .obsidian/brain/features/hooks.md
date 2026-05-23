---
date: 2026-05-19
type: feature
project: FinPlan Pro
tags: [finplan-pro, hooks, react, typescript]
status: current
---

# Hooks Inventory — FinPlan Pro

## 26 Custom Hooks

| Hook | Purpose | Used By |
|------|---------|---------|
| useAnnounce | Screen reader announcements (ARIA live) | Accessibility components |
| useAuth | Auth state + login/logout | Auth pages, ProtectedRoute |
| useAutoSave | Auto-save with debounce | Data entry forms |
| useCurrency | Currency formatting (Intl.NumberFormat) | Financial displays |
| useDebounce | Debounce values | Search inputs, filters |
| useErrorHandler | Error boundary integration | Error boundaries |
| useExport | Export to PDF/Excel/CSV | Report pages |
| useFirstRun | Detect first-run state | Onboarding wizard |
| useFocusManagement | Focus trapping | Modals, dialogs |
| useFocusRestore | Restore focus after close | Modals, popovers |
| useIndexedDB | IndexedDB CRUD | Large data persistence |
| useIntersectionObserver | Lazy loading, visibility | Charts, heavy components |
| useKeyboardShortcuts | Keyboard shortcut handler | CommandPalette, global |
| useOffline | Offline detection | Status indicators |
| usePeriods | Fiscal period management | Budget, forecast pages |
| usePersistence | localStorage/IndexedDB sync | Store persistence |
| usePresence | User presence tracking | Collaboration features |
| useRenderCount | Debug render counts | Development only |
| useSector | Sector detection + KPIs | Sector dashboards |
| useTauriMenu | Tauri native menu integration | Desktop app menu |
| useThrottle | Throttle values | Scroll handlers, resize |
| useTour | Guided tour state | Onboarding tour |
| useUndoRedo | Undo/redo state management | Budget, forecast editors |
| useUndoableAction | Single undoable action | Inline edits |
| useWebSocket | WebSocket connection | Real-time features |

## Patterns

All hooks follow:
- TypeScript with explicit return types
- Memoized callbacks (useCallback)
- Error handling (try/catch)
- Under 100 lines each

## Related

- See [[accessibility]] for a11y hooks
- See [[keyboard-shortcuts]] for shortcut hooks
- See [[auth-rbac]] for auth hooks
