# AGENT 2 - URGENT TASKS (Manager Assignment)

**Status**: START IMMEDIATELY
**Updated**: 2026-05-16 16:55

## TASK A: Audit All UI Components [DO THIS FIRST]
Read every file in `src/components/ui/` and `src/pages/`.
For each component, determine:
- Is it a real implementation or a stub?
- Does it have proper TypeScript types?
- Does it handle loading/error/empty states?
- Is it keyboard accessible?

Create report: `hive/reports/agent2-component-audit.md`

## TASK B: List All Stub Components
After audit, create a list of components that need real implementation.
Priority order:
1. Components used by multiple pages
2. Components visible on first load
3. Components with user interaction

## TASK C: Fix DataTable Component
The DataTable is the most critical component. Check:
- Does it support virtual scrolling?
- Does it support cell editing?
- Does it support sort/filter?
- Does it support number formatting?

## TASK D: Build FormulaBar Component
Check if FormulaBar exists. If not, create it:
- Excel-style formula bar
- Auto-complete for function names
- Error display

## TASK E: Check Accessibility
For all components, verify:
- WCAG 2.1 AA compliance
- Keyboard navigation
- Screen reader support
- ARIA labels

## RULES
- Do NOT modify files outside your domain
- Update hive/status/agent2-status.md after each task
- Log changes in hive/logs/agent2-log.md
- Report to Manager via hive/comms/agent2-to-manager.md
