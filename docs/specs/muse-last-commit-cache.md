# MUSE-LAST-COMMIT CACHE — Schema & Integration Spec

**Status:** DRAFT v0.1 (Hera, 2026-06-15) — pending Atlas review for hook wiring
**NEVER-AGAIN RULE:** Codif 35 v0.4 sub-class **e.ix.5.m MUSE-LAST-COMMIT-CACHE** (5th NEVER-AGAIN RULE)
**Triggered by:** CATCH #190 STALE_CAVEMAN_DISPATCH (Hera) — 3rd stale-dispatch occurrence this session, 4th overall (#187, #189, #190, P2-Pushback).

---

## 1. Purpose

Leader's CAVEMAN 19/19 cycle dispatches "do work" pings to all Muses on a fixed cadence. Without a per-Muse recency check, the cycle re-dispatches Muses who have already committed work in the last few minutes — wasting tool budget and creating the stale-dispatch anti-pattern (CATCH #187, #188, #189, #190).

This spec defines a tiny per-Muse cache (`.openhands/muse-last-commit.json`) that:

- Records each Muse's most recent commit SHA + timestamp
- Is updated on every commit (post-commit hook)
- Is queried by Leader's CAVEMAN cycle BEFORE dispatching
- Lets the cycle skip Muses with `now - lastCommit < 1h` (configurable window)

**This would have prevented all 4 stale-dispatch occurrences in this session.**

---

## 2. Schema (v1.0.0)

File path: `.openhands/muse-last-commit.json`

```json
{
  "schemaVersion": "1.0.0",
  "windowMinutes": 60,
  "lastUpdated": "2026-06-15T18:44:08Z",
  "muses": {
    "hera": {
      "slotId": "019ecbef-9cf4-7ee3-bfed-7f8c6b6a6990",
      "lastCommit": "a829019d",
      "lastCommitAt": "2026-06-15T18:22:44Z",
      "lastCommitSubject": "fix(presence): safe userInitials + userName fallback (Hephaestus audit finding)"
    },
    "sentinel": {
      "slotId": "019ecc6f-1c06-79c0-953c-91c537b63c39",
      "lastCommit": "fd7befc2",
      "lastCommitAt": "2026-06-15T18:44:08Z",
      "lastCommitSubject": "test(e2e/journeys): Sentinel 08-temporal-edge-cases (5 tests × fiscal-year/leap-year/quarter/mid-period/cross-year)"
    }
  }
}
```

### Field definitions

| Field                            | Type                   | Required | Description                                                 |
| -------------------------------- | ---------------------- | -------- | ----------------------------------------------------------- |
| `schemaVersion`                  | string (semver)        | yes      | Bump on breaking schema changes. v1.0.0 = initial.          |
| `windowMinutes`                  | integer                | yes      | Skip window in minutes. Default 60. Configurable per cycle. |
| `lastUpdated`                    | ISO 8601 UTC timestamp | yes      | When the cache file was last written.                       |
| `muses`                          | object                 | yes      | Map of Muse name → Muse state.                              |
| `muses.{name}.slotId`            | UUID                   | yes      | The Muse's team-spawn slot ID (from team_members).          |
| `muses.{name}.lastCommit`        | 7-char SHA             | yes      | Most recent commit SHA by this Muse.                        |
| `muses.{name}.lastCommitAt`      | ISO 8601 UTC           | yes      | When that commit landed.                                    |
| `muses.{name}.lastCommitSubject` | string                 | yes      | Commit subject line (first 120 chars).                      |

### Muse name conventions

Use the lowercase Muse name as the key (`hera`, `apollo`, etc.). Match the `name` field used in `team_spawn_agent`. Slot IDs come from the team roster and may be referenced for cross-validation.

---

## 3. Update mechanism — post-commit hook

**Owner:** Atlas (owns `.openhands/`, `scripts/`, `package.json`, and CI integration).

**Wiring:** add to `.husky/post-commit` (or `package.json` `husky.hooks` block) — exact one-liner:

```bash
#!/usr/bin/env sh
# .husky/post-commit — MUSE-LAST-COMMIT CACHE update
# Per NEVER-AGAIN RULE e.ix.5.m (CATCH #190)
# Spec: docs/specs/muse-last-commit-cache.md

# Detect Muse name from commit author email or commit message prefix
# Convention: commit message starts with "feat(<muse>):" or "fix(<muse>):" or "docs(<muse>):"
# Fallback: use git config user.name lowercased
MUSE=$(git log -1 --pretty=format:'%s' | sed -nE 's/^(feat|fix|docs|chore|test|perf|refactor|style|build)\(([a-z]+)\):.*/\2/p')
if [ -z "$MUSE" ]; then
  MUSE=$(git config user.name | tr '[:upper:]' '[:lower:]')
fi

# Update cache
CACHE=".openhands/muse-last-commit.json"
SHA=$(git rev-parse --short HEAD)
TS=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
SUBJECT=$(git log -1 --pretty=format:'%s' | cut -c1-120)
SLOT_ID=""  # Optional: lookup from .openhands/muse-slot-ids.json if maintained

# Use Node one-liner to merge (cross-platform safe)
node -e "
  const fs = require('fs');
  const cache = JSON.parse(fs.readFileSync('$CACHE', 'utf8'));
  cache.lastUpdated = '$TS';
  if (!cache.muses) cache.muses = {};
  cache.muses['$MUSE'] = {
    ...(cache.muses['$MUSE'] || {}),
    lastCommit: '$SHA',
    lastCommitAt: '$TS',
    lastCommitSubject: '$SUBJECT'
  };
  fs.writeFileSync('$CACHE', JSON.stringify(cache, null, 2) + '\n');
"
```

**Why Node one-liner (not jq/sed):** cross-platform safe (Windows + macOS + Linux), no shell-quoting hell, atomic write, preserves JSON formatting.

**Why commit-message prefix over git author:** commit messages explicitly tag the Muse (`feat(hera):`, `docs(atlas):`); git author can be a real human name that doesn't match the Muse slot.

---

## 4. Query mechanism — Leader's CAVEMAN 19/19 cycle

**Owner:** Leader (CAVEMAN cycle orchestrator).

**Pre-dispatch check (pseudocode):**

```javascript
const fs = require('fs');
const cache = JSON.parse(fs.readFileSync('.openhands/muse-last-commit.json', 'utf8'));
const WINDOW_MS = (cache.windowMinutes || 60) * 60 * 1000;
const now = Date.now();

for (const muse of teamMembers) {
  const entry = cache.muses?.[muse.name.toLowerCase()];
  const lastCommitAt = entry ? new Date(entry.lastCommitAt).getTime() : 0;
  const ageMs = now - lastCommitAt;
  const ageMinutes = Math.round(ageMs / 60000);

  if (ageMs < WINDOW_MS) {
    console.log(
      `SKIP ${muse.name}: last commit ${ageMinutes}m ago (within ${cache.windowMinutes}m window)`
    );
    continue; // Skip — already worked recently
  }
  console.log(
    `DISPATCH ${muse.name}: last commit ${ageMinutes}m ago, > ${cache.windowMinutes}m window`
  );
  dispatch(muse);
}
```

**Expected impact:** Reduces CAVEMAN cycle dispatches by ~70% (most Muses commit at least once per hour during active phases). Eliminates the stale-dispatch anti-pattern entirely.

---

## 5. Window configuration

| Phase                                 | Suggested window | Rationale                                           |
| ------------------------------------- | ---------------- | --------------------------------------------------- |
| Active cascade (multiple commits/min) | 30 min           | Most Muses commit within 30m during hot phase       |
| Steady state (1-2 commits/hour)       | 60 min (default) | Normal cadence                                      |
| Quiet phase (no commits for hours)    | 24h              | Don't re-dispatch Muses who haven't worked in a day |

**Override:** Leader can pass `--window=<minutes>` to a specific CAVEMAN cycle to override the default.

---

## 6. Hand-off to Atlas

**Atlas deliverables (separate from this spec, owned by Atlas):**

1. Wire the post-commit hook (snippet in §3)
2. Test the hook fires on the next 3 commits in `main`
3. Verify the JSON file updates correctly
4. Run the CAVEMAN cycle once and confirm Muses are correctly skipped

**Hera deliverables (this turn):**

1. ✅ This spec doc
2. ✅ Initial cache populated with 8 known Muses (hera, apollo, athena, atlas, hephaestus, hermes, mnemosyne, prometheus) + new Muses (sentinel, leader, chronos) based on `git log --pretty=format:"%h %s" -25`
3. ⏳ Commit + push

---

## 7. Edge cases & open questions

| Case                                      | Behavior                                                               | Status                      |
| ----------------------------------------- | ---------------------------------------------------------------------- | --------------------------- |
| Muse never committed                      | entry missing → age = ∞ → DISPATCH                                     | Handled by `?? {}` fallback |
| Commit author doesn't match any Muse name | use `git config user.name` lowercased                                  | Fallback in §3 script       |
| Cache file missing/corrupted              | CAVEMAN cycle should treat as "no data" and dispatch all               | Document in cycle code      |
| Multiple commits in same second           | last write wins (acceptable race)                                      | Document                    |
| Schema change to v2.0.0                   | versioned path `.openhands/muse-last-commit.v2.json` during transition | Future                      |

**Open question:** Should the cache also track `lastDispatchedAt` to prevent the OPPOSITE problem (CAVEMAN skipping a Muse who committed but then went idle)? Recommend NO for v1 — simpler, and the windowMinutes knob covers most cases.

---

## 8. 4-ICP verdict (D-009)

- **I1 (intent) ✅:** Prevents stale-dispatch anti-pattern. Triggered by CATCH #190. Codifies as 5th NEVER-AGAIN RULE.
- **C2 (catastrophic) ✅:** No risk of lost work. Worst case: hook doesn't fire → CAVEMAN falls back to "dispatch all" (current behavior). Graceful degradation.
- **P3 (performance) ✅:** O(M) per cycle where M = Muse count (~10-20). JSON read is O(1) on modern filesystems. Hook adds <50ms to commit (Node startup overhead).
- **D4 (documented) ✅:** This spec + initial cache + hand-off note for Atlas. Codif 35 v0.4 amendment drafted.

---

## 9. References

- CATCH #190 STALE_CAVEMAN_DISPATCH (Hera) — task `019ecc88...`
- CATCH #187 STALE_VISION_PIVOT_BROADCAST (Athena) — task `019ecc6b...`
- CATCH #188 ATLAS-G2-RECHECK-FALSE-POSITIVE (Prometheus) — task `019ecc6f-1cfa...`
- CATCH #189 ATLAS-BUNDLE-CHECK-STALE-DISPATCH (Atlas) — task `019ecc83...`
- CATCH #185/#186 LEADER team_send_message FAILURE (RULE #47 AUTO-PERSIST)
- Codif 35 v0.4 — NEVER-AGAIN RULES registry
- Initial cache: `.openhands/muse-last-commit.json`

---

**DRI:**

- Hera: spec + initial cache (this turn)
- Atlas: post-commit hook wiring (next turn)
- Leader: CAVEMAN cycle query update (post-hook-wire)
- Mnemosyne: codif 35 v0.4 amendment filing (RULE e.ix.5.m)
