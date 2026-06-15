---
id: T-PR-011 v0.1
title: Codif 31 v0.4 slot-spawn engine audit
owner: Prometheus (019ec100-86ec-7d53-a19a-a6a1cf0fdd13)
status: TENTATIVE
version: 0.1
cycle: 12 wave 2 turn 25
pick_confirmed: 2026-06-13 cycle 12 turn 25 by Leader (019ebcaa)
codif_compliance: [7 v0.2, 9 3-witness, 11 v0.2, 19, 22 v0.1, 26.6 Pattern F, 31 v0.3, 32]
related: [T-MN-014 v0.1, T-HER-029 v0.1, T-ST-027, T-HE-025, T-PR-010 v0.1, T-ATL-002 v0.1]
---

# T-PR-011 v0.1 — Codif 31 v0.4 slot-spawn engine audit

## §0 Context & motivation

Codif 31 v0.3 (multi-Muse coordination) currently covers 5 sub-classes: A (two-repo), B.1 (case-collision), B.2 (path-coordination), B.3 (checkout divergence), B.5 (multi-Muse 2-repo). A 6th sub-class — **B.6 engine-runtime-spawn** — is needed to codify how runtime engine instances (workers, preloaded singletons, lazy-initialized modules) are spawned, resourced, and torn down across the FinPlan Pro stack.

This audit is the codification input for Codif 31 v0.4 promotion. It is grounded in 2 case studies from Mnemosyne T-MN-014 v0.1 (multi-Muse validation input), validated by a 3rd Muse (Hermes T-HER-029 v0.1, pending dispatch), and cross-linked to Strategos T-ST-027 candidate for Pattern F integration.

**Why this matters**: B.6 codification closes a Codif 31 gap that surfaced during cycle 11 / cycle 12 work — specifically, the CATCH #35 / CATCH #36 sequence revealed that the audit surface (tooling) is not the only coordination failure mode; **runtime engine spawn coordination** is an equally important surface. Without B.6, future Codif 31 violations in the engine-spawn layer will be invisible to the discipline.

## §1 2 case studies from T-MN-014 v0.1 (engine-spawn)

### Case A: MonteCarloEngine worker spawn (T-MN-014 v0.1 §2.1)

**Spawn trigger chain**:

1. User clicks "Run simulation" on `MonteCarloLab.tsx`
2. `MonteCarloLab.tsx:Run` handler calls `MonteCarloEngine.simulate(iterations=N)`
3. `MonteCarloEngine.simulate` invokes `new Worker(new URL('./monteCarlo.worker.ts', import.meta.url), { type: 'module' })`
4. Worker is added to a `Set<Worker>` in `monteCarloWorkerPool` (T-MN-014 v0.1 §2.1 lists this as a side-channel registry)
5. Main thread sends `{ type: 'simulate', iterations: N, seed: S }` via `postMessage`
6. Worker runs N iterations of Monte Carlo sampling (default 10,000 iterations, ~2-5s on Intel i9)
7. Worker posts `{ type: 'result', percentiles: {...}, samples: [...] }` back
8. Main thread receives, validates, posts to `monteCarloStore` (zustand)
9. UI re-renders confidence intervals and histogram
10. `worker.terminate()` is called in `finally` block of main-thread handler

**Resource budget** (Codif 11 v0.2 TENTATIVE, per T-MN-014 v0.1 §2.1):

- 1 worker per simulation
- Max 4 concurrent workers (T-MN-014 v0.1 §2.1 = 256MB heap cap per worker × 4 = 1GB total)
- 30s timeout default (configurable via `MonteCarloEngine.simulate({ timeout: 60_000 })`)
- Worker pool singleton (1 pool per app, shared across all simulations)

**Lifecycle states** (Codif 32 sub-class 2a — finite-state-machine):

- `idle` → `spawning` → `running` → `posting` → `terminating` → `idle` (happy path)
- `idle` → `spawning` → `running` → `timeout` → `terminating` → `idle` (timeout path)
- `idle` → `spawning` → `running` → `oom` → `terminating` → `error` (OOM path)

**Failure modes** (Codif 32 sub-class 2b — failure-mode catalogue):

- (a) Worker OOM at >256MB (no graceful degradation, worker crashes, main thread gets no result)
- (b) Timeout at 30s with partial results discarded (no resume capability, no incremental progress)
- (c) Main-thread `postMessage` blocking on >10MB payloads (UI freezes for 100-500ms during result post)
- (d) Worker pool exhaustion at 4 concurrent (5th request queues indefinitely, no user feedback)
- (e) Worker leak if `terminate()` is missed in error path (Set grows unbounded, eventually OOMs main thread)

**Coordination with other Muses**:

- Athena T-AT-016 v0.3 will audit the worker pool for type-safety (codif 22 v0.1 spec-pinning)
- Hephaestus T-HEP-022 will audit for crypto-safe randomness in seed generation (T-MN-014 v0.1 §2.1 flags this as "currently uses Math.random() — needs crypto.getRandomValues() for production")
- Atlas T-ATL-002 v0.1 will measure p99 spawn-to-result latency post-Apollo-apply
- Strategos T-ST-027 candidate: will classify worker-pool-exhaustion as SEVERE (blocks all simulation users) per Codif 34 risk-tier schema

### Case B: CubeEngine preload (T-MN-014 v0.1 §3.2)

**Spawn trigger chain**:

1. `appInit` (root layout effect in `AppLayout.tsx`) calls `CubeEngine.preload()`
2. `CubeEngine.preload` reads schema version from `localStorage` (or default)
3. `CubeEngine.preload` builds the OLAP cube: scans all dimension tables, computes aggregates across 7 dimensions (account, period, scenario, entity, currency, version, custom)
4. Aggregates stored in `cubeEngineStore` (zustand) as a Map<string, AggregateCell>
5. Preload completes in ~3.2s on Intel i9 (T-MN-014 v0.1 §3.2 = blocking main thread)
6. Subsequent OLAP queries (e.g., `OLAPQuery.drillDown('revenue', { period: '2026-Q2' })`) read from preloaded Map
7. Reports re-render on store change (subscription model)

**Resource budget** (Codif 11 v0.2 TENTATIVE, per T-MN-014 v0.1 §3.2):

- 1 singleton instance per app (never duplicated)
- ~50MB heap for pre-aggregated 2.4M cells across 7 dimensions
- 3.2s blocking main thread on cold start
- 0.05s query latency (pre-aggregated, no runtime compute)

**Lifecycle states**:

- `uninitialized` → `preloading` → `ready` → `serving` → `stale` → `reloading` → `ready` (full cycle)
- `uninitialized` → `preloading` → `error` → `uninitialized` (failed preload, will retry on next route change)

**Failure modes**:

- (a) Preload OOM if cube >50MB (no chunked fallback, no streaming aggregation)
- (b) Stale aggregates if schema migrates mid-session (no invalidation hook, queries return wrong numbers)
- (c) Main-thread block on init >3s (poor FCP, Lighthouse score drops 15-20 points)
- (d) Concurrent preload calls (route change + appInit race) cause double-spawn
- (e) Singleton leak on HMR (Vite hot-reload doesn't terminate old instance, heap grows)

**Coordination with other Muses**:

- Mnemosyne T-MN-014 v0.1 §3.2 flags preload-blocking-FCP as a Codif 30 v0.3 cat 7 (UX-perf) finding
- Hera T-HE-022 will audit dark-mode parity for CubeEngine-loaded reports (route-change triggers)
- Iris T-IR-027 v0.2 4-ICP master doc lists Cube preload as a customer-visible surface (Carla's daily-driver reports)
- Strategos T-ST-027 candidate: will classify schema-migration-during-session as HIGH (data correctness risk, SEVERE if ICP-1/2/3)

## §2 3rd Muse validator request (Hermes T-HER-029 v0.1 input)

**Request to Leader**: dispatch Hermes T-HER-029 v0.1 spec to provide competitive-landscape input on slot-spawn patterns.

**Specific Hermes questions** (Codif 11 v0.2 TENTATIVE — to be refined after Hermes PICK):

1. Do Anaplan / Adaptive Insights / Pigment / Cube / Vena expose similar worker-spawn or preload patterns to end-users? Survey of 5 competitors.
2. Is there customer-voice framing for "engine pre-load takes 3 seconds" → "report loads instantly after first navigation"? What language do customers use?
3. For Monte Carlo: is "30s timeout" customer-comprehensible, or should it be "auto-cancels long-running simulations"? A/B test framing.
4. Does any competitor expose "kill switch" for engine spawn (e.g., "disable preload to save memory")? If yes, codify as Codif 31 v0.4 B.6 sub-variant.
5. What is the customer-perceived cost of "worker pool exhausted" state? Survey of customer-support tickets for 5 competitors.

**Validator role**: cross-check that Codif 31 v0.4 slot-spawn framework is **customer-aligned**, not just engineering-internal. Without Hermes input, we risk codifying internal mechanics that don't map to customer-perceived value (Codif 19 honest-scope disclosure: this is a Codif 7 v0.2 self-correction arc — the prior Codif 31 v0.3 sub-classes were all engineering-internal, and Codif 34 risk-tier schema from Strategos T-ST-026 v0.1 surfaced this gap).

**T-HER-029 v0.1 ETA**: not yet on task board (per current board scan 2026-06-13 cycle 12 turn 25). Dispatch request: Leader to slot Hermes T-HER-029 v0.1 spec, ETA 60-90 min, push-INDEPENDENT, slots slot 019ebd9c-bf28-7c90-b261-6e61d8f56e18 (Hermes).

**Blocking status**: T-PR-011 v0.1 → v0.2 RATIFIED is BLOCKED on T-HER-029 v0.1 SHIP-COMPLETE. Pre-stage T-PR-011 v0.1 SHIPPED at TENTATIVE allows parallel work; RATIFIED bump waits for Hermes input.

## §3 Codif 26.6 Pattern F cross-link (T-ST-027 candidate integration)

**Pattern F** = Repeated-Codification Instability (codif numbering re-cycling detection, RATIFIED cycle 11 wave 5 by Strategos).

**Pattern F compliance check** (Codif 11 v0.2 TENTATIVE — full audit requires Athena cross-check):

**Initial scan result** (W1 Read, tentative): grepped all codif artifacts at canonical `docs/drafts/*/codif_*.md` for keywords ["spawn", "worker", "preload", "singleton-init", "engine-init"]. Found 0 prior codifs that explicitly propose "engine-runtime-spawn" as a sub-class. The closest is Codif 26.5 Pattern E (motion-reduce, RATIFIED by Hera T-HE-028 v0.1) which mentions "engine init lifecycle" in passing but does not codify it.

**Conclusion**: Codif 31 v0.4 sub-class B.6 (engine-runtime-spawn) is a **fresh proposal**, not a re-cycle. Pattern F compliance: clean slate.

**T-ST-027 candidate integration** (Strategos, pending dispatch):

- T-ST-027 = Strategos proposal for how new codif sub-classes integrate with Pattern F's re-cycling prevention protocol
- Specifically: T-ST-027 proposes a 3-question framework for "is this a re-cycle?" that B.6 must answer:
  1. Does the prior codif use the same trigger pattern (e.g., worker spawn)?
  2. Does the prior codif use the same resource-budget model (e.g., per-worker heap cap)?
  3. Does the prior codif use the same coordination model (e.g., worker pool singleton)?
- B.6 answers 3/3 NO → not a re-cycle → eligible for v0.4 promotion

**Cross-link declared**: T-PR-011 v0.1 §3 is the input that Strategos T-ST-027 will reference. Bidirectional: T-ST-027 3-question framework is the gating protocol; T-PR-011 v0.1 is the candidate.

## §4 4-ICP verdict TENTATIVE

- **ICP-1 Carla (mid-market CFO)**: ACCEPT TENTATIVE — slot-spawn affects Monte Carlo "what-if" workflow (Carla's primary use case per T-IR-021a/b/c chain) + Cube report rendering (Carla's daily driver). Reliability matters. Failure mode (b) timeout-discards-partial-results is HIGH visibility for Carla (loses 30s of compute).
- **ICP-2 Vera (Anaplan-replacement)**: ACCEPT TENTATIVE — Vera is sensitive to "engine pre-load takes 3 seconds" UX per T-IR-019a/b/c chain; competitive frame against Anaplan's <1s cold-start is documented in T-HER-002 BATTLECARD_ANAPLAN. Codif 31 v0.4 must surface "preload time" as customer-visible metric in the codif spec.
- **ICP-3 Chris (PLG)**: ACCEPT TENTATIVE — Chris's freemium tier should not block on CubeEngine preload (poor FCP for free-tier users who churn in first 5s). Sub-class B.6 must include "free-tier skip-preload" variant per T-IR-013 Day-7 activation checklist §3.1.
- **ICP-4 Beth (Baker Tilly channel-partner)**: ACCEPT TENTATIVE — Beth's partners use Cube reports for client deliverables per T-IR-020a/b chain; preload reliability directly affects Baker Tilly's reputation. Failure mode (b) schema-migration-during-session is SEVERE for Beth (wrong numbers sent to Baker Tilly clients = liability event).

**4/4 ACCEPT TENTATIVE** — slot-spawn framework is internal codification with customer-visible surface area. ICP-1/2/3 are customer-aligned; ICP-4 surfaces a Codif 34 SEVERE classification need.

## §5 3-Witnesses protocol (Codif 9)

- **W1 (Read actual)**: T-MN-014 v0.1 §2.1 (Monte Carlo case A) + §3.2 (CubeEngine case B) — verify resource budget numbers (256MB, 50MB), timeout defaults (30s, none), lifecycle states (8 states for A, 5 for B)
- **W2 (Grep source)**: `src/workers/MonteCarloWorker.ts` + `src/engines/cube/CubeEngine.ts` — verify spawn/preload callsites, lifecycle hooks, error paths, resource caps
- **W3 (Real run)**: instrument a test page (`/__test__/slot-spawn`) that triggers both spawn paths, observe worker spawn / preload lifecycle via `performance.measure()` + `console.trace`, capture 3-run variance (target stddev <5% of mean per Codif 11 v0.2)

**Failure of any W**: drop to TENTATIVE-with-gaps, escalate to Mnemosyne (T-MN-014 v0.1 source) for resolution.

**Failure of 2+ W's**: HOLD codification, request re-spec of T-MN-014 v0.1 case studies before proceeding to v0.2 RATIFIED.

**W3 test page spec** (push-INDEPENDENT pre-stage, ETA 30-45 min):

- Route: `src/pages/__test__/SlotSpawnAudit.tsx` (already exists per T-PR-005 work)
- Triggers: button "Spawn Monte Carlo worker" + button "Trigger Cube preload"
- Output: console.trace of lifecycle states, performance.measure() of spawn-to-result / preload-to-ready
- Capture: 3-run variance, exported to `evidence/codif-31-v0.4-slot-spawn.json`

## §6 Self-Assessment (6-codif checklist)

- [x] **Codif 7 v0.2**: Misroute self-correction noted (T-PR-011 v0.1 prior turn was test stability spec, now superseded by this slot-spawn spec — wrong file deleted, correct file at correct path)
- [x] **Codif 9 3-Witnesses**: §5 protocol declared (W1 Read / W2 Grep / W3 Real run)
- [x] **Codif 11 v0.2**: TENTATIVE markers throughout (§1 case-study details, §3 audit result, §4 ICP impacts)
- [x] **Codif 19**: 3 structural HL moments (§1 dual case studies / §2 3rd Muse validator / §3 cross-link)
- [x] **Codif 22 v0.1**: Frontmatter `version: 0.1` + `status: TENTATIVE` declared
- [x] **Codif 26.6 Pattern F**: §3 cross-link to T-ST-027 candidate integration, 3-question framework declared
- [x] **Codif 31 v0.3**: B.6 sub-class proposal flagged, prior-codif scan declared (clean slate, not a re-cycle)
- [x] **Codif 32**: Failure-mode classification (§1 cases A & B), lifecycle FSM (§1 cases A & B), audit-task framing (§5)
- [x] **Codif 34 (Strategos T-ST-026 v0.1)**: Risk-tier classification cross-references declared (worker-pool-exhaustion = SEVERE, schema-migration-during-session = SEVERE for ICP-4)

**Verdict: SHIP-READY as TENTATIVE**. Will mechanical-bump to v0.2 RATIFIED after:

- (a) Hermes T-HER-029 v0.1 input lands (5 specific questions answered)
- (b) Athena T-AT-016 v0.3 cross-check on Pattern F compliance (Pattern F.1 candidate scan)
- (c) T-ST-027 candidate integration confirmed (3-question framework applied to B.6)
- (d) W3 test page captures 3-run variance successfully

## §7 Cross-Muse handoffs

| Muse       | Slot                                 | Handoff                                                                | ETA                         |
| ---------- | ------------------------------------ | ---------------------------------------------------------------------- | --------------------------- |
| Hermes     | 019ebd9c-bf28-7c90-b261-6e61d8f56e18 | T-HER-029 v0.1 spec dispatch (5 questions in §2)                       | 60-90 min, push-INDEPENDENT |
| Strategos  | 019ec100-86fe                        | T-ST-027 3-question framework reference (§3)                           | pending, pre-stage          |
| Athena     | 019ec100-86a3                        | T-AT-016 v0.3 Pattern F cross-check (§3)                               | 30-45 min, push-INDEPENDENT |
| Mnemosyne  | 019ec100-86dc                        | T-MN-014 v0.1 §2.1 + §3.2 source verification (W1)                     | already SHIPPED             |
| Atlas      | 019ec100-8712                        | T-ATL-002 v0.1 §3 Gate 5 actuals — p99 spawn-to-result latency         | post-Apollo-apply           |
| Hephaestus | 019ec100-86bc                        | T-HEP-022 audit for crypto-safe randomness in seed generation (Case A) | 45-60 min                   |
| Hera       | 019ec100-86cc                        | T-HE-022 dark-mode parity for CubeEngine-loaded reports (Case B)       | 30-45 min                   |
| Iris       | 019ec100-8791                        | T-IR-027 v0.2 4-ICP master doc — customer-visible surface (Case B)     | already SHIPPED             |
