import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { SectorDashboard } from './SectorDashboard';

describe('SectorDashboard', () => {
  it('renders without crashing', () => {
    const { container } = render(<SectorDashboard />);
    expect(container).toBeDefined();
  });
});
