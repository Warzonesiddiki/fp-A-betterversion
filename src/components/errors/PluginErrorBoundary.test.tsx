import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { PluginErrorBoundary } from './PluginErrorBoundary';

describe('PluginErrorBoundary', () => {
  it('renders its children when they do not throw', () => {
    render(
      <PluginErrorBoundary>
        <p>healthy child</p>
      </PluginErrorBoundary>
    );
    // A boundary that swallows its children is the failure mode worth catching;
    // asserting on the container alone would pass even if nothing rendered.
    expect(screen.getByText('healthy child')).toBeInTheDocument();
  });
});
