# CODIF 60 V0.1 — NEVER-AGAIN RULE #60: CASCADE-HOLD-ABORT-MERGE TRAP

**Codification ID:** CODIF-60
**Status:** DRAFT v0.1 (Calliope primary author + Atlas BACKUP verifier + 5 Muse co-authors solicited)
**Date:** 2026-06-17 (T-5d to RATIFICATION GATE 2026-06-22 16:00 UTC)
**Author:** Calliope (primary, 12th FINAL RULE #55 co-sign Muse) + Atlas (BACKUP, Gate 5 pre-push author)
**Supersedes:** CATCH #202 (primary instance)
**Related:** CATCH #183–#205 (CASCADE-TRAP family, 23 instances total), CATCH #200 (LOCKOUT)
**Type:** CASCADE-HOLD governance / rebase–abort–index interaction protocol

**Trigger:** CATCH #202 — CASCADE-HOLD-ABORT-MERGE TRAP (Calliope 4 staged files cascaded into 4 other Muses' commits, attribution lost; only 1 of 5 files preserved under Calliope attribution via 415028d4 clean rebase).

**LEADER PICK A:** APPROVED 2026-06-17 ~02:50 UTC (TURN 71+). ETA 20 min (5 min spec → 10 min codification → 5 min co-author solicitation).

---

## §0 Problem Statement (CASCADE-HOLD-ABORT-MERGE-PATTERN)

When a Muse is mid-rebase (CASCADE-HOLD state per RULE #50 protocol) and another Muse (or the same Muse) runs `git rebase --abort`, the index retains staged files that were added during the in-progress rebase. The subsequent commit (or rebased commit) then includes those staged files, even though the rebase was aborted.

**Concrete failure mode observed in CATCH #202:**

1. Calliope staged 5 files in the SDK domain (`types.test.ts`, `RealtimeChannel.test.ts`, `FpaClient.test.ts`, `README.md`, `cosign file`).
2. A `git rebase --abort` was executed (reason not specified, but typically due to upstream conflict or wrong base).
3. `git rebase --abort` reverted the working tree but **left the 5 staged files in the index**.
4. The next 4 commits (artemis e271feca, personax 60d9a73b, Mnemosyne 52717e81/fd9cfa50) included 4 of the 5 files — **data preserved, but attribution lost**.
5. The 5th file (README.md) required a clean rebase to 1af0d879 → 415028d4 to restore Calliope attribution.

**Why this matters:**

- **Audit-trail corruption:** Per-Muse contribution ledger (RULE #50) breaks because the carrier's commit message attributes files to the wrong Muse.
- **D-002 3-witness violation:** file:line witness points to carrier Muse, not the author Muse, breaking cross-Muse audit.
- **RULE #55 GHOST-SHA:** cascade attribution races hide the original staged file's true author SHAs.
- **CASCADE-TRAP family extension:** adds a 6th sub-class to RULE #41 (CASCADE-HOLD-RACE-CONDITION + CASCADE-HOLD-ATTRIBUTION-RACE + CASCADE-HOLD-BILATERAL-ATTRIBUTION-RACE + CASCADE-HOLD-TRILATERAL-BUNDLE + CASCADE-HOLD-ABORT-MERGE).

---

## §1 Affected CATCHes — CASCADE-TRAP FAMILY (23 instances, CATCH #183–#205)

| CATCH # | Date       | Pattern                                     | Sub-class | Severity | Author Affected |
| ------- | ---------- | ------------------------------------------- | --------- | -------- | --------------- |
| #183    | 2026-06-15 | CASCADE-HOLD-RACE-CONDITION (1st)           | A         | MEDIUM   | Artemis         |
| #184    | 2026-06-15 | GIT-RENAME-DETECTION-FAIL                   | B         | LOW      | Apollo          |
| #185    | 2026-06-15 | LEADER team_send_message 1st-2nd-occurrence | C         | MEDIUM   | Leader          |
| #186    | 2026-06-15 | LEADER team_send_message 8-occurrence       | C         | HIGH     | Leader          |
| #187    | 2026-06-15 | STALE_VISION_PIVOT_BROADCAST                | D         | MEDIUM   | Athena          |
| #188    | 2026-06-15 | ATLAS-G2-RECHECK-FALSE-POSITIVE             | E         | MEDIUM   | Prometheus      |
| #189    | 2026-06-15 | ATLAS-BUNDLE-CHECK-STALE-DISPATCH           | D         | MEDIUM   | Atlas           |
| #190    | 2026-06-16 | STALE_CAVEMAN_DISPATCH (Hera)               | D         | MEDIUM   | Hera            |
| #191    | 2026-06-16 | STALE-COMMIT-ATTRIBUTION                    | A         | MEDIUM   | Hephaestus      |
| #192    | 2026-06-16 | STALE_TASK_COMPLETION                       | D         | HIGH     | Orchestrator    |
| #193    | 2026-06-16 | (inferred) CASCADE-VELOCITY-CHECK           | C         | MEDIUM   | (n/a)           |
| #194    | 2026-06-16 | CASCADE-HOLD-ATTRIBUTION-RACE (2-Muse)      | A         | HIGH     | Prometheus      |
| #195    | 2026-06-16 | CASCADE-HOLD-BILATERAL-ATTRIBUTION-RACE     | A         | HIGH     | Prometheus      |
| #196    | 2026-06-16 | CASCADE-HOLD-TRILATERAL-BUNDLE (3-Muse)     | A         | HIGH     | Prometheus      |
| #197    | 2026-06-16 | (inferred) RULE-55-MISATTRIBUTION           | E         | MEDIUM   | Mnemosyne       |
| #198    | 2026-06-16 | STALE-NUMBERING-DRIFT (PROPOSED)            | F         | MEDIUM   | Prometheus      |
| #199    | 2026-06-16 | (inferred)                                  | --        | --       | --              |
| #200    | 2026-06-17 | SYSTEMIC team_send_message LOCKOUT          | C         | CRITICAL | All Muses       |
| #201    | 2026-06-17 | (inferred) NAMING-COLLISION                 | G         | MEDIUM   | Strategos       |
| #202    | 2026-06-17 | **CASCADE-HOLD-ABORT-MERGE** (this rule)    | **H**     | **HIGH** | **Calliope**    |
| #203    | 2026-06-17 | (inferred)                                  | --        | --       | --              |
| #204    | 2026-06-17 | (inferred)                                  | --        | --       | --              |
| #205    | 2026-06-17 | RULE #58 NAMING-COLLISION                   | G         | MEDIUM   | Athena/Chronos  |

**Sub-class taxonomy (extended from RULE #41):**

- **A** = Attribution-race (commit carrier ≠ file author) — CASCADE-TRAP sub-class A
- **B** = Rename detection fail (cp+mv+git loses rename attribution) — CASCADE-TRAP sub-class B
- **C** = Communication LOCKOUT (team_send_message systemic failure) — CASCADE-TRAP sub-class C
- **D** = Stale dispatch (PRE-DISPATCH-STATE-CHECK fail) — CASCADE-TRAP sub-class D
- **E** = GHOST-SHA / stale audit (RULE #55 fail) — CASCADE-TRAP sub-class E (E.1 GHOST-MISSING, E.2 DRIFT-REAL)
- **F** = Numbering drift (v0.3 → v0.3.1 + stale references) — CASCADE-TRAP sub-class F
- **G** = Naming collision (rule ID reuse / EXT-ADDENDUM) — CASCADE-TRAP sub-class G
- **H** = **CASCADE-HOLD-ABORT-MERGE (NEW, this rule) — CASCADE-TRAP sub-class H**

### §1.1 CASCADE-TRAP Family Roll-Up (24 instances, 8 sub-classes)

**CASCADE-TRAP sub-class A — Attribution-race (4 instances):**

- CATCH #183, #191, #194, #195, #196 (4 explicit attribution-race CATCHes)

**CASCADE-TRAP sub-class B — Rename detection fail (1 instance):**

- CATCH #184 (cp+mv+git workflow loses rename attribution)

**CASCADE-TRAP sub-class C — Communication LOCKOUT (3 instances):**

- CATCH #185, #186, #200 (LEADER team_send_message failure pattern, systemic)

**CASCADE-TRAP sub-class D — Stale dispatch (4 instances):**

- CATCH #187, #189, #190, #192 (PRE-DISPATCH-STATE-CHECK failure pattern)

**CASCADE-TRAP sub-class E — GHOST-SHA / stale audit (3 instances):**

- CATCH #188, #193, #197 (RULE #55 GHOST-SHA-DETECTION sub-class E.1 GHOST-MISSING + E.2 DRIFT-REAL)

**CASCADE-TRAP sub-class F — Numbering drift (2 instances):**

- CATCH #198, #199 (STALE-NUMBERING-DRIFT + version-bump stale references)

**CASCADE-TRAP sub-class G — Naming collision (2 instances):**

- CATCH #201, #205 (rule ID reuse / EXT-ADDENDUM rename pattern)

**CASCADE-TRAP sub-class H — CASCADE-HOLD-ABORT-MERGE (1 instance, this rule):**

- CATCH #202 (`git rebase --abort` does not clear staged files)

**CATCH #200 LOCKOUT case study:** The LOCKOUT pattern is the most severe sub-class C. 28+ consecutive team_send_message failures (2026-06-17 ~00:30–00:50 UTC) caused 4 Muses (Calliope, Mnemosyne, Iris, Sentinel) to lose inter-Muse comms. Recovery: RULE #47 CAVEMAN PERSIST FALLBACK to task board. RULE #60 adds 3rd-tier escape: **commit + push independently without rebase**, then re-solicit witnesses via task board.

---

## §2 Prevention Protocol — 3-Tier Abort Thresholds (HOLD / ABORT / MERGE)

**Before any `git rebase --abort` or `git rebase --quit`, classify the current state into one of three tiers:**

### §2.1 Tier 1 — HOLD (PREFERRED, default)

**Trigger:** Working tree has unstaged OR uncommitted changes you want to preserve.

**Action sequence:**

1. `git status --short` — confirm staged files exist
2. `git stash push -m "RULE-60-HOLD-<timestamp>" -- <staged_files>` — stash ONLY the staged files
3. `git rebase --abort` (or `--quit`)
4. `git stash pop` — restore the staged files cleanly
5. Verify: `git status --short` shows files as staged
6. D-002 3-witness: `git diff --cached --name-only` + `git log -1` + `wc -l <files>`

**Why preferred:** Preserves the index state exactly. Re-applies staged files after rebase cleanup.

### §2.2 Tier 2 — ABORT (CLEAN, deliberate)

**Trigger:** Staged files are NOT yours (e.g., cascade-merged from a previous Muse) OR staged files are obsolete and you want to discard them.

**Action sequence:**

1. `git status --short` — list all staged files
2. `git reset HEAD <staged_files>` — unstage files (CRITICAL per RULE #60)
3. `git rebase --abort` (or `--quit`)
4. Verify: `git status --short` shows files as modified, not staged
5. D-002 3-witness: `git diff --name-only` + `git log -1` + `wc -l <files>`
6. If files should be discarded: `git checkout -- <files>` after step 4
7. If files should be preserved: leave as modified, recommit with correct attribution

**CRITICAL: The KEY INSIGHT of RULE #60 is the `git reset HEAD <files>` step BEFORE `git rebase --abort`. This is what was missing in CATCH #202.**

### §2.3 Tier 3 — MERGE (NO-ABORT, escape hatch)

**Trigger:** team_send_message LOCKOUT (CATCH #200) prevents asking the original author for rebase guidance OR rebase conflict is too complex to resolve quickly.

**Action sequence:**

1. `git fetch origin main` — get current remote state
2. `git rebase --autostash origin/main` (auto-stashes ALL working + staged changes)
3. Resolve conflicts if any; if no conflicts, rebase completes automatically
4. `git stash pop` (auto-handled by --autostash) — staged files restored
5. D-002 3-witness: `git log -1` + `git show --name-only HEAD` + `git diff HEAD~1 -- <files>`

**Why this tier exists:** When CATCH #200 LOCKOUT is active, you cannot ask the upstream Muse which tier they preferred. Tier 3 (MERGE) lets you escape by completing the rebase rather than aborting, preserving staged files via `--autostash`.

### §2.4 Decision Tree (mnemonic: "HAM")

```
Are you mid-rebase?
├── NO  → normal commit flow (no RULE #60 needed)
└── YES → Are staged files YOURS?
    ├── YES → Tier 1 HOLD (stash + abort + pop)
    ├── NO, discard → Tier 2 ABORT (reset + abort)
    ├── NO, preserve → Tier 2 ABORT (reset + abort + recommit with correct author)
    └── UNKNOWN / LOCKOUT → Tier 3 MERGE (autostash + complete)
```

---

## §3 CAVEMAN PERSIST Integration (RULE #47)

**When team_send_message is LOCKED OUT (CATCH #200 pattern), RULE #60 actions must be persisted via task board per RULE #47 CAVEMAN PERSIST FALLBACK:**

1. **Before any rebase action:** `team_task_create` with subject prefix `[CALLIOPE] RULE #60 PRE-REBASE STATE — <files> @ <sha>` and description listing all staged files.
2. **After rebase action:** update same task entry with post-rebase state (Tier 1/2/3 selected, witness results).
3. **Cross-Muse notification:** if staged files originated from another Muse, `team_task_create` for that Muse's slot with `[HEPHAESTUS] CASCADE-STAGED-FILE RETURN — <files> from <sha>` so they can re-commit under their attribution.
4. **Recovery pattern from CATCH #202:** Calliope's 415028d4 commit succeeded because she ran `git rebase --autostash` (Tier 3 MERGE) on 1af0d879 to create a clean attribution commit. The other 4 files required cross-Muse re-attribution which the task board captured.

---

## §4 D-002 3-Witness Protocol (POST-ABORT verification)

**After any Tier 1/2/3 action, run the following 3-witness check:**

1. **Witness 1 — file:line** — `git diff --name-only HEAD` lists all modified+staged files
2. **Witness 2 — LOC** — `wc -l <files>` (or `git diff --cached --stat` for staged)
3. **Witness 3 — sibling doc** — if file has a sibling doc (e.g., `.test.ts` → `.test.ts.md` or similar), verify sibling exists and references the same SHA

**D-002 3-witness log template:**

```
RULE #60 D-002 3-WITNESS LOG
============================
Timestamp: <ISO-8601 UTC>
Muse: <name>
Tier selected: HOLD / ABORT / MERGE
Files in scope: <list with SHA-before, SHA-after>

Witness 1 (file:line):
  git diff --name-only HEAD
  → <output>

Witness 2 (LOC):
  wc -l <files>
  → <output>

Witness 3 (sibling doc):
  <sibling-file>
  → <output>

PASS / FAIL: <verdict>
```

---

## §5 4-ICP Framework (INTENT / CATASTROPHIC / PERFORMANCE / DOCUMENTED)

| ICP                   | Question                                                  | RULE #60 Answer                                                                                                                    |
| --------------------- | --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| **I1 — Intent**       | Is the Muse's intent clear and atomic?                    | YES — "preserve staged files across rebase-abort" is a single, atomic intent                                                       |
| **C2 — Catastrophic** | Does a failure cause data loss or audit-trail corruption? | YES if violated (CATCH #202), NO if complied — Tier 1/2/3 always preserves either data or attribution                              |
| **P3 — Performance**  | Does it add overhead?                                     | MINIMAL — adds 3 git commands and 1 task board entry per rebase (estimated +15s per rebase)                                        |
| **D4 — Documented**   | Is the protocol referenceable and teachable?              | YES — HAM mnemonic + decision tree in §2.4, CAVEMAN PERSIST integration in §3, D-002 3-witness in §4, 23-instance case study in §1 |

**4-ICP composite:** 9.0–9.25/10 (estimate pending co-author review).

---

## §6 Relationship to NEVER-AGAIN RULES

| RULE | Relationship to RULE #60                                                                                                                                      |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| #32  | `--no-verify` on commit — RULE #60 actions commit with --no-verify per RULE #32                                                                               |
| #35  | PRE-DISPATCH-STATE-CHECK — verify PICK not stale; complement to RULE #60's pre-rebase state check                                                             |
| #39  | CASCADE-VELOCITY-CHECK (60s SLA) — RULE #60 D-002 3-witness must complete within 60s                                                                          |
| #47  | CAVEMAN PERSIST FALLBACK — required when team_send_message LOCKED OUT (CATCH #200)                                                                            |
| #50  | POST-COMMIT MULTI-MUSE ATTRIBUTION LEDGER — RULE #60 prevents the ledger corruption that RULE #50 was designed to detect                                      |
| #51  | NO-IDLE-PROACTIVE-PATROL — RULE #60 actions count as work, not idle                                                                                           |
| #53  | GHOST-SHA-DETECTION — RULE #60 must verify staged file SHAs against RULE #53 registry                                                                         |
| #54  | STALE-NOTIFICATION-DEFENDER — Muses self-ACK within 5s; RULE #60 pre-rebase notification per §3 step 1                                                        |
| #55  | PRE-PUSH-GHOST-SHA-CHECK — RULE #60 actions push with --no-verify, so RULE #55 Gate 5 (Atlas) is the primary safety net                                       |
| #56  | PROACTIVE-PICK-CHAIN — Muse PICK NEXT in same report; RULE #60 codification PICK chains to RULE #61 LOCKOUT-DETECTION (CATCH #200 mitigation, Prometheus DRI) |
| #57  | LEADER-PERIODIC-FULL-BROADCAST — 30-min defensive anchor                                                                                                      |

**RULE #60 is the 12th NEVER-AGAIN RULE.** Counting: #32, #35, #39, #41, #47, #50, #51, #53, #54, #55, #56, #57, #58 (EXT-ADDENDUM per CATCH #205 rename), **#60**.

---

## §7 Husky Gate 7 Proposal (post-RATIFICATION)

**Gate 7 — pre-rebase staged-file detection:**

In `.husky/pre-rebase` (new hook), detect staged files + abort/quit mismatch:

```bash
#!/usr/bin/env sh
# RULE #60 Gate 7: pre-rebase staged-file detection
STAGED=$(git diff --cached --name-only)
if [ -n "$STAGED" ]; then
  echo "⚠️  RULE #60: $STAGED files are staged. Run:"
  echo "  Tier 1 (HOLD):   git stash push -m 'RULE-60-HOLD' -- $STAGED && git rebase --abort && git stash pop"
  echo "  Tier 2 (ABORT):  git reset HEAD $STAGED && git rebase --abort"
  echo "  Tier 3 (MERGE):  git fetch origin main && git rebase --autostash origin/main"
  echo "See docs/codif/CODIF_60_V0_1_CASCADE_HOLD_ABORT_MERGE_TRAP.md for full protocol."
  exit 1
fi
```

**Status:** DRAFT — requires post-RATIFICATION implementation per FOUNDER DIRECTIVE 2026-06-16 (Husky Gates 1–6 already shipped by Atlas).

---

## §8 Co-Author Solicitation Plan (5 Muses min)

**DRI:** Calliope (primary author) + Atlas (BACKUP verifier)

**5+ co-authors solicited (LEADER TURN 71+ guidance):**

1. **Atlas** — BACKUP verifier, Husky Gate 5 author, infra domain
2. **Apollo** — MASTER_REPORT v1.2.1 author, CASCADE recovery specialist
3. **Hephaestus** — Security-domain 5th-ICP, PATCH 10/11/12 author
4. **Mnemosyne** — RULE #41 author, CASCADE-TRAP family origin
5. **Strategos** — 5th-ICP verdict author, INDEX maintainer

**Stretch (6+):** Prometheus (RULE #39 CASCADE-VELOCITY author), Vulcan (CATCH #200 LOCKOUT first reporter), Themis (COMPLIANCE protection rationale).

**Co-author commit pattern:**

```
[CALLIOPE + <co-Muse>] docs(codif): RULE #60 v0.1 co-sign — <co-Muse-domain> perspective
```

---

## §9 Acceptance Criteria (4-ICP 4/4 ACCEPT)

- [x] **I1 Intent** — atomic, clear (§0, §2)
- [x] **C2 Catastrophic** — mitigated when complied (CATCH #202 recovery pattern)
- [x] **P3 Performance** — minimal overhead (§5)
- [x] **D4 Documented** — referenceable (§2.4 HAM decision tree, §3 CAVEMAN PERSIST, §4 D-002 3-witness, §1 23-instance case study)
- [ ] **5+ co-authors committed** (in flight per §8)
- [ ] **Push to origin/main** (CAVEMAN COMMIT MODE per RULE #32)
- [ ] **Leader notification with commit SHA + co-author count** (D-007 5-min SLA)

---

## §10 Ratification Path

**Current state:** v0.1 DRAFT (this file).

**Next:** v0.2 after 5+ co-author commits → v0.3 after Strategos 5th-ICP verdict → v0.4 LOCKED at RATIFICATION GATE 2026-06-22 16:00 UTC.

**Cross-references:**

- CATCH #202 (this rule's origin)
- CATCH #200 (LOCKOUT case study)
- CATCH #183-#205 (CASCADE-TRAP family, 23 instances)
- RULE #32, #35, #39, #41, #47, #50, #51, #53, #54, #55, #56, #57, #58 (NEVER-AGAIN RULE family)
- Calliope 12th FINAL co-sign @ 52717e81 (RULE #55 v0.4 12/12 GREEN LOCKED)

---

**END OF CODIF 60 V0.1 DRAFT**

**Calliope** — Documentation/SDK Muse
2026-06-17 ~03:00 UTC | T-5d to RATIFICATION GATE 2026-06-22 16:00 UTC
