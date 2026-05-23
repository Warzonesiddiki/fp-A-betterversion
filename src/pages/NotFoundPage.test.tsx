import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import NotFoundPage from '@/pages/NotFoundPage';

function renderPage(path = '/nonexistent') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('NotFoundPage smoke test', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    const { container } = renderPage();
    expect(container).toBeTruthy();
  });

  it('displays the 404 heading', () => {
    renderPage();
    expect(screen.getByText('404')).toBeInTheDocument();
  });

  it('displays the page not found message', () => {
    renderPage();
    expect(screen.getByText(/Page not found/i)).toBeInTheDocument();
  });

  it('displays the go home button', () => {
    renderPage();
    expect(screen.getByRole('button', { name: /Go Home/i })).toBeInTheDocument();
  });
});
