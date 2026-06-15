<!-- DRAFT v0.1 — awaiting review — Iris 2026-06-13 -->

# FinPlan Pro — Churn Events Taxonomy

> **Companion to:** `docs/drafts/iris/CHURN_FRAMEWORK.md`
> **Muse:** Iris → Apollo (instrumentation owner), Atlas (on-call alerting owner), Prometheus (perf SLO owner)
> **Schema:** `<reason>.<signal>_<unit>` naming. All events have `user_id`, `persona`, `account_id`, `timestamp`, `properties` (event-specific).
> **Persona tags:** `carla` (ICP-1), `chris` (ICP-3), `vera` (ICP-2) — derived from signup signal + first-import behavior, not self-reported.

---

## §1 — Reason 1 (Price) — `churn.price.*`

| Event | Trigger | Properties | Threshold (alert) |
|---|---|---|---|
| `churn.price.usage_drop_detected` | Core-feature usage <60% of trailing-3mo baseline | `core_feature`, `baseline_pct`, `current_pct` | <60% for 14+ days |
| `churn.price.cs_no_show` | CSM meeting declined/missed | `meeting_id`, `cs_id` | ≥1 miss in trailing 30 days |
| `churn.price.login_drop` | Login frequency <2/week (ICP-1) | `logins_last_7d`, `logins_baseline_7d` | <2/week sustained 14 days |
| `churn.price.billing_ticket` | Support ticket with `category=billing` | `ticket_id`, `amount` | ≥1 ticket |
| `churn.price.downgrade_request` | Contract amendment (downgrade tier / fewer seats) | `from_tier`, `to_tier`, `effective_date` | 1 = SAVE NOW |
| `churn.price.combined_pattern` | All 3 of usage_drop + cs_no_show + login_drop in 30 days | `signal_count` | 3 = ~85% churn probability |

---

## §2 — Reason 2 (Complexity) — `churn.complexity.*`

| Event | Trigger | Properties | Threshold (alert) |
|---|---|---|---|
| `churn.complexity.install_no_action` | Install completed, no click within 120s | `seconds_idle` | >120s = URGENT |
| `churn.complexity.first_value_not_reached` | `trial.first_value` = false after Day 3 | `days_since_install` | Day 3 = at-risk; Day 7 = lost |
| `churn.complexity.low_return_visits` | <2 return sessions in trailing 7 days | `sessions_last_7d` | <2 in 7 days |
| `churn.complexity.jargon_hit` | User lands on screen with jargon, no click in 60s | `screen_id`, `jargon_term` | Real-time tooltip trigger |
| `churn.complexity.help_docs_no_return` | User clicks help docs, doesn't return to product | `doc_id`, `return_within_min` | >30 min = lost |
| `churn.complexity.cs_3day_no_reply` | Day 3 CSM-light email sent, no reply | `email_id`, `replied` | Day 4 = founder-ping |

---

## §3 — Reason 3 (Missing feature) — `churn.feature_gap.*`

| Event | Trigger | Properties | Threshold (alert) |
|---|---|---|---|
| `churn.feature_gap.request_filed` | Support ticket with `category=feature_request` | `ticket_id`, `feature_summary`, `bucket` (a/b/c) | 1 = triage in 48h |
| `churn.feature_gap.followup` | User asks "any update?" on feature request | `original_ticket_id`, `days_since_filed` | ≥1 follow-up = at-risk |
| `churn.feature_gap.workaround_pattern` | >5 export/import cycles/month (Excel-bailout) | `cycles_last_30d`, `export_format` | >5 = CSM call |
| `churn.feature_gap.exec_sponsor_request` | User requests meeting with our exec | `exec_id`, `topic` | 1 = exec reply in 48h |
| `churn.feature_gap.termination_invoked` | `renewal.termination_clause` flag in billing | `contract_id`, `reason_text` | 1 = GRACEFUL EXIT |
| `churn.feature_gap.champion_departure` | HRIS signal: primary contact leaves company | `old_champion_id`, `new_champion_id` (if known) | 1 = AE + CSM lock-in |

---

## §4 — Reason 4 (Support) — `churn.support.*`

| Event | Trigger | Properties | Threshold (alert) |
|---|---|---|---|
| `churn.support.first_response_slow` | First reply >4h (ICP-1/2) or >24h (ICP-3) | `ticket_id`, `first_response_hours` | >4h ICP-1 = auto-escalate |
| `churn.support.csat_low` | Post-resolution survey <3.5/5 | `ticket_id`, `csat_score` | <3.5 = CSM coaching |
| `churn.support.ticket_reopened` | Same ticket re-opened within 30 days | `ticket_id`, `reopen_count` | ≥1 = engineering review |
| `churn.support.engineering_stuck` | Escalation to engineering, no resolution in 7 days | `ticket_id`, `days_open` | 7 days = Slack ping on-call |
| `churn.support.competitor_mentioned` | Ticket text matches `[competitor_name]` | `competitor_name`, `ticket_id` | 1 = AE save motion |
| `churn.support.billing_dispute` | Billing dispute opened | `dispute_id`, `amount` | 1 = finance + CSM |

---

## §5 — Reason 5 (Performance) — `churn.perf.*`

| Event | Trigger | Properties | Threshold (alert) |
|---|---|---|---|
| `churn.perf.p95_page_load_slow` | p95 page load >3000ms for 7 days | `page_id`, `p95_ms` | >3000ms sustained = CI-block new release |
| `churn.perf.monte_carlo_slow` | `monte_carlo_run_seconds` p95 >10s | `scenario_size`, `p95_seconds` | >2s = Aha-target violated; >10s = churn risk |
| `churn.perf.rage_clicks` | ≥3 clicks in 2s on the same element | `element_id`, `click_count` | >5% of sessions = UX issue |
| `churn.perf.abort_rate_high` | >5% of sessions end without a save | `sessions`, `abort_pct` | >5% = investigate |
| `churn.perf.excel_bailout` | User exports to Excel >3×/week | `exports_last_7d` | >3 = perf concern |
| `churn.perf.perf_ticket` | Support ticket with `category=performance` | `ticket_id`, `page_id`, `p95_ms_at_time` | ≥1 = Prometheus review |

---

## §6 — Cross-reason events (the "save" motions)

| Event | Trigger | Properties | Owner |
|---|---|---|---|
| `save.value_anchor_call_done` | CSM 30-day value-anchor call completed | `cs_id`, `value_metrics_shared` | CSM |
| `save.qbr_done` | Quarterly business review completed | `attendees`, `value_metrics` | CSM + AE |
| `save.triage_complete` | Feature request triaged to bucket (a/b/c) | `ticket_id`, `bucket`, `commitment` | PM |
| `save.roadmap_update_sent` | 30-day auto-update sent on feature request | `feature_id`, `ship_date` | PM |
| `save.founder_ping_sent` | Founder personal email sent (Day 7) | `recipient_id`, `reply_received` | Founder |
| `save.ci_block_fired` | CI blocked a release on perf regression | `release_id`, `metric`, `delta` | Apollo (CI) |
| `save.workaround_coached` | CSM coached user on workaround | `user_id`, `feature_id` | CSM |

---

## §7 — Dashboards (proposed)

| Dashboard | Audience | Refresh | Key charts |
|---|---|---|---|
| **Churn Risk (live)** | CSM team, AE team | Real-time | 6 cohort retention curves; combined-pattern alerts; save-motion completion rate |
| **Trial Health (live)** | Product, CSM | Real-time | install→first-value funnel; jargon-hit heatmap; return-visit distribution |
| **Support Health (weekly)** | Support Lead, AE Lead | Daily | first-response p50/p95; CSAT trend; reopen rate; engineering-stuck count |
| **Perf Health (weekly)** | Prometheus, Apollo | Daily | p95 page load; Monte Carlo p95; rage-click rate; Excel-bailout count |
| **Feature Requests (monthly)** | Product, PM | Daily | request volume by bucket; follow-up rate; ship-date hit rate; communication health |

---

## §8 — Required event properties (common schema)

Every churn event must include:

| Property | Type | Example | Notes |
|---|---|---|---|
| `user_id` | string | `usr_abc123` | Internal user ID |
| `account_id` | string | `acct_xyz789` | Internal account ID |
| `persona` | enum | `carla` / `chris` / `vera` / `unknown` | Derived from signup + first-import |
| `tier` | enum | `solo` / `team` / `enterprise` | Current subscription tier |
| `days_since_install` | int | `42` | Useful for cohort filters |
| `days_since_signup` | int | `42` | Useful for stage filters |
| `csm_id` | string | `csm_alice` | The CSM on the account (if any) |
| `champion_id` | string | `usr_def456` | The user most likely to advocate (if known) |

---

## Cross-references

- **`docs/drafts/iris/CHURN_FRAMEWORK.md`** — the 5 reasons, detection signals, prevention.
- **`docs/drafts/iris/JOURNEY_MAP_CARLA.md`** — Stage 6 (Habit) maps to `churn.price.*` and `churn.feature_gap.*`.
- **`docs/drafts/iris/PERSONAS.md`** — persona tags used in event properties.
- **Apollo (post-push queue)** — instrument this taxonomy as part of the analytics-event build.
- **Atlas (on-call runbook)** — wire the alert thresholds into PagerDuty / Slack.
- **Prometheus** — owns the `churn.perf.*` SLO gates.

---

_An event you don't fire is an insight you don't have. An event you fire but don't act on is noise. The taxonomy is the contract between Iris and the rest of the team. — Iris_
