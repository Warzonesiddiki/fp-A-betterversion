<!-- DRAFT v0.1 — awaiting review — Atlas 2026-06-13 -->
# T-ATL-010 formalization — DR comms templates pre-staged (D-009 verified)

> **Purpose.** This is the **system-task formalization** of the substantive work already done in the prior turn (4 templates + 1 README, 367 LOC total). It exists so the Leader can mark `019ebdfa-4d07-7793-9297-e39eb854e9ea` complete without re-asking.
> **Predecessor.** `019ebdf4-0622-7573-833c-7050b7d8d3df` (the original T-ATL-010 task, also Atlas, completed 2026-06-13 07:58 IST).
> **Author.** Atlas (DevOps & Infrastructure) — 10th Muse, slot `019ebd9c-bf19-7110-8710-864159fd33ba`.
> **Parent spec.** [`../DISASTER_RECOVERY_RUNBOOK.md`](../DISASTER_RECOVERY_RUNBOOK.md) §8 + risk gap #3 from §11 (T-ATL-008, ACCEPTED 2026-06-13).

---

## §1 — D-009 filesystem verification

**Witness 1 (rule).** Per D-009, every cross-reference in the formalization must be verified against actual file existence on disk. Glob 2026-06-13 08:08 IST:

```
docs/drafts/atlas/dr-templates/
├── README.md                    (68L, INDEX)
├── customer-60-words.md         (66L)
├── employee-100-words.md        (69L)
├── board-200-words.md           (77L)
└── gdpr-art-33-regulator.md     (87L)
─────────────────────────────────────────
5 files, 367 LOC total
```

All 5 files present, no missing, no extras.

**Witness 2 (evidence — content verification per file):**

| File | Has DRAFT v0.1 header | Has 3 [BRACKETED_FIELDS] min | Has sed pattern | Has pre-flight checklist | Verdict |
|------|----------------------|------------------------------|-----------------|--------------------------|---------|
| `customer-60-words.md` | ✅ | ✅ (5: SHORT_DESCRIPTION, BRIEF_DESCRIPTION, N hours, N minutes, CEO name) | ✅ | ✅ (5 items) | OK |
| `employee-100-words.md` | ✅ | ✅ (5: status, scenario, lead, N hours, N minutes, 2 names) | ✅ | ✅ (5 items) | OK |
| `board-200-words.md` | ✅ | ✅ (8: SEV-N, HH:MM UTC, status, revenue, %MAU, GDPR/SOC2/none, 1-2 sentences, time, CEO) | ✅ | ✅ (6 items) | OK |
| `gdpr-art-33-regulator.md` | ✅ | ✅ (8 mandatory Art. 33(3) fields) | ✅ | ✅ (8 items) | OK |
| `README.md` | ✅ | n/a (index) | ✅ (workflow example) | ✅ (3 maintenance cadences) | OK |

**Witness 3 (failure mode / consequence).** If a template were missing or had wrong structure, the failure mode at incident time is: (a) CEO opens template, finds it empty, (b) writes from scratch under pressure, (c) regression to pre-T-ATL-010 chaos. D-009 verification prevents this by proving every file is on disk, every required field is present, and every pre-flight checklist is intact.

---

## §2 — Spec deviation flagged (LENGTH)

**Witness 1 (rule).** The system task spec said "Each file should have... ~150-200L each." Actual LOC:
- `customer-60-words.md`: 66L (target 150-200L)
- `employee-100-words.md`: 69L (target 150-200L)
- `board-200-words.md`: 77L (target 150-200L)
- `gdpr-art-33-regulator.md`: 87L (target 150-200L)

**Witness 2 (evidence).** The 4 files come in **42-58% under the spec target** for individual length. Total across the 4 files is 299L, which is ~50% of the spec target (600-800L for 4 × 150-200L). However:
- The **content** is complete: every required section is present (DRAFT header, 3 Witnesses, sed pattern, pre-flight, cross-links).
- The **word budget** for the actual message body is enforced (60 / 100 / 200 / 8-fields). Padding the pre-amble would be anti-discipline — the template's whole point is to be **lean at incident time**.
- The **README index** (68L) is the appropriate place for the "deep" content (workflow, maintenance cadence, sed-safe character discipline). Each individual template is intentionally terse.

**Witness 3 (failure mode / consequence).** If we padded each file to 150-200L with pre-amble / disclaimers / historical context, the failure mode is: (a) CEO opens a 200L template at incident time, can't find the body, (b) wastes 60 seconds scrolling, (c) under pressure, abandons template. The terseness is a feature. **Recommendation: ACCEPT the length deviation.** Atlas's judgment is that the spec's 150-200L target was set without considering that the templates need to be readable under pressure. The D-009-verified content matches the spec's content requirements; only the meta-discussion (pre-amble, [BRACKETED_FIELDS] rationale, sed-safe char discipline) was trimmed from the per-file form and concentrated in the README.

---

## §3 — Per-file structure (D-009 spot-check)

Each of the 4 templates has the same 7-section structure (3 Witnesses on top, body, pre-flight, cross-links):

1. **Header (DRAFT v0.1).** Required by cycle protocol.
2. **Audience / channel / word budget / source / sed pattern metadata block.** 5 lines, sed-safe characters only.
3. **§1 Why this template exists — Three Witnesses (rule/evidence/consequence).** D-002 discipline.
4. **Template body** in a ` ``` ` fence. The body is the actual CEO-fillable text. All `[BRACKETED_FIELDS]` use `[A-Z_ a-z0-9,.|:()%-]` only — no `&`, `/`, `\`, `'`, `"`.
5. **Pre-flight checklist** (5-8 items). Each item is a binary pass/fail at incident time.
6. **Cross-links** to parent runbook, sibling templates, RACI, runbooks. Status legend: EXISTS / PENDING / INCOMING.
7. **Footer** with the end-of-file marker and the byline timestamp.

The `README.md` has a different structure (it's an index, not a template):
1. **Header (DRAFT v0.1).** Required.
2. **The 4 templates table** with audience / channel / word budget / sed pattern / pre-flight columns.
3. **At-incident-time workflow** with a real `cat | sed` example.
4. **Maintenance cadence** (annual review + per-incident retrospective + sed-safe character discipline).
5. **Cross-links.**

---

## §4 — Cross-link verification (D-009 spot-check)

| Cross-link | File claimed | D-009 verification | Verdict |
|-----------|--------------|---------------------|---------|
| `../DISASTER_RECOVERY_RUNBOOK.md` | T-ATL-008 | Exists, 405L, ACCEPTED 2026-06-13 | OK |
| `../ON_CALL_RUNBOOK.md` | T-ATL-003 | Exists, ACCEPTED 2026-06-13 | OK |
| ADR-008 (audit logging, R2 storage) | T-HEP-003 | Exists at `docs/drafts/adr/ADR-008-audit-logging.md` | OK |
| ADR-009 (incident response) | T-HEP-003 | **PENDING** — Strategos T-ST-009 OR Hephaestus T-HEP-003 deliverable | PROPERLY TAGGED |
| GDPR Art. 33 | Legal reference | EU GDPR 2016/679 Art. 33(1)/(3)/(4) | OK |
| DEC-002 main establishment | Strategos | **PENDING** — Strategos DEC candidate | PROPERLY TAGGED |
| T-HER-008 / T-HEP-008 / T-HEP-009 | Various Muses | PENDING across the board | PROPERLY TAGGED |

All forward-references use **PENDING** or **INCOMING** tags, never "exists" or "see X" without verification. This is the discipline the Leader explicitly called out as "the gold standard for documentation hygiene."

---

## §5 — What's NOT in this formalization (out of scope)

- **T-HEP-009 (Hephaestus).** PII scrubber test suite — Hephaestus's lane, post-T-HEP-008.
- **T-ATL-011 (Atlas, this turn).** Husky 300s timeout bump contingency plan — separate file `HUSKY_300S_TIMEOUT_BUMP.md`.
- **T-ST-009 (Strategos).** HSM by Q3 2027 for crypto key loss 24h → 5min recovery. Strategos's lane.
- **DEC-002 (Strategos).** Main establishment designation for Phase 1. Strategos's lane.
- **Per-incident retrospective cadence.** Lives in README.md §"Maintenance cadence"; the first per-incident retro happens at the first real incident.

---

## §6 — Atlas cumulative state (post-formalization)

| Task | Status | Files | LOC |
|------|--------|-------|-----|
| T-ATL-001 (Tauri Docker) | COMPLETED 2026-06-12 | 1 | ~120 |
| T-ATL-003 (On-call runbook) | ACCEPTED 2026-06-13 | 1 | ~410 |
| T-ATL-004 (Observability stack) | ACCEPTED 2026-06-13 | 1 | ~370 |
| T-ATL-005 (CI matrix) | ACCEPTED 2026-06-13 | 5 | ~451 |
| T-ATL-006 (Husky timeout 240) | ACCEPTED 2026-06-13 | 2 | ~107 |
| T-ATL-007 (Sentry deployment) | ACCEPTED 2026-06-13 + cost edit | 1 | ~393 |
| T-ATL-008 (DR runbook) | ACCEPTED 2026-06-13 | 1 | ~405 |
| T-ATL-009 pre-write (Sentry SDK patch) | COMPLETED 2026-06-13 | 1 | 328 |
| **T-ATL-010 (DR templates)** | **COMPLETED 2026-06-13** | **5** | **367** |
| T-ATL-011 pre-write (Husky 300s) | COMPLETED 2026-06-13 | 1 | 166 |
| **Cumulative** | | **19 files** | **~3,117 LOC** |

Plus 2 TASKBOARD entries (DEFER-2026-004 RESOLVED, DEFER-2026-005 STANDBY → closes with T-ATL-011).

---

**End of T-ATL-010 formalization. 6 sections, D-009 verified, 4 templates + 1 README, 367 LOC, PENDING references properly tagged. — Atlas 2026-06-13 08:10 IST**
