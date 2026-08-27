import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';

import { AIIntelligencePage } from '@/pages/ai/AIIntelligencePage';
import * as AIIntelligencePageMod from '@/pages/ai/AIIntelligencePage';

vi.mock('@/store/glStore', () => ({
  useGLStore: Object.assign(
    vi.fn((sel?: (s: unknown) => unknown) => {
      const state = { entries: [] };
      return sel ? sel(state) : state;
    }),
    { getState: () => ({ entries: [] }) }
  ),
}));

vi.mock('@/engines/AIEngine', () => ({
  AIEngine: {
    init: vi.fn(),
    detectAnomalies: vi.fn(),
    getStatus: vi.fn(() => ({
      initialized: false,
      device: 'unknown',
      classifierReady: false,
      extractorReady: false,
    })),
    classifyTransaction: vi.fn(),
    getEmbeddings: vi.fn(),
    dispose: vi.fn(),
  },
}));

const renderComponent = () =>
  render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter>
        <AIIntelligencePage />
      </MemoryRouter>
    </I18nextProvider>
  );

describe('AIIntelligencePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    const { container } = renderComponent();
    expect(container).toBeInTheDocument();
  });

  it('displays the AI Intelligence Center heading', () => {
    renderComponent();
    expect(screen.getByText('AI Intelligence Center')).toBeInTheDocument();
  });

  it('shows 4 KPI cards', () => {
    renderComponent();
    expect(screen.getByText('Transactions Analyzed')).toBeInTheDocument();
    expect(screen.getByText('Anomalies Detected')).toBeInTheDocument();
    expect(screen.getByText('Avg Confidence')).toBeInTheDocument();
    expect(screen.getByText('Model Latency')).toBeInTheDocument();
  });

  it('shows 5 tab triggers (Overview, Anomalies, Sentiment, Insights, Model)', () => {
    renderComponent();
    const triggers = screen.getAllByRole('tab');
    expect(triggers.length).toBeGreaterThanOrEqual(5);
  });

  it('shows a device status badge with a readable label', () => {
    renderComponent();
    const badge = screen.getByLabelText(/Device status:/i);
    expect(badge).toBeInTheDocument();
  });

  it('shows the search input on the Anomalies tab', () => {
    renderComponent();
    const triggers = screen.getAllByRole('tab');
    const anomaliesTab = triggers.find((t) => t.textContent === 'Anomalies');
    expect(anomaliesTab).toBeDefined();
    fireEvent.click(anomaliesTab!);
    expect(screen.getByLabelText('Search AI results')).toBeInTheDocument();
  });

  it('shows the refresh button in the header', () => {
    renderComponent();
    expect(screen.getByLabelText('Refresh AI insights')).toBeInTheDocument();
  });

  it('disables the Export CSV button when no results are present', () => {
    renderComponent();
    const triggers = screen.getAllByRole('tab');
    const anomaliesTab = triggers.find((t) => t.textContent === 'Anomalies');
    fireEvent.click(anomaliesTab!);
    const exportBtn = screen.getByLabelText('Export results to CSV');
    expect(exportBtn).toBeDisabled();
  });

  it('shows the Model Status card with an Initialize button on the Overview tab', () => {
    renderComponent();
    expect(screen.getByText('Model Status')).toBeInTheDocument();
    expect(screen.getByLabelText('Initialize DistilBERT model')).toBeInTheDocument();
  });

  it('switches to the Model tab when clicked', () => {
    renderComponent();
    const triggers = screen.getAllByRole('tab');
    const modelTab = triggers.find((t) => t.textContent === 'Model');
    expect(modelTab).toBeDefined();
    fireEvent.click(modelTab!);
    expect(modelTab!).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('Model Information')).toBeInTheDocument();
  });

  it('switches to the Anomalies tab and shows the filter controls', () => {
    renderComponent();
    const triggers = screen.getAllByRole('tab');
    const anomaliesTab = triggers.find((t) => t.textContent === 'Anomalies');
    fireEvent.click(anomaliesTab!);
    expect(anomaliesTab!).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText(/All sentiments/i)).toBeInTheDocument();
  });

  it('switches to the Insights tab and shows the empty state', () => {
    renderComponent();
    const triggers = screen.getAllByRole('tab');
    const insightsTab = triggers.find((t) => t.textContent === 'Insights');
    fireEvent.click(insightsTab!);
    expect(insightsTab!).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText(/Run an analysis to see auto-generated insights/i)).toBeInTheDocument();
  });

  it('shows the empty state on the Anomalies tab when no analysis has been run', () => {
    renderComponent();
    const triggers = screen.getAllByRole('tab');
    const anomaliesTab = triggers.find((t) => t.textContent === 'Anomalies');
    fireEvent.click(anomaliesTab!);
    expect(
      screen.getByText(/Run analysis from the Overview tab to populate this list/i)
    ).toBeInTheDocument();
  });

  it('renders the help / About AI Intelligence card', () => {
    renderComponent();
    expect(screen.getByText('About AI Intelligence')).toBeInTheDocument();
  });

  it('renders the Sentiment breakdown card on the Sentiment tab', () => {
    renderComponent();
    const triggers = screen.getAllByRole('tab');
    const sentimentTab = triggers.find((t) => t.textContent === 'Sentiment');
    fireEvent.click(sentimentTab!);
    const tabPanel = screen.getByRole('tabpanel');
    expect(within(tabPanel).getByText('Sentiment breakdown')).toBeInTheDocument();
  });

  it('provides both a named export and a default export for React.lazy()', () => {
    // AIIntelligencePage is loaded via `lazy(() => import('./pages/ai/AIIntelligencePage'))`
    // in App.tsx (see the '/ai' route). React.lazy() requires a *default*
    // export — without one it resolves to `undefined` and crashes every
    // mount with "Element type is invalid". A prior version of this test
    // asserted the opposite (that `default` must be `undefined`), which
    // enshrined that exact production crash as "passing". Both exports must
    // exist and must point at the same component.
    expect(typeof AIIntelligencePageMod.AIIntelligencePage).toBe('function');
    expect(AIIntelligencePageMod.default).toBe(AIIntelligencePageMod.AIIntelligencePage);
  });
});
