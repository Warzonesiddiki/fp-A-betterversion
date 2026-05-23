import { expect } from 'vitest';
import { screen } from '@testing-library/react';

export function expectHasRole(role: string) {
  const el = screen.getByRole(role);
  expect(el).toBeInTheDocument();
  return el;
}

export function expectHasAriaLabel(label: string) {
  const el = screen.getByLabelText(label);
  expect(el).toBeInTheDocument();
  return el;
}

export function expectFocusable(element: HTMLElement) {
  element.focus();
  expect(document.activeElement).toBe(element);
}

export function expectKeyboardAccessible(element: HTMLElement, key: string, callback: () => void) {
  element.focus();
  element.addEventListener('keydown', (e) => {
    if (e.key === key) callback();
  });
  element.dispatchEvent(new KeyboardEvent('keydown', { key }));
}
