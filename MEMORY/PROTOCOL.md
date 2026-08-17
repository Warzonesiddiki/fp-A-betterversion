---
id: MEMORY/PROTOCOL.md
status: active
last_verified: 2026-08-18
verified_by: arena-agent/session-017
confidence: high
---

# PROTOCOL — binding on every agent, every model, every session

```
YOU HAVE TWO BRAINS.
  1) Weights / chat  -> untrusted
  2) /MEMORY + filesystem -> trusted, in this repair order: disk > MEMORY > you

OPENING (mandatory):
  INDEX -> STATE -> TRUTH -> TASKS/NOW
  then the smallest extra shards the task needs
  then probe disk before naming ANY project file

WHILE WORKING:
  - If you are about to create something ANTI.md says was already tried, stop.
  - If you change schema/API/invariant/decision: update SCHEMA + an ADR + TRUTH
    in the same turn.
  - If a test proves you wrong: fix TRUTH first, then the code (or revert).
  - Prefer editing files already named in MAP over creating parallel ones.

CLOSING (mandatory):
  - Append SESSIONS/<id>.md
  - Update STATE.updated_at, now, modules, integrity
  - Promote confirmed hypotheses to TRUTH; move killed ones to ANTI
  - Refresh TASKS/NOW to the next real critical path
  - Never leave MEMORY contradicting the tree you just wrote

PROHIBITED:
  - MEMORY as a junk drawer of dumped source
  - Copying whole files into MEMORY (pointers, +/- tiny signatures, only)
  - "Updating" TRUTH to match a plan that is not implemented
  - Deleting ANTI because it is embarrassing
  - Any real key, token, password, customer datum or PII in MEMORY
```

## Host-project rules MEMORY serves (does not override)

The Codex `MASTER HANDOVER PROMPT.txt` (K1–K20) and `.agent/BLUEPRINT.md` outrank MEMORY on
safety, git and financial truth. In particular:

- **K18 financial correctness is sacred.** A wrong number is Severity-0 and outranks velocity,
  coverage and every other metric.
- **K5 never silence a failing test** to force green.
- **§22.6 never lower a gate to pass it.** Gate changes require an ADR.
- **K19 industry-neutral core**; vertical packs must not fork the engine.

## Git / workflow rules (repo-specific, verified)

- The Arena session is pinned to one branch (currently `arena/01a01215-fp-a-betterversion`).
  Commit and push only there.
- Pre-commit (~45 s): eslint (staged) → `tsc --noEmit` → prettier (staged) → secret scan.
  Pre-push (~3–5 min): 12 gates including build, P0 shard, README claim check, money-AST ratchet
  (gate 9b), fabrication ratchet (gate 9c), cascade-hold ledger (gate 10).
- **Push with a background process, not a foreground shell** — pre-push exceeds short command
  timeouts.
- **Always `npx prettier --write` generated JSON/MD before `git add`** or pre-commit fails.
- `.github/workflows/**` cannot be pushed; deliver CI changes as `ci-patches/*.patch`.
- A post-commit hook auto-commits `docs(tracker): auto-update progress tracker`. Expected.
- No `cargo`/`rustc` in the sandbox → do not edit `src-tauri/src/*.rs`.

## Session-work rule for W0.1.1 (current wave)

Each session does **both**: the next money-AST module **and** the next fabrication file.
Pattern: dump `--file` findings → extract the derivation into a `*Data.ts` / `*Model.ts` module on
`@/utils/money` → empty-state when the GL cannot support a figure → add source guards **and** a
DOM probe against the real engine → prove teeth by reverting the production file from a `/tmp`
backup and confirming the new test fails → restore → prettier → update both baselines → journal /
state / handover / MEMORY → two commits (fix + docs) → push.
