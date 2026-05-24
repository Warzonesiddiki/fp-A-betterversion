---
name: browser-automation-playwright
description: Comprehensive guidance for browser automation using Playwright.
origin: MCP Market
---

# Browser Automation with Playwright

## Overview

This skill provides comprehensive guidance for browser automation using Playwright, based on patterns from top MCP market tools like Microsoft Playwright, Browser Use, Playwriter, and Chrome DevTools.

## Key Concepts

### 1. Browser Initialization
\\\python
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=False)
    context = browser.new_context(
        user_agent=\"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36\",
        viewport={\"width\": 1920, \"height\": 1080}
    )
    page = context.new_page()
\\\

### 2. Navigation and Waiting
\\\python
# Basic navigation
page.goto(\"https://example.com\")

# Wait for navigation to complete
page.goto(\"https://example.com\", wait_until=\"networkidle\")

# Wait for specific element
page.wait_for_selector(\"#submit-button\", timeout=5000)

# Wait for JavaScript execution
page.wait_for_function(\"() => window.isLoaded === true\")
\\\

### 3. Interaction Patterns

**Click:**
\\\python
# Simple click
page.click(\"button.submit\")

# Click with exact text
page.click(\"text=Submit Form\")

# Right-click (context menu)
page.click(\"button\", button=\"right\")

# Double-click
page.dblclick(\"tr.row\")
\\\

**Fill Forms:**
\\\python
# Text input
page.fill(\"#username\", \"testuser\")
page.fill(\"#password\", \"password123\")

# Multiple fields
page.fill(\"input[name='email']\", \"test@example.com\")

# Append text (keep existing)
page.press(\"#search\", \"Append\", \"more text\")

# Select dropdown
page.select_option(\"#country\", \"US\")
page.select_option(\"#country\", value=\"US\")
\\\

**Hover and Drag:**
\\\python
# Hover over element
page.hover(\".menu-item\")

# Drag and drop
page.drag_and_drop(\"#source\", \"#target\")

# Drag with specific positions
page.mouse.move(100, 100)
page.mouse.down()
page.mouse.move(200, 200)
page.mouse.up()
\\\

### 4. Handling Dynamic Content

**Wait for Network Idle:**
\\\python
page.goto(\"https://app.com\", wait_until=\"networkidle\")
\\\

**Wait for API Response:**
\\\python
# Set up response interception
with page.expect_response(\"**/api/data\") as response_info:
    page.click(\"#load-data\")
response = response_info.value
data = response.json()
\\\

**Wait for DOM Changes:**
\\\python
# Wait for element to appear
page.wait_for_selector(\".loaded-content\", state=\"visible\")

# Wait for element to disappear
page.wait_for_selector(\".loading-spinner\", state=\"hidden\")

# Wait for element to be detached
page.wait_for_selector(\"#old-element\", state=\"detached\")
\\\

### 5. Taking Screenshots and PDFs

**Screenshots:**
\\\python
# Full page screenshot
page.screenshot(path=\"full-page.png\", full_page=True)

# Element screenshot
page.screenshot(path=\"element.png\", clip={\"x\": 0, \"y\": 0, \"width\": 800, \"height\": 600})

# Dark mode screenshot
page.screenshot(path=\"dark.png\", color_scheme=\"dark\")
\\\

**PDF Generation:**
\\\python
page.goto(\"https://example.com/report\")
page.pdf(path=\"report.pdf\", format=\"A4\", print_background=True)
\\\

## MCP Integration

### Recommended MCP Servers
- **Microsoft Playwright** (/server/playwright-5) - Official Microsoft Playwright MCP
- **Browser Use** (/server/browser-use) - Natural language browser automation
- **Playwriter** (/server/playwriter) - Chrome extension with full Playwright API
- **Chrome DevTools** (/server/chrome-devtools-1) - Developer tools integration
- **Chrome Browser** (/server/chrome-browser) - Comprehensive Chrome control

### Example: Microsoft Playwright MCP

\\\python
# MCP server: /server/playwright-5
# Automate browser interactions for LLMs

from playwright_mcp import PlaywrightClient

client = PlaywrightClient()

# Create browser context
browser = await client.launch_browser(headless=True)

# Navigate and interact
page = await browser.new_page()
await page.goto(\"https://example.com\")
await page.fill(\"#search\", \"playwright\")
await page.click(\"#search-button\")

# Extract results
results = await page.query_selector_all(\".result\")
for result in results:
    title = await result.query_selector(\"h3\")
    print(await title.inner_text())
\\\

### Example: Browser Use MCP

\\\python
# MCP server: /server/browser-use
# Natural language browser automation

from browser_use import BrowserAgent

agent = BrowserAgent(
    browser_type=\"chromium\",
    headless=False
)

# Execute task via natural language
result = await agent.execute(
    task=\"Go to Amazon, search for 'wireless headphones', 
          and extract the names and prices of the first 5 results\"
)

print(result)
\\\

## Advanced Patterns

### 1. Handling iFrames
\\\python
# Get iframe element
frame = page.frame(name=\"my-iframe\")
# or
frame = page.frame(url=\"https://example.com/iframe\")

# Interact within iframe
frame.fill(\"#input-field\", \"value\")

# Handle nested ifframes
main_frame = page.frame(name=\"outer\")
inner_frame = main_frame.frame(name=\"inner\")
\\\

### 2. Handling Dialogs (Alerts/Confirmations)
\\\python
# Handle alert dialog
page.on(\"dialog\", lambda dialog: dialog.accept())
page.click(\"#trigger-alert\")

# Handle confirm dialog
page.on(\"dialog\", lambda dialog: dialog.accept())
# or
page.on(\"dialog\", lambda dialog: dialog.dismiss())

# Handle prompt
page.on(\"dialog\", lambda dialog: dialog.accept(\"my answer\"))
\\\

### 3. File Upload
\\\python
# Single file
page.set_input_files(\"#file-upload\", \"document.pdf\")

# Multiple files
page.set_input_files(\"#file-upload\", [\"file1.pdf\", \"file2.pdf\"])

# Clear file selection
page.set_input_files(\"#file-upload\", [])
\\\

### 4. Proxy Configuration
\\\python
browser = p.chromium.launch(
    proxy={
        \"server\": \"http://my-proxy:8080\",
        \"username\": \"user\",
        \"password\": \"pass\"
    }
)
\\\

### 5. Authentication Handling
\\\python
# Store authentication state
context = browser.new_context()
page = context.new_page()
await page.goto(\"https://example.com/login\")
# ... perform login ...

# Save storage state for reuse
await context.storage_state(path=\"auth.json\")

# Reuse authentication
new_context = browser.new_context(storage_state=\"auth.json\")
\\\

### 6. Running JavaScript
\\\python
# Execute custom JavaScript
title = page.evaluate(\"document.title\")
print(title)

# Get element properties
element_data = page.evaluate(\"\"\"() => {
    const el = document.querySelector('.product');
    return {
        text: el.innerText,
        visible: el.offsetParent !== null,
        children: el.children.length
    };
}\"\"\")
\\\

## Error Handling and Retry

\\\python
from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeout

def safe_navigate(page, url, retries=3):
    for attempt in range(retries):
        try:
            page.goto(url, timeout=30000)
            return True
        except PlaywrightTimeout:
            print(f\"Attempt {attempt + 1} failed, retrying...\")
            if attempt == retries - 1:
                raise
    return False

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page()
    safe_navigate(page, \"https://example.com\")
\\\

## Best Practices

1. **Use Contexts**: Create separate contexts for different user sessions
2. **Handle Wait Properly**: Prefer explicit waits over sleep
3. **Resource Cleanup**: Always close browsers and contexts
4. **Headless by Default**: Only use visible mode for debugging
5. **Parallel Execution**: Use browser contexts for parallel operations
6. **Intercept Requests**: Use route interception for testing and caching
7. **Monitor Performance**: Track memory and CPU usage in long-running tasks
