# A11Y Waivers — NEVER-AGAIN RULE #50 (A11Y-CI-ENFORCEMENT)

**Source of truth:** docs/codif/RULE_50.md (when codif lands, Orchestrator-owned)
**Cross-references:** A11Y_READINESS v0.2 (Artemis, 3b67051c7) + A11Y v0.1 (04ac3930)

---

## Purpose

Per **NEVER-AGAIN RULE #50 (A11Y-CI-ENFORCEMENT)**, critical a11y violations (axe-core
`critical` and `serious` severities per WCAG 2.2 AA) MUST fail CI. In rare cases where
a violation cannot be fixed immediately (e.g., third-party widget, awaiting vendor
update, or 3rd-party framework limitation), a **waiver** can be filed to allow the
violation to pass with documented justification and time-bound remediation.

---

## Waiver Policy

1. **Scope**: Waivers apply to a SPECIFIC a11y rule + SPECIFIC component instance.
   They do NOT blanket-waive a rule project-wide.
2. **Auto-expiry**: 90 days from approval. Renewal requires a new waiver request.
3. **Approval**: Requires joint approval from:
   - **Artemis** (A11Y owner) — confirms rule interpretation
   - **Themis** (Compliance) — confirms regulatory exposure
   - **One of**: owning Muse (e.g., Hera for UI components) OR Atlas (for infra)
4. **Audit trail**: Each waiver is recorded here with:
   - Waiver ID (`WAIVER-YYYY-NNN`)
   - File:line + commit SHA of the violation
   - Rule violated (e.g., `color-contrast`, `aria-required-attr`)
   - Justification (third-party limitation, vendor roadmap, etc.)
   - Remediation plan (e.g., "upgrade to @mui/x-data-grid v8.0 in v1.0.1 PATCH")
   - Expiry date
5. **CI behavior**: Waivers are NOT auto-applied. PRs that introduce new violations
   must cite the waiver ID in the commit message. The CI a11y job (`.github/workflows/ci.yml`)
   does not check this file (intentionally — waivers are a human/audit mechanism, not
   a runtime gate).

---

## Active Waivers

_None. Add waivers below in the format:_

```markdown
### WAIVER-YYYY-NNN — <short description>

- **Rule**: `<axe-rule-id>` (WCAG 2.2 AA failure)
- **File:line**: `path/to/file.tsx:L42`
- **Introduced**: commit `abc1234d` (YYYY-MM-DD)
- **Approved by**: Artemis (a11y), Themis (compliance), <owning Muse>
- **Justification**: <why this cannot be fixed immediately>
- **Remediation plan**: <what will fix it, with ETA + owning Muse>
- **Expiry**: YYYY-MM-DD (90 days from approval)
- **PR commit message format**: `WAIVER-YYYY-NNN: <description>`
```

---

## Expiring Soon (within 30 days)

_None._

## Expired Waivers (require immediate fix)

_None._

## Rejected Waivers (audit log)

_None. Record rejected waivers here for institutional memory._

---

## Maintenance

- **File owner**: Atlas (infrastructure) + Artemis (a11y content review)
- **Update cadence**: On every waiver approval/rejection/expiry
- **Review**: Quarterly (every 90 days, aligned with auto-expiry)
- **Format**: Strict markdown table for active waivers, free-form for rejected/expired

---

## Cross-References

- **NEVER-AGAIN RULE #50** (A11Y-CI-ENFORCEMENT) — proposed by Artemis
- **A11Y-P0-3** (Mnemosyne, install axe runner + define `test:a11y`) — gates CI enforcement
- **A11Y-P0-4** (Atlas, this file + ci.yml a11y job) — gates waiver mechanism
- **A11Y_READINESS v0.1** (Artemis, 04ac3930) — baseline 71.8% ship-ready
- **A11Y_READINESS v0.2** (Artemis, 3b67051c7) — 72.2% ship-ready, +1.6% delta
- **A11Y v0.2 amendment** (Artemis, PICK URGENT B in flight) — target 87.5% post-4-P0 + 5-P1 closure

---

_Last updated: 2026-06-16 (Atlas A11Y-P0-4 prep, feature branch `atlas/a11y-p0-4-prep-v2`)_
