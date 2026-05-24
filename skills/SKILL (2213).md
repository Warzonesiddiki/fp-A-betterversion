---
name: technical-writing-standards
description: Technical writing style guides, prose linting, clarity patterns, and editorial standards for producing documentation that communicates precisely and reads well.
origin: MCP Market
---

# Technical Writing Standards

Write documentation that communicates clearly — consistent style, precise language, and a structure readers can follow.

## When to Activate

- Writing documentation or articles
- Editing technical content for clarity
- Establishing team writing standards
- Setting up prose linting (textlint, write-good)
- Creating style guides
- Reviewing documentation for readability

## Core Principles

### Clarity Over Cleverness

```
BAD: "The authentication middleware interposes upon all inbound
requests, subsequently delegating authorization decisions to
the ambient security context."

GOOD: "The auth middleware checks every request against the
security context to decide whether to allow or deny it."
```

### Active Voice

```markdown
# Active (preferred)
The function validates the input and returns an error code.

# Passive (avoid)
The input is validated by the function and an error code
is returned.

# Exception: Use passive when the actor is unknown or irrelevant
The configuration file is loaded from the default location.
```

### Parallel Structure

```markdown
# Parallel (preferred)
This SDK supports:
- Creating users
- Updating profiles
- Deleting accounts

# Not parallel
This SDK supports:
- Creating users
- Profile updates
- Accounts can be deleted

# Parallel for steps
1. Install the package
2. Configure the credentials
3. Run the setup script

# Not parallel
1. Install the package
2. Configuring credentials
3. Run the setup script
```

## Style Guide

### Voice and Tone

```yaml
voice:
  first_person: false
  # Write "The SDK does X" not "I think the SDK does X"

  person: second
  # Address readers as "you" when giving instructions
  # "Set your API key" not "The API key should be set"

  perspective: neutral
  # Not too formal (no corporate-speak)
  # Not too casual (no slang in technical docs)

tone_by_situation:
  tutorial:
    tone: encouraging
    example: "You'll build your first API in 10 minutes"

  reference:
    tone: neutral
    example: "GET /users returns a list of users"

  error_messages:
    tone: clear + actionable
    example: "Cannot connect: check that your API key is valid"

  release_notes:
    tone: factual
    example: "Added: New pagination parameter 'cursor'"
```

### Sentence Construction

```yaml
sentence_rules:
  max_length: 25
  # Target 25 words or fewer per sentence
  # Split long sentences at conjunctions (and, but, or)

  min_length: 3
  # Avoid one-word sentences in body text
  # Exception: UI elements, code labels

  no_sentence_start_repeats:
    banned: ["However", "Additionally", "Also", "Therefore"]
    rotate: true
    # Vary sentence openers across paragraphs
```

### Punctuation

```markdown
# Oxford comma (use it)
Fields: id, name, and email.

# Serial/ISO dates (use them)
2025-01-15  # Not January 15, 2025 or 15/01/2025

# Hyphens and dashes
- Un hyphenated prefixes: pre-release, non-blocking
- En dash: for ranges and relationships
  - "pages 10–20" (en dash)
  - "Node 10" to "Node 20" (en dash)
- Em dash: for asides — use sparingly

# Code and commands (backticks)
- Variable names: `user_id`, `api_key`
- Commands: `npm install`
- File paths: `src/auth/login.ts`
- Values: set `debug: true`
```

### Terminology

```yaml
terminology:
  preferred:
    - "sign in" (not "login" as a noun)
    - "sign out" (not "logout" as a noun)
    - "you can" (not "one can")
    - "run" (not "execute")
    - "build" (not "compile" unless literally compiling)
    - "install" (not "set up" for packages)
    - "choose" (not "select" for menus)
    - "click" (not "click on" for UI)

  capitalization:
    - "GitHub" (proper noun)
    - "JavaScript" (proper noun)
    - "Node.js" (with period)
    - "API" (all caps, never "Api")
    - "CLI" (all caps)
    - "URL" (all caps)
    - "HTTP" (all caps)

  spelling:
    - American English (not British)
    - "color" not "colour"
    - "behavior" not "behaviour"
    - "organization" not "organisation"
```

## Prose Linting

### textlint Configuration

```json
// .textlintrc.json
{
  "filters": {
    "allowlist": {
      "patterns": [
        { "index": "```" },
        { "index": "`" },
        { "index": "{{" }
      ]
    }
  },
  "rules": {
    "no-todo": true,
    "no-doubled-spaces": true,

    "write-good": {
      "preset": "weasel",
      "severity": "warning",
      "rules": {
        "weasel": true,
        "illusion": true,
        "illusion": { "allow": ["below", "above"] }
      }
    },

    "ja-technical-writing": {
      "max-string-length": 100
    },

    "terminology": {
      "terms": [
        ["JavaScript", "JavaScript"],
        ["Node.js", "Node.js"],
        ["GitHub", "GitHub"],
        ["JavaScript", "JavaScript"],
        ["PayPal", "PayPal"],
        ["GitHub", "GitHub"],
        ["npm", "npm"],
        ["JavaScript", "JavaScript"]
      ]
    }
  }
}
```

### Write-Good Rules

```markdown
# weasel words to avoid
"obviously"    → remove or prove it
"clearly"     → remove or prove it
"simply"      → often condescending
"just"        → often unnecessary
"easy"        → not everyone's experience
"quick"       → relative, often meaningless

# filler phrases to remove
"in order to"  → "to"
"due to the fact that" → "because"
"at this point in time" → "now"
"in the event that" → "if"
"for the purpose of" → "to"
"in spite of the fact that" → "although"

# illusions (words that seem precise but aren't)
"very unique"    → "unique" (unique is already absolute)
"very different" → give specifics
"somewhat better" → give specifics
```

## Structural Standards

### Document Structure

```markdown
# Document title (H1 — one per document)

## Section heading (H2)

### Subsection (H3)

#### Detail heading (H4 — use sparingly)

# Never skip heading levels
Good:  H1 → H2 → H3
Avoid: H1 → H3 → H5
```

### Paragraph Rules

```markdown
# One idea per paragraph
# If a paragraph exceeds 4 sentences, consider splitting

# Topic sentence first
# First sentence should state the paragraph's main point

# Transition between paragraphs
Use connecting phrases:
- "Building on this..." / "In contrast..."
- "For example..." / "Specifically..."
- "However..." / "In addition..."
```

### List Construction

```markdown
# Lists should have 3+ items
# Two items → reword as a sentence or a table

# Introductory phrase required
The SDK supports three operations:
1. Create users
2. Update settings
3. Delete accounts

# Consistent capitalization
- Start with capital (unless starting with code)
- Same grammatical form across items

# Parallelism
- If item 1 starts with a verb, all start with verbs
- If item 1 is a phrase, all are phrases
```

## Formatting Standards

### Code Formatting

```markdown
# Inline code
Use backticks for:
- Function names: `createUser()`
- Variable names: `userId`
- File paths: `/api/v1/users`
- Commands: `npm install`
- Values: set `timeout: 5000`

# Code blocks
Always specify the language:
```bash
```typescript
```python
```

# Code in sentences
When code appears mid-sentence, treat it as a word:
- "Use the `filter()` method" (no additional backticks)
- "Import `Client` from the SDK" (backtick the import)

# Commands in prose
Use the imperative mood:
"Run `npm install` to install dependencies"
Not: "npm install can be run"
```

### Table Formatting

```markdown
# Tables for comparisons, lists, structured data
# Always include a header row

| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| Value 1  | Value 2  | Value 3  |
| Value 4  | Value 5  | Value 6  |

# Alignment
- Left-align text columns
- Right-align numeric columns
- Center-align enum/constant columns

# Table caption (optional)
Table: Configuration options
```

### Link Formatting

```markdown
# Descriptive link text
[Create a payment](https://docs.example.com/payments/create)
Not: [click here](...) or [here](...)

# Links in reference documentation
For endpoint documentation, use the URL as the link text:
[GET /users](https://docs.example.com/users/list)

# Links to headings within the same doc
[Authentication](#authentication)
[Errors](#error-reference)
```

## Review Checklist

```yaml
review_checklist:
  content:
    - [ ] Every section has a purpose
    - [ ] Technical claims are accurate
    - [ ] Code examples are runnable
    - [ ] No outdated information
    - [ ] All links are valid

  style:
    - [ ] Active voice predominates
    - [ ] Sentences are under 25 words
    - [ ] No weasel words
    - [ ] Consistent terminology
    - [ ] Parallel structure in lists

  structure:
    - [ ] H1 → H2 → H3 hierarchy
    - [ ] Logical flow between sections
    - [ ] Adequate transition between paragraphs
    - [ ] Tables have headers

  format:
    - [ ] Code blocks have language specified
    - [ ] Inline code uses backticks
    - [ ] Links are descriptive
    - [ ] Dates in ISO format
    - [ ] Oxford comma in lists

  accessibility:
    - [ ] Meaningful alt text for images
    - [ ] Sufficient color contrast
    - [ ] Headings aid navigation
```

## Best Practices

| Practice | Rationale |
|----------|-----------|
| Active voice | Clearer, more direct |
| Short sentences | Reduces cognitive load |
| Consistent terminology | Reduces confusion |
| Descriptive links | Screen reader users benefit |
| Code examples that run | Confidence, not just understanding |
| Parallel lists | Scannable, professional |
| Proofread before shipping | Errors erode credibility |
| Lint prose | Catches what eyes miss |

## Common Pitfalls

```
Pitfall: "Writing for yourself, not readers"
Fix: Review from the reader's perspective; ask a new person to test it

Pitfall: "Over-formal language"
Fix: Write like you're explaining to a colleague, not writing a legal contract

Pitfall: "No enforcement of style"
Fix: Prose linting catches drift; make it part of CI

Pitfall: "Inconsistent terminology"
Fix: Build a terminology glossary; use it in reviews

Pitfall: "Wall of text"
Fix: Break up with headings, lists, code blocks, diagrams

Pitfall: "Assuming too much knowledge"
Fix: When in doubt, explain it; reviewers can tell you if it's too basic

Pitfall: "Out-of-date examples"
Fix: CI tests code examples; mark versions clearly
```

## Related Skills

- `documentation-standards` — broader documentation patterns
- `documentation-as-code` — treating docs like code with linting
- `tutorial-and-howto-writing` — tutorial-specific patterns
- `technical-writing-standards` — style guides and prose linting
- `code-linter-formatter` — linting setup for prose
