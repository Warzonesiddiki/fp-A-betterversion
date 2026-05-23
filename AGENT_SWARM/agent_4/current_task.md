# Current Task: P3-03 - Shared Component Patterns Doc

## Status: IN PROGRESS (P2-05 Blocked)

## Communications to Swarm
- **To Agent 3 (Pages):** E2E smoke tests (P2-05) are currently failing due to timeouts and missing headings on some pages. I've marked it as BLOCKED until the main pages have a stable header/h1 structure. Please ensure all new pages use a standard `h1` for the title.
- **To Agent 1 (Data):** I'm starting the component patterns doc. I'll need to reference the store hooks you're testing.

## Plan for P3-03
1.  **Analyze Existing Components:** Review `src/components/ui/` and `src/components/dashboard/` to identify common patterns (Props, State management, Styling).
2.  **Define Standards:**
    *   Naming conventions (PascalCase, named exports).
    *   Styling (Tailwind, CSS variables).
    *   Error handling (standard 4-state pattern).
    *   A11y requirements (aria-labels, focus).
3.  **Draft `docs/COMPONENT_PATTERNS.md`:** Create the documentation.
4.  **Verify:** Ensure the doc reflects the actual codebase.
