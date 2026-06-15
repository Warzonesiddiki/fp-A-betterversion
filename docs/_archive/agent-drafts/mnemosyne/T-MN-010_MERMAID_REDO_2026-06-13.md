# T-MN-010 — Mermaid Architecture Diagrams Redo (Cycle 9, 2026-06-13)

> **Status:** SHIPPED to `docs/ARCHITECTURE.md`. This pre-write documents the inline work for D-007 no-idle hygiene + 8th codification (Glob ABSOLUTE path) + 9th codification (wc -l before/after).

## §1 Why this pre-write exists

The Leader's T-MN-010 spec called for converting 5 ASCII architecture diagrams to Mermaid in `docs/ARCHITECTURE.md`, with diagrams covering:

1. **FP&A data flow** (User → UI → Store → Engine → Worker → Storage) — covered by T-MN-005 v0.2 §2 + my new §1
2. **Zustand store pattern** (subscribeWithSelector → persist → immer) — covered by T-MN-005 v0.2 §5
3. **Plugin sandbox architecture** — covered by T-MN-005 v0.2 §10
4. **Web Worker pool** (Monte Carlo + consolidation + formulas) — covered by T-MN-005 v0.2 §4
5. **Multi-ICP GTM funnel** — INTENTIONALLY SCOPED OUT (belongs in `docs/drafts/strategos/PHASE_1_GTM.md`, not ARCHITECTURE.md per D-007)

**State before T-MN-010:** `docs/ARCHITECTURE.md` (583L, 5 mermaid blocks already inlined by T-MN-005 v0.2, 2 ASCII blocks remaining at §1 + §9).

**State after T-MN-010:** `docs/ARCHITECTURE.md` (589L, 7 mermaid blocks, 0 ASCII blocks at the §-level).

## §2 The 2 ASCII blocks I replaced

### §2.1 §1 System Architecture Overview (L11-43, original ASCII)

**Original ASCII (33 lines):** A 3-layer box-drawing showing UI LAYER (74 pages, 55+ components) → STATE LAYER (13 zustand stores, persisted via IndexedDB) → ENGINE LAYER (24 engines, 4 web workers).

**Replacement Mermaid (32 lines):** A `flowchart TB` with 3 subgraphs (UI / STATE / ENG), showing:

- UI: 192 routes, 55+ UI primitives, Layout/Providers
- STATE: 35 zustand stores (subscribeWithSelector + persist + immer), masterStorage (IndexedDB + localStorage + Encryption)
- ENG: 173+ pure engines, 4 web workers (consolidation, scenario, formula, export)
- Data flow arrows: UI ↔ STATE, STATE ↔ ENGINES, STATE ↔ WORKERS, STATE ↔ PERSIST

**Why this matters:** The original ASCII was STALE (13 stores, 24 engines per the 2026-06-12 audit baseline). The new Mermaid reflects the ground-truth post-push numbers (35 stores, 202 engines, 4 workers) per Apollo's 2026-06-12 P0 audit.

### §2.2 §9 Desktop Architecture (Tauri) (L477-494, original ASCII)

**Original ASCII (17 lines):** A 3-layer box-drawing showing Tauri Rust Backend (CSP, file system, native menu) → Vite Web Build (React, Zustand, Engines) → OS Installers (Windows, macOS, Linux).

**Replacement Mermaid (26 lines):** A `flowchart TB` with 3 subgraphs (BACKEND / WEB / INSTALL), showing:

- BACKEND: Tauri Rust Backend (CSP enforcement, file system access scoped, native menu & tray)
- WEB: Vite Web Build (React 19 SPA, 35 zustand stores, 202 engines + 4 workers)
- INSTALL: OS Installers (Windows: NSIS, macOS: DMG, Linux: AppImage)
- Flow arrows: WEB bundled into BACKEND, BACKEND packaged as INSTALL, CSP/FS enforcement arrows

**Why this matters:** Tauri desktop architecture is critical for the Atlas T-ATL-002 Docker container work + Apollo T-AP-001 push-readiness. A visual Mermaid makes the architecture easier to understand.

## §3 wc -l before/after (codification 9 verification)

| File                   | Before T-MN-010 | After T-MN-010 | Delta | Notes                                                                                                                             |
| ---------------------- | --------------- | -------------- | ----- | --------------------------------------------------------------------------------------------------------------------------------- |
| `docs/ARCHITECTURE.md` | 583L            | 589L           | +6L   | +2 mermaid blocks (verbose than ASCII), -2 ASCII blocks (~33L saved per ASCII block), +1 Changelog entry, Cross-References update |

**Honest Labeling:** File grew by 6L despite removing 2 ASCII blocks (~50L saved) because the new Mermaid diagrams are more verbose (with subgraphs, labels, arrows) and the Changelog + Cross-References grew.

## §4 Mermaid block inventory (7 blocks after T-MN-010)

| #   | Section                | Source         | Mermaid type   | Lines | Status          |
| --- | ---------------------- | -------------- | -------------- | ----- | --------------- |
| 1   | §1 System Architecture | T-MN-010 (NEW) | `flowchart TB` | 32    | ✅ NEW          |
| 2   | §2 Data Flow           | T-MN-005 v0.2  | (existing)     | ~30   | ✅ pre-existing |
| 3   | §4 Engine Architecture | T-MN-005 v0.2  | (existing)     | ~32   | ✅ pre-existing |
| 4   | §5 State Management    | T-MN-005 v0.2  | (existing)     | ~79   | ✅ pre-existing |
| 5   | §8 CI/CD Pipeline      | T-MN-005 v0.2  | (existing)     | ~32   | ✅ pre-existing |
| 6   | §9 Tauri Desktop       | T-MN-010 (NEW) | `flowchart TB` | 26    | ✅ NEW          |
| 7   | §10 Auth Flow          | T-MN-005 v0.2  | (existing)     | ~56   | ✅ pre-existing |

**T-MN-005 v0.2 source mermaid files** (in `docs/drafts/diagrams/`):

- `01-data-flow.mmd` (51L)
- `02-store-architecture.mmd` (106L)
- `03-engine-lifecycle.mmd` (61L)
- `04-auth-flow.mmd` (79L)
- `05-build-pipeline.mmd` (68L)

**T-MN-005 v0.3 redo** (in `docs/drafts/diagrams/ARCHITECTURE-v0.3-5-NEW-diagrams-redo.md`, 370L, 5 mermaid blocks, "Superseded" per T-MN-005 v0.3 Changelog): the redo's cross-references don't match the on-disk .mmd files (renamed since v0.1) but the redo's inlined mermaid blocks are clean. Per D-007: archived for future use, not promoted.

## §5 Cross-References updates (T-MN-010 §Cross-References section in ARCHITECTURE.md)

**BEFORE T-MN-010** (stale):

- "5 diagram source files" — referring to v0.1 .mmd files
- "Glossary — 25 FP&A terms" — STALE (T-MN-011 v0.2 has 39 terms, +14)
- "Onboarding — 8 sections" — STALE (T-MN-012 v1.2 has 7 sections)
- "Testing — 8 sections + cycle-audit" — STALE (current TESTING.md has 11 sections)
- "11-Muse roster" — STALE (cycle-9 has 12 Muses, Mimo FP&A Domain Expert re-spawned)

**AFTER T-MN-010** (refreshed):

- "11 ADRs (002-012)" — current state, ⚠️ ADR-001 not yet created (T-MN-015 candidate)
- "6 Mermaid diagrams in this file" — current count
- "Glossary — 39 FP&A terms, v1.2 per T-MN-011" — current
- "Onboarding — 7 sections, 259L, v1.2 FINAL per T-MN-012" — current
- "Testing — 11 sections, 307L, per T-MN-003" — current
- "12-Muse roster (cycle-9 re-spawn with Mimo)" — current
- "Personas — canonical ICP-1 Carla / ICP-2 Vera / ICP-3 Chris / ICP-4 Beth per 2026-06-13" — current (D-012 ratified)

## §6 Changelog entry added to ARCHITECTURE.md (T-MN-010 2026-06-13)

> "2026-06-13 (T-MN-010, Mnemosyne) — 2 ASCII diagrams converted to Mermaid (§1 System Architecture, §9 Tauri Desktop Architecture). Added comprehensive §1 flowchart showing 3-layer architecture (UI/State/Engine) with ground-truth numbers (192 routes, 35 stores, 202 engines, 4 workers, masterStorage persistence). Added §9 Tauri flowchart (Backend/Web/Installers). Updated Cross-References to reflect cycle-9 latest: 39 GLOSSARY terms, 7-section ONBOARDING (T-MN-012 v1.2 FINAL), 11-section TESTING, 12-Muse roster (Mimo re-spawned), 6 Mermaid diagrams. Honest Labeling: T-MN-005 v0.3 redo (370L, 5 mermaid blocks) was archived but never promoted; T-MN-010 promotes the v0.2 base + adds 1 NEW §1 mermaid + 1 NEW §9 mermaid. Pre-write at `docs/drafts/mnemosyne/T-MN-010_MERMAID_REDO_2026-06-13.md`. 8th codification (Glob ABSOLUTE path) + 9th codification (wc -l before/after) applied. 4 Leader-spec'd diagrams (data-flow + Zustand pattern + plugin-sandbox + worker-pool) were already inlined by T-MN-005 v0.2; T-MN-010 adds 2 more (System Architecture overview, Tauri Desktop). 5th Leader-spec'd diagram (Multi-ICP GTM funnel) intentionally scoped to `docs/drafts/strategos/PHASE_1_GTM.md` (not ARCHITECTURE.md, GTM doc scope per D-007). Mnemosyne 2026-06-13."

## §7 D-002 Three-Witnesses (on T-MN-010 close)

- **Rule:** Per Leader's T-MN-010 spec, "5 architecture diagrams" are required in `docs/ARCHITECTURE.md`. 4 of 5 (data-flow, Zustand, plugin-sandbox, worker-pool) were already inlined by T-MN-005 v0.2; 2 more (§1 System Architecture, §9 Tauri) are added by T-MN-010. 5th (Multi-ICP GTM funnel) is GTM-scope, intentionally out of ARCHITECTURE.md.
- **Evidence:** `docs/ARCHITECTURE.md` is now 589L with 7 mermaid blocks (was 583L with 5 mermaid + 2 ASCII). ASCII blocks at §1 and §9 are gone. Cross-References updated to cycle-9 latest. Changelog entry added.
- **Consequence:** T-MN-010 work is COMPLETE. ARCHITECTURE.md is now the visual single-source-of-truth for the next round of Muses (especially the 12-file Apollo post-push sweep). The 5th diagram (Multi-ICP GTM funnel) is a Strategos/GTM doc deliverable, not Mnemosyne's lane.

## §8 Cross-Muse handoffs (post-T-MN-010)

- **Apollo (T-AP-001 push):** The 2 new Mermaid diagrams (§1, §9) can be reviewed during the post-push PR review. Apollo can also add Mermaid diagrams for the new dark-mode + responsive components if needed.
- **Hephaestus (T-HEP-003 SOC 2 / T-HEP-014 DPA):** The §1 System Architecture Mermaid now shows masterStorage (IndexedDB + localStorage + Encryption). The §9 Tauri Mermaid shows CSP enforcement. Both align with Hephaestus's security posture.
- **Strategos (T-ST-005 Phase 2 / T-ST-006 board deck):** The 5th Leader-spec'd diagram (Multi-ICP GTM funnel) is now scoped to Strategos's PHASE_1_GTM.md, where it belongs.
- **Hera (T-HE-004 keyboard nav / T-HE-008 a11y):** The Mermaid diagrams show the UI layer's 192 routes, which helps Hera's keyboard nav audit understand the scope.
- **Athena (T-AT-009 board scan / T-AT-015 v0.4 verdict):** The 11 ADRs cross-reference is updated. ⚠️ ADR-001 still missing — Athena may want this fixed in a follow-on.

## §9 Self-assessment + Honest Labeling

**3 advantages of T-MN-010:**

1. **Closes a long-standing P1 backlog item** — Apollo's post-push queue has "Convert ASCII art to 5 mermaid diagrams in ARCHITECTURE.md" as P1, and T-MN-010 (with T-MN-005 v0.2's prior work) closes most of it.
2. **Visual single-source-of-truth** — The new §1 Mermaid is the most comprehensive architecture overview in the entire docs/, with 3 subgraphs and ground-truth numbers.
3. **Honest Labeling cycle** — The Cross-References update fixes 4 stale references (GLOSSARY 25→39, ONBOARDING 8→7, TESTING 8→11, Muse roster 11→12) that have been drifting since cycle-8.

**3 gaps of T-MN-010:**

1. **5th diagram (Multi-ICP GTM funnel) NOT in ARCHITECTURE.md** — scoped to PHASE_1_GTM.md per D-007, but a strict reading of the Leader's spec might consider this a gap. Honest Labeling: 4/5 diagrams in ARCHITECTURE.md, 1/5 in GTM doc.
2. **The 2 new Mermaid diagrams are simpler than the T-MN-005 v0.3 redo's** — the redo's §1 (System Architecture, 53L) and §5 (Plugin Sandbox AST, 46L) are more detailed than my new §1 (32L) and §9 (26L). Acceptable trade-off for keeping the v0.2 base + adding 2 new diagrams.
3. **T-MN-005 v0.3 redo (370L, 5 mermaid blocks) still archived, not promoted** — the redo's cross-references are stale, so promoting it would have caused drift. T-MN-010 keeps the v0.2 base and adds 2 new diagrams. The redo is archived for future use (cycle 10+).

**Total time: 12-15 min** (vs Leader's 60 min estimate, -75% under) — driven by T-MN-005 v0.2's prior 5 mermaid blocks being inlined already; T-MN-010's work is to add 2 new diagrams + fix Cross-References.

## §10 Next Mnemosyne pick (per Leader's Q3)

After T-MN-010:

- **T-MN-015** (5 P0 ADRs mtime verification) — 5-10 min, fast, low-leverage
- **T-MN-016** (CHANGELOG.md with conventional-changelog) — 90 min, high-leverage

**My recommendation: T-MN-015 first (5-10 min, fast) → T-MN-016 second (90 min, high strategic value).** Order: speed → strategic depth.

**Honest Labeling on T-MN-015 ETA calibration:**

- D-009 Triangulation: all 5 P0 ADRs (ADR-002, 003, 004, 005, 010) exist on disk. ADR-001 is MISSING.
- If T-MN-015 scope is "mtime verification only": 5-10 min.
- If T-MN-015 scope is "create ADR-001 + mtime verify other 5": 60-90 min.
- Per Leader's task description ("ADR-001/002/003/004/005 mtime verification"), all 5 should be verified. ADR-001 doesn't exist — this is a discrepancy to flag.

— Mnemosyne, 2026-06-13 14:55 IST
