# 07 — Workflow and definition of done

## Choosing work

1. Is the item in `docs/discovery/roadmap.md` for the current open gate, or
   in the audit's prioritised list (`docs/audit/…` §8) for P0/P1? If not,
   do not do it.
2. Does it depend on an open decision (DEC-001…006)? If yes, either build
   the decision-neutral part only (and say which part) or ask the owner.
3. Prefer: making a gate stricter, wiring an existing module, deleting dead
   surface, converting a claim into a measurement — over adding anything.

## Unit of work = one commit

```text
type(scope): imperative summary ≤ 72 chars

- what changed and why (reference FR-/NFR-/AUD-/DEC-/R- ids)
- gates run with tallies: tsc 0 errors · eslint clean · vitest <files/tests> ·
  money:ast ✓ · determinism 684→679 …
- what is NOT done / known limits
```

`type` ∈ `feat | fix | refactor | test | docs | chore | ci`. One logical
change per commit; docs updated in the same commit as the code they describe.

## Definition of done (all required)

- [ ] Behaviour is specified by a test that fails without the change.
- [ ] `npm run tsc`, `npm run lint`, `npm run format:check` clean.
- [ ] Every ratchet that your change could move was run and did not regress
      (`money:ast`, `money:adoption`, `determinism:ratchet`,
      `type-safety:ratchet`, `escape:ledger`); improvements locked with
      `--update`.
- [ ] `npm run docs:verify` passes; README numbers refreshed from scripts if
      they moved.
- [ ] Targeted tests for every file that imports what you changed are green;
      full `test:sharded` before a handover that claims "suite green".
- [ ] No new `TODO`, `FIXME`, `it.skip`, `eslint-disable`, `as any`.
- [ ] Generated files regenerated (manifest, route map, capability matrix) if
      affected.
- [ ] `docs/discovery/requirements-register.md` evidence column, the risk
      register, and `09_KNOWN_GAPS.md` updated if the truth changed.
- [ ] Commit pushed to the session branch.
- [ ] Anything unverifiable from here (native, CI) labelled as such.

## Pull requests

Open from the session branch only. Body = the commit bodies plus: what the
reviewer should run, what they should see, and the decisions still open.
Do not merge without a human.

## Session start checklist

```bash
cat AGENTS.md docs/agent/00_INDEX.md docs/agent/09_KNOWN_GAPS.md   # 10 minutes well spent
git status && git log --oneline -8
ls node_modules >/dev/null 2>&1 || (npm ci --ignore-scripts && (cd server && npm ci --ignore-scripts))
npm run tsc && npm run lint                                        # must be clean before any edit
```

If the tree is not clean/green at start, your first commit is to make it so
(or to report precisely why you cannot).

## Session end checklist

1. Run the gates you can justify; record exact tallies.
2. Update docs that changed truth (same commit as code if possible).
3. Push.
4. Write the handover using `HANDOVER_TEMPLATE.md`: done (with evidence),
   not done, decisions needed, next step. No adjectives.

## When to stop and ask

- The next step requires an owner decision (DEC-xxx) or a fact only the
  owner has (export shape, fiscal calendar, currency, sensitivity).
- A gate is red and the fix would mean weakening the gate.
- You would need to delete or move > 20 files, change persistence shape, or
  touch auth.
- A test looks wrong and the "fix" is to change the assertion.

Ask with a concrete, answerable question and the options you see.

## Things an agent must never do here

See `04_ENGINEERING_RULES.md` §L. In particular: never claim a run you did
not do, never bypass a ratchet, never add surface while a gate is red, never
resolve an owner decision in code.
