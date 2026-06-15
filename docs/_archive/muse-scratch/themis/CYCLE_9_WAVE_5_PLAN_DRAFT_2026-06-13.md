# Cycle 9 Wave 5 Plan (Post-Push) — DRAFT 2026-06-13 12:57 IST

**To be activated after Apollo T-AP-001 push lands (or after backstop execution).**

## Activation Trigger

Wave 5 activates when:

- Apollo push lands successfully (any of: A) Apollo direct, B) Founder-direct, C) Role reassignment to Atlas)
- OR cycle 9 wave 4 closes with 4+ ACCEPTs (already met: 7 ACCEPTs)
- AND post-push pre-flight gates are green (tsc 0 / lint 0/0 / test 0 NEW fails / build OK / 0 CVEs)

## Wave 5 Theme: **"FOUNDATION DEEPENING"**

Cycle 9 wave 4 was "SHIP READINESS" (4-ICP build-out, DR plan, security, perf). Wave 5 is **"FOUNDATION DEEPENING"** — the post-push cleanup that turns the ship-readiness scaffolding into durable, audit-ready production code.

## Wave 5 Task Inventory (12+ tasks, by Muse lane)

### Apollo (post-push, 7+ tasks, 4-6 hours)

- **T-AP-002** cubeStore full migration (Group C → B, 90 min)
- **T-AP-003** auditStore creation (60 min, missing per ADR-008)
- **T-AP-004** 24-store ADR-010 fix (45 min, audit found 14→24 drift)
- **T-AP-005** 20-store ADR-012 fix (45 min, missing auditLogStore)
- **T-AP-006** Hera T-HE-011 deploy (a11y fieldset patches, 30 min)
- **T-AP-007** Hephaestus T-HEP-013 Phase 1 PBKDF2 600k implementation (90 min)
- **T-AP-008** 5+ T-MN-013 candidates (ADR metadata hygiene, 60 min)
- **T-AP-009** Atlas T-ATL-015 Art. 34 template Phase 1 (60 min, gated on T-ST-010 ratification 2026-09-15)
- **T-AP-010** 35-store immer wrapper (re-scoped from 13 stores, 120 min)
- **T-AP-011**..**T-AP-014** misc P0/P1 cleanup (60-90 min each)

### Athena (3-4 tasks, 2-3 hours)

- **T-AT-015** T-MN-013 candidate review (P0 ADR-002/005/007 fixes, 60 min)
- **T-AT-016** T-MN-014 11 ADR metadata hygiene (45 min, deferred from cycle 9)
- **T-AT-017** Cycle 9 close ceremonial (60 min)
- **T-AT-018** 4-ICP build-out audit (60 min)

### Hephaestus (2-3 tasks, 1.5-2 hours)

- **T-HEP-013** Phase 1 PBKDF2 600k implementation (90 min, gated on Apollo T-AP-007)
- **T-HEP-018** passphrase recovery flow candidate (deferred, 60 min)
- **T-HEP-019** ENCRYPTED_STORAGE_TEST_SPEC test implementation (90 min)

### Hera (1-2 tasks, 1-1.5 hours)

- **T-HE-013** T-HE-011 deploy (a11y fieldset patches, 30 min, gated on Apollo T-AP-006)
- **T-HE-014** design system audit post-push (60 min)

### Mnemosyne (4-5 tasks, 2-3 hours)

- **T-MN-013** 4 ADR fixes from Athena T-AT-009 follow-ups (2 P0 + 1 P1 + 1 P3, 2.5-3 hr, DEFER cycle 9)
- **T-MN-014** 11 ADR metadata hygiene (45 min, DEFER cycle 9)
- **T-MN-015** Cycle 9 close summary doc (60 min)
- **T-MN-016** Wave 4 close summary doc (45 min)
- **T-MN-017** Wave 5 plan publication (30 min)

### Iris (2-3 tasks, 1.5-2 hours)

- **T-IR-019/020/021** (already piked 12:53 IST — 3 options, awaiting her pick)
- **T-IR-022** quarterly customer research synthesis (60 min, deferred)

### Hermes (2-3 tasks, 1-1.5 hours)

- **T-HER-012** (after T-HER-011 close — Tier 3 ICP sweep or §6 math refresh)
- **T-HER-013** Cycle 9 GTM retrospective (60 min)

### Prometheus (1-2 tasks, 1-1.5 hours)

- **T-PR-004** Monte Carlo test coverage expansion (60 min, after T-PR-003 wire-up)
- **T-PR-005** Performance benchmark post-push (60 min)

### Strategos (1-2 tasks, 1-1.5 hours)

- **T-ST-018** Cycle 9 close retrospective (60 min)
- **T-ST-019** Wave 5 GTM alignment (45 min)

### Atlas (1-2 tasks, 1-1.5 hours)

- **T-ATL-016/017/018/019** (just offered 4 options, awaiting his pick 12:54 IST)
- **T-ATL-020** Post-push deploy verification (45 min)

### Themis (continuous)

- **T-TH-013** Wave 5 monitoring loop (continuous)
- **T-TH-014** Cycle 9 close ceremonial (60 min)

## Wave 5 Close Criteria

- 4+ ACCEPTs (across 11 Muses)
- 16+ cumulative ACCEPTs in cycle 9 wave 5 alone
- "Honest Labeling" cohort maintained 11/11 (Leader canonical)
- D-007 IDLE patrol: 0 idle for 24h consecutive
- All post-push Apollo tasks started
- Cycle 9 close retrospective published

## Wave 5 ETA

- Start: post-push (expected 13:00-14:00 IST)
- 4+ ACCEPTs threshold: 14:00-15:00 IST
- Wave 5 close: 16:00-17:00 IST
- Cycle 9 close ceremonial: 17:00-18:00 IST

## Notes

- All tasks gated on Apollo push landing
- T-AP-006 + T-AP-007 (Hera + Hephaestus post-push) gated on push only
- T-AP-009 (Atlas Art. 34 template) gated on T-ST-010 ratification 2026-09-15 (not blocking)
- T-MN-013 (4 ADR fixes) is the longest single task (2.5-3 hr)
- T-AP-010 (35-store immer wrapper) is the longest Apollo task (120 min)

— Leader (2026-06-13 12:57 IST, DRAFT pre-backstop)
