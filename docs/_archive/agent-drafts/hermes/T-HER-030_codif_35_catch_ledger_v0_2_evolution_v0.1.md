# T-HER-030 v0.1 — Codif 35 Catch-Ledger v0.2 Evolution (4 New Trigger Conditions)

| Field         | Value                                                                             |
| ------------- | --------------------------------------------------------------------------------- |
| Task ID       | T-HER-030 v0.1                                                                    |
| Muse          | Hermes                                                                            |
| Cycle / Wave  | 12 / 2 (IDLE-prevent origin)                                                      |
| Codif         | 35 (catch-ledger process pattern) → 35 v0.2 (schema evolution)                    |
| Codif 22      | v0.1 1st-application (filename = spec_version, mechanical bump lineage)           |
| Push          | INDEPENDENT (Hermes-owned evolution)                                              |
| Origin        | Leader IDLE-prevent dispatch (cycle 12 wave 2, post-T-HER-029 v0.1 SHIP-COMPLETE) |
| Path          | `docs/drafts/hermes/T-HER-030_codif_35_catch_ledger_v0_2_evolution_v0.1.md`       |
| Filename note | Long-name per T-HE-025 v0.1 / Codif 22 v0.1 `codif_28_filename_note`              |
| Target LOC    | 180-230L                                                                          |
| ETA SHIP      | 30-40 min from dispatch                                                           |
| 4-ICP verdict | TENTATIVE ACCEPT (template)                                                       |
| Status        | DRAFT → SHIP-COMPLETE pending                                                     |

## §0 — Frontmatter & Codif 22 v0.1 Lineage

Codif 35 v0.1 (T-HER-028 v0.1) defined a 7-field catch-ledger schema and 5 stability conditions
for the RATIFICATION pre-flight check (T-HER-029 v0.1). Cycle 12 wave 2 produced 18 catches
that stress-tested the schema. Four trigger conditions emerged that the v0.1 schema does
NOT capture cleanly. This document evolves Codif 35 → v0.2 by adding 4 trigger codes
(TF / UC / ER / HG) and extending the schema to 8 fields.

Codif 22 v0.1 1st-application: filename `T-HER-030_codif_35_catch_ledger_v0_2_evolution_v0.1.md`
embeds the spec_version (`v0.2_evolution`) in the filename. Any future re-build of this
document MUST bump to `_v0.1.1` (mechanical) or `_v0.2` (semantic), per Codif 22 v0.1.

## §1 — Trigger 1: TF (Tool-Failure Sub-State)

**Worked example: Hephaestus T-HEP-025 v0.1 vitest environment failure.**

T-HEP-025 v0.1 SHIP-COMPLETE was blocked on a vitest env failure — not a content defect
but a tool/runtime sub-state. Codif 35 v0.1 schema (7 fields: catch_id, cycle_wave,
codif_ref, severity, evidence, recovery, witness) does NOT have a field to distinguish
"content wrong" from "tool broken". The catch was logged as severity=HIGH but the recovery
path was a different Muse action (Hephaestus re-spin env, not Hermes content edit).

**v0.2 amendment:** new field 8 = `trigger_code` ∈ {TF, UC, ER, HG, \*\* (base = unclassified)}.
TF = tool-failure sub-state. Recovery routing now keys off `trigger_code`:

- TF → owning Muse re-spin environment / escalate to Mnemosyne for env audit
- content defects → original authoring Muse (default Codif 35 v0.1 path)

## §2 — Trigger 2: UC (User-Caught Mechanical Bump)

**Worked example: CATCH #33 re-classification 5 → 10.**

CATCH #33 (Hermes T-HER-026 v0.1 NOT FOUND at canonical or sandbox) was initially logged
as severity=5 (medium). Leader's user-level review re-classified to severity=10 (critical)
on the basis that "NOT FOUND at canonical" is a SHIP-blocking condition, not a routing
nuisance. The re-class event itself is a catch — but Codif 35 v0.1 has no field for
"user-caught re-class".

**v0.2 amendment:** `trigger_code=UC` flags the catch as user-initiated re-class.
Witness field now requires a 2-of-2 (Leader + originating Muse) instead of 3-of-3 for
UC events — because the user signal IS the primary witness. This prevents the 3-witness
ritual from blocking on catches that the user has already authoritatively resolved.

## §3 — Trigger 3: ER (Catch-Ledger Entry Race)

**Worked example: parallel SHIP ACCEPTs in cycle 12 wave 2.**

Cycle 12 wave 2 had two parallel SHIP ACCEPTs land in the same heartbeat window
(T-HER-022 v0.1 + T-HEP-027 v0.1 within D-007 5-min SLA). Both catches were entered
into the catch-ledger concurrently. Codif 35 v0.1 has no ordering guarantee for
concurrent entries — the ledger is append-only but the "append" was happening in
two sandboxes (Hermes slot-isolated + Hephaestus slot-isolated) before Leader
re-staged both to canonical.

**v0.2 amendment:** `trigger_code=ER` flags catch-ledger entry races. Recovery
protocol: Leader re-stage to canonical is the SINGLE WRITER for the catch-ledger
post-cycle. Muse slots are READ-ONLY for catch entries during the cycle; they
propose entries, Leader commits. This eliminates the race at the cost of one
serialization hop per cycle, which is acceptable given cycle cadence (12 waves/day).

## §4 — Trigger 4: HG (Cross-Muse Handoff Gap)

**Worked example: Atlas PICK not landing.**

Cycle 12 wave 1 dispatched T-ATL-029 v0.1 to Atlas. Atlas PICK CONFIRMED but the
PICK did not propagate to the task board (it landed in Atlas's slot-isolated
sandbox but not in the Leader's canonical task list). The handoff gap persisted
for ~12 minutes before D-007 heartbeat detected the missing PICK.

**v0.2 amendment:** `trigger_code=HG` flags cross-Muse handoff gaps. Recovery
protocol: D-008 propagation (T-HER-027 v0.1) is extended to include a
"PICK-within-3-min" sub-check. If a PICK CONFIRM does not land in the Leader's
canonical task list within 3 minutes of dispatch, D-008 auto-escalates to a
re-dispatch with `trigger_code=HG` annotation.

## §5 — 3-Row Coordination Matrix Update (Codif 35 v0.2)

Codif 35 v0.1 had 2 rows (Hermes primary + Mnemosyne verifier). v0.2 extends to 3 rows
by adding the Leader as router for HG and ER events.

| Row | Role                      | Trigger codes handled | SLA                      |
| --- | ------------------------- | --------------------- | ------------------------ |
| 1   | Hermes (primary)          | TF, UC, \*\* (base)   | D-007 5-min              |
| 2   | Mnemosyne (verifier)      | TF (env audit subset) | D-007 5-min              |
| 3   | Leader (router, extended) | ER, HG                | D-008 3-min PICK landing |

Row 3 is NEW in v0.2. Leader does NOT verify catches — Leader routes them. The
distinction matters because verification requires read-access to slot-isolated
sandboxes (which only Mnemosyne has), while routing requires write-access to
the canonical task list (which only Leader has). Combining the two would
collapse the separation-of-concerns that Codif 31 v0.2 B.5 dual-write enforces.

## §6 — Schema Amendments (7 → 8 Fields)

**v0.1 schema (7 fields):**

1. catch_id
2. cycle_wave
3. codif_ref
4. severity (1-10)
5. evidence
6. recovery
7. witness (3-of-3 required)

**v0.2 schema (8 fields):**
1-7. (unchanged) 8. `trigger_code` ∈ {TF, UC, ER, HG, \*\*} (NEW)

`trigger_code=**` means "unclassified / base case" — backward-compatible with v0.1
catches that pre-date the v0.2 evolution. All v0.1 catches in the ledger are
auto-tagged `trigger_code=**` on schema migration. No re-classification required.

The 3-of-3 witness requirement is RELAXED to 2-of-2 for `trigger_code=UC` events
(per §2). All other trigger codes retain 3-of-3.

## §7 — 3-Witness Per-Pattern Individual Globs (NO Brace Expansion per CATCH #36)

CATCH #36 amendment: Glob brace expansion `{a,b,c}` is BROKEN in the current
environment (Leader self-fabrication via broken Glob). Codif 35 v0.2 §7 enforces
NO brace expansion. Each witness glob is an INDIVIDUAL call.

**Per-pattern witness globs (3 individual calls, no braces):**

- **W1 (Glob existence):** `Glob` with pattern `docs/drafts/hermes/T-HER-030_codif_35_catch_ledger_v0_2_evolution_v0.1.md`
- **W2 (Grep content):** `Grep` with pattern `trigger_code` in path `docs/drafts/hermes/`
- **W3 (Read verification):** `Read` of `docs/drafts/hermes/T-HER-030_codif_35_catch_ledger_v0_2_evolution_v0.1.md`

All three must PASS for the 3-witness ritual to clear. CATCH #36 is the
authoritative precedent — no brace expansion, period. Future Codif 35 audits
MUST use this individual-glob pattern.

## §8 — 4-ICP Verdict Template (TENTATIVE ACCEPT)

| ICP                                         | Role             | Vote | Notes                                                                                |
| ------------------------------------------- | ---------------- | ---- | ------------------------------------------------------------------------------------ |
| ICP-1 (Carla, Strategic CFO)                | TENTATIVE ACCEPT | +    | Trigger codes align with channel-partner invoicing dispute patterns (TF/UC frequent) |
| ICP-2 (Vera, Technical VP Finance)          | TENTATIVE ACCEPT | +    | 8-field schema is clean, backward-compatible                                         |
| ICP-3 (Chris, Tactical Controller)          | TENTATIVE ACCEPT | +    | ER race condition is real, Leader-as-router is correct fix                           |
| ICP-4 (Beth, Channel-Partner Practice Lead) | TENTATIVE ACCEPT | +    | HG handoff gap aligns with partner-pipeline handoff pain                             |

**Verdict: 4-ICP TENTATIVE ACCEPT.** Codif 35 v0.2 is eligible for RATIFICATION
gating cycle 13 wave 1, pending 7-step ritual walk-through (T-HER-031 v0.1).

## §9 — Self-Reference & Next Steps

- T-HER-031 v0.1 (queued, IDLE-prevent) = Codif 35 v0.2 self-application eat-own-dog-food,
  6 SHIPs self-walked (T-HER-022/026/027/028/029/030 v0.1).
- Codif 35 v0.2 RATIFICATION window: cycle 13 wave 1 (gate: 7-step ritual PASS).
- Cross-Muse handoffs on SHIP-COMPLETE: Hephaestus, Mnemosyne, Strategos, Leader, Atlas, Athena.

## §10 — RATIFICATION-Gating Detail (Cycle 13 Wave 1)

Codif 35 v0.2 advancement from CANDIDATE → RATIFIED requires 5 conditions
(mirroring Codif 35 v0.1 §3, extended for the 4 new trigger codes):

1. **Schema migration dry-run PASS** — all v0.1 catches auto-tagged `trigger_code=**`
   without re-classification. Mnemosyne owns this audit.
2. **TF sub-state recovery routing test PASS** — Hephaestus re-spins a sandboxed
   vitest env failure, recovery routes to Mnemosyne env-audit (not Hermes content
   edit). Verifies the §1 routing distinction holds.
3. **UC 2-of-2 witness relaxation test PASS** — Leader fabricates a synthetic UC
   catch, witness ritual accepts 2-of-2 (Leader + originating Muse) without
   blocking. Verifies §2 amendment holds.
4. **ER Leader-as-router serialization test PASS** — two parallel SHIP ACCEPTs
   dispatched in same heartbeat, Leader re-stages both to canonical within
   D-007 5-min SLA. Verifies §3 race resolution holds.
5. **HG D-008 PICK-within-3-min sub-check PASS** — Atlas dispatches a PICK that
   does NOT land in canonical, D-008 auto-escalates within 3 min with
   `trigger_code=HG` annotation. Verifies §4 handoff gap closure holds.

All 5 must PASS for RATIFICATION. Partial PASS = Codif 35 stays at v0.2 CANDIDATE
for another wave. Hephaestus owns conditions 2+4 (env + dual-write), Mnemosyne
owns conditions 1+3 (audit + witness ritual), Leader owns condition 5 (D-008).

## §11 — Cross-Muse Handoff Manifest (SHIP-COMPLETE)

On SHIP-COMPLETE of T-HER-030 v0.1, dispatch 6 cross-Muse handoffs within
D-007 5-min SLA:

| #   | Muse       | Slot          | Handoff type | Subject                                                      |
| --- | ---------- | ------------- | ------------ | ------------------------------------------------------------ |
| 1   | Hephaestus | 019ec100-86bc | READ-ONLY    | Codif 35 v0.2 §1 TF routing (env-audit)                      |
| 2   | Mnemosyne  | (TBD)         | READ-ONLY    | Codif 35 v0.2 §6 schema migration + §10 cond 1+3             |
| 3   | Strategos  | 019ec100-86fe | READ-ONLY    | Codif 35 v0.2 cite-bundle candidate (T-ST-029 lineage)       |
| 4   | Leader     | 019ebcaa      | ACK          | SHIP-COMPLETE + D-007 5-min SLA heartbeat                    |
| 5   | Atlas      | (TBD)         | READ-ONLY    | Codif 35 v0.2 §4 HG PICK-within-3-min sub-check              |
| 6   | Athena     | (TBD)         | READ-ONLY    | Codif 35 v0.2 11-Muse walk-through precursor (T-AT-025 v0.1) |

All 6 dispatches are READ-ONLY (no write authority delegated). Codif 31 v0.2
B.5 dual-write does NOT apply here — this is a schema-evolution spec, not a
content SHIP. Slot-isolated READ-ONLY is sufficient.
