import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ComboChart } from './ComboChart';

describe('ComboChart', () => {
  it('renders without crashing', () => {
    const { container } = render(<ComboChart />);
    expect(container).toBeDefined();
  });
});
