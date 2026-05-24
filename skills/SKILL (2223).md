---
name: wikis-knowledge-management
description: Wiki platforms, taxonomy design, search strategies, and knowledge organization patterns for building accessible, navigable internal knowledge bases.
origin: MCP Market
---

# Wikis and Knowledge Management

Organize, navigate, and maintain organizational knowledge so teams can find what they need and contribute what they know.

## When to Activate

- Setting up a team wiki or knowledge base
- Improving discoverability of existing documentation
- Designing wiki taxonomy and navigation structure
- Migrating between wiki platforms
- Creating cross-linking and knowledge graphs
- Managing knowledge at scale with multiple contributors

## Wiki Platform Evaluation

### Platform Comparison

| Platform | Best For | Strengths | Weaknesses |
|----------|----------|-----------|------------|
| Notion | All-in-one workspace | Flexible, good UX | Performance at scale, offline |
| Confluence | Enterprise | Deep Jira integration | Slow, expensive, cluttered |
| GitBook | Developer docs | Git-native, API docs | Limited internal use |
| Wiki.js | Self-hosted | Modern UI, Markdown | Self-management |
| Obsidian | Personal/local knowledge | Graph view, links | Collaboration requires vault setup |
| Tettra | Internal wiki | HR workflows, integrations | Less flexible structure |

### Selection Criteria

```yaml
criteria:
  collaboration:
    required: true
    min_editors: 5

  platform:
    self_hosted: false
    preferred: cloud

  integrations:
    - slack
    - github
    - jira

  permissions:
    teams: true
    individual: true

  search:
    full_text: true
    filters: true
    api_access: true

  export:
    formats: [markdown, html]
    portability: true
```

## Taxonomy Design

### Hierarchical Structure

```
Knowledge Base/
├── Engineering/
│   ├── Architecture/
│   │   ├── System Overview/
│   │   ├── ADRs/
│   │   └── Data Models/
│   ├── Development/
│   │   ├── Coding Standards/
│   │   ├── Code Reviews/
│   │   └── Debugging Guides/
│   └── Operations/
│       ├── Deployment/
│       ├── Monitoring/
│       └── Incident Response/
├── Product/
│   ├── Roadmaps/
│   ├── Specifications/
│   └── User Research/
├── People Ops/
│   ├── Onboarding/
│   ├── Benefits/
│   └── Career Development/
└── Company/
    ├── Mission & Values/
    ├── Strategy/
    └── Processes/
```

### Flat + Tag Taxonomy (Notion-style)

```yaml
# Alternative: Flat structure with tags
pages:
  - slug: authentication-design
    tags: [architecture, security, api-design]
    team: engineering
    status: current

  - slug: api-error-handling
    tags: [api-design, best-practices]
    team: engineering
    status: current

  - slug: onboarding-checklist
    tags: [onboarding, people-ops]
    team: people-ops
    status: current

# Navigation via tag groups
tag_groups:
  - name: Domain
    tags: [engineering, product, design, operations]
  - name: Type
    tags: [tutorial, reference, guide, template]
  - name: Status
    tags: [draft, current, deprecated, archived]
```

### Linking and Relations

```markdown
## Key Patterns

### Bidirectional Links
When page A links to page B, page B should show a backlink.

Parent Page:
See [[Architecture Overview]] for system design.

Child Page (Architecture Overview):
Related: [[API Design]] | [[Database Schema]] | [[Authentication Design]]
Backlinks: ← [[Engineering Home]] | ← [[API Design]]

### Knowledge Graphs
Use tags to build implicit networks:

#authentication → 15 pages
#security → 23 pages
#api-design → 12 pages

Cross-section intersection:
#authentication ∩ #api-design → 4 pages
```

## Search Strategy

### Search Architecture

```yaml
search:
  primary:
    engine: platform_native
    config:
      index_body: true
      index_comments: true
      index_attachments: false

  enhancements:
    - type: semantic_search
      active: true
      model: openai/text-embedding-3-small
      threshold: 0.7

    - type: synonyms
      active: true
      custom_terms:
        infra: [infrastructure, ops, devops]
        FE: [frontend, front-end, ui]
        auth: [authentication, auth, login, session]

    - type: filters
      - team
      - status
      - last_updated
      - tags
```

### Searchable Templates

```markdown
---
title: Authentication Service Design
status: current
team: platform-engineering
tags: [architecture, security, api-design]
last_reviewed: 2025-01-15
owner: alice@example.com
---

# Authentication Service Design

## Problem Statement
<!-- What searchable problem statement -->
Users need secure, scalable authentication without managing passwords.

## Solution Overview
<!-- High-level searchable description -->
JWT-based authentication with refresh token rotation.
```

### Search Optimization Patterns

```python
# Search result ranking factors
ranking_factors:
  text_relevance:
    weight: 0.4
    fields:
      - title: 3.0    # 3x boost for title matches
      - headings: 2.0
      - body: 1.0
      - tags: 1.5

  freshness:
    weight: 0.2
    decay: half_life_90_days

  views:
    weight: 0.15
    normalize: log

  links:
    weight: 0.15
    count_backlinks: true

  team_relevance:
    weight: 0.1
    same_team_boost: 1.5
```

## Navigation and Discovery

### Navigation Patterns

```yaml
navigation:
  primary:
    type: sidebar
    items:
      - section: Engineering
        items:
          - page: Home
            icon: home
          - page: Architecture
            children: true
          - page: Development Guides
            children: true
          - page: Operations
            children: true

  secondary:
    type: breadcrumbs
    show: true

  contextual:
    type: table_of_contents
    depth: 3
    collapsible: true
```

### Cross-Linking Strategy

```markdown
## Cross-Link Types

### Reference Links (inline context)
Auth is handled by the [[Authentication Service]].
→ Use when referring to a specific page mid-sentence

### Related Pages (bottom of page)
**Related Pages**
- [[API Design Patterns]]
- [[Security Review Process]]
- [[Incident Response Runbook]]
→ Use when pages are thematically related but not required reading

### Learn Also (next steps)
**Continue Learning**
- [[OAuth 2.0 Deep Dive]] →
- [[SAML Integration Guide]] →
→ Use for tutorials and learning paths
```

## Knowledge Curation

### Review Cadence

```yaml
review_policy:
  fresh:
    status: current
    last_updated_within: 30 days
    action: none

  needs_review:
    status: current
    last_updated_within: [31, 90] days
    action: flag for author review

  stale:
    status: current
    last_updated_within: [91, 180] days
    action: notify owner, add warning banner

  archive:
    last_updated: 181+ days
    action: archive or update
```

### Content Lifecycle

```yaml
lifecycle:
  draft:
    visibility: author_only
    can_comment: true
    can_edit: [author, team_lead]

  review:
    visibility: team
    can_comment: true
    can_edit: [author, reviewers]
    required_approvals: 1

  published:
    visibility: company
    can_comment: true
    can_edit: [author, team_lead, admins]
    review_after: 60 days

  deprecated:
    visibility: company
    status_banner: "This page is deprecated"
    redirect_to: updated_page_url

  archived:
    visibility: company
    searchable: true
    editable: admins_only
```

## Collaboration Patterns

### Contribution Workflow

```
┌──────────────────────────────────────────┐
│  Author creates / updates page            │
│  ↓                                       │
│  Template validation (required fields)   │
│  ↓                                       │
│  Editor review (if major changes)        │
│  ↓                                       │
│  Publish with status=current             │
│  ↓                                       │
│  Schedule review reminder (60 days)       │
└──────────────────────────────────────────┘
```

### Templates

```markdown
---
title: <!-- Page Title -->
status: draft | current | deprecated | archived
team: <!-- engineering | product | design | ops -->
owner: <!-- email -->
tags: [<!-- tag1, tag2, tag3 -->]
last_reviewed: <!-- YYYY-MM-DD -->
---

# Page Title

## Summary
<!-- 2-3 sentence overview -->

## Background
<!-- Why does this exist? What problem does it solve? -->

## Content
<!-- Main content sections -->

## Related Pages
- [[Page Name]]

## Change History
| Date | Author | Change |
|------|--------|--------|
| YYYY-MM-DD | Name | Initial version |
```

## Governance

### Ownership Model

```yaml
ownership:
  tiers:
    - name: company_wide
      pages: ["Mission", "Code of Conduct", "Benefits"]
      owners: [leadership]
      edit_approval: leadership

    - name: department
      pages: ["Engineering Home", "Roadmap", "Hiring"]
      owners: [department_lead]
      edit_approval: department_lead

    - name: team
      pages: ["Architecture", "Runbooks", "Processes"]
      owners: [team_lead]
      edit_approval: team_lead

    - name: individual
      pages: [other]
      owners: [author]
      edit_approval: author
```

### Permissions Structure

```yaml
permissions:
  roles:
    admin:
      - manage_workspace
      - manage_users
      - delete_pages
      - edit_permissions

    editor:
      - create_pages
      - edit_own_pages
      - comment_all
      - archive_own_pages

    viewer:
      - read_all
      - comment
      - view_history

    guest:
      - read_public
      - comment (if enabled)
```

## Best Practices

| Practice | Rationale |
|----------|-----------|
| Single source of truth | One URL per topic; redirects for renames |
| Consistent templates | Faster creation, predictable structure |
| Rich metadata on every page | Enables filtering, search, reporting |
| Proactive cross-linking | Build the knowledge graph as you write |
| Review automation | Catch stale content before it becomes noise |
| Tag discipline | 3-5 tags per page; shared vocabulary |
| Breadcrumb navigation | Always show users where they are |
| Search with synonyms | Users search how they think, not how docs are written |

## Common Pitfalls

```
Pitfall: "Just throw everything in Confluence"
Fix: Define taxonomy upfront; apply templates; automate cleanup

Pitfall: "Linking everything breaks when pages move"
Fix: Use permanent redirects; maintain link updating scripts

Pitfall: "Wiki grows, nothing gets archived"
Fix: Set lifecycle policy; automate stale detection; archive aggressively

Pitfall: "Search returns hundreds of results"
Fix: Tune ranking; add filters; tag content for faceted search

Pitfall: "Individual pages aren't linked to anything"
Fix: Cross-link in reviews; show orphan pages in reporting

Pitfall: "No one knows what's authoritative"
Fix: Owner on every page; status badges; approval workflows
```

## Related Skills

- `documentation-as-code` — treating docs like code with version control
- `documentation-standards` — broader doc patterns and templates
- `onboarding-process-design` — onboarding wikis and checklists
- `technical-writing-standards` — prose style and clarity
- `search-first` — search strategy and implementation
