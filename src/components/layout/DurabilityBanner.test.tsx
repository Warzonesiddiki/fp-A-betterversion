/**
 * @vitest-environment jsdom
 */
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { DurabilityBanner } from './DurabilityBanner';
import { useGLStore, setGlCommitClient } from '@/store/glStore';
import type { GlCommitNamespace } from '@/sdk/gl/GlCommitNamespace';
import { actAs, actAsRoleWithout } from '@/test/rbacFixtures';

expect.extend(toHaveNoViolations);

function makeEntry(id: string, overrides: Record<string, unknown> = {}) {
  return {
    id,
    accountId: `acc-${id}`,
    accountCode: '4000',
    accountName: 'Revenue',
    period: '2026-01',
    periodName: '2026-01',
    date: '2026-01-31',
    debit: 100,
    credit: 0,
    netChange: 100,
    amount: 100,
    description: '',
    reference: '',
    ...overrides,
  };
}

function resetGL() {
  useGLStore.setState({
    entries: [],
    accounts: [],
    trialBalance: [],
    accountAnalysis: null,
    entrySyncState: {},
    entryVersions: {},
    lastImportEntryIds: [],
    importError: null,
    environmentId: 'dev',
  });
}

describe('DurabilityBanner (W0.8.5 + W0.8.6 publish trigger)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    actAs('Admin');
    resetGL();
  });

  it('states that the ledger is local-only and that clearing site data destroys it', () => {
    render(<DurabilityBanner />);
    const banner = screen.getByTestId('durability-banner');
    expect(banner).toHaveAttribute('role', 'status');
    expect(banner.textContent).toMatch(/local only/i);
    expect(banner.textContent).toMatch(/clearing site data/i);
    expect(banner.textContent).toMatch(/not a backup/i);
    expect(banner.textContent).not.toMatch(/saved to the cloud/i);
    expect(banner.textContent).not.toMatch(/backed up/i);
  });

  it('is not colour-only: text carries the warning without relying on hue', () => {
    render(<DurabilityBanner />);
    expect(screen.getByText(/Draft workspace/i)).toBeTruthy();
  });

  it('has no automated accessibility violations', async () => {
    const { container } = render(<DurabilityBanner />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('W0.8.6: offers the product publish trigger when GL drafts exist and reports the outcome', async () => {
    setGlCommitClient({
      createJournalBatch: () =>
        Promise.resolve({
          status: 'committed',
          value: [
            { id: 'srv-banner-1', version: 1 },
            { id: 'srv-banner-2', version: 1 },
          ],
        }),
    } as unknown as GlCommitNamespace);

    // Balanced double-entry pair (F-0004 pre-flight would reject otherwise).
    useGLStore.setState({
      entries: [
        makeEntry('draft-1', { journalId: 'j-test' }),
        makeEntry('draft-2', {
          journalId: 'j-test',
          debit: 0,
          credit: 100,
          netChange: -100,
          amount: -100,
        }),
      ],
    });
    render(<DurabilityBanner />);

    fireEvent.click(screen.getByTestId('publish-gl-drafts'));
    await waitFor(() => {
      expect(screen.getByTestId('publish-outcome').textContent).toMatch(/2 published/i);
    });
    // The drafts became committed server rows — the trigger disappears.
    await waitFor(() => {
      expect(screen.queryByTestId('publish-gl-drafts')).not.toBeInTheDocument();
    });
    expect(useGLStore.getState().entries.map((e) => e.id)).toEqual([
      'srv-banner-1',
      'srv-banner-2',
    ]);
  });

  it('hides the publish control when the user lacks IMPORT_CREATE (RBAC)', () => {
    actAsRoleWithout('Admin', 'import:create');
    useGLStore.setState({ entries: [makeEntry('draft-1')] });
    render(<DurabilityBanner />);
    expect(screen.queryByTestId('publish-gl-drafts')).not.toBeInTheDocument();
  });

  it('W0.8.6 boot-hydrate: Pull server rows converges the replica without touching drafts', async () => {
    setGlCommitClient({
      listEntries: () =>
        Promise.resolve({
          status: 'listed',
          entries: [{ id: 'srv-row-1', version: 3, date: '2026-01-31', debit: 100, credit: 0 }],
        }),
    } as unknown as GlCommitNamespace);
    useGLStore.setState({ entries: [makeEntry('draft-keep')] });
    render(<DurabilityBanner />);

    fireEvent.click(screen.getByTestId('pull-server-rows'));
    await waitFor(() => {
      expect(screen.getByTestId('publish-outcome').textContent).toMatch(/1 pulled/i);
    });
    const state = useGLStore.getState();
    // Server row adopted; local draft preserved untouched (K25/K27). Order
    // is unspecified — hydrate appends adopted rows.
    expect(state.entries).toHaveLength(2);
    expect(state.entries.map((e) => e.id)).toContain('srv-row-1');
    expect(state.entries.map((e) => e.id)).toContain('draft-keep');
    expect(state.entryVersions['srv-row-1']).toBe(3);
    expect(state.entrySyncState['draft-keep'] ?? 'draft').toBe('draft');
  });
});
