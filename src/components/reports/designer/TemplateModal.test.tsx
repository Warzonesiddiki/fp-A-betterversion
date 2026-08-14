import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TemplateModal } from './TemplateModal';

describe('TemplateModal', () => {
  it('renders its content when open', () => {
    render(
      <TemplateModal
        isOpen
        onClose={vi.fn()}
        onSelectTemplate={vi.fn()}
        onLoadSaved={vi.fn()}
        savedReports={[]}
      />
    );
    // Rendered closed (the previous default) this component returns null, so the
    // old assertion held for an empty DOM. Assert the open state renders chrome.
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('renders nothing when closed', () => {
    const { container } = render(
      <TemplateModal
        isOpen={false}
        onClose={vi.fn()}
        onSelectTemplate={vi.fn()}
        onLoadSaved={vi.fn()}
        savedReports={[]}
      />
    );
    expect(container.innerHTML).toBe('');
  });
});
