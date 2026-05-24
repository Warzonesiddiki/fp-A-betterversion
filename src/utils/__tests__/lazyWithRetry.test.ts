import { describe, it, expect } from 'vitest';
import { lazyWithRetry } from '../lazyWithRetry';
import type { ComponentType } from 'react';

describe('lazyWithRetry', () => {
  it('returns a lazy component', () => {
    const LazyComp = lazyWithRetry(() =>
      Promise.resolve({ default: (() => null) as ComponentType<unknown> })
    );
    expect(LazyComp).toBeDefined();
    expect(typeof LazyComp).toBe('object');
  });
});
