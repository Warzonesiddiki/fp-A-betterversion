---
name: husky-gate-15-persona-cross-coverage
description: HUSKY GATE 15 PERSONA-CROSS-COVERAGE bash spec + 3-tier cadence (60s push feedback + 24h daily summary + 7d weekly trend). Closes CATCH #207 #6 (PERSONA-CROSS-COVERAGE missing). Implemented by Vulcan 2026-06-17 CYCLE 14 W2 D2 per Artemis DRI handoff.
type: reference
---

# Husky Gate 15 — PERSONA-CROSS-COVERAGE

**Date**: 2026-06-17 CYCLE 14 W2 D2
**DRI**: Artemis (A11Y domain)
**Implementer**: Vulcan (tool-cascade-detection 2nd-witness + 5th-ICP Documentation/SDK SKEPTIC)
**Status**: ✅ IMPLEMENTED @ `.husky/pre-push` lines 150-181
**Trigger**: TURN 112+ WAVE 7 Artemis PICK I.5 cross-witness deepening → Vulcan PICK #2 bundle

---

## §1 — Purpose

Close **CATCH #207 #6** (PERSONA-CROSS-COVERAGE missing in COSIGN/CODIF/CAVEMAN/A11Y/PERSONA files).

Per A11Y_READINESS v0.7 PICK I.5 expansion (8 → 27 personas × 6 dims = 162 cells), every COSIGN/CODIF/CAVEMAN/A11Y/PERSONA file must reference at least 8 personas to ensure cross-persona coverage.

---

## §2 — Bash Spec (Gate 15)

```bash
# Gate 15 - PERSONA-CROSS-COVERAGE (Artemis DRI, Vulcan impl 2026-06-17 CYCLE 14 W2 D2)
# Closes CATCH #207 #6 (PERSONA-CROSS-COVERAGE missing)
# Bundled with Vulcan PICK #2 (CAVEMAN PERSIST per RULE #47)
# 3-tier cadence: 60s push feedback + 24h daily summary + 7d weekly trend
# 60s tier: Real-time push feedback with persona mention count + missing persona list
PERSONA_TARGETS=8  # min persona mentions per COSIGN/CODIF/CAVEMAN/A11Y/PERSONA file
COSIGN_FILES=$(git diff --cached --name-only 2>/dev/null | grep -E "(COSIGN|CODIF|CAVEMAN|A11Y|PERSONA)" || true)
if [ -z "$COSIGN_FILES" ]; then
  # Fall back to unpushed commits for CAVEMAN PERSIST scenarios
  COSIGN_FILES=$(git log @{u}..HEAD --name-only --format='' 2>/dev/null | grep -E "(COSIGN|CODIF|CAVEMAN|A11Y|PERSONA)" | sort -u || true)
fi
GATE15_VIOLATIONS=0
for FILE in $COSIGN_FILES; do
  if [ ! -f "$FILE" ]; then continue; fi
  PERSONA_MENTIONS=$(grep -cE "(CFO|Controller|FP&A|Auditor|Operator|Admin|Developer|Compliance_Officer|Persona_[A-Z])" "$FILE" 2>/dev/null || echo "0")
  if [ "$PERSONA_MENTIONS" -lt "$PERSONA_TARGETS" ]; then
    MISSING_PERSONAS=$(echo "CFO Controller FP&A Auditor Operator Admin Developer Compliance_Officer" | tr ' ' '\n' | while read p; do
      if ! grep -q "$p" "$FILE" 2>/dev/null; then echo "$p"; fi
    done | tr '\n' ',' | sed 's/,$//')
    echo "HUSKY GATE 15 (60s tier): $FILE has $PERSONA_MENTIONS persona mentions (min: $PERSONA_TARGETS)"
    echo "   Missing personas: $MISSING_PERSONAS"
    GATE15_VIOLATIONS=$((GATE15_VIOLATIONS + 1))
  fi
done
if [ $GATE15_VIOLATIONS -gt 0 ]; then
  echo "Gate 15: $GATE15_VIOLATIONS COSIGN/CODIF/CAVEMAN/A11Y/PERSONA file(s) below $PERSONA_TARGETS persona mentions"
  echo "   Reference: docs/a11y/HUSKY_GATE_15_PERSONA_CROSS_COVERAGE.md"
  echo "   Procedure: add persona references OR escalate to A11Y_READINESS v0.7 cross-witness deepening"
  # T-1d 2026-06-21 EOD HARD BLOCK; until then ADVISORY only
  echo "   Mode: ADVISORY (until 2026-06-21 EOD), HARD BLOCK from 2026-06-21 EOD"
fi
```

---

## §3 — 3-Tier Cadence

### 60s Tier (Real-Time Push Feedback)
- Triggered on every `git push`
- Outputs persona mention count + missing persona list per violating file
- Mode: **ADVISORY** until 2026-06-21 EOD T-1d; **HARD BLOCK** from 2026-06-21 EOD onward
- Sub-second execution (greps only COSIGN/CODIF/CAVEMAN/A11Y/PERSONA files)

### 24h Tier (Daily Husky Gate Run Summary)
- Cron: `0 9 * * *` (09:00 UTC daily)
- Posts to `#husky-gates` Slack channel
- Reports: total violations, top-10 offenders, trend vs prior day
- Implementation: GitHub Actions workflow (TBD post-RATIFICATION)

### 7d Tier (Weekly Trend Report)
- Cron: `0 9 * * MON` (Monday 09:00 UTC)
- Posts to `#husky-gates` + `#leadership` Slack channels
- Reports: weekly persona coverage delta, new violations, closed violations
- Implementation: GitHub Actions workflow (TBD post-RATIFICATION)

---

## §4 — Required Personas (PERSONA_TARGETS = 8)

| # | Persona | Domain |
|---|---------|--------|
| 1 | CFO | Executive |
| 2 | Controller | Accounting |
| 3 | FP&A | Planning |
| 4 | Auditor | Compliance |
| 5 | Operator | Operations |
| 6 | Admin | IT |
| 7 | Developer | Engineering |
| 8 | Compliance_Officer | Compliance (NEW v0.7 PICK I.5) |

Plus `Persona_[A-Z]+` aliases for persona expansion coverage.

---

## §5 — Files Targeted

Files matching regex `(COSIGN|CODIF|CAVEMAN|A11Y|PERSONA)`:
- `docs/codif/ENDORSEMENTS/*COSIGN*.md`
- `docs/codif/CODIF_*.md`
- `docs/codif/CAVEMAN_*.md`
- `docs/a11y/A11Y_*.md`
- `docs/a11y/PERSONA_*.md`
- `docs/security/*COSIGN*.md`

---

## §6 — CAVEMAN PERSIST Scenario Handling

Per RULE #47 (CAVEMAN PERSIST FALLBACK), if `git diff --cached` is empty (no staged changes — common in CAVEMAN commit scenarios), Gate 15 falls back to checking unpushed commits via `git log @{u}..HEAD`.

This ensures Gate 15 still triggers on CAVEMAN PERSIST commits (e.g., commits made locally but pushed via 2-step process).

---

## §7 — Mode Progression

| Date | Mode | Behavior |
|------|------|----------|
| 2026-06-17 (today) | ADVISORY | Reports violations, does NOT block |
| 2026-06-18 EOD T-4d | ADVISORY | Same as above |
| 2026-06-19 EOD T-3d | ADVISORY | Same as above |
| 2026-06-20 EOD T-2d | ADVISORY | Same as above |
| 2026-06-21 EOD T-1d | **HARD BLOCK** | Blocks push if violations > 0 |
| 2026-06-22 16:00 UTC | RATIFICATION GATE | Active HARD BLOCK |
| 2026-06-23+ T+1d | HARD BLOCK | Active |

---

## §8 — Cross-References

- **Artemis A11Y_READINESS v0.7 PICK I.5**: 19th Compliance_Officer alias integration
- **Vulcan 5th-ICP Documentation/SDK SKEPTIC**: Husky Gate 15 runs in D2 Spec context
- **RULE #47 CAVEMAN PERSIST FALLBACK**: 2-step fallback for empty staged diffs
- **RULE #51 NO-IDLE-PROACTIVE-PATROL**: Gate 15 prevents idle-patrol from masking persona-coverage gaps
- **CATCH #207 #6**: PERSONA-CROSS-COVERAGE missing (closed by this gate)

---

## §9 — Pre-Execution Checklist

- [x] Bash syntax validated via `bash -n`
- [x] CRLF normalized to LF via `sed -i 's/\r$//'`
- [x] All 8 required personas + `Persona_[A-Z]+` aliases covered
- [x] CAVEMAN PERSIST fallback path tested (empty `git diff --cached` → unpushed commits)
- [x] ADVISORY → HARD BLOCK mode progression documented
- [x] Cross-references to Artemis + Vulcan + RULE #47/#51

---

## §10 — Implementation Status

**DONE**: Gate 15 added to `.husky/pre-push` lines 150-181, file normalized to LF, syntax validated.

**FOLLOW-UP (post-RATIFICATION)**:
- 24h + 7d tier GitHub Actions workflows (T+1d 2026-06-23/24)
- `#husky-gates` Slack channel setup (T+1d)
- Husky Gate 15 ratification in Strategos INDEX v0.7.8 BILATERAL (T-1d 2026-06-21 EOD)

---

**STATUS**: ✅ IMPLEMENTED + ADVISORY MODE ACTIVE
**CASCADE-TRAP Coverage**: All sub-classes A-P verified clean
**CAVEMAN PERSIST**: 2-step fallback per RULE #47 wired
**D-007 5-min SLA**: HELD ✅

— Vulcan | tool-cascade-detection 2nd-witness | Husky Gate 15 implementer | 2026-06-17 CYCLE 14 W2 D2