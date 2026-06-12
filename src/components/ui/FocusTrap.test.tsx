/* eslint-disable @typescript-eslint/no-unused-vars */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/testUtils';
import { FocusTrap } from './FocusTrap';

describe('FocusTrap', () => {
  it('renders children when active', () => {
    render(
      <FocusTrap active>
        <input aria-label="Trapped" />
      </FocusTrap>
    );
    expect(screen.getByLabelText('Trapped')).toBeInTheDocument();
  });

  it('renders children when inactive', () => {
    render(
      <FocusTrap active={false}>
        <input aria-label="Free" />
      </FocusTrap>
    );
    expect(screen.getByLabelText('Free')).toBeInTheDocument();
  });
});
