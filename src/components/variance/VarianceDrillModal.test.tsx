import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { VarianceDrillModal } from './VarianceDrillModal';

describe('VarianceDrillModal', () => {
  it('renders without crashing', () => {
    const { container } = render(<VarianceDrillModal />);
    expect(container).toBeDefined();
  });
});
