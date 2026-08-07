import { describe, it, expect, beforeEach } from 'vitest';
import { CubePartitioner } from './CubePartitioner';

describe('CubePartitioner', () => {
  let partitioner: CubePartitioner;

  beforeEach(() => {
    partitioner = new CubePartitioner();
  });

  describe('partition strategies', () => {
    it('should partition by hash strategy with default and custom maxPartitions', () => {
      const cells = new Map([
        ['entity=A|year=2024', 100],
        ['entity=B|year=2024', 200],
        ['entity=C|year=2024', 300],
        ['entity=D|year=2024', 400],
      ]);
      const result = partitioner.partition('test_hash', cells, {
        dimension: 'entity',
        strategy: 'hash',
        maxPartitions: 2,
      });
      expect(result.partitions.length).toBeGreaterThan(0);
      expect(result.partitions.length).toBeLessThanOrEqual(2);
      expect(result.totalCells).toBe(4);
    });

    it('should partition by range strategy', () => {
      const cells = new Map([
        ['entity=Alpha|year=2024', 100],
        ['entity=Beta|year=2024', 200],
        ['entity=Zeta|year=2024', 300],
      ]);
      const ranges = [
        { label: 'A-M', min: 'A', max: 'M' },
        { label: 'N-Z', min: 'N', max: 'Z' },
      ];
      const result = partitioner.partition('test_range', cells, {
        dimension: 'entity',
        strategy: 'range',
        ranges,
      });
      expect(result.partitions).toHaveLength(2);
      expect(result.partitions[0]!.label).toBe('A-M');
      expect(result.partitions[1]!.label).toBe('N-Z');
    });

    it('should return empty partitions if range strategy has no ranges', () => {
      const cells = new Map([['entity=A', 100]]);
      const result = partitioner.partition('empty_range', cells, {
        dimension: 'entity',
        strategy: 'range',
      });
      expect(result.partitions).toHaveLength(0);
    });

    it('should partition by list strategy including _other bucket', () => {
      const cells = new Map([
        ['entity=US|year=2024', 100],
        ['entity=EU|year=2024', 200],
        ['entity=APAC|year=2024', 300],
      ]);
      const result = partitioner.partition('test_list', cells, {
        dimension: 'entity',
        strategy: 'list',
        listValues: ['US', 'EU'],
      });
      expect(result.partitions.length).toBe(3); // US, EU, and Other (APAC)
      const otherPart = result.partitions.find((p) => p.id === 'part-list-_other');
      expect(otherPart?.label).toBe('Other');
    });

    it('should handle empty cells', () => {
      const result = partitioner.partition('empty_cube', new Map(), {
        dimension: 'entity',
        strategy: 'hash',
      });
      expect(result).toBeDefined();
      expect(result.partitions).toHaveLength(0);
    });
  });

  describe('querying and modifying partitions', () => {
    beforeEach(() => {
      const cells = new Map([
        ['dept=Sales|period=Q1', 500],
        ['dept=Engineering|period=Q1', 800],
      ]);
      partitioner.partition('dept_cube', cells, {
        dimension: 'dept',
        strategy: 'list',
        listValues: ['Sales', 'Engineering'],
      });
    });

    it('gets partition by ID', () => {
      const partition = partitioner.getPartition('dept_cube', 'part-list-Sales');
      expect(partition).toBeDefined();
      expect(partition?.label).toBe('Sales');
      expect(partitioner.getPartition('non_existent', 'part-1')).toBeUndefined();
    });

    it('gets all partitions and partitioned cube definition', () => {
      const parts = partitioner.getPartitions('dept_cube');
      expect(parts).toHaveLength(2);
      expect(partitioner.getPartitions('unknown')).toEqual([]);

      const cube = partitioner.getPartitionedCube('dept_cube');
      expect(cube?.cubeName).toBe('dept_cube');
      expect(cube?.totalCells).toBe(2);
    });

    it('merges partitions back into a single map', () => {
      const merged = partitioner.mergePartitions('dept_cube');
      expect(merged.size).toBe(2);
      expect(merged.get('dept=Sales|period=Q1')).toBe(500);
      expect(partitioner.mergePartitions('unknown').size).toBe(0);
    });

    it('removes partition and decrements total cell count', () => {
      expect(partitioner.removePartition('dept_cube', 'part-list-Sales')).toBe(true);
      expect(partitioner.getPartitions('dept_cube')).toHaveLength(1);
      expect(partitioner.getPartitionedCube('dept_cube')?.totalCells).toBe(1);

      expect(partitioner.removePartition('dept_cube', 'non_existent_part')).toBe(false);
      expect(partitioner.removePartition('unknown_cube', 'any_part')).toBe(false);
    });
  });
});
