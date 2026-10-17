# FinPlan Pro — Agent Squad Backlog

> Priority order is a shared default, not a promise. Change it only by editing this file with a
> one-line reason. Each item should be finishable with tests + evidence in one or a small number
> of commits, not by leaving a vague “working on it” state.

## Active priorities

### P0 — Close the highest-value documented gaps with evidence

1. **FR-008/FR-009 path alignment**
   - Goal: exception review is a real governed workflow, not just an explainer.
   - Evidence needed: a versioned rule catalogue the UI can call; a persisted disposition path
     that survives reload; tests that fail without the change.
   - Current state: parts exist; the catalogue/disposition pieces need final alignment, typing,
     and tests.

2. **Board pack tie-out to screen**
   - Goal: a synthetic workspace Excel/PPTX output tied to the same numbers the UI shows.
   - Evidence needed: a test that asserts the export matches the in-app view for one concrete
     synthetic ledger.
   - Current state: export exists; tie-out evidence is the part to tighten.

3. **FR-006 residual behavior still worth closing**
   - Goal: make sure invalid/missing money cannot slip through any remaining non-validated write
     or hydrate path.
   - Evidence needed: targeted tests that fail without the guard and pass with it.
   - Current state: some paths already guarded; confirm nothing was missed rather than assuming.

### P1 — Reduce real documented gaps instead of adding surfaces

4. **Confirm nothing imported-dependent is silently broken by recent store/import changes**
   - Goal: verify the touched surfaces across their real consumers, not just the folder they live in.
   - Evidence needed: targeted test runs with the actual affected suites.

5. **Reduce the “template clone” surface where it is real and testable**
   - Goal: if a page is a thin reskin with no real engine backing, document that honestly and
     either wire it or stop implying capability.
   - Evidence needed: a measured note or a wired path, not both at once.

6. **Tighten documentation claims to match what the tree proves**
   - Goal: any doc number, claim, or grade should be reproducible from the repo.
   - Evidence needed: `docs:verify`-style checks and any other gate that the project already uses.

### P2 — Only after the above, and only if scope is already agreed

7. **Real-source-dependent items**
   - Anything that depends on an actual D365 sample, country/currency scope, or company identity
     belongs here until that source is available. Do not mock it into existence as “done.”

8. **Enterprise/team/deployment scope**
   - Auth model, backup/restore, multi-user, hosted path, and similar items are not automatic
     next steps. They belong behind an explicit owner decision and a data-boundary agreement.

## Do not do

- Add new routes/pages/engines/stores/sector packs/connectors unless the docs say the spine is
  allowed to expand.
- Add AI-generated numbers or ERP write-back.
- Start cloud sync, multi-tenant login, or real-time collaboration without explicit owner approval.
- Weaken a gate, skip a test, or lower a bar to make something green.
- Claim a capability without evidence that the tree can reproduce.

## How to claim an item is done

1. Code is in place.
2. A test exists that fails without the change and passes with it.
3. The relevant run(s) actually ran in this tree.
4. The docs reflect what changed.
5. A one-line note is appended here and in `agents-comms/` plus the squad state file.

## How to pick your next item

Pick the highest remaining item that you can finish with evidence this session. If you cannot
finish it end-to-end, do not start it. Leave a note in `agents-comms/` instead and move to the
next finishable item.

## Done notes

- 2026-10-17 (LEAD, solo): P1-4 consumer coverage completed across all four GL screens —
  `GLUploadPage` real-store interop 5/5 (`c879d3e8`) plus the Alert display-only renders-nothing
  fix (`0751af7f`); pre-existing tokenBridge dangling-token red repaired (`d5702168`).