/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  TemplateMarketplace,
  type ReportTemplate,
  type TemplateMarketplaceProps,
} from './TemplateMarketplace';

vi.mock('@/components/ui/Card', () => ({
  Card: ({
    children,
    className,
    onClick,
    ...rest
  }: React.PropsWithChildren<{ className?: string; onClick?: () => void }>) => (
    <div
      data-testid="card"
      className={className}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter') onClick();
            }
          : undefined
      }
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      {...rest}
    >
      {children}
    </div>
  ),
}));

vi.mock('@/components/ui/Badge', () => ({
  Badge: ({ children, variant }: { children: React.ReactNode; variant?: string }) => (
    <span data-testid="badge" data-variant={variant}>
      {children}
    </span>
  ),
}));

function createTemplate(overrides: Partial<ReportTemplate> = {}): ReportTemplate {
  return {
    id: 'tmpl-1',
    name: 'Income Statement',
    description: 'Standard income statement template',
    category: 'Financial',
    ...overrides,
  };
}

function renderTemplateMarketplace(props: Partial<TemplateMarketplaceProps> = {}) {
  const defaultProps: TemplateMarketplaceProps = {
    templates: [createTemplate()],
    onSelect: vi.fn(),
    ...props,
  };
  return render(<TemplateMarketplace {...defaultProps} />);
}

describe('TemplateMarketplace', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing with templates', () => {
    renderTemplateMarketplace();
  });

  it('renders empty state when no templates', () => {
    renderTemplateMarketplace({ templates: [] });
    expect(screen.getByText('No templates available')).toBeInTheDocument();
  });

  it('renders template name', () => {
    renderTemplateMarketplace();
    expect(screen.getByText('Income Statement')).toBeInTheDocument();
  });

  it('renders template description', () => {
    renderTemplateMarketplace();
    expect(screen.getByText('Standard income statement template')).toBeInTheDocument();
  });

  it('renders template category badge', () => {
    renderTemplateMarketplace();
    expect(screen.getByText('Financial')).toBeInTheDocument();
  });

  it('renders Use Template button', () => {
    renderTemplateMarketplace();
    expect(screen.getByText('Use Template')).toBeInTheDocument();
  });

  it('calls onSelect when card is clicked', () => {
    const onSelect = vi.fn();
    renderTemplateMarketplace({ onSelect });
    fireEvent.click(screen.getByTestId('card'));
    expect(onSelect).toHaveBeenCalledWith('tmpl-1');
  });

  it('renders multiple templates', () => {
    const templates = [
      createTemplate({ id: '1', name: 'Template A', category: 'Financial' }),
      createTemplate({ id: '2', name: 'Template B', category: 'Operational' }),
      createTemplate({ id: '3', name: 'Template C', category: 'Custom' }),
    ];
    renderTemplateMarketplace({ templates });
    expect(screen.getByText('Template A')).toBeInTheDocument();
    expect(screen.getByText('Template B')).toBeInTheDocument();
    expect(screen.getByText('Template C')).toBeInTheDocument();
  });

  it('calls onSelect with correct id for each template', () => {
    const onSelect = vi.fn();
    const templates = [
      createTemplate({ id: '1', name: 'Template A' }),
      createTemplate({ id: '2', name: 'Template B' }),
    ];
    renderTemplateMarketplace({ templates, onSelect });
    const cards = screen.getAllByTestId('card');
    fireEvent.click(cards[1]!);
    expect(onSelect).toHaveBeenCalledWith('2');
  });

  it('renders category badges for each template', () => {
    const templates = [
      createTemplate({ id: '1', name: 'A', category: 'Financial' }),
      createTemplate({ id: '2', name: 'B', category: 'Operational' }),
    ];
    renderTemplateMarketplace({ templates });
    const badges = screen.getAllByTestId('badge');
    expect(badges).toHaveLength(2);
    expect(badges[0]!).toHaveTextContent('Financial');
    expect(badges[1]!).toHaveTextContent('Operational');
  });

  it('renders empty state with dashed border styling', () => {
    const { container } = renderTemplateMarketplace({ templates: [] });
    const emptyDiv = container.firstChild as HTMLElement;
    expect(emptyDiv.className).toContain('border-dashed');
  });
});
