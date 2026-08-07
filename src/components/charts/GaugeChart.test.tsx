import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { GaugeChart } from './GaugeChart';

describe('GaugeChart', () => {
  it('renders without crashing', () => {
    const { container } = render(<GaugeChart value={50} />);
    expect(container).toBeDefined();
  });
});
