/* eslint-disable @typescript-eslint/no-unused-vars */
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { DrillThroughChain } from './DrillThroughChain';

describe('DrillThroughChain', () => {
  it('renders without crashing', () => {
    const { container } = render(<DrillThroughChain />);
    expect(container).toBeDefined();
  });
});
