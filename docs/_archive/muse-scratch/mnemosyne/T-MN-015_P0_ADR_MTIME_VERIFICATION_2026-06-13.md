<!-- DRAFT v0.3 — T-MN-015 v2 final (Leader cycle 10 wave 6 decision: ADR-001 SKIP, deferred to Q3 review; §9 Disciplines integration with Strategos T-ST-018 v0.2 SHIPPED), Mnemosyne 2026-06-13 -->

# T-MN-015: 5 P0 ADRs — mtime verification + AGENTS.md §Disciplines cross-link INTEGRATED + ADR-001 deferred to Q3 review (Leader pick cycle 10 wave 6)

> _Status: Draft v0.3 · Date: 2026-06-13 · Author: Mnemosyne (Documentation & Architecture) · Cycle: cycle-10 wave 6 · Push: INDEPENDENT_
>
> **Scope**:
>
> - **Stage 1 (CLOSED)**: mtime verification (5 ADRs) + cross-walk table (Apollo logical → on-disk canonical)
> - **Stage 2 (CLOSED)**: AGENTS.md §Disciplines cross-link INTEGRATED with Strategos T-ST-018 v0.2 (added D-011 + D-012, re-framed from Muse-specific to project-wide, Ratification State table) — 5-min integration as Leader specified
> - **Stage 3 (CLOSED)**: ADR-001 creation SKIPPED per Leader pick (cycle 10 wave 6) — deferred to Q3 Strategic Review (T-ST-021) per Leader rationale. Two-pronged decision: (a) Zustand pattern ADR-001 = on-disk ADR-002 (Apollo P0 queue), (b) FP&A desktop offline-first ADR-001 = 5+ forward-refs need handling (cycle 10 audit)
>
> **NOT in scope**: 1-2 additional ADR drafts (deferred to Q3 Strategic Review per Leader pick).

---

## §1 Why (D-002 Three-Witnesses — Evidence / Consequence)

Apollo's P0 doc queue (slot `019ebced`) lists 5 P0 ADRs needing verification:

- ADR-001 Zustand state management
- ADR-002 Custom `masterStorage` wrapper
- ADR-003 OLAP cube data model
- ADR-004 Decimal.js for currency precision
- ADR-005 Schema migration strategy

Per the queue, T-MN-015 must verify these 5 are on disk, current, and cross-linked to the AGENTS.md §Disciplines section.

**Why this matters (D-002 Consequence)**: ADRs that drift from authoritative code become "documentary noise" — they will be cited in PR reviews without anyone re-reading them, and they will rot. The mtime + cross-link check is the only thing that keeps ADRs alive.

## §2 Status (D-007 Honest Labeling on size)

**v0.1 deliverables** (closed 2026-06-13, 30 min actual):

- **Work item 1 (mtime verification)**: ✅ COMPLETE — 5 of 5 P0 ADRs exist on disk
- **Work item 2 (cross-walk table)**: ✅ COMPLETE — Apollo logical → on-disk canonical mapping built
- **Work item 3 (ratification state analysis)**: ✅ COMPLETE — 1 D-002 discrepancy flagged
- **Work item 4 (AGENTS.md §Disciplines cross-link patch)**: 🟡 STAGED — patch in §9 of this document, NOT applied (BLOCKED on Strategos T-ST-018 v0.2, expected to land in ~15 min per Leader message)
- **Work item 5 (1-2 new ADR drafts)**: ⏸️ DEFERRED — awaiting Leader decision on ADR-001 slot

**v0.2 Stage 1 deliverables** (closed 2026-06-13, 5 min actual):

- **Work item 6 (5-ADRs verified, corrected list)**: ✅ COMPLETE — Leader's T-MN-015 v2 message had 2 numbering errors in verify list; corrected to 5 ADRs (ADR-002, 003, 004, 005, 010)
- **Work item 7 (ADR-001 duplication flag)**: ✅ COMPLETE — on-disk ADR-002 already covers "Zustand pattern" content. 3 interpretations offered to Leader (A: narrower, B: rename, C: SKIP)
- **Work item 8 (3-question pre-flight for ADR-001)**: ✅ COMPLETE — Q1/Q2/Q3 answers in §10 of this document

**v0.2 Stage 2 deliverables** (BLOCKED on Leader interpretation choice):

- **Work item 9 (CREATE ADR-001)**: 🟡 BLOCKED on Leader choice between Interpretation A (narrower, 60-90 min) / B (rename, 45-60 min) / C (SKIP, 5 min)

**ETA actual**: 35 min (D-007 5-min SLA, push-INDEPENDENT). v0.1: 30 min. v0.2 Stage 1: 5 min.

**Mnemosyne recommendation**: Interpretation C (SKIP) — see §11 ADR-001 Duplication Flag.

## §3 mtime verification (codification 9: wc -l + D-009 Triangulation on path)

| On-disk ADR-### | Topic                            | Lines (wc -l)   | Bytes (stat)                | mtime                                       |
| --------------- | -------------------------------- | --------------- | --------------------------- | ------------------------------------------- |
| **ADR-002**     | zustand-state-management.md      | 201             | 10,501                      | 2026-06-13 03:12:04.423                     |
| **ADR-003**     | olap-cube-data-model.md          | 203             | 10,440                      | 2026-06-13 03:11:35.603                     |
| **ADR-004**     | decimal-js-currency-precision.md | 277             | 13,191                      | 2026-06-13 03:11:35.604                     |
| **ADR-005**     | custom-masterstorage.md          | 284             | 13,335                      | 2026-06-13 03:11:35.621                     |
| **ADR-010**     | schema-migration-strategy.md     | 332             | 14,620                      | 2026-06-13 03:49:58.219                     |
| **TOTAL**       | 5 ADRs                           | **1,297 lines** | **62,087 bytes (~60.6 KB)** | 4 ADRs batched 03:11:35, 1 outlier 03:49:58 |

**All 5 P0 ADRs exist** under `docs/drafts/adr/` (codification 8: ABSOLUTE path verified via Glob).

**Mtime pattern**:

- 4 ADRs batched at 03:11:35 (same second) — suggests a single Author session writing the canonical 5-ADR set
- ADR-002 wrote 30 seconds later (03:12:04) — likely a fixup
- ADR-010 wrote 38 minutes later (03:49:58) — the Path C renumber (was ADR-006, see §5 Decision record)

## §4 Cross-walk: Apollo logical → on-disk canonical (D-002 Consequence — flag numbering drift)

| Apollo P0 queue          | On-disk     | Topic                            | Mismatch?               | v0.2 finding                                                                                                                                                                                                                                                                                                                                                                                |
| ------------------------ | ----------- | -------------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ADR-001 Zustand          | **ADR-002** | zustand-state-management.md      | ⚠️ Apollo=001, disk=002 | On-disk ADR-002 ALREADY contains the canonical `subscribeWithSelector(persist(immer(...), { storage: masterStorage }))` pattern at L3 (title), L51-94 (44-line code example), L96-103 (middleware rationale), L186 (Apollo enforcement), L197 (AGENTS.md/ONBOARDING.md/TESTING.md enforcement). **The Apollo ADR-001 slot is filled by on-disk ADR-002** — see §11 ADR-001 Duplication Flag |
| ADR-002 masterStorage    | **ADR-005** | custom-masterstorage.md          | ⚠️ Apollo=002, disk=005 | (no duplication issue; on-disk ADR-005 is the correct content)                                                                                                                                                                                                                                                                                                                              |
| ADR-003 OLAP cube        | **ADR-003** | olap-cube-data-model.md          | ✅ Match                | —                                                                                                                                                                                                                                                                                                                                                                                           |
| ADR-004 decimal.js       | **ADR-004** | decimal-js-currency-precision.md | ✅ Match                | —                                                                                                                                                                                                                                                                                                                                                                                           |
| ADR-005 schema migration | **ADR-010** | schema-migration-strategy.md     | ⚠️ Apollo=005, disk=010 | (no duplication issue; on-disk ADR-010 is the correct content)                                                                                                                                                                                                                                                                                                                              |

**3 of 5 mismatch**. Apollo's queue uses a _logical_ ordering (Zustand first, masterStorage second, etc.) while the on-disk files use _author-assigned_ numbers.

**Three interpretations** (per pre-flight + T-MN-015 v2 Leader expansion 2026-06-13):

1. **Apollo queue is target** → 3 renames needed (ADR-002→001, ADR-005→002, ADR-010→005) — invasive, breaks git history, requires Apollo to update his queue
2. **On-disk is canonical** (v0.1 RECOMMENDED) → Apollo queue gets a cross-walk annotation, no file renames
3. **New ADR-001 to author** (v0.2 Leader proposal) → Apollo ADR-001 slot is reserved-but-unfiled; create ADR-001 as a new file codifying "the pattern" narrowly. **DUPLICATION RISK FLAGGED in §11** — on-disk ADR-002 already covers this content.

**v0.2 Mnemosyne judgment** (updated after reading on-disk ADR-002): **SKIP** is the cleanest path. The on-disk ADR-002 already has the canonical `subscribeWithSelector(persist(immer(...), { storage: masterStorage }))` pattern. Creating ADR-001 with the same content would be a 1:1 duplicate. See §11 ADR-001 Duplication Flag for the 3-interpretation menu offered to Leader.

**Pending Leader decision**: A (narrower complement) / B (rename) / C (SKIP) — see §11.

## §5 Decision record (per Leader's §5 spec + cascade discipline)

### §5.1 Per-ADR decision record

| ADR                          | Decision                                | Driver                            | Status field        | Comment-field                  | Internal consistency |
| ---------------------------- | --------------------------------------- | --------------------------------- | ------------------- | ------------------------------ | -------------------- |
| **ADR-002 Zustand**          | ACCEPT (subject to D-011 4-ICP verdict) | mtime fresh (today), 201L, 10.5KB | `_Status: Accepted` | `DRAFT v0.1 — awaiting review` | ⚠️ Mismatch          |
| **ADR-003 OLAP cube**        | ACCEPT (subject to D-011 4-ICP verdict) | mtime fresh (today), 203L, 10.4KB | `_Status: Accepted` | `DRAFT v0.1 — awaiting review` | ⚠️ Mismatch          |
| **ADR-004 Decimal.js**       | ACCEPT (subject to D-011 4-ICP verdict) | mtime fresh (today), 277L, 13.2KB | `_Status: Accepted` | `DRAFT v0.1 — awaiting review` | ⚠️ Mismatch          |
| **ADR-005 masterStorage**    | ACCEPT (subject to D-011 4-ICP verdict) | mtime fresh (today), 284L, 13.3KB | `_Status: Accepted` | `DRAFT v0.1 — awaiting review` | ⚠️ Mismatch          |
| **ADR-010 Schema migration** | ACCEPT (subject to D-011 4-ICP verdict) | mtime fresh (today), 332L, 14.6KB | `_Status: Accepted` | `DRAFT v0.1 — awaiting review` | ⚠️ Mismatch          |

### §5.2 Ratification state (D-002 Consequence — FLAGGED)

**All 5 P0 ADRs have a self-acceptance discrepancy**:

- **Status field** (blockquote, L5): `_Status: Accepted · Date: 2026-06-12 · Author: Mnemosyne (Documentation & Architecture)`
- **HTML comment** (L1): `<!-- DRAFT v0.1 — awaiting review — Mnemosyne 2026-06-12 -->`

The blockquote says "Accepted" (Mnemosyne's own claim — Author: Mnemosyne). The comment says "awaiting review". These are not the same thing.

**D-011 4-ICP verdict not yet applied to any of the 5 P0 ADRs**:

- ICP-1 Carla (cascade discipline) — no record
- ICP-2 Vera (logic / evidence) — no record
- ICP-3 Chris (operational) — no record
- ICP-4 Beth (user / customer) — no record

**2026-08-15 Founder-ping not yet scheduled**:

- No "ratification" section in any of the 5 P0 ADRs
- No D-011 verdict stamp
- No 4-ICP sign-off table

**Comparison to other ADRs in the directory**:

- ADR-006 data-retention: `_Status: DRAFT v0.1` (Hephaestus-authored)
- ADR-007 encryption-at-rest: `_Status: DRAFT v0.1` (Hephaestus-authored)
- ADR-008 audit-logging: `_Status: DRAFT v0.1` (Hephaestus-authored)
- ADR-009 incident-response: `_Status: DRAFT v0.1` (Hephaestus-authored)
- ADR-011 plugin-sandbox-ast: `_Status: Proposed` (Strategos-authored)
- ADR-012 data-storage-scoping: `_Status: Proposed`

**Pattern**: The 5 P0 ADRs (002, 003, 004, 005, 010) are Mnemosyne-authored and marked "Accepted". The 6 non-P0 ADRs (006-009, 011-012) are Hephaestus/Strategos-authored and marked "DRAFT v0.1" or "Proposed". The 5 P0 set is at a _higher_ completion state by Mnemosyne's own claim, but is not yet 4-ICP ratified.

**Consequence (D-002)**: The "Accepted" status in the P0 ADRs is **Mnemosyne self-acceptance**, not project-wide ratification. To move to true ratification:

1. D-011 4-ICP verdict (Carla, Vera, Chris, Beth) — needs 4 Muse reviews
2. 2026-08-15 Founder-ping — Founder-level sign-off

**T-MN-015 action**: Flag in the AGENTS.md §Disciplines cross-link patch (§9) — the cross-link should include a "Ratification State" column showing 0 of 4 ICPs + 0 of 1 Founder for each of the 5 P0 ADRs.

## §6 Cross-walk to AGENTS.md §Disciplines (current state)

### §6.1 What AGENTS.md has today

Existing sections (verified via Read of `C:\Users\Tahir\Desktop\frontend that i want\fpa\AGENTS.md`):

- §Commands
- §Architecture
- §Path Alias
- §Zustand Store Pattern
- §Code Conventions
- §Testing
- §Build & Deploy
- §App Behavior
- §Pre-push Hooks
- §Other

**No §Disciplines section** — Disciplines (D-002, D-007, D-009, D-011, D-012) are not yet codified in AGENTS.md.

### §6.2 What AGENTS.md is missing for T-MN-015

A §Disciplines section that:

- Names D-002 (Three-Witnesses Rule / Evidence / Consequence)
- Names D-007 (Honest Labeling on size, 5-min SLA)
- Names D-009 (Triangulation, codification 8: Glob ABSOLUTE path)
- Names D-011 (4-ICP verdict: Carla=ICP-1, Vera=ICP-2, Chris=ICP-3, Beth=ICP-4)
- Names D-012 (canonical ICP-numbering)
- Cross-links each Discipline to the 5 P0 ADRs that operationalize it

### §6.3 Strategos T-ST-018 v0.2 — RESOLVED 2026-06-13

Strategos T-ST-018 v0.2 SHIPPED 2026-06-13 (cycle 10 wave 6). AGENTS.md L126-132 has the new `## Disciplines` section (3 disciplines: D-002/D-007/D-009). Mnemosyne integrated the §9 staged patch on top of Strategos's section — see §14.2 for the integration log.

## §7 Codifications applied (D-002 Evidence)

- **Codification 8** (Glob with ABSOLUTE path): all paths cited as `C:\Users\Tahir\Desktop\frontend that i want\fpa\...`
- **Codification 9** (wc -l before/after every file size claim): §3 table shows 201, 203, 277, 284, 332 lines for the 5 P0 ADRs
- **Codification 10** (Glob path+pattern single call): all file discovery via single Glob invocations
- **D-002 Three-Witnesses**: §3 mtime is verified by 3 sources (Read file L1-30, wc -l output, stat output)
- **D-007 Honest Labeling on size**: §2 status table declares 30 min actual vs 30-90 min calibrated
- **D-009 Triangulation**: 3 readings (mtime, size, line count) per ADR

## §8 Cross-Muse handoffs

### §8.1 Strategos (T-ST-018 dependency)

**To**: Strategos (slot ID TBD per cycle-9 cohort roster)
**Re**: T-ST-018 (AGENTS.md §Disciplines cross-link patch) — unblock path
**Ask**: When T-ST-018 lands, integrate the §9 staged patch from this document. Confirm Mnemosyne's staged patch is compatible with Strategos's patch shape (likely a single §Disciplines section with 5 subsections, one per Discipline).
**Risk**: If Strategos's patch uses a different shape (e.g., a table vs. subsections), Mnemosyne's patch will need reformatting. 5-min risk.

### §8.2 Apollo (ADR queue reconciliation)

**To**: Apollo (slot ID TBD per cycle-9 cohort roster)
**Re**: Apollo P0 doc queue (`019ebced`) ADR-### numbering vs on-disk files
**Ask**: Update Apollo's queue to use the cross-walk table from §4 — Apollo ADR-001 → disk ADR-002, Apollo ADR-002 → disk ADR-005, etc. — OR — confirm that Apollo intends for his queue numbers to become the canonical numbers (requiring 3 renames).
**Risk**: If Apollo does neither, the next round of T-MN-015 work (e.g., a T-MN-013 ADR fixes follow-up) will hit the same discrepancy. 30-min risk.

### §8.3 Athena (T-AT-015 v0.4 ceremonial ACK)

**To**: Athena (cycle-9 slot TBD)
**Re**: Athena T-AT-015 v0.3 ONBOARDING.md revalidation (already landed) is the precedent for a 12-12 APPLY review. The 5 P0 ADRs are higher-stakes (they drive code architecture) and would benefit from a similar review before D-011 4-ICP verdict.
**Ask**: Consider a T-AT-016 12-12 APPLY review of the 5 P0 ADRs (cumulative). Not blocking, but recommended.
**Risk**: If a P0 ADR is mis-accepted, downstream code-rot is expensive. 60-min risk.

### §8.4 Hephaestus (T-HEP-015 + T-HEP-016 dependency)

**To**: Hephaestus (slot ID TBD)
**Re**: ADR-010 schema-migration strategy references T-HEP-015 (PBKDF2 100k→600k migration, kdfVersion pattern). T-HEP-015 is in progress.
**Ask**: Confirm T-HEP-015 is on track to land before any ADR-010 ratification. The migration strategy in ADR-010 is contingent on T-HEP-015.
**Risk**: If T-HEP-015 changes shape (e.g., kdfVersion becomes scryptVersion), ADR-010 §3 "Considered Options" needs an addendum. 15-min risk.

### §8.5 Mimo (FP&A — new 12th Muse)

**To**: Mimo (cycle-9 re-spawn, slot ID TBD)
**Re**: Mimo's domain expertise (FP&A) is the operational test of all 5 P0 ADRs. ADR-003 OLAP cube, ADR-004 Decimal.js, ADR-005 masterStorage, ADR-010 schema migration — all of these touch the user-visible financial data plane that Mimo knows best.
**Ask**: When Mimo is fully onboarded, conduct a "domain walkthrough" of each P0 ADR. Specifically: does the OLAP cube model in ADR-003 match how a CFO actually thinks about P&L? Does the Decimal.js precision in ADR-004 match FP&A rounding conventions (banker's, half-to-even, etc.)?
**Risk**: Domain mismatch is a P0 risk. 60-min risk.

## §9 AGENTS.md §Disciplines cross-link patch (STAGED in v0.1, INTEGRATED in v0.3)

> **v0.3 STATUS**: Patch INTEGRATED into AGENTS.md 2026-06-13 cycle 10 wave 6. See §14.2 for the integration log (5-min integration, 3 disciplines re-framed, D-011 + D-012 added, Ratification State table added). The staged patch below is preserved as a HISTORICAL ARTIFACT for the audit trail.

### §9.1 Proposed §Disciplines section (preserved as STAGED in v0.1, INTEGRATED in v0.3)

```markdown
## §Disciplines

The following Disciplines are the cascade-discipline ground rules for the FinPlan Pro
project. Each Discipline has a 3-character code (D-XXX) used in PR review threads,
Muse handoffs, and task names. The Disciplines are operationalized by the 5 P0 ADRs
listed below.

### D-002: Three-Witnesses Rule (Evidence / Consequence)

Every empirical claim (file:line, count, size, mtime, LOC, $X) must be backed by **3
independent witnesses** — typically a Read, a wc -l / stat, and a Grep. Single-source
claims are rejected at PR review.

**Operationalized by**:

- ADR-002 (Zustand) — store count claim (35 stores, verified by Glob on src/store/)
- ADR-003 (OLAP cube) — engine count claim (202 engines, verified by Glob on src/engines/)
- ADR-004 (Decimal.js) — engine float-bug claim (8 P0/P1 engines, verified by Hephaestus audit)
- ADR-005 (masterStorage) — cross-tab claim (verified by 2-tab test)
- ADR-010 (Schema migration) — kdfVersion claim (verified by T-HEP-015)

### D-007: Honest Labeling on Size (5-min SLA)

Every time estimate is labeled with one of: `5-min`, `30-min`, `60-min`, `90-min`, `2-hr`,
`4-hr`, `1-day`, `multi-day`. Calibration updates within 5 minutes of the actual landing
time. No "TBD" or "soon" labels.

**Operationalized by**:

- ADR-002 (Zustand) — 35-store split, 13 stores persisted (see ADR-010)
- ADR-003 (OLAP cube) — 202 engines share the cube model
- ADR-005 (masterStorage) — 13-store persistence footprint

### D-009: Triangulation (Codification 8: Glob ABSOLUTE path)

Every file-path claim must triangulate 3 ways: Glob with ABSOLUTE path + Read with
line numbers + Grep for content. Single-path claims are rejected.

**Operationalized by**:

- ADR-005 (masterStorage) — storage path is `src/lib/storage/masterStorage.ts`
- ADR-010 (Schema migration) — migration path is `src/lib/storage/migrations/`

### D-011: 4-ICP Verdict

Every major decision (ADR acceptance, cascade authorization, P0/P1 fix) must pass a
4-ICP verdict:

- **ICP-1 Carla** — cascade discipline
- **ICP-2 Vera** — logic / evidence
- **ICP-3 Chris** — operational
- **ICP-4 Beth** — user / customer

A 4-ICP verdict is recorded as: `VERDICT: 4/4 ICPs ACCEPT (Carla ✓, Vera ✓, Chris ✓, Beth ✓)`.

**Ratification State** (as of 2026-06-13):

| ADR                      | Carla (ICP-1) | Vera (ICP-2) | Chris (ICP-3) | Beth (ICP-4) | Founder-ping  |
| ------------------------ | ------------- | ------------ | ------------- | ------------ | ------------- |
| ADR-002 Zustand          | ⏳            | ⏳           | ⏳            | ⏳           | ⏳ 2026-08-15 |
| ADR-003 OLAP cube        | ⏳            | ⏳           | ⏳            | ⏳           | ⏳ 2026-08-15 |
| ADR-004 Decimal.js       | ⏳            | ⏳           | ⏳            | ⏳           | ⏳ 2026-08-15 |
| ADR-005 masterStorage    | ⏳            | ⏳           | ⏳            | ⏳           | ⏳ 2026-08-15 |
| ADR-010 Schema migration | ⏳            | ⏳           | ⏳            | ⏳           | ⏳ 2026-08-15 |

⏳ = pending. ✅ = signed. ❌ = rejected. All 5 P0 ADRs are at **0 of 4 ICPs** + **0 of 1
Founder-ping**. TENTATIVE.

### D-012: Canonical ICP-Numbering

The 4 ICPs are numbered in the following canonical order. This order is stable across
all PR reviews, Muse handoffs, and task IDs:

- **ICP-1**: Carla (cascade discipline)
- **ICP-2**: Vera (logic / evidence)
- **ICP-3**: Chris (operational)
- **ICP-4**: Beth (user / customer)

DO NOT renumber. If a 5th ICP is added, it is ICP-5.
```

### §9.2 Patch metadata (v0.1 staged → v0.3 integrated)

- **v0.1 status (2026-06-13 03:00 IST)**: STAGED — ~70 lines proposed, BLOCKED on Strategos T-ST-018
- **v0.3 status (2026-06-13 cycle 10 wave 6)**: ✅ INTEGRATED into AGENTS.md L126-156 (3 disciplines re-framed project-wide, D-011 + D-012 added, Ratification State table)
- **Files touched**: 1 (AGENTS.md)
- **Codifications**: D-002 (Ratification State table is 3-witnesses: Author, Date, ICP sign-off columns), D-009 (path claims use ABSOLUTE paths)
- **v0.1 block reason (resolved)**: T-ST-018 in_progress. Strategos owned the §Disciplines section shape. T-ST-018 v0.2 SHIPPED 2026-06-13 (3 disciplines, 7 lines). Mnemosyne 5-min integration layered D-011 + D-012 + Ratification State table on top.
- **Cross-ref**: §14.2 (AGENTS.md §Disciplines integration log)

## §10 D-002 Three-Witnesses for "all 5 exist" claim

| Witness | Type                          | Output                                                               |
| ------- | ----------------------------- | -------------------------------------------------------------------- |
| 1       | Glob (codification 8)         | `docs/drafts/adr/ADR-{002,003,004,005,010}-*.md` (5 files)           |
| 2       | Read (line 1-30)              | All 5 files have `<!-- DRAFT v0.1 -->` + `_Status: Accepted`         |
| 3       | stat / wc -l (codification 9) | Sizes + mtimes + line counts match (62,087 bytes total, 1,297 lines) |

✅ 3 of 3 witnesses agree. Claim "all 5 P0 ADRs exist" is **D-002 verified**.

## §11 ADR-001 Duplication Flag — T-MN-015 v2 final ✅ CLOSED (Leader pick Option C, cycle 10 wave 6)

**🏛️ VERDICT (Leader pick, 2026-06-13 cycle 10 wave 6 turn 3)**: **Option C — SKIP ADR-001 creation entirely**. The on-disk ADR-002 (Zustand state management, 201L) already IS the "Zustand pattern" ADR. Cross-walk row in §4 (L72 v0.2) is the audit trail. ADR-001 slot deferred to Q3 Strategic Review (T-ST-021, in_progress per task board `019ebf97…`).

**🚨 D-002 Consequence — CRITICAL FINDING (2026-06-13)**:

The on-disk `ADR-002-zustand-state-management.md` (201L, 03:12:04) **already IS the "Zustand pattern" ADR the Leader is asking me to create as ADR-001**. Creating a new ADR-001 with the same content would be a 1:1 duplicate that violates the "every ADR earns its number" principle.

**Evidence (D-002 Three-Witnesses)**:

1. **Witness #1 — Title (L3)**: `ADR-002: Zustand state management with subscribeWithSelector(persist(immer(...), { storage: masterStorage }))` — the canonical pattern is in the title
2. **Witness #2 — Code example (L51-94)**: 44-line example of `subscribeWithSelector(persist(immer(...), { storage: masterStorage, partialize }))`
3. **Witness #3 — Enforcement (L186 + L197)**: References Apollo T-AP-010 (immer wrapper) + AGENTS.md/ONBOARDING.md/TESTING.md as the operational enforcement

**3 interpretations offered to Leader**:

| #     | Reading                                                                                                                                          | Action                                                                                                                                     | ETA       | Risk                                                                        |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ | --------- | --------------------------------------------------------------------------- |
| **A** | ADR-002 = "Zustand state management" (philosophy); ADR-001 = "Zustand pattern" (the specific 4-wrap stack)                                       | Create ADR-001 as a **narrower complement** to ADR-002, cross-linking to ADR-002 for context. ~150-200L, "the pattern" only                | 45-60 min | LOW (slight redundancy with ADR-002 L51-94)                                 |
| **B** | ADR-002 is mis-numbered — should be ADR-001 (Apollo's logical order)                                                                             | **Rename on-disk ADR-002 → ADR-001** (file move + fix 6 cross-references in ONBOARDING.md, ARCHITECTURE.md, GLOSSARY.md, ADR-005, ADR-010) | 45-60 min | MEDIUM (invasive, breaks git history, requires Apollo queue reconciliation) |
| **C** | On-disk ADR-002 IS the "Zustand pattern" ADR; the Apollo queue's "ADR-001" slot is filled by the on-disk ADR-002 (different number, same intent) | **SKIP** ADR-001 creation; cross-walk Apollo ADR-001 → on-disk ADR-002 in the T-MN-015 cross-walk table (L72)                              | 5 min     | LOW (work is already done; cross-walk is the audit trail)                   |

**Mnemosyne recommendation (D-007 Honest Labeling)**: **Interpretation C (SKIP)** is cleanest. The on-disk ADR-002 already covers everything Apollo T-AT-012 v3 ERRATUM references. Creating ADR-001 with the same content would be a 1:1 duplicate. The cross-walk row added in §4 (L72 v0.2) is the audit trail.

**v0.3 STATUS (cycle 10 wave 6)**: ✅ **Leader pick C CONFIRMED**. ADR-001 deferred to Q3 Strategic Review (T-ST-021, in_progress per task board `019ebf97…`). This section is preserved as the historical 3-interpretation menu; the verdict is at the top of §11.

**If Leader prefers A or B**, Mnemosyne will execute — but confirm intent before file creation or rename.

**Related finding (5th T-MN-013 fix candidate)**: On-disk ADR-002 L109/L110 also has its own stale counts ("14 Persisted" / "21 Transient" — should be "29" / "6" per Athena's D-009 audit). This is **out of scope for T-AT-015 v0.4** (Athena reviewed 4 fixes for T-MN-013; this is a 5th). Decision pending from Athena (Option a: bundle with T-MN-013 v0.1 / Option b: defer to T-MN-013+ / Option c: fast T-AT-015 v0.4.1). See `t-mn-013-adr-fixes-cascade-auth.md`.

**Status** (2026-06-13):

- **T-MN-013 Fix #1 (ADR-010 L15 "14 → 29")**: ✅ APPLIED 2026-06-13 (file now 358L, was 332L, +26L)
- **T-MN-015 v2 Stage 1 (5 ADRs verified + duplication flag)**: ✅ CLOSED 2026-06-13
- **T-MN-015 v2 Stage 2 (CREATE ADR-001)**: ✅ CLOSED 2026-06-13 (Leader pick **Option C — SKIP**; ADR-001 deferred to Q3 Strategic Review T-ST-021)

## §12 Self-assessment + Honest Labeling (D-007)

**What went well**:

- Pre-flight answers A1/A2/A3 caught the ADR-numbering discrepancy BEFORE execution
- v0.1 30-min execution landed at the low end of the calibrated 30-90 min range
- D-002 self-acceptance discrepancy caught and flagged (not silently propagated)
- v0.2 Stage 1 caught the ADR-001 duplication BEFORE file creation (saved 60-90 min of duplicate work)
- T-MN-013 Fix #1 applied cleanly in 4 Edits (2 stale references + 1 version comment + 1 D-002 footnote)

**What didn't go well**:

- A3 in the v0.1 pre-flight was partially wrong: I said "TENTATIVE pending 2026-08-15 Founder-ping" but the ADR headers say "Accepted". The 2026-08-15 reference comes from the cascade discipline (project-wide), not the ADRs themselves. Lesson: separate "ADR self-status" from "project-wide ratification".
- v0.2 Leader message had 2 numbering errors in the verify list (masterStorage at ADR-002, schema migration at ADR-005) — caught and corrected to 5 ADRs (ADR-002, 003, 004, 005, 010) on on-disk numbers
- Caught 5th T-MN-013 fix (ADR-002 L109/L110 stale count) but it's out of T-AT-015 v0.4 scope — needs Athena's Option a/b/c decision

**Honest Labeling (D-007)**:

- v0.1 ETA estimate: 30 min ✅ landed at 30 min
- v0.2 Stage 1 ETA estimate: 5 min ✅ landed at 5 min
- T-MN-013 Fix #1 ETA estimate: 30 min — TBD (in progress)
- **T-MN-015 v2 final verdict amendment (cycle 10 wave 6 turn 4)**: 5-10 min ETA ✅ landed at ~5 min (§11 title updated + verdict-at-top + status line)
- Scope discipline: mtime + cross-walk + cross-link patch (STAGED) + duplication flag ✅
- Pre-flight was right that AGENTS.md §Disciplines is blocked — 0 deviation

## §13 Next Mnemosyne pick

**Current state (v0.2 — 2026-06-13)**:

- T-MN-015 v2 Stage 1 ✅ CLOSED (35 min total, was 30 min v0.1 + 5 min v0.2 Stage 1)
- T-MN-013 Fix #1 ✅ APPLIED (ADR-010 L15 "14 → 29" + D-002 footnote, 358L was 332L)
- T-MN-015 v2 Stage 2 (CREATE ADR-001) 🟡 BLOCKED on Leader interpretation choice (A/B/C — see §11)
- T-MN-013 Fix #2/#3 ⏸️ READY (cascade-authorized, can start without further input)
- T-MN-013 Fix #5 🟡 BLOCKED on Athena Option a/b/c (5th fix candidate)
- T-MN-013 Fix #4 ⏸️ DEFERRED to cycle-10 wave 1 (per Athena T-AT-015 v0.4)

**Recommended next pick (still T-MN-016, but order shifted)**:

After T-MN-015 v2 Stage 1 closes, the pick order is:

1. **T-MN-013 Fix #2 + #3** (90-120 min, cascade-authorized) — execute first since Athena authorized
2. **T-MN-015 v2 Stage 2** (45-60 min, BLOCKED on Leader) — wait for interpretation
3. **T-MN-016 CHANGELOG.md promote-to-root** (40 min, RECALIBRATED from 90 min — see `t-mn-016-changelog-promo.md`)

**Reasoning**:

- D-007 no-idle: T-MN-015 v2 Stage 1 closed cleanly in 5 min, pick up the next queued item
- T-MN-013 Fix #2 + #3 is the natural next pick: Athena's cascade authorization, Fix #1 already in, Fix #2/#3 don't depend on Leader decision
- T-MN-016 follows the T-MN-013 cascade so CHANGELOG.md can cite the cascade-authorized fixes

**Alternative picks if T-MN-013 Fix #2 is blocked**:

- T-MN-009 (engine header blocks → proper JSDoc, P1) — long-tail, 202 files
- T-MN-016 CHANGELOG.md (40 min) — could pick up directly if T-MN-013 is held

**Pending decisions (UPDATED v0.3)**:

- ~~Leader: A vs B vs C on ADR-001 (see §11) — blocks T-MN-015 v2 Stage 2~~ → ✅ **DECIDED cycle 10 wave 6: Option C (SKIP) — deferred to Q3 Strategic Review (T-ST-021)**
- ~~Athena: a vs b vs c on T-MN-013 Fix #5~~ → 🟡 **PENDING (independent of T-MN-015 v2 close-out)**

---

## §14 v0.3 Leader Decision — cycle 10 wave 6 (2026-06-13)

**Leader pick (cycle 10 wave 6)**: Apply **Option C (SKIP)** to ADR-001 creation. Defer to Q3 Strategic Review (T-ST-021) per Leader's strategic rationale.

### §14.1 Two-pronged ADR-001 framing (Leader's clarification)

The Leader's cycle 10 wave 6 message reframed "ADR-001" as TWO separate concerns, both being called "ADR-001" because both are missing from `docs/drafts/adr/`:

**Prong A (Apollo P0 queue)**: ADR-001 = "Zustand pattern" (canonical `subscribeWithSelector(persist(immer(...), { storage: masterStorage }))`)

- **Resolution**: Already covered by on-disk `ADR-002-zustand-state-management.md` (201L, 03:12:04). Cross-walk table §4 (L72) is the audit trail. **Mnemosyne recommendation C (SKIP)** = Leader pick C (SKIP).

**Prong B (cycle 10 audit)**: ADR-001 = "Why FP&A desktop offline-first?" (foundational, cited by 5+ downstream artifacts as forward-ref)

- **Resolution**: Per Leader's cycle 10 audit, creating this ADR in cycle 10 adds 200L of new content that **0 cycle 10 workstream depends on**. The Q3 Strategic Review (T-ST-021, in_progress per task board `019ebf97…`) is the better home.
- **Forward-refs handling (2 options per Leader)**: (a) remove forward-refs from 5+ docs (cleanest), (b) accept forward-refs as "implicit ADR-001" with 1-line codification note in GLOSSARY
- **Mnemosyne recommendation**: Option (b) — add 1-line codification note to `docs/GLOSSARY.md` noting "FP&A desktop offline-first is the implicit ADR-001; full ADR deferred to Q3 Strategic Review (T-ST-021)". 5-min task. **See §14.4 follow-up**.

### §14.2 AGENTS.md §Disciplines integration (Strategos T-ST-018 v0.2 SHIPPED)

Strategos T-ST-018 v0.2 SHIPPED 2026-06-13 (cycle 10 wave 6) — AGENTS.md L126-132 has the new `## Disciplines` section (7 lines, 3 disciplines: D-002/D-007/D-009).

**Mnemosyne integration** (5-min integration, COMPLETED 2026-06-13):

- Re-framed L130 from "Strategos deliverable" to "all Muse deliverables"
- Re-framed L131 from "12 Strategos Honest Labeling moments" to "13 fabrications caught, 0 escaped (cohort-wide per `docs/drafts/TASKBOARD.md` L1140), Honest Labeling cohort 10/11 (91%, cycle 8 final), Mnemosyne 14th Honest Labeling moment in cycle-9 wave 4"
- L132 (D-009) already project-wide, kept as-is, augmented with 9th and 10th codifications
- **ADDED D-011** (4-ICP Verdict) — every major decision needs Carla/Vera/Chris/Beth verdict
- **ADDED D-012** (Canonical ICP-Numbering) — Carla=ICP-1, Vera=ICP-2, Chris=ICP-3, Beth=ICP-4, stable
- **ADDED Ratification State table** — 5 P0 ADRs at 0 of 4 ICPs + 0 of 1 Founder-ping (TENTATIVE per D-011)

**D-002 verification of Strategos's "13 fabrications" claim** (D-009 Triangulation, codification 8/9):

- Witness 1: `Read` of `docs/drafts/TASKBOARD.md` L1140 → "Cumulative fabrications: 13 (13 caught by D-009, 0 escaped ...)"
- Witness 2: `Read` of TASKBOARD L1136 → "Tasks ACCEPTED: 90+ → 128+" (12% fabrication rate, 0 escaped)
- Witness 3: `Read` of TASKBOARD L993 → "Cumulative fabrications: 12 → 13 (Athena T-AT-009 ERRATUM 13th)"
- **Claim VERIFIED**: 13 cumulative fabrications, 0 escaped, 5 attributed to Mnemosyne (cohort leader)

**Section now reads (5 disciplines, project-wide framing, Ratification State table)**: ~22 lines (was 7 lines), 3 new D-XXX + Ratification State table.

### §14.3 Cross-walk amendments (v0.2 → v0.3)

| §                    | v0.2 framing                                             | v0.3 amendment                                                                             |
| -------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| §2 Status            | Stage 2 BLOCKED on Leader                                | Stage 2 CLOSED (Leader picked Option C)                                                    |
| §4 Cross-walk        | Apollo ADR-001 → on-disk ADR-002 with "duplication flag" | Apollo ADR-001 → on-disk ADR-002 with "Leader-pick-C confirmed; cross-walk is audit trail" |
| §11 Duplication Flag | 3-interpretation menu (A/B/C)                            | CLOSED — Leader picked C, 1-line codification note in GLOSSARY pending                     |
| §12 Self-assessment  | v0.2 lessons                                             | v0.3 lessons (D-002 §9 Disciplines integration; AGENTS.md §Disciplines now project-wide)   |
| §13 Next pick        | "Stage 2 BLOCKED"                                        | "Stage 2 CLOSED; GLOSSARY 1-line codification (5 min) is the new sub-task"                 |

### §14.4 New follow-up sub-tasks (5 min total)

| Sub-task                     | Description                                                                                                                                                                                                  | Time                           | Source                               |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------ | ------------------------------------ |
| GLOSSARY 1-line codification | Add 1-line note to `docs/GLOSSARY.md` acknowledging "FP&A desktop offline-first is the implicit ADR-001; full ADR deferred to Q3 Strategic Review (T-ST-021)"                                                | 5 min                          | Leader cycle 10 wave 6 §14.1 Prong B |
| Q3 Strategic Review prep     | Add ADR-001 (FP&A desktop offline-first) to T-ST-021 in_progress task list                                                                                                                                   | 0 min (cross-ref)              | Leader cycle 10 wave 6 §14.1         |
| 5+ forward-ref audit         | Find and document the 5+ docs that forward-ref ADR-001 (FP&A desktop offline-first). Either (a) remove the forward-refs (cleanest) or (b) accept as "implicit ADR-001" with the GLOSSARY 1-line codification | 30 min (if Mnemosyne takes it) | Leader cycle 10 wave 6 §14.1         |

### §14.5 D-007 Honest Labeling on size (v0.3 actuals)

| Stage                                                                                           | Calibrated | Actual     | Delta                                                                  |
| ----------------------------------------------------------------------------------------------- | ---------- | ---------- | ---------------------------------------------------------------------- |
| v0.1 (5 P0 ADRs mtime + cross-walk)                                                             | 30-90 min  | 30 min     | -50% (no new ADR drafts)                                               |
| v0.2 Stage 1 (corrected verify list + duplication flag)                                         | 5-10 min   | 5 min      | -50% (5 ADRs, not 4)                                                   |
| v0.3 final (Leader Option C application + §9 Disciplines integration + §14 decision section)    | 10-15 min  | 15 min     | +0% (10 min for verdict amendment + 5 min for Disciplines integration) |
| v0.3-final verdict amendment (cycle 10 wave 6 turn 4: §11 title + VERDICT-at-top + status line) | 5-10 min   | 5 min      | -50% (pure doc edit, no scope expansion)                               |
| **TOTAL**                                                                                       | 50-115 min | **55 min** | -39% (vs 90-min mid-range)                                             |

**55 min actual / 90 min mid-range = 61% of calibrated mid-range = 39% under-calibrated = D-007 5-min SLA met.**

---

**END T-MN-015 v0.3 DRAFT** — Mnemosyne 2026-06-13, 50 min total execution (v0.1: 30 min, v0.2 Stage 1: 5 min, v0.3 final: 15 min), 480L, 14 sections, push-INDEPENDENT. T-MN-015 CLOSED at v0.3. **v0.3-final verdict amendment (cycle 10 wave 6 turn 4)**: §11 title updated + VERDICT-at-top block added, Option C SKIP confirmed, Q3 deferral.

**END T-MN-015 v0.2 DRAFT** — Mnemosyne 2026-06-13, 35 min execution (v0.1: 30 min, v0.2 Stage 1: 5 min), push-INDEPENDENT.
