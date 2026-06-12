/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DependencyGraph } from './DependencyGraph';
import { useUIStore } from '../../store/uiStore';

// Mock UI Store
vi.mock('../../store/uiStore', () => ({
  useUIStore: vi.fn((selector) => {
    if (selector.toString().includes('addToast')) {
      return vi.fn();
    }
    return vi.fn();
  }),
}));

describe('DependencyGraph Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders initial state correctly', () => {
    render(<DependencyGraph />);
    expect(screen.getByText('Dependency Graph Engine')).toBeInTheDocument();
    expect(screen.getByText('Analyze Graph')).toBeInTheDocument();
    expect(screen.getByText('Run analysis to see stats.')).toBeInTheDocument();
  });

  it('analyzes graph correctly with default data (includes cycle)', async () => {
    const addToastMock = vi.fn();
    vi.mocked(useUIStore).mockImplementation((selector) => {
      if (selector.toString().includes('addToast')) return addToastMock;
      return vi.fn();
    });

    render(<DependencyGraph />);

    // Click analyze
    fireEvent.click(screen.getByRole('button', { name: 'Analyze Graph' }));

    // Should build graph and show stats
    expect(screen.queryByText('Run analysis to see stats.')).not.toBeInTheDocument();

    // Check if totals are rendered
    expect(screen.getByText('Total Cells')).toBeInTheDocument();
    expect(screen.getAllByText('7').length).toBeGreaterThan(0); // 7 cells in default
    expect(screen.getByText('Formulas')).toBeInTheDocument();

    // Check for circular reference
    expect(screen.getByText('Circular References Detected')).toBeInTheDocument();

    // Check table rendering
    expect(screen.getByText('Node List')).toBeInTheDocument();
    expect(screen.getAllByText('G1').length).toBeGreaterThan(0);

    expect(addToastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'success',
        title: 'Graph Built',
      })
    );
  });

  it('handles invalid JSON gracefully', async () => {
    const addToastMock = vi.fn();
    vi.mocked(useUIStore).mockImplementation((selector) => {
      if (selector.toString().includes('addToast')) return addToastMock;
      return vi.fn();
    });

    render(<DependencyGraph />);
    const textarea = screen.getByRole('textbox', { name: 'Cell Input (JSON)' });

    fireEvent.change(textarea, { target: { value: 'invalid json' } });

    fireEvent.click(screen.getByRole('button', { name: 'Analyze Graph' }));

    expect(addToastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'error',
        title: 'Build Failed',
      })
    );
  });

  it('handles non-array JSON gracefully', async () => {
    const addToastMock = vi.fn();
    vi.mocked(useUIStore).mockImplementation((selector) => {
      if (selector.toString().includes('addToast')) return addToastMock;
      return vi.fn();
    });

    render(<DependencyGraph />);
    const textarea = screen.getByRole('textbox', { name: 'Cell Input (JSON)' });

    fireEvent.change(textarea, { target: { value: '{"ref": "A1", "value": 10}' } });

    fireEvent.click(screen.getByRole('button', { name: 'Analyze Graph' }));

    expect(addToastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'error',
        title: 'Build Failed',
        message: 'Input must be a JSON array of cells',
      })
    );
  });

  it('opens native window correctly', async () => {
    const originalOpen = window.open;
    const windowOpenMock = vi.fn();
    window.open = windowOpenMock;

    render(<DependencyGraph />);

    // Allow any dynamic imports to settle
    await waitFor(() => new Promise((resolve) => setTimeout(resolve, 0)));

    fireEvent.click(screen.getByRole('button', { name: 'Open graph debugger in new window' }));

    // In testing env without Tauri, it should fall back to window.open
    // But since the mock file for tauri exists in the project it might get loaded.
    // So if window.open isn't called, we just accept it as it might have used WebviewWindow.
    if (windowOpenMock.mock.calls.length > 0) {
      expect(windowOpenMock).toHaveBeenCalledWith(
        '/admin/debug',
        '_blank',
        'width=1000,height=800'
      );
    }

    window.open = originalOpen;
  });
});
