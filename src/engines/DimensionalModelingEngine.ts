/**
 * Dimensional Modeling Engine — Slice and dice financial data by dimensions
 */

export interface Dimension {
  id: string;
  name: string;
  type: 'time' | 'entity' | 'department' | 'account' | 'scenario' | 'product' | 'region';
  hierarchies: Hierarchy[];
}

export interface Hierarchy {
  id: string;
  name: string;
  levels: HierarchyLevel[];
}

export interface HierarchyLevel {
  id: string;
  name: string;
  depth: number;
  members: string[];
}

export interface DimensionalQuery {
  measures: string[];
  dimensions: string[];
  filters?: Record<string, string[]>;
  sortBy?: string;
  limit?: number;
}

export interface DimensionalResult {
  data: Record<string, unknown>[];
  rowDimension: string;
  columnDimension: string;
  measure: string;
}

export class DimensionalModelingEngine {
  private static dimensions = new Map<string, Dimension>();

  static registerDimension(dimension: Dimension): void {
    this.dimensions.set(dimension.id, dimension);
  }

  static getDimension(id: string): Dimension | undefined {
    return this.dimensions.get(id);
  }

  static getAllDimensions(): Dimension[] {
    return Array.from(this.dimensions.values());
  }

  static getMembers(dimensionId: string, hierarchyId?: string): string[] {
    const dim = this.dimensions.get(dimensionId);
    if (!dim) return [];
    const hierarchy = hierarchyId
      ? dim.hierarchies.find((h) => h.id === hierarchyId)
      : dim.hierarchies[0];
    if (!hierarchy) return [];
    const deepest = hierarchy.levels[hierarchy.levels.length - 1];
    return deepest?.members ?? [];
  }

  static slice(
    data: Record<string, unknown>[],
    dimensionId: string,
    member: string
  ): Record<string, unknown>[] {
    return data.filter((row) => row[dimensionId] === member);
  }

  static dice(
    data: Record<string, unknown>[],
    filters: Record<string, string[]>
  ): Record<string, unknown>[] {
    return data.filter((row) => {
      return Object.entries(filters).every(([dim, members]) => members.includes(String(row[dim]!)));
    });
  }

  static drillDown(
    data: Record<string, unknown>[],
    dimensionId: string,
    member: string,
    toLevel: string
  ): Record<string, unknown>[] {
    return this.slice(data, dimensionId, member);
  }

  static rollUp(
    data: Record<string, unknown>[],
    dimensionId: string,
    measure: string
  ): Record<string, unknown>[] {
    const grouped = new Map<string, number>();
    for (const row of data) {
      const key = String(row[dimensionId]!);
      const value = Number(row[measure]!) || 0;
      grouped.set(key, (grouped.get(key) ?? 0) + value);
    }
    return Array.from(grouped.entries()).map(([key, value]) => ({
      [dimensionId]: key,
      [measure]: value,
    }));
  }
}
