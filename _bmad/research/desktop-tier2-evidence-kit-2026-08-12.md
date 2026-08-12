# Desktop Tier-2 Evidence Kit — FinPlan Pro (desktop-only product-led validation loop)

> **Created:** 2026-08-12 · **Status:** DRAFTS READY (execution/launch decisions are the owner's — T-06/T-07) · **Method:** BMAD v5.0 ULTRA-YOLO (validation-plan v2.2 §Solo-dev evidence strategy, Tier 2 BETA-USAGE)
> **Supersedes (desktop variant of):** `beta-launch-kit-2026-08-11.md` (browser channel — SUPERSEDED by the desktop-only direction, E-017)
> **Evidence rule:** nothing here is participant evidence. Waitlist counters are real counters. Community posts are DRAFTS. Signals produced are logged **BETA-USAGE (Tier 2)** — they never validate assumptions (Tier 1 only). A-01…A-14 remain UNVALIDATED.

---

## 1. What a desktop Tier-2 loop can and cannot prove

| Claim | Status | Desktop loop can… | Desktop loop CANNOT… |
|---|---|---|---|
| Wedge (close→decision→board-pack) is wanted | UNVALIDATED | show workflow completion/retention on real installs | prove market size |
| WTP ($500k+ / paid path) | UNVALIDATED | surface unsolicited "I'd pay" signals (partial A-01 signal only) | quantify WTP |
| All-in-one breadth is valued | UNVALIDATED (owner direction only, E-019) | surface which modules users actually open | prove breadth beats focus commercially |
| First segment selection (R-04) | PENDING | inform segment scoring | decide it alone |
| Desktop/Tauri deployment is acceptable | UNVALIDATED (A-12 channel closed) | real installs + retention | validate deployment assumptions (Tier 1) |

**Honest labeling rules (non-negotiable):**
- All workspace data is local/draft — never presented as official numbers. Keep "Draft — Local workspace data" truth labels everywhere.
- No fabricated participants, testimonials, or usage numbers. Waitlist counters are real counters.
- Assumptions stay UNVALIDATED until Tier-1 evidence exists.

## 2. Objective thresholds (validation-plan v2.2, T-07)

1. **≥30 qualified signups** (desktop waitlist) — demand signal.
2. **≥10 weekly active beta users** — usage signal.
3. **≥5 completed close→decision→board-pack loops** with their own data — workflow-value signal.
4. **≥3 unsolicited "I'd pay for this" signals** from unrelated users — PARTIAL A-01 signal (never VALIDATED).

**Qualified signup definition (suggested, owner-adjustable):**
- Works in finance/FP&A/accounting OR operates a finance function for a business; AND
- Completes onboarding (company name + role) in the app; AND
- Opts into the beta mailing list.

## 3. Desktop waitlist plan

**Mechanism (owner's call — T-06):**
- Option A — in-app waitlist: the Tauri app's first-run onboarding gains an optional "Join the beta list" step (name, email, role, company stage, free-text pains). Local-only storage; email sent only when owner configures a mail channel. Zero telemetry otherwise.
- Option B — landing page waitlist: a single honest page (no marketing overclaim) with the waitlist form + link to the desktop installer.
- Option C — both, with the in-app one primary (desktop users are already past the install barrier).

**Landing copy (single page, no overclaim):**
1. One-line value: "FinPlan Pro — analyst-grade financial workspace: import actuals, reconcile/close, plan, and publish an evidence-backed board pack."
2. Honest status: "Early beta — desktop app in active development. Local data only; nothing leaves your machine."
3. Waitlist form: name, email, role, company stage, what pains you'd want solved (free text).
4. Link to the public research gate states (no roadmap promises ahead of evidence).
5. Privacy: one line — "No telemetry; waitlist email used only for beta invites."

**Invite & cohort plan:** cohorts of 10–20 per invite; rollback = stop invites, no code change needed (offline app).

## 4. Community post drafts (adapt, do not copy verbatim — desktop-first variant)

### r/FPandA — "Solo dev building an evidence-first FP&A desktop app — early beta"

> I'm a solo dev building FinPlan Pro, a desktop FP&A workspace around a controlled loop: import actuals → reconcile/close with evidence → plan → publish a board pack that drills to the source.
>
> Why: too much of close/reporting time goes into defending the numbers rather than analyzing them. I want the system to carry the evidence (source, mapping, tolerance, certification) so the pack is reproducible.
>
> Current state: desktop-first app (React/Tauri), local data only, early beta. I'm looking for FP&A practitioners to try the close/reconcile flow and tell me what breaks — especially: which reconciliation steps you'd trust only with evidence, and which you'd want automated.
>
> It's early, honest beta — not a finished product. If that sounds useful, the waitlist is [link]. Happy to share the build and the research questions I'm working from.

### Indie Hackers — "Solo dev building a wedge into FP&A: evidence-first close→decision→board-pack (desktop)"

> Story: enterprise FP&A incumbents (OneStream/Anaplan/Pigment) sell connected planning; solo devs get eaten by the breadth. My wedge is the controlled close loop — the credibility gate — delivered as an analyst-grade desktop workspace first.
>
> What I'm testing in beta: does a close→decision→board-pack loop with real evidence reduce the "defend the numbers" overhead? I have no users yet — this is the honest stage. Join the beta to see the build and shape the wedge: [link]
>
> Stack: React 19 + TypeScript + Tauri, offline-first, local data only. Happy to share build notes.

### Hacker News — "Show HN: FinPlan Pro — offline-first FP&A desktop app (close→decision→board-pack)"

> I built an offline-first FP&A desktop app around a controlled loop: import actuals → reconcile/close with evidence → plan → publish an evidence-backed board pack. Local data only, no telemetry.
>
> The pitch: too much finance time goes into defending numbers instead of analyzing them. The app carries evidence (source, mapping, tolerance, certification) so the pack is reproducible.
>
> Early beta, solo dev. Looking for finance practitioners to break the close/reconcile flow. Waitlist: [link]

## 5. What to log (and how to label it)

| Signal | Log as | Example |
|---|---|---|
| Waitlist signups | BETA-USAGE (Tier 2) | "E-020: waitlist 31 qualified signups (real form data)" |
| Active users / loops completed | BETA-USAGE (Tier 2) | "≥5 completed close→decision→board-pack loops" |
| Community reactions | ARTIFACT (Tier 3) | "r/FPandA post → 14 comments, 3 practitioners offered feedback" |
| Unsolicited "I'd pay" | BETA-USAGE partial A-01 signal | "2 independent users asked about pricing" |
| Nothing fabricated, ever | — | counters are real counters |

## 6. Owner decisions required (T-06/T-07)

1. **Waitlist mechanism**: in-app, landing page, or both (this kit recommends both, in-app primary).
2. **Installer distribution**: direct Tauri installers (GitHub Releases / own hosting) — which channel.
3. **Community posts**: which venues, when, and with which handle/link.
4. **Invite capacity & cohort size** (10–20 recommended).
5. **Email channel for invites** (if any) — service selection is a separate decision.

## 7. Relationship to the master plan

- Feeds `R-02`–`R-05` in `_bmad/project-completion-plan.md` (Track R).
- P-track (P-01…P-07) stays BLOCKED until R-04 evidence selects the pilot slice — owner direction does not unblock it.
- Every signal from this kit updates `_bmad/research/evidence-log.md` with honest tier labels; `assumption-registry.md` statuses do not change without Tier-1 evidence.
