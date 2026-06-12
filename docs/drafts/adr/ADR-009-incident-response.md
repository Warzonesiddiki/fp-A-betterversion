# ADR-009: Incident Response (NIST SP 800-61 + 7-Step Lifecycle + RACI)

<!-- DRAFT v0.1 — awaiting review — Hephaestus 2026-06-13 -->

- **Status:** DRAFT v0.1
- **Date:** 2026-06-13
- **Author:** Hephaestus
- **Supersedes:** none
- **Related:** [ADR-006 data retention](./ADR-006-data-retention.md), [ADR-007 encryption-at-rest](./ADR-007-encryption-at-rest.md), [ADR-008 audit logging](./ADR-008-audit-logging.md), [ADR-011 plugin sandbox AST](./ADR-011-plugin-sandbox-ast.md), [ADR-012 data storage scoping](./ADR-012-data-storage-scoping.md), [Atlas ON_CALL_RUNBOOK](../atlas/ON_CALL_RUNBOOK.md)

## Context and Problem Statement

When a security incident occurs (audit chain break per ADR-008, data exposure, brute-force attack, plugin sandbox escape, etc.), the team needs a defined procedure. Currently:

- **No runbook exists** for security incidents (Atlas's `ON_CALL_RUNBOOK.md` is infra-only).
- **No RACI** — Hephaestus is the de facto security lead, but no formal assignment.
- **No severity scale** — SEV-1 to SEV-4 not defined for security context.
- **No comms templates** — customer/regulator/legal notifications are improvised.
- **No post-mortem template** — incidents repeat.
- **No tabletop exercise cadence** — the team has never practiced the procedure.

SOC 2 CC7.1.4, CC7.2, CC7.3, CC7.4, CC7.5 all require a defined IR program. This ADR delivers it.

## Decision Drivers

- **SOC 2 CC7.1.4 + CC7.2 + CC7.3 + CC7.4 + CC7.5** — currently RED, blocks Type 1.
- **NIST SP 800-61 r2** — the de facto standard for IR (Preparation → Detection & Analysis → Containment, Eradication, & Recovery → Post-Incident Activity).
- **GDPR Art. 33** — 72-hour breach notification to supervisory authority.
- **GDPR Art. 34** — 72-hour breach notification to data subjects (if high risk).
- **SOX §802** — 7-year retention of incident records.
- **Customer trust** — Beta cohort (50 customers per Hermes's BETA_PROGRAM.md) will ask for the IR plan as part of vendor onboarding.
- **Tested, not theoretical** — tabletop exercises are non-negotiable per SOC 2.

## Considered Options

### Option A — NIST SP 800-61 4-phase lifecycle (chosen)
- **Pro:** Industry standard. Auditor-familiar.
- **Pro:** Maps cleanly to SOC 2 CC7.x sub-criteria.
- **Con:** Heavy; requires RACI + comms templates + tabletop cadence to be complete.

### Option B — SANS PICERL (6-phase)
- **Pro:** More granular.
- **Con:** Overkill for a 50-customer Beta. Adds complexity without value at this stage.

### Option C — Custom 3-step (Detect → Respond → Recover)
- **Pro:** Simple.
- **Con:** Auditor will flag as insufficient (no preparation, no post-incident, no comms plan).

## Decision Outcome

**Chosen: Option A — NIST SP 800-61 r2 4-phase lifecycle**, instantiated as 7 concrete steps with a RACI, a comms template, a post-mortem template, and a quarterly tabletop cadence.

**The 7-step IR lifecycle:**

1. **Preparation** (ongoing)
   - Maintain this ADR + the runbook
   - Quarterly tabletop exercise (1 per quarter, 90 min, recorded)
   - Annual external pen-test
   - Onboarding: every engineer reads this ADR + the audit log ADR + the encryption ADR

2. **Detection** (real-time)
   - Triggers: Sentry alert, Snyk CVE, audit chain break (ADR-008), customer report, third-party disclosure
   - **SEV classification** (see below)
   - On-call security lead paged within 15 min of detection

3. **Analysis** (T+0 to T+4h)
   - Confirm the event is real (not a false positive)
   - Scope: which users, which data, which stores, which time window
   - Containment strategy (next step)
   - Initial notification to founder (T+1h if SEV-1/SEV-2)

4. **Containment** (T+4h to T+24h)
   - Short-term: stop the bleeding (revoke token, lock account, disable feature, take offline)
   - Long-term: patch + deploy (T+24-72h)
   - Preserve evidence (do NOT destroy audit log per ADR-008; export for forensics)

5. **Eradication** (T+24h to T+72h)
   - Remove the root cause (delete malicious plugin, rotate compromised key, patch CVE)
   - Verify removal with re-scan / re-test

6. **Recovery** (T+72h to T+2w)
   - Restore from clean backup if needed (per ADR-006 cold archive)
   - Restore service
   - Monitor for re-occurrence (heightened Sentry + manual review)

7. **Post-Incident Activity** (T+2w to T+4w)
   - Post-mortem doc (template below)
   - Customer notification (if PII exposed; GDPR Art. 34 72h rule)
   - Regulator notification (if PII exposed; GDPR Art. 33 72h rule)
   - Action items → backlog, with owner + ETA
   - Update this ADR with lessons learned

**SEV scale:**

| SEV | Definition | Examples | Response SLA |
|---|---|---|---|
| **SEV-1** | Active PII exposure; data loss; service down | Audit chain break + PII; mass account takeover; backup wiped | 15 min page; 1h containment; 24h customer comms |
| **SEV-2** | Vulnerability exploitable; small PII exposure | Single account compromise; CVE with public PoC; plugin sandbox escape attempt | 1h page; 4h containment; 72h customer comms |
| **SEV-3** | Vulnerability discovered; no active exploit | New CVE in dep; potential misconfig; suspicious audit pattern | 4h page; 24h triage; no comms unless escalates |
| **SEV-4** | Hygiene; no impact | Outdated dep; lint warning; non-PII leak | Next-business-day review; backlog |

**RACI:**

| Activity | Hephaestus | Apollo | Atlas | Founder | Legal | CSM | Customer |
|---|---|---|---|---|---|---|---|
| Detect & triage | **R** | C | C | I | I | I | — |
| Containment | **R** | A | C | I | C | I | — |
| Eradication | **R** | A | C | I | I | I | — |
| Recovery | C | A | **R** | I | I | I | — |
| Customer comms (SEV-1/2) | C | I | I | A | **R** | C | I (recipient) |
| Regulator notification (GDPR 33/34) | C | I | I | A | **R** | I | I (recipient) |
| Post-mortem doc | **R** | C | C | I | I | I | — |
| Tabletop exercise | **R** | A | A | I | I | I | — |
| Annual pen-test | **R** | A | A | I | C | I | — |

(R = Responsible, A = Accountable, C = Consulted, I = Informed)

**Comms templates (4):**

1. **SEV-1 customer email** (subject: "Important security notice — action required"): 2-paragraph, includes: what happened, what data was affected, what we're doing, what you should do (rotate password, etc.), contact.
2. **SEV-2 customer email** (subject: "Security update — no action required"): 1-paragraph, includes: what happened, what data was NOT affected, what we're doing.
3. **Regulator breach notification** (GDPR Art. 33): per Article 33 template, including: nature of breach, categories + approximate number of data subjects, likely consequences, measures taken.
4. **Internal all-hands note** (within 24h of SEV-1): factual, 1-page, includes: what happened, what's the impact, what's next, who's accountable, what we need from the team.

**Post-mortem template** (`docs/security/post-mortems/<incident-id>-<date>.md`):
- Summary (200 words)
- Timeline (UTC, every 30 min)
- Root cause (5-whys)
- What went well
- What went poorly
- Action items (table: action, owner, ETA, status)

**Tabletop exercise cadence:**
- 1 per quarter (Q1, Q2, Q3, Q4)
- 90 min, recorded, with Hephaestus as facilitator
- Scenario library (4, rotated):
  - "Audit chain break in prod"
  - "Customer reports leaked PII on dark web"
  - "Plugin sandbox escape + RCE attempt"
  - "Cloudflare R2 credential compromise"
- Output: action items → backlog

## Compliance

| Framework | Requirement | This ADR satisfies |
|---|---|---|
| **SOC 2 CC7.1.4** | Responds to security events | ✅ 7-step lifecycle |
| **SOC 2 CC7.2.3** | Evaluates anomalies | ✅ Analysis phase |
| **SOC 2 CC7.3.1** | Defines incident response procedures | ✅ This ADR + runbook |
| **SOC 2 CC7.3.2** | Assigns roles and responsibilities | ✅ RACI |
| **SOC 2 CC7.3.3** | Notifies stakeholders | ✅ 4 comms templates |
| **SOC 2 CC7.4.1-3** | Responds to incidents | ✅ Containment, eradication, comms steps |
| **SOC 2 CC7.5.1-3** | Recovers + post-incident review | ✅ Recovery step + post-mortem template |
| **GDPR Art. 33** | 72h breach notification to authority | ✅ Regulator comms template + 72h SLA |
| **GDPR Art. 34** | 72h breach notification to subjects | ✅ SEV-1/2 customer comms template + 72h SLA |
| **NIST SP 800-61 r2** | Computer security incident handling | ✅ 4-phase, 7-step lifecycle |
| **ISO 27001 A.5.24-26** | Incident management planning, assessment, response | ✅ Lifecycle + RACI + comms |
| **SOX §802** | 7-year retention of incident records | ✅ Per ADR-006 retention (7y cold) |

## Migration Plan

1. **Phase 1 (Q3 2026 sprint 4) — write the runbook**
   - Create `docs/security/INCIDENT_RESPONSE.md` (extract from this ADR's runbook section).
   - Create `docs/security/post-mortems/` folder.
   - Create `docs/security/comms/` folder with 4 templates.
   - **Verify:** runbook exists; links resolve.

2. **Phase 2 (Q3 2026 sprint 4) — wire detection triggers**
   - Sentry alert routing to `Slack #security-incidents` and PagerDuty for Hephaestus.
   - Snyk alert routing to same channel.
   - Audit chain break (ADR-008) auto-creates a SEV-1 incident in the runbook.
   - **Verify:** chaos test (trigger a fake chain break) → Sentry fires + Slack notified.

3. **Phase 3 (Q3 2026 sprint 4) — first tabletop**
   - Schedule Q3 2026 tabletop (90 min, scenario: "audit chain break in prod").
   - Hephaestus facilitates; Apollo + Atlas + Founder attend.
   - Output: action items → backlog.
   - **Verify:** post-mortem doc + action items created.

4. **Phase 4 (Q4 2026) — annual pen-test**
   - Engage external pen-tester (NCC Group, Trail of Bits, or similar).
   - 1-week engagement, scope: web + desktop + Phase 1 backend (if ready).
   - **Verify:** pen-test report clean (or all criticals remediated).

5. **Phase 5 (Q4 2026) — auditor walkthrough**
   - SOC 2 auditor reviews this ADR + runbook + last tabletop's post-mortem + pen-test report.

## Enforcement

- **Static:** Every PR must reference this ADR if it touches `auditLogStore`, `encryptedStorage`, or `authStore` (enforced via CODEOWNERS + PR template).
- **Tabletop:** Quarterly exercise tracked in `docs/security/tabletop-log.md`. Skipped quarter = SOC 2 finding.
- **Pen-test:** Annual; report on file in `docs/security/pen-tests/`.
- **Comms templates:** 4 templates versioned in `docs/security/comms/`. Updated within 7 days of any incident that revealed a template gap.
- **Post-mortem discipline:** Every SEV-1 + SEV-2 produces a post-mortem within 4 weeks. Tracked in `docs/security/post-mortems/`.
- **Review:** Quarterly review of this ADR (Hephaestus) — update with lessons learned.

## Consequences

**Positive:**
- ✅ SOC 2 CC7.x (all 5) satisfied (Type 1 ready Q4 2026).
- ✅ GDPR Art. 33 + 34 satisfied (72h notification SLAs).
- ✅ Customer trust: Beta cohort sees a tested IR plan.
- ✅ 4 tabletop scenarios + post-mortem discipline prevent incident repetition.
- ✅ RACI removes "who owns this?" ambiguity during a crisis.

**Negative:**
- ❌ Quarterly tabletop + annual pen-test = ~$15K/yr + 4×90 min/yr of team time. Acceptable; cheaper than a SEV-1.
- ❌ RACI requires Hephaestus to be on-call for security. Currently true; documented.
- ❌ 4 comms templates need legal review (Q3 2026 sprint 4). Adds 1-2 weeks of Founder + Legal time.

**Neutral:**
- This ADR does not define the financial cost of a breach. Defer to Hermes's GTM (insurance, BAA, DPA).

## Pros and Cons of the Options

| Option | Pros | Cons |
|---|---|---|
| **A — NIST SP 800-61 (chosen)** | Industry standard; auditor-familiar; 4-phase | Heavy; requires templates + cadence to be complete |
| B — SANS PICERL | More granular | Overkill at 50-customer scale |
| C — Custom 3-step | Simple | Auditor insufficient |

## References

- [ADR-006 data retention](./ADR-006-data-retention.md) — incident records retained 7y
- [ADR-007 encryption-at-rest](./ADR-007-encryption-at-rest.md) — preserves evidence during IR
- [ADR-008 audit logging](./ADR-008-audit-logging.md) — chain break is the canonical trigger
- [ADR-011 plugin sandbox AST](./ADR-011-plugin-sandbox-ast.md) — sandbox escape is a SEV-1 scenario
- [ADR-012 data storage scoping](./ADR-012-data-storage-scoping.md) — defines what PII exposure means
- [Atlas ON_CALL_RUNBOOK](../atlas/ON_CALL_RUNBOOK.md) — infra runbook (companion)
- [SOC 2 Type 1 readiness audit](../hephaestus/SOC2_READINESS_2026-06-13.md) — §4 CC7.x + §6 blocker #3
- NIST SP 800-61 r2 — Computer Security Incident Handling Guide
- GDPR Art. 33, 34 — Breach notification
- ISO 27001 A.5.24, A.5.25, A.5.26 — Incident management

---

<!-- DRAFT v0.1 — awaiting review — Hephaestus 2026-06-13 -->
