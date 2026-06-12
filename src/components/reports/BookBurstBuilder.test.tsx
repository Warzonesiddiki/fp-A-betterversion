/* eslint-disable @typescript-eslint/no-unused-vars */
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { BookBurstBuilder } from './BookBurstBuilder';

describe('BookBurstBuilder', () => {
  it('renders without crashing', () => {
    const { container } = render(<BookBurstBuilder />);
    expect(container).toBeDefined();
  });
});
