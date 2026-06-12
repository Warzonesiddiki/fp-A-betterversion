/* eslint-disable @typescript-eslint/no-unused-vars */
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ConsolidationWorksheet } from './ConsolidationWorksheet';

describe('ConsolidationWorksheet', () => {
  it('renders without crashing', () => {
    const { container } = render(<ConsolidationWorksheet />);
    expect(container).toBeDefined();
  });
});
