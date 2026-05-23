import { describe, it, expect, beforeEach } from 'vitest';
import { CubePartitioner } from './CubePartitioner';

describe('CubePartitioner', () => {
  let partitioner: CubePartitioner;

  beforeEach(() => {
    partitioner = new CubePartitioner();
  });

  describe('partition', () => {
    it('should partition by hash strategy', () => {
      const cells = new Map([
        ['entity=A|year=2024', 100],
        ['entity=B|year=2024', 200],
        ['entity=C|year=2024', 300],
      ]);
      const result = partitioner.partition('test', cells, {
        dimension: 'entity',
        strategy: 'hash',
        maxPartitions: 2,
      });
      expect(result.partitions.length).toBeGreaterThan(0);
      expect(result.partitions.length).toBeLessThanOrEqual(2);
    });

    it('should partition by list strategy', () => {
      const cells = new Map([
        ['entity=A|year=2024', 100],
        ['entity=B|year=2024', 200],
      ]);
      const result = partitioner.partition('test', cells, {
        dimension: 'entity',
        strategy: 'list',
        listValues: ['A', 'B'],
      });
      expect(result.partitions).toHaveLength(2);
    });

    it('should handle empty cells', () => {
      const result = partitioner.partition('test', new Map(), {
        dimension: 'entity',
        strategy: 'hash',
      });
      expect(result).toBeDefined();
      expect(result.partitions).toHaveLength(0);
    });
  });
});
