/* eslint-disable @typescript-eslint/no-unused-vars */
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { WidgetLibrary } from './WidgetLibrary';

describe('WidgetLibrary', () => {
  it('renders without crashing', () => {
    const { container } = render(<WidgetLibrary />);
    expect(container).toBeDefined();
  });
});
