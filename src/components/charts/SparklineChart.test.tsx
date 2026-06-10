import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { SparklineChart } from './SparklineChart';

describe('SparklineChart', () => {
  it('renders without crashing', () => {
    const { container } = render(<SparklineChart />);
    expect(container).toBeDefined();
  });
});
