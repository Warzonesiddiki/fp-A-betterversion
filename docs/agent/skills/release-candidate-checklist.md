---
name: release-candidate-checklist
description: Use when preparing a release candidate. Comprehensive checklist covering all gates, evidence, and owner decisions.
group: engineering
---

# Release Candidate Checklist

**Use it when:** preparing a release candidate or completing a work unit.

## Pre-Release Gates (all must PASS)

### Code Quality
- [ ] `tsc --noEmit` PASS (exit 0)
- [ ] `eslint src --max-warnings 0` PASS (exit 0)
- [ ] `prettier --check` PASS

### Financial Integrity
- [ ] `money:ast` PASS (0 unsafe operations, 100% safe)
- [ ] `money:adoption` ratchet holds (baseline recorded)
- [ ] `missing-is-not-zero` PASS (0 violations on SUPPORTED surfaces)
- [ ] `fabrication` PASS (0 financial literals in UI)

### Documentation
- [ ] `docs:verify` PASS (all ratchet values match gates)
- [ ] `docs:links --strict` PASS (0 broken links)
- [ ] `verify-readme-stats` PASS (all measured claims match)
- [ ] `skills:verify` PASS (all skills indexed, frontmatter valid)

### Evidence
- [ ] `spine:evidence` PASS (every cited test exists and carries the cited title)
- [ ] `governance:evidence` PASS (every cited test exists and carries the cited title)
- [ ] `completion:register` PASS (rows valid, statuses correct)
- [ ] `routemap:check` PASS (route dispositions decided)
- [ ] `one-stop:acceptance` PASS (SUPPORTED routes completable in-app)

### AI Safety
- [ ] `ai-census` PASS (0 ungated surfaces)

### Accessibility
- [ ] `a11y-q5` PASS (WCAG 2.1 AA, all tests pass)

### Determinism
- [ ] `determinism` ratchet holds (baseline recorded)

### Bundle
- [ ] `bundle-check` PASS (under limit or warning acknowledged)

### Tests
- [ ] `test:sharded` PASS (8/8 shards)

## Owner Decisions (O1-O9)

All 9 decisions must be either:
- Answered by the owner, OR
- Recorded as BLOCKED-ON-OWNER with provisional default

## Release Artifacts

- [ ] `docs/plan/RELEASE_SNAPSHOT.md` created and current
- [ ] `docs/plan/RC_HARDENING_ROLLBACK.md` created
- [ ] `docs/discovery/OWNER_DECISION_PACKET_COMPLETION.md` created
- [ ] `docs/plan/COMPLETION_SUMMARY_2026_10_23.md` created

## What This Prevents

- Claiming "complete" without running gates
- Shipping with failing tests
- Missing owner decisions
- Missing release artifacts

## Related

- `release-engineering` — release preparation
- `finishing-a-branch` — end of work unit
- `zero-compromise-audit` — comprehensive verification
