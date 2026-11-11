---
name: preview-and-local-verification
description: >
  Use when you need to see the app: run the dev server, bind it for the preview
  proxy, and verify in the browser what the tests cannot see.
group: discipline
---

# Preview and local verification

**Use when** a change is visual, interactive, or depends on real storage.

## Method

**Scope warning:** root mission instructions and `AGENTS.md` take precedence. A
preview does not authorize application-source work or replace required tests and
evidence gates.

1. **Serve it**: `npm run dev -- --host 0.0.0.0` so the sandbox preview proxy
   can reach Vite. The default Vite host may be loopback; verify the actual listen
   address and allowlisted preview origin.
2. **Open the route you changed**, with real-ish data (seeded store, imported file).
3. **Check the states the tests miss**: empty, loading, partial/quarantined, error,
   both themes, narrow width, keyboard-only.
4. **Read the console and the network tab.** A silent 404 or a React warning is a
   finding even if the page looks right.
5. **Verify the number on screen against a computed value**, not against the
   previous screenshot.
6. **Stop the server** when done; leave no background process holding a port.

## In this repo

- This product currently rejects a standard browser runtime (`src/App.tsx`); a
  Vite preview is not proof of a usable web application or of Tauri packaging,
  native permissions, signing, recovery, or offline behavior. Use the preview only
  for the behavior it can actually reach, and state the limitation.
- Fixtures: seed through the store's own actions so the hydration and formatting
  paths run as they would for a user.
- If a page needs an export to look right, that is a finding about the page.

## Red flags

- "Looks fine" from a static screenshot.
- Hardcoded data patched into a page to make it render.
- A preview left running that the next session inherits without knowing why.

**Source:** original.
