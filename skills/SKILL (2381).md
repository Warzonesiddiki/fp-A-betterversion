---
name: knowledgeforge-architecture
description: Query an ArchiMate knowledge graph built from enterprise documents — architecture, dependencies, impact, and document-grounded answers.
---

# KnowledgeForge — Architecture Knowledge

KnowledgeForge (KF) ingests enterprise documents (PDF/DOCX/PPTX) and source code repositories, extracts an ArchiMate 3.2 knowledge graph (Business / Application / Technology layers), and exposes it via 8 MCP tools. Use these tools whenever the user asks about **how systems are structured, how components depend on each other, what would break if something changes, or what the source documents actually say**.

## When to use

- **Architecture questions**: "What components make up the Order system?", "Show me the Business layer of the SAP migration."
- **Dependency analysis**: "Which services consume the CustomerProfile DataObject?", "What does BillingService depend on?"
- **Impact assessment**: "If I decommission AuthGateway, what breaks?", "Blast radius of removing the legacy mainframe interface."
- **Document grounding**: "Where in the source PDFs is this claim from?", "Show me the conformance score for doc X."
- **Architectural overview / hub discovery**: "Give me a brief", "Which entities are the choke points of this graph?"

Do **not** use these tools for general code questions, file reads, or shell tasks — they only know about the indexed graph.

## Tools

| Tool | One-liner |
|---|---|
| `get_brief` | High-level summary of the knowledge base: layers, doc count, top entities. |
| `query` | Natural-language search across the graph (semantic + keyword over entities, relations, source chunks). |
| `get_entity` | Fetch a specific entity by id or name with all attributes and source provenance. |
| `get_connections` | Return the neighbors of an entity (configurable depth and edge-type filter). |
| `god_nodes` | List the most highly-connected entities — architecture choke points / hubs. |
| `graph_stats` | Counts per entity type, edge type, and per-document distribution. |
| `check_conformance` | Validate a document's extracted graph against the ArchiMate ontology; returns score and violations. |
| `impact_analysis` | Downstream and upstream blast radius if a given entity changes or is removed. |

## Example trigger prompts

- "Give me a knowledge brief of what's indexed." → `get_brief`
- "Find all DataObjects accessed by the OrderProcessing business process." → `query` (then `get_connections` to expand)
- "Show me the entity 'BillingService' in detail." → `get_entity`
- "What are the direct neighbors of the CustomerProfile DataObject, depth 2?" → `get_connections`
- "Which 10 entities have the most connections in the graph?" → `god_nodes`
- "How many ApplicationComponents and Realization edges do we have?" → `graph_stats`
- "Did the SAP migration document conform to ArchiMate? Show violations." → `check_conformance`
- "What breaks downstream if I remove the AuthGateway component?" → `impact_analysis`

## Prerequisites

The MCP server is a thin client over the `kb-agent` REST backend. The `BACKEND_URL` environment variable must point at a reachable KF backend (Cloud Run URL or local). Set `KF_TENANT` for multi-tenant deployments.
