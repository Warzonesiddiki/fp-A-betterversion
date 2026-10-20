# Owner scope register — sections 108–200

> **STATUS: SOURCE OWED — NOT A REQUIREMENTS SOURCE.**
> This file is a blocker record, not the owner's checklist. It exists so the
> missing scope cannot be mistaken for "nothing to do" or for "all requirements
> mapped". Do not infer, paraphrase, or invent section titles from this page.

**Prepared:** 2026-10-20
**Base:** `b2cff43` (merge of PR #78)
**Owner-supplied scope of record:** a 200-section all-in-one FP&A checklist
(2026-10-18), of which sections 1–107 are mapped in
[MASTER_CHECKLIST_COVERAGE.md](../MASTER_CHECKLIST_COVERAGE.md).

> **Numbering ambiguity:** the coverage annex header still describes a
> **110-section** checklist; the owner's 2026-10-20 register describes **200**.
> This is not resolved. Ask the owner which version is current before mapping.
> Do not truncate at 110 and do not assume 111–200 are new sections rather than
> a re-numbering.

## 1. What is known, exactly

| Range              | Count   | State                                         | Evidence                                           |
| ------------------ | ------- | --------------------------------------------- | -------------------------------------------------- |
| 1–107              | 107     | Mapped in the coverage annex                  | `node scripts/check-coverage-annex.mjs` → 107 rows |
| 108–110            | 3       | **Unresolved** — source text not recovered    | Annex warning                                      |
| 111–200            | 90      | **Unassessed** — recorded as source text owed | Owner register, 2026-10-20                         |
| **Total expected** | **200** | **93 sections unassessed**                    | 200 − 107 = 93                                     |

The arithmetic is deliberate: 200 expected − 107 mapped = **93 sections** with no
reviewed source. "Missing" is not zero, not complete, and not permission to
guess.

## 2. Search record

Run these and record the exact result; the next agent must repeat and extend the
list.

```text
git log --all --oneline -S "111-200"
git log --all --oneline -S "200 sections"
git grep -n "108" -- docs
git grep -n "111" -- docs
find . -iname "*checklist*" -o -iname "*owner*" -o -iname "*scope*"
docs/archive/legacy-2026-10/_bmad/research/owner-direction-record-*.md
reports/
plan/
```

Initial result at `b2cff43`: the searches above found **no source text for
sections 108–200** in the repository or its reachable history. Owner-connected
sources (Notion, Google Drive, Gmail, Google Docs) have not been treated as
evidence unless the agent quotes an attributable location.

### 2.1 Owner-connected sources — searched 2026-10-20 (session 2, base `260c2d6`)

Searched, with the connected account, for the missing text:

| Source       | Query                                                                                                                                 | Result                                                                                                                                                                                                                                                           |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Google Drive | file names containing `checklist`, `scope`, `register`, `requirement`, `FP&A`, `FinPlan`                                              | 23 files. Relevant-looking: `FP&A Master Model — Dynamics 365 GL Import` (Sheet, modified 2026-10-19), `FinPlan_Pro_System_Prompt_Part1`–`Part15` + `Prompt_Upgrade_Log` + `GAP_ANALYSIS_v5` (all 2026-05-18), `FinPlanPro-Executive-Investor-Report-2026-08-04` |
| Google Drive | full text `checklist`; full text `Keyboard shortcuts (complete map)`                                                                  | 20 and 10 files. `SUGGESTION.md` (Doc, 2026-09-01) is a 7.5 KB engineering directive — not a numbered checklist. `Paste July 27, 2026 - 9:52AM` is a 342 KB userscript — not a checklist                                                                         |
| Notion       | page search for `Data Model`, `Traceability`, `Testing Gates Release`, `Security Egress AI`, `Repository Documentation Library`, `J1` | 12 project pages, all mirrors of repository documents; no owner checklist page                                                                                                                                                                                   |

**Verdict: not recovered.** The May-2026 prompt lineage in Drive is the ancestor
of the _system prompt_, not the 110/200-section coverage checklist; nothing found
numbers its sections. Do not treat any of these files as source text for
sections 108–200. The blocker stands: **93 sections unassessed** (108–110 plus
111–200).

What would close it: one pasted list, or one file, whose sections are numbered
continuously through 110 or through 200. A domain-level summary is not
acceptable and must not be promoted into numbered requirements.

## 3. Hard rules for this file

1. Do not create numbered headings for 108–200 until the owner's exact text is
   available. A guessed title is a fabricated requirement.
2. Do not mark any row `WORKS`, `PARTIAL`, `RETIRED`, or `NOT-SUPPORTED` without
   a source line and a decision id (for retirement).
3. Do not let the coverage gate pass silently: every unassessed row stays
   visible as `UNASSESSED — SOURCE OWED`.
4. Do not claim "all project requirements are accounted for" in any report,
   README, or in-product text while this file is in this state.
5. When the source arrives, replace this blocker record with the verbatim
   register, preserving sub-items and acceptance criteria. Keep the change in a
   dedicated commit so the scope expansion is reviewable.

## 4. Exact owner request

> Please provide the exact checklist text for sections 108–200, including every
> sub-item and acceptance criterion, and identify which document or message it
> came from. If the list changed since 2026-10-18, send the current version and
> say what changed. I will map it verbatim; I will not infer titles or statuses.

If the owner supplies only a summary, record it as a summary and keep the rows
unassessed. A summary is not a substitute for the section text.

## 5. Intake format (use only when the source arrives)

| #   | Exact title (verbatim) | Sub-items (verbatim) | Acceptance criteria | Source location | Status                     |
| --- | ---------------------- | -------------------- | ------------------- | --------------- | -------------------------- |
| 108 | _owed_                 | _owed_               | _owed_              | _owed_          | `UNASSESSED — SOURCE OWED` |
| …   | …                      | …                    | …                   | …               | …                          |
| 200 | _owed_                 | _owed_               | _owed_              | _owed_          | `UNASSESSED — SOURCE OWED` |

## 6. Gate change required with the source

Update `scripts/check-coverage-annex.mjs` and its test so that:

- the expected row count is 200 once the source exists;
- any row without a reviewed source is `UNASSESSED — SOURCE OWED`;
- an unassessed row cannot be silently upgraded to a closing status;
- `npm run docs:verify` keeps the gap visible until every row is dispositioned.

## 7. Change log

| Date       | Change                                                                | Evidence                                                   |
| ---------- | --------------------------------------------------------------------- | ---------------------------------------------------------- |
| 2026-10-20 | Blocker record created; 93 sections confirmed unassessed at `b2cff43` | `node scripts/check-coverage-annex.mjs`; repository search |
