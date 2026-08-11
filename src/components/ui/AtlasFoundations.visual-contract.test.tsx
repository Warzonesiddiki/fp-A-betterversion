import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { render } from '@/test/testUtils';
import { FinancialStatusBadge, financialStatusValues } from './FinancialStatusBadge';
import { FinancialWorkspaceEmptyState } from './FinancialWorkspaceEmptyState';
import { PageHeader } from './PageHeader';
import { FinancialContextBar } from '@/components/layout/FinancialContextBar';
import { useFinancialContextStore } from '@/store/financialContextStore';
import { DEFAULT_FINANCIAL_CONTEXT } from '@/types/financialContext';

/**
 * Browser screenshot baselines remain the final visual gate. This deterministic
 * DOM/class contract is an interim regression signal for environments that
 * cannot provision a Playwright browser; it intentionally does not claim to
 * validate rendered pixels, fonts, or responsive layout.
 */
describe('Atlas foundation visual structure contract', () => {
  it('preserves the canonical finance workspace hierarchy and state semantics', () => {
    const { container } = render(
      <main className="fp-page">
        <PageHeader
          actions={<button type="button">Import actuals</button>}
          purpose="Review financial data and complete the next safe action."
          status={<FinancialStatusBadge detail="Local workspace data" status="draft" />}
          title="Executive Dashboard"
        />
        <FinancialWorkspaceEmptyState
          actions={<button type="button">Set up accounts</button>}
          description="Load and validate financial inputs before planning and reporting."
          steps={[
            { title: 'Import actuals', description: 'Load a controlled financial source.' },
            { title: 'Confirm reporting accounts', description: 'Verify the reporting hierarchy.' },
          ]}
          title="Set up your finance workspace"
        />
      </main>
    );

    expect(container).toMatchSnapshot();
  });

  it('preserves the financial context bar hierarchy and trust semantics (F-03)', () => {
    useFinancialContextStore.setState({ context: DEFAULT_FINANCIAL_CONTEXT });
    const { container } = render(
      <main className="fp-page">
        <FinancialContextBar
          entities={[
            { id: 'ent-1', label: 'US Parent', currency: 'USD' },
            { id: 'ent-2', label: 'UK Subsidiary', currency: 'GBP' },
          ]}
          versions={[{ id: 'v-2026', label: '2026 Plan' }]}
        />
        <PageHeader
          actions={<button type="button">Import</button>}
          purpose="Workspace data is a local draft until a server-authorized context exists."
          status={<FinancialStatusBadge detail="Local workspace data" status="draft" />}
          title="Executive Dashboard"
        />
      </main>
    );

    expect(container).toMatchSnapshot();
  });

  it('keeps trust-state semantics structural: text + role + data attribute, never color-only', () => {
    const { container } = render(
      <FinancialStatusBadge detail="Local workspace data" status="draft" />
    );

    const badge = container.querySelector('[data-financial-status="draft"]');
    expect(badge).not.toBeNull();
    expect(badge!.getAttribute('role')).toBe('status');
    expect(badge!.getAttribute('class')).toContain('fp-financial-status--draft');
    expect(badge!.textContent).toContain('Draft');
    expect(badge!.textContent).toContain('Local workspace data');
    // The accessible name carries the consequence, not just the label.
    expect(badge!.getAttribute('aria-label')).toContain('Draft; not published');
  });

  it('keeps the context bar freshness text explicit when no sync state exists', () => {
    useFinancialContextStore.setState({ context: DEFAULT_FINANCIAL_CONTEXT });
    const { container } = render(<FinancialContextBar entities={[]} />);

    expect(container.textContent).toContain('Freshness unknown');
    expect(container.textContent).toContain('Draft');
    expect(container.textContent).toContain('Local workspace data');
  });

  it('renders every financial lifecycle state with text, icon, role, and data attribute (never color-only)', () => {
    // Runbook scenario 1 (structural equivalent): all ten lifecycle states.
    // Each state must be distinguishable without colour: a non-empty text
    // label, a non-colour icon/pattern, role="status", and a stable
    // data-financial-status attribute.
    const labels: Record<string, string> = {
      draft: 'Draft',
      calculated: 'Calculated',
      manual: 'Manual input',
      pendingApproval: 'Pending approval',
      locked: 'Locked',
      certified: 'Certified',
      stale: 'Stale',
      offlineQueued: 'Offline',
      failed: 'Failed',
      aiGenerated: 'AI-generated draft',
    };

    expect(financialStatusValues).toHaveLength(10);

    for (const status of financialStatusValues) {
      const { container, unmount } = render(<FinancialStatusBadge status={status} />);
      const badge = container.querySelector(`[data-financial-status="${status}"]`);
      expect(badge, `badge for ${status}`).not.toBeNull();
      expect(badge!.getAttribute('role')).toBe('status');
      expect(badge!.getAttribute('class')).toContain(`fp-financial-status--${status}`);
      expect(badge!.querySelector('[aria-hidden="true"]')).not.toBeNull();
      const text = badge!.textContent ?? '';
      expect(text.length, `text label for ${status}`).toBeGreaterThan(0);
      expect(text, `label for ${status}`).toContain(labels[status]);
      unmount();
    }
  });

  it('preserves the canonical badge set in a deterministic structural snapshot', () => {
    const { container } = render(
      <div className="fp-badge-set" data-testid="badge-set">
        {financialStatusValues.map((status) => (
          <FinancialStatusBadge key={status} status={status} />
        ))}
      </div>
    );

    expect(container).toMatchSnapshot();
  });

  it('preserves the full PageHeader anatomy: title, purpose, status, actions', () => {
    const { container } = render(
      <PageHeader
        actions={<button type="button">Export</button>}
        purpose="Decide what changed and what to do next."
        status={<FinancialStatusBadge detail="Local workspace data" status="draft" />}
        title="Executive Dashboard"
      />
    );

    const header = container.querySelector('header.fp-page-header');
    expect(header).not.toBeNull();
    const title = header!.querySelector('h1.fp-page-header__title');
    expect(title?.textContent).toBe('Executive Dashboard');
    expect(header!.querySelector('.fp-page-header__purpose')?.textContent).toContain(
      'Decide what changed'
    );
    expect(header!.querySelector('.fp-page-header__actions')).not.toBeNull();
    expect(header!.querySelector('[data-financial-status="draft"]')).not.toBeNull();
  });

  it('omits purpose and actions containers when not provided (minimal PageHeader)', () => {
    const { container } = render(<PageHeader title="Period Close" />);

    const header = container.querySelector('header.fp-page-header');
    expect(header).not.toBeNull();
    expect(header!.querySelector('h1.fp-page-header__title')?.textContent).toBe('Period Close');
    expect(header!.querySelector('.fp-page-header__purpose')).toBeNull();
    expect(header!.querySelector('.fp-page-header__actions')).toBeNull();
    expect(container).toMatchSnapshot();
  });

  it('honors prefers-reduced-motion in the global stylesheet (runbook checklist)', () => {
    // Runbook review checklist: motion is optional and disabled under
    // prefers-reduced-motion. Assert the global CSS carries the contract
    // (structural proxy for the browser-level behavior; pixels/animation
    // timing remain part of the blocked pixel baseline).
    const cssPath = path.resolve(__dirname, '../../index.css');
    const css = fs.readFileSync(cssPath, 'utf-8');

    const blocks = css.match(/@media\s*\(prefers-reduced-motion:\s*reduce\)\s*{[^}]*}/g) ?? [];
    expect(blocks.length, 'expected at least one prefers-reduced-motion block').toBeGreaterThan(0);

    const combined = blocks.join('\n');
    expect(combined).toContain('animation-duration');
    expect(combined).toContain('transition-duration');
  });
});
