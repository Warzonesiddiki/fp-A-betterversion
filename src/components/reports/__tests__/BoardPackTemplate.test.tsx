import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/testUtils';
import { BoardPackTemplate } from '../BoardPackTemplate';

vi.mock('@/engines/ExportTemplateEngine', () => ({
  ExportTemplateEngine: class {
    getTemplate() {
      return { id: 'tpl', sections: [] };
    }
    generatePDF() {}
  },
}));

describe('BoardPackTemplate', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders header info', () => {
    render(<BoardPackTemplate entity="Acme" period="FY 2026" currency="USD" />);
    expect(screen.getByText('Board Pack Preview')).toBeTruthy();
  });
});
