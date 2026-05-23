-- FinPlan Pro - Cube Engine SQLite Schema
-- Version: 2.0.0
-- Purpose: Multi-dimensional OLAP data model persistence

-- 1. Cube Cells — Core data storage for CubeEngine
CREATE TABLE IF NOT EXISTS cube_cells (
    id TEXT PRIMARY KEY,          -- cellKey: "{cube}|{sorted dims}|{measure}"
    cube TEXT NOT NULL,
    coords TEXT NOT NULL,          -- JSON of coords object: {"Account":"acc:1001","Time":"2026-Q1"}
    measure TEXT NOT NULL,
    value TEXT NOT NULL,           -- JSON of value: number, string, boolean, or date ISO string
    data_type TEXT NOT NULL CHECK (data_type IN ('input', 'calculated', 'consolidated', 'linked', 'imported')),
    comment TEXT,
    attachment TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_cube_cells_cube ON cube_cells(cube);
CREATE INDEX IF NOT EXISTS idx_cube_cells_measure ON cube_cells(measure);
CREATE INDEX IF NOT EXISTS idx_cube_cells_data_type ON cube_cells(data_type);
CREATE INDEX IF NOT EXISTS idx_cube_cells_created ON cube_cells(created_at);

-- 2. Cube Dimensions — Dimension definitions
CREATE TABLE IF NOT EXISTS cube_dimensions (
    name TEXT PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('system', 'user')),
    hierarchies TEXT NOT NULL,     -- JSON array of HierarchyDefinition
    attributes TEXT NOT NULL,      -- JSON array of AttributeDefinition
    members TEXT NOT NULL,         -- JSON map of memberId -> DimensionMember
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. Cube Definitions — Cube metadata
CREATE TABLE IF NOT EXISTS cube_cubes (
    name TEXT PRIMARY KEY,
    dimensions TEXT NOT NULL,      -- JSON array of dimension names
    measures TEXT NOT NULL,        -- JSON array of MeasureDefinition
    storage TEXT NOT NULL CHECK (storage IN ('sparse', 'dense')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 4. Cube History — Cell change history for audit trail
CREATE TABLE IF NOT EXISTS cube_history (
    id TEXT PRIMARY KEY,
    cell_id TEXT NOT NULL,
    old_value TEXT,                -- JSON of old value (null for new cells)
    new_value TEXT NOT NULL,       -- JSON of new value
    data_type TEXT NOT NULL CHECK (data_type IN ('input', 'calculated', 'consolidated', 'linked', 'imported')),
    reason TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_cube_history_cell ON cube_history(cell_id);
CREATE INDEX IF NOT EXISTS idx_cube_history_timestamp ON cube_history(timestamp);
CREATE INDEX IF NOT EXISTS idx_cube_history_data_type ON cube_history(data_type);

-- 5. Cube Snapshots — Point-in-time snapshots of cube state
CREATE TABLE IF NOT EXISTS cube_snapshots (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    cells TEXT NOT NULL,           -- JSON map of cellId -> value
    cell_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_cube_snapshots_created ON cube_snapshots(created_at);

-- 6. Cube Snapshot Diffs — Differences between snapshots
CREATE TABLE IF NOT EXISTS cube_snapshot_diffs (
    id TEXT PRIMARY KEY,
    snapshot_a_id TEXT NOT NULL,
    snapshot_b_id TEXT NOT NULL,
    diff_data TEXT NOT NULL,       -- JSON of CubeDiff object
    cells_changed INTEGER DEFAULT 0,
    cells_added INTEGER DEFAULT 0,
    cells_removed INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (snapshot_a_id) REFERENCES cube_snapshots(id),
    FOREIGN KEY (snapshot_b_id) REFERENCES cube_snapshots(id)
);

CREATE INDEX IF NOT EXISTS idx_cube_diffs_snapshot_a ON cube_snapshot_diffs(snapshot_a_id);
CREATE INDEX IF NOT EXISTS idx_cube_diffs_snapshot_b ON cube_snapshot_diffs(snapshot_b_id);
