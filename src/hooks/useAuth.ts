import { useShallow } from 'zustand/react/shallow';
import { useAuthStore } from '@/store/authStore';

export function useAuth() {
  const { user, isAuthenticated, isLoading, login, logout, switchEntity } = useAuthStore(
    useShallow((s) => ({
      user: s.user,
      isAuthenticated: s.isAuthenticated,
      isLoading: s.isLoading,
      login: s.login,
      logout: s.logout,
      switchEntity: s.switchEntity,
    }))
  );
  return { user, isAuthenticated, isLoading, login, logout, switchEntity };
}
