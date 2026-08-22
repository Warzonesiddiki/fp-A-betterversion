---
id: MEMORY/_system/INTEGRITY.md
status: active
last_verified: 2026-08-18
verified_by: arena-agent/session-017
confidence: high
---

# _system/INTEGRITY — anti-rot checklist

Run `node MEMORY/_system/check.mjs` and record the result in `STATE.json.integrity`.

1. Every path named in `MEMORY/MAP/TREE.md` exists on disk, or is explicitly marked MISSING/planned.
2. Every command in `MEMORY/QUALITY/COMMANDS.md` is cited from a real file or marked UNVERIFIED.
3. `MEMORY/TRUTH.md` contains no weasel words (`should`, `probably`, `will`, `I think`).
4. `STATE.json` parses and `now.summary` is consistent with `MEMORY/TASKS/NOW.md`.
5. No secret patterns in MEMORY (`AKIA`, `BEGIN PRIVATE`, `api_key=`, `password=`).
6. Every `MEMORY/...` link in `MEMORY/INDEX.md` resolves to a file that exists.
7. No module is `shipped` in `MEMORY/MAP/MODULES.md` unless its entry file exists.
8. Every shard has front-matter with a `last_verified` date.

Failing check 1, 6 or 7 means MEMORY is lying — fix MEMORY, not the app (unless MEMORY points at a
path this session broke).
