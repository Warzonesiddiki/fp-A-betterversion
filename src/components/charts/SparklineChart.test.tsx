import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { SparklineChart } from './SparklineChart';

describe('SparklineChart', () => {
  it('renders without crashing', () => {
    const { container } = render(<SparklineChart data={[10, 20, 30, 40, 50]} />);
    expect(container).toBeDefined();
  });
});
