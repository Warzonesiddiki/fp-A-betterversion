import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import LoadingScreen from './LoadingScreen';

describe('LoadingScreen', () => {
  it('renders the app name', () => {
    render(<LoadingScreen />);
    expect(screen.getByText('FinPlan Pro')).toBeInTheDocument();
  });

  it('renders loading message', () => {
    render(<LoadingScreen />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders a spinner element', () => {
    render(<LoadingScreen />);
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('renders with fullscreen container', () => {
    render(<LoadingScreen />);
    const overlay = screen.getByText('FinPlan Pro').closest('.fixed.inset-0');
    expect(overlay).toBeInTheDocument();
  });
});
