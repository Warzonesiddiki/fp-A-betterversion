# Environment Baseline — 2026-07-27

## Scope

P0-A reproducible environment recovery for `arena/019fa23b-fp-a-betterversion`.

## Dependency remediation

Updated Vite-adjacent dev dependencies so npm can resolve peers without relying on `legacy-peer-deps`:

- `@tailwindcss/vite`: `4.1.17` → `4.3.3`
  - Peer range now includes Vite 8: `^5.2.0 || ^6 || ^7 || ^8`.
- `tailwindcss`: `4.1.17` → `4.3.3`
  - Kept Tailwind core aligned with the Vite plugin package.
- `@vitejs/plugin-react`: `5.1.1` → `5.2.0`
  - Peer range now includes Vite 8: `^4.2.0 || ^5.0.0 || ^6.0.0 || ^7.0.0 || ^8.0.0`.

## Install verification

Command run:

```bash
npm ci
```

Result: **PASS** — exit code 0.

Notes:

- The repository `.npmrc` currently sets `ignore-scripts=true`, so the verified `npm ci` path is deterministic and avoids flaky native postinstall network fetches.
- The separate task-board item for a normal lifecycle-script install remains open until the native AI/runtime postinstall path is either made optional or proven reliable in CI.

## Gate verification after dependency remediation

- `node node_modules/typescript/bin/tsc --noEmit --pretty false` — PASS.
- `npm run lint -- --max-warnings=0` — PASS.
- Targeted Vitest recovery set — PASS, 11 files / 97 tests.
- `npm run build` — PASS.
- `npm run bundle-check` — PASS with 2 warnings:
  - Total JS gzip remains near cap: 1933.78 KB / 2048 KB (94.4%).
  - `grid-community-vendor` remains near lazy-vendor budget: 284.85 KB / 300 KB (95.0%).
