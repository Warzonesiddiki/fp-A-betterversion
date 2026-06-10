// Role-Based Access Control Engine
// Pure TypeScript, no external dependencies

export type Role = 'admin' | 'manager' | 'analyst' | 'dept_head' | 'viewer';

export interface Permission {
  resource: string;
  action: 'read' | 'write' | 'delete' | 'approve';
  conditions?: Record<string, unknown>;
}

export interface UserRole {
  userId: string;
  role: Role;
  entities: string[]; // entity IDs this role applies to
  accounts?: string[]; // account codes (empty = all)
  periods?: string[]; // period IDs (empty = all)
  grantedBy: string;
  grantedAt: string;
  expiresAt?: string;
}

const ROLE_HIERARCHY: Record<Role, number> = {
  admin: 100,
  manager: 80,
  analyst: 60,
  dept_head: 40,
  viewer: 20,
};

const DEFAULT_PERMISSIONS: Record<Role, Permission[]> = {
  admin: [
    { resource: '*', action: 'read' },
    { resource: '*', action: 'write' },
    { resource: '*', action: 'delete' },
    { resource: '*', action: 'approve' },
  ],
  manager: [
    { resource: 'budget', action: 'read' },
    { resource: 'budget', action: 'write' },
    { resource: 'budget', action: 'approve' },
    { resource: 'report', action: 'read' },
    { resource: 'report', action: 'write' },
    { resource: 'scenario', action: 'read' },
    { resource: 'scenario', action: 'write' },
    { resource: 'user', action: 'read' },
  ],
  analyst: [
    { resource: 'budget', action: 'read' },
    { resource: 'budget', action: 'write' },
    { resource: 'report', action: 'read' },
    { resource: 'report', action: 'write' },
    { resource: 'scenario', action: 'read' },
    { resource: 'scenario', action: 'write' },
    { resource: 'data', action: 'read' },
    { resource: 'data', action: 'write' },
  ],
  dept_head: [
    { resource: 'budget', action: 'read' },
    { resource: 'report', action: 'read' },
    { resource: 'scenario', action: 'read' },
  ],
  viewer: [
    { resource: 'budget', action: 'read' },
    { resource: 'report', action: 'read' },
  ],
};

export class RBACEngine {
  private userRoles: UserRole[] = [];
  private customPermissions: Map<string, Permission[]> = new Map();

  assignRole(
    userId: string,
    role: Role,
    entities: string[],
    grantedBy: string,
    opts?: { accounts?: string[]; periods?: string[]; expiresAt?: string }
  ): UserRole {
    this.userRoles = this.userRoles.filter((r) => !(r.userId === userId && r.role === role));
    const assignment: UserRole = {
      userId,
      role,
      entities,
      accounts: opts?.accounts,
      periods: opts?.periods,
      grantedBy,
      grantedAt: new Date().toISOString(),
      expiresAt: opts?.expiresAt,
    };
    this.userRoles.push(assignment);
    return assignment;
  }

  revokeRole(userId: string, role: Role): boolean {
    const before = this.userRoles.length;
    this.userRoles = this.userRoles.filter((r) => !(r.userId === userId && r.role === role));
    return this.userRoles.length < before;
  }

  getUserRoles(userId: string): UserRole[] {
    return this.userRoles.filter((r) => r.userId === userId && !this.isExpired(r));
  }

  getHighestRole(userId: string): Role | null {
    const roles = this.getUserRoles(userId);
    if (roles.length === 0) return null;
    return roles.reduce(
      (highest, r) => (ROLE_HIERARCHY[r.role] > ROLE_HIERARCHY[highest]! ? r.role : highest),
      roles[0]!.role
    );
  }

  hasPermission(
    userId: string,
    resource: string,
    action: 'read' | 'write' | 'delete' | 'approve',
    context?: { entityId?: string; accountCode?: string; periodId?: string }
  ): boolean {
    const roles = this.getUserRoles(userId);
    if (roles.length === 0) return false;

    for (const userRole of roles) {
      if (
        context?.entityId &&
        !userRole.entities.includes('*') &&
        !userRole.entities.includes(context.entityId)
      )
        continue;
      if (
        context?.accountCode &&
        userRole.accounts &&
        userRole.accounts.length > 0 &&
        !userRole.accounts.includes(context.accountCode)
      )
        continue;
      if (
        context?.periodId &&
        userRole.periods &&
        userRole.periods.length > 0 &&
        !userRole.periods.includes(context.periodId)
      )
        continue;

      const permissions =
        this.customPermissions.get(userId) ?? DEFAULT_PERMISSIONS[userRole.role] ?? [];
      if (
        permissions.some(
          (p) => (p.resource === '*' || p.resource === resource) && p.action === action
        )
      )
        return true;
    }
    return false;
  }

  setCustomPermissions(userId: string, permissions: Permission[]): void {
    this.customPermissions.set(userId, permissions);
  }

  getEffectivePermissions(userId: string): Permission[] {
    const custom = this.customPermissions.get(userId);
    if (custom) return custom;
    const role = this.getHighestRole(userId);
    if (!role) return [];
    return DEFAULT_PERMISSIONS[role] ?? [];
  }

  listUsers(): { userId: string; roles: Role[] }[] {
    const map = new Map<string, Set<Role>>();
    for (const r of this.userRoles) {
      if (this.isExpired(r)) continue;
      if (!map.has(r.userId)) map.set(r.userId, new Set());
      map.get(r.userId)!.add(r.role);
    }
    return Array.from(map.entries()).map(([userId, roles]) => ({ userId, roles: [...roles] }));
  }

  serialize(): string {
    return JSON.stringify({
      userRoles: this.userRoles,
      customPermissions: Array.from(this.customPermissions.entries()),
    });
  }

  deserialize(json: string): void {
    const data = JSON.parse(json);
    this.userRoles = data.userRoles ?? [];
    this.customPermissions = new Map(data.customPermissions ?? []);
  }

  private isExpired(r: UserRole): boolean {
    return r.expiresAt ? new Date(r.expiresAt) < new Date() : false;
  }
}
