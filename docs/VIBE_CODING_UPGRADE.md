Scope: Research vibe coding best practices, Claude Code workflow optimization, and identify gaps in the current FinPlan Pro setup.

Result: Comprehensive upgrade recommendations based on official Claude Code documentation analysis.

## Current Setup Audit

### Hooks (`.claude/settings.json`)
- **PostToolUse Edit**: runs `npm run lint` after every edit ✅
- **PostToolUse Write**: runs `npx tsc --noEmit` after .ts writes ✅
- **Missing**: PreToolUse safety hooks, Stop hooks for test enforcement, SessionStart for env setup

### Skills (`.claude/skills/`)
- 12 skills present: coding-standards, eval-harness, finplan-external-patterns, frontend-patterns, security-review, strategic-compact, tdd-workflow, verification-loop, finplan-codebase.md, finplan-data-operations.md, finplan-workflows.md, create-second-brain-prd
- **Missing**: deploy skill, graphify-auto skill, context-budget skill, agent-coordinator skill

### MCP Servers
- 4 configured: github, git, filesystem, excel-analyser ✅
- **Missing**: memory MCP (for cross-session state), playwright MCP (for E2E testing)

### Agent Definitions (`.claude/agents/`)
- 5 agents: a1-consolidation, a2-reports, a3-persistence, a4-onboarding, a5-enterprise ✅
- Missing: qa-reviewer has read-only tools only (no Edit/Write/Bash)

## Recommended Upgrades

### 1. Enhanced Hooks (HIGH PRIORITY)

**Add PreToolUse safety hook** — blocks destructive commands:
```json
{
  "hooks": {
    "PreToolUse": [{
      "matcher": "Bash",
      "hooks": [{
        "type": "command",
        "if": "Bash(rm -rf *)",
        "command": "echo '{\"hookSpecificOutput\":{\"hookEventName\":\"PreToolUse\",\"permissionDecision\":\"deny\",\"permissionDecisionReason\":\"Destructive rm -rf blocked\"}}'"
      }]
    }]
  }
}
```

**Add Stop hook** — enforces test run before session end:
```json
{
  "hooks": {
    "Stop": [{
      "matcher": "*",
      "hooks": [{
        "type": "command",
        "command": "cd \"C:/Users/Tahir/Desktop/frontend that i want\" && npx vitest --run --reporter=dot 2>&1 | tail -3"
      }]
    }]
  }
}
```

**Add SessionStart hook** — sets NODE_OPTIONS for memory:
```json
{
  "hooks": {
    "SessionStart": [{
      "matcher": "startup|resume",
      "hooks": [{
        "type": "command",
        "command": "export NODE_OPTIONS=\"--max-old-space-size=32768\" && echo \"NODE 32GB\""
      }]
    }]
  }
}
```

### 2. New Skills (MEDIUM PRIORITY)

**deploy skill** — automated deployment workflow:
```yaml
---
name: deploy
description: Build, test, and deploy FinPlan Pro
disable-model-invocation: true
---
1. Run `npm run build`
2. Run `npm run test`
3. Commit with deploy message
4. Push to main
```

**graphify-auto skill** — auto-rebuild graph after code changes:
```yaml
---
name: graphify-auto
description: Rebuild knowledge graph after significant code changes
disable-model-invocation: true
---
Run graphify on src/ to update the knowledge graph.
```

**context-budget skill** — manage context window:
```yaml
---
name: context-budget
description: Check and manage context window usage
---
Check current context usage with `/cost`. If over 80%, run `/compact` with focus instructions.
```

### 3. MCP Server Upgrades (MEDIUM PRIORITY)

**Add playwright MCP** for E2E testing:
```json
{
  "playwright": {
    "command": "npx",
    "args": ["-y", "@anthropic/mcp-playwright"]
  }
}
```

**Add memory MCP** for cross-session state:
```json
{
  "memory": {
    "command": "npx",
    "args": ["-y", "@anthropic/memory-mcp"]
  }
}
```

### 4. CLAUDE.md Optimization (HIGH PRIORITY)

Current CLAUDE.md files are verbose. Best practice: keep under 500 lines, prune anything Claude can figure out by reading code.

**Recommendations:**
- Move domain-specific rules to skills (load on demand)
- Keep only non-obvious conventions in CLAUDE.md
- Use `@path/to/import` syntax for detailed references
- Add `"When compacting, always preserve modified files list and test commands"` instruction

### 5. Agent Improvements (LOW PRIORITY)

Current agents are well-configured. Minor improvements:
- Add `model: opus` to qa-reviewer for deeper analysis
- Add `model: haiku` to lightweight agents for cost savings
- Create a `test-writer` agent specifically for generating tests

### 6. Workflow Patterns (HIGH PRIORITY)

**Writer/Reviewer pattern**: Run 2 sessions in parallel — one writes code, other reviews.

**Fan-out pattern**: For large migrations, generate task list, then loop `claude -p` for each file.

**Plan-then-execute**: Use plan mode for multi-file changes, then switch to implementation mode.

## Priority Order

1. **Enhanced hooks** — immediate safety and quality gains
2. **CLAUDE.md optimization** — reduce context bloat
3. **New skills** — deploy, graphify-auto, context-budget
4. **MCP servers** — playwright for E2E
5. **Agent improvements** — model selection
6. **Workflow patterns** — writer/reviewer, fan-out

## Files to Modify

- `.claude/settings.json` — add hooks
- `.claude/skills/deploy/SKILL.md` — new skill
- `.claude/skills/graphify-auto/SKILL.md` — new skill
- `.claude/skills/context-budget/SKILL.md` — new skill
- `.mcp.json` — add playwright MCP
- `CLAUDE.md` — optimize and prune

Key files:
- C:\Users\Tahir\Desktop\frontend that i want\.claude\settings.json
- C:\Users\Tahir\Desktop\frontend that i want\.claude\rules\hooks.md
- C:\Users\Tahir\Desktop\frontend that i want\.claude\rules\patterns.md
- C:\Users\Tahir\Desktop\frontend that i want\.claude\skills\finplan-external-patterns\SKILL.md
- C:\Users\Tahir\Desktop\frontend that i want\CLAUDE.md
- C:\Users\Tahir\Desktop\frontend that i want\.mcp.json

Files changed: None (research task)

Issues:
- Web search unavailable (DuckDuckGo rate-limited) — used WebFetch on official docs instead
- Graphify import fails in current Python environment — `graphify` module not found despite `graphifyy` package installed
