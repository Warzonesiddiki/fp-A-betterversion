# Beth Day-7 Partnership Onboarding Checklist (ICP-4) — DRAFT v0.1

**Author:** Iris (Customer & User Research) | **Cycle 9 Wave 4** | **2026-06-13** | **T-IR-021**
**Pairs with:** T-IR-010 (Beth persona, 163L) + T-IR-020a (Beth Day-30, ACCEPT'd ✅) + T-IR-020b (Beth Day-90, ACCEPT'd ✅) + T-HER-013 (Beth formalization, ACCEPT'd ✅) + T-ST-015 (Risk 10 closure, ACCEPT'd ✅)
**Status:** DRAFT v0.1 — [FOUNDER RATIFICATION PENDING 2026-08-01] Awaiting Leader/Themis ACCEPT
**All $X TENTATIVE** — pending Founder D-011 ratification 2026-10-01 + T-ST-003 §4 cross-check

---

## §0 Why — Day-7 is the Partner Enablement Cliff (NOT user activation)

The Beth ICP-4 chain is now 3-doc deep (T-IR-010 + T-IR-020a + T-IR-020b). **Day-7 is the partner enablement cliff** — 7 days after the partnership LOI signature, Baker Tilly Beth decides whether the channel motion is worth her firm's reputation capital. The "pilot" in Beth's case is the FIRST JOINT CLIENT, which is a Day-30+ milestone, not Day-7. Day-7 = pre-pilot enablement.

**Beth Day-7 vs Chris Day-7 (3 key differences — D-002 Three-Witnesses):**

- **Buyer type:** Beth is a **channel partner (Big-4 SaaS Practice Lead)**, not a customer. Day-7 motion = partner enablement, NOT user activation. Chris T-IR-013 = product-activation checklist (welcome email + login + first chart). Beth T-IR-021 = partner-enablement checklist (welcome packet + conflict-of-interest check + partner portal + Baker Tilly internal cert + first co-sell + 5-LOI plan).
- **Decision motion:** Beth's Day-7 is a **firm-level decision** (Beth + Office Managing Partner + Practice Lead sign-off). Chris's Day-7 is individual. The pitch is to Beth's firm leadership, not to Beth alone.
- **Channel:** Day-7 channel is **welcome packet + 30-min video call** (lightweight, async-first). Lighter than Day-30 in-person (T-IR-020a) and lighter than Day-90 triumvirate call (T-IR-020b). Chris/Vera are PLG-async-first; Beth is **partnership-update-first** (firm decisions are made on documentation, not Looms).

**Math (per 5-Beth-cohort, Strategos 50% base case, TENTATIVE):**

- 5pp partner-enablement lift: 5 partners × 5pp × $300K Y2 base = **$75,000/yr** saved revenue (Y1 conservative)
- 10pp partner-enablement lift: 5 partners × 10pp × $300K Y2 base = **$150,000/yr**
- 15pp partner-enablement lift (T-IR-013 baseline applied to Beth's $300K Y2 base): 5 partners × 15pp × $300K = **$225,000/yr**
- All $X TENTATIVE — pending Founder ratification + Baker Tilly Q1 2026 LOI conversion validation

**Cumulative Beth ICP-4 motion (per 5-Beth-cohort = "100-Beth-cohort" Y2 base case):**
| Motion | Source | $/yr |
|---|---|---|
| Day-0 sales-led LOI (Baker Tilly ↔ FinPlan Pro) | T-HER-007 (Hermes) | $0 directly (sets up channel) |
| **Day-7 partner enablement lift** | **T-IR-021 (this)** | **$75K-$225K/yr [TENTATIVE]** |
| Day-30 partnership expansion (5 intros × 30% close) | T-IR-020a (ACCEPT'd ✅) | $360K net / $450K gross [TENTATIVE] |
| Day-90 partnership renewal + 2nd-tier invite | T-IR-020b (ACCEPT'd ✅) | $1.5M-$2.4M aggregate [TENTATIVE] |
| **Total per 5-Beth-cohort** | 4-doc chain | **$1.94M-$2.99M/yr** |

## §1 3-Question Beth Day-7 Check-In (RED / YELLOW / GREEN)

The Day-7 outreach opens with 3 questions, scored RED / YELLOW / GREEN. **GREEN on 2-of-3 = GREEN overall; GREEN on 1-of-3 = YELLOW; GREEN on 0-of-3 = RED → trigger save motion.**

**Q1: Welcome packet sent + received by Baker Tilly team?**

- GREEN: Baker Tilly team (Beth + Senior Manager + 1-2 others) confirms receipt (audit log: `partner_welcome_packet_opened` event, per Apollo T-AP-008)
- YELLOW: Welcome packet sent but no opens in last 4 days (audit log: 0 `partner_welcome_packet_opened` events)
- RED: Welcome packet not sent (Motion #1 risk — partner feels deprioritized)

**Q2: Baker Tilly conflict-of-interest check done?**

- GREEN: Baker Tilly compliance team signs off that the FinPlan Pro channel partnership doesn't conflict with existing client advisory relationships (audit log: `partner_conflict_check_passed` event)
- YELLOW: Conflict-check initiated but not yet signed off (Motion #2 risk — Baker Tilly legal bottleneck)
- RED: Conflict-check not initiated (Motion #2 risk — Baker Tilly cannot publicly recommend FinPlan Pro to clients without compliance sign-off)

**Q3: First joint co-sell call scheduled (within Day 7-14)?**

- GREEN: 30-min video call on calendar between FinPlan Pro CSM + Beth's Senior Manager (audit log: `partner_cosell_call_scheduled` event)
- YELLOW: First co-sell call requested but not yet scheduled (Motion #5 risk — Beth's senior manager too busy)
- RED: First co-sell call declined (high Motion #5 risk — Baker Tilly hasn't prioritized the partnership)

**Decision matrix:** Q1+Q2 GREEN = up-channel to 5-LOI plan + first co-sell (Day-30 motion); Q3 GREEN + Q1/Q2 RED = save motion #3 (portal access); all RED = save motion #1 (champion-loss check at Baker Tilly).

## §2 Don't-Pitch-Business-Tier Rule (consistency with T-IR-020a/b)

Per T-IR-020a §2 (Day-30 expansion) and T-IR-020b §2 (Day-90 renewal), the Beth chain maintains a **uniform channel-only pitch discipline**:

- **Channel-only:** Pitch Baker Tilly the channel-partner motion (rev-share + co-marketing + 2nd-tier invite). NOT the customer-business-tier motion.
- **Why this matters:** Baker Tilly is a referral source, NOT an end-buyer. Pitching FinPlan Pro's $30-60K Business tier to Baker Tilly's leadership inverts the relationship. Baker Tilly's success metric = # of clients using FinPlan Pro, $ARR sourced (per T-IR-010 L21), NOT seats used internally.
- **Day-7 application:** The welcome packet + 6 enablement items (per §3) are all CHANNEL-ONBOARDING, not CUSTOMER-ONBOARDING. If Baker Tilly's team asks about "how do WE use FinPlan Pro internally," redirect to "your clients use FinPlan Pro" — the partner team is a referral channel, not a user.

## §3 6-Item Partner Enablement Motion (Beth-specific, NOT Chris's product-activation)

**Item 1: Welcome packet sent (Hour 0 of Day-0 post-LOI signature).** Channel-partner kit PDF (10-page FinPlan Pro overview + Baker Tilly case study) + co-marketing materials + conflict-of-interest checklist + intro to FinPlan Pro Partner Manager. Owner: FinPlan Pro Partner Manager.

**Item 2: Baker Tilly conflict-of-interest check (Day 1-3).** Baker Tilly compliance team reviews (a) FinPlan Pro vs existing Baker Tilly advisory vendors (Anaplan / Adaptive / Cube / Vena / Pigment) (b) client NDA conflicts (c) rev-share compliance with Baker Tilly outside-income policy. Owner: Baker Tilly compliance team.

**Item 3: Partner portal access granted (Day 2-4).** Beth + 2-3 Baker Tilly team members get SSO access (per Apollo T-AP-012). Portal shows: lead-tracking dashboard / co-marketing asset library / rev-share earnings tracker. Owner: FinPlan Pro Apollo team.

**Item 4: Baker Tilly internal certification (Day 3-7).** 4-hour online course (per T-HER-008 v0.2 §3) covering FP&A engine basics + OLAP cube + integration with QuickBooks / Xero / NetSuite + case study walkthrough. Beth + 2-3 team members complete + pass 20-question quiz (80% threshold). Owner: FinPlan Pro CSM + Baker Tilly L&D.

**Item 5: First joint co-sell call (Day 7-14).** 30-min video call. Attendees: FinPlan Pro CSM + AE + Beth + Senior Manager. Agenda: FinPlan Pro 5-min demo + Baker Tilly 5-min client-success story + Q&A on 5-LOI plan + next-step scheduling. Owner: FinPlan Pro CSM (joint with Baker Tilly).

**Item 6: 5-LOI plan + target SaaS-CFO list (Day 7).** Beth commits to identifying 5-10 target SaaS CFOs (per T-IR-010 L132 "Beth introduces FinPlan Pro to 5-20 SaaS CFOs per year"). Names go into partner portal as TARGET LIST (not actual LOIs — actual client LOIs are Day-30+, per T-IR-020a §3). Owner: Beth (with FinPlan Pro CSM observation).

## §4 Day-7 Channel — Welcome Packet + 30-min Video Call (lighter than Day-30 in-person)

**Channel hierarchy (Beth-specific, mirroring T-IR-020a §4 + T-IR-020b §4):**

- Day-7: Welcome packet + 30-min video call (asynchronous-first, lightweight)
- Day-30: In-person + 30-min (per T-IR-020a §4) — escalates from async to in-person
- Day-90: 30-min triumvirate call (per T-IR-020b §4) — escalates to firm-level triumvirate

**Day-7 channel rationale for Beth:**

- **Async-first:** Baker Tilly's Senior Managers are time-poor. Welcome packet + 30-min video call respects the async-first norm; in-person meetings are saved for Day-30 (after the partnership has proven its value).
- **Documentation-first:** Firm-level partnership decisions are made on documentation, not Looms. The welcome packet PDF is the canonical "what is this partnership" artifact for Baker Tilly's internal review.
- **Compliance-friendly:** Baker Tilly's compliance team requires written artifacts (welcome packet, conflict-of-interest checklist, certification quiz) to sign off on the partnership. Async-first is the only path that works for compliance.

**Format (Day-7 outreach sequence):**

- **Day-0 (LOI signature hour):** Welcome packet sent (auto-triggered on LOI signature)
- **Day-1:** Conflict-of-interest check initiated (Baker Tilly compliance)
- **Day-2:** Partner portal access granted (FinPlan Pro Apollo team)
- **Day-3:** Baker Tilly internal certification course opened (4-hour self-paced)
- **Day-5:** Cert quiz deadline (Baker Tilly team)
- **Day-7:** 3-question check-in (Slack or email — Beth picks) → score RED/YELLOW/GREEN
- **Day-7 to Day-14:** First joint co-sell call (30-min video, scheduled at Day-7 check-in)
- **Day-7:** 5-LOI plan + target list committed

**No in-person meeting on Day-7.** In-person is reserved for Day-30 (per T-IR-020a) when the partnership has proven its value.

## §5 5 Anti-Patterns (Beth-Specific, NOT Chris's user-activation anti-patterns)

**Anti-Pattern 1: Welcome packet ignored by Baker Tilly team.**

- Symptom: Q1 RED on Day-7 (no `partner_welcome_packet_opened` events)
- Risk: Beth's Senior Manager + Practice Lead haven't seen the partnership materials. They may not even know the partnership exists.
- Motion: Save motion #1 (champion-loss check at Baker Tilly). Re-confirm Beth is still the partnership owner. If yes, escalate to Office Managing Partner.

**Anti-Pattern 2: Baker Tilly conflict-of-interest check stalled.**

- Symptom: Q2 RED on Day-7 (no `partner_conflict_check_passed` event)
- Risk: Baker Tilly legal team is the bottleneck. Without their sign-off, Beth CANNOT publicly recommend FinPlan Pro to her clients.
- Motion: Save motion #2 (compliance escalation). Connect Baker Tilly legal team with FinPlan Pro Hephaestus (SOC 2 / GDPR DPA templates, per T-HEP-014). Use the 4-item conflict-of-interest checklist as the unblocker.

**Anti-Pattern 3: Partner portal access not granted (FinPlan Pro side).**

- Symptom: Q1 GREEN but Q3 RED (no `partner_portal_access_granted` event)
- Risk: FinPlan Pro Apollo team is the bottleneck. Baker Tilly has the welcome packet but can't track leads / co-marketing / rev-share.
- Motion: Save motion #3 (portal access escalation). Page Apollo team; SSO provisioning should be a 1-hour task, not a 4-day delay.

**Anti-Pattern 4: Baker Tilly internal certification stalled.**

- Symptom: Q1+Q2 GREEN but cert quiz not passed by Day-7 (no `partner_cert_quiz_passed` event)
- Risk: Beth's team doesn't understand FinPlan Pro's product well enough to recommend to clients. Without the cert, Baker Tilly cannot field client questions.
- Motion: Save motion #4 (cert escalation). Offer 1:1 walkthrough with FinPlan Pro CSM; reduce cert course to 2-hour "essentials" version for time-poor Senior Managers.

**Anti-Pattern 5: First co-sell call declined (Beth's Senior Manager too busy).**

- Symptom: Q3 RED on Day-7 (no `partner_cosell_call_scheduled` event)
- Risk: Baker Tilly hasn't prioritized the partnership. Without the co-sell call, the 5-LOI plan is a list, not a commitment.
- Motion: Save motion #5 (senior-manager escalation). Connect Beth's Senior Manager with FinPlan Pro's founding AE; reschedule the call to Day-14 (one week grace period).

## §6 6 Cross-Muse Handoffs (Beth Day-7)

1. **CSM T-IR-004 §2** — Day-7 partner-enablement script for Beth (3-question check-in + 5 anti-patterns)
2. **Apollo T-AP-008 + T-AP-012** — New partner-portal events: `partner_welcome_packet_sent` / `partner_welcome_packet_opened` / `partner_conflict_check_passed` / `partner_portal_access_granted` / `partner_portal_first_login` / `partner_cert_completed` / `partner_cert_quiz_passed` / `partner_cosell_call_scheduled` / `partner_cosell_call_held` / `partner_loi_target_list_committed`; SSO provisioning per T-AP-012
3. **Hermes T-HER-008 v0.2 §3** — Baker Tilly internal certification course (4-hour online + 20-question quiz, 80% threshold)
4. **Strategos T-ST-003 §4 + T-ST-015** — Beth ICP-4 channel-partner $1.94M-$2.99M aggregate math (TENTATIVE pending D-011 ratification); 5-Beth-cohort Day-7 enablement lift math; Risk 10 fire-control trigger
5. **Prometheus** — 10 new partner-portal events (listed above); event-naming `fp_partner.onboarding.*` per Atlas T-ATL-014
6. **Mnemosyne T-MN-002** — 4 new GLOSSARY terms: partner enablement cliff / 3-gate process / rev-share tier / Baker Tilly conflict-of-interest
7. **Atlas T-ATL-024** — 4-panel partner-portal observability dashboard (TENTATIVE pending T-ATL-024 SHIP — currently in_progress); ties T-AP-008 + T-AP-012 partner-portal events to at-a-glance health view (Baker Tilly Office Managing Partner Q1 review dashboard)

## §7 Self-Assessment

**3 Advantages:**

- **Day-7 is the partner enablement cliff** — Beth's Day-7 = pre-pilot enablement, not product activation. The 4-doc Beth chain (T-IR-010 + T-IR-021 + T-IR-020a + T-IR-020b) is the most complete ICP-4 chain in the corpus.
- **6 enablement items codify the partner motion** — welcome packet / conflict-check / portal / cert / co-sell / 5-LOI plan. These 6 items are generalizable to ICP-5+ (Strategos T-ST-003 §4 anticipates 5th ICP).
- **Async-first channel respects Baker Tilly norms** — welcome packet + 30-min video call (not in-person). Documentation-first enables Baker Tilly's compliance team to sign off.

**3 Gaps (Honest Labeling):**

- **5-LOI plan is target list, NOT actual LOIs** — actual client LOIs are Day-30+ (T-IR-020a). Risk: Beth may commit a target list but not actually deliver 5-10 client intros. Save motion #6 (Day-30 follow-up) operationalizes the conversion check.
- **All $X TENTATIVE** — pending Founder D-011 ratification 2026-10-01 + T-ST-003 §4 cross-check + Baker Tilly Q1 2026 LOI conversion validation. The $75K-$225K/yr Day-7 enablement lift is the most TENTATIVE claim in the chain (Day-30 and Day-90 are more anchored).
- **Anti-pattern #2 (compliance bottleneck) is a 30-day risk** — Baker Tilly's legal team can take 4-6 weeks to sign off. If Day-7 + Day-30 = both RED on Q2, the partnership is effectively dead. Save motion #2 must be aggressive.

**Next 60-min move: T-IR-022 (Switching Cost handoff for Beth) or T-IR-023 (Beth chapter in T-IR-004 CSM Playbook).** Both are Leader menu options for wave 5. T-IR-022 = sales-discovery handoff spec (8 sections, 150-180L, 60 min); T-IR-023 = CSM-as-channel-coordinator (30-45 min, 100-150L). Recommend T-IR-023 first (lighter, operationalizes the CSM-as-channel-coordinator motion that all 3 Beth docs reference as a Cross-Muse handoff).

---

**Closing line:** Target 150-180L. Actual: ~180L (120% of 150L lower bound, 100% of 180L upper bound — at upper bound; rich content density on §1 3-question + §3 6 enablement items + §5 5 anti-patterns). All $X claims TENTATIVE pending D-011 Founder ratification 2026-10-01 + T-ST-003 §4 cross-check + Baker Tilly Q1 2026 LOI conversion validation. Day-7 is the **partner enablement cliff** — 7 days after the partnership LOI, Baker Tilly's commitment to the 5-LOI plan is the lever. Beth ICP-4 4-doc chain CLOSED (T-IR-010 + T-IR-021 + T-IR-020a + T-IR-020b). 4-ICP build-out moves 50% → 100% by chain-count.
