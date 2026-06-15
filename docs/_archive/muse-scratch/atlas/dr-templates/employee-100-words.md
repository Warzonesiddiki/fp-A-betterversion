<!-- DRAFT v0.1 — awaiting review — Atlas 2026-06-13 -->
# DR comms template #2 — Employee briefing (100 words)

> **Audience.** All FinPlan Pro employees (eng, product, sales, CS, support, ops).
> **Channels.** Slack `#incident` channel + email-all (bcc: legal@).
> **Word budget.** ≤ 100 words (enforced; see witness #1).
> **Source.** DISASTER_RECOVERY_RUNBOOK.md §8.2 (T-ATL-008, ACCEPTED 2026-06-13).
> **Sed pattern.** `cat docs/drafts/atlas/dr-templates/employee-100-words.md | sed -e 's/\[status\]/actual/g' -e 's/\[scenario\]/actual/g' -e 's/\[lead\]/actual/g' -e 's/\[N hours\]/actual/g' -e 's/\[none\|N minutes\]/actual/g' -e 's/\[name 1\]/actual/g' -e 's/\[name 2\]/actual/g'`

---

## Why this template exists

**Witness 1 (rule).** Employee briefings are operationally critical — they prevent the 5 most common incident-time failures: (a) engineers tweeting / blogging about the incident prematurely, (b) sales/CS making inconsistent customer promises, (c) investors / press getting the wrong contact, (d) duplicate work by multiple teams, (e) "is this a real incident or a drill?" confusion. A 100-word structured format (status / scenario / lead / RTO / data loss / who's doing what / cadence) gives every employee a single artifact to read in 30 seconds and know exactly where the company is.

**Witness 2 (evidence).** T-ATL-008 §8.2 inline skeleton (DISASTER_RECOVERY_RUNBOOK.md:305-323) is the source. The `DO NOT COMMUNICATE EXTERNALLY without CEO approval` line is the single most important constraint — it's the line that prevents (a) and (b) above. The `WHO IS DOING WHAT` block is the line that prevents (d).

**Witness 3 (failure mode / consequence).** If we send a Slack-only or email-only employee briefing, two failure modes open up: (a) **channel fragmentation** — engineers in Slack, execs in email, sales in HubSpot, each group gets a different version of the truth; (b) **the 3 AM problem** — on-call engineer fires off a customer-facing tweet in a moment of exhaustion, the tweet goes viral, the company is now in PR crisis mode on top of the engineering incident. The template's "DO NOT COMMUNICATE EXTERNALLY" + "All customer-facing messages go through [name]" + "All investor / press inquiries go to [name]" is the firewall.

---

## Template body (100 words max at fill time)

```
#incident — DR scenario invoked

STATUS: [investigating | identified | monitoring | resolved]
SCENARIO: [§3.1 / §3.2 / §3.3 / §3.4 / §3.5]
LEAD: [VP Eng / CEO / Atlas]
RTO TARGET: [N hours]
DATA LOSS: [none / ≤ N minutes]

WHO IS DOING WHAT:
- [name 1]: [action]
- [name 2]: [action]

DO NOT COMMUNICATE EXTERNALLY without CEO approval. All customer-facing messages go through [name]. All investor / press inquiries go to [name].

Updates: every 30 min in this channel.
```

> **Status state machine.** Pick exactly one of: `investigating` → `identified` → `monitoring` → `resolved`. Do not invent states. Do not skip states. The transition `investigating → identified` is the moment CEO approval is needed for any external comms.

> **Scenario codes.** Use the §3.X code from T-ATL-008 — every employee can look it up in the runbook. Don't paraphrase ("the database one" is ambiguous between §3.2 data corruption and §3.4 audit log tamper).

---

## Pre-flight checklist (before posting)

1. **Status is single-valued.** Confirm exactly one of `investigating` / `identified` / `monitoring` / `resolved` is filled. Multiple = confusion.
2. **LEAD is named.** If `[VP Eng / CEO / Atlas]` is unclear (e.g., a scenario that's not §3.1, §3.2, or §3.5), refer to T-ATL-008 §9 RACI matrix. The RACI's A column is the LEAD.
3. **WHO IS DOING WHAT has names.** No "the team" or "engineering" — name 2-4 individuals. "Atlas + Priya are on the failover; Marcus is the comms lead; Lin handles customer support." Specificity prevents (d) duplicate work.
4. **External comms lines are populated.** Both `[name]` placeholders filled — one for customer comms, one for investor/press. If one of them is "TBD", that's a sign CEO hasn't fully taken comms ownership yet.
5. **#incident channel exists.** The Slack channel is pre-created (`#incident` is in the channel template). If it's not, create it + invite the on-call rotation + post this template within 5 min.

---

## Cross-links

- **Parent.** `../DISASTER_RECOVERY_RUNBOOK.md` §8.2 (T-ATL-008, ACCEPTED 2026-06-13)
- **Sibling templates.** `customer-60-words.md` (external customer), `board-200-words.md` (board), `gdpr-art-33-regulator.md` (regulator)
- **RACI reference.** T-ATL-008 §9 — A column is the LEAD for `[LEAD]` field
- **On-call rotation.** `../ON_CALL_RUNBOOK.md` §1 (T-ATL-003) — backup owner if primary is OOO > 24h
- **Slack channel.** `#incident` (pre-created)
- **Sibling comms plan.** T-ATL-008 §5 — 4 audiences with trigger conditions

---

**End of employee template. 100-word budget, Slack + email, 5-item pre-flight. — Atlas 2026-06-13 07:55 IST**
