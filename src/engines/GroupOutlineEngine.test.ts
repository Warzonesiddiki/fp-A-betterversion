/**
 * Tests for GroupOutlineEngine
 * Covers: defineGroup, defineHierarchy, toggleGroup, collapseAll, expandAll
 */
import { describe, it, expect } from 'vitest';
import { GroupOutlineEngine } from './GroupOutlineEngine';

describe('GroupOutlineEngine', () => {
  describe('defineGroup', () => {
    it('should define a group', () => {
      GroupOutlineEngine.defineGroup({
        id: 'revenue',
        name: 'Revenue',
        level: 1,
        children: [],
        isCollapsed: false,
        isBold: true,
        indent: 0,
      });
      const state = GroupOutlineEngine.getGroupState();
      expect(state.expanded).toContain('revenue');
    });

    it('should define another group', () => {
      GroupOutlineEngine.defineGroup({
        id: 'q1',
        name: 'Q1',
        level: 1,
        children: [],
        isCollapsed: false,
        isBold: true,
        indent: 0,
      });
      const state = GroupOutlineEngine.getGroupState();
      expect(state.expanded).toContain('q1');
    });

    it('should track multiple groups', () => {
      GroupOutlineEngine.defineGroup({
        id: 'multi-revenue',
        name: 'Revenue',
        level: 1,
        children: [],
        isCollapsed: false,
        isBold: true,
        indent: 0,
      });
      GroupOutlineEngine.defineGroup({
        id: 'multi-expenses',
        name: 'Expenses',
        level: 1,
        children: [],
        isCollapsed: false,
        isBold: true,
        indent: 0,
      });
      const state = GroupOutlineEngine.getGroupState();
      expect(state.expanded).toContain('multi-revenue');
      expect(state.expanded).toContain('multi-expenses');
    });
  });

  describe('defineHierarchy', () => {
    it('should define parent-child relationships', () => {
      GroupOutlineEngine.defineHierarchy([
        { id: 'h-revenue', name: 'Revenue', level: 1 },
        { id: 'h-product-revenue', name: 'Product Revenue', level: 2, parentId: 'h-revenue' },
      ]);
      GroupOutlineEngine.toggleGroup('h-revenue');
      expect(GroupOutlineEngine.isVisible('h-product-revenue')).toBe(false);
    });
  });

  describe('toggleGroup', () => {
    it('should toggle group collapsed state', () => {
      GroupOutlineEngine.defineGroup({
        id: 'toggle-revenue',
        name: 'Revenue',
        level: 1,
        children: [],
        isCollapsed: false,
        isBold: true,
        indent: 0,
      });
      const result = GroupOutlineEngine.toggleGroup('toggle-revenue');
      expect(result).toBe(true);
      const state = GroupOutlineEngine.getGroupState();
      expect(state.collapsed).toContain('toggle-revenue');
    });

    it('should toggle back to expanded', () => {
      GroupOutlineEngine.defineGroup({
        id: 'toggle-revenue-2',
        name: 'Revenue',
        level: 1,
        children: [],
        isCollapsed: false,
        isBold: true,
        indent: 0,
      });
      GroupOutlineEngine.toggleGroup('toggle-revenue-2');
      GroupOutlineEngine.toggleGroup('toggle-revenue-2');
      const state = GroupOutlineEngine.getGroupState();
      expect(state.collapsed).not.toContain('toggle-revenue-2');
    });

    it('should return false for non-existent group', () => {
      expect(GroupOutlineEngine.toggleGroup('nonexistent')).toBe(false);
    });
  });

  describe('collapseAll', () => {
    it('should collapse all groups', () => {
      GroupOutlineEngine.defineGroup({
        id: 'coll-revenue',
        name: 'Revenue',
        level: 1,
        children: [],
        isCollapsed: false,
        isBold: true,
        indent: 0,
      });
      GroupOutlineEngine.defineGroup({
        id: 'coll-expenses',
        name: 'Expenses',
        level: 1,
        children: [],
        isCollapsed: false,
        isBold: true,
        indent: 0,
      });
      GroupOutlineEngine.collapseAll();
      const state = GroupOutlineEngine.getGroupState();
      expect(state.collapsed).toContain('coll-revenue');
      expect(state.collapsed).toContain('coll-expenses');
    });
  });

  describe('expandAll', () => {
    it('should expand all groups', () => {
      GroupOutlineEngine.defineGroup({
        id: 'exp-revenue',
        name: 'Revenue',
        level: 1,
        children: [],
        isCollapsed: false,
        isBold: true,
        indent: 0,
      });
      GroupOutlineEngine.defineGroup({
        id: 'exp-expenses',
        name: 'Expenses',
        level: 1,
        children: [],
        isCollapsed: false,
        isBold: true,
        indent: 0,
      });
      GroupOutlineEngine.collapseAll();
      GroupOutlineEngine.expandAll();
      const state = GroupOutlineEngine.getGroupState();
      expect(state.expanded).toContain('exp-revenue');
      expect(state.expanded).toContain('exp-expenses');
    });
  });
});
