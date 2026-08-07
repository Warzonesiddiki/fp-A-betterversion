import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { FindReplaceDialog } from './FindReplaceDialog';

describe('FindReplaceDialog', () => {
  it('renders without crashing', () => {
    const { container } = render(<FindReplaceDialog />);
    expect(container).toBeDefined();
  });
});
