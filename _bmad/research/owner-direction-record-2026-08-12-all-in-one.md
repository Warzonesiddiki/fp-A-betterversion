# Owner Direction Record — 2026-08-12 (All-in-one FP&A platform + ZohoBooks-grade UX)

> **Recorded by:** System (BMAD v5.0 ULTRA-YOLO) · **Date:** 2026-08-12 · **Status:** RECORDED — supersedes the narrow-wedge-only framing for *scope direction*, does **NOT** change any assumption validation status

## Owner direction (verbatim intent)

1. **Product goal:** an all-in-one FP&A tool — the user should not need any other tool. All-in-one solution for **all industries**.
2. **UI/UX bar:** extremely perfect; comparable to **ZohoBooks** (polished, dense, professional, learnable finance-grade SaaS UI).
3. **Optimization bar:** highly optimized and extremely perfect.
4. **Autonomy grant:** "you are free to do everything as you need to achieve the goal with absolute extreme perfection."

## What this changes

| Item | Before | After (owner direction) |
|---|---|---|
| Scope framing | Controlled close→decision→board-pack wedge (A-03 hypothesis) | Wedge remains the strategic anchor, but the **product ambition** is all-in-one FP&A breadth: users should not need a second tool |
| UI/UX bar | Bloomberg-terminal-inspired dark design system | ZohoBooks-grade polish: density, hierarchy, clarity, professional finance SaaS feel (theme direction itself stays a design-system decision to be worked, not silently flipped) |
| Optimization | Bundle/perf gates exist (main <150KB gzip, total <2MB gzip) | Raise the bar: cold-start, render performance, virtualization, memory, and interaction latency become explicit acceptance criteria |
| Industry coverage | Five-certified-vertical hypothesis (A-09) | All-industry breadth is the target; vertical certification depth remains an evidence question, not a claim |
| Autonomy | A3–A5 per risk | Owner grants maximum autonomy within BMAD discipline: evidence sovereignty, honesty labels, ledger/context updates still mandatory |

## What this does NOT change (honesty locks — non-negotiable)

- **Every assumption stays UNVALIDATED** (A-01…A-14). This direction is *scope intent*, not market evidence (Tier 1 required for validation).
- **A-03** (five-job wedge vs broad parity) remains UNVALIDATED — the owner has chosen breadth as the *goal*; whether breadth wins commercially is still unproven and must be tracked.
- **A-09** (five certified vertical packs vs shallow breadth) remains UNVALIDATED — building all-industry pages is breadth; claiming they are *certified vertical depth* requires evidence.
- **A-12** (browser/PWA required) remains UNVALIDATED with no active channel (desktop-only product, E-017). The all-in-one ambition does not reopen the browser channel without owner direction.
- **Capability Truth Matrix** maturity columns (`Connected` / `Governed` / `Enterprise-ready`) stay `UNVERIFIED` without evidence.
- No fabricated users, testimonials, or usage numbers. Waitlist/usage evidence must be real (Tier 2 BETA-USAGE labels).
- No silent state change: every significant decision from this direction is logged in `_bmad/reasoning-ledger.md` and `_bmad/project-context.md`.

## Evidence consequences

- The **product-led validation loop** (validation-plan v2.2 §Solo-dev) becomes the primary evidence engine for the all-in-one scope: desktop waitlist, real usage, community engagement, unsolicited demand — all labeled Tier 2 and never called validation.
- The **desktop-channel Tier-2 evidence kit** (waitlist / direct Tauri installs / community posts) is the concrete next evidence deliverable — deploy/invite decisions remain owner's (T-06/T-07 re-scoped).
- R-04 pilot slice selection still requires evidence; breadth building does not pre-decide the pilot.

## Downstream artifacts to update (this session)

1. `_bmad/reasoning-ledger.md` — entry #34 (this direction)
2. `_bmad/research/evidence-log.md` — E-019 (direction only)
3. `_bmad/project-context.md` — header, phase status, next actions
4. `_bmad/project-completion-plan.md` — NEW master completion plan (all pending tasks, owner-visible)
5. `agents/` — A1–A5 multi-agent task-assignment roadmap (AGENTS.md references it; dir currently empty)
6. `_bmad/research/desktop-tier2-evidence-kit-2026-08-12.md` — NEW desktop-channel evidence kit (drafts only)
7. `_bmad/research/assumption-registry.md` — note A-03/A-09 scope-direction re-read, statuses unchanged
8. `_bmad/sprint-plan.md` — status row: T-13 workflows landed via platform commit b23e41a; CI still blocked by billing E-005
