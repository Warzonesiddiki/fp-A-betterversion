## Summary

<!-- What does this PR change and why? Link the finding/deferral/task ID. -->

## Evidence

<!-- Command outputs, test results, screenshots. No claim without evidence. -->

| Check      | Command                           | Result |
| ---------- | --------------------------------- | ------ |
| Typecheck  | `npx tsc --noEmit`                |        |
| Lint       | `npx eslint src --max-warnings 0` |        |
| Tests      | `npm test`                        |        |
| Build      | `npm run build`                   |        |
| Prod audit | `npm run audit:prod`              |        |

## Security & privacy notes

<!-- Auth/authz changes? New data collected? New external calls? Secrets? -->

## Operational notes

<!-- Env vars, migrations, feature flags, monitoring, rollback plan. -->

## Rollback plan

<!-- How do we revert this safely if it misbehaves in production? -->

## Checklist

- [ ] Tests added/updated for every behavior change
- [ ] No new TODO/FIXME without a `docs/security-deferrals.md` entry
- [ ] Docs updated where behavior changed
- [ ] No weakened or deleted test assertions
- [ ] Residual risks listed above (or "none")
