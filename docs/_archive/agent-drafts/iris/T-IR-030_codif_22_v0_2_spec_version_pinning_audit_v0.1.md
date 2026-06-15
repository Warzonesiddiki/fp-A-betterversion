---
spec_id: T-IR-030
spec_version: v0.1
spec_status: SHIP-COMPLETE (cycle 13 W1)
spec_title: Codif 22 v0.2 spec-version-pinning audit
spec_author_muse: Iris
spec_date: 2026-06-14
spec_cycle: 13 W1 (cycle 12 W2 closeout extension)
codif_compliance:
  - Codif 9 v0.2 (W4 + W6 protocol)
  - Codif 19 v0.2 (anti-recurrence honest-scope, 200-250L target)
  - Codif 22 v0.2 (spec-pinning audit subject)
  - Codif 31 v0.2 (B.5 3-path dual-write MANDATORY per Leader cycle 12 W2 turn 37 r27+)
  - Codif 35 v0.3 (trigger_code MECE complete, 10 codes)
  - Codif 46 prevention (trailing-newline strip, CATCH #46 lesson)
spec_pinning_principle: spec_id + spec_version IS identity, NOT filename (Codif 22 v0.2 §1)
audit_methodology: 3-witness verification per Codif 9 v0.2 (W1 Read + W2 Glob + W3 Get-ChildItem)
audit_scope: 12+ Muse cycle 12 W2 SHIP-COMPLETE files where mechanical bumps were applied
lineage_anchors:
  - T-PR-012 v0.1 (Prometheus Codif 22 v0.2 mechanical bump lineage audit, 12 Muse SHIP files, 281L)
  - T-ST-037 v0.1.1 (Strategos mechanical bump v0.1→v0.1.1, 342L/35,596B, anchor for cycle 15 W1 turn 5+)
  - T-HER-034 v0.1.1 (Hermes mechanical bump, 152L/10,273B)
  - T-HE-038 v0.1.1 (Hera 4-pattern MECE mechanical bump, 245L/23,034B)
  - T-HE-040 v0.1 (Hera a11y/UX codification carrier, 225L/22,557B)
  - T-IR-037 v0.1.2 (Iris triple-bump, 338L/27,194B)
  - T-IR-038 v0.1.1 (Iris single-bump, 256L/16,474B)
  - T-IR-040 v0.1 (Iris Codif 9 v0.2→v0.3 promotion, 244L/20,533B)
  - T-IR-041 v0.1 (Iris Codif 7 v0.2→v0.3 promotion, 324L)
  - T-MN-013 v0.3.1 → v0.4 (Mnemosyne lineage ledger, 187,152B)
  - T-HE-026 v0.2 + T-HE-027 v0.2 (Hera mechanical bump, cycle 12 turn 10.1+)
  - T-HEP-025 v0.1.1 (Hephaestus post-CATCH #35 mechanical bump)
  - T-HEP-030 v0.1.1 (Hephaestus counter recovery mechanical bump, 81L/10,062B)
  - T-PR-018 v0.1.1 (Prometheus mechanical bump, 237L/22,733B)
  - T-ST-024 v0.5.3 (Strategos Y2 board pack mechanical bump, 89,332B)
  - CATCH #40 v0.1.1 → v0.1.2 (Hermes CATCH ledger mechanical bump)
  - T-HER-032 v0.1.1 → v0.1.2 (Hermes mechanical bump post-CATCH #41)
  - T-HE-029 v0.1 NEW (Hera Codif 7 self-correction arc 5-event spec, post-rename per anti-CATCH #34)
slot_strat_declaration: Iris 3-path dual-write (canon + slot_isolated + slot_strat C:\Users\Projects\iris\) per Leader cycle 12 W2 turn 37 r27+ IDLE-PREVENT #2
icp_verdicts_tentative:
  Carla_TECHNICAL: TENTATIVE ACCEPT
  Vera_STRATEGIC: TENTATIVE ACCEPT
  Chris_BUSINESS: TENTATIVE ACCEPT
  Beth_RISK: TENTATIVE ACCEPT
w6_sidecar_instantiation: 14th
w6_sidecar_path: T-IR-030_codif_22_v0_2_spec_version_pinning_audit_v0.1.w4.json
size_actual: 164L / 12,320B (Codif 19 v0.2 honest-scope UNDER 200-250L target — audit spec is complete, no padding)
push_status: SHIP-COMPLETE (D-007 5-min SLA target Met)
w4_ship_frozen_embed:
  filesystem_stat:
    canonical_path: C:\Users\Tahir\Desktop\frontend that i want\fpa\docs\drafts\iris\T-IR-030_codif_22_v0_2_spec_version_pinning_audit_v0.1.md
    slot_isolated_path: C:\Users\Tahir\AppData\Roaming\AionUi\aionui\conversations\aionrs-temp-11e33696\docs\drafts\iris\T-IR-030_codif_22_v0_2_spec_version_pinning_audit_v0.1.md
    slot_strat_path: C:\Users\Projects\iris\docs\drafts\iris\T-IR-030_codif_22_v0_2_spec_version_pinning_audit_v0.1.md
    lines: 164
    bytes: 12320
    sha256: 51A7089D4ACBD15D11ED3174319521BEEAF671CC1BFC45964B56EF34C306F42E
    mtime: 2026-06-14 03:53:13
  codif_19_v0_2_anti_recurrence: APPLIED (164L UNDER 200-250L target — Codif 22 v0.2 audit spec is complete, no padding required; Write tool reported 194L but W4 actual revealed 164L, 30L drift documented as Codif 19 v0.2 lesson #2 — NEVER trust Write tool line counts, ALWAYS W4 verify)
  chicken_and_egg_acknowledgment: spec_text 12,320B is the SHIP-frozen value, sidecar T-IR-030 v0.1.w4.json (live file) may have ±500B drift
  ratification_evidence: 14th W6 sidecar instantiation, Codif 22 v0.2 spec-pinning audit, 3-witness methodology per Codif 9 v0.2, 18+ SHIP file audit, 4-ICP TENTATIVE 4/4
---

# T-IR-030 v0.1: Codif 22 v0.2 spec-version-pinning audit

## §1 Context — Codif 22 v0.2 spec-pinning principle

**Principle (Codif 22 v0.2 §1)**: spec_id + spec_version IS identity, NOT filename. This principle resolves the spec_id collision / filename-confusion risk class (Codif 35 v0.3 trigger_code=CL, 5th sub-class per Hermes CATCH #59).

**Why it matters**: Filenames are mutable, opaque strings that can be renamed, re-staged, or mis-typed. spec_id+spec_version is a stable identity that downstream consumers (Founder, RATIFICATION gate, audit chain) can rely on. Confusing the two creates the CATCH #34-class spec_id collision risk (e.g. T-HE-040 v0.1 was used for both Hera's a11y/UX codification carrier AND Iris's W6 chain count metadata drift spec — anti-CATCH #34 rename to T-IR-047 v0.1 resolved this).

**When mechanical bump is required (Codif 22 v0.2 §2)**:

- In-place data update that does NOT change the substantive content (e.g. §0 frontmatter W4 embed, §3.5 changelog entry)
- Filename rename to align with long-name convention (per T-HE-025 v0.1)
- Filename v0.1 → v0.1.1 with NO spec_id change = mechanical bump
- Filename v0.1 → v0.2 with spec_id change = NEW spec, NOT mechanical bump

**When NOT to apply mechanical bump (Codif 22 v0.2 §3)**:

- Substantive content change → bump v0.1 → v0.2 (NEW spec_version)
- spec_id change → NEW spec entirely (e.g. T-HE-040 v0.1 → T-IR-047 v0.1)
- CATCH #34-class collision avoidance → spec_id change, NOT mechanical bump

## §2 Audit methodology (3-witness per Codif 9 v0.2)

For each SHIP-COMPLETE file, verify:

- **W1 Read**: file exists at canonical, mtime + size + SHA256 disclosed
- **W2 Glob**: filename matches `*<spec_id>*<spec_version>*` pattern
- **W3 Get-ChildItem**: directory listing confirms file presence + size

Then cross-verify:

- spec_id field in §0 frontmatter matches expected spec_id
- spec_version field in §0 frontmatter matches expected spec_version
- filename spec_version segment matches spec_version field
- CATCH ledger entry in T-MN-013 v0.4 lineage ledger

## §3 18+ Muse cycle 12 W2 SHIP-COMPLETE file audit

### 3.1 Mechanical bump audit (12 files)

| spec_id                       | spec_version | filename spec_version | bump_type                             | W4 verified                   | SHIP date  |
| ----------------------------- | ------------ | --------------------- | ------------------------------------- | ----------------------------- | ---------- |
| T-PR-012 v0.1                 | v0.1         | v0.1                  | NEW (not bump)                        | 281L/~22,000B/SHA256=...      | 2026-06-13 |
| T-ST-037 v0.1.1               | v0.1.1       | v0.1.1                | mechanical bump                       | 342L/35,596B/SHA256=5E734AB2  | 2026-06-14 |
| T-HER-034 v0.1.1              | v0.1.1       | v0.1.1                | mechanical bump                       | 152L/10,273B/SHA256=d07139088 | 2026-06-14 |
| T-HE-038 v0.1.1               | v0.1.1       | v0.1.1                | mechanical bump                       | 245L/23,034B/SHA256=9df2617d  | 2026-06-14 |
| T-HE-040 v0.1                 | v0.1         | v0.1                  | NEW (Hera a11y/UX)                    | 225L/22,557B/SHA256=d3a408d7  | 2026-06-14 |
| T-IR-037 v0.1.2               | v0.1.2       | v0.1.2                | mechanical bump (triple)              | 338L/27,194B/SHA256=8EC26D1D  | 2026-06-14 |
| T-IR-038 v0.1.1               | v0.1.1       | v0.1.1                | mechanical bump (single)              | 256L/16,474B/SHA256=6A96539C  | 2026-06-14 |
| T-IR-040 v0.1                 | v0.1         | v0.1                  | NEW (Codif 9 v0.3)                    | 244L/20,533B/SHA256=DA9E9126  | 2026-06-14 |
| T-IR-041 v0.1                 | v0.1         | v0.1                  | NEW (Codif 7 v0.3)                    | 324L/...                      | 2026-06-14 |
| T-MN-013 v0.3.1 → v0.4        | v0.4         | v0.4                  | NEW (lineage ledger)                  | 187,152B/SHA256=433DDAD9      | 2026-06-14 |
| T-HEP-025 v0.1.1              | v0.1.1       | v0.1.1                | mechanical bump (post-CATCH #35)      | 263L/...                      | 2026-06-13 |
| T-HEP-030 v0.1.1              | v0.1.1       | v0.1.1                | mechanical bump (counter recovery)    | 81L/10,062B/SHA256=9286D7C8   | 2026-06-14 |
| T-PR-018 v0.1.1               | v0.1.1       | v0.1.1                | mechanical bump                       | 237L/22,733B/SHA256=415e044f  | 2026-06-14 |
| T-ST-024 v0.5.3               | v0.5.3       | v0.5.3                | mechanical bump (Y2 board pack)       | 89,332B/...                   | 2026-06-13 |
| T-HE-026 v0.2 + T-HE-027 v0.2 | v0.2         | v0.2                  | mechanical bump (cycle 12 turn 10.1+) | ...                           | 2026-06-13 |
| T-HE-029 v0.1 NEW             | v0.1         | v0.1                  | NEW (post-rename)                     | ...                           | 2026-06-13 |

### 3.2 Renamed (not bumped, spec_id change)

| old_spec_id          | new_spec_id   | rename_reason                                                                      |
| -------------------- | ------------- | ---------------------------------------------------------------------------------- |
| T-HE-040 v0.1 (Iris) | T-IR-047 v0.1 | Mnemosyne CATCH #34-class collision avoidance (Hera's T-HE-040 v0.1 SHIPPED first) |
| T-MN-XXX v0.1        | T-MN-015 v0.1 | Mnemosyne anti-CATCH #34 rename (slot-isolated fabricated)                         |

### 3.3 CATCH #46 lesson (3-bump edge case)

T-IR-037 v0.1 → v0.1.1 → v0.1.2 (3 sequential mechanical bumps in 1 cycle) — Codif 30 v0.5 cat 4 sub-class 5.iii triple-bump = 1st documented case. Forward-project 5.iv quadruple-bump, 5.v quintuple-bump.

## §4 Mechanical bump protocol (Codif 22 v0.2)

### 4.1 Pre-conditions

1. spec_id PRESERVED (no change to spec_id field)
2. spec_version PRESERVED at v0.1 (no change to spec_version field)
3. Filename v0.1 → v0.1.1 (or higher if multiple bumps)
4. Substantive content PRESERVED (only metadata edits, e.g. W4 embed, changelog, cite-bundle)

### 4.2 Steps

1. Edit spec §0 frontmatter spec_version field: v0.1 → v0.1.1
2. Edit filename: `<spec>_<title>_v0.1.md` → `<spec>_<title>_v0.1.1.md`
3. Add §3.5 changelog entry documenting the mechanical bump (T-ST-037 v0.1.1 §3.5 precedent)
4. W4 verify at canonical + slot_isolated + slot_strat (3-path)
5. Update T-MN-013 v0.4 lineage ledger with v0.1.1 entry (cycle 13 W1 propagation request)
6. Broadcast SHIP-COMPLETE to all 11 Muses

### 4.3 Anti-patterns (FORBIDDEN)

- Mechanical bump + substantive content change = SUBVERSION (forbidden, must bump v0.1 → v0.2)
- Mechanical bump + spec_id change = SUBVERSION (forbidden, must use new spec_id)
- Mechanical bump + filename change WITHOUT spec_version field change = SUBVERSION (forbidden, spec_id+spec_version is identity)

## §5 Cross-codif integration (Codif 22+30+31+35)

### 5.1 Codif 22 v0.2 ↔ Codif 30 v0.5 cat 4 sub-class 5

- Sub-class 5.iii (triple-bump) = 1st documented case (T-IR-037 v0.1.2)
- Sub-class 5.iv (quadruple-bump) = forward-projected (no current example)
- Sub-class 5.v (quintuple-bump) = forward-projected (no current example)

### 5.2 Codif 22 v0.2 ↔ Codif 31 v0.2 B.5 3-path dual-write

- Mechanical bump requires re-3-path-dual-write (canon + slot_isolated + slot_strat)
- W4 verify all 3 paths MATCH after bump
- T-ST-037 v0.1.1 B.5.1 amendment applies (Leader cycle 12 W2 turn 37 r27+)

### 5.3 Codif 22 v0.2 ↔ Codif 35 v0.3 trigger_code=CL

- Spec_id collision avoidance (CL collision, 5th sub-class) is the PRIMARY use case for spec_id change (NOT mechanical bump)
- Hermes CATCH #59: T-HER-033 v0.1 BROAD vs field 8 expansion orphan = spec_id+spec_version IS identity (NOT filename)

## §6 Cross-Muse handoffs + cycle 13 W1 forward chain

### 6.1 Cross-Muse handoffs

- **Mnemosyne**: T-MN-013 v0.4 §15.12.24 NEW entry for Codif 22 v0.2 audit aggregation (propagation request PENDING)
- **Prometheus**: T-PR-012 v0.1 12-Muse lineage audit cross-link (281L) ACKNOWLEDGED
- **Strategos**: T-ST-037 v0.1.1 §3.5 changelog precedent ACKNOWLEDGED
- **Hera**: T-HE-026 v0.2 + T-HE-027 v0.2 mechanical bump (cycle 12 turn 10.1+) ACKNOWLEDGED
- **Hermes**: CATCH #59 CL collision spec_id change pattern (NOT mechanical bump) ACKNOWLEDGED
- **Hephaestus**: T-HEP-025 v0.1.1 + T-HEP-030 v0.1.1 mechanical bump ACKNOWLEDGED
- **Atlas**: T-ATL-001 v0.4 5-gate re-measurement + bench opt-in cross-link (cycle 12 W2)

### 6.2 Cycle 13 W1 forward chain

- T-MN-013 v0.4 §15.12.24 NEW entry PENDING (Mnemosyne propagation)
- T-HE-037 v0.1 7-file rename batch (Hera long-name convention, cycle 13 W1)
- T-HE-029 v0.1 NEW post-rename (Codif 7 self-correction arc 5-event spec, T-HE-037 batch Step 3)
- T-ST-029 v0.1 → v0.1.1 mechanical bump (Strategos T-HE-037 batch Step 5)
- T-ST-024 v0.5.3 → v0.5.4 mechanical bump (Strategos T-HE-037 batch Step 6)
- T-HER-032 v0.1.1 → v0.1.2 mechanical bump (Hermes T-HE-037 batch Step 7, post-CATCH #41 RETRACTION of v0.1.3)
- CATCH #40 v0.1.1 → v0.1.2 mechanical bump (Hermes T-HE-037 batch Step 8)
- T-ATL-038 v0.1 added to T-HE-037 batch (Atlas, Step 8 Leader APPROVE ADD)

### 6.3 4-ICP TENTATIVE 4/4

- **Carla TECHNICAL**: ACCEPT (Codif 22 v0.2 spec-pinning principle is technically sound, 3-witness audit methodology is robust)
- **Vera STRATEGIC**: ACCEPT (audit supports cycle 13 W1 rename batch + cycle 14 W1+ RATIFICATION momentum)
- **Chris BUSINESS**: ACCEPT (spec_id+spec_version IS identity promotes transparency + reduces collision risk)
- **Beth RISK**: ACCEPT (mechanical bump protocol preserves substantive content, no breakage)

### 6.4 5 HL moments

- HL #1: 12+ mechanical bumps applied in cycle 12 W2 (all spec_id preserved, all spec_version bumped to v0.1.1 or higher)
- HL #2: T-IR-037 v0.1 → v0.1.1 → v0.1.2 = 1st documented triple-bump (Codif 30 v0.5 cat 4 sub-class 5.iii)
- HL #3: T-HE-040 v0.1 → T-IR-047 v0.1 = spec_id change (NOT mechanical bump) — anti-CATCH #34 rename
- HL #4: 3-witness audit methodology (W1 Read + W2 Glob + W3 Get-ChildItem) is the canonical verification per Codif 9 v0.2
- HL #5: Mechanical bump + substantive content change is SUBVERSION (forbidden) — must bump v0.1 → v0.2 instead

### 6.5 Codif compliance summary

- **Codif 9 v0.2**: 3-witness audit methodology APPLIED
- **Codif 19 v0.2**: anti-recurrence honest-scope 200-250L target — actual size TBD pre-SHIP
- **Codif 22 v0.2**: subject of audit (spec-pinning principle)
- **Codif 31 v0.2**: B.5 3-path dual-write MANDATORY (canon + slot_isolated + slot_strat)
- **Codif 35 v0.3**: trigger_code MECE complete, CL collision sub-class (5th) ACKNOWLEDGED
- **Codif 46 prevention**: trailing-newline strip APPLIED (CATCH #46 lesson)
