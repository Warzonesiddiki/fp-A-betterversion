import { describe, it, expect } from 'vitest';
import { isFeatureEnabled, getFlag, getAllFlags, setFlagEnabled } from '../featureFlags';

describe('featureFlags', () => {
  it('isFeatureEnabled returns true for existing enabled flag', () => {
    expect(isFeatureEnabled('nlq-chat')).toBe(true);
  });

  it('isFeatureEnabled returns false for non-existent flag', () => {
    expect(isFeatureEnabled('non-existent')).toBe(false);
  });

  it('getFlag returns flag by key', () => {
    const flag = getFlag('nlq-chat');
    expect(flag).toBeDefined();
    expect(flag?.name).toBe('NLQ Chat');
  });

  it('getFlag returns undefined for missing flag', () => {
    expect(getFlag('missing')).toBeUndefined();
  });

  it('getAllFlags returns all flags', () => {
    const flags = getAllFlags();
    expect(flags.length).toBeGreaterThan(5);
  });

  it('setFlagEnabled toggles a flag', () => {
    setFlagEnabled('nlq-chat', false);
    expect(isFeatureEnabled('nlq-chat')).toBe(false);
    setFlagEnabled('nlq-chat', true);
    expect(isFeatureEnabled('nlq-chat')).toBe(true);
  });

  it('setFlagEnabled does nothing for missing flag', () => {
    expect(() => setFlagEnabled('missing', true)).not.toThrow();
  });

  it('respects role restrictions', () => {
    expect(isFeatureEnabled('plugin-system', 'admin')).toBe(true);
    expect(isFeatureEnabled('plugin-system', 'viewer')).toBe(false);
  });
});
