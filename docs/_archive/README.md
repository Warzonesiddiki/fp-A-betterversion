# docs/\_archive

Historical process artifacts kept for provenance but **not** part of the
maintained documentation set. Nothing in here is a source of truth for how
FinPlan Pro works today — treat it as an append-only record.

| Folder   | Contents                                                                     | Files |
| -------- | ---------------------------------------------------------------------------- | ----- |
| `codif/` | Codification / endorsement ceremony records from the multi-agent build phase | 145   |

Tooling already excludes this tree (`eslint.config.js` ignores
`docs/_archive/**`).

## Maintained documentation

Start here instead:

| Doc                    | Purpose                                    |
| ---------------------- | ------------------------------------------ |
| `docs/ARCHITECTURE.md` | System architecture and layering           |
| `docs/TESTING.md`      | Test strategy, suites, and how to run them |
| `docs/USER_GUIDE.md`   | End-user product guide                     |
| `CONTRIBUTING.md`      | Contribution workflow and conventions      |
| `RELEASE_CHECKLIST.md` | v1.0 release gates                         |
| `SECURITY.md`          | Security policy and reporting              |

## Restoring a file

```bash
git mv docs/_archive/codif/SOME_FILE.md docs/codif/SOME_FILE.md
```

History is preserved — these files were moved with `git mv`, so
`git log --follow` works across the move.
