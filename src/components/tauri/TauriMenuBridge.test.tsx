/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockListen, mockUnlisten } = vi.hoisted(() => ({
  mockListen: vi.fn(),
  mockUnlisten: vi.fn(),
}));

vi.mock('@tauri-apps/api/event', () => ({
  listen: (...args: unknown[]) => {
    mockListen(...args);
    return Promise.resolve(mockUnlisten);
  },
}));

// render from testUtils already wraps children in a BrowserRouter, which is
// exactly the context TauriMenuBridge needs for useNavigate.
import { render } from '@/test/testUtils';
import { TauriMenuBridge } from './TauriMenuBridge';

describe('TauriMenuBridge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('mounts the native menu listener inside the router tree and renders nothing', async () => {
    const { container } = render(<TauriMenuBridge />);

    await vi.waitFor(() => expect(mockListen).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
    expect(mockListen).toHaveBeenCalledWith('menu-event', expect.any(Function));
  });

  it('disposes the listener on unmount', async () => {
    const { unmount } = render(<TauriMenuBridge />);
    await vi.waitFor(() => expect(mockListen).toHaveBeenCalled());

    unmount();

    expect(mockUnlisten).toHaveBeenCalled();
  });
});
