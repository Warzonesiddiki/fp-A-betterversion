import { describe, it, expect } from 'vitest';
import { pageTransition, fadeIn, slideIn, scaleIn, pulse, staggerChildren } from '../animations';

describe('animations', () => {
  it('pageTransition returns reduced when true', () => {
    expect(pageTransition(true)).toEqual({ transition: 'none', animation: 'none' });
  });

  it('pageTransition returns normal when false', () => {
    expect(pageTransition(false)).toEqual({ transition: 'opacity 0.2s ease, transform 0.2s ease' });
  });

  it('fadeIn returns reduced when true', () => {
    expect(fadeIn(true)).toEqual({ transition: 'none', animation: 'none' });
  });

  it('fadeIn returns animation when false', () => {
    expect(fadeIn(false)).toEqual({ animation: 'fadeIn 0.2s ease forwards' });
  });

  it('slideIn returns correct direction', () => {
    const r = slideIn('left');
    expect(r).toEqual({ animation: 'slideInLeft 0.2s ease forwards' });
  });

  it('slideIn defaults to right', () => {
    const r = slideIn();
    expect(r).toEqual({ animation: 'slideInRight 0.2s ease forwards' });
  });

  it('slideIn respects reduced motion', () => {
    expect(slideIn('up', true)).toEqual({ transition: 'none', animation: 'none' });
  });

  it('scaleIn returns normal animation', () => {
    expect(scaleIn(false)).toEqual({ animation: 'scaleIn 0.15s ease forwards' });
  });

  it('pulse returns infinite animation', () => {
    expect(pulse(false)).toEqual({ animation: 'pulse 1.5s ease-in-out infinite' });
  });

  it('staggerChildren returns correct delay', () => {
    const r = staggerChildren(3);
    expect(r.animation).toBe('fadeIn 0.2s ease forwards');
    expect(r.animationDelay).toBe('60ms');
  });

  it('staggerChildren respects reduced motion', () => {
    expect(staggerChildren(0, true)).toEqual({ transition: 'none', animation: 'none' });
  });
});
