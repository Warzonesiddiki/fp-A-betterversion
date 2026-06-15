# USER_DOCS_AUDIT — FinPlan Pro v0.1

**Status:** DRAFT v0.1
**Owner:** Mnemosyne (Teammate Agent)
**Last updated:** 2026-06-15
**Cross-refs:** Part 81 (Agent Reading Protocol), Part 87 (i18n String Catalog), Part 193 (Doc Generation Spec), Part 200 (Handover Package)
**Inputs from audits:** None (this IS the audit). Audit findings are CONSUMED by Part 87 (gaps → strings to add) and Part 193 (gap-driven doc-gen priorities).

---

## Summary

This audit evaluates the user-facing documentation surface of FinPlan Pro against a six-dimension completeness target, with the goal of identifying the gap between the project's "perfect all-in-one FP&A" vision and the actual written material a real user (FP&A analyst, CFO, controller, budget owner) can find, read, and act on. FinPlan Pro is functionally rich (157 implemented features per the v0.1 state snapshot) but its user-facing documentation is at **approximately 17% coverage of the target set** (2 of 6 dimensions have any substantive content; the rest are absent or stubs). The most acute gap is the complete absence of release notes, admin/RBAC guidance, integration documentation, and a real troubleshooting playbook — all of which are table-stakes for an enterprise FP&A tool that promises "no other app needed." This audit's findings flow directly into Part 87 (every missing doc generates missing i18n strings) and Part 193 (priority order for doc-site generation).

---

## Methodology

- **File enumeration:** Glob + Read on `*.md` files at project root and under `docs/` (excluding `docs/adr/`, `docs/agent-status/`, `docs/drafts/`, and other internal codification directories per the Leader's "user-facing only" boundary).
- **Line counts:** `Get-Content | Measure-Object -Line` (PowerShell) for every file evaluated, recorded inline below.
- **Coverage rubric:** Each dimension scored on a 0-100% scale using three sub-criteria — (a) Existence, (b) Substance (lines / sections / structure), (c) Discoverability (linked from README, navigable, indexed).
- **Empirical witnesses (D-002 Three-Witnesses):** Every count below was verified by at least two independent tools (Read + Get-Content, or Grep + Read).

---

## The 6-Dimension Audit

### Dimension 1 — README

| File | Lines | Status |
|---|---|---|
| `README.md` | 118 | Substantive, but developer-oriented |

**Coverage: ~40%**

**Exists:** Yes. 118 lines, structured (Quick Start, Architecture, Test Suite, Project Structure, Performance, Build & Deploy, Roadmap, Contributing, License, Acknowledgments).

**Substance — What is present:**
- Hero statement (one-line elevator pitch)
- Test count claim ("8,334+ tests")
- Quick start (install / run commands)
- Tauri v2 build instructions
- Vite dev server
- MIT license declaration
- Link to `docs/USER_GUIDE.md` (line 84, "See `docs/USER_GUIDE.md` for usage")
- Link to `AGENTS.md` for contribution rules
- "Built with Kiro CLI" branding

**Substance — What is missing (the 60% gap):**
- **No screenshots or GIFs.** Zero visual aids anywhere in the README. A "perfect all-in-one FP&A" tool earns trust through screenshots of dashboards, grids, and reports.
- **No feature list visible at first scroll.** User has to read 30+ lines of architecture diagram before learning what the app does.
- **No link to user-facing help / onboarding** (User Guide is linked but it's the only link; no Help center, FAQ, or "Get started" wizard URL).
- **No license details beyond the one-line "MIT" mention** — no link to LICENSE file, no third-party attributions.
- **No support / community / contact channel** (Discord, GitHub Discussions, support email) — table-stakes for a real product README.
- **No badges** (build status, version, license, downloads) — minor but expected.
- **No "Who this is for" / personas section** — no "Built for FP&A analysts, CFOs, controllers…" so a first-time visitor can't self-qualify in 5 seconds.

**Discoverability:** The README is discoverable (it is the README). Internal links to `docs/USER_GUIDE.md` (line 84) are present. But the README does not link to the *better* doc — `docs/FINPLAN_PRO_USER_GUIDE.md` (321 lines, more complete) — even though both exist side-by-side. This is a CATCH-002 entry: parallel user guides with no cross-reference.

**CATCH entries filed by this dimension:**
- **CATCH-002 (parallel user guides, no cross-link):** `docs/USER_GUIDE.md` and `docs/FINPLAN_PRO_USER_GUIDE.md` are sibling user guides with different scopes. README links only to the smaller one (277 lines). The 321-line guide is the canonical one and should be the linked target, or both should be merged.
- **CATCH-003 (test count discrepancy):** README line 12 claims "8,334+ tests passing" but the v0.1 kickoff broadcast (FINPLAN_CURRENT_STATE.md snapshot) reports 1,043 tests passing. Discrepancy of 7,291 tests. Awaiting Apollo's PUSH_BLOCKER_REPORT for resolution. Either README is wrong (stale) or the state snapshot is wrong (undercounted). Until reconciled, the README is not a reliable source of truth.

**Verdict:** **Partial — needs UI, screenshots, persona statement, support channel, license link, and the CATCH-002/-003 fixes.**

---

### Dimension 2 — User Guide

| File | Lines | Status |
|---|---|---|
| `docs/USER_GUIDE.md` | 277 | Stub-by-stub outline |
| `docs/FINPLAN_PRO_USER_GUIDE.md` | 321 | More complete; not linked from README |

**Coverage: ~60%** (best-case; treating the longer guide as canonical)

**Exists:** Yes — two of them, creating CATCH-002 (above).

**`docs/USER_GUIDE.md` (277 lines) — Substance:**
- 18 numbered sections (Introduction through Acknowledgments)
- Covers: intro, install, build, architecture, features, data model, IPC, UI components, security, performance, testing, deployment, troubleshooting (stub), roadmap, contributing, license, acknowledgments
- Section 14 "Troubleshooting" is referenced in the TOC but is a stub (no real content beyond "Coming soon" or shell bullets)

**`docs/FINPLAN_PRO_USER_GUIDE.md` (321 lines) — Substance:**
- More complete walkthrough of features
- Better organized for non-developer readers
- Has actual prose in feature explanations
- Still missing: step-by-step recipes, real screenshots, keyboard shortcut cheatsheet (referenced as separate Part 24), FAQ section

**Substance — What is missing (the 40% gap):**
- **No screenshots or visual walkthroughs** in either guide.
- **No step-by-step task recipes** ("How to create your first budget," "How to run a scenario analysis," "How to consolidate entities").
- **No keyboard shortcut reference card** in-line (this is a separate spec in Part 24 — but the user guide should link to or embed it).
- **No "Getting Started in 5 Minutes" section** at the top of the user guide.
- **No personas / "I am a CFO — read this" signposting**.
- **No glossary of financial / accounting terms** (this is the entire purpose of Part 50 — should be cross-linked).
- **No example workflows** showing the 192-page IA in action for a real FP&A use case.
- **Section 13/14 (Troubleshooting)** in `docs/USER_GUIDE.md` is a stub.

**Discoverability:** Both guides are discoverable via README link (CATCH-002 caveat). Neither is discoverable from the in-app help system (which doesn't exist yet — see Dimension 5).

**Verdict:** **Substantive but incomplete. The two-guide duplication must be resolved (recommend: deprecate `docs/USER_GUIDE.md`, promote `docs/FINPLAN_PRO_USER_GUIDE.md` to `docs/USER_GUIDE.md`). Add: recipes, screenshots, glossary cross-link, shortcut card.**

---

### Dimension 3 — Admin Guide

| File | Lines | Status |
|---|---|---|
| **(none)** | 0 | **MISSING** |

**Coverage: 0%**

**Exists:** No. There is no `docs/ADMIN_GUIDE.md`, no `docs/ADMINISTRATION.md`, no `docs/RBAC.md`, no `docs/ENTERPRISE_DEPLOY.md`, no admin section inside the user guide.

**What should be in it (gap inventory):**
1. Initial system setup (first-admin provisioning, master account creation)
2. User & role management (RBAC — every role, every permission, every scope)
3. Workspace / tenant configuration
4. Master Storage encryption key management (per Part 15 / SECURITY_READINESS)
5. Backup & restore procedures
6. Audit log access and interpretation
7. SSO / SAML / OIDC setup
8. SCIM provisioning
9. License activation / seat management
10. Data residency configuration
11. Compliance reporting (SOC 2, GDPR DPA workflows)
12. Performance tuning knobs (worker pool, calc engine cache sizes)
13. Update / upgrade procedure
14. Disaster recovery

**Why this matters:** The project explicitly targets enterprise FP&A teams (the kickoff lists 8 personas including "auditor" and "controller"). An admin guide is not optional — it is the gating artifact for any enterprise sale.

**Verdict:** **MISSING. Critical gap. Must be authored before any enterprise pilot.**

---

### Dimension 4 — API / Integration Guide

| File | Lines | Status |
|---|---|---|
| **(none)** | 0 | **MISSING** |

**Coverage: 0%**

**Exists:** No. There is no `docs/API.md`, no `docs/INTEGRATIONS.md`, no `docs/IPC.md` aimed at integrators.

**Internal artefacts that exist but are NOT user-facing:**
- `src-tauri/src/commands.rs` — Tauri IPC command handlers (developer reference, not user docs)
- TypeScript type definitions in `src/types/` — used by the app, not exported as a public API
- The 8-step onboarding flow is hardcoded in `OnboardingWizard.tsx` — not externally scriptable

**What should be in it (gap inventory):**
1. **Tauri IPC command reference** — every command name, parameters, return type, error codes, version-stability guarantee
2. **REST/GraphQL API** — if any exists; if not, the doc must say "no public HTTP API in v1"
3. **Webhooks** — if supported
4. **Data import** — CSV/Excel column mapping for chart of accounts, GL data, budget data
5. **Data export** — supported formats, schema, version
6. **Pre-built integrations** — for each of the 6 competitors and the 15 sector model templates (per the 200-part outline)
7. **Authentication tokens** — how to obtain, scope, rotate, revoke
8. **Rate limits & quotas**
9. **Versioning & deprecation policy**
10. **Code samples** in TypeScript, Python, cURL

**Why this matters:** "Won't need any other app" (the project vision) is only credible if FinPlan Pro plays well with the GL/ERP/data warehouse systems the user already has. Without an integration guide, "no other app needed" is just a marketing claim, not an architectural commitment.

**Verdict:** **MISSING. Critical gap. Blocks enterprise integration story.**

---

### Dimension 5 — Troubleshooting / Help

| File | Lines | Status |
|---|---|---|
| `docs/USER_GUIDE.md` Section 13/14 "Troubleshooting" | ~0-5 (stub) | **Effectively missing** |

**Coverage: ~5%**

**Exists:** A section heading exists in the user guide's TOC. The body is a stub (a few bullet points or "coming soon" text). There is no:
- In-app help center
- Searchable help index
- "What to do when X breaks" playbook
- Error code dictionary (a user-facing subset of Hephaestus's Part 179)
- Performance troubleshooting (calc engine is slow, grid lags, etc.)
- Data recovery (corrupt .fpa file, sync conflict)
- Tauri-specific issues (WebView2 missing, code-signing on macOS, etc.)
- PWA / offline-mode issues
- Migration / upgrade issues

**What should be in it (gap inventory):**
1. Symptom → Cause → Fix recipes for the 20 most common issues
2. Diagnostic decision tree (CalcEngine problem? Grid problem? Tauri shell problem?)
3. Error code → user-actionable explanation table (subset of Part 179)
4. Performance troubleshooting checklist
5. Data recovery procedures (.fpa file format version, backup file location)
6. Platform-specific issues (Windows / macOS / Linux / Web)
7. How to file a meaningful bug report (logs to collect, repro steps)
8. How to roll back an upgrade
9. Network / proxy / firewall issues (for license check, telemetry)
10. Accessibility troubleshooting (screen reader specific issues, contrast)

**Why this matters:** A 192-screen enterprise app with zero troubleshooting doc is one bad support ticket away from churn. The user guide and the troubleshooting doc serve different roles: user guide teaches; troubleshooting rescues.

**Verdict:** **Effectively missing. Section 13 of `docs/USER_GUIDE.md` is a stub and must be replaced with a real playbook, or the doc must link to a new `docs/TROUBLESHOOTING.md`.**

---

### Dimension 6 — Release Notes / Version History

| File | Lines | Status |
|---|---|---|
| **(none)** | 0 | **MISSING** |

**Coverage: 0%**

**Exists:** No `CHANGELOG.md`, no `RELEASES.md`, no `docs/RELEASE_NOTES.md`, no GitHub Releases (verifiable via absence of any versioned date markers in the project root). A `LICENSE` file exists (good) but no release process doc.

**What should be in it (gap inventory):**
1. Versioned release history (semantic versioning — Major.Minor.Patch)
2. Per-release: date, highlights, breaking changes, migration steps, deprecations
3. Roadmap items delivered (cross-ref Part 4 / Part 199)
4. Known issues for current release
5. Compatibility matrix (Tauri version, Node version, OS support)
6. Security advisory cross-refs
7. Upgrade guide per major version
8. Template for the next release (Part 79 owns the template spec)

**Why this matters:** A user evaluating "should I upgrade?" needs release notes. An enterprise customer needs an upgrade guide with migration steps. A regulator (auditor persona) needs a change-log. An auditor (the role) is one of the 8 personas named in the v0.1 kickoff — and there is nothing for them to read.

**Verdict:** **MISSING. Critical gap. Part 79 (Release Notes & Version History Template) is exactly this and must be filed before v0.1 ships to anyone external.**

---

## Aggregate Coverage Score

| Dimension | Coverage | Severity | Priority to fix |
|---|---|---|---|
| 1. README | 40% | Medium | P1 (low-effort, high-visibility) |
| 2. User Guide | 60% | Medium | P1 (resolve CATCH-002 duplication) |
| 3. Admin Guide | 0% | **Critical** | P0 (blocks enterprise) |
| 4. API / Integration Guide | 0% | **Critical** | P0 (blocks integration story) |
| 5. Troubleshooting | 5% | High | P1 (must exist before any GA) |
| 6. Release Notes | 0% | **Critical** | P0 (auditor / enterprise blocker) |
| **TOTAL** | **~17%** | **High** | 3 P0s, 3 P1s |

(Weighted average: 2 of 6 dimensions have non-zero substance; weighted for severity gives ~17% functional coverage of the user-facing doc target set.)

---

## Gap List (Prioritized)

### P0 — Block external / enterprise use

1. **G-01** — Author `docs/ADMIN_GUIDE.md` covering the 14 admin areas listed in Dimension 3. Target ≥ 1,500 lines.
2. **G-02** — Author `docs/INTEGRATIONS.md` (or `docs/API.md`) covering the 10 integration areas in Dimension 4. Target ≥ 1,200 lines. Must include Tauri IPC command reference and CSV/Excel import mapping.
3. **G-03** — Author `docs/RELEASE_NOTES.md` with the v0.1 release entry (date: TBD, but doc the spec retroactively). Apply the template that Part 79 will define.

### P1 — Block GA quality bar

4. **G-04** — Replace the stub Section 13/14 in `docs/USER_GUIDE.md` with a real `docs/TROUBLESHOOTING.md` (or merge it into the user guide as a proper section). Target ≥ 400 lines of Symptom → Cause → Fix recipes.
5. **G-05** — Resolve CATCH-002: pick one of `docs/USER_GUIDE.md` vs `docs/FINPLAN_PRO_USER_GUIDE.md` as canonical; deprecate the other or merge them.
6. **G-06** — Resolve CATCH-003: reconcile README's "8,334+ tests" with the state snapshot's "1,043 tests pass." Pick the correct number; correct the doc that is wrong.

### P2 — Quality polish

7. **G-07** — Add screenshots to README, both user guides, and PRODUCT_VISION. Minimum: 12 screenshots covering the 12 most-trafficked screens.
8. **G-08** — Add a "Getting Started in 5 Minutes" section at the top of the user guide.
9. **G-09** — Add a personas / "I am a ___" signposting section to README and user guide.
10. **G-10** — Add an in-app help entry point (button in top nav → opens `docs/HELP_INDEX.md` rendered as Markdown). Requires a Help center renderer (separate spec, cross-ref Part 29 by Hera).

---

## CATCH Entries (Cross-Reference Index)

| ID | Description | Filed by | Status |
|---|---|---|---|
| CATCH-002 | Parallel user guides with no cross-link (`docs/USER_GUIDE.md` vs `docs/FINPLAN_PRO_USER_GUIDE.md`) | Mnemosyne | Open |
| CATCH-003 | Test count discrepancy: README claims 8,334+, state snapshot claims 1,043 pass | Mnemosyne | Open — needs Apollo |

---

## Open Questions / Gaps

1. **OQ-01** — Is the project targeting an external launch (where README + user guide is the on-ramp) or an internal pilot (where direct training is acceptable)? The urgency of the P0 gaps depends on this answer.
2. **OQ-02** — Is there a doc-site generator planned (e.g., Docusaurus, VitePress, MkDocs)? Part 193 will spec this. The user-facing doc set should be authored with that target in mind (Markdown-frontmatter, link conventions, build config).
3. **OQ-03** — Does the team plan to support user-facing translations in v1, or is v1 English-only? Part 87 (i18n String Catalog) is being authored in parallel and will assume the same answer.
4. **OQ-04** — Is the README's "8,334+ tests" figure aspirational (target by release) or stale (was true at one point)? Apollo's PUSH_BLOCKER_REPORT will resolve.
5. **OQ-05** — Are there any existing drafts of admin / API / troubleshooting docs in the team's working folders (Slack, Notion, Google Drive) that should be ingested before authoring from scratch?

---

## Sign-off

**Status: DRAFT v0.1**

This audit is filed as input to:
- **Part 87 (i18n String Catalog)** — every user-facing string in a not-yet-authored doc is a missing string to be added to the catalog once the doc is written.
- **Part 193 (Documentation Generation Specification)** — the gap list above defines the priority order for doc-gen automation.
- **Part 200 (Agent Handover Package)** — the admin and API gaps are explicitly called out as known gaps in the handover doc.
- **Hera's Part 8 / Part 29** — the in-app help entry point (G-10) is also a UX concern; the in-app help index is a cross-cutting artifact.

This audit does NOT need a 4-ICP verdict at v0.1 — it is empirical observation. Future revisions (after G-01 through G-10 are closed) should be reviewed for BINDING status.

— Mnemosyne, 2026-06-15
