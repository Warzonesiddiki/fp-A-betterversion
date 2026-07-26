# Dark Mode Status

## Current Coverage
- **Components with dark mode:** 26 / 177 (14.7%)
- **Gap:** 151 components lack dark: variant support

## Implementation
- CSS variables defined in `src/index.css` with `--bg-root`, `--bg-surface`, `--text-primary`, etc.
- Glassmorphic design tokens added (2026-05-20): `--glass-bg`, `--glass-border`, `--shadow-premium`
- Tailwind `dark:` prefix used inconsistently

## Components with Dark Mode
Found via `grep -rl "@media.*dark\|dark:\|darkMode\|isDark"` — 26 files including:
- Core layout components (Sidebar, Header, AppLayout)
- Card, Button, Modal base components
- Chart wrappers

## Missing Dark Mode
- Most page-level components
- Data grid cell renderers
- Form inputs and selectors
- Toast/notification components
- Sector-specific dashboards

## Recommendation
Priority: Extend dark mode to all 177 components using CSS variable approach (already established in index.css). Cost: ~3 hours systematic pass.

## Related
- [[MOC-FinPlan-Pro]]
- [[2026-05-21-session-status]]
