---
name: documentation-as-code
description: Treat documentation like code — version control, testing, linting, and CI pipelines to keep docs consistent, accurate, and shippable with every release.
origin: MCP Market
---

# Documentation as Code

Treat docs with the same rigor as source code: version control, automated testing, linting, and CI/CD integration.

## When to Activate

- Setting up a new documentation pipeline
- Adding docs to CI/CD pipelines
- Implementing documentation linting
- Writing docs that need to stay in sync with code
- Creating style guides enforced by automation
- Building docs-as-a-product culture

## Core Principles

### Docs Are Code

```
# Docs live next to code in the repository
docs/
├── src/               # Source markdown
├── tests/             # Doc tests
├── .doclintrc         # Lint config
└── .github/
    └── workflows/
        └── docs.yml   # CI pipeline
```

### Version Control for Docs

```
# Branch strategy mirrors code
main              → production docs
release/X.Y       → released version docs
feature/add-api  → docs for new feature

# Commit messages follow convention
docs: add authentication section to API guide
docs: fix broken links in quickstart
docs: update pricing for v2.0 launch
docs!: change response format (breaking)
```

### Automation Pipeline

```yaml
# .github/workflows/docs.yml
name: Documentation CI

on:
  pull_request:
    paths:
      - 'docs/**'
      - 'docs/**/**'

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Lint docs
        run: |
          npx markdownlint-cli2 "docs/**/*.md"
          npx textlint --rule no-todo "docs/**/*.md"

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Test doc links
        run: npx @secretlint/secretlint "docs/**/*.md"
      - name: Verify code samples
        run: npx doctoc --dryrun "docs/**/*.md"

  preview:
    needs: [lint, test]
    if: github.event_name == 'pull_request'
    steps:
      - uses: actions/checkout@v4
      - name: Deploy preview
        run: |
          npx docusaurus deploy --site-dir _build
        env:
          NETLIFY_SITE_NAME: docs-preview-${{ github.event.number }}
```

## Documentation Testing

### Link Testing

```python
# tests/test_links.py
import re
from pathlib import Path
from urllib.parse import urlparse

import pytest

DOCS_PATH = Path("docs")

def extract_markdown_links(text: str) -> list[tuple[str, str]]:
    """Extract links from markdown text."""
    # [text](url) and [text](./relative) and [text](/absolute)
    pattern = r'\[([^\]]+)\]\(([^)]+)\)'
    return re.findall(pattern, text)

def extract_anchor_links(text: str) -> list[str]:
    """Extract #anchor references."""
    pattern = r'\[([^\]]+)\]\([^)#]+#([^)]+)\)'
    return re.findall(pattern, text)

def test_no_broken_internal_links():
    """All internal links resolve to existing files."""
    for md_file in DOCS_PATH.rglob("*.md"):
        content = md_file.read_text(encoding="utf-8")
        links = extract_markdown_links(content)

        for link_text, link_url in links:
            parsed = urlparse(link_url)

            # Skip external links
            if parsed.scheme in ("http", "https", "mailto"):
                continue

            # Check relative links
            if link_url.startswith("./") or link_url.startswith("../"):
                target = md_file.parent / link_url
                if not target.exists():
                    pytest.fail(f"Broken link in {md_file}: {link_text} -> {link_url}")

def test_no_broken_anchors():
    """All #anchor references resolve to existing headings."""
    all_headings: dict[str, set[str]] = {}

    # Collect all headings first
    for md_file in DOCS_PATH.rglob("*.md"):
        headings = set()
        for line in md_file.read_text(encoding="utf-8").splitlines():
            m = re.match(r'^#{1,6}\s+(.+)$', line)
            if m:
                anchor = m.group(1).lower().strip()
                anchor = re.sub(r'[^a-z0-9\s-]', '', anchor)
                anchor = re.sub(r'\s+', '-', anchor)
                headings.add(anchor)
        all_headings[str(md_file)] = headings

    # Check anchor references
    for md_file in DOCS_PATH.rglob("*.md"):
        content = md_file.read_text(encoding="utf-8")
        anchors = extract_anchor_links(content)

        for link_text, anchor in anchors:
            parent_file = str(md_file.parent / md_file.stem)
            if parent_file not in all_headings:
                parent_file = str(md_file)
            if anchor not in all_headings.get(parent_file, set()):
                pytest.fail(f"Broken anchor in {md_file}: {link_text} -> #{anchor}")
```

### Code Sample Testing

```python
# tests/test_code_samples.py
import subprocess
import tempfile
import os
from pathlib import Path

DOCS_PATH = Path("docs")

def extract_code_blocks(markdown: str) -> list[dict]:
    """Extract fenced code blocks with language."""
    import re
    pattern = r'```(\w+)\n(.*?)```'
    blocks = []
    for match in re.finditer(pattern, markdown, re.DOTALL):
        lang, code = match.groups()
        start = match.start()
        line_num = markdown[:start].count('\n') + 1
        blocks.append({
            "language": lang,
            "code": code.strip(),
            "line": line_num
        })
    return blocks

def test_shell_samples_are_valid():
    """Shell code blocks execute without error."""
    for md_file in DOCS_PATH.rglob("*.md"):
        content = md_file.read_text(encoding="utf-8")
        blocks = extract_code_blocks(content)

        for block in blocks:
            if block["language"] == "bash" or block["language"] == "sh":
                with tempfile.NamedTemporaryFile(
                    mode='w', suffix='.sh', delete=False
                ) as f:
                    f.write(block["code"])
                    f.flush()
                    try:
                        result = subprocess.run(
                            ["bash", f.name],
                            capture_output=True,
                            text=True,
                            timeout=10
                        )
                        if result.returncode != 0:
                            pytest.fail(
                                f"Shell sample failed in {md_file}:{block['line']}\n"
                                f"Output: {result.stderr}"
                            )
                    finally:
                        os.unlink(f.name)

def test_json_samples_are_valid():
    """JSON code blocks parse without error."""
    import json
    for md_file in DOCS_PATH.rglob("*.md"):
        content = md_file.read_text(encoding="utf-8")
        blocks = extract_code_blocks(content)

        for block in blocks:
            if block["language"] == "json":
                try:
                    json.loads(block["code"])
                except json.JSONDecodeError as e:
                    pytest.fail(
                        f"Invalid JSON in {md_file}:{block['line']}\n{e}"
                    )
```

## Documentation Linting

### Lint Rules

```json
// .doclintrc.json
{
  "rules": {
    "no-dead-links": {
      "ignore": ["https://example.com/external"],
      "check_external": true
    },
    "no-long-lines": {
      "max_length": 120
    },
    "no-todo": {
      "severity": "error"
    },
    "first-heading-h1": false,
    "no-debug": {
      "severity": "error"
    },
    "file-names": {
      "pattern": "^[a-z0-9-]+$"
    },
    "language": {
      "locale": "en-US",
      "spellchecker": true
    }
  }
}
```

### Textlint Configuration

```json
// .textlintrc.json
{
  "filters": {
    "allowlist": {
      "urls": ["https://wikipedia.org/"]
    }
  },
  "rules": {
    "no-todo": true,
    "write-good": {
      "preset": "weasel"
    },
    "terminology": {
      "terms": [
        ["JavaScript", "JavaScript"],
        ["Node.js", "Node.js"],
        ["GitHub", "GitHub"]
      ]
    }
  }
}
```

### Markdownlint Rules

```yaml
# .markdownlint.yaml
default: true

# No inline HTML
no-inline-html:
  allowed_elements:
    - details
    - summary

# Line length
line-length:
  max_length: 120
  line_format: ""

# ATX-style headings
heading-style:
  style: "atx"

# Code fence style
code-block-style:
  style: "fenced"

# Link style
link-style:
  style: "inlined"

# No bare URLs
no-bare-urls: true

# Fenced code language
fenced-code-language:
  style: "^\\[(\\w+)\\]$"
```

## CI/CD Integration

### Branch Protection Rules

```yaml
# .github/branch-protection.yml
rules:
  - name: docs-ci
    required_status_checks:
      jobs:
        - lint
        - test
    restrictions: null
    enforce_admins: true
    required_pull_request_reviews:
      required: 2
      dismiss_stale_reviews: true
```

### Preview Environments

```yaml
# .github/workflows/docs-preview.yml
name: Docs Preview

on:
  pull_request:
    paths:
      - 'docs/**'

jobs:
  deploy-preview:
    runs-on: ubuntu-latest
    environment:
      name: preview
      url: ${{ steps.preview.outputs.url }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - name: Install dependencies
        run: npm ci
      - name: Build docs
        run: npm run docs:build
      - name: Deploy to preview
        run: npx netlify deploy --prod=false --dir=_build
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_DOCS_SITE_ID }}
      - id: preview
        run: echo "url=https://$(cat .netlify/state.json | jq -r '.site_id').netlify.app" >> $GITHUB_OUTPUT
```

### Scheduled Audits

```yaml
# .github/workflows/docs-audit.yml
name: Docs Audit

on:
  schedule:
    - cron: '0 0 1 * *'  # Monthly
  workflow_dispatch:

jobs:
  stale-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Check for stale docs
        run: |
          npx stale-docs finder docs/ \
            --older-than-days 90 \
            --report-format json \
            --output stale-report.json
      - name: Create issue for stale docs
        if: github.event_name == 'schedule'
        uses: actions/github-script@v7
        with:
          script: |
            const report = JSON.parse(fs.readFileSync('stale-report.json'));
            if (report.files.length > 0) {
              github.rest.issues.create({
                title: 'Stale Documentation Report',
                body: `The following docs haven't been updated in 90+ days:\n\n${report.files.map(f => `- ${f}`).join('\n')}`
              });
            }
```

## Versioning Docs with Releases

### Automated Changelog Generation

```yaml
# .github/workflows/release-docs.yml
name: Release Documentation

on:
  release:
    types: [published]

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          ref: ${{ github.ref_name }}
      - name: Extract changelog for version
        run: |
          VERSION=${{ github.ref_name }}
          python scripts/extract_changelog.py \
            --version "$VERSION" \
            --output changelog-$VERSION.md
      - name: Update GitHub Release
        run: |
          gh release edit ${{ github.ref_name }} \
            --notes-file changelog-$VERSION.md
      - name: Deploy to production docs
        run: |
          npx docusaurus deploy \
            --site-dir _build \
            --message "Deploy docs for ${{ github.ref_name }}"
```

## Best Practices

| Practice | Rationale |
|----------|-----------|
| Docs next to code | Easier discovery, same review process |
| Automate everything | Human review catches logic errors, not typos |
| Treat breaking changes seriously | Version docs alongside code |
| Previews on every PR | reviewers can see output, not just source |
| Shared lint rules | Team-wide consistency |
| Stale detection | Prevent knowledge rot |
| Version tags | Historical reference when debugging old releases |

## Common Pitfalls

```
Pitfall: "Docs are done when code is done"
Fix: Add doc review to definition of done; automated tests catch drift

Pitfall: "Markdown is simple enough not to lint"
Fix: Broken links and dead references erode trust; lint catches these

Pitfall: "Docs don't need version control"
Fix: Without git history, you can't track when something changed or why

Pitfall: "One big README is enough"
Fix: Large docs need structure; modular docs scale better

Pitfall: "Docs are done when shipped"
Fix: Unmaintained docs become liabilities; automate audits
```

## Related Skills

- `documentation-standards` — broader doc patterns and templates
- `changelog-management` — Keep a Changelog format and semver
- `technical-writing-standards` — prose style and clarity
- `code-linter-formatter` — applies to doc linting setup
- `ci-cd-pipeline-design` — CI pipeline patterns for doc automation
