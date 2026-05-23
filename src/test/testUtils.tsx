import { render, type RenderOptions } from '@testing-library/react';
import { type ReactElement, type ReactNode } from 'react';
import { BrowserRouter } from 'react-router-dom';

function Providers({ children }: { children: ReactNode }) {
  return <BrowserRouter>{children}</BrowserRouter>;
}

function renderWithProviders(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  return render(ui, { wrapper: Providers, ...options });
}

export { renderWithProviders as render };
export { screen, fireEvent, waitFor, within } from '@testing-library/react';
export { userEvent } from '@testing-library/user-event';
