import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { CopilotSidebar } from './CopilotSidebar';

describe('CopilotSidebar', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <MemoryRouter>
        <CopilotSidebar />
      </MemoryRouter>
    );
    expect(container).toBeDefined();
  });
});
