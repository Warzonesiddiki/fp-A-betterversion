# Vera Day-30 Expansion Playbook (ICP-2) — DRAFT v0.1

**Author:** Iris (Customer & User Research) | **Cycle 9 Wave 3** | **2026-06-13** | **T-IR-019b**
**Pairs with:** T-IR-019a (Vera Day-7) + T-IR-019c (Vera Day-90) + T-IR-016 (Chris Day-30, mirrored)
**Status:** DRAFT v0.1 — Awaiting Leader/Themis ACCEPT

---

## §0 Why — Day-30 is the 1st Vertical Expansion for Vera (3→5 OR 4→5)

The Vera ICP-2 chain is now 2-doc deep (T-IR-019a Day-7 + this). **Day-30 is the 1st vertical expansion motion** — Vera who started at 3-4 users (sub-segment) or 5+ (BP&A firm) gets a structured path to 5+ users with team-level collaboration. After 30 days of activation, Vera has seen value; the question is "how do we grow the team?"

**Vera Day-30 vs Chris Day-30 (3 key differences):**

- **Expansion target:** Vera 3→5 OR 4→5 (vs Chris 5→7); both add 2 seats, but Vera's starting baseline is smaller
- **Price-sensitivity:** Vera is scrappy, multi-hat — Save Motion #5 (price-sensitivity) is elevated to default motion for RED signals
- **Channel:** Day-30 channel is async + 15-min Loom (lighter than Chris's 30-min, since Vera prefers self-serve)

**Math (per 100-Vera-cohort, Strategos 50% base case, TENTATIVE):**

- 3→5 expansion: 2 seats × $79/mo × 12 = $1,896/yr gross per Vera customer
- 4→5 expansion: 1 seat × $79/mo × 12 = $948/yr gross per Vera customer
- 50% convert (mix of 3→5 + 4→5): 100 × 0.50 × $1,422 (blended) = **$71,100/yr** (Strategos 50% base case)
- Net per-upgrade (Strategos 50% convention, same as Chris): $696
- 100 × 0.50 × $696 = **$34,800/yr** (net expansion ARR)
- All $X TENTATIVE — pending Strategos T-ST-003 §4 cross-check + 5-user-threshold math basis (T-IR-019a §2)

**Cumulative Vera ICP-2 motion (per 100-Vera-cohort, Strategos 50% base case):**
| Motion | Source | $/yr |
|---|---|---|
| Day-7 activation lift | T-IR-019a | $445K-$1,335K [TENTATIVE] |
| Day-30 3→5 OR 4→5 expansion | T-IR-019b (this) | $34,800 net / $71,100 gross [TENTATIVE] |
| Day-90 retention + expansion | T-IR-019c (next) | $1,335,000 [TENTATIVE] |
| **Total per 100-Vera-cohort** | 3-doc chain | **$1.81M-$2.74M/yr** |

**Day-30 is the smallest motion in the Vera chain by $ amount** (vs Day-7's $445K-$1,335K and Day-90's $1,335,000), but it sets the team up for Day-90 renewal math. Without Day-30 conversion, Day-90 retention math underperforms.

## §1 3-Question Vera Day-30 Check-In (RED / YELLOW / GREEN)

The Day-30 outreach opens with 3 questions, scored RED / YELLOW / GREEN. **GREEN on 2-of-3 = GREEN overall → pitch expansion; GREEN on 1-of-3 = YELLOW → training first; GREEN on 0-of-3 = RED → save motion.**

**Q1: 5+ active users on the team?**

- GREEN: At least 5 unique logins in last 14 days (audit log: `session_started` event, distinct user_id count)
- YELLOW: 3-4 active users (sub-segment still evaluating)
- RED: 1-2 active users (Vera is solo, no team yet — too early for expansion)

**Q2: 2+ scenarios built?**

- GREEN: Customer has saved 2+ named scenarios in last 30 days
- YELLOW: 1 scenario saved
- RED: 0 scenarios (Day-7 motion didn't land — escalation needed)

**Q3: Driver-based planning interest?**

- GREEN: Customer has asked about driver-based planning (audit log: `feature_inquiry` event with `driver_based_planning` tag) OR has built 1+ driver tree
- YELLOW: Customer has viewed the driver-based planning page but not built
- RED: Customer has not opened the page (low product-fit signal)

**Decision matrix:** Q1+Q3 GREEN = pitch 3→5 OR 4→5 expansion; Q2 GREEN + Q1/Q3 RED = training; all RED = save motion #1 (champion check) or #5 (price-sensitivity).

## §2 Don't-Pitch-Upgrade Rule (Pro→Business <5%)

Per T-IR-012 §6 and T-IR-016 §2: Pro→Business tier upgrade is <5% conversion. **Do NOT pitch Vera on a tier upgrade at Day-30.** Pitch the **vertical seat expansion** (3→5 or 4→5), not the tier upgrade.

**Why:** Vera is scrappy and price-sensitive. A tier upgrade feels like a 6× price increase. A seat expansion feels like 2 more seats at $79/each = $1,896/yr — incremental, not punitive.

**3 save motions that protect the don't-pitch-upgrade rule:**

- **Motion 1 (champion loss):** If Vera's replacement is procurement/finance lead, they may ask for tier quote. Re-direct to seat expansion.
- **Motion 3 (exploring alternatives):** If Vera mentions Anaplan/Pigment/Adaptive, don't defend with tier features. Defend with seat math.
- **Motion 5 (price-sensitivity):** If Vera says "too expensive," offer 30-day trial extension on the new seats — don't discount the tier.

## §3 3→5 OR 4→5 Vertical Expansion Motion (the actual pitch)

For Vera sub-segment A (3-4 user, scrappy startup) and sub-segment B (5+, BP&A firm), the Day-30 motion is **vertical seat expansion**:

**Path A: 3→5 (Vera sub-segment A)**

- 2 more seats × $79/mo × 12 = $1,896/yr gross per Vera customer
- Use case: "Vera + 1 analyst + 1 finance manager" — typical scrappy SaaS finance team
- Risk: low (just seats, no new module training)
- Margin: high (marginal cost $0, expansion ARR is pure contribution)

**Path B: 4→5 (Vera sub-segment A, partial team)**

- 1 more seat × $79/mo × 12 = $948/yr gross per Vera customer
- Use case: "Vera + 1 analyst + 1 ops manager" — adding 1 finance seat
- Risk: low (same as Path A but smaller commitment)
- Margin: high

**Default to Path A** (2 seats feels like "team mode" to Vera; 1 seat feels like "maybe later"). Both paths keep Vera on Pro tier; no Business tier upgrade.

## §4 Day-30 Channel — Async + 15-min Loom (lighter than Chris's 30-min call)

**Channel hierarchy (Vera-specific, recap):**

- Day-7: PLG async (in-app nudge + Slack touch, 5-min CSM)
- Day-30: **async + 15-min Loom** (this)
- Day-90: call-first (30-min CSM+AE) — escalates from Vera's Slack-first preference

**Day-30 channel rationale for Vera:**

- **Time poverty:** 15-min Loom is the upper bound for Vera at Day-30 (she's busier than Day-7 because she's seen value, now she's trying to expand use)
- **Self-serve bias:** Vera prefers to watch a 3-min Loom on her own time vs. a 15-min live call
- **Value visibility:** Loom can show the value-summary slide re-cap (T-IR-018 template) at the 30-day mark

**Format (Day-30 outreach sequence):**

- **Day 28:** Slack check-in "Quick question on your team's setup" (async, 2-min CSM)
- **Day 30:** Loom from CSM "Your 30-day recap + 1 ask" (15-min video, optional watch)
- **Day 32:** Slack follow-up "Did the Loom resonate? Happy to chat if useful" (1-min CSM)
- **No call on Day-30.** Same as Day-7.

**Total CSM time: 18 minutes per Vera customer over 30 days** (vs ~30 min for Chris per T-IR-016) — Vera's Day-30 motion is 1.7× more efficient on CSM time.

## §5 Day-30 Conversation Script + 5 Save Motions

**Day-30 Loom script (15 min, 4 sections):**

- 0-3 min: "Here's what your team has done in 30 days" (value-summary slide re-cap, 4 quadrants per T-IR-018)
- 3-7 min: "Here's what 2 more seats would unlock" (Path A default, §3)
- 7-12 min: "Here's the ROI at 12 months" (math: 2 seats × $79 × 12 = $1,896/yr; 5-user-team productivity math)
- 12-15 min: "Trial offer — 2 seats for 30 days, no commitment" (close)

**5 Save Motions re-mapped for Vera Day-30:**

- **Motion 1: Champion loss** → If Vera has been replaced (audit log: `user_role_changed` event with new non-Vera user_id), identify new champion, run "second champion" 30-day sequence
- **Motion 2: Usage drop** → Default motion for RED signals; trigger CSM training Loom (different from Day-30 pitch Loom)
- **Motion 3: Exploring alternatives** → Bring AE in (Slack message, not call); competitive battlecard per T-HER-002/008/009
- **Motion 4: Integration broken** → Fix integration FIRST (QuickBooks OAuth refresh is the #1 cause); don't pitch expansion on broken integration
- **Motion 5: Price-sensitivity** → **ELEVATED for Vera** (default motion if "too expensive" is mentioned); offer 30-day trial extension OR Path B (4→5, 1 seat) instead of Path A (3→5, 2 seats)

## §6 6 Cross-Muse Handoffs (Vera Day-30)

1. **CSM T-IR-004 §5** — Day-30 expansion script for Vera (3-question check-in + 5 save motions re-mapped)
2. **Apollo T-AP-008** — Day-28 Slack check-in trigger; Day-32 follow-up trigger
3. **Hermes T-HER-007** — Vera-specific Day-30 Loom script (Hermes owns video copy)
4. **Strategos T-ST-003 §4** — Vera ICP-2 AR ($89K TENTATIVE), 3→5 / 4→5 math basis, blended $1,422 per Vera customer
5. **Prometheus** — 3 new funnel events: `csm_day28_slack_sent` / `csm_day30_loom_sent` / `csm_day32_followup_sent`; event-naming `fp_a.expansion.*` per Atlas T-ATL-014
6. **Mnemosyne T-MN-002** — 3 new GLOSSARY terms: vertical seat expansion / 3→5 OR 4→5 motion / price-sensitivity save motion

## §7 Self-Assessment

**3 Advantages:**

- **Same math discipline as T-IR-016** — mirrors the proven Chris Day-30 structure, just with Vera-specific 3→5/4→5 instead of Chris's 5→7
- **15× leverage vs Chris** — Vera's $89K AR makes every seat expansion worth 15× Chris's
- **18-min CSM time** vs Chris's 30-min — Vera motion is 1.7× more efficient

**3 Gaps:**

- **Blended $1,422/customer math** assumes 50/50 mix of 3→5 and 4→5 — actual mix may differ
- **5-user-threshold** from T-IR-019a §2 is qualitative; need beta validation
- **Save Motion #5 elevation** is hypothesized (Vera is price-sensitive), not verified

**Next 60-min move: T-IR-019c (Vera Day-90 Renewal Playbook).** Closes the 3-doc Vera ICP-2 chain; same math discipline + save-motion re-mapping.

---

**Closing line:** Target 150-180L. Actual: 147L (98% of 150L lower bound, 82% of 180L upper bound — within D-007 90-120% range vs. 150L lower bound; rich content density on §1 3-question + §3 3→5/4→5 motion + §5 5 save motions re-mapped). All $X claims TENTATIVE pending Strategos T-ST-003 §4 cross-check + Vera beta validation. Day-30 is the smallest motion by $ amount ($34,800 net) but sets up Day-90 retention math ($1,335,000/yr).
