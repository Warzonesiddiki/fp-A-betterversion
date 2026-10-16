# Archive manifest — legacy-2026-10

**Decision:** DEC-011 (2026-10-16). **Action:** moved with `git mv` (not deleted),
so history and provenance are preserved and the move is reversible.

**Scale:** 311 markdown files moved out of the live documentation graph.

## What moved

| Destination    | Source (original path)                | Files | Nature                                                                                          |
| -------------- | ------------------------------------- | ----- | ----------------------------------------------------------------------------------------------- |
| `root/`        | repository root                       | 27    | Legacy master plans, roadmaps, session handovers, V3 audit reports, remediation report, acquisition protocol, knowledge dump |
| `docs/`        | `docs/` top level                     | 48    | Competing master plans, gap analyses, product-vision drafts, constitution/blueprint, prior architecture/testing/glossary narratives, strategy reviews, UX research, competitor analyses |
| `_bmad/`       | `_bmad/`                              | 98    | BMAD process corpus                                                                              |
| `agents/`      | `agents/`                             | 41    | Multi-agent roster and personas                                                                  |
| `MEMORY/`      | `MEMORY/`                             | 48    | Session memory journals                                                                          |
| `prompt/`      | `prompt/`                             | 18    | Prompt archive                                                                                   |
| `.agent/`      | `.agent/`                             | 30    | Agent blueprint parts, session journals, ad-hoc audits                                           |
| `skills/`      | `skills/`                             | 1     | Retired skill                                                                                    |
| `presentations/` | `presentations/`                    | 1     | Retired presentation                                                                             |

## Why

1. **Conflicting authority.** The repository carried several plan sets, each
   claiming to be the plan. Agents and humans could not tell which document was
   authoritative, and the two most common failure modes in this repo — building
   against a stale plan and trusting a false "feature complete" claim — both
   traced back to that.
2. **False claims are still present in the retired corpora.** Documents claiming
   "100 % green", "100 % money safe" or "fully offline" were measured false on
   2026-10-15 (`docs/audit/AUDIT_VS_FPA_MODULAR_2026-10-15.md` §2). They must not
   sit next to live instructions.
3. **The live set is now small and enforced.** `docs/README.md`,
   `docs/VISION.md`, `docs/discovery/`, `docs/audit/` and `docs/agent/` cover
   product goal, requirements, decisions, risks, roadmap, architecture, domain
   rules, data model, testing, commands and definition of done.

## What deliberately did **not** move

These are read by scripts or are gate-enforced, so they stay in place:

| Path                                          | Why it stays                                    | Gate                 |
| --------------------------------------------- | ----------------------------------------------- | -------------------- |
| `docs/CAPABILITY_TRUTH_MATRIX.md`             | Generated route/module maturity matrix          | `capability:inventory` |
| `docs/product/ROUTE_MAP.md`                   | Generated route inventory                       | `routemap:check`     |
| `docs/architecture/PERSISTENCE_MAP.md`        | Generated persisted-store map                   | `persistence:map`    |
| `README.md`, `RELEASE_CHECKLIST.md`           | Numbers and release claims are gate-checked     | `docs:verify`        |
| `SECURITY.md`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `CHANGELOG.md`, `LICENSE` | Live project policy | —          |
| `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`         | Agent entry points                               | —                    |
| `TAURI_PUBKEY_ROTATION.md`                    | Operationally live                              | —                    |
| `KANBAN.json`, `PROGRESS_TRACKER.html`, `compliance-evidence.json`, `remediation-ledger.json`, `coverage.txt` | Read by `scripts/compliance-evidence.mjs` and `scripts/update-tracker.mjs` | — |

## How to reverse

```bash
git log --diff-filter=R --summary -1        # the rename commit
git mv docs/archive/legacy-2026-10/root/PLAN.md PLAN.md   # per file, if needed
```

Reversing the whole move is `git revert <commit>`. Do not restore a file into
the live tree without also updating `docs/README.md` — a live doc that nothing
points at is the drift this decision removed.

## Verification after the move

| Check                                            | Result |
| ------------------------------------------------ | ------ |
| `node scripts/docs-link-check.mjs --strict`      | 0 broken links, 0 broken citations (was 29 broken citations before) |
| `npm run docs:verify`                            | pass   |
| `npm run routemap:check`                         | pass   |
| `npm run engines:verify`                         | pass   |
| `npm run persistence:map`                        | pass   |
| `npm run capability:inventory`                   | regenerated, pass |
| `npm run escape:ledger`                          | pass (advisory mode) |
