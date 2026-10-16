# MCP Servers Research for FinPlan Pro

> Researched: 2026-05-19
> Status: Recommendation

## Currently Installed (5)

| Server         | Package                                 | Purpose             |
| -------------- | --------------------------------------- | ------------------- |
| github         | @modelcontextprotocol/server-github     | GitHub API access   |
| git            | mcp-server-git                          | Git operations      |
| filesystem     | @modelcontextprotocol/server-filesystem | File system access  |
| excel-analyser | excel-analyser-mcp                      | Excel file parsing  |
| playwright     | @anthropic/mcp-playwright               | E2E browser testing |

## Recommended Additions (Top 5)

### 1. Sentry MCP — Error Monitoring

```json
"sentry": {
  "command": "npx",
  "args": ["-y", "sentry-mcp-server"],
  "env": {
    "SENTRY_AUTH_TOKEN": "${SENTRY_AUTH_TOKEN}",
    "SENTRY_ORG": "finplan-pro",
    "SENTRY_PROJECT": "finplan-pro"
  }
}
```

- **What:** Real-time error tracking, stack traces, performance monitoring
- **Why:** Financial apps need zero-tolerance for runtime errors. Sentry catches production crashes before users report them.
- **FinPlan use:** Monitor formula engine errors, store corruption, import failures

### 2. SQLite MCP — Local Database

```json
"sqlite": {
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-sqlite", "--db-path", "./data/finplan.db"]
}
```

- **What:** Query and manage SQLite databases directly
- **Why:** FinPlan Pro is offline-first. SQLite is the natural persistence layer for Tauri apps.
- **FinPlan use:** Query budget data, audit trails, formula cache directly

### 3. Lighthouse MCP — Performance Auditing

```json
"lighthouse": {
  "command": "npx",
  "args": ["-y", "@anthropic/mcp-lighthouse"]
}
```

- **What:** Automated web performance, accessibility, SEO audits
- **Why:** 62K LOC app needs performance regression detection. Lighthouse catches slow renders, large bundles, a11y violations.
- **FinPlan use:** Audit dashboard load times, chart render performance, keyboard navigation scores

### 4. NPM Audit MCP — Security Scanning

```json
"npm-audit": {
  "command": "npx",
  "args": ["-y", "@anthropic/mcp-npm-audit"]
}
```

- **What:** Scan npm dependencies for known vulnerabilities
- **Why:** Financial apps are high-value targets. Dependency vulnerabilities are the #1 attack vector.
- **FinPlan use:** Scan xlsx, recharts, zustand, vite dependencies for CVEs

### 5. Storybook MCP — Component Documentation

```json
"storybook": {
  "command": "npx",
  "args": ["-y", "@anthropic/mcp-storybook"]
}
```

- **What:** Browse and interact with Storybook component stories
- **Why:** 108+ components need visual documentation. Storybook isolates components for testing.
- **FinPlan use:** Document chart components, KPI cards, data tables, form components

## Honorable Mentions

| Server         | Use Case                                     | Priority |
| -------------- | -------------------------------------------- | -------- |
| figma-mcp      | Design-to-code sync                          | MEDIUM   |
| datadog-mcp    | APM monitoring (if backend added)            | LOW      |
| snyk-mcp       | Security scanning (alternative to npm-audit) | MEDIUM   |
| web-vitals-mcp | Core Web Vitals tracking                     | MEDIUM   |
| jsdoc-mcp      | Auto-generate API docs                       | LOW      |
| postgres-mcp   | Backend database (future)                    | LOW      |
| redis-mcp      | Caching layer (future)                       | LOW      |

## Installation Priority

1. **Sentry** — production error monitoring (highest value)
2. **SQLite** — offline-first data access (matches architecture)
3. **NPM Audit** — security scanning (compliance requirement)
4. **Lighthouse** — performance regression (UX quality)
5. **Storybook** — component docs (developer experience)

## Config Addition

Add to `.mcp.json`:

```json
{
  "mcpServers": {
    "sentry": { "command": "npx", "args": ["-y", "sentry-mcp-server"] },
    "sqlite": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sqlite", "--db-path", "./data/finplan.db"]
    },
    "npm-audit": { "command": "npx", "args": ["-y", "@anthropic/mcp-npm-audit"] },
    "lighthouse": { "command": "npx", "args": ["-y", "@anthropic/mcp-lighthouse"] },
    "storybook": { "command": "npx", "args": ["-y", "@anthropic/mcp-storybook"] }
  }
}
```
