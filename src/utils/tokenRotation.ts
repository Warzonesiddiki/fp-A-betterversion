/**
 * Token Rotation — Refresh token lifecycle management
 *
 * - Access token: stored in memory only (never localStorage)
 * - Refresh token: httpOnly cookie in production, memory fallback for offline
 * - Auto-refresh: 5 minutes before expiry
 * - 401 interceptor: catches expired tokens and refreshes transparently
 */

import { useAuthStore } from '@/store/authStore';

// Refresh 5 minutes before expiry
const REFRESH_BUFFER_MS = 5 * 60 * 1000;
const TOKEN_CHECK_INTERVAL_MS = 60 * 1000; // Check every minute

let refreshTimer: ReturnType<typeof setTimeout> | null = null;
let checkTimer: ReturnType<typeof setInterval> | null = null;
let isRefreshing = false;

// ─── Token Parsing ────────────────────────────────────────────────────────────

function parseTokenExpiry(token: string): number | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]!));
    return payload.exp ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

function getTimeUntilExpiry(token: string): number | null {
  const expiry = parseTokenExpiry(token);
  if (!expiry) return null;
  return expiry - Date.now();
}

// ─── Cookie Management (for refresh token in production) ──────────────────────

function _setRefreshCookie(token: string, maxAgeSeconds: number): void {
  document.cookie = [
    `finplan_rt=${encodeURIComponent(token)}`,
    `max-age=${maxAgeSeconds}`,
    'path=/',
    'SameSite=Strict',
    // 'Secure', // Uncomment in production with HTTPS
  ].join('; ');
}

function _getRefreshCookie(): string | null {
  const match = document.cookie.match(/finplan_rt=([^;]+)/);
  return match ? decodeURIComponent(match[1]!) : null;
}

function _clearRefreshCookie(): void {
  document.cookie = 'finplan_rt=; max-age=0; path=/; SameSite=Strict';
}

// ─── Core Refresh Logic ───────────────────────────────────────────────────────

export async function refreshToken(): Promise<boolean> {
  if (isRefreshing) return false;
  isRefreshing = true;

  try {
    const store = useAuthStore.getState();
    if (!store.isAuthenticated || !store.user) {
      return false;
    }

    await store.refreshAccessToken();

    // Reschedule next refresh
    scheduleRefresh();
    return true;
  } catch (error) {
    console.error('[TokenRotation] Refresh failed:', error);
    handleTokenExpiry();
    return false;
  } finally {
    isRefreshing = false;
  }
}

// ─── Schedule Auto-Refresh ────────────────────────────────────────────────────

export function scheduleRefresh(): void {
  // Clear existing timer
  if (refreshTimer) {
    clearTimeout(refreshTimer);
    refreshTimer = null;
  }

  const store = useAuthStore.getState();
  const token = store.accessToken;
  if (!token) return;

  const msUntilExpiry = getTimeUntilExpiry(token);
  if (msUntilExpiry === null) return;

  // Schedule refresh 5 minutes before expiry
  const refreshIn = Math.max(msUntilExpiry - REFRESH_BUFFER_MS, 1000);

  console.log(`[TokenRotation] Scheduled refresh in ${Math.round(refreshIn / 1000)}s`);

  refreshTimer = setTimeout(() => {
    refreshToken();
  }, refreshIn);
}

// ─── Handle Token Expiry ──────────────────────────────────────────────────────

export function handleTokenExpiry(): void {
  console.warn('[TokenRotation] Token expired — logging out');
  stopRotation();

  const store = useAuthStore.getState();
  store.logout();

  // Redirect to login
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
}

// ─── 401 Interceptor ─────────────────────────────────────────────────────────

let originalFetch: typeof globalThis.fetch | null = null;

function interceptedFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const fetch = originalFetch ?? globalThis.fetch;

  return fetch(input, init).then(async (response) => {
    if (response.status === 401) {
      const refreshed = await refreshToken();
      if (refreshed) {
        // Retry the original request with new token
        const newToken = useAuthStore.getState().accessToken;
        const newInit: RequestInit = {
          ...init,
          headers: {
            ...init?.headers,
            ...(newToken ? { Authorization: `Bearer ${newToken}` } : {}),
          },
        };
        return fetch(input, newInit);
      }
    }
    return response;
  });
}

export function installFetchInterceptor(): void {
  if (originalFetch) return; // Already installed
  originalFetch = globalThis.fetch;
  globalThis.fetch = interceptedFetch;
  console.log('[TokenRotation] 401 interceptor installed');
}

export function uninstallFetchInterceptor(): void {
  if (originalFetch) {
    globalThis.fetch = originalFetch;
    originalFetch = null;
    console.log('[TokenRotation] 401 interceptor removed');
  }
}

// ─── Visibility Change Handler ────────────────────────────────────────────────

function handleVisibilityChange(): void {
  if (document.visibilityState === 'visible') {
    const store = useAuthStore.getState();
    const token = store.accessToken;
    if (!token) return;

    const msUntilExpiry = getTimeUntilExpiry(token);
    if (msUntilExpiry !== null && msUntilExpiry < REFRESH_BUFFER_MS) {
      console.log('[TokenRotation] App focused, token near expiry — refreshing');
      refreshToken();
    }
  }
}

// ─── Periodic Check ───────────────────────────────────────────────────────────

function periodicCheck(): void {
  const store = useAuthStore.getState();
  const token = store.accessToken;
  if (!token) return;

  const msUntilExpiry = getTimeUntilExpiry(token);
  if (msUntilExpiry !== null && msUntilExpiry <= 0) {
    handleTokenExpiry();
  }
}

// ─── Start / Stop ─────────────────────────────────────────────────────────────

export function startRotation(): void {
  console.log('[TokenRotation] Starting token rotation');

  // Schedule initial refresh
  scheduleRefresh();

  // Start periodic check
  if (checkTimer) clearInterval(checkTimer);
  checkTimer = setInterval(periodicCheck, TOKEN_CHECK_INTERVAL_MS);

  // Listen for visibility change
  document.addEventListener('visibilitychange', handleVisibilityChange);

  // Install 401 interceptor
  installFetchInterceptor();
}

export function stopRotation(): void {
  console.log('[TokenRotation] Stopping token rotation');

  if (refreshTimer) {
    clearTimeout(refreshTimer);
    refreshTimer = null;
  }

  if (checkTimer) {
    clearInterval(checkTimer);
    checkTimer = null;
  }

  document.removeEventListener('visibilitychange', handleVisibilityChange);
  uninstallFetchInterceptor();
}

// ─── Convenience: Get Authorization Header ────────────────────────────────────

export function getAuthHeader(): Record<string, string> {
  const token = useAuthStore.getState().accessToken;
  return token ? { Authorization: `Bearer ${token}` } : {};
}
