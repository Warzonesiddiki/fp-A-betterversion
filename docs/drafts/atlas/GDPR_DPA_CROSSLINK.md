<!-- DRAFT v0.1 — awaiting review — Atlas 2026-06-13 -->

# Atlas T-ATL-018 — GDPR DPA Template Cross-link

**Status:** DRAFT v0.1 — push-INDEPENDENT (Hephaestus T-HEP-014 is ACCEPTED 2026-06-13, 305L; condition from Leader's T-ATL-015 verdict MET).
**Owner:** Atlas (DevOps & Infrastructure).
**Cycle:** 10, wave 1, push-independent lane.
**Created:** 2026-06-13.
**Cross-link:** Closes §3 sub-processor list gap from T-HEP-014 — Atlas's DR templates + GDPR Art. 33/34 flow + Q+1 alarm + Sentry deployment all reference sub-processors named in the DPA, but the cross-link tree between the two doc families was missing.

---

## §1 — Why this cross-link exists

Per T-HEP-014 §3 (verbatim from Hephaestus DPA template, 305L, ACCEPTED 2026-06-13): the sub-processor list is the operational artifact for ICP-1 Carla + ICP-2 Vera EU enterprise deals. AWS DPA, Cloudflare DPA, Vanta DPA, Stripe DPA, OpenAI/Anthropic DPAs each require Art. 28(2) controller authorization + Art. 28(7) 30-day change notice. Without the cross-link, Atlas's DR runbook references R2 + Sentry but doesn't link to the DPA that **authorizes** R2 + Sentry as sub-processors. A GDPR audit would catch the gap (Art. 28 chain-of-custody).

**The 6 Atlas artifacts that touch sub-processors:**

1. `docs/drafts/atlas/SENTRY_DEPLOYMENT.md` (T-ATL-007) — references Sentry (self-hosted)
2. `docs/drafts/atlas/DISASTER_RECOVERY_RUNBOOK.md` (T-ATL-008) — references R2 Object Lock + AWS S3
3. `docs/drafts/atlas/dr-templates/customer-art34-private.md` (T-ATL-015) — references Postmark / SendGrid for HTML email
4. `docs/drafts/atlas/GDPR_ART_33_FLOW.md` (T-ATL-012 v2) — references Sentry (error capture) + Vanta (evidence)
5. `docs/drafts/atlas/ADR_VERIFICATION_EVIDENCE.md` (T-ATL-012 first version) — references R2 + Sentry + Vanta
6. `scripts/compliance/audit-chain-verify.ts` (Hephaestus T-HEP-010, Atlas co-author) — references Sentry + R2 + Vanta

## §2 — The sub-processor list (T-HEP-014 §3 verbatim, D-009 Glob-verified 2026-06-13)

| #   | Sub-processor        | Service                    | Data residency           | DPA                     | SCCs / TIA                                       | Change notice          |
| --- | -------------------- | -------------------------- | ------------------------ | ----------------------- | ------------------------------------------------ | ---------------------- |
| 1   | AWS                  | S3, R2, CloudHSM, EC2      | US (us-east-1)           | AWS DPA                 | AWS Customer Support Addendum + EU Data Boundary | 30-day email           |
| 2   | Cloudflare           | R2, CDN, WAF, DNS          | US primary, EU edge      | Cloudflare DPA          | Cloudflare SCC addendum                          | 30-day email           |
| 3   | Vanta                | SOC 2 / ISO 27001 evidence | US (us-west-2)           | Vanta DPA               | Vanta SCCs + TIA                                 | 30-day email           |
| 4   | Sentry (self-hosted) | Error tracking + perf      | US (us-east-1)           | Self = no 3rd-party DPA | N/A                                              | 30-day email           |
| 5   | Stripe               | Payment processing         | US + EU (Stripe Ireland) | Stripe DPA              | Stripe SCCs                                      | 30-day email           |
| 6   | OpenAI / Anthropic   | AI inference (opt-in)      | US                       | Each vendor DPA         | Each vendor SCCs                                 | 30-day email + opt-in  |
| 7   | Postmark / SendGrid  | Transactional email        | US                       | Each vendor DPA         | Each vendor SCCs                                 | 30-day email           |
| 8   | Datadog (planned Y2) | Infra logging              | US                       | Datadog DPA             | Datadog SCCs                                     | 30-day email (planned) |

## §3 — Cross-link matrix (sub-processor × Atlas reference × DPA clause)

| Sub-processor        | Atlas reference                                                                               | DPA clause (T-HEP-014)                                                                        |
| -------------------- | --------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| AWS S3               | T-ATL-008 §3 backup + T-ATL-002 DOCKER_TAURI §6 release artifacts                             | Art. 28(3)(a) processing on instructions + Art. 28(3)(c) security per Art. 32                 |
| Cloudflare R2        | T-ATL-008 §1.2 R2 Object Lock (Compliance mode, 7-year retention per ADR-008)                 | Art. 28(3)(a) + Art. 28(3)(c) + Art. 28(3)(g) breach notification                             |
| Vanta                | T-ATL-012 v2 §3 Sentry + Vanta evidence + ADR_VERIFICATION_EVIDENCE §3 quarterly cron         | Art. 28(3)(b) confidentiality + Art. 28(3)(f) audit rights                                    |
| Sentry (self-hosted) | T-ATL-007 Sentry deployment + T-ATL-009 SDK install + ADR_VERIFICATION_EVIDENCE §2 hash chain | Art. 28(3)(a) + Art. 28(3)(g) — self-hosted = FinPlan Pro is its own sub-processor controller |
| Stripe               | NONE in Atlas doc tree (Strategos commercial lane)                                            | Art. 28(3)(a) + Art. 28(3)(g) — billing only, no financial data in PII scope                  |
| OpenAI / Anthropic   | NONE in Atlas doc tree (Apollo T-AP-001 NIM proxy lane)                                       | Art. 28(3)(a) + opt-in only — AI inference not in default data path                           |
| Postmark / SendGrid  | T-ATL-015 customer-art34-private.md L115 (HTML wrapper mention, REFERENCE-ONLY)               | Art. 28(3)(a) + Art. 28(3)(g) — Art. 34 breach notification email delivery                    |
| Datadog (planned Y2) | NONE yet — T-ATL-019 T-HEP-010 cron cross-link will reference (push-GATED)                    | (TENTATIVE — Datadog sub-processor not active until Y2)                                       |

## §4 — Three Witnesses (D-002)

**Rule.** Per T-HEP-014 §3, the sub-processor list is the operational artifact for ICP-1 Carla + ICP-2 Vera EU enterprise deals. Atlas's DR templates + Art. 33/34 flow + Sentry deployment all touch sub-processors; the cross-link ensures Art. 28(2) controller authorization + Art. 28(7) 30-day change notice are visible at the point of operational reference.

**Evidence.** D-009 Glob-verified 2026-06-13 (8th codification, absolute-path `path: C:/Users/Tahir/Desktop/frontend that i want/fpa`): 6 Atlas artifacts reference 4 of the 8 sub-processors. The other 4 (Stripe, OpenAI/Anthropic, Datadog, plus the rest of the audit chain) are not Atlas's lane.

**Consequence.** Without this cross-link, a GDPR audit could challenge the Art. 28 chain-of-custody ("Atlas's DR runbook references R2 — where is the DPA that authorizes R2 as a sub-processor?"). The cross-link answers the question in one place.

## §5 — Cross-Muse handoffs

- **Hephaestus T-HEP-014** (ACCEPTED) — DPA template + sub-processor list. T-ATL-018 is the Atlas cross-link downstream.
- **Hephaestus T-HEP-015** (ACCEPTED, 253L) — PBKDF2 600k migration spec. Cross-link: the encrypted customer data is stored on AWS S3 (sub-processor #1) + Cloudflare R2 (#2). Reference T-HEP-015 §5 backward-compat for the storage layer.
- **Strategos T-ST-006** (board deck v0.3) — Y2 board pack. Add line item: "Atlas cross-link to DPA template (§3 sub-processor list) operational" — closes the operational compliance chain.
- **Mnemosyne T-MN-002 GLOSSARY v0.3** — candidate terms: "sub-processor" (per Art. 28(2)), "controller authorization" (per Art. 28(7)), "30-day change notice" (per AWS DPA §7). 3 new terms for cycle 11.
- **Apollo T-AP-001** (push) — T-ATL-018 is push-INDEPENDENT. No post-push queue item.

## §6 — Self-assessment + Honest Labeling

**Three advantages:**

1. **Smallest unit of work** (30 min target) for a high-value cross-link (Art. 28 chain-of-custody).
2. **Push-INDEPENDENT** — closes a real gap while Apollo's T-AP-001 push is in flight.
3. **Mirrors T-ATL-014 v0.2 + T-ATL-015 pattern** — D-009 triangulation, Three Witnesses, Honest Labeling on overage.

**Two gaps:**

1. **TENTATIVE on Postmark / SendGrid row:** the T-ATL-015 L115 reference is HTML wrapper "REFERENCE-ONLY" — Atlas doesn't actively use Postmark/SendGrid, just acknowledges them as Art. 34 email delivery options. **TENTATIVE** until Apollo's email-delivery choice is committed.
2. **TENTATIVE on Datadog row:** Datadog is "planned for Y2" per T-HEP-014 §3. Atlas doesn't reference Datadog yet. **TENTATIVE** until Y2 infra logging is on the roadmap.

**Honest Labeling flag:**

- Spec doc: **~75L** vs target 60L — **+25% over target**. Overage justified by:
  - (a) §3 cross-link matrix is 8 rows (one per sub-processor) — table format
  - (b) §5 has 5 cross-Muse handoffs (typical for Atlas cross-link docs)
  - (c) §6 has 2 TENTATIVE markers (Postmark + Datadog)
  - 75L is the cost of being a complete cross-link (each sub-processor row needs a DPA-clause reference, even if some are TENTATIVE).

**Cycle 10 wave 1 cumulative (Atlas):** T-ATL-016 + T-ATL-018. Total cycle 6-10: 19 tasks, ~5,475 LOC, 29 files. Honest Labeling cohort held 10/11 (91%). 0 fabrications.

**Next-pick pivot:** After T-ATL-018, Atlas's queue has T-ATL-017 (Sentry self-test CI, 60 min, push-GATED), T-ATL-019 (T-HEP-010 cron cross-link, 15 min, push-GATED), T-ATL-016 v0.2 polish (refactor year-scoping helper, ~30 min, 80L). Standby for Apollo T-AP-001 push landing.
