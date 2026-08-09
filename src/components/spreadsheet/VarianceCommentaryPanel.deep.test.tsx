import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VarianceCommentaryPanel } from './VarianceCommentaryPanel';

describe('VarianceCommentaryPanel (deep tests)', () => {
  const mockWriteText = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    mockWriteText.mockClear();
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: mockWriteText,
      },
      writable: true,
      configurable: true,
    });
  });

  it('renders variance badge, auto-commentary, and templates when expanded', () => {
    render(
      <VarianceCommentaryPanel
        actual={120000}
        budget={100000}
        category="Software Subscriptions"
        period="2026 Q3"
        priorYear={90000}
        drivers={['New Enterprise Tier', 'Higher Seat Volume']}
        onInsert={vi.fn()}
      />
    );

    expect(screen.getByText('Variance Commentary')).toBeInTheDocument();
    expect(screen.getByText('+20.0%')).toBeInTheDocument();
    expect(screen.getByText('Auto-Generated')).toBeInTheDocument();
    expect(screen.getByText('Templates')).toBeInTheDocument();
  });

  it('toggles accordion expansion on header click', async () => {
    const user = userEvent.setup();
    render(
      <VarianceCommentaryPanel
        actual={120000}
        budget={100000}
        category="Revenue"
        period="2026 Q3"
        onInsert={vi.fn()}
      />
    );

    const toggleBtn = screen.getByRole('button', { name: /variance commentary/i });
    expect(toggleBtn).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Auto-Generated')).toBeInTheDocument();

    await user.click(toggleBtn);
    expect(toggleBtn).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('Auto-Generated')).not.toBeInTheDocument();

    await user.click(toggleBtn);
    expect(toggleBtn).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Auto-Generated')).toBeInTheDocument();
  });

  it('handles inserting and copying auto-generated commentary', async () => {
    const user = userEvent.setup();
    const spy = vi.spyOn(navigator.clipboard, 'writeText');
    const onInsert = vi.fn();

    render(
      <VarianceCommentaryPanel
        actual={80000}
        budget={100000}
        category="Professional Services"
        period="2026 Q3"
        onInsert={onInsert}
      />
    );

    // Insert auto commentary
    const insertBtn = screen.getByRole('button', { name: 'Insert auto-generated commentary' });
    await user.click(insertBtn);
    expect(onInsert).toHaveBeenCalledTimes(1);
    expect(onInsert.mock.calls[0]![0]).toMatch(/Professional Services/i);

    // Copy auto commentary
    const copyBtn = screen.getByRole('button', { name: 'Copy auto-generated commentary' });
    await user.click(copyBtn);
    expect(spy).toHaveBeenCalledWith(onInsert.mock.calls[0]![0]);
  });

  it('handles using a template from the template library', async () => {
    const user = userEvent.setup();
    const onInsert = vi.fn();

    render(
      <VarianceCommentaryPanel
        actual={150000}
        budget={120000}
        category="Marketing"
        period="2026 Q3"
        drivers={['Google Ads expansion']}
        onInsert={onInsert}
      />
    );

    // Click "Use" button on the first template
    const useButtons = screen.getAllByRole('button', { name: /insert .* template/i });
    expect(useButtons.length).toBeGreaterThan(0);

    await user.click(useButtons[0]!);
    expect(onInsert).toHaveBeenCalledTimes(1);
    expect(onInsert.mock.calls[0]![0]).toBeDefined();
  });

  it('handles non-finite NaN inputs gracefully without throwing', () => {
    render(
      <VarianceCommentaryPanel
        actual={NaN}
        budget={NaN}
        category="Corrupted Data"
        period="2026 Q3"
        onInsert={vi.fn()}
      />
    );

    expect(screen.getByText('Variance Commentary')).toBeInTheDocument();
    expect(screen.getByText('+0.0%')).toBeInTheDocument();
  });
});
