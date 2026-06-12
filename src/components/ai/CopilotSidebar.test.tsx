/* eslint-disable @typescript-eslint/no-unused-vars */
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { CopilotSidebar } from './CopilotSidebar';

describe('CopilotSidebar', () => {
  it('renders without crashing', () => {
    const { container } = render(<CopilotSidebar />);
    expect(container).toBeDefined();
  });
});
