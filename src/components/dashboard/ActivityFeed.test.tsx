/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ActivityFeed } from './ActivityFeed';

describe('ActivityFeed', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders empty state when no activities exist', () => {
    render(<ActivityFeed />);
    expect(screen.getByText(/No recent activity/)).toBeInTheDocument();
  });

  it('renders empty state with default message about importing data', () => {
    render(<ActivityFeed />);
    expect(
      screen.getByText(/Activity appears as you import data, edit budgets, and generate reports/)
    ).toBeInTheDocument();
  });

  it('renders activities from localStorage', () => {
    const activities = [
      {
        id: '1',
        userName: 'J. Smith',
        action: 'imported',
        resourceName: 'Q3 data',
        type: 'import',
        timestamp: new Date().toISOString(),
      },
      {
        id: '2',
        userName: 'M. Chen',
        action: 'edited',
        resourceName: 'budget',
        type: 'edit',
        timestamp: new Date().toISOString(),
      },
    ];
    localStorage.setItem('finplan-activity-log', JSON.stringify(activities));

    render(<ActivityFeed />);

    expect(screen.getByText('J. Smith')).toBeInTheDocument();
    expect(screen.getByText('M. Chen')).toBeInTheDocument();
  });

  it('limits items based on maxItems prop', () => {
    const activities = Array.from({ length: 20 }, (_, i) => ({
      id: String(i),
      userName: `User ${i}`,
      action: 'performed',
      resourceName: `action ${i}`,
      type: 'edit',
      timestamp: new Date().toISOString(),
    }));
    localStorage.setItem('finplan-activity-log', JSON.stringify(activities));

    const { container } = render(<ActivityFeed maxItems={5} />);
    const items = container.querySelectorAll('.border-b');
    expect(items.length).toBeLessThanOrEqual(5);
  });

  it('uses default maxItems of 10 when not specified', () => {
    const activities = Array.from({ length: 15 }, (_, i) => ({
      id: String(i),
      userName: `User ${i}`,
      action: 'performed',
      resourceName: `action ${i}`,
      type: 'edit',
      timestamp: new Date().toISOString(),
    }));
    localStorage.setItem('finplan-activity-log', JSON.stringify(activities));

    const { container } = render(<ActivityFeed />);
    const items = container.querySelectorAll('.border-b');
    expect(items.length).toBeLessThanOrEqual(10);
  });

  it('renders fallback text when userName is missing', () => {
    const activities = [
      {
        id: '1',
        action: 'performed',
        resourceName: 'an action',
        type: 'edit',
        timestamp: new Date().toISOString(),
      },
    ];
    localStorage.setItem('finplan-activity-log', JSON.stringify(activities));

    render(<ActivityFeed />);
    expect(screen.getByText('System')).toBeInTheDocument();
  });

  it('renders fallback text when action is missing', () => {
    const activities = [
      {
        id: '1',
        userName: 'Test User',
        resourceName: 'a resource',
        type: 'edit',
        timestamp: new Date().toISOString(),
      },
    ];
    localStorage.setItem('finplan-activity-log', JSON.stringify(activities));

    render(<ActivityFeed />);
    expect(screen.getByText('performed')).toBeInTheDocument();
  });

  it('renders fallback text when resourceName is missing', () => {
    const activities = [
      {
        id: '1',
        userName: 'Test User',
        action: 'did something',
        type: 'edit',
        timestamp: new Date().toISOString(),
      },
    ];
    localStorage.setItem('finplan-activity-log', JSON.stringify(activities));

    render(<ActivityFeed />);
    expect(screen.getByText('an action')).toBeInTheDocument();
  });

  it('handles malformed JSON in localStorage gracefully', () => {
    localStorage.setItem('finplan-activity-log', 'not valid json');

    render(<ActivityFeed />);
    expect(screen.getByText(/No recent activity/)).toBeInTheDocument();
  });

  it('applies correct dot color for import type', () => {
    const activities = [
      {
        id: '1',
        userName: 'User',
        action: 'imported',
        resourceName: 'data',
        type: 'import',
        timestamp: new Date().toISOString(),
      },
    ];
    localStorage.setItem('finplan-activity-log', JSON.stringify(activities));

    const { container } = render(<ActivityFeed />);
    const dot = container.querySelector('.bg-blue-500');
    expect(dot).toBeInTheDocument();
  });

  it('applies correct dot color for edit type', () => {
    const activities = [
      {
        id: '1',
        userName: 'User',
        action: 'edited',
        resourceName: 'budget',
        type: 'edit',
        timestamp: new Date().toISOString(),
      },
    ];
    localStorage.setItem('finplan-activity-log', JSON.stringify(activities));

    const { container } = render(<ActivityFeed />);
    const dot = container.querySelector('.bg-yellow-500');
    expect(dot).toBeInTheDocument();
  });

  it('applies correct dot color for approve type', () => {
    const activities = [
      {
        id: '1',
        userName: 'User',
        action: 'approved',
        resourceName: 'budget',
        type: 'approve',
        timestamp: new Date().toISOString(),
      },
    ];
    localStorage.setItem('finplan-activity-log', JSON.stringify(activities));

    const { container } = render(<ActivityFeed />);
    const dot = container.querySelector('.bg-green-500');
    expect(dot).toBeInTheDocument();
  });

  it('applies default dot color for unknown type', () => {
    const activities = [
      {
        id: '1',
        userName: 'User',
        action: 'did something',
        resourceName: 'thing',
        type: 'unknown',
        timestamp: new Date().toISOString(),
      },
    ];
    localStorage.setItem('finplan-activity-log', JSON.stringify(activities));

    const { container } = render(<ActivityFeed />);
    const dot = container.querySelector('.bg-slate-500');
    expect(dot).toBeInTheDocument();
  });

  it('formats relative time as "Just now" for recent timestamps', () => {
    const activities = [
      {
        id: '1',
        userName: 'User',
        action: 'did',
        resourceName: 'thing',
        type: 'edit',
        timestamp: new Date().toISOString(),
      },
    ];
    localStorage.setItem('finplan-activity-log', JSON.stringify(activities));

    render(<ActivityFeed />);
    expect(screen.getByText('Just now')).toBeInTheDocument();
  });

  it('formats relative time in minutes', () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60000).toISOString();
    const activities = [
      {
        id: '1',
        userName: 'User',
        action: 'did',
        resourceName: 'thing',
        type: 'edit',
        timestamp: fiveMinAgo,
      },
    ];
    localStorage.setItem('finplan-activity-log', JSON.stringify(activities));

    render(<ActivityFeed />);
    expect(screen.getByText('5m ago')).toBeInTheDocument();
  });

  it('formats relative time in hours', () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 3600000).toISOString();
    const activities = [
      {
        id: '1',
        userName: 'User',
        action: 'did',
        resourceName: 'thing',
        type: 'edit',
        timestamp: twoHoursAgo,
      },
    ];
    localStorage.setItem('finplan-activity-log', JSON.stringify(activities));

    render(<ActivityFeed />);
    expect(screen.getByText('2h ago')).toBeInTheDocument();
  });

  it('formats relative time in days', () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 86400000).toISOString();
    const activities = [
      {
        id: '1',
        userName: 'User',
        action: 'did',
        resourceName: 'thing',
        type: 'edit',
        timestamp: threeDaysAgo,
      },
    ];
    localStorage.setItem('finplan-activity-log', JSON.stringify(activities));

    render(<ActivityFeed />);
    expect(screen.getByText('3d ago')).toBeInTheDocument();
  });

  it('shows empty timestamp when timestamp is missing', () => {
    const activities = [
      { id: '1', userName: 'User', action: 'did', resourceName: 'thing', type: 'edit' },
    ];
    localStorage.setItem('finplan-activity-log', JSON.stringify(activities));

    const { container } = render(<ActivityFeed />);
    const timestampEl = container.querySelector('.text-xs.text-slate-500');
    expect(timestampEl?.textContent).toBe('');
  });
});
