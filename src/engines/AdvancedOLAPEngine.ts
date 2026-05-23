// =============================================================================
// ADVANCED OLAP ENGINE
// Writeback, custom hierarchies, calculated members, MDX-like queries
// Pure TypeScript, deterministic, testable
// =============================================================================

export interface OLAPMember {
  id: string;
  name: string;
  dimensionId: string;
  parentId: string | null;
  level: number;
  properties: Record<string, unknown>;
  formula?: string;
}

export interface OLAPHierarchy {
  id: string;
  name: string;
  dimensionId: string;
  type: 'balanced' | 'ragged' | 'unbalanced' | 'parent_child';
  levels: string[];
}

export interface CalculatedMember {
  id: string;
  name: string;
  dimensionId: string;
  formula: string;
  solveOrder: number;
}

export interface NamedSet {
  id: string;
  name: string;
  dimensionId: string;
  members: string[];
}

export interface MDXQuery {
  columns: string[];
  rows: string[];
  where?: Record<string, string>;
  filters?: Array<{ dimension: string; members: string[] }>;
}

export interface WritebackEntry {
  cellKey: string;
  oldValue: unknown;
  newValue: unknown;
  userId: string;
  timestamp: string;
  comment?: string;
}

export interface CellSecurity {
  userId: string;
  cellPattern: string;
  access: 'read' | 'write' | 'none';
}

export class AdvancedOLAPEngine {
  private members = new Map<string, OLAPMember>();
  private hierarchies = new Map<string, OLAPHierarchy>();
  private calculatedMembers = new Map<string, CalculatedMember>();
  private namedSets = new Map<string, NamedSet>();
  private writebackLog: WritebackEntry[] = [];
  private cellSecurity: CellSecurity[] = [];
  private cellValues = new Map<string, unknown>();

  // ---------------------------------------------------------------------------
  // Member Management
  // ---------------------------------------------------------------------------

  addMember(member: OLAPMember): void {
    this.members.set(member.id, member);
  }

  getMember(id: string): OLAPMember | undefined {
    return this.members.get(id);
  }

  removeMember(id: string): boolean {
    return this.members.delete(id);
  }

  getChildren(parentId: string): OLAPMember[] {
    return Array.from(this.members.values()).filter((m) => m.parentId === parentId);
  }

  getDescendants(memberId: string): OLAPMember[] {
    const descendants: OLAPMember[] = [];
    const children = this.getChildren(memberId);
    for (const child of children) {
      descendants.push(child);
      descendants.push(...this.getDescendants(child.id));
    }
    return descendants;
  }

  getAncestors(memberId: string): OLAPMember[] {
    const ancestors: OLAPMember[] = [];
    let current = this.members.get(memberId);
    while (current?.parentId) {
      const parent = this.members.get(current.parentId);
      if (parent) {
        ancestors.push(parent);
        current = parent;
      } else {
        break;
      }
    }
    return ancestors;
  }

  // ---------------------------------------------------------------------------
  // Hierarchy Management
  // ---------------------------------------------------------------------------

  addHierarchy(hierarchy: OLAPHierarchy): void {
    this.hierarchies.set(hierarchy.id, hierarchy);
  }

  getHierarchy(id: string): OLAPHierarchy | undefined {
    return this.hierarchies.get(id);
  }

  removeHierarchy(id: string): boolean {
    return this.hierarchies.delete(id);
  }

  getMembersAtLevel(hierarchyId: string, level: number): OLAPMember[] {
    const hierarchy = this.hierarchies.get(hierarchyId);
    if (!hierarchy) return [];
    return Array.from(this.members.values()).filter(
      (m) => m.dimensionId === hierarchy.dimensionId && m.level === level
    );
  }

  // ---------------------------------------------------------------------------
  // Calculated Members
  // ---------------------------------------------------------------------------

  addCalculatedMember(member: CalculatedMember): void {
    this.calculatedMembers.set(member.id, member);
  }

  removeCalculatedMember(id: string): boolean {
    return this.calculatedMembers.delete(id);
  }

  evaluateCalculatedMember(id: string): unknown {
    const member = this.calculatedMembers.get(id);
    if (!member) return null;
    try {
      // Simple formula evaluation (supports basic arithmetic)
      const expr = member.formula.replace(/\[([^\]]+)\]/g, (_, memberId) => {
        const val = this.cellValues.get(memberId);
        return String(val ?? 0);
      });
      return Function(`"use strict"; return (${expr})`)();
    } catch {
      return null;
    }
  }

  // ---------------------------------------------------------------------------
  // Named Sets
  // ---------------------------------------------------------------------------

  addNamedSet(set: NamedSet): void {
    this.namedSets.set(set.id, set);
  }

  removeNamedSet(id: string): boolean {
    return this.namedSets.delete(id);
  }

  getNamedSet(id: string): NamedSet | undefined {
    return this.namedSets.get(id);
  }

  // ---------------------------------------------------------------------------
  // Writeback
  // ---------------------------------------------------------------------------

  writeback(cellKey: string, newValue: unknown, userId: string, comment?: string): void {
    const oldValue = this.cellValues.get(cellKey);
    this.cellValues.set(cellKey, newValue);
    this.writebackLog.push({
      cellKey,
      oldValue,
      newValue,
      userId,
      timestamp: new Date().toISOString(),
      comment,
    });
  }

  getWritebackLog(cellKey?: string): WritebackEntry[] {
    if (cellKey) return this.writebackLog.filter((e) => e.cellKey === cellKey);
    return [...this.writebackLog];
  }

  // ---------------------------------------------------------------------------
  // Cell Security
  // ---------------------------------------------------------------------------

  addCellSecurity(rule: CellSecurity): void {
    this.cellSecurity.push(rule);
  }

  checkAccess(userId: string, cellKey: string): 'read' | 'write' | 'none' {
    const rules = this.cellSecurity.filter((r) => r.userId === userId);
    for (const rule of rules) {
      if (this.matchPattern(cellKey, rule.cellPattern)) {
        return rule.access;
      }
    }
    return 'read'; // Default: read access
  }

  private matchPattern(cellKey: string, pattern: string): boolean {
    if (pattern === '*') return true;
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    return regex.test(cellKey);
  }

  // ---------------------------------------------------------------------------
  // MDX-like Queries
  // ---------------------------------------------------------------------------

  executeQuery(query: MDXQuery): Record<string, unknown>[][] {
    const results: Record<string, unknown>[][] = [];

    // Get all member combinations for rows and columns
    const rowMembers = this.resolveMembers(query.rows);
    const colMembers = this.resolveMembers(query.columns);

    for (const row of rowMembers) {
      const rowResult: Record<string, unknown>[] = [];
      for (const col of colMembers) {
        const cellKey = this.buildCellKey(row, col);
        const value = this.cellValues.get(cellKey) ?? null;
        rowResult.push({ ...row, ...col, value });
      }
      results.push(rowResult);
    }

    return results;
  }

  private resolveMembers(memberRefs: string[]): Record<string, string>[] {
    const results: Record<string, string>[] = [];
    for (const ref of memberRefs) {
      if (ref.startsWith('[') && ref.endsWith(']')) {
        const memberId = ref.slice(1, -1);
        const member = this.members.get(memberId);
        if (member) {
          results.push({ [member.dimensionId]: member.id });
        }
      }
    }
    return results.length > 0 ? results : [{}];
  }

  private buildCellKey(row: Record<string, string>, col: Record<string, string>): string {
    const parts: string[] = [];
    for (const [dim, member] of Object.entries({ ...row, ...col })) {
      parts.push(`${dim}:${member}`);
    }
    return parts.join('|');
  }

  // ---------------------------------------------------------------------------
  // Cell Values
  // ---------------------------------------------------------------------------

  setCellValue(cellKey: string, value: unknown): void {
    this.cellValues.set(cellKey, value);
  }

  getCellValue(cellKey: string): unknown {
    return this.cellValues.get(cellKey);
  }

  // ---------------------------------------------------------------------------
  // What-If Analysis
  // ---------------------------------------------------------------------------

  whatIfScenario(changes: Array<{ cellKey: string; newValue: unknown }>): Map<string, unknown> {
    const originalValues = new Map<string, unknown>();
    for (const change of changes) {
      originalValues.set(change.cellKey, this.cellValues.get(change.cellKey));
      this.cellValues.set(change.cellKey, change.newValue);
    }

    // Evaluate calculated members
    for (const [id] of this.calculatedMembers) {
      this.evaluateCalculatedMember(id);
    }

    // Restore original values
    for (const [key, value] of originalValues) {
      this.cellValues.set(key, value);
    }

    return new Map(this.cellValues);
  }

  // ---------------------------------------------------------------------------
  // Serialization
  // ---------------------------------------------------------------------------

  serialize(): string {
    return JSON.stringify({
      members: Array.from(this.members.entries()),
      hierarchies: Array.from(this.hierarchies.entries()),
      calculatedMembers: Array.from(this.calculatedMembers.entries()),
      namedSets: Array.from(this.namedSets.entries()),
      cellValues: Array.from(this.cellValues.entries()),
      cellSecurity: this.cellSecurity,
    });
  }

  deserialize(data: string): void {
    const parsed = JSON.parse(data);
    this.members = new Map(parsed.members);
    this.hierarchies = new Map(parsed.hierarchies);
    this.calculatedMembers = new Map(parsed.calculatedMembers);
    this.namedSets = new Map(parsed.namedSets);
    this.cellValues = new Map(parsed.cellValues);
    this.cellSecurity = parsed.cellSecurity ?? [];
  }
}
