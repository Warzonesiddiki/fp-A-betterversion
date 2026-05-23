// =============================================================================
// DRIVER PLANNING PAGE TESTS
// =============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DriverPlanningPage from './DriverPlanningPage';

// Mock the driver store
const mockReset = vi.fn();
const mockAddDriver = vi.fn(() => ({
  id: 'drv-new',
  name: 'Test Driver',
  unit: 'percentage',
  baseValue: 10,
  currentValue: 10,
  minValue: -50,
  maxValue: 100,
  step: 1,
  category: 'General',
  tags: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}));
const mockRemoveDriver = vi.fn(() => true);
const mockUpdateDriver = vi.fn(() => undefined);
const mockSelectDriver = vi.fn();
const mockGetRulesForDriver = vi.fn(() => []);
const mockGetAllRules = vi.fn(() => []);
const mockDetectCircularDependencies = vi.fn(() => []);
const mockLoadDriverTemplate = vi.fn();
const mockCalculateCascade = vi.fn();
const mockAnalyzeImpact = vi.fn();

vi.mock('@/store/driverStore', () => ({
  useDriverStore: vi.fn(() => ({
    engine: {
      listDrivers: () => [],
      listSnapshots: () => [],
      createSnapshot: vi.fn(),
    },
    addDriver: mockAddDriver,
    removeDriver: mockRemoveDriver,
    updateDriver: mockUpdateDriver,
    selectedDriverId: null,
    selectDriver: mockSelectDriver,
    isRecalculating: false,
    lastCascadeResult: null,
    getRulesForDriver: mockGetRulesForDriver,
    getAllRules: mockGetAllRules,
    detectCircularDependencies: mockDetectCircularDependencies,
    loadDriverTemplate: mockLoadDriverTemplate,
    calculateCascade: mockCalculateCascade,
    analyzeImpact: mockAnalyzeImpact,
    reset: mockReset,
  })),
  DRIVER_TEMPLATES: [
    {
      name: 'Revenue Planning',
      description: 'Revenue growth driver cascading to Revenue, COGS, and OpEx',
      drivers: [],
      rules: [],
    },
    {
      name: 'Cost Structure',
      description: 'Cost drivers for COGS, OpEx, and headcount planning',
      drivers: [],
      rules: [],
    },
    {
      name: 'Margin Analysis',
      description: 'Gross margin, EBITDA margin, and profitability drivers',
      drivers: [],
      rules: [],
    },
  ],
}));

describe('DriverPlanningPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    const { container } = render(<DriverPlanningPage />);
    expect(container.firstChild).toBeTruthy();
  });

  it('renders the page title', () => {
    render(<DriverPlanningPage />);
    expect(screen.getByText('Driver-Based Planning')).toBeInTheDocument();
  });

  it('renders the page description', () => {
    render(<DriverPlanningPage />);
    expect(
      screen.getByText('Define drivers, set cascade rules, and model financial impacts')
    ).toBeInTheDocument();
  });

  it('renders KPI cards', () => {
    render(<DriverPlanningPage />);
    expect(screen.getByText('Total Drivers')).toBeInTheDocument();
    expect(screen.getByText('Cascade Rules')).toBeInTheDocument();
    expect(screen.getByText('Drivers with Rules')).toBeInTheDocument();
    expect(screen.getByText('Circular Dependencies')).toBeInTheDocument();
  });

  it('renders Add Driver button', () => {
    render(<DriverPlanningPage />);
    const addDriverButtons = screen.getAllByText('Add Driver');
    expect(addDriverButtons.length).toBeGreaterThanOrEqual(1);
  });

  it('renders Templates button', () => {
    render(<DriverPlanningPage />);
    expect(screen.getByText('Templates')).toBeInTheDocument();
  });

  it('renders Reset button', () => {
    render(<DriverPlanningPage />);
    expect(screen.getByText('Reset')).toBeInTheDocument();
  });

  it('shows empty state when no drivers', () => {
    render(<DriverPlanningPage />);
    expect(screen.getByText('No Drivers Configured')).toBeInTheDocument();
  });

  it('shows Add Driver and Load Template buttons in empty state', () => {
    render(<DriverPlanningPage />);
    expect(screen.getByText(/Add drivers manually/)).toBeInTheDocument();
  });

  it('opens add form when Add Driver is clicked', () => {
    render(<DriverPlanningPage />);
    const addButtons = screen.getAllByText('Add Driver');
    fireEvent.click(addButtons[0]);
    expect(screen.getByText('Add New Driver')).toBeInTheDocument();
    expect(screen.getByText('Driver Name *')).toBeInTheDocument();
  });

  it('opens templates panel when Templates is clicked', () => {
    render(<DriverPlanningPage />);
    fireEvent.click(screen.getByText('Templates'));
    expect(screen.getByText('Driver Templates')).toBeInTheDocument();
    expect(screen.getByText('Revenue Planning')).toBeInTheDocument();
    expect(screen.getByText('Cost Structure')).toBeInTheDocument();
    expect(screen.getByText('Margin Analysis')).toBeInTheDocument();
  });

  it('calls reset when Reset is clicked', () => {
    render(<DriverPlanningPage />);
    fireEvent.click(screen.getByText('Reset'));
    expect(mockReset).toHaveBeenCalled();
  });

  it('renders the add form with all fields', () => {
    render(<DriverPlanningPage />);
    const addButtons = screen.getAllByText('Add Driver');
    fireEvent.click(addButtons[0]);

    expect(screen.getByText('Driver Name *')).toBeInTheDocument();
    expect(screen.getByText('Category')).toBeInTheDocument();
    expect(screen.getByText('Description')).toBeInTheDocument();
    expect(screen.getByText('Unit')).toBeInTheDocument();
    expect(screen.getByText('Base / Current Value')).toBeInTheDocument();
    expect(screen.getByText('Min / Max / Step')).toBeInTheDocument();
  });

  it('renders Quick Actions panel', () => {
    render(<DriverPlanningPage />);
    expect(screen.getByText('Quick Actions')).toBeInTheDocument();
    expect(screen.getByText('Create Snapshot')).toBeInTheDocument();
  });

  it('renders Cascade Summary panel', () => {
    render(<DriverPlanningPage />);
    expect(screen.getByText('Cascade Summary')).toBeInTheDocument();
    expect(screen.getByText('No cascade rules defined yet')).toBeInTheDocument();
  });

  it('calls addDriver when form is submitted with valid data', () => {
    render(<DriverPlanningPage />);
    const addButtons = screen.getAllByText('Add Driver');
    fireEvent.click(addButtons[0]);

    // Fill in the name
    const nameInput = screen.getByPlaceholderText('e.g. Revenue Growth Rate');
    fireEvent.change(nameInput, { target: { value: 'Test Driver' } });

    // Click the form's Add Driver button (index 1: header=0, form=1, empty-state=2, quick-actions=3)
    const submitButtons = screen.getAllByText('Add Driver');
    fireEvent.click(submitButtons[1]);

    expect(mockAddDriver).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Test Driver',
      })
    );
  });

  it('loads template when template card is clicked', () => {
    render(<DriverPlanningPage />);
    fireEvent.click(screen.getByText('Templates'));
    fireEvent.click(screen.getByText('Revenue Planning'));
    expect(mockLoadDriverTemplate).toHaveBeenCalled();
  });
});
