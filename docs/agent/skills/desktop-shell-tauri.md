---
name: desktop-shell-tauri
description: >
  Use for anything that touches the desktop shell: filesystem, offline behaviour,
  updates, signing. The browser preview is not the product.
group: engineering
---

# Desktop shell (Tauri)

**Use when** a change touches `src-tauri/`, file system access, offline mode, or
packaging.

## Rules

1. **No silent egress.** DEC-003 is local-first with no automatic financial-data
   egress; it does not certify complete offline operation. A network-dependent feature
   needs an explicit, documented user-initiated boundary and required owner decision.
2. **File access is explicit and scoped** — dialogs for user files, no scanning of
   home directories.
3. **The shell is a boundary**: validate paths and arguments on the Rust side too.
4. **Signing, updates, and recovery**: DEC-101 rejects third-party escrow and
   keeps the recovery code user-held. Native signing/update and OS-key behavior remain
   unverified; assess them against current plan questions (including R8), not legacy
   owner-question labels. Do not claim a signed or production-ready build.
5. **Native claims need a build.** "Desktop app" is unverified without a packaged
   artefact and a run; the browser preview proves the web app only.
6. **Storage location** is user data, not app data: say where the database lives
   and how a backup is taken.

## In this repo

- `npm run tauri:dev` / `npm run tauri:build` exist; neither has been exercised in
  this environment, so no desktop claim is made.
- Persistence design (see `data-integrity-and-persistence`) is shared with the web
  build; a shell-only code path needs its own test.

## Red flags

- A feature that silently requires an internet connection.
- Absolute paths written into stored data.
- "It works on desktop" from a `vite dev` session.

**Source:** original, from DEC-003/004/014/101 and the current master plan; dated
taskboard rows are historical unless revalidated.
