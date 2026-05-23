---
date: 2026-05-19
type: feature
project: FinPlan Pro
tags: [finplan-pro, feature, help, ux]
status: current
---

# Help System

## HelpPage (135 lines)
- **Location:** `src/pages/HelpPage.tsx`
- **Purpose:** Central help and documentation hub

## Sections

1. **FAQ** — Common questions and answers
2. **Keyboard Shortcuts** — Full shortcut reference table
3. **Documentation Links** — External docs and guides
4. **Contact Support** — Support email/form link
5. **Version Info** — Current app version and changelog link

## Integration

- Accessible via `/help` route
- Linked from sidebar navigation
- Keyboard shortcut `Ctrl+/` opens help
- CommandPalette includes "Open Help" command

## Key Patterns

- Accordion-style FAQ for progressive disclosure
- Shortcut table with key combos and descriptions (references [[keyboard-shortcuts]])
- External links open in new tabs with security attrs
- Responsive layout for mobile/desktop
- Accessible during [[onboarding]] via sidebar link
- Ctrl+/ shortcut registered in [[keyboard-shortcuts]] system
