---
name: security-and-secrets
description: >
  Use when handling credentials, auth, user input, file paths, exports or the
  Electron/Tauri boundary. Assume input is hostile and the disk is shared.
group: engineering
---

# Security and secrets

**Use when** a change touches auth, roles, secrets, file IO, exports, or anything
that crosses the desktop boundary.

## Rules

1. **No secret in the repo, ever** — not in code, fixtures, tests, docs or logs.
   Rotation is the only remedy if one lands.
2. **Authorise on the server, not the screen.** Hiding a button is not a
   permission. Every route checks the caller's role and entity scope.
3. **Parameterise every query.** Inline SQL with interpolation is a finding even
   when the value "comes from us".
4. **No `eval`, no `new Function`, no dynamic import of user input.**
5. **CSV injection**: a cell starting with `=`, `+`, `-`, `@` is data, not a
   formula. Exports must neutralise it.
6. **Path handling**: resolve and confine; `..` in an import path is a traversal.
7. **Local-first means no silent egress.** AI stays local (DEC-022); a new network
   call is a decision, not a convenience.
8. **Encryption**: say what is encrypted, with which key, and who holds it. Never
   describe storage as "safe" without the key story (O3 is still open).

## In this repo

- `npm run architecture:guardrails` checks eval, inline SQL, authorization and
  audit-on-write.
- `npm run export:verify` checks CSV injection protection, entity scoping, safe PDF.
- `npm run license:check` and `npm run sbom` for dependency hygiene;
  `npm run audit:prod` for published advisories.

## Red flags

- A token in a test fixture that looks real.
- `innerHTML` with data.
- A new fetch to a host that is not on the approved list.

**Source:** original, from the O3/O4/O6 rows in `docs/TASKBOARD.md`.
