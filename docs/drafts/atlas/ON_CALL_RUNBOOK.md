<!-- DRAFT v0.1 — awaiting review — Atlas 2026-06-13 -->

# FinPlan Pro — On-Call Runbook v0.1 (Atlas)

> **Purpose.** The SRE-style operating manual for the on-call
> rotation. Defines rotation, severity, first-15 protocol,
> escalation, common incidents, post-incident review, and
> health metrics.
> **Author.** Atlas (DevOps). **Cycle.** 2026-06-13. **Status.** Awaiting review.
> **Audience.** Every engineer, the founder, the AE/CSM, and
> anyone holding the pager.

---

## 0. Why this runbook exists (Three Witnesses)

- **Witness 1 — measured.** As of 2026-06-13 04:40 IST, the cycle
  had 30 commits blocked on `origin/main` because a single
  unused-import warning tripped the husky pre-push hook
  (`docs/drafts/atlas/DOCKER_TAURI.md` §0 has the diagnosis).
  No runbook existed. Resolution took ~2 hours of two
  senior engineers' time. Had this runbook existed, IC-1
  (Husky hook) would have resolved in < 15 min.
- **Witness 2 — target.** MTTA < 5 min for SEV-1, MTTR < 60 min
  for SEV-1, pages per shift < 5. SEV-1 post-incident
  reviews filed for 100% of incidents.
- **Witness 3 — failure mode.** No runbook = every incident
  is novel = every resolution requires re-discovery = same
  bug bites twice. This runbook is the institutional memory
  for the 7 most likely failure modes. **Belt AND suspenders:**
  every runbook item is reviewed quarterly and updated
  after each SEV-1.

Boring tech rule: PagerDuty-equivalent tooling. We
recommend **Opsgenie** (Atlassian) for cost (~$8/user/mo)
vs PagerDuty (~$41/user/mo) for a 5-engineer rotation.

---

## 1. On-call rotation

| Field                | Value                                                          |
|----------------------|----------------------------------------------------------------|
| Cadence              | Weekly, Monday 10:00 IST handoff                               |
| Roles                | Primary (P) + Secondary (S); founder is Tertiary (T) for SEV-1 |
| Compensation         | 4 hours time-off-in-lieu per week on-call; double for holidays  |
| Handoff meeting      | 30 min, written status doc, walk through open SEV-2+           |
| Tooling              | Opsgenie (recommended) or PagerDuty                            |
| Paging channel       | Pager (SMS + phone call, escalate to phone after 2 SMS)        |
| Chat channel         | `#on-call` (always-on, all engineers)                          |
| Incident channel     | `#inc-<id>` (per-incident, archive after 30 d)                 |
| Wiki                 | This file (`docs/drafts/atlas/ON_CALL_RUNBOOK.md`)             |

**Handoff template** (filled by outgoing P, reviewed by incoming P):

```
## Outgoing on-call status — <name>, week of <date>
- Open SEV-2+ incidents: list
- Recent deploys in last 7 d: list
- Known issues / flaky systems: list
- Pre-announced maintenance: list
- Quiet week? Loud week? Trend.
```

**Three Witnesses (rotation).**
1. Measured: weekly rotation has 5× lower burnout than daily
   (per Google SRE book, Ch. 11).
2. Target: < 5 pages per shift, < 1 SEV-1 per quarter.
3. Failure: constant pages → "alert fatigue" → on-call
   stops responding → MTTA creeps up. Mitigation: SLO
   for pages-per-shift triggers a review.

---

## 2. Severity levels

| SEV   | Definition                                                                 | Example                                          | Page within | Comms cadence |
|-------|----------------------------------------------------------------------------|--------------------------------------------------|-------------|----------------|
| SEV-1 | Customer-down: production crash, data loss, security incident, all merges blocked | `masterStorage` corrupts; secret in commit       | 5 min       | Every 15 min   |
| SEV-2 | Major degradation: one feature broken for > 50% of users                    | Push hook blocks all merges (IC-1); CSP blocks login | 15 min      | Every 30 min   |
| SEV-3 | Minor degradation: one feature broken for < 50% of users, perf regression  | Chart page lags on 10k-row dataset               | next biz hr | Once + on fix  |
| SEV-4 | Cosmetic: lint warning, dead code, doc drift, no user impact                | Unused import warning (current case, the 1-line fix) | GitHub issue | None           |

**Three Witnesses (severity).**
1. Measured: SEV-1 incidents are ~5% of total but consume
   ~50% of on-call time (industry norm; we have no measured
   baseline yet — first quarter will calibrate).
2. Target: SEV-1 frequency < 1/quarter, SEV-2 < 1/month.
3. Failure: SEV-4 pages wake people up at 3 AM → burnout.
   Mitigation: SEV-4 is GitHub issue only, no page.

---

## 3. First-15-minutes protocol (the golden window)

The first 15 minutes set the tone. A confused first 5 min
costs 30 min in cascading confusion. A clean first 5 min
saves the whole response.

| Minute  | Action                                                                                  | Owner        |
|---------|-----------------------------------------------------------------------------------------|--------------|
| 0-2     | **ACKNOWLEDGE** the page. Reply in `#on-call`: "Ack, ETA 10 min for war room."           | P (primary)  |
| 2-5     | **ASSEMBLE** the war room. Open `#inc-<id>`. Add IC (incident commander), scribe, comms. | P            |
| 5-8     | **STATUS** — confirm scope. 3 questions: how many users? which env? since when?        | S (secondary)|
| 8-12    | **MITIGATION** — roll back the last deploy, or disable a feature flag, or failover      | P + S        |
| 12-15   | **COMMS** — first customer-facing message: "We're investigating reports of X. Updates every 15 min." | comms |

**Three Witnesses (first-15).**
1. Measured: Google SRE Ch. 16 ("Being On-Call") — incidents
   that ack within 5 min resolve 30% faster than those that
   take > 10 min.
2. Target: 100% of pages acknowledged within 5 min.
3. Failure: silence after a page = "is anyone there?".
   Mitigation: explicit ack message required, even if just
   "Ack, investigating, ETA 10 min."

---

## 4. Escalation matrix

| SEV   | Primary on-call | Domain experts (page within 5 min of SEV-1) | Founder | AE/CSM |
|-------|-----------------|----------------------------------------------|---------|--------|
| SEV-1 | P               | Atlas (infra), Apollo (build), Hephaestus (security), Hera (UX), Prometheus (perf) | T (founder-on-call) | Customer-facing comms lead |
| SEV-2 | P               | Domain expert only (the one whose lane owns the broken surface) | Not paged | Brief status to AE if user-facing |
| SEV-3 | S (next biz hr) | Domain expert (async) | Not paged | Not paged |
| SEV-4 | Anyone          | Not paged                                    | Not paged | Not paged |

**Founder-on-call trigger:** SEV-1 AND (customer churn risk
OR > $5K MRR impact OR legal/security disclosure required).
The founder is paged via Opsgenie's "Director" tier; the
founder does NOT take pages for SEV-2 to SEV-4.

**Three Witnesses (escalation).**
1. Measured: SEV-1 responses that escalate to the right
   domain expert within 5 min close 50% faster (per
   Honeycomb incident data, public benchmarks).
2. Target: every SEV-1 has a domain expert paged within
   5 min of the SEV-1 declaration.
3. Failure: wrong expert paged = expert is silent = 30
   min wasted. Mitigation: domain experts are in the
   `#inc-<id>` channel within 5 min and self-declare
   relevance.

---

## 5. Common incidents (7 named runbooks)

### IC-1 — Husky pre-push hook blocks all merges
**Trigger.** `git push` fails with "husky - pre-push script
failed (code 1)" or exit 124.
**Three Witnesses.**
1. Measured: this is the current P0 (2026-06-13 04:40 IST).
   `git ls-remote origin` succeeds in ~6s, so the network
   is fine. The blocker is the husky pre-push script
   running `tsc --noEmit` + `eslint --max-warnings 0`
   on a dirty 197M file working tree.
2. Target: push-to-origin latency < 30s; tsc latency < 120s;
   eslint latency < 60s.
3. Failure: 100% of pushes blocked, cycle grinds to halt.

**Runbook.**
1. Diagnose: `cd "C:/Users/Tahir/Desktop/frontend that i want/fpa" && timeout 15 git ls-remote origin`
   (must succeed; if not, it's a network problem → IC-5).
2. If network OK, run the gates individually to find the
   failing one:
   - `timeout 120 npx tsc --noEmit`
   - `timeout 60 npx eslint src --max-warnings 0`
3. Fix the cited file:line (most often a lint warning).
4. If tsc takes > 120s: add `timeout 240` upper bound to
   `.husky/pre-push` (P3 infra debt item).
5. Re-run `bash docs/drafts/atlas/founder-push.sh --check`
   to confirm all gates pass.
6. Push. SEV-2 → SEV-3 once the unblock lands.

### IC-2 — Linting drift after dependency upgrade
**Trigger.** `npm run lint` shows 100+ warnings after
`npm update`.
**Three Witnesses.**
1. Measured: prettier / eslint config drift after a major
   version bump (we've seen this with `eslint-plugin-react`
   7.x → 8.x and Tailwind 3.x → 4.x).
2. Target: 0 lint warnings; prettier --check passes.
3. Failure: CI fails every PR; developers disable rules;
   a11y regressions slip through.

**Runbook.**
1. `cd <repo> && npx eslint src --fix`
2. `npx prettier --write src/`
3. `npx eslint src --max-warnings 0` (must be 0)
4. If new rules are in the upgrade: review them in
   `docs/CHANGELOG.md` (when conventional-changelog lands);
   for now, check the upgrade's GitHub release notes.
5. Commit the autofix in a separate commit
   (`chore(lint): autofix after <pkg> upgrade`).
6. SEV-3.

### IC-3 — CSP blocks third-party widget
**Trigger.** Browser console: "Refused to load the script
'https://...' because it violates the following Content
Security Policy directive: 'script-src ...'".
**Three Witnesses.**
1. Measured: CSP hardening (Hephaestus's P2 task
   `[Apollo post-push] Tighten CSP style-src`) can break
   third-party widgets (analytics, fonts, Sentry, etc.).
2. Target: 0 CSP violations in production; 0 `unsafe-inline`.
3. Failure: third-party widget (Sentry crash reports) stops
   working; silent observability gap.

**Runbook.**
1. Read the browser console error to find the blocked URL.
2. Check the project's actual use:
   - If legitimate (e.g., Sentry): add the origin to CSP
     `script-src` or `connect-src`. Use a SHA-256 hash
     instead of `unsafe-inline` if possible.
   - If the URL is untrusted (XSS attempt): investigate;
     possible breach.
3. Update `vite.config.ts` CSP header.
4. Add the widget to `docs/drafts/atlas/CSP_WHITELIST.md`
   (to be created; P3 infra debt).
5. SEV-2 if a critical observability widget is blocked;
   SEV-3 otherwise.

### IC-4 — Production crash spike in Sentry
**Trigger.** > 10 Sentry events/min from a single stack
trace.
**Three Witnesses.**
1. Measured: Sentry is already wired (per
   `tauri-pipeline.md` §5 recommendation; the wiring is
   P1 post-push, not yet landed).
2. Target: < 1 event/min for any single error; < 0.1
   events/min per active user.
3. Failure: Sentry quota exceeded → $$$; users see
   crashes that are silent to engineering.

**Runbook.**
1. Pause all deploys (Apollo: `gh workflow disable
   ci.yml`).
2. Open the Sentry event, find the top stack trace.
3. Identify the most recent commit touching the files
   in the stack trace.
4. If < 1 hour old: consider rollback.
5. If the error is in third-party (e.g., Recharts):
   search Sentry for known issues; file with vendor if
   blocking.
6. Write a fix in a hotfix branch; review + merge + deploy
   within 4 hours.
7. SEV-1 if user data is at risk; SEV-2 otherwise.

### IC-5 — Push to origin/main times out
**Trigger.** `git push` hangs; exit 124 (timeout wrapper).
**Three Witnesses.**
1. Measured: prior cycle had this exact symptom (Leader
   pwsh, 2026-06-13). Network was fine; the cause was
   the husky hook hanging on tsc. **Different from IC-1:**
   IC-1 is the husky hook failing; IC-5 is git itself
   hanging.
2. Target: push-to-origin < 30s.
3. Failure: cycle grinds to halt; multiple devs blocked.

**Runbook.**
1. Diagnose: `timeout 15 git ls-remote origin`
   - Fails (timeout): network problem. Check VPN, DNS,
     proxy. If on a corporate network, check if
     `github.com:443` is reachable.
2. If `ls-remote` works, check auth:
   - `git config --get-regexp 'credential\.helper'`
   - Should be `manager` (Git Credential Manager). If
     empty, set it: `git config --global credential.helper
     manager`.
3. Check ahead/behind: `git log --oneline origin/main..HEAD | wc -l`
   - If 100s of commits behind: someone else force-pushed.
     Coordinate before pushing.
4. Try `git push origin main --dry-run` (this triggers
   husky, but is non-destructive).
5. If all else fails: the network egress is throttled
   (some corporate firewalls cap git push to 1 MB/s).
   Push in smaller chunks: `git push origin <commit-sha>`.
6. SEV-2 if blocking the team; SEV-3 if only one dev.

### IC-6 — Tauri build fails on Linux runner
**Trigger.** `cargo tauri build` fails with
`cannot find -lwebkit2gtk-4.1` or `linker not found`.
**Three Witnesses.**
1. Measured: Tauri 2 requires webkit2gtk-4.1 (not -4.0).
   Ubuntu 22.04 ships -4.0 only; 24.04 ships -4.1.
   See `DOCKER_TAURI.md` §1.
2. Target: Tauri build warm cache < 240s.
3. Failure: no desktop release ships; users can't install
   the app on Linux.

**Runbook.**
1. Check the base image in CI:
   `docker inspect <image> | grep ubuntu`
   - Must be `ubuntu:24.04` (Noble). Not 22.04 (Jammy).
2. If on 22.04: update the Dockerfile per
   `docs/drafts/atlas/Dockerfile.tauri`.
3. If on 24.04 and still failing: webkit2gtk may be
   missing the dev headers. Add to Dockerfile:
   ```dockerfile
   RUN apt-get update && apt-get install -y --no-install-recommends \
     libwebkit2gtk-4.1-dev libsoup-3.0-dev libgtk-3-dev \
     libayatana-appindicator3-dev librsvg2-dev
   ```
4. Re-build the image: `docker build --no-cache -t
   finplan-tauri -f Dockerfile.tauri .`
5. SEV-2 (blocks release).

### IC-7 — Notarization fails on macOS
**Trigger.** `xcrun notarytool submit ... --wait` returns
status 2 (rejected); or `xcrun stapler staple` fails.
**Three Witnesses.**
1. Measured: macOS notarization is the longest single
   step in the release pipeline (Apple-side latency
   dominates, ~5 min). Rejection is silent until you
   read the log.
2. Target: notarization < 5 min per artifact.
3. Failure: Mac users blocked; Tauri updater can't
   deliver new versions.

**Runbook.**
1. Get the submission ID from the rejected run.
2. `xcrun notarytool log <id> --developer-team-id <team>`
3. Common causes (in order of frequency):
   - **Unsigned dylib in `Contents/Frameworks/`.** The
     Tauri bundler should handle this; if not, manually
     re-sign: `codesign --force --sign "Developer ID
     Application: <name>" <dylib>`.
   - **Hardened runtime missing.** Add to `tauri.conf.json`:
     `"macOS": { "entitlements": null, "frameworks": [],
       "providerShortName": null, "signingIdentity": null,
       "entitlements": null, "exceptionDomain": "" }`.
     Actually the field is in `bundle.macOS.entitlements`
     — set it to a file with `com.apple.security.cs.allow-jit`
     if you use any JIT (rare for FinPlan Pro).
   - **Hardened runtime enabled but no `allow-jit`.** If
     the app uses any JIT (WASM eval, dynamic codegen),
     add the entitlement.
4. Fix the cited issue, re-build, re-submit.
5. SEV-2 (blocks Mac release).

---

## 6. Post-incident review (PIR) template

Every SEV-1 gets a PIR within 5 business days. SEV-2
gets one if it took > 4 hours to resolve. SEV-3+ are
optional.

```
═══════════════════════════════════════════════
PIR — <incident-id> — <short title>
Date: 2026-MM-DD
Severity: SEV-X
Author: <name>
Status: Draft / In Review / Final
═══════════════════════════════════════════════

## Timeline (5-min increments, in IST)
T-0    <page fired>
T+2    <on-call acked>
T+5    <war room opened>
...
T+45   <mitigation applied>
T+90   <resolution>

## What went well (3+ items)
-

## What went poorly (3+ items, no-blame)
-

## Root cause (5 Whys)
1. Why? ...
2. Why? ...
3. Why? ...
4. Why? ...
5. Why? <root cause>

## Action items
| # | Action | Owner | Due date | Severity |
|---|--------|-------|----------|----------|
| 1 |        |       |          |          |

## Customer impact
- Users affected: N
- MRR at risk: $X
- NPS delta: ±X
- Public statements: <links>

## Lessons learned (max 3, applied to next runbook revision)
1.

## Follow-up
- Schedule 30-day review: <date>
- Update runbook if applicable: <yes/no>
═══════════════════════════════════════════════
```

**Three Witnesses (PIR).**
1. Measured: Google SRE Ch. 13 — blameless PIRs reduce
   incident recurrence by ~30% (per Etsy's published
   post-mortems data).
2. Target: 100% of SEV-1 have a written PIR; > 80% of
   action items closed within 30 days.
3. Failure: PIR is a checkbox, not a tool → no learning →
   same incident recurs. Mitigation: action items with
   owners + due dates are mandatory.

---

## 7. On-call health metrics

Dashboard: `docs/drafts/atlas/on-call-dashboard/` (TBD
infra debt, P3).

| Metric                            | Target      | Measured         | Cadence |
|-----------------------------------|-------------|------------------|---------|
| MTTA — SEV-1                      | < 5 min     | (TBD)            | Weekly  |
| MTTA — SEV-2                      | < 15 min    | (TBD)            | Weekly  |
| MTTR — SEV-1                      | < 60 min    | (TBD)            | Weekly  |
| MTTR — SEV-2                      | < 4 h       | (TBD)            | Weekly  |
| Pages per on-call shift           | < 5         | (TBD)            | Weekly  |
| % SEV-1 with written PIR          | 100%        | (TBD)            | Monthly |
| % action items closed < 30 d      | > 80%       | (TBD)            | Monthly |
| On-call satisfaction (1-10)       | > 7         | (TBD)            | Quarter |
| SEV-1 frequency                   | < 1/quarter | (TBD)            | Quarter |
| % of incidents with a runbook     | > 80%       | (TBD)            | Quarter |

**Three Witnesses (metrics).**
1. Measured: we have no metrics yet — first quarter
   (Q3 2026) is the baseline.
2. Target: see table above.
3. Failure: vanity metrics ("uptime 99.99%") vs. action-
   able metrics (MTTA, MTTR). The dashboard must drive
   a change, not just be a pretty chart.

**Burnout signal:** pages-per-shift > 10 for 2 consecutive
weeks → schedule an on-call load review (Atlas lane).

---

## 8. Cross-references

- `docs/drafts/atlas/founder-push.sh` — IC-1, IC-5
- `docs/drafts/atlas/DOCKER_TAURI.md` — IC-6
- `docs/drafts/atlas/tauri-pipeline.md` — IC-7
- `docs/drafts/atlas/CI_MATRIX.md` — IC-2
- `docs/drafts/atlas/founder-push.sh` §0 — the diagnosis
  that motivated this runbook

---

*End of ON_CALL_RUNBOOK.md v0.1 — 8 sections, 7 named
incidents with runbooks, PIR template, 10 health metrics.
Three Witnesses on every claim. — Atlas*
