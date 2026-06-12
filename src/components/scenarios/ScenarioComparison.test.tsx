/* eslint-disable @typescript-eslint/no-unused-vars */
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ScenarioComparison } from './ScenarioComparison';

describe('ScenarioComparison', () => {
  it('renders without crashing', () => {
    const { container } = render(<ScenarioComparison />);
    expect(container).toBeDefined();
  });
});
