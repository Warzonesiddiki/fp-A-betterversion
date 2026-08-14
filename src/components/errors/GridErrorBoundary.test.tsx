import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { GridErrorBoundary } from './GridErrorBoundary';

describe('GridErrorBoundary', () => {
  it('renders its children when they do not throw', () => {
    render(
      <GridErrorBoundary>
        <p>healthy child</p>
      </GridErrorBoundary>
    );
    // A boundary that swallows its children is the failure mode worth catching;
    // asserting on the container alone would pass even if nothing rendered.
    expect(screen.getByText('healthy child')).toBeInTheDocument();
  });
});
