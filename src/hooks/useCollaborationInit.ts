// =============================================================================
// Collaboration Initialization Hook
// Initializes RealtimeCollaborationManager on app startup and sets user on login
// =============================================================================

import { useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useAuthStore } from '@/store/authStore';
import { RealtimeCollaborationManager } from '@/services/RealtimeCollaborationManager';

/**
 * Hook to initialize the RealtimeCollaborationManager singleton.
 * Should be called once at app root level.
 * Reads WebSocket URL from environment or defaults.
 */
export function useCollaborationInit(): void {
  useEffect(() => {
    const manager = RealtimeCollaborationManager.getInstance();

    // Initialize with WebSocket URL from env or fallback
    const wsUrl = import.meta.env.VITE_WS_URL ?? 'wss://api.finplan.example.com/ws';
    const token = useAuthStore.getState().accessToken;

    manager.initialize({
      wsUrl,
      token: token ?? undefined,
      autoConnect: false, // We'll connect manually after user is set
    });

    // Cleanup on unmount
    return () => {
      // Don't destroy here - keep singleton alive for app lifetime
      // manager.destroy();
    };
  }, []);
}

/**
 * Hook to set the current user in the collaboration services.
 * Should be called when user logs in or user data changes.
 */
export function useCollaborationUser(): void {
  const { user, accessToken } = useAuthStore(
    useShallow((s) => ({ user: s.user, accessToken: s.accessToken }))
  );

  useEffect(() => {
    if (!user || !accessToken) return;

    const manager = RealtimeCollaborationManager.getInstance();

    // Ensure initialized (in case useCollaborationInit hasn't run yet)
    if (!manager.isConnected && manager.connectionState === 'disconnected') {
      const wsUrl = import.meta.env.VITE_WS_URL ?? 'wss://api.finplan.example.com/ws';
      manager.initialize({
        wsUrl,
        token: accessToken,
        autoConnect: true,
      });
    }

    // Set user for presence and change attribution
    manager.setUser({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      avatarUrl: user.avatarUrl,
    });

    // Update token if needed
    if (manager.isConnected && accessToken) {
      manager.connect(); // Will use updated token
    }
  }, [user, accessToken]);
}

/**
 * Hook to connect/disconnect WebSocket based on authentication state.
 */
export function useCollaborationConnection(): void {
  const { isAuthenticated, accessToken } = useAuthStore(
    useShallow((s) => ({ isAuthenticated: s.isAuthenticated, accessToken: s.accessToken }))
  );

  useEffect(() => {
    const manager = RealtimeCollaborationManager.getInstance();

    if (isAuthenticated && accessToken) {
      if (!manager.isConnected) {
        manager.connect();
      }
    } else {
      if (manager.isConnected) {
        manager.disconnect();
      }
    }
  }, [isAuthenticated, accessToken]);
}

/**
 * Combined hook for full collaboration setup.
 * Use this in App.tsx or root layout.
 */
export function useCollaborationSetup(): void {
  useCollaborationInit();
  useCollaborationUser();
  useCollaborationConnection();
}
