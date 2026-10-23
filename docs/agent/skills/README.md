# Agent skill library

The methods a session applies on this project. A skill is a short, specific way
of working that has been wrong before when it was skipped — not a tutorial.

**How to use it.** Before starting a task, find the row whose "use it when" line
matches what you are about to do, and follow it. When two skills apply, the
narrower one wins; when a skill and a gate disagree, the gate is right and the
skill gets fixed.

**How it is governed.**

- Every skill has `name`, `description` and `group` frontmatter.
- The index below is generated from that frontmatter: `npm run skills:index`
  rewrites it, `npm run skills:verify` fails if it is stale, if a file is
  unlisted, or if frontmatter is missing.
- Adding a skill: read `skill-authoring` first, then register it in
  `docs/agent/00_INDEX.md` as well.
- A skill never upgrades a claim. Evidence still comes from the gates in
  `docs/agent/05_COMMANDS_AND_GATES.md`, and a recorded number stays recorded.

**Provenance.** The `owner` group is the owner's own Ponytail set, reproduced
verbatim (two backticked filenames were unbackticked because this repository's
link gate resolves them as real paths). The `discipline` group is adapted from
[obra/superpowers](https://github.com/obra/superpowers) (MIT) — the methods are
kept, the words are rewritten for this repo. `frontend-design` and
`skill-authoring` acknowledge [anthropics/skills](https://github.com/anthropics/skills)
as their origin. Everything else is original to FinPlan Pro, derived from this
repository's own incidents and decisions.

<!-- SKILLS:START -->

| Skill | Use it when | Group |
| --- | --- | --- |
| **How work is done** | | |
| [`brainstorming`](brainstorming.md) | Use before building anything whose shape is not settled: turn a vague ask into one agreed design, one question at a time. No code is written in this skill. | discipline |
| [`bulk-refactor-and-codemod`](bulk-refactor-and-codemod.md) | Use for a mechanical change across many files: count first, transform once, prove the count after. Hand-editing 65 files is how a sweep goes wrong. | discipline |
| [`executing-plans`](executing-plans.md) | Use when working through an existing plan: one step at a time, gate before moving on, and update the plan when reality disagrees with it. | discipline |
| [`finishing-a-branch`](finishing-a-branch.md) | Use at the end of a work unit: full gates, clean tree, honest handover, push to the branch that owns the session. Nothing is claimed that was not run. | discipline |
| [`onboarding-a-codebase`](onboarding-a-codebase.md) | Use when entering an area of this repo you have not read: map it before editing it, and say what you did not read. | discipline |
| [`preview-and-local-verification`](preview-and-local-verification.md) | Use when you need to see the app: run the dev server, bind it for the preview proxy, and verify in the browser what the tests cannot see. | discipline |
| [`receiving-review`](receiving-review.md) | Use when a review or audit finding arrives: verify it against the code before agreeing or disagreeing, and never quietly ignore it. | discipline |
| [`requesting-review`](requesting-review.md) | Use before asking for a review or opening a PR: make the change reviewable — small, self-explaining, with the evidence a reviewer would otherwise chase. | discipline |
| [`research-and-sourcing`](research-and-sourcing.md) | Use before repeating any external fact, benchmark, standard or library claim: find the source, date it, and say what it does not prove. | discipline |
| [`route-promotion-evidence`](route-promotion-evidence.md) | Use when promoting a route from EXPERIMENTAL to SUPPORTED. Requires real page tests with exact titles and real governance tests in spineGovernance.test.ts. | discipline |
| [`systematic-debugging`](systematic-debugging.md) | Use for any bug, test failure, build break or unexplained number: find the root cause before proposing a fix. No fix without a reproduced cause. | discipline |
| [`test-driven-development`](test-driven-development.md) | Use for any bug fix, money path, parser, permission check or data write: write the failing test first, watch it fail for the right reason, then fix. | discipline |
| [`verification-before-completion`](verification-before-completion.md) | Use before saying done, fixed, passing, clean or green — in a reply, a commit, a PR body or a Notion page. Run the command, read the output, then claim. | discipline |
| [`writing-plans`](writing-plans.md) | Use when a task spans more than one sitting or more than one PR: write the plan as ordered steps with a testable exit gate per step. | discipline |
| [`zero-compromise-verification`](zero-compromise-verification.md) | Use when claiming any capability is complete, verified, or perfect. Proves the claim with failing-first tests, exact evidence, and honest boundaries. | discipline |
| **Money, accounting and the finance domain** | | |
| [`asc-810-consolidation-elimination`](asc-810-consolidation-elimination.md) | Use when working on consolidation, IC elimination, ownership tree, or multi-entity close: 100% elimination per ASC 810-10-45-1, single economic entity, NCI attribution. | finance |
| [`audit-trail-and-lineage`](audit-trail-and-lineage.md) | Use when a number must be explainable later: who changed what, from which source, through which calculation. Lineage is a product feature, not logging. | finance |
| [`data-import-and-mapping`](data-import-and-mapping.md) | Use for any inbound data path: GL extracts, budgets, headcount files, rate tables. Nothing enters the store unless it is mapped, counted and accounted for. | finance |
| [`determinism-and-reproducibility`](determinism-and-reproducibility.md) | Use in calculation paths: same input must give the same output, whatever the clock, locale or machine. Replayable beats lucky. | finance |
| [`driver-based-scenario-modeling`](driver-based-scenario-modeling.md) | Use when building or changing scenario modeling, driver planning, or what-if analysis: 5-7 key drivers, base/upside/downside, owner-assigned assumptions. | finance |
| [`financial-domain-modeling`](financial-domain-modeling.md) | Use when modelling accounting or FP&A behaviour: entries, close, consolidation, intercompany, FX, drivers, variance. Get the accounting right before the screen. | finance |
| [`money-adoption-migration`](money-adoption-migration.md) | Use when migrating modules to the Money primitive (toDecimal). Covers import placement, marker usage, baseline updates, and ratchet maintenance. | finance |
| [`money-and-decimals`](money-and-decimals.md) | Use for any change that reads, computes, stores, sums, allocates or displays an amount. Money is integer minor units behind a branded type; never a float. | finance |
| [`no-invented-data`](no-invented-data.md) | Use whenever a number, rate, benchmark or label appears in the UI: it must come from data the user supplied or a recorded assumption, never from a literal. | finance |
| [`period-close-operations`](period-close-operations.md) | Use when working on close: locking, reopening, adjustments, carry-forward. Close is a state machine with evidence, not a date field. | finance |
| [`reconciliation-and-tie-out`](reconciliation-and-tie-out.md) | Use when two sets of numbers must agree: source vs store, subledger vs GL, actuals vs plan, screen vs export. Show the difference, never force it to zero. | finance |
| [`rolling-forecast-implementation`](rolling-forecast-implementation.md) | Use when implementing or changing rolling forecast, driver-based forecasting, or continuous planning: 12-18 month horizon, 5-day cycle, driver-based, back-test. | finance |
| **Code, data, security and release mechanics** | | |
| [`architecture-boundaries`](architecture-boundaries.md) | Use when adding a module, an import across layers, or a helper that could live in three places. Layering is what keeps the numbers debuggable. | engineering |
| [`data-integrity-and-persistence`](data-integrity-and-persistence.md) | Use when a change touches persisted data, migrations, import, or anything that could lose or silently alter a user's numbers. | engineering |
| [`dependency-and-licence-audit`](dependency-and-licence-audit.md) | Use before adding a package or upgrading one: size, licence, maintenance, and whether the platform already does it. | engineering |
| [`desktop-shell-tauri`](desktop-shell-tauri.md) | Use for anything that touches the desktop shell: filesystem, offline behaviour, updates, signing. The browser preview is not the product. | engineering |
| [`full-test-suite-execution`](full-test-suite-execution.md) | Use when running the complete test suite across all shards. Maps shard assignments, runs each shard, aggregates results, and verifies the 8/8 pass requirement. | engineering |
| [`gates-and-ratchets`](gates-and-ratchets.md) | Use when adding, changing or bypassing a check. A gate is only worth what it catches; a ratchet only moves one way. | engineering |
| [`incident-and-rollback`](incident-and-rollback.md) | Use when something shipped is wrong in the user's hands: stop the bleeding, preserve evidence, then fix the cause. | engineering |
| [`observability-and-errors`](observability-and-errors.md) | Use when handling an error, adding a log, or writing a catch: the failure must be visible, attributable, and never silently converted into a default. | engineering |
| [`react-state-and-stores`](react-state-and-stores.md) | Use when changing a Zustand store, a selector, persisted state, or a page that reads them. Wrong state shape is the most expensive kind of wrong. | engineering |
| [`release-engineering`](release-engineering.md) | Use when preparing a release or a release candidate: gates, evidence, version, and the honest list of what is not ready. | engineering |
| [`security-and-secrets`](security-and-secrets.md) | Use when handling credentials, auth, user input, file paths, exports or the Electron/Tauri boundary. Assume input is hostile and the disk is shared. | engineering |
| [`sqlite-and-server`](sqlite-and-server.md) | Use in `server/`: SQLite through Express with JWT, RBAC and tenancy. Small server, strict rules — it is the only place tenancy can be enforced. | engineering |
| [`testing-strategy`](testing-strategy.md) | Use when deciding what to test and what to skip, or when a suite is slow, flaky, or green while the product is wrong. | engineering |
| [`typescript-strictness`](typescript-strictness.md) | Use when adding types, widening a signature, or silencing the compiler. The compiler is the cheapest test in the repo; do not spend it. | engineering |
| **What the user sees and exports** | | |
| [`accessibility-wcag`](accessibility-wcag.md) | Use for any interactive UI change: keyboard reachability, focus, contrast, live regions, motion. Accessibility is a gate here, not a polish pass. | product-ui |
| [`ag-grid-modular-optimization`](ag-grid-modular-optimization.md) | Use when ag-grid bundle is large or DataGrid is changed: cherry-pick modules, register via ModuleRegistry, keep ValidationModule dev-only. | product-ui |
| [`ai-features-safety`](ai-features-safety.md) | Use for any AI-assisted surface: local-only, grounded in computed facts, off by default, and never a source of financial values. | product-ui |
| [`bundle-optimization-advanced`](bundle-optimization-advanced.md) | Use when bundle is near limit and needs advanced optimization. Covers vendor splitting, lazy loading, tree-shaking, custom components, and EXPERIMENTAL route retirement. | product-ui |
| [`bundle-optimization-methodology`](bundle-optimization-methodology.md) | Use when bundle size is near limit or needs reduction. Proven methods: vendor chunking, lazy loading, tree-shaking, custom chart components, stub optional deps. | product-ui |
| [`charts-and-data-display`](charts-and-data-display.md) | Use when a chart, sparkline, KPI tile or heatmap shows a number: the picture must not imply something the data does not say. | product-ui |
| [`excel-and-report-exports`](excel-and-report-exports.md) | Use when a report leaves the app (Excel, CSV, PDF, PPTX): the exported number must tie back to the screen, and the file must be safe to open. | product-ui |
| [`forms-and-validation`](forms-and-validation.md) | Use for any input the user types: validate once, in one place, with messages that say what to do. Bad input must not reach the store. | product-ui |
| [`frontend-design`](frontend-design.md) | Use when building or restyling a screen: density for finance work, hierarchy that survives a projector, and no decoration that costs a click. | product-ui |
| [`performance-and-bundle`](performance-and-bundle.md) | Use when adding a dependency, a page, a chart or a big table: the bundle has a hard budget and finance users scroll 100k rows. | product-ui |
| [`recharts-tree-shaking`](recharts-tree-shaking.md) | Use when chart bundle is large or adding a new chart: granular imports, avoid barrel, dynamic import heavy charts, measure treemap. | product-ui |
| [`vite-bundle-deep-optimization`](vite-bundle-deep-optimization.md) | Use when bundle is near limit or a new dependency pushes total over budget: split vendors, lazy routes, avoid barrels, measure before/after. | product-ui |
| **Documentation, traceability, authoring** | | |
| [`connector-driven-documentation`](connector-driven-documentation.md) | Use when documentation needs to be shared across connectors. Maps repo artifacts to Notion, Google Docs, Google Sheets, and Gmail for owner communication. | meta |
| [`connector-utilization`](connector-utilization.md) | Use when documentation, decisions, or release artifacts need to be shared with external systems. Maps repo artifacts to Notion, Google Docs, Google Drive, and other connectors. | meta |
| [`docs-and-decisions`](docs-and-decisions.md) | Use when writing or editing project documentation: one fact, one owner, one date, one command. Documentation is a claim set, not a narrative. | meta |
| [`owner-pack-completion`](owner-pack-completion.md) | Use when compiling owner decisions O1-O9 into a completion document. Records what is claimed, what is blocked, and what the owner must answer. | meta |
| [`requirements-traceability`](requirements-traceability.md) | Use when claiming a requirement is met, mapping capability to evidence, or filling a register row. Every requirement resolves to a test or is labelled. | meta |
| [`skill-authoring`](skill-authoring.md) | Use when adding a skill to this library: one job, a trigger line, the method, and the gate that proves it. Keep it short enough to be read in one pass. | meta |
| [`zero-compromise-audit`](zero-compromise-audit.md) | Use when auditing the project for zero-compromise compliance. Checks every gate, every claim, every number against evidence. | meta |
| **The owner's Ponytail set (verbatim, standing)** | | |
| [`ponytail-audit`](ponytail-audit.md) | Quality audit of a whole repo: bugs, security holes, what breaks under real load, risky code without tests, slow paths, and what to delete, merge or split. Ranked, each finding explained in plain English. One-shot report, changes nothing. Use for "audit this codebase", "review the whole repo", "find bloat", "what can I delete", /ponytail-audit. | owner |
| [`ponytail-debt`](ponytail-debt.md) | List every `shortcut:` comment (and older `ponytail:` ones) as a debt ledger. One-shot report, changes nothing. Use for "ponytail debt", "what did ponytail defer", "list the shortcuts", /ponytail-debt. | owner |
| [`ponytail-gain`](ponytail-gain.md) | Show ponytail's measured savings (code, cost, speed) from the benchmark. One-shot display. Use for /ponytail-gain, "what does ponytail save", "ponytail impact". | owner |
| [`ponytail-help`](ponytail-help.md) | Quick reference for ponytail levels, skills and commands. One-shot display. Use for /ponytail-help, "ponytail help", "how do I use ponytail". | owner |
| [`ponytail-review`](ponytail-review.md) | Quality review of a change: is the logic right, is it safe, does it hold under real load, is risky code tested, is it fast enough, and is every line needed. Reads the connected code, not only the diff. Each finding is explained in plain English. Use for "review this", "code review", "review the last commit", "review my PR", "is this over-engineered", /ponytail-review. | owner |
| [`ponytail`](ponytail.md) | Lazy senior dev mode: the smallest change that fully solves the task, and a reply a busy human understands in one read. Use on any coding task (writing, fixing, refactoring, reviewing, choosing dependencies) and when the user says "ponytail", "be lazy", "simplest solution", "yagni", or complains about over-engineering or bloat. Levels: lite, full (default), ultra. | owner |

<!-- SKILLS:END -->
