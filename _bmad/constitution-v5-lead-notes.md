# Constitution v5 — Lead Adjudication Notes (Round 1 → Round 2)

> Author: Cowork (Lead). 2026-08-25. Input to `docs/CONSTITUTION_v5.md` synthesis.
> Sources: `FINAL_PROMPT.md` (OMNI-OS v4, owner-authored) · `.agent/BLUEPRINT.md` (LOCKED 2026-08-17, 4,448 lines, kernel K1–K28) · root `AGENTS.md` · `_bmad/*` law · manager Round-1 reports (pending/incoming).

## 1. Source-hierarchy ruling (proposed)

1. **Owner intent** = FINAL_PROMPT v4 mission + RULE #1 (never compromise).
2. **Engineering contract** = `.agent/BLUEPRINT.md` stays normative where it is stricter and current; v5 must NOT duplicate it — reference by §.
3. **Repo law** = AGENTS.md conventions + BMAD charter/D-rules remain operative; v5 merges Part VI loop into ONE governance loop (no double rulebooks).
4. Kernel drift K1–K28 (blueprint) vs K0–K35 (v4): v5 renumbers once, declares itself the only kernel list, maps old IDs.

## 2. Witnessed truth table (Lead, 2026-08-25)

| Claim in v4                    | Reality                                                                                 | Witness                    |
| ------------------------------ | --------------------------------------------------------------------------------------- | -------------------------- |
| AG Grid "35 Enterprise"        | `ag-grid-community`/`ag-grid-react` ^35.3.0 — **Community**                             | package.json Select-String |
| 193 routes                     | **242 `<Route>` / 182 `lazy()`**                                                        | src/App.tsx Select-String  |
| SQLite→Postgres only migration | server/ Express app exists (separate pkg)                                               | Glob server/package.json   |
| Money stack ready              | decimal.js ^10.6.0, zod ^4.4.3, exceljs ^4.4.0 pinned                                   | package.json               |
| Design/tokens/perf law absent  | `src/config/designTokens.ts`, `perfBudgets.ts` (+tests), `sectors/`, `templates/` exist | Get-ChildItem src/config   |
| Session-Zero artifacts missing | Only `.agent/BLUEPRINT.md` exists; no state.json/repo_audit.md                          | Glob .agent/\*\*           |

## 3. Known garbles in FINAL_PROMPT v4 (fix in v5)

L153–157 keep/rebuild table · L165–166 duplicated garble · L260–265 selectors block · L672–675 corrupted block · stale counts ("455,514 lines / 1,228 test files / 187 engines / 43 stores" → current canon: ~15k tests / 1,287+ files wave-7D, 180+ engines, 28+ stores — cite ledger #42 + p01 baseline with dates).

## 4. Undefined terms v5 must define

- **SHI / UVI** (Part X termination scores) — never defined. Proposal: SHI = System Health Index (weighted: gates green %, flake rate, axe violations, coverage trend, budget headroom); UVI = User-Value Index (% of Core-20 workflows at ENTERPRISE maturity per BLUEPRINT ladder × measured workflow pass rate). Pending M5/M4 refinement.
- **Core-20 workflows** — referenced, never listed (Phase 1: 1–8, Phase 2: 9–16, Phase 3: 17–20). M4 owns the definitive list proposal.

## 5. Two-plane reconciliation (adjudication stance, pending M2)

Constraint set: Tauri-only shell + offline-first (AGENTS.md App behavior) AND K25/K26 server-authority/tenancy (v4) AND existing `server/` Express app. Non-compromise resolution shape: Plane B authority is **conditional** — when server present, it is source of truth for books/audit/tenancy; offline mode runs on local sovereign store with event-log replay + sync queue; capability states (BUILT→ENTERPRISE) label which plane each feature is GOVERNED on. Honest labeling, not silent degradation. Final call after M2 report.

## 6. Governance merge (Lead domain)

One loop: Owner directive → BMAD dispatch (task board, dormancy protocol, timeout-safe sequencing) → squad execution under AGENTS.md conventions → S5 gates (tsc→lint→vitest→build→bundle-check + K30/K32/K33/K34 enforcement where implementable) → D-011 4-ICP verdict for majors → ledger entry. Part VI tiers/timeboxes map onto wave dispatches. Pre-push 4-gate subset unchanged.

## 7. Round-1 status

Briefs queued to M1–M5 (team_run 01a03609), A–E format demanded, analysis-only (no repo mutation). Synthesis owner task: 01a0360c-6bb9-7833-9606-2db9efe87397.

## 8. Round-1 receipts

### ✅ M3 Orion Forge (S3) — RECEIVED, accepted into record

- Routes refined: 242 `<Route>` / **228 `path=`** / 45 `<Navigate>`; `scripts/generate-route-map.js` + `docs/product/ROUTE_MAP.md` exist → adopt **one-way ratchet CI gate** (count may only decrease).
- Grid edition: Enterprise-only must-haves enumerated (row groups, advanced filter builder, undo/redo, status-bar range agg, range charts, formatted Excel export) + custom-build items (fill handle, formula bar, cell comments) → v5 needs **ADR: buy Enterprise license vs build-on-Community**; spec may not silently assume a license.
- Tokens: Tailwind 4 CSS-first — `index.css @theme inline` is sole SSOT; `designTokens.ts` deliberately density-only, pinned by `tokenBridge.contract.test.ts`. v4 L184 JSON-export mechanism = factually wrong → rewrite.
- Variance colors: v4 introduces second green #059669 → violates repo law (#16A34A/#DC2626) and its own K35. One green per meaning.
- States: K30 becomes FIVE states (+partial per BLUEPRINT §9.9); partial mandatory on consolidation/rollups.
- Mobile: K31 universal-mobile contradicts §9.10 non-goals + Tauri-only runtime → desktop-first posture, mobile = review/approve scope, explicit.
- Onboarding SSO flows = Plane-B server work, not Phase-0 UX; first-run wizard exists.
- Hallucinated capabilities to schedule-or-cut: Storybook (0 lockfile refs), PPTX export (0 deps).
- Type-scale mismatch (v4 12–60px vs index.css 11–28px); modal-width contradiction (800 vs 1024); pillar drift (REPORT adds Saved Reports, ADMIN drops Health, ⌘K drops copilot jump); print serif body rejected.
- Verdict: 4/4 ICPs ACCEPT v5 direction with amendments.
- v5 intake decisions: N1–N8 non-negotiables adopted as S3 law block; I1 ratchet + I2 grid ADR + I3 five-state pattern library scheduled as v5 mechanisms.

### ✅ M1 Atlas Prime (S1) — RECEIVED, accepted into record

- 🔴 **N2 reversal (A2)**: v4 L580 "HALF_EVEN default" contradicts BLUEPRINT §6.4/ADR-012 (evidenced ROUND_HALF_UP after Codex self-contradiction proof, 0.005 case; matches money.ts). → v5 restores ADR-012 or formally re-adjudicates with proof on table.
- 🔴 **K24 vs AGENTS.md (A3)**: "decimal.js only, no exceptions" vs repo convention "raw number until display". Reality: 61 `from 'decimal.js'` sites / ~214 engine-dir modules. → Canonical numeric pipeline ruling needed: string|number → Decimal compute → **tagged-string persistence at masterStorage boundary** (C4 serialization law — JSON round-trip otherwise betrays IEEE-754) → format at display edge. Requires AGENTS.md convention amendment during v5 rollout.
- 🔴 **TS4 server-only gate unreachable offline (A4)** → adopt THREE-LAYER gate (C2): pure verifyThreeStatements() engine fn + persistence-boundary hook in masterStorage/persist middleware + server gate at publish/approve once Plane B wired. Trigger points: save-commit/import-accept/publish/period-lock/post-worker-recalc — never per-keystroke.
- 🟠 Quarantine semantics (C3): unbalanced draft stays visible read-only with TS5 structured error; "cannot disable" applies to COMMITS only — else data-hostage defect for offline users.
- 🟢 N19 gets a number (C5): post-elimination IC nets EXACTLY zero under Decimal; recon items via explicit account, no tolerance fudge.
- Fresh measurements (2026-08-25): engines=187 (canonical cmd pinned); stores=43 persist() / 45 total; test files=1,319 src-colocated (+91 since 08-17; canon P-01 14,835/1,287 @08-23); LOC same-scope=453,862 (−1,652); lazy()=182 (−11). All counts must carry date+command in v5 (C6).
- CI triple-gate proposal (D1): AST detector on new IEEE ops/toFixed( in money paths (only 12 non-test .toFixed( hits today → ratchet-to-zero CHEAP), TS1–TS3 property-based oracles, persistence round-trip byte-exact test — wired into husky pre-push.
- Phase 0/1 realism (D3): convert ONLY money-chain engines backing the 43 persisted financial stores + TS gate + string persistence; long-tail verticals frozen behind K20 filter.
- REJECTS adopted into record: HALF_EVEN-as-written; server-only gate; absolute "cannot be disabled"; undated normative numbers; "no exceptions" without baseline register (E5: enforcement+honest register = the real zero-compromise); patch-on-OCR-corpus (regenerate §3.3/§3.4 clean).
- KEEP endorsements: EVOLVE-not-rewrite; SQLite-through-Phase-1 with tenant_id discipline; deepen-don't-replace engines.

### ✅ M2 Nova Ledger (S2) — RECEIVED, accepted into record

- 🔴 **K25 resolved via THREE-MODE AUTHORITY MATRIX** (N-1/D-1): OFFLINE→local Tauri-SQLite is truth via append-only signed journal (outbox); ONLINE→server ratifies via CAS; RECONCILING→deterministic journal-seq replay. "Authority is always DEFINED, sometimes DEFERRED." Converts server-authority from precondition → protocol. Adopted as v5 backbone for Part III.
- 🔴 Plane A description fictional (A-2): real stack = masterStorage chunked **sql.js**(web)/Tauri-SQLite(desktop) + AES-GCM device key (`finplan.storage-key.v1`), fail-closed, typed StorageError taxonomy (masterStorage.ts witnesses). IndexedDB = aspiration, not state. v5 describes TODAY honestly.
- 🟠 Tenancy HALF-STALE (A-3/B-6): server plane ALREADY tenanted (82 `tenant` hits in server/src/db, 5 tenancy route-test files, W02 lineage); gap = local plane only (default-tenant constant now, RLS exactly at S2 rung).
- 🟠 Kernel self-reference bug (A-5): v4's K28 cites own K20; BLUEPRINT uses old numbering → v5 renumbers once + ID map.
- ⚠️ **Cross-report discrepancies to adjudicate in synthesis**: (a) persist() store count — M1 counted 43, M2 counted 41 (both 45 total modules) → re-run with ONE pinned command before stamping; (b) decimal.js adoption — M1: 61 import sites, M2: 17/187 modules (~9%) → reconcilable (sites vs modules), pin BOTH metrics in v5 baseline table.
- Non-negotiables adopted: N-2 one storage contract/pluggable backends (never regress silent-empty hydration); N-3 tenant_id everywhere enforced where meaningful; N-4 versioned CAS + typed conflict union, LWW forbidden on decimals; N-5 idempotency as data-model (unique source_system+source_pk+content_hash), ingest reports disclose counts; N-6 locked periods at storage boundary (trigger/middleware not UI), unlock needs actor+reason+audit; N-7 S-ladder must name enforcement artifact (ESLint rule/query-builder escape hatch) BEFORE Phase 2.
- Rejects adopted: cloud-first K25 reading; wholesale IndexedDB rewrite (masterStorage semantics NEWER than doc); blanket RLS-now; F-COLLAB-002 ahead of journal/CAS substrate; ORM introduction; undated L120/L130 figures; multi-region S4 as plan (mark out-of-horizon).
- Phase-0 wiring (D-3): kernels K27/N13/N14/N15 become named W0.x deliverables each with failing-test-first file — laws become verifiable work items, not slogans.

### ✅ M4 Sage Vector (S4) — RECEIVED, accepted into record

- 🔴 **Core-20 already EXISTS**: BLUEPRINT §24.2 ledger rows 1–20 (P0×1 three-statement, P1×9, P2×10, P3×0) — v4's "1–8/9–16/17–20" phase map is phantom numbering contradicting its own source. v5 imports by REFERENCE, deletes phantom map, every phase DoD cites workflow IDs. AI features correctly NOT Core-20 (differentiators).
- 🔴 Ratchet machinery PARTIALLY EXISTS: `scripts/money-ast-detector.mjs` + `money-adoption-baseline.json` witnessed — v5's numeric CI gate builds on these, not from scratch. ADR-004 still 0/4 ICPs; K24 ties to ratification; AGENTS.md raw-number text amends AT ratification.
- 🔴 Claimed-but-absent: `tools/codegen/packs.ts` (BLUEPRINT §7.2 enforcement) Test-Path FALSE; 4 Core-Promise acceptance spec files (cfo-board-pack, three-statement, controller-5-entity-consol, auditor-drill-through) all absent → become Phase-0 deliverables so promises are falsifiable day one.
- 🟠 Sector packs: 15 configs exist in `src/config/sectors/` but ALL below ≥10-KPI bar (energy=1 … tech=7); `validateConfig` requires only ≥5 → energy/banking/edu/gov FAIL validation TODAY. v5: wrap the 15 existing, raise to pack contract, build packs.ts as enforcer.
- 🟠 Unfunded promise: PPTX export (0 deps, no chunk) → descope default to PDF handout until dep+chunk+budget named. "Pixel-perfect Excel" → "layout-faithful, formula-preserving".
- 🟠 Excel add-in at Phase 2 violates v4's own K28 → K28′ falsifiable rewrite: ≥80%-Excel-journey gate + supervised-bridge exception (add-in→P3) + statutory-export exemption + scoped BI clause ("kill FP&A detours", not "replace Power BI").
- 🟠 Part II metrics: TTFI/board-pack/recovery unmeasurable as written (no start/end events/instruments) → v5 metrics table format: metric|start|end|threshold|instrument|owner. Keep measurable ones (grid <100ms@10k = perfBudgets canon; ≤3 clicks; <2s throttled).
- ⚠️ Metric discrepancies for synthesis adjudication: stores 46 (M4) vs 45 (M1/M2); BLUEPRINT line count 3,551 (Measure-Object non-blank) vs 4,448 (Get-Content physical — Lead's measure) → classic definition drift; v5 pins ONE command per stat (M4-N8: extend verify-readme-stats pattern to constitution).
- Adopted improvements: escape-ledger-check.mjs asserts Core-20 coverage per DoD; export-verify.mjs enforces matrix; perfBudgets.ts = single source for ALL latency numbers incl. K33/Lighthouse.
- Copilot guardrails N4 adopted (optional-peer both-states bundle green, egress chokepoint+redaction, lineage-cited answers, governed writes only).

### ✅ M5 Titan Shield (S5) — RECEIVED, accepted into record — ROUND 1 COMPLETE (5/5)

- 🔴 **SHI/UVI = ghost metrics CONFIRMED**: BLUEPRINT names them (System Health/User Value/DEI, thresholds BP L188–190) but cites "rubric in §22.3" which is actually the Phase-1 DoD checklist — no formula exists anywhere. → replaced by **Signal Panel v0** computed entirely from existing tooling (gates-green, bundle-vs-budgets, axe delta, money:ast delta, escape-ledger delta, route drift); Part X termination conditions rewritten measurable (phase DoD ∧ deltas≈0 ×3 consecutive cycles ∧ zero Severity-0/90d ∧ empty tier ledger).
- 🔴 **Environment block falsified on current box**: Node local v26.7 vs doc v22 (CI Node 22 → engines.node pin = P0); 8 cores / ~19.8GB (doc: 2c/3GB); **cargo+rustc 1.98 PRESENT** (doc: absent → Rust/Wasm reclassified "deferred pending runner parity, Tier-3 ADR"); Docker absent ✓; Actions permission still blocked ✓ (ci-patches/\*.patch handoff stands; never treat red remote CI as evidence, E-005).
- 🔴 **ADR ID collision**: FP says ADR-003=evolve-stack; AGENTS.md table says ADR-003=OLAP cube (ADR-004 meanings differ too). Two live registries → v5 declares ONE canon (AGENTS.md table) + re-keying map (Appendix A).
- 🔴 Kernel prefix collision FP K23–K34 vs BP K1–K28 → single renumbered set + map.
- 🟠 Latency self-contradiction (16ms vs 100ms vs <1s ladder) → one ladder owned by perfBudgets.ts. N17 scope split engine-path vs display-path (formatters legitimately use toFixed). Express is ^4.21 not 5 → explicit migration item. K31 parked behind web-build trigger. L752 localStorage framing → hybrid-authority clause. Tier taxonomy circularity → tier ledger must exist before termination conditions reference it.
- ✅ Enforceability verdicts: K24/N17 AST detectors ALREADY EXIST (wire post-lint); K30 feasible via AST rule on src/pages/\*\*; K32 mostly exists (test:a11y + a11y-q5-gate.js) → wire; K33 Lighthouse NOT implementable today (no dep, Actions blocked, Tauri shell would measure non-product) → demoted advisory; K34 cheap scan script w/ regenerated baseline (prior token audits stale).
- ✅ VALIDATE defined AS existing gate chain + 12 named shipped scripts (money:ast/adoption, escape:ledger, fabrication:audit, type-safety:ratchet, architecture:guardrails, a11y-q5-gate, engines:verify, routemap:check --check, schema:equality, docs:verify, repo:hygiene) — v5 cites paths by name; ratchet-or-nothing baseline JSON pattern.
- 🤝 Honest labeling: could not reproduce Lead-flagged L672–675 garble (clean in repo-root copy) → Lead accepts correction; flag marked UNVERIFIED/likely attachment drift; nearest real cluster remains L152–164+dup L165.
- Stats discrepancy ledger grows: stores 43/45/46/48 and engines 187/214 across reporters (methodology variance) → v5 rule: stats GENERATED by scripts, never hardcoded; Wave-1 stamps canonical values.

## 9. Wave-1 consolidated squad reports (intake)

### ✅ S3 · Orion Forge — W1-C UI conformance (COMPLETE, cascade verified 20/20 witnesses)

- **P0 five-state law**: 0/14 page families declare all five states. Worst: VarianceDashboardPage (0 state primitives), DataImport+GLExplorer (ingestion front door), Workforce×3, Treasury×3; PL/BS/CF render silent zeros when empty. Group-level error/loading infra solid.
- **P0/P1 variance dual-canon**: AGENTS.md mandates #16A34A/#DC2626 BUT index.css pins --positive:#15803d (PATCH 19, AA 5.13:1 rationale replacing #10b981's 3.36:1 fail) → charts can't satisfy both canons. De-facto drift: emerald #10b981 ×63 lines / red-500 ×37 vs canonical pair 8+8. 4 HIGH sites named (COGSVariance:190, VarianceDashboard:382–383, KPICard:226 flagship sparkline, ValueBasedCare:199). Proven pattern exists: WaterfallChart var(--positive)/var(--negative) + guardrail test. #059669 = 0 hits (v4 non-issue).
- **P1 grid LIVE defect**: FinPlanGrid.tsx:266–276 type-blind string write into currency cells (live on BudgetDetailPage:684); DataGrid text filters on numeric cols (:124); orphan configs + dead SpreadsheetGrid found. UI-HF sort hotfix HOLDS (67 sites, 0 bypasses).
- **HIGH a11y/i18n**: batteries green (84 tests), CompetitiveGapsToolbar still lacks axe net; useTranslation=0 across src/pages (~446 hardcoded literals sampled) while 8-locale infra fully maintained.
- **→ OWNER VERDICTS REQUESTED**: (a) color-canon ADR — AGENTS.md hex law vs AA-driven token values (what IS canonical?); (b) i18n scope — codemod page layer vs honest descope. Both change what "conformant" means ⇒ D-011 territory.
- Wave-2 ranking delivered (P0 quartet: variance charts fix+guardrails, VarianceDashboard states, front-door states, Workforce/Treasury quartet).

### ✅ S2 · Nova Ledger — W1-B data-truth (COMPLETE; 5×PARTIAL, no shipped S0 data-loss path, ONE latent HIGH)

- **H1 double-encrypt migration [VERIFIED by M2]**: legacyStorageMigration.ts:237–239 re-encrypts already-encrypted backend values (sqlJsStorage.ts:94 pass-through) → next boot decrypts once → silent-empty hydration on sqljs-era→Tauri upgrade. Tests mask it via mock plain objects.
- S1-tier: glStore dedup heuristic drops legit entries + stale re-ingest rows (:907–909); silent-zero coercion cluster in UNWIRED import services; idempotency key model ABSENT repo-wide (constitution §Part-3 literal item); tokenless WS silent deadlock (WSM:159–163); unbounded outbound queue; SecretsVault envelope HMAC computed-never-verified; AUDIT_HMAC prod-silent vs JWT fail-closed; persistConfig dead factory 0/48 adoption (dual-worker convergence); migration probes cover 13/42 persisted stores.
- **Part-3 enforcement-gap register (10 items)** incl.: no SQL-placement guard (violation exists sqlJsStorage.ts:35), K25 three-mode authority implemented NOWHERE (crdtSync replay unwired 0 consumers), wire-schema SSOT absent (2 FE dialects), ADR-010 stalled 64+ days past gate, no unmocked round-trip test anywhere, server WS endpoint absent.
- Honesty ledger: zero fabricated claims shipped; multiple worker self-corrections + manager corrections (paths, scope bleeds).
- Wave-2 recs: P0 = rewrite legacyStorageMigration as verbatim blob copy + persistenceAuthority-manifest key lists; ship SQL-placement AST guard; build UNMOCKED round-trip harness. P1 = WS endpoint under SDK-gate + zod wire schema; enforce HMAC verify + AUDIT_HMAC fail-closed; lineage-keyed upsert; adopt-or-delete persistConfig.
- AMENDMENT (M2, manager-verified): non-finite money PROMOTED S2-hygiene → S1 wrong-number risk — moneySerialize.ts:117 finite-only guard lets NaN/±Infinity fall through untagged → JSON nulls them at rest; 0 NaN/Infinity refs in moneySerialize.test.ts (unpinned). Counts stamped UTC 2026-08-25: 42 persist-calling store files / 0 createJSONStorage bypasses / 0 persistConfig importers / 13 PERSIST_KEYS.

### ✅ S1 · Atlas Prime — W1-B engine-truth (COMPLETE; 15 headline defects, ALL UNGUARDED — ~1,420 passing tests pin none of them)

- Top defects [M1 spot-verified at exact lines, zero citation drift across 5 workers]: F7 wrong-account IC eliminations (CE L1121→1217–18, worksheet corruption); NPV dual convention both test-pinned (i=0 vs i=1 Excel; 281.82 vs 256.20); D1 seasonal MA phantom +25% trend (EXECUTED); D2 MonteCarlo RangeError ≥~200k iters vs 1M advertised (EXECUTED); NCI percent contract OPPOSITE between sibling engines (100× caller trap); string equality always-TRUE in live parser ("a"="b"→1); MIRR omits reinvestment factor; elimination residual silent survivor; CTA derived-but-never-posted; goodwill index desync; blend dead code → silent full-replace; triangular NaN path ×3.
- META (constitution feed): ① R-22 AST detector green over 5 confirmed semantic violations — primitive-usage gate is blind to money-ness (needs typed Money domain or semantic lint); ② advertised-but-unwired capability is SYSTEMIC (6 unwired forecast engines, batch worker SUM-range collapse, ArrayFormulaEngine MMULT computes A·A); ③ green ≠ pinned — RED-first program is load-bearing; ④ purity violations cluster in RollingForecast/SensitivityTable.
- Wave-2 program: P0-A consolidation correctness bundle (F7/F8/residual/VIE; RED suite ready) · P0-B ONE numeric-convention ADR (percent whole-vs-decimal, ONE NPV, ROUND Excel semantics, single ÷0 policy of current THREE, rounding doctrine) · P1-C/D/E bundles · P2 catalog wire-or-retire honesty · P3 TEST-TRUTH program (T1–T14+R1–R12 RED proposals + cross-engine equivalence oracle).

## 10. Owner-verdict queue (D-011 items accumulating for Wave-2 planning)

(a) Color-canon ADR (S3): hue-law-via-tokens vs exact-hex everywhere.
(b) i18n scope (S3): page-layer codemod vs honest descope.
(c) Numeric-convention ADR (S1): percent whole-vs-decimal · single NPV convention · ROUND semantics · ÷0 policy · rounding-order doctrine.
(d) Catalog honesty policy (S1 meta②): wire-or-retire unwired engines — affects product claims.

### ➕ S1 ADDENDA-2/3/4 (evidence base CLOSED)

- **ADDENDUM-2 — Function name-collision cluster**: 145 of 207 FormulaFunctionRegistry names ALSO exist in SafeMathParser's 302 builtins; ≥5 semantic divergences proven empirically (CAGR SIGN FLIP financial.ts:164 vs SMP:130–36; SPREAD array-vs-scalar; ALLOCATE same; NPV dual arity+convention supersedes filed #2; MOD sign split — divergence direction PER-FUNCTION: registry more Excel-correct on MOD, parser on NPV). Parser never consults registry (SMP:1814–22) → dormant-but-armed for plugin wiring. v2 recs: canonicalize one set (parser delegates to registry), golden-input cross-engine equality test over 145 shared names (fails today ≥6), per-function Excel oracle decisions, registry arity metadata. RED R13–R15 ready.
- **ADDENDUM-3 — Wiring truth corrected: THREE live forecast/scenario paths** (WhatIfPage.tsx:89 instantiates WhatIfSandboxEngine, 455 lines, PARTIAL, USER-REACHABLE): D14 deletion-invisible compare (:267–69 continue), D15 order-swap cache returns inverted deltas (:254 sort vs :271 directional), D16 stacked-undo corruption → severity upgraded INTO live-path P2 tier above unwired engines. Lane coverage corrected to 9 engines (GoalSeek bonus). RED R9–R11 ready.
- **ADDENDUM-4 — Census + ratchet closure [M1-recount]**: decimal.js adoption = **14/20 territory files** + 17/20 money-utils (W04's 2/20 was tooling artifact — fourth incident today); pure-float-by-design holdouts named (MonteCarlo, Sensitivity, FormulaEngine, ArrayFormulaEngine, AutoComplete). Second defective ROUND site math.ts:13–16 (+ ROUNDUP/DOWN/MROUND :17–23) and THIRD MOD semantics (math.ts NaN vs typed errors elsewhere). Per-territory ratchet verdicts ACCEPTED: T3 consolidation/FX realistic NOW · T1 one-fix-away · T2 partial w/ documented float exceptions · T4 blocked until stack consolidation (SafeMathParser+financial.ts as canon → port ROUND family → demote/delete FormulaEngine float paths). New: RATE solver returns unconverged iterate, TREND raw-float on money, simulateScenario missing finite-guard.
- Verdict queue impact: item (c) numeric-convention ADR now includes per-function oracle decisions (NPV/CAGR/MOD/SPREAD/ALLOCATE/YTD-QTD).

### ✅ S4 · Sage Vector — W1-C analytics/product (COMPLETE; static-only honest label)

- Core-20 traceability: **20/20 IMPLEMENTED, 0 stub/absent** surface-level; caveats: no single model-builder page, NO free-form manual JE editor (#11), board-pack hard-escape PPTX entirely unwired (#13). Routes moving target 251 live / 242 AM; engines root=193 vs recursive=214 ("187" = root Aug-17 count).
- Metrics: Part-II 7 metrics → **0 fully instrumented / 3 partial / 4 none**; >90%-completion IMPOSSIBLE (zero product telemetry); perfBudgets.ts has ZERO grid constants + zero external consumers → K23 aspirational today. Unwired instruments exist (web-vitals specs, bundle-check).
- Sector packs: validateConfig has ZERO callers (DEAD CODE); 14/15 pass own bar, banking FAILs (4 KPIs); ALL 15 below ≥10-KPI pack bar (max 8); SectorConfig type lacks template/sampleData fields. M4 self-corrected earlier '{ id:' proxy counts (energy=5, gov=5, agr=5, banking=4 direct reads).
- Exports: PDF✓ Excel✓ CSV✓ · **PPTX absent ×4-witnessed**. 🔴 F1: export-verify.mjs scans 3 NON-EXISTENT files, silently skips, exits GREEN. 🔴 F2: ExportDialog.tsx (347 lines) ORPHANED — 0 production mounts.
- Guardrails strong (llmEgress chokepoint kill-switch/allowlist/redact-audit, fail-closed fallbacks, plugin sandbox deny-by-default); gaps: GAP-A HF weight downloads bypass chokepoint; GAP-B absence-path untested (AIRuntimeUnavailableError never exercised) + catch-less init AIIntelligencePage:109–119; GAP-C dead 'websocket' consent label.
- W20: 4 Phase-0 spec outlines w/ complexity ratings; wizard import step MOCK-ONLY (hollow P1 promise); drill-through INSPECTOR component not found → build/no-build call needed; duplicate /onboarding wizard never completes.
- Wave-2 recs: P0 repair export-verify.mjs (fail loudly on missing targets), PPTX fund-or-amend, validateConfig wire-or-delete + banking KPI, inspector ruling. P1 telemetry event spine (makes 2 metrics measurable overnight), grid budget into perfBudgets + Playwright assert, wizard dedupe, ExportDialog mount-or-remove, real import wiring.

### ➕ S1 ADDENDUM (L2 supplement, M1-verified)

- Reconciliation identity ABSENT: ForecastReconciliationEngine computes only between-source variance; no actual-anchor; base+Σvariances≡actual enforced NOWHERE → wire-or-retire promoted toward P1-class decision.
- PERCENT-SCALE family violation → OWNER RULING added: forecast/scenario engines store margins as 0–100 numbers (own headers document it; MonteCarloEngine L490–91) contradicting AGENTS.md decimal law; SensitivityTable.formatValue assumes decimals ⇒ 1500%-class garbage renders. Options: (a) ratify 0–100 UI scale + rename …MarginPct, or (b) migrate engines to decimals; formatValue fix unconditional either way.
- CAGR: zero implementations (capability gap, roadmap item — not defect).
- VERIFIED GOOD: MC determinism proven by execution (seed=42 bit-identical); worker float integrity clean; rolling-window year rollover exact; sensitivity signs correct. Worker PRNG ≠ engine PRNG (seeds non-portable — document).
- Tooling rule adopted: multi-file Select-String requires single-file confirmation before absence claims.

### ✅ S5 · Titan Shield — W2-A COMPLETE: ALL GATES GREEN ON FRESH ARTIFACTS

- G1 tsc exit 0 (56.4s) · G2 eslint WHOLE-TREE CLEAN post-fix (144.8s) · G3a build PASS, VITE RAN, fresh dist 2026-08-25 05:34:55 · G3b bundle-check PASS-w/TRUE-warning total JS 2007.92KB gzip = 98.0% (~40KB headroom) · G4 vitest shard GREEN 29 files/920 tests IDENTICAL pre/post-fix.
- CORRECTION OF RECORD (D-007): original W1-A G4 figure (24 files/480 tests) RETRACTED — drifted inline command silently skipped 4 modules (vitest unmatched-filter no-op); file-anchored runs (29/920) are sole-authoritative. Squad standard: anchor shard invocations on the FILE.
- §8 stamps WRITTEN into CONSTITUTION_v5.md by W24 (engines 187/208; stores 42; tests 1,319 colocated; routes 228/32 targets, ROUTE_MAP --check exit 0; LOC 481,848 blank-inclusive primary / 437,772 strict secondary; third-witness independent recount exact match).
- AGENTS.md Pre-push Hooks section rewritten to mirror LIVE hook (11 gates incl. Gate-3 P0 financial/security shard + ratchet gates 9b–9g); stale canon zero remaining; pre-existing working-tree hunks attributed, untouched.
- OPEN items: (a) bundle pressure real (~40KB headroom) → vendor-diet lane advisable; (b) F6 dead filter safeJSONStorage.test.ts in live hook (module deleted; vitest silent-skip) → hook fix needed; (c) F5 benign test noise hygiene; (d) CONSTITUTION_v5.md is git-UNTRACKED → recommend Owner authorize commit for durable baseline; 9 untracked src files noted (tracked-vs-worktree recounts will differ).
