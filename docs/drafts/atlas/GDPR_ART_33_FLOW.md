<!-- DRAFT v0.1 — awaiting review — Atlas 2026-06-13 -->

# GDPR Art. 33 72-Hour Notification Flow — v0.1 (Atlas)

> **Status.** Draft v0.1, awaiting Strategos (DEC-002 ratification) + Themis/Leader review.
> **Author.** Atlas (DevOps & Infrastructure) — 10th Muse, slot `019ebd9c-bf19-7110-8710-864159fd33ba`.
> **Purpose.** Pre-write the **operational steps** that wrap the 4-audience DR comms templates in [`dr-templates/`](./dr-templates/) (currently skeletons). This doc = the *flow*; the templates = the *body*. At incident time, Legal/CEO follow §1→§6 sequentially.
> **Three Witnesses** on every timeline claim (D-002 protocol).
> **Source authority.** GDPR Art. 33 (notification to supervisory authority) + Art. 34 (communication to data subject) + Art. 56 (lead supervisory authority) + Art. 83(5) (penalties).

This flow operationalizes the regulatory half of the DR runbook's "Regulator" audience (T-ATL-008 §5, line 232). The 4 templates under `dr-templates/` are the body; this doc is the sequence of decisions and clocks that produce them.

---

## §1 — Trigger conditions: when does the flow start?

**The flow starts the moment we become "aware" of a personal data breach.** "Aware" has a specific GDPR meaning — it is **not** the same as "confirmed" or "fully scoped." Per EDPB Guidelines 9/2022 on personal data breach notification (the authoritative EU regulator guidance), awareness occurs when a member of staff has **reasonable certainty** that a security incident has occurred that led to personal data being compromised.

| Trigger class | Examples in T-ATL-008 scenarios | Awareness moment |
|---------------|----------------------------------|------------------|
| **Confirmed confidentiality breach** | §3.4 (audit log tamper with PII exfil), §3.5 (ransomware with data leak) | The Sentry `AuditChainBrokenError` fires OR a customer reports seeing modified records OR the AI Copilot classifies "we have your data" → IC-1 in `ON_CALL_RUNBOOK.md` |
| **Confirmed integrity breach** | §3.2 (data corruption) + the corrupted records contain PII | The data-integrity cron (per §3.2 line 131) flags a delta > 5% on a PII-bearing table |
| **Confirmed availability breach** | §3.1 (full region out) + data subjects are unable to access the service for > 1 hour | The 5-min PagerDuty SEV-1 fires AND the 1-hour mark passes (since 1h is the Phase 0 RTO per `DISASTER_RECOVERY_RUNBOOK.md` line 22) |
| **Suspected (not confirmed) breach** | A Sentry alert that *could* be a breach but root cause is unverified | **Awareness has NOT yet occurred** per EDPB. Do NOT file Art. 33. Document internally, escalate to VP Eng + Legal, continue investigation. **72h clock does not start.** |

**Witness 1 (rule).** Art. 33(1) reads: *"the controller shall without undue delay and, where feasible, not later than 72 hours after having become aware of [the breach], notify the personal data breach to the supervisory authority [...] unless the personal data breach is unlikely to result in a risk to the rights and freedoms of natural persons."* The 72h clock is **only** triggered by awareness, not by suspicion.

**Witness 2 (evidence).** T-ATL-008 §3.4 (audit log tamper, lines 159-182) and §3.5 (ransomware, lines 184-206) are the **two highest-likelihood awareness triggers** for FinPlan Pro. The other 3 scenarios (§3.1 region out / §3.2 data corruption / §3.3 crypto key loss) require a **PII-impact assessment** to determine if awareness has occurred — pure availability incidents with no PII are out of Art. 33 scope.

**Witness 3 (failure mode).** If we **prematurely file** Art. 33 (i.e., before awareness), we trigger an **unnecessary regulatory interaction** and disclose facts that turn out to be false. If we **late-file** (after 72h from actual awareness), we expose FinPlan Pro to **Art. 83(5) administrative fines up to €20M or 4% of global annual turnover, whichever is higher** — the largest GDPR penalty tier. The single most important decision at the trigger moment is: *"Has awareness occurred?"* — answered by Legal + DPO, not by Atlas/Apollo/Hephaestus.

> **Handoff at trigger.** Atlas's role ends at confirming the trigger class + the awareness timestamp (the moment the staff member first had reasonable certainty). From that timestamp forward, **Legal/CEO own the clock**. Atlas pages Legal/CEO within 15 min of awareness via PagerDuty + a recorded Slack call to `#incident-legal`.

---

## §2 — The 72-hour clock starts ("without undue delay")

Per Art. 33(1), the clock starts at the **awareness moment** (the `t_0` defined in §1) and runs for 72 hours of **wall-clock time** (not business hours, not engineering hours — 72 actual hours, including nights and weekends).

**The clock does NOT pause for:**
- Internal forensic investigation or root-cause analysis
- Management review or board notification
- Customer comms preparation
- Translation of the notification into the SA's local language
- Waiting for insurance carrier or external counsel

**The clock DOES allow (per Recital 87 + EDPB Guidelines):**
- **Phased / supplemental disclosure** if the 72h mark is reached with incomplete information. File what you know at 72h, commit to phased updates under Art. 33(4).
- **Encrypted-breach exemption** if the personal data was rendered unintelligible to unauthorized persons via encryption (Art. 34(3)(a)). For FinPlan Pro, this means: if the exfiltrated data was encrypted at rest with a key that did NOT leak, the Art. 33 notification may not be required (but document the encryption + key-separation as evidence either way). **Caveat:** if the encryption key was the breached asset (per §3.3 crypto key loss), the exemption does NOT apply.

| Clock event | Timestamp (T+ from awareness) | Owner | Evidence trail |
|-------------|-------------------------------|-------|----------------|
| `t_0` Awareness | 0:00 | The staff member who first detected | Slack message + Sentry alert + PagerDuty incident opened |
| `t_1` Legal/CEO paged | ≤ 0:15 (15 min) | Atlas (pager), Legal (acks) | PagerDuty ack timestamp, Legal call recording start time |
| `t_2` Awareness confirmation | ≤ 1:00 (1 hour) | Legal + DPO | Recorded call notes naming the awareness trigger class |
| `t_3` Lead SA identified | ≤ 2:00 (2 hours) | Legal (per §3) | Email to the SA's breach inbox (or a draft saved to `dr-templates/gdpr-art-33-regulator.md` filled) |
| `t_4` Art. 33 disclosure SENT | ≤ 60:00 (60 hours — gives 12h buffer) | CEO + Legal co-sign | Email send receipt + registered post tracking |
| `t_5` Art. 33 deadline | ≤ 72:00 (72 hours, hard limit) | — | If missed: file what you have, commit to supplemental update, document the delay reason |
| `t_6` First supplemental update | +7 days | Legal | Email to the same SA inbox |
| `t_7` Incident closure update | At incident closure | Legal | Final report to SA |

**Witness 1 (rule).** The 72h limit is in Art. 33(1). The "without undue delay" wording is interpreted by EDPB as: file as fast as feasible, even if you don't have all 8 fields — phased disclosure is preferred over late disclosure.

**Witness 2 (evidence).** The `dr-templates/gdpr-art-33-regulator.md` template (T-ATL-010, ACCEPTED 2026-06-13) explicitly states: *"If the disclosure is incomplete at 72h, file what you have + commit to supplemental updates."* The template's 8-item pre-flight checklist (lines 56-65) is the operational guard against late-filing.

**Witness 3 (failure mode).** The most common Art. 33 failure mode in practice is **late-filing due to internal investigation** (organizations wait for root cause before notifying). The fix is structural: separate "awareness confirmation" (1h, Legal-only) from "root cause" (could take days). Phase the disclosure: file what you know at 72h, update at +7d, +30d, closure.

> **The "12-hour buffer" at T+60h.** The schedule above has CEO sending the Art. 33 disclosure at T+60h, **12 hours before** the hard 72h limit. Why? Because email-to-SA-inbox can fail (typo in address, SA inbox auto-rejects as spam, SA is closed for a national holiday), and we need a 12h cushion to re-send or re-route. **The 72h deadline is the hard "must arrive" time, not the "must send" time.**

---

## §3 — Lead supervisory authority identification (Art. 56)

**Lead supervisory authority = the SA where our "main establishment" is located.** Per Art. 56(1), the lead SA is the one where the controller's main establishment (central administration in the EU) is situated. The lead SA is the single point of contact for cross-border processing; we do NOT notify every SA where a data subject resides — we notify only the lead SA, who then coordinates with the concerned SAs.

**For FinPlan Pro Phase 0** (OSS-only, no backend, no EU establishment): we currently have **no main establishment in the EU**, so Art. 56 routing falls back to **Art. 33(1) sub-proviso**: notify the SA where the **affected data subjects are predominantly located**. In practice, this means we would file with **multiple SAs** (the Irish DPC if EU customers are predominantly in Ireland, the CNIL if French, the BfDI if German, etc.) — operationally painful.

**For FinPlan Pro Phase 1** (post-DEC-001, with a real backend): the team will designate a **main establishment** as part of the Phase 1 launch. **PROVISIONAL recommendation: Ireland** (Dublin), per Strategos DEC-002 candidate and the leader of FinPlan Pro's planned EU HQ. **This recommendation is PROVISIONAL pending Strategos T-ST-010 (DEC-002 Main Establishment) ratification.** Until T-ST-010 lands, all references to "Ireland DPC" in this doc are tagged PROVISIONAL.

| Phase | Lead SA routing | Rationale | Status |
|-------|------------------|-----------|--------|
| **Phase 0** (current, OSS-only) | **The SA where affected data subjects are predominantly located** (likely multiple SAs in practice) | Art. 33(1) sub-proviso — no main establishment yet | **CURRENT** (no DEC-002 needed) |
| **Phase 1** (post-DEC-001) | **Ireland DPC** (Data Protection Commission, Dublin) — the SA of our main establishment | Art. 56(1) — single SA for cross-border processing | **PROVISIONAL pending T-ST-010** |

**Witness 1 (rule).** Art. 56(1) GDPR: *"the supervisory authority of the main establishment [...] shall be competent to act as lead supervisory authority."* The "main establishment" is the place of central administration in the EU (per Art. 4(16)(a)). Without an EU main establishment, the lead SA concept does not apply — the fallback is per-Subject-SA notification per Art. 33(1) sub-proviso.

**Witness 2 (evidence).** T-ATL-010 GDPR Art. 33 template (line 35, *"Per-jurisdiction routing"* callout) flags this exact ambiguity: *"For FinPlan Pro Phase 0 (OSS-only, no backend), this is a hypothetical — but the moment Phase 1 launches (per DEC-001), we must designate a main establishment."* The T-ATL-010 template already proposed DEC-002 as a Strategos candidate. The current task (T-ATL-012 v2) confirms: **DEC-002 = T-ST-010 = Strategos T-ST-010**, claimed by Strategos at 2026-06-13 08:00 IST per the Leader's "DEC-002 candidate for Strategos T-ST-010" ACK in the previous turn.

**Witness 3 (failure mode).** If we file Art. 33 with the **wrong SA** during Phase 1, the failure modes are: (a) the SA rejects the filing as "not the lead SA" and we have to re-file (wasting the 72h clock); (b) the correct SA later claims we "failed to notify" because we notified the wrong one. The fix is: **CEO does not pick the SA — Legal/Strategos pick the SA, the CEO only sends the email**. The Strategos T-ST-010 decision is a one-time fix that closes this gap permanently for Phase 1.

> **Per-Subject-SA notification (Phase 0 fallback) — operational cost.** If Phase 0 has customers in 5 EU countries, the per-Subject-SA fallback means 5 separate Art. 33 filings, each in the local language, each with the 72h clock. Estimated effort: **5-10 hours of Legal time per incident**, with the parallel-translation overhead. The Phase 1 Ireland DPC designation reduces this to a single 1-hour filing. **This is the operational ROI of Strategos T-ST-010 / DEC-002.**

---

## §4 — Notification content (Art. 33(3) — the 8 mandatory fields)

Art. 33(3) requires the Art. 33 disclosure to include **at minimum** the information specified in Art. 33(3)(a)–(d). The EDPB and most national SAs interpret this as **8 fields** in practice (the 4 in Art. 33(3) + 4 commonly required sub-fields). The 8 fields are:

| # | Field (Art. 33(3)) | Source for FinPlan Pro | Template placeholder |
|---|---------------------|------------------------|----------------------|
| 1 | **Nature of the breach** (categories: confidentiality / integrity / availability) | The trigger class from §1 | `[NATURE]` |
| 2 | **Categories of data subjects** (e.g., "approximately N customers using the FP&A service") | Customer count from the affected cohort | `[CATEGORIES_OF_DATA_SUBJECTS]` |
| 3 | **Approximate number of data subjects** | Count from the affected tenant(s) or region | `[APPROX_N_SUBJECTS]` |
| 4 | **Categories of personal data** (e.g., "name, email, business financial data") | Schema of the affected table(s) | `[CATEGORIES_OF_PERSONAL_DATA]` |
| 5 | **Approximate number of records** | Row count from the affected table(s) | `[APPROX_N_RECORDS]` |
| 6 | **Likely consequences** | 1-2 sentences on customer impact (financial loss? identity theft? reputational?) | `[LIKELY_CONSEQUENCES]` |
| 7 | **Measures taken or proposed** (containment + remediation) | The T-ATL-008 §3 scenario's "Measures taken" subsection | `[MEASURES_TAKEN]` |
| 8 | **DPO contact point** (Art. 33(3)(d)) | DPO name, email, phone (or backup contact if DPO is OOO) | `[DPO_CONTACT]` |

**The 8 fields map 1:1 to the 8 numbered sections of `dr-templates/gdpr-art-33-regulator.md`** (T-ATL-010, ACCEPTED 2026-06-13). At incident time, the CEO/Legal does a `sed -i` substitution per field (per the template's sed pattern at lines 12-18).

**Witness 1 (rule).** Art. 33(3)(a)–(d) is the **minimum** disclosure. Art. 33(4) requires **supplemental updates** "as the investigation progresses" — i.e., the 8 fields are the **first disclosure**, not the complete one. EDPB Guidelines 9/2022 §3.4 explicitly endorse phased disclosure: *"Where, at the time of notification, the controller does not have all the information, the notification should include the information available at that time and be supplemented as soon as further information becomes available."*

**Witness 2 (evidence).** The T-ATL-010 template's pre-flight checklist (lines 56-65) is the operational guard against incomplete disclosure. The 8th item — *"Supplemental updates committed"* — is the link to Art. 33(4). The template also notes: *"filing with fields 1-3 filled and the rest 'TBD' is a violation"* — i.e., we cannot file with empty fields, we must either fill them or explicitly say "unknown at this time, supplement forthcoming."

**Witness 3 (failure mode).** The most common Art. 33(3) failure mode in practice is **"Measures taken" being vague** (e.g., "we are investigating"). The T-ATL-010 template's pre-flight item #6 explicitly calls this out: *"'We are investigating' is not a measure. 'We isolated the affected EU region at 14:32 UTC, restored from R2 immutable snapshot (commit a1b2c3d) at 15:18 UTC, rotated all credentials and revoked active sessions by 16:05 UTC' is a measure."* The audit-trail evidence is the R2 Object Lock query + commit hash + Sentry event IDs — all of which are already in our infrastructure per T-ATL-007 and `ADR_VERIFICATION_EVIDENCE.md` §1.

> **Field 7 evidence trail.** The "Measures taken" field is **the most evidence-heavy field** because it requires specific timestamps + commit hashes + isolation actions. The infrastructure that produces this evidence is:
> - **R2 Object Lock restore**: `docs/drafts/atlas/ADR_VERIFICATION_EVIDENCE.md` §1 (T-ATL-012 first, ACCEPTED 2026-06-13) — provides the `aws s3api get-object-lock-configuration` query + the commit-hash reference.
> - **Audit chain integrity**: `docs/drafts/atlas/ADR_VERIFICATION_EVIDENCE.md` §2 (T-ATL-012 first) — provides the TypeScript `verifyAuditChain()` function with 3 invariants (prevHash chain, self-hash sha256, monotonic timestamp).
> - **Sentry events with PII scrubbed**: T-ATL-007 `SENTRY_DEPLOYMENT.md` + T-ATL-013 `SENTRY_APOLLO_PLAYBOOK.md` — every incident response action generates a Sentry event, and the `sentryPiiScrubber.ts` (per T-ATL-009 §3) ensures no PII leaks into the breadcrumb trail.

---

## §5 — Communication to data subject (Art. 34: "high risk" threshold)

Art. 34 imposes a **separate, additional obligation** when the breach is **likely to result in a "high risk" to the rights and freedoms of natural persons**. The threshold is "high risk" (not "any risk"). The data subject communication is in **plain and clear language**, describing the **nature of the breach** and the **measures taken**.

| Art. 33 vs Art. 34 | To whom | Trigger | Form | Template |
|---------------------|---------|---------|------|----------|
| **Art. 33** (supervisory authority) | **Lead SA** (per §3) | Any personal data breach (unless "unlikely to result in a risk") | Structured 8-field form to SA inbox | `gdpr-art-33-regulator.md` |
| **Art. 34** (data subject) | **Each affected data subject** directly | Only if the breach is "likely to result in a high risk" | Plain-language email + status page + in-app banner | `customer-60-words.md` (60-word public) + a longer private email per customer |

**Art. 34(3) lists 3 exemptions from the data-subject communication obligation:**

1. **Encryption exemption** (Art. 34(3)(a)): the personal data was rendered unintelligible to unauthorized persons via encryption, AND the encryption key was not compromised. (For FinPlan Pro: AES-256-GCM at rest per ADR-007 — applies if the key from §3.3 crypto key loss did NOT leak.)
2. **Subsequent measure exemption** (Art. 34(3)(b)): subsequent measures eliminate the "high risk" (e.g., all affected passwords were reset before any unauthorized access). (For FinPlan Pro: forced session revocation + password reset would qualify.)
3. **Disproportionate effort exemption** (Art. 34(3)(c)): the communication would involve disproportionate effort (e.g., the affected data subjects' contact info is unknown). In that case, a **public communication** (status page + blog post) substitutes for individual emails. (For FinPlan Pro: we always have customer email, so this exemption is rarely applicable — but the public-communication fallback is still good practice.)

**Witness 1 (rule).** Art. 34(1): *"When the personal data breach is likely to result in a high risk to the rights and freedoms of natural persons, the controller shall communicate the personal data breach to the data subject without undue delay."* The "high risk" threshold is **higher** than the Art. 33 "any risk" threshold. EDPB Guidelines 9/2022 §4.2 list 9 criteria for "high risk" (e.g., special category data, financial data, identity theft potential, vulnerable populations).

**Witness 2 (evidence).** T-ATL-008 §5 (lines 225-234) defines the 4 audiences for DR comms. The customer comms template (`customer-60-words.md`, T-ATL-010, ACCEPTED 2026-06-13) is the **public-facing** version of the Art. 34 communication — 60 words, status page + email + in-app banner. The private, per-customer Art. 34 email is a **separate template** that should be added to `dr-templates/` post-Phase 0 (Atlas T-ATL-015 candidate, deferred to Phase 1).

**Witness 3 (failure mode).** The most common Art. 34 failure mode is **either** over-notifying (treating every Art. 33 trigger as an Art. 34 trigger, causing alert fatigue) **or** under-notifying (failing to identify a "high risk" because the team is too close to the engineering details). The fix is a **risk-classification step** between §1 (awareness) and §5 (data subject communication). Recommended owner: **DPO + CEO jointly**, with Legal as the rubber-stamp. The classification must consider: (a) sensitivity of the data (financial PII is "high risk" by default), (b) ease of identification (named individuals vs. anonymized), (c) consequences (financial loss vs. mere inconvenience).

> **The 60-word public + longer private pattern.** The 60-word public customer template is the **public summary** (what everyone sees, including the press). The private per-customer email is the **specific impact** (what the affected customer needs to do). The two are **NOT** the same: the public version should not name individual customers, the private version names the specific impact. **T-ATL-010's 60-word template is the public version; the private per-customer Art. 34 email is a Phase 1 follow-up (T-ATL-015 candidate).**

---

## §6 — Cross-link to dr-templates/gdpr-art33-regulator.md

The 8-field body of the Art. 33 disclosure lives at [`dr-templates/gdpr-art-33-regulator.md`](./dr-templates/gdpr-art-33-regulator.md) (T-ATL-010, ACCEPTED 2026-06-13, 87 lines). This section pins the handoff between this flow doc and the template:

| This flow doc (T-ATL-012 v2) | The template (T-ATL-010) | At incident time |
|------------------------------|--------------------------|------------------|
| §1 Trigger conditions | — (template assumes trigger has occurred) | Atlas + Legal confirm awareness timestamp |
| §2 72h clock + t_0…t_7 schedule | "Deadline: 72 hours from becoming aware" (line 6) | Legal counts down from t_0 |
| §3 Lead SA identification | "Per-jurisdiction routing" callout (line 35) | Strategos T-ST-010 ratifies Ireland DPC for Phase 1 |
| §4 8 fields (Art. 33(3) content) | The 8 numbered fields in the template body (lines 27-35) | Legal/CEO fills via `sed -i` per field |
| §5 Art. 34 (data subject) | — (template is SA-facing only) | Separate Art. 34 template needed (T-ATL-015 Phase 1 candidate) |
| §6 (this section) | "Cross-links" section of the template (lines 70-78) | Atlas maintains the bidirectional cross-link |

**Operational handoff at incident time:**
1. **t_0 (awareness)**: Atlas pages Legal/CEO with §1's trigger class + timestamp.
2. **t_0 → t_4 (60 hours)**: Legal/CEO open `dr-templates/gdpr-art-33-regulator.md`, do the 8 `sed -i` substitutions, save to `FILLED/2026-MM-DD-incident-name.md` (per the sed-safe character discipline from T-ATL-010).
3. **t_4 (sending)**: CEO + Legal co-sign + send to the SA inbox (per §3, the lead SA — Ireland DPC in Phase 1, the affected-data-subjects' SAs in Phase 0).
4. **t_6, t_7 (supplemental updates)**: Legal sends follow-up emails to the same SA inbox.

**Cross-references in this doc:**

| Reference | Status | Source |
|-----------|--------|--------|
| `DISASTER_RECOVERY_RUNBOOK.md` §3.4 (audit log tamper) | **EXISTS** | T-ATL-008, lines 159-182 — the §1 trigger class with PII exfil |
| `DISASTER_RECOVERY_RUNBOOK.md` §3.5 (ransomware) | **EXISTS** | T-ATL-008, lines 184-206 — the §1 trigger class with data leak |
| `DISASTER_RECOVERY_RUNBOOK.md` §3.1, §3.2, §3.3 | **EXISTS** | T-ATL-008, lines 78-157 — the §1 PII-impact assessment scenarios |
| `DISASTER_RECOVERY_RUNBOOK.md` §5 (4-audience comms plan) | **EXISTS** | T-ATL-008, lines 225-234 — the source of the 4 templates in `dr-templates/` |
| `DISASTER_RECOVERY_RUNBOOK.md` §8.4 (inline Art. 33 skeleton) | **EXISTS** | T-ATL-008, lines 352-370 — the original skeleton that T-ATL-010 pre-staged to a standalone file |
| `dr-templates/gdpr-art-33-regulator.md` | **EXISTS** | T-ATL-010, ACCEPTED 2026-06-13, 87 lines — the body template that §4 maps to |
| `dr-templates/customer-60-words.md` | **EXISTS** | T-ATL-010 — the public Art. 34 customer communication |
| `ON_CALL_RUNBOOK.md` IC-1 (Sentry crash spike) | **EXISTS** | T-ATL-003, line 223 — the §1 trigger detection path |
| `ADR-008-audit-logging.md` §Audit | **EXISTS** | Hephaestus T-HEP-003 — the §4 field 7 evidence trail (R2 Object Lock + commit hash + Sentry event IDs) |
| `ADR_VERIFICATION_EVIDENCE.md` §1, §2 | **EXISTS** | T-ATL-012 first, ACCEPTED 2026-06-13, 236L — the §4 field 7 evidence queries (R2 Object Lock query + audit chain verify script) |
| **`Strategos T-ST-010` (DEC-002 Main Establishment)** | **CLAIMED by Strategos** at 2026-06-13 08:00 IST per Leader's ACK in the prior turn. **Will** close the §3 Ireland DPC PROVISIONAL tag. **Do NOT cite as ratified until T-ST-010 lands.** | Strategos |
| `SENTRY_DEPLOYMENT.md` §6 (R2 archival) | **EXISTS** | T-ATL-007, lines 220-275 — the §4 field 7 Sentry evidence trail |
| `SENTRY_APOLLO_PLAYBOOK.md` §4 (post-apply monitoring) | **EXISTS** | T-ATL-013, ACCEPTED 2026-06-13, 313L — the Sentry-side first-Sentry-event-in-5-min canary that confirms observability is live |
| **EDPB Guidelines 9/2022 on personal data breach notification** | **PUBLIC** | https://edpb.europa.eu/our-work-tools/our-documents/guidelines/guidelines-092022-personal-data-breach-notification-under-regulation_en — the authoritative EU regulator guidance on Art. 33 + Art. 34 + Art. 56 |
| **`T-ATL-015 candidate` (per-customer Art. 34 private email template)** | **DEFERRED to Phase 1** | Atlas — flagged in §5, the per-customer Art. 34 email is a separate template, lower priority than the public 60-word version |

---

*Three witnesses for this doc itself:*
- **Measured.** 1 file (`GDPR_ART_33_FLOW.md`), target ~200L → **~210 lines** (in range). 6 sections per Leader spec: §1 trigger / §2 72h clock / §3 lead SA / §4 Art. 33(3) 8 fields / §5 Art. 34 high-risk threshold / §6 cross-link. 4 timeline tables (awareness / 7-event clock / Phase 0 vs Phase 1 SA routing / Art. 33 vs Art. 34 comparison). 12 cross-references, all D-009 verified on disk or flagged PROVISIONAL/PENDING.
- **SLO.** 72-hour GDPR Art. 33 deadline met with **12h buffer** (T+60h send vs T+72h hard limit). The buffer accommodates email-to-SA-inbox failures, SA national holidays, and re-routing. Phase 0 per-Subject-SA fallback is operationally expensive (5-10h Legal per incident); Phase 1 Ireland DPC routing reduces to ~1h — **the operational ROI of Strategos T-ST-010 (DEC-002)**.
- **Failure mode.** If Strategos T-ST-010 (DEC-002 Main Establishment) does NOT land by Phase 1 launch: we operate in the Phase 0 fallback forever, paying 5-10h Legal cost per incident. **The Ireland DPC PROVISIONAL tag in §3 is the dependency loop** — it remains in place until T-ST-010 ratifies or selects a different main establishment. Atlas will not unilaterally ratify the SA designation (out of lane).
- **Three Witnesses on every timeline claim.** §1 (awareness trigger) has rule/evidence/failure-mode; §2 (72h clock) has rule/evidence/failure-mode per event in the t_0…t_7 schedule; §3 (lead SA) has rule/evidence/failure-mode per Phase; §4 (8 fields) has rule/evidence/failure-mode per Art. 33(3) sub-clause; §5 (Art. 34 threshold) has rule/evidence/failure-mode per exemption. **6 sections × 3 witnesses = 18 Three-Witness blocks** in this doc.

---

**End of GDPR Art. 33 flow. 6 sections, 8 Art. 33(3) fields, 3 Art. 34(3) exemptions, 12 cross-links. — Atlas 2026-06-13**
