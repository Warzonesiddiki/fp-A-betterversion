/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAuth } from './useAuth';
import { useAuthStore } from '@/store/authStore';

// Mock the auth store
vi.mock('@/store/authStore');

const mockUseAuthStore = vi.mocked(useAuthStore);

describe('useAuth', () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.resetAllMocks();
  });

  it('should return the initial state from the store', () => {
    // Arrange
    const initialStoreState = {
      user: null,
      isAuthenticated: false,
      isLoading: true,
      login: vi.fn(),
      logout: vi.fn(),
      switchEntity: vi.fn(),
    };
    mockUseAuthStore.mockReturnValue(initialStoreState);

    // Act
    const { result } = renderHook(() => useAuth());

    // Assert
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isLoading).toBe(true);
    expect(typeof result.current.login).toBe('function');
    expect(typeof result.current.logout).toBe('function');
    expect(typeof result.current.switchEntity).toBe('function');
  });

  it('should reflect the authenticated state from the store', () => {
    // Arrange
    const authenticatedState = {
      user: { id: 'user-1', name: 'Test User', email: 'test@example.com' },
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      switchEntity: vi.fn(),
    };
    mockUseAuthStore.mockReturnValue(authenticatedState);

    // Act
    const { result } = renderHook(() => useAuth());

    // Assert
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.user).toEqual({
      id: 'user-1',
      name: 'Test User',
      email: 'test@example.com',
    });
  });

  it("should call the store's login function", () => {
    // Arrange
    const loginMock = vi.fn();
    mockUseAuthStore.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login: loginMock,
      logout: vi.fn(),
      switchEntity: vi.fn(),
    });
    const { result } = renderHook(() => useAuth());

    // Act
    act(() => {
      result.current.login('test@example.com', 'password');
    });

    // Assert
    expect(loginMock).toHaveBeenCalledTimes(1);
    expect(loginMock).toHaveBeenCalledWith('test@example.com', 'password');
  });

  it("should call the store's logout function", () => {
    // Arrange
    const logoutMock = vi.fn();
    mockUseAuthStore.mockReturnValue({
      user: { id: 'user-1', name: 'Test User', email: 'test@example.com' },
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: logoutMock,
      switchEntity: vi.fn(),
    });
    const { result } = renderHook(() => useAuth());

    // Act
    act(() => {
      result.current.logout();
    });

    // Assert
    expect(logoutMock).toHaveBeenCalledTimes(1);
  });

  it("should call the store's switchEntity function", () => {
    // Arrange
    const switchEntityMock = vi.fn();
    mockUseAuthStore.mockReturnValue({
      user: { id: 'user-1', name: 'Test User', email: 'test@example.com' },
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      switchEntity: switchEntityMock,
    });
    const { result } = renderHook(() => useAuth());

    // Act
    act(() => {
      result.current.switchEntity('entity-2');
    });

    // Assert
    expect(switchEntityMock).toHaveBeenCalledTimes(1);
    expect(switchEntityMock).toHaveBeenCalledWith('entity-2');
  });
});
