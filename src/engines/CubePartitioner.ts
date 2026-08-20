// @money-ast-allow Reason: Integer cell count: pc.totalCells -= cellCount is a partition-size counter, not money
// =============================================================================
// CUBE PARTITIONER — Split cubes by dimension for performance
// Enables parallel querying and reduces memory pressure
// Pure TypeScript, deterministic, testable, zero external dependencies
// =============================================================================

export interface PartitionConfig {
  dimension: string;
  strategy: 'hash' | 'range' | 'list';
  maxPartitions?: number;
  ranges?: PartitionRange[];
  listValues?: string[];
}

export interface PartitionRange {
  min: string;
  max: string;
  label: string;
}

export interface Partition {
  id: string;
  label: string;
  dimension: string;
  cells: Map<string, unknown>;
  metadata: PartitionMetadata;
}

export interface PartitionMetadata {
  cellCount: number;
  createdAt: string;
  dimensionFilter: string;
}

export interface PartitionedCube {
  cubeName: string;
  partitionDimension: string;
  strategy: string;
  partitions: Partition[];
  totalCells: number;
}

// =============================================================================
// PARTITIONER
// =============================================================================

export class CubePartitioner {
  private partitionedCubes = new Map<string, PartitionedCube>();

  partition(
    cubeName: string,
    cells: Map<string, unknown>,
    config: PartitionConfig
  ): PartitionedCube {
    const partitions = this.splitCells(cells, config);

    const result: PartitionedCube = {
      cubeName,
      partitionDimension: config.dimension,
      strategy: config.strategy,
      partitions,
      totalCells: cells.size,
    };

    this.partitionedCubes.set(cubeName, result);
    return result;
  }

  getPartition(cubeName: string, partitionId: string): Partition | undefined {
    const pc = this.partitionedCubes.get(cubeName);
    return pc?.partitions.find((p) => p.id === partitionId);
  }

  getPartitions(cubeName: string): Partition[] {
    return this.partitionedCubes.get(cubeName)?.partitions ?? [];
  }

  getPartitionedCube(cubeName: string): PartitionedCube | undefined {
    return this.partitionedCubes.get(cubeName);
  }

  removePartition(cubeName: string, partitionId: string): boolean {
    const pc = this.partitionedCubes.get(cubeName);
    if (!pc) return false;
    const idx = pc.partitions.findIndex((p) => p.id === partitionId);
    if (idx === -1) return false;
    pc.totalCells -= pc.partitions[idx]!.metadata.cellCount;
    pc.partitions.splice(idx, 1);
    return true;
  }

  mergePartitions(cubeName: string): Map<string, unknown> {
    const pc = this.partitionedCubes.get(cubeName);
    if (!pc) return new Map();
    const merged = new Map<string, unknown>();
    for (const partition of pc.partitions) {
      for (const [key, value] of partition.cells) {
        merged.set(key, value);
      }
    }
    return merged;
  }

  private splitCells(cells: Map<string, unknown>, config: PartitionConfig): Partition[] {
    switch (config.strategy) {
      case 'hash':
        return this.hashPartition(cells, config);
      case 'range':
        return this.rangePartition(cells, config);
      case 'list':
        return this.listPartition(cells, config);
      default:
        return this.hashPartition(cells, config);
    }
  }

  private hashPartition(cells: Map<string, unknown>, config: PartitionConfig): Partition[] {
    const maxPartitions = config.maxPartitions ?? 8;
    const partitionMap = new Map<number, Map<string, unknown>>();

    for (const [key, value] of cells) {
      const dimValue = this.extractDimensionValue(key, config.dimension);
      const hash = this.simpleHash(dimValue) % maxPartitions;
      if (!partitionMap.has(hash)) partitionMap.set(hash, new Map());
      partitionMap.get(hash)!.set(key, value);
    }

    return Array.from(partitionMap.entries()).map(([hash, partitionCells]) => ({
      id: `part-hash-${hash}`,
      label: `Hash Partition ${hash}`,
      dimension: config.dimension,
      cells: partitionCells,
      metadata: {
        cellCount: partitionCells.size,
        createdAt: new Date().toISOString(),
        dimensionFilter: `hash(${config.dimension}) = ${hash}`,
      },
    }));
  }

  private rangePartition(cells: Map<string, unknown>, config: PartitionConfig): Partition[] {
    const ranges = config.ranges ?? [];
    if (ranges.length === 0) return [];

    const partitionMap = new Map<string, Map<string, unknown>>();
    for (const range of ranges) {
      partitionMap.set(range.label, new Map());
    }

    for (const [key, value] of cells) {
      const dimValue = this.extractDimensionValue(key, config.dimension);
      const range = ranges.find((r) => dimValue >= r.min && dimValue <= r.max);
      if (range) partitionMap.get(range.label)!.set(key, value);
    }

    return ranges.map((range) => ({
      id: `part-range-${range.label}`,
      label: range.label,
      dimension: config.dimension,
      cells: partitionMap.get(range.label)!,
      metadata: {
        cellCount: partitionMap.get(range.label)!.size,
        createdAt: new Date().toISOString(),
        dimensionFilter: `${config.dimension} BETWEEN '${range.min}' AND '${range.max}'`,
      },
    }));
  }

  private listPartition(cells: Map<string, unknown>, config: PartitionConfig): Partition[] {
    const listValues = config.listValues ?? [];
    const partitionMap = new Map<string, Map<string, unknown>>();

    for (const val of listValues) {
      partitionMap.set(val, new Map());
    }
    partitionMap.set('_other', new Map());

    for (const [key, value] of cells) {
      const dimValue = this.extractDimensionValue(key, config.dimension);
      const target = partitionMap.has(dimValue) ? dimValue : '_other';
      partitionMap.get(target)!.set(key, value);
    }

    return Array.from(partitionMap.entries())
      .filter(([, cells]) => cells.size > 0)
      .map(([val, partitionCells]) => ({
        id: `part-list-${val}`,
        label: val === '_other' ? 'Other' : val,
        dimension: config.dimension,
        cells: partitionCells,
        metadata: {
          cellCount: partitionCells.size,
          createdAt: new Date().toISOString(),
          dimensionFilter: `${config.dimension} = '${val}'`,
        },
      }));
  }

  private extractDimensionValue(cellKey: string, dimension: string): string {
    const parts = cellKey.split('|');
    for (const part of parts) {
      const eqIdx = part.indexOf('=');
      if (eqIdx > 0) {
        const dim = part.slice(0, eqIdx);
        if (dim === dimension) return part.slice(eqIdx + 1);
      }
    }
    return '';
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }
}
