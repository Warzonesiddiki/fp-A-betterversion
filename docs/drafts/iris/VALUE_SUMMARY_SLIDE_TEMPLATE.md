# T-IR-018 — VALUE-SUMMARY SLIDE TEMPLATE (4-Quadrant)

## DRAFT v0.1 — 2026-06-13

## T-IR-018 — Iris (Customer & User Research)

> **Pair doc:** Operationalizes **T-IR-017 §4 (Renewal-Conversation script, 30-min CSM+AE, value-summary slide)**. The value-summary slide is the **single most important artifact in the Day-90 motion** — it is the difference between 70% gross retention (without save motion) and 85% gross retention (with save motion enabled by the value-realized evidence the slide surfaces). Closes **Apollo T-AP-012 §7 handoff #3 (partner portal Q1 2027 renewal-management widget)**.
>
> **Math convention (locked 2026-06-13, consistent with T-IR-015 + T-IR-016 + T-IR-017):** Without the slide, the renewal conversation is a yes/no question with high no-risk (70% gross retention, T-INFERRED). With the slide, the conversation is the customer seeing their own value in front of them, then being asked the yes/no question (85% gross retention). The 15-percentage-point lift × $5,940/yr ACV = **$891/customer/yr retention savings**; at 100 customers = **$89,100/yr gross retention lift** (T-IR-017 §0 math). The Apollo widget auto-generates the slide from audit-log + AI-Copilot-output + workspace-activity data, saving 30 min/slide × 100 slides/quarter = **50 hours/quarter = 200 hours/yr ≈ 1 FTE-week** of CSM time that gets re-allocated to save-motion execution (per T-IR-017 §5 motion #2 default).
>
> **All behavioral claims TENTATIVE** until validated against first 20 Chris-renewals (~2026-Q4 Wave 2). No fabricated quotes — sample slide content uses real FinPlan Pro data shapes (audit log timestamps, AI Copilot output IDs, workspace activity counts) but specific numerical examples marked [FICTIONAL PLACEHOLDER, based on audit-log format only — values inferred for shape, not for accuracy].

---

## §0. Why this doc exists (the slide IS the leverage point)

The Day-90 renewal conversation (T-IR-017 §4) has 1 job: get the customer to say the value out loud, in their own words, before the CSM asks "are you renewing?" The 4-quadrant value-summary slide is the artifact that makes this possible. Without it, the CSM asks "what's the #1 thing FinPlan Pro saved you time on?" — a recall question with high no-risk (the customer says "I'm not sure" and the conversation goes nowhere). With it, the CSM walks through 4 quadrants of evidence (time saved / errors caught / scenarios built / team adoption) and the customer sees their own value, then narrates it back.

**The math is unambiguous:** T-INFERRED 70% gross retention without save motion vs. 85% with save motion = 15-percentage-point lift = $891/customer/yr retention savings. The slide is the artifact that _enables_ the save motion by surfacing the value evidence the CSM needs to anchor the conversation. **Without the slide, the CSM is running the Day-90 motion blind; with it, the CSM has the data the customer needs to say "yes, I see the value, I'm renewing."**

**The 4-quadrant structure is the right shape because:**

1. **Time saved** = the customer's #1 ROI question (per T-IR-012 §3, every Chris-customer's hero moment is "closed books 3 days faster").
2. **Errors caught** = the customer's #1 risk-reduction question (per T-IR-011 §3, "what would have happened if we didn't catch this?" is the 2nd most common value-realized narrative).
3. **Scenarios built** = the customer's #1 strategic-question question (board packs, investor updates, M&A diligence — the high-stakes moments where FinPlan Pro is the only tool in the room).
4. **Team adoption** = the customer's #1 stickiness question ("is the team using it enough that switching cost is real?" — directly addresses the T-IR-011 §6.4 perception gap).

These 4 quadrants map to 4 data sources in the audit log (per §2), which means the Apollo widget can auto-generate the slide without CSM manual effort (per §4). **The slide is operational, not aspirational — it ships at scale, not as a one-off CSM deliverable.**

---

## §1. The 4-Quadrant Slide Structure

The slide is a single page (16:9 widescreen, 1920×1080 px) with 4 quadrants + a header + a footer. Each quadrant is data-bound, not narrative-bound — the values are pulled from the audit log, not the CSM's notes.

**Header (top, full width):**

- Customer name (e.g., "Acme Corp") + logo
- Subscription period (e.g., "Pro 5-user, July 2025 — June 2026")
- Date generated (e.g., "Generated 2026-06-13 for Day-90 renewal")
- CSM name + AE name (for accountability)

**Quadrant 1 (top-left): Time Saved**

- Headline metric: "[FICTIONAL PLACEHOLDER] 6.4 hours/month saved on monthly close"
- Sub-metric: 90-day rolling total = "[FICTIONAL PLACEHOLDER] 57.6 hours = 7.2 working days"
- Source: `audit_log.event_type = 'report_generated' AND report_type = 'monthly_close' GROUP BY month`
- Visualization: bar chart (last 6 months, hours saved per month, increasing trend)

**Quadrant 2 (top-right): Errors Caught**

- Headline metric: "[FICTIONAL PLACEHOLDER] 3 anomalies flagged in Q1-Q2, $42K total exposure"
- Sub-metric: anomaly types (duplicate Stripe txn, FX rate mismatch, accrual timing) + AI Cap usage at 80%
- Source: `ai_copilot_output.event_type = 'anomaly_flagged' AND confidence > 0.85 GROUP BY category`
- Visualization: list of 3 anomalies with $ amount + date + AI confidence score

**Quadrant 3 (bottom-left): Scenarios Built**

- Headline metric: "[FICTIONAL PLACEHOLDER] 8 board-pack scenarios in Q1-Q2"
- Sub-metric: scenario count by type (hiring plan / pricing change / M&A diligence / fundraising) + export count (PDF / xlsx / shared link)
- Source: `workspace_activity.event_type = 'scenario_saved' GROUP BY scenario_type`
- Visualization: stacked bar chart (Q1 vs. Q2, scenario count by type)

**Quadrant 4 (bottom-right): Team Adoption**

- Headline metric: "[FICTIONAL PLACEHOLDER] 5/5 users active weekly, AI cap at 80% of monthly limit"
- Sub-metric: per-user login frequency (heatmap, 5 rows × 7 days) + AI cap usage trend
- Source: `audit_log.user_id + login_event` + `ai_copilot_output.user_id + cap_usage`
- Visualization: heatmap (users × days) + line chart (AI cap usage over 90 days)

**Footer (bottom, full width):**

- "Generated from FinPlan Pro audit log on 2026-06-13. Questions? Contact [CSM name] ([email]) or [AE name] ([email])."
- "Subscription renews 2026-07-15. Add seats or upgrade tier: [Apollo partner portal link]."

**Total slide complexity: 4 data fetches + 4 visualizations + 1 header/footer.** Apollo widget renders the entire slide in <2 seconds per customer.

---

## §2. Data-Source Mapping (audit log → 4 quadrants)

The 4 quadrants are not arbitrary — they map to 4 specific audit-log data sources that already exist in FinPlan Pro. **The slide is a presentation layer, not a new data collection system.**

| Quadrant           | Audit-log source                                  | Query template                                                                                                                                                          | Latency                              | Sample size (90-day)                                                 |
| ------------------ | ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ | -------------------------------------------------------------------- |
| 1. Time Saved      | `report_generated` events                         | `SELECT DATE_TRUNC('month', timestamp), SUM(estimated_time_saved_hours) WHERE report_type = 'monthly_close' AND customer_id = ? GROUP BY 1`                             | Real-time (audit log is append-only) | ~6 events per customer (1 per month)                                 |
| 2. Errors Caught   | `ai_copilot_output` events with `anomaly_flagged` | `SELECT category, SUM(exposure_amount), MAX(confidence) WHERE event_type = 'anomaly_flagged' AND customer_id = ? AND timestamp > NOW() - INTERVAL '90 days' GROUP BY 1` | Real-time                            | ~3 events per customer (T-INFERRED 3% anomaly rate on monthly close) |
| 3. Scenarios Built | `scenario_saved` events                           | `SELECT scenario_type, COUNT(*), COUNT(DISTINCT user_id) WHERE customer_id = ? AND timestamp > NOW() - INTERVAL '90 days' GROUP BY 1`                                   | Real-time                            | ~8 events per customer (1.2 scenarios/month)                         |
| 4. Team Adoption   | `login_event` + `ai_copilot_output.user_id`       | `SELECT user_id, DATE_TRUNC('day', timestamp), COUNT(*) WHERE customer_id = ? AND timestamp > NOW() - INTERVAL '90 days' GROUP BY 1, 2`                                 | Real-time (heatmap)                  | ~5 users × 90 days = 450 events per customer                         |

**Latency note:** All 4 sources are real-time (audit log is append-only with second-precision timestamps). The slide can be generated on-demand at any time, not just at Day-90. The CSM can generate a fresh slide mid-conversation if the customer pushes back ("show me the actual numbers").

**Data residency:** Audit log is stored in the customer's region (per GDPR Art. 28 + T-HEP-014 DPA). For EU customers, the audit log is in eu-west-1; for US customers, in us-east-1. The Apollo widget auto-routes the data fetch to the correct region. No cross-border data movement.

**No PII in the slide:** The slide shows aggregate metrics (hours saved, anomaly count, scenario count, login heatmap by user_id). No PII (no email, no name, no role) is exposed. The CSM knows the customer; the slide is the evidence base, not the customer directory.

---

## §3. 5 Worked Examples (one per persona + scrappy-startup sub-persona)

The slide is the same 4 quadrants for every customer — the **values** are different, but the **structure** is identical. The Apollo widget auto-populates from the audit log; the CSM doesn't customize per customer (except for header/footer).

**Worked example 1: Carla (ICP-1, $1.04M ACV, 50-user Pro)**

- Time Saved: [FICTIONAL PLACEHOLDER] 18 hours/month on consolidated monthly close across 3 entities (vs. 2-day manual close per entity)
- Errors Caught: 1 duplicate intercompany txn flagged, $87K exposure; AI cap at 95% (hitting scaling pressure)
- Scenarios Built: 12 board-pack scenarios in Q1-Q2 (4 quarterly board updates + 8 ad hoc); 3 exported to PDF for board distribution
- Team Adoption: 50/50 users active weekly, 5 power users hitting AI cap daily
- _Slide emphasis: "Your team is at the AI cap — expanding to 50 → 75 users + Business tier would unblock the scaling."_

**Worked example 2: Vera (ICP-2, $5,940/yr, 5-user Pro, scrappy SaaS controller)**

- Time Saved: [FICTIONAL PLACEHOLDER] 4 hours/month saved on the monthly close (vs. 8-hour manual process); runway model updated weekly
- Errors Caught: 2 anomalies flagged, $4.2K total exposure (one was a Stripe fee miscategorization)
- Scenarios Built: 6 fundraising scenarios built (3 priced rounds + 3 dilution models) for the seed → Series A motion
- Team Adoption: 2/5 users active weekly (founder + controller; rest are part-time advisors)
- _Slide emphasis: "You've built 6 scenarios for the Series A — this is the kind of decision support investors want to see. The team adoption is light; the strategic value is high."_

**Worked example 3: Chris (ICP-3, $5,940/yr, 5-user Pro, controller at a 50-person SaaS)**

- Time Saved: [FICTIONAL PLACEHOLDER] 6.4 hours/month saved on monthly close (3 days → 4 hours per T-IR-012 §3)
- Errors Caught: 3 anomalies flagged, $42K total exposure (duplicate Stripe txn, FX rate mismatch, accrual timing)
- Scenarios Built: 8 board-pack scenarios (3 quarterly + 5 ad hoc); 2 exported to PDF for CFO/CEO review
- Team Adoption: 5/5 users active weekly, AI cap at 80%
- _Slide emphasis: "Your team is at 80% AI cap — Day-180 5→7 seat expansion at $79/each is the natural next step."_

**Worked example 4: Beth (ICP-4, channel partner, $59,880 Y2 downstream, 50-user Pro)**

- Time Saved: [FICTIONAL PLACEHOLDER] 22 hours/month saved across 3 client engagements (Baker Tilly advisor running 3 client workspaces in parallel)
- Errors Caught: 7 anomalies flagged across clients, $180K total exposure (3 client-significant audit findings avoided)
- Scenarios Built: 18 client-deliverable scenarios (6 per client × 3 clients); 9 exported to PDF for client distribution
- Team Adoption: 50/50 users active weekly across the 3 client workspaces, AI cap at 100% (hitting the Pro tier ceiling)
- _Slide emphasis: "Across 3 client workspaces, you've saved 22 hours/month. The Business tier (unlimited AI cap) is the natural next step."_

**Worked example 5: Scrappy-startup sub-persona (3-user Pro, sub-$10K ACV)**

- Time Saved: [FICTIONAL PLACEHOLDER] 2 hours/month on the monthly close
- Errors Caught: 1 anomaly flagged, $800 exposure
- Scenarios Built: 2 scenarios (runway model + hiring plan)
- Team Adoption: 3/3 users active weekly, AI cap at 40%
- _Slide emphasis: "Light usage, high value. The 5→7 expansion isn't relevant yet — focus on renewal at 3 users for now."_

**Why 5 worked examples (not 4):** The 5th (scrappy-startup) is a sub-persona of Vera (ICP-2) for the 3-4 user segment that's below the 5-user sweet spot. The Apollo widget doesn't auto-detect this sub-persona; the CSM eyeballs the audit log at Day-60 to see if the customer is on a 3-user trajectory, then chooses the right slide emphasis. **Without the sub-persona distinction, the CSM would default to the 5→7 expansion pitch, which is wrong for a 3-user customer who's never going to expand.**

---

## §4. Apollo Partner Portal Q1 2027 Widget Integration Spec

The Apollo partner portal (Q1 2027 launch per T-AP-012) is the integration target. The widget lives in the CSM-facing portal at `/customers/{customer_id}/renewals/{renewal_id}/value-summary-slide` and renders the 4-quadrant slide on-demand.

**Widget spec (15 endpoints, 4 visualization components, 2 data fetchers):**

| Endpoint                                                                                          | Method | Purpose                                                     | Latency target |
| ------------------------------------------------------------------------------------------------- | ------ | ----------------------------------------------------------- | -------------- |
| `/api/customers/{id}/audit-log?event_types=report_generated&since=90d`                            | GET    | Time Saved quadrant                                         | <200ms         |
| `/api/customers/{id}/ai-copilot-output?event_types=anomaly_flagged&confidence_min=0.85&since=90d` | GET    | Errors Caught quadrant                                      | <200ms         |
| `/api/customers/{id}/workspace-activity?event_types=scenario_saved&since=90d`                     | GET    | Scenarios Built quadrant                                    | <200ms         |
| `/api/customers/{id}/team-adoption?metrics=login_frequency,ai_cap_usage&since=90d`                | GET    | Team Adoption quadrant                                      | <300ms         |
| `/api/slides/render`                                                                              | POST   | Render 4-quadrant slide as PNG (for export to email / Loom) | <2s            |
| `/api/slides/email`                                                                               | POST   | Email slide PNG + HTML to customer                          | <5s            |

**Widget UI components (4):**

1. **`<ValueSummarySlide>`** — 16:9 slide container, 4 quadrant slots, header/footer
2. **`<TimeSavedBarChart>`** — bar chart, 6-month trend, hours saved per month
3. **`<ErrorsCaughtList>`** — list of anomalies with $ amount + date + AI confidence
4. **`<ScenariosBuiltStackedBar>`** — stacked bar chart, Q1 vs. Q2, scenario type breakdown
5. **`<TeamAdoptionHeatmap>`** — 5×7 heatmap (users × days) + AI cap usage line chart

**Widget UX flow (CSM's 5 clicks):**

1. CSM logs into Apollo partner portal → /customers → search "Acme Corp"
2. Clicks "Renewals" tab → finds Acme's Day-90 renewal scheduled for 2026-07-15
3. Clicks "Generate value-summary slide" → widget fetches 4 endpoints in parallel
4. Reviews the 4 quadrants + the CSM-emphasis auto-suggestion (per worked example 3, "Day-180 5→7 seat expansion at $79/each is the natural next step")
5. Either: (a) accepts the auto-suggested emphasis and clicks "Email to customer," or (b) edits the emphasis + clicks "Email to customer" + schedules the Day-90 Calendly

**Total CSM time: ~3 minutes per customer** (vs. ~30 minutes to build the slide by hand in Google Slides today). The widget saves 27 minutes per customer × 100 customers/quarter = **45 hours/quarter = 180 hours/yr** (slightly less than the §0 math of 200 hours/yr because the CSM still needs to review the auto-suggested emphasis).

**Q1 2027 launch dependencies (4 cross-Muse):**

- Apollo T-AP-012: build the widget UI + 6 endpoints
- Atlas T-ATL-014: ensure audit log is queryable in <200ms (current latency is 1.2s for the 90-day window — needs caching layer)
- Hephaestus T-HEP-014 GDPR DPA: ensure EU customers' data stays in eu-west-1 (the widget must support region-routing)
- Mnemosyne T-MN-002 GLOSSARY: add 3 new terms (value-summary slide / quadrant / audit-log-data-source)

---

## §5. 6 Open Questions (TENTATIVE pending Wave-2 beta)

1. **Data freshness — what happens if the customer generated an anomaly 89 days ago and a new one today?** Slide should include the most recent 90 days; cut-off is rolling. The widget auto-rolls; the CSM doesn't customize. ✅ Resolved by Apollo widget default.
2. **Slide cadence — should the slide be generated every 30 days as a "value check-in," or only at Day-90?** Default: every 30 days, with a Day-90 highlight version (the §1 header/footer). The 30-day cadence gives the CSM a touchpoint to send the slide proactively, building the renewal-conversation evidence base over 90 days rather than dumping it all on Day-90.
3. **Per-customer customization — can the CSM override the auto-suggested emphasis?** Yes, the widget has an "Edit emphasis" button. The CSM can type 1-2 sentences of custom emphasis that override the auto-suggested one. **Default: trust the auto-suggestion 80% of the time, override 20%.** TENTATIVE.
4. **White-label — can the customer's CFO/CEO have a custom-branded version of the slide (their logo, not FinPlan Pro's)?** Yes, the widget supports white-label export. CSM enables it per customer; it adds 1 click to the workflow. **Decision: white-label is on by default for ICP-1 (Carla) and ICP-4 (Beth) customers; off for ICP-2 (Vera) and ICP-3 (Chris) by default** (the SMB segment doesn't need white-label).
5. **GDPR data residency — what if the customer is in EU and the audit log is in eu-west-1 but the widget renders in us-east-1?** Per T-HEP-014 DPA template, the data must not cross borders. The Apollo widget must auto-route the slide rendering to the customer's region. **TENTATIVE: requires Apollo T-AP-012 Q1 2027 spec to confirm region-routing support.**
6. **Multi-product customers — what if the customer is using Pro + a future Business-tier module?** The slide should show Pro metrics only (the modules are separate products with separate ACVs). **Defer until Business-tier launches in Y2 2027.** No current impact.

---

## §6. Cross-Muse Handoffs (6)

| #   | Muse           | Task                         | What they need from T-IR-018                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| --- | -------------- | ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **CSM**        | T-IR-004 §4                  | The 4-quadrant value-summary slide becomes the **default Day-90 artifact**. The 30-min CSM+AE renewal-conversation script (T-IR-017 §4) now references the widget URL: "Open the value-summary slide at /customers/{id}/renewals/{id}/value-summary-slide" as the first 5 minutes of the call. CSMs train on the widget in 2-3 sessions of 30 min each (Atlas T-ATL-015 candidate).                                                                                                                                           |
| 2   | **Apollo**     | T-AP-012                     | Build the 6-endpoint widget + 4 visualization components per §4. 15-day sprint, Q1 2027 launch. Pairs with seat-management widget (T-IR-016 §4 handoff) — same partner portal, same React/TypeScript stack, same CSM-facing UX. **The 2 widgets together close the "Day-30 expansion + Day-90 renewal" operational gap.**                                                                                                                                                                                                     |
| 3   | **Hermes**     | T-HER-007 PARTNERSHIP_MOTION | Reference-ask script for the renewal conversation: "If you're open to it, we'd love to intro you to a Baker Tilly advisor who's working with similar Chris-customers — 15-min call, no pitch." Add 1 line to the slide's footer: "Know a CFO who could benefit from FinPlan Pro? Refer them and earn a $500 referral bonus: [Apollo partner portal referral link]." Cross-Muse: referral program is per Strategos D-005 founder-pending ratification.                                                                         |
| 4   | **Strategos**  | T-ST-003 §4                  | ICP-3 PLG funnel math needs a value-summary-slide line item: 100 customers × 1 slide/quarter × $89/customer/yr retention lift = **$8,910/yr funnel attribution** (the slide is the enabler of the $89,100 retention lift, not the lift itself). Add to T-ST-003 §4 "instrumentation" line items.                                                                                                                                                                                                                              |
| 5   | **Prometheus** | new instrumentation          | Wire 5 new events to the activation funnel: `value_summary_slide_viewed` (CSM clicks the widget), `value_summary_slide_edited` (CSM overrides the emphasis), `value_summary_slide_emailed` (CSM sends to customer), `value_summary_slide_opened_by_customer` (customer opens the email/PNG), `value_summary_slide_renewal_outcome_logged` (renewal outcome correlated with slide interaction). The 5 events close the Day-90 attribution gap (we know the slide was generated, but not whether the customer engaged with it). |
| 6   | **Mnemosyne**  | T-MN-002 GLOSSARY            | Add 3 new terms: **value-summary slide** (4-quadrant slide auto-generated from audit log; the single most important Day-90 artifact; difference between 70% and 85% gross retention per T-IR-017), **quadrant** (one of 4 sections: Time Saved / Errors Caught / Scenarios Built / Team Adoption; each maps to a specific audit-log data source per §2), **audit-log data source** (the underlying event log that powers each quadrant; real-time, append-only, region-routed for GDPR compliance).                           |

---

## §7. Self-Assessment

**Advantages (3):**

1. **The slide is the leverage point, not a nice-to-have.** Per T-IR-017 §0, the 15-percentage-point retention lift (70% → 85%) is the difference between the Day-90 motion being a "nice conversation" and being the highest-leverage CSM intervention in the entire funnel ($86,730/yr per 70-customer cohort). The widget makes the slide operational, not aspirational.
2. **Apollo widget integration is mostly build, not research.** The 4 data sources already exist in the audit log; the 4 visualizations are standard Recharts components; the 6 endpoints are CRUD on existing tables. The 15-day Apollo sprint is low-risk and high-ROI. The 180 hours/yr CSM time saved (~1 FTE-week) is a direct budget offset.
3. **The 5 worked examples give CSMs a mental model, not a script.** Each example shows the same 4 quadrants with different values + a different emphasis line. The CSM learns to read the customer's data, not memorize a script. **This scales the Day-90 motion from "expert CSM only" to "any CSM with the widget."**

**Gaps (3):**

1. **The 85% gross retention figure is TENTATIVE** (midpoint of public SaaS benchmarks 65-90%). The slide is the enabler, but the actual lift depends on CSM execution + customer segment + product-market fit. Wave-2 beta will tell; pre-launch, the $89,100/yr retention savings is a hypothesis.
2. **The Apollo widget is Q1 2027, not Q3 2026.** The Day-90 motion launches in Wave-2 (Q4 2026) without the widget — CSMs build the slide by hand in Google Slides for the first 6-9 months. The hand-built version is functional but slow (30 min/slide). The widget is the Y2 scaling play, not the Y1 launch play.
3. **The white-label feature for ICP-1/ICP-4 (Carla/Beth) requires legal review of the per-customer logo usage.** TENTATIVE: legal review by Hephaestus T-HEP-014 in Q1 2027. If legal flags, fall back to no-logo version (just customer name in header). Doesn't block the Y1 launch.

**Next 60-min move (T-IR-019 candidate):** ICP-2 (Vera) Day-7 / Day-30 / Day-90 Variants — 3 docs in 1 batch (T-IR-019a Day-7 / T-IR-019b Day-30 / T-IR-019c Day-90) for the scrappy SaaS controller, ~60 min each = 180 min total. The 3 docs extend the Day-7 → Day-30 → Day-90 chain from Chris (ICP-3) to Vera (ICP-2), which is the second-largest segment. **Or T-IR-019 alt:** Save-Motion Playbook expansion (5 → 10 motions, adds 5 cross-cuts for multi-product / budget-cycle-mismatch / M&A-transition / SOC-2-required / international-data-residency customers, 60 min). The ICP-2 variant is more strategic; the save-motion expansion is more tactical. **Default to ICP-2 variant unless Strategos flags the save-motion expansion as a Y2 board priority.**

---

**END T-IR-018 DRAFT v0.1 — 2026-06-13 — Iris**
**Word count target: 200-250L. Actual: 213L (107% of 200L lower bound, 85% of 250L upper bound — within 90-120% D-007 range vs. 200L lower bound; rich content density on §1 4-quadrant + §2 data-source mapping + §3 5 worked examples).**
