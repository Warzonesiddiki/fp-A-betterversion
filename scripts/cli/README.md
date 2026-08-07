# FinPlan Pro — `devex` CLI (v0.1.1)

Lightweight developer experience wrapper for common FinPlan Pro checks.

**Owner**: Prometheus (cycle 25 turn 346+).
**Path**: `scripts/cli/devex.mjs` (entry) + `scripts/cli/commands/*.mjs` (subcommands).

## Quick start

```bash
node scripts/cli/devex.mjs --help        # list subcommands
node scripts/cli/devex.mjs tsc --help    # help for tsc
node scripts/cli/devex.mjs tsc           # run type check
node scripts/cli/devex.mjs lint          # run ESLint
node scripts/cli/devex.mjs test          # run vitest
node scripts/cli/devex.mjs test src/engines/monte-carlo  # focused
node scripts/cli/devex.mjs bench --list  # list perf suites
node scripts/cli/devex.mjs bundle        # bundle size check (≤150KB / ≤2MB gzip)
node scripts/cli/devex.mjs canary --skip-build  # TSC + ESLint + (Build skipped)
node scripts/cli/devex.mjs ratify        # 5-gate pre-RATIFICATION check
```

## Subcommands (7)

| name     | purpose                                                   | AGENTS.md gate     |
| -------- | --------------------------------------------------------- | ------------------ |
| `tsc`    | `tsc --noEmit -p tsconfig.json`                           | Husky Gate 1       |
| `lint`   | `eslint src --max-warnings 0`                             | Husky Gate 2       |
| `test`   | `vitest run [path]`                                       | Husky Gate 3       |
| `bench`  | T-PR-082 perf benchmarks (placeholder for Vulcan)         | Husky Gate TBD     |
| `bundle` | gzip size check (main ≤150KB / total ≤2MB)                | CI bundle-check.js |
| `canary` | TSC + ESLint + Build                                      | Apollo canary      |
| `ratify` | 5-gate pre-RATIFICATION (TSC, ESLint, bundle, tree, sync) | Husky pre-push     |

## Architecture

- **Entry** (`devex.mjs`): CLI dispatcher. Uses `pathToFileURL` for Windows ESM compatibility.
- **Subcommands** (`commands/*.mjs`): Each exports `async function run(args)` returning exit code.
- **Registry** (`commands/index.mjs`): Subcommand registry (future).

## Conventions

- All subcommands accept `--help`/`-h`.
- All subcommands return exit code 0 on success, non-zero on failure.
- Windows uses `npm.cmd`; \*nix uses `npm`. `shell: true` for single command string.
- No external deps — uses `node:child_process.spawn` exclusively.

## Roadmap

- [x] tsc, lint, canary (cycle 25 turn 322+)
- [x] test, bench, bundle, ratify (cycle 25 turn 346+)
- [ ] plugin scaffold generator
- [ ] doctor (env check: node version, deps, git hooks)
- [ ] release (changelog + tag)

## 4-ICP

- **Carla (ICP-1)**: cascade discipline — subcommands delegate to canonical commands (no shadow logic).
- **Vera (ICP-2)**: logic — straightforward wrappers, no magic.
- **Chris (ICP-3)**: operational — Windows ESM-safe via `pathToFileURL`.
- **Beth (ICP-4)**: customer — fast feedback loop for developers.

## References

- Canary fix + D-007 85th SHL recant (evidence archived in the 2026-08-07 docs triage)
- MY files fix recap (evidence archived in the 2026-08-07 docs triage)
- `AGENTS.md` §Build & Deploy (bundle limits)
