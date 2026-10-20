# Owner scope register — sections 108–200

> **STATUS: SOURCE OWED — NOT A REQUIREMENTS SOURCE.**
> This file is a blocker record, not the owner's checklist. It exists so the
> missing scope cannot be mistaken for "nothing to do" or for "all requirements
> mapped". Do not infer, paraphrase, or invent section titles from this page.

<!-- coverage-scope: {"expectedSections":200,"sourceOwed":[108,109,110,111,112,113,114,115,116,117,118,119,120,121,122,123,124,125,126,127,128,129,130,131,132,133,134,135,136,137,138,139,140,141,142,143,144,145,146,147,148,149,150,151,152,153,154,155,156,157,158,159,160,161,162,163,164,165,166,167,168,169,170,171,172,173,174,175,176,177,178,179,180,181,182,183,184,185,186,187,188,189,190,191,192,193,194,195,196,197,198,199,200],"decision":"DEC-034"} -->

**Prepared:** 2026-10-20
**Base:** `b2cff43` (merge of PR #78)
**Owner-supplied scope of record:** a 200-section all-in-one FP&A checklist
(2026-10-18), of which sections 1–107 are mapped in
[MASTER_CHECKLIST_COVERAGE.md](../MASTER_CHECKLIST_COVERAGE.md).

> **Numbering ambiguity:** the coverage annex header still describes a
> **110-section** checklist; the owner's 2026-10-20 register describes **200**.
> DEC-034 records 111–200 as an extension, not a replacement. The exact
> numbered source/version still needs recovery before mapping.
> Do not truncate at 110 or change the legacy header without the reviewed source.

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
| Google Drive | full text `checklist`; full text `Keyboard shortcuts (complete map)`                                                                  | 20 and 10 files. the Drive document SUGGESTION.md (2026-09-01) is a 7.5 KB engineering directive — not a numbered checklist. `Paste July 27, 2026 - 9:52AM` is a 342 KB userscript — not a checklist                                                             |
| Notion       | page search for `Data Model`, `Traceability`, `Testing Gates Release`, `Security Egress AI`, `Repository Documentation Library`, `J1` | 12 project pages, all mirrors of repository documents; no owner checklist page                                                                                                                                                                                   |

**Verdict: not recovered.** The May-2026 prompt lineage in Drive is the ancestor
of the _system prompt_, not the 110/200-section coverage checklist; nothing found
numbers its sections. Do not treat any of these files as source text for
sections 108–200. The blocker stands: **93 sections unassessed** (108–110 plus
111–200).

### Continuation search — 2026-10-20, base `9f6d6a02`

- `git fetch --unshallow origin`, then `git log --all -S '111' -- docs`,
  `git log --all -S '111-200' -- docs`, `git log --all -S '200 sections' -- docs`,
  and `git log --all --name-only -- docs reports plan` inspected reachable
  history. `git grep -n '108' -- docs`, `git grep -n '111' -- docs`, and
  `find docs/archive reports plan` located the existing blocker, continuation
  records and historical prompt lineage, not the verbatim missing checklist.
  This is a search of fetched/reachable refs, not deleted remote branches.
- `gh pr list --state all --limit 100 --json number,title,body`: relevant PRs
  #78, #80 and #81 describe the gap; none supplies the missing list.
  `gh issue list --state all --limit 100 --json number,title,body` is blocked:
  `GraphQL: Resource not accessible by integration (repository.issues)`.
- Connected Notion search: `FinPlan`, `checklist`, `200`, `110-section`.
  The [scope register mirror](https://app.notion.com/p/3ff1d643919f817182d5d580013173d9)
  is explicitly a repository mirror, not independent owner source. The
  [Control Room](https://app.notion.com/p/3fe1d643919f81269663cfb3831b8c26)
  is historical; only its first page of children was inspected. No exhaustive
  Notion content search is claimed.
- Connected Drive `search_files`: full text `FinPlan`/`110-section` and names
  `checklist`/`FP&A`, then names `200`/`checklist`/`scope`/`requirement`.
  Retrieved excerpts of
  [Part 14](https://drive.google.com/file/d/1xL_zR7eKZT6UY5RhufWwC51O6W_ZE67r/view)
  and [Part 15](https://drive.google.com/file/d/1nFFqwyGDN6kKdM3ra1jZ5m8V884fM2Nh/view)
  identify May-2026 migration/plugin system prompts, not the missing numbered
  checklist. Responses were truncated; no assertion about unread content.
- Connected Gmail `list_messages`, including spam/trash:
  `"FinPlan" ("checklist" OR "200" OR "110-section" OR "108")` returned
  no messages with search scope complete.

**Result: not recovered in this bounded search.** The request below was sent
in this conversation as one batched request alongside D365/workflow/owner
inputs; no answer is inferred. **93 sections remain unassessed.**

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

## 6. Gate contract (DEC-037)

`scripts/check-coverage-annex.mjs` now reads the coverage-scope contract above
and retains the original annex header. It fails closed for absent/invalid
metadata and forbids closing a source-owed row. The contract is intake metadata,
not guessed requirements. When the source arrives, deliberately update the
source-owed set with reviewed evidence and a decision; the checker then requires
all expected rows or an explicit unresolved warning. Required invariants:

- the expected row count is 200 once the source exists;
- any row without a reviewed source is `UNASSESSED — SOURCE OWED`;
- an unassessed row cannot be silently upgraded to a closing status;
- `npm run docs:verify` keeps the gap visible until every row is dispositioned.

## 7. Change log

| Date       | Change                                                                | Evidence                                                   |
| ---------- | --------------------------------------------------------------------- | ---------------------------------------------------------- |
| 2026-10-20 | Blocker record created; 93 sections confirmed unassessed at `b2cff43` | `node scripts/check-coverage-annex.mjs`; repository search |
