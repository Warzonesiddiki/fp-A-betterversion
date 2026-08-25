# UI-SPEC-C · Navigation / IA Polish Spec (UI-03)

|                         |                                                                                                                                                                                                                                             |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Task**                | `01a02fa7-6f5b-7730-aa97-302e9bdcb1b2` · UI-SPEC-C · Navigation/IA polish spec (read-only)                                                                                                                                                  |
| **Author**              | Uxie (UX spec owner) · team fpa                                                                                                                                                                                                             |
| **Date**                | 2026-08-23 · HEAD `fbe0c00b`                                                                                                                                                                                                                |
| **Status**              | SPEC DRAFT — all proposals are **HYPOTHESIS** pending Phase 3 authorization. Sections marked **[CONTINGENT]** are designed for the _recommended_ IA option and flip per Archie's parallel decision memo — do not implement until both land. |
| **Constraints honored** | Zero code edits. No commits/pushes. Only file created: this one.                                                                                                                                                                            |

---

## 0. Inputs

- `_bmad/project-completion-plan.md:35` — UI-03 acceptance: _"A user reaches any workflow in ≤3 clicks; command palette covers all routes"_ (scope adds recent items + breadcrumbs).
- `_bmad/ui01-design-system-audit.md` gap #9 (this audit's IA findings).
- `src/types/navigation.ts` (61–696), `src/components/layout/Sidebar.tsx`, `src/components/layout/AppLayout.tsx:76–110`, `src/engines/GlobalSearchEngine.ts`.

## 1. Baseline facts (measured, with witnesses)

**Interaction model today is mechanically shallow — the real cost is findability.**

- Sidebar sections expand one at a time (`Sidebar.tsx:102-114`); the open panel renders **all groups inline as labeled lists** — groups are headings, NOT extra click-stops (`Sidebar.tsx:65-79`). The rail auto-follows the active route (`Sidebar.tsx:94-100`).
- ⇒ Any visible destination costs exactly **2 clicks** (section → item); 1 click if its section is already open. There is no 3rd mechanical click anywhere.
- What actually hurts: (a) choosing the right pillar among 10 when naming varies ("Board Pack" lives under Home/Dashboard, `navigation.ts:72`; "Exchange Rates" under Treasury, `navigation.ts:392`; "Data Import" under Accounting › Data Management, `navigation.ts:279`); (b) scan length inside wide panels (Industries alone spans 20 sector groups, `navigation.ts:462ff`); (c) repeat trips re-pay the full scan because there are no recents/favorites anywhere.

**Census (fresh, HEAD fbe0c00b):**

| Measure                                  | Value                                                                          | Witness                                                      |
| ---------------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------ |
| `<Route>` elements in App.tsx            | 197 (193 static + 4 param `:id`)                                               | Select-String count over `src/App.tsx`                       |
| Manifest NavItem entries                 | 188 (139 visible + 49 hidden aliases)                                          | regex `\{ path:` / `hidden: true` over `navigation.ts`       |
| Palette items                            | flattened manifest, **hidden dropped**, role-filtered                          | `AppLayout.tsx:81-98` (filter `:86`), role filter `:100-103` |
| GlobalSearchEngine static pages          | **9 hardcoded** (stale duplicate of manifest)                                  | `GlobalSearchEngine.ts:91-101`                               |
| Static routes without own manifest entry | ≈193−188 = net few (aliases/detail pages) — reconciliation test needed (§6-B5) | derived                                                      |
| Favorites / recents / breadcrumbs        | none exist                                                                     | no such store/UI found in `uiStore`/`Sidebar.tsx`            |

## 2. Design principles (this spec)

P1. Mechanical depth is already fine — optimize **recognition, not clicks**: fewer/wider-known pillars, better labels, memory aids.
P2. One index of truth: sidebar, palette, breadcrumbs, and tests derive from the same manifest — never hand-copied lists (kills the GSE drift class).
P3. Memory aids (favorites/recents) turn repeated 2-click trips into 1-click trips without restructuring anything.
P4. Hidden ≠ dead: aliases stay routable and discoverable in palette under an explicit "(legacy)" label.
P5. Every proposal degrades gracefully for roles: permission filtering applies to favorites/recents/palette alike.

---

## 3. [SPEC-A] Pillar taxonomy regroup — RECOMMENDED option

> Archie's memo owns the option tradeoffs. This section specifies UX behavior for the recommended shape below; **[CONTINGENT]** marks what flips otherwise.

### A1 · Industries pillar → demote to a single "Industry Packs" entry (RECOMMENDED)

Today Industries is a peer pillar whose panel shows **20 sector groups** (`navigation.ts:462ff`, e.g., Banking & Financial Services with 6 items `navigation.ts:464-469`). Problems: crowds the rail scroll-order ahead of core FP&A work; forces a sector commitment before any FP&A task; inflates the "which pillar?" guess.

Proposed behavior:

- Rail shows ONE entry: **"Industry Packs"** (icon: Building2), opening an **Industry Pack Gallery page** (`/industries`) — card grid of the 20 sectors, each card showing name + 1-line descriptor + item count.
- Sector card click → existing sector landing (current first item of that group). All current sector routes remain valid URLs; nothing is deleted, only re-tiered.
- In-page left-nav inside `/industries/*` lists that pack's modules (reuses `.fp-table`-style list patterns; density-aware per UI-04).
- Depth math: Industry page from cold start = pillar(1) → Industry Packs(2) → gallery card(3) = **3 clicks worst-case** (meets plan gate); from gallery visited-before = 1 via recents/favorites.
- Panel scan relief: removes ~60 rows from rail panels; every remaining pillar panel shrinks proportionally.

**[CONTINGENT]** If Archie's memo instead selects:

- _Full removal behind feature flag_: same gallery becomes opt-in via Settings; rail hides pillar entirely; deep links keep working.
- _Keep-as-pillar but collapse groups_: gallery skipped; panel gets a two-stage group expander — then depth for sector items becomes 3 (pillar→group→item) which still meets the gate but re-introduces a scan step; NOT preferred by UX.

### A2 · Analysis section → three named groups (no route changes)

Current flat 12-item list (`navigation.ts:169-203`) scans poorly next to every other grouped pillar. Proposed grouping (labels HYPOTHESIS, membership follows existing items):

| Group                     | Items (existing routes, unchanged)                                                    |
| ------------------------- | ------------------------------------------------------------------------------------- |
| **Health & Diagnostics**  | anomaly/FDQC-style dashboards, data-quality views currently listed flat               |
| **Ratios & Statements**   | ratio analysis, Three-Statement Dashboard (`navigation.ts:223`), comparable analytics |
| **Workspaces & Builders** | Dashboard Builder (`navigation.ts:183`), custom analysis builders                     |

Exact item→group assignment to be finalized during implementation against the live list; principle: **no route moves, only group labels appear** — zero link rot risk. Depth unchanged (2); scan cost drops (3 short lists of ≤5 vs one 12-list).

### A3 · Board Pack relocation (findability fix, zero code move)

Board Pack sits under Home › Dashboard (`navigation.ts:72`) while users look for it under Reporting. Proposal: add it to Reporting pillar's board/investor group **as the canonical visible entry**; keep `/board-pack` route; Home keeps a visible shortcut only if product wants it (default: remove from Home, rely on favorites/recents). **[CONTINGENT]** on Archie if memo treats Home as locked minimal set.

### A4 · Hidden-vs-visible policy (formalize the 49)

Rules (retro-applies to existing 49):

1. `visible: true` ⇔ a primary destination a user can _name_ in nav vocabulary.
2. `hidden: true` reserved for **exact aliases or superseded paths** of a visible canonical item (e.g., `/periods` → `/periods/close`, `navigation.ts:322-323`; `/audit-trail` → `/audit/trail`, `navigation.ts:265`). Each hidden entry MUST declare `aliasOf: <canonicalPath>` (new optional field) — enforced by contract test.
3. Hidden items never render in the rail; they render in palette ONLY when the query matches the alias string or the word "legacy", suffixed "(legacy)" (§6-B2).
4. No new hidden entries without an alias target; contract test fails otherwise.

## 4. [SPEC-C] Favorites & Recents (none exists today)

### C1 · Favorites ("Pinned")

- Store: `favoritesStore` (Zustand + persist via `masterStorage`, per AGENTS middleware order), shape `{ items: Array<{path, label, sectionId, addedAt}> }`, **max 8** (oldest evicted with toast undo).
- Pin/unpin affordances: (a) hover ⭐ on any sidebar item; (b) palette row action (⌘/Ctrl+P toggle on highlighted result); (c) star icon in PageHeader actions slot on the page itself.
- Rendering: "Pinned" block pinned above sections in the rail (always expanded, compact rows, section-icon prefix); drag-to-reorder within block; keyboard-reorderable (Alt+↑/↓) for a11y parity.
- Role safety: on role switch, prune favorites lacking permission (reuse `filterNavItemsByRole`, `AppLayout.tsx:100-102` pattern) — silently, logged to audit trail.
- Click math: any pinned destination = **1 click** from anywhere.

### C2 · Recents

- Track last **12 distinct** destinations in `uiStore` (persisted, lightweight `{path,label,ts}`), dedupe consecutive repeats, exclude auth/settings-system internals.
- Surfaces: (a) palette default view before typing ("Recent", top 5); (b) optional rail strip under Pinned (collapsed by default, Settings toggle); (c) breadcrumb-adjacent "back to previous page" chip is explicitly OUT of scope (breadcrumbs §5 cover orientation).
- Cold-start honesty: first session has empty Pinned/Recents → behavior equals today (2-click trips). Warm-state gains are what close the loop.

## 5. [SPEC-D] Breadcrumbs (plan scope item)

- Derive ancestry from manifest (Pillar › Group › Page) — never hardcoded strings; pages outside manifest (param details, e.g., `/budgets/:id`) render Pillar › List-Page › "{entity name}" using the entity store.
- Rendered in the PageHeader slot (87%-adopted component, audit §2.2), truncated middle-out, each ancestor clickable (updates rail open-section via the existing follow-route effect `Sidebar.tsx:98-100`).

## 6. [SPEC-B] Command-palette & search coverage ("covers all routes")

### B1 · Unified index contract

Replace the stale 9-entry static list (`GlobalSearchEngine.ts:91-101`) — palette index = single builder fed by:

1. **Manifest layer**: all visible items (label + path + section/group labels as searchable text) — already wired at `AppLayout.tsx:81-98`, keep as source #1.
2. **Legacy-alias layer**: hidden items with `aliasOf` (§3-A4), searchable, labeled "(legacy)".
3. **Entity layer**: dynamic records (budgets, forecasts, scenarios, entities — existing GSE store feeds `GlobalSearchEngine.ts:41-88`), extended to reports/reports-run instances.
4. **Param-pattern registry**: the 4 param routes (`/budgets/:id` etc.) are NOT statically indexed; they're reachable via entity results. Registry + test (B5) proves no static route is stranded.

Result types grouped in palette: **Pages** (manifest+legacy) / **Records** (entities) / _(phase-2, out of scope here)_ Actions ("Create budget…" verb entries).

### B2 · Legacy surfacing rule

Query matches alias path segment OR user types "legacy …" → show alias row, subtitle shows canonical destination, Enter navigates to CANONICAL (not alias) unless Shift+Enter ("open exact legacy URL").

### B3 · Interaction contract (keep + formalize)

Open Ctrl+K / Ctrl+/ (`AppLayout.tsx:104-107`); ↑↓ navigate, Enter go, Shift+Enter exact, Esc close; fuzzy subsequence match weighted label > group > section > path; active route marked "You are here"; permission filter stays mandatory (`AppLayout.tsx:100-103`); empty query view = Recent (top 5) + Pinned (up to 4) + all-pillar quick links.

### B4 · Coverage acceptance test (automatable, closes plan AC)

Contract test asserts, for EVERY static route path extracted from `App.tsx`:
`exists m ∈ manifest (m.path === r) ∨ ∃ alias(m', r) ∨ r ∈ paramPatternRegistry-derived set`
— plus the inverse direction already guaranteed today. This turns "palette covers all routes" from prose into CI. Current delta to reconcile at implementation time: 193 static − 188 manifest (net few stragglers, likely detail/tab pages).

## 7. [SPEC-E] ≤3-click workflow map (10 representative flows)

Depth model: **click = discrete pointer/keyboard selection** (rail section, rail item, gallery card, palette Enter). Honest note: current model is already mechanically ≤2 for all ten — the plan gate was never the problem; the columns below show **clicks** AND **scan burden** (rows user must visually parse), which is what users experience as "hard to reach".

| #   | Workflow                                                    | Target                                 | Today: clicks → scan burden                 | Proposed (cold)                                            | Proposed (warm: pinned/recent) |
| --- | ----------------------------------------------------------- | -------------------------------------- | ------------------------------------------- | ---------------------------------------------------------- | ------------------------------ |
| 1   | Create budget                                               | `/budgets/create` (`navigation.ts:94`) | 2 → Planning panel ~15 rows                 | 2 (unchanged)                                              | **1**                          |
| 2   | Close period                                                | `/periods/close` (`:321`)              | 2 → Accounting panel ~30 rows               | 2                                                          | **1**                          |
| 3   | Open board pack                                             | `/board-pack` (`:72`)                  | 2 → wrong-pillar trap (Home, not Reporting) | 2 (now in Reporting, A3) + palette finds it                | **1**                          |
| 4   | Connector sync / import run                                 | `/data` (`:279`)                       | 2 → Accounting panel ~30 rows               | 2                                                          | **1**                          |
| 5   | Compare scenarios                                           | `/scenarios/compare` (`:134`)          | 2 → Planning panel                          | 2                                                          | **1**                          |
| 6   | Enter FX rate                                               | `/currency/fx-rates` (`:392`)          | 2 → Treasury panel                          | 2                                                          | **1**                          |
| 7   | Run consolidation                                           | `/consolidation` (`:431`)              | 2 → Consolidation panel                     | 2                                                          | **1**                          |
| 8   | Manage users                                                | `/settings/users` (`:636`)             | 2 → Admin panel                             | 2                                                          | **1**                          |
| 9   | GL upload                                                   | `/data/gl-upload` (`:301`)             | 2 → Accounting panel                        | 2                                                          | **1**                          |
| 10  | Design report                                               | `/reports/designer` (`:242`)           | 2 → Reporting panel                         | 2                                                          | **1**                          |
| —   | Open ANY industry module (e.g., NIM `/banking/nim`, `:467`) | sector page                            | 2 → Industries panel **~60 rows**           | **3** (pillar→packs→card) cold; 2 warm via gallery recency | **1–2**                        |

Net: zero workflows regress beyond the 3-click gate even in the worst Industries case; nine daily workflows drop to 1 click warm; the widest panel shrinks from ~60 rows to ~10.

## 8. Contingency register (Archie memo interplay)

| If memo selects…                                | This spec…                                                                                           |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Industries fully removed/flagged                | A1 gallery becomes Settings-gated; depth table row 11 unchanged (deep links persist)                 |
| Industries kept as pillar w/ collapsible groups | A1 two-stage expander variant; worst case 3 clicks, scan relief halved — flagged NOT preferred       |
| Home declared locked set                        | A3 becomes palette-only findability fix (Reporting entry skipped)                                    |
| Alias field rejected                            | B2 falls back to label-suffix-only matching; A4 rule 2 unenforceable by CI (weaker guarantee, noted) |

## 9. UI-03 acceptance checklist (proposed DoD)

1. Contract test §6-B4 green (every static route indexed or registry-explained) — "palette covers all routes" provable.
2. Workflow audit script re-runs Table §7 on the built app; all rows ≤3 clicks.
3. Pinned/Recents ship with role-pruning test + persistence round-trip test.
4. Industries panel row-count regression check (≤12 rows post-A1).
5. Breadcrumbs derive from manifest (snapshot test: no literal breadcrumb strings in source).
6. Zero route deletions; all 49 aliases still resolve (existing contract suite stays green).

## Appendix — measurement methods

Route/param counts: Select-String `<Route path="` / `[^"]*:` over `src/App.tsx`. Manifest counts: regex `\{ path:` (188) & `hidden: true` (49) over `src/types/navigation.ts`. Palette wiring: direct Read `AppLayout.tsx:62-110`. GSE static list: Read `GlobalSearchEngine.ts:30-105`. Sidebar mechanics: Read `Sidebar.tsx:40-160`. Workflow line numbers: Select-String over `navigation.ts` (paths cited inline). All measured 2026-08-23 @ HEAD `fbe0c00b`; concurrent-session drift possible — re-run Appendix commands before implementation.

_End of spec. Only this file was created._
