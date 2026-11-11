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
- [ ] `npm run money:ast` PASS (0 unsafe operations within the detector’s stated scope; not a universal safety certification)
- [ ] `money:adoption` ratchet holds (baseline recorded)
- [ ] `missing-is-not-zero` PASS (0 violations on SUPPORTED surfaces)
- [ ] `npm run fabrication:audit` PASS at its configured ratchet; inspect and report its actual scope/output

### Documentation
- [ ] `docs:verify` PASS (all ratchet values match gates)
- [ ] `docs:links --strict` PASS (0 broken links)
- [ ] `node scripts/verify-readme-stats.mjs` PASS (measured README claims match)
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
- [ ] `npm run test:a11y` PASS for the tests it runs; this is not by itself WCAG 2.1 AA or platform certification

### Determinism
- [ ] `determinism` ratchet holds (baseline recorded)

### Bundle
- [ ] `bundle-check` PASS (under limit or warning acknowledged)

### Tests
- [ ] `npm run test:sharded` PASS (8/8 shards, with the complete test/file tally; does not collect coverage by default)
- [ ] If coverage is a release criterion: `npm test -- --coverage`; report each configured 50% threshold separately. Coverage is not a substitute for behavioral evidence.

## Owner decisions and open plan questions

- Reconcile current accepted decisions and open questions from `docs/discovery/decision-log.md` and the master plan (R1–R12). DEC-103/104/105 remain distinct: single-user entity scope; accepted user-mapped universal-import direction; approval to proceed with the phased plan.
- For each unanswered question that affects this release, record the safe default, evidence boundary, release impact, and required owner decision. Do not treat silence as consent, and do not claim all R1–R12 must be answered before any release without a cited acceptance rule.

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
