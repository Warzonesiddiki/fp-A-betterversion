import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
const { mockLogin, mockNavigate, mockClearError } = vi.hoisted(() => ({
  mockLogin: vi.fn(),
  mockNavigate: vi.fn(),
  mockClearError: vi.fn(),
}));

vi.mock('lucide-react', () => {
  const makeIcon = () => {
    const Icon = ({ className }: { className?: string }) => (
      <span data-testid="mock-icon" className={className} />
    );
    Icon.displayName = 'MockIcon';
    return Icon;
  };
  return {
    LogIn: makeIcon(),
    Eye: makeIcon(),
    EyeOff: makeIcon(),
    Mail: makeIcon(),
    Lock: makeIcon(),
    AlertCircle: makeIcon(),
    Loader2: makeIcon(),
  };
});

vi.mock('@/store/authStore', () => {
  const state = {
    login: mockLogin,
    clearError: mockClearError,
    error: null as string | null,
    isLoading: false,
    isAuthenticated: false,
  };
  return {
    useAuthStore: (selector?: (s: typeof state) => unknown) => (selector ? selector(state) : state),
  };
});

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

import LoginPage from '@/pages/auth/LoginPage';

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<div>Redirected</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders without crashing', () => {
    const { container } = renderPage();
    expect(
      container.querySelectorAll('*').length,
      'rendered nothing: a truthy container does not prove the page mounted'
    ).toBeGreaterThanOrEqual(2);
  });

  it('displays the sign in button', () => {
    renderPage();
    expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
  });

  it('shows email and password inputs', () => {
    renderPage();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
  });

  it('shows validation error when submitting empty fields', async () => {
    const user = userEvent.setup();
    renderPage();

    const submitBtn = screen.getByText('Sign In');
    await user.click(submitBtn);

    // Zod validation shows field-specific errors
    await waitFor(() => {
      const emailError = document.getElementById('email-error');
      expect(emailError).toBeTruthy();
      expect(emailError?.textContent).toMatch(/email/i);
    });
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('calls authStore.login with email and password on submit', async () => {
    mockLogin.mockResolvedValueOnce(undefined);
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText('Email'), 'user@company.com');
    await user.type(screen.getByLabelText('Password'), 'securepass123');
    await user.click(screen.getByRole('button', { name: /Sign In/i }));

    expect(mockLogin).toHaveBeenCalledWith('user@company.com', 'securepass123');
  });

  it('calls login and handles rejection without crashing', async () => {
    mockLogin.mockRejectedValueOnce(new Error('Invalid email or password'));
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText('Email'), 'bad@test.com');
    await user.type(screen.getByLabelText('Password'), 'wrongpass');
    await user.click(screen.getByText('Sign In'));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('bad@test.com', 'wrongpass');
    });

    // Component should not crash on login failure
    expect(screen.getByText('Sign In')).toBeInTheDocument();
  });

  it('renders the login form', () => {
    renderPage();
    // Form is rendered as a div with input fields
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
  });

  it('has accessible labels on interactive elements', () => {
    renderPage();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
  });
});
