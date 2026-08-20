# SESSION ZERO — REPO REALITY AUDIT

**Session:** sess_031
**Date:** 2026-08-20
**Branch:** `arena/01a02032-fp-a-betterversion`
**HEAD:** `f2ea326` (session 030 money-AST endgame) plus this session's W0.8 work
**Constitution:** `FINAL_PROMPT.md` KERNEL K0–K35. Blueprint LOCKED.

This audit re-measures the tree. Prior documents are evidence, not authority.

## 1. Capability probe (K2)

| Capability                | Present        | Consequence                                              |
| ------------------------- | -------------- | -------------------------------------------------------- |
| node v22 / npm 10         | yes            | TypeScript everywhere                                    |
| git / gh                  | yes            | commit, push, PR                                         |
| docker / postgres / redis | no             | SQLite remains S0/S1                                     |
| cargo / rustc             | no             | no `src-tauri/src/*.rs` edits                            |
| workflows permission      | no             | CI via `ci-patches/`                                     |
| RAM / CPU                 | 3 GB / 2 cores | shard tests; no full-suite-in-PR locally unless budgeted |

## 2. Inventory (measured 2026-08-20)

| Metric                              | Count                                                  | Command / source                                    |
| ----------------------------------- | ------------------------------------------------------ | --------------------------------------------------- |
| TS/TSX files (`src` + `server/src`) | 2,425                                                  | `find … \| wc -l`                                   |
| Engines (top-level, non-test)       | 187                                                    | `ls src/engines/*.ts`                               |
| Zustand store modules (non-test)    | 44                                                     | `ls src/store/*.ts \| grep -v test`                 |
| Persisted stores (`persist()`)      | **41**                                                 | `src/domain/persistenceAuthority.ts` + drift script |
| Pages (non-test tsx)                | 203                                                    | `find src/pages`                                    |
| Components (non-test tsx)           | 288                                                    | `find src/components`                               |
| Test files under `src`              | 1,280                                                  | `find src -name '*.test.ts*'`                       |
| Lazy routes in `App.tsx`            | **193**                                                | `grep -c lazy( src/App.tsx`                         |
| `tenant` in `server/src/db/`        | **0**                                                  | `rg tenant server/src/db`                           |
| Money AST safety                    | **99.66%** (25 ops / 3 mockData files)                 | `scripts/money-ast-baseline.json`                   |
| Fabrication findings                | **0**                                                  | `scripts/fabrication-baseline.json`                 |
| Schema homes                        | 2 (35 SQL tables, 10 in-code, 1 shared: `audit_trail`) | `npm run schema:equality`                           |

Interpretation unchanged from the locked blueprint: a large, disciplined **local-first workspace** with an auxiliary Express+SQLite control plane that is **mostly unwired**. Breadth still exceeds depth.

## 3. KEEP / REFACTOR / STRANGLE / REBUILD (layers)

| Layer                        | Grade | Decision                | Why                                                                  |
| ---------------------------- | ----- | ----------------------- | -------------------------------------------------------------------- |
| React 19 + Vite 8            | A     | KEEP                    | 1,200+ tests; ADR-003                                                |
| Tauri 2                      | B     | KEEP, do not edit blind | No cargo (K2, ADR-011)                                               |
| Zustand + masterStorage      | B     | REFACTOR                | Encryption is real; authority was undefined. W0.8.1–0.8.5 now typed. |
| AG Grid / Recharts           | B     | KEEP                    | Grid is the product                                                  |
| `src/utils/money.ts`         | A     | KEEP ENFORCE            | Primitive is correct; adoption was the gap                           |
| 187 engines                  | B/C   | KEEP, deepen            | Do not rewrite. Remaining defects are callers, not the primitive     |
| 193 routes / 203 pages       | D     | STRANGLE                | Collapse to 5 pillars / ≤40 routes (W0.5). Do not add routes.        |
| Express + SQLite             | B     | KEEP through Phase 1    | Server exists; client does not treat it as SoR                       |
| Sector dashboards            | C     | REFACTOR                | Fabrication ratchet at 0; still local-draft                          |
| Vertical "packs"             | D     | STRANGLE                | UI config, not PK1–PK6 packs                                         |
| Next.js/Prisma/Kafka rewrite | —     | REJECT                  | ADR-003                                                              |

## 4. Phase 0 remaining (after this session)

Done this session (W0.8.1–0.8.5):

- Persistence inventory + CI drift check
- Money-safe serialization boundary + 10k property test (INV-009)
- Typed authority contract (`PERSISTED_STORES`)
- Schema-home equality gate
- Durability honesty banner (local-only ledger)

Still open (ordered):

1. **W0.2 tenancy** — `tenant_id` + leak tests (blocked until 0.8.1–0.8.3; now unblocked)
2. **W0.3** runtime three-statement gate on server writes
3. **W0.8.6** glStore server-authoritative spike (after tenancy)
4. **W0.4** error registry
5. **W0.5** 5-pillar nav, ≤40 routes
6. **W0.6** AI egress chokepoint
7. MockData 25 remaining AST ops (fixture factories; skip per S028)

## 5. Highest-leverage next item

**W0.2 tenancy** (`tenant_id` + `environment_id` on governed tables, per-table leak test).
W0.8.6 (glStore spike) is sequenced after tenancy so the first authoritative store is tenant-scoped.

## 6. UI/UX (honest, not lighthouse-run)

Not measured this session (no Lighthouse in sandbox budget). Known defects from blueprint §9:

- 193 routes (UVI killer)
- Four-state coverage incomplete
- Design tokens exist (`src/index.css`); hardcoded colors still present in older pages
- Keyboard: command palette + skip links exist; grid Excel-parity incomplete
- Durability banner now ships on every AppLayout surface (W0.8.5)

See `.agent/ui_ux_audit.md`.

## 7. Fake finance

Fabrication ratchet: 0 displayed `$12.4M` / `24.3%` literals. This is **un-flagged, not certified**. Ratio invention and view/memo divergence still require per-module source guards. See `.agent/fake_finance_findings.md`.
