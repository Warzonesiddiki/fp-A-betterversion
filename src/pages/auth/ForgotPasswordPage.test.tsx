import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
vi.mock('lucide-react', () => {
  const makeIcon = () => {
    const Icon = ({ className }: { className?: string }) => (
      <span data-testid="mock-icon" className={className} />
    );
    Icon.displayName = 'MockIcon';
    return Icon;
  };
  return {
    Mail: makeIcon(),
    ArrowLeft: makeIcon(),
    CheckCircle: makeIcon(),
    AlertCircle: makeIcon(),
    Lock: makeIcon(),
    Clock: makeIcon(),
  };
});

import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage';

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/forgot-password']}>
      <Routes>
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="*" element={<div>Redirected</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('ForgotPasswordPage smoke test', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    const { container } = renderPage();
    expect(
      container.querySelectorAll('*').length,
      'rendered nothing: a truthy container does not prove the page mounted'
    ).toBeGreaterThanOrEqual(2);
  });

  it('displays the reset password heading', () => {
    renderPage();
    expect(screen.getByText(/Reset Password/i)).toBeInTheDocument();
  });

  it('displays the email input', () => {
    renderPage();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('displays the send reset link button', () => {
    renderPage();
    expect(screen.getByRole('button', { name: /Send Reset Link/i })).toBeInTheDocument();
  });

  it('displays the back to sign in link', () => {
    renderPage();
    expect(screen.getByText(/Back to Sign In/i)).toBeInTheDocument();
  });
});
