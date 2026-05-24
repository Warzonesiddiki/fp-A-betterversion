---
name: changelog-management
description: Changelog management using Keep a Changelog format, Semantic Versioning (semver), and release announcement patterns that keep users informed and aligned.
origin: MCP Market
---

# Changelog Management

Keep users and developers informed about changes through consistent, accurate changelogs using the Keep a Changelog format and Semantic Versioning.

## When to Activate

- Releasing a new version
- Writing or updating a changelog entry
- Choosing a version number
- Communicating breaking changes
- Auditing changelog completeness
- Migrating between versioning schemes

## Keep a Changelog Format

### Standard Format

```markdown
# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [2.3.0] - 2025-01-15

### Added
- New `payments.list()` method for listing all payments
- Webhook signature verification with `webhook.verify()` helper
- Support for EUR and GBP currencies
- `Customer` object now includes `metadata` field

### Changed
- `Order` response now includes `fulfillment_status` field
- Improved error messages for validation failures
- Default pagination changed from offset to cursor-based

### Deprecated
- `payments.all()` method — use `payments.list()` instead
- `amount_cents` field — use `amount` in smallest currency unit

### Removed
- Legacy `v1` API endpoints (use `v2`)
- `Order.status_text` field — use `Order.status`

### Fixed
- Race condition in concurrent payment processing
- Memory leak in webhook handler
- Incorrect timestamp in `created_at` field for refunds

### Security
- Upgraded TLS to 1.3 for all API endpoints
- Patched CVE-2024-XXXXX in dependency
```

### Section Definitions

```yaml
sections:
  Added:
    description: "New features for end users"
    examples:
      - New API endpoint
      - New configuration option
      - New supported format

  Changed:
    description: "Changes to existing functionality"
    examples:
      - Behavior changes (even if not breaking)
      - Performance improvements
      - Updated dependencies

  Deprecated:
    description: "Features still present but marked for removal"
    examples:
      - Old method still works but warns
      - Field still returned but will be removed

  Removed:
    description: "Features removed in this release"
    examples:
      - Deleted endpoints
      - Removed fields from responses
      - Dropped support for old formats

  Fixed:
    description: "Bug fixes for users"
    examples:
      - Bug fixes
      - Corrected incorrect behavior
      - Security patches

  Security:
    description: "Security-related changes"
    examples:
      - Dependency updates
      - Security hardening
      - Vulnerability patches
```

## Semantic Versioning

### Version Format

```
MAJOR.MINOR.PATCH[-prerelease][+build]

  │      │     │      │          │
  │      │     │      │          └── Build metadata (ignored in comparison)
  │      │     │      └────────────── Pre-release identifier
  │      │     └───────────────────── Bug fixes
  │      └──────────────────────────── New features (backward compatible)
  └─────────────────────────────────── Breaking changes
```

### Version Bump Rules

```yaml
version_bump:
  major:
    description: "Breaking changes"
    trigger_examples:
      - Removing an endpoint
      - Changing field types
      - Removing required parameters
      - Changing authentication method
      - Renaming fields
      - Changing response structure
      - Removing a feature

  minor:
    description: "New features (backward compatible)"
    trigger_examples:
      - Adding new endpoints
      - Adding new optional parameters
      - Adding new fields to responses
      - New optional configuration options
      - Improving performance without breaking changes

  patch:
    description: "Bug fixes (backward compatible)"
    trigger_examples:
      - Fixing incorrect behavior
      - Fixing error messages
      - Security patches
      - Dependency updates that don't break APIs

  prerelease:
    description: "Pre-release versions"
    format: "MAJOR.MINOR.PATCH-alpha.N"
    examples:
      - 2.0.0-alpha.1
      - 2.0.0-beta.2
      - 2.0.0-rc.3
```

### Breaking Change Examples

```markdown
## Breaking Changes

### MAJOR: 2.0.0

**Removed `User.name` field**
→ Use `User.first_name` and `User.last_name` instead

**Changed authentication from API key to OAuth 2.0**
→ All requests now require a Bearer token
→ API keys will stop working after 2025-06-01

**Changed `GET /users` response structure**
Before:
```json
{ "users": [...], "count": 100 }
```
After:
```json
{ "data": [...], "meta": { "total": 100 } }
```

**Renamed `page` parameter to `cursor`**
→ `GET /users?page=2` no longer works
→ Use `GET /users?cursor=abc123`
```

### Not Breaking Changes

```markdown
## Non-Breaking Changes (MINOR)

Adding new optional parameters — not breaking:
```bash
# Old: worked
GET /api/v1/users

# New: also works
GET /api/v1/users?include=orders,preferences
```

Adding new fields to responses — not breaking:
```json
// Old response: still valid
{ "id": "1", "name": "Alice" }

// New response: adds field but old clients still work
{ "id": "1", "name": "Alice", "email": "alice@example.com" }
```

Adding new endpoints — not breaking:
```bash
# Old endpoints all still work
GET /api/v1/users
POST /api/v1/users

# New endpoint added
DELETE /api/v1/users/:id
```
```

## Changelog Automation

### Commit Message Convention

```yaml
conventional_commits:
  types:
    - feat:       # New feature (triggers minor)
    - fix:        # Bug fix (triggers patch)
    - docs:       # Documentation only
    - style:      # Formatting, no code change
    - refactor:   # Restructuring, no feature/fix
    - perf:       # Performance improvement
    - test:       # Adding tests
    - chore:      # Maintenance tasks
    - deprecate:  # Marking as deprecated
    - remove:     # Removing features (triggers major)
    - breaking:   # Breaking change (triggers major)

  format: "<type>(<scope>): <description>"
  examples:
    - "feat(payments): add list method for payments"
    - "fix(auth): resolve token refresh race condition"
    - "docs(api): add webhook documentation"
    - "breaking(api): change response envelope format"
```

### Release Script

```python
#!/usr/bin/env python3
"""release.py — Generate changelog from commit history."""

import subprocess
import re
from dataclasses import dataclass
from pathlib import Path


@dataclass
class Commit:
    type: str
    scope: str
    message: str
    hash: str


def parse_conventional_commit(line: str) -> Commit | None:
    """Parse a conventional commit line."""
    pattern = r'^(\w+)(?:\(([^)]+)\))?:\s+(.+)$'
    match = re.match(pattern, line)
    if not match:
        return None
    return Commit(
        type=match.group(1),
        scope=match.group(2) or '',
        message=match.group(3),
        hash='',
    )


def categorize_commits(commits: list[Commit]) -> dict[str, list[Commit]]:
    """Categorize commits into changelog sections."""
    categories = {
        'Added': [],
        'Changed': [],
        'Deprecated': [],
        'Removed': [],
        'Fixed': [],
        'Security': [],
    }

    for commit in commits:
        if commit.type in ('feat', 'feat!'):
            categories['Added'].append(commit)
        elif commit.type in ('fix', 'hotfix'):
            categories['Fixed'].append(commit)
        elif commit.type == 'deprecate':
            categories['Deprecated'].append(commit)
        elif commit.type in ('remove', 'breaking'):
            categories['Removed'].append(commit)
        elif commit.type in ('perf', 'refactor', 'build'):
            categories['Changed'].append(commit)
        elif commit.type == 'security':
            categories['Security'].append(commit)

    return {k: v for k, v in categories.items() if v}


def generate_changelog_entry(version: str, date: str, commits: list[Commit]) -> str:
    """Generate a changelog entry."""
    categorized = categorize_commits(commits)
    if not categorized:
        return ''

    lines = [f'## [{version}] - {date}', '']

    for section, section_commits in categorized.items():
        lines.append(f'### {section}')
        for commit in section_commits:
            scope = f'({commit.scope}) ' if commit.scope else ''
            lines.append(f'- {scope}{commit.message}')
        lines.append('')

    return '\n'.join(lines)


def get_commits_since(tag: str) -> list[Commit]:
    """Get commits since a given tag."""
    cmd = ['git', 'log', f'{tag}..HEAD', '--format=%s', '--no-merges']
    result = subprocess.run(cmd, capture_output=True, text=True)

    commits = []
    for line in result.stdout.strip().split('\n'):
        if parsed := parse_conventional_commit(line):
            commits.append(parsed)

    return commits


def determine_version(current_version: str, commits: list[Commit]) -> str:
    """Determine next version based on commit types."""
    major_bump = any(c.type in ('breaking', 'breaking!') for c in commits)
    minor_bump = any(c.type == 'feat' for c in commits)

    if major_bump:
        return bump_major(current_version)
    if minor_bump:
        return bump_minor(current_version)
    return bump_patch(current_version)


def bump_major(version: str) -> str:
    parts = version.split('.')
    return f'{int(parts[0]) + 1}.0.0'


def bump_minor(version: str) -> str:
    parts = version.split('.')
    return f'{parts[0]}.{int(parts[1]) + 1}.0'


def bump_patch(version: str) -> str:
    parts = version.split('.')
    return f'{parts[0]}.{parts[1]}.{int(parts[2]) + 1}'


if __name__ == '__main__':
    import sys
    from datetime import date

    changelog_path = Path('CHANGELOG.md')
    current_tag = sys.argv[1] if len(sys.argv) > 1 else 'v0.0.0'

    commits = get_commits_since(current_tag)
    current_version = current_tag.lstrip('v')
    new_version = determine_version(current_version, commits)

    entry = generate_changelog_entry(
        f'v{new_version}',
        date.today().isoformat(),
        commits,
    )

    print(entry)
```

## Release Announcement Template

```markdown
# Release Announcement Template

## Version [X.Y.Z] — [Release Name]

**Released:** [Date]
**Type:** [Major / Minor / Patch]
**Download:** [Links]

### Highlights

[2-3 sentence overview of the most important changes]

### Breaking Changes

> ⚠️ If major: List all breaking changes with migration steps

### What's New

#### Added
- Feature 1: Brief description
- Feature 2: Brief description

#### Changed
- Improvement 1: Brief description

#### Fixed
- Bug fix 1: Brief description

### Migration Guide

**From v[A.B.C] to v[X.Y.Z]**

1. Step one
2. Step two
3. Step three

```bash
# Migration command if applicable
npm install package@X.Y.Z
```

### Deprecations

| Item |替代 |Removal Version |
|------|-----|----------------|
| Old method | New method | v3.0.0 |

### Full Changelog

[Link to CHANGELOG.md]

### Contributors

[@user1](https://github.com/user1), [@user2](https://github.com/user2)

---

Questions? Check the [documentation](link) or [contact support](link).
```

## Best Practices

| Practice | Rationale |
|----------|-----------|
| Keep a Changelog format | Consistent, scannable, machine-readable |
| One entry per change | Enables filtering and searching |
| Meaningful descriptions | "Fixed a bug" is not a changelog entry |
| Breaking changes highlighted | Developers panic if they miss these |
| Link to migration docs | Reduces support burden |
| Automate generation | Humans forget; scripts don't |
| Version before release | Never release without a version number |
| Semantic Versioning | Contract with downstream consumers |

## Common Pitfalls

```
Pitfall: "Changelog is an afterthought"
Fix: Make changelog a release criterion; no entry, no release

Pitfall: "All changes go in 'Changed'"
Fix: Categorize correctly; readers scan for Added/Fixed/Removed

Pitfall: "Breaking changes buried"
Fix: Prominent header; separate migration guide; explicit warning

Pitfall: "Version bumps are arbitrary"
Fix: Use semver rules; automate with conventional commits

Pitfall: "No automation"
Fix: Commit-based generation; changelog is code

Pitfall: "Duplicating Git history"
Fix: Changelog is curated; Git log is raw; keep them separate

Pitfall: "No deprecation timeline"
Fix: Communicate when deprecated items will be removed
```

## Related Skills

- `documentation-standards` — broader documentation patterns
- `documentation-as-code` — treating changelogs like code
- `code-linter-formatter` — linting changelogs for consistency
- `api-design` — API versioning and compatibility
- `changelog-management` — keep a changelog and semver format
