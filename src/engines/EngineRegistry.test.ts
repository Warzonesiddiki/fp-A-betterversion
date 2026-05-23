import { describe, it, expect } from 'vitest';
import { engineRegistry } from './EngineRegistry';

describe('EngineRegistry', () => {
  it('exports engineRegistry instance', () => {
    expect(engineRegistry).toBeDefined();
  });

  it('has load method', () => {
    expect(typeof engineRegistry.load).toBe('function');
  });
});
