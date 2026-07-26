# S06 — Architecture

**Date:** 2026-07-25

## 1. Context
Design-system foundation for all UI.

## 2. Components
- `src/config/design-tokens.ts`
- `src/index.css` (`:root` + `.dark` vars)
- Tailwind v4 `@theme` block (in CSS)
- `src/utils/theme.ts` (accent setter)
- Settings → Appearance (extends existing SettingsPage)

## 3. Data Model
- `TokenName`, `AccentPreset`.

## 4. Interfaces
- `setAccent(preset)`, `toggleDark()`.

## 5. Integration
- Consumed by `src/components/ui/*` (new code); S88 migrates legacy.

## 6. Performance/Security
- CSS-var theming = zero JS cost for color.

## 7. Testing
- Render component in light/dark; assert computed color matches token; accent switch test.
