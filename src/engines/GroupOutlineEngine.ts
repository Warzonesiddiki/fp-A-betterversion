/**
 * Group Outline Engine — Row/column grouping for financial grids
 * Enables expand/collapse of account hierarchies and time periods
 */

export interface OutlineGroup {
  id: string;
  name: string;
  level: number; // 1=top, 2=mid, 3=detail
  children: string[];
  parent?: string;
  isCollapsed: boolean;
  isBold: boolean;
  indent: number;
}

export interface OutlineState {
  groups: Map<string, OutlineGroup>;
  collapsedGroups: Set<string>;
}

export class GroupOutlineEngine {
  private static state: OutlineState = {
    groups: new Map(),
    collapsedGroups: new Set(),
  };

  static defineGroup(group: OutlineGroup): void {
    this.state.groups.set(group.id, group);
  }

  static defineHierarchy(
    items: Array<{ id: string; name: string; level: number; parentId?: string }>
  ): void {
    for (const item of items) {
      this.defineGroup({
        id: item.id,
        name: item.name,
        level: item.level,
        children: items.filter((i) => i.parentId === item.id).map((i) => i.id),
        parent: item.parentId,
        isCollapsed: false,
        isBold: item.level <= 2,
        indent: (item.level - 1) * 24,
      });
    }
  }

  static toggleGroup(groupId: string): boolean {
    const group = this.state.groups.get(groupId);
    if (!group) return false;
    group.isCollapsed = !group.isCollapsed;
    if (group.isCollapsed) {
      this.state.collapsedGroups.add(groupId);
    } else {
      this.state.collapsedGroups.delete(groupId);
    }
    return group.isCollapsed;
  }

  static collapseAll(): void {
    for (const group of this.state.groups.values()) {
      group.isCollapsed = true;
      this.state.collapsedGroups.add(group.id);
    }
  }

  static expandAll(): void {
    for (const group of this.state.groups.values()) {
      group.isCollapsed = false;
    }
    this.state.collapsedGroups.clear();
  }

  static collapseToLevel(level: number): void {
    for (const group of this.state.groups.values()) {
      group.isCollapsed = group.level < level;
      if (group.isCollapsed) {
        this.state.collapsedGroups.add(group.id);
      } else {
        this.state.collapsedGroups.delete(group.id);
      }
    }
  }

  static isVisible(itemId: string): boolean {
    const group = this.state.groups.get(itemId);
    if (!group) return true;
    let current = group;
    while (current.parent) {
      const parent = this.state.groups.get(current.parent);
      if (!parent) break;
      if (parent.isCollapsed) return false;
      current = parent;
    }
    return true;
  }

  static getVisibleItems(allItems: string[]): string[] {
    return allItems.filter((id) => this.isVisible(id));
  }

  static getGroupState(): { collapsed: string[]; expanded: string[] } {
    return {
      collapsed: Array.from(this.state.collapsedGroups),
      expanded: Array.from(this.state.groups.keys()).filter(
        (id) => !this.state.collapsedGroups.has(id)
      ),
    };
  }
}
