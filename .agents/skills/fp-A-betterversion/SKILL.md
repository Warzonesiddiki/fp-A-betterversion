```markdown
# fp-A-betterversion Development Patterns

> Auto-generated skill from repository analysis

## Overview

This skill covers the core development patterns, coding conventions, and operational workflows of the `fp-A-betterversion` TypeScript codebase. The repository is structured for agent orchestration, simulation tracking, and rigorous documentation and compliance reporting. It emphasizes batch data handling, structured documentation, and systematic archival processes.

## Coding Conventions

**File Naming:**
- Use `snake_case` for all file names.
  - Example: `agent_utils.ts`, `data_loader.test.ts`

**Import Style:**
- Use relative imports.
  - Example:
    ```typescript
    import { processAgentRun } from './agent_utils';
    ```

**Export Style:**
- Use named exports.
  - Example:
    ```typescript
    // agent_utils.ts
    export function processAgentRun(runData: AgentRun) { ... }
    ```

**Test Files:**
- Test files follow the pattern `*.test.*`
  - Example: `agent_utils.test.ts`

## Workflows

### Agent Run Batch Ingestion
**Trigger:** When you want to record or import a new batch of agent run outputs for a specific wave.  
**Command:** `/new-agent-batch`

1. Generate or collect agent run data for a new wave.
2. Add multiple JSON files under `agent_runs/waveXX/agent-YY.json`, where `XX` is the wave number and `YY` is the agent number.
   - Example:
     ```
     agent_runs/
       wave03/
         agent-01.json
         agent-02.json
         agent-03.json
     ```
3. Commit all new agent run files together.

### Caveman Persist Cycle Reporting
**Trigger:** When you want to record the results, summaries, or compliance status of a development cycle, turn, or technical milestone.  
**Command:** `/new-cycle-report`

1. Draft a new cycle/turn summary or compliance report as a markdown file.
2. Save the file under `docs/CAVEMAN_PERSIST/` with a filename pattern indicating cycle/turn and topic.
   - Example: `docs/CAVEMAN_PERSIST/CYCLE_03_SUMMARY.md`
3. Commit the new report(s), often in batches.

### Archive Docs Cleanup
**Trigger:** When you want to clean up or deprecate outdated docs, ADRs, or technical notes.  
**Command:** `/archive-docs-cleanup`

1. Identify outdated or superseded documentation in `docs/_archive/` or related folders.
2. Delete or move files as needed.
   - Example:
     ```
     docs/_archive/old_decision.md
     docs/_archive/muse-scratch/obsolete_note.md
     ```
3. Commit the changes, often as part of a larger audit or cleanup.

### Compliance and Audit Reporting
**Trigger:** When you want to document the results of a compliance check, audit, or technical verification.  
**Command:** `/new-compliance-report`

1. Write a new compliance/audit/verification report as a markdown file, referencing technical or compliance milestones.
2. Save the file under `docs/CAVEMAN_PERSIST/` with a descriptive name referencing the area/module and compliance event.
   - Example: `docs/CAVEMAN_PERSIST/MODULE_X_COMPLIANCE_2024.md`
3. Commit the new report(s), often in bulk.

## Testing Patterns

- Tests are written in TypeScript.
- Test files follow the `*.test.*` naming convention.
- The testing framework is not explicitly defined; check individual test files for framework usage.
- Example test file:
  ```typescript
  // agent_utils.test.ts
  import { processAgentRun } from './agent_utils';

  describe('processAgentRun', () => {
    it('should process agent run data correctly', () => {
      // test implementation
    });
  });
  ```

## Commands

| Command                | Purpose                                                              |
|------------------------|----------------------------------------------------------------------|
| /new-agent-batch       | Add a new batch of agent run result files for a given wave           |
| /new-cycle-report      | Create and archive a new cycle/turn summary or compliance report     |
| /archive-docs-cleanup  | Clean up or archive outdated documentation                           |
| /new-compliance-report | Add or update compliance, audit, or verification reports             |
```