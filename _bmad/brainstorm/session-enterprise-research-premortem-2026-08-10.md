# Brainstorm Session: Enterprise Research Recruitment Pre-Mortem

> **Facilitator:** Blaze · **Date:** 2026-08-10 · **Status:** DIRECTION SET  
> **Goal:** Identify how R-01 could produce misleading evidence before recruiting participants.

## Input context

FinPlan’s highest-risk assumptions concern enterprise willingness to pay, hybrid deployment, buying committee, and the first workflow wedge. A biased sample would make downstream PRD, UX, architecture, and commercial choices unreliable.

## Techniques

Reverse brainstorming, six thinking hats, and pre-mortem.

## Divergent phase — failure modes generated

1. Only friendly contacts agree to interviews.
2. Only finance leaders participate; controllers, analysts, and IT are missing.
3. Participants describe ideal processes rather than recent actual workflows.
4. Vendor/partner participants dominate evidence.
5. Existing FinPlan UI/demo is shown too early and creates confirmation bias.
6. Researcher treats feature requests as evidence of urgent pain.
7. One vertical or geography dominates the sample.
8. Hybrid/local-first supporters self-select; security skeptics do not respond.
9. Interviews collect confidential financial data that cannot be retained or compared.
10. Quotes are summarized without contradiction or source context.
11. No one with purchase/procurement authority is included.
12. Evidence log is updated late, allowing memory and narrative drift.

## Non-obvious combinations

- 1 + 8: a friendly, local-first-positive sample falsely validates the core differentiator.
- 2 + 11: strong product-user enthusiasm without commercial authority creates false go-to-market confidence.
- 3 + 6 + 12: idealized workflow stories become an invented requirement backlog.

## Convergent phase

### Controls selected

| Failure mode | Preventive control | Detection signal |
|---|---|---|
| Friendly/positive sample | recruit incumbent users, rejectors, and skeptics; disclose relationship | >50% from one referral/relationship source |
| Missing role coverage | hard quotas for CFO/controller/FP&A/IT | cohort tracker has role shortfall |
| Idealized accounts | require recent-event walkthrough before concepts | no concrete system/handoff/example described |
| Demo confirmation bias | current workflow first; concept only after evidence capture | feature talk appears before workflow notes |
| Vertical concentration | cap at 40% one vertical | tracker shows overrepresentation |
| Security self-selection | recruit through IT/security path, not finance only | no enterprise security participant scheduled |
| Narrative drift | log same day with verbatim/observed distinction | incomplete evidence rows or no disconfirming field |

## Pre-mortem outcome

R-01 cannot be marked complete merely by raw interview count. It requires balanced cohort coverage, recent real workflow evidence, disclosed bias/conflicts, and a review of missing disconfirming perspectives.

## Open questions

- Which owner/team member will perform outreach and hold consent/scheduling data outside the repository?
- Which enterprise accounts or communities can provide independent controller and IT/security participants?
