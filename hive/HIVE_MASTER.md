# FINPLAN PRO HIVE

## Structure
```
hive/
  HIVE_MASTER.md          <- Manager reads this to know overall state
  tasks/
    agent1-tasks.md       <- Task queue for Agent 1
    agent2-tasks.md       <- Task queue for Agent 2
    agent3-tasks.md       <- Task queue for Agent 3
    agent4-tasks.md       <- Task queue for Agent 4
    agent5-tasks.md       <- Task queue for Agent 5
  status/
    agent1-status.md      <- Agent 1 writes progress here
    agent2-status.md      <- Agent 2 writes progress here
    agent3-status.md      <- Agent 3 writes progress here
    agent4-status.md      <- Agent 4 writes progress here
    agent5-status.md      <- Agent 5 writes progress here
  logs/
    manager-log.md        <- Manager's decisions and assignments
    agent1-log.md         <- Agent 1 detailed work log
    agent2-log.md         <- Agent 2 detailed work log
    agent3-log.md         <- Agent 3 detailed work log
    agent4-log.md         <- Agent 4 detailed work log
    agent5-log.md         <- Agent 5 detailed work log
  reports/
    completion-reports/   <- Per-task completion reports
    quality-reports/      <- Quality gate results
  comms/
    broadcast.md          <- Manager broadcasts to all agents
    agent1-to-manager.md  <- Agent 1 messages to Manager
    agent2-to-manager.md  <- Agent 2 messages to Manager
    agent3-to-manager.md  <- Agent 3 messages to Manager
    agent4-to-manager.md  <- Agent 4 messages to Manager
    agent5-to-manager.md  <- Agent 5 messages to Manager
```

## Agents
| Agent | Domain | Persona |
|-------|--------|---------|
| Manager | Orchestration | Brutal Overlord |
| Agent 1 | Engines & Data Model | The Architect |
| Agent 2 | UI & Components | The Artisan |
| Agent 3 | Stores & State | The Glue |
| Agent 4 | Testing & Quality | The Inquisitor |
| Agent 5 | Integration & Build | The Engineer |

## Communication Protocol
1. Manager assigns tasks in `tasks/agentN-tasks.md`
2. Agent reads tasks, works on them
3. Agent updates `status/agentN-status.md` after each task
4. Agent writes detailed log to `logs/agentN-log.md`
5. Manager reads status files to monitor progress
6. Manager broadcasts updates via `comms/broadcast.md`
7. Agents report issues via `comms/agentN-to-manager.md`
