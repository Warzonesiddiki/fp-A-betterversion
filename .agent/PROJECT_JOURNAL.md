# FinPlan Pro — Agent Journal

## Session 002 (2026-08-17)

### Incident: sandbox re-clone lost local git history
The workspace was re-created between sessions. `HEAD` sat at the base commit
`455e74d` while the previous session's work existed only as uncommitted files
and on the remote as `26bf99a`. Recovered by fetching the remote branch and
confirming the working tree matched it byte-for-byte before fast-forwarding.
No work lost. **Lesson: push verified work early and often.**

### ADR-001 — Patch vulnerabilities via `overrides`, not `npm audit fix`
Status: accepted

**Context.** `npm audit` on `server/` reported a HIGH SSRF in `ip-address`
(GHSA-mwp4-54f8-5fhr and two siblings) and a LOW DoS in `body-parser`.
Reachability was confirmed rather than assumed: `ip-address` backs
`express-rate-limit`'s IP keying and `src/middleware/rateLimit.ts` applies
`authLimiter` to the auth routes, so an IP-parsing bypass defeats per-IP
throttling on login and undermines the account-lockout protection.

**Decision.** Pin patch-level `overrides` in `server/package.json`
(`ip-address ^10.5.0`, `body-parser ^1.20.6`), matching the convention the root
`package.json` already uses.

**Alternatives rejected.** `npm audit fix --omit=dev` resolves the advisories
but `--omit=dev` also *prunes* devDependencies: it removed `@types/express`,
producing 12 `TS7016` errors and 8 failing test files. It was applied, the
breakage detected, and the tree fully reverted and re-verified before the real
fix landed.

**Consequences.** No manifest/API change, no major bumps, 0 vulnerabilities,
207/207 server tests still green.

### ADR-002 — Vulnerability scanning had no CI gate at all
Status: accepted (patch-delivered, awaiting human apply)

The SSRF reached `main` because **no workflow ever ran a vulnerability scan**,
despite `audit:prod` existing in `package.json`. Added a blocking `audit` job
plus a server-workspace audit step (the two workspaces have independent
lockfiles, so the root audit does not cover `server/`), both wired into the
`summary` gate. This re-lands finding N-0004, previously described but never
applied.

### Standing constraint — workflows are not pushable
The GitHub App lacks the `workflows` permission, so `.github/workflows/**`
changes are delivered as `ci-patches/0005-*.patch` per the repo's existing
convention. **These CI gates are NOT enforced until a human runs `git apply`.**

### Verification (this session, on a fresh clone)
| Check | Result |
| --- | --- |
| frontend `tsc --noEmit` | 0 errors |
| frontend `eslint src --max-warnings 0` | 0 errors, 0 warnings |
| frontend `vite build` | success, PWA generated |
| frontend tests | 1212 files — 13,738 passed, 1 skipped |
| server `tsc --noEmit` | 0 errors |
| server tests | 130 + 77 = 207 passed |
| `npm audit` (root, prod) | 0 vulnerabilities |
| `npm audit` (server, prod) | 0 vulnerabilities |
| 8 repo-specific gates | all pass |

Note: the full frontend suite completed inside a **3 GB** sandbox — independent
evidence that the 80 GiB CI heap (corrected to 8 GiB in the patch) was never
load-bearing.
