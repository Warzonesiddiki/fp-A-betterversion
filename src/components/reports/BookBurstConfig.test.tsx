import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { BookBurstConfig } from './BookBurstConfig';

describe('BookBurstConfig', () => {
  it('renders without crashing', () => {
    const { container } = render(<BookBurstConfig />);
    expect(container).toBeDefined();
  });
});
