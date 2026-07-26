---
date: 2026-05-20
type: feature
project: FinPlan Pro
tags: [finplan-pro, feature, testing, e2e, agent-browser]
status: current
---

# E2E Testing — agent-browser

## What
Browser automation CLI for AI agents. Accessibility-first element targeting. No fragile CSS selectors.

## Setup
- agent-browser 0.27.0 installed globally
- `tests/e2e/smoke-test.sh` (129 lines) — 9 flows
- `tests/e2e/screenshots/` — captured screenshots

## Flows Tested
1. Homepage load + screenshot
2. Accessibility snapshot (full tree)
3. Dashboard navigation
4. Budgets page
5. Reports page
6. Scenarios page
7. Templates page
8. NLQ Chat input
9. Final screenshot

## How It Works
```bash
agent-browser open http://localhost:5173
agent-browser snapshot          # accessibility tree with @refs
agent-browser click --text "Dashboard"
agent-browser screenshot out.png
```

## Key Features
- `snapshot` returns accessibility tree with refs (@e2, @e3)
- Semantic element finding: role, text, label, placeholder
- Wait strategies: element, text, URL, JS conditions
- Network intercept/mock, HAR recording
- Batch execution (one process, multiple commands)

## vs Playwright
| Feature | agent-browser | Playwright |
|---------|---------------|------------|
| Element targeting | Accessibility tree | CSS selectors |
| Agent-friendly | Yes (purpose-built) | Partial |
| Install size | ~15MB | ~300MB |
| Speed | Rust-based | Node-based |

## Related
- [[vercel-labs-integration]] — Vercel Labs tools
- [[2026-05-20-phase123-complete]] — Phase 3 completion
