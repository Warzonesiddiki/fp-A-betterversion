---
name: code-review-best-practices
description: Comprehensive code review patterns including review checklists, feedback frameworks, security considerations, and team collaboration workflows.
origin: engineering-excellence
version: 1.0.0
---

# Code Review Best Practices

A systematic approach to conducting effective code reviews that improve code quality, share knowledge, and maintain team standards.

## When to Activate

- Reviewing pull requests
- Setting up code review processes
- Training team members on review practices
- Handling review disagreements
- Automating review workflows
- Writing effective review comments

## Reviewer Guidelines

### The 3 C's of Feedback

```
Clarity:     Be specific about what's wrong
Correctness: Ensure suggestions are accurate
Constructive:Frame as improvements, not criticism
```

### Feedback Language

| Instead of... | Use... |
|---------------|--------|
| "This is wrong" | "This might cause X issue..." |
| "You should" | "Consider..." |
| "Why did you" | "What was the reasoning for..." |
| "This is bad" | "This could be simplified by..." |

### Comment Prefixes

```markdown
[nit]      Minor style, optional to address
[question] Seeking understanding, not necessarily change
[suggestion] Alternative approach to consider
[blocker] Must fix before merge
[security] Potential security concern
[performance] Performance implication
[refactor] Cleanup opportunity, not urgent
[praise] Good work, keep it!
```

## Review Checklist

### Correctness

- [ ] Does the code do what it's supposed to do?
- [ ] Are edge cases handled?
- [ ] Are there off-by-one errors?
- [ ] Is error handling appropriate?
- [ ] Are return values checked?
- [ ] Are exceptions caught appropriately?

### Security

- [ ] User input validated and sanitized?
- [ ] SQL injection prevention?
- [ ] XSS prevention?
- [ ] Authentication/authorization correct?
- [ ] Secrets not hardcoded?
- [ ] Data encrypted at rest/transit?
- [ ] Rate limiting in place?

### Performance

- [ ] N+1 queries avoided?
- [ ] Unnecessary iterations?
- [ ] Caching opportunities?
- [ ] Memory leaks possible?
- [ ] Large data handling?
- [ ] Index usage appropriate?

### Maintainability

- [ ] Code follows style guidelines?
- [ ] Functions are reasonably sized?
- [ ] Variables well-named?
- [ ] Comments add value?
- [ ] Duplication minimized?
- [ ] abstractions appropriate?

### Testing

- [ ] Tests cover new functionality?
- [ ] Edge cases tested?
- [ ] Tests are maintainable?
- [ ] Mocking appropriate?
- [ ] Test names descriptive?

### Documentation

- [ ] Public APIs documented?
- [ ] Complex logic explained?
- [ ] README updated if needed?
- [ ] API contracts clear?
- [ ] Migration notes included?

## Review Process

### PR Size Guidelines

| Size | Lines Changed | Review Time |
|------|---------------|-------------|
| XS | < 50 | 5-10 min |
| S | 50-200 | 15-30 min |
| M | 200-400 | 30-60 min |
| L | 400-1000 | 60-120 min |
| XL | > 1000 | Break into smaller PRs |

### Review Stages

```
1. READ Code
   └── Understand the changes

2. VERIFY Requirements
   └── Check PR description matches implementation

3. INSPECT Each Change
   └── Run code locally
   └── Execute new tests
   └── Check existing tests pass

4. COMMENT
   └── Use appropriate prefixes
   └── Group related comments
   └── Be specific and actionable

5. APPROVE/REQUEST CHANGES
   └── Clear decision with reasoning
```

### Thoroughness Tiers

| Tier | Scope | When to Use |
|------|-------|-------------|
| Quick | Logic + security | Hotfixes, minor changes |
| Standard | Full checklist | Most changes |
| Deep | + Architecture, patterns | New services, major refactors |

## Author Guidelines

### PR Description Template

```markdown
## Summary
Brief description of changes

## Type
- [ ] Feature
- [ ] Bug fix
- [ ] Refactor
- [ ] Documentation

## Motivation
Why is this change needed?

## Changes
- List of specific changes

## Testing
How was this tested?

## Screenshots (if UI)
Before/After images

## Checklist
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No console logs or debug code
```

### Self-Review Checklist

Before requesting review:
- [ ] Code runs without errors
- [ ] Tests pass locally
- [ ] No debug code or console.logs
- [ ] PR description complete
- [ ] Changes are focused (not mixed concerns)
- [ ] You've read diff once yourself

## Handling Disagreements

### Resolution Process

```
1. Acknowledge perspective
   └── "I understand why you suggest..."

2. State your reasoning
   └── "I chose X because Y..."

3. Seek common ground
   └── "Can we agree on Z?"

4. Escalate if needed
   └── Team lead / architecture discussion
```

### When to Escalate

- Security implications
- Architectural decisions
- Team-wide process changes
- Deadlock after 2 rounds

## Automated Checks

### Required Checks

```yaml
ci_pipeline:
  - lint: "Code style compliance"
  - test: "All tests passing"
  - build: "Successful compilation"
  - coverage: "Minimum coverage threshold"

security:
  - sast: "Static analysis scan"
  - dependency: "Vulnerability check"
  - secret: "No secrets committed"

quality:
  - complexity: "Cyclomatic < threshold"
  - duplication: "Duplication < threshold"
```

### What Automation Can't Catch

- Architecture fit
- Domain logic correctness
- Naming clarity
- Business requirement alignment
- Code review best practices (this!)

## Review Metrics

| Metric | Target | Why |
|--------|--------|-----|
| Time to first review | < 4 hours | Flow preservation |
| Review duration | < 30 min per session | Attention span |
| Comments per PR | 5-15 average | Balanced feedback |
| Approval time | < 24 hours | Delivery speed |
| Rework rate | < 20% | Review efficiency |

## Team Culture

### Building Good Review Culture

1. **Assume positive intent** - Authors want to do well
2. **Be kind** - Code is personal; be respectful
3. **Explain why** - "Do X" vs "Do X because Y"
4. **Praise good work** - Reinforce positives
5. **Be timely** - Respect author momentum
6. **Learn together** - Reviews are knowledge sharing

### Anti-Patterns to Avoid

| Pattern | Impact | Alternative |
|---------|--------|-------------|
| Bikeshedding | Delays, frustration | Focus on substance |
| Gotcha comments | Hostility | Constructive guidance |
| Nitpicking | Noise, ignores bigger issues | Prioritize impactful issues |
| Rubber stamping | Quality degrades | Review with purpose |
| Taking over | Handoff misses learning | Guide, don't replace |

---

*Review code as you'd want yours reviewed.*