---
name: owner-pack-completion
description: Use when reporting open plan-review questions and owner decisions. Separates accepted decisions, unanswered questions, safe defaults, and evidence limits.
group: meta
---

# Owner Pack Completion

**Use it when:** summarizing current owner decisions and unanswered plan-review questions for a release or completion report.

## Method

1. **Read current authorities:** distinguish accepted decisions in `docs/discovery/decision-log.md` from the open R1–R12 questions in the master plan. DEC-104 resolves O1’s universal-template direction; DEC-103 resolves O9 as a single-user product; DEC-105 approves the phased plan without answering R1–R12.
2. **Record status accurately:** cite the decision/question, date, evidence, and owner. Do not relabel an open question as accepted or BLOCKED-ON-OWNER unless the governing register says so.
3. **No inference:** silence is not an answer. Retain the documented safe default, label the choice OWNER REVIEW, and state its release/work impact.
4. **State boundaries:** distinguish intended scope from proven capability. Do not claim real-source verification, data safety, SOX authority, CI status, or multi-user authorization without evidence; do not call DEC-103 entity scope unanswered.
5. **Reply template:** provide a copy-paste template for the owner to answer an actually open question.

## What this prevents

- Claiming D365 verified without a real export
- Saying "your data is safe" without a restore test
- Claiming SOX compliance without an authority source
- Inferring CI status from a local run or an unavailable check
- Treating unanswered plan questions as accepted owner decisions
- Reopening DEC-103 entity scope without a new owner decision

## Related

- `docs-and-decisions` — how decisions are recorded
- `release-engineering` — release preparation
- `zero-compromise-verification` — the overarching discipline
