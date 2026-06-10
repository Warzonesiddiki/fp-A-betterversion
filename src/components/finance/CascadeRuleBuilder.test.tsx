import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CascadeRuleBuilder } from './CascadeRuleBuilder';
import type { Driver } from '@/engines/DriverCascadeEngine';

// Mock the driver store
vi.mock('@/store/driverStore', () => ({
  useDriverStore: vi.fn(() => ({
    addRule: vi.fn(() => ({
      id: 'rule-1',
      driverId: 'drv-1',
      targetCube: 'Budget',
      targetCoords: { Account: 'Account:Revenue' },
      targetMeasure: 'amount',
      cascadeType: 'direct',
      impactType: 'multiplicative',
      weight: 1,
    })),
    removeRule: vi.fn(() => true),
    getRulesForDriver: vi.fn(() => []),
  })),
}));

const mockDriver: Driver = {
  id: 'drv-1',
  name: 'Revenue Growth',
  unit: 'percentage',
  baseValue: 10,
  currentValue: 10,
  minValue: -50,
  maxValue: 100,
  step: 1,
  category: 'Revenue',
  tags: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe('CascadeRuleBuilder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    const { container } = render(<CascadeRuleBuilder driver={mockDriver} />);
    expect(container.firstChild).toBeTruthy();
  });

  it('renders the Cascade Rules heading', () => {
    render(<CascadeRuleBuilder driver={mockDriver} />);
    expect(screen.getByText('Cascade Rules')).toBeInTheDocument();
  });

  it('renders Add Rule button', () => {
    render(<CascadeRuleBuilder driver={mockDriver} />);
    expect(screen.getByText('Add Rule')).toBeInTheDocument();
  });

  it('shows empty state when no rules exist', () => {
    render(<CascadeRuleBuilder driver={mockDriver} />);
    expect(screen.getByText(/No cascade rules defined/)).toBeInTheDocument();
  });

  it('opens the rule form when Add Rule is clicked', () => {
    render(<CascadeRuleBuilder driver={mockDriver} />);
    fireEvent.click(screen.getByText('Add Rule'));
    expect(screen.getByText('New Cascade Rule')).toBeInTheDocument();
    expect(screen.getByText('Target Cube')).toBeInTheDocument();
    expect(screen.getByText('Target Account')).toBeInTheDocument();
  });

  it('shows formula input when formula cascade type is selected', () => {
    render(<CascadeRuleBuilder driver={mockDriver} />);
    fireEvent.click(screen.getByText('Add Rule'));

    // Select formula cascade type
    const cascadeSelect = screen.getByDisplayValue(/Direct/);
    fireEvent.change(cascadeSelect, { target: { value: 'formula' } });

    expect(screen.getByText('Formula')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/x \* 1000/)).toBeInTheDocument();
  });

  it('shows formula variables hint', () => {
    render(<CascadeRuleBuilder driver={mockDriver} />);
    fireEvent.click(screen.getByText('Add Rule'));

    const cascadeSelect = screen.getByDisplayValue(/Direct/);
    fireEvent.change(cascadeSelect, { target: { value: 'formula' } });

    expect(screen.getByText(/Variables:/)).toBeInTheDocument();
  });

  it('renders close/cancel button in form', () => {
    render(<CascadeRuleBuilder driver={mockDriver} />);
    fireEvent.click(screen.getByText('Add Rule'));
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('closes form when Cancel is clicked', () => {
    render(<CascadeRuleBuilder driver={mockDriver} />);
    fireEvent.click(screen.getByText('Add Rule'));
    expect(screen.getByText('New Cascade Rule')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Cancel'));
    expect(screen.queryByText('New Cascade Rule')).not.toBeInTheDocument();
  });

  it('renders all target cube options', () => {
    render(<CascadeRuleBuilder driver={mockDriver} />);
    fireEvent.click(screen.getByText('Add Rule'));

    expect(screen.getByText('Budget')).toBeInTheDocument();
    expect(screen.getByText('Forecast')).toBeInTheDocument();
    expect(screen.getByText('Scenario')).toBeInTheDocument();
    expect(screen.getByText('Actual')).toBeInTheDocument();
  });

  it('renders all cascade type options', () => {
    render(<CascadeRuleBuilder driver={mockDriver} />);
    fireEvent.click(screen.getByText('Add Rule'));

    expect(screen.getByText(/Direct/)).toBeInTheDocument();
    expect(screen.getByText(/Weighted/)).toBeInTheDocument();
    expect(screen.getByText(/Formula/)).toBeInTheDocument();
  });

  it('renders all impact type options', () => {
    render(<CascadeRuleBuilder driver={mockDriver} />);
    fireEvent.click(screen.getByText('Add Rule'));

    expect(screen.getByText(/Additive/)).toBeInTheDocument();
    expect(screen.getByText(/Multiplicative/)).toBeInTheDocument();
    expect(screen.getByText(/Replacement/)).toBeInTheDocument();
  });

  it('renders weight slider', () => {
    render(<CascadeRuleBuilder driver={mockDriver} />);
    fireEvent.click(screen.getByText('Add Rule'));

    const slider = screen.getByRole('slider');
    expect(slider).toBeInTheDocument();
  });

  it('disables Add Rule button when target account is empty', () => {
    render(<CascadeRuleBuilder driver={mockDriver} />);
    fireEvent.click(screen.getByText('Add Rule'));

    // The form-level Add Rule button should be disabled when account is empty
    const addButtons = screen.getAllByText('Add Rule');
    // The second one is the form button
    expect(addButtons[1]!).toBeDisabled();
  });
});
