---
name: zero-compromise-audit
description: Use when auditing the project for zero-compromise compliance. Checks every gate, every claim, every number against evidence.
group: meta
---

# Zero-Compromise Audit

**Use it when:** verifying that the project meets zero-compromise standards before any release or completion claim.

## Audit Checklist

### Code Quality
- [ ] `tsc --noEmit` PASS (exit 0)
- [ ] `eslint src --max-warnings 0` PASS (exit 0)
- [ ] `prettier --check` PASS

### Financial Integrity
- [ ] `money:ast` PASS (0 unsafe operations, 100% safe)
- [ ] `money:adoption` ratchet holds (baseline recorded)
- [ ] `missing-is-not-zero` PASS (0 default-zero money reads on SUPPORTED surfaces)
- [ ] `fabrication` PASS (0 financial literals in UI)

### Documentation
- [ ] `docs:verify` PASS (all ratchet values match gates)
- [ ] `docs:links --strict` PASS (0 broken links)
- [ ] `verify-readme-stats` PASS (all measured claims match)
- [ ] `skills:verify` PASS (all skills indexed, frontmatter valid)

### Evidence
- [ ] `spine:evidence` PASS (every cited test exists and carries the cited title)
- [ ] `governance:evidence` PASS (every cited test exists and carries the cited title)
- [ ] `completion:register` PASS (691 rows, statuses valid)
- [ ] `routemap:check` PASS (route dispositions decided)
- [ ] `one-stop:acceptance` PASS (SUPPORTED routes completable in-app)

### AI Safety
- [ ] `ai-census` PASS (0 ungated surfaces)

### Accessibility
- [ ] `a11y-q5` PASS (WCAG 2.1 AA, all tests pass)

### Determinism
- [ ] `determinism` ratchet holds (344 sites baseline)

### Bundle
- [ ] `bundle-check` PASS (under limit or warning acknowledged)

## What this prevents

- Claiming "complete" without running gates
- Fabricating evidence
- Weakening gates to pass
- Deleting breadth to make numbers look better

## Related

- `zero-compromise-verification` — the overarching discipline
- `gates-and-ratchets` — how gates work
- `verification-before-completion` — run before claiming done
