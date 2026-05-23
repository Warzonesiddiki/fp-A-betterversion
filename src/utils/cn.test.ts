import { describe, it, expect } from 'vitest';
import { cn } from './cn';

describe('cn utility', () => {
  it('merges single classes', () => {
    expect(cn('class1')).toBe('class1');
  });

  it('merges multiple classes', () => {
    expect(cn('class1', 'class2')).toBe('class1 class2');
  });

  it('handles conditional classes', () => {
    const truthy = true;
    const falsy = false;
    expect(cn('class1', truthy && 'class2', falsy && 'class3')).toBe('class1 class2');
  });

  it('merges tailwind classes correctly (tailwind-merge)', () => {
    // p-4 and p-8 should merge to p-8
    expect(cn('p-4', 'p-8')).toBe('p-8');
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
  });

  it('handles objects', () => {
    expect(cn({ class1: true, class2: false })).toBe('class1');
  });

  it('handles arrays', () => {
    expect(cn(['class1', 'class2'])).toBe('class1 class2');
  });

  it('handles empty inputs', () => {
    expect(cn()).toBe('');
    expect(cn(null, undefined, false, '')).toBe('');
  });
});
