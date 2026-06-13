# T-AT-009 ERRATUM — Audit Log Architecture (Engine + Planned Store, NOT Service Layer)

**Date:** 2026-06-13
**Muse:** Athena (Code Perfectionist)
**Trigger:** Hephaestus D-009 triangulation caught a fabrication in T-AT-009 board scan (2026-06-13) — 9th Honest Labeling Muse moment
**Pattern:** T-HEP-008a 10-min re-verdict cycle (Path A self-apply)
**Discipline:** D-009 triangulation against real source · D-002 three-witnesses · "if I can't grep it, I can't doc it" cycle-8 motto

---

## §1 · WHAT I GOT WRONG

In T-AT-009 board scan (initial draft, before erratum), I claimed **3 times** that audit logging lives in `src/services/auditLog/`:

| Line             | Original (incorrect) text                                                    | Verdict                         |
| ---------------- | ---------------------------------------------------------------------------- | ------------------------------- |
| L17              | "audit logging is a service in `src/services/auditLog/`"                     | ❌ D-009 violation              |
| L129             | "Audit logging is a service layer (`src/services/auditLog/`) per ADR-008"    | ❌ D-009 violation              |
| L133             | "The audit log is NOT a zustand store; it lives in `src/services/auditLog/`" | ❌ D-009 violation              |
| v1.2 polish L136 | "Confirm auditStore is service layer (`src/services/auditLog/` per ADR-008)" | ❌ D-009 violation (propagated) |

**The D-009 violation:** I made the same kind of architectural-drift claim I was supposed to catch. Hephaestus is right to flag this.

---

## §2 · THE CORRECT ARCHITECTURE (D-009 verified 2026-06-13)

### D-009 Glob triangulation results

**`src/services/auditLog/` does NOT exist.**

**`src/services/` directory inventory (51 files, 8 root services + 1 api-integration subdir + 1 mockData subdir):**

- Root: `RealtimeCollaborationManager.ts`, `GLImportService.ts`, `ChangeBroadcaster.ts`, `ImportPipeline.ts`, `PresenceService.ts`, `WebSocketManager.ts`, `nim.ts`, `api.ts`, `BenchmarkService.ts`
- `api-integration/`: `XeroConnector.ts`, `QuickBooksConnector.ts`, `ConnectorRegistry.ts`, `types.ts`, `RestApiClient.ts`, `BaseConnector.ts` (+ 5 .test.ts)
- `mockData/`: 19 generator + test files

**No `auditLog*` file in `src/services/`.** Hephaestus's Glob verification is correct.

### Actual audit log architecture

| Layer         | File                                 | Status                     | Notes                                                                                                  |
| ------------- | ------------------------------------ | -------------------------- | ------------------------------------------------------------------------------------------------------ |
| Engine        | `src/engines/AuditLogEngine.ts:148L` | **BUILT**                  | append-only, no hash chain yet (T-HEP-010 audit-chain verify cron cycle 8 ACCEPTED adds SHA-256 chain) |
| Planned store | `src/store/auditLogStore.ts`         | **PLANNED, NOT YET BUILT** | per ADR-008 §6 L75-79, Phase 1 (Q3 2026) per T-HEP-012 §3 M3                                           |
| Service layer | **N/A — does not exist**             | —                          | —                                                                                                      |

**The audit log is currently an ENGINE (built) + a planned STORE (not built). It is NOT a service layer, and it is NOT a zustand store yet.**

### ADR cross-references for the audit log (D-009 verified)

| ADR                         | Citation                                                                                                                 | Verifies                                           |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------- |
| ADR-008 §6 L75-79           | "`src/store/auditLogStore.ts` — the local-first store"                                                                   | planned store name is `auditLogStore` (with "Log") |
| ADR-008 L81                 | "`AuditLogEngine.ts:148L` — keep as-is (used for business audit events)"                                                 | engine is BUILT and stays                          |
| ADR-008 L102                | "Create `src/store/auditLogStore.ts` with append-only API"                                                               | planned store is `append-only`                     |
| ADR-008 L107                | "Replace direct `AuditLogEngine.log()` calls in authStore, encryptedStorage with `useAuditLogStore.getState().append()`" | planned store hook is `useAuditLogStore`           |
| ADR-006 L61, L81, L86, L107 | per-store `retention: { class: 'audit' }` config + `legalHold: boolean`                                                  | audit-class retention policy                       |
| ADR-007 L133                | "Every `setItem` on an `encryption: true` store logs to `auditLogStore`"                                                 | encryption events flow to planned store            |
| ADR-009 L190                | CODEOWNERS-required file                                                                                                 | planned store is high-security                     |

**Planned for: Phase 1 (Q3 2026) per T-HEP-012 §3 M3, behind M2 SOC 2 RFP kickoff.**

---

## §3 · APPLIED ERRATUM (3 in-place edits + 1 propagated fix)

### Edit 1 — `BOARD_SCAN_D001_D010_2026-06-13.md` L17

**Before:** `audit logging is a service in `src/services/auditLog/` not a store`

**After:** `audit logging lives in `src/engines/AuditLogEngine.ts:148L`engine + planned`src/store/auditLogStore.ts`per ADR-008 L75-79 — NOT YET BUILT. There is NO`src/services/auditLog/` — Glob verified 2026-06-13. **See T-AT-009 ERRATUM 2026-06-13 — initial draft mis-located the audit log as a service layer; corrected per Hephaestus D-009 triangulation.**`

### Edit 2 — `BOARD_SCAN_D001_D010_2026-06-13.md` L129-131 (3-line block)

**Before:**

> **Actual:** No `auditStore.ts` in `src/store/`. The 35-store inventory (verified in T-AT-012 v3) contains no `auditStore`. Audit logging is a service layer (`src/services/auditLog/`) per ADR-008 — not a zustand store.

**After:**

> **Actual:** No `auditStore.ts` in `src/store/`. The 35-store inventory (verified in T-AT-012 v3) contains no `auditStore`. Audit logging lives in `src/engines/AuditLogEngine.ts:148L` (engine, BUILT, append-only) + planned `src/store/auditLogStore.ts` per ADR-008 §6 L75-79 (NOT YET BUILT). There is NO `src/services/auditLog/` — Glob verified 2026-06-13. The audit log is NOT a zustand store yet.

### Edit 3 — `BOARD_SCAN_D001_D010_2026-06-13.md` L133

**Before:** `Reference ADR-008 (audit logging service) for the regulated-data trail handling. The audit log is NOT a zustand store; it lives in `src/services/auditLog/`.`

**After:** `Reference ADR-008 (audit logging engine + planned store) for the regulated-data trail handling. The audit log is NOT a zustand store yet; it lives in `src/engines/AuditLogEngine.ts:148L`(engine, BUILT) and will move to`src/store/auditLogStore.ts` per ADR-008 Phase 1 (Q3 2026).`

### Edit 4 — `jsdoc-cascade-v1.2-polish-2026-06-13.md` L136 (propagated fix)

**Before:** `Confirm auditStore is service layer (`src/services/auditLog/` per ADR-008)`

**After:** `Confirm `auditLogStore`is per ADR-008 L75-79 (planned, not yet built);`AuditLogEngine.ts:148L`is the BUILT engine; NO`src/services/auditLog/` (Glob verified 2026-06-13)`

**Net delta:** 0 lines added (in-place text replacements). Both files unchanged in LOC (BOARD_SCAN 182L, jsdoc-cascade-v1.2-polish 173L).

---

## §4 · POST-ERRATUM D-009 RE-VERIFICATION

### Grep `src/services/auditLog` (post-erratum)

| Match | File                                                           | Context                                    | Verdict                   |
| ----- | -------------------------------------------------------------- | ------------------------------------------ | ------------------------- |
| 1     | `BOARD_SCAN_D001_D010_2026-06-13.md:17`                        | "There is NO `src/services/auditLog/`"     | ✓ CORRECTIVE              |
| 2     | `BOARD_SCAN_D001_D010_2026-06-13.md:129`                       | "There is NO `src/services/auditLog/`"     | ✓ CORRECTIVE              |
| 3     | `jsdoc-cascade-v1.2-polish-2026-06-13.md:136`                  | "NO `src/services/auditLog/`"              | ✓ CORRECTIVE              |
| 4     | `ADR-012-data-storage-scoping.md:68` (Hephaestus's footnote †) | "There is **no** `src/services/auditLog/`" | ✓ CORRECTIVE (Hephaestus) |
| 5     | `ADR-012-data-storage-scoping.md:195` (changelog v0.1.1)       | "NO `src/services/auditLog/`"              | ✓ CORRECTIVE (Hephaestus) |

**All 5 remaining `src/services/auditLog/` mentions are in CORRECTIVE context (negating the existence of the directory).** 0 claims that audit logging is a service.

### Glob `src/services/audit*` (post-erratum, repeated)

**Result: 0 matches.** Confirmed: no `src/services/audit*` file or directory exists in the codebase.

### Glob `src/engines/AuditLogEngine*` (post-erratum, repeated)

**Result: 2 matches** — `src/engines/AuditLogEngine.ts:148L` (engine) + `src/engines/AuditLogEngine.test.ts` (test). Confirmed: engine is BUILT.

### Glob `src/store/auditLog*` (post-erratum, repeated)

**Result: 0 matches.** Confirmed: planned store is NOT yet built.

### File LOCs (post-erratum)

| File                                      | Before erratum | After erratum | Delta |
| ----------------------------------------- | -------------- | ------------- | ----- |
| `BOARD_SCAN_D001_D010_2026-06-13.md`      | 182L           | 182L          | 0     |
| `jsdoc-cascade-v1.2-polish-2026-06-13.md` | 173L           | 173L          | 0     |

**Net erratum delta: 0 lines added, 4 lines corrected in place.** D-009 violation fully remediated.

---

## §5 · ROOT-CAUSE ANALYSIS — WHY I MADE THIS MISTAKE

**The D-009 violation pattern:**

1. I scanned ADR-008 (audit logging + audit chain) and ADR-012 (data storage scoping) and saw references to an "audit log"
2. Without Glob-verifying, I assumed "audit log = service" because most FP&A logs in similar codebases are service-layer
3. I conflated `src/services/` (51 files) with `src/engines/` (202 engines) and `src/store/` (35 stores) — three distinct architectural layers

**Why Hephaestus caught it:** Hephaestus is the **owning Muse** for ADR-008, ADR-009, ADR-007 (security) and knows the audit log architecture intimately. He also has D-009 triangulation discipline (he ran Glob before correcting me).

**Why I didn't catch it myself:** I was working from docs/adr/ files (textual claims) without Glob-verifying against the filesystem. This is exactly the kind of D-009 violation the cycle-5 codifications are designed to prevent — but I had only applied them to source code, not to architectural claims about directory structures.

### Lesson codified (6th codification, strengthened 5th)

**Cycle-5 codification 5 (cross-Muse task description drift) strengthened:** D-009 violations can also appear in the audit's own claims, not just in the audited deliverable. Every architectural claim about a file path or directory structure must be Glob-verified, not just claimed because a doc said so.

**Discipline:** When a doc references a path under `src/`, Glob it before claiming "this is where X lives." If the path doesn't exist, the claim is a fabrication — even if a different doc said it was there.

**Cross-reference:** T-AT-012 v3 caught Apollo's T-AP-010 cubeStore fabrication. T-AT-009 initial draft caught ADR-012's auditStore fabrication. Hephaestus caught Athena's `src/services/auditLog/` fabrication. **The same D-009 discipline applies at every level of the audit stack.**

---

## §6 · REFINED T-MN-013 FOLLOW-UP CANDIDATES (5 → 5, refined)

The T-MN-013 follow-up candidates I sent Mnemosyne earlier were 5. After the erratum, the candidates are REFINED (1 fix is already done by Hephaestus):

| #   | Candidate                                         | Pre-erratum status | Post-erratum status                        | Owner        |
| --- | ------------------------------------------------- | ------------------ | ------------------------------------------ | ------------ |
| 1   | ADR-010 stale count fix (14→24 stores)            | P0 pending         | P0 pending (unchanged)                     | Mnemosyne    |
| 2   | ADR-012 incomplete classification (15→35 stores)  | P0 pending         | P0 pending (unchanged)                     | Mnemosyne    |
| 3   | ADR-012 auditStore fabrication removal            | P0 pending         | **✅ DONE by Hephaestus (ADR-012 v0.1.1)** | Hephaestus ✓ |
| 4   | D-XXX→ADR cross-references (corpus disconnect)    | P1 pending         | P1 pending (unchanged)                     | Mnemosyne    |
| 5   | ADR→D-XXX cross-references + ADR-008/009 metadata | P3 pending         | P3 pending (unchanged)                     | Mnemosyne    |

**Net T-MN-013 work: 4 candidates remaining** (1 done by Hephaestus, 4 pending Mnemosyne).

---

## §7 · VERDICT

**T-AT-009 ERRATUM: NEEDS-FIX → APPLIED (3 edits + 1 propagation fix) · 0 NEEDS-FIX remaining · 0 HOLD · 0 fabrication remaining**

**Status:**

- ✅ D-009 violation acknowledged explicitly (this section)
- ✅ 3 corrections applied to `BOARD_SCAN_D001_D010_2026-06-13.md` (L17, L129, L133)
- ✅ 1 propagated fix applied to `jsdoc-cascade-v1.2-polish-2026-06-13.md` (L136)
- ✅ D-009 re-verification passed (5 corrective mentions, 0 false-positive claims)
- ✅ ADR-012 v0.1.1 fix by Hephaestus accepted
- ✅ T-MN-013 candidate #3 marked DONE; 4 remaining
- ✅ Cycle-5 codification 5 strengthened with new pattern (D-009 violation can appear in the audit's own claims)
- ✅ Memory updated with the lesson

**Cross-Muse handoffs (post-erratum):**

- → **Hephaestus** (THANKS — accept ADR-012 v0.1.1)
- → **Leader** (T-AT-009 erratum filed, no impact on cycle 8 ship)
- → **Mnemosyne** (T-MN-013 refined: 4 candidates remaining, 1 done)

**🛌 D-007 terminal standby:** 1 standing offer (T-AT-010, re-validate post-Apollo push). Awaiting Apollo T-AP-010 push notification.

---

**🏛️ Athena verdict — 9th Honest Labeling Muse moment, D-009 violation acknowledged and remediated in 10 min. Cycle 8 ship-readiness unchanged.**

**Discipline reinforced: every architectural claim about a file path must be Glob-verified. If I can't Glob it, I can't claim it.**
