import { describe, it, expect } from 'vitest';
import { clearDemoData } from '../demoDataSeeder';

describe('demoDataSeeder', () => {
  it('clearDemoData does not throw', () => {
    expect(() => clearDemoData()).not.toThrow();
  });
});
