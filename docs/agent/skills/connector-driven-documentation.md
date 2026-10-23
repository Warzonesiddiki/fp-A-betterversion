---
name: connector-driven-documentation
description: Use when documentation needs to be shared across connectors. Maps repo artifacts to Notion, Google Docs, Google Sheets, and Gmail for owner communication.
group: meta
---

# Connector-Driven Documentation

**Use it when:** sharing completion reports, decision logs, or release snapshots with external systems via available connectors.

## Available Connectors

- **Notion** — create pages, update databases, append blocks
- **Google Docs** — create documents, insert text, format tables
- **Google Drive** — upload files, manage folders
- **Google Sheets** — create spreadsheets, update cells
- **Google Slides** — create presentations
- **Gmail** — send emails with attachments
- **Supabase** — database operations, edge functions
- **Vercel** — deployments, environment variables

## Mapping

| Repo Artifact | Connector | Action |
|---------------|-----------|--------|
| `docs/plan/COMPLETION_SUMMARY_2026_10_23.md` | Notion | Create page with summary table |
| `docs/discovery/OWNER_DECISION_PACKET_COMPLETION.md` | Gmail | Attach to owner email |
| `docs/plan/RELEASE_SNAPSHOT.md` | Notion | Create page with measured statistics |
| `docs/plan/RC_HARDENING_ROLLBACK.md` | Google Docs | Create document with rollback scenarios |
| `docs/agent/skills/*.md` | Google Drive | Upload as folder |
| `docs/plan/completion-register.json` | Google Sheets | Import as data table |

## Method

1. **Identify the artifact:** What file needs to be shared?
2. **Choose the connector:** Match the artifact type to the appropriate connector.
3. **Prepare the content:** Convert markdown to the target format (e.g., Notion blocks, Google Docs text).
4. **Execute:** Use the connector tool to create/update the external resource.
5. **Record:** Log the connector action in the decision log or completion register.

## What this prevents

- Duplicating information across systems without tracking
- Losing context when moving artifacts between repos and external systems
- Missing owner decisions because they were not shared

## Related

- `docs-and-decisions` — how documentation is maintained
- `release-engineering` — release preparation
- `owner-pack-completion` — owner decision tracking
