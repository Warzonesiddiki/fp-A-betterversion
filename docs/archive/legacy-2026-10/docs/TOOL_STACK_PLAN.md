# FinPlan Pro — Tool Stack & UI/UX Upgrade Plan

> **Date:** 2026-05-22
> **Goal:** Use all available tools to build a world-class FP&A app

---

## Available Tools

| Tool            | Version | Purpose                                    | How to Use                                   |
| --------------- | ------- | ------------------------------------------ | -------------------------------------------- |
| **Open Design** | 41.3.0  | Design systems, UI patterns, visual design | Interactive GUI — use for design exploration |
| **Gemini CLI**  | 0.44.0  | AI with Google Search, brainstorming       | `gemini -p "prompt"` — research + ideation   |
| **OpenCode**    | 1.15.5  | AI coding agent                            | `opencode run "task"` — parallel coding      |
| **OpenClaude**  | Current | Primary coding agent                       | This session                                 |

---

## How Each Tool Helps FinPlan Pro

### Open Design (Design Reference)

- **140+ design systems**: apple, vercel, stripe, linear, notion, figma, shadcn
- **Finance templates**: finance-report, dashboard, trading-terminal
- **Skills**: ui-ux-pro-max, frontend-design, design-review, shadcn-ui
- **Use for:** Reference design tokens, component patterns, layout inspiration
- **How:** Open Open Design → explore design systems → extract patterns → apply to code

### Gemini CLI (Research + Brainstorming)

- **Google Search**: web search for latest FP&A UI patterns
- **Brainstorming**: generate creative UI/UX ideas
- **Use for:** Research competitor UIs, find design inspiration, brainstorm features
- **How:** `gemini -p "What are the best FP&A dashboard UI patterns in 2026?"`

### OpenCode (Parallel Coding)

- **AI agent**: can write code, run tests, fix bugs
- **Use for:** Parallel coding tasks, test writing, code review
- **How:** `opencode run "fix all TypeScript errors in src/store/"`

---

## UI/UX Upgrade Plan

### Phase 1: Design System (Use Open Design)

1. Open Open Design → explore `vercel` design system
2. Extract design tokens (colors, typography, spacing)
3. Apply to our `tailwind.config.ts` and `src/index.css`
4. Reference `linear-app` for clean data-dense UI
5. Reference `stripe` for financial form patterns

### Phase 2: Component Library (Use Open Design + OpenCode)

1. Use `shadcn-ui` skill for component patterns
2. Use `dashboard` template for layout reference
3. Use `finance-report` template for report layouts
4. Use `trading-terminal` for data-dense views
5. Apply `ui-ux-pro-max` patterns for usability

### Page-Specific Upgrades

| Page          | Design Reference                        | Skill            |
| ------------- | --------------------------------------- | ---------------- |
| Dashboard     | `dashboard` template + `vercel` system  | ui-ux-pro-max    |
| Budget Create | `finance-report` template               | frontend-design  |
| Reports       | `finance-report` + `stripe` patterns    | design-review    |
| Data Import   | `linear-app` patterns                   | frontend-design  |
| Settings      | `notion` design system                  | ui-ux-pro-max    |
| Charts        | `trading-terminal` patterns             | d3-visualization |
| NLQ Chat      | `chatgpt-claude-perplexity-style-guide` | frontend-design  |

---

## Execution Plan

### Step 1: Research (Gemini CLI)

```bash
gemini -p "What are the best FP&A dashboard UI/UX patterns used by Anaplan, Pigment, and Cube in 2026?"
gemini -p "What design system should a financial planning app use? Compare shadcn, vercel, stripe patterns."
gemini -p "What are the latest dark mode best practices for data-heavy financial apps?"
```

### Step 2: Design Reference (Open Design)

- Open Open Design
- Browse `vercel` design system → extract tokens
- Browse `linear-app` → data-dense UI patterns
- Browse `finance-report` template → report layouts
- Browse `trading-terminal` → financial data viz

### Step 3: Implementation (OpenClaude + OpenCode)

- Apply design tokens to tailwind.config.ts
- Upgrade component library with new patterns
- Add micro-interactions (framer-motion)
- Implement accessibility improvements
- Run visual regression tests

---

## Key Design Patterns to Apply

### From `vercel` Design System

- Clean typography scale (Inter font)
- Muted color palette with accent colors
- Subtle borders and shadows
- Consistent spacing (4px grid)

### From `linear-app`

- Keyboard-first navigation
- Command palette (Ctrl+K)
- Sidebar with sections
- Data-dense tables with hover states

### From `stripe`

- Financial form patterns
- Number formatting with currency
- Status badges with semantic colors
- Card-based layout for KPIs

### From `finance-report` template

- Professional report layout
- Table of contents
- Print-optimized styles
- Chart integration

### From `trading-terminal`

- Real-time data updates
- Compact data display
- Color-coded signals
- Multi-panel layout

---

## Success Criteria

- [ ] Design tokens from Open Design applied
- [ ] All pages use consistent design system
- [ ] Dark mode works across all components
- [ ] Charts look professional (trading-terminal quality)
- [ ] Reports print cleanly (finance-report quality)
- [ ] Keyboard navigation works (linear-app quality)
- [ ] Forms follow stripe patterns
- [ ] Dashboard uses vercel layout patterns
