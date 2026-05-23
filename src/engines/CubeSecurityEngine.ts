// =============================================================================
// CUBE SECURITY ENGINE — Cell-level security based on dimension membership
// Implements row-level and column-level security for OLAP cubes
// Pure TypeScript, deterministic, testable, zero external dependencies
// =============================================================================

export type PermissionLevel = 'none' | 'read' | 'write' | 'admin';

export interface SecurityRule {
  id: string;
  userId: string;
  dimension: string;
  members: string[];
  permission: PermissionLevel;
  createdAt: string;
  expiresAt?: string;
}

export interface SecurityContext {
  userId: string;
  roles: string[];
  dimensions: Record<string, string[]>;
}

export interface AccessCheckResult {
  allowed: boolean;
  reason: string;
  matchedRuleId?: string;
}

export interface SecurityAuditEntry {
  timestamp: string;
  userId: string;
  action: 'read' | 'write' | 'deny';
  cellKey: string;
  ruleId?: string;
}

// =============================================================================
// CUBE SECURITY ENGINE
// =============================================================================

export class CubeSecurityEngine {
  private rules = new Map<string, SecurityRule>();
  private auditLog: SecurityAuditEntry[] = [];
  private maxAuditLogSize = 10000;

  addRule(rule: Omit<SecurityRule, 'id' | 'createdAt'>): SecurityRule {
    const id = `sec-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const fullRule: SecurityRule = {
      ...rule,
      id,
      createdAt: new Date().toISOString(),
    };
    this.rules.set(id, fullRule);
    return fullRule;
  }

  removeRule(ruleId: string): boolean {
    return this.rules.delete(ruleId);
  }

  getRule(ruleId: string): SecurityRule | undefined {
    return this.rules.get(ruleId);
  }

  getRulesForUser(userId: string): SecurityRule[] {
    return Array.from(this.rules.values()).filter((r) => r.userId === userId);
  }

  listRules(): SecurityRule[] {
    return Array.from(this.rules.values());
  }

  checkAccess(
    context: SecurityContext,
    cellCoords: Record<string, string>,
    action: 'read' | 'write'
  ): AccessCheckResult {
    const now = new Date().toISOString();
    const userRules = Array.from(this.rules.values())
      .filter((r) => r.userId === context.userId)
      .filter((r) => !r.expiresAt || r.expiresAt > now);

    if (userRules.length === 0) {
      this.logAudit(context.userId, 'deny', this.buildCellKey(cellCoords), undefined);
      return { allowed: false, reason: 'No security rules found for user' };
    }

    for (const rule of userRules) {
      const cellMember = cellCoords[rule.dimension];
      if (!cellMember) continue;

      if (rule.members.includes(cellMember) || rule.members.includes('*')) {
        const allowed =
          action === 'read'
            ? rule.permission !== 'none'
            : rule.permission === 'write' || rule.permission === 'admin';

        if (allowed) {
          this.logAudit(context.userId, action, this.buildCellKey(cellCoords), rule.id);
          return {
            allowed: true,
            reason: `Access granted by rule ${rule.id}`,
            matchedRuleId: rule.id,
          };
        }
      }
    }

    this.logAudit(context.userId, 'deny', this.buildCellKey(cellCoords), undefined);
    return { allowed: false, reason: 'No matching rule grants access' };
  }

  filterCells(
    context: SecurityContext,
    cells: Map<string, unknown>,
    action: 'read' | 'write' = 'read'
  ): Map<string, unknown> {
    const filtered = new Map<string, unknown>();
    for (const [key, value] of cells) {
      const coords = this.parseCellKey(key);
      const result = this.checkAccess(context, coords, action);
      if (result.allowed) filtered.set(key, value);
    }
    return filtered;
  }

  hasAccess(userId: string, dimension: string, member: string): boolean {
    const now = new Date().toISOString();
    const userRules = Array.from(this.rules.values())
      .filter((r) => r.userId === userId && r.dimension === dimension)
      .filter((r) => !r.expiresAt || r.expiresAt > now);

    return userRules.some((r) => r.members.includes(member) || r.members.includes('*'));
  }

  getAuditLog(limit?: number): SecurityAuditEntry[] {
    return limit ? this.auditLog.slice(-limit) : [...this.auditLog];
  }

  clearAuditLog(): void {
    this.auditLog = [];
  }

  exportRules(): string {
    return JSON.stringify(Array.from(this.rules.values()), null, 2);
  }

  importRules(json: string): number {
    const parsed = JSON.parse(json) as SecurityRule[];
    for (const rule of parsed) {
      this.rules.set(rule.id, rule);
    }
    return parsed.length;
  }

  private logAudit(
    userId: string,
    action: SecurityAuditEntry['action'],
    cellKey: string,
    ruleId?: string
  ): void {
    this.auditLog.push({ timestamp: new Date().toISOString(), userId, action, cellKey, ruleId });
    if (this.auditLog.length > this.maxAuditLogSize) {
      this.auditLog = this.auditLog.slice(-this.maxAuditLogSize);
    }
  }

  private buildCellKey(coords: Record<string, string>): string {
    return Object.entries(coords)
      .sort()
      .map(([k, v]) => `${k}=${v}`)
      .join('|');
  }

  private parseCellKey(key: string): Record<string, string> {
    const coords: Record<string, string> = {};
    for (const part of key.split('|')) {
      const eqIdx = part.indexOf('=');
      if (eqIdx > 0) coords[part.slice(0, eqIdx)] = part.slice(eqIdx + 1);
    }
    return coords;
  }
}
