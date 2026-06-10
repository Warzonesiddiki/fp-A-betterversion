import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { VarianceChart } from './VarianceChart';

describe('VarianceChart', () => {
  it('renders without crashing', () => {
    const { container } = render(<VarianceChart />);
    expect(container).toBeDefined();
  });
});
