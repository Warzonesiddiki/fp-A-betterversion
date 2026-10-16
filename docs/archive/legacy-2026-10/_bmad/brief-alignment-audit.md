# Brief-vs-Capability Alignment Audit — FinPlan Pro product brief v2.3

> **Author:** Ana (Brief owner) · **Date:** 2026-08-23 · **Task:** ALIGN · Product-brief claims vs Capability Truth Matrix audit · **Autonomy:** A5 within approved artifacts
> **Scope discipline:** RECOMMENDATIONS ONLY. `_bmad/product-brief.md` was **not** edited. This is the only file created. No commits/pushes.

## 1. Inputs audited (all read in full this session, 2026-08-23 working tree)

| Input                             | Identity                                                                                                            | Role in audit                   |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| `_bmad/product-brief.md`          | v2.3 APPROVED HYPOTHESIS BRIEF (header L3; Gate G1 approved 2026-08-10, BMAD v5 re-certified 2026-08-10)            | Claim source                    |
| `docs/CAPABILITY_TRUTH_MATRIX.md` | Generated from working tree (`scripts/generate-capability-truth-matrix.mjs`, existence witnessed via Glob)          | Maturity ground truth           |
| `_bmad/project-context.md`        | §14 Glossary (L138), §8 constraints (L46–49), artifact registry (§11), change log (ledger #29/#32/#33/#34/#35 rows) | Definitions + delivery evidence |

**Glossary anchors** (project-context.md L138):

- **Authoritative:** server-enforced, versioned, audited state used for official finance.
- **Connected:** real data/contract plus lifecycle-state evidence.
- **Governed:** policy/audit/tenant/lifecycle evidence.
- **Enterprise-ready:** governed plus performance, accessibility, operations, and customer-workflow proof.

**Matrix rule** (CAPABILITY*TRUTH_MATRIX.md L18): *"A blank or `UNVERIFIED` value is not a failure; it is a prohibition on claiming that maturity."\_

## 2. Method

Every capability/readiness-bearing phrase in brief §§1–8 was extracted (full-text pass, line-cited below) and tested against (a) the matrix maturity columns and route/module dispositions, (b) the glossary ladder definitions above, (c) recorded delivery evidence in the project-context change log. Empirical claims follow D-002 three-witnesses / D-009 citation discipline; counts were taken with PowerShell `Select-String -SimpleMatch -CaseSensitive` (witnessing standard per ledger #35 environment caveat on Grep MCP flakiness).

## 3. Evidence baseline used for every verdict (witness log)

**Fact E-1 — Every inventory row in the truth matrix is UNVERIFIED beyond BUILT.**

| Witness                         | Result                                                                                                                                                                                                                                                                                                                                                                             |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| W1 · Read                       | Matrix legend defines the 4-step ladder (L11–16) and rules (L18); sampled route rows (e.g. L42–48), component/service rows (e.g. L1028, L1144) each show `UNVERIFIED \| UNVERIFIED \| UNVERIFIED`                                                                                                                                                                                  |
| W2 · Select-String              | Rows with a `BUILT` built-evidence cell: **1,148**                                                                                                                                                                                                                                                                                                                                 |
| W3 · Select-String + arithmetic | Rows containing `UNVERIFIED \| UNVERIFIED \| UNVERIFIED`: **1,148** (1:1 with row count). Counter-checks: `\| CONNECTED` = 0, `\| GOVERNED` = 0, `\| ENTERPRISE-READY` = 0, `\| VERIFIED` = 0, ✅ = 0. Cross-foot: inventory summary 228 routed screens + 244 pages + 214 engines + 47 stores + 338 UI components + 65 services + 12 server API routes = **1,148** (matrix L26–34) |

Consequence: **no sentence in any stakeholder-facing artifact may imply CONNECTED, GOVERNED, or ENTERPRISE-READY maturity for anything**, regardless of how many screens exist.

**Fact E-2 — The brief's readiness-vocabulary footprint is small and enumerable.** Select-String over product-brief.md for `SOX`, `real-time`, `enterprise-grade`, `production-ready`: **zero hits**. Full hit-list of maturity-adjacent terms: `immutable` L18, `immutable evidence` L43, `Authoritative` L48, `validated` L49/L73/L77, `Governed` L53.

**Fact E-3 — Control Plane is an unwired spike.** F-04 DONE/QA APPROVED as contract spike; client transport is feature-flag gated and _"Not wired into any screen until a Control Plane deployment is configured"_ (project-context.md change log, L164).

**Fact E-4 — No primary customer/validation evidence exists yet.** Artifact registry: `evidence-log.md | ACTIVE — no primary customer evidence` (project-context.md L80); solo-dev re-baseline redirected R-01 to Tier 2–4 signals (change log L169); all 14 assumptions UNVALIDATED (§11 registry).

**Fact E-5 — Client-local data cannot be official financial authority** (project-context.md §8 L48), reaffirmed inside the brief itself (§6, L63).

## 4. Flag register — 5 flags (2 HIGH · 1 MEDIUM · 2 LOW)

**Severity rubric:** HIGH = uses an exact ladder/glossary maturity term on a deliverable noun where the matrix shows UNVERIFIED · MEDIUM = asserts validation/certification for which no evidence run is recorded · LOW = aspirational wording that misleads only when quoted out of context.

---

### F-01 · HIGH · product-brief.md L53 — ladder term "Governed" applied to deliverables

> _"- Governed statements/BvA/variance/board-pack snapshots."_ (§5 In-scope release hypothesis)

**Why it exceeds evidence:** "Governed" is the third rung of the shared ladder (matrix L15; brief §6-of-matrix vocabulary). Fact E-1: all 1,148 rows have Governed = UNVERIFIED. Even under the "release hypothesis" header, this bullet reads as a capability description using the exact maturity word whose claim is prohibited (matrix L18). Board-pack reporting is precisely the governed-reporting-contract surface, which is still **v1 DRAFT requiring validation** (project-context.md §11 L86); `/board-pack` is BUILT—TEST EVIDENCE with all three upper maturities UNVERIFIED (matrix L169).

**Suggested honest rewording (next rebaseline; do NOT apply now):**
`- Statement/BvA/variance/board-pack snapshot generation (target: governed snapshots per governed-reporting-board-pack-contract.md v1 DRAFT; matrix maturity today: BUILT — Connected/Governed/Enterprise-ready UNVERIFIED)`

---

### F-02 · HIGH · product-brief.md L48 — glossary term "Authoritative" without control-plane qualifier

> _"- Authoritative identity, tenant/entity scope, audit evidence, master data, fiscal period control."_ (§5)

**Why it exceeds evidence:** "Authoritative" is a defined term of art: _server-enforced, versioned, audited state used for official finance_ (project-context.md L138). Current reality: the Enterprise Control Plane exists only as the F-04 spike, unwired into any screen (E-3); the app runs Tauri-local SQLite; and treating client-local data as official authority is explicitly out of scope (E-5, brief's own §6 L63). Listing "Authoritative …" unqualified in the release-hypothesis scope invites the reading that authoritative enforcement ships with the release.

**Suggested honest rewording:**
`- Identity, tenant/entity scope, audit-trail surface, master data, fiscal period control (authoritative enforcement is the Enterprise Control Plane target architecture — current state: F-04 typed command-envelope contract spike only, not wired into any screen)`

---

### F-03 · MEDIUM · product-brief.md L49 — "one validated demand-led connector" before validation evidence exists

> _"- Controlled CSV/XLSX ingestion plus one validated demand-led connector."_ (§5)

**Why it exceeds evidence:** "validated" is ambiguous between "chosen via a demand-validation process" (not yet done — no primary customer evidence, E-4) and "a connector that has been validated" (also not established: the 12 api-integration connector modules sit at disposition REVIEW with Connected/Governed UNVERIFIED — matrix L1159–1171; the Integrations hub shipped UI-level connect/test/sync against the connector framework, ledger #29, which is not certified data-contract connectivity). Demand selection itself awaits the blocked R-track.

**Suggested honest rewording:**
`- Controlled CSV/XLSX ingestion plus one demand-selected connector (selection pending R-track validation evidence; connector integrations today: BUILT / Connected UNVERIFIED, disposition REVIEW)`

---

### F-04 · LOW · product-brief.md L18 — "immutable, evidence-backed board snapshot" inside the hypothesis loop

> _"5. publish an immutable, evidence-backed management or board snapshot."_ (§1 loop definition)

**Why it exceeds evidence (mildly):** the loop is explicitly framed as hypothesis, but "immutable" names an enforcement property (GOVERNED-grade). Immutability lives in the governed-reporting-board-pack contract, still v1 DRAFT (project-context.md L86); nothing in the tree proves enforced immutability.

**Suggested honest rewording:** append `(target contract — immutability enforcement not yet proven)` to step 5, or mark the whole numbered loop `[TARGET]`.

---

### F-05 · LOW · product-brief.md L72 — Trust success criterion lacks an explicit target marker

> _"| Trust | 100% published values drill to permitted source/version/calculation/actor evidence |"_ (§7)

**Why it exceeds evidence (mildly):** correctly placed under "Evidence of success", so it is a goal — but brief sentences get quoted standalone in decks/PRDs. Drill-to-permitted-source evidence is exactly the CONNECTED/GOVERNED evidence class that is UNVERIFIED everywhere (E-1).

**Suggested honest rewording:** `| Trust | target: 100% of published values drill to permitted source/version/calculation/actor evidence |`

---

## 5. Claims checked and found CLEAN (extraction-completeness record)

| Brief location | Claim                                                           | Why clean                                                                                                                                      |
| -------------- | --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| L10            | Thesis: "FinPlan Pro **will help** finance leaders…"            | Future-tense promise; no maturity assertion                                                                                                    |
| L22–28         | Evidence/confidence table                                       | Model behavior: confidence-scored, named validation owed per claim; L28 `$500k+ … no direct evidence yet · Low` is exemplary honesty           |
| L32            | [A-13] segment                                                  | Explicitly labeled _"owner direction, not market validation"_                                                                                  |
| L36–43         | Users & jobs table                                              | Column header "Required product outcome" frames everything as requirements, incl. L43 auditor "scoped immutable evidence and export"           |
| §5 header L45  | "In-scope release hypothesis"                                   | Hypothesis framing present (flags above concern ladder-term leakage through it, not its absence)                                               |
| L56–63         | Out-of-scope list                                               | Aligns with matrix disposition policy (L38: EXPERIMENTAL routes "cannot be marketed as supported until certified"); L63 matches constraint E-5 |
| L69–71         | Research/Pilot/Product horizons                                 | Forward-looking, measurable criteria                                                                                                           |
| L73            | Economics gate: pilot/LOI **before** $500k+ public claim        | Strongest anti-overclaim device in the doc                                                                                                     |
| L77–79         | Risks: feature-catalog trap, local-first religion, AI overreach | Self-aware; consistent with matrix breadth reality                                                                                             |

## 6. Context observations (outside capability-claim flags — Lead decisions, no edits made)

- **O-1 · Direction tension.** Brief L12 declares the initial hypothesis _"is not 'all-in-one FP&A'"_, while the owner set the all-in-one direction on 2026-08-12 (ledger #34, project-context §2 L17). This is not an evidence violation, but as the all-in-one push accelerates the brief needs either a dated addendum (direction supersession note preserving the close-to-decision loop as beachhead) or an explicit Lead ruling that §1 stands. Either way, §6 L58 (_no marketing all routes as supported_) must survive untouched — the matrix's EXPERIMENTAL/REVIEW dispositions prohibit supported-marketing until certification regardless of strategic direction.
- **O-2 · Registry drift (minor).** project-context.md §11 lists `product-brief.md | v2.2` (L114) while the file header reads **v2.3** (L3, BMAD v5 restart Step 2 re-certification). Recommend a Mnemosyne registry refresh. Outside my write scope.

## 7. Bottom line

The v2.3 brief is structurally honest: confidence-scored assumptions, labeled owner-direction items, an economics gate before any public pricing claim, and **zero** occurrences of "enterprise-grade", "SOX compliant", "real-time", or "production-ready" language (E-2, witnessed). Residual risk concentrates in **five phrases**, two of which leak the exact maturity-ladder vocabulary ("Governed" L53, "Authoritative" L48) that the truth-matrix rules prohibit claiming while all 1,148 capability rows sit at BUILT-or-below (E-1). All five fixes are one-line qualifiers requiring no thesis or scope change. This audit should be re-run after the next brief rebaseline or after any matrix row is promoted through a BMAD gate.
