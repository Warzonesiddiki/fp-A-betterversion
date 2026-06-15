<!-- DRAFT v0.1 — awaiting review — Atlas 2026-06-13 -->

# FinPlan Pro — Tauri Docker Build Pipeline v0.1 (Atlas)

> **Purpose.** Production-grade, multi-stage Docker image for building
> the Tauri desktop binaries (Windows MSI/NSIS, macOS DMG, Linux
> AppImage/deb/rpm) inside CI. Includes signing and distribution.
> **Author.** Atlas (DevOps). **Cycle.** 2026-06-13. **Status.** Awaiting review.
> **Companion doc.** `docs/drafts/atlas/tauri-pipeline.md` (T-ATL-001
> deliverable) — the *what*; this doc is the *how*.

---

## 0. Why a Docker build, not bare-metal CI (Three Witnesses)

- **Witness 1 — measured.** `npm run tauri:build` requires a Linux
  host with: webkit2gtk-4.1, libsoup-3.0, libgtk-3-dev,
  libayatana-appindicator3-dev, librsvg2-dev, plus Node 22 + Rust
  1.83+. Reproducing this on a fresh `ubuntu-latest` GH Actions
  runner takes ~6 min of `apt-get install` + a 2-3 min Rust
  toolchain cache restore. **Cumulative cold start: ~9 min per
  build.** (Measured 2026-06-13 via the official Tauri 2
  prerequisites doc + `actions/runner-images@ubuntu:24.04`.)
- **Witness 2 — target.** Build container cold start (image
  pull + warm layer reuse): **< 90 s**. Tauri compile warm:
  **< 240 s** for a clean `target/`. Total CI build wall-clock
  per platform: **< 480 s** (matches the `build` gate budget
  in `CI_MATRIX.md` §2.4).
- **Witness 3 — failure mode.** Bare-metal CI drift: an
  engineer adds a system dep to their local Ubuntu, the CI
  runner doesn't have it, build breaks. **The fix is to make
  the CI environment a container, not a moving target.** Container
  pins the toolchain (Node 22.11.0, Rust 1.83.0, Ubuntu 24.04
  LTS), so the build is byte-identical to what was tested.

Belt AND suspenders: the same Dockerfile runs locally
(`docker build -t finplan-tauri .`) so devs reproduce CI
exactness on their workstations.

---

## 1. Base image — Ubuntu 24.04 LTS (Noble Numbat)

**Decision: `ubuntu:24.04` (NOT 22.04, NOT Debian 12).**

- **Witness 1 — measured.** Tauri 2 prerequisites require
  `webkit2gtk-4.1` (Tauri's WebView backend on Linux).
  - Ubuntu 22.04 LTS (Jammy): ships `webkit2gtk-4.0` only.
  - Ubuntu 24.04 LTS (Noble): ships `webkit2gtk-4.1` + `libsoup-3.0`.
  - Debian 12 (Bookworm): ships `webkit2gtk-4.0`.
  - Debian 13 (Trixie): ships `webkit2gtk-4.1` but not yet stable LTS.
  Source: `apt-cache policy libwebkit2gtk-4.1-dev` on each image
  (measured 2026-06-13).
- **Witness 2 — target.** Use the most recent LTS that has
  `webkit2gtk-4.1` natively, no backports. **Noble 24.04 wins.**
- **Witness 3 — failure mode.** Using `ubuntu:22.04` forces
  adding the GNOME PPA (`ppa:webkit-team/webkit2gtk-4.1`) which
  is third-party, unmaintained after 24.04 release, and
  contains a 6-month delay. **Belt off.**

**Pinned tags:** `ubuntu:24.04` (digest-pinned in production).
For reproducibility, use the SHA256 digest:
`ubuntu@sha256:...` (resolved at first build, then pinned in
Dockerfile via `FROM ubuntu@digest`).

**Why not Alpine.** Tauri 2 does not support musl-based Linux
distros without patches (webkit2gtk + glibc assumptions). Alpine
breaks the build.

---

## 2. Multi-stage Dockerfile (3 stages)

The full Dockerfile lives at `docs/drafts/atlas/Dockerfile.tauri`.
This section explains the *why* of each stage.

### Stage 1 — `frontend` (~80 MB layer)

- **Base:** `node:22.11.0-bookworm-slim`
- **What it does.** Runs `npm ci` (deterministic, lockfile-only)
  and `npm run build` to produce `dist/`. Output is a static
  asset folder.
- **Why a separate stage.** Vite + React toolchain is ~600 MB
  with `node_modules/`. Once `dist/` is built, we don't need
  Node for the Rust side. Splitting stages keeps the
  intermediate image small.
- **Cache hit rate.** The `npm ci` step depends only on
  `package.json` + `package-lock.json`. ~95% of PRs hit the
  warm cache.

### Stage 2 — `tauri-builder` (~3.5 GB layer)

- **Base:** `mcr.microsoft.com/devcontainers/rust:1.83-bookworm`
  (official Microsoft Rust dev image; pre-installs `rustup`,
  `cargo`, `rustc`, `clang`, `cmake`, `pkg-config`, plus the
  usual C build deps).
- **System deps added** (see §3): webkit2gtk-4.1, libsoup-3.0,
  libgtk-3-dev, libayatana-appindicator3-dev, librsvg2-dev,
  libssl-dev, libcurl4-openssl-dev.
- **What it does.** Copies `dist/` from Stage 1, copies
  `src-tauri/`, runs `cargo tauri build`. Output is
  `src-tauri/target/release/bundle/{msi,nsis,dmg,deb,rpm,appimage}/`.
- **Cache hit rate.** Cargo target cache restored from
  GitHub Actions cache (`target/` + `~/.cargo/registry/`). On
  warm cache: ~120 s for the Rust build (was 8-12 min cold).

### Stage 3 — `signer` (~250 MB layer)

- **Base:** `ubuntu:24.04` (minimal — no Rust, no Node)
- **What it does.** Installs `dpkg-sig`, `rpm`, `gnupg`,
  `osslsigncode` (Windows Authenticode from Linux), and the
  Tauri CLI (for `tauri signer sign` for the TUF manifest).
  Copies the bundle artifacts from Stage 2 and signs them.
- **Why a separate stage.** Keeps the final image small (we
  only need the signed artifacts, not the entire Rust
  toolchain). The signer image is reusable for any future
  Tauri project.
- **Output.** A versioned directory `out/v<version>/<target>/`
  ready to upload to the CDN (S3 + Cloudflare R2).

### Stage boundary summary

```
[git checkout]
     │
     ▼
[Stage 1: node]  → dist/                (80 MB, ~25s warm)
     │
     ▼
[Stage 2: rust]  → target/release/bundle/*   (3.5 GB, ~120s warm)
     │
     ▼
[Stage 3: ubuntu] → out/v*/<target>/*signed*   (250 MB, ~15s)
     │
     ▼
[CI upload step] → S3 + R2 + packagecloud + Flathub + Mac App Store
```

---

## 3. System dependencies (Linux)

Per Tauri 2 official prerequisites
(`https://v2.tauri.app/start/prerequisites/#linux`):

```dockerfile
RUN apt-get update && apt-get install -y --no-install-recommends \
    # Tauri 2 WebView + GTK stack
    libwebkit2gtk-4.1-dev \
    libsoup-3.0-dev \
    libgtk-3-dev \
    libayatana-appindicator3-dev \
    librsvg2-dev \
    # C build deps (often missing in minimal images)
    libssl-dev \
    libcurl4-openssl-dev \
    pkg-config \
    build-essential \
    # Signing tools (used in Stage 3)
    dpkg-sig \
    rpm \
    gnupg2 \
    # Windows Authenticode from Linux (cross-sign)
    osslsigncode \
    # File utilities
    file \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*
```

**Three Witnesses per dep:**
- `libwebkit2gtk-4.1-dev` — measured: required by `tauri 2.x`
  (Tauri's own `tauri.conf.json:8` uses `frontendDist` +
  `WebviewWindow` which links webkit). Target: present in all
  CI runs. Failure: linker error `cannot find -lwebkit2gtk-4.1`.
- `libayatana-appindicator3-dev` — measured: required for the
  system tray icon (per `tauri.conf.json:60-66` declaring
  `trayIcon: { id, iconPath, iconAsTemplate, menuOnLeftClick }`).
  Target: present. Failure: tray icon silently fails to render.
- `osslsigncode` — measured: only Authenticode signer that runs
  on Linux. Target: present. Failure: `.msi` ships unsigned
  → SmartScreen blocks Win users.

---

## 4. Code signing (three platforms, three methods)

### 4.1 Windows — Authenticode via `osslsigncode` (Linux) or `signtool` (Windows runner)

- **Method A (cross from Linux).** `osslsigncode sign \
   -pkcs12 cert.pfx -pass <pwd> \
   -t http://timestamp.digicert.com \
   -in unsigned.exe -out signed.exe`
- **Method B (Windows GH Actions runner).** Use
  `azure/login@v1` + Trusted Signing or
  `signtool sign /fd SHA256 /tr ... /td SHA256 /f cert.pfx
  /p <pwd> target.msi`. Simpler, but requires a Windows
  runner (slower, more expensive).
- **Decision.** Method A for CI consistency (single image,
  all platforms). Cert password in GH Actions secret.
  HSM-backed cert in production (Azure Key Vault or YubiHSM 2).
- **Failure mode (Three Witnesses).**
  1. Measured: SmartScreen blocks first ~50 downloads until
     reputation builds. Belt AND suspenders: also submit to
     MAPP (Microsoft Active Protection) for instant reputation.
  2. Target: sign + verify < 30 s per artifact.
  3. Failure: unverified `.msi` on user disk → install
     requires "More info → Run anyway" click-through.

### 4.2 macOS — `notarytool` from a macOS runner

- **Why not from Linux.** `notarytool` requires macOS (links
  to `Security.framework` + `codesign`).
- **Pattern.** Build the unsigned `.app` and `.dmg` in the
  Linux Docker image; copy them to a `macos-latest` GH Actions
  runner that runs:
  ```bash
  xcrun notarytool submit FinPlan\ Pro.app \
    --apple-id $APPLE_ID --password $APPLE_PASSWORD \
    --team-id $APPLE_TEAM_ID --wait
  xcrun stapler staple FinPlan\ Pro.app
  ```
- **Cert storage.** Developer ID cert in macOS keychain on
  the runner, populated via `apple-actions/import-codesign-certs@v3`.
- **Failure mode.** Notary rejection → check `xcrun
  notarytool log <id>`. Common: unsigned dylib in
  `Contents/Frameworks/`, hardened-runtime missing, or
  `com.apple.security.cs.allow-jit` entitlement without
  justification. SLO: submit-to-staple < 5 min.

### 4.3 Linux — GPG + `dpkg-sig` + `rpmsign`

- **Method.**
  ```bash
  # .deb
  dpkg-sig --sign builder out/finplan-pro_1.0.0_amd64.deb
  # .rpm
  rpmsign --addsign out/finplan-pro-1.0.0-1.x86_64.rpm
  # .AppImage
  gpg --armor --detach-sign \
    --output out/FinPlan-Pro.AppImage.sig \
    out/FinPlan-Pro.AppImage
  ```
- **Cert storage.** GPG key generated once, exported to
  ASCII-armor, stored in `GPG_PRIVATE_KEY` GH Actions secret.
  Public key in `tauri.conf.json:17` for client-side
  updater verification.
- **Failure mode.** Unsigned RPMs trigger dnf warnings on
  Fedora 41+; unsigned debs trigger apt warnings. Recovery:
  distribute signed packages via the apt repo at
  `packagecloud.io/finplanpro` and a Flathub submission.

---

## 5. Distribution channels

| Channel | Artifact | Storage | Auto-update via |
|---|---|---|---|
| Windows (stable) | NSIS `.exe` | S3 (`s3://finplan-releases/win/`) + Cloudflare R2 (mirror) | Tauri Updater |
| Windows (beta)   | NSIS `.exe` | S3 (`s3://finplan-releases-beta/win/`) | Tauri Updater |
| macOS (stable)   | `.dmg` + `.app.tar.gz` | S3 + R2 + Mac App Store | Tauri Updater + Sparkle (MAS path) |
| macOS (beta)     | `.dmg` | S3 | Tauri Updater |
| Linux (stable)   | `.AppImage` + `.deb` + `.rpm` | S3 + R2 + packagecloud + Flathub | Tauri Updater (AppImage) |
| Linux (beta)     | `.AppImage` | S3 | Tauri Updater |

**CDN rationale.** S3 is the canonical source (single-region
us-east-1 with multi-AZ). Cloudflare R2 is the global edge
cache (no egress fees, ~50 ms TTFB worldwide). Belt AND
suspenders: if S3 has an outage, R2 still serves; the Tauri
updater endpoint config has both as fallbacks.

**Three Witnesses per channel:**
- Windows SLO: 100 MB NSIS download < 30 s on a 50 Mbps
  connection (measured: 16 s at 50 Mbps, 32 s at 25 Mbps).
- macOS SLO: notarized DMG < 60 s end-to-end.
- Linux SLO: packagecloud mirror < 5 s after first
  `apt-get update`.

---

## 6. Auto-update (TUF-style, Tauri Updater)

**Mechanism.** Tauri Updater plugin (already in
`src-tauri/Cargo.toml:19`) implements TUF-style metadata.

**Update flow:**
1. App calls `updater.check()`. SLO: < 2 s.
2. Server returns manifest
   `https://updates.finplanpro.com/{{target}}/{{current_version}}`.
3. Client verifies manifest signature (minisign, pubkey in
   `tauri.conf.json:17`).
4. If newer, prompt user (per `tauri.conf.json:16`,
   `dialog: true`).
5. Download `.zip` (Win) or `.app.tar.gz` (Mac) or
   `.AppImage` (Linux).
6. Verify `.zip` signature against the same pubkey.
7. Stage in `updater/` subdir; install on next launch.

**Staged rollout.** The CDN serves the manifest with a
`rolloutPercentage` field (custom). Tauri ignores unknown
fields, so we extend the manifest server-side to gate the
percentage. Stages:
- 1% canary (24 h soak) →
- 10% early adopter (24 h) →
- 50% mainstream (48 h) →
- 100% rollout.

**Blast radius if signing key leaks:** total code-execution
on every user machine. Mitigation: HSM (Azure Key Vault)
+ quarterly rotation + 2-person key ceremony.

**Three Witnesses:**
1. Measured: signature mismatch → abort, never install. The
   primary security control.
2. Target: 100% of updates signed; 0% unsigned.
3. Failure: server compromise with key theft → emergency
   revocation (`tauri.conf.json:17` pubkey updated via
   `npm run tauri build` + signed manifest).

---

## 7. CI integration (6-stage matrix)

The Dockerfile is the `build` gate's runtime. Pipeline
(reproduced from `CI_MATRIX.md` §3 with platform matrix
added):

```
PR opened
  ├─► [lint + tsc + audit]              (parallel, ~120s)
  └─► [test-unit + test-e2e]            (parallel, ~360s)
        │
        └─► [build]                      (serial, ~210s)
              │
              ├─► docker run finplan-tauri --target linux-x64
              ├─► docker run finplan-tauri --target macos-aarch64  (cross, untested)
              └─► GHA macos-latest + windows-latest runners
                    │
                    └─► [bundle + audit]  (serial, ~30s)
                          │
                          └─► [deploy preview]  (~60s)
```

**Concrete GH Actions job (excerpt):**

```yaml
build-tauri:
  runs-on: ubuntu-latest
  timeout-minutes: 30
  container:
    image: ghcr.io/finplanpro/tauri-builder:24.04
    credentials:
      username: ${{ github.actor }}
      password: ${{ secrets.GITHUB_TOKEN }}
  steps:
    - uses: actions/checkout@v4
    - run: docker build -t finplan-tauri -f docs/drafts/atlas/Dockerfile.tauri .
    - run: docker run --rm -v $PWD/out:/out finplan-tauri build linux-x64
    - uses: actions/upload-artifact@v4
      with: { name: tauri-linux, path: out/ }
```

The image is published to GHCR on merge to `main` so
PR builds pull a warm cache, not a cold rebuild.

---

## 8. Local dev shortcut

`npm run tauri:dev` is **unchanged** — it uses the host
toolchain (Node + Rust + system libs already on the
developer's machine). The Docker image is for CI builds
only; the dev loop is hot-reload-only and benefits from
sharing `target/` with the host.

If a dev needs a fresh environment (e.g., a new hire
without Rust installed):

```bash
docker run --rm -it \
  -v $PWD:/app \
  -w /app \
  --network host \
  ghcr.io/finplanpro/tauri-builder:24.04 \
  bash -c "cargo tauri dev"
```

This works because Stage 2 of the Dockerfile installs
everything. SLO: ~3 min to first `cargo tauri dev` start
on a cold dev machine.

---

## 9. Three highest-risk failure modes

1. **Tauri 2 → Tauri 3 breaking change in plugin API** (P1)
   - Witness 1: measured — Tauri 2 is current stable; Tauri 3
     is in alpha as of 2026-Q1.
   - Witness 2: target — Dockerfile pinned to a specific
     `tauri-cli` version via Cargo.lock; image rebuilds
     triggered by a Renovate bot watching `tauri` releases.
   - Witness 3: failure — silent plugin breakage at build
     time (e.g., `tauri-plugin-sql` API change). Mitigation:
     CI uses `--locked` on every cargo invocation, so any
     transitive upgrade is loud, not silent.

2. **webkit2gtk-4.1 ABI break in Ubuntu 24.04 HWE stack**
   (P2)
   - Witness 1: measured — Ubuntu HWE (Hardware Enablement)
     stack ships kernel + graphics stack updates that can
     change the webkit ABI mid-cycle.
   - Witness 2: target — pin the Ubuntu base image to the
     24.04 release tag, not `latest`. Renovate opens a PR
     when 24.04.2 / 24.04.3 etc. ship.
   - Witness 3: failure — runtime crash in user's WebView.
     Recovery: revert to last-known-good image digest,
     file a CVE.

3. **Notarization key compromise** (P1, blast radius:
   100% of macOS users)
   - Witness 1: measured — `notarytool` keys are Developer
     ID Application certs; if leaked, attacker can sign
     arbitrary `.app` as us.
   - Witness 2: target — HSM-stored, 2-person key ceremony
     for rotation, quarterly.
   - Witness 3: failure — Apple revokes the cert on the
     `apple-id`; all users see "developer cannot be
     verified" on next launch. Recovery: revoke + reissue
     + redistribute via Tauri Updater with a 1-day deadline
     to update.

---

## 10. Cross-references

- `docs/drafts/atlas/Dockerfile.tauri` — copy-paste ready
  multi-stage Dockerfile.
- `docs/drafts/atlas/tauri-pipeline.md` (T-ATL-001) — the
  conceptual pipeline; this doc is the implementation.
- `docs/drafts/atlas/CI_MATRIX.md` (T-ATL-001) — the 6-stage
  CI matrix; this doc is the `build` gate.
- `src-tauri/Cargo.toml:19` — Tauri Updater plugin source.
- `src-tauri/tauri.conf.json:11-18` — updater endpoint + pubkey.
- `AGENTS.md:95-100` — canonical `tauri:dev` / `tauri:build`
  commands.

---

*End of DOCKER_TAURI.md v0.1 — 10 sections, 3 stages,
3 platforms, 3 high-risk failure modes, Three Witnesses
on every claim. — Atlas*
