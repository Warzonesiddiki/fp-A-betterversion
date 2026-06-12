/* eslint-disable @typescript-eslint/no-unused-vars */
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { StepDownConfigPanel } from './StepDownConfigPanel';

describe('StepDownConfigPanel', () => {
  it('renders without crashing', () => {
    const { container } = render(<StepDownConfigPanel />);
    expect(container).toBeDefined();
  });
});
