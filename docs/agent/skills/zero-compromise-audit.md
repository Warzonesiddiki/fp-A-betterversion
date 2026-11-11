---
name: zero-compromise-audit
description: Use when auditing the project for zero-compromise compliance. Checks every gate, every claim, every number against evidence.
group: meta
---

# Zero-Compromise Audit

**Use it when:** verifying that the project meets zero-compromise standards before any release or completion claim.

## Audit checklist

### Code quality
- [ ] `npm run tsc` PASS
- [ ] `npm run lint` PASS
- [ ] `npm run format:check` PASS

### Financial integrity
- [ ] `npm run money:ast` PASS at the current detector scope; no universal-safety claim
- [ ] `npm run money:adoption` PASS; report proxy and genuine-use metrics distinctly
- [ ] `npm run docs:verify` PASS, including missing-is-not-zero acceptance
- [ ] `npm run fabrication:audit` PASS at the configured ratchet and stated scope

### Documentation and evidence
- [ ] `npm run docs:verify` and `npm run docs:links -- --strict` PASS
- [ ] `node scripts/verify-readme-stats.mjs` PASS
- [ ] `npm run skills:verify` PASS
- [ ] `npm run spine:evidence` and `npm run governance:evidence` PASS
- [ ] `npm run completion:register:check` and `npm run routemap:check` PASS
- [ ] Inspect `docs:verify` output for current route disposition, one-stop, and AI-census results

### Accessibility
- [ ] `npm run test:a11y` PASS for its configured suite; this alone is not WCAG certification
- [ ] Reconcile current mission accessibility scopes, platform evidence, and owner decisions; mark missing evidence unverified

### Determinism and bundle
- [ ] `npm run determinism:ratchet` PASS against the current baseline
- [ ] `npm run bundle-check` PASS; record measured size and warnings

### Tests and coverage
- [ ] `npm run test:sharded` PASS (8/8 shards with complete tally; no coverage collection by default)
- [ ] If coverage is a release criterion, run `npm test -- --coverage` and report configured 50% thresholds separately; coverage is not correctness evidence

## What this prevents

- Claiming "complete" without running gates
- Fabricating evidence
- Weakening gates to pass
- Deleting breadth to make numbers look better

## Related

- `zero-compromise-verification` — the overarching discipline
- `gates-and-ratchets` — how gates work
- `verification-before-completion` — run before claiming done
