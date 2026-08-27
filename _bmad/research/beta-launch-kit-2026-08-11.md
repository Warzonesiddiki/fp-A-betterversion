# Beta Launch Kit — FinPlan Pro (public-beta validation loop)

> **Created:** 2026-08-11 · **Status:** READY (drafts/plans only — deploy decision is the owner's, T-06) · **Method:** BMAD v5.0 ULTRA-YOLO (solo-dev evidence strategy, validation-plan v2.2 Tier 2 BETA-USAGE)
>
> **⚠️ SUPERSEDED 2026-08-12 (owner decision — desktop-only product):** the browser beta channel (`VITE_BETA_WEB`) was removed from the codebase ("we are building an app not a web app or website" → "Beta channel: Desktop-only — remove it"). This kit is retained as a historical record of the planned hosted-web beta loop; do **NOT** execute it as written. Desktop-channel alternatives for Tier-2 BETA-USAGE evidence (waitlist, community posts, direct Tauri installs) are an owner decision. Ledger #28; evidence E-017.
> **Companion artifacts:** `_bmad/research/validation-plan.md` (§Solo-dev evidence strategy), `_bmad/research/owner-direction-record-2026-08-11-solo-dev.md`, `_bmad/stories/story-f05-browser-beta-enablement.md`.
> **Evidence rule:** nothing in this kit is participant evidence. Community posts are DRAFTS. Any signals they produce are logged as **BETA-USAGE (Tier 2)** — they never validate assumptions (Tier 1 only).

---

## 1. Why a beta (and what it can and cannot prove)

| Claim                                        | Status      | Beta can…                                                   | Beta CANNOT…                          |
| -------------------------------------------- | ----------- | ----------------------------------------------------------- | ------------------------------------- |
| Browser/PWA is a supported capability (A-12) | UNVALIDATED | collect usage signals                                       | validate the assumption (Tier 1 only) |
| $500k+ willingness to pay (A-01)             | UNVALIDATED | surface unsolicited "I'd pay" signals (partial signal only) | quantify WTP                          |
| Wedge (close→decision→board-pack) is wanted  | UNVALIDATED | show workflow completion/retention                          | prove market size                     |
| First segment selection (R-04)               | PENDING     | inform segment scoring                                      | decide it alone                       |

**Honest labeling rules (non-negotiable):**

- Beta web mode is explicitly NOT a supported runtime claim (the app shows the `data-beta-web` marker + console note).
- All workspace data is local/draft/cache — never presented as official numbers. Keep the "Draft — Local workspace data" truth label everywhere.
- No fabricated participants, testimonials, or usage numbers. Waitlist counters are real counters.
- Assumptions stay UNVALIDATED in `assumption-registry.md` until Tier-1 evidence exists.

## 2. Landing / waitlist plan

**Objective:** ≥30 qualified signups, then ≥10 weekly active users, then ≥5 completed close→decision→board-pack loops, then ≥3 unsolicited "I'd pay for this" signals (T-07 thresholds).

**Qualified signup definition (suggested, owner-adjustable):**

- Works in finance/FP&A/accounting OR operates a finance function for a business; AND
- Completes onboarding (company name + role) in the beta; AND
- Opts into the beta mailing list.

**Landing page contents (single page, no marketing overclaim):**

1. One-line value: "FinPlan Pro — analyst-grade financial workspace: import actuals, reconcile/close, plan, and publish an evidence-backed board pack."
2. Honest status: "Early beta — desktop app in active development; this browser build is a beta channel to shape the product. Local data only; nothing leaves your browser."
3. Waitlist form: name, email, role, company stage, what pains you'd want solved (free text).
4. Link to the public roadmap/status (research gate states) — no roadmap promises ahead of evidence.
5. Privacy: one line — "No telemetry; waitlist email used only for beta invites."

**Deploy checklist (owner's call, T-06):** hosting (static Vite build + `VITE_BETA_WEB=true`), domain, privacy note, invite capacity (cohorts of 10–20), rollback (remove flag/env → default block returns).

## 3. Community post drafts (adapt, do not copy verbatim)

### r/FPandA (r/FPandA) — "Building an open, evidence-first FP&A workspace — beta"

> I'm a solo dev building FinPlan Pro, an FP&A workspace around a controlled loop: import actuals → reconcile/close with evidence → plan → publish a board pack that drills to the source.
>
> Why: too much of close/reporting time goes into defending the numbers rather than analyzing them. I want the system to carry the evidence (source, mapping, tolerance, certification) so the pack is reproducible.
>
> Current state: desktop-first app (React/Tauri), browser beta channel just enabled. Local data only. I'm looking for FP&A practitioners to try the close/reconcile flow and tell me what breaks — especially: which reconciliation steps you'd trust only with evidence, and which you'd want automated.
>
> It's early, honest beta — not a finished product. If that sounds useful, the waitlist is [link]. Happy to share the build and the research questions I'm working from.

### Indie Hackers — "Solo dev building a wedge into FP&A: evidence-first close→decision→board-pack"

> Story: enterprise FP&A incumbents (OneStream/Anaplan/Pigment) sell connected planning; solo devs get eaten by the breadth. My wedge is the controlled close loop — the credibility gate — delivered as an analyst-grade workspace first.
>
> What I'm testing in beta: does a close→decision→board-pack loop with real evidence reduce the "defend the numbers" overhead? I have no users yet — this is the honest stage. Join the beta to see the build and shape the wedge: [link]
>
> I'm documenting the build publicly as research-first (assumptions tracked, nothing claimed before evidence). Ask me anything about the stack (React 19, Tauri, SQLite, typed command plane).

### Hacker News — "Show HN: FinPlan Pro — evidence-backed FP&A workspace (browser beta)"

> FinPlan Pro is a financial planning & analysis workspace built around one loop: import actuals → reconcile/close with evidence → plan → publish a board pack that drills to the source. Desktop-first (Tauri), browser beta just enabled, data stays local.
>
> What's different: every official number is expected to carry evidence (source hash, mapping version, tolerance, certification, audit trail) instead of living in a spreadsheet someone defends in a meeting.
>
> Honest status: early beta, solo-built, no claims of enterprise readiness. The browser build is explicitly beta (flag-gated). Local data only, no telemetry.
>
> Try it: [link] — feedback welcome on the close/reconcile flow and the evidence model. Tech: React 19, TypeScript, Zustand, SQLite, Tauri; control-plane server in Express + SQLite with typed commands.

## 4. Beta onboarding flow (in-app)

1. Browser beta gate (`VITE_BETA_WEB=true`) renders app; `data-beta-web` marker set (already implemented, F-05).
2. First-run wizard (already exists): company, sector, fiscal year, base currency; skip import allowed.
3. Beta-only banner (TBD in app, small): "Early beta — data stays on this device. Not a supported product claim."
4. Import sample data → complete the close→decision→board-pack loop (uses existing Dashboard/import/plan/report surfaces; P-track wiring comes after R-04 — the beta first collects usage of existing surfaces).
5. In-app feedback link (mailto or form) — no telemetry by default.

## 5. Metrics & evidence capture (Tier 2 BETA-USAGE)

Recorded in `_bmad/research/evidence-log.md` with label **BETA-USAGE**, never as validation:

- Waitlist signups (count, role mix — no PII in repo).
- Weekly active users (app-boot events, opt-in only, aggregated).
- Workflow completions: import → reconcile/close → board-pack (feature-level events, opt-in).
- Retention: week-2 return rate.
- Unsolicited WTP signals: verbatim quotes, anonymized, in evidence-log (partial A-01 signal only).
- Support/feedback themes → feed R-03 synthesis (framework ready) → assumption dispositions + decision memo.

## 6. What this kit does NOT include (deliberately)

- No claim that the beta is a product launch or that browser/PWA is supported (A-12).
- No fabricated testimonials; post drafts are placeholders for real, anonymized quotes.
- No roadmap commitments ahead of evidence; no segment/vertical certification.
- Deploy, domain, and invite handling remain owner decisions (T-06).
