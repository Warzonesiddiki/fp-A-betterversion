# 00 — Index and source-of-truth matrix

This handbook (`AGENTS.md` + `docs/agent/*`) is the only instruction set for
agents. It is deliberately short per file and long on precision. Each file owns
one concern. If two documents disagree, the one named in the matrix below wins
and the other must be fixed or archived.

The documentation map for the whole repository is [`docs/README.md`](../README.md).
The product goal is [`docs/VISION.md`](../VISION.md).

## Handbook files

| #   | File                                                                       | Owns                                                                                                                 |
| --- | -------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| —   | [`AGENTS.md`](../../AGENTS.md)                                             | Entry point, non-negotiable rules, session protocol                                                                  |
| 00  | this file                                                                  | Precedence, superseded documents                                                                                     |
| 01  | [`01_PROJECT_BRIEF.md`](01_PROJECT_BRIEF.md)                               | What the product is, for whom, current truth, non-goals, open decisions                                              |
| 02  | [`02_ARCHITECTURE.md`](02_ARCHITECTURE.md)                                 | Stack, entry points, layers, dependency direction, runtime gates, config                                             |
| 03  | [`03_DOMAIN_RULES.md`](03_DOMAIN_RULES.md)                                 | Accounting and FP&A invariants the code must enforce                                                                 |
| 04  | [`04_ENGINEERING_RULES.md`](04_ENGINEERING_RULES.md)                       | Coding rules with the reason and the gate behind each                                                                |
| 05  | [`05_COMMANDS_AND_GATES.md`](05_COMMANDS_AND_GATES.md)                     | Every script, what it measures, how to update baselines, CI constraints                                              |
| 06  | [`06_TESTING.md`](06_TESTING.md)                                           | Test conventions, global mocks, clock pinning, store reset, evidence                                                 |
| 07  | [`07_WORKFLOW_AND_DOD.md`](07_WORKFLOW_AND_DOD.md)                         | Definition of done, commit/PR format, forbidden acts, handover                                                       |
| 08  | [`08_DATA_MODEL.md`](08_DATA_MODEL.md)                                     | Core types with file locations, persistence truth, schema homes                                                      |
| 09  | [`09_KNOWN_GAPS.md`](09_KNOWN_GAPS.md)                                     | What works, what is unwired, what is false, what is decided/undecided                                                |
| 10  | [`10_GLOSSARY.md`](10_GLOSSARY.md)                                         | Domain and repository vocabulary                                                                                     |
| 11  | [`11_ANTI_FABRICATION_AND_QUALITY.md`](11_ANTI_FABRICATION_AND_QUALITY.md) | Metric integrity (MI-01…MI-10), work quality (WQ-01…WQ-07), the 2026-10-24 incident, the self-check, and the doc map |
| —   | [`WORKING_AGREEMENT.md`](WORKING_AGREEMENT.md)                             | The owner's stated goal, the bar a work item must clear, the live queue                                              |
| —   | [`HANDOVER_TEMPLATE.md`](HANDOVER_TEMPLATE.md)                             | End-of-session report format                                                                                         |
| —   | [`skills/README.md`](skills/README.md)                                     | Agent skill library: 50 methods, indexed and gate-checked (`npm run skills:verify`)                                  |
| —   | [`skills/ponytail.md`](skills/ponytail.md)                                 | Standing working style: smallest complete change, one-read reply                                                     |

## Source-of-truth matrix

| Fact / concern                                                                              | Authoritative location                                                                            | Enforced by                                    |
| ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| Agent instructions, rules                                                                   | `AGENTS.md`, `docs/agent/`                                                                        | review; this matrix                            |
| Product goal, all-in-one module map, non-goals                                              | `docs/VISION.md`                                                                                  | review                                         |
| Documentation map / authority definition                                                    | `docs/README.md`                                                                                  | review                                         |
| Product scope, requirements, acceptance criteria                                            | `docs/discovery/requirements-register.md`                                                         | — (owner approval pending)                     |
| The owner's goal as stated, the done bar, the live work queue                               | `docs/agent/WORKING_AGREEMENT.md`                                                                 | review                                         |
| Decisions (made or open)                                                                    | `docs/discovery/decision-log.md`                                                                  | —                                              |
| Risks                                                                                       | `docs/discovery/risk-register.md`                                                                 | —                                              |
| Delivery sequence / gates                                                                   | `docs/discovery/roadmap.md`                                                                       | —                                              |
| Measured state of the codebase                                                              | `docs/audit/AUDIT_VS_FPA_MODULAR_2026-10-15.md`, `docs/audit/ALL_IN_ONE_GAP_REPORT_2026-08-25.md` | scripts listed in 05                           |
| Headline numbers (tests, engines, stores, reachability)                                     | `README.md`                                                                                       | `npm run docs:verify`                          |
| Which engines are reachable                                                                 | `node scripts/verify-readme-stats.mjs --list`                                                     | `docs:verify`                                  |
| Engine manifest                                                                             | `src/engines/manifest.generated.*` (generated)                                                    | `npm run engines:verify`                       |
| Route list                                                                                  | `docs/product/ROUTE_MAP.md` (generated by `scripts/generate-route-map.js`)                        | `npm run routemap:check`                       |
| Capability truth per route                                                                  | `docs/CAPABILITY_TRUTH_MATRIX.md` (generated by `scripts/generate-capability-truth-matrix.mjs`)   | `npm run capability:inventory`                 |
| Persisted store keys and classification                                                     | `docs/architecture/PERSISTENCE_MAP.md`                                                            | `npm run persistence:map`                      |
| Schema homes (migrations vs server DDL)                                                     | `src-tauri/migrations/`, `server/src/**`                                                          | `npm run schema:equality` (shared tables only) |
| Money rules                                                                                 | `src/utils/money.ts`, `docs/agent/03_DOMAIN_RULES.md`                                             | `money:ast`, `money:adoption`                  |
| Metric integrity / anti-fabrication rules (no fake markers, measure behaviour not presence) | `docs/agent/11_ANTI_FABRICATION_AND_QUALITY.md`, `scripts/placeholder-audit.mjs`                  | `placeholder:audit`, `money:adoption`, `check` |
| Determinism                                                                                 | `src/utils/clock.ts`, `scripts/determinism-baseline.json`                                         | `determinism:ratchet`                          |
| Type-escape budget                                                                          | `scripts/type-safety-baseline.json`                                                               | `type-safety:ratchet`                          |
| Import contract (idempotency, rejections, provenance, scope, totals)                        | `src/store/glStore.ts` (`importGLData` doc comment), `src/services/import/importProvenance.ts`    | `src/store/glStore.provenance.test.ts`         |
| Domain types                                                                                | `src/types/index.ts`                                                                              | `tsc`                                          |
| Security policy                                                                             | `SECURITY.md`, `docs/security/`                                                                   | —                                              |
| Doc link graph                                                                              | —                                                                                                 | `npm run docs:links`                           |
| CI definition                                                                               | `.github/workflows/*.yml` (human-edited only)                                                     | GitHub                                         |
| CI fixes awaiting a human                                                                   | `ci-patches/`                                                                                     | —                                              |
| Changelog                                                                                   | `CHANGELOG.md`                                                                                    | —                                              |

## Standing working style

[`skills/ponytail.md`](skills/ponytail.md) is active for every session unless the
owner turns it off: solve the whole problem with the least new code, finish the
callers and tests the change reaches, and leave the reply readable in one pass.
It is a style constraint, not a relaxation — validation at trust boundaries,
error handling that prevents data loss, security, accessibility and evidence are
never cut, and it never overrides the gates in §05.

The companions are on the same standing footing. They are how the style is
applied, not extra process, and they are indexed in
[`skills/README.md`](skills/README.md):

- **Consult the library before starting.** Find the row whose "use it when" line
  matches the work and follow it. When two skills apply, the narrower one wins;
  when a skill and a gate disagree, the gate is right and the skill gets fixed.
- **Discipline** (13) — brainstorming, plans, TDD, systematic debugging,
  verification before completion, giving and receiving review, finishing a
  branch, onboarding, research and sourcing, bulk refactors, local preview.
- **Finance** (8) — money and decimals, financial domain modelling, import and
  mapping, reconciliation and tie-out, period close, audit trail and lineage,
  no invented data, determinism.
- **Engineering** (13) — TypeScript strictness, stores and state, persistence
  integrity, testing strategy, gates and ratchets, architecture boundaries,
  security and secrets, SQLite/server, observability, dependencies and licences,
  release, incidents, the desktop shell.
- **Product and UI** (7) — accessibility, performance and bundle, visual design,
  charts, forms, exports, AI safety.
- **Meta** (3) — documentation and decisions, requirements traceability, skill
  authoring.
- **Owner set** (6) — the Ponytail skills themselves, reproduced verbatim.

The library is generated and checked: `npm run skills:verify` fails if a skill
lacks frontmatter, if its name does not match its file, if its group is unknown,
or if `README.md` is stale. A skill never upgrades a claim — evidence still comes
from the gates, and a recorded number stays recorded.

Nothing in these skills authorises weakening a gate, deleting breadth to make a
number look better (DEC-006), or claiming a capability the register cannot
evidence.

## Superseded documents (historical; do not follow as instructions)

On 2026-10-16 (DEC-011) every retired plan, handover, audit and prior-iteration
corpus was moved — not deleted — into
[`docs/archive/legacy-2026-10/`](../archive/legacy-2026-10/):

- `docs/archive/legacy-2026-10/root/` — root-level legacy markdown: the old
  master plans and roadmaps, session handovers, the V3 audit reports, the
  remediation report, the acquisition protocol and the knowledge dump.
- `docs/archive/legacy-2026-10/docs/` — retired top-level docs: master plans,
  gap analyses, product-vision drafts, the constitution and blueprint, prior
  architecture/testing/glossary narratives, strategy reviews, UX research and
  competitor analyses.
- `docs/archive/legacy-2026-10/_bmad/`, `.../agents/`, `.../MEMORY/`,
  `.../prompt/`, `.../skills/`, `.../presentations/` — retired corpora.
- `docs/archive/legacy-2026-10/.agent/` — the retired agent blueprint and
  session corpus.

Archived documents are useful as archaeology and must not be read as plans. The
docs-link gate exempts `docs/archive/` by policy, exactly as it exempts
`reports/`. **Never cite an archived file as the source of a rule.** Any
document that says the product is "feature complete", "100 % green", "100 %
money safe" or "fully offline" is contradicted by measurement
(`docs/audit/AUDIT_VS_FPA_MODULAR_2026-10-15.md` §2) and is archived.

Still-useful live references (not plans): `docs/adr/` (real decisions on
currency translation, Zustand, cube, decimal.js, master storage, migrations),
`docs/architecture/` (money, period-close, rbac, persistence map),
`docs/security/`, `SECURITY.md`, `docs/TAURI_PUBKEY_ROTATION.md`.

## Precedence when documents conflict

1. A script's measured output.
2. `AGENTS.md` / `docs/agent/`.
3. `docs/VISION.md`, `docs/discovery/` (plan of record) and `docs/audit/`.
4. ADRs in `docs/adr/`.
5. Everything else — informational only.
6. `docs/archive/` — provenance only; never an instruction.
