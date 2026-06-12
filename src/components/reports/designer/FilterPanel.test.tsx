/* eslint-disable @typescript-eslint/no-unused-vars */
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { FilterPanel } from './FilterPanel';

describe('FilterPanel', () => {
  it('renders without crashing', () => {
    const { container } = render(<FilterPanel />);
    expect(container).toBeDefined();
  });
});
