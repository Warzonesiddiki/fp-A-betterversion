# 00 — Index and source-of-truth matrix

This handbook (`AGENTS.md` + `docs/agent/*`) is the only instruction set for
agents. It is deliberately short per file and long on precision. Each file owns
one concern. If two documents disagree, the one named in the matrix below wins
and the other must be fixed or archived.

The documentation map for the whole repository is [`docs/README.md`](../README.md).
The product goal is [`docs/VISION.md`](../VISION.md).

## Handbook files

| #   | File                                                   | Owns                                                                     |
| --- | ------------------------------------------------------ | ------------------------------------------------------------------------ |
| —   | [`AGENTS.md`](../../AGENTS.md)                         | Entry point, non-negotiable rules, session protocol                      |
| 00  | this file                                              | Precedence, superseded documents                                         |
| 01  | [`01_PROJECT_BRIEF.md`](01_PROJECT_BRIEF.md)           | What the product is, for whom, current truth, non-goals, open decisions  |
| 02  | [`02_ARCHITECTURE.md`](02_ARCHITECTURE.md)             | Stack, entry points, layers, dependency direction, runtime gates, config |
| 03  | [`03_DOMAIN_RULES.md`](03_DOMAIN_RULES.md)             | Accounting and FP&A invariants the code must enforce                     |
| 04  | [`04_ENGINEERING_RULES.md`](04_ENGINEERING_RULES.md)   | Coding rules with the reason and the gate behind each                    |
| 05  | [`05_COMMANDS_AND_GATES.md`](05_COMMANDS_AND_GATES.md) | Every script, what it measures, how to update baselines, CI constraints  |
| 06  | [`06_TESTING.md`](06_TESTING.md)                       | Test conventions, global mocks, clock pinning, store reset, evidence     |
| 07  | [`07_WORKFLOW_AND_DOD.md`](07_WORKFLOW_AND_DOD.md)     | Definition of done, commit/PR format, forbidden acts, handover           |
| 08  | [`08_DATA_MODEL.md`](08_DATA_MODEL.md)                 | Core types with file locations, persistence truth, schema homes          |
| 09  | [`09_KNOWN_GAPS.md`](09_KNOWN_GAPS.md)                 | What works, what is unwired, what is false, what is decided/undecided    |
| 10  | [`10_GLOSSARY.md`](10_GLOSSARY.md)                     | Domain and repository vocabulary                                         |
| —   | [`HANDOVER_TEMPLATE.md`](HANDOVER_TEMPLATE.md)         | End-of-session report format                                             |

## Source-of-truth matrix

| Fact / concern                                                       | Authoritative location                                                                          | Enforced by                                    |
| -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| Agent instructions, rules                                            | `AGENTS.md`, `docs/agent/`                                                                      | review; this matrix                            |
| Product goal, all-in-one module map, non-goals                       | `docs/VISION.md`                                                                                | review                                         |
| Documentation map / authority definition                             | `docs/README.md`                                                                                | review                                         |
| Product scope, requirements, acceptance criteria                     | `docs/discovery/requirements-register.md`                                                       | — (owner approval pending)                     |
| Decisions (made or open)                                             | `docs/discovery/decision-log.md`                                                                | —                                              |
| Risks                                                                | `docs/discovery/risk-register.md`                                                               | —                                              |
| Delivery sequence / gates                                            | `docs/discovery/roadmap.md`                                                                     | —                                              |
| Measured state of the codebase                                       | `docs/audit/AUDIT_VS_FPA_MODULAR_2026-10-15.md`, `docs/audit/ALL_IN_ONE_GAP_REPORT_2026-08-25.md` | scripts listed in 05                           |
| Headline numbers (tests, engines, stores, reachability)              | `README.md`                                                                                     | `npm run docs:verify`                          |
| Which engines are reachable                                          | `node scripts/verify-readme-stats.mjs --list`                                                   | `docs:verify`                                  |
| Engine manifest                                                      | `src/engines/manifest.generated.*` (generated)                                                  | `npm run engines:verify`                       |
| Route list                                                           | `docs/product/ROUTE_MAP.md` (generated by `scripts/generate-route-map.js`)                      | `npm run routemap:check`                       |
| Capability truth per route                                           | `docs/CAPABILITY_TRUTH_MATRIX.md` (generated by `scripts/generate-capability-truth-matrix.mjs`) | `npm run capability:inventory`                 |
| Persisted store keys and classification                              | `docs/architecture/PERSISTENCE_MAP.md`                                                          | `npm run persistence:map`                      |
| Schema homes (migrations vs server DDL)                              | `src-tauri/migrations/`, `server/src/**`                                                        | `npm run schema:equality` (shared tables only) |
| Money rules                                                          | `src/utils/money.ts`, `docs/agent/03_DOMAIN_RULES.md`                                           | `money:ast`, `money:adoption`                  |
| Determinism                                                          | `src/utils/clock.ts`, `scripts/determinism-baseline.json`                                       | `determinism:ratchet`                          |
| Type-escape budget                                                   | `scripts/type-safety-baseline.json`                                                             | `type-safety:ratchet`                          |
| Import contract (idempotency, rejections, provenance, scope, totals) | `src/store/glStore.ts` (`importGLData` doc comment), `src/services/import/importProvenance.ts`  | `src/store/glStore.provenance.test.ts`         |
| Domain types                                                         | `src/types/index.ts`                                                                            | `tsc`                                          |
| Security policy                                                      | `SECURITY.md`, `docs/security/`                                                                 | —                                              |
| Doc link graph                                                       | —                                                                                               | `npm run docs:links`                           |
| CI definition                                                        | `.github/workflows/*.yml` (human-edited only)                                                   | GitHub                                         |
| CI fixes awaiting a human                                            | `ci-patches/`                                                                                   | —                                              |
| Changelog                                                            | `CHANGELOG.md`                                                                                  | —                                              |

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
