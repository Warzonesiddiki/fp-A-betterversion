import { describe, it, expect } from 'vitest';
import { RBACEngine } from './RBACEngine';

/**
 * GOVERNANCE EVIDENCE for cap:govern.rbac
 *
 * The RBACEngine manages role assignment, permission checks, and entity
 * scoping. The governance dimension here is AUTHORIZATION — access must be
 * denied by default, role assignment must be revocable, and permission
 * checks must be deterministic. If permission checks are wrong, unauthorized
 * users could access financial data.
 *
 * Tested dimensions:
 * 1. Role assignment and revocation
 * 2. Permission checks (deny by default)
 * 3. Entity-level scoping
 * 4. Highest role resolution
 * 5. Determinism
 */

describe('RBACEngine — GOVERNANCE (govern.rbac)', () => {

  describe('1. Role assignment and revocation', () => {

    it('assignRole adds a role to a user', () => {
      const engine = new RBACEngine();
      engine.assignRole('user1', 'analyst', ['ENT-001'], 'admin@finplan.test');
      const roles = engine.getUserRoles('user1');
      expect(roles).toHaveLength(1);
      expect(roles[0].role).toBe('analyst');
      expect(roles[0].userId).toBe('user1');
    });

    it('assignRole can assign multiple roles', () => {
      const engine = new RBACEngine();
      engine.assignRole('user1', 'analyst', ['ENT-001'], 'admin@finplan.test');
      engine.assignRole('user1', 'manager', ['ENT-001'], 'admin@finplan.test');
      const roles = engine.getUserRoles('user1');
      expect(roles).toHaveLength(2);
    });

    it('assignRole with same role replaces existing assignment', () => {
      const engine = new RBACEngine();
      engine.assignRole('user1', 'analyst', ['ENT-001'], 'admin@finplan.test');
      engine.assignRole('user1', 'analyst', ['ENT-002'], 'admin@finplan.test');
      const roles = engine.getUserRoles('user1').filter(r => r.role === 'analyst');
      expect(roles).toHaveLength(1);
      expect(roles[0].entities).toEqual(['ENT-002']);
    });

    it('revokeRole removes a role from a user', () => {
      const engine = new RBACEngine();
      engine.assignRole('user1', 'analyst', ['ENT-001'], 'admin@finplan.test');
      engine.assignRole('user1', 'manager', ['ENT-001'], 'admin@finplan.test');
      engine.revokeRole('user1', 'analyst');
      const roles = engine.getUserRoles('user1');
      expect(roles).toHaveLength(1);
      expect(roles[0].role).toBe('manager');
    });

    it('revokeRole returns true for existing role, false for nonexistent', () => {
      const engine = new RBACEngine();
      engine.assignRole('user1', 'analyst', ['ENT-001'], 'admin@finplan.test');
      expect(engine.revokeRole('user1', 'analyst')).toBe(true);
      expect(engine.revokeRole('user1', 'admin')).toBe(false);
    });

    it('getUserRoles returns empty array for unknown user', () => {
      const engine = new RBACEngine();
      expect(engine.getUserRoles('unknown')).toHaveLength(0);
    });
  });

  describe('2. Permission checks (deny by default)', () => {

    it('hasPermission denies access for unknown user', () => {
      const engine = new RBACEngine();
      expect(engine.hasPermission('unknown', 'data', 'read')).toBe(false);
    });

    it('hasPermission denies access for user with insufficient role', () => {
      const engine = new RBACEngine();
      engine.assignRole('user1', 'viewer', ['ENT-001'], 'admin@finplan.test');
      // viewer can read budget and report, but not write data
      expect(engine.hasPermission('user1', 'data', 'write')).toBe(false);
    });

    it('hasPermission allows analyst data read', () => {
      const engine = new RBACEngine();
      engine.assignRole('user1', 'analyst', ['ENT-001'], 'admin@finplan.test');
      expect(engine.hasPermission('user1', 'data', 'read')).toBe(true);
    });

    it('hasPermission allows analyst data write', () => {
      const engine = new RBACEngine();
      engine.assignRole('user1', 'analyst', ['ENT-001'], 'admin@finplan.test');
      expect(engine.hasPermission('user1', 'data', 'write')).toBe(true);
    });

    it('hasPermission denies analyst data delete', () => {
      const engine = new RBACEngine();
      engine.assignRole('user1', 'analyst', ['ENT-001'], 'admin@finplan.test');
      expect(engine.hasPermission('user1', 'data', 'delete')).toBe(false);
    });

    it('hasPermission allows admin all actions on all resources', () => {
      const engine = new RBACEngine();
      engine.assignRole('user1', 'admin', ['*'], 'admin@finplan.test');
      expect(engine.hasPermission('user1', 'data', 'read')).toBe(true);
      expect(engine.hasPermission('user1', 'data', 'write')).toBe(true);
      expect(engine.hasPermission('user1', 'data', 'delete')).toBe(true);
      expect(engine.hasPermission('user1', 'data', 'approve')).toBe(true);
    });

    it('hasPermission allows viewer budget read', () => {
      const engine = new RBACEngine();
      engine.assignRole('user1', 'viewer', ['ENT-001'], 'admin@finplan.test');
      expect(engine.hasPermission('user1', 'budget', 'read')).toBe(true);
    });

    it('hasPermission denies viewer budget write', () => {
      const engine = new RBACEngine();
      engine.assignRole('user1', 'viewer', ['ENT-001'], 'admin@finplan.test');
      expect(engine.hasPermission('user1', 'budget', 'write')).toBe(false);
    });
  });

  describe('3. Entity-level scoping', () => {

    it('hasPermission respects entity scoping — wrong entity denied', () => {
      const engine = new RBACEngine();
      engine.assignRole('user1', 'analyst', ['ENT-001'], 'admin@finplan.test');
      expect(engine.hasPermission('user1', 'data', 'read', { entityId: 'ENT-002' })).toBe(false);
    });

    it('hasPermission respects entity scoping — matching entity allowed', () => {
      const engine = new RBACEngine();
      engine.assignRole('user1', 'analyst', ['ENT-001'], 'admin@finplan.test');
      expect(engine.hasPermission('user1', 'data', 'read', { entityId: 'ENT-001' })).toBe(true);
    });

    it('hasPermission with wildcard entity allows all entities', () => {
      const engine = new RBACEngine();
      engine.assignRole('user1', 'admin', ['*'], 'admin@finplan.test');
      expect(engine.hasPermission('user1', 'data', 'read', { entityId: 'ENT-999' })).toBe(true);
    });

    it('hasPermission without context ignores entity scoping', () => {
      const engine = new RBACEngine();
      engine.assignRole('user1', 'analyst', ['ENT-001'], 'admin@finplan.test');
      // No context means no entity check
      expect(engine.hasPermission('user1', 'data', 'read')).toBe(true);
    });
  });

  describe('4. Highest role resolution', () => {

    it('getHighestRole returns the highest role for multi-role users', () => {
      const engine = new RBACEngine();
      engine.assignRole('user1', 'viewer', ['ENT-001'], 'admin@finplan.test');
      engine.assignRole('user1', 'analyst', ['ENT-001'], 'admin@finplan.test');
      engine.assignRole('user1', 'manager', ['ENT-001'], 'admin@finplan.test');
      const highest = engine.getHighestRole('user1');
      expect(highest).toBe('manager');
    });

    it('getHighestRole returns null for unknown user', () => {
      const engine = new RBACEngine();
      expect(engine.getHighestRole('unknown')).toBeNull();
    });

    it('getHighestRole returns admin when admin is assigned', () => {
      const engine = new RBACEngine();
      engine.assignRole('user1', 'analyst', ['ENT-001'], 'admin@finplan.test');
      engine.assignRole('user1', 'admin', ['ENT-001'], 'admin@finplan.test');
      const highest = engine.getHighestRole('user1');
      expect(highest).toBe('admin');
    });
  });

  describe('5. Determinism', () => {

    it('permission checks are deterministic', () => {
      const engine = new RBACEngine();
      engine.assignRole('user1', 'analyst', ['ENT-001'], 'admin@finplan.test');
      const r1 = engine.hasPermission('user1', 'data', 'read');
      const r2 = engine.hasPermission('user1', 'data', 'read');
      expect(r1).toBe(r2);
    });

    it('role assignment is deterministic', () => {
      const engine1 = new RBACEngine();
      const engine2 = new RBACEngine();
      engine1.assignRole('user1', 'analyst', ['ENT-001'], 'admin@finplan.test');
      engine2.assignRole('user1', 'analyst', ['ENT-001'], 'admin@finplan.test');
      expect(engine1.getUserRoles('user1').map(r => r.role)).toEqual(
        engine2.getUserRoles('user1').map(r => r.role)
      );
    });

    it('highest role resolution is deterministic', () => {
      const engine1 = new RBACEngine();
      const engine2 = new RBACEngine();
      engine1.assignRole('user1', 'viewer', ['ENT-001'], 'admin@finplan.test');
      engine1.assignRole('user1', 'manager', ['ENT-001'], 'admin@finplan.test');
      engine2.assignRole('user1', 'viewer', ['ENT-001'], 'admin@finplan.test');
      engine2.assignRole('user1', 'manager', ['ENT-001'], 'admin@finplan.test');
      expect(engine1.getHighestRole('user1')).toBe(engine2.getHighestRole('user1'));
    });
  });
});
