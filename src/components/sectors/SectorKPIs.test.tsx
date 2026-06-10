import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { SectorKPIs } from './SectorKPIs';

describe('SectorKPIs', () => {
  it('renders without crashing', () => {
    const { container } = render(<SectorKPIs />);
    expect(container).toBeDefined();
  });
});
