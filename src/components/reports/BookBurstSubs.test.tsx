import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { EntityToggle } from './BookBurstSubs';

describe('BookBurstSubs', () => {
  it('renders without crashing', () => {
    const { container } = render(<EntityToggle />);
    expect(container).toBeDefined();
  });
});
