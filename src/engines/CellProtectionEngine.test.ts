import { describe, it, expect, beforeEach } from 'vitest';
import { CellProtectionEngine } from './CellProtectionEngine';

describe('CellProtectionEngine', () => {
  beforeEach(() => {
    CellProtectionEngine.clear();
  });

  describe('protect', () => {
    it('should protect a cell', () => {
      CellProtectionEngine.protect('A1', 'locked', 'user-1', 'test protection');
      expect(CellProtectionEngine.isProtected('A1')).toBe(true);
    });

    it('should protect a cell as hidden', () => {
      CellProtectionEngine.protect('B2', 'hidden', 'user-1', 'sensitive data');
      expect(CellProtectionEngine.isProtected('B2')).toBe(true);
    });

    it('should protect a cell as formula_only', () => {
      CellProtectionEngine.protect('C3', 'formula_only', 'user-1', 'formula lock');
      expect(CellProtectionEngine.isProtected('C3')).toBe(true);
    });

    it('should protect range', () => {
      CellProtectionEngine.protectRange('A1', 'C3', 'locked', 'user-1', 'range test');
      expect(CellProtectionEngine.isProtected('A1')).toBe(true);
      expect(CellProtectionEngine.isProtected('B2')).toBe(true);
      expect(CellProtectionEngine.isProtected('C3')).toBe(true);
    });
  });

  describe('unprotect', () => {
    it('should unprotect a cell', () => {
      CellProtectionEngine.protect('A1', 'locked', 'user-1', 'test');
      CellProtectionEngine.unprotect('A1', 'user-1');
      expect(CellProtectionEngine.isProtected('A1')).toBe(false);
    });

    it('should throw if wrong user tries to unprotect', () => {
      CellProtectionEngine.protect('A1', 'locked', 'user-1', 'test');
      expect(() => CellProtectionEngine.unprotect('A1', 'user-2')).toThrow();
    });
  });

  describe('canEdit', () => {
    it('should allow editing unprotected cells', () => {
      expect(CellProtectionEngine.canEdit('A1', 'user-1', 'viewer')).toBe(true);
    });

    it('should deny editing locked cells for non-owners', () => {
      CellProtectionEngine.protect('A1', 'locked', 'user-1', 'test');
      expect(CellProtectionEngine.canEdit('A1', 'user-2', 'viewer')).toBe(false);
    });

    it('should allow editing locked cells if user is owner', () => {
      CellProtectionEngine.protect('A1', 'locked', 'user-1', 'test');
      expect(CellProtectionEngine.canEdit('A1', 'user-1', 'viewer')).toBe(true);
    });

    it('should allow editing locked cells if user is admin', () => {
      CellProtectionEngine.protect('A1', 'locked', 'user-1', 'test');
      expect(CellProtectionEngine.canEdit('A1', 'user-2', 'admin')).toBe(true);
    });
  });

  describe('getProtectionSheet', () => {
    it('should return protection rules array', () => {
      CellProtectionEngine.protect('A1', 'locked', 'user-1', 'test');
      CellProtectionEngine.protect('B2', 'hidden', 'user-1', 'sensitive');
      const sheet = CellProtectionEngine.getProtectionSheet();
      expect(sheet).toHaveLength(2);
      expect(sheet![0]!.cellRef).toBe('A1');
      expect(sheet![0]!.type).toBe('locked');
      expect(sheet![1]!.cellRef).toBe('B2');
      expect(sheet![1]!.type).toBe('hidden');
    });
  });

  describe('getProtection', () => {
    it('should return protection rule for a cell', () => {
      CellProtectionEngine.protect('A1', 'locked', 'user-1', 'test');
      const rule = CellProtectionEngine.getProtection('A1');
      expect(rule).toBeDefined();
      expect(rule!.cellRef).toBe('A1');
      expect(rule!.type).toBe('locked');
      expect(rule!.protectedBy).toBe('user-1');
      expect(rule!.reason).toBe('test');
    });

    it('should return undefined for unprotected cell', () => {
      expect(CellProtectionEngine.getProtection('Z99')).toBeUndefined();
    });
  });

  describe('clear', () => {
    it('should remove all protections', () => {
      CellProtectionEngine.protect('A1', 'locked', 'user-1', 'test');
      CellProtectionEngine.protect('B2', 'hidden', 'user-1', 'test');
      CellProtectionEngine.clear();
      expect(CellProtectionEngine.isProtected('A1')).toBe(false);
      expect(CellProtectionEngine.isProtected('B2')).toBe(false);
    });
  });
});
