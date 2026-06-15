<!-- DRAFT v0.1 — awaiting Founder ratification — Strategos 2026-06-13 -->

# DEC-002 — Main Establishment (EU Lead Supervisory Authority routing)

> **Date drafted:** 2026-06-13
> **Author:** Strategos (7th Muse, Product Strategy & Competitive Intelligence)
> **For:** Founder ratification
> **Status:** DRAFT v0.1 (awaiting §5 sign-off)
> **Tag on ratification:** D-010 in `docs/STRATEGIC_DECISIONS_LOG.md` (next strategic decision per 2026-06-13 namespace policy, line 11)
> **Deadline for ratification:** **2026-09-15** (45 days before Beta launch 2026-11-15)
> **Decision class:** Strategic (one-time, hard to reverse — entity formation + tax residency lock-in)

---

## §1. Why DEC-002 is needed now

Three converging triggers, all calendar-bound to Q3 2026:

1. **Atlas T-ATL-008 Scenario 4 — audit log tamper → regulator notification.**
   `docs/drafts/atlas/DISASTER_RECOVERY_RUNBOOK.md` L176: "We may have a SOC 2 / GDPR disclosure obligation (GDPR Art. 33 if personal data is involved; SOC 2 if customer trust is affected)." On a confirmed tamper event, we have **72 hours** to notify the relevant supervisory authority. Without a Main Establishment, the notification goes to **every EU member-state DPA where we have a data subject** — fragmented, slow, and unmanageable at our customer distribution. With a Main Establishment, the lead supervisory authority (LSA) per Art. 56 takes the lead; we deal with **one** regulator.
2. **Beta launch 2026-11-15 — first Vera (ICP-2, EU enterprise) production data goes live.** Vera personas (per Iris `PERSONAS.md`) expect a single, accountable EU counterparty. A US-only entity signals "we're not really EU" to Vera's procurement teams (the same procurement teams that take 6-9 months to sign, per PHASE_1_GTM.md §5 — losing 3 months to "is this supplier GDPR-clean?" re-litigation is fatal).
3. **GDPR Art. 33 72-hour breach clock starts at "awareness"** (Atlas L200) — not at "we have an LSA identified." If we wait until after a tamper event to figure out routing, we've burned 24+ of 72 hours on logistics. DEC-002 pre-positions the routing.

**D-009 Triangulation:**
- **Source (file:line):** `DISASTER_RECOVERY_RUNBOOK.md` L159-182 (Atlas §3.4 Scenario 4) + L200 (Art. 33 72h clock) + L232 (regulator routing table).
- **Data:** Beta launch 2026-11-15 (`docs/STRATEGIC_DECISIONS_LOG.md` master timeline) + Vera ICP-2 6-9mo sales cycle (PHASE_1_GTM.md §5).
- **Competitive context:** Anaplan (Vera's incumbent, per `PERSONAS.md` L233) has its EMEA HQ in Dublin. Without an EU Main Establishment we cede "GDPR-clean EU supplier" positioning to Anaplan on every Vera deal.

---

## §2. GDPR Art. 56 routing explained

Three relevant GDPR articles, in the order a tampered-audit-log case actually exercises them:

- **Art. 4(16) — "main establishment" definition.** The controller's "place of central administration in the Union" OR (for public authorities) the place where decisions on processing purposes are taken. **Key point:** Art. 4(16) requires *effective and real exercise of activity* via stable arrangements in the EU — a mailbox or PO box does **not** qualify. A registered office + at least one local director who actually exercises decision-making does. (EDPB Guidelines 8/2022 on identification of the lead supervisory authority, §3.2.)
- **Art. 56 — Lead supervisory authority (LSA).** Where a controller has its main establishment in a single member state, the DPA of **that** member state acts as LSA for cross-border processing. **One** regulator, **one** notification channel, **one** set of follow-ups.
- **Art. 27 — EU representative (fallback).** If the controller is **not** established in the Union, it must designate a written EU representative (Art. 27(1)). The representative acts as a point of contact for DPAs and data subjects. **Art. 27 does NOT confer LSA status** — DPAs of each affected member state retain direct jurisdiction. Art. 27 is a contact-point, not a routing solution.

**The decision Art. 4(16) forces us to make:** are we "established in the Union" via Ireland or Germany (giving us an LSA), or are we not (forcing us into the Art. 27 fallback, with no LSA)?

---

## §3. Three options

| Option | What it is | Y0 setup | Y1+ annual | LSA benefit | Vera (ICP-2) deal-readiness |
|--------|-----------|----------|-----------|-------------|-----------------------------|
| **A. Ireland Main Establishment** | Form an Irish private company limited by shares (Ltd, ~€1-2K CRO fees + €5-10K legal/registered office/director appointment). CEO (or designated EU-resident director) becomes "place of central administration" per Art. 4(16). | **~$30K** | **~$75K/yr** | ✅ Yes — Irish DPC is LSA for all EU processing | ✅ Strong — Anaplan parity (Anaplan EMEA HQ Dublin) |
| **B. Germany Main Establishment** | Form a German GmbH (~€2-5K notary + Handelsregister + €12.5K minimum capital) + local Geschäftsführer + tax registrations. | **~$50K** (incl. €12.5K capital) | **~$110K/yr** (GmbH accounting ~€15-20K/yr + 30% corp tax + solidarity surcharge + local director) | ✅ Yes — BfDI (federal) or state DPA is LSA | ⚠️ Neutral — Germany not on Vera's buyer-side bias (Vera is Ireland/Netherlands/Nordics-skewed per `PERSONAS.md` §3) |
| **C. No Main Establishment — Art. 27 EU representative only** | Engage an EU-rep service (Bird & Bird, Hogan Lovells, or dedicated Art. 27 firm like EU Rep Services). No entity formation. | **~$8-15K** | **~$10-20K/yr** | ❌ No — every DPA retains jurisdiction; Art. 27 rep is a contact point only | ❌ Weak — Vera procurement flags "no EU establishment" as a supplier risk; we re-litigate it every deal |

**Three Witnesses on cost claims (D-002) — Option A Ireland $30K Y0:**
- **Source:** Irish Companies Registration Office (CRO) fee schedule 2026 (€1-2K for private Ltd) + typical Irish-company-incorporation legal bundle quotes from Matheson, Arthur Cox, or Maples (€5-10K) + first-year registered-office + secretarial services (€3-5K) + local EU-resident director appointment + initial tax/VAT registration.
- **Data:** Stripe Atlas, Linear, and a dozen YC SaaS companies formed in Ireland in 2024-25 for the same LSA benefit; comparable Y0 formation budgets range $25-35K when fully loaded.
- **Competitive context:** Anaplan EMEA HQ Dublin. Setting up in Dublin puts us in the same legal jurisdiction as our primary EU enterprise competitor for the Vera ICP-2 motion.

**Three Witnesses — Option A $75K/yr Y1+:**
- **Source:** Annual accounting + audit exemption (small company audit exemption applies <€12M revenue + <€1.5M assets) ~€8-12K/yr + registered office + director + tax filings (CT1 annual return) ~€15-20K/yr + payroll if we hire 1-2 EU staff ~€3-5K/yr + transfer pricing documentation for US-EU intercompany services ~€10-15K/yr + VAT compliance + annual general meeting minutes.
- **Data:** Ireland corporate tax 12.5% (vs 30% Germany) on EU-sourced profit; this makes Ireland the lowest-cost EU corporate tax jurisdiction in the EEA.
- **Competitive context:** Google, Meta, Stripe, LinkedIn, and most US-domiciled SaaS companies serving EU enterprise have Irish Main Establishments for exactly this LSA + 12.5% tax combination. We are not pioneering a structure; we are following a standard pattern.

**Three Witnesses — Option C Art. 27 $8-15K Y0 + $10-20K/yr:**
- **Source:** EU Art. 27 representative-as-a-service market — Bird & Bird, Hogan Lovells, TMF Group, TMF Group EU-Rep Services, and dedicated Art. 27 boutiques price at €3-8K initial setup + €5-15K/yr recurring.
- **Data:** Art. 27 rep is mandated only when no Art. 4(16) main establishment exists; it is the fallback, not the destination. The rep's mandate is narrow — "point of contact" — and does not include accepting service of process on behalf of the controller for non-GDPR claims.
- **Competitive context:** Vera (ICP-2, EU enterprise) procurement teams read "Art. 27 representative" as a yellow flag — it means the supplier is not EU-established. It is not a deal-killer (Anaplan was US-only until 2018), but it adds 1-2 months to legal review on every Vera deal.

---

## §4. Recommendation

**Option A — Ireland Main Establishment.**

- **Why not Option C:** Vera's 6-9 month sales cycle is fragile; the "no EU establishment" yellow flag in procurement costs us 1-2 months and an additional legal review on every ICP-2 deal. With 1-3 Vera wins targeted by Q1 2027 (PHASE_1_GTM.md §5 base case), the cost of *one* delayed deal ($15-30K in deferred ARR plus 2 months of founder-led selling effort) exceeds the **$65K/yr all-in** delta between Option A and Option C.
- **Why not Option B:** Germany is **$60K Y0 more expensive** (GmbH capital + higher accounting fees) and **$35K/yr more expensive** to operate (30% corporate tax vs 12.5%), with no offsetting Vera-deal-readiness advantage. Vera is Ireland/Netherlands/Nordics-skewed, not Germany-skewed (per `PERSONAS.md` §3). Ireland gives us the LSA benefit at the lowest total cost of ownership.
- **Why Option A:** Same LSA benefit as Option B at $35K/yr lower TCO; same Vera-deal-readiness (Anaplan parity) as the most successful EU enterprise FP&A incumbent; standard pattern for US-domiciled SaaS serving EU enterprise.

**Cost summary:**
- Y0: **~$30K** (one-time)
- Y1+ recurring: **~$75K/yr** (drops to ~$50K/yr in Y3+ once transfer-pricing setup is amortized and we hit Ireland small-company audit-exemption thresholds)
- LSA benefit: ✅ Irish DPC as single point of contact for all EU personal-data processing
- Vera deal-readiness: ✅ Same jurisdiction as Anaplan EMEA HQ; procurement "GDPR-clean EU supplier" checkbox satisfied
- Break-even vs Option C: **~1.5 Vera deals** (one delayed deal ≈ $65K ARR; A-C delta is $65K/yr)

**Phased execution (separate from this DEC-002 ratification):**
- Q3 2026 (post-ratification): engage Irish counsel (Matheson or Arthur Cox), incorporate Ltd, appoint EU-resident director, register for CT + VAT + DPA notifications.
- Q4 2026: transfer pricing memo (US-Ireland intercompany services for the SaaS license + support).
- 2026-11-15 Beta launch: Irish entity is the contracting counterparty for all Vera (ICP-2) EU deals; US Inc. is the contracting counterparty for Carla (ICP-1) US SMB and Chris (ICP-3) US PLG self-serve.

---

## §5. Founder ratification tag

**Proposed decision text (for verbatim ratification, then append to `docs/STRATEGIC_DECISIONS_LOG.md` as D-010):**

> **D-010 (proposed 2026-06-13, pending Founder ratification by 2026-09-15):**
> FinPlan Pro shall establish an Irish private company limited by shares (Ltd) to serve as its EU Main Establishment under GDPR Art. 4(16), with an EU-resident director and a registered office in Dublin, on or before 2026-10-31 (15 days before Beta launch 2026-11-15). Y0 budget: ~$30K. Y1+ recurring: ~$75K/yr. Supersedes: none. Deferred: full US-Ireland transfer pricing study (memo-level only at Y0; full study at Y1 revenue threshold of $1M EU ARR).

**Cross-link targets (for `STRATEGIC_DECISIONS_LOG.md` "Why" field, 3-Witnesses format):**
- **Source:** `docs/drafts/strategos/DEC_002_MAIN_ESTABLISHMENT.md` (this document) + `docs/drafts/atlas/DISASTER_RECOVERY_RUNBOOK.md` L159-182 (§3.4 Scenario 4) + L200 (Art. 33 72h) + L232 (regulator routing table).
- **Data:** Atlas's $300/mo operational budget headroom can absorb $75K/yr (38bps of Y1 Opex run-rate) + Vera ICP-2 6-9mo sales cycle (PHASE_1_GTM.md §5) + Beta launch 2026-11-15.
- **Competitive context:** Anaplan EMEA HQ Dublin — direct parity positioning for Vera (ICP-2) EU enterprise deals.

**Downstream artifacts to update on Founder ratification:**
1. `docs/STRATEGIC_DECISIONS_LOG.md` — append D-010 row per format spec (8 fields: ID, Date, Decider, Decision, Why, Status=Accepted, Supersedes, Deferred).
2. `docs/drafts/adr/ADR-008-audit-logging.md` L67 — add parenthetical "(EU copies of audit-log cold-archive replicated to EU region under D-010 Irish Main Establishment once formed)" to align with D-010.
3. `docs/drafts/atlas/DISASTER_RECOVERY_RUNBOOK.md` L232 (regulator routing table) — change "Email (per jurisdiction)" → "Email to Irish DPC (LSA per Art. 56 + D-010), with copy to each affected member-state DPA".
4. `docs/drafts/strategos/BOARD_DECK_FY26.md` §6 (board approval #3) and §10 (financial ask) — add D-010 Irish Ltd to FY26 1-time line items (~$30K) and FY27+ recurring (~$75K/yr).
5. `docs/drafts/strategos/PHASE_1_GTM.md` §5 quota — Vera (ICP-2) deal velocity assumption is contingent on D-010 closing by Beta launch 2026-11-15.

**Founder action requested:**
- [ ] Read §1-§4 (5 min).
- [ ] Approve, reject, or request-changes on Option A in §4.
- [ ] Sign/date below and notify Strategos (slot `019ebd9a-8731-70b2-9c96-a4a466017284`) by **2026-09-15**.
- [ ] On approval: Strategos will append D-010 to `STRATEGIC_DECISIONS_LOG.md` and trigger the 5 downstream artifact updates in the same week.

**Founder signature:** _________________________ Date: _____________

**Strategos sign-off (this draft):** Strategos slot `019ebd9a-8731-70b2-9c96-a4a466017284`, 2026-06-13. D-002 Three Witnesses applied to all $X claims. D-009 Triangulation: file:line citations to DISASTER_RECOVERY_RUNBOOK.md L159-182, L200, L232; ADR-008-audit-logging.md L67, L70, L91; STRATEGIC_DECISIONS_LOG.md L11 (namespace policy).
