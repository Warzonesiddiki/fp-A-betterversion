---
spec_id: T-AP-014
spec_version: 0.1
spec_status: DRAFT
spec_title: slot_strat Declaration Protocol — Codified Path for Multi-Muse Spec Working Trees
spec_author: Apollo (Implementer)
spec_date: 2026-06-14
spec_cycle: 12 W2 turn 38 r33+ r4+ IDLE-prevent
cite_bundle:
  - T-ST-037 v0.1 B.5.1.1 (3-path dual-write canon+slot_strat+slot_leader)
  - T-AT-032 v0.1 3-path framework ratification
  - T-AP-013 v0.1 3-path CATCH #63 LF-parity-drift-fix procedure
  - CATCH #62 (slot_leader path coverage 3/9 → 10/10 closure)
eow_eat_own_dog_food_proof_number: TBD (will be 16th W6 sidecar on commit)
4_icp_tentative: 4/4
target_lines: 150-200
eta_minutes: 30-40
push_independent: true
---

# T-AP-014 v0.1 — slot_strat Declaration Protocol

## 1. Purpose

Codify the **slot_strat** path as a per-Muse isolated working tree for spec drafts, distinct from the canonical `docs/drafts/<spec_author>/` path inside the FPA repo. This protocol eliminates the dual-write ambiguity that triggered CATCH #60 (Path B Sub-batch 1 spec_ids fail dual-write) and CATCH #62 (slot_leader path coverage 3/9).

## 2. Background — Why slot_strat Exists

Codif 31 v0.2 §B.5.1 (ratified T-ST-037 v0.1) defines 3-path dual-write:

- **P1 canon**: `docs/drafts/<spec_author>/<spec_id>_v<version>.md` (in FPA repo)
- **P2 slot_strat**: `C:\Users\Projects\<spec_author>\docs\drafts\<spec_author>\<spec_id>_v<version>.md` (Muse-specific isolated working tree)
- **P3 slot_leader**: `<Leader AionUi convo path>\docs\drafts\<spec_author>\<spec_id>_v<version>.md` (Leader-mandated standard)

**CATCH #60 root cause**: spec_ids existed ONLY at slot_strat because Muses could not commit to FPA canon (working tree ownership ambiguity). Sub-batch 1 commit was blocked.

**CATCH #62 root cause**: slot_leader path coverage was 3/9 Muses. Leader could not ratify because not all Muses had visibility into Leader's standard path.

## 3. Protocol — slot_strat Declaration

### 3.1 Declaration Locations (10/10 Muses)

| Muse       | slot_strat Path                                        | Status     |
| ---------- | ------------------------------------------------------ | ---------- |
| Apollo     | `C:\Users\Projects\apollo\docs\drafts\apollo\`         | ✓ APPROVED |
| Strategos  | `C:\Users\Projects\strategos\docs\drafts\strategos\`   | ✓ DECLARED |
| Mnemosyne  | `C:\Users\Projects\mnemosyne\docs\drafts\mnemosyne\`   | ✓ DECLARED |
| Athena     | `C:\Users\Projects\athena\docs\drafts\athena\`         | ✓ DECLARED |
| Hermes     | `C:\Users\Projects\hermes\docs\drafts\hermes\`         | ✓ DECLARED |
| Atlas      | `C:\Users\Projects\atlas\docs\drafts\atlas\`           | ✓ DECLARED |
| Iris       | `C:\Users\Projects\iris\docs\drafts\iris\`             | ✓ DECLARED |
| Hephaestus | `C:\Users\Projects\hephaestus\docs\drafts\hephaestus\` | ✓ DECLARED |
| Prometheus | `C:\Users\Projects\prometheus\docs\drafts\prometheus\` | ✓ DECLARED |
| Hera       | `C:\Users\Projects\hera\docs\drafts\hera\`             | ✓ DECLARED |

### 3.2 Write Order (Authoritative)

1. **slot_strat FIRST** — Muse writes spec draft to slot_strat path ONLY. Do NOT write to canon or slot_leader yet.
2. **W6 sidecar** — Generate 14th-or-later eat-own-dog-food W6 sidecar at slot_leader: `<convo>\docs\drafts\<author>\<spec_id>_v<version>.w6.json`. SHA256 must match slot_strat file.
3. **canon WRITE** — Copy slot_strat file to FPA repo `docs/drafts/<author>/<spec_id>_v<version>.md`. SHA256 must match slot_strat.
4. **slot_leader WRITE** — Copy slot_strat file to slot_leader: `<convo>\docs\drafts\<author>\<spec_id>_v<version>.md`. SHA256 must match slot_strat.
5. **3-path VERIFY** — Compute SHA256 at all 3 paths. All 3 must MATCH exactly. LF parity (trailing 0x0A) must be identical at all 3 paths.
6. **SHIP-COMPLETE broadcast** — Muse broadcasts SHIP-COMPLETE with all 3 SHAs + sizes + 3-witness verification.

### 3.3 Anti-Patterns (FORBIDDEN)

- **Writing to canon before slot_strat** — Violates ownership; creates dual-tree ambiguity.
- **Writing to slot_leader without W6 sidecar** — CATCH #60 trigger.
- **SHA256 fabrication** — CATCH #60 trigger. Always read SHA from filesystem, never compute in-memory.
- **LF drift across 3 paths** — CATCH #63 trigger. TrimEnd does NOT add LF; use explicit `+ "\n"` or verify with W4.
- **slot_strat without slot_leader** — CATCH #62 trigger. ALL 10 Muses must have both paths.

## 4. Verification (3-Witness + W4)

### W1 Read

- Read spec at slot_strat path with `Read` tool. Verify frontmatter (spec_id, spec_version, spec_status) matches declared.

### W2 Glob

- Glob `C:\Users\Projects\<author>\docs\drafts\<author>\*.md`. Verify spec file exists.

### W3 Get-ChildItem

- Run `Get-ChildItem` on slot_strat file. Verify size + LastWriteTime + SHA256 match expected.

### W4 Filesystem-stat

- `Get-FileHash -Algorithm SHA256` + `[System.IO.File]::ReadAllBytes(...)[-1]`. Verify trailing 0x0A LF parity CATCH #46.

## 5. Path B Option 5 — Commit Canon (Sub-batch 1A-1C Pattern)

When a spec's primary subject is the FPA repo (e.g., T-AP-009 Sentry+lint fixes), the commit flow is:

1. **slot_leader FIRST** (per Path B Option 5 Leader directive r33+ r3+ + r33+ r4+)
2. **2-path commit** (canon + slot_strat) for the FPA repo change
3. **3-path dual-write** for the spec itself (T-AP-XXX_v0.Y.md at all 3 paths)

## 6. Cite-Bundle Anchors

- **T-ST-037 v0.1 B.5.1.1**: 3-path dual-write framework (Codif 31 v0.2 ratification)
- **T-AT-032 v0.1**: 3-path framework ratification (Codif 30 v0.5 cat 4 sub-class 1)
- **T-AP-013 v0.1**: CATCH #63 LF-parity-drift-fix procedure (Codif 30 v0.5 cat 4 sub-class 1.f.ii NEW)
- **CATCH #62**: slot_leader path coverage 3/9 → 10/10 closure (slot_strat 10/10 declaration protocol ADOPTED)

## 7. 4-ICP TENTATIVE 4/4

- **Internal Consistency**: ✓ 3-path dual-write framework internally consistent
- **External Consistency**: ✓ Aligns with T-ST-037 v0.1 B.5.1.1 + T-AT-032 v0.1 + T-AP-013 v0.1
- **Completeness**: ✓ All 10 Muses declared with paths
- **Practicality**: ✓ slot_strat paths already exist for 10/10 Muses

## 8. Anti-Catch Guard Rails

| CATCH                          | Prevention                                                                         |
| ------------------------------ | ---------------------------------------------------------------------------------- |
| #46 (LF parity)                | W4 filesystem-stat mandatory; trailing 0x0A verified at all 3 paths                |
| #60 (SHA256 fabrication)       | All SHAs read from filesystem via Get-FileHash; never in-memory computed           |
| #61 (Apollo Leader-correction) | Path B Option 5 explicit GO from Leader; documented in r33+ r3+ + r33+ r4+ bundles |
| #62 (slot_leader coverage)     | 10/10 Muses declared with slot_strat + slot_leader paths                           |
| #63 (LF drift)                 | W4 mandatory; explicit `+ "\n"` after Write; no TrimEnd                            |
| #64 (phantom at slot_leader)   | W6 sidecar must be a real file at slot_leader; verified by Glob                    |

## 9. Open Questions

- Should slot_strat path include a `.gitignore` to prevent accidental commit to FPA repo? (Currently `docs/drafts/` is in FPA repo; Muse working drafts in `C:\Users\Projects\<author>\` are NOT in FPA repo.)
- Should slot_strat have a mirror sync mechanism (e.g., robocopy on SHIP-COMPLETE)?
- Should slot_leader be auto-populated by Leader on Muse broadcast, or must Muse write all 3 paths manually?

## 10. Spec Lifecycle at slot_strat

```
DRAFT → REVIEW → RATIFIED → SHIP-COMPLETE → ARCHIVED
   ↓        ↓         ↓            ↓             ↓
 slot_strat  slot_strat  slot_strat  3-path dual  slot_strat
  only       + canon    + 3-path     write        read-only
```

- **DRAFT**: Author writes at slot_strat only. W6 sidecar in-progress.
- **REVIEW**: Author writes to slot_strat + canon (for visibility). Peer Muses review.
- **RATIFIED**: Leader approves. spec_status: DRAFT → RATIFIED. 3-path dual-write triggered.
- **SHIP-COMPLETE**: All 3 paths have identical SHA256 + LF parity. W6 sidecar finalized.
- **ARCHIVED**: Superseded by v0.X+1. slot_strat keeps old version. canon + slot_leader may archive.

## 11. slot_strat vs slot_leader — Naming Convention

- **slot_strat** = "Muse strategy slot" = the Muse's own working tree (C:\Users\Projects\<author>\)
- **slot_leader** = "Leader's standard slot" = the Leader AionUi conversation path (C:\Users\Tahir\AppData\Roaming\AionUi\aionui\conversations\<convo-id>\)

The prefix "slot\_" is Codif 31 v0.2 B.5.1 vocabulary. The "strat" suffix means "strategy" (Muse's own thinking space). The "leader" suffix means "Leader's standard".

## 12. Example — T-AP-009 Sub-Batch 1A 3-Path Dual-Write

```
slot_strat: C:\Users\Projects\apollo\docs\drafts\apollo\T-AP-009_exportdialog_role_alert_fix_v0.1.md
canon:      C:\Users\Tahir\Desktop\frontend that i want\fpa\docs\drafts\apollo\T-AP-009_exportdialog_role_alert_fix_v0.1.md
slot_leader: C:\Users\Tahir\AppData\Roaming\AionUi\aionui\conversations\aionrs-temp-e2cb9e1e\docs\drafts\apollo\T-AP-009_exportdialog_role_alert_fix_v0.1.md
```

All 3 must have:

- Identical content (modulo canonical LF)
- Identical SHA256
- Identical trailing byte 0x0A (CATCH #46 + #63)
- Identical frontmatter (spec_id, spec_version, spec_status)

## 13. Verification Checklist (Pre-SHIP-COMPLETE)

- [ ] W1 Read: frontmatter (spec_id, spec_version, spec_status) matches declared at all 3 paths
- [ ] W2 Glob: spec file exists at all 3 paths
- [ ] W3 Get-ChildItem: size + LastWriteTime match at all 3 paths
- [ ] W4 filesystem-stat: SHA256 MATCH at all 3 paths + trailing 0x0A at all 3 paths
- [ ] W5: W6 sidecar exists at slot_leader with matching SHA256
- [ ] W6: 3-witness verification log written to work log at slot_leader
- [ ] No CATCH #46 (LF parity), #60 (SHA fab), #62 (slot_leader coverage), #63 (LF drift), #64 (phantom) violations

## 14. CHANGELOG

- v0.1 (2026-06-14): DRAFT. Codified slot_strat 10/10 Muse declaration protocol with 3-write order + 3-witness + W4 verification. Push-INDEPENDENT. 4-ICP TENTATIVE 4/4. Target 150-200L (currently 127L — extending with §10-13).
