import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { render } from '@/test/testUtils';
import { Badge } from './Badge';
import { Button } from './Button';
import { Card } from './Card';
import { FinancialStatusBadge, financialStatusValues } from './FinancialStatusBadge';
import { Input } from './Input';
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

  it('defines dark and light theme token sets with the required Atlas tokens (runbook dark/light)', () => {
    // Runbook scenarios render components in dark/light. Until a browser
    // pixel baseline exists, assert the structural contract: both theme
    // blocks exist and both define the tokens components consume, so a
    // theme switch cannot silently drop a token.
    const cssPath = path.resolve(__dirname, '../../index.css');
    const css = fs.readFileSync(cssPath, 'utf-8');

    const rootBlock = css.match(/:root\s*{[^}]*}/)?.[0] ?? '';
    const lightBlock = css.match(/\.light\s*{[^}]*}/)?.[0] ?? '';
    expect(rootBlock, 'expected :root (dark) theme block').toContain('--bg-root');
    expect(lightBlock, 'expected .light theme block').toContain('--bg-root');

    const requiredTokens = ['--bg-root', '--bg-surface', '--text-primary'];
    for (const token of requiredTokens) {
      expect(rootBlock, `:root missing ${token}`).toContain(token);
      expect(lightBlock, `.light missing ${token}`).toContain(token);
    }
  });

  it('keeps financial state tokens theme-invariant by design (single source of truth)', () => {
    // Financial lifecycle colors are defined ONCE in :root and consumed by
    // both themes (no .light duplication). This is a deliberate design
    // decision, recorded here so a future change cannot silently split the
    // palettes. Actual light-theme contrast verification remains a
    // browser-pixel-baseline item (blocked in this environment).
    const cssPath = path.resolve(__dirname, '../../index.css');
    const css = fs.readFileSync(cssPath, 'utf-8');

    const rootBlock = css.match(/:root\s*{[^}]*}/)?.[0] ?? '';
    const lightBlock = css.match(/\.light\s*{[^}]*}/)?.[0] ?? '';
    expect(rootBlock).toContain('--financial-draft');
    expect(rootBlock).toContain('--financial-certified');
    expect(rootBlock).toContain('--financial-failed');

    // The state classes consume the shared tokens.
    expect(css).toMatch(/\.fp-financial-status--draft\s*{[^}]*var\(--financial-draft\)/);
    expect(css).toMatch(/\.fp-financial-status--certified\s*{[^}]*var\(--financial-certified\)/);

    // By design, .light does not re-declare financial tokens.
    expect(lightBlock).not.toContain('--financial-draft');
  });

  /**
   * UI-01 step 4 — visual cover for the migrated shadcn primitives.
   *
   * The source-level guards (the eslint block and
   * `src/theme/buttonContrast.contract.test.ts`) read the *files*: one bans raw
   * palette utilities in the primitive sources, the other checks the token
   * values in `index.css` for AA contrast. Neither observes what actually
   * reaches the DOM, and both can be satisfied while the rendered element is
   * wrong — `cn()`/tailwind-merge can drop a class, a variant map can be wired
   * to the wrong key, and a token can be referenced that was never declared.
   * These cases assert the rendered output and close that gap.
   */
  describe('UI-01 — migrated primitives render semantic tokens, not raw palette', () => {
    const cssPath = path.resolve(__dirname, '../../index.css');
    const css = fs.readFileSync(cssPath, 'utf-8');

    const RAW_PALETTE =
      /\b(?:bg|text|border|ring|from|via|to|placeholder|divide|outline|shadow|accent|caret|fill|stroke)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(?:50|100|200|300|400|500|600|700|800|900|950)\b/;

    /** Every `var(--x)` the rendered class list refers to. */
    const referencedTokens = (className: string) =>
      [...className.matchAll(/var\((--[a-z0-9-]+)\)/g)].map((m) => m[1]!);

    const buttonVariants = [
      'default',
      'destructive',
      'outline',
      'secondary',
      'ghost',
      'link',
    ] as const;
    const badgeVariants = ['default', 'secondary', 'destructive', 'outline'] as const;

    it('renders no raw palette utility for any Button or Badge variant', () => {
      for (const variant of buttonVariants) {
        const { container, unmount } = render(<Button variant={variant}>Save</Button>);
        const cls = container.querySelector('button')!.getAttribute('class') ?? '';
        expect(cls, `Button variant="${variant}" rendered a raw palette utility`).not.toMatch(
          RAW_PALETTE
        );
        unmount();
      }

      for (const variant of badgeVariants) {
        const { container, unmount } = render(<Badge variant={variant}>Open</Badge>);
        const cls = container.firstElementChild!.getAttribute('class') ?? '';
        expect(cls, `Badge variant="${variant}" rendered a raw palette utility`).not.toMatch(
          RAW_PALETTE
        );
        unmount();
      }
    });

    it('renders only tokens that are actually declared in index.css', () => {
      // A `var(--typo)` silently resolves to nothing and the element renders
      // transparent/unstyled — invisible to a class-string assertion, which is
      // why the reference is checked against the stylesheet.
      const seen = new Set<string>();

      for (const variant of buttonVariants) {
        const { container, unmount } = render(<Button variant={variant}>Save</Button>);
        referencedTokens(container.querySelector('button')!.getAttribute('class') ?? '').forEach(
          (t) => seen.add(t)
        );
        unmount();
      }
      for (const variant of badgeVariants) {
        const { container, unmount } = render(<Badge variant={variant}>Open</Badge>);
        referencedTokens(container.firstElementChild!.getAttribute('class') ?? '').forEach((t) =>
          seen.add(t)
        );
        unmount();
      }
      const card = render(<Card>body</Card>);
      referencedTokens(card.container.firstElementChild!.getAttribute('class') ?? '').forEach((t) =>
        seen.add(t)
      );
      card.unmount();

      expect(seen.size, 'expected the primitives to reference semantic tokens').toBeGreaterThan(0);
      for (const token of seen) {
        expect(
          css,
          `${token} is referenced by a primitive but never declared in index.css`
        ).toMatch(new RegExp(`^\\s*${token}\\s*:`, 'm'));
      }
    });

    it('keeps the action and danger fills distinct from the text-accent token', () => {
      // The defect this migration fixed: --accent-primary is tuned as a text
      // colour (it must contrast with the page) and fails AA under white text
      // at 4.10:1. A button fill must therefore NOT resolve to it. If someone
      // "simplifies" the fill tokens back onto the text token, this fails.
      const { container } = render(<Button>Save</Button>);
      const cls = container.querySelector('button')!.getAttribute('class') ?? '';
      expect(cls).toContain('bg-[var(--action-fill)]');
      expect(cls).not.toContain('bg-[var(--accent-primary)]');
      expect(cls).not.toContain('bg-[var(--text-accent)]');

      const destructive = render(<Button variant="destructive">Delete</Button>);
      const dcls = destructive.container.querySelector('button')!.getAttribute('class') ?? '';
      expect(dcls).toContain('bg-[var(--danger-fill)]');
      expect(dcls).not.toContain('bg-[var(--negative)]');
      destructive.unmount();
    });

    it('pairs every filled variant with the on-accent text token', () => {
      // A fill without its paired foreground inherits ambient text colour,
      // which in light theme is near-black on a mid-blue fill.
      for (const variant of ['default', 'destructive'] as const) {
        const { container, unmount } = render(<Button variant={variant}>Go</Button>);
        const cls = container.querySelector('button')!.getAttribute('class') ?? '';
        expect(cls, `Button variant="${variant}" has a fill but no paired foreground`).toContain(
          'text-[var(--text-on-accent)]'
        );
        unmount();
      }
    });

    it('preserves the migrated primitive class contract in a structural snapshot', () => {
      const { container } = render(
        <div className="fp-primitive-set">
          {buttonVariants.map((variant) => (
            <Button key={variant} variant={variant}>
              {variant}
            </Button>
          ))}
          {badgeVariants.map((variant) => (
            <Badge key={variant} variant={variant}>
              {variant}
            </Badge>
          ))}
          <Card>card body</Card>
          <Input placeholder="amount" />
        </div>
      );

      expect(container).toMatchSnapshot();
    });
  });
});
