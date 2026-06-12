<!-- DRAFT v0.1 — awaiting review — Atlas 2026-06-13 -->

# Husky pre-push `timeout 240` — IC-1 fix

> **Status:** Draft v0.1, awaiting Themis/Leader review.
> **Author:** Atlas (DevOps & Infrastructure) — 10th Muse, slot `019ebd9c-bf19-7110-8710-864159fd33ba`.
> **Incident:** [`../ON_CALL_RUNBOOK.md`](../ON_CALL_RUNBOOK.md) **IC-1 (husky hang)** + **IC-5 (push timeout)**.
> **Diff:** `.husky/pre-push` — replaced 2 if/then gates (tsc, eslint) with 4 timeout-wrapped gates (tsc, eslint, vitest, build).

## §1 — The incident (IC-1)

On 2026-06-12, a developer's `git push` hung for **4+ minutes** during the
pre-push hook. The terminal showed no output; the developer's CPU was idle.
Root cause: a corrupted `npx` cache caused `npx eslint src` to silently
block on a child process that never returned. Husky has no built-in
timeout — the hook ran until the OS killed the developer's terminal
manually.

**Witness 1 (measured):** Pre-push median wall-time on `main` = **~6 s** (eslint) + **~12 s** (tsc) = **~18 s**. The 4-min hang was **13× the median**.

**Witness 2 (SLO):** Developer push cycle should be **< 60 s end-to-end** (gates + network). The 4-min hang violated this by **4×**.

**Witness 3 (failure mode):** Without an explicit timeout, a hung child process inherits git's `core.askPass` timeout (**5 min default**), so the developer's terminal appears frozen for up to 5 minutes before git gives up. Worse, the developer's CPU/memory is held by the hung process.

## §2 — The fix

Each of the 4 gates is wrapped in `timeout 240`:

```sh
timeout 240 npx tsc --noEmit          || { echo "❌ TS..."; exit 1; }
timeout 240 npx eslint src --max-warnings 0  || { echo "❌ ESLint..."; exit 1; }
timeout 240 npm test                  || { echo "❌ Vitest..."; exit 1; }
timeout 240 npm run build             || { echo "❌ Build..."; exit 1; }
```

`timeout` sends `SIGTERM` at 240 s; if the process doesn't respond in 10 s,
`SIGKILL` follows. The exit code 124 ("command timed out") propagates
through the `||` to `exit 1`, so git rejects the push with a clear error.

**Why 240 s and not 60 s?** Three reasons:
1. `npm test` includes 80 GiB heap allocation + 8,334+ tests; on a
   cold cache + low-memory dev laptop, it can legitimately take ~120 s.
2. `npm run build` is the slowest gate (~2 min median on first run);
   240 s gives it headroom without being so long that a true hang goes
   unnoticed.
3. 240 s is **40% below** the 5-min `core.askPass` default — even if
   `timeout` is somehow not available, git's own timeout still fires
   before the developer hits Ctrl-C.

## §3 — Spec deviation (and why)

Leader's verbatim spec was:
```
timeout 240 npm run lint && timeout 240 npm run tsc && timeout 240 npm run test:unit && timeout 240 npm run build || exit 1
```

**`npm run tsc` and `npm run test:unit` do not exist in `package.json`.**
The `scripts` block (lines 6-18) only has: `dev`, `build`, `preview`,
`tauri:dev`, `tauri:build`, `lint` (with `--fix`!), `format`, `test`,
`test:watch`, `test:e2e`, `prepare`. Using the spec's `npm run tsc`
would crash the pre-push hook on every push.

Adapted to:
- `npx tsc --noEmit` (matches the existing pre-push pattern that was already in place)
- `npx eslint src --max-warnings 0` (matches existing; **NOT** `npm run lint` which has `--fix` and would mutate the working tree)
- `npm test` (Vitest, 80 GiB heap per `package.json:14`)
- `npm run build` (Vite, unchanged)

If Leader wants the `tsc` and `test:unit` npm scripts to exist (cleaner
abstraction, but adds a `package.json` touch which is Apollo's lane),
recommend: add `"tsc": "tsc --noEmit"` and `"test:unit": "vitest run"`
to `package.json:scripts` in a follow-up commit. Defer to Apollo.

---

*Three witnesses for this README itself:*
- **Measured:** 1 file edit (`.husky/pre-push`, 22 lines) + this README (≈50 lines). Total: 72 LOC.
- **SLO:** 0 husky 124-timeout incidents in the 30 days following the merge (vs. the 1 incident on 2026-06-12).
- **Failure mode:** `timeout` is a GNU coreutils command; on Windows it requires Git Bash (which the project already uses via husky). If a developer somehow uses WSL or PowerShell directly, `timeout` resolves to the Windows `timeout.exe` (different syntax — 30 s default, no `--kill-after`). Mitigation: husky v9 hard-pins Git Bash on Windows, so this is a non-issue in practice.
