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
    UserPlus: makeIcon(),
  };
});

import RegisterPage from '@/pages/auth/RegisterPage';

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/register']}>
      <Routes>
        <Route path="/register" element={<RegisterPage />} />
        <Route path="*" element={<div>Redirected</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('RegisterPage smoke test', () => {
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

  it('displays the create account heading', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: /Create Account/i })).toBeInTheDocument();
  });

  it('renders name, email, and password inputs', () => {
    renderPage();
    const inputs = screen.getAllByRole('textbox');
    expect(inputs.length).toBeGreaterThanOrEqual(2); // name + email
    expect(screen.getByPlaceholderText(/Min 8 characters/i)).toBeInTheDocument();
  });

  it('displays the create account button', () => {
    renderPage();
    expect(screen.getByRole('button', { name: /Create Account/i })).toBeInTheDocument();
  });

  it('displays the sign in link', () => {
    renderPage();
    expect(screen.getByText(/Already have an account/i)).toBeInTheDocument();
  });
});
