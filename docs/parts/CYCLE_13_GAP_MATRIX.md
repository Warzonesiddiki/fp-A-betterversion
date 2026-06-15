# Cycle-13 Gap Matrix — Per Part Status

**Generated:** 2026-06-15
**Source:** 00-INDEX.md (canonical) + directory scan of `docs/parts/`

## Legend
- **✅** — index-titled file exists, content correct
- **🟢** — deep UPPERCASE file covers the same topic (different scheme)
- **⚠️** — wrong topic (mine or UPPERCASE doesn't match index)
- **🟡** — partial / draft only (mine, no UPPERCASE alternative)

## Per-Part status (summary, 200 rows grouped)

### Foundation (1-25) — 25 parts
- ✅ Aligned: 1, 2, 4, 13, 14, 25 (6 parts; mostly mine)
- 🟢 Deep UPPERCASE: 3, 5, 6, 7, 8, 9, 10, 11, 12, 15, 16, 17, 18, 19, 20 (15 parts)
- ⚠️ Wrong: 21, 22, 23, 24 (4 parts — UPPERCASE has INFRA not the index's topic)

### Application (26-50) — 25 parts
- 🟡 Mine only: 44 (1)
- ⚠️ Wrong: 26, 27, 28, 29, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 45, 46, 47, 48, 49, 50 (23 parts)
- 🟢 Deep: 30 (1 part)

### Coordination (51-75) — 25 parts
- 🟡 Mine only: 51-75 (25 parts; all skeleton)
- ⚠️ Wrong: ~15 (UPPERCASE has infrastructure, not coordination)

### Operational (76-100) — 25 parts
- 🟡 Mine only: 76-87, 110+ most sectors (15 parts)
- ✅ Aligned: 88-100 (sectors 13 of 13)

### Advanced (101-125) — 25 parts
- ✅ Aligned: 101-104, 108, 110-113, 115-118, 122, 123, 125 (most)
- ⚠️ Wrong: 109, 124 (UPPERCASE has different topic)
- 🟢 Deep: 125 (in my Part 125, but topic wrong per index)

### UX micro (126-150) — 25 parts — **MOSTLY WRONG**
- ✅ Aligned: 132, 138, 144, 145, 146 (5 parts)
- ⚠️ Wrong: 125, 126, 127, 128, 129, 130, 131, 133, 134, 135, 136, 137, 139, 140, 141, 142, 143, 147, 148, 149, 150 (~20 parts — I used my own topic scheme)

### Edge cases + handover (151-200) — 50 parts
- ✅ Aligned: 152, 153, 154, 155, 156, 157, 158, 160, 161, 162, 163, 168, 169, 175, 176, 178, 179, 180, 188, 189, 190, 191, 193, 200 (~24 parts)
- ⚠️ Wrong: 195, 196, 197 (UPPERCASE has different topics)
- 🟢 BOTH: 191, 193, 198, 199 (both schemes have a file, duplicate)

## Summary counts

| Category | Count | % |
|---|---:|---:|
| ✅ Aligned | ~75 | 37% |
| 🟢 Deep UPPERCASE | ~17 | 9% |
| ⚠️ Wrong topic | ~75 | 37% |
| 🟡 Mine only (skeleton) | ~28 | 14% |
| Duplicate (both) | ~5 | 3% |
| Truly missing | 0 | 0% |

## The 75 wrong-topic Parts — concentrated in:

- **Parts 21-50** (Application): UPPERCASE covers INFRA not application (~25 parts)
- **Parts 125-150** (UX micro): I shifted topics (~20 parts)
- **Parts 195-197**: UPPERCASE covers marketing/sales not deprecation/license/DR (3 parts)
- **Parts 26-49**: scattered UPPERCASE misalignment (~25 parts)

## Recommended fix path

### Option A — Rename (~30 min)
For each wrong-topic file, rename to match index title. Keeps content, fixes naming. ~75 file renames.

### Option B — Rewrite ~75 files (~2-3 hours)
For each wrong-topic file, write new content matching the index's intended title. Most expensive.

### Option C — Update the index
If my topics are actually better, change the index to match. Requires Strategos sign-off.

### Option D — Accept current state
Document the dual-scheme and move on. Use PART_NNN_*.md for depth, Part_NN_*.md for breadth.

## My recommendation: **A (rename + accept skeleton depth)**

The 75 wrong-topic files are mostly DRAFT skeletons. Renaming them to match the index is cheap. The depth can be filled in later by whoever owns the topic.

## Decision needed

1. A (rename) — quick
2. B (rewrite) — slow
3. D (accept + document) — instant
4. Stop and hand over
