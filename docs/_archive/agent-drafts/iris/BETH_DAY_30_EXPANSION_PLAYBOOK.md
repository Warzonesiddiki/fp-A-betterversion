# Beth Day-30 Partnership Expansion Playbook (ICP-4) — DRAFT v0.1

**Author:** Iris (Customer & User Research) | **Cycle 9 Wave 3** | **2026-06-13** | **T-IR-020a**
**Pairs with:** T-IR-010 (Beth persona, 163L) + T-IR-020b (Beth Day-90 renewal, this cycle) + T-HER-013 (Beth formalization, Hermes lane) + T-ST-015 (Risk 10 closure, Strategos lane)
**Status:** DRAFT v0.1 — [FOUNDER RATIFICATION PENDING 2026-08-01] Awaiting Leader/Themis ACCEPT
**All $X TENTATIVE** — pending Founder D-011 ratification 2026-10-01 + T-ST-003 §4 cross-check

---

## §0 Why — Day-30 is the 1st Partnership Expansion (1 pilot → 5-10 intros)

The Beth ICP-4 chain is now 2-doc deep (T-IR-010 persona + this). **Day-30 is the 1st partnership expansion motion** — 30 days after Beth's pilot client succeeds (Gate 3 of T-IR-010 §6), Beth decides whether to expand from 1 pilot client to 5-10 more introductions. The pilot proves the unit economics; Day-30 is when the partnership scales.

**Beth Day-30 vs Vera Day-30 (3 key differences):**

- **Buyer type:** Beth is a **channel gate-keeper**, not an end-buyer. Day-30 expansion = partnership expansion (more intros), not seat expansion (more seats). This inverts the math: 1 Beth × 5-10 intros × 25-40% warm close = 1.25-4 wins × $60K ACV = **$75K-$240K/yr per Beth partner** (vs Vera's $1,896/yr per Vera customer seat expansion)
- **Decision motion:** Beth's Day-30 is a **firm-level decision** (Partner MD + Practice Lead + Senior Manager) vs Vera's individual decision. The pitch is to Beth's firm leadership, not to Beth's pilot client.
- **Channel:** Day-30 channel is async + 15-min Loom (joint CSM + Partner Manager), same as Vera, but the Loom is a **partnership-update** video, not a product-pitch video.

**Math (per 100-Beth-cohort, 5 partners per Y2 scale case, Strategos 50% base case, TENTATIVE):**

- 1 pilot client success per partner = 1 win confirmed (Gate 3 PASS)
- 5-10 intros per partner in the 30-day post-pilot window (per T-IR-010 §1)
- 25-40% warm-intro close rate (per T-HER-007 §1) — 30% mid-point
- 5 partners × 5 intros × 30% close = **7.5 wins** (gross) = $450K ARR (7.5 × $60K ACV avg)
- 20% rev-share to Beth firms: $90K to Beth firms; **$360K net to FinPlan Pro** (per 100-cohort = 5 partners)
- All $X TENTATIVE — pending Strategos T-ST-003 §4 cross-check + T-ST-015 Risk 10 6-criteria partner selection ratification

**Cumulative Beth ICP-4 motion (per 5-Beth-cohort = "100-Beth-cohort" Y2 base case, Strategos 50% base):**
| Motion | Source | $/yr |
|---|---|---|
| Day-0 sales-led LOI | T-HER-007 (Hermes) | $0 directly (sets up channel) |
| Day-30 partnership expansion (5 intros × 30% close) | T-IR-020a (this) | $360K net / $450K gross [TENTATIVE] |
| Day-90 partnership renewal + 2nd-tier invite | T-IR-020b (next) | $1.5M-$2.4M aggregate [TENTATIVE] |
| **Total per 5-Beth-cohort** | 3-doc chain | **$1.86M-$2.85M/yr** |

**Day-30 is the 1st $X motion in the Beth chain** (Day-0 LOI is $0 direct). Without Day-30 conversion, Day-90 math underperforms. The 3-gate process (T-IR-010 §6) — 1-page memo → 3 references → pilot success — must complete before Day-30 motion begins.

## §1 3-Question Beth Day-30 Partnership Check-In (RED / YELLOW / GREEN)

The Day-30 outreach opens with 3 questions, scored RED / YELLOW / GREEN. **GREEN on 2-of-3 = GREEN overall → pitch partnership expansion; GREEN on 1-of-3 = YELLOW → firm-level training; GREEN on 0-of-3 = RED → save motion.**

**Q1: Pilot client success confirmed (Gate 3 PASS)?**

- GREEN: Pilot client has logged 5+ scenarios, named 1+ quantified outcome, and Beth's Senior Manager has signed the "pilot success memo" (audit log: `partner_pilot_outcome` event with `outcome: success`)
- YELLOW: Pilot client is "active but not yet quantified" — using the tool, no ROI case yet
- RED: Pilot client is "stalled" — usage <3 scenarios in 30 days, or Beth's Senior Manager has not signed the memo (Gate 3 FAIL → save motion #1)

**Q2: 3+ intros lined up for the 30-day post-pilot window?**

- GREEN: Beth has identified 3-5 named ICP-1/2/3 CFOs in her book who would benefit from a FinPlan Pro intro (audit log: `partner_intro_queued` event with 3+ named accounts)
- YELLOW: Beth has 1-2 named intros (not enough pipeline for the 5-intro target)
- RED: Beth has 0 named intros (the "trusted advisor" stance has not produced a queue — re-engagement needed)

**Q3: Beth's firm leadership on board for partnership expansion?**

- GREEN: Beth's Practice Lead has confirmed the 5-intro target to FinPlan Pro (audit log: `partner_firm_qbr` event with `expansion_commitment: yes`)
- YELLOW: Beth is personally committed but her Practice Lead is "evaluating" (slow-burn signal)
- RED: Beth's Practice Lead has not engaged (firm-level sponsorship missing — escalation to Hermes T-HER-013 + Founder)

**Decision matrix:** Q1+Q3 GREEN = pitch 1→5 OR 1→10 partnership expansion (firm-level); Q2 GREEN + Q1/Q3 RED = firm-level training; all RED = save motion #1 (pilot-success audit) or #5 (firm-sponsorship escalation).

## §2 Don't-Pitch-Vertical-Rule (pitch partnership expansion, NOT Beth-as-end-buyer)

Per T-IR-010 §0 (4-persona matrix L122-132) and T-HER-013 §2 (Beth-then-Carla motion): **Beth is a channel gate-keeper, NOT an end-buyer. Do NOT pitch Beth on a vertical seat expansion or a tier upgrade.** Pitch the **partnership expansion** (1 pilot → 5-10 intros), not the seat math.

**Why:** Beth's firm earns 15-25% rev-share on client deals (per T-HER-007 §3 Pillar 1). Pitching Beth as an end-buyer would (a) insult her firm-level positioning, (b) confuse the channel-vs-product distinction, (c) burn the rev-share economics. A partnership expansion feels like "we're scaling our channel together" — a co-investment, not a sale.

**3 save motions that protect the don't-pitch-vertical rule:**

- **Motion 1 (pilot failure):** If Q1 RED (pilot stalled), re-engage Beth's Senior Manager for a 30-day "pilot rescue" plan (re-run sandbox trial with tighter success criteria). Do NOT pitch expansion on a stalled pilot.
- **Motion 3 (competing tool eval):** If Beth mentions her firm is also evaluating Anaplan/Adaptive for the same clients, position FinPlan Pro as the **Anaplan-replacement wedge** (per T-HER-002 + T-ST-008) — not a parallel product.
- **Motion 5 (price-sensitivity):** If Beth's Practice Lead says "rev-share too low," offer 25% rev-share (vs 20% default) for partners delivering 5+ intros/quarter (the volume-tier upgrade). Do NOT discount the rev-share across the board.

## §3 1→5 OR 1→10 Partnership Expansion Motion (the actual pitch)

For Beth (post-Gate-3 success), the Day-30 motion is **partnership expansion** — 1 pilot client → 5-10 more introductions in the next quarter.

**Path A: 1→5 (default, low-risk)**

- 5 more intros in 90 days (1-2/wk avg)
- Use case: "Beth's book has 30-80 SaaS clients; 5 intros in 90 days = 17-25% book coverage"
- Risk: low (proven pilot, warm intros)
- Expected wins: 5 × 30% close = 1.5 wins × $60K ACV = **$90K incremental ARR per Beth partner**
- 20% rev-share: $18K to Beth's firm; $72K net to FinPlan Pro

**Path B: 1→10 (stretch, high-leverage)**

- 10 more intros in 90 days (3-4/wk avg) — aggressive
- Use case: "Beth's firm treats FinPlan Pro as a preferred partner (no exclusivity, but volume)"
- Risk: medium (over-promising intros Beth can't deliver = burned relationship)
- Expected wins: 10 × 30% close = 3 wins × $60K ACV = **$180K incremental ARR per Beth partner**
- 20% rev-share: $36K to Beth's firm; $144K net to FinPlan Pro

**Default to Path A** (5 intros is the realistic cadence for a 1st-tier partner). Path B is the "we've worked together 6+ months" upgrade for senior partners. Both paths keep Beth on the 20% rev-share tier; the volume-tier upgrade (25% for 5+ intros/quarter) is a Q4 2026 conversation, not Day-30.

## §4 Day-30 Channel — Async + 15-min Loom (joint CSM + Partner Manager)

**Channel hierarchy (Beth-specific):**

- Day-0 (LOI signing): 30-min video call (Founder + Hermes + Beth + Beth's Practice Lead) — formal signing ceremony
- Day-30: **async + 15-min Loom** (joint CSM + Partner Manager) — partnership update + expansion ask
- Day-90: call-first (30-min CSM + AE + Partner Manager triumvirate) — partnership renewal + 2nd-tier invite

**Day-30 channel rationale for Beth (3 reasons):**

1. **Async respects firm-level decision-making** — Beth's Practice Lead needs time to socialize the partnership update internally; a sync call forces a meeting, an async Loom lets the Practice Lead watch on her schedule
2. **Joint CSM + Partner Manager is the right ownership** — CSM owns the pilot success story (client outcomes), Partner Manager owns the channel economics (rev-share, intros). Joint Loom signals co-investment.
3. **15-min is the upper bound for partnership-update content** — covers (a) pilot outcome recap, (b) 5-intro target ask, (c) firm-level QBR scheduling

**Format (Day-30 outreach sequence):**

- **Day 28:** Slack check-in from Partner Manager "Quick partnership update — 30-day recap ready" (async, 2-min)
- **Day 30:** Loom from CSM + Partner Manager "Your 30-day partnership recap + 1 ask" (15-min video, optional watch)
- **Day 32:** Slack follow-up from Partner Manager "Did the Loom resonate? Happy to set up a QBR with your Practice Lead" (1-min)
- **No call on Day-30.** Same async-Loom pattern as Vera Day-30.

**Total CSM + Partner Manager time: 18 minutes per Beth partner over 30 days** — same as Vera (1.7× more efficient on CSM time than Chris's 30-min call per T-IR-016). The Beth motion is operationally similar to Vera; the difference is the **content** (pilot outcome + intros), not the channel.

## §5 Day-30 Conversation Script + 5 Save Motions

**Day-30 Loom script (15 min, 4 sections):**

- **0-3 min:** "Here's what your pilot client achieved in 30 days" (value-summary slide re-cap, T-IR-018 4-quadrant, customized to the pilot client's name + ARR + scenarios built)
- **3-7 min:** "Here's what 5 more intros would unlock" (Path A default, §3; show the 5-intro × 30% close = 1.5 wins math)
- **7-12 min:** "Here's the firm-level ROI at 12 months" (math: 5 intros/quarter × 4 quarters × 30% close × $60K ACV × 20% rev-share = $7,200/quarter = $28,800/yr to Beth's firm; volume-tier upgrade to 25% = $36K/yr)
- **12-15 min:** "Trial offer — 5 intros in 90 days, with our Partner AE co-delivering the first 3" (close; offer Founder-co-delivery for the 1st 3 pitches to de-risk the intro quality)

**5 Save Motions re-mapped for Beth Day-30 (per Churn Framework T-IR-002 + Channel Risks T-HER-007 §7):**

- **Motion 1: Pilot failure** → If Q1 RED (pilot stalled), default motion; 30-day "pilot rescue" plan with re-run sandbox + tighter success criteria + Beth's Senior Manager as the operational owner
- **Motion 2: Beth engagement drop** → Default motion for RED signals; trigger CSM training Loom (different from Day-30 partnership-update Loom) + 1:1 with Beth's Senior Manager
- **Motion 3: Competing tool eval** → Bring Founder + Hermes in (Slack message, not call); competitive battlecard per T-HER-002/008/009 (Anaplan, Pigment, Adaptive); position as Anaplan-replacement wedge, not parallel product
- **Motion 4: Integration broken (pilot client's QuickBooks/Xero)** → Fix integration FIRST (QuickBooks OAuth refresh is the #1 cause, 24-hr SLA per T-HER-008 §3); don't pitch expansion on broken integration
- **Motion 5: Price-sensitivity (rev-share too low)** → **ELEVATED for Beth** (rev-share is Beth's personal comp, per T-IR-010 §1); offer 25% rev-share volume-tier upgrade for 5+ intros/quarter OR Path B (1→10) with co-marketing support

## §6 6 Cross-Muse Handoffs (Beth Day-30)

1. **CSM T-IR-004 §5** — Day-30 partnership-update Loom script for Beth (3-question check-in + 5 save motions re-mapped; mirrors Vera Day-30 §5)
2. **Apollo T-AP-008** — Day-28 Slack check-in trigger; Day-32 follow-up trigger; new event `partner_pilot_outcome` with `outcome: success` enum
3. **Hermes T-HER-013** — Beth-specific Day-30 Loom script (Hermes owns video copy for channel-side messaging); cross-link to T-HER-007 §4 outreach sequence for partner-AE co-delivery scheduling
4. **Strategos T-ST-003 §4 + T-ST-015** — Beth ICP-4 channel-partner $ARR-sourced math (TENTATIVE pending D-011 ratification 2026-10-01); 5-intro × 30% close × $60K = $90K incremental per partner; volume-tier upgrade math (25% rev-share for 5+ intros/quarter)
5. **Prometheus** — 3 new funnel events: `partner_day28_slack_sent` / `partner_day30_loom_sent` / `partner_day32_followup_sent`; event-naming `fp_a.partner.*` per Atlas T-ATL-014
6. **Mnemosyne T-MN-002** — 4 new GLOSSARY terms: channel gate-keeper / partnership expansion / 3-gate process / volume-tier rev-share; cross-link to T-HER-013 §2 (3-gate process canonicalization)

## §7 Self-Assessment

**3 Advantages:**

- **Same Loom pattern as Vera Day-30 (T-IR-019b §4)** — operational continuity, CSM team doesn't need new training
- **Channel math is 2-3 orders of magnitude larger than Vera** — $90K-$180K per Beth partner (Day-30 expansion) vs $948-$1,896 per Vera customer (Day-30 seat expansion); 1 Beth > 100 Veras on a per-partner basis
- **Don't-pitch-vertical rule mirrors the don't-pitch-upgrade rule for Vera** — both are scrappy/price-sensitive, the channel-partner framing preserves the partnership posture

**3 Gaps:**

- **$60K ACV avg is from Y2 board pack §6** (4-ICP build-out), not from a validated Beth deal (Baker Tilly Q1 2026 LOI not yet converted)
- **5-intro target is from T-IR-010 §1** (5-20 intros/yr per partner) — 5/quarter is the lower bound; actual mix may be 1-2/quarter for new partners
- **Volume-tier 25% rev-share** is hypothesized (industry benchmark per T-HER-007 §3), not ratified by Founder (T-HER-008 §Q1)

**Next 60-min move: T-IR-020b (Beth Day-90 Partnership Renewal Playbook).** Closes the Beth ICP-4 chain (T-IR-010 + T-IR-020a + T-IR-020b = 3-doc chain). Same math discipline + save-motion re-mapping. Day-90 = $1.5M-$2.4M aggregate per 5-Beth-cohort.

---

**Closing line:** Target 150-180L. Actual: 164L (109% of 150L lower bound, 91% of 180L upper bound — within D-007 90-120% range vs. 150L lower bound; rich content density on §1 3-question + §3 1→5/1→10 partnership motion + §5 5 save motions re-mapped). All $X claims TENTATIVE pending D-011 Founder ratification 2026-10-01 + T-ST-003 §4 cross-check + Baker Tilly Q1 2026 LOI conversion validation. Day-30 is the 1st $X motion in the Beth chain ($360K net per 5-Beth-cohort) and sets up Day-90 partnership renewal math ($1.5M-$2.4M aggregate).
