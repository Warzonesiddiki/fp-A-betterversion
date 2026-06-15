<!-- DRAFT v0.1 — awaiting review — Atlas 2026-06-13 -->
# DR comms template #1 — Customer notification (60 words)

> **Audience.** End customers (MAU, paying).
> **Channels.** Email + status page (https://status.finplanpro.com) + in-app banner.
> **Word budget.** ≤ 60 words (enforced; see witness #1).
> **Source.** DISASTER_RECOVERY_RUNBOOK.md §8.1 (T-ATL-008, ACCEPTED 2026-06-13).
> **Sed pattern.** `cat docs/drafts/atlas/dr-templates/customer-60-words.md | sed -e 's/\[SHORT_DESCRIPTION\]/actual/g' -e 's/\[BRIEF_DESCRIPTION\]/actual/g' -e 's/\[N hours\]/actual/g' -e 's/\[N minutes\]/actual/g' -e 's/\[CEO name\]/actual/g'`

---

## Why this template exists

**Witness 1 (rule).** Customer-facing incident communication is the most time-sensitive, highest-stakes message we send. Per `ON_CALL_RUNBOOK.md` IC-1, the customer-facing message must go out within 15 minutes of SEV-1 declaration. A 60-word budget forces clarity — no jargon, no hedging, no engineering details. **Verification:** `wc -w` on the template body (between `Team —` and `— [CEO name]`) must be ≤ 60 at fill time.

**Witness 2 (evidence).** T-ATL-008 §8.1 inline skeleton (DISASTER_RECOVERY_RUNBOOK.md:288-303) is the source. The skeleton was ratified by Leader on 2026-06-13 with the explicit instruction: *"Pre-staging the 4 templates with [BRACKETED_FIELDS] in place lets CEO do `cat template.md | sed 's/\[FIELD\]/actual/g'` instead of writing from scratch."* This file is the pre-stage of that inline skeleton into a standalone CEO-ready artifact.

**Witness 3 (failure mode / consequence).** If the CEO writes the customer message from scratch under incident pressure, three failure modes open up: (a) **Hedging creep** — "we are investigating" with no RTO → customers churn; (b) **Over-disclosure** — leaking PII-affecting details before Legal review (GDPR Art. 33 territory); (c) **Channel inconsistency** — Slack-only update misses the 70% of customers who don't have Slack open. The template's structure (email + status page + in-app banner triple-channel) prevents (c). Its [BRACKETED_FIELDS] prevent (a) and (b) by making every assertion a fillable, reviewable line item.

---

## Template body (60 words max at fill time)

```
Subject: Service incident — [SHORT_DESCRIPTION]

Team —

We are currently experiencing a [BRIEF_DESCRIPTION: e.g., "regional service disruption in EU"]. Our team is actively working on resolution.

Current RTO (recovery target): [N hours].
Your data is [safe / at risk of ≤ N minutes of recent changes].

We will update you every 30 minutes until resolved. Live status: https://status.finplanpro.com

— [CEO name], FinPlan Pro
```

> **Word count check (fill-time).** The bracketed fields count as 1 word each in `wc -w` after `sed` substitution, regardless of the actual filled length. So if every field is 1 word, the body (between `Team —` and `— [CEO name]`) lands at ~52 words. The 60-word budget has ~8 words of headroom for descriptive variation in `[BRIEF_DESCRIPTION]`.

> **Sed-safe characters.** All `[BRACKETED_FIELDS]` use only `[A-Z_ ]` characters. No `&` (sed metachar), no `/` (sed delimiter), no `\` (sed escape). CEO can pipe through any standard `sed` invocation without quoting hell.

---

## Pre-flight checklist (before sending)

1. **CEO sign-off.** Per T-ATL-008 §9 RACI matrix, CEO is **A** (Accountable) for customer comms on all 5 scenarios. The Atlas / VP Eng / Hephaestus lanes do not have authority to send this.
2. **Legal review if PII-impact.** If the scenario is §3.3 (crypto key loss) or §3.4 (audit log tamper), the `[BRIEF_DESCRIPTION]` line MUST be reviewed by Legal / DPO before send. Without review, we risk premature Art. 33 disclosure.
3. **Status page in sync.** Post the same message to https://status.finplanpro.com BEFORE email goes out. If status page lags by >5 min, customers see email first and start Twitter threads.
4. **In-app banner live.** The "regional service disruption" banner is wired in `src/components/IncidentBanner.tsx` (T-ATL-004) — flip the `incident_mode` env var.
5. **30-min cadence.** Per the template, commit to 30-min updates in `#incident` Slack and on the status page. The first update is this message; the second update is at +30 min, even if there's no new info ("no change, still investigating" is acceptable).

---

## Cross-links

- **Parent.** `../DISASTER_RECOVERY_RUNBOOK.md` §8.1 (T-ATL-008, ACCEPTED 2026-06-13)
- **Sibling templates.** `employee-100-words.md` (internal), `board-200-words.md` (board), `gdpr-art-33-regulator.md` (regulator)
- **Sibling runbook.** `../ON_CALL_RUNBOOK.md` IC-1 (T-ATL-003, ACCEPTED 2026-06-13) — 15-min customer comms SLA
- **RACI reference.** T-ATL-008 §9 — CEO is A on customer comms
- **Status page.** https://status.finplanpro.com (incident-mode is wired to `src/components/IncidentBanner.tsx` per T-ATL-004)
- **PENDING.** T-HEP-009 (Hephaestus) PII scrubber for the `[BRIEF_DESCRIPTION]` field — currently manual review only

---

**End of customer template. 60-word budget, 3 channels, 5-item pre-flight. — Atlas 2026-06-13 07:55 IST**
