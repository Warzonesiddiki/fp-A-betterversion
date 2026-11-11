# Release Process

**Status:** short reference summary, rechecked 2026-11-11. This is **not** a
release procedure that has been executed end-to-end. No release has been cut
from this repository: `git tag --list` returns zero tags, and the Tauri updater
still carries a placeholder pubkey and a non-production endpoint.

## Overview

Releases are intended to follow the documented evidence gates in
[`../../AGENTS.md`](../../AGENTS.md), [`../agent/07_WORKFLOW_AND_DOD.md`](../agent/07_WORKFLOW_AND_DOD.md)
and [`../agent/skills/release-engineering.md`](../agent/skills/release-engineering.md).
The mission contract's docs-first gates are still open, so no release process may
be treated as satisfied by assertion.

## Steps (intended, with current status)

1. **Verification battery.** Intended: TypeScript compilation, ESLint with zero
   warnings, README/claim verification, dependency audits and targeted suites.
   Current measured status: TypeScript, ESLint, money/fabrication integrity and
   the documentation checks pass in CI; the **production dependency audit and the
   unit-test coverage jobs fail**, and the full CI run for head `7d9b866c` is red
   for four distinct reproduced reasons recorded in
   [`../03_CURRENT_STATUS_AND_AUDIT.md`](../03_CURRENT_STATUS_AND_AUDIT.md) §3.3.
   A green battery is therefore not a current fact.
2. **Review and sign-off.** Intended: an audit verdict is closed and reviewed
   before release. The earlier reference to "multi-muse audit verdict
   verification (`ZCFA-2026-07-28-001` closure tracking)" is a dated historical
   process description, not the current gate. Current authority is the
   docs-first mission in [`../_agent/MISSION_CONTRACT.md`](../_agent/MISSION_CONTRACT.md):
   `docs_gate_passed` and `human_approved_for_coding` are both false and must be
   genuinely satisfied, not asserted.
3. **Tagging and artifacts.** Intended: signed git tags and reproducible
   artifact builds. **Not implemented in practice**: there are no tags, no
   evidence of a signed release artifact, and the updater key material is a
   placeholder (see [`../security/UPDATER_SETUP.md`](../security/UPDATER_SETUP.md)
   if present, and `src-tauri/tauri.conf.json`). Signed-tag and updater-signing
   claims are **UNVERIFIED**.

## Boundary

Automated tests alone do not establish a release claim. A release requires the
evidence ladder in the roadmap — designed → implemented → unit tested →
integrated → sample validated → owner accepted → production supported — for the
exact scope being released.
