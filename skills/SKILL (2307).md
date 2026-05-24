---
name: documentation-standards
description: Documentation patterns including READMEs, API docs, inline comments, and knowledge base maintenance for maintainable software projects.
origin: engineering-excellence
version: 1.0.0
---

# Documentation Standards

A comprehensive approach to creating, maintaining, and organizing documentation that keeps teams aligned and projects accessible.

## When to Activate

- Writing README files for new projects
- Creating API documentation
- Adding inline code comments
- Setting up knowledge bases
- Onboarding documentation
- Troubleshooting guides
- Release notes and changelogs

## Documentation Types

### Type Matrix

| Type | Audience | When | Owner |
|------|----------|------|-------|
| README | Everyone | Project start | Author |
| API Docs | Developers | Before release | API owner |
| Architecture | Engineers | Design phase | Tech lead |
| Runbooks | Ops/Dev | Deployment | SRE |
| Tutorials | Beginners | Learning path | Educators |
| How-to | Practitioners | Task execution | Anyone |

### Decision Tree

```
Is it a quick reference?
├── YES → Cheatsheet / README snippet
└── NO
    │
    Is it step-by-step?
    ├── YES → Tutorial or How-to
    └── NO
        │
        Is it explaining concepts?
        ├── YES → Explanation / Guide
        └── NO → Reference
```

## README Structure

### Standard Template

```markdown
# Project Name

One-line description of what this does.

[![CI](badge)](#) |[![License](badge)]()

## Quick Start

```bash
npm install project-name
# 3 commands to running
```

## Features

- Feature 1
- Feature 2

## Installation

Prerequisites:
- Node 18+
- Docker (optional)

```bash
# Installation steps
```

## Usage

```js
// Basic example
import { feature } from 'project';

feature();
```

## Configuration

```yaml
# config example
key: value
```

## API Reference

[Link to full API docs](#)

## Contributing

[Link to CONTRIBUTING.md]()

## License

MIT
```

### README Checklist

- [ ] One-line description first
- [ ] Badges for CI, coverage, version
- [ ] Quick start in < 5 commands
- [ ] Screenshots/GIFs for UI projects
- [ ] Links to detailed docs
- [ ] Contributing guidelines
- [ ] License clearly stated

## API Documentation

### OpenAPI/Swagger Format

```yaml
openapi: 3.0.0
info:
  title: API Name
  version: 1.0.0

paths:
  /users:
    get:
      summary: List users
      parameters:
        - name: limit
          in: query
          schema:
            type: integer
            default: 10
      responses:
        '200':
          description: Success
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/User'
```

### Endpoint Documentation

```markdown
## GET /api/users

Returns a list of users.

### Query Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| limit | int | No | Max results (default: 10) |
| offset | int | No | Pagination offset |

### Response

```json
{
  "data": [...],
  "meta": {
    "total": 100,
    "limit": 10
  }
}
```

### Error Responses

| Code | When | Example |
|------|------|---------|
| 400 | Invalid input | `{"error": "limit must be positive"}` |
| 401 | Unauthenticated | `{"error": "Invalid API key"}` |
| 404 | Not found | `{"error": "User not found"}` |
| 500 | Server error | `{"error": "Internal error"}` |

## Inline Comments

### Comment Decision Tree

```
Does this need a comment?
│
├── Why is it done this way? (KEEP)
│   └── "Performance optimization because..."
│
├── What does this do? (MAYBE)
│   └── Can code express it clearly?
│
└── Explaining obvious code (REMOVE)
    └── "i = i + 1  # increment i"
```

### Comment Quality Guidelines

| Good Comments | Bad Comments |
|---------------|--------------|
| Explain WHY, not WHAT | Repeat the code |
| Point to external refs | Stated emotions |
| Warning about side effects | Outdated information |
| Complex algorithm explainer | Obvious observations |

### Comment Patterns

```python
# Why: Legacy API requires this format
# Issue: https://github.com/org/repo/issues/123
legacy_format(data)

# Performance: Pre-compute to avoid recalculation
# See: algorithm_design.md for analysis
cached_value = expensive_operation()

# TODO: Remove when migration complete
# Tracking: JIRA-456
deprecated_code()
```

## Architecture Documentation

### C4 Model Levels

```
┌─────────────────────────────────────┐
│ Context (System Landscape)          │
│ "Who is using the system?"          │
└─────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────┐
│ Container (Application)             │
│ "How does it work internally?"      │
└─────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────┐
│ Component (Code Structure)          │
│ "What are the main components?"     │
└─────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────┐
│ Code (Implementation Details)        │
│ "How does the code actually work?"  │
└─────────────────────────────────────┘
```

### Architecture Decision Records (ADR)

```markdown
# ADR 001: Use PostgreSQL for Primary Database

## Status
Accepted

## Context
We need a primary database for the application.
Requirements: ACID compliance, JSON support, good performance.

## Decision
We will use PostgreSQL 15.

## Consequences
Positive:
- ACID compliance
- Strong JSON support
- Wide ecosystem support

Negative:
- Requires schema migrations
- More ops overhead than SQLite
```

## Versioning & Changelog

### Keep a Changelog Format

```markdown
# Changelog

All notable changes are documented here.

## [2.0.0] - 2024-01-15

### Added
- New authentication system
- Rate limiting

### Changed
- API response format (breaking)
- Performance improvements

### Deprecated
- Old endpoint X (use Y instead)

### Removed
- Legacy API v1

### Fixed
- Memory leak in worker
```

### Semantic Versioning

| Change | Version Bump | Example |
|--------|-------------|---------|
| New features | Minor | 1.0 → 1.1 |
| Bug fixes | Patch | 1.0 → 1.0.1 |
| Breaking changes | Major | 1.0 → 2.0 |

## Documentation Tools

| Type | Tools |
|------|-------|
| Static sites | Docusaurus, MkDocs, Docsify |
| API docs | Swagger, Redoc, Slate |
| Diagrams | Mermaid, Excalidraw, Draw.io |
| Code comments | JSDoc, Sphinx, Javadoc |
| Wikis | Notion, Confluence, GitBook |

## Maintenance

### Documentation Review Cadence

| Review | Frequency | Scope |
|--------|-----------|-------|
| Quick check | PR time | Changed code |
| README update | Monthly | Project docs |
| Full audit | Quarterly | All docs |
| Archive cleanup | Bi-annually | Stale content |

### Stale Detection

```yaml
staleness_rules:
  - type: file_age
    days: 90
    action: flag_for_review
  - type: broken_links
    action: report
  - type: outdated_examples
    days: 60
    action: notify_owner
```

## Anti-Patterns

| Anti-Pattern | Problem | Solution |
|---------------|---------|----------|
| Documentation debt | Docs fall behind | Docs are code |
| Over-documentation | Noise | DRY with code |
| Perfect first version | Never ships | Good enough now |
| No ownership | Nobody updates | Assign owners |
| Hidden docs | Unused | Link everywhere |

---

*Documentation is a love letter to your future self.*