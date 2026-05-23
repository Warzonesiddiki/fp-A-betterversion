# FinPlan Pro — Agent Swarm Protocol

## Mission
Build the world's most advanced FP&A platform — eliminating the need for an army of financial analysts. A single MNC can make every strategic decision through this tool. No more spreadsheets, no more manual consolidation, no more 3-day report cycles.

## Architecture — 6-Agent Hive Mind

```
┌─────────────────────────────────────────────────────┐
│              ORCHESTRATOR (Lead Agent)                │
│  - Reads TASK_BOARD.md, assigns work                 │
│  - Resolves conflicts, validates quality gates       │
│  - Maintains dev_log.md, runs final build verify     │
│  - Pushes git checkpoints                            │
└──────────┬──────────┬──────────┬──────────┬──────────┘
           │          │          │          │
     ┌─────┘    ┌────┘    ┌────┘    ┌────┘    ┌────┐
     ▼          ▼          ▼          ▼          ▼
┌─────────┐┌─────────┐┌─────────┐┌─────────┐┌─────────┐
│ Agent 1 ││ Agent 2 ││ Agent 3 ││ Agent 4 ││ Agent 5 │
│  DATA   ││ ENGINES ││  PAGES  ││ QUALITY ││  INFRA  │
└─────────┘└─────────┘└─────────┘└─────────┘└─────────┘
```

## Communication Protocol

All agents communicate through a shared file system. No direct inter-agent messaging.

### Read/Write Rules
1. **Read** `AGENT_SWARM/TASK_BOARD.md` at the START of every work cycle
2. **Write** status updates to `AGENT_SWARM/agent_N/` — NEVER write to other agents' directories
3. **Claim** a task by writing `CLAIMED: <task-id>` in `AGENT_SWARM/TASK_BOARD.md`
4. **Complete** a task by writing `COMPLETE: <task-id>` + evidence in the board
5. **Blocked** tasks go to `BLOCKED:` with reason — orchestrator unblocks

### File Conflict Prevention
- Each agent owns specific file paths (see chart below)
- Never modify a file owned by another agent
- If you MUST modify a shared file (e.g., types/index.ts), CLAIM it on the board first

| Agent | Owns | Never Touch |
|-------|------|-------------|
| A1 DATA | `src/store/*`, `src/types/*`, `src/utils/*`, `src/hooks/*` | engines/, pages/ |
| A2 ENGINES | `src/engines/*`, `src/workers/*` | store/, pages/ |
| A3 PAGES | `src/pages/**/*.tsx` | engines/, store/ |
| A4 QUALITY | `src/components/**/*`, `src/test/*`, lint rules | pages/ (no content changes) |
| A5 INFRA | `.github/*`, `src-tauri/*`, `scripts/*`, config files | src/ (no code changes) |
| ORCHESTRATOR | `AGENT_SWARM/`, `AUDIT_LOGS/`, `dev_log.md`, `todo.md` | Any (conflict resolution only) |

### Quality Gate (MANDATORY before COMPLETE)
Every agent MUST run before marking any task COMPLETE:
```
cd C:\Users\Tahir\Desktop\frontend that i want
npm run build 2>&1 | Select-Object -Last 5
```
- If build FAILS → mark task as `BLOCKED` with build error, revert changes, document
- If build PASSES → mark COMPLETE

### Dead End Protocol
If you attempt a fix 3 times without success:
1. REVERT to last working state
2. Mark task as `DEAD_END` in TASK_BOARD.md
3. Document why it failed in your agent directory
4. Move to next task — never block the swarm

## File System
- `AGENT_SWARM/TASK_BOARD.md` — Central task queue (see below)
- `AGENT_SWARM/agent_N/` — Per-agent workspace for logs, notes
- `AGENT_SWARM/shared/` — Cross-agent artifacts (types, interfaces, patterns)
- `dev_log.md` — Master timeline (ORCHESTRATOR only)
- `todo.md` — Current orchestration todo (ORCHESTRATOR only)
