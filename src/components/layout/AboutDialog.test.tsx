import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { AboutDialog } from './AboutDialog';

describe('AboutDialog', () => {
  it('renders without crashing', () => {
    const { container } = render(<AboutDialog isOpen={true} onClose={() => {}} />);
    expect(container).toBeDefined();
  });
});
