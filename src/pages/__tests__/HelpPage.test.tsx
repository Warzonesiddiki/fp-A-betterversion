/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useNavigate } from 'react-router-dom';
import React, { Suspense } from 'react';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

// Mock react-router-dom
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: vi.fn(),
  };
});

// Mock lucide-react icons
vi.mock('lucide-react', async () => (await import('@/test/lucideMock')).createLucideMock());

import HelpPage from '@/pages/HelpPage';

function renderPage(PageComponent: React.ComponentType, initialPath = '/', routePath = '/') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Suspense fallback={<div>Loading...</div>}>
        <Routes>
          <Route path={routePath} element={<PageComponent />} />
          <Route path="*" element={<div>Redirected</div>} />
        </Routes>
      </Suspense>
    </MemoryRouter>
  );
}

describe('Page: HelpPage', () => {
  const navigateMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useNavigate).mockReturnValue(navigateMock);
  });

  describe('Smoke Test', () => {
    it('renders without crashing using lazy-loaded route test pattern', async () => {
      renderPage(HelpPage, '/help', '/help');
      expect(await screen.findByText('Help Center')).toBeInTheDocument();
    });
  });

  describe('Integration Test', () => {
    it('filters topics when searching', async () => {
      renderPage(HelpPage, '/help', '/help');

      const searchInput = await screen.findByPlaceholderText('Search help topics...');
      expect(await screen.findByText('Importing Data')).toBeInTheDocument();
      expect(await screen.findByText('Roles & Permissions')).toBeInTheDocument();

      fireEvent.change(searchInput, { target: { value: 'import' } });

      expect(await screen.findByText('Importing Data')).toBeInTheDocument();
      expect(screen.queryByText('Roles & Permissions')).not.toBeInTheDocument();
    });

    it('navigates to path when a topic is clicked', async () => {
      renderPage(HelpPage, '/help', '/help');

      const topicCard = await screen.findByText('Importing Data');
      // The onClick handler is on the Card which wraps the CardContent. We'll click the heading which bubbles up.
      fireEvent.click(topicCard);

      expect(navigateMock).toHaveBeenCalledWith('/data/gl-upload');
    });

    it('expands FAQ when clicked', async () => {
      renderPage(HelpPage, '/help', '/help');

      const question = await screen.findByText('How do I import data from Excel?');
      fireEvent.click(question);

      expect(await screen.findByText(/Go to Data > GL Upload/)).toBeInTheDocument();
    });
  });

  describe('Accessibility Test', () => {
    it('has no accessibility violations', async () => {
      const { container } = renderPage(HelpPage, '/help', '/help');
      await screen.findByText('Help Center');

      // Wait for everything to be rendered
      await screen.findByText('Frequently Asked Questions');

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
