---
name: vision-executor
description: "Vision-to-execution workflow. User gives detailed prompt → system identifies gaps → auto-loads skills → plans → executes with perfection. Integrates graphify for knowledge graph, Obsidian as second brain."
trigger: /vision
---

# /vision — Vision-to-Execution

Turn a detailed vision prompt into a fully executed project. Zero friction, maximum quality.

## Usage

```
/vision <detailed prompt describing your vision>
/vision --analyze-only    # only identify gaps, don't execute
/vision --plan-only       # analyze + plan, don't execute
/vision --obsidian        # also push to Obsidian vault via graphify
```

## How It Works

### Phase 1: Vision Analysis

When user gives a detailed prompt, analyze it for:

1. **What's Clear** — requirements that are explicitly stated
2. **What's Missing** — gaps that need filling:
   - Tech stack not specified? Infer from context (project type, existing files)
   - No error handling mentioned? Add standard patterns
   - No testing strategy? Add TDD workflow
   - No deployment plan? Skip unless asked
   - No design/UI specs? Ask or use defaults
   - Missing edge cases? Identify and flag
3. **What's Ambiguous** — requirements that could go multiple ways
4. **What's Risky** — potential pitfalls or blockers

Present as structured analysis:
```
VISION ANALYSIS
═══════════════
✓ Clear: [list]
⚠ Missing: [list with suggestions]
? Ambiguous: [list with options]
✗ Risky: [list with mitigations]
```

### Phase 2: Auto-Skill Loading

Detect project type from prompt + existing files, then load relevant skills:

| Project Type | Auto-Loaded Skills |
|-------------|-------------------|
| Frontend (React/Vue/Next) | `frontend-patterns`, `design-system`, `e2e-testing`, `tdd-workflow` |
| Backend (API/Node/Python) | `backend-patterns`, `api-design`, `database-migrations`, `security-review` |
| Full-Stack | All above + `verification-loop` |
| Mobile (React Native) | `frontend-patterns`, `e2e-testing`, `design-system` |
| DevOps/Infra | `docker-patterns`, `deployment-patterns`, `security-scan` |
| Data/ML | `python-patterns`, `pytorch-patterns`, `mle-workflow` |
| Any Project | `search-first`, `verification-loop`, `security-review`, `tdd-workflow` |

Auto-load by scanning:
- `package.json` → detect framework
- File extensions → detect language
- Directory structure → detect architecture
- Prompt keywords → detect intent

### Phase 3: Plan Generation

Create execution plan using GOAP (Goal-Oriented Action Planning):

1. Define end state (what "done" looks like)
2. Work backwards from goal to current state
3. Identify all intermediate steps
4. Order by dependencies
5. Estimate complexity per step
6. Identify parallel work streams

Present plan:
```
EXECUTION PLAN
══════════════
Goal: [end state]

Steps:
  1. [step] → [agent type] → [estimated complexity]
  2. [step] → [agent type] → [estimated complexity]
  ...

Parallel tracks:
  Track A: [steps that can run simultaneously]
  Track B: [steps that can run simultaneously]

Dependencies:
  [step 3] blocks on [step 1, step 2]
```

### Phase 4: Execution

Execute the plan with:

1. **Search First** — always search codebase before coding
2. **Code Minimally** — just what's needed, nothing more
3. **Auto-Lint** — formatting handled by hook
4. **Verify Continuously** — use `verification` agent for 3+ file changes
5. **Graphify on Completion** — push knowledge graph to Obsidian

Execution modes:
- **Standard** — execute step by step, verify each
- **YOLO** — autonomous loop, self-correcting
- **Parallel** — fan-out agents for independent steps

### Phase 5: Obsidian Integration

After execution, if `--obsidian` flag or user has Obsidian:

1. Run `/graphify <project-path> --obsidian` to build knowledge graph
2. Push to Obsidian vault at configured path
3. Create project note with:
   - Vision summary
   - What was built
   - Key decisions made
   - Links to graph communities

## Integration with Existing Skills

Vision-executor orchestrates these skills automatically:

- `/search-first` → before any coding
- `/yolo` → for autonomous execution mode
- `/verification-loop` → after each major step
- `/graphify` → for knowledge graph + Obsidian
- `/context-budget` → for long sessions
- `/security-review` → before final delivery
- `/tdd-workflow` → for test generation

## Example

User: "Build me a real-time chat app with React frontend, Node.js backend, WebSocket support, user authentication, message persistence, and typing indicators. Should handle 1000 concurrent users."

System response:
```
VISION ANALYSIS
═══════════════
✓ Clear: React frontend, Node backend, WebSocket, auth, persistence, typing indicators
⚠ Missing:
  - Database not specified → suggest PostgreSQL (persistent) or Redis (fast cache)
  - Auth method not specified → suggest JWT + refresh tokens
  - No UI design specs → use clean minimal design
  - No deployment target → skip for now
  - No rate limiting → add for 1000 users
? Ambiguous:
  - "Real-time" → WebSocket (confirmed) vs SSE?
  - "Persistence" → messages only? Or also user data?
✗ Risky:
  - 1000 concurrent WebSocket connections → need connection pooling
  - Typing indicators at scale → throttle to avoid spam

Auto-loading: frontend-patterns, backend-patterns, api-design, security-review, tdd-workflow, verification-loop

EXECUTION PLAN
══════════════
Goal: Working chat app with all features

Steps:
  1. Project scaffolding → coder → low
  2. Database schema + migrations → backend-dev → medium
  3. Auth system (JWT) → backend-dev → medium
  4. WebSocket server → backend-dev → medium
  5. Message persistence → backend-dev → low
  6. Typing indicators → coder → low
  7. React UI components → coder → medium
  8. WebSocket client → coder → medium
  9. Integration tests → tester → medium
  10. Security review → security-architect → low
  11. Graphify + Obsidian → graphify → low

Parallel tracks:
  Track A: Backend (steps 2-6)
  Track B: Frontend (steps 7-8)
  Merge at: step 9 (integration tests)

Proceeding with execution...
```

## Configuration

Set in CLAUDE.md or project settings:
- Obsidian vault path
- Default execution mode (standard/yolo/parallel)
- Auto-graphify on completion (true/false)
- Default tech stack preferences
