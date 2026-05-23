---
date: 2026-05-19
type: feature
project: FinPlan Pro
tags: [finplan-pro, keyboard, shortcuts, accessibility]
status: current
---

# Keyboard Shortcuts System

## Files
- `src/config/keyboardShortcuts.ts` (53 lines) — shortcut definitions
- `src/components/ui/KeyboardShortcutProvider.tsx` (40 lines) — context provider
- `src/components/ui/ShortcutHelpModal.tsx` (56 lines) — help overlay
- `src/components/ui/CommandPalette.tsx` — Ctrl+K command palette (wired into AppLayout)

## Shortcut Categories

### Global
- Ctrl+K — Command palette
- Ctrl+S — Save
- Ctrl+Z — Undo
- Ctrl+Shift+Z — Redo
- Ctrl+N — New
- Ctrl+/ — Help

### Navigation
- Ctrl+1-9 — Switch pages
- Alt+Left/Right — Back/forward

### Data
- Ctrl+D — Duplicate
- Ctrl+Delete — Delete row
- F2 — Edit cell
- Escape — Cancel

### Reports
- Ctrl+P — Print
- Ctrl+E — Export
- Ctrl+F — Find/filter

## Implementation
- Uses React context for shortcut registration
- CommandPalette wired into AppLayout with Ctrl+K trigger
- ShortcutHelpModal shows all available shortcuts
- Browser defaults preserved where appropriate
- Complements [[accessibility]] for keyboard-only navigation
- Ctrl+/ opens [[help-system]] page
- Chart-specific shortcuts for [[charts]] component navigation
