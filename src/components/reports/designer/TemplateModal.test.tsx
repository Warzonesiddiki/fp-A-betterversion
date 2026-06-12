/* eslint-disable @typescript-eslint/no-unused-vars */
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { TemplateModal } from './TemplateModal';

describe('TemplateModal', () => {
  it('renders without crashing', () => {
    const { container } = render(<TemplateModal />);
    expect(container).toBeDefined();
  });
});
