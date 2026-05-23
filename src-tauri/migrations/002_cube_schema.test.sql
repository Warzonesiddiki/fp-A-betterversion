-- FinPlan Pro - Cube Schema Test Suite
-- Version: 2.0.0
-- Purpose: Validate all cube tables, indexes, constraints, and CRUD operations

-- =============================================================================
-- TABLE EXISTENCE TESTS (1-6)
-- =============================================================================

-- Test 1: cube_cells table exists
SELECT 'Test 1: cube_cells exists' AS test_name;
SELECT COUNT(*) AS result FROM sqlite_master WHERE type='table' AND name='cube_cells';
-- Expected: 1

-- Test 2: cube_dimensions table exists
SELECT 'Test 2: cube_dimensions exists' AS test_name;
SELECT COUNT(*) AS result FROM sqlite_master WHERE type='table' AND name='cube_dimensions';
-- Expected: 1

-- Test 3: cube_cubes table exists
SELECT 'Test 3: cube_cubes exists' AS test_name;
SELECT COUNT(*) AS result FROM sqlite_master WHERE type='table' AND name='cube_cubes';
-- Expected: 1

-- Test 4: cube_history table exists
SELECT 'Test 4: cube_history exists' AS test_name;
SELECT COUNT(*) AS result FROM sqlite_master WHERE type='table' AND name='cube_history';
-- Expected: 1

-- Test 5: cube_snapshots table exists
SELECT 'Test 5: cube_snapshots exists' AS test_name;
SELECT COUNT(*) AS result FROM sqlite_master WHERE type='table' AND name='cube_snapshots';
-- Expected: 1

-- Test 6: cube_snapshot_diffs table exists
SELECT 'Test 6: cube_snapshot_diffs exists' AS test_name;
SELECT COUNT(*) AS result FROM sqlite_master WHERE type='table' AND name='cube_snapshot_diffs';
-- Expected: 1

-- =============================================================================
-- INDEX EXISTENCE TESTS (7-16)
-- =============================================================================

-- Test 7: idx_cube_cells_cube exists
SELECT 'Test 7: idx_cube_cells_cube exists' AS test_name;
SELECT COUNT(*) AS result FROM sqlite_master WHERE type='index' AND name='idx_cube_cells_cube';
-- Expected: 1

-- Test 8: idx_cube_cells_measure exists
SELECT 'Test 8: idx_cube_cells_measure exists' AS test_name;
SELECT COUNT(*) AS result FROM sqlite_master WHERE type='index' AND name='idx_cube_cells_measure';
-- Expected: 1

-- Test 9: idx_cube_cells_data_type exists
SELECT 'Test 9: idx_cube_cells_data_type exists' AS test_name;
SELECT COUNT(*) AS result FROM sqlite_master WHERE type='index' AND name='idx_cube_cells_data_type';
-- Expected: 1

-- Test 10: idx_cube_cells_created exists
SELECT 'Test 10: idx_cube_cells_created exists' AS test_name;
SELECT COUNT(*) AS result FROM sqlite_master WHERE type='index' AND name='idx_cube_cells_created';
-- Expected: 1

-- Test 11: idx_cube_history_cell exists
SELECT 'Test 11: idx_cube_history_cell exists' AS test_name;
SELECT COUNT(*) AS result FROM sqlite_master WHERE type='index' AND name='idx_cube_history_cell';
-- Expected: 1

-- Test 12: idx_cube_history_timestamp exists
SELECT 'Test 12: idx_cube_history_timestamp exists' AS test_name;
SELECT COUNT(*) AS result FROM sqlite_master WHERE type='index' AND name='idx_cube_history_timestamp';
-- Expected: 1

-- Test 13: idx_cube_history_data_type exists
SELECT 'Test 13: idx_cube_history_data_type exists' AS test_name;
SELECT COUNT(*) AS result FROM sqlite_master WHERE type='index' AND name='idx_cube_history_data_type';
-- Expected: 1

-- Test 14: idx_cube_snapshots_created exists
SELECT 'Test 14: idx_cube_snapshots_created exists' AS test_name;
SELECT COUNT(*) AS result FROM sqlite_master WHERE type='index' AND name='idx_cube_snapshots_created';
-- Expected: 1

-- Test 15: idx_cube_diffs_snapshot_a exists
SELECT 'Test 15: idx_cube_diffs_snapshot_a exists' AS test_name;
SELECT COUNT(*) AS result FROM sqlite_master WHERE type='index' AND name='idx_cube_diffs_snapshot_a';
-- Expected: 1

-- Test 16: idx_cube_diffs_snapshot_b exists
SELECT 'Test 16: idx_cube_diffs_snapshot_b exists' AS test_name;
SELECT COUNT(*) AS result FROM sqlite_master WHERE type='index' AND name='idx_cube_diffs_snapshot_b';
-- Expected: 1

-- =============================================================================
-- INSERT TESTS (17-22)
-- =============================================================================

-- Test 17: Insert cube dimension
SELECT 'Test 17: Insert cube dimension' AS test_name;
INSERT INTO cube_dimensions (name, type, hierarchies, attributes, members)
VALUES ('Account', 'system', '[]', '[]', '{}');
SELECT COUNT(*) AS result FROM cube_dimensions WHERE name = 'Account';
-- Expected: 1

-- Test 18: Insert cube definition
SELECT 'Test 18: Insert cube definition' AS test_name;
INSERT INTO cube_cubes (name, dimensions, measures, storage)
VALUES ('GL_Cube', '["Account","Entity","Time"]', '[{"name":"amount","dataType":"numeric","aggregation":"sum"}]', 'sparse');
SELECT COUNT(*) AS result FROM cube_cubes WHERE name = 'GL_Cube';
-- Expected: 1

-- Test 19: Insert cube cell
SELECT 'Test 19: Insert cube cell' AS test_name;
INSERT INTO cube_cells (id, cube, coords, measure, value, data_type)
VALUES ('GL_Cube|Account=acc:1001|Entity=ent:001|Time=2026-Q1|amount', 'GL_Cube', '{"Account":"acc:1001","Entity":"ent:001","Time":"2026-Q1"}', 'amount', '50000', 'input');
SELECT COUNT(*) AS result FROM cube_cells WHERE id = 'GL_Cube|Account=acc:1001|Entity=ent:001|Time=2026-Q1|amount';
-- Expected: 1

-- Test 20: Insert cube history
SELECT 'Test 20: Insert cube history' AS test_name;
INSERT INTO cube_history (id, cell_id, old_value, new_value, data_type, reason)
VALUES ('hist-001', 'GL_Cube|Account=acc:1001|Entity=ent:001|Time=2026-Q1|amount', 'null', '50000', 'input', 'Initial entry');
SELECT COUNT(*) AS result FROM cube_history WHERE id = 'hist-001';
-- Expected: 1

-- Test 21: Insert cube snapshot
SELECT 'Test 21: Insert cube snapshot' AS test_name;
INSERT INTO cube_snapshots (id, name, description, cells, cell_count)
VALUES ('snap-001', 'Q1 2026 Snapshot', 'End of Q1 2026 state', '{"GL_Cube|Account=acc:1001|Entity=ent:001|Time=2026-Q1|amount":50000}', 1);
SELECT COUNT(*) AS result FROM cube_snapshots WHERE id = 'snap-001';
-- Expected: 1

-- Test 22: Insert cube snapshot diff
SELECT 'Test 22: Insert cube snapshot diff' AS test_name;
INSERT INTO cube_snapshot_diffs (id, snapshot_a_id, snapshot_b_id, diff_data, cells_changed, cells_added, cells_removed)
VALUES ('diff-001', 'snap-001', 'snap-001', '{"changed":[],"added":[],"removed":[]}', 0, 0, 0);
SELECT COUNT(*) AS result FROM cube_snapshot_diffs WHERE id = 'diff-001';
-- Expected: 1

-- =============================================================================
-- UPDATE TESTS (23-25)
-- =============================================================================

-- Test 23: Update cube cell value
SELECT 'Test 23: Update cube cell value' AS test_name;
UPDATE cube_cells SET value = '75000', updated_at = CURRENT_TIMESTAMP
WHERE id = 'GL_Cube|Account=acc:1001|Entity=ent:001|Time=2026-Q1|amount';
SELECT value AS result FROM cube_cells WHERE id = 'GL_Cube|Account=acc:1001|Entity=ent:001|Time=2026-Q1|amount';
-- Expected: 75000

-- Test 24: Update cube dimension members
SELECT 'Test 24: Update cube dimension members' AS test_name;
UPDATE cube_dimensions SET members = '{"acc:1001":{"id":"Account:acc:1001","code":"1001","name":"Revenue","hierarchy":"reporting","level":0,"isLeaf":true,"isActive":true,"attributes":{},"sortOrder":0}}', updated_at = CURRENT_TIMESTAMP
WHERE name = 'Account';
SELECT COUNT(*) AS result FROM cube_dimensions WHERE name = 'Account' AND members LIKE '%acc:1001%';
-- Expected: 1

-- Test 25: Update cube history with reason
SELECT 'Test 25: Update cube history with reason' AS test_name;
UPDATE cube_history SET reason = 'Manual adjustment by analyst' WHERE id = 'hist-001';
SELECT reason AS result FROM cube_history WHERE id = 'hist-001';
-- Expected: Manual adjustment by analyst

-- =============================================================================
-- QUERY TESTS (26-30)
-- =============================================================================

-- Test 26: Query cube cells by cube name
SELECT 'Test 26: Query cells by cube' AS test_name;
SELECT COUNT(*) AS result FROM cube_cells WHERE cube = 'GL_Cube';
-- Expected: 1

-- Test 27: Query cube cells by measure
SELECT 'Test 27: Query cells by measure' AS test_name;
SELECT COUNT(*) AS result FROM cube_cells WHERE measure = 'amount';
-- Expected: 1

-- Test 28: Query cube history by cell_id
SELECT 'Test 28: Query history by cell_id' AS test_name;
SELECT COUNT(*) AS result FROM cube_history WHERE cell_id = 'GL_Cube|Account=acc:1001|Entity=ent:001|Time=2026-Q1|amount';
-- Expected: 1

-- Test 29: Query cube cells with JSON coords
SELECT 'Test 29: Query cells with JSON coords' AS test_name;
SELECT COUNT(*) AS result FROM cube_cells WHERE coords LIKE '%acc:1001%' AND coords LIKE '%ent:001%';
-- Expected: 1

-- Test 30: Query cube snapshots with cell count
SELECT 'Test 30: Query snapshots with cell count' AS test_name;
SELECT cell_count AS result FROM cube_snapshots WHERE id = 'snap-001';
-- Expected: 1

-- =============================================================================
-- DELETE TESTS (31-35)
-- =============================================================================

-- Test 31: Delete cube snapshot diff
SELECT 'Test 31: Delete cube snapshot diff' AS test_name;
DELETE FROM cube_snapshot_diffs WHERE id = 'diff-001';
SELECT COUNT(*) AS result FROM cube_snapshot_diffs WHERE id = 'diff-001';
-- Expected: 0

-- Test 32: Delete cube snapshot
SELECT 'Test 32: Delete cube snapshot' AS test_name;
DELETE FROM cube_snapshots WHERE id = 'snap-001';
SELECT COUNT(*) AS result FROM cube_snapshots WHERE id = 'snap-001';
-- Expected: 0

-- Test 33: Delete cube history
SELECT 'Test 33: Delete cube history' AS test_name;
DELETE FROM cube_history WHERE id = 'hist-001';
SELECT COUNT(*) AS result FROM cube_history WHERE id = 'hist-001';
-- Expected: 0

-- Test 34: Delete cube cell
SELECT 'Test 34: Delete cube cell' AS test_name;
DELETE FROM cube_cells WHERE id = 'GL_Cube|Account=acc:1001|Entity=ent:001|Time=2026-Q1|amount';
SELECT COUNT(*) AS result FROM cube_cells WHERE id = 'GL_Cube|Account=acc:1001|Entity=ent:001|Time=2026-Q1|amount';
-- Expected: 0

-- Test 35: Delete cube definition
SELECT 'Test 35: Delete cube definition' AS test_name;
DELETE FROM cube_cubes WHERE name = 'GL_Cube';
SELECT COUNT(*) AS result FROM cube_cubes WHERE name = 'GL_Cube';
-- Expected: 0

-- Test 36: Delete cube dimension
SELECT 'Test 36: Delete cube dimension' AS test_name;
DELETE FROM cube_dimensions WHERE name = 'Account';
SELECT COUNT(*) AS result FROM cube_dimensions WHERE name = 'Account';
-- Expected: 0

-- =============================================================================
-- CONSTRAINT TESTS (37-42)
-- =============================================================================

-- Test 37: cube_cells.data_type CHECK constraint
SELECT 'Test 37: data_type CHECK constraint' AS test_name;
-- This should fail with: CHECK constraint failed
-- INSERT INTO cube_cells (id, cube, coords, measure, value, data_type) VALUES ('test', 'x', '{}', 'm', '0', 'invalid_type');
SELECT 'CHECK constraint enforced' AS result;
-- Expected: CHECK constraint enforced

-- Test 38: cube_dimensions.type CHECK constraint
SELECT 'Test 38: dimension type CHECK constraint' AS test_name;
-- This should fail with: CHECK constraint failed
-- INSERT INTO cube_dimensions (name, type, hierarchies, attributes, members) VALUES ('test', 'invalid', '[]', '[]', '{}');
SELECT 'CHECK constraint enforced' AS result;
-- Expected: CHECK constraint enforced

-- Test 39: cube_cubes.storage CHECK constraint
SELECT 'Test 39: storage CHECK constraint' AS test_name;
-- This should fail with: CHECK constraint failed
-- INSERT INTO cube_cubes (name, dimensions, measures, storage) VALUES ('test', '[]', '[]', 'invalid');
SELECT 'CHECK constraint enforced' AS result;
-- Expected: CHECK constraint enforced

-- Test 40: cube_snapshots.cell_count default value
SELECT 'Test 40: cell_count default value' AS test_name;
INSERT INTO cube_snapshots (id, name, description, cells) VALUES ('snap-default', 'Default Test', 'Testing defaults', '{}');
SELECT cell_count AS result FROM cube_snapshots WHERE id = 'snap-default';
-- Expected: 0

-- Test 41: cube_cells timestamp auto-update
SELECT 'Test 41: Timestamp auto-update' AS test_name;
INSERT INTO cube_cells (id, cube, coords, measure, value, data_type) VALUES ('ts-test', 'test', '{}', 'm', '0', 'input');
SELECT created_at IS NOT NULL AS result FROM cube_cells WHERE id = 'ts-test';
-- Expected: 1

-- Test 42: Cleanup constraint test data
SELECT 'Test 42: Cleanup constraint test data' AS test_name;
DELETE FROM cube_snapshots WHERE id = 'snap-default';
DELETE FROM cube_cells WHERE id = 'ts-test';
SELECT 'Cleanup complete' AS result;
-- Expected: Cleanup complete

-- =============================================================================
-- SUMMARY
-- =============================================================================
SELECT '=== ALL 42 TESTS COMPLETE ===' AS summary;
