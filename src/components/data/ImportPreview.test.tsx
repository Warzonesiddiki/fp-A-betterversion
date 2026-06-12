/* eslint-disable @typescript-eslint/no-unused-vars */
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ImportPreview } from './ImportPreview';

describe('ImportPreview', () => {
  it('renders without crashing', () => {
    const { container } = render(<ImportPreview />);
    expect(container).toBeDefined();
  });
});
