import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { WaterfallChart } from './WaterfallChart';

describe('WaterfallChart', () => {
  it('renders without crashing', () => {
    const { container } = render(<WaterfallChart data={[{ label: 'Start', value: 100 }]} />);
    expect(container).toBeDefined();
  });
});
