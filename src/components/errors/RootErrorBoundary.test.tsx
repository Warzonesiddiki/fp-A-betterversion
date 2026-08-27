/**
 * @vitest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RootErrorBoundary } from './RootErrorBoundary';

const mockWriteText = vi.fn().mockResolvedValue(undefined);

function Crasher(): never {
  throw new Error('boom: root crash drill');
}

describe('RootErrorBoundary', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    mockWriteText.mockClear();
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: mockWriteText },
      configurable: true,
      writable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders its children when they do not throw', () => {
    render(
      <RootErrorBoundary>
        <p>healthy child</p>
      </RootErrorBoundary>
    );
    expect(screen.getByText('healthy child')).toBeInTheDocument();
  });

  it('shows the standalone full-screen fallback with app name, message and error id', () => {
    render(
      <RootErrorBoundary>
        <Crasher />
      </RootErrorBoundary>
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('FinPlan Pro')).toBeInTheDocument();
    expect(screen.getByText(/boom: root crash drill/)).toBeInTheDocument();
    expect(screen.getByText(/Error ID:/)).toBeInTheDocument();
  });

  it('offers Reload and Copy details escapes', async () => {
    const user = userEvent.setup();
    // user-event setup() installs its own clipboard stub, so bind our spy
    // to navigator AFTER setup — otherwise the component writes elsewhere.
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: mockWriteText },
      configurable: true,
      writable: true,
    });

    render(
      <RootErrorBoundary>
        <Crasher />
      </RootErrorBoundary>
    );

    // jsdom marks window.location as unforgeable, so the reload call itself
    // cannot be intercepted here — asserting the escape hatch exists.
    expect(screen.getByRole('button', { name: 'Reload' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Copy error details' }));
    expect(mockWriteText).toHaveBeenCalledTimes(1);
    const payload = JSON.parse(mockWriteText.mock.calls[0]![0] as string);
    expect(payload.app).toBe('FinPlan Pro');
    expect(payload.message).toBe('boom: root crash drill');
    expect(payload.errorId).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Copy error details' })).toHaveTextContent('Copied');
  });
});
