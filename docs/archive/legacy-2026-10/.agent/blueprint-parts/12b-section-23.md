# SECTION 23 — WINDOWS DESKTOP APPLICATION SPECIFICATION

**Status:** normative, added session 005 at explicit direction. **Supersedes the Codex's
silence.** The Codex mentions Windows exactly once (line 2933, "redirect to desktop" for
phones) and never specifies a desktop client. The directive is that OmniPlan must be _a
proper tool that runs on Windows_. This section is that specification.

## 23.0 Why this section exists (the gap it closes)

An audit of the locked blueprint found that the word "Windows" appeared **once** in 3,756
lines, and that `MSI`, `installer`, `code signing`, and `printer` appeared **zero** times —
while the repository already ships a complete Tauri 2 desktop application:

| Evidence in repo            | Measured                                                                                                                                                    |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src-tauri/tauri.conf.json` | `productName: "FinPlan Pro"`, `bundle.active: true`, `targets: all`, **`bundle.windows.nsis` configured**                                                   |
| `src-tauri/Cargo.toml`      | Tauri 2 + 9 plugins: `sql(sqlite)`, `fs`, `dialog`, `shell`, `window-state`, `global-shortcut`, `notification`, `updater`, `clipboard-manager`; `keyring` 3 |
| `src-tauri/src/`            | `lib.rs`, `main.rs`, `secure_storage.rs`, `crash_reporter.rs`                                                                                               |
| `src-tauri/capabilities/`   | 12 permissions, scoped to appdata/applocaldata/appconfig/applog                                                                                             |
| `src-tauri/migrations/`     | `001_initial_schema.sql`, `002_cube_schema.sql` — **35 tables, the real schema home**                                                                       |
| CSP (`app.security.csp`)    | Strict: `default-src 'self'`, `object-src 'none'`, `frame-ancestors 'none'`                                                                                 |
| `tauri-plugin-updater`      | Dependency present; **`plugins: {}` is empty — updater is not configured** (release gate asserts "updater disabled")                                        |

**A shipping desktop client that the blueprint does not describe is an ungoverned surface.**
Section 9.10 defines a mobile posture; there was no equivalent desktop posture. A.19 listed
seven client surfaces and omitted the one that actually builds today. This section makes the
desktop a first-class, gated deliverable.

## 23.1 The desktop thesis (why Windows is strategic, not a port)

The FP&A buyer is overwhelmingly a Windows organisation, and the incumbent being displaced
(§19.2, Excel, ~70% of FP&A) is a **local Windows application**. A browser tab does not
replace a desktop application in this market for four concrete, non-cosmetic reasons:

1. **Offline is the norm, not the exception.** Board prep on a plane, close work in a
   datacentre-restricted office, audit fieldwork at a client site. §0.5 already sells
   "local-first + governed" as a differentiator; the desktop is the only surface that
   makes it literally true.
2. **File-system gravity.** Real FP&A is a river of `.xlsx` files from controllers, banks,
   and subsidiaries. A desktop app can watch folders, own file associations, and round-trip
   files without an upload dialog. K20's Excel two-way sync (F-INTEGRATE-006) is
   substantially easier and materially better on the desktop.
3. **Data residency by construction.** "Our financials never leave this machine" is an
   answer no cloud-only competitor can give, and it closes procurement objections in
   regulated and family-office segments.
4. **Grid performance.** A 100k-cell recalc (§11.2 budget: 5 s p95) runs against native
   SQLite with no network hop. The desktop is the surface most likely to _meet_ the
   performance contract, not least likely.

**Corollary (binding):** the desktop is **not** a wrapper around a website. It is the
reference implementation of the local-first plane defined in §4.3, and the web app is the
same product minus the local file and offline capabilities.

## 23.2 Supported platform matrix (normative)

| Platform                                 | Tier       | Commitment                                                                                        |
| ---------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------- |
| **Windows 11 (x64)**                     | **Tier 1** | Primary target. Every release blocked on a green Tier-1 test run. All perf budgets measured here. |
| **Windows 10 22H2 (x64)**                | **Tier 1** | Supported through Microsoft's EOL (Oct 2025 mainstream; extended per ESU). WebView2 required.     |
| Windows 11 (ARM64)                       | Tier 2     | Built and smoke-tested; performance budgets not guaranteed.                                       |
| Windows Server 2019/2022 (RDS)           | Tier 2     | Must run under RDS/Citrix multi-session; per-user data isolation verified (§23.6).                |
| macOS 13+ (Apple Silicon/Intel)          | Tier 2     | Built and smoke-tested. Not a release blocker.                                                    |
| Linux (Ubuntu 22.04+, .deb/AppImage)     | Tier 3     | Best effort, community-grade.                                                                     |
| Web (Chrome/Edge/Firefox/Safari, last 2) | Tier 1     | Full parity except §23.3 desktop-only capabilities.                                               |

**Tier definitions.** Tier 1 = release blocker, full test matrix, perf budgets enforced.
Tier 2 = builds and passes smoke tests; bugs triaged but do not block release.
Tier 3 = builds; no guarantee.

**Minimum hardware (Tier 1):** 4-core x64, 8 GB RAM, 2 GB free disk, 1366×768. **Recommended
for 5M+ facts:** 8-core, 16 GB RAM, SSD. These are stated so that §11 performance budgets
have a defined reference machine; a budget without a machine is not a budget.

**WebView2 dependency (the classic Windows deployment trap).** Tauri renders through
Edge WebView2. It is present by default on Windows 11 and on updated Windows 10, but **not
guaranteed** on stale Windows 10 images. The installer MUST use the WebView2 **evergreen
bootstrapper** and MUST degrade to a clear, actionable error if installation is blocked by
policy — never a blank white window. A blank window on launch is a **release-blocking
defect**, not a support ticket.

## 23.3 Desktop-only capabilities (what justifies the surface)

These are the capabilities that make the desktop worth shipping. Each is a feature with an
ID, a phase, and an acceptance test — not an aspiration.

| ID         | Capability                     | Phase | Specification                                                                                                                                                               |
| ---------- | ------------------------------ | ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F-DESK-001 | Native local database          | 0     | SQLite via `tauri-plugin-sql`, at `%APPDATA%\OmniPlan\`. **This is the system-of-record fix for the desktop surface** (§0.6.1, W0.8): no financial truth in `localStorage`. |
| F-DESK-002 | True offline modelling         | 1     | Full model/edit/report with the network cable pulled. Publication requires reconnection and server authorization (§4.4 authority rule).                                     |
| F-DESK-003 | File associations + drag-drop  | 1     | `.omniplan` model files open on double-click; `.xlsx`/`.csv` dropped on the window enter the import pipeline with reconciliation (§XIX-C).                                  |
| F-DESK-004 | Watched-folder ingestion       | 2     | Point at a folder; new/changed workbooks are detected, staged, diffed, and queued for approval. Never auto-posted without maker-checker (§13.3).                            |
| F-DESK-005 | Native print + page setup      | 1     | OS print dialog, real page setup, print preview matching output. Closes the §14.8 pixel-fidelity promise, which no browser can honour.                                      |
| F-DESK-006 | OS credential storage          | 0     | Tokens and the DB key in Windows Credential Manager via `keyring` (already implemented in `secure_storage.rs`). **Never** in `localStorage` or a plaintext file.            |
| F-DESK-007 | Global shortcut + tray         | 2     | System-wide ⌘K/Ctrl-K to the command palette; tray shows close-task and approval counts. Plugins already present.                                                           |
| F-DESK-008 | Native notifications           | 2     | Approval requests, close-task deadlines, failed imports via Windows notifications (§A.11), honouring Focus Assist.                                                          |
| F-DESK-009 | Multi-window                   | 2     | Detach a report/grid to a second monitor — the single most-requested FP&A ergonomic. Window state persisted (`window-state` plugin present).                                |
| F-DESK-010 | Signed auto-update             | 1     | See §23.5. Currently a dependency with no configuration; must be either configured-and-signed or explicitly disabled — never ambiguous.                                     |
| F-DESK-011 | Local Excel round-trip         | 2     | Open→edit→save a workbook in place, preserving formulas (§14.5 XLSX fidelity). The desktop half of the K20 filter (F-INTEGRATE-006).                                        |
| F-DESK-012 | Crash reporting with redaction | 1     | `crash_reporter.rs` exists. Reports MUST be scrubbed of monetary values and PII before leaving the machine — the §12.3 egress rule applies to crash dumps (see §23.7 R-26). |

## 23.4 Packaging & installation (Windows-native, enterprise-deployable)

| Requirement             | Specification                                                                                                                                                                                |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Installer formats**   | **MSI** (`wix`) for enterprise/GPO/Intune deployment **and** **NSIS** (`.exe`) for self-serve. Repo currently configures NSIS only — MSI is a gap to close.                                  |
| Per-user vs per-machine | Both. Per-user default (no admin rights); per-machine for managed fleets via MSI with `ALLUSERS=1`.                                                                                          |
| Silent install          | `msiexec /i OmniPlan.msi /qn` MUST succeed unattended with no dialog. Verified in CI-equivalent VM, not assumed.                                                                             |
| Install location        | `%LOCALAPPDATA%\Programs\OmniPlan` (per-user) / `%ProgramFiles%\OmniPlan` (per-machine).                                                                                                     |
| Data location           | `%APPDATA%\OmniPlan\` — DB, logs, config. **Never** in Program Files. Roaming-profile safe: DB in `%LOCALAPPDATA%`, config in `%APPDATA%`.                                                   |
| Uninstall               | Removes binaries; **prompts before deleting financial data** and defaults to keeping it. Silently destroying a ledger on uninstall is a Severity-0 class defect.                             |
| Upgrade                 | In-place, preserving the database; forward-only migrations (PC5) run on first launch with an automatic pre-migration backup.                                                                 |
| **Code signing**        | **Mandatory for GA.** EV or OV certificate; SmartScreen reputation established before public release. An unsigned installer that trips SmartScreen is an unshippable product, not a warning. |
| Bundle size             | Installer ≤ 60 MB; installed footprint ≤ 250 MB. Tauri's advantage over Electron is real and must not be squandered.                                                                         |
| Offline installer       | A fully offline installer variant (WebView2 evergreen **standalone**) for air-gapped/regulated sites.                                                                                        |

**Product naming.** The repo ships `productName: "FinPlan Pro"`; the product is **OmniPlan**
(§0.1). ADR-008 defers the rename to Phase 2. The installer, window title, and Credential
Manager entries must all change **together with a migration** for `%APPDATA%` paths and
credential keys — a rename that orphans a user's database is data loss. Tracked as a
Phase 2 task with an explicit migration step, not a find-and-replace.

## 23.5 Auto-update (currently ambiguous — must be resolved)

`tauri-plugin-updater` is a declared dependency, `plugins` in `tauri.conf.json` is empty, and
the release gate asserts "updater is disabled (no uncontrolled update endpoint)". That is a
**safe** state but an **undecided** one. The decision:

- **Phase 0–1:** updater stays **explicitly disabled**. The release gate that asserts this is
  correct and must remain.
- **Phase 2:** enable with **mandatory signature verification** (Tauri's minisign public key
  compiled in; unsigned or mis-signed payloads rejected).
- **Enterprise:** auto-update MUST be centrally disableable by GPO/registry policy; managed
  fleets patch through Intune/SCCM, and an app that self-updates against IT policy will be
  banned from the estate.
- **Never** auto-update mid-close. If a period close or an approval workflow is in progress,
  the update defers with a visible, dismissible notice. **Interrupting a close to install a
  patch is a Severity-1 defect.**

## 23.6 Desktop security posture

The desktop surface **increases** the attack surface and this is stated plainly rather than
assumed away.

| Control                | Requirement                                                                                                                                                             |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Local DB encryption    | Encrypted at rest with a key in Windows Credential Manager (`keyring`, implemented). Machine-bound; a copied `.db` file is useless without the key.                     |
| Capability scope       | The 12 Tauri permissions are the **maximum**; `fs` scopes stay confined to app dirs. Any widening requires an ADR. `shell` MUST NOT expose arbitrary command execution. |
| CSP                    | Current strict CSP (`object-src 'none'`, `frame-ancestors 'none'`) is normative; loosening it requires an ADR.                                                          |
| IPC boundary           | Every Rust command validates and type-checks its input. The webview is treated as untrusted (XSS in the renderer must not become code execution on the host).           |
| Multi-session/RDS      | Per-user data isolation verified under RDS/Citrix: user A must not read user B's database. Explicit test, because shared-desktop deployments are common in finance.     |
| Screen-capture posture | Field masking (§10.3) applies identically on desktop. Optional screenshot-protection flag for restricted views.                                                         |
| Crash dumps            | Scrubbed of monetary values and PII **before** transmission (F-DESK-012).                                                                                               |
| Supply chain           | Rust dependencies pinned via `Cargo.lock`; `cargo audit` in the release pipeline once a Rust toolchain exists (K2 blocks this today — see §23.8).                       |

## 23.7 New risks arising from the desktop surface

| ID   | Risk                                                                                                                                                       | L   | I   | Score  | Mitigation                                                                                                                                           |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | --- | --- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| R-24 | **The desktop app cannot be built or verified in this environment** — no `cargo`/`rustc` (K2). Rust changes ship blind; the Windows build is unproven here | 5   | 4   | **20** | §23.8 verification protocol: no Rust edits without a real toolchain; Windows build/test runs on a real machine or CI runner before any desktop claim |
| R-25 | Uninstall or a botched upgrade destroys the only copy of a customer's ledger (§0.6.1: local is currently authoritative)                                    | 3   | 5   | **15** | Uninstall defaults to keeping data; pre-migration automatic backup; W0.8 makes the server authoritative so local loss is recoverable                 |
| R-26 | Crash reports or telemetry exfiltrate monetary values from a customer machine                                                                              | 3   | 5   | **15** | F-DESK-012 redaction before transmission; the §12.3 egress chokepoint rule extends to crash/telemetry paths; egress test in CI                       |
| R-27 | Unsigned installer trips SmartScreen; enterprise buyers cannot deploy and trust collapses at first contact                                                 | 4   | 4   | **16** | Code signing mandatory for GA (§23.4); reputation warm-up before public launch; MSI for managed deployment                                           |
| R-28 | WebView2 absent or policy-blocked on older Windows 10 → blank window on launch                                                                             | 3   | 4   | 12     | Evergreen bootstrapper + offline installer variant; explicit actionable error, never a blank window; Tier-1 test on a clean Win10 22H2 image         |

## 23.8 Verification protocol under K2 (honesty about what cannot be proven here)

**This sandbox has no `cargo`, no `rustc`, and no Windows.** Therefore every claim in this
section is **"designed for, not proven"** until executed on real hardware. Per §22.6 and
ADR-004 this is stated rather than glossed:

```
CANNOT be verified in this environment:
  · Windows build, installer generation, silent install, code signing
  · WebView2 bootstrapping behaviour on a clean Windows 10 image
  · RDS/Citrix multi-session isolation
  · Native print fidelity
  · Any change to src-tauri/src/*.rs (no compiler → no feedback → no blind edits)

CAN be verified here:
  · tauri.conf.json / capabilities JSON schema correctness (static)
  · The TypeScript side of every desktop feature
  · Migration SQL under src-tauri/migrations/ (SQLite runs headless)
  · Documentation and gate definitions
```

**Binding rule:** no `src-tauri/src/*.rs` file is modified from this environment without a
real toolchain, and **no desktop capability is marked BUILT until it has been executed on
Windows** by a human or a Windows CI runner. Desktop CI (a `windows-latest` matrix leg)
ships as a numbered `ci-patches/*.patch` per ADR-011.

## 23.9 Desktop Definition of Done (additive to §22.1)

```
□ Installs on clean Windows 11 and clean Windows 10 22H2 via MSI and NSIS, silently and interactively
□ No blank window: WebView2 present, bootstrapped, or a clear actionable error
□ Launch to interactive ≤ 3 s on the Tier-1 reference machine
□ Full offline session: model, calculate, report with the network disabled
□ Financial data in %APPDATA% SQLite, encrypted, key in Credential Manager — never localStorage
□ Uninstall preserves data by default; upgrade preserves data and auto-backs-up pre-migration
□ Installer is code-signed; SmartScreen clean (GA)
□ Print output matches preview (§14.8)
□ Per-user isolation verified under RDS multi-session
□ Crash reports contain zero monetary values or PII (automated scan)
□ Auto-update: signed and policy-disableable, or explicitly disabled — never ambiguous
□ Every desktop claim executed on real Windows, per §23.8 — no capability marked BUILT from this sandbox
```
