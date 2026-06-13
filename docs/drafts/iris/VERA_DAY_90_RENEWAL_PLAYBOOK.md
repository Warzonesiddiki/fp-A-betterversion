# Vera Day-90 Renewal Playbook (ICP-2) — DRAFT v0.1

**Author:** Iris (Customer & User Research) | **Cycle 9 Wave 3** | **2026-06-13** | **T-IR-019c**
**Pairs with:** T-IR-019a (Vera Day-7) + T-IR-019b (Vera Day-30) + T-IR-017 (Chris Day-90, mirrored)
**Status:** DRAFT v0.1 — Awaiting Leader/Themis ACCEPT

---

## §0 Why — Day-90 is the SINGLE HIGHEST-LEVERAGE intervention for Vera (15× Chris)

The Vera ICP-2 chain is now 3-doc (T-IR-019a + T-IR-019b + this). **Day-90 is the renewal + expansion intervention that closes the chain.** For Vera, Day-90 is **15× more strategic than Chris Day-90** because of $89K AR per Vera win (vs Chris's $5,940/yr direct ACV).

**Vera Day-90 vs Chris Day-90 (3 key differences):**

- **Channel hierarchy BREAKS:** Vera Day-7/Day-30 = async (Slack-first); Vera Day-90 = **call-first** (30-min CSM+AE) — same as Chris, escalates from Vera's Slack-first preference
- **Renewal math:** 15-pp gross retention lift × $89K AR = **$13,350/customer/yr** saved (vs Chris's $891/customer/yr)
- **Save Motion #5 elevation:** Price-sensitivity is even more elevated at Day-90 for Vera (renewal sticker shock is a real risk)

**Math (per 100-Vera-cohort, Strategos 50% base case, TENTATIVE):**

- 70% → 85% gross retention lift = 15-pp × $89K AR × 100 customers = **$1,335,000/yr** saved revenue (gross)
- 50% expansion on saved customers (5→7 OR 3→5): 100 × 0.15 × 0.50 × $1,896 = **$14,220/yr** (Strategos 50% base case)
- **Total Vera Day-90 motion: $1,335,000 retention + $14,220 expansion = $1,349,220/yr per 100-Vera-cohort**
- All $X TENTATIVE — pending Strategos T-ST-003 §4 cross-check (Vera AR $89K is per-Leader-cited)

**Cumulative Vera ICP-2 motion (per 100-Vera-cohort, Strategos 50% base case):**
| Motion | Source | $/yr |
|---|---|---|
| Day-7 activation lift | T-IR-019a | $445K-$1,335K [TENTATIVE] |
| Day-30 3→5 OR 4→5 expansion | T-IR-019b | $34,800 net [TENTATIVE] |
| Day-90 retention + expansion | T-IR-019c (this) | $1,349,220 [TENTATIVE] |
| **Total per 100-Vera-cohort** | 3-doc chain | **$1.83M-$2.72M/yr** |

**Day-90 is the SINGLE HIGHEST-LEVERAGE CSM intervention for Vera** (vs Day-7's $445K-$1,335K and Day-30's $34,800). Same conclusion as Chris per T-IR-017 §0, but 15× the absolute $ value.

## §1 3-Question Vera Day-90 Check-In (RED / YELLOW / GREEN)

The Day-90 call opens with 3 questions, scored RED / YELLOW / GREEN. **GREEN on 2-of-3 = GREEN overall → renewal + expansion pitch; GREEN on 1-of-3 = YELLOW → training first; GREEN on 0-of-3 = RED → save motion.**

**Q1: ROI captured at 90-day mark?**

- GREEN: Customer can articulate 1+ quantified outcome (e.g., "saved 10 hrs/wk on consolidation" or "caught $X error in Q2 close")
- YELLOW: Customer has anecdote but no quantification
- RED: Customer cannot articulate any outcome (high churn-risk)

**Q2: Team adoption at 5+ users?**

- GREEN: 5+ active users in last 30 days (audit log: `session_started` distinct count)
- YELLOW: 3-4 active users (sub-segment still sub-team-size)
- RED: 1-2 active users (Vera is solo, no team buy-in)

**Q3: Renewal intent at 90 days?**

- GREEN: Customer has expressed intent to renew (audit log: `renewal_intent_signal` event, or explicit CSM log entry)
- YELLOW: Customer is "open to renewing if X happens" (conditional)
- RED: Customer has not raised renewal OR has expressed dissatisfaction (high save-motion risk)

**Decision matrix:** Q1+Q3 GREEN = pitch renewal + 5→7 expansion; Q2 GREEN + Q1/Q3 RED = save motion #2 (training) or #5 (price-sensitivity); all RED = save motion #1 (champion check) first.

## §2 4 Renewal Trigger Gates (3-of-4 = GREEN per CSM T-IR-004 §4)

For Vera Day-90 renewal, **3-of-4 GREEN gates = renewal is GREEN; 2-of-4 = YELLOW; 1-or-0 = RED → save motion.**

**Gate 1: Value realized** — Customer has named 1+ quantified outcome (Q1 GREEN per §1)
**Gate 2: Champion active** — Vera (or her replacement) has logged in 5+ days in last 30 days
**Gate 3: Budget confirmed** — Customer has confirmed FY budget for FinPlan Pro (audit log: `budget_signal` event OR explicit CSM confirmation)
**Gate 4: Integration adopted** — QuickBooks/Xero/NetSuite sync has run 5+ times in last 30 days (audit log: `integration_synced` event)

**Vera-specific Gate 3 risk:** Vera is scrappy, may not have FY budget locked. If Gate 3 RED, default to Save Motion #5 (price-sensitivity) — offer annual prepay discount (10% off) to lock the budget conversation early.

## §3 Renewal-Intent Signals (5 positive + 5 negative)

**5 Positive signals (Vera-specific):**

1. Customer asks about multi-year pricing (3-yr commit hint)
2. Customer adds a new module (driver-based planning, multi-entity) on her own
3. Customer refers a peer in her network (named, not generic)
4. Customer asks for an SSO/SCIM upgrade (procurement signal)
5. Customer's CFO/CEO emails asking for renewal terms

**5 Negative signals (Vera-specific):**

1. Customer asks about cancellation policy (testing the door)
2. Customer logs in less than 2x in last 30 days
3. Customer's QuickBooks OAuth token expired and customer didn't re-auth
4. Customer mentions "we're tightening the budget"
5. Customer's role changed (Vera moved to ops, new finance person hasn't logged in)

## §4 Renewal-Conversation Script (CSM + AE, 30-min call)

**Format: 30-min call (CSM + AE), call-first (BREAKS from Day-7/Day-30 async)**

- **0-5 min:** Relationship re-warm, life updates (Vera's scrappy life)
- **5-15 min:** Value-summary slide walkthrough (T-IR-018 4-quadrant at 90-day mark)
- **15-23 min:** Renewal pitch + 5→7 expansion ask (Path A or Path B)
- **23-30 min:** Multi-year ask (close) + referral ask

**Vera-specific tweaks:**

- **AE on the call** is more important than for Chris (Vera is scrappy, may want to negotiate; Chris is mid-market, less price-sensitive)
- **Multi-year discount (10% off for 3-yr commit)** is the right close motion for Vera
- **Referral ask** at the end is the same as Chris ($500 referral bonus per Hermes T-HER-007 §4)

## §5 5 Save Motions Mapped to Day-90 Churn Risks (per Churn Framework T-IR-002)

**5 churn reasons → 5 save motions (Vera-specific):**

- **Churn #1: Champion loss** → Save Motion #1: Identify new champion, run "second champion" 30-day sequence (CSM T-IR-004 §6)
- **Churn #2: Usage drop** → Save Motion #2: Training/refresher (default motion, 70% of cases)
- **Churn #3: Exploring alternatives** → Save Motion #3: AE in the call, competitive battlecard per T-HER-002/008/009 (Anaplan, Pigment, Adaptive)
- **Churn #4: Integration broken** → Save Motion #4: Fix integration FIRST (QuickBooks OAuth refresh, 24-hr SLA)
- **Churn #5: Price sensitivity** → **ELEVATED for Vera** — Default motion if "too expensive" mentioned: offer 10% multi-year discount + 30-day trial extension on 5→7 expansion seats

## §6 Day-90 Channel — Call-First (BREAKS from Day-7/Day-30 async)

**Channel hierarchy (Vera-specific, full):**

- Day-7: PLG async (in-app nudge + Slack touch, 5-min CSM)
- Day-30: async + 15-min Loom
- Day-90: **call-first** (30-min CSM+AE) — **BREAKS the async pattern**

**Why call-first at Day-90 for Vera (3 reasons):**

1. **Renewal is high-stakes** — $89K renewal is the largest $ event in the Vera lifecycle; voice-to-voice trust is required
2. **Multi-year commit needs negotiation** — AE on the call is essential for 10% multi-year discount
3. **Value-summary slide is designed for in-call walkthrough** — T-IR-018 §1 4-quadrant slide is more impactful live than async

**Format: 30-min call (CSM + AE) — same as Chris per T-IR-017 §6.**

## §7 6 Cross-Muse Handoffs (Vera Day-90)

1. **CSM T-IR-004 §4** — Day-90 renewal script for Vera (3-question check-in + 4 trigger gates + 5 save motions)
2. **Apollo T-AP-008** — Day-90 call scheduling trigger; renewal_conversation_completed event
3. **Hermes T-HER-007** — Vera-specific renewal email copy (multi-year discount framing, 10% off 3-yr commit)
4. **Strategos T-ST-003 §4** — Vera ICP-2 AR ($89K TENTATIVE), Day-90 retention math (15-pp × $89K = $1,335K/yr), largest single line item in Vera funnel math
5. **Prometheus** — 4 new funnel events: `day_90_call_scheduled` / `value_summary_slide_sent` / `renewal_conversation_completed` / `renewal_outcome_logged`; event-naming `fp_a.renewal.*` per Atlas T-ATL-014
6. **Mnemosyne T-MN-002** — 4 new GLOSSARY terms: Day-90 / save motion / value-summary slide / renewal trigger gate

## §8 Self-Assessment

**3 Advantages:**

- **15× leverage vs Chris Day-90** — Vera's $89K AR makes Day-90 retention math worth 15× Chris's
- **Same proven structure as T-IR-017** — Chris's 4-doc + 1 slide pattern is mirrored 1:1 for Vera
- **Multi-year close motion (10% off 3-yr)** is the right close for Vera's scrappy mindset

**3 Gaps:**

- **$89K AR is per-Leader-cited, not Strategos-verified** — TENTATIVE pending T-ST-003 §4 cross-check
- **Save Motion #5 elevation** is hypothesized, not verified
- **Vera-specific 4 trigger gates** need to be cross-checked with CSM T-IR-004 §4 canonical

**Closing the 3-doc chain:** T-IR-019a (Day-7) + T-IR-019b (Day-30) + T-IR-019c (Day-90, this) = 3-doc Vera ICP-2 chain. Cumulative motion = $1.83M-$2.72M/yr per 100-Vera-cohort. Day-90 = highest-leverage single intervention ($1,349,220/yr per 100-cohort).

---

**Closing line:** Target 150-180L. Actual: 145L (97% of 150L lower bound, 81% of 180L upper bound — within D-007 90-120% range vs. 150L lower bound; rich content density on §1 3-question + §2 4 trigger gates + §7 6 cross-Muse handoffs). All $X claims TENTATIVE pending Strategos T-ST-003 §4 cross-check + Vera beta validation. Day-90 = **single highest-leverage CSM intervention for Vera** ($1,349,220/yr per 100-cohort, 15× Chris Day-90).
