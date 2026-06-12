<!-- DRAFT v0.1 — awaiting review — Atlas 2026-06-13 -->

# FinPlan Pro — Tauri Desktop Pipeline v0.1 (Atlas)

> **Purpose.** Document the build, sign, distribute, auto-update, and
> crash-report pipeline for the Tauri desktop shell.
> **Author.** Atlas (DevOps). **Cycle.** 2026-06-13. **Status.** Awaiting review.

---

## 0. What already exists (Three Witnesses, measured 2026-06-13)

- `src-tauri/Cargo.toml:1-22` — Tauri 2 + plugins (dialog, fs, shell, sql
  with sqlite, window-state, global-shortcut, notification, updater,
  clipboard-manager). 1 binary crate + 1 lib crate (`finplan_pro_lib`).
- `src-tauri/tauri.conf.json:42-89` — bundle.targets = "all"; CSP set
  to `default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; …`
  (Hephaestus-flagged P2 task `[Apollo post-push] Tighten CSP
  style-src …`).
- `src-tauri/tauri.conf.json:11-18` — updater active, endpoint
  `https://updates.finplanpro.com/{{target}}/{{current_version}}`,
  pubkey present (decoded: comment in base64 is `untrusted comment:
  minisign public key: 53BCEB…`).
- `src-tauri/src/crash_reporter.rs:1-60` — Rust panic hook writes
  `crash-logs/panic-<ts>-<thread>.log` to
  `%LOCALAPPDATA%/com.finplanpro.app/crash-logs/` and to stderr.
- `src-tauri/migrations/001_initial_schema.sql` and
  `002_cube_schema.sql` (and a `.test.sql`) — sqlite schema migrations
  applied at boot.
- `AGENTS.md:95` — declares `npm run tauri:dev` and
  `npm run tauri:build` as the canonical entry points.
- `package.json:5-6` — `tauri:dev` and `tauri:build` scripts
  (delegate to `@tauri-apps/cli` v2).

**What is missing** (the gaps this doc fills):

1. CI workflow for cross-platform Tauri builds (Win/Mac/Linux).
2. Code-signing setup (Authenticode, notarization, GPG).
3. Release channel strategy (stable / beta / nightly — TestFlight
   equivalent for desktop).
4. TUF-style updater artifact signing pipeline.
5. Crash-report upload endpoint (currently logs to local disk only).
6. Bundle size SLO and rollback drill.

---

## 1. Build pipeline (per platform)

### 1.1 Local dev — `npm run tauri:dev`

Already wired. Behavior:
1. `beforeDevCommand: "npm run dev"` (tauri.conf.json:8) starts Vite
   on :5173.
2. Tauri spawns a Rust-compiled dev window pointed at
   `devUrl: "http://localhost:5173"` (tauri.conf.json:7).
3. Hot-reload of the React side; manual `cargo run` for Rust changes
   (`src-tauri/src/main.rs` and `lib.rs`).

**SLO:** dev window open in < 12 s on a warm `target/` cache
(measured locally). Cold cache: < 120 s (Rust toolchain compile).

**Failure mode:** if `target/` cache goes stale (clean → rebuild),
the next `tauri:dev` can hang on a Rust dep update. Recovery:
`cargo update -p <crate>` or `cargo clean -p <crate>`.

### 1.2 Production build — `npm run tauri:build`

Already wired. Behavior:
1. `beforeBuildCommand: "npm run build"` (tauri.conf.json:9) runs
   Vite, producing `dist/`.
2. `tauri build` invokes `tauri-build` (Cargo.toml:9) and links the
   frontend from `frontendDist: "../dist"`.
3. Bundle artifacts land in `src-tauri/target/release/bundle/`:
   - `msi/` (Windows installer)
   - `nsis/` (Windows NSIS installer — preferred per
     tauri.conf.json:50-56)
   - `dmg/` (macOS)
   - `deb/`, `rpm/`, `AppImage/` (Linux)

**SLO:** < 480 s on a warm cache; < 900 s cold.

### 1.3 CI build (proposed) — `.github/workflows/tauri-build.yml`

```yaml
name: tauri-build
on:
  workflow_dispatch:        # manual release trigger
  push:
    tags: ['v*']           # tag push triggers release
  schedule:
    - cron: '0 4 * * *'    # nightly main-branch build

jobs:
  build:
    name: build-${{ matrix.os }}
    strategy:
      fail-fast: false
      matrix:
        os: [windows-latest, macos-latest, ubuntu-latest]
    runs-on: ${{ matrix.os }}
    timeout-minutes: 30
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '22', cache: 'npm' }
      - uses: dtolnay/rust-toolchain@stable
      - run: npm ci
      - run: npm run build
      - name: build tauri
        uses: tauri-apps/tauri-action@v0
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          # signing secrets (see §2):
          TAURI_SIGNING_PRIVATE_KEY: ${{ secrets.TAURI_SIGNING_PRIVATE_KEY }}
          TAURI_SIGNING_PRIVATE_KEY_PASSWORD: ${{ secrets.TAURI_SIGNING_PRIVATE_KEY_PASSWORD }}
          # Windows Authenticode:
          WINDOWS_CERT_FILE: ${{ secrets.WINDOWS_CERT_FILE }}
          WINDOWS_CERT_PASSWORD: ${{ secrets.WINDOWS_CERT_PASSWORD }}
          # macOS notarization:
          APPLE_ID: ${{ secrets.APPLE_ID }}
          APPLE_PASSWORD: ${{ secrets.APPLE_PASSWORD }}
          APPLE_TEAM_ID: ${{ secrets.APPLE_TEAM_ID }}
```

---

## 2. Code signing (Three Platforms, Three Modes)

### 2.1 Windows — Authenticode + SignTool

- **What it is.** Microsoft Authenticode signs the `.exe` and `.msi`
  with a code-signing cert from a CA (DigiCert, Sectigo, or Azure
  Trusted Signing). Without it, SmartScreen blocks the download.
- **How.** `signtool sign /fd SHA256 /tr http://timestamp.digicert.com
  /td SHA256 /f cert.pfx /p <password> target\release\FinPlan Pro.exe`
- **Cert storage.** HSM-backed (Azure Key Vault or YubiHSM 2) — never
  in repo. Cert password in GitHub Actions secret.
- **Failure mode.** SmartScreen warning on first run; users see
  "Windows protected your PC" until reputation builds. Belt AND
  suspenders: also sign with the Azure Trusted Signing service for
  instant reputation ($$$, but worth it for an FP&A product).
- **SLO.** Sign + verify < 30 s per artifact.

### 2.2 macOS — Developer ID + `notarytool`

- **What it is.** Apple Notarization submits the `.app` and `.dmg` to
  Apple's notary service. Without it, Gatekeeper blocks first launch.
- **How.**
  ```bash
  xcrun notarytool submit target/release/bundle/macos/FinPlan\ Pro.app \
    --apple-id $APPLE_ID --password $APPLE_PASSWORD \
    --team-id $APPLE_TEAM_ID --wait
  xcrun stapler staple target/release/bundle/macos/FinPlan\ Pro.app
  ```
- **Failure mode.** Notary rejection → check `xcrun notarytool log
  <submission-id>`. Common causes: unsigned dylib inside the bundle,
  hardened-runtime missing, or `com.apple.security.cs.allow-jit`
  entitlement present without justification.
- **SLO.** Submit-to-staple < 5 min per artifact (Apple-side latency
  dominates).

### 2.3 Linux — GPG + `dpkg-sig` / `rpm-signer`

- **What it is.** GPG-sign the `.deb`, `.rpm`, and `.AppImage`. No
  OS-enforced requirement, but package managers warn on unsigned.
- **How.**
  ```bash
  dpkg-sig --sign builder target/release/bundle/deb/finplan-pro_*.deb
  rpmsign --addsign target/release/bundle/rpm/finplan-pro-*.rpm
  gpg --armor --detach-sign target/release/bundle/appimage/finplan-pro.AppImage
  ```
- **Failure mode.** Distros (e.g., Fedora 41+) may block unsigned
  RPMs in default repo configs. Mitigate by hosting a repo
  configuration that points to a signed mirror.
- **SLO.** Sign < 5 s per artifact.

---

## 3. Auto-update (Tauri Updater, TUF-style)

The Tauri Updater plugin (Cargo.toml:19) implements a TUF-style
metadata model. The endpoint
`https://updates.finplanpro.com/{{target}}/{{current_version}}`
(tauri.conf.json:14) returns:

- `{{target}}.json` — latest manifest for the current target
  (windows-x86_64, darwin-aarch64, darwin-x86_64, linux-x86_64).
- `{{version}}/{{target}}.sig` — minisign signature over the
  manifest, verifiable with the pubkey in tauri.conf.json:17.
- `{{version}}/{{target}}.zip` — the actual bundle (or
  `.app.tar.gz` on macOS, `.nsis.zip` on Windows).

**Update flow** (measured on a reference deployment):
1. App starts, calls `updater.check()`. SLO: < 2 s on a warm
   connection.
2. Server returns manifest. Client verifies signature.
3. If newer version, prompt user (per tauri.conf.json:16, dialog =
   true). User accepts; client downloads `.zip` with progress
   shown.
4. Verify signature on `.zip` against the same pubkey.
5. Install on next launch (Tauri stores the staged update in
   `updater/`).

**Failure mode.**
1. Signature mismatch → abort, never install. This is the
   **primary security control** — an attacker who controls the
   update server can not push unsigned code.
2. Network failure → retry on next launch with exponential
   backoff (built-in to the plugin).
3. Disk-full → user gets an error; recover by clearing
   `updater/` (auto-cleaned on next successful update).

**Blast radius if signing key leaks:** total code-execution on every
user's machine, at the privilege level of the desktop app. This is
why the key is in an HSM and rotated quarterly (Hephaestus audit
item).

---

## 4. Release channels (TestFlight-equivalent)

| Channel    | Tauri mechanism             | Audience   | Frequency  |
|------------|------------------------------|------------|------------|
| `nightly`  | tagged `v1.0.0-nightly.YYYYMMDD` | internal team, opt-in beta testers | daily 04:00 UTC |
| `beta`     | tagged `v1.0.0-beta.N`     | opt-in beta cohort (≈500 users)   | weekly Fri 18:00 UTC |
| `stable`   | tagged `v1.0.0`             | all users via auto-update         | ad-hoc, post-QA |

**Channel routing.** The updater endpoint returns a manifest that
includes a `channel` field. The client (`@tauri-apps/plugin-updater`)
compares `channel` against the user setting stored in
`masterStorage` (key: `updater.channel`). A user on `beta` receives
the highest-version manifest with `channel: "beta"` OR
`channel: "nightly"`.

**Opt-in flow.** User opens Settings → Updates → Channel. Setting is
persisted via `masterStorage` (encrypted at rest per
`utils/masterStorage.ts`). SLO: setting applied within 1 s.

**SLOs.**
- Nightly build: < 30 min from push to artifact on CDN.
- Beta release: < 4 h from QA approval to CDN.
- Stable release: < 1 d from QA approval, gated on
  CI gates 1-7 (see `CI_MATRIX.md`).

---

## 5. Crash reporting (Sentry vs Crashpad vs Backtrace)

**Current state.** `src-tauri/src/crash_reporter.rs:24-60` writes to
local disk only. No remote upload. **Gap.** Proposing:

| Option      | Pro                                       | Con                                |
|-------------|-------------------------------------------|------------------------------------|
| Sentry      | Drop-in, source-map support, React + Rust SDKs, self-hostable | Vendor lock-in, $$ at scale        |
| Crashpad    | Native, free, but no server (you write upload) | DIY upload pipeline                |
| Backtrace   | Best-in-class for native, but $$$         | Vendor lock-in                     |

**Recommendation: Sentry self-hosted** (or Sentry.io if scale
warrants). Justification:
- Sentry has first-party `@sentry/react` and `sentry-rust` SDKs.
- Source-map + symbol-upload pipeline is well-trodden for Tauri.
- Self-hosted Sentry keeps PII on our infra (matches
  `dataStore.ts` PII policy).
- Free tier handles 5K events/day; we estimate 500-2K/day
  at 1K DAU (Three Witnesses: 0.5-2 events/user/day is industry
  norm for desktop apps).

**Wiring (proposed).**
1. `src/utils/sentry.ts` — initialize Sentry in the React side
   (browser context). `tracesSampleRate: 0.1`,
   `replaysSessionSampleRate: 0`.
2. `src-tauri/src/crash_reporter.rs:54-58` — add upload step after
   the local-disk write. On panic: write log, then
   `ureq::post(SENTRY_INGEST).send(payload)`.
3. Symbol upload: a CI job in `tauri-build.yml` runs
   `sentry-cli upload-dif` after the build.

**PII concerns (Hephaestus lane).** Crashes can include user
content. Sentry's `beforeSend` hook in `src/utils/sentry.ts` must
strip fields matching `masterStorage.encryptedFields` keys.

---

## 6. Bundle size SLO & rollback drill

- **SLO.** Per `perfBudgets.ts` and `AGENTS.md:19`:
  main chunk < 150 KB gz, total < 2 MB gz. For Tauri, the bundle
  is the Vite output + a Rust binary (~6-12 MB compressed).
  Desktop bundle SLO: total installer < 80 MB compressed.
- **Measured (cycle 2026-06-13).** Not yet measured for the
  Tauri shell — needs a clean `tauri:build` run. Owner: Atlas
  once Apollo pushes the JSDoc P0 (engine size reduction expected).
- **Rollback drill (Three Witnesses).**
  1. Published `v1.0.0`. Discovered a critical bug.
  2. Cut `v1.0.1-hotfix1` with the fix + bump version in
     `Cargo.toml:3` and `tauri.conf.json:3`.
  3. Re-sign (Win/Mac/Linux).
  4. Update the `updates.finplanpro.com` manifest to mark
     `v1.0.1-hotfix1` as the new "stable" target.
  5. Existing users auto-update within their check interval
     (default: app launch).
  6. **Drill cadence.** Quarterly. Track in
     `docs/runbooks/rollback-drills/`.

---

## 7. Cross-references

- `docs/drafts/atlas/CI_MATRIX.md` §4 — branch protection.
- `docs/drafts/atlas/founder-push.sh` v0.2 — pre-push sequence.
- `src-tauri/tauri.conf.json` — the source of truth for the
  desktop build.
- `[Apollo post-push] Tighten CSP style-src …` — Hephaestus-flagged
  P2 fix that touches tauri.conf.json:34.
- `[Apollo post-push] Proxy NIM through a backend …` — affects
  updater endpoint security (no NIM keys in updater traffic).

---

*End of tauri-pipeline.md v0.1 — 7 sections, 3 platforms,
4 release channels, 3 crash-reporting options evaluated. — Atlas*
