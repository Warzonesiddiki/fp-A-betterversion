---
id: MEMORY/TASKS/BLOCKED.md
status: active
last_verified: 2026-08-18
verified_by: arena-agent/session-017
confidence: high
---

# TASKS/BLOCKED

| Item | Why blocked | Last error / evidence | Next experiment |
| --- | --- | --- | --- |
| CI workflow changes | GitHub App lacks the `workflows` permission | push rejected on `.github/workflows/**` | keep delivering `ci-patches/*.patch`; ask a human to `git apply` `0005-*` |
| `src-tauri/src/*.rs` changes | no cargo/rustc in sandbox (ADR-011, §23.8 K2) | `cargo: command not found` | none — do not edit Rust here |
| Desktop (Tauri) verification | same | — | needs a Windows/CI runner with the Rust toolchain |
| GitHub Vitest coverage job | no `coverage/` artifact produced | job red on CI | produce coverage in the workflow (needs the patch applied) |
| Pre-push gate 10 on a fresh branch | no `@{u}` ⇒ falls back to `git log -10`, flags merged squashes `5078e01`, `646bdf4` | gate output | acknowledge in `docs/security/CASCADE_HOLD_LEDGER.md`; do not re-fight |
