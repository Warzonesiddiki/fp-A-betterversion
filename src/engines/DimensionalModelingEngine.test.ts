/**
 * Tests for DimensionalModelingEngine
 */
import { describe, it, expect } from 'vitest';
import { DimensionalModelingEngine, type Dimension } from './DimensionalModelingEngine';

const timeDimension: Dimension = {
  id: 'time',
  name: 'Time',
  type: 'time',
  hierarchies: [
    {
      id: 'time-hierarchy',
      name: 'Time Hierarchy',
      levels: [
        { id: 'year', name: 'Year', depth: 0, members: ['2024'] },
        { id: 'quarter', name: 'Quarter', depth: 1, members: ['Q1'] },
        { id: 'month', name: 'Month', depth: 2, members: ['Jan', 'Feb'] },
      ],
    },
  ],
};

const regionDimension: Dimension = {
  id: 'region',
  name: 'Region',
  type: 'region',
  hierarchies: [
    {
      id: 'region-hierarchy',
      name: 'Region Hierarchy',
      levels: [
        { id: 'country', name: 'Country', depth: 0, members: ['US'] },
        { id: 'state', name: 'State', depth: 1, members: ['CA', 'NY'] },
      ],
    },
  ],
};

describe('DimensionalModelingEngine', () => {
  describe('registerDimension', () => {
    it('should register a dimension', () => {
      DimensionalModelingEngine.registerDimension(timeDimension);
      const dim = DimensionalModelingEngine.getDimension('time');
      expect(dim).toBeDefined();
      expect(dim!.name).toBe('Time');
      expect(dim!.hierarchies).toHaveLength(1);
      expect(dim!.hierarchies[0].levels).toHaveLength(3);
    });

    it('should register multiple dimensions', () => {
      DimensionalModelingEngine.registerDimension(timeDimension);
      DimensionalModelingEngine.registerDimension(regionDimension);
      expect(DimensionalModelingEngine.getAllDimensions()).toHaveLength(2);
    });
  });

  describe('getDimension', () => {
    it('should get dimension by id', () => {
      DimensionalModelingEngine.registerDimension(timeDimension);
      const dim = DimensionalModelingEngine.getDimension('time');
      expect(dim).toBeDefined();
      expect(dim!.name).toBe('Time');
    });

    it('should return undefined for non-existent dimension', () => {
      expect(DimensionalModelingEngine.getDimension('nonexistent')).toBeUndefined();
    });
  });

  describe('getAllDimensions', () => {
    it('should return all registered dimensions', () => {
      DimensionalModelingEngine.registerDimension(timeDimension);
      DimensionalModelingEngine.registerDimension(regionDimension);
      const all = DimensionalModelingEngine.getAllDimensions();
      expect(all.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('getMembers', () => {
    it('should return deepest level members of a dimension', () => {
      DimensionalModelingEngine.registerDimension(timeDimension);
      const members = DimensionalModelingEngine.getMembers('time');
      expect(members).toEqual(['Jan', 'Feb']);
    });

    it('should accept optional hierarchy id', () => {
      DimensionalModelingEngine.registerDimension(timeDimension);
      const members = DimensionalModelingEngine.getMembers('time', 'time-hierarchy');
      expect(members).toEqual(['Jan', 'Feb']);
    });

    it('should return empty array for non-existent dimension', () => {
      expect(DimensionalModelingEngine.getMembers('nonexistent')).toEqual([]);
    });
  });

  describe('slice', () => {
    it('should slice data by dimension member', () => {
      const data = [
        { time: 'Jan', revenue: 100 },
        { time: 'Feb', revenue: 150 },
      ];
      const result = DimensionalModelingEngine.slice(data, 'time', 'Jan');
      expect(result).toHaveLength(1);
      expect(result[0].revenue).toBe(100);
    });

    it('should return empty array when no match', () => {
      const data = [{ time: 'Jan', revenue: 100 }];
      const result = DimensionalModelingEngine.slice(data, 'time', 'Mar');
      expect(result).toHaveLength(0);
    });
  });

  describe('dice', () => {
    it('should filter data by multiple dimension filters', () => {
      const data = [
        { time: 'Jan', region: 'US', revenue: 100 },
        { time: 'Feb', region: 'US', revenue: 150 },
        { time: 'Jan', region: 'EU', revenue: 200 },
      ];
      const result = DimensionalModelingEngine.dice(data, { time: ['Jan'] });
      expect(result).toHaveLength(2);
    });

    it('should match all filter conditions', () => {
      const data = [
        { time: 'Jan', region: 'US', revenue: 100 },
        { time: 'Feb', region: 'US', revenue: 150 },
        { time: 'Jan', region: 'EU', revenue: 200 },
      ];
      const result = DimensionalModelingEngine.dice(data, { time: ['Jan'], region: ['US'] });
      expect(result).toHaveLength(1);
      expect(result[0].revenue).toBe(100);
    });
  });

  describe('drillDown', () => {
    it('should slice data to a specific level', () => {
      const data = [
        { time: 'Jan', revenue: 100 },
        { time: 'Feb', revenue: 150 },
      ];
      const result = DimensionalModelingEngine.drillDown(data, 'time', 'Jan', 'month');
      expect(result).toHaveLength(1);
    });
  });

  describe('rollUp', () => {
    it('should aggregate measure by dimension', () => {
      const data = [
        { time: 'Jan', revenue: 100 },
        { time: 'Feb', revenue: 150 },
        { time: 'Jan', revenue: 50 },
      ];
      const result = DimensionalModelingEngine.rollUp(data, 'time', 'revenue');
      expect(result).toHaveLength(2);
      const jan = result.find((r) => r.time === 'Jan');
      expect(jan!.revenue).toBe(150);
    });

    it('should handle empty data', () => {
      const result = DimensionalModelingEngine.rollUp([], 'time', 'revenue');
      expect(result).toHaveLength(0);
    });
  });
});
