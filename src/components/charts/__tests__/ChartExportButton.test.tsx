import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/testUtils';
import { ChartExportButton } from '../ChartExportButton';
import { createRef } from 'react';

vi.mock('lucide-react', () => {
  const makeIcon = (name: string) => {
    const Icon = (props: any) => <span data-testid={`icon-${name}`} {...props} />;
    Icon.displayName = name;
    return Icon;
  };
  return { Image: makeIcon('Image'), FileImage: makeIcon('FileImage') };
});

vi.mock('@/components/ui/Button', () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}));

describe('ChartExportButton', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders export buttons', () => {
    const ref = createRef<HTMLDivElement>();
    render(<ChartExportButton chartRef={ref} />);
    expect(screen.getByLabelText('Export as SVG')).toBeTruthy();
    expect(screen.getByLabelText('Export as PNG')).toBeTruthy();
  });
});
