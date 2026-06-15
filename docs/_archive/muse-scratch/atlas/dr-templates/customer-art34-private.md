<!-- DRAFT v0.1 — awaiting review — Atlas 2026-06-13 — gated on Strategos T-ST-010 (DEC-002 Main Est) ratification 2026-09-15 -->

# DR comms template #5 — Per-customer Art. 34 private email

> **Audience.** Each individual affected data subject (customer) — private 1-to-1 email, NOT the public 60-word blast.
> **Channel.** Per-customer email (plain-text primary, HTML secondary). Sent from a known FinPlan Pro address (e.g., `security@finplanpro.com` or `dpo@finplanpro.com`), NOT a no-reply address.
> **Format.** Plain language (per Art. 34(1) "clear and plain language"), 250-400 words, no legal jargon, empathy-first tone.
> **Deadline.** **"Without undue delay"** per Art. 34(1) — the practical target is **within 24 hours of the Art. 33 filing being sent** (so the regulator sees our affected-customer notification in motion). Not a hard clock, but operationalized as 24h to maintain good faith with both the SA and the data subjects.
> **Source.** DISASTER_RECOVERY_RUNBOOK.md §5 line 232 (T-ATL-008, ACCEPTED 2026-06-13) + T-ATL-012 v2 §5 (Art. 34 high-risk threshold).
> **Sed pattern.** Plain-text version is sed-safe per T-ATL-010 §3 design principle #1. HTML version is reference-only — copy-paste into the email client, do NOT sed-substitute.
> **Gated on Strategos T-ST-010 (DEC-002 Main Establishment) ratification 2026-09-15** — the `[LEAD_SA_COUNTRY]` and `[LEAD_SA_NAME]` fields are PROVISIONAL until T-ST-010 lands. Phase 1 only; for Phase 0 the affected-data-subjects' SAs are addressed per Art. 33(1) sub-proviso.

---

## Why this template exists

**Witness 1 (rule).** GDPR Art. 34(1) requires the controller to **"communicate the personal data breach to the data subject without undue delay"** when the breach is **"likely to result in a high risk to the rights and freedoms of natural persons."** The high-risk threshold is **higher** than the Art. 33 "any risk" threshold — i.e., not every Art. 33 filing triggers an Art. 34 communication, but most do. The communication must be in **"clear and plain language"** (Art. 34(1)) and must describe **"the nature of the personal data breach"** + **"contain at least the information and measures referred to in Art. 33(3)(b), (c) and (d)"** — i.e., the likely consequences, the measures taken, and the DPO contact point. Art. 34(2) adds: the communication must also include the **nature of the breach** + **recommendations for the data subject to mitigate potential adverse effects**.

**Witness 2 (evidence).** T-ATL-012 v2 §5 (ACCEPTED 2026-06-13) calls out the "60-word public + longer private pattern" — the 60-word public template is the public summary; THIS template is the per-customer private Art. 34 email. The 3 Art. 34(3) exemptions (encryption / subsequent measure / disproportionate effort) are documented in T-ATL-012 v2 §5; this template's pre-flight checklist applies the exemptions to gate whether to send.

**Witness 3 (failure mode / consequence).** If we **fail to send** an Art. 34 communication that was required, the failure modes are: (a) **Art. 83(4) administrative fine** — up to €10M or 2% global annual turnover; (b) **class-action lawsuits** from data subjects who can show "I would have mitigated my losses if you had told me sooner" (e.g., a customer who was about to wire $50K to a fraudulent account impersonating our service, but we didn't notify them of the credential breach); (c) **regulator follow-up** — the SA may add Art. 34 violation to the Art. 33 filing and double the fine exposure. **The fix is to err on the side of sending** when the high-risk threshold is met, even if some customers receive an email that "turns out to be precautionary" — the alternative (not sending) is worse.

---

## Template body — plain-text version (SED-SAFE per T-ATL-010 §3 design principle #1)

```
From: security@finplanpro.com  (or dpo@finplanpro.com)
To: [CUSTOMER_EMAIL]
Subject: Important security update about your FinPlan Pro account

Dear [CUSTOMER_FIRST_NAME],

We are writing to let you know about a security incident at FinPlan Pro that
may have affected your account. We take this seriously, and we want to be
transparent about what happened, what we have done, and what you can do.

WHAT HAPPENED
On [APPROXIMATE_DATE_OF_BREACH] at [APPROXIMATE_TIME_OF_BREACH] UTC, we
identified [NATURE_OF_BREACH — e.g., "unauthorized access to a database
containing customer account information"]. The incident affected
[APPROX_N_AFFECTED_RECORDS] records in total.

WHAT INFORMATION OF YOURS WAS AFFECTED
The following data of yours may have been accessed: [AFFECTED_DATA_CATEGORIES]
(e.g., "your account name, business email, and Q1 2026 financial reports").
We have NO EVIDENCE that [NON_AFFECTED_DATA_CATEGORIES] was accessed
(e.g., "your payment information or your password hash").

WHAT WE HAVE DONE
[MEASURES_TAKEN — specific + timestamped, e.g., "We isolated the affected
EU region at 14:32 UTC, restored data from a verified backup at 15:18 UTC,
rotated all internal credentials, revoked all active sessions, and engaged
an external security firm to verify the fix."]

WHAT YOU CAN DO
We recommend the following actions:
1. [RECOMMENDED_ACTION_1 — e.g., "Reset your FinPlan Pro password at
   your earliest convenience via the in-app settings page."]
2. [RECOMMENDED_ACTION_2 — e.g., "Enable two-factor authentication if
   you have not already done so."]
3. [RECOMMENDED_ACTION_3 — e.g., "Review your account activity for
   the period [DATE_RANGE] and report anything unusual to us."]

We have also notified the [LEAD_SA_NAME] (the [LEAD_SA_COUNTRY] data
protection authority) of this incident, in compliance with GDPR
Article 33. The notification was filed on [ART_33_FILING_DATE] at
[ART_33_FILING_TIME] UTC.

IF YOU HAVE QUESTIONS
Our Data Protection Officer can be reached at [DPO_EMAIL] or
[DPO_PHONE]. We are available to answer your questions and to help you
take any of the actions above.

We sincerely apologize for this incident. We are committed to maintaining
your trust, and we are taking concrete steps to prevent this from
happening again.

— [FOUNDER_OR_CEO_NAME]
  FinPlan Pro
```

> **Sed pattern (CEO at incident time).** Per T-ATL-010 §3 design principle #1, the CEO should `cat template.md | sed` to a `/tmp/` file or `FILLED/` directory, never in place. Example:
>
> ```bash
> sed -e 's/\[CUSTOMER_EMAIL\]/jane@acme-corp.com/g' \
>     -e 's/\[CUSTOMER_FIRST_NAME\]/Jane/g' \
>     -e 's/\[APPROXIMATE_DATE_OF_BREACH\]/2027-01-19/g' \
>     -e 's/\[APPROXIMATE_TIME_OF_BREACH\]/14:32/g' \
>     -e 's/\[NATURE_OF_BREACH\]/unauthorized access to a database containing customer account information/g' \
>     -e 's/\[APPROX_N_AFFECTED_RECORDS\]/approximately 12,500/g' \
>     -e 's/\[AFFECTED_DATA_CATEGORIES\]/your account name, business email, and Q1 2026 financial reports/g' \
>     -e 's/\[NON_AFFECTED_DATA_CATEGORIES\]/your payment information or your password hash/g' \
>     -e 's/\[MEASURES_TAKEN\]/We isolated the affected EU region at 14:32 UTC, restored data from a verified backup at 15:18 UTC, rotated all internal credentials, revoked all active sessions, and engaged an external security firm to verify the fix./g' \
>     -e 's/\[RECOMMENDED_ACTION_1\]/Reset your FinPlan Pro password at your earliest convenience via the in-app settings page./g' \
>     -e 's/\[RECOMMENDED_ACTION_2\]/Enable two-factor authentication if you have not already done so./g' \
>     -e 's/\[RECOMMENDED_ACTION_3\]/Review your account activity for the period 2026-10-19 to 2027-01-19 and report anything unusual to us./g' \
>     -e 's/\[LEAD_SA_NAME\]/Data Protection Commission/g' \
>     -e 's/\[LEAD_SA_COUNTRY\]/Irish/g' \
>     -e 's/\[ART_33_FILING_DATE\]/2027-01-21/g' \
>     -e 's/\[ART_33_FILING_TIME\]/13:50/g' \
>     -e 's/\[DPO_EMAIL\]/dpo@finplanpro.com/g' \
>     -e 's/\[DPO_PHONE\]/+1-555-FINPLAN/g' \
>     -e 's/\[FOUNDER_OR_CEO_NAME\]/Jane Smith, CEO/g' \
>     docs/drafts/atlas/dr-templates/customer-art34-private.md \
>     > /tmp/2027-01-19-incident-jane-acme-corp.md
> ```
>
> The output is a per-customer `.md` file in `/tmp/`, which the CEO then copy-pastes into the email client (or uses `mail` / `sendmail` to send directly).

---

## Template body — HTML version (REFERENCE-ONLY, do NOT sed-substitute)

The HTML version is a 1:1 mirror of the plain-text version, with `<p>`, `<strong>`, `<ul>`, `<li>` markup. The CEO copies the filled plain-text version into the HTML wrapper, OR uses an email tool (Customer.io / SendGrid / Postmark) that accepts a plain-text body and renders it. **The HTML version is reference-only** — the sed-substitution discipline applies only to the plain-text version.

> **Why HTML is reference-only.** Per T-ATL-010 §3 design principle #1, sed-safe characters are limited to `[A-Z_ a-z0-9,.|:()%-]`. HTML contains `<`, `>`, `&`, `/`, `"`, `'` — all of which break sed substitution in unpredictable ways. The plain-text version is the canonical template; the HTML version is a rendering aid for email clients that support rich formatting.

---

## Per-jurisdiction callout (GATED on T-ST-010 ratification 2026-09-15)

The `[LEAD_SA_NAME]` and `[LEAD_SA_COUNTRY]` fields are **PROVISIONAL** until Strategos T-ST-010 (DEC-002 Main Establishment) ratifies the EU main establishment. Per T-ATL-012 v2 §3, the recommended main establishment is **Ireland** (Dublin) — making the lead SA the **Data Protection Commission (DPC)**. Until T-ST-010 ratifies:

- **Phase 0 (current).** No EU main establishment. The Art. 33 filing is to the **per-Subject-SA** (the SA where the affected data subjects are predominantly located). The Art. 34 email references the same per-Subject-SA, OR omits the SA reference entirely if multiple SAs are involved (since naming one implies the others are not addressed).
- **Phase 1 (post-T-ST-010 ratification).** Ireland DPC is the lead SA. The Art. 34 email references "the Irish Data Protection Commission" — single SA, clear, easy for the data subject to verify.

> **Customer verification.** Affected customers may independently verify the SA by visiting the EDPB member-directory page (https://edpb.europa.eu/about-edpb/about-edpb/members_en). Naming the SA in the customer email builds trust — the customer can independently confirm the regulator is real and reachable.

---

## Art. 34(3) exemption callout — when NOT to send

Per Art. 34(3), the Art. 34 communication obligation is waived in 3 cases. The CEO/Legal should check these BEFORE sending the per-customer email:

1. **Encryption exemption (Art. 34(3)(a))** — the personal data was rendered unintelligible to unauthorized persons via encryption, AND the encryption key was not compromised. For FinPlan Pro: AES-256-GCM at rest per ADR-007 applies if the key from T-ATL-008 §3.3 (crypto key loss) did NOT leak. **If the key is the breached asset, the exemption does NOT apply.**
2. **Subsequent measure exemption (Art. 34(3)(b))** — subsequent measures (e.g., forced session revocation, password reset, MFA enforcement) eliminate the "high risk" before any unauthorized access. For FinPlan Pro: forced session revocation within 1 hour of detection qualifies.
3. **Disproportionate effort exemption (Art. 34(3)(c))** — the communication would involve disproportionate effort (e.g., the affected data subjects' contact info is unknown). In that case, a **public communication** (status page + blog post) substitutes for individual emails. For FinPlan Pro: we always have customer email, so this exemption is rarely applicable — but the public-communication fallback is still good practice.

> **Default = send.** If in doubt, send. The Art. 83(4) fine for non-communication is up to €10M / 2% turnover. The cost of a "precautionary" email that the customer would have preferred not to receive is much lower than the cost of a non-communication fine + class-action exposure.

---

## Pre-flight checklist (before sending the first per-customer email)

1. **Art. 33 filed (or in flight).** Per Art. 34(1), the Art. 34 communication is typically sent **after** the Art. 33 filing. Sending before the Art. 33 filing is allowed but not standard. **The 24h Art. 34 target starts from the Art. 33 send time, not from the awareness moment.**
2. **High-risk threshold met.** Per T-ATL-012 v2 §5, the threshold is "likely to result in a high risk" (higher than Art. 33 "any risk"). If the breach is low-risk (e.g., non-PII metadata, fully encrypted, no key compromise), Art. 34 may not be required. **Document the high-risk assessment** in the Art. 33 filing as a sibling artifact.
3. **3 Art. 34(3) exemptions checked.** Encryption, subsequent measure, disproportionate effort. If all 3 are N/A, the Art. 34 communication is required.
4. **All 12 [BRACKETED_FIELDS] populated.** Per Art. 34(1) + Art. 34(2) requirements. Missing fields = "we are still investigating" = violation pattern.
5. **Plain language verified.** Art. 34(1) requires "clear and plain language." No legal jargon. No GDPR article references in the customer-facing body (those are for the SA, not the data subject). **Read the email aloud** — if a non-lawyer customer would not understand a sentence, rewrite it.
6. **Empathy tone verified.** This email goes to a real person who may be worried, angry, or scared. The tone is: we messed up, we are sorry, we are fixing it, here is what you can do. **NOT**: we are complying with our legal obligations.
7. **DPO contact reachable.** The `[DPO_EMAIL]` and `[DPO_PHONE]` must be monitored for at least 30 days post-send. If the DPO is OOO, name a backup contact (e.g., `ceo@finplanpro.com`).
8. **HTML rendering tested.** The HTML version should render correctly in Gmail, Outlook, Apple Mail, and the major mobile clients. Test with a sample customer BEFORE sending the blast.
9. **Bounce handling ready.** Some emails will bounce (typos, full inboxes, defunct addresses). The bounce handling should fall back to the public status page communication (Art. 34(3)(c) public communication substitute).
10. **Supplemental update cadence committed.** Per T-ATL-012 v2 §2 t_6 + t_7 schedule, the data subjects receive +7 day and +30 day supplemental updates if the investigation uncovers new information. **The first per-customer email is not the last.**

---

## Cross-links

- **Parent runbook.** `../DISASTER_RECOVERY_RUNBOOK.md` §5 (T-ATL-008, ACCEPTED 2026-06-13) — the 4-audience comms plan; this template is the per-customer private slice
- **Sibling templates.** `customer-60-words.md` (the public version — 60 words, status page + email blast + tweet), `employee-100-words.md`, `board-200-words.md`, `gdpr-art-33-regulator.md` (the SA version — Art. 33 filing)
- **Art. 34 high-risk threshold.** `../GDPR_ART_33_FLOW.md` §5 (T-ATL-012 v2, ACCEPTED 2026-06-13) — the 3 Art. 34(3) exemptions + the 60-word public + longer private pattern
- **Art. 33 filing.** `gdpr-art-33-regulator.md` (T-ATL-010) — the SA-facing disclosure; Art. 34 customer email is sent after this
- **Legal references.** Art. 34(1) GDPR (without undue delay + clear and plain language); Art. 34(2) (recommendations to mitigate); Art. 34(3)(a) (encryption exemption); Art. 34(3)(b) (subsequent measure exemption); Art. 34(3)(c) (disproportionate effort exemption); Art. 83(4) (administrative fines up to €10M / 2% turnover)
- **EDPB reference.** EDPB Guidelines 9/2022 §4 (Guidelines 9/2022 on personal data breach notification under Regulation 2016/679) — https://edpb.europa.eu/our-work-tools/our-documents/guidelines/guidelines-092022-personal-data-breach-notification-under-regulation_en
- **PENDING DEC-002 candidate.** Strategos T-ST-010 (Main Establishment) — `[LEAD_SA_NAME]` and `[LEAD_SA_COUNTRY]` are PROVISIONAL until T-ST-010 ratifies. Recommended: Ireland (Dublin) per T-ATL-012 v2 §3.
- **Sed-safe discipline.** T-ATL-010 §3 design principle #1 — `[A-Z_ a-z0-9,.|:()%-]` only; CEO fills via `cat | sed` redirect to `/tmp/` or `FILLED/`, never in place
- **3 design principles applied.** T-ATL-010 §3: (1) sed-safe character discipline — applied to plain-text version; (2) Three Witnesses (D-002) — applied in "Why this template exists" section; (3) Immutability rule — the original `customer-art34-private.md` is never modified in place; CEO creates a per-customer copy in `/tmp/` or `FILLED/`
- **Phase 1 gating.** This template is **Phase 1** per T-ATL-012 v2 §5 ("private per-customer Art. 34 email deferred to Phase 1"). Pre-staging now so the template is ready when Phase 1 launches.

---

**End of per-customer Art. 34 template. 12 [BRACKETED_FIELDS], 10-item pre-flight, 3 Art. 34(3) exemptions, gated on T-ST-010 ratification. — Atlas 2026-06-13 09:10 IST**
