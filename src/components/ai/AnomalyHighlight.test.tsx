import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AnomalyHighlight } from './AnomalyHighlight';

describe('AnomalyHighlight', () => {
  it('renders no anomalies when values are fewer than 3', () => {
    render(<AnomalyHighlight values={[100, 200]} />);
    expect(screen.getByText(/No anomalies detected/i)).toBeInTheDocument();
  });

  it('renders no anomalies when data is consistent', () => {
    render(<AnomalyHighlight values={[100, 102, 98, 101, 99, 100, 101, 99]} />);
    expect(screen.getByText(/No anomalies detected/i)).toBeInTheDocument();
  });

  it('highlights anomaly and triggers click handler', () => {
    const handleClick = vi.fn();
    const values = [100, 102, 98, 101, 1000, 99, 100, 101, 99];
    const labels = ['P1', 'P2', 'P3', 'P4', 'AnomalyPoint', 'P6', 'P7', 'P8', 'P9'];

    render(<AnomalyHighlight values={values} labels={labels} onAnomalyClick={handleClick} />);

    // Should show anomalies detected
    expect(screen.getByText(/1 Anomaly Detected/i)).toBeInTheDocument();

    // Should show the point label
    expect(screen.getByText('AnomalyPoint')).toBeInTheDocument();

    // Click the anomaly card
    const card = screen.getByRole('button', { name: /critical anomaly: AnomalyPoint/i });
    fireEvent.click(card);

    expect(handleClick).toHaveBeenCalledTimes(1);
    expect(handleClick).toHaveBeenCalledWith(
      expect.objectContaining({
        dataPoint: expect.objectContaining({
          value: 1000,
          index: 4,
        }),
      })
    );
  });

  it('limits displayed anomalies to maxDisplay', () => {
    // Generate data with multiple anomalies
    const values = [10, 12, 11, 10, 9, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 10, 11, 12];

    render(<AnomalyHighlight values={values} maxDisplay={3} />);

    // Total detected depends on engine, but let's assume it catches the 1000s
    expect(screen.getByText(/Anomalies Detected/i)).toBeInTheDocument();

    // Check that we only rendered `maxDisplay` buttons
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(3);

    // Should show text "+X more anomalies"
    expect(screen.getByText(/\+.*more anomalies/i)).toBeInTheDocument();
  });
});
