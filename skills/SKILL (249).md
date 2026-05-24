---
name: beautiful-mermaid
description: Create beautiful Mermaid diagrams — flowcharts, sequence, architecture, ER diagrams
user-invocable: true
---

# Beautiful Mermaid Diagrams

Apply when: creating diagrams, flowcharts, architecture visualizations, ER diagrams.

## Diagram Types
- `flowchart TD` — top-down flow
- `flowchart LR` — left-right flow
- `sequenceDiagram` — API call sequences
- `classDiagram` — class relationships
- `erDiagram` — database schema
- `graph TD` — simple graphs

## Styling
```mermaid
%%{init: {'theme': 'base', 'themeVariables': {'primaryColor': '#4f46e5'}}}%%
```

## Patterns
- Use subgraphs to group related nodes
- Consistent node shapes: `[rect]`, `(rounded)`, `{diamond}`, `((circle))`
- Direction: `TD` (top-down), `LR` (left-right)
- Link styles: `-->|label|`, `-.->|dashed|`, `==>|thick|`

## Rules
- Keep under 30 nodes per diagram
- Use descriptive labels on connections
- Group related items in subgraphs
- Choose direction based on flow (TD for processes, LR for sequences)
