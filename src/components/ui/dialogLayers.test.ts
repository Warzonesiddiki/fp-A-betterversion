/**
 * W6-P0-08 stacked-Escape coordination: tiny LIFO registry of open dialog
 * layers shared by Modal and ConfirmDialog so Escape only dismisses the
 * topmost layer. Unit-pinned here; component-level truth lives in
 * ConfirmDialog.test.tsx ("confirm over Modal" case).
 */
import { describe, it, expect } from 'vitest';
import { isTopDialogLayer, popDialogLayer, pushDialogLayer } from './dialogLayers';

describe('dialogLayers', () => {
  it('tracks LIFO order and pops arbitrary members safely', () => {
    const a = pushDialogLayer();
    const b = pushDialogLayer();
    expect(isTopDialogLayer(b)).toBe(true);
    expect(isTopDialogLayer(a)).toBe(false);

    // Popping a non-top member still removes exactly that member.
    popDialogLayer(a);
    expect(isTopDialogLayer(a)).toBe(false);
    expect(isTopDialogLayer(b)).toBe(true);
    popDialogLayer(b);

    // Unknown ids are no-ops; ids are never reused.
    popDialogLayer(999_999);
    const c = pushDialogLayer();
    expect(c).not.toBe(a);
    expect(c).not.toBe(b);
    expect(isTopDialogLayer(c)).toBe(true);
    popDialogLayer(c);
  });
});
