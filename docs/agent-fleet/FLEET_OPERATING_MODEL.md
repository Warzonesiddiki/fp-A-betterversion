# FinPlan Pro — 15-Seat Agent Fleet: Operating Model

> **NOT ADOPTED — owner decision, 2026-10-21.** The 15-agent fleet is dropped; work proceeds **solo**.
> This document is retained as a design record only (this repository archives with a reason rather
> than deleting). Nothing here is in force. Two findings survive the decision and remain useful:
> **(1)** peer visibility never needed a merge — `git fetch` + `git worktree` reads and *runs* an
> unmerged branch (§3a); **(2)** the ratchet transaction in §6 is a real constraint on any future
> parallelisation.

**Status:** proposal for owner approval · 2026-10-21
**Author:** lead seat (this session) · **Branch:** `arena/ef7aacd6-fp-a-betterversion`
**Supersedes:** nothing. Extends [`docs/agent-squad/agents-comms/README.md`](../agent-squad/agents-comms/README.md).

---

## 0. Read this first: the experiment has already been run

This repository has **already hosted a 12-seat agent squad**. It is not a hypothetical.

From [`docs/agent-squad/agents-comms/ROSTER.md`](../agent-squad/agents-comms/ROSTER.md): 11 Gemini seats (G-01…G-11) plus a lead, joined **2026-10-16**. From
[`docs/agent-squad/agents-comms/STATUS_BOARD.md`](../agent-squad/agents-comms/STATUS_BOARD.md), by **2026-10-17** — under 48 hours — the board reads:

| Seat | Outcome |
|---|---|
| G-01 | "Seat departed" |
| G-02 | "Seat departed; **uncommitted** `d365Parser.{ts,test.ts}` verified green and **landed by LEAD**" |
| G-05 | "Seat departed; **uncommitted** `boardPackTieOut…` + export changes verified green and **landed by LEAD**" |
| G-06 | "Seat departed before `masterStorage.test.ts` landed — **claim revoked, no file exists**" |
| G-07 | "…orphan `AnomalyExplainer.integration.ts` **deleted by LEAD**" |
| G-08 | "Seat departed; gate verification **absorbed by LEAD**" |
| G-09 | "Seat departed; fixture suite **repaired by LEAD**" |
| G-11 | "Seat departed; board/claims/log sync **absorbed by LEAD**" |

Lead's own row: **"Solo mode (all Gemini seats departed 2026-10-17)"**.

**Every single failure is the same failure**, and it is precisely the constraint you just described: *"you won't be able to access their workspace."* Work existed only inside a sandbox nobody else could reach, so a departing agent's labour evaporated and had to be reconstructed by hand. The squad did not fail on intelligence or effort. **It failed on transport.**

Two consequences follow, and they set the whole design:

1. **No seat may ever hold unpushed work.** A work unit that is not on `origin` does not exist. This is rule R-01 and it is non-negotiable.
2. **Do not re-run the 2026-10-16 design.** Simply re-seating 15 agents on the old protocol reproduces the collapse at 1.25× headcount.

---

## 1. Why Google Drive cannot be the primary bus

You proposed Drive/Docs/Sheets/Slides/Notion as the shared surface. Drive is genuinely valuable here (§5) — but **not for code or coordination**, and the reason is mechanical, not aesthetic:

| Need | Drive / Docs / Sheets | Git (already available to every seat) |
|---|---|---|
| Concurrent edit safety | **Last write wins.** Two agents editing one Doc silently destroy one another's paragraph. | Merge; conflicts are surfaced, not swallowed. |
| Locking a file | None. Sheets has no compare-and-swap. | Draft PR = one atomic API call, race-free (§4). |
| Attributable history | Version list, coarse, non-diffable for tables | Commit graph, per-line blame, trailers |
| Testable state | Cannot run tests against a Doc | `npm run check` runs against the tree |
| Rollback | Manual "restore version" | `git revert`, exact |
| Automated gates | None | 15 gate scripts already wired |

A 15-seat fleet on Docs/Sheets produces **silent data loss at the exact places coordination matters most** (who owns what, what is done). The repo already proves the good version of this: the squad's own README says *"There is no chat server: every member session has a checkout of this repo, so the repository is the channel."* That instinct was right. The implementation was wrong (§3).

**So: GitHub is the bus. Notion is the owner's window. Drive is the vault.** All three, each doing what it is actually good at.

---

## 2. The design bug in the current bus (and the fix)

The existing protocol routes all coordination through **single shared files**:

| File | Writers | Problem at 15 seats |
|---|---|---|
| `docs/agent-squad/agents-comms/CLAIMS.md` | Everyone appends a row to one markdown table | 15 agents editing adjacent table rows = conflict on nearly every claim |
| `docs/agent-squad/agents-comms/COMMS_LOG.md` | Everyone appends | Same file, same tail, constant conflicts |
| `docs/agent-squad/agents-comms/STATUS_BOARD.md` | Each seat edits "their own row" | Rows are still one file; 15 concurrent edits |
| `docs/agent-squad/agents-comms/BLOCKERS.md` | Whoever is blocked | One file |

At 3 agents this is fine. At 15 it is a denial-of-service on the only channel. Note the existing mitigations are already strained — the 24-hour stale-claim rule is meaningless when seats act in minutes, and the lead already had to absorb four seats' board/log duties manually.

**The fix is structural, and it is small:**

> **N agents must write N different files, or no files at all.**

Which gives the two-mechanism design below.

---

## 3. The three planes

### Plane 0 — Truth and locking: GitHub *(arbiter)*

- Each seat works on its **own branch**, exactly as Arena already gives it: `arena/<uuid>-fp-a-betterversion`. No seat ever pushes to another's branch or to `main`.
- **A claim is a draft PR.** This is the whole locking mechanism, and it is race-free because creating a PR is a single atomic API call — unlike writing a row into a shared markdown table.
  - Title: `[S-06] FP-014 GLEntry money types — phase 1`
  - Draft state = `CLAIMED`. Ready-for-review = `READY`. Merged = `DONE`. Closed unmerged = `ABANDONED` (with reason).
  - Any seat can enumerate the whole fleet's state with one command:
    `gh pr list --state all --limit 50 --json number,title,isDraft,author,headRefName,updatedAt`
  - **`gh pr list` replaces `docs/agent-squad/agents-comms/CLAIMS.md` and `docs/agent-squad/agents-comms/STATUS_BOARD.md` entirely.** No shared file, no race, real timestamps, real attribution.
- Commit trailers for attribution: `Seat: S-06`, `Work: FP-014`, `Evidence: <command>`.
- Only the Integrator (S-00) merges. Merge is the only serialization point.

> **Correction (owner input, 2026-10-21).** The concern raised was: *"you cannot see or check another agent's files until they raise a PR and merge to main."* The first half of that is a workflow choice, not a platform limit — and the fix changes the architecture. **PR is the merge gate, not the visibility gate. Push is the visibility gate.** See §3a; it is verified by execution, not asserted.

### Plane 1 — Narrative and handoff: file-per-note in git

The one thing PR metadata cannot carry is prose. Keep it, but **one file per note**, so no two seats ever write the same path:

```
docs/agent-fleet/
├── FLEET_OPERATING_MODEL.md      # this document
├── work/                          # one file per work unit: scope, DoD, owner
│   ├── FP-001.md
│   └── FP-014.md
├── log/                          # one file per note — append-only by construction
│   ├── 2026-10-21T14-30Z-S-06.md
│   └── 2026-10-21T15-02Z-S-02.md
├── handoff/                      # the anti-collapse mechanism (R-01)
│   └── S-06-2026-10-21T18-00Z.md
└── dispatch/                     # wave assignments; S-00 writes, everyone reads
    └── WAVE-1.md
```

Existing `agents-comms/` files are **preserved as history** (§8 explains why we do not delete them — the repo's own rule).

### Plane 2 — Owner's window and binary vault: Notion + Drive

Notion and Drive are **single-writer surfaces**, fed by S-00/S-01. They are not collaboration surfaces. Detail in §5.

---

## 3a. Peer visibility: see and *run* unmerged work

The concern raised was that you cannot see or check another agent's files until they open a PR and merge to `main`. **That is a workflow choice, not a platform limit.** The table below was **executed against this repository on 2026-10-21** on a genuinely unmerged branch; outputs are quoted verbatim.

### Step 1 — Watch what exists (no clone, no fetch)

```bash
git ls-remote --heads origin
```
Returned every branch immediately, including one that has never merged:
```
0c85d424…  refs/heads/arena/05b88142-fp-a-betterversion  ← PR #83, never merged
6e199226…  refs/heads/arena/5a296081-fp-a-betterversion
bab7b621…  refs/heads/arena/efe658d1-fp-a-betterversion
```

### Step 2 — Bring a peer's tree in without touching mine

```bash
git fetch origin <peer-branch>:refs/peers/<seat>
# → * [new branch]  arena/05b88142-… -> refs/peers/S-83
```
No merge, no PR, no checkout, no interference with my working tree.

### Step 3 — Read their code without checking it out

```bash
git show refs/peers/S-83:docs/HANDOVER_NEXT_SESSION.md | head -40   # works
git diff refs/remotes/origin/main...refs/peers/S-83                 # review the change
```

**Verified gotcha — this clone is shallow.** `git merge-base` first returned *nothing*, so the diff failed with **"no merge base"**. Fix in this order:

```bash
[ -f .git/shallow ] && git fetch --deepen=50 origin <peer-branch>:refs/peers/<seat>
git merge-base refs/remotes/origin/main refs/peers/S-83    # → 9f6d6a02 (resolves)
git diff refs/remotes/origin/main...refs/peers/S-83
#   docs/HANDOVER_NEXT_SESSION.md | 139 +++++++++++++++++++++++++
#   1 file changed, 139 insertions(+)
```
Without the `--deepen` step a reviewer concludes **"they changed nothing"** — a silent failure worse than no review.

### Step 4 — *Execute* their unmerged tree (the actual answer)

```bash
git worktree add /tmp/peer-review refs/peers/S-83 --detach
# Preparing worktree (detached HEAD 0c85d424)
cd /tmp/peer-review && npm ci --ignore-scripts && npx vitest run <their-test>
```
**Verified:** the worktree materialised and `src/services/import/d365Parser.ts` was present and runnable. So:

> **A reviewer can reproduce a peer's claim on the peer's code, in parallel, in a separate directory, while the author keeps working — and neither party can break the other.** It shares the object store, so it costs no extra clone. Remove with `git worktree remove /tmp/peer-review --force`.

### Step 5 — Presence: what they are doing *right now*

Git shows pushed state, not intent. Add a heartbeat that is **one file per seat**, so 15 writers never touch one path:

`docs/agent-fleet/state/S-06.json` — written only by S-06, overwritten each heartbeat:
```json
{ "seat":"S-06", "model":"<id>", "work":"FP-014", "state":"WORKING",
  "branch":"arena/<uuid>", "head":"<sha>", "lastPush":"2026-10-21T14:30Z",
  "next":"money types phase 1", "blocker":null }
```
Everyone reads all 15 in one `git fetch` + `cat docs/agent-fleet/state/*.json`. This **replaces** the conflicting `docs/agent-squad/agents-comms/STATUS_BOARD.md` row-editing, and is diffable, timestamped and attributable.

### What this corrects

| Old assumption | Correction |
|---|---|
| "Merge to see the work." | **Push to see it; merge to canonicalise it.** |
| Review = read the PR afterwards | Review = `fetch` + `show`/`diff` + `worktree`, **while it is still WIP** |
| `docs/agent-squad/agents-comms/STATUS_BOARD.md` row editing | 15 single-writer `state/<seat>.json` files |
| PR = visibility **and** merge gate | PR = **merge gate only** |

**Consequence for R-01:** pushing every 45 minutes is no longer only a data-loss defence — it *is* the visibility mechanism. A seat that does not push is not just at risk, it is **invisible**, and S-00 revokes its claim under R-04.

---

## 4. The fifteen seats

Ownership is by **path**, and the assignment is built from the actual pending work, not invented. Conflict classes are called out per seat.

### Command (2)

| Seat | Remit | Owns | Must not touch |
|---|---|---|---|
| **S-00 INTEGRATOR** | Sole merger. Owns shared/generated files and the ratchet transaction (§6). Runs the full sharded suite once per batch. Revokes stale claims. | `main`; `scripts/*-baseline.json`; `src/engines/engineManifest.generated.ts`; `docs/product/ROUTE_MAP.md`; README stats block; `docs/agent/09_KNOWN_GAPS.md`; `docs/TASKBOARD.md`; `docs/HANDOVER_NEXT_SESSION.md` | product code (would make it both author and judge) |
| **S-01 DECISION** | Owner liaison. Drives O1–O9, records answers in `docs/discovery/decision-log.md`, keeps the Notion Decision Register true. **Never invents a decision.** Owns the DEC-033 scope carve-out. | `docs/discovery/decision-log.md`; `docs/discovery/OWNER_DECISION_PACKET.md`; `docs/discovery/OWNER_SCOPE_REGISTER_111_200.md`; Notion Decision Register | anything under `src/`, `server/`, `scripts/` |

### Verification (2)

| Seat | Remit | Owns |
|---|---|---|
| **S-02 RED TEAM** | **Adversarial.** Different standing instruction from everyone else: *do not build, falsify.* Reproduce every `DONE` claim from a clean checkout of that seat's branch; try to break it; return `VERIFIED` / `FALSIFIED` / `UNREPRODUCIBLE`. Writes tests that *should* pass and reports the ones that don't. | `docs/agent-fleet/reviews/**`; may add tests anywhere but may never modify product source |
| **S-03 GATES** | Owns the gates themselves: fix the `verify-readme-stats.mjs` blind spot (routes + test tally are unasserted today), make `license:check` fail-closed, keep ratchet scripts honest (one was once vacuous — see STATUS_BOARD on `ratchet-docs-check.mjs`). Also owns the CI-403 workaround: a local `npm run check` evidence harness that substitutes for unreadable Actions. | `scripts/**` **except** `*-baseline.json` (S-00) |

### The spine — close it out (2)

| Seat | Remit | Owns | Conflict risk |
|---|---|---|---|
| **S-04 SPINE ACCEPTANCE** | Gate 2 is arguably finished (7,716 LOC in `src/services/import/`). Write the acceptance line — synthetic D365 file → deterministic import/reject → quarantine with reasons → control-total tie-out → round-trip — run it, publish the verdict. | `glStaging*.ts`, `monthEndClosePipeline.integration.test.ts` | shares `d365Parser.ts` boundary with S-05 — split by file, not by concern |
| **S-05 DATA CONTRACTS** | Parser/tokenizer/provenance; D365 export contract; first analysis of any real sample once O1 lands. | `d365Parser.ts`, `glCsvTokenizer.ts`, `glXlsxTokenizer.ts`, `parseGLRows.ts`, `importProvenance.ts`, `src/types/glIngestion.ts`, `docs/discovery/d365-export-contract.md` | **must not touch staging/promotion** (S-04) |

### The critical structural gap (3)

| Seat | Remit | Notes |
|---|---|---|
| **S-06 MONEY-DOMAIN** | `GLEntry.debit/credit/amount` and TB rows: `number` → `Money`. Audit P1-11, the highest-leverage refactor in the repo — the money primitive is excellent and the ledger opts out of it. | **Serializes before S-07.** Touches `src/types/**`, so it is a global blast radius; run it alone, in phases. |
| **S-07 PERSISTENCE-RELATIONAL** | The 35-table schema in `src-tauri/migrations` is never written by the app; financial data is encrypted JSON blobs in one KV table; server's 10 tables are 9 disjoint. P1-7. | Starts only after S-06 phase 1 merges. |
| **S-08 MONEY SWEEP** | Mechanical adoption 29.99 % → 100 % bar across `src/engines/**` subdirectories. **The only trivially parallel lane** — and the one that can later fork into 2–3 seats (split by subdirectory, never by file). | Files only; **never** the baselines (§6) |

### Authority (2)

| Seat | Remit | Blocked on |
|---|---|---|
| **S-09 N3-RBAC** | Per-store denial tests over the 409-action census (302 guarded / 107 reasoned exceptions). | Entity grants → **O9**. Can advance everything except entity authority. |
| **S-10 N2-AUDIT** | Audit-chain durability, keying, anchoring; the DEC-036 census is already a build gate. | **O4** (is the chain client evidence or SOX?). Can classify and prove adapters; **cannot close**. |

### Surface reduction (2)

| Seat | Remit | Conflict risk |
|---|---|---|
| **S-11 SCOPE CUT** | 231 routes → the documented ≤40 top-level target. Owns the disposition table. | **`src/App.tsx` is the most-contended file in the repo.** Single owner, scheduled in its own window; everyone else is forbidden from touching it. |
| **S-12 ENGINE REACHABILITY** | 82 orphan engines: wire, or archive with a DEC reference. | Outputs a manifest → S-00 regenerates it |

### Output & hygiene (2)

| Seat | Remit |
|---|---|
| **S-13 EXPORT TIE-OUT** | No PPTX exists; no cross-artifact test. Build the equality proof: UI value == Excel cell == PDF text == PPT text on a golden period. Owns `src/engines/*Export*`, `src/services/export/**`. |
| **S-14 HYGIENE** | a11y, determinism, palette ratchets — per-file, zero shared ownership, ideal filler lane. |

---

## 5. Where Drive, Notion, Docs, Sheets and Slides actually earn their place

Be precise, because ceremony is the enemy here.

### Google Drive (5 TB) — the **binary and evidence vault**

The repo is **40 MB / 3,617 files**. It does not need 5 TB. Three things genuinely do:

1. **O1 intake — the highest-value use.** O1 asks for *one real anonymized D365 export per shape (F&O GL, journal entity, BC G/L) plus control totals*. That is the #1 owner blocker in the project and it is a file drop. Create:
   `FinPlanPro/O1-d365-samples/{fando-gl, journal-entity, bc-gl}/` + `MANIFEST` + `control-totals/`.
   This single folder may unblock more than any code work, and it costs one drive.
2. **Fixture corpora and golden files** too large for git (large XLSX, multi-period datasets).
3. **Visual/binary evidence** — screenshots, a11y reports, bundle reports, PPTX output. The 2026-10-15 audit already wanted visual-regression PNGs out of the repo.

**Never** put coordination state in Drive.

### Google Sheets — exactly one job

The **O1 intake manifest + control-total reconciliation**, because that artefact is genuinely tabular and owner-editable. Everywhere else, Sheets will be corrupted by concurrent writes. Do not maintain a fleet status sheet — that is the PR list, and duplicating it creates the exact drift this repo already suffers from.

### Notion — the **owner's window**, single-writer

The Control Room currently carries **four stacked correction callouts** explaining that it is historical and that status lives elsewhere. That happened because too many writers touched status. The lesson is not "add more pages" — it is **fewer writers**.

- **One new database: `FLEET QUEUE`** — one row per PR (auto-synced from `gh` by S-00/S-01): `ID · Title · Seat · State · Files · Evidence · Verified-by-S-02 · Merged-sha`. Read-only for everyone else.
- **Existing pages keep exactly one writer each:** Current Status (S-01), Handover (S-01, append-only), Decision Register (S-01). **No seat writes Notion directly** except S-00/S-01.
- Optionally **Google Docs / Slides** for owner-facing narrative only: one weekly brief, one milestone deck, single writer. Never a working surface.

---

## 6. The atomic-transaction problem — the single most important rule

This is the specific reason naive parallelism will fail here, and it is not obvious until you trace the gates.

A one-line money-adoption improvement is **not a one-file change**. `ratchet-docs-check.mjs` requires the baseline JSON to equal the prose in four live documents, and `docs:verify` chains five more checks. One real improvement is a transaction across:

1. `scripts/money-adoption-baseline.json`
2. `scripts/money-ast-baseline.json` (if guarded sites change)
3. `src/engines/engineManifest.generated.ts` (if an engine is added/retired)
4. `docs/agent/09_KNOWN_GAPS.md` — documented baselines table
5. `docs/discovery/requirements-register.md` — NFR-001 prose
6. `docs/agent/01_PROJECT_BRIEF.md` + `docs/agent/03_DOMAIN_RULES.md` — prose counts

**Rule R-07:**
> Lane seats produce **code and tests only**. They never edit a `*-baseline.json`, a generated file, or any of the four prose documents above. The Integrator performs the entire ratchet transaction **once per merge batch, in a single commit, after all lane PRs in the batch are merged.**

Quantified: 15 seats naively raising adoption produce **90+ conflicting hunks** across 6 shared files. Serialized: **one commit**. This rule alone is the difference between a fleet and a food fight.

Corollary — the same applies to `docs/product/ROUTE_MAP.md`, the engine manifest, the README stats block, `docs/TASKBOARD.md` and `docs/HANDOVER_NEXT_SESSION.md`. All are **S-00 only**. That is why S-00 writes no product code: it must not be both author and judge of the ratchets.

---

## 7. Survival rules (each one is a scar from §0)

| ID | Rule | Why |
|---|---|---|
| **R-01** | **Push before you stop.** Every seat pushes its branch at least every 45 minutes and before ending any turn. WIP commits are explicitly allowed and expected. | The only failure mode that actually killed the last squad. Unpushed work is deleted work. |
| **R-02** | **PR is the claim.** No `docs/agent-squad/agents-comms/CLAIMS.md` rows. Draft PR = claimed. | Removes the single-file race; gives free timestamps and attribution. |
| **R-03** | **One work unit in flight per seat.** Do not start a second before the first is merged or explicitly parked. | The last board shows half-finished WIP across four seats. |
| **R-04** | **Claim TTL = 45 min heartbeat, 2 h stale → Integrator revokes.** (Was 24 h; meaningless at agent speed.) | Prevents dead claims from blocking live work. |
| **R-05** | **Evidence or it is not done.** PR body carries a fenced block: exact command + raw output + tally. "Tests pass" is not evidence. | Already the repo's culture — enforce it mechanically. |
| **R-06** | **Failing-first.** The test that proves the change must be shown red before green. | Stops vacuous gates, which this repo has already shipped once. |
| **R-07** | **Baselines and shared docs are S-00 only.** (§6) | Turns 90 conflicts into 1 commit. |
| **R-08** | **`src/App.tsx` has one owner** (S-11), scheduled in isolation. | It is the highest-contention file; 231 routes live in it. |
| **R-09** | **A lane runs targeted tests; S-00 runs the full sharded suite once per batch.** | Full suite is ~1,057 s and wants 8 GB. 15 seats running it is ~4 h of duplicated compute per round. |
| **R-10** | **Nothing merges without S-02 `VERIFIED`.** | Clones cannot review clones (§8). |
| **R-11** | **Blocked means parked, not idle-guessed.** If the answer is an owner decision, name the DEC id, open a `BLOCKERS` note, and take the next finishable unit. Never invent a decision. | The last squad's blocker handling worked; keep it. |
| **R-12** | **Do not weaken a gate to pass it.** Fix the cause, or stop and report. | Existing rule; restated because 15 agents create 15× the temptation. |

---

## 8. Verification: revised for heterogeneous models

**This section is rewritten because owner input materially changed the conclusion.** I originally argued that 15 exact clones give ≈ zero independent review, because identical agents share identical blind spots. With **each seat running a different model** (platform auto-selection per task, or random assignment), that objection is substantially — not entirely — answered. Different training data, different priors, different failure modes. **Cross-model review is real independence.** It is the single biggest upgrade available to this plan, and it costs nothing.

The evidence that clones alone would not have been enough still stands: this repo has already shipped a **vacuous gate** (`ratchet-docs-check.mjs` matched a hard-coded `/`, so on Windows it never read the file it was given; 3 of its 7 cases could not fail) and a **false README** that a `docs:verify` gate was meant to prevent. Both were surfaced by different *kinds* of checking, not by re-reading.

### 8.1 Model assignment is a per-seat property — never a global random switch

Randomising the model on a financial-correctness lane is how you get a confident, wrong journal entry. Assign by **blast radius**, not by variety for its own sake:

| Tier | Seats | Policy | Why |
|---|---|---|---|
| **Deterministic — strongest available, pinned** | S-00 Integrator, S-01 Decision, S-02 Red Team, S-04 Spine Acceptance, S-06 Money-Domain | One named model, same every run | Highest blast radius; decisions and financial semantics must not vary between sessions |
| **Auto-selected per task** | S-05, S-07, S-09, S-11, S-13 | Platform picks by task type | Mixed work; let the platform route it |
| **Random / rotating — diversity is the point** | S-08 Money Sweep, S-12 Reachability, S-14 Hygiene | Rotate models across PRs | Mechanical, low blast radius, high volume — here heterogeneity is cheap insurance |
| **Always different from the author** | S-02 Red Team | Enforced per review | The rule that makes cross-model review real |

### 8.2 The new verification rule

> **R-10′ — A claim is `VERIFIED` only by a seat running a *different model* than the author.**
> **R-10″ — Financial-correctness changes (money, GL, period close, persistence) need two verifiers on two different models, both different from the author.**

This is now mechanically checkable because every commit and PR records its model:

```
Seat: S-06
Work: FP-014
Model: <model-id>
Evidence: npx vitest run src/types/glEntry.money.test.ts   → 18/18 passed
```

The `Model:` trailer buys three things: **attribution**, **reproducibility** (a regression can be re-run on the model that produced it), and **drift detection** (if a seat's compliance falls, the model change is visible in the log).

### 8.3 New risks that heterogeneity introduces

| Risk | Why it bites | Mitigation |
|---|---|---|
| **Weakest-model bottleneck** | Protocol compliance varies wildly. One seat that never pushes, or edits a baseline under R-07, blocks the batch — and worst-case merges a confident wrong change. | **Certify before assigning a lane.** Run a control task (known-answer, e.g. "fix this failing test, push WIP, cite evidence, touch no baseline"). Measure: did it push on time · did it cite a command · did it respect R-07 · did it write a failing-first test. Fail → do not give it a high-blast-radius lane. |
| **Illusory diversity** | If the randomiser happens to give you 15 seats of one model family, you are back to clone-on-clone review while *believing* you have diversity. | **Model-diversity audit per wave:** publish the distribution. Flag if any single model exceeds 50 % of active seats or if the same model authors and verifies any financial PR. |
| **Style churn between models** | Different models format and structure differently → noisier diffs, more conflicts. | The repo already owns the equaliser: **Prettier + ESLint `--max-warnings 0` + `tsc`** run on every PR. Style is not a review topic; the gate decides. |
| **Non-reproducible bug reports** | "It failed for me" from a different model on a different branch. | R-05 already requires the raw command + output. Add `Model:` and `HEAD sha`. A report without both is not a report. |
| **Over-trust in model consensus** | Two models agreeing feels like proof. It is not — shared training data means correlated errors on well-known-but-wrong patterns. | Consensus never overrides a gate. **A gate beats any number of agreeing models.** |

### 8.4 What independence is still made of, in order

1. **Mechanical gates** — free, tireless, already exist. First and best line, unchanged by model choice.
2. **A different model on the Red Team**, instructed to *falsify* rather than build. Now genuinely independent; still not infallible.
3. **Reproducibility by a stranger** — a claim that cannot be re-run from a clean checkout of the branch, with the model and commit recorded, is not a claim.

**What "zero compromise, no flaw" can honestly mean:** you cannot buy the absence of defects with headcount or with model variety. You *can* enforce that **no claim enters the tree without a command that reproduces it** — which is the standard `AGENTS.md` already sets. The deliverable is *zero unverified claims*. Model diversity raises the odds that a wrong claim gets caught before it lands; it does not change what must be proven.

---

## 9. What 15 agents cannot fix — the part that decides success

From the measured state (this session, HEAD `2d4cfd6`):

| Blocker | Owner of it | Can 15 agents fix it? |
|---|---|---|
| **O1–O9** — nine owner rulings | Owner | **No.** Zero of 15. S-01 can only ask, record, and park. |
| **93 of 200 checklist sections = SOURCE OWED** | Owner | **No.** The text does not exist; no agent may invent section titles — only a register update is legitimate. |
| **CI on `main` is HTTP 403** | Human (token scope) | **No.** One-time fix; until then no shared referee exists. |
| **O4** — is the audit chain SOX authority? | Owner | **No.** N2 can classify but never close. |
| **O9** — entity grants / switch policy | Owner | **No.** N3 can deny-by-default but not grant. |
| **O7** — native Tauri / offline auth | Owner + toolchain | **No.** Likely no Rust/desktop in sandbox. |
| **Q6** — server fate | Owner | **No.** |
| **DEC-033 vs. roadmap** — all-FP&A or ≤40-route spine | Owner + S-01 | **Partly** — S-01 can draft the carve-out; only the owner can accept it. |

Rough split of remaining work: **≈60 % is parallelizable engineering** (money sweep, denial tests, export tie-out, hygiene, spine acceptance, route cut, gate fixes, persistence, money types). **≈40 % is decision- or source-bound** and will not move no matter how many seats you add — and that 40 % contains every critical-path release blocker.

**Therefore: headcount is not the bottleneck, and adding 15 agents raises throughput on the 60 % while adding proportional merge risk to 100 %.** That is the argument for the ramp below, not against the fleet.

---

## 10. Ramp — do not launch 15 on day one

**Wave 0 — today, me, no new seats (≈1 seat).** Prove the bus before scaling it.
1. Land this document.
2. Fix R-02/R-03 mechanically: stop using `docs/agent-squad/agents-comms/CLAIMS.md`; PR-as-claim; `docs/agent-fleet/` skeleton.
3. Close PR #83 (docs-only, open since 2026-10-20 18:08, invisible to Notion).
4. Fix the README blind spot: 242 → **231** routes, ~13,350 → **16,249** tests, and extend `verify-readme-stats.mjs` to assert both (S-03's first unit).
5. Create the Drive `O1-d365-samples/` vault + manifest; create the Notion `FLEET QUEUE` database.
6. Outcome: one seat, one full claim→evidence→verify→merge cycle, gates green.

**Wave 1 — 6 seats.** *(S-00 Integrator, S-01 Decision, S-02 Red Team, S-03 Gates, S-04 Spine Acceptance, S-08 Money Sweep.)*
Chosen because they are maximally disjoint: the Integrator serializes, the Red Team verifies, and the three lanes touch non-overlapping paths. This is the load test.

**Wave 2 — +5 seats.** *(S-06 money domain, S-07 persistence, S-09 N3, S-11 route cut, S-13 export tie-out.)*

**Wave 3 — +4 seats.** *(S-05 data contracts, S-10 N2, S-12 reachability, S-14 hygiene.)*

**Gate to advance a wave** — all three for 5 consecutive working days, else hold:
- zero merge conflicts on shared files,
- 100 % of `DONE` units carry an S-02 `VERIFIED`,
- zero orphaned WIP at end of session (every branch pushed, every claim either merged or parked with a reason).

---

## 11. Decision required from you

The fleet is yours to approve; three things I cannot decide:

1. **Wave discipline.** Launch 15 immediately (fast, high merge risk, repeats §0 at larger scale) — or Wave 1 = 6 with a hard gate to scale? *Recommendation: 6.*
2. **S-00 authority.** The Integrator is the only seat that merges and the only writer of baselines/shared docs. That is a real bottleneck by design. Accept it, or distribute it and accept conflicts? *Recommendation: accept it.*
3. **Model policy.** Per-seat pinning by blast radius (§8.1) — or a global random switch for all 15? *Recommendation: pin the five highest-blast-radius seats to one strongest model, randomise only the mechanical sweep lanes.* Randomising the Assigner or the money-domain seat is how a confident wrong journal entry lands.
4. **Push cadence.** Accept that pushing WIP every 45 minutes is what makes peer review possible (§3a)? Without it, seats are invisible no matter how many you run. *Recommendation: accept; S-00 enforces with claim revocation.*
5. **The four one-time unblocks only you can do:** answer **O1–O9** (or confirm the provisional defaults stand), provide the **§108–200 source text** or formally descope it, and restore **Actions read scope** so CI stops being unverifiable.

> **The highest-leverage thing in this entire plan is not the 15 agents — it is item 5.** Answering O4 and O9 alone unblocks two of the three most active engineering lanes; restoring CI gives 15 agents a shared referee; and O1's sample exports turn the product's core claim from "mapping-driven, unverified" into something provable. Those three cost you one reply and one file drop. They are worth more than four extra seats.

---

## 12. Summary

- A 12-seat squad already ran here and collapsed in 48 hours. **Cause: unpushed work in unreachable sandboxes — exactly your constraint.** Hence R-01.
- **Do not use Drive as the bus.** No merge semantics, no locks, silent overwrites. GitHub already gives every seat a branch, a diff, a PR and a test runner.
- **The old bus routes 15 writers through 4 shared files.** Fix: **the PR list *is* the claim ledger** (atomic, race-free), plus file-per-note for prose.
- **The killer rule is R-07:** baselines and shared docs are Integrator-only. It collapses 90 conflicting hunks into one commit.
- **Drive earns its 5 TB in exactly three places** — above all the O1 D365 sample vault.
- **Peer visibility needs no PR and no merge — only a push.** Verified by execution: `ls-remote` → `fetch` → `show`/`diff` → **`git worktree` runs a peer's unmerged branch in its own directory**. PR is the merge gate, never the visibility gate. One gotcha: the clone is shallow, so `--deepen` first or diffs report "no merge base".
- **Heterogeneous models upgrade verification.** With a different model per seat, cross-model review is genuine independence — the objection that 15 clones cannot review each other no longer applies. New rules: `Model:` trailer on every PR, `R-10′` verifier must differ from author, model-diversity audit per wave, and **never randomise the high-blast-radius seats**.
- **A gate always beats model consensus.** Two models agreeing is not proof; shared training data correlates their errors.
- **40 % of the remaining work is decision-bound and unmovable by headcount** — and it holds every release blocker.
