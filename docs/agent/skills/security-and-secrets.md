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
2. **Authorise at the trusted boundary, not the screen.** Hiding a button is not
   a permission. Server-backed routes enforce applicable authorization; do not claim
   an entity-scope or multi-user grant merely because a user selected an entity. The
   owner recorded a single-user product in DEC-103.
3. **Parameterise every query.** Inline SQL with interpolation is a finding even
   when the value "comes from us".
4. **No `eval`, no `new Function`, no dynamic import of user input.**
5. **CSV injection**: a cell starting with `=`, `+`, `-`, `@` is data, not a
   formula. Exports must neutralise it.
6. **Path handling**: resolve and confine; `..` in an import path is a traversal.
7. **Local-first means no silent egress.** DEC-003/022 prohibit automatic
   financial-data egress and external AI by default. A new network/provider path
   needs its own owner decision and explicit, documented, user-initiated boundary.
8. **Encryption and recovery**: DEC-101 rejects third-party key escrow and places
   the recovery code with the user. This decision does not certify storage safety,
   native key custody, or production recovery. Follow current plan question R8 and
   evidence; never use a blanket "safe" claim.

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

**Source:** original, from DEC-003/004/022/101/103 and current security gates;
dated taskboard rows are historical evidence only.
