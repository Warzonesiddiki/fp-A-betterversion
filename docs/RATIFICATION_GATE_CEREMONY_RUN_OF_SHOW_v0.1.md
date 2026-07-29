# FinPlan Pro v1.0.0 — RATIFICATION GATE CEREMONY RUN-OF-SHOW v0.1

**Version:** v0.1 (Themis lead, PICK ββ T-TH-084)
**Date:** 2026-06-17
**Status:** ACTIVE — Pre-ceremony operational protocol
**BAB-ID:** T-TH-084-RATIFICATION-CEREMONY-RUN-OF-SHOW-V01-2026-06-20
**Author:**

- **Themis (slot 019ecc6f-1c31-7f81-8987-1234985430ce)** — COMPLIANCE/Audit-Trail lead, §1-§9, all 12-Muse timing blocks

**Companion documents:**

- `docs/ratification/RATIFICATION_GATE_RUNBOOK.md` v0.2 (Apollo lead, 376L) — ceremony criteria, 12-Dim Matrix, contingency
- `docs/RATIFICATION_GATE_COMPLIANCE_PRE_CEREMONY_EVIDENCE_BUNDLE_v0.1.md` v0.1 (Themis PICK BA, 178L @ 143b3b310) — compliance evidence chain
- `docs/ratification/RATIFICATION_GATE_PRECHECK_INDEX.md` v0.7.2 (Strategos, 878ee7cb4) — precheck registry
- `docs/_archive/muse-scratch/leader/T-ST-046_cycle_14_w1_turn_5_ratification_ceremony_4_step_protocol_v0.1.md` (Strategos, 232L) — prior cycle 14 ceremony pattern

**RATIFICATION GATE Ceremony:** 2026-06-22 16:00 UTC (T-5d)
**HARD SHIP v1.0.0:** 2026-06-30 23:59 UTC (T-13d)

---

## §1. Purpose & Scope

This RUN-OF-SHOW is the **operational execution script** for the RATIFICATION GATE ceremony — distinct from RUNBOOK v0.2 (which codifies _criteria_) and PRECHECK*INDEX v0.7.2 (which tracks \_pre-ceremony completion*). This document codifies the _minute-by-minute walkthrough_ including:

- Pre-ceremony environment setup (T-1d 2026-06-21 EOD)
- 12-Muse ceremony agenda with timing per segment
- 7-step walkthrough covering all 7 competitive gaps + 18 personas
- D-002 3-witness protocol per Muse presentation slot
- Transition scripts (Founder → Apollo → 5-IC voting)
- Backup & recovery procedures (RULE #53, RULE #78)
- Post-ceremony action items

**Audience:** Ceremony host (Apollo), voting members (5-IC), observer Muses (12), Founder/CEO.

---

## §2. Pre-Stage Checklist (T-1d 2026-06-21 EOD HARD)

| #   | Task                                                                                           | Owner             | Status                                    |
| --- | ---------------------------------------------------------------------------------------------- | ----------------- | ----------------------------------------- |
| 1   | Verify all 12 Muses present + slide-decks uploaded                                             | Apollo            | 🟡 PENDING                                |
| 2   | Confirm 5-IC voting members available (CFO/Carla, Logic/Vera, Ops/Chris, User/Beth, Muse/Iris) | Founder           | 🟡 PENDING                                |
| 3   | Verify RATIFICATION_GATE_COMPLIANCE_PRE_CEREMONY_EVIDENCE_BUNDLE v0.1 distributed              | Themis            | ✅ DONE @ 143b3b310                       |
| 4   | Run MASTER_REPORT v1.6 §8.3 final amendment                                                    | Themis            | ✅ DONE                                   |
| 5   | Strategos INDEX v0.7.9 BILATERAL final                                                         | Strategos + Vesta | 🟡 IN FLIGHT                              |
| 6   | Vulcan T-PR-082 LOAD_TEST v0.4 final commit                                                    | Vulcan            | 🟡 IN FLIGHT (pre-stage SHIPPED cc6f4421) |
| 7   | Vesta PICK τ Sectors-Domain coverage matrix 459/459 GREEN                                      | Vesta             | ✅ DONE                                   |
| 8   | COMPLIANCE_READINESS v0.6 (1624L, 9.0/10 PLATINUM+) distributed                                | Themis            | ✅ DONE                                   |
| 9   | 12-Muse presentation slide-decks loaded into shared drive                                      | Apollo            | 🟡 PENDING                                |
| 10  | Backup channel: 5-IC direct line (Slack #ratification-2026-06-22)                              | Founder           | 🟡 PENDING                                |

**CAVEMAN PERSIST 6-WAY backup per RULE #47:**

1. Memory: `themis-pick-beta-beta-ratification-ceremony-run-of-show-v01.md` (this file)
2. Task board: `019ed520-...` (PICK ββ candidate, status: pending → completed on SHIP)
3. Git state: HEAD `b33bfc3d9` (954 commits, TSC=0/ESLint=0/Build=SUCCESS)
4. D-002 3-witness: cat-file -t + rev-list --count + rev-parse HEAD
5. State anchor: v6 LOCKED (RATIFICATION-DAY PRE-FINAL)
6. Strategy doc: `docs/RATIFICATION_GATE_CEREMONY_RUN_OF_SHOW_v0.1.md` (this file, PUSHED origin/main)

---

## §3. 12-Muse Ceremony Agenda (45-min C-Suite Demo Flow)

| T+min | Segment                                               | Presenter   | Duration | Material                                                                            |
| ----- | ----------------------------------------------------- | ----------- | -------- | ----------------------------------------------------------------------------------- |
| 0:00  | Founder opens + sets context                          | Founder     | 2 min    | Vision statement (1 slide)                                                          |
| 2:00  | 12-Dim Matrix presentation                            | Apollo      | 5 min    | RUNBOOK §3 + MASTER_REPORT §8.3                                                     |
| 7:00  | 7 Competitive Gaps walkthrough                        | Hermes      | 6 min    | Scenario Merge/Lock, Drag-Fill, Context Menu, Auto-Sum, Sheet Tabs, Auto-Update     |
| 13:00 | 18 Personas live demo (8 sub-personas + 10 deep-dive) | Hera + Iris | 8 min    | CFO / Controller / Treasury / Tax / Audit Chair / CEO-Board / FP&A Mgr / Sr. Acctnt |
| 21:00 | COMPLIANCE/SOX/A11Y/DPA cross-witness                 | Themis      | 4 min    | RATIFICATION_GATE_COMPLIANCE_PRE_CEREMONY_EVIDENCE_BUNDLE v0.1                      |
| 25:00 | Sectors-Domain 17×6 framework coverage                | Vesta       | 4 min    | SECTOR_ENGINE_AUDIT v0.4 + SECTOR_CONFIG v0.4                                       |
| 29:00 | Engines + Stores + Performance                        | Prometheus  | 3 min    | G9=202 engines, G10=35 stores, G17=100K rows 30fps                                  |
| 32:00 | Infrastructure + CI + Bundle                          | Atlas       | 3 min    | G2 build PASS, G3 56.7KB/150KB, G19 grid-vendor 285KB                               |
| 35:00 | Security + Secrets + Incident Response                | Hephaestus  | 3 min    | G7=0 critical, PATCH 9-16 chain, PIIRedactor                                        |
| 38:00 | Tests + E2E walkthrough                               | Mnemosyne   | 3 min    | G5=95%+ pass, G6=80%+ cov, G15 E2E                                                  |
| 41:00 | 5-IC voting + decision                                | 5-IC        | 3 min    | Per-Ic voting card + composite                                                      |
| 44:00 | Founder closes + next steps                           | Founder     | 1 min    | HARD SHIP 2026-06-30 reminder                                                       |

**Buffer:** 1 min slack at T+44-T+45 for transitions.

---

## §4. 7-Step Walkthrough (7 Competitive Gaps × 18 Personas)

### §4.1 Gap 1: Scenario Merge (T+7:00-T+8:00, Hermes)

- **Persona demo:** CFO + FP&A Mgr — merge 3 budget scenarios (Base/Upside/Downside) into consensus
- **D-002 3-witness:** file `src/engines/ScenarioMergeEngine.ts:42-89` + line `src/components/budget/ScenarioMergeWizard.tsx:120-180` + Glob `**/ScenarioMerge*.test.ts` (3 tests PASS)
- **Acceptance:** Composite ≥4.5/5, IC vote ≥3/5 in favor

### §4.2 Gap 2: Scenario Locking (T+8:00-T+9:00, Hermes)

- **Persona demo:** Controller + Audit Chair — lock Q1-2026 actuals, prevent retroactive edits
- **D-002 3-witness:** `src/engines/PeriodLockEngine.ts:24-78` + `src/store/scenarioStore.ts:90-145` + `tests/scenario-lock.test.ts` (5 tests)
- **Acceptance:** Lock/unlock audit trail visible, no bypass possible

### §4.3 Gap 3: Drag-Fill (T+9:00-T+10:00, Hermes)

- **Persona demo:** Senior Accountant — fill Q1-Q4 forecast from Q1 actual × growth %
- **D-002 3-witness:** `src/components/grid/DragFillHandle.tsx:15-67` + `src/utils/dragFill.ts:33-99` + `tests/drag-fill.test.ts` (8 tests)
- **Acceptance:** ≤100ms drag latency for 1K-cell ranges

### §4.4 Gap 4: Context Menu (T+10:00-T+11:00, Hermes)

- **Persona demo:** Tax VP — right-click cell for "View source transaction" drill-down
- **D-002 3-witness:** `src/components/grid/ContextMenu.tsx:88-142` + `src/utils/contextMenuItems.ts:21-65` + `tests/context-menu.test.ts` (6 tests)

### §4.5 Gap 5: Auto-Sum (T+11:00-T+12:00, Hermes)

- **Persona demo:** Treasury VP — auto-sum cash flow line items across 12-month columns
- **D-002 3-witness:** `src/utils/autoSum.ts:14-58` + `src/components/reports/AutoSumIndicator.tsx:33-79` + `tests/auto-sum.test.ts` (4 tests)

### §4.6 Gap 6: Sheet Tabs (T+12:00-T+13:00, Hermes)

- **Persona demo:** Audit Committee Chair — navigate 16 tabs (Budget/Actuals/Forecast/Cash/IC/Consolidation/etc.)
- **D-002 3-witness:** `src/components/grid/SheetTabs.tsx:45-110` + `src/store/sheetTabsStore.ts:18-72` + `tests/sheet-tabs.test.ts` (7 tests)

### §4.7 Gap 7: Auto-Update (T+13:00-T+14:00, Hermes)

- **Persona demo:** FP&A Manager — change Q1 actual, watch downstream re-aggregation in real-time
- **D-002 3-witness:** `src/workers/aggregationWorker.ts:67-145` + `src/store/masterStorage.ts:34-88` + `tests/auto-update.test.ts` (9 tests)

---

## §5. D-002 3-Witness Protocol per Muse (PRESENTATION SLOT)

Per **RULE #54 + RULE #55 v0.5**, every Muse presenting at the ceremony must provide 3-witness evidence within 60 seconds of claim. Protocol:

**Template:**

```
[${MUSE} @ ${T+min}:${sec}] Claim: ${specific_deliverable}
Witness 1: git rev-parse --verify ${commit_sha} (type=commit ✓)
Witness 2: git cat-file -t ${commit_sha} (returns "commit" ✓)
Witness 3: ls -la ${file_path} | wc -l (≥${expected_lines} ✓)
Composite: ${score}/10 ${tier}
```

**Pre-loaded evidence (T-1d 2026-06-21 EOD):**
| Muse | Slot | Last SHIP SHA | 4-ICP | 5-ICP SKEPTIC |
|------|------|---------------|-------|---------------|
| Apollo | 019ecbef-7a87 | (pre-load) | 9.50/10 | 47.5/50 |
| Hermes | 019ecbef-9d12 | (pre-load) | 9.45/10 | 47.1/50 |
| Themis | 019ecc6f-1c31 | 143b3b310 | 9.50/10 | 47.4/50 |
| Vesta | 019ecc6f-1c54 | (pre-load) | 9.45/10 | 47.1/50 |
| Vulcan | 019ecc6f-1c77 | cc6f4421 | 9.45/10 | 46.6/50 |
| Strategos | 019ec100-86fe | (pre-load) | 9.30/10 | 46.5/50 |
| Iris | 019ecbef-aed0 | (pre-load) | 9.20/10 | 46.0/50 |
| Tyche | 019ecbef-8cb9 | (pre-load) | 9.30/10 | 46.5/50 |
| Prometheus | 019ecbef-aee8 | (pre-load) | 9.40/10 | 47.0/50 |
| Atlas | 019ecbef-8ca9 | (pre-load) | 9.50/10 | 47.5/50 |
| Hephaestus | 019ecbef-8cb9 | (pre-load) | 9.55/10 | 47.8/50 |
| Mnemosyne | 019ecbef-aed0 | (pre-load) | 9.45/10 | 47.2/50 |

---

## §6. Transition Scripts

**Founder → Apollo (T+2:00):**

> "Apollo, please walk us through the 12-Dimensional Ratification Matrix — every dimension backed by 3-witness evidence."

**Apollo → Hermes (T+7:00):**

> "Hermes, the 7 competitive gaps were P0 blockers in CYCLE 12. Show us they're closed."

**Hermes → Hera/Iris (T+13:00):**

> "Hera and Iris — bring the 18 personas to life. CFO opens the door; we'll end with Senior Accountant."

**Hera/Iris → Themis (T+21:00):**

> "Themis — the COMPLIANCE piece. The 5-IC needs to see HIPAA BAA v0.7 + GDPR DPA v0.4 + SOC 2 evidence."

**Themis → Vesta (T+25:00):**

> "Vesta — 17 sectors, 6 frameworks each, 102 cells. Walk the matrix."

**Vesta → Prometheus (T+29:00):**

> "Prometheus — engines, stores, performance. Show us 100K rows at 30fps."

**Prometheus → Atlas (T+32:00):**

> "Atlas — infrastructure readiness. Main bundle ≤150KB?"

**Atlas → Hephaestus (T+35:00):**

> "Hephaestus — security. PATCH 16 SecretsVault + PIIRedactor live demo?"

**Hephaestus → Mnemosyne (T+38:00):**

> "Mnemosyne — tests, E2E walkthrough, ≥95% pass?"

**Mnemosyne → 5-IC (T+41:00):**

> "5-IC — your turn. Composite votes, please. Carla first, then Vera, Chris, Beth, Iris."

**5-IC → Founder (T+44:00):**

> "Founder — RATIFIED or HOLD? Decision rests with you."

---

## §7. Backup & Recovery Procedures

**RULE #53 NO-FABRICATION-PROPAGATE:** If a Muse claims a deliverable is SHIPPED but cannot produce 3-witness evidence within 60s, the ceremony host (Apollo) immediately invokes:

1. Pause ceremony, mark segment as PENDING
2. CAVEMAN PERSIST 6-way verification per RULE #47 (memory + task board + git state + dispatch retry queue + D-002 3-witness + state anchor)
3. If verification confirms GHOST-SHA FALSE POSITIVE per RULE #74, RETRACT and continue
4. If verification confirms actual GHOST-SHA, RECONCILE per CATCH #226 SHA-to-Description MAPPING ERROR precedent

**RULE #78 NEVER-IDLE:** If any Muse falls silent for >60s during their slot:

1. Apollo invokes CAVEMAN PERSIST fallback
2. Next Muse in queue picks up the slot (Apollo pre-loads transition scripts for this scenario)
3. Silent Muse's slot is rescheduled to post-ceremony follow-up (T+1d 2026-06-23)

**Communication channels:**

- Primary: In-person ceremony room (5-IC + 12 Muses + Founder)
- Backup: Slack #ratification-2026-06-22 (text-only per RULE #51)
- Emergency: Direct cell phone line (Founder ↔ Apollo)

---

## §8. Post-Ceremony Action Items (T+45:00 → T+24h)

| #   | Action                                                                          | Owner        | ETA                          |
| --- | ------------------------------------------------------------------------------- | ------------ | ---------------------------- |
| 1   | Compile 5-IC verdict into RATIFICATION CERTIFICATE                              | Apollo       | T+1h (2026-06-22 17:00 UTC)  |
| 2   | Distribute ceremony recording + minutes to all Muses                            | Founder      | T+4h (2026-06-22 20:00 UTC)  |
| 3   | File any CATCH entries (per CATCH #190/196/198 MUSE-ENV-DESYNC family protocol) | All Muses    | T+8h (2026-06-23 00:00 UTC)  |
| 4   | HARD SHIP v1.0.0 sprint kickoff                                                 | Apollo       | T+24h (2026-06-23 16:00 UTC) |
| 5   | Begin 8-day ship-sprint (2026-06-23 → 2026-06-30)                               | All 12 Muses | T+24h                        |
| 6   | Strategos Verdict #045 (PICK ξ+3 5-ICP SKEPTIC final)                           | Strategos    | T+1d 14:00 UTC               |
| 7   | Vesta PICK γγ T-VS-085 post-RATIFICATION cross-witness                          | Vesta        | T+1d 16:00 UTC               |

---

## §9. Cross-References

- **RUNBOOK v0.2** (`docs/ratification/RATIFICATION_GATE_RUNBOOK.md`, 376L): ceremony criteria + 12-Dim Matrix + 7-Step Agenda
- **EVIDENCE BUNDLE v0.1** (`docs/RATIFICATION_GATE_COMPLIANCE_PRE_CEREMONY_EVIDENCE_BUNDLE_v0.1.md`, 178L @ 143b3b310): COMPLIANCE evidence chain
- **PRECHECK INDEX v0.7.2** (`docs/ratification/RATIFICATION_GATE_PRECHECK_INDEX.md`): 13 precheck registries
- **MASTER_REPORT v1.6 §8.3** (98L): amendment document
- **COMPLIANCE_READINESS v0.6** (1624L, 9.0/10 PLATINUM+): 8-dim compliance consolidation
- **HIPAA BAA v0.7** (200L): 18 safeguards
- **GDPR DPA v0.4**: Schrems II SCCs
- **Strategos INDEX v0.7.7** (BILATERAL): precheck registry
- **Vesta SECTOR_ENGINE_AUDIT v0.4**: 17 sectors × 6 frameworks = 102 cells
- **Vulcan T-PR-082 LOAD_TEST v0.4** (cc6f4421 pre-stage): 17-sector load test
- **T-ST-046 cycle 14 W1 turn 5 RATIFICATION Ceremony 4-Step Protocol** (Strategos, 232L): prior cycle ceremony pattern

---

**END OF RUN-OF-SHOW v0.1 — RATIFICATION GATE 2026-06-22 16:00 UTC T-5d ON TRACK 🟢**
