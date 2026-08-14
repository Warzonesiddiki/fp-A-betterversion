import { describe, it, expect, vi } from 'vitest';
import { activateOnKey } from './a11yActivate';

type FakeEvent = {
  key: string;
  target: unknown;
  currentTarget: unknown;
  preventDefault: () => void;
};

function evt(key: string, opts: Partial<FakeEvent> = {}): FakeEvent {
  const el = { closest: () => null };
  return {
    key,
    target: opts.target ?? el,
    currentTarget: opts.currentTarget ?? el,
    preventDefault: opts.preventDefault ?? vi.fn(),
    ...opts,
  } as FakeEvent;
}

describe('activateOnKey', () => {
  it('fires the handler on Enter', () => {
    const fn = vi.fn();
    const el = { closest: () => null };
    activateOnKey(fn)(evt('Enter', { target: el, currentTarget: el }) as any);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('fires the handler on Space', () => {
    const fn = vi.fn();
    const el = { closest: () => null };
    activateOnKey(fn)(evt(' ', { target: el, currentTarget: el }) as any);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('prevents default on Space so the page does not scroll while activating', () => {
    const preventDefault = vi.fn();
    const el = { closest: () => null };
    activateOnKey(vi.fn())(evt(' ', { target: el, currentTarget: el, preventDefault }) as any);
    expect(preventDefault).toHaveBeenCalledTimes(1);
  });

  it('ignores every other key, including Tab and typing', () => {
    const fn = vi.fn();
    const el = { closest: () => null };
    for (const key of ['Tab', 'Escape', 'a', 'ArrowDown', 'Shift']) {
      activateOnKey(fn)(evt(key, { target: el, currentTarget: el }) as any);
    }
    expect(fn).not.toHaveBeenCalled();
  });

  it('does not double-fire when the key came from a nested button', () => {
    const fn = vi.fn();
    const row = { closest: () => null };
    const nestedButton = { closest: () => ({ tagName: 'BUTTON' }) };
    activateOnKey(fn)(evt('Enter', { target: nestedButton, currentTarget: row }) as any);
    expect(fn).not.toHaveBeenCalled();
  });

  it('still fires for a nested non-interactive descendant such as a text cell', () => {
    const fn = vi.fn();
    const row = { closest: () => null };
    // a <td> that matches nothing interactive
    const cell = { closest: () => null };
    activateOnKey(fn)(evt('Enter', { target: cell, currentTarget: row }) as any);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('fires when the closest interactive ancestor is the row itself', () => {
    const fn = vi.fn();
    const row: { closest: () => unknown } = { closest: () => null };
    const cell = { closest: () => row };
    activateOnKey(fn)(evt('Enter', { target: cell, currentTarget: row }) as any);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('passes the event through to the handler', () => {
    const fn = vi.fn();
    const el = { closest: () => null };
    const e = evt('Enter', { target: el, currentTarget: el });
    activateOnKey(fn)(e as any);
    expect(fn).toHaveBeenCalledWith(e);
  });
});
