# FinPlan Pro — Agent Squad Agreement

> **Current disposition:** Historical/conditional squad guidance, not an active agreement for this Arena session. The docs map says to use squad coordination records only when a squad is explicitly active. Root `AGENTS.md`, the active Arena branch constraints, and the current master plan take precedence.
>
> **Original note:** This was the working agreement for the squad session when written. It is short on purpose. If two agents read different things, `AGENT_JOIN_GUIDE.md` and root `AGENTS.md` win. The dated comms instructions and sandbox-caveat claim below are not current evidence.

## 1. Branch and commit discipline

- Follow `AGENTS.md` and the active Arena session's branch constraints. This squad file does not authorize switching branches or pushing elsewhere.
- One logical change per commit when practical; small and verifiable beats large and risky.
- Push only to the active session branch and only when permitted by the session instructions.
- Do not commit secrets. The repo’s pre-commit hook scans for key material.

## 2. Coordination before touching the same thing

- If you are about to touch a file another agent touched recently, read their commit and any note
  in `agents-comms/` first.
- If two agents want the same change, the stronger evidence wins. If still tied, leave a note and
  do not silently overwrite.
- If your change could break another agent’s current work, leave a note before landing it.

## 3. Evidence discipline

- Every changed capability needs a test that fails without it and passes with it.
- Any claim needs the command that produced it.
- If a test fails for a reason you cannot explain, leave a note and do not mask it.
- Do not weaken a gate to make something green. Fix the cause or stop and report.

## 4. Money, determinism, and missing data

- Money goes through one primitive; no float arithmetic on amounts.
- Time and randomness stay controlled; do not add `new Date()` / `Date.now()` / unseeded
  randomness into the paths you touch.
- Missing is not zero. Absent inputs render as unavailable with a reason.

## 5. Scope discipline

- Follow the current master product plan's dependency gates. DEC-104's universal user-mapped import and its convergence with the upload UI are explicit foundation work; other APIs and industry packs require the shared contract, owner priority and evidence.
- Do not add AI-generated financial numbers or ERP write-back without a separate accepted decision.
- Do not assume D365 schema or source identity is owner-verified; synthetic fixtures and real owner samples have different evidence labels.

## 6. Environment caveat

- A known sandbox runtime mismatch can make three `Storage.prototype` mock tests fail. That is a
  sandbox caveat, not a current-session regression. Do not weaken those tests to hide it.
- If you deliberately change the documented target, say so plainly in `agents-comms/`.

## 7. Conflict resolution

- Disagreements are resolved by evidence first, then by the repo’s own rules.
- If an agent cannot get a rule to pass without weakening it, they stop and post the exact blocker
  in `agents-comms/` with the file and the failing command output.
- If the blocker is an open owner decision, say which decision and do not invent one for them.

## 8. Record keeping

- Append short notes to `agents-comms/` for: start, progress, block, finish.
- Update `SQUAD_STATE.md` when shared state changes.
- Keep `SQUAD_BACKLOG.md` updated only when the priority order actually changes.
- Do not silently drop an item from the backlog; archive it with a reason.

## 9. Communications and command (2026-10-16)

- The message bus is `agents-comms/` (protocol: `agents-comms/README.md`). Read it at
  session start; post START / PROGRESS / BLOCK / DONE notes to `agents-comms/COMMS_LOG.md`.
- Seats live in `agents-comms/ROSTER.md` — one session = one seat. The lead seat is Buffy;
  Aion CLI (G-01) coordinates the Gemini seats.
- The lead assigns or reassigns backlog items through `agents-comms/STATUS_BOARD.md` and may
  revoke stale
  claims (a claim with no log activity for 24 h). The lead never overrides evidence or a gate:
  when the lead and a member disagree, the failing-first test and the repo's rules decide.
- Blockers escalate: peer mention → `@LEAD` → `agents-comms/BLOCKERS.md` (owner decision,
  named by its DEC
  id) → stop that item and pick the next finishable one.
- One writer per file: claim in `agents-comms/CLAIMS.md` before editing; readers never need a
  claim.