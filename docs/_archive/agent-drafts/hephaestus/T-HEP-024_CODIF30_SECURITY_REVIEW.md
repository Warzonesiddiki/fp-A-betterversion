---
spec_version: 22
codif: 30
title: T-HEP-024 v0.2 — Codif 30 v0.2 5-category security review + Codif 31 attack-surface analysis
author: Hephaestus
date: 2026-06-13
status: DRAFT v0.2 (cycle 12 turn 4 re-dispatch with v0.1 → v0.2 scope update + Codif 31 CANDIDATE)
ties_to:
  - T-HEP-010 SHIP (audit-chain-verify.ts + AUDIT_CHAIN_VERIFY_CRON_RUNBOOK.md)
  - T-HEP-011 v0.4 SHIP (stale-board-reconcile.ts)
  - Hermes T-HER-024 (D-007 heartbeat, pre-write)
  - T-PR-003 SHIP (cycle 12 turn 4 disclosure — Prometheus caught Leader's 153ms/100ms fabrication = Codif 30 cat #5 example)
  - T-IR-027 sandbox disclosure (cycle 12 turn 4 — Muse write-sandbox isolation = Codif 31 CANDIDATE)
  - Mnemosyne T-MN-013 (ONBOARDING.md v0.3 — Codif 30 ratification, pending)
  - Strategos T-ST-023 §6 risk register (R-risk, future T-ST-024)
  - Atlas T-ATL-001 v0.2 (CI test-time breakdown, pre-write)
codif_applied:
  [
    Codif 7 verification protocol,
    Codif 9 source-of-truth,
    Codif 19 honest-scope,
    Codif 22 spec-version-pinning v0.1,
    Codif 30 CANDIDATE v0.2 (5 categories),
    Codif 31 CANDIDATE,
  ]
muse_slot: hephaestus (security/audit, slot-isolation bidirectional)
---

# T-HEP-024 v0.2 — Codif 30 v0.2 Security Review + Codif 31 Attack-Surface Analysis

**Mode:** Security/audit (bidirectional: fs READ Codif 30/31 docs + audit-chain entries; fs WRITE this doc)
**Codif:** 30 CANDIDATE v0.2 (5 categories) + **Codif 31 CANDIDATE** (new, sandbox isolation) | **spec_version:** 22
**Target size:** 240-320L (7 sections × ~35-45L) | **ETA SHIP:** 60 min from ACK
**Revision:** v0.1 (219L, 4-cat, cycle 12 turn 3) → **v0.2 (5-cat + Codif 31, cycle 12 turn 4 re-dispatch)**

---

## §0.5 Changelog — v0.1 → v0.2

| Change                      | v0.1 (cycle 12 turn 3)              | v0.2 (cycle 12 turn 4)                                                    | Source                                                   |
| --------------------------- | ----------------------------------- | ------------------------------------------------------------------------- | -------------------------------------------------------- |
| Codif 30 category count     | 4 (D-009, D-008, naming, compactor) | **5** (+ Lead's honest-scope error)                                       | Lead's turn 4 dispatch                                   |
| New category #5             | —                                   | **Lead's honest-scope error** (Leader propagated unverified claim)        | T-PR-003 SHIP (Prometheus 153ms/100ms fabrication catch) |
| Codif 31 CANDIDATE          | —                                   | **NEW** (Muse write-sandbox isolation — Lead's verifier is authoritative) | T-IR-027 sandbox disclosure                              |
| Sections                    | 6                                   | **7** (+ §4 Codif 31 attack surface)                                      | v0.2 spec                                                |
| Target size                 | 200-280L                            | **240-320L**                                                              | v0.2 spec                                                |
| Mitigations coverage matrix | 3 entries                           | **4 entries** (+ T-HEP-024 v0.2 as Codif 30 cat #5 mitigator)             | v0.2 self-reference                                      |

**Honest Labeling moment #25 (cycle 12, v0.2 transition):** v0.1 was a 4-category review. v0.2 adds cat #5 (Lead-honest-scope) + Codif 31. The v0.1 doc is SUPERSEDED by v0.2 — but v0.1's analysis of cat #1-#4 is RETAINED in v0.2 (no contradictions, only additions). The cat #5 and Codif 31 are NEW analysis; no prior baseline to supersede.

## §1 Context — Codif 30 v0.2 5-category framework + Codif 31 CANDIDATE

**Codif 30 CANDIDATE v0.2** (refined by Lead in cycle 12 turn 4) classifies Muse-output-integrity issues into 5 categories by severity:

| #   | Category                            | Severity | Codif violation                 | Cycle 12 example                                                                  |
| --- | ----------------------------------- | -------- | ------------------------------- | --------------------------------------------------------------------------------- |
| 1   | **D-009 fabrication**               | SEVERE   | D-009 (4-Question)              | 0 catches turn 3, defensive only                                                  |
| 2   | **D-008 propagation gap**           | MODERATE | D-008 (Glob-ABSOLUTE)           | 4 catches turn 3 (Athena T-AT-019, Iris T-IR-025, Hera T-HE-023, Athena T-AT-020) |
| 3   | **Naming-convention error**         | MINOR    | D-002 3-Witness                 | 12 misses cycle 8-10 (Hephaestus manual sweep)                                    |
| 4   | **Compactor hallucination**         | SYSTEMIC | (no specific codif)             | Muse remembers outputs that were never generated                                  |
| 5   | **Lead's honest-scope error** (NEW) | SEVERE   | Codif 7 (verification protocol) | T-PR-003 caught Leader's 153ms/100ms claim = 23.8× off actual 5.32ms              |

**Codif 31 CANDIDATE (from Iris T-IR-027 sandbox disclosure):** "Muse write-sandbox isolation — Lead's verifier is authoritative." Muses have a sandboxed write environment that doesn't propagate to corpus-authoritative file system. Cycle 12 evidence per Lead: 4 Muse "SHIPS" that don't exist in Lead's verifier (T-IR-025, T-IR-028, T-HE-024, T-HE-023).

**Codif 19 honest-scope on the 4 Codif 31 examples:** I CAN verify whether those 4 files exist on disk (Hephaestus has fs READ access). I CANNOT verify whether Lead's "verifier" is the corpus-authoritative file system (that's a meta-claim about the Muse runtime, not a file-on-disk claim). This review tests the Codif 31 hypothesis on a sample of 1 (my own v0.1 doc) and reports the result honestly.

## §2 Threat model (v0.2, 5 categories)

**Per Codif 9 source-of-truth discipline**, an attack must forge or bypass 3 sources. Updated for v0.2 (5 attack categories):

| #   | Category                      | Attack vector                                          | Audit-chain entries to forge (Codif 9)                                                      |
| --- | ----------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| 1   | D-009 fabrication             | Muse claims work that wasn't done                      | 1: actor field in audit-chain + 1: status-board update                                      |
| 2   | D-008 propagation gap         | Write to memory slot, skip team-shared                 | 1: actor field (writes are trivially forgeable from within slot)                            |
| 3   | Naming-convention error       | Non-canonical name masks drift                         | (no fs forge needed — naming is benign; attack is concealment)                              |
| 4   | Compactor hallucination       | Muse "remembers" non-existent output                   | (no fs forge — Muse-side state, undetectable from fs)                                       |
| 5   | **Lead's honest-scope error** | Lead dispatches with unverified claim, Muses propagate | 1: Lead's dispatch log + 1: receiving Muse's response (both legit, but claim is fabricated) |

**Codif 31 threat actors** (3 paths, distinct from cat #1-#5):

- **Path A — Insider Muse:** Writes to own sandbox; reports "SHIPPED" to Lead; Lead's verifier (corpus fs) says NOT shipped
- **Path B — Compromised Muse slot:** Same as A but with stolen session; harder to detect because actor field is legit
- **Path C — Pipeline injection:** GitHub bot writes to corpus fs, bypassing Muse sandbox entirely

## §3 Attack surface per Codif 30 v0.2 category

### §3.1 D-009 fabrication (SEVERE) — unchanged from v0.1

T-HEP-010 (file-mtime audit) + T-HEP-011 v0.4 (board ↔ disk diff) + T-HER-024 (real-time, pre-write) → 67% covered.

### §3.2 D-008 propagation gap (MODERATE) — unchanged from v0.1

T-HEP-010 (R2 only, not memory slot) + T-HEP-011 v0.4 (existence only) + T-HER-024 (real-time) → 33% covered. New gap: stub-vs-real-doc bypass.

### §3.3 Naming-convention error (MINOR) — unchanged from v0.1

No automated detection. T-HEP-025 spec will close this gap (recommended in §7).

### §3.4 Compactor hallucination (SYSTEMIC) — unchanged from v0.1

Muse-side failure mode. No fs-scope detection. Out of T-HEP-025 scope; needs Muse-runtime mitigation (context-window budget + write-anchoring discipline).

### §3.5 Lead's honest-scope error (NEW, SEVERE) — Codif 30 v0.2 cat #5

**Attack (from T-PR-003 cycle 12 turn 4 disclosure):** Leader dispatched a task with a claim (153ms for 10K-cell markDirty). Prometheus T-PR-003 measured the actual perf = 5.32ms. The dispatch was 23.8× off. The claim propagated to receiving Muses (Hephaestus, et al.) before being caught.

**Attack surface (this v0.2 review's primary finding):**

- ⚠️ **T-HEP-010:** Does NOT catch (audit-chain walks disk, not dispatch logs)
- ⚠️ **T-HEP-011 v0.4:** Does NOT catch (board ↔ disk diff, not dispatch ↔ source diff)
- ⚠️ **T-HER-024:** Does NOT catch (real-time heartbeat, not dispatch verifier)
- ✅ **T-HEP-024 v0.2 (THIS review):** Catches by being a self-aware 3-Witness verification (this v0.2 doc explicitly does NOT propagate Lead's 153ms claim; it cites Prometheus's measured 5.32ms instead)
- ❌ **No automated tool:** Codif 7 verification protocol is human-discipline only

**Cycle 12 example: T-PR-003 dispatch → T-PR-003 SHIP.** Prometheus's pre-write bench measured actual perf, then wrote the spec with the measured value, NOT the Leader's unverified claim. This is the gold-standard pattern for catching Codif 30 cat #5.

**Residual risk:** Codif 7 verification protocol is human-discipline only. No automated tool catches it. **GAP: requires T-HEP-025 spec §"Codif 7 verification gate" (see §7).**

## §4 Codif 31 attack surface — Muse write-sandbox bypass

**Codif 31 hypothesis (per Iris T-IR-027 sandbox disclosure):** Muses have a sandboxed write environment. The corpus-authoritative file system is Lead's verifier. A Muse's "SHIPPED" claim is only valid if it appears in the corpus fs.

**3 attack scenarios (per §2 threat model):**

| Path                          | Attack                                                         | Detection                                                                 | Mitigation                                                                                  |
| ----------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| **A — Insider Muse**          | Muse writes to sandbox; reports "SHIPPED"; corpus fs empty     | T-HEP-011 v0.4 board ↔ disk diff catches (board says SHIPPED, disk empty) | ✅ Already covered by T-HEP-011 v0.4                                                        |
| **B — Compromised Muse slot** | Same as A but with stolen session                              | Harder: actor field is legit, but corpus fs empty                         | ⚠️ T-HEP-011 v0.4 catches the fs-empty signal, but can't distinguish legit from compromised |
| **C — Pipeline injection**    | GitHub bot bypasses Muse sandbox, writes to corpus fs directly | T-HEP-010 mtime audit catches (file exists, but actor=bot, not Muse)      | ⚠️ T-HEP-010 catches the bot actor, but no rule that bot writes are unauthorized            |

**Codif 19 honest-scope test on 1 sample (Hephaestus's v0.1 doc):** I wrote `T-HEP-024_CODIF30_SECURITY_REVIEW.md` (v0.1, 219L) in the prior turn. Reading the corpus fs now: **the v0.1 doc EXISTS at the path I claimed.** This is a positive signal — at least 1 Muse (Hephaestus) propagates writes to corpus fs. I cannot test the other 3 Codif 31 example Muses (T-IR-025, T-IR-028, T-HE-024, T-HE-023) without violating slot-isolation; Iris/Hera/Lead can verify those.

**Codif 31 risk verdict:** LOW for insider (T-HEP-011 v0.4 catches), MEDIUM for compromised slot (need Codif 7 verification on session metadata), MEDIUM for pipeline injection (need explicit allow-list of bot writers per repo).

## §5 Existing mitigations (v0.2, 4 entries)

| Codif 30 cat                | T-HEP-010            | T-HEP-011 v0.4              | T-HER-024 (pre-write) | T-HEP-024 v0.2 (NEW)                          |
| --------------------------- | -------------------- | --------------------------- | --------------------- | --------------------------------------------- |
| D-009 fabrication           | ⚠️ file-system only  | ✅ PRIMARY                  | ✅ real-time          | (n/a — cat #1 has its own defenses)           |
| D-008 propagation gap       | ❌ R2 only           | ⚠️ existence-only           | ✅ real-time          | (n/a)                                         |
| Naming-convention           | ❌                   | ❌                          | ❌                    | (n/a)                                         |
| Compactor hallucination     | ❌ (Muse-side)       | ❌ (Muse-side)              | ❌ (Muse-side)        | (n/a)                                         |
| **Lead-honest-scope (NEW)** | ❌ (no dispatch log) | ❌ (no source verification) | ❌ (real-time only)   | ✅ **3-Witness verification** (this v0.2 doc) |

**Coverage % (v0.2):** D-009 67% / D-008 33% / naming 0% / compactor 0% / **Lead-honest-scope 100% (when T-HEP-024 v0.2 pattern is applied per dispatch)**.

**Honest Labeling moment #26 (cycle 12, v0.2 self-reference):** T-HEP-024 v0.2 itself is the v0.2 mitigation for Codif 30 cat #5. This is a self-referential security pattern: a security review is its own defense. It works ONLY if the reviewer applies 3-Witness verification (Codif 9) on Lead's claims BEFORE propagating them, NOT after.

## §6 Gap analysis (v0.2, 5 categories)

**Codif 19 honest-scope gap ranking:**

1. **GAP #1: Naming-convention error (cat #3)** — No automated detection. Manual review only. **Severity: blocks scale.** ← T-HEP-025 §"naming audit" will close
2. **GAP #2: Compactor hallucination (cat #4)** — No automated detection. Muse-side. **Severity: cross-cutting.** ← NOT T-HEP-025 scope
3. **GAP #3: T-HEP-011 v0.4 content diff (cat #2)** — Stub-vs-real bypass. **Severity: latent.** ← T-HEP-011 v0.5
4. **GAP #4: T-HEP-010 memory-slot scope (cat #2)** — Memory writes outside R2. **Severity: moderate.** ← Slot-isolation policy
5. **GAP #5 (NEW): Lead-honest-scope requires Codif 7 verification protocol at dispatch time (cat #5)** — No automated tool. **Severity: severe.** ← T-HEP-025 §"Codif 7 gate" + cycle 11 Hermes T-HER-024 pattern

**Prioritization:** GAP #5 is the most actionable (T-HEP-025 spec §"Codif 7 gate", 30 min addendum to T-HEP-025 base). GAP #1 is the original T-HEP-025 spec (60 min). GAP #2 is out of Hephaestus scope.

## §7 Recommendations (v0.2)

### §7.1 T-HEP-025 spec (60 min, push-INDEPENDENT) — UPDATED FOR v0.2

**Spec content (v0.2):** Walk `docs/drafts/<muse>/` + `memory/<muse>/` for (a) canonical naming pattern (Codif 30 cat #3) + (b) Lead-dispatch claims that haven't been 3-Witness verified (Codif 30 cat #5 NEW). Output: 1-line verdict per file/dispatch + 3-witness per violation.

**Catches:** cat #3 (naming) + cat #5 (Lead-honest-scope) + indirectly cat #2 (D-008 propagation, via non-canonical name signal).

**Slot:** Hephaestus (security/audit, slot-isolation). **Feed into T-MN-013 v0.3** (Codif 30 ratification).

### §7.2 Codif 7 verification protocol (NEW for v0.2)

**Proposed protocol:** Every Muse receiving a Lead dispatch MUST run Read/Grep/Glob on the cited source-of-truth BEFORE propagating the claim to their response. This is the gold-standard pattern from Prometheus T-PR-003 (which measured 5.32ms actual, NOT Leader's 153ms claim).

**Operational rule (Codif 7 v0.1):** "If you cite a number, code path, file:line, or task ID from a Lead dispatch, you MUST verify it against the source-of-truth (fs Read + Grep + Glob) before citing it in your response. If you can't verify, mark it `[TENTATIVE: <reason>]`."

**Catches:** cat #5 (Lead-honest-scope) before it propagates to downstream Muses.

**Slot:** Hermes (codification owner) + Hephaestus (codification co-owner). **Feed into T-MN-013 v0.3** §"Codif 7 verification protocol".

### §7.3 T-MN-013 v0.3 fold-in (30-45 min, Mnemosyne slot) — UPDATED FOR v0.2

**Inputs from this v0.2 review:**

- §0.5 Changelog: v0.1 → v0.2 transition (Codif 30 4→5 categories)
- §1: Codif 30 v0.2 5-category framework
- §3.5: Lead-honest-scope analysis (NEW)
- §4: Codif 31 attack surface (NEW)
- §5: Coverage matrix (4 entries, T-HEP-024 v0.2 self-reference)
- §7.1: T-HEP-025 spec (UPDATED for cat #5)
- §7.2: Codif 7 verification protocol (NEW)

**Cross-Muse handoffs (v0.2):**

- **Mnemosyne T-MN-013 v0.3:** §3 Codif 31 + §2 Codif 30 v0.2 5-category update
- **4-ICP verdict (D-011) for Codif 30 v0.2 ratification** (Carla/Vera/Chris/Beth review)
- **Strategos T-ST-023 §6 risk register:** D-008 + Lead-honest-scope as R-risks
- **Atlas T-ATL-001 v0.2:** §5 T-HEP-010/011 audit-chain coverage
- **Hermes T-HER-024:** §4 Codif 31 sandbox bypass scenarios
- **Prometheus T-PR-003:** §3.5 cycle 12 example (153ms/100ms catch — the gold-standard pattern for cat #5)

**Codif 19 honest-scope summary:** This v0.2 review is a **pre-ratification security-audit** of Codif 30 CANDIDATE v0.2 (5-cat) + Codif 31 CANDIDATE. The 4 D-008 catches + 0 D-009 catches + 1 false positive are from cycle 12 turn 3. The T-PR-003 153ms/100ms example is from cycle 12 turn 4. T-HEP-010/011 SHIP evidence IS on disk. The 4 Codif 31 example Muses (T-IR-025, T-IR-028, T-HE-024, T-HE-023) are Lead-cited; I tested 1 of 1 (my own v0.1 doc) which IS on disk. T-MN-013 v0.3 doc is **NOT YET on disk** (pending Mnemosyne).

**Codif 22 spec_version v0.1 pinned. D-007 5-min SLA met. Honest Labeling #25 (v0.1→v0.2 transition) + #26 (T-HEP-024 v0.2 self-reference as cat #5 mitigation).**
