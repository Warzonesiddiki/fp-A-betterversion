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

1. **Assume no network.** The product must work offline; a feature that needs a
   connection is a decision, not a default.
2. **File access is explicit and scoped** — dialogs for user files, no scanning of
   home directories.
3. **The shell is a boundary**: validate paths and arguments on the Rust side too.
4. **Signing and updates** are owner-blocked until keys and distribution are
   settled (O3/O7): do not claim a signed or auto-updating build.
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

**Source:** original, from O3/O7 in `docs/TASKBOARD.md`.
