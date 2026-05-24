# Security Migration Plan: Moving to Secure masterStorage

## Overview
This document outlines the findings of direct `localStorage` and `sessionStorage` usage across the FinPlan Pro codebase and provides a migration plan to move sensitive data to the secure, centralized `masterStorage` (IndexedDB/SQLite).

## Sensitive Data Findings

| Location | Storage Key | Severity | Data Type | Reason for Migration |
|----------|-------------|----------|-----------|----------------------|
| `src/engines/UndoRedoEngine.ts` | `finplan-undo-redo` | **Critical** | State Snapshots | Contains full snapshots of financial stores (budgets, actuals) for undo operations. |
| `src/pages/ai/NLQChatPage.tsx` | `nlq-query-history` | **Medium** | NLP Queries | Contains history of plain-English queries about sensitive financial metrics. |
| `src/pages/templates/TemplateGalleryPage.tsx` | `templateInstance`, `template` | **Medium** | Report Templates | Financial report structures and draft configurations. |
| `src/components/dashboard/ActivityFeed.tsx` | `finplan-activity-log` | **Low/Med** | Activity Logs | Actions performed by users, potentially revealing account or resource names. |
| `src/engines/SmartImportMapper.ts` | `finplan_learned_mappings` | **Low** | Mapping Metadata | Metadata about external file structures and internal mapping logic. |
| `src/pages/analytics/DashboardBuilderPage.tsx` | `custom-dashboard` | **Low** | UI Config | Custom dashboard layouts and widget selections. |

## System-Level (Non-Sensitive) Data
The following are currently in `localStorage` but do not require immediate migration as they contain no financial or PII data:
- `theme` (in `src/main.tsx`)
- `finplan-setup-complete` (in `src/hooks/useFirstRun.ts`)
- `finplan_custom_shortcuts` (in `src/engines/ExcelKeyboardShortcuts.ts`)
- `grid-state-*` (in `src/engines/GridOfflineEngine.ts`)

## Migration Strategy

### 1. Undo/Redo Engine (Engines/Non-React)
The `UndoRedoEngine` must be updated to handle asynchronous persistence.
- **Current**: `static persistHistory()` and `static restoreHistory()` are synchronous.
- **Target**: Convert to `async` methods using `await masterStorage.setItem('finplan-undo-redo', ...)` and `await masterStorage.getItem('finplan-undo-redo')`.

### 2. React Components (Activity Feed, NLQ Chat, Dashboard Builder)
Components should be refactored to use the `usePersistence` hook with the `master` storage option.
- **Action**: Replace `localStorage.getItem` in `useMemo` or `useState` initializers with `usePersistence` logic.
- **Benefit**: Centralized error handling, automatic loading states, and consistent storage implementation.

### 3. Template Gallery (Session Storage)
`sessionStorage` is currently used to pass data between the gallery and the template editor.
- **Action**: Move this to a dedicated `templateEditorStore` (Zustand) or use `masterStorage` with a `session-` prefix if persistence across tabs is desired.

## Implementation Tasks

- [ ] Update `UndoRedoEngine.ts` to `async` persistence.
- [ ] Refactor `ActivityFeed.tsx` to use `usePersistence`.
- [ ] Refactor `NLQChatPage.tsx` to use `usePersistence`.
- [ ] Refactor `DashboardBuilderPage.tsx` to use `usePersistence`.
- [ ] Migrate `TemplateGalleryPage.tsx` logic to `masterStorage`.
- [ ] Add data migration utility to move existing `localStorage` data to `masterStorage` on first run after update.

## Validation Plan
1. **Automated Tests**: Update `UndoRedoEngine.test.ts` and `ActivityFeed.test.tsx` to mock `masterStorage` instead of `localStorage`.
2. **Manual Check**: Verify that undo/redo history survives page refreshes in both Web (IndexedDB) and Desktop (Tauri SQL) modes.
3. **Storage Audit**: Use DevTools to ensure `localStorage` is empty of sensitive keys after the migration.
