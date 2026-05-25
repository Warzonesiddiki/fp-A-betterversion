/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Sidebar } from './Sidebar';

const mockToggleSidebar = vi.fn();
const mockCloseMobileSidebar = vi.fn();
const mockToggleTheme = vi.fn();

let mockSidebarCollapsed = false;
let mockMobileSidebarOpen = false;
let mockTheme = 'dark';

vi.mock('@/store/uiStore', () => ({
  useUIStore: vi.fn(() => ({
    sidebarCollapsed: mockSidebarCollapsed,
    toggleSidebar: mockToggleSidebar,
    mobileSidebarOpen: mockMobileSidebarOpen,
    closeMobileSidebar: mockCloseMobileSidebar,
  })),
}));

vi.mock('@/context/ThemeContext', () => ({
  useTheme: vi.fn(() => ({
    theme: mockTheme,
    toggleTheme: mockToggleTheme,
  })),
}));

function renderSidebar(initialPath = '/dashboard') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Sidebar />
    </MemoryRouter>
  );
}

describe('Sidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSidebarCollapsed = false;
    mockMobileSidebarOpen = false;
    mockTheme = 'dark';
  });

  it('renders without crashing', () => {
    renderSidebar();
  });

  it('displays the FinPlan Pro brand name', () => {
    renderSidebar();
    expect(screen.getByText('FinPlan Pro')).toBeInTheDocument();
  });

  it('displays FP logo', () => {
    renderSidebar();
    const logos = screen.getAllByText('FP');
    expect(logos.length).toBeGreaterThan(0);
  });

  it('renders quick search button', () => {
    renderSidebar();
    expect(screen.getByLabelText('Quick search (Ctrl+K)')).toBeInTheDocument();
  });

  it('renders quick search text when not collapsed', () => {
    renderSidebar();
    expect(screen.getByText('Quick search...')).toBeInTheDocument();
  });

  it('renders all navigation sections', () => {
    renderSidebar();
    expect(screen.getByText('Main')).toBeInTheDocument();
    expect(screen.getByText('Analysis')).toBeInTheDocument();
    expect(screen.getByText('Management')).toBeInTheDocument();
  });

  it('renders all main nav items', () => {
    renderSidebar();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Budgets')).toBeInTheDocument();
    expect(screen.getByText('Forecasts')).toBeInTheDocument();
    expect(screen.getByText('Reports')).toBeInTheDocument();
    expect(screen.getByText('Analytics')).toBeInTheDocument();
  });

  it('renders analysis nav items', () => {
    renderSidebar();
    expect(screen.getByText('Variance')).toBeInTheDocument();
    expect(screen.getByText('Scenarios')).toBeInTheDocument();
    expect(screen.getByText('AI Analyst')).toBeInTheDocument();
  });

  it('renders management nav items', () => {
    renderSidebar();
    expect(screen.getByText('Data Management')).toBeInTheDocument();
    expect(screen.getByText('Collaboration')).toBeInTheDocument();
    expect(screen.getByText('Approvals')).toBeInTheDocument();
  });

  it('renders Settings and Help links', () => {
    renderSidebar();
    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('Help')).toBeInTheDocument();
  });

  it('renders theme toggle button with light mode label', () => {
    renderSidebar();
    expect(screen.getByText('Light Mode')).toBeInTheDocument();
    expect(screen.getByLabelText('Switch to light mode')).toBeInTheDocument();
  });

  it('calls toggleTheme when theme button is clicked', () => {
    renderSidebar();
    fireEvent.click(screen.getByLabelText('Switch to light mode'));
    expect(mockToggleTheme).toHaveBeenCalledTimes(1);
  });

  it('renders collapse button on desktop', () => {
    renderSidebar();
    expect(screen.getByLabelText('Collapse sidebar')).toBeInTheDocument();
  });

  it('calls toggleSidebar when collapse button is clicked', () => {
    renderSidebar();
    fireEvent.click(screen.getByLabelText('Collapse sidebar'));
    expect(mockToggleSidebar).toHaveBeenCalledTimes(1);
  });

  it('hides labels when sidebar is collapsed', () => {
    mockSidebarCollapsed = true;
    renderSidebar();
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
    expect(screen.queryByText('FinPlan Pro')).not.toBeInTheDocument();
    expect(screen.queryByText('Quick search...')).not.toBeInTheDocument();
  });

  it('shows expand button when collapsed', () => {
    mockSidebarCollapsed = true;
    renderSidebar();
    expect(screen.getByLabelText('Expand sidebar')).toBeInTheDocument();
  });

  it('renders close button for mobile', () => {
    renderSidebar();
    expect(screen.getByLabelText('Close sidebar')).toBeInTheDocument();
  });

  it('calls closeMobileSidebar when close button is clicked', () => {
    renderSidebar();
    fireEvent.click(screen.getByLabelText('Close sidebar'));
    expect(mockCloseMobileSidebar).toHaveBeenCalledTimes(1);
  });

  it('shows Dark Mode toggle when theme is light', () => {
    mockTheme = 'light';
    renderSidebar();
    expect(screen.getByText('Dark Mode')).toBeInTheDocument();
    expect(screen.getByLabelText('Switch to dark mode')).toBeInTheDocument();
  });

  it('shows Light Mode toggle when theme is dark', () => {
    mockTheme = 'dark';
    renderSidebar();
    expect(screen.getByText('Light Mode')).toBeInTheDocument();
    expect(screen.getByLabelText('Switch to light mode')).toBeInTheDocument();
  });
});
