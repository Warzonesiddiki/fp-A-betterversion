/* eslint-disable @typescript-eslint/no-unused-vars */
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ConditionalFormatRules } from './ConditionalFormatRules';

describe('ConditionalFormatRules', () => {
  it('renders without crashing', () => {
    const { container } = render(<ConditionalFormatRules />);
    expect(container).toBeDefined();
  });
});
