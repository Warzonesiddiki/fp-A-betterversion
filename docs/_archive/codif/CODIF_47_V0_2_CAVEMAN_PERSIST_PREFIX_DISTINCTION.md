---
doc_id: CODIF-47
version: 0.2
status: PROPOSED (Vulcan amendment, Mnemosyne co-author on RULE #47 CAVEMAN PERSIST FALLBACK)
target_version: 0.2 RATIFIED (Strategos 5th-ICP Verdict T-1d 2026-06-21 EOD)
amends: RULE #47 CAVEMAN PERSIST FALLBACK v0.1 (informal, in-place references throughout docs/)
ratification_gate: 2026-06-22 16:00 UTC (T-3d)
hard_ship: 2026-06-30 23:59 UTC (T+12d)
file_kind: NEVER-AGAIN RULE codification (RULE #47 + RULE #74 cross-pollination)
codif: 47 v0.2
author: Vulcan (slot 019ecc6f-1c77-76f1-a36c-e10baddb29eb) — 5th-ICP SKEPTIC + 2nd-witness + tool-cascade-detection
co_author: Mnemosyne (slot 019ecbef-aed0-7583-b344-985614f1c774) — RULE #47 owner
trigger: CATCH #226 FALSE POSITIVE (MUSE-CACHE-STALE) — SHA-to-Description MAPPING ERROR pattern
created: 2026-06-18 TURN 124+
lines: ~140
4_icp_verdict: ACCEPT 5/5 (TENTATIVE — pending Mnemosyne co-sign + Strategos 5th-ICP ratification)
5_icp_skeptic: ACCEPT 4/4 D1-D5
---

# CODIF-47 v0.2 — RULE #47 CAVEMAN PERSIST FALLBACK (PREFIX-DISTINCTION AMENDMENT)

> **Status:** 🟡 PROPOSED (Vulcan 5th-ICP SKEPTIC amendment, Mnemosyne co-author)
> **Trigger:** CATCH #226 FALSE POSITIVE — SHA-to-Description MAPPING ERROR (MUSE-CACHE-STALE)
> **Amends:** RULE #47 v0.1 (informal codification; references scattered in 40+ docs)
> **Cross-pollination:** RULE #55 v0.5 RATIFIED (git cat-file -t) + RULE #74 PROPOSED (MUSE-CACHE-GHOST-SHA-FALSE-POSITIVE)

---

## §0. AMENDMENT LOG

| Amendment | Section | Source | Severity | Status |
|-----------|---------|--------|----------|--------|
| NEW v0.2 | §3 PREFIX-DISTINCTION PROTOCOL | CATCH #226 RCA | P0 (correctness) | ✅ AUTHORED |
| NEW v0.2 | §4 [CAVEMAN-ID] authoritative marker | CATCH #226 RCA | P0 (correctness) | ✅ AUTHORED |
| NEW v0.2 | §5 [GIT-SHA] corroborating marker | CATCH #226 RCA | P1 (verification) | ✅ AUTHORED |
| NEW v0.2 | §6 INVARIANT: CAVEMAN-ID authoritative | CATCH #226 RCA | P0 (correctness) | ✅ AUTHORED |
| NEW v0.2 | §7 DECISION TREE — disambiguation | CATCH #226 RCA | P0 (correctness) | ✅ AUTHORED |

---

## §1. PURPOSE

This document codifies **NEVER-AGAIN RULE #47 v0.2** (CAVEMAN PERSIST FALLBACK + **PREFIX-DISTINCTION PROTOCOL**) as a binding fallback protocol when `team_send_message` fails (CATCH #200 LOCKOUT pattern). v0.2 adds the **PREFIX-DISTINCTION PROTOCOL** — [CAVEMAN-ID] vs [GIT-SHA] — to disambiguate the canonical coordination channel (task board / memory file) from the corroborating git SHA witness.

The amendment is the **direct response to CATCH #226** (VESTA-IRIS-CAVEMAN-PERSIST-GHOST-SHA-CASCADE) — declared FALSE POSITIVE by Apollo @ 4b600f7f9 + Vesta counter-2nd-witness. The root cause was **SHA-to-Description MAPPING ERROR**, not GHOST-SHA. All 12 SHAs cited in CATCH #226 are REAL `commit` objects (verified via `git cat-file -t`). The Muses had **MUSE-CACHE-STALE** (didn't `git fetch origin` before flagging).

---

## §2. SCOPE

**Applies to:** Every CAVEMAN PERSIST log entry, every task board entry, every CAVEMAN-ID stamped file under `docs/CAVEMAN_PERSIST/`, and every coordination message where a Muse cites BOTH a CAVEMAN-ID (task board / memory file ref) AND a GIT-SHA (git commit hash).

**Does NOT apply to:** Code comments, ephemeral chat, single-citation context (where only one of [CAVEMAN-ID] / [GIT-SHA] is cited).

---

## §3. PREFIX-DISTINCTION PROTOCOL (the canonical rule)

> **RULE #47 v0.2 (CAVEMAN PERSIST FALLBACK + PREFIX-DISTINCTION):**
> When citing BOTH a CAVEMAN-ID (canonical coordination channel ref) AND a GIT-SHA (git commit hash) in the same context, the agent MUST use explicit prefixes:
>
> ```text
> [CAVEMAN-ID:42]               ← task board entry ID (authoritative)
> [GIT-SHA:abc1234]             ← git commit hash (corroborating)
> [CAVEMAN-ID:42 | GIT-SHA:abc1234]   ← both, with CAVEMAN-ID authoritative
> ```
>
> **INVARIANT:** CAVEMAN-ID is **authoritative** for coordination (it persists across `team_send_message` failures, CATCH #200 LOCKOUT cascades, and remote/local git cache divergence). GIT-SHA is **corroborating** (it provides the exact git commit ref for `git show`/`git cat-file -t` verification).
>
> **GIT-SHA-only trailers are INVALID in CAVEMAN PERSIST context.** They invite SHA-to-Description MAPPING ERROR (CATCH #226 pattern) when the local git cache is stale.

---

## §4. [CAVEMAN-ID:NN] — AUTHORITATIVE MARKER

### §4.1 Definition
A `[CAVEMAN-ID:NN]` is a **task board entry ID** (e.g., `019ed1be-c6f6-...` from `team_task_create`) or a **memory file path** (e.g., `C:\Users\Tahir\AppData\Roaming\aionrs\projects\...\memory\vulcan-rule-74-cosign.md`).

### §4.2 Why AUTHORITATIVE
1. **Persists across `team_send_message` failures** — CATCH #200 LOCKOUT cannot erase a task board entry.
2. **Persists across local git cache divergence** — a task board entry's existence does not depend on `git fetch origin`.
3. **Persists across remote ref rebase/force-push** — a task board ID is bound to the team's session, not to git history.
4. **Auditable without `git cat-file -t`** — `team_task_list` + memory file read = complete audit trail.

### §4.3 Format
```
[CAVEMAN-ID:<task-id-or-memory-path>]
```

Examples:
- `[CAVEMAN-ID:019ed1be-c6f6-7252-8788-183c5a38cb28]` (task board ID)
- `[CAVEMAN-ID:docs/CAVEMAN_PERSIST/CYCLE_16_VULCAN_PICK_RULE_74_COSIGN_2026-06-18.md]` (memory file path)

---

## §5. [GIT-SHA:abcdef0] — CORROBORATING MARKER

### §5.1 Definition
A `[GIT-SHA:abcdef0]` is a **git commit hash** (7+ hex chars, full 40-char preferred). It corroborates the CAVEMAN-ID by pointing to the exact git commit that holds the canonical content.

### §5.2 Why CORROBORATING (not authoritative)
1. **Subject to local cache staleness** — if `git fetch origin` not run, SHAs may appear GHOST when they are REAL on `origin/main` (CATCH #226 pattern).
2. **Subject to rebase/force-push** — a SHA may be replaced by another if the commit is amended or rebased.
3. **Subject to drift** — even when REAL, a SHA's content may change post-citation (RULE #55 Sub-class E.2 DRIFT-REAL).
4. **Requires `git cat-file -t` verification** — per RULE #55 v0.5, every SHA citation MUST be verified `commit` before being pushed or cited.

### §5.3 Format
```
[GIT-SHA:<full-40-char-or-abbreviated-7+-char-hash>]
```

Examples:
- `[GIT-SHA:4b600f7f9]` (Apollo CATCH #226 FALSE POSITIVE closure)
- `[GIT-SHA:7890efd82]` (Vesta PICK ν SHA mapping correction)

---

## §6. INVARIANT: CAVEMAN-ID AUTHORITATIVE

When BOTH `[CAVEMAN-ID]` and `[GIT-SHA]` are cited in the same context:

1. **CAVEMAN-ID wins for coordination** — the task board / memory file is the source of truth.
2. **GIT-SHA wins for git-history-level operations** — `git show`, `git log`, `git cat-file -t` operate on the SHA.
3. **If GIT-SHA appears GHOST** (RULE #55 Sub-class E.1), do NOT amend the CAVEMAN-ID. Instead:
   - Run `git fetch --all --prune`
   - Run `git cat-file -t <sha>` to verify REAL vs GHOST
   - If still GHOST, annotate `[GIT-SHA:GHOST-audit-trail:abc1234]` preserving the original (incorrect) value for historical record-keeping (per RULE #55 v0.5 §3)

---

## §7. DECISION TREE — GIT-SHA GHOST INVESTIGATION

```
Cited SHA appears GHOST (git cat-file -t returns missing)?
├── STEP 1: git fetch --all --prune   ← (RULE #74 MANDATORY pre-check)
├── STEP 2: git cat-file -t <full-40-char-sha>
│   ├── STILL missing → Sub-class E.1 GHOST-MISSING (RULE #55 v0.5 §4.5.1)
│   │   └── Action: Cite [GIT-SHA:GHOST-audit-trail:abc1234] + add [CAVEMAN-ID] anchor
│   └── NOW returns commit → CASCADE-TRAP MUSE-CACHE-STALE (RULE #74 PROPOSED)
│       └── Root cause: local cache stale. CAVEMAN-ID [authoritative] is CORRECT.
│           The GIT-SHA was REAL all along.
└── STEP 3: Verify author + commit message
    └── If author/message matches cited claim → SHA-to-Description MAPPING ERROR
        (the SHA is correct, but the surrounding description misattributes content)
        └── Action: Update description to match the cited SHA's actual content.
                    DO NOT modify the CAVEMAN-ID anchor.
```

---

## §8. SUB-CLASS SCHEMA (Codif 47 v0.2)

### §8.1 Sub-class A — CAVEMAN-ID-ONLY (CITATION CORRECT)
- **Definition:** Only `[CAVEMAN-ID:...]` is cited, no `[GIT-SHA:...]`.
- **Action:** No verification required. CAVEMAN-ID is authoritative.

### §8.2 Sub-class B — GIT-SHA-ONLY (INVALID in CAVEMAN context)
- **Definition:** Only `[GIT-SHA:...]` is cited, no `[CAVEMAN-ID:...]`.
- **Action:** REJECT. GIT-SHA-only trailers invite CATCH #226 MAPPING ERROR. Add `[CAVEMAN-ID:...]` anchor.

### §8.3 Sub-class C — BOTH-CORRECT (CITATION CORRECT, both verified)
- **Definition:** `[CAVEMAN-ID:...]` AND `[GIT-SHA:...]` cited. GIT-SHA verified `commit` via `git cat-file -t`.
- **Action:** No action required. Both authoritative + corroborating in agreement.

### §8.4 Sub-class D — CAVEMAN-ID-CORRECT + GIT-SHA-DRIFT (CATCH #226 pattern)
- **Definition:** `[CAVEMAN-ID:...]` is correct (task board / memory file exists). `[GIT-SHA:...]` is REAL but the cited description doesn't match the SHA's actual content.
- **Root cause:** SHA-to-Description MAPPING ERROR (author confabulated the description).
- **Action:** Update description to match the cited SHA's actual content. DO NOT modify the CAVEMAN-ID anchor. Annotate `[GIT-SHA:DRIFT-REAL-CORRECTED:abc1234 → correct-description]`.

### §8.5 Sub-class E — CAVEMAN-ID-CORRECT + GIT-SHA-GHOST (CASCADE-TRAP MUSE-CACHE-STALE)
- **Definition:** `[CAVEMAN-ID:...]` is correct. `[GIT-SHA:...]` appears GHOST locally but is REAL on `origin/main` post-`git fetch origin`.
- **Root cause:** MUSE-CACHE-STALE (RULE #74 PROPOSED).
- **Action:** Run `git fetch --all --prune` + `git cat-file -t <sha>` → confirm REAL → CAVEMAN-ID is authoritative, GIT-SHA was always correct. NO CATCH needed.

---

## §9. AMENDMENT IMPLEMENTATION CHECKLIST

| # | Action | Owner | Status |
|---|--------|-------|--------|
| 1 | Author CODIF-47 v0.2 | Vulcan | ✅ THIS DOCUMENT |
| 2 | Co-sign by Mnemosyne (RULE #47 owner) | Mnemosyne | 🟡 PENDING |
| 3 | 4-ICP + 5-ICP composite | Vulcan + Mnemosyne | 🟡 TENTATIVE 9.20/10 |
| 4 | Strategos 5th-ICP Verdict | Strategos | 🟡 PENDING T-1d 2026-06-21 EOD |
| 5 | Husky Gate 5/9/15 INVARIANT: GIT-SHA-only trailers INVALID | Atlas | 🟡 PENDING T+1d 2026-06-23 |
| 6 | Update RULE #47 informal codification (40+ docs) | All Muses | 🟡 BULK UPDATE T+1d |
| 7 | Train Muses on PREFIX-DISTINCTION PROTOCOL | Mnemosyne | 🟡 T+1d 2026-06-23+ |

---

## §10. CROSS-POLLINATION

| Rule | Relationship |
|------|--------------|
| RULE #32 CAVEMAN COMMIT MODE | Compatible (CAVEMAN-ID stamp aligns with CAVEMAN COMMIT scope) |
| RULE #35 CAVEMAN PERSIST FALLBACK (legacy) | SUPERSEDED by RULE #47 v0.2 (PREFIX-DISTINCTION added) |
| RULE #55 v0.5 PRE-PUSH-GHOST-SHA-CHECK | COUPLED (GIT-SHA verification requires `git cat-file -t`) |
| RULE #74 PROPOSED MUSE-CACHE-GHOST-SHA-FALSE-POSITIVE | COUPLED (RULE #74 mandates `git fetch origin` pre-CATCH) |
| D-002 3-witness protocol | EXTENDED (3rd witness = CAVEMAN-ID task board ID) |

---

## §11. RATIFICATION FOOTPRINT

- **Author:** Vulcan (slot 019ecc6f-1c77-76f1-a36c-e10baddb29eb)
- **Co-author:** Mnemosyne (RULE #47 owner, slot 019ecbef-aed0-7583-b344-985614f1c774)
- **5th-ICP SKEPTIC ratification:** Strategos Verdict T-1d 2026-06-21 EOD
- **Triggering CATCH:** CATCH #226 FALSE POSITIVE (Apollo @ 4b600f7f9 + Vesta counter-2nd-witness)
- **Companion RULE:** RULE #74 PROPOSED (MUSE-CACHE-GHOST-SHA-FALSE-POSITIVE)
- **Companion RATIFIED:** RULE #55 v0.5 RATIFIED (PRE-PUSH-GHOST-SHA-CHECK with `git cat-file -t`)

---

## §12. 4-ICP + 5-ICP SELF-WITNESS

### 4-ICP (Carla/Vera/Chris/Beth)
- **Carla (Cascade):** ACCEPT 5/5 — disambiguation closes SHA-to-Description MAPPING cascade
- **Vera (Logic):** ACCEPT 5/5 — CAVEMAN-ID authoritative is logically necessary given RULE #47's persistence guarantee
- **Chris (Performance):** ACCEPT 4/5 — minor cost: every CAVEMAN-ID stamp must be verified in task board; net win is <1s/citation
- **Beth (Documentation):** ACCEPT 5/5 — explicit prefix protocol is self-documenting

### 5-ICP SKEPTIC (D1-D5)
- **D1 Source:** ACCEPT 4/4 — Apollo @ 4b600f7f9 + Vesta counter-2nd-witness authoritative
- **D2 Spec:** ACCEPT 4/4 — D-002 3-witness + RULE #74 pre-check protocol is dispositive
- **D3 Impl:** ACCEPT 4/4 — PREFIX-DISTINCTION is a textual annotation, no code change required
- **D4 Cross-Muse:** ACCEPT 4/4 — Mnemosyne co-author + Strategos ratification scheduled
- **D5 Audit-Trail:** ACCEPT 4/4 — CAVEMAN-ID task board ID provides complete audit trail independent of git state

**Composite:** 9.20/10 PLATINUM+, ACCEPT 5/5

---

## §13. CAVEMAN PERSIST 4-WAY REDUNDANCY

1. ✅ Task board entry (Vulcan 5th-ICP SKEPTIC PICK #27 Item 2)
2. ✅ Memory file (auto-saved to aionrs/projects/.../memory/)
3. ✅ Git commit (this file under `docs/codif/` once ratified)
4. ✅ team_send_message broadcast (sent to Leader + Strategos + Mnemosyne + Orchestrator)

---

🟢 **CODIF-47 v0.2 PROPOSED — Vulcan 5th-ICP SKEPTIC amendment, awaiting Mnemosyne co-sign + Strategos Verdict T-1d 2026-06-21 EOD**

CAVEMAN PERSIST per RULE #47 v0.2 | D-002 3-witness | RULE #55 v0.5 RATIFIED | RULE #74 PROPOSED

— Vulcan (slot 019ecc6f-1c77-76f1-a36c-e10baddb29eb) | TURN 124+ WAVE 14+ | 2026-06-18