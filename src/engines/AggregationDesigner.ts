// =============================================================================
// AGGREGATION DESIGNER — Pre-aggregate common queries for speed
// Creates materialized aggregation tables for frequently-queried slices
// Pure TypeScript, deterministic, testable, zero external dependencies
// =============================================================================

export interface AggregationDefinition {
  id: string;
  name: string;
  cube: string;
  dimensions: string[];
  measures: string[];
  aggregation: 'sum' | 'avg' | 'count' | 'min' | 'max';
  materialized: boolean;
  createdAt: string;
  updatedAt: string;
  cellCount: number;
}

export interface AggregationCell {
  key: string;
  dimensions: Record<string, string>;
  measure: string;
  value: number;
  count: number;
}

export interface AggregationResult {
  definitionId: string;
  cells: AggregationCell[];
  queryTimeMs: number;
  hitCount: number;
}

// =============================================================================
// AGGREGATION DESIGNER
// =============================================================================

export class AggregationDesigner {
  private definitions = new Map<string, AggregationDefinition>();
  private aggregatedData = new Map<string, Map<string, AggregationCell>>();
  private hitCounts = new Map<string, number>();

  define(
    name: string,
    cube: string,
    dimensions: string[],
    measures: string[],
    aggregation: 'sum' | 'avg' | 'count' | 'min' | 'max' = 'sum'
  ): AggregationDefinition {
    const id = `agg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const def: AggregationDefinition = {
      id,
      name,
      cube,
      dimensions,
      measures,
      aggregation,
      materialized: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      cellCount: 0,
    };
    this.definitions.set(id, def);
    return def;
  }

  getDefinition(id: string): AggregationDefinition | undefined {
    return this.definitions.get(id);
  }

  listDefinitions(): AggregationDefinition[] {
    return Array.from(this.definitions.values());
  }

  deleteDefinition(id: string): boolean {
    this.aggregatedData.delete(id);
    this.hitCounts.delete(id);
    return this.definitions.delete(id);
  }

  materialize(definitionId: string, cells: Map<string, unknown>): AggregationDefinition | null {
    const def = this.definitions.get(definitionId);
    if (!def) return null;

    const aggregated = new Map<string, AggregationCell>();

    for (const [key, value] of cells) {
      const coords = this.parseCellKey(key);
      const dimKey: Record<string, string> = {};
      let matchesCube = false;

      for (const [dim, val] of Object.entries(coords)) {
        if (def.dimensions.includes(dim)) {
          dimKey[dim] = val;
        }
        if (dim === 'cube' && val === def.cube) matchesCube = true;
      }

      if (!matchesCube) continue;

      const aggKey = Object.entries(dimKey)
        .sort()
        .map(([d, v]) => `${d}=${v}`)
        .join('|');
      const measureKey = coords.measure ?? '';
      if (!def.measures.includes(measureKey)) continue;

      const fullKey = `${aggKey}|${measureKey}`;
      const numValue = typeof value === 'number' ? value : 0;

      if (!aggregated.has(fullKey)) {
        aggregated.set(fullKey, {
          key: fullKey,
          dimensions: dimKey,
          measure: measureKey,
          value: 0,
          count: 0,
        });
      }

      const cell = aggregated.get(fullKey)!;
      switch (def.aggregation) {
        case 'sum':
          cell.value += numValue;
          break;
        case 'avg':
          cell.value += numValue;
          cell.count++;
          break;
        case 'count':
          cell.count++;
          cell.value = cell.count;
          break;
        case 'min':
          cell.value = Math.min(cell.value, numValue);
          break;
        case 'max':
          cell.value = Math.max(cell.value, numValue);
          break;
      }
      if (def.aggregation === 'avg' && cell.count > 0) {
        cell.value = cell.value / cell.count;
      }
    }

    this.aggregatedData.set(definitionId, aggregated);
    def.materialized = true;
    def.cellCount = aggregated.size;
    def.updatedAt = new Date().toISOString();
    return def;
  }

  query(definitionId: string, filters?: Record<string, string>): AggregationResult | null {
    const def = this.definitions.get(definitionId);
    if (!def) return null;

    const data = this.aggregatedData.get(definitionId);
    if (!data) return { definitionId, cells: [], queryTimeMs: 0, hitCount: 0 };

    const start = performance.now();
    let cells = Array.from(data.values());

    if (filters) {
      cells = cells.filter((cell) =>
        Object.entries(filters).every(([dim, val]) => cell.dimensions[dim] === val)
      );
    }

    const hitCount = (this.hitCounts.get(definitionId) ?? 0) + 1;
    this.hitCounts.set(definitionId, hitCount);

    return {
      definitionId,
      cells,
      queryTimeMs: performance.now() - start,
      hitCount,
    };
  }

  refresh(definitionId: string, cells: Map<string, unknown>): boolean {
    const def = this.definitions.get(definitionId);
    if (!def) return false;
    this.materialize(definitionId, cells);
    return true;
  }

  getStats(): { totalDefinitions: number; materializedCount: number; totalCells: number } {
    const defs = Array.from(this.definitions.values());
    return {
      totalDefinitions: defs.length,
      materializedCount: defs.filter((d) => d.materialized).length,
      totalCells: defs.reduce((sum, d) => sum + d.cellCount, 0),
    };
  }

  private parseCellKey(key: string): Record<string, string> {
    const coords: Record<string, string> = {};
    const parts = key.split('|');
    for (const part of parts) {
      const eqIdx = part.indexOf('=');
      if (eqIdx > 0) coords[part.slice(0, eqIdx)] = part.slice(eqIdx + 1);
    }
    return coords;
  }
}
