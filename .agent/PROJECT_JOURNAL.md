# FinPlan Pro — Agent Journal

## Session 002 (2026-08-17)

### Incident: sandbox re-clone lost local git history

The workspace was re-created between sessions. `HEAD` sat at the base commit
`455e74d` while the previous session's work existed only as uncommitted files
and on the remote as `26bf99a`. Recovered by fetching the remote branch and
confirming the working tree matched it byte-for-byte before fast-forwarding.
No work lost. **Lesson: push verified work early and often.**

### ADR-001 — Patch vulnerabilities via `overrides`, not `npm audit fix`

Status: accepted

**Context.** `npm audit` on `server/` reported a HIGH SSRF in `ip-address`
(GHSA-mwp4-54f8-5fhr and two siblings) and a LOW DoS in `body-parser`.
Reachability was confirmed rather than assumed: `ip-address` backs
`express-rate-limit`'s IP keying and `src/middleware/rateLimit.ts` applies
`authLimiter` to the auth routes, so an IP-parsing bypass defeats per-IP
throttling on login and undermines the account-lockout protection.

**Decision.** Pin patch-level `overrides` in `server/package.json`
(`ip-address ^10.5.0`, `body-parser ^1.20.6`), matching the convention the root
`package.json` already uses.

**Alternatives rejected.** `npm audit fix --omit=dev` resolves the advisories
but `--omit=dev` also _prunes_ devDependencies: it removed `@types/express`,
producing 12 `TS7016` errors and 8 failing test files. It was applied, the
breakage detected, and the tree fully reverted and re-verified before the real
fix landed.

**Consequences.** No manifest/API change, no major bumps, 0 vulnerabilities,
207/207 server tests still green.

### ADR-002 — Vulnerability scanning had no CI gate at all

Status: accepted (patch-delivered, awaiting human apply)

The SSRF reached `main` because **no workflow ever ran a vulnerability scan**,
despite `audit:prod` existing in `package.json`. Added a blocking `audit` job
plus a server-workspace audit step (the two workspaces have independent
lockfiles, so the root audit does not cover `server/`), both wired into the
`summary` gate. This re-lands finding N-0004, previously described but never
applied.

### Standing constraint — workflows are not pushable

The GitHub App lacks the `workflows` permission, so `.github/workflows/**`
changes are delivered as `ci-patches/0005-*.patch` per the repo's existing
convention. **These CI gates are NOT enforced until a human runs `git apply`.**

### Verification (this session, on a fresh clone)

| Check                                  | Result                                |
| -------------------------------------- | ------------------------------------- |
| frontend `tsc --noEmit`                | 0 errors                              |
| frontend `eslint src --max-warnings 0` | 0 errors, 0 warnings                  |
| frontend `vite build`                  | success, PWA generated                |
| frontend tests                         | 1212 files — 13,738 passed, 1 skipped |
| server `tsc --noEmit`                  | 0 errors                              |
| server tests                           | 130 + 77 = 207 passed                 |
| `npm audit` (root, prod)               | 0 vulnerabilities                     |
| `npm audit` (server, prod)             | 0 vulnerabilities                     |
| 8 repo-specific gates                  | all pass                              |

Note: the full frontend suite completed inside a **3 GB** sandbox — independent
evidence that the 80 GiB CI heap (corrected to 8 GiB in the patch) was never
load-bearing.

---

## Session 003 — Article XVIII: Blueprint Genesis (2026-08-17)

**Outcome: `blueprint_status: "LOCKED"`. Product code is unblocked.**

The Codex makes Article XVIII a hard gate: no product code until the blueprint is
complete, gap-analyzed, cross-validated, and locked. This session did that work and
nothing else. No `src/` or `server/` file was touched.

### Deliverables

| Artifact                      | Content                                                                                                                    |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `.agent/BLUEPRINT.md`         | 3,532 lines. Sections 0–22 in the exact numbering mandated by XVIII-C, plus Appendix A covering Addendum II Parts XXXI–LX. |
| `docs/architecture/TREE.md`   | Part LXI reproduced verbatim, with a _Known deviations_ table so decided divergence is distinguishable from drift.         |
| `.agent/blueprint-parts/*.md` | The 14 source parts the blueprint is concatenated from, kept for reviewable diffs.                                         |
| `.agent/state.json`           | `blueprint_status`, `blueprint_locked_at`, validation record, index baselines and gates.                                   |

### The decisions that shaped it (ADR-003 … ADR-011, Section 21)

The Codex's Article XVIII-G prescribes a stack — Next.js, Fastify, Prisma, Postgres,
Redis, Kafka, Rust. This repository is 455,514 lines of React 19 + Vite + Express with a
green type-check and 13,738 passing tests. **ADR-003 rejects the rewrite** and defines an
evolution path (stages S0–S4) with trigger conditions instead of dates, plus a
portability contract (PC1–PC5) that makes the SQLite→Postgres cutover a migration rather
than a rebuild. ADR-004 keeps money in decimal.js TypeScript because CI cannot compile
Rust (K2). ADR-005 refuses a dense OLAP cube and a CQRS split until something is
measured. These are the difference between a plan and a fantasy.

### Two honest findings that changed the roadmap

1. **The engine probe found twelve engine families at zero files** — headcount,
   currency conversion, close, journal, treasury, covenant, metric store, approval, RLS,
   OLAP, UDF, Wasm. Section 3.8 reconciles all 96 features: 61 built or partial, 35 not
   started, **14 of them P0**. The feature universe is written against what is measurably
   in this repository, not against what the older planning documents claimed.
2. **Phase 0 ships almost no user-visible features, deliberately.** Money integrity,
   tenancy, the runtime three-statement gate, the error registry, and collapsing 193
   routes to ≤ 40. Every P0 gap is a foundation gap, and each one left unfixed multiplies
   the cost of everything stacked on top of it.

### Validation (XVIII-N, 12 boxes + Addendum II, 31 boxes)

Four boxes did not pass on the first sweep and the work was done rather than the box
being charitably ticked:

- _"every financial rule has a test specification"_ → wrote **§6.8**, a 48-rule map from
  each normative rule to a named spec, walked by the `financial:oracles` gate.
- _"security covers all OWASP Top 10 for financial apps"_ → wrote **§10.8**, A01–A10 each
  with control and blocking test, plus FS1–FS4 for the finance-specific failures the Top
  10 does not cover.
- _"onboarding path for each persona is < defined time targets"_ → wrote **§2.8**, seven
  personas with timed E2E specs.
- _"Phase 0 tasks ≤ 1 week"_ and _"Phase 0 has no Phase 1 dependencies"_ → wrote
  **§18.2 W0.7**, decomposing all 13 Phase 0 items and proving the non-dependency
  explicitly instead of asserting it.

Full record in `BLUEPRINT.md` §22.7 and Appendix A.22.

### The clause that matters most

§22.6, binding on every phase: _a phase is complete when its gate passes. If a gate
fails, cut the next phase's scope — never lower the gate. Any gate change requires an
ADR._ Moving a bar to make a date is the failure mode this document exists to prevent.

### Next

Phase 0, Workstream 0.1: money integrity. Adoption from ~22% to ≥ 60%, zero float in
financial paths, mutation score ≥ 80% on `src/utils/money.ts`. Nothing outranks it.
