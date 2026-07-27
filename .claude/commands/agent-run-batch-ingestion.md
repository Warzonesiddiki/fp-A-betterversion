---
name: agent-run-batch-ingestion
description: Workflow command scaffold for agent-run-batch-ingestion in fp-A-betterversion.
allowed_tools: ["Bash", "Read", "Write", "Grep", "Glob"]
---

# /agent-run-batch-ingestion

Use this workflow when working on **agent-run-batch-ingestion** in `fp-A-betterversion`.

## Goal

Adds a new batch of agent run result files for a given wave, incrementally numbered, supporting large-scale agent orchestration or simulation tracking.

## Common Files

- `agent_runs/wave*/agent-*.json`

## Suggested Sequence

1. Understand the current state and failure mode before editing.
2. Make the smallest coherent change that satisfies the workflow goal.
3. Run the most relevant verification for touched files.
4. Summarize what changed and what still needs review.

## Typical Commit Signals

- Generate or collect agent run data for a new wave.
- Add multiple JSON files under agent_runs/waveXX/agent-YY.json, where XX is the wave number and YY is the agent number.
- Commit all new agent run files together.

## Notes

- Treat this as a scaffold, not a hard-coded script.
- Update the command if the workflow evolves materially.