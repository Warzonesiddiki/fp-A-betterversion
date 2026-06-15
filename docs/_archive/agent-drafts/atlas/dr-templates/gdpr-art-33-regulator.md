<!-- DRAFT v0.1 — awaiting review — Atlas 2026-06-13 -->
# DR comms template #4 — Regulator disclosure (GDPR Art. 33)

> **Audience.** Lead supervisory authority per jurisdiction (CNIL for FR, BfDI for DE, ICO for UK, AEPD for ES, etc.).
> **Channels.** Email to the lead supervisory authority's breach-notification inbox + registered post (recommended for paper trail).
> **Format.** Free-form but structured around the 8 numbered fields below (Art. 33(3) requirements).
> **Deadline.** **72 hours from becoming aware** of the breach (Art. 33(1)). If the disclosure is incomplete at 72h, file what you have + commit to supplemental updates.
> **Source.** DISASTER_RECOVERY_RUNBOOK.md §8.4 (T-ATL-008, ACCEPTED 2026-06-13).
> **Sed pattern.** This template is multi-line with structured fields — CEO/Legal should use `sed -i` per field, not a single substitution. Suggested:
> ```bash
> sed -e 's/\[NATURE\]/confidentiality, integrity, availability/g' \
>     -e 's/\[CATEGORIES_OF_DATA_SUBJECTS\]/customers/g' \
>     -e 's/\[APPROX_N_SUBJECTS\]/N/g' \
>     ...etc.
> ```

---

## Why this template exists

**Witness 1 (rule).** GDPR Art. 33 imposes a **72-hour clock** from the moment we become "aware" of a personal data breach. "Aware" = a member of staff has reasonable certainty that a security incident has occurred that led to personal data being compromised. The clock does NOT pause for forensic analysis, internal investigation, or management review. If we miss 72h, the maximum administrative fine under Art. 83(5) is up to €20M or 4% of global annual turnover, whichever is higher — the largest GDPR penalty tier.

**Witness 2 (evidence).** T-ATL-008 §8.4 inline skeleton (DISASTER_RECOVERY_RUNBOOK.md:352-370) is the source. The 8 numbered fields map 1:1 to Art. 33(3)(a)–(g) plus the DPO contact (Art. 33(3)(d) requires naming a contact point). **Every field is mandatory** under Art. 33(3) — filing with fields 1-3 filled and the rest "TBD" is a violation.

**Witness 3 (failure mode / consequence).** If we file an incomplete or late Art. 33 disclosure, the failure modes are: (a) **administrative fine** — up to €20M / 4% turnover; (b) **reputational** — public listing on the ENISA breach disclosure registry; (c) **follow-on** — class-action lawsuits from data subjects who can now point to the regulator's confirmation that a breach occurred. The template's 8-field structure is the minimum viable disclosure; the 72h clock is the minimum viable timeframe.

---

## Template body

```
To: [Lead supervisory authority per jurisdiction]
   (e.g., CNIL for FR — https://www.cnil.fr/fr/notifier-une-violation-de-donnees-personnelles;
          BfDI for DE — https://www.bfdi.bund.de;
          ICO for UK — https://ico.org.uk/for-organisations/report-a-breach/)
Re: Personal data breach notification (GDPR Art. 33)

1. NATURE OF THE BREACH: [categories: confidentiality / integrity / availability]
2. CATEGORIES OF DATA SUBJECTS: [e.g., "approximately N customers using the FP&A service"]
3. APPROXIMATE NUMBER OF DATA SUBJECTS: [N]
4. CATEGORIES OF PERSONAL DATA: [e.g., "name, email, business financial data"]
5. APPROXIMATE NUMBER OF RECORDS: [N]
6. LIKELY CONSEQUENCES: [1-2 sentences on customer impact]
7. MEASURES TAKEN: [list of containment + remediation, e.g., "isolated affected region,
   restored from immutable backup, rotated all credentials"]
8. DPO CONTACT: [name, email, phone]

Notification within 72-hour window per Art. 33(1). Subsequent updates as the investigation
progresses.

— [Legal name], FinPlan Pro
   [Registered company name + address + registration number]
```

> **Per-jurisdiction routing.** The "lead supervisory authority" is determined by Art. 56 — the SA where our main establishment is located. If we have a single main establishment in the EU, that's the one. For FinPlan Pro Phase 0 (OSS-only, no backend), this is a hypothetical — but the moment Phase 1 launches (per DEC-001), we must designate a main establishment. Flagging this for Strategos: **DEC-002 candidate** — main establishment designation is a strategic decision that should land alongside DEC-001 (Phase 1 backend choice).

> **72h awareness clock.** The clock starts when a staff member (engineer, on-call, CEO) first has reasonable certainty that personal data was compromised. NOT when the engineering root cause is confirmed, NOT when the customer comms go out, NOT when the board is briefed. The Legal / DPO team must be paged **immediately** upon any §3.3 (crypto key loss) or §3.4 (audit log tamper) scenario to start the 72h countdown.

---

## Pre-flight checklist (before sending)

1. **Art. 33 awareness trigger verified.** Confirm that "awareness" has occurred (per Art. 33(1) interpretation) — i.e., we have reasonable certainty that personal data was compromised. If not yet, **do not file** — premature filing creates more liability than necessary.
2. **Lead supervisory authority identified.** Per Art. 56, this is the SA where our main establishment is. If we don't have a main establishment yet, the SA is **the one where the data subjects are predominantly located** (per Art. 33(1) sub-proviso).
3. **All 8 fields populated.** Art. 33(3) requires each of fields 1-7. Field 8 (DPO contact) is required by Art. 33(3)(d). If any field is "unknown at this time", file with "preliminary estimate" and commit to a supplemental update.
4. **72h window verified.** From awareness moment to send time < 72h. If approaching 72h with incomplete data, file partial + commit to follow-up.
5. **Legal / DPO sign-off.** CEO cannot file Art. 33 unilaterally — must be co-signed by Legal or the DPO. Without co-signature, the filing is not legally valid.
6. **Measures taken is specific.** "We are investigating" is not a measure. "We isolated the affected EU region at 14:32 UTC, restored from R2 immutable snapshot (commit a1b2c3d) at 15:18 UTC, rotated all credentials and revoked active sessions by 16:05 UTC" is a measure.
7. **DPO contact is reachable.** The named DPO must be available for regulator follow-up for at least 30 days post-filing. If the DPO is OOO, name a backup contact.
8. **Supplemental updates committed.** Art. 33(4) requires updates "as the investigation progresses" — schedule the first follow-up at +7 days, +30 days, and at incident closure.

---

## Cross-links

- **Parent.** `../DISASTER_RECOVERY_RUNBOOK.md` §8.4 (T-ATL-008, ACCEPTED 2026-06-13)
- **Sibling templates.** `customer-60-words.md`, `employee-100-words.md`, `board-200-words.md`
- **Legal reference.** Art. 33 GDPR (notification of personal data breach to the supervisory authority); Art. 33(1) (72h clock); Art. 33(3) (8 mandatory fields); Art. 33(4) (supplemental updates); Art. 56 (lead supervisory authority)
- **Penalty reference.** Art. 83(5) GDPR — administrative fines up to €20M / 4% global annual turnover
- **Scenario triggers.** T-ATL-008 §3.3 (crypto key loss) and §3.4 (audit log tamper) — these are the most likely to trigger Art. 33 awareness
- **PENDING DEC-002 candidate.** Strategos should designate main establishment for Phase 1 — Art. 56 routing depends on this
- **Sibling runbook.** `../ON_CALL_RUNBOOK.md` IC-1 (15-min customer comms SLA) — Legal must be paged in parallel
- **RACI reference.** T-ATL-008 §9 — Legal / DPO is **A** (Accountable) for §3.4 (audit log tamper) comms

---

**End of GDPR Art. 33 template. 8 mandatory fields, 72h clock, 8-item pre-flight. — Atlas 2026-06-13 07:55 IST**
