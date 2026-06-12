<!-- DRAFT v0.1 — awaiting review — Atlas 2026-06-13 -->
# DR comms template #3 — Board briefing (200 words)

> **Audience.** Board of directors + major investors (if separate cap table).
> **Channels.** Email + 15-min Zoom (or standing call slot).
> **Word budget.** ≤ 200 words (enforced; see witness #1).
> **Source.** DISASTER_RECOVERY_RUNBOOK.md §8.3 (T-ATL-008, ACCEPTED 2026-06-13).
> **Sed pattern.** `cat docs/drafts/atlas/dr-templates/board-200-words.md | sed -e 's/\[SEV-N\]/actual/g' -e 's/\[HH:MM UTC\]/actual/g' -e 's/\[status\]/actual/g' -e 's/revenue at risk\]/actual/g' -e 's/\[% of MAU affected, count\]/actual/g' -e 's/\[GDPR\|SOC 2\|none\]/actual/g' -e 's/1-2 sentences\]/actual/g' -e 's/\[time\]/actual/g' -e 's/\[CEO name\]/actual/g'`

---

## Why this template exists

**Witness 1 (rule).** Board briefings serve 3 distinct purposes that the employee / customer templates don't: (a) **fiduciary disclosure** — directors have a legal duty to be informed of material incidents; an under-disclosed incident is a personal liability for them; (b) **strategic framing** — boards think in revenue / regulatory / reputational terms, not in technical terms; (c) **decision authority** — boards may need to approve emergency spend (e.g., $50K incident-response retainer) and they can't do that without a structured ask. The 200-word budget plus the 3-bullet action plan forces the briefing to be **decision-ready**, not just informational.

**Witness 2 (evidence).** T-ATL-008 §8.3 inline skeleton (DISASTER_RECOVERY_RUNBOOK.md:325-350) is the source. The `FINANCIAL IMPACT (estimate)` block and the `3-BULLET ACTION PLAN` are the 2 sections that distinguish a board briefing from an employee briefing. They are not optional — a board briefing without a financial impact block is a red flag that the company doesn't understand its own exposure.

**Witness 3 (failure mode / consequence).** If we send a board briefing that reads like an employee briefing (all technical, no financial), three failure modes open up: (a) **board asks for a re-briefing** — wastes 30 min of CEO time and signals "you don't know your numbers"; (b) **board over-corrects** — directors who don't see the financial framing assume the worst and may demand a hiring freeze or a fundraising pause; (c) **decision paralysis** — without a 3-bullet action plan, the board can't approve emergency spend and the incident drags. The template's structure prevents all three.

---

## Template body (200 words max at fill time)

```
Subject: [SEV-N] incident — executive summary

Board —

[SEV-N] incident in progress / resolved. Started at [HH:MM UTC]. Current status: [status].

FINANCIAL IMPACT (estimate):
- Revenue at risk: [$N over RTO window]
- Customer impact: [% of MAU affected, count]
- Regulatory exposure: [GDPR / SOC 2 / none]

ROOT CAUSE (preliminary):
[1-2 sentences]

3-BULLET ACTION PLAN:
1. [Immediate action, owner, ETA]
2. [Short-term action, owner, ETA]
3. [Long-term action, owner, ETA]

NEXT BOARD UPDATE: [time, e.g., "in 4 hours" or "in the next standing call"]

— [CEO name]
```

> **SEV-N taxonomy.** Use the `ON_CALL_RUNBOOK.md` §1 SEV levels: SEV-1 (full outage, >$10K/hr revenue impact), SEV-2 (degraded service, <$10K/hr), SEV-3 (single-customer or single-feature), SEV-4 (informational). Board is only briefed on SEV-1 and SEV-2; SEV-3 is summarized in the weekly update.

> **Financial figures are estimates.** Every `$N` is tagged `(estimate)` in the body. Board members understand the difference between "we know it's exactly $X" and "we estimate $X" — be honest about which is which. A $50K estimate that turns out to be $75K is forgivable; a $50K claim that turns out to be $200K is not.

---

## Pre-flight checklist (before sending)

1. **SEV level confirmed.** SEV-1 or SEV-2 from `ON_CALL_RUNBOOK.md` §1. If it's SEV-3, route to the weekly update instead.
2. **Start time is UTC.** Board members are in 3+ timezones (per Shamir holder list — San Francisco, Berlin, Singapore). UTC is the only common frame.
3. **Financial impact has 3 numbers.** Revenue at risk, customer count/%, regulatory exposure. If any of the 3 is "TBD", the briefing is premature — wait 15 min, fill it in.
4. **Root cause is 1-2 sentences.** NOT 1-2 paragraphs. Board doesn't need the stack trace; they need the human summary ("a misconfigured Terraform variable in the EU region failover automation" — not "the load balancer health check timeout was 3.2s instead of 2.8s").
5. **3-bullet action plan has owners and ETAs.** "Investigate" is not an action. "Atlas to restore from R2 snapshot by 14:00 UTC" is an action.
6. **Next update time is concrete.** Not "soon" or "as needed" — "in 4 hours" or "in the next standing call (Wednesday 16:00 UTC)".

---

## Cross-links

- **Parent.** `../DISASTER_RECOVERY_RUNBOOK.md` §8.3 (T-ATL-008, ACCEPTED 2026-06-13)
- **Sibling templates.** `customer-60-words.md`, `employee-100-words.md`, `gdpr-art-33-regulator.md`
- **SEV taxonomy.** `../ON_CALL_RUNBOOK.md` §1 (T-ATL-003) — SEV-1 to SEV-4 definitions
- **Shamir holder cities.** T-ATL-008 §3.3 — Founder (San Francisco) / CTO (Berlin) / board member (Singapore) — drives the UTC time choice
- **Budget reference.** T-ATL-008 §6 — DR budget $70/mo, $2,900/yr; financial impact should be compared against this baseline
- **Board approval thresholds.** Strategos T-ST-006 §7 — SOC 2 audit >$50K, Phase 1 infra >$400K, Series A >$1M require board approval (relevant if incident triggers emergency spend)

---

**End of board template. 200-word budget, email + 15-min Zoom, 6-item pre-flight. — Atlas 2026-06-13 07:55 IST**
