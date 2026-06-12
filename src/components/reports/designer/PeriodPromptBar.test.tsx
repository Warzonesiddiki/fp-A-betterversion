/* eslint-disable @typescript-eslint/no-unused-vars */
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { PeriodPromptBar } from './PeriodPromptBar';

describe('PeriodPromptBar', () => {
  it('renders without crashing', () => {
    const { container } = render(<PeriodPromptBar />);
    expect(container).toBeDefined();
  });
});
