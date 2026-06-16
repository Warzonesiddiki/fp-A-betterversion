// src/__tests__/a11y/q5-5-motion-audit.test.tsx
// Q5.5 MOTION_AUDIT — useReducedMotion hook + global CSS override test
// Author: Artemis (handoff to Hera DRI) — T+4d 2026-06-26
// Reference: docs/a11y/Q5_5_MOTION_AUDIT_v0.1.md

import { describe, test, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useReducedMotion } from '../../hooks/useReducedMotion';

describe('Q5.5 useReducedMotion hook', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  test('returns true when prefers-reduced-motion: reduce', () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query === '(prefers-reduced-motion: reduce)',
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(true);
  });

  test('returns false when prefers-reduced-motion: no-preference', () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);
  });
});

describe('Q5.5 global CSS override', () => {
  test('accessibility.css includes prefers-reduced-motion @media block', async () => {
    const fs = await import('node:fs/promises');
    const path = await import('node:path');
    const cssPath = path.join(process.cwd(), 'src', 'styles', 'accessibility.css');
    const content = await fs.readFile(cssPath, 'utf-8');
    expect(content).toMatch(/@media\s+\(prefers-reduced-motion:\s*reduce\)/);
    expect(content).toMatch(/animation-duration:\s*0\.01ms/);
    expect(content).toMatch(/transition-duration:\s*0\.01ms/);
  });
});
