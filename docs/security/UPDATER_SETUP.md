# Tauri Updater Setup — Structural Wiring Complete, Operator Actions Pending

> Status (honest labeling, 2026-08-25): the updater is **structurally wired** —
> plugin registered in Rust, `plugins.updater` config present, capability
> permission granted, updater artifacts enabled. It is **dormant and inert**
> until every OPERATOR-ACTION below is completed. No signing keys were
> generated or committed as part of this change.

## What is already wired (no secrets committed)

| File                                  | Change                                                                                                                 |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `src-tauri/Cargo.toml`                | added `tauri-plugin-updater = "2"`                                                                                     |
| `src-tauri/src/lib.rs`                | `.plugin(tauri_plugin_updater::init())` registered; stale "registered but disabled" comment replaced with accurate one |
| `src-tauri/tauri.conf.json`           | top-level `plugins.updater` block (`endpoints` + required `pubkey`) and `bundle.createUpdaterArtifacts: true`          |
| `src-tauri/capabilities/default.json` | `"updater:default"` permission                                                                                         |

Safety properties of the current state:

- The endpoint uses the **reserved-invalid TLD** `updates.example.invalid`
  (`https://updates.example.invalid/{{target}}/{{current_version}}`). Per RFC
  2606/6761 `.invalid` can never resolve or serve — the updater cannot reach
  any real server until an operator replaces this URL.
- The `pubkey` is a clearly-marked placeholder string, NOT a key. Tauri 2's
  schema requires a non-empty string here; it is only parsed lazily inside
  signature verification during an actual update download
  (`plugins/updater/src/updater.rs`, `verify_signature`), which can never be
  reached while the endpoint is `.invalid`.
- Nothing invokes the updater. There is no startup check in Rust and no
  frontend call to `@tauri-apps/plugin-updater`. The webview holds the
  `updater:default` permission but nothing calls it.
- Update requests originate from Rust (reqwest), not the webview, so the CSP
  in `app.security.csp` is unaffected.

Verified gates: `cargo check` (src-tauri) and
`node scripts/check-version-consistency.mjs` both pass after this change;
versions remain 1.0.0 across package.json / Cargo.toml / tauri.conf.json / lib.rs.

## Remaining operator steps

### OPERATOR-ACTION 1 — Generate the real signing keypair

```bash
npm run tauri signer generate -- -w ~/.tauri/finplan-pro.key
```

- Protect the private key with a password when prompted.
- NEVER commit the private key or its password to this repository.
- Store the public key contents for step 2.

### OPERATOR-ACTION 2 — Replace the placeholder pubkey

In `src-tauri/tauri.conf.json`, replace:

```json
"pubkey": "REPLACE_WITH_REAL_PUBKEY_FROM-tauri-signer-generate-SEE-docs/security/UPDATER_SETUP.md"
```

with the full public-key string emitted by step 1. It must be the key
content itself — a file path is not accepted by the schema.

### OPERATOR-ACTION 3 — Provide signing env vars wherever bundles are built

`bundle.createUpdaterArtifacts: true` means `npm run tauri:build` now produces
`.sig` signatures and **fails without the private key**:

```bash
TAURI_SIGNING_PRIVATE_KEY=$(cat ~/.tauri/finplan-pro.key)
TAURI_SIGNING_PRIVATE_KEY_PASSWORD=...   # if set during generation
```

Set these in release CI secrets only. Local dev (`npm run dev`, `npm run build`,
`cargo check`) is unaffected.

### OPERATOR-ACTION 4 — Stand up a controlled update endpoint

Host a static manifest plus signed artifacts on infrastructure you control,
e.g. `https://updates.finplanpro.com/{{target}}/{{arch}}/{{current_version}}`
or a GitHub Releases `latest.json`. Then replace the `.invalid` endpoint in
`tauri.conf.json`.

The manifest format is documented at
https://v2.tauri.app/plugin/updater/ ("Static JSON" / dynamic server modes).
TLS is enforced for production endpoints.

Note for Gate 6 (`scripts/check-version-consistency.mjs`): its F-0020 guard
only inspects a legacy top-level `updater.active` field (Tauri v1 schema),
which does not exist under the Tauri v2 `plugins.updater` layout used here.
When the real endpoint goes live, extend that script to validate
`plugins.updater.endpoints` so uncontrolled origins are blocked by the gate.
(Script edit was out of scope for the wiring task that created this file.)

### OPERATOR-ACTION 5 — Wire the update flow in the frontend

Out of scope of the wiring change: install `@tauri-apps/plugin-updater`,
call `check()` from a controlled surface (e.g. settings screen or scheduled
background check), handle `downloadAndInstall()` + `relaunch()`. Until this
exists, the configured updater remains dormant by design.

### OPERATOR-ACTION 6 — End-to-end test before first release

Publish one real signed build + manifest, point a dev build at the staging
endpoint, confirm check → download → signature verify → install → relaunch on
Windows (NSIS). Only then treat the updater as production-ready.
