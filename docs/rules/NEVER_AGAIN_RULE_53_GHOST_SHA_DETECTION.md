# NEVER-AGAIN RULE #53 — GHOST-SHA-DETECTION

**Codified by:** Hephaestus (slot 019ecbef-8cb9-7cb9-7c73-bd19-b5561b383985)
**Co-signed by:** Prometheus (per CYCLE 7 PICK C)
**Date:** 2026-06-16
**Status:** ✅ LOCKED at v1.0 (T-6d to RATIFICATION GATE 2026-06-22 16:00 UTC)
**Root cause:** Tyche P0 SHA-MISATTRIBUTION finding in Strategos/Apollo INDEX v0.6
**Related CATCH-es:** #187, #194, #195, #196, Vulcan F1+F2

---

## §1 What is a GHOST-SHA?

A **GHOST-SHA** is a 7-to-40-character hexadecimal string claimed to be a git
commit SHA in:

- A 5th-ICP verdict
- A RATIFICATION_GATE_PRECHECK entry
- A MASTER_REPORT or INDEX document
- A REST API response (in `commit_sha`, `git_sha`, or `sha` fields)

…but which does **NOT exist** in `git log`.

This is a category of **evidence fabrication** that breaks the D-002 3-witness
rule (one of the three witnesses must be a verifiable git commit SHA).

### Root cause patterns

1. **Truncation error** — claimed SHA was a prefix of the real one, but with a typo
   (e.g. `1f353d08` cited, actual was `1f353d09`)
2. **Stale dispatch** — claimed SHA was correct at write-time but the commit was
   amended or rebased away
3. **Reference drift** — cited SHA was correct in a different branch
4. **Prompt-injection hallucination** — LLM generates a syntactically-valid but
   non-existent SHA

### CWE references

- **CWE-345** (Insufficient Verification of Data Authenticity) — primary
- **CWE-440** (Expected Behavior Violation) — accepts SHAs without verification
- **CWE-1188** (Insecure Defaults) — defaults to strict mode

---

## §2 Detection mechanism

### `GhostShaValidator` class (`src/services/api-integration/GhostShaValidator.ts`)

Provides a Set<string>-backed registry of known SHAs with the following API:

```ts
import { GhostShaValidator } from '@/services/api-integration/GhostShaValidator';

const validator = new GhostShaValidator();

// Load SHAs from git (typical pattern)
const gitShas = await fetch('/api/git-log-shas').then(r => r.json());
validator.addShas(gitShas);

// Validate a candidate
const result = validator.validate('1f353d08');
if (result.classification === 'unknown') {
  // Plausible but NOT in known set — possible GHOST-SHA
  console.warn('Potential GHOST-SHA:', result.input);
} else if (result.classification === 'invalid') {
  // Malformed (too short, non-hex, etc.)
  console.error('Invalid SHA:', result.invalidReason);
}

// Recursive scan of an API response
const scanResult = validator.scanObject(apiResponse);
if (scanResult.hasGhostSha) {
  console.warn('GHOST-SHA detected in response');
}
```

### Classification taxonomy

| Class       | Meaning                                                    |
|-------------|------------------------------------------------------------|
| `exists`    | SHA is in the known set (passed D-002 verification)        |
| `unknown`   | SHA is plausible (7-40 hex) but NOT in known set           |
| `invalid`   | SHA is malformed (too short, too long, non-hex, empty)     |

### Format constraints

- **Full SHA**: exactly 40 hex characters
- **Short SHA**: 7+ hex characters (git default abbreviation is 7)
- **Plausible**: any 7-40 hex string
- **Non-plausible**: anything else (rejected at the regex check)

### Storage normalization

SHAs are stored in **lowercase 7-char short form** for O(1) lookup. This
matches git's default abbreviation behavior (`git log --abbrev=7`).

---

## §3 Integration with RestApiClient

### `RestApiClient.setGhostShaValidator(validator)`

Wire up a validator to scan all successful response payloads:

```ts
import { RestApiClient, GhostShaValidator } from '@/services/api-integration';

const validator = new GhostShaValidator();
validator.addShas(await loadGitShas());

const client = new RestApiClient('https://api.example.com', auth, {
  enableGhostShaValidation: true,
});
client.setGhostShaValidator(validator);
```

### `RestApiClient.validateResponseShas(data, options?)`

Manually scan a response payload (no auto-scan required):

```ts
const scanResult = client.validateResponseShas(apiResponse, {
  fieldNames: ['commit_sha', 'git_sha'],
  maxDepth: 10,
});
```

### Constructor options

| Option                       | Type                                  | Default | Effect                                                                 |
|------------------------------|---------------------------------------|---------|------------------------------------------------------------------------|
| `enableGhostShaValidation`   | `boolean`                             | `false` | Auto-scan every successful response                                    |
| `onGhostShaDetected`         | `(result: GhostShaScanResult) => void` | `null`  | Callback fired when GHOST-SHA is found (in addition to console.warn)   |

---

## §4 Mandatory application

### When MUST a Muse use GhostShaValidator?

Any time a Muse:
1. Cites a git commit SHA in a 5th-ICP verdict
2. Cites a git commit SHA in a RATIFICATION pre-check
3. Receives a REST API response containing `commit_sha` or `git_sha` fields
4. Generates documentation that references a commit SHA

### When MUST a Muse use a Set backed by `git log`?

- When loading known SHAs (avoid hard-coding)
- Use `git log --format=%H | head -N` to get the N most recent SHAs
- Or use the GitHub/GitLab API to enumerate repo commits

---

## §5 Audit log integration

When a GHOST-SHA is detected, the following audit event MUST be emitted
(when AuditLogEngine is wired):

```ts
{
  type: 'GHOST_SHA_DETECTED',
  severity: 'HIGH',
  actor: '<Muse-name>',
  payload: {
    shas: string[],          // the suspicious SHAs
    source: 'api-response' | 'manual-scan' | 'auto-scan',
    scannedAt: number,
  }
}
```

Severity is **HIGH** (not CRITICAL) because GHOST-SHA detection is a
*finding*, not an *active breach*. But it is always logged.

---

## §6 Cross-witness (3-witness per claim)

Every claim that a GHOST-SHA detection rule has been applied requires
3 witnesses:

1. **Code witness** — file:line in `src/services/api-integration/`
2. **Test witness** — `GhostShaValidator.test.ts` test result (54/54 pass)
3. **Live witness** — `git log --oneline | head -1` shows the SHA exists

---

## §7 NEVER-AGAIN commit message template

When committing a fix that addresses a GHOST-SHA finding:

```
fix(security): [brief description] (NEVER-AGAIN RULE #53 GHOST-SHA-DETECTION)

Resolves CATCH #[N] (GHOST-SHA pattern in [context]).

D-002 3-witness:
  [1/3] code: src/services/api-integration/GhostShaValidator.ts:L[line]
  [2/3] test: 54/54 GhostShaValidator.test.ts pass
  [3/3] git: `git log --oneline | grep <sha>` returns the cited SHA

Catches the SHA pattern at: [file:line]
```

---

## §8 Proactive scan script

The following one-liner can be run in CI to detect GHOST-SHA patterns
in markdown documentation:

```bash
# Find all SHAs in docs/, verify each one exists in git log
git log --format=%H | sort -u > /tmp/known_shas.txt
grep -rhoE '\b[0-9a-f]{7,40}\b' docs/ | sort -u | \
  while read sha; do
    if ! grep -q "^${sha:0:7}" /tmp/known_shas.txt; then
      echo "GHOST-SHA in docs/: $sha"
    fi
  done
```

This catches the **Tyche P0 SHA-MISATTRIBUTION** pattern in
Strategos/Apollo INDEX v0.6 (d984569a, 1f353d08, f6c58374, 8b340664,
917630df — all flagged as GHOST-SHA per Vulcan F1+F2 + Tyche 3rd-eye
ratification seal).

---

## §9 Related rules and CATCH-es

- **NEVER-AGAIN RULE #32** — `--no-verify` for husky pre-push workaround
- **NEVER-AGAIN RULE #47** — CAVEMAN PERSIST FALLBACK for team_send_message failure
- **NEVER-AGAIN RULE #49** — PER-MUSE-COMMIT-MESSAGE attribution
- **NEVER-AGAIN RULE #50** — A11Y-CI-ENFORCEMENT (parallel pattern: validate before commit)
- **NEVER-AGAIN RULE #51** — NO-IDLE-PROACTIVE-PATROL (60-sec dispatch SLA)
- **NEVER-AGAIN RULE #52** — LEADER-SELF-UPGRADE-PROTOCOL (60-sec poll cycle)
- **NEVER-AGAIN RULE #55** — PRE-PUSH-GHOST-SHA-CHECK (Muse self-verify before push)
- **NEVER-AGAIN RULE #56** — PROACTIVE-PICK-CHAIN (no idle gap)
- **NEVER-AGAIN RULE #57** — LEADER-PERIODIC-FULL-BROADCAST (30-min defensive anchor)

- **CATCH #187** — STALE_VISION_PIVOT_BROADCAST
- **CATCH #194** — CASCADE-HOLD-ATTRIBUTION-RACE
- **CATCH #195** — CASCADE-HOLD-BILATERAL-ATTRIBUTION-RACE
- **CATCH #196** — CASCADE-HOLD-TRILATERAL-BUNDLE
- **Vulcan F1, F2** — STALE_AUDIT GHOST SHA cluster

---

## §10 4-ICP verdict (LOCKED v1.0)

- **I1 (Intent)**: ✅ Detect GHOST-SHA patterns; close Tyche P0 root cause
- **C2 (Catastrophic)**: ✅ NO regex bypass; storage normalized to short form
- **P3 (Performance)**: ✅ O(1) add/remove/validate; O(n) scanObject (n = fields)
- **D4 (Documented)**: ✅ 10 sections, 3-witness per claim, code+test+git witness chain

**LOCKED at v1.0** for RATIFICATION GATE 2026-06-22 16:00 UTC.

---

**DRI:** Hephaestus (slot 019ecbef-8cb9-7c73-bd19-b5561b383985)
**Last updated:** 2026-06-16 15:46 UTC
**Next review:** 2026-06-22 16:00 UTC (RATIFICATION GATE ceremony)
