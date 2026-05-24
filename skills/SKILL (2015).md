---
name: auto-activator
description: Use to automatically and aggressively activate all relevant expert skills based on a 1% relevance threshold. v2.0 Comprehensive.
---

# Auto-Activator v2.0

## Overview
The Auto-Activator ensures that the agent always has the most relevant expert knowledge loaded for any given task. It operates by scanning the current context (user input and tool outputs), detecting the active project phase, and aggressively managing skills (activation, recursive loading, and LRU unloading).

## Phase Detection (Hybrid: Intent + Evidence)
Analyze context to determine the current phase. HUD must reflect this.

| Phase | Intent Signals (Keywords) | Evidence Signals (Tools) |
|---|---|---|
| **Research** | "how does", "find", "search", "explore", "understand" | `ls`, `list_directory`, `grep_search`, `glob`, `read_file` |
| **Design** | "architecture", "plan", "strategy", "spec", "ADR", "RFC" | `write_file` (to `docs/`), `mcp_context7_query-docs` |
| **Execution** | "implement", "add", "create", "write code", "build" | `replace`, `write_file` (to `src/`), `run_shell_command` (install) |
| **Debugging** | "fix", "error", "bug", "why is", "crash", "failing" | `run_shell_command` (failing logs), `read_background_output` |
| **Testing** | "test", "verify", "coverage", "assert", "mock" | `run_shell_command` (test runners like `jest`, `pytest`) |
| **Maintenance** | "refactor", "cleanup", "lint", "format", "modernize" | `run_shell_command` (lint/fmt), `replace` (style changes) |

## Recursive Loading
When a skill is activated, scan its content for:
- `REQUIRED BACKGROUND: <skill-name>`
- `REQUIRED SUB-SKILL: <skill-name>`
Immediately call `activate_skill` for all identified dependencies.

## Auto-Unload & LRU Management
Maintain efficiency by offloading stale context.
- **Stale Rule:** If a skill (other than `auto-activator` or `using-superpowers`) has not been utilized (referenced in a tool call or prompt) for **5 consecutive turns**, it is considered stale.
- **Hard Cap:** Limit active skills to **10**.
- **LRU Policy:** If a new activation exceeds the cap, unload the **Least Recently Used** skill.
- **Unloading:** Mark skills as "Unloaded" in the HUD to notify the user.

## Learning Module (Usage vs. Activation)
Track the effectiveness of auto-activations to refine instincts.
1. **Track Usage:** For every activated skill, increment a usage counter if its tools or instructions are actually used in that turn.
2. **Instinct Score:** Calculate `Score = (Uses / Activations)`.
3. **Persist Memory:** Store these scores in the **Global Personal Memory** (`C:\Users\Tahir\.gemini\GEMINI.md`) under a `# 🧠 Skill Instincts` section.
4. **Adaptive Threshold:** High-score skills (e.g., > 0.8) are "Always Loaded" in their specific phases. Low-score skills (e.g., < 0.2) require a higher relevance threshold (5%) to activate.

## Core Mandate (v2.0)
- **Aggressive Activation:** Use a **1% relevance threshold**—if a skill could plausibly help, activate it.
- **HUD HUD Notification:** Prepend to every response: `[Phase: <phase> | Auto-Activated: <list> | Unloaded: <list>]`.
- **Pure State Overrides:** Respect manual deactivations for the turn, but re-evaluate fresh next turn.

## Implementation Steps
1. Detect Phase using the Hybrid table.
2. Cross-reference prompt + tools with skill library.
3. Call `activate_skill` (including recursive dependencies).
4. Run LRU/Stale checks and unload if necessary.
5. Update Learning Module stats in Global Memory.
6. Render the v2.0 HUD header.
