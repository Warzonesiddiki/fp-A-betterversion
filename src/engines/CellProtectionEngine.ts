/**
 * Cell Protection Engine — Lock/unlock cells, enforce edit permissions
 * Supports locked, hidden, and formula_only protection types
 */

export interface ProtectionRule {
  cellRef: string;
  type: 'locked' | 'hidden' | 'formula_only';
  reason: string;
  protectedBy: string;
  protectedAt: string;
}

export class CellProtectionEngine {
  private static rules = new Map<string, ProtectionRule>();

  static protect(
    cellRef: string,
    type: ProtectionRule['type'],
    userId: string,
    reason: string
  ): void {
    this.rules.set(cellRef, {
      cellRef,
      type,
      reason,
      protectedBy: userId,
      protectedAt: new Date().toISOString(),
    });
  }

  static unprotect(cellRef: string, userId: string): void {
    const rule = this.rules.get(cellRef);
    if (!rule) return;
    if (rule.protectedBy !== userId) {
      throw new Error(`Only ${rule.protectedBy} can unprotect cell ${cellRef}`);
    }
    this.rules.delete(cellRef);
  }

  static isProtected(cellRef: string): boolean {
    return this.rules.has(cellRef);
  }

  static getProtection(cellRef: string): ProtectionRule | undefined {
    return this.rules.get(cellRef);
  }

  static canEdit(cellRef: string, userId: string, userRole: string): boolean {
    const rule = this.rules.get(cellRef);
    if (!rule) return true;
    if (userRole === 'admin') return true;
    if (rule.protectedBy === userId) return true;
    if (rule.type === 'locked') return false;
    if (rule.type === 'formula_only') return false;
    if (rule.type === 'hidden') return false;
    return true;
  }

  static getProtectionSheet(): ProtectionRule[] {
    return Array.from(this.rules.values());
  }

  static protectRange(
    startRef: string,
    endRef: string,
    type: ProtectionRule['type'],
    userId: string,
    reason: string
  ): void {
    const startCol = startRef.match(/^([A-Z]+)/)?.[1] ?? 'A';
    const startRow = parseInt(startRef.match(/(\d+)$/)?.[1] ?? '1');
    const endCol = endRef.match(/^([A-Z]+)/)?.[1] ?? 'A';
    const endRow = parseInt(endRef.match(/(\d+)$/)?.[1] ?? '1');

    const startColCode = startCol.charCodeAt(0);
    const endColCode = endCol.charCodeAt(0);

    for (let col = startColCode; col <= endColCode; col++) {
      for (let row = startRow; row <= endRow; row++) {
        this.protect(`${String.fromCharCode(col)}${row}`, type, userId, reason);
      }
    }
  }

  static clear(): void {
    this.rules.clear();
  }
}
