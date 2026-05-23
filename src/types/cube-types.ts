// =============================================================================
// CUBE ENGINE TYPES — Multi-dimensional OLAP data model
// =============================================================================

export type DimensionType = 'system' | 'user';
export type MeasureDataType = 'numeric' | 'text' | 'date' | 'boolean';
export type MeasureAggregation = 'sum' | 'avg' | 'count' | 'min' | 'max' | 'none';
export type CellDataType = 'input' | 'calculated' | 'consolidated' | 'linked' | 'imported';
export type CubeStorageMode = 'sparse' | 'dense';

// --- Dimension System ---

export interface DimensionDefinition {
  name: string;
  type: DimensionType;
  hierarchies: HierarchyDefinition[];
  attributes: AttributeDefinition[];
  members: Map<string, DimensionMember>;
}

export interface HierarchyDefinition {
  name: string;
  levels: string[];
  effectiveDating?: boolean;
}

export interface AttributeDefinition {
  name: string;
  dataType: 'text' | 'number' | 'boolean' | 'date';
  defaultValue?: string | number | boolean | null;
}

export interface DimensionMember {
  id: string;
  code: string;
  name: string;
  parentId?: string;
  hierarchy: string;
  level: number;
  isLeaf: boolean;
  isActive: boolean;
  attributes: Record<string, string | number | boolean>;
  formula?: string;
  effectiveStart?: string;
  effectiveEnd?: string;
  sortOrder?: number;
}

// --- Cube System ---

export interface CubeDefinition {
  name: string;
  dimensions: string[];
  measures: MeasureDefinition[];
  storage: CubeStorageMode;
}

export interface MeasureDefinition {
  name: string;
  dataType: MeasureDataType;
  precision?: number;
  aggregation: MeasureAggregation;
  currency?: boolean;
}

// --- Cell Operations ---

export interface CubeCell {
  coords: Record<string, string>;
  measure: string;
  value: number | string | Date | boolean;
  dataType: CellDataType;
  comment?: string;
  attachment?: string;
}

export interface CellAddress {
  cube: string;
  coords: Record<string, string>;
  measure: string;
}

export interface CellHistoryEntry {
  id: string;
  cellId: string;
  oldValue: number | string | Date | boolean | null;
  newValue: number | string | Date | boolean;
  dataType: CellDataType;
  reason?: string;
  timestamp: string;
}

// --- Query System ---

export interface CubeQuery {
  cube: string;
  rows: string[];
  columns: string[];
  filters: QueryFilter[];
  measures: string[];
  aggregation?: MeasureAggregation;
  includeSubtotals?: boolean;
  includeGrandTotal?: boolean;
}

export interface QueryFilter {
  dimension: string;
  memberIds: string[];
  includeChildren?: boolean;
}

export interface CubeResult {
  headers: { dimension: string; members: string[] }[];
  rows: { label: string; values: (number | string | null)[]; isTotal: boolean }[];
  grandTotal?: (number | string | null)[];
}

// --- Snapshots ---

export interface Snapshot {
  id: string;
  name: string;
  createdAt: string;
  description?: string;
}

export interface SnapshotCell {
  snapshotId: string;
  cellId: string;
  value: number | string | Date | boolean | null;
  dataType: CellDataType | null;
}

export interface CubeDiff {
  changed: { address: CellAddress; oldValue: unknown; newValue: unknown }[];
  added: CellAddress[];
  removed: CellAddress[];
  summary: {
    cellsChanged: number;
    cellsAdded: number;
    cellsRemoved: number;
  };
}

// --- Engine Interface ---

export interface CubeEngineState {
  dimensions: Map<string, DimensionDefinition>;
  cubes: Map<string, CubeDefinition>;
  cells: Map<string, CubeCell>;
  snapshots: Snapshot[];
  isInitialized: boolean;
}
