# E2E Testing with agent-browser

## Quick Start

```bash
# Run all smoke tests
bash tests/e2e/smoke-test.sh

# Or manually:
npm run dev &
agent-browser open http://localhost:5173
agent-browser snapshot
agent-browser screenshot tests/e2e/screenshots/manual.png
```

## Prerequisites

```bash
# Install agent-browser globally
npm install -g agent-browser

# First run: download Chrome for Testing
agent-browser install
```

## Flows Covered

| # | Flow | Test |
|---|------|------|
| 1 | Homepage | Load + screenshot |
| 2 | Accessibility | Snapshot tree |
| 3 | Dashboard | Navigate + screenshot |
| 4 | Budgets | Navigate + screenshot |
| 5 | Reports | Navigate + screenshot |
| 6 | Scenarios | Navigate + screenshot |
| 7 | Templates | Navigate + screenshot |
| 8 | NLQ Chat | Fill input |
| 9 | Final | Screenshot |

## Screenshots

All screenshots saved to `tests/e2e/screenshots/` with timestamps:
- `01-homepage-YYYYMMDD_HHMMSS.png`
- `02-snapshot-YYYYMMDD_HHMMSS.txt`
- `03-dashboard-YYYYMMDD_HHMMSS.png`
- ...

## Adding New Flows

Add to `smoke-test.sh`:

```bash
# ─── Flow N: Description ───
log "Flow N: Description"
agent-browser open "$BASE_URL/new-page" 2>/dev/null && pass "New page" || fail "New page"
agent-browser screenshot "$SCREENSHOT_DIR/N-description-${TIMESTAMP}.png" 2>/dev/null
```

## agent-browser Commands

```bash
# Navigation
agent-browser open http://localhost:5173
agent-browser click --text "Dashboard"
agent-browser press Meta+k

# Interaction
agent-browser fill "text" --selector "input"
agent-browser find role button click --name "Submit"

# Inspection
agent-browser snapshot              # Accessibility tree
agent-browser screenshot path.png   # Capture
agent-browser get text --selector "h1"

# Network
agent-browser intercept "**/api/**"  # Mock requests
```

## Key Features

- **Accessibility-first**: Uses refs (e.g., `@e2`) instead of CSS selectors
- **Semantic finding**: By ARIA role, text, label, placeholder
- **Batch execution**: Multiple commands in one process
- **Network control**: Mock/intercept requests
- **No Playwright dependency**: Uses Chrome for Testing directly
