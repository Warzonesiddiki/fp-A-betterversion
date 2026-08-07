import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ICReconciliation } from './ICReconciliation';

describe('ICReconciliation', () => {
  it('renders without crashing', () => {
    const { container } = render(<ICReconciliation />);
    expect(container).toBeDefined();
  });
});
