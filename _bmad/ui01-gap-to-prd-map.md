# UI-01 Gaps ↔ PRD v2.1 Requirement Map

|                      |                                                                                                                                                                     |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Task**             | TRACE · UI-01 gaps ↔ PRD requirement mapping                                                                                                                        |
| **Author**           | Percy (PRD owner)                                                                                                                                                   |
| **Date**             | 2026-08-23                                                                                                                                                          |
| **Inputs**           | `_bmad/prd.md` (v2.1 APPROVED HYPOTHESIS PRD) · `_bmad/ui01-design-system-audit.md` (Uxie, 2026-08-23, HEAD `fbe0c00b`)                                             |
| **Scope discipline** | ONE new file only. `prd.md`, the existing traceability matrix, and all other docs untouched. No commits/pushes.                                                     |
| **Status**           | TRACE COMPLETE — mapping is analysis, not authorization. All underlying gaps remain HYPOTHESIS pending Phase 3 (per audit header, `ui01-design-system-audit.md:8`). |

---

## 1. Headline verdict

**Mapped-to-existing: 3 · New-requirement-needed: 7 · Contradictions: 0**
(within the 7 "new": Gap #2 is already remediated on current HEAD — see §5.2; do not re-plan it.)

The pattern is structural, not accidental: PRD v2.1 is a capability/trust PRD. It names design-system surfaces exactly twice in scope (`prd.md:62` "canonical finance page layouts"; Epic E1 `prd.md:84-109`) and constrains them via NFR-01/NFR-05/NFR-07/NFR-08 (`prd.md:264-271`). It contains **zero theming, typography, density-adoption, or state-coverage requirements** — those attributes come from the ZohoBooks benchmark defined in `_bmad/project-completion-plan.md:29` (quoted at `ui01-design-system-audit.md:25-26`), i.e., **outside the v2.1 requirement set**. Per `prd.md:318`, the UX specification passes Gate G3 _separately_ before Phase 3 authorization — the 7 "new" gaps are natural G3-hosted material, not PRD defects.

### Classification rule applied (stated so counts are auditable)

A gap is counted **mapped-to-existing** iff a named v2.1 requirement/AC, satisfied as written, would close the user-visible gap (or the gap's dominant harm). Otherwise **new-requirement-needed**, even when adjacency to existing requirements exists (adjacency is noted per row). A contradiction requires conflicting _statements_ between documents.

## 2. Master mapping table

Witnesses: `P:` = `_bmad/prd.md`, `A:` = `_bmad/ui01-design-system-audit.md`. Line refs from full Reads of both files, 2026-08-23.

| #   | Gap (short)                                                                                       | Nearest PRD anchor                                                                                                                                                            | Verdict                                                                                                     | Serve existing req vs ZohoBooks-bar polish?                                                                                                                             |
| --- | ------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Light-theme breakage — 300 hardcoded dark surface fills / 80 pages (`A:121`, `A:113`)             | None for theming. Adjacent: NFR-01 WCAG AA (`P:264`); §9 "desktop-first" is form-factor, not color posture (`P:293`)                                                          | **NEW requirement**                                                                                         | Mostly polish beyond current PRD (benchmark-owned attribute); partial NFR-01 service once affected screens enter the canonical list                                     |
| 2   | DataTable lexical numeric sort (`A:122`)                                                          | Spirit only: G-01 trusted values (`P:35`), NFR-02 integrity (`P:265`). No AC names list-table ordering; E5.2 governs the modeling grid, not general page tables (`P:186-192`) | **NEW requirement** — **but ALREADY REMEDIATED** (see §5.2)                                                 | Correctness fix, not polish; served trust goals indirectly. Moot on current HEAD                                                                                        |
| 3   | Density + `.fp-table` shipped, ~0% adopted (`A:123`, `A:71-75`)                                   | Umbrella only: §4 in-scope #1 "canonical finance page layouts" (`P:62`); NFR-08 compact-desktop responsiveness (`P:271`). No AC fails today if density stays unadopted        | **NEW requirement**                                                                                         | Mixed: infra sunk, adoption sweep is benchmark polish **until** Phase 3 defines canonical-layout ACs — strongest absorption candidate into E1                           |
| 4   | Type scale unbridged; primitives off-scale (`A:124`)                                              | Umbrella: §4 #1 (`P:62`). Weak NFR-01 readability tie (`P:264`)                                                                                                               | **NEW requirement**                                                                                         | Primarily polish (ZohoBooks 12/13/16 register); minor a11y dividend (10px error micro-text)                                                                             |
| 5   | ~150 raw `text-red-*` sites bypass `--negative` (`A:125`)                                         | Partial: E6.1 AC2 favorable/unfavorable by metric semantics (`P:209`); E1.2 AC4 state distinguishability (`P:102`)                                                            | **NEW requirement** (variance-color slice serves E6.1 AC2; the repo-wide token sweep exceeds any stated AC) | Mixed: protects semantic meaning E6.1 depends on; sweep mechanics are token discipline                                                                                  |
| 6   | Missing form layer — no FormField/Textarea/Checkbox/Radio; minority adoption (`A:126`, `A:83-85`) | **NFR-01** WCAG 2.2 AA on canonical screens (`P:264`) + G-02 critical-task completion (`P:36`)                                                                                | **MAPPED-to-existing**                                                                                      | Clearly serves existing hypotheses: hand-rolled fields make NFR-01 journeys impractical at scale (52 raw `<input>` pages). Means (component layer) chosen in Phase 3/G3 |
| 7   | No save-state feedback / double-submit guard (`A:127`)                                            | **NFR-07** idempotent commands, no silent data loss (`P:270`); E5.2 AC3 idempotency semantics (`P:191`); E2.2 official-command evidence (`P:126`)                             | **MAPPED-to-existing** (harm class)                                                                         | Duplicate-entity/silent-failure harm is squarely NFR-07 territory; the visible "Saving…" affordance itself needs a UX AC (small new sub-item)                           |
| 8   | Empty/loading coverage thin — EmptyState 8%, Skeleton 13% (`A:128`, `A:92`)                       | Adjacent: E1.2 AC4 offline/stale/queued/published distinguishable (`P:102`) — context-level only; nothing covers per-page async content states                                | **NEW requirement**                                                                                         | Completeness/polish beyond current PRD; cheap because exemplar exists (`A:91`); recommend extending the E1.2 AC4 _pattern_ in the UX spec                               |
| 9   | IA wayfinding at 139-item depth; Industries crowds rail; Analysis ungrouped (`A:129`, `A:98-103`) | **E1.1** five-pillar navigation + AC2 route dispositions (`P:88-94`); E1.3 AC1 "recent" results in Cmd+K (`P:107`); G-02 friction (`P:36`)                                    | **MAPPED-to-existing** (pins/favorites themselves need a new AC under E1)                                   | Serves existing E1/G-02 hypotheses; audit itself flags "IA change ⇒ needs explicit Phase 3 decision" (`A:129`) — respect that gate                                      |
| 10  | Visual noise: emoji toggle, dual grid aesthetics, dead utility class (`A:130`)                    | Micro-ties: E1.2 AC4 accessible naming (`P:102`), NFR-10 maintainability (`P:273`); grid aesthetics have **no** PRD statement                                                 | **NEW requirement**                                                                                         | Register/polish; two trivial hygiene riders worth folding into adjacent waves                                                                                           |

**Counts:** mapped-to-existing = **3** (#6, #7, #9) · new-requirement = **7** (#1–#5, #8, #10) · contradictions = **0**.

## 3. Contradiction check (mission item 3)

**Hard document-vs-document contradictions: NONE found.**

Decisive negative witness: `Select-String -Pattern 'dark|light|theme'` over `_bmad/prd.md` returned **zero matches** (executed 2026-08-23). The mission's example worry — light-theme posture vs dark-first PRD language — cannot arise: **v2.1 contains no color-posture language at all.** The "Bloomberg-dark-first → light-professional-first" direction lives solely in `_bmad/project-completion-plan.md:29` (via `A:25`).

Tensions logged for Bob (not contradictions):

- **T1 — Posture ownership.** Light-first posture originates outside the PRD. If the owner wants theme parity as a _release criterion_, it needs either a UX-spec clause at G3 or a PRD delta; until then Gap #1 is polish-by-benchmark, not requirement violation.
- **T2 — IA shape divergence.** Gap #9's remedies operate inside the current 10-section/139-visible-item manifest (`A:98`), while E1.1 hypothesizes a five-pillar shell (`P:62`, `P:89`). Expected pre-implementation divergence — governed by E1.1 AC2 route dispositions (`P:92`) — but sequence pins/favorites so they survive pillar consolidation.
- **T3 — Practice-vs-hypothesis deltas surfaced by gaps** (current build would fail these PRD criteria _today_; normal pre-implementation state, listed because the mission asked): emoji-only toggle vs E1.2 AC4 accessible naming (`P:102`); missing submit guards vs NFR-07 (`P:270`); hand-rolled form a11y vs NFR-01 (`P:264`).

## 4. Per-gap rationale (condensed)

- **#1** — No theming requirement exists to violate (§3 witness). Fix serves aesthetics + partial contrast risk on canonical screens (NFR-01). Classify polish-beyond-scope; host at G3 or park.
- **#2** — As audited, uncovered by any AC (E5.2's E2E list at `P:190` names keyboard/paste/undo/freeze/focus — not sorting). Correctness-in-spirit of G-01/NFR-02. **Moot: fixed.**
- **#3** — "Canonical finance page layouts" (`P:62`) is a named Phase-3 deliverable whose content is undefined; density-aware canonical table treatment belongs inside it. Until that AC exists, nothing breaks — hence NEW with absorption recommendation.
- **#4** — Same umbrella logic as #3; weaker user impact; bundle with #3's canonical-layout definition to avoid two token-bridge waves.
- **#5** — E6.1 AC2 (`P:209`) makes green/red semantics load-bearing _in the Decision Workspace_; arbitrary reds elsewhere erode that semantics but no AC governs them. Sweep = NEW; note the E6.1 dependency when prioritizing.
- **#6** — Strongest mapped case: NFR-01 requires tested keyboard/screen-reader journeys on canonical screens; doing that across 52 hand-rolled input pages + 36 raw selects without a standard field layer contradicts NFR-10 economy too (`P:273`). Closing the gap _is_ the NFR-01 enablement path.
- **#7** — NFR-07's "idempotent commands … no silent data loss" (`P:270`) plus E5.2 AC3 (`P:191`) cover the duplicate/harm class server-side; the client affordance is its visible face. Mapped, with a one-line UX AC to add ("submit disabled + state shown while command pending").
- **#8** — E1.2 AC4 proves the PRD knows how to require distinguishable states; it just scoped that to global context. Extending the pattern to async page states is a G3 clause, not a PRD rewrite.
- **#9** — Heaviest components (route disposition, pillar structure, Cmd+K recents) sit inside E1.1/E1.3 already; only the favorites/pins store is genuinely new. Honor the audit's own Phase-3 decision gate (`A:129`).
- **#10** — No aesthetic requirements exist; take the two free riders (accessible name on the theme toggle per `P:102`; delete dead class per NFR-10 hygiene) and treat the rest as opportunistic polish, matching the audit's own sequencing (`A:132`).

## 5. Honesty notes (D-002 / D-007 / D-009)

### 5.1 Witnesses

- Both inputs read in full this session: `prd.md` (318 lines), `ui01-design-system-audit.md` (162 lines). All `P:`/`A:` line citations above derive from those Reads.
- Fresh re-verification performed 2026-08-23 against current working tree (post-audit HEAD — the audit itself warns concurrent waves shift numbers, `A:21`):
  - `src/components/ui/EmptyState.tsx:18` still carries the dead `dark:fin-negative` class — audit claims #5/#10 stand.
  - `src/components/ui/DataTable.tsx:41` still hardcodes `ROW_HEIGHT = 40` with no density references — audit claim #3 stands.
  - Negative witness via PowerShell `Select-String` (Grep MCP treated as unreliable per standing tooling note): theme-language absence in prd.md confirmed.

### 5.2 Material staleness found: Gap #2 is already fixed

The audit's sort-defect witness (`A:77`, citing `DataTable.tsx:76-93` at HEAD `fbe0c00b`) is **superseded**: current source contains the UI-HF numeric-sort hotfix — type-aware `compareCellValues` at `src/components/ui/DataTable.tsx:58-63`, with explanatory comment at `:43-57` ("sorted numbers lexically … a data-trust defect") and empties-last handling wired at `:97-110`. **Bob should strike Gap #2 from Phase-3 sequencing**; remaining value is only adding a regression test if one does not exist. Recorded here rather than silently dropped, per D-007.

### 5.3 Boundary respected

No repository file other than this deliverable (`_bmad/ui01-gap-to-prd-map.md`) was created or modified. No commits, no pushes.

## 6. Feed-forward to Phase-3 planning

1. **3 mapped gaps (#6, #7, #9)** — schedule inside existing E1/E5/NFR-01/NFR-07 evidence workstreams; no PRD change required. Respect #9's explicit IA decision gate.
2. **6 genuinely open gaps (#1, #3, #4, #5, #8, #10)** — propose hosting as Gate-G3 UX-specification requirements (they gate Phase 3 anyway, `P:318`); escalate to a PRD v2.2 delta only if the owner wants them as Release-1 criteria. Unhosted, they stay ZohoBooks-bar polish outside the §7 release definition (`P:277`).
3. **Gap #2** — remediated; verify regression-test coverage only.
4. Suggested wave alignment with the audit's own sequencing hypothesis (`A:132`) holds — no conflict between Uxie's effort ordering and this coverage analysis.
