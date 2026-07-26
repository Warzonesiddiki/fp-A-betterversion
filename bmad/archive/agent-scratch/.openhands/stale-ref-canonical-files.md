ATHENA - Stale Reference Audit (CANONICAL FILES, P1 follow-up, 2026-06-15)
Scope: docs/parts/\*.md (canonical Part files only)
Excluded: 00-INDEX.md, PART_081_MASTER_DOCUMENT_INDEX.md, \_archive/ (per §0.7)
Method: combined regex \b(archived1|archived2|...)\b per file (O(N) per file)

=== SUMMARY ===
Canonical Part files in scope: 199
Archived filenames: 202
Canonical files with stale references: 6

=== STALE REFERENCES (actionable) ===

FILE: docs\parts\PART_001_CURRENT_STATE_AUDIT_AND_GAP_ANALYSIS.md
REFS: INDEX
COUNT: 1

FILE: docs\parts\PART_014_FORMULA_ENGINE.md
REFS: INDEX
COUNT: 1

FILE: docs\parts\PART_051_AGENT_COORDINATION.md
REFS: INDEX
COUNT: 1

FILE: docs\parts\Part_120_Master_Index_v2.md
REFS: INDEX
COUNT: 1

FILE: docs\parts\PART_193_DOC_GENERATION.md
REFS: INDEX
COUNT: 1

FILE: docs\parts\Part_200_Agent_Handover.md
REFS: INDEX
COUNT: 1

Total stale references: 6
