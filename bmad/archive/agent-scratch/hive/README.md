# FINPLAN PRO HIVE

## Quick Start

### For User
Tell each agent:
```
Read hive/tasks/agentN-tasks.md and start working.
Follow the protocol in hive/AGENT_PROTOCOL.md.
```

### For Manager (me)
To check status:
```
Read hive/status/agentN-status.md for each agent
Read hive/logs/agentN-log.md for detailed logs
Read hive/comms/agentN-to-manager.md for messages
```

To assign new tasks:
```
Edit hive/tasks/agentN-tasks.md
Edit hive/comms/broadcast.md to notify all agents
```

## File Structure
```
hive/
  README.md                    <- This file
  HIVE_MASTER.md              <- Overall hive structure
  AGENT_PROTOCOL.md           <- Rules all agents must follow
  PROJECT_STATE.md            <- Current project state snapshot
  tasks/
    agent1-tasks.md           <- Agent 1 (Engines & Data Model)
    agent2-tasks.md           <- Agent 2 (UI & Components)
    agent3-tasks.md           <- Agent 3 (Stores & State)
    agent4-tasks.md           <- Agent 4 (Testing & Quality)
    agent5-tasks.md           <- Agent 5 (Integration & Build)
  status/
    agent1-status.md          <- Agent 1 progress
    agent2-status.md          <- Agent 2 progress
    agent3-status.md          <- Agent 3 progress
    agent4-status.md          <- Agent 4 progress
    agent5-status.md          <- Agent 5 progress
  logs/
    manager-log.md            <- Manager decisions
    agent1-log.md             <- Agent 1 detailed log
    agent2-log.md             <- Agent 2 detailed log
    agent3-log.md             <- Agent 3 detailed log
    agent4-log.md             <- Agent 4 detailed log
    agent5-log.md             <- Agent 5 detailed log
  comms/
    broadcast.md              <- Manager -> All agents
    agent1-to-manager.md      <- Agent 1 -> Manager
    agent2-to-manager.md      <- Agent 2 -> Manager
    agent3-to-manager.md      <- Agent 3 -> Manager
    agent4-to-manager.md      <- Agent 4 -> Manager
    agent5-to-manager.md      <- Agent 5 -> Manager
  reports/
    completion-reports/       <- Task completion reports
    quality-reports/          <- Quality gate results
```

## Agents
| # | Persona | Domain | Focus |
|---|---------|--------|-------|
| 1 | The Architect | Engines & Data Model | CubeEngine, FormulaEngine, ConsolidationEngine |
| 2 | The Artisan | UI & Components | DataTable, FormulaBar, Dashboard, Report Designer |
| 3 | The Glue | Stores & State | cubeStore, glStore, undo/redo, persistence |
| 4 | The Inquisitor | Testing & Quality | Fix test failures, expand coverage, quality gates |
| 5 | The Engineer | Integration & Build | Build system, Tauri, SQL, storage layer |

## Communication Flow
```
Manager -> broadcast.md -> All Agents
Agent -> agentN-to-manager.md -> Manager
Manager -> tasks/agentN-tasks.md -> Agent
Agent -> status/agentN-status.md -> Manager (read)
```

## Current Priority
1. Fix all 52 failing tests
2. Create missing files (cubeStore, FormulaFunctionRegistry)
3. Expand engines with 300+ functions
4. Build UI components
5. Wire everything together
