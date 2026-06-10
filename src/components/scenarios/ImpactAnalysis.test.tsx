import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ImpactAnalysis } from './ImpactAnalysis';

describe('ImpactAnalysis', () => {
  it('renders without crashing', () => {
    const { container } = render(<ImpactAnalysis />);
    expect(container).toBeDefined();
  });
});
