<!-- DRAFT v0.3 — awaiting review — Atlas 2026-06-13 (added GDPR DPA cross-link, T-ATL-018) -->

# DR comms templates — index & usage

> **Parent.** `../DISASTER_RECOVERY_RUNBOOK.md` §8 (T-ATL-008, ACCEPTED 2026-06-13).
> **Per-template pre-stage.** This directory holds the 5 standalone files so CEO / Legal / Atlas can `cat` and `sed` at incident time instead of writing from scratch under pressure.
> **Source-of-truth rule.** When a template here disagrees with the inline skeleton in `DISASTER_RECOVERY_RUNBOOK.md` §8, **the standalone file wins** (the standalone is the form CEO actually fills in; the inline in the runbook is a reference, kept in sync at annual review per §10).

---

## The 5 templates

| #     | File                            | Audience                                         | Channel                                                     | Word budget                                               | Sed pattern                                        | Pre-flight   | Status                                                                              |
| ----- | ------------------------------- | ------------------------------------------------ | ----------------------------------------------------------- | --------------------------------------------------------- | -------------------------------------------------- | ------------ | ----------------------------------------------------------------------------------- |
| 1     | `customer-60-words.md`          | End customers (MAU)                              | Email + status page + in-app banner                         | ≤ 60 words                                                | Single-pass `sed`                                  | 5 items      | Phase 0 ready                                                                       |
| 2     | `employee-100-words.md`         | All employees                                    | Slack `#incident` + email-all                               | ≤ 100 words                                               | Single-pass `sed`                                  | 5 items      | Phase 0 ready                                                                       |
| 3     | `board-200-words.md`            | Board of directors + major investors             | Email + 15-min Zoom                                         | ≤ 200 words                                               | Multi-line `sed` (financial fields are structured) | 6 items      | Phase 0 ready                                                                       |
| 4     | `gdpr-art-33-regulator.md`      | Lead supervisory authority (Art. 56)             | Email + registered post                                     | 8 mandatory fields (Art. 33(3))                           | Multi-line `sed` (8 fields are independent)        | 8 items      | Phase 0 ready                                                                       |
| **5** | **`customer-art34-private.md`** | **Each affected data subject (1-to-1, Art. 34)** | **Per-customer email (plain-text primary, HTML secondary)** | **250-400 words (Art. 34(1) "clear and plain language")** | **Multi-line `sed` (12 fields are independent)**   | **10 items** | **Phase 1, gated on Strategos T-ST-010 (DEC-002 Main Est) ratification 2026-09-15** |

---

## At-incident-time workflow

```
# 1. CEO opens the right template
cat docs/drafts/atlas/dr-templates/customer-60-words.md  # if SEV-1/SEV-2 customer-facing
cat docs/drafts/atlas/dr-templates/employee-100-words.md  # always, first
cat docs/drafts/atlas/dr-templates/board-200-words.md     # if SEV-1/SEV-2 board-facing
cat docs/drafts/atlas/dr-templates/gdpr-art-33-regulator.md  # if §3.3 / §3.4 scenario triggered
cat docs/drafts/atlas/dr-templates/customer-art34-private.md  # if Art. 34 high-risk threshold met (Phase 1)

# 2. Fill the [BRACKETED_FIELDS] via sed (example for customer template)
sed -e 's/\[SHORT_DESCRIPTION\]/EU region failover in progress/g' \
    -e 's/\[BRIEF_DESCRIPTION: e\.g\., "regional service disruption in EU"\]/regional service disruption in EU/g' \
    -e 's/\[N hours\]/2/g' \
    -e 's/\[safe \/ at risk of ≤ N minutes of recent changes\]/safe/g' \
    -e 's/\[CEO name\]/Founder Name/g' \
    docs/drafts/atlas/dr-templates/customer-60-words.md > /tmp/customer-message.txt

# 3. Pre-flight checklist (in each file, last section)
# 4. Sign-off (CEO for templates 1-3, Legal/DPO for template 4)
# 5. Send through the listed channel
# 6. Commit the filled text back to docs/drafts/atlas/dr-templates/FILLED/ for post-mortem
```

> **WHY: `cat | sed`, not copy-paste into a new file.** The standalone template files are immutable except during the §10 annual review. Filling happens via `sed` redirect to `/tmp` or `FILLED/`, never in place. This preserves the structural template as a single source of truth — every CEO since 2026 reads the same skeleton.

---

## Maintenance cadence

- **Annual review (Q1).** Per `DISASTER_RECOVERY_RUNBOOK.md` §10 step 6 — "Re-test the comms templates. Do a dry-run with a real incident simulation; verify the templates fit the actual facts." Atlas + VP Eng drive this review. Any drift between a template and the inline §8 skeleton gets reconciled — **standalone file wins** as the source of truth.
- **Per-incident retrospective.** After every SEV-1 / SEV-2, the filled message is added to `docs/drafts/atlas/dr-templates/FILLED/{incident-id}.md` and reviewed within 7 days. If a field consistently turns out to be wrong (e.g., RTO is always 4h, not "N hours"), the template gets a refinement in the next quarterly review.
- **Sed-safe character discipline.** All `[BRACKETED_FIELDS]` use only `[A-Z_ a-z0-9,.|:()%-]` characters. No `&`, `/`, `\`, `'`, `"`. This discipline is enforced at template-edit time — any new field that breaks the sed-safe character set is rejected at PR review.

---

## Cross-links

- **Parent.** `../DISASTER_RECOVERY_RUNBOOK.md` §8 (T-ATL-008, ACCEPTED 2026-06-13)
- **Sibling.** `../DISASTER_RECOVERY_RUNBOOK.md` §5 (4-audience comms plan with trigger conditions)
- **Sibling.** `../DISASTER_RECOVERY_RUNBOOK.md` §9 (RACI matrix — A column drives the LEAD field in template #2)
- **Sibling.** `../DISASTER_RECOVERY_RUNBOOK.md` §10 (annual review process — drives template maintenance)
- **Sibling runbook.** `../ON_CALL_RUNBOOK.md` §1 (T-ATL-003, ACCEPTED 2026-06-13) — SEV-1 to SEV-4 definitions
- **Scenarios.** `../DISASTER_RECOVERY_RUNBOOK.md` §3.1-§3.5 — the 5 scenarios that trigger the templates
- **PENDING DEC-002 candidate.** Main establishment designation (Strategos) — drives Art. 56 routing in template #4
- **Sibling compliance.** `../GDPR_DPA_CROSSLINK.md` (T-ATL-018, DRAFT v0.1) — Atlas × Hephaestus cross-link to T-HEP-014 §3 sub-processor list. The 5 templates touch 4 of 8 sub-processors (R2, Sentry, Vanta, Postmark); the cross-link is the Art. 28 chain-of-custody for each.

---

**5 templates, 1 index, 1 GDPR DPA cross-link, CEO at-incident-time ready, sed-safe character discipline, annual review per §10. — Atlas 2026-06-13 (v0.3 with GDPR DPA cross-link)**
