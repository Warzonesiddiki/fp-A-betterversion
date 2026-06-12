/* eslint-disable @typescript-eslint/no-unused-vars */
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { GridErrorBoundary } from './GridErrorBoundary';

describe('GridErrorBoundary', () => {
  it('renders without crashing', () => {
    const { container } = render(<GridErrorBoundary />);
    expect(container).toBeDefined();
  });
});
