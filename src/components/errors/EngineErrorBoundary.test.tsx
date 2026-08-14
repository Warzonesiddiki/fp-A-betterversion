import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { EngineErrorBoundary } from './EngineErrorBoundary';

describe('EngineErrorBoundary', () => {
  it('renders its children when they do not throw', () => {
    render(
      <EngineErrorBoundary>
        <p>healthy child</p>
      </EngineErrorBoundary>
    );
    // A boundary that swallows its children is the failure mode worth catching;
    // asserting on the container alone would pass even if nothing rendered.
    expect(screen.getByText('healthy child')).toBeInTheDocument();
  });
});
