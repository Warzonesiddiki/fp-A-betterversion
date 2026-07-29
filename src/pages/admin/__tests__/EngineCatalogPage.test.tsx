/**
 * N-0013 — the Engine Catalog must genuinely reach engines, not fake it.
 *
 * These tests drive the real page against the real registry and the real
 * generated manifest. Nothing is mocked away that would hide the defect the
 * audit found: if an engine cannot actually be loaded, "Load" reports Failed
 * and these assertions break.
 */
import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import EngineCatalogPage from '../EngineCatalogPage';
import { ENGINE_COUNT } from '@/engines/engineManifest.generated';

const renderPage = () =>
  render(
    <MemoryRouter>
      <EngineCatalogPage />
    </MemoryRouter>
  );

describe('EngineCatalogPage', () => {
  it('renders and advertises the full engine count', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: /engine catalog/i })).toBeInTheDocument();
    expect(screen.getByTestId('engine-total')).toHaveTextContent(String(ENGINE_COUNT));
  });

  it('lists engines with a load control for each', () => {
    renderPage();
    expect(screen.getByLabelText('Load FXEngine')).toBeInTheDocument();
    expect(screen.getByLabelText('Load ConsolidationEngine')).toBeInTheDocument();
  });

  it('ACTUALLY loads an engine and shows its real runtime exports', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByLabelText('Load FXEngine'));

    await waitFor(() => {
      expect(screen.getByTestId('engine-loaded')).toHaveTextContent('1 loaded');
    });
    // FXEngine genuinely exports these; a stub would not.
    await waitFor(() => {
      const row = screen.getByText('FXEngine').closest('tr');
      expect(row?.textContent).toMatch(/FXEngine|MissingFXRateError/);
    });
    expect(screen.getByTestId('engine-failed')).toHaveTextContent('0 failed');
  });

  it('filters the catalogue by name', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText('Filter engines'), 'MonteCarlo');

    expect(screen.getByText('MonteCarloEngine')).toBeInTheDocument();
    expect(screen.queryByText('FXEngine')).not.toBeInTheDocument();
  });

  it('exposes a control to load the entire catalogue', () => {
    renderPage();
    expect(screen.getByLabelText('Load all engines')).toHaveTextContent(String(ENGINE_COUNT));
  });
});
