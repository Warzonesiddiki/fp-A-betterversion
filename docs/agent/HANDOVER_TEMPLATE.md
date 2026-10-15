# Handover — <date> — <branch> @ <tip sha>

Copy this file's body into the end-of-session message and (optionally) into
`docs/discovery/audit-progress-<date>.md` under "Branch log". Facts only; every
"done" line carries evidence you produced in this tree.

## 1. State of the tree

- Branch / tip: `<branch>` @ `<sha>` (pushed: yes/no)
- Working tree clean: yes/no (if no: list files and why)
- Gates run this session (command → result, with tallies):
  - `npm run tsc` → 0 errors
  - `npm run lint` → clean / N errors
  - `npm run format:check` → clean
  - `npm run docs:verify` → pass/fail (what)
  - ratchets: determinism A→B / money:ast 0 / type-safety A→B / money:adoption X %
  - tests: `test:sharded` 8/8, `Test Files N passed`, `Tests M passed` — or
    "targeted only: <paths> N files" — say which
  - server: `cd server && npm test` → N files / M tests
- Not run (and why): …

## 2. Done (each with requirement id + evidence)

| Commit | What | Ids              | Evidence                  |
| ------ | ---- | ---------------- | ------------------------- |
| `sha`  | …    | FR-00x / AUD-0xx | test file / script output |

## 3. Not done / partially done

- <item> — state reached, what remains, blocker (DEC-xxx, missing fact, time).

## 4. Truth changes (docs updated?)

- `09_KNOWN_GAPS.md` rows changed: …
- `docs/discovery/requirements-register.md` evidence rows changed: …
- README / PERSISTENCE_MAP / CAPABILITY_TRUTH_MATRIX regenerated: yes/no

## 5. Decisions needed from the owner

| Id  | Question | Options | Why it blocks |
| --- | -------- | ------- | ------------- |

## 6. Risks / surprises found

- …

## 7. Recommended next step (one)

…
