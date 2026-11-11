---
name: connector-utilization
description: >
  Use when a repo artifact (completion report, decision log, release snapshot,
  skill, register) must be published to an external system. Loads the connector
  tools, maps the artifact to the right connector, executes, and records the
  action so the repo stays the source of truth.
group: meta
---

# Connector utilization (publish repo → connector)

**Use when:** sharing a repo artifact with an external system via a connected
app — Notion, Google Docs, Google Sheets, Google Drive, Google Slides, Gmail,
Supabase, Vercel.

## Why this exists

A connected app being available is not a request to publish. Use connector tools only when the user explicitly asks for that action, and confirm the target, audience/sharing scope, and permitted content before writing. Never send secrets or customer data merely because the connector is enabled.


The repository is the source of truth. A connector is a **mirror**, not a
second home: every artifact published to a connector is re-derived from the repo
and cites the command that produced it. Nothing is hand-typed into a connector
that the repo already measures. The reverse direction — a connector document
that must stay truthful to the repo — is `connector-driven-documentation`.

## Method

1. **Load the connector tools first.** Call `list_connector_tools` for the
   connector slug before using any of its tools. A load applies only to the
   current reply; re-load before each use.
2. **Identify the artifact and its owner.** What file is being published, and
   which repo document owns the fact it contains? Cite the repo path.
3. **Choose the connector.** Match the artifact to the connector that fits:

   | Repo artifact                                | Connector     | Action                                  |
   | -------------------------------------------- | ------------- | --------------------------------------- |
   | `docs/plan/COMPLETION_SUMMARY_2026_10_23.md` | Notion        | Create page with summary table          |
   | `docs/plan/RELEASE_SNAPSHOT.md`              | Notion        | Create page with measured statistics    |
   | `docs/plan/RC_HARDENING_ROLLBACK.md`         | Google Docs   | Create document with rollback scenarios |
   | `docs/discovery/decision-log.md`             | Google Sheets | Upload as spreadsheet                   |
   | `docs/plan/completion-register.json`         | Google Sheets | Import as data table                    |
   | `docs/agent/skills/*.md`                     | Google Drive  | Upload as folder                        |
   | `docs/discovery/OWNER_DECISION_PACKET*.md`   | Gmail         | Attach to owner email                   |

4. **Prepare the content.** Convert markdown to the target format (Notion
   blocks, Google Docs text, Sheets rows). Numbers come from the repo command
   output, not from memory.
5. **Execute.** Use the connector tool to create/update the external resource.
   One artifact per action; do not batch unrelated artifacts into one connector
   write.
6. **Record.** Log the connector action in `docs/discovery/decision-log.md` or
   `docs/plan/completion-register.json` — what was published, where, when, from
   which commit. The repo stays the index of what was mirrored.

## In this repo

- The connected apps for this session are listed in the system context; load
  `google_drive`, `notion`, `google_docs`, `google_sheets`, `google_slides`,
  `gmail`, `supabase`, `vercel` as needed.
- The source artifacts: `docs/plan/`, `docs/discovery/`, `docs/agent/skills/`.
- The record of publish actions: `docs/discovery/decision-log.md`,
  `docs/plan/completion-register.json`.

## Red flags

- Publishing a number the repo cannot reproduce (the connector has a number the
  script never printed).
- Hand-typing connector content instead of converting repo output.
- Publishing without recording the action — the repo loses track of what was
  mirrored.
- Using a connector tool without loading it first.
- Treating a connector copy as the source of truth.

**Proves itself with:** a recorded publish action (repo path, connector,
commit) for every external artifact, with the number traceable to a command.

**Source:** original to FinPlan Pro, consolidated from the former
`connector-utilization` and `connector-driven-documentation` skills.
