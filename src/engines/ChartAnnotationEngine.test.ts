import { describe, it, expect } from 'vitest';
import { ChartAnnotationEngine } from './ChartAnnotationEngine';

describe('ChartAnnotationEngine', () => {
  describe('add', () => {
    it('should add annotation to chart', () => {
      const annotation = ChartAnnotationEngine.add({
        chartId: 'chart-add-1',
        type: 'note',
        content: 'Q4 spike due to seasonal demand',
        position: { x: 80, y: 20 },
        createdBy: 'user',
      });
      expect(annotation.id).toBeDefined();
      expect(annotation.chartId).toBe('chart-add-1');
    });

    it('should add multiple annotations to same chart', () => {
      ChartAnnotationEngine.add({
        chartId: 'chart-add-multi',
        type: 'note',
        content: 'Note 1',
        position: { x: 10, y: 10 },
        createdBy: 'user',
      });
      ChartAnnotationEngine.add({
        chartId: 'chart-add-multi',
        type: 'note',
        content: 'Note 2',
        position: { x: 20, y: 20 },
        createdBy: 'user',
      });
      const annotations = ChartAnnotationEngine.getByChart('chart-add-multi');
      expect(annotations).toHaveLength(2);
    });
  });

  describe('remove', () => {
    it('should remove annotation by id', () => {
      const annotation = ChartAnnotationEngine.add({
        chartId: 'chart-remove',
        type: 'note',
        content: 'Test',
        position: { x: 0, y: 0 },
        createdBy: 'user',
      });
      const removed = ChartAnnotationEngine.remove(annotation.id);
      expect(removed).toBe(true);
      expect(ChartAnnotationEngine.getByChart('chart-remove')).toHaveLength(0);
    });

    it('should return false for non-existent id', () => {
      expect(ChartAnnotationEngine.remove('fake-id')).toBe(false);
    });
  });

  describe('getByChart', () => {
    it('should return empty array for chart with no annotations', () => {
      expect(ChartAnnotationEngine.getByChart('nonexistent')).toHaveLength(0);
    });

    it('should filter by chart id', () => {
      ChartAnnotationEngine.add({
        chartId: 'chart-filter-a',
        type: 'note',
        content: 'A',
        position: { x: 0, y: 0 },
        createdBy: 'user',
      });
      ChartAnnotationEngine.add({
        chartId: 'chart-filter-b',
        type: 'note',
        content: 'B',
        position: { x: 0, y: 0 },
        createdBy: 'user',
      });
      expect(ChartAnnotationEngine.getByChart('chart-filter-a')).toHaveLength(1);
    });
  });

  describe('addThreshold', () => {
    it('should add threshold line annotation', () => {
      const threshold = ChartAnnotationEngine.addThreshold(
        'chart-threshold',
        50000,
        'budget',
        '#FF0000'
      );
      expect(threshold.type).toBe('threshold');
      expect(threshold.chartId).toBe('chart-threshold');
    });
  });
});
