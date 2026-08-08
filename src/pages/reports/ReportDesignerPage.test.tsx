import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import ReportDesignerPage from './ReportDesignerPage';
import { useCubeStore } from '@/store/cubeStore';

const renderPage = () =>
  render(
    <MemoryRouter>
      <ReportDesignerPage />
    </MemoryRouter>
  );

describe('ReportDesignerPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useCubeStore.setState({ isInitialized: true });
  });

  it('renders the report designer immediately when already initialized', () => {
    renderPage();
    expect(screen.getByText('Build Your Report')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
  });

  it('calls initialize when the cube engine is not initialized yet', () => {
    const initializeSpy = vi.spyOn(useCubeStore.getState(), 'initialize');
    useCubeStore.setState({ isInitialized: false });
    renderPage();

    expect(initializeSpy).toHaveBeenCalledTimes(1);
    // Once initialize() runs (sets isInitialized: true), the designer renders
    expect(screen.getByText('Build Your Report')).toBeInTheDocument();
  });

  it('surfaces the initialization error when initialize throws', () => {
    const failingInitialize = vi.fn(() => {
      throw new Error('Cube engine failed to boot');
    });
    useCubeStore.setState({ isInitialized: false, initialize: failingInitialize });
    renderPage();

    expect(failingInitialize).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Cube engine failed to boot')).toBeInTheDocument();
  });
});
